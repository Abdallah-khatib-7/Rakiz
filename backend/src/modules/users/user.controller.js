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

module.exports = { updateAvatar, getUsage };