const express = require('express');
const Joi = require('joi');

const controller = require('./wallet.controller');
const { validate } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth);
router.use(apiLimiter);

const schemas = {
  send: {
    body: Joi.object({
      receiver_identifier: Joi.string().trim().max(255).required(),
      amount: Joi.number().positive().precision(8).required(),
      currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').required(),
      target_currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').optional(),
      note: Joi.string().max(512).optional().allow(''),
    }),
  },
  getWallet: {
    params: Joi.object({
      currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').required(),
    }),
  },
  getTransactions: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').optional(),
    }),
  },
  exchange: {
    body: Joi.object({
      from_currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').required(),
      to_currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').required(),
      amount: Joi.number().positive().precision(8).required(),
    }),
  },
  createWallet: {
    body: Joi.object({
      currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').required(),
    }),
  },
};

router.get('/', controller.getWallets);

router.get('/transactions', validate(schemas.getTransactions), controller.getTransactions);

router.get('/:currency', validate(schemas.getWallet), controller.getWallet);

router.post('/send', validate(schemas.send), controller.send);
router.post('/exchange', validate(schemas.exchange), controller.exchange);
router.post('/', validate(schemas.createWallet), controller.createWallet);
module.exports = router;