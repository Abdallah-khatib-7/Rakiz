const express = require('express');
const Joi = require('joi');
const passport = require('../../config/passport');

const controller = require('./auth.controller');
const { validate } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const {
  loginLimiter,
  registerLimiter,
  emailLimiter,
} = require('../../middleware/rateLimiter');

const router = express.Router();

const schemas = {
  register: {
    body: Joi.object({
      email: Joi.string().email().lowercase().max(255).required(),
      password: Joi.string().min(8).max(128).required(),
      full_name: Joi.string().trim().min(2).max(255).required(),
    }),
  },
  login: {
    body: Joi.object({
      email: Joi.string().email().lowercase().max(255).required(),
      password: Joi.string().max(128).required(),
    }),
  },
  verifyEmail: {
    query: Joi.object({ token: Joi.string().required() }),
  },
};

router.post(
  '/register',
  registerLimiter,
  validate(schemas.register),
  controller.register
);

router.get(
  '/verify-email',
  emailLimiter,
  validate(schemas.verifyEmail),
  controller.verifyEmail
);

router.post('/login', loginLimiter, validate(schemas.login), controller.login);

router.post('/refresh', controller.refresh);

router.post('/logout', controller.logout);

router.get('/me', requireAuth, controller.me);

// Google OAuth. Stateless: no server session, the strategy just normalizes the
// profile and we issue our own tokens in the callback.
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?oauth=failed`,
  }),
  controller.googleCallback
);

module.exports = router;
