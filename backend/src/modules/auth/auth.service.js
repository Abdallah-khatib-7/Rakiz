const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');
const { v4: uuidv4 } = require('uuid');

const tokens = require('./token.service');
const { generateFingerprint, getClientIp } = require('../../utils/fingerprint');
const { sendVerificationEmail, sendWelcomeEmail } = require('../../services/email.service');
const { sendEmail } = require('../../config/mailer');
const fraudService = require('../../services/fraud.service');
const auditService = require('../../services/audit.service');

const BCRYPT_COST = 12;
const MIN_PASSWORD_SCORE = 2; // zxcvbn 0-4; below this is trivially guessable

// Small helper so the service can signal HTTP semantics without knowing about
// Express. The controller reads err.status.
const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  full_name: u.full_name,
  avatar_url: u.avatar_url,
  role: u.role,
  status: u.status,
  subscription_tier: u.subscription_tier,
  email_verified: !!u.email_verified,
});

// Creates a fresh session row and returns the raw refresh token. The raw token
// only ever lives in the response cookie; the DB keeps its hash. Passing a
// familyId reuses an existing family (rotation); omit it to start a new one.
const createSession = async (db, userId, req, familyId = null) => {
  const refreshToken = tokens.generateRefreshToken();
  const family = familyId || uuidv4();

  await db.query(
    `INSERT INTO user_sessions
       (user_id, refresh_token_hash, family_id, device_fingerprint,
        ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      tokens.hashRefreshToken(refreshToken),
      family,
      generateFingerprint(req),
      getClientIp(req),
      (req.get('user-agent') || '').slice(0, 512),
      tokens.refreshExpiryDate(),
    ]
  );

  return { refreshToken, familyId: family };
};

const register = async (db, { email, password, full_name }, req) => {
  const [existing] = await db.query(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  if (existing.length) {
    throw httpError(409, 'An account with this email already exists');
  }

  const strength = zxcvbn(password, [email, full_name]);
  if (strength.score < MIN_PASSWORD_SCORE) {
    const hint =
      strength.feedback.warning ||
      'Password is too weak, try a longer mix of words';
    throw httpError(422, hint);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  const [result] = await db.query(
    `INSERT INTO users (email, password_hash, full_name, email_verified)
     VALUES (?, ?, ?, FALSE)`,
    [email, passwordHash, full_name]
  );

  const userId = result.insertId;
  const verifyToken = tokens.signEmailToken(userId);

  // Don't let a flaky email provider fail the whole registration; the user can
  // request another verification link.
  try {
    await sendVerificationEmail({ to: email, name: full_name, token: verifyToken });
  } catch (err) {
    console.error(`Verification email failed for ${email}: ${err.message}`);
  }

  await auditService.logEvent({
    eventType: 'auth.register',
    actorId: userId,
    ipAddress: getClientIp(req),
    deviceFingerprint: generateFingerprint(req),
    metadata: { email },
  });

  return { id: userId, email };
};

const verifyEmail = async (db, token) => {
  let payload;
  try {
    payload = tokens.verifyEmailToken(token);
  } catch (err) {
    throw httpError(400, 'Verification link is invalid or has expired');
  }

  const [rows] = await db.query(
    'SELECT id, email, full_name, email_verified FROM users WHERE id = ? LIMIT 1',
    [payload.sub]
  );
  const user = rows[0];
  if (!user) {
    throw httpError(400, 'Verification link is invalid or has expired');
  }

  if (user.email_verified) {
    return { alreadyVerified: true };
  }

  await db.query('UPDATE users SET email_verified = TRUE WHERE id = ?', [user.id]);

  try {
    await sendWelcomeEmail({ to: user.email, name: user.full_name });
  } catch (err) {
    console.error(`Welcome email failed for ${user.email}: ${err.message}`);
  }

  return { alreadyVerified: false };
};

const login = async (db, { email, password }, req) => {
  // Locked out from too many recent failed attempts on this email — reject
  // before even touching the DB or comparing a password.
  const lockedOut = await fraudService.isLockedOut(email);
  if (lockedOut) {
    throw httpError(429, 'Too many failed attempts. Try again in a few minutes.');
  }

  const [rows] = await db.query(
    `SELECT id, email, password_hash, full_name, avatar_url, role, status,
            subscription_tier, email_verified, last_login_ip
       FROM users
      WHERE email = ?
      LIMIT 1`,
    [email]
  );
  const user = rows[0];

  // Same response whether the email is unknown or the password is wrong, so we
  // don't leak which emails have accounts. Still run a hash compare to keep the
  // timing roughly constant.
  const dummyHash = '$2b$12$0000000000000000000000000000000000000000000000000000';
  const ok = await bcrypt.compare(password, user?.password_hash || dummyHash);

  if (!user || !user.password_hash || !ok) {
    const shouldLockout = await fraudService.recordFailedLogin(email);
    await auditService.logEvent({
      eventType: 'auth.login_failed',
      actorId: user?.id || null,
      ipAddress: getClientIp(req),
      deviceFingerprint: generateFingerprint(req),
      metadata: { email, locked_out: shouldLockout },
    });
    throw httpError(401, 'Invalid email or password');
  }

  if (!user.email_verified) {
    throw httpError(403, 'Please verify your email before signing in');
  }

  if (user.status !== 'active') {
    throw httpError(403, `Your account is ${user.status}`);
  }

  // password was correct — clear any accumulated failed attempts
  await fraudService.clearFailedLogins(email);

  const currentIp = getClientIp(req);
  const isNewIp = await fraudService.checkNewIpLogin(db, {
    userId: user.id,
    currentIp,
    previousIp: user.last_login_ip,
  });

  if (isNewIp) {
    try {
      await sendEmail({
        to: user.email,
        subject: 'New sign-in to your Rakiz account',
        html: `<p>Hi ${user.full_name}, we noticed a sign-in to your account from a new location (${currentIp}). If this wasn't you, please secure your account immediately.</p>`,
      });
    } catch (err) {
      console.error(`Suspicious login email failed for ${user.email}: ${err.message}`);
    }
  }

  const { refreshToken } = await createSession(db, user.id, req);
  const accessToken = tokens.signAccessToken(user);

  await db.query(
    'UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
    [currentIp, user.id]
  );

  await auditService.logEvent({
    eventType: 'auth.login_success',
    actorId: user.id,
    ipAddress: currentIp,
    deviceFingerprint: generateFingerprint(req),
    metadata: { new_ip: isNewIp },
  });

  return { accessToken, refreshToken, user: publicUser(user) };
};

