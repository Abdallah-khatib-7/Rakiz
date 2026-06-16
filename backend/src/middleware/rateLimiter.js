const rateLimit = require('express-rate-limit');

// Shared shape for our limiters. We key by IP (req.ip is trustworthy because
// 'trust proxy' is set in app.js) and return a consistent JSON error.
//
// Note: this uses the in-memory store, which is correct for a single instance.
// When we move to multiple API instances behind nginx we'll back this with
// Redis so counts are shared across processes.
const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message || 'Too many requests, please try again later' },
  });

// Tight limit on credential endpoints to slow down brute force.
const loginLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again in a few minutes',
});

const registerLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many accounts created from this address, try again later',
});

// Resending verification / refresh should be reachable but not abusable.
const emailLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many email requests, please try again later',
});

// A looser default for general authenticated traffic.
const apiLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
});

module.exports = {
  buildLimiter,
  loginLimiter,
  registerLimiter,
  emailLimiter,
  apiLimiter,
};
