/**
 * server/src/socket/index.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Socket.IO Entry Point (NEW)
 *
 * Responsibilities:
 *   1. Authenticate every new socket with the same JWT as REST endpoints.
 *   2. Join each user to their personal room: `user:${userId}`.
 *   3. Mark them online in the User collection + broadcast presence.
 *   4. Delegate chat events to chatSocket.js, presence events to
 *      presenceSocket.js.
 *
 * Room naming convention:
 *   user:${userId}   → personal inbox for a single user
 *   conv:${convId}   → everyone currently viewing this DM
 * ────────────────────────────────────────────────────────────────────────────
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const chatSocket = require('./chatSocket');
const presenceSocket = require('./presenceSocket');

module.exports = (io) => {
  // ── Auth middleware: runs once per new connection ────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake?.auth?.token ||
        socket.handshake?.query?.token ||
        (socket.handshake?.headers?.authorization || '').replace(
          /^Bearer\s+/i,
          ''
        );

      if (!token) {
        return next(new Error('Authentication error: no token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Our JWTs use either `userId` or `id` depending on auth module.
      const userId = decoded.userId || decoded.id || decoded._id;
      if (!userId) {
        return next(new Error('Authentication error: invalid token payload'));
      }

      socket.userId = userId.toString();
      socket.role = decoded.role;

      // Mark the user online.
      await User.findByIdAndUpdate(
        userId,
        { isOnline: true, lastSeen: new Date() },
        { new: false }
      ).catch(() => null);

      return next();
    } catch (err) {
      console.warn('Socket auth failed:', err.message);
      return next(new Error('Authentication error'));
    }
  });

  // ── Connection handler ───────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Personal inbox room.
    socket.join(`user:${userId}`);

    // Broadcast presence to anyone interested (followers / connections).
    io.emit('presence:update', {
      userId,
      isOnline: true,
      lastSeen: new Date(),
    });

    // Register chat + presence handlers (they add their own listeners to
    // this socket instance).
    chatSocket(io, socket);
    presenceSocket(io, socket);

    socket.on('disconnect', async () => {
      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        }).catch(() => null);

        io.emit('presence:update', {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });
      } catch (err) {
        console.warn('disconnect handler error:', err.message);
      }
    });
  });

  return io;
};