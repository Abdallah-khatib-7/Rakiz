const { getOrCreateWallet, transfer } = require('../../services/ledger.service');
const { check, save } = require('../../services/idempotency.service');
const { SUPPORTED } = require('../../services/exchange.service');
const tierLimits = require('../../services/tierLimits.service');

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

const send = async (db, sender, { idempotencyKey, receiverIdentifier, amount, currency, targetCurrency, note }, req) => {
  if (!SUPPORTED.includes(currency)) {
    throw Object.assign(new Error(`Unsupported currency: ${currency}`), { status: 422 });
  }

  await tierLimits.assertCanSend(db, sender);

  if (targetCurrency && !SUPPORTED.includes(targetCurrency)) {
    throw Object.assign(new Error(`Unsupported target currency: ${targetCurrency}`), { status: 422 });
  }

  if (!idempotencyKey) {
    throw Object.assign(new Error('Idempotency key is required'), { status: 422 });
  }

  if (!receiverIdentifier) {
    throw Object.assign(new Error('Recipient email or phone number is required'), { status: 422 });
  }

  const { duplicate, result } = await check(idempotencyKey);
  if (duplicate) return result;

  const looksLikePhone = /^\+?[0-9\s-]{6,20}$/.test(receiverIdentifier);

  const [rows] = await db.query(
    looksLikePhone
      ? 'SELECT id, status FROM users WHERE phone = ? LIMIT 1'
      : 'SELECT id, status FROM users WHERE email = ? LIMIT 1',
    [receiverIdentifier]
  );
  const receiver = rows[0];

  if (!receiver) {
    throw Object.assign(new Error('Recipient not found'), { status: 404 });
  }

  if (receiver.id === sender.id) {
    throw Object.assign(new Error('Cannot send money to yourself'), { status: 422 });
  }

  if (receiver.status !== 'active') {
    throw Object.assign(new Error('Recipient account is not active'), { status: 422 });
  }

  const txResult = await transfer(db, {
    idempotencyKey,
    senderId: sender.id,
    receiverId: receiver.id,
    amount: parseFloat(amount),
    currency,
    targetCurrency: targetCurrency || currency,
    note,
    auditEventType: 'transaction.sent',
  }, req);

  await save(idempotencyKey, txResult);

  return txResult;
};

const exchangeCurrency = async (db, user, { idempotencyKey, fromCurrency, toCurrency, amount }, req) => {
  if (!SUPPORTED.includes(fromCurrency) || !SUPPORTED.includes(toCurrency)) {
    throw Object.assign(new Error('Unsupported currency'), { status: 422 });
  }

  

  if (fromCurrency === toCurrency) {
    throw Object.assign(new Error('Cannot exchange a currency into itself'), { status: 422 });
  }

  if (!idempotencyKey) {
    throw Object.assign(new Error('Idempotency key is required'), { status: 422 });
  }

  const { duplicate, result } = await check(idempotencyKey);
  if (duplicate) return result;

  // exchanging is just a transfer where the sender and receiver are the same
  // person — transfer() already handles the cross-currency conversion, the
  // double-entry ledger, and the row locking correctly for this case, since
  // it locks both wallet rows (even if they belong to the same user) before
  // touching either balance
  const txResult = await transfer(db, {
    idempotencyKey,
    senderId: user.id,
    receiverId: user.id,
    amount: parseFloat(amount),
    currency: fromCurrency,
    targetCurrency: toCurrency,
    note: `Currency exchange: ${fromCurrency} to ${toCurrency}`,
    type: 'exchange',
    auditEventType: 'wallet.exchanged',
  }, req);

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

const createWallet = async (db, userId, currency) => {
  if (!SUPPORTED.includes(currency)) {
    throw Object.assign(new Error(`Unsupported currency: ${currency}`), { status: 422 });
  }
  return getOrCreateWallet(db, userId, currency);
};

module.exports = { getWallets, getWallet, send, getTransactions, exchangeCurrency, createWallet };