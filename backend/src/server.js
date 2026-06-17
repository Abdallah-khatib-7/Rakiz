require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectMySQL, connectMongoDB } = require('./config/db');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./services/socket.service');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

initSocket(io);

// expose io to the rest of the app via the socket service, kept for any
// route handler that wants the raw instance — most code should just import
// emitToUser from socket.service instead
app.set('io', io);

const start = async () => {
  try {
    const pool = await connectMySQL();
    app.set('db', pool);

    await connectMongoDB();
    await connectRedis();

    server.listen(PORT, () => {
      console.log(`Rakiz API running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }
};

start();

// don't let an unhandled rejection take the process down silently
process.on('unhandledRejection', (reason) => {
  console.error(`Unhandled rejection: ${reason}`);
});