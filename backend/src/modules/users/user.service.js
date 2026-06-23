const { uploadImage, deleteImage } = require('../../services/storage.service');
const tierLimits = require('../../services/tierLimits.service');
const { encrypt, decrypt } = require('../../utils/encryption');
const tokens = require('../auth/token.service');
const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');


const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

// Avatar URLs follow https://bucket.s3.region.amazonaws.com/avatars/<uuid>.ext
// We need the S3 key back out of a stored URL to delete the old file when
// replacing it — this just strips the bucket/region prefix.
const extractKeyFromUrl = (url) => {
  if (!url) return null;
  const marker = '.amazonaws.com/';
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
};

const updateAvatar = async (db, userId, file) => {
  const [rows] = await db.query(
    'SELECT avatar_url FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  if (!rows.length) throw httpError(404, 'User not found');

  const previousUrl = rows[0].avatar_url;

  const { url } = await uploadImage(file, { folder: 'avatars' });

  await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [url, userId]);

  const previousKey = extractKeyFromUrl(previousUrl);
  if (previousKey) {
    await deleteImage(previousKey);
  }

  return { avatar_url: url };
};

const getUsage = async (db, user) => {
  const limits = tierLimits.TIER_LIMITS[user.subscription_tier] || tierLimits.TIER_LIMITS.free;

  const sendsUsed = await tierLimits.getMonthlySendCount(db, user.id);
  const splitsUsed = await tierLimits.getMonthlySplitCount(db, user.id);

  return {
    tier: user.subscription_tier,
    sends: {
      used: sendsUsed,
      limit: limits.sendsPerMonth === Infinity ? null : limits.sendsPerMonth,
    },
    splits: {
      used: splitsUsed,
      limit: limits.splitsPerMonth === Infinity ? null : limits.splitsPerMonth,
    },
  };
};

const getSessions = async (db, userId) => {
  const [rows] = await db.query(
    `SELECT id, device_fingerprint, ip_address, user_agent,
            is_revoked, created_at, expires_at
       FROM user_sessions
      WHERE user_id = ? AND is_revoked = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC`,
    [userId]
  );

  return rows.map((session) => {
    let ip = null;
    try {
      ip = session.ip_address ? decrypt(session.ip_address) : null;
    } catch {
      ip = null;
    }

    return {
      id: session.id,
      ip,
      userAgent: session.user_agent,
      createdAt: session.created_at,
      expiresAt: session.expires_at,
    };
  });
};

const revokeSession = async (db, userId, sessionId) => {
  const [rows] = await db.query(
    'SELECT id FROM user_sessions WHERE id = ? AND user_id = ? LIMIT 1',
    [sessionId, userId]
  );
  if (!rows.length) {
    throw httpError(404, 'Session not found');
  }

  await db.query('UPDATE user_sessions SET is_revoked = TRUE WHERE id = ?', [sessionId]);

  return { message: 'Session revoked' };
};

const revokeAllOtherSessions = async (db, userId) => {
  await db.query(
    'UPDATE user_sessions SET is_revoked = TRUE WHERE user_id = ? AND is_revoked = FALSE',
    [userId]
  );
  return { message: 'All sessions revoked' };
};




const BCRYPT_COST = 12;
const MIN_PASSWORD_SCORE = 2;

const updateProfile = async (db, userId, { full_name, phone }) => {
  if (phone) {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE phone = ? AND id != ? LIMIT 1',
      [phone, userId]
    );
    if (existing.length) {
      throw httpError(409, 'That phone number is already in use');
    }
  }

  const updates = [];
  const params = [];

  if (full_name !== undefined) {
    updates.push('full_name = ?');
    params.push(full_name);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    params.push(phone || null);
  }

  if (!updates.length) {
    throw httpError(422, 'Nothing to update');
  }

  params.push(userId);
  await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

  const [rows] = await db.query(
    `SELECT id, email, phone, full_name, avatar_url, role, status,
            subscription_tier, email_verified
       FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );

  return rows[0];
};

const changePassword = async (db, userId, { currentPassword, newPassword }) => {
  const [rows] = await db.query(
    'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  const user = rows[0];
  if (!user || !user.password_hash) {
    throw httpError(422, 'This account has no password set (signed in via Google)');
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    throw httpError(401, 'Current password is incorrect');
  }

  const strength = zxcvbn(newPassword);
  if (strength.score < MIN_PASSWORD_SCORE) {
    throw httpError(422, strength.feedback.warning || 'New password is too weak');
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

  // changing your password should also kill every other session — anyone
  // who had your old password's session shouldn't stay logged in
  await db.query(
    'UPDATE user_sessions SET is_revoked = TRUE WHERE user_id = ? AND is_revoked = FALSE',
    [userId]
  );

  return { message: 'Password changed. You have been signed out of all other sessions.' };
};

module.exports = {
  updateAvatar,
  getUsage,
  getSessions,
  revokeSession,
  revokeAllOtherSessions,
  updateProfile,
  changePassword,
};