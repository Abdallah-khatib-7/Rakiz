const express = require('express');
const Joi = require('joi');

const controller = require('./split.controller');
const { validate } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth);
router.use(apiLimiter);

const memberSchema = Joi.object({
  email: Joi.string().email().lowercase().max(255).required(),
  amount: Joi.number().positive().precision(8).optional(),
  percentage: Joi.number().positive().max(100).optional(),
});

const schemas = {
  createSplit: {
    body: Joi.object({
      title: Joi.string().trim().min(2).max(255).required(),
      total_amount: Joi.number().positive().precision(8).required(),
      currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').required(),
      split_type: Joi.string().valid('equal', 'custom', 'percentage').required(),
      members: Joi.array().items(memberSchema).min(2).required(),
    }),
  },
  getSplit: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
  },
  getUserSplits: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
    }),
  },
  settleMember: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
      currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').required(),
    }),
  },
};

router.get('/', validate(schemas.getUserSplits), controller.getUserSplits);

router.post('/', validate(schemas.createSplit), controller.createSplit);

router.get('/:id', validate(schemas.getSplit), controller.getSplit);

router.post('/:id/settle', validate(schemas.settleMember), controller.settleMember);

module.exports = router;