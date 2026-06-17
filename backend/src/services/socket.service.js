const { verifyAccessToken } = require('../modules/auth/token.service');

let ioInstance = null;

// Called once from server.js after the HTTP server and io are created.
// We store the instance here so any other service can emit without needing
// io passed through every function call.
const initSocket = (io) => {
  ioInstance = io;

  // Every connection must present a valid access token, or it's rejected
  // before any event handling happens. No anonymous or public sockets exist
  // in this app yet — every event we emit is tied to a specific user.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      return next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Each user gets a room named after their id. A user can have multiple
    // open sockets (several tabs, phone + laptop) and all of them join the
    // same room, so an emit reaches every connected device at once.
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      // socket.io removes the socket from its rooms automatically on
      // disconnect, nothing to clean up manually here.
    });
  });
};

// The one function the rest of the app actually calls. If sockets haven't
// been initialized yet (shouldn't happen outside of tests) this just no-ops
// instead of throwing, since a missed real-time event should never break a
// financial operation.
const emitToUser = (userId, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

module.exports = { initSocket, emitToUser };