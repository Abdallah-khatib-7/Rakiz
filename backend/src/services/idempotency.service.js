const { getRedis } = require('../config/redis');

const TTL = 60 * 60 * 24; // 24 hours

// Before processing any financial mutation, call check() with a client-supplied
// key. If we've seen it before, return the cached result instead of processing
// again. If it's new, reserve it immediately so concurrent requests with the
// same key don't both slip through.

const check = async (key) => {
  const redis = getRedis();
  const cacheKey = `idempotency:${key}`;

  const existing = await redis.get(cacheKey);
  if (existing) {
    return { duplicate: true, result: JSON.parse(existing) };
  }

  return { duplicate: false };
};

const save = async (key, result) => {
  const redis = getRedis();
  const cacheKey = `idempotency:${key}`;

  await redis.set(cacheKey, JSON.stringify(result), { EX: TTL });
};

module.exports = { check, save };