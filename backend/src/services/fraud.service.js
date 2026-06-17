const { getRedis } = require('../config/redis');
const { emitToUser } = require('./socket.service');
const { createNotification } = require('../modules/notifications/notification.service');

// Tunable thresholds. Kept as constants here rather than buried in logic so
// they're easy to find and adjust as real usage patterns emerge.
const LARGE_AMOUNT_THRESHOLD = {
  USD: 2000, EUR: 2000, GBP: 1800, SAR: 7500, AED: 7500, LBP: 30000000,
};
const VELOCITY_WINDOW_SECONDS = 60 * 10; // 10 minutes
const VELOCITY_MAX_TRANSACTIONS = 5;
const FAILED_LOGIN_WINDOW_SECONDS = 60 * 15;
const FAILED_LOGIN_MAX_ATTEMPTS = 5;

// Human-readable text per rule, used for the notification body. Kept here
// rather than in the notification service since this is the only place that
// knows what each rule means.
const RULE_MESSAGES = {
  large_amount: 'A large transaction on your account was flagged for review.',
  velocity_exceeded: 'Unusual transaction frequency was detected on your account.',
  balance_drain: 'A transaction drained most of your wallet balance.',
  new_ip_login: 'Your account was signed into from a new location.',
};

const flag = async (db, { userId, ledgerEntryId = null, rule, severity }) => {
  await db.query(
    `INSERT INTO fraud_flags (user_id, ledger_entry_id, rule_triggered, severity, status)
     VALUES (?, ?, ?, ?, 'open')`,
    [userId, ledgerEntryId, rule, severity]
  );

  // Real-time nudge to the affected user. Fire-and-forget, same pattern as
  // everywhere else — a flag is already safely in the DB by this point, the
  // socket push is just a UX layer on top.
  try {
    emitToUser(userId, 'fraud:alert', { rule, severity, ledgerEntryId });
  } catch (err) {
    console.error(`Fraud alert emit failed for user ${userId}: ${err.message}`);
  }

  // Persist a notification too, not just a live event — the person should
  // still see this if they were offline when it happened.
  try {
    await createNotification(db, {
      userId,
      type: 'fraud_alert',
      title: 'Account activity flagged',
      body: RULE_MESSAGES[rule] || 'Unusual activity was detected on your account.',
      referenceId: ledgerEntryId,
      referenceType: ledgerEntryId ? 'ledger_entry' : null,
    });
  } catch (err) {
    console.error(`Fraud notification failed for user ${userId}: ${err.message}`);
  }
};

// Called right before a transfer is allowed to proceed. Doesn't block by
// itself — it flags, and the caller decides whether a flag should stop the
// transaction (we treat 'critical' as blocking, everything else as logged).
const checkAmountAnomaly = async (db, { userId, amount, currency, ledgerEntryId }) => {
  const threshold = LARGE_AMOUNT_THRESHOLD[currency];
  if (threshold && amount >= threshold) {
    await flag(db, {
      userId,
      ledgerEntryId,
      rule: 'large_amount',
      severity: amount >= threshold * 3 ? 'high' : 'medium',
    });
  }
};

// Counts how many transfers this user has sent in the last N minutes using a
// Redis counter with a TTL, so we don't hammer MySQL for every send.
const checkVelocity = async (db, { userId, ledgerEntryId }) => {
  const redis = getRedis();
  const key = `velocity:${userId}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, VELOCITY_WINDOW_SECONDS);
  }

  if (count > VELOCITY_MAX_TRANSACTIONS) {
    await flag(db, {
      userId,
      ledgerEntryId,
      rule: 'velocity_exceeded',
      severity: count > VELOCITY_MAX_TRANSACTIONS * 2 ? 'high' : 'medium',
    });
  }
};

// Compares the wallet's balance before and after a send. If a single transfer
// drains most of the balance, that's worth a look even if the amount itself
// wasn't huge in absolute terms.
const checkBalanceDrain = async (db, { userId, ledgerEntryId, balanceBefore, amount }) => {
  if (balanceBefore <= 0) return;

  const drainRatio = amount / balanceBefore;
  if (drainRatio >= 0.9) {
    await flag(db, {
      userId,
      ledgerEntryId,
      rule: 'balance_drain',
      severity: drainRatio >= 0.99 ? 'high' : 'medium',
    });
  }
};

// Login-side checks, called from the auth flow rather than the ledger flow.
const checkNewIpLogin = async (db, { userId, currentIp, previousIp }) => {
  if (previousIp && currentIp && previousIp !== currentIp) {
    await flag(db, {
      userId,
      rule: 'new_ip_login',
      severity: 'low',
    });
    return true; // signal to the caller that an alert email is warranted
  }
  return false;
};

// Tracks failed login attempts per email in Redis. Returns true once the
// caller should apply a progressive lockout.
const recordFailedLogin = async (email) => {
  const redis = getRedis();
  const key = `failed_login:${email}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, FAILED_LOGIN_WINDOW_SECONDS);
  }

  return count >= FAILED_LOGIN_MAX_ATTEMPTS;
};

const clearFailedLogins = async (email) => {
  const redis = getRedis();
  await redis.del(`failed_login:${email}`);
};

const isLockedOut = async (email) => {
  const redis = getRedis();
  const count = await redis.get(`failed_login:${email}`);
  return count ? parseInt(count) >= FAILED_LOGIN_MAX_ATTEMPTS : false;
};

module.exports = {
  checkAmountAnomaly,
  checkVelocity,
  checkBalanceDrain,
  checkNewIpLogin,
  recordFailedLogin,
  clearFailedLogins,
  isLockedOut,
};