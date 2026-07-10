// server/src/socket/notificationSocket.js
const Notification = require('../models/Notification');
const User = require('../models/User');

module.exports = (io, socket) => {
  const userId = socket.userId;

  // ── On Connect: Send unread count ──────────────────────────────────
  socket.emit('notification:get_count', async () => {
    try {
      const count = await Notification.countDocuments({
        recipient: userId,
        read: false,
        deleted: false
      });
      socket.emit('notification:count', { count });
    } catch (err) {
      console.warn('notification:get_count error:', err.message);
    }
  });

  // ── Client requests unread count ───────────────────────────────────
  socket.on('notification:get_count', async () => {
    try {
      const count = await Notification.countDocuments({
        recipient: userId,
        read: false,
        deleted: false
      });
      socket.emit('notification:count', { count });
    } catch (err) {
      console.warn('notification:get_count error:', err.message);
    }
  });

  // ── Mark one notification as read ──────────────────────────────────
  socket.on('notification:mark_read', async ({ notificationId }) => {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { read: true, readAt: new Date() }
      );
      const count = await Notification.countDocuments({
        recipient: userId, read: false, deleted: false
      });
      socket.emit('notification:count', { count });
    } catch (err) {
      console.warn('notification:mark_read error:', err.message);
    }
  });

  // ── Mark all as read ───────────────────────────────────────────────
  socket.on('notification:mark_all_read', async () => {
    try {
      await Notification.updateMany(
        { recipient: userId, read: false },
        { read: true, readAt: new Date() }
      );
      await User.findByIdAndUpdate(userId, { unreadNotificationCount: 0 });
      socket.emit('notification:count', { count: 0 });
      socket.emit('notification:cleared');
    } catch (err) {
      console.warn('notification:mark_all_read error:', err.message);
    }
  });
};