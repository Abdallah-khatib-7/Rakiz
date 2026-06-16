const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Access tokens are short-lived JWTs the client sends on every request.
// Refresh tokens are opaque random strings: we never put anything meaningful
// in them, we only store their hash in user_sessions and rotate them.

const signAccessToken = (user) => {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
      tier: user.subscription_tier,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_TTL || '15m' }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

// Email verification link token. Separate secret so a leaked access secret
// can't be used to forge verifications and vice versa.
const signEmailToken = (userId) => {
  return jwt.sign(
    { sub: String(userId), purpose: 'email_verify' },
    process.env.EMAIL_VERIFY_SECRET,
    { expiresIn: process.env.EMAIL_VERIFY_TTL || '24h' }
  );
};

const verifyEmailToken = (token) => {
  const payload = jwt.verify(token, process.env.EMAIL_VERIFY_SECRET);
  if (payload.purpose !== 'email_verify') {
    throw new Error('Invalid token purpose');
  }
  return payload;
};

const generateRefreshToken = () => crypto.randomBytes(48).toString('hex');

// We store only the hash, so a leaked DB never yields usable refresh tokens.
const hashRefreshToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// Turn "30d" / "12h" / "15m" / "45s" into milliseconds so we can compute the
// session's expires_at without pulling in another dependency.
const durationToMs = (value) => {
  const match = /^(\d+)([smhd])$/.exec(String(value).trim());
  if (!match) {
    throw new Error(`Invalid duration format: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return amount * unit;
};

const refreshExpiryDate = () => {
  const ttl = process.env.JWT_REFRESH_TTL || '30d';
  return new Date(Date.now() + durationToMs(ttl));
};

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signEmailToken,
  verifyEmailToken,
  generateRefreshToken,
  hashRefreshToken,
  durationToMs,
  refreshExpiryDate,
};
