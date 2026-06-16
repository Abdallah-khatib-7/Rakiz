const { getOrCreateWallet, transfer } = require('../../services/ledger.service');
const { check, save } = require('../../services/idempotency.service');
const { SUPPORTED } = require('../../services/exchange.service');

const getWallets = async (db, userId) => {
  const [rows] = await db.query(
    `SELECT id, currency, balance, is_locked, created_at, updated_at
       FROM wallets
      WHERE user_id = ?
      ORDER BY currency ASC`,
    [userId]
  );
  return rows;
};

const getWallet = async (db, userId, currency) => {
  if (!SUPPORTED.includes(currency)) {
    throw Object.assign(new Error(`Unsupported currency: ${currency}`), { status: 422 });
  }
  return getOrCreateWallet(db, userId, currency);
};

const send = async (db, senderId, { idempotencyKey, receiverEmail, amount, currency, targetCurrency, note }) => {
  if (!SUPPORTED.includes(currency)) {
    throw Object.assign(new Error(`Unsupported currency: ${currency}`), { status: 422 });
  }

  if (targetCurrency && !SUPPORTED.includes(targetCurrency)) {
    throw Object.assign(new Error(`Unsupported target currency: ${targetCurrency}`), { status: 422 });
  }

  if (!idempotencyKey) {
    throw Object.assign(new Error('Idempotency key is required'), { status: 422 });
  }

  // check for duplicate request
  const { duplicate, result } = await check(idempotencyKey);
  if (duplicate) return result;

  // resolve receiver
  const [rows] = await db.query(
    'SELECT id, status FROM users WHERE email = ? LIMIT 1',
    [receiverEmail]
  );
  const receiver = rows[0];

  if (!receiver) {
    throw Object.assign(new Error('Recipient not found'), { status: 404 });
  }

  if (receiver.id === senderId) {
    throw Object.assign(new Error('Cannot send money to yourself'), { status: 422 });
  }

  if (receiver.status !== 'active') {
    throw Object.assign(new Error('Recipient account is not active'), { status: 422 });
  }

  const txResult = await transfer(db, {
    idempotencyKey,
    senderId,
    receiverId: receiver.id,
    amount: parseFloat(amount),
    currency,
    targetCurrency: targetCurrency || currency,
    note,
  });

  // cache the result so duplicate requests get the same response
  await save(idempotencyKey, txResult);

  return txResult;
};

const getTransactions = async (db, userId, { page = 1, limit = 20, currency } = {}) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT t.id, t.amount, t.currency, t.converted_amount, t.converted_currency,
           t.exchange_rate, t.fee, t.status, t.note, t.created_at,
           s.full_name AS sender_name, s.email AS sender_email,
           r.full_name AS receiver_name, r.email AS receiver_email,
           CASE WHEN t.sender_id = ? THEN 'sent' ELSE 'received' END AS direction
      FROM transactions t
      LEFT JOIN users s ON s.id = t.sender_id
      LEFT JOIN users r ON r.id = t.receiver_id
     WHERE (t.sender_id = ? OR t.receiver_id = ?)
  `;

  const params = [userId, userId, userId];

  if (currency) {
    query += ' AND t.currency = ?';
    params.push(currency);
  }

  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await db.query(query, params);

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM transactions
      WHERE sender_id = ? OR receiver_id = ?`,
    [userId, userId]
  );

  return {
    transactions: rows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = { getWallets, getWallet, send, getTransactions };