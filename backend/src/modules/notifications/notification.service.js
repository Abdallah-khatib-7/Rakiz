const { emitToUser } = require('../../services/socket.service');

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

// The one function every other module calls. Writes the notification row
// first — that's the durable record — then emits it live. If the emit fails
// (socket down, user offline) the notification still exists and they'll see
// it next time they fetch their list.
const createNotification = async (db, { userId, type, title, body, referenceId = null, referenceType = null }) => {
  const [result] = await db.query(
    `INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, type, title, body || null, referenceId, referenceType]
  );

  const notification = {
    id: result.insertId,
    user_id: userId,
    type,
    title,
    body: body || null,
    is_read: false,
    reference_id: referenceId,
    reference_type: referenceType,
    created_at: new Date(),
  };

  try {
    emitToUser(userId, 'notification:new', notification);
  } catch (err) {
    console.error(`Notification emit failed for user ${userId}: ${err.message}`);
  }

  return notification;
};

const getUserNotifications = async (db, userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [userId];

  if (unreadOnly) {
    query += ' AND is_read = FALSE';
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await db.query(query, params);

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?${unreadOnly ? ' AND is_read = FALSE' : ''}`,
    [userId]
  );

  const [[{ unread }]] = await db.query(
    'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = FALSE',
    [userId]
  );

  return {
    notifications: rows,
    unreadCount: unread,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

const markAsRead = async (db, notificationId, userId) => {
  const [rows] = await db.query(
    'SELECT id FROM notifications WHERE id = ? AND user_id = ? LIMIT 1',
    [notificationId, userId]
  );

  if (!rows.length) throw httpError(404, 'Notification not found');

  await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [notificationId]);

  return { message: 'Notification marked as read' };
};

const markAllAsRead = async (db, userId) => {
  await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [userId]);
  return { message: 'All notifications marked as read' };
};

module.exports = { createNotification, getUserNotifications, markAsRead, markAllAsRead };