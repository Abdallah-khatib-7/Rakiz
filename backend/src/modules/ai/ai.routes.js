const express = require('express');
const Joi = require('joi');

const controller = require('./ai.controller');
const { validate } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth);
router.use(apiLimiter);

// 'YYYY-MM' format, e.g. '2026-06'
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

const schemas = {
  generateInsight: {
    body: Joi.object({
      month: Joi.string().pattern(monthPattern).required(),
    }),
  },
  getInsight: {
    params: Joi.object({
      month: Joi.string().pattern(monthPattern).required(),
    }),
  },
  detectAnomalies: {
    body: Joi.object({
      month: Joi.string().pattern(monthPattern).required(),
    }),
  },
  searchTransactions: {
    body: Joi.object({
      query: Joi.string().trim().min(2).max(255).required(),
    }),
  },
};

router.post('/insights/generate', validate(schemas.generateInsight), controller.generateInsight);

router.get('/insights/:month', validate(schemas.getInsight), controller.getInsight);

router.post('/anomalies', validate(schemas.detectAnomalies), controller.detectAnomalies);

router.post('/search', validate(schemas.searchTransactions), controller.searchTransactions);

module.exports = router;