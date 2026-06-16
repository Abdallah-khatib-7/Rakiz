const crypto = require('crypto');

// Pulls the client IP, accounting for the nginx proxy in production. Express
// already parses X-Forwarded-For when 'trust proxy' is set, so req.ip is the
// real client address rather than the proxy's.
const getClientIp = (req) => {
  return req.ip || req.socket?.remoteAddress || null;
};

// A device fingerprint here is intentionally coarse: IP plus user agent, hashed.
// It is not meant to uniquely pin a physical device, just to give the session
// registry and fraud rules a stable-ish signal to detect when a refresh token
// suddenly shows up from a very different context.
const generateFingerprint = (req) => {
  const ip = getClientIp(req) || '';
  const userAgent = req.get('user-agent') || '';

  return crypto
    .createHash('sha256')
    .update(`${ip}|${userAgent}`)
    .digest('hex');
};

module.exports = { getClientIp, generateFingerprint };
