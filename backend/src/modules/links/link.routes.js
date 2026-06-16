const express = require('express');
const Joi = require('joi');

const controller = require('./link.controller');
const { validate } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

const schemas = {
  createLink: {
    body: Joi.object({
      amount: Joi.number().positive().precision(8).optional(),
      currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').required(),
      description: Joi.string().max(512).optional().allow(''),
      is_single_use: Joi.boolean().optional(),
      expires_in_hours: Joi.number().integer().min(1).max(8760).optional(),
    }),
  },
  getLink: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
  },
  getUserLinks: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
    }),
  },
  getLinkByToken: {
    params: Joi.object({
      token: Joi.string().required(),
    }),
  },
  payLink: {
    params: Joi.object({
      token: Joi.string().required(),
    }),
    body: Joi.object({
      amount: Joi.number().positive().precision(8).optional(),
      currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').required(),
    }),
  },
  deleteLink: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
  },
};

// public routes — no auth needed
router.get('/pay/:token', validate(schemas.getLinkByToken), controller.getLinkByToken);

// authenticated routes
router.use(requireAuth);
router.use(apiLimiter);

router.get('/', validate(schemas.getUserLinks), controller.getUserLinks);
router.post('/', validate(schemas.createLink), controller.createLink);
router.get('/:id', validate(schemas.getLink), controller.getLink);
router.delete('/:id', validate(schemas.deleteLink), controller.deleteLink);

router.post('/pay/:token', validate(schemas.payLink), controller.payLink);

module.exports = router;