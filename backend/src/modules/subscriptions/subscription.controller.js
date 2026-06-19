const Stripe = require('stripe');
const subscriptionService = require('./subscription.service');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const { tier } = req.body;

    if (!['pro', 'business'].includes(tier)) {
      return res.status(422).json({ error: 'tier must be pro or business' });
    }

    const result = await subscriptionService.createCheckoutSession(db, req.user, tier);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const createPortalSession = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await subscriptionService.createPortalSession(db, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// req.body here is a raw Buffer, not parsed JSON — see the route file and
// app.js for why. We verify the signature ourselves before trusting anything
// in the payload, since this endpoint has no auth and anyone could otherwise
// POST a fake "payment succeeded" event.
const handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    const db = req.app.get('db');
    await subscriptionService.handleWebhookEvent(db, event);
    res.json({ received: true });
  } catch (err) {
    console.error(`Webhook handling failed for event ${event.id}: ${err.message}`);
    // still 200 here — Stripe retries on non-2xx, and retrying a handler bug
    // won't fix the bug, it'll just spam retries. We log it and move on.
    res.json({ received: true });
  }
};

module.exports = { createCheckoutSession, createPortalSession, handleWebhook };