/**
 * server/src/socket/presenceSocket.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Presence Socket Handlers (NEW)
 *
 * Handled events (client → server):
 *   presence:heartbeat  — client pings every N seconds to keep lastSeen fresh.
 *   presence:query      { userIds: string[] } — request current presence of
 *                        a batch of users (for rendering online dots in
 *                        lists).
 *
 * Emitted events (server → client):
 *   presence:update     { userId, isOnline, lastSeen }
 *   presence:batch      { [userId]: { isOnline, lastSeen } }
 * ────────────────────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');
const User = require('../models/User');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

module.exports = (io, socket) => {
  const userId = socket.userId;

  /* ── heartbeat ─────────────────────────────────────────────────────── */
  socket.on('presence:heartbeat', async () => {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      }).catch(() => null);
    } catch (err) {
      console.warn('presence:heartbeat error:', err.message);
    }
  });

  /* ── batch query ──────────────────────────────────────────────────── */
  socket.on('presence:query', async ({ userIds } = {}) => {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) return;
      const valid = userIds.filter(isValidId).slice(0, 200);
      if (valid.length === 0) return;

      const users = await User.find({ _id: { $in: valid } })
        .select('_id isOnline lastSeen')
        .lean();

      const batch = {};
      users.forEach((u) => {
        batch[u._id.toString()] = {
          isOnline: !!u.isOnline,
          lastSeen: u.lastSeen,
        };
      });

      socket.emit('presence:batch', batch);
    } catch (err) {
      console.warn('presence:query error:', err.message);
    }
  });

  /* ── manual update (e.g., going away / back) ──────────────────────── */
  socket.on('presence:update', async ({ isOnline } = {}) => {
    try {
      const now = new Date();
      await User.findByIdAndUpdate(userId, {
        isOnline: !!isOnline,
        lastSeen: now,
      }).catch(() => null);

      io.emit('presence:update', {
        userId,
        isOnline: !!isOnline,
        lastSeen: now,
      });
    } catch (err) {
      console.warn('presence:update error:', err.message);
    }
  });
};