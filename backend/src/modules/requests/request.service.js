const { transfer } = require('../../services/ledger.service');
const { check, save } = require('../../services/idempotency.service');
const { SUPPORTED } = require('../../services/exchange.service');
const { v4: uuidv4 } = require('uuid');

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

const createRequest = async (db, requesterId, { target_email, amount, currency, note, expires_in_hours = 48 }) => {
  if (!SUPPORTED.includes(currency)) {
    throw httpError(422, `Unsupported currency: ${currency}`);
  }

  const [rows] = await db.query(
    'SELECT id, status FROM users WHERE email = ? LIMIT 1',
    [target_email]
  );
  const target = rows[0];

  if (!target) throw httpError(404, 'User not found');
  if (target.id === requesterId) throw httpError(422, 'Cannot request money from yourself');
  if (target.status !== 'active') throw httpError(422, 'Target account is not active');

  const expiresAt = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000);

  const [result] = await db.query(
    `INSERT INTO payment_requests
       (requester_id, target_id, amount, currency, note, status, expires_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [requesterId, target.id, amount, currency, note || null, expiresAt]
  );

  return getRequest(db, result.insertId, requesterId);
};

const getRequest = async (db, requestId, userId) => {
  const [rows] = await db.query(
    `SELECT pr.*,
            r.full_name AS requester_name, r.email AS requester_email,
            t.full_name AS target_name, t.email AS target_email
       FROM payment_requests pr
       JOIN users r ON r.id = pr.requester_id
       JOIN users t ON t.id = pr.target_id
      WHERE pr.id = ?
        AND (pr.requester_id = ? OR pr.target_id = ?)
      LIMIT 1`,
    [requestId, userId, userId]
  );

  if (!rows.length) throw httpError(404, 'Payment request not found');
  return rows[0];
};

const getUserRequests = async (db, userId, { page = 1, limit = 20, type = 'all' } = {}) => {
  const offset = (page - 1) * limit;

  let where = '(pr.requester_id = ? OR pr.target_id = ?)';
  const params = [userId, userId];

  if (type === 'sent') {
    where = 'pr.requester_id = ?';
    params.length = 0;
    params.push(userId);
  } else if (type === 'received') {
    where = 'pr.target_id = ?';
    params.length = 0;
    params.push(userId);
  }

  const [rows] = await db.query(
    `SELECT pr.*,
            r.full_name AS requester_name, r.email AS requester_email,
            t.full_name AS target_name, t.email AS target_email
       FROM payment_requests pr
       JOIN users r ON r.id = pr.requester_id
       JOIN users t ON t.id = pr.target_id
      WHERE ${where}
      ORDER BY pr.created_at DESC
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM payment_requests pr WHERE ${where}`,
    params
  );

  return {
    requests: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

const payRequest = async (db, requestId, userId, { currency, idempotencyKey }) => {
  if (!SUPPORTED.includes(currency)) {
    throw httpError(422, `Unsupported currency: ${currency}`);
  }

  const [rows] = await db.query(
    'SELECT * FROM payment_requests WHERE id = ? AND target_id = ? LIMIT 1',
    [requestId, userId]
  );
  const request = rows[0];

  if (!request) throw httpError(404, 'Payment request not found');
  if (request.status !== 'pending') throw httpError(409, `Request is already ${request.status}`);
  if (new Date(request.expires_at) < new Date()) {
    await db.query('UPDATE payment_requests SET status = ? WHERE id = ?', ['expired', requestId]);
    throw httpError(410, 'Payment request has expired');
  }

  const iKey = idempotencyKey || uuidv4();
  const { duplicate, result: cachedResult } = await check(iKey);
  if (duplicate) return cachedResult;

  const txResult = await transfer(db, {
    idempotencyKey: iKey,
    senderId: userId,
    receiverId: request.requester_id,
    amount: parseFloat(request.amount),
    currency,
    targetCurrency: request.currency,
    note: `Payment request #${requestId}`,
  });

  await db.query(
    'UPDATE payment_requests SET status = ? WHERE id = ?',
    ['paid', requestId]
  );

  await save(iKey, txResult);
  return txResult;
};

const declineRequest = async (db, requestId, userId) => {
  const [rows] = await db.query(
    'SELECT * FROM payment_requests WHERE id = ? AND target_id = ? LIMIT 1',
    [requestId, userId]
  );
  const request = rows[0];

  if (!request) throw httpError(404, 'Payment request not found');
  if (request.status !== 'pending') throw httpError(409, `Request is already ${request.status}`);

  await db.query(
    'UPDATE payment_requests SET status = ? WHERE id = ?',
    ['declined', requestId]
  );

  return { message: 'Payment request declined' };
};

const cancelRequest = async (db, requestId, userId) => {
  const [rows] = await db.query(
    'SELECT * FROM payment_requests WHERE id = ? AND requester_id = ? LIMIT 1',
    [requestId, userId]
  );
  const request = rows[0];

  if (!request) throw httpError(404, 'Payment request not found');
  if (request.status !== 'pending') throw httpError(409, `Request is already ${request.status}`);

  await db.query(
    'UPDATE payment_requests SET status = ? WHERE id = ?',
    ['cancelled', requestId]
  );

  return { message: 'Payment request cancelled' };
};

module.exports = { createRequest, getRequest, getUserRequests, payRequest, declineRequest, cancelRequest };