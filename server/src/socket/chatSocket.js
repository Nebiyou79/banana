/**
 * server/src/socket/chatSocket.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Chat Socket Handlers (NEW)
 *
 * Handled events (client → server):
 *   chat:join_room       { conversationId }
 *   chat:leave_room      { conversationId }
 *   chat:typing_start    { conversationId }
 *   chat:typing_stop     { conversationId }
 *   chat:mark_read       { conversationId }
 *   chat:delivered       { messageId, conversationId }
 *
 * Emitted events (server → client):
 *   chat:new_message     { message, conversationId }          (from REST)
 *   chat:message_deleted { messageId, conversationId, ... }   (from REST)
 *   chat:typing          { conversationId, userId, isTyping }
 *   chat:messages_read   { conversationId, readerId, readAt }
 *   chat:message_delivered { messageId, conversationId }
 * ────────────────────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

module.exports = (io, socket) => {
  const userId = socket.userId;

  /* ── join a conversation room ─────────────────────────────────────── */
  socket.on('chat:join_room', async ({ conversationId } = {}) => {
    if (!isValidId(conversationId)) return;
    try {
      const conv = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      }).select('_id').lean();
      if (!conv) return;

      socket.join(`conv:${conversationId}`);
    } catch (err) {
      console.warn('chat:join_room error:', err.message);
    }
  });

  /* ── leave a conversation room ────────────────────────────────────── */
  socket.on('chat:leave_room', ({ conversationId } = {}) => {
    if (!isValidId(conversationId)) return;
    socket.leave(`conv:${conversationId}`);
  });

  /* ── typing indicators ────────────────────────────────────────────── */
  socket.on('chat:typing_start', ({ conversationId } = {}) => {
    if (!isValidId(conversationId)) return;
    socket.to(`conv:${conversationId}`).emit('chat:typing', {
      conversationId,
      userId,
      isTyping: true,
    });
  });

  socket.on('chat:typing_stop', ({ conversationId } = {}) => {
    if (!isValidId(conversationId)) return;
    socket.to(`conv:${conversationId}`).emit('chat:typing', {
      conversationId,
      userId,
      isTyping: false,
    });
  });

  /* ── mark read ────────────────────────────────────────────────────── */
  socket.on('chat:mark_read', async ({ conversationId } = {}) => {
    if (!isValidId(conversationId)) return;
    try {
      const conv = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });
      if (!conv) return;

      await conv.markReadFor(userId);

      await Message.updateMany(
        {
          conversationId,
          sender: { $ne: userId },
          status: { $in: ['sent', 'delivered'] },
        },
        {
          $set: { status: 'read' },
          $addToSet: { readBy: { user: userId, readAt: new Date() } },
        }
      );

      io.to(`conv:${conversationId}`).emit('chat:messages_read', {
        conversationId,
        readerId: userId,
        readAt: new Date(),
      });
    } catch (err) {
      console.warn('chat:mark_read error:', err.message);
    }
  });

  /* ── delivery ack (client confirms receipt) ───────────────────────── */
  socket.on(
    'chat:delivered',
    async ({ messageId, conversationId } = {}) => {
      if (!isValidId(messageId) || !isValidId(conversationId)) return;
      try {
        const message = await Message.findById(messageId).select(
          'conversationId sender status'
        );
        if (!message) return;
        if (message.sender.toString() === userId) return; // only recipients ack

        if (message.status === 'sent') {
          await Message.findByIdAndUpdate(messageId, {
            status: 'delivered',
          });

          io.to(`conv:${conversationId}`).emit('chat:message_delivered', {
            messageId,
            conversationId,
          });
        }
      } catch (err) {
        console.warn('chat:delivered error:', err.message);
      }
    }
  );
};