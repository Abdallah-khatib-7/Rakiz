const authService = require('./auth.service');
const { durationToMs } = require('./token.service');

const REFRESH_COOKIE = 'refresh_token';

// The refresh token is httpOnly so JS can't read it, Secure in production, and
// scoped to /api/auth so it only rides along on refresh/logout. SameSite is
// 'none' in production because the frontend (Vercel) and API (EC2) are on
// different sites; locally 'lax' is fine and avoids needing HTTPS.
const refreshCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: durationToMs(process.env.JWT_REFRESH_TTL || '30d'),
  };
};

const setRefreshCookie = (res, token) =>
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());

const clearRefreshCookie = (res) =>
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });

const register = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    await authService.register(db, req.body, req);
    res.status(201).json({
      message: 'Account created. Check your email to verify your account.',
    });
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await authService.verifyEmail(db, req.query.token);
    const status = result.alreadyVerified ? 'already' : 'success';
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=${status}`);
  } catch (err) {
    // A bad link should land the user somewhere friendly, not on a JSON error.
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=failed`);
  }
};

const login = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const { accessToken, refreshToken, user } = await authService.login(
      db,
      req.body,
      req
    );
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const { accessToken, refreshToken, user } = await authService.refresh(
      db,
      req.cookies?.[REFRESH_COOKIE],
      req
    );
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user });
  } catch (err) {
    // Any refresh failure should also clear the stale cookie.
    clearRefreshCookie(res);
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    await authService.logout(db, req.cookies?.[REFRESH_COOKIE]);
    clearRefreshCookie(res);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  res.json({ user: authService.publicUser(req.user) });
};

// Passport's Google strategy leaves a normalized profile on req.user. We turn
// that into a real session and hand the access token back to the frontend via a
// URL fragment (not a query param, so it stays out of server/access logs).
const googleCallback = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const { accessToken, refreshToken } = await authService.googleUpsert(
      db,
      req.user,
      req
    );
    setRefreshCookie(res, refreshToken);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback#access_token=${accessToken}`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/login?oauth=failed`);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  me,
  googleCallback,
};
