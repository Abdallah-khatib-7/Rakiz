const express = require('express');
const Joi = require('joi');

const controller = require('./subscription.controller');
const { validate } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

const schemas = {
  createCheckoutSession: {
    body: Joi.object({
      tier: Joi.string().valid('pro', 'business').required(),
    }),
  },
};

// Webhook route has no auth (Stripe calls it directly) and needs the raw
// body for signature verification, not JSON. This route is mounted in
// app.js BEFORE the global express.json() runs, specifically so this raw
// parser claims the request body first.
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  controller.handleWebhook
);

// Everything below needs real JSON parsing. Since this whole router is
// mounted in app.js before the global express.json(), we apply it locally
// here for every route except /webhook above (which is already handled and
// won't reach this point again).
router.use(express.json({ limit: '10kb' }));

router.use(requireAuth);
router.use(apiLimiter);

router.post(
  '/checkout',
  validate(schemas.createCheckoutSession),
  controller.createCheckoutSession
);

router.post('/portal', controller.createPortalSession);

module.exports = router;