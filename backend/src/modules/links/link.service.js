const { transfer } = require('../../services/ledger.service');
const { check, save } = require('../../services/idempotency.service');
const { SUPPORTED } = require('../../services/exchange.service');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

const generateToken = () => crypto.randomBytes(24).toString('hex');

const createLink = async (db, userId, { amount, currency, description, is_single_use = false, expires_in_hours }) => {
  if (!SUPPORTED.includes(currency)) {
    throw httpError(422, `Unsupported currency: ${currency}`);
  }

  const token = generateToken();
  const expiresAt = expires_in_hours
    ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000)
    : null;

  const [result] = await db.query(
    `INSERT INTO payment_links
       (user_id, token, amount, currency, description, is_single_use, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, token, amount || null, currency, description || null, is_single_use, expiresAt]
  );

  return getLink(db, result.insertId, userId);
};

const getLink = async (db, linkId, userId) => {
  const [rows] = await db.query(
    `SELECT pl.*, u.full_name AS owner_name, u.email AS owner_email
       FROM payment_links pl
       JOIN users u ON u.id = pl.user_id
      WHERE pl.id = ?
        AND pl.user_id = ?
      LIMIT 1`,
    [linkId, userId]
  );

  if (!rows.length) throw httpError(404, 'Payment link not found');
  return rows[0];
};

const getUserLinks = async (db, userId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;

  const [rows] = await db.query(
    `SELECT pl.*, u.full_name AS owner_name
       FROM payment_links pl
       JOIN users u ON u.id = pl.user_id
      WHERE pl.user_id = ?
      ORDER BY pl.created_at DESC
      LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  const [[{ total }]] = await db.query(
    'SELECT COUNT(*) AS total FROM payment_links WHERE user_id = ?',
    [userId]
  );

  return {
    links: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

// public endpoint — no auth required, anyone with the token can pay
const getLinkByToken = async (db, token) => {
  const [rows] = await db.query(
    `SELECT pl.*, u.full_name AS owner_name
       FROM payment_links pl
       JOIN users u ON u.id = pl.user_id
      WHERE pl.token = ?
      LIMIT 1`,
    [token]
  );

  if (!rows.length) throw httpError(404, 'Payment link not found');

  const link = rows[0];

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    throw httpError(410, 'This payment link has expired');
  }

  if (link.is_single_use && link.use_count >= 1) {
    throw httpError(410, 'This payment link has already been used');
  }

  return link;
};

const payLink = async (db, token, payerId, { amount, currency, idempotencyKey }) => {
  if (!SUPPORTED.includes(currency)) {
    throw httpError(422, `Unsupported currency: ${currency}`);
  }

  const link = await getLinkByToken(db, token);

  if (link.user_id === payerId) {
    throw httpError(422, 'Cannot pay your own payment link');
  }

  // if the link has a fixed amount, use it — otherwise use the payer-supplied amount
  const payAmount = link.amount ? parseFloat(link.amount) : parseFloat(amount);

  if (!payAmount || payAmount <= 0) {
    throw httpError(422, 'Amount is required for this payment link');
  }

  const iKey = idempotencyKey || uuidv4();
  const { duplicate, result: cachedResult } = await check(iKey);
  if (duplicate) return cachedResult;

  const txResult = await transfer(db, {
    idempotencyKey: iKey,
    senderId: payerId,
    receiverId: link.user_id,
    amount: payAmount,
    currency,
    targetCurrency: link.currency,
    note: link.description || `Payment link: ${token.slice(0, 8)}...`,
  });

  await db.query(
    'UPDATE payment_links SET use_count = use_count + 1 WHERE token = ?',
    [token]
  );

  await save(iKey, txResult);
  return txResult;
};

const deleteLink = async (db, linkId, userId) => {
  const [rows] = await db.query(
    'SELECT id FROM payment_links WHERE id = ? AND user_id = ? LIMIT 1',
    [linkId, userId]
  );

  if (!rows.length) throw httpError(404, 'Payment link not found');

  await db.query('DELETE FROM payment_links WHERE id = ?', [linkId]);

  return { message: 'Payment link deleted' };
};

module.exports = { createLink, getLink, getUserLinks, getLinkByToken, payLink, deleteLink };