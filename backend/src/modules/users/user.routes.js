const express = require('express');

const controller = require('./user.controller');
const { requireAuth } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth);
router.use(apiLimiter);

// multer runs inside the controller itself (it needs to parse the multipart
// body before validation would even make sense), so no Joi schema here.
router.post('/avatar', controller.updateAvatar);

module.exports = router;