const express = require('express');
const Joi = require('joi');

const controller = require('./admin.controller');
const { validate } = require('../../middleware/validate');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

// Every route here needs both a valid session and the admin role. requireAuth
// loads the fresh user row; requireAdmin checks role on top of that.
router.use(requireAuth);
router.use(requireAdmin);
router.use(apiLimiter);

const schemas = {
  getUsers: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      search: Joi.string().max(255).optional().allow(''),
      status: Joi.string().valid('active', 'frozen', 'suspended').optional(),
    }),
  },
  getUserDetail: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
  },
  setUserStatus: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
      status: Joi.string().valid('active', 'frozen', 'suspended').required(),
    }),
  },
  getFraudQueue: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      status: Joi.string().valid('open', 'reviewing', 'resolved', 'dismissed').optional(),
    }),
  },
  reviewFraudFlag: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
      status: Joi.string().valid('reviewing', 'resolved', 'dismissed').required(),
    }),
  },
  adjustBalance: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
      currency: Joi.string().valid('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP').required(),
      amount: Joi.number().invalid(0).required(),
      reason: Joi.string().trim().min(5).max(512).required(),
    }),
  },
};

router.get('/users', validate(schemas.getUsers), controller.getUsers);

router.get('/users/:id', validate(schemas.getUserDetail), controller.getUserDetail);

router.patch('/users/:id/status', validate(schemas.setUserStatus), controller.setUserStatus);

router.get('/fraud-queue', validate(schemas.getFraudQueue), controller.getFraudQueue);

router.patch('/fraud-queue/:id', validate(schemas.reviewFraudFlag), controller.reviewFraudFlag);

router.post('/users/:id/adjust-balance', validate(schemas.adjustBalance), controller.adjustBalance);

router.get('/revenue', controller.getRevenueStats);

module.exports = router;