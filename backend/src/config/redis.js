const { createClient } = require('redis');
const winston = require('winston');

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

let client;

const connectRedis = async () => {
  try {
    client = createClient({
      url: process.env.REDIS_URL,
    });

    client.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`);
    });

    await client.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error(`Redis connection failed: ${error.message}`);
    process.exit(1);
  }
};

const getRedis = () => {
  if (!client) {
    throw new Error('Redis not initialized');
  }
  return client;
};

module.exports = { connectRedis, getRedis };