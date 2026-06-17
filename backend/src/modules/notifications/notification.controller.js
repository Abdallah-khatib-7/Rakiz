const notificationService = require('./notification.service');

const getUserNotifications = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const unreadOnly = req.query.unread_only === 'true';

    const result = await notificationService.getUserNotifications(db, req.user.id, {
      page,
      limit,
      unreadOnly,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await notificationService.markAsRead(db, parseInt(req.params.id), req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await notificationService.markAllAsRead(db, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getUserNotifications, markAsRead, markAllAsRead };