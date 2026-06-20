const multer = require('multer');
const userService = require('./user.service');

// Buffer storage, not disk — we hand the buffer straight to S3 and never
// need the file to touch our own filesystem.
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

module.exports = { updateAvatar };