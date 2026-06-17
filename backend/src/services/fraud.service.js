const { getRedis } = require('../config/redis');

// Tunable thresholds. Kept as constants here rather than buried in logic so
// they're easy to find and adjust as real usage patterns emerge.
const LARGE_AMOUNT_THRESHOLD = {
  USD: 2000, EUR: 2000, GBP: 1800, SAR: 7500, AED: 7500, LBP: 30000000,
};
const VELOCITY_WINDOW_SECONDS = 60 * 10; // 10 minutes
const VELOCITY_MAX_TRANSACTIONS = 5;
const FAILED_LOGIN_WINDOW_SECONDS = 60 * 15;
const FAILED_LOGIN_MAX_ATTEMPTS = 5;

const flag = async (db, { userId, ledgerEntryId = null, rule, severity }) => {
  await db.query(
    `INSERT INTO fraud_flags (user_id, ledger_entry_id, rule_triggered, severity, status)
     VALUES (?, ?, ?, ?, 'open')`,
    [userId, ledgerEntryId, rule, severity]
  );
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