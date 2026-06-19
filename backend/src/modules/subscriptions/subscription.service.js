const Stripe = require('stripe');
const auditService = require('../../services/audit.service');
const { createNotification } = require('../notifications/notification.service');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

const PRICE_TO_TIER = {
  [process.env.STRIPE_PRO_PRICE_ID]: 'pro',
  [process.env.STRIPE_BUSINESS_PRICE_ID]: 'business',
};

const TIER_TO_PRICE = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  business: process.env.STRIPE_BUSINESS_PRICE_ID,
};

// Ensures the user has a Stripe Customer object, creating one on first use
// and storing the id so we don't create duplicates on repeat checkouts.
// We store it on the users table via a dedicated column — see migration note
// below if stripe_customer_id doesn't exist yet.
const getOrCreateCustomer = async (db, user) => {
  const [rows] = await db.query(
    'SELECT stripe_customer_id FROM users WHERE id = ? LIMIT 1',
    [user.id]
  );

  if (rows[0]?.stripe_customer_id) {
    return rows[0].stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.full_name,
    metadata: { rakiz_user_id: String(user.id) },
  });

  await db.query('UPDATE users SET stripe_customer_id = ? WHERE id = ?', [
    customer.id,
    user.id,
  ]);

  return customer.id;
};

// Creates a Checkout Session for the requested tier and returns the URL the
// frontend should redirect the user to. Stripe hosts the actual payment page;
// we never see card details.
const createCheckoutSession = async (db, user, tier) => {
  const priceId = TIER_TO_PRICE[tier];
  if (!priceId) {
    throw httpError(422, `No price configured for tier: ${tier}`);
  }

  const customerId = await getOrCreateCustomer(db, user);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/billing?status=success`,
    cancel_url: `${process.env.FRONTEND_URL}/billing?status=cancelled`,
    metadata: { rakiz_user_id: String(user.id), rakiz_tier: tier },
  });

  return { url: session.url };
};

// Opens the Stripe-hosted billing portal where a user can update payment
// methods, view invoices, or cancel — Stripe handles all of this UI for us.
const createPortalSession = async (db, user) => {
  const customerId = await getOrCreateCustomer(db, user);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.FRONTEND_URL}/billing`,
  });

  return { url: session.url };
};

// Applies a tier change to our own users table and notifies the user. Kept
// separate from the webhook handler so both checkout completion and
// subscription updates can call the same logic.
const applyTierChange = async (db, userId, tier, expiresAt = null) => {
  await db.query(
    'UPDATE users SET subscription_tier = ?, subscription_expires_at = ? WHERE id = ?',
    [tier, expiresAt, userId]
  );

  await auditService.logEvent({
    eventType: 'subscription.tier_changed',
    actorId: userId,
    targetId: userId,
    metadata: { new_tier: tier, expires_at: expiresAt },
  });

  try {
    await createNotification(db, {
      userId,
      type: 'subscription_changed',
      title: tier === 'free' ? 'Subscription ended' : `Welcome to Rakiz ${tier[0].toUpperCase()}${tier.slice(1)}`,
      body: tier === 'free'
        ? 'Your subscription has ended and your account is now on the Free plan.'
        : `Your account has been upgraded to ${tier}. Enjoy the new features.`,
    });
  } catch (err) {
    console.error(`Subscription notification failed for user ${userId}: ${err.message}`);
  }
};

// The webhook entry point. event is the already-verified Stripe Event object
// (signature checked by the caller before this is invoked — see
// subscription.controller.js). We only act on the event types we care about
// and ignore everything else without erroring, since Stripe sends many event
// types we don't need to handle.
const handleWebhookEvent = async (db, event) => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = parseInt(session.metadata?.rakiz_user_id);
      const tier = session.metadata?.rakiz_tier;

      if (userId && tier) {
        await applyTierChange(db, userId, tier);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const priceId = subscription.items.data[0]?.price?.id;
      const tier = PRICE_TO_TIER[priceId];

      const [rows] = await db.query(
        'SELECT id FROM users WHERE stripe_customer_id = ? LIMIT 1',
        [subscription.customer]
      );

      if (rows[0] && tier) {
        const expiresAt = new Date(subscription.current_period_end * 1000);
        await applyTierChange(db, rows[0].id, tier, expiresAt);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;

      const [rows] = await db.query(
        'SELECT id FROM users WHERE stripe_customer_id = ? LIMIT 1',
        [subscription.customer]
      );

      if (rows[0]) {
        await applyTierChange(db, rows[0].id, 'free', null);
      }
      break;
    }

    default:
      // unhandled event types are expected and fine to ignore
      break;
  }
};

module.exports = {
  createCheckoutSession,
  createPortalSession,
  handleWebhookEvent,
};