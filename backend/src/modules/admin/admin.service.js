const { v4: uuidv4 } = require('uuid');
const auditService = require('../../services/audit.service');
const { emitToUser } = require('../../services/socket.service');
const { createNotification } = require('../notifications/notification.service');
const { SUPPORTED } = require('../../services/exchange.service');
const { getClientIp } = require('../../utils/fingerprint');

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

const getUsers = async (db, { page = 1, limit = 20, search = '', status } = {}) => {
  const offset = (page - 1) * limit;

  let where = '1=1';
  const params = [];

  if (search) {
    where += ' AND (email LIKE ? OR full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    where += ' AND status = ?';
    params.push(status);
  }

  const [rows] = await db.query(
    `SELECT id, email, full_name, role, status, subscription_tier,
            email_verified, created_at, last_login_at
       FROM users
      WHERE ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM users WHERE ${where}`,
    params
  );

  return {
    users: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

const getUserDetail = async (db, userId) => {
  const [users] = await db.query(
    `SELECT id, email, full_name, avatar_url, role, status, subscription_tier,
            subscription_expires_at, email_verified, created_at, updated_at,
            last_login_at
       FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );

  if (!users.length) throw httpError(404, 'User not found');

  const [wallets] = await db.query(
    'SELECT id, currency, balance, is_locked FROM wallets WHERE user_id = ?',
    [userId]
  );

  const [fraudFlags] = await db.query(
    'SELECT * FROM fraud_flags WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
    [userId]
  );

  return { user: users[0], wallets, fraudFlags };
};

// Freeze blocks the account from logging in / transacting going forward.
// We don't lock individual wallets here — account-level status is the
// broader switch; wallet-level is_locked is a separate, finer-grained tool
// already used elsewhere (e.g. could be set per-currency in the future).
const setUserStatus = async (db, adminId, userId, status, req) => {
  if (!['active', 'frozen', 'suspended'].includes(status)) {
    throw httpError(422, 'Invalid status');
  }

  const [users] = await db.query('SELECT id, status FROM users WHERE id = ? LIMIT 1', [userId]);
  if (!users.length) throw httpError(404, 'User not found');

  const before = users[0].status;

  await db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

  await auditService.logEvent({
    eventType: 'admin.user_status_changed',
    actorId: adminId,
    targetId: userId,
    ipAddress: req ? getClientIp(req) : null,
    metadata: { before_status: before, after_status: status },
  });

  try {
    await createNotification(db, {
      userId,
      type: 'account_status_changed',
      title: status === 'active' ? 'Account reactivated' : 'Account restricted',
      body: status === 'active'
        ? 'Your account has been reactivated.'
        : `Your account status was changed to ${status}. Contact support if you believe this is a mistake.`,
    });
  } catch (err) {
    console.error(`Status change notification failed for user ${userId}: ${err.message}`);
  }

  return { id: userId, status };
};

const getFraudQueue = async (db, { page = 1, limit = 20, status = 'open' } = {}) => {
  const offset = (page - 1) * limit;

  const [rows] = await db.query(
    `SELECT ff.*, u.email AS user_email, u.full_name AS user_name
       FROM fraud_flags ff
       JOIN users u ON u.id = ff.user_id
      WHERE ff.status = ?
      ORDER BY ff.created_at DESC
      LIMIT ? OFFSET ?`,
    [status, limit, offset]
  );

  const [[{ total }]] = await db.query(
    'SELECT COUNT(*) AS total FROM fraud_flags WHERE status = ?',
    [status]
  );

  return {
    flags: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

const reviewFraudFlag = async (db, adminId, flagId, { status }, req) => {
  if (!['reviewing', 'resolved', 'dismissed'].includes(status)) {
    throw httpError(422, 'Invalid review status');
  }

  const [flags] = await db.query('SELECT * FROM fraud_flags WHERE id = ? LIMIT 1', [flagId]);
  if (!flags.length) throw httpError(404, 'Fraud flag not found');

  await db.query(
    'UPDATE fraud_flags SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
    [status, adminId, flagId]
  );

  await auditService.logEvent({
    eventType: 'admin.fraud_flag_reviewed',
    actorId: adminId,
    targetId: flags[0].user_id,
    ipAddress: req ? getClientIp(req) : null,
    metadata: { flagId, rule: flags[0].rule_triggered, new_status: status },
  });

  return { id: flagId, status };
};

// One-sided ledger entry: money appears or disappears with no counterparty.
// type stays 'adjustment' regardless of direction; we only populate the
// relevant side of the entry (credit for add, debit for remove) so the
// ledger stays the single source of truth even for admin actions.
const adjustBalance = async (db, adminId, userId, { currency, amount, reason }, req) => {
  if (!SUPPORTED.includes(currency)) {
    throw httpError(422, `Unsupported currency: ${currency}`);
  }

  if (!amount || amount === 0) {
    throw httpError(422, 'Amount must be a non-zero number');
  }

  if (!reason || reason.trim().length < 5) {
    throw httpError(422, 'A reason of at least 5 characters is required for balance adjustments');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [wallets] = await connection.query(
      'SELECT * FROM wallets WHERE user_id = ? AND currency = ? LIMIT 1',
      [userId, currency]
    );

    let wallet = wallets[0];

    if (!wallet) {
      const [result] = await connection.query(
        'INSERT INTO wallets (user_id, currency, balance) VALUES (?, ?, 0)',
        [userId, currency]
      );
      const [created] = await connection.query('SELECT * FROM wallets WHERE id = ?', [result.insertId]);
      wallet = created[0];
    }

    const [[locked]] = await connection.query(
      'SELECT balance FROM wallets WHERE id = ? FOR UPDATE',
      [wallet.id]
    );

    const currentBalance = parseFloat(locked.balance);
    const isCredit = amount > 0;
    const absAmount = Math.abs(amount);

    if (!isCredit && currentBalance < absAmount) {
      throw httpError(422, 'Cannot remove more than the current balance');
    }

    const [ledgerResult] = await connection.query(
      `INSERT INTO ledger_entries
         (idempotency_key, type, debit_wallet_id, credit_wallet_id,
          amount, currency, fee_amount, status, description)
       VALUES (?, 'adjustment', ?, ?, ?, ?, 0, 'completed', ?)`,
      [
        uuidv4(),
        isCredit ? null : wallet.id,
        isCredit ? wallet.id : null,
        absAmount,
        currency,
        `Admin adjustment by user ${adminId}: ${reason}`,
      ]
    );

    await connection.query(
      'UPDATE wallets SET balance = balance + ? WHERE id = ?',
      [amount, wallet.id]
    );

    await connection.commit();

    const [[freshWallet]] = await db.query('SELECT balance FROM wallets WHERE id = ?', [wallet.id]);

    await auditService.logEvent({
      eventType: 'admin.balance_adjusted',
      actorId: adminId,
      targetId: userId,
      ipAddress: req ? getClientIp(req) : null,
      metadata: { currency, amount, reason, ledgerEntryId: ledgerResult.insertId, before_balance: currentBalance, after_balance: freshWallet.balance },
    });

    try {
      emitToUser(userId, 'balance:updated', {
        walletId: wallet.id,
        currency,
        balance: freshWallet.balance,
      });

      await createNotification(db, {
        userId,
        type: 'balance_adjusted',
        title: isCredit ? 'Funds added to your wallet' : 'Funds removed from your wallet',
        body: `${absAmount} ${currency} was ${isCredit ? 'added to' : 'removed from'} your wallet by an administrator.`,
        referenceId: ledgerResult.insertId,
        referenceType: 'ledger_entry',
      });
    } catch (err) {
      console.error(`Balance adjustment notification failed for user ${userId}: ${err.message}`);
    }

    return {
      walletId: wallet.id,
      currency,
      previousBalance: currentBalance,
      newBalance: freshWallet.balance,
      ledgerEntryId: ledgerResult.insertId,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const getRevenueStats = async (db) => {
  const [[tierCounts]] = await db.query(`
    SELECT
      SUM(CASE WHEN subscription_tier = 'free' THEN 1 ELSE 0 END) AS free_count,
      SUM(CASE WHEN subscription_tier = 'pro' THEN 1 ELSE 0 END) AS pro_count,
      SUM(CASE WHEN subscription_tier = 'business' THEN 1 ELSE 0 END) AS business_count,
      COUNT(*) AS total_users
    FROM users
  `);

  const [[txStats]] = await db.query(`
    SELECT COUNT(*) AS total_transactions, COALESCE(SUM(fee), 0) AS total_fees_collected
    FROM transactions
    WHERE status = 'completed'
  `);

  const [[last30Days]] = await db.query(`
    SELECT COUNT(*) AS transactions_last_30_days
    FROM transactions
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `);

  return {
    users: {
      total: tierCounts.total_users,
      free: tierCounts.free_count,
      pro: tierCounts.pro_count,
      business: tierCounts.business_count,
    },
    transactions: {
      total: txStats.total_transactions,
      totalFeesCollected: txStats.total_fees_collected,
      last30Days: last30Days.transactions_last_30_days,
    },
  };
};

module.exports = {
  getUsers,
  getUserDetail,
  setUserStatus,
  getFraudQueue,
  reviewFraudFlag,
  adjustBalance,
  getRevenueStats,
};