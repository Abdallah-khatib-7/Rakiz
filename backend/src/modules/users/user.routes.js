const express = require('express');

const controller = require('./user.controller');
const { requireAuth } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth);
router.use(apiLimiter);

router.post('/avatar', controller.updateAvatar);

router.get('/usage', controller.getUsage);

module.exports = router;