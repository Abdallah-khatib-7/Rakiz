const { uploadImage, deleteImage } = require('../../services/storage.service');
const tierLimits = require('../../services/tierLimits.service');

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

module.exports = { updateAvatar, getUsage };