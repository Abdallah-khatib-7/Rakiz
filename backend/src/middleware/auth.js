const { verifyAccessToken } = require('../modules/auth/token.service');

// Gate for protected routes. Expects "Authorization: Bearer <accessToken>".
// On success it loads the current user row and attaches it as req.user, so
// handlers always work against fresh role/status/tier rather than stale claims
// baked into the token.
const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const db = req.app.get('db');
    const [rows] = await db.query(
      `SELECT id, email, full_name, avatar_url, role, status,
              subscription_tier, email_verified
         FROM users
        WHERE id = ?
        LIMIT 1`,
      [payload.sub]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: `Account is ${user.status}` });
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

// Convenience guard for admin-only routes. Use after requireAuth.
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
};

module.exports = { requireAuth, requireAdmin };
