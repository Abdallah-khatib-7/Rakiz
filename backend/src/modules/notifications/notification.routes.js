const express = require('express');
const Joi = require('joi');

const controller = require('./notification.controller');
const { validate } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth);
router.use(apiLimiter);

const schemas = {
  getUserNotifications: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      unread_only: Joi.string().valid('true', 'false').optional(),
    }),
  },
  markAsRead: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
  },
};

router.get('/', validate(schemas.getUserNotifications), controller.getUserNotifications);

router.patch('/:id/read', validate(schemas.markAsRead), controller.markAsRead);

router.patch('/read-all', controller.markAllAsRead);

module.exports = router;