const refresh = async (db, rawToken, req) => {
  if (!rawToken) {
    throw httpError(401, 'No refresh token provided');
  }

  const hash = tokens.hashRefreshToken(rawToken);
  const [rows] = await db.query(
    'SELECT * FROM user_sessions WHERE refresh_token_hash = ? LIMIT 1',
    [hash]
  );
  const session = rows[0];

  if (!session) {
    throw httpError(401, 'Invalid session');
  }

  // A revoked token being presented again means it was already rotated out and
  // is now being replayed. Treat it as a compromise and kill the whole family.
  if (session.is_revoked) {
    await db.query(
      'UPDATE user_sessions SET is_revoked = TRUE WHERE family_id = ?',
      [session.family_id]
    );
    throw httpError(401, 'Session reuse detected, please sign in again');
  }

  if (new Date(session.expires_at) < new Date()) {
    throw httpError(401, 'Session has expired, please sign in again');
  }

  const [userRows] = await db.query(
    `SELECT id, email, full_name, avatar_url, role, status,
            subscription_tier, email_verified
       FROM users WHERE id = ? LIMIT 1`,
    [session.user_id]
  );
  const user = userRows[0];
  if (!user || user.status !== 'active') {
    throw httpError(401, 'Account is not active');
  }

  // Rotate: retire the presented token, mint a new one in the same family.
  await db.query('UPDATE user_sessions SET is_revoked = TRUE WHERE id = ?', [
    session.id,
  ]);
  const { refreshToken } = await createSession(db, user.id, req, session.family_id);
  const accessToken = tokens.signAccessToken(user);

  return { accessToken, refreshToken, user: publicUser(user) };
};

const logout = async (db, rawToken) => {
  if (!rawToken) return;
  await db.query(
    'UPDATE user_sessions SET is_revoked = TRUE WHERE refresh_token_hash = ?',
    [tokens.hashRefreshToken(rawToken)]
  );
};

// Find-or-link a user coming back from Google. The passport strategy hands us a
// normalized profile; we reconcile it with any existing local account by email.
const googleUpsert = async (db, profile, req) => {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE google_id = ? OR email = ? LIMIT 1',
    [profile.google_id, profile.email]
  );
  let user = rows[0];

  if (!user) {
    const [result] = await db.query(
      `INSERT INTO users (email, full_name, avatar_url, google_id, email_verified)
       VALUES (?, ?, ?, ?, TRUE)`,
      [profile.email, profile.full_name, profile.avatar_url, profile.google_id]
    );
    const [created] = await db.query('SELECT * FROM users WHERE id = ?', [
      result.insertId,
    ]);
    user = created[0];
  } else if (!user.google_id) {
    // Existing local account signing in with Google for the first time: link
    // the accounts and trust Google's verified email.
    await db.query(
      'UPDATE users SET google_id = ?, email_verified = TRUE WHERE id = ?',
      [profile.google_id, user.id]
    );
    user.google_id = profile.google_id;
    user.email_verified = 1;
  }

  if (user.status !== 'active') {
    throw httpError(403, `Your account is ${user.status}`);
  }

  const { refreshToken } = await createSession(db, user.id, req);
  const accessToken = tokens.signAccessToken(user);

  return { accessToken, refreshToken, user: publicUser(user) };
};

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  googleUpsert,
  publicUser,
};