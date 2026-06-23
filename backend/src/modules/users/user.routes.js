const express = require('express');

const controller = require('./user.controller');
const { requireAuth } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth);
router.use(apiLimiter);

router.post('/avatar', controller.updateAvatar);
router.post('/sessions/revoke-all', controller.revokeAllSessions);
router.get('/usage', controller.getUsage);
router.get('/sessions', controller.getSessions);
router.delete('/sessions/:id', controller.revokeSession);
const Joi = require('joi');
const { validate } = require('../../middleware/validate');

const schemas = {
  updateProfile: {
    body: Joi.object({
      full_name: Joi.string().trim().min(2).max(255).optional(),
      phone: Joi.string().trim().pattern(/^\+?[1-9]\d{6,18}$/).optional().allow(''),
    }),
  },
  changePassword: {
    body: Joi.object({
      current_password: Joi.string().required(),
      new_password: Joi.string().min(8).max(128).required(),
    }),
  },
};

router.patch('/profile', validate(schemas.updateProfile), controller.updateProfile);
router.post('/change-password', validate(schemas.changePassword), controller.changePassword);
module.exports = router;