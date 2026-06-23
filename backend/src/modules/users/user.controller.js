const multer = require('multer');
const userService = require('./user.service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('avatar');

const updateAvatar = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(422).json({ error: err.message });
    }

    try {
      const db = req.app.get('db');
      const result = await userService.updateAvatar(db, req.user.id, req.file);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
};

const getUsage = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const usage = await userService.getUsage(db, req.user);
    res.json(usage);
  } catch (err) {
    next(err);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const sessions = await userService.getSessions(db, req.user.id);
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await userService.revokeSession(db, req.user.id, parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const revokeAllSessions = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await userService.revokeAllOtherSessions(db, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const user = await userService.updateProfile(db, req.user.id, req.body);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await userService.changePassword(db, req.user.id, {
      currentPassword: req.body.current_password,
      newPassword: req.body.new_password,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateAvatar,
  getUsage,
  getSessions,
  revokeSession,
  revokeAllSessions,
  updateProfile,
  changePassword,
};