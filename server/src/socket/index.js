/**
 * server/src/socket/index.js
 * BananaLink Social System v2.0 — Socket.IO Entry Point with Notifications
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

const chatSocket = require('./chatSocket');
const presenceSocket = require('./presenceSocket');
const notificationSocket = require('./notificationSocket');

module.exports = (io) => {
  // ── Auth middleware ────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake?.auth?.token ||
        socket.handshake?.query?.token ||
        (socket.handshake?.headers?.authorization || '').replace(/^Bearer\s+/i, '');

      if (!token) return next(new Error('Authentication error: no token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded.id || decoded._id;
      if (!userId) return next(new Error('Authentication error: invalid token payload'));

      socket.userId = userId.toString();
      socket.role = decoded.role;

      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() }, { new: false }).catch(() => null);

      return next();
    } catch (err) {
      console.warn('Socket auth failed:', err.message);
      return next(new Error('Authentication error'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────
  io.on('connection', async (socket) => {
    const userId = socket.userId;
    if (!userId) { socket.disconnect(); return; }

    socket.join(`user:${userId}`);

    io.emit('presence:update', { userId, isOnline: true, lastSeen: new Date() });

    chatSocket(io, socket);
    presenceSocket(io, socket);
    notificationSocket(io, socket);

    // ── Send initial unread count on connect ─────────────────────────
    try {
      const count = await Notification.countDocuments({
        recipient: userId, read: false, deleted: false
      });
      socket.emit('notification:count', { count });
    } catch (err) {
      console.warn('Initial unread count error:', err.message);
    }

    socket.on('disconnect', async () => {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() }).catch(() => null);
        io.emit('presence:update', { userId, isOnline: false, lastSeen: new Date() });
      } catch (err) { console.warn('disconnect handler error:', err.message); }
    });
  });

  return io;
};