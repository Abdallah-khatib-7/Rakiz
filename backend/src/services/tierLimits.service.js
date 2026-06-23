const TIER_LIMITS = {
  free: { sendsPerMonth: 20, splitsPerMonth: 5 },
  pro: { sendsPerMonth: Infinity, splitsPerMonth: Infinity },
  business: { sendsPerMonth: Infinity, splitsPerMonth: Infinity },
};

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

// Counts completed sends this calendar month for a given user. We count from
// transactions, not ledger_entries, since transactions is the user-facing
// record of "I sent money" — admin adjustments and split settlements where
// the user is the creator don't count against their send limit, only actual
// outgoing sends do.
const getMonthlySendCount = async (db, userId) => {
  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) AS count FROM transactions
      WHERE sender_id = ?
        AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
    [userId]
  );
  return count;
};

// Counts splits created this calendar month by this user (as creator).
const getMonthlySplitCount = async (db, userId) => {
  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) AS count FROM splits
      WHERE created_by = ?
        AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
    [userId]
  );
  return count;
};

const assertCanSend = async (db, user) => {
  const limits = TIER_LIMITS[user.subscription_tier] || TIER_LIMITS.free;
  if (limits.sendsPerMonth === Infinity) return;

  const count = await getMonthlySendCount(db, user.id);
  if (count >= limits.sendsPerMonth) {
    throw httpError(
      403,
      `You've reached your Free plan limit of ${limits.sendsPerMonth} sends this month. Upgrade to Pro for unlimited sends.`
    );
  }
};

const assertCanCreateSplit = async (db, user) => {
  const limits = TIER_LIMITS[user.subscription_tier] || TIER_LIMITS.free;
  if (limits.splitsPerMonth === Infinity) return;

  const count = await getMonthlySplitCount(db, user.id);
  if (count >= limits.splitsPerMonth) {
    throw httpError(
      403,
      `You've reached your Free plan limit of ${limits.splitsPerMonth} splits this month. Upgrade to Pro for unlimited splits.`
    );
  }
};

module.exports = { TIER_LIMITS, getMonthlySendCount, getMonthlySplitCount, assertCanSend, assertCanCreateSplit };