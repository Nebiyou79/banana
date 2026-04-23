/**
 * server/src/controllers/messageController.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Message Controller (NEW)
 *
 * Endpoints (wired in messageRoutes.js):
 *   POST   /messages                  → sendMessage
 *   GET    /messages/:conversationId  → getMessages  (?page, ?limit, ?before)
 *   DELETE /messages/:messageId       → deleteMessage ({ deleteFor: 'me'|'everyone' })
 * ────────────────────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ──────────────────────────────────────────────────────────────────────────
 * POST /messages
 * body: { conversationId, content, type?, replyTo? }
 * ────────────────────────────────────────────────────────────────────────── */
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const {
      conversationId,
      content,
      type = 'text',
      replyTo = null,
    } = req.body || {};

    if (!isValidObjectId(conversationId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid conversationId' });
    }
    const trimmed = (content || '').toString().trim();
    if (!trimmed) {
      return res
        .status(400)
        .json({ success: false, message: 'Message content is required' });
    }
    if (trimmed.length > 2000) {
      return res
        .status(400)
        .json({ success: false, message: 'Message exceeds 2000 characters' });
    }
    if (replyTo && !isValidObjectId(replyTo)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid replyTo id' });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
    });
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: 'Conversation not found' });
    }

    if (conversation.status === 'declined') {
      return res.status(403).json({
        success: false,
        message: 'This conversation has been declined',
      });
    }

    // If sender is the REQUESTED (recipient of a request) and they send,
    // that implicitly accepts the request.
    if (
      conversation.status === 'request' &&
      conversation.requestedBy &&
      conversation.requestedBy.toString() !== senderId.toString()
    ) {
      conversation.status = 'active';
    }

    // Create message.
    const message = await Message.create({
      conversationId,
      sender: senderId,
      content: trimmed,
      type,
      replyTo: replyTo || null,
    });

    // Update conversation's lastMessage + bump unread for other participants.
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;

    // Un-delete for sender (they clearly want it back).
    conversation.deletedFor = (conversation.deletedFor || []).filter(
      (u) => u.toString() !== senderId.toString()
    );

    // Increment unread for every OTHER participant.
    if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
    for (const participant of conversation.participants) {
      const pid = participant.toString();
      if (pid === senderId.toString()) continue;
      const prev = conversation.unreadCounts.get(pid) || 0;
      conversation.unreadCounts.set(pid, prev + 1);
    }
    conversation.markModified('unreadCounts');
    await conversation.save();

    // Populate sender for the outgoing payload.
    const populated = await Message.findById(message._id)
      .populate('sender', 'name avatar role')
      .populate({
        path: 'replyTo',
        select: 'content type sender createdAt',
        populate: { path: 'sender', select: 'name avatar role' },
      })
      .lean();

    // Socket emits.
    try {
      if (req.io) {
        // To all in the conversation room (active viewers).
        req.io
          .to(`conv:${conversationId}`)
          .emit('chat:new_message', {
            message: populated,
            conversationId,
          });

        // To each participant's personal room (for inbox badge updates),
        // except the sender (their client already knows).
        conversation.participants.forEach((p) => {
          if (p.toString() === senderId.toString()) return;
          req.io.to(`user:${p}`).emit('chat:new_message', {
            message: populated,
            conversationId,
          });
        });
      }
    } catch (_) {
      /* socket optional */
    }

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('sendMessage error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to send message' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * GET /messages/:conversationId
 * Returns messages in DESC order (newest first). The client reverses for
 * display. Supports ?page=&limit= and ?before=<messageId> cursor.
 * ────────────────────────────────────────────────────────────────────────── */
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;

    if (!isValidObjectId(conversationId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid conversationId' });
    }

    // Confirm the user is a participant.
    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    })
      .select('_id')
      .lean();
    if (!conv) {
      return res
        .status(404)
        .json({ success: false, message: 'Conversation not found' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;
    const before = req.query.before;

    const filter = {
      conversationId,
      deletedFor: { $ne: userId },
    };
    if (before && isValidObjectId(before)) {
      filter._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    const [docs, total] = await Promise.all([
      Message.find(filter)
        .populate('sender', 'name avatar role')
        .populate({
          path: 'replyTo',
          select: 'content type sender createdAt',
          populate: { path: 'sender', select: 'name avatar role' },
        })
        .sort({ createdAt: -1 })
        .skip(before ? 0 : skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({
        conversationId,
        deletedFor: { $ne: userId },
      }),
    ]);

    return res.json({
      success: true,
      data: docs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('getMessages error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to load messages' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * DELETE /messages/:messageId
 * body: { deleteFor?: 'me' | 'everyone' }  (default 'me')
 * ────────────────────────────────────────────────────────────────────────── */
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;
    const { deleteFor = 'me' } = req.body || {};

    if (!isValidObjectId(messageId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid messageId' });
    }
    if (!['me', 'everyone'].includes(deleteFor)) {
      return res
        .status(400)
        .json({ success: false, message: 'deleteFor must be "me" or "everyone"' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: 'Message not found' });
    }

    // Make sure the user is a participant of the parent conversation.
    const conv = await Conversation.findOne({
      _id: message.conversationId,
      participants: userId,
    })
      .select('_id')
      .lean();
    if (!conv) {
      return res
        .status(403)
        .json({ success: false, message: 'Not a participant' });
    }

    if (deleteFor === 'everyone') {
      if (!message.canBeDeletedBy(userId)) {
        return res.status(400).json({
          success: false,
          message:
            'You can only delete your own messages within 2 hours of sending',
        });
      }
      await message.markDeletedForEveryone(userId);

      try {
        if (req.io) {
          req.io
            .to(`conv:${message.conversationId}`)
            .emit('chat:message_deleted', {
              messageId: message._id,
              conversationId: message.conversationId,
              deletedBy: userId,
              scope: 'everyone',
            });
        }
      } catch (_) {
        /* socket optional */
      }
    } else {
      // delete for me only
      await message.markDeletedForMe(userId);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('deleteMessage error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to delete message' });
  }
};