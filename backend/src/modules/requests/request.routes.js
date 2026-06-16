const express = require('express');
const Joi = require('joi');

const controller = require('./request.controller');
const { validate } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth);
router.use(apiLimiter);

const schemas = {
  createRequest: {
    body: Joi.object({
      target_email: Joi.string().email().lowercase().max(255).required(),
      amount: Joi.number().positive().precision(8).required(),
      currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').required(),
      note: Joi.string().max(512).optional().allow(''),
      expires_in_hours: Joi.number().integer().min(1).max(168).optional(),
    }),
  },
  getRequest: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
  },
  getUserRequests: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      type: Joi.string().valid('all', 'sent', 'received').optional(),
    }),
  },
  payRequest: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
      currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').required(),
    }),
  },
  declineRequest: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
  },
  cancelRequest: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
  },
};

router.get('/', validate(schemas.getUserRequests), controller.getUserRequests);

router.post('/', validate(schemas.createRequest), controller.createRequest);

router.get('/:id', validate(schemas.getRequest), controller.getRequest);

router.post('/:id/pay', validate(schemas.payRequest), controller.payRequest);

router.post('/:id/decline', validate(schemas.declineRequest), controller.declineRequest);

router.post('/:id/cancel', validate(schemas.cancelRequest), controller.cancelRequest);

module.exports = router;