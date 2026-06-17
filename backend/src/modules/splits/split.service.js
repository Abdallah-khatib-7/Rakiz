const { transfer, getOrCreateWallet } = require('../../services/ledger.service');
const { check, save } = require('../../services/idempotency.service');
const { SUPPORTED } = require('../../services/exchange.service');
const { v4: uuidv4 } = require('uuid');
const { emitToUser } = require('../../services/socket.service');
const { createNotification } = require('../notifications/notification.service');

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

const createSplit = async (db, creatorId, { title, total_amount, currency, split_type, members }) => {
  if (!SUPPORTED.includes(currency)) {
    throw httpError(422, `Unsupported currency: ${currency}`);
  }

  if (!['equal', 'custom', 'percentage'].includes(split_type)) {
    throw httpError(422, 'Invalid split type');
  }

  if (!members || members.length < 2) {
    throw httpError(422, 'A split requires at least 2 members');
  }

  // resolve member emails to user ids
  const emails = members.map((m) => m.email);
  const [userRows] = await db.query(
    'SELECT id, email, status FROM users WHERE email IN (?)',
    [emails]
  );

  if (userRows.length !== emails.length) {
    const found = userRows.map((u) => u.email);
    const missing = emails.filter((e) => !found.includes(e));
    throw httpError(404, `Users not found: ${missing.join(', ')}`);
  }

  const inactive = userRows.filter((u) => u.status !== 'active');
  if (inactive.length) {
    throw httpError(422, `Inactive users: ${inactive.map((u) => u.email).join(', ')}`);
  }

  // calculate shares
  const userMap = Object.fromEntries(userRows.map((u) => [u.email, u.id]));
  let shares;

  if (split_type === 'equal') {
    const share = parseFloat((total_amount / members.length).toFixed(8));
    shares = members.map((m) => ({
      user_id: userMap[m.email],
      share_amount: share,
      share_percentage: parseFloat((100 / members.length).toFixed(2)),
    }));
  } else if (split_type === 'percentage') {
    const totalPct = members.reduce((sum, m) => sum + m.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      throw httpError(422, 'Percentages must add up to 100');
    }
    shares = members.map((m) => ({
      user_id: userMap[m.email],
      share_amount: parseFloat((total_amount * m.percentage / 100).toFixed(8)),
      share_percentage: m.percentage,
    }));
  } else {
    // custom
    const totalCustom = members.reduce((sum, m) => sum + m.amount, 0);
    if (Math.abs(totalCustom - total_amount) > 0.01) {
      throw httpError(422, 'Custom amounts must add up to total amount');
    }
    shares = members.map((m) => ({
      user_id: userMap[m.email],
      share_amount: m.amount,
      share_percentage: null,
    }));
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [splitResult] = await connection.query(
      `INSERT INTO splits (created_by, title, total_amount, currency, split_type, status)
       VALUES (?, ?, ?, ?, ?, 'open')`,
      [creatorId, title, total_amount, currency, split_type]
    );

    const splitId = splitResult.insertId;

    for (const share of shares) {
      await connection.query(
        `INSERT INTO split_members (split_id, user_id, share_amount, share_percentage)
         VALUES (?, ?, ?, ?)`,
        [splitId, share.user_id, share.share_amount, share.share_percentage]
      );
    }

    await connection.commit();

    return getSplit(db, splitId, creatorId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const getSplit = async (db, splitId, userId) => {
  const [splits] = await db.query(
    `SELECT s.*, u.full_name AS creator_name, u.email AS creator_email
       FROM splits s
       JOIN users u ON u.id = s.created_by
      WHERE s.id = ?
      LIMIT 1`,
    [splitId]
  );

  if (!splits.length) {
    throw httpError(404, 'Split not found');
  }

  const split = splits[0];

  const [members] = await db.query(
    `SELECT sm.*, u.full_name, u.email
       FROM split_members sm
       JOIN users u ON u.id = sm.user_id
      WHERE sm.split_id = ?`,
    [splitId]
  );

  return { ...split, members };
};

const getUserSplits = async (db, userId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;

  const [rows] = await db.query(
    `SELECT DISTINCT s.*, u.full_name AS creator_name
       FROM splits s
       JOIN users u ON u.id = s.created_by
       JOIN split_members sm ON sm.split_id = s.id
      WHERE s.created_by = ? OR sm.user_id = ?
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?`,
    [userId, userId, limit, offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(DISTINCT s.id) AS total
       FROM splits s
       LEFT JOIN split_members sm ON sm.split_id = s.id
      WHERE s.created_by = ? OR sm.user_id = ?`,
    [userId, userId]
  );

  return {
    splits: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

const settleMember = async (db, splitId, userId, { currency, idempotencyKey }, req) => {
  if (!SUPPORTED.includes(currency)) {
    throw httpError(422, `Unsupported currency: ${currency}`);
  }

  const [members] = await db.query(
    'SELECT * FROM split_members WHERE split_id = ? AND user_id = ? LIMIT 1',
    [splitId, userId]
  );

  const member = members[0];
  if (!member) {
    throw httpError(404, 'You are not a member of this split');
  }

  if (member.is_settled) {
    throw httpError(409, 'Your share is already settled');
  }

  const [splits] = await db.query(
    'SELECT * FROM splits WHERE id = ? LIMIT 1',
    [splitId]
  );

  const split = splits[0];
  if (!split) throw httpError(404, 'Split not found');
  if (split.status !== 'open') throw httpError(409, 'Split is no longer open');

  // member pays the split creator
  const iKey = idempotencyKey || uuidv4();
  const { duplicate, result: cachedResult } = await check(iKey);
  if (duplicate) return cachedResult;

  const txResult = await transfer(db, {
    idempotencyKey: iKey,
    senderId: userId,
    receiverId: split.created_by,
    amount: parseFloat(member.share_amount),
    currency,
    targetCurrency: split.currency,
    note: `Split settlement: ${split.title}`,
    type: 'split_settle',
    auditEventType: 'split.settled',
  }, req);

  await db.query(
    'UPDATE split_members SET is_settled = TRUE, settled_at = NOW() WHERE split_id = ? AND user_id = ?',
    [splitId, userId]
  );

  // check if all members settled — if so, close the split
  const [unsettled] = await db.query(
    'SELECT id FROM split_members WHERE split_id = ? AND is_settled = FALSE LIMIT 1',
    [splitId]
  );

  let newStatus = split.status;
  if (!unsettled.length) {
    newStatus = 'settled';
    await db.query(
      'UPDATE splits SET status = ?, settled_at = NOW() WHERE id = ?',
      ['settled', splitId]
    );
  }

  await save(iKey, txResult);

  // Notify every member of the split that something changed, not just the
  // creator — anyone watching this split's progress should see it update live.
  try {
    const [allMembers] = await db.query(
      'SELECT user_id FROM split_members WHERE split_id = ?',
      [splitId]
    );

    const payload = {
      splitId,
      settledBy: userId,
      status: newStatus,
    };

    const recipientIds = new Set([
      split.created_by,
      ...allMembers.map((m) => m.user_id),
    ]);

    for (const recipientId of recipientIds) {
      emitToUser(recipientId, 'split:updated', payload);
    }
  } catch (err) {
    console.error(`split:updated emit failed for split ${splitId}: ${err.message}`);
  }

  // The creator gets a persisted notification, separate from the live emit
  // above — the member who just paid already knows they paid, this is for
  // the person collecting. If settling closes the whole split, say that
  // instead of just "someone paid their share".
  try {
    const [[settlerInfo]] = await db.query(
      'SELECT full_name FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    const body = newStatus === 'settled'
      ? `${settlerInfo?.full_name || 'A member'} settled their share, completing "${split.title}"`
      : `${settlerInfo?.full_name || 'A member'} settled their share of "${split.title}"`;

    await createNotification(db, {
      userId: split.created_by,
      type: 'split_settled',
      title: newStatus === 'settled' ? 'Split fully settled' : 'Split share settled',
      body,
      referenceId: splitId,
      referenceType: 'split',
    });
  } catch (err) {
    console.error(`Split notification failed for split ${splitId}: ${err.message}`);
  }

  return txResult;
};

module.exports = { createSplit, getSplit, getUserSplits, settleMember };