const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const winston = require('winston');

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

const connectMySQL = async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      // 10 was fine for solo local testing but starves fast under real
      // concurrent traffic — every request that touches the DB holds a
      // connection for the duration of its query. 25 gives meaningfully more
      // headroom without overwhelming a small MySQL instance; revisit this
      // number after real load testing rather than guessing further.
      connectionLimit: 25,
      queueLimit: 0,
      decimalNumbers: true,
    });

    const connection = await pool.getConnection();
    connection.release();
    logger.info('MySQL connected successfully');
    return pool;
  } catch (error) {
    logger.error(`MySQL connection failed: ${error.message}`);
    process.exit(1);
  }
};

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectMySQL, connectMongoDB };