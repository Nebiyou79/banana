// =============================================================================
// FILE 2: messageController.js — WITH NOTIFICATIONS
// =============================================================================

'use strict';

const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
// 🔔 NOTIFICATION
const notificationService = require('../services/notificationService');

const { isValidObjectId } = mongoose;

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_CONTENT_LENGTH = 2000;
const DELETE_EVERYONE_WINDOW_MS = 10 * 60 * 1000;

const ERROR_MESSAGES = {
  INVALID_CONVERSATION_ID: 'Invalid conversation ID',
  INVALID_MESSAGE_ID: 'Invalid message ID',
  CONTENT_REQUIRED: 'Message content is required',
  CONTENT_TOO_LONG: `Message too long (max ${MAX_CONTENT_LENGTH} characters)`,
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  NOT_PARTICIPANT: 'You are not a participant in this conversation',
  DECLINED: 'This conversation has been declined',
  ACCEPT_FIRST: 'You must accept the message request before replying',
  MESSAGE_NOT_FOUND: 'Message not found',
  NOT_SENDER: 'Only the sender can delete this message for everyone',
  DELETE_WINDOW_EXPIRED: 'Delete window has expired (10 minutes)',
  SERVER_ERROR: 'Failed to process message',
};

// ─── Helper: Broadcast socket event safely ───────────────────────────────────

function safeEmit(io, room, event, data) {
  try {
    if (io) {
      io.to(room).emit(event, data);
    }
  } catch (err) {
    console.warn(`Socket emit failed for ${event}:`, err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /messages
// ─────────────────────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { conversationId, content, type = 'text', replyTo } = req.body;

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_CONVERSATION_ID 
      });
    }

    const trimmed = String(content ?? '').trim();
    if (!trimmed) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.CONTENT_REQUIRED 
      });
    }
    if (trimmed.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.CONTENT_TOO_LONG 
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: ERROR_MESSAGES.CONVERSATION_NOT_FOUND 
      });
    }

    if (conversation.status === 'declined') {
      return res.status(403).json({ 
        success: false, 
        message: ERROR_MESSAGES.DECLINED 
      });
    }

    if (
      conversation.status === 'request' &&
      conversation.requestedBy &&
      conversation.requestedBy.toString() !== senderId.toString()
    ) {
      return res.status(403).json({ 
        success: false, 
        message: ERROR_MESSAGES.ACCEPT_FIRST 
      });
    }

    let replyToId = null;
    if (replyTo && isValidObjectId(replyTo)) {
      const parentMessage = await Message.findOne({
        _id: replyTo,
        conversationId: conversationId,
      });
      if (parentMessage) {
        replyToId = replyTo;
      }
    }

    const message = await Message.create({
      conversationId,
      sender: senderId,
      content: trimmed,
      type,
      status: 'sent',
      replyTo: replyToId,
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;

    if (conversation.deletedFor) {
      conversation.deletedFor = conversation.deletedFor.filter(
        (u) => u.toString() !== senderId.toString()
      );
    }

    if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
    for (const participantId of conversation.participants) {
      if (participantId.toString() === senderId.toString()) continue;
      const current = conversation.unreadCounts.get(participantId.toString()) ?? 0;
      conversation.unreadCounts.set(participantId.toString(), current + 1);
    }
    conversation.markModified('unreadCounts');
    await conversation.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'name avatar role')
      .populate({
        path: 'replyTo',
        select: 'content type sender createdAt',
        populate: { path: 'sender', select: 'name avatar' },
      })
      .lean();

    const convRoom = `conv:${conversationId}`;
    const messageData = {
      message: populated,
      conversationId,
    };

    safeEmit(req.io, convRoom, 'chat:new_message', messageData);

    for (const participantId of conversation.participants) {
      if (participantId.toString() === senderId.toString()) continue;
      safeEmit(req.io, `user:${participantId}`, 'chat:new_message', messageData);
    }

    // 🔔 NOTIFICATION: Send push to other participants
    (async () => {
      try {
        for (const participantId of conversation.participants) {
          if (participantId.toString() === senderId.toString()) continue;
          await notificationService.create({
            recipient: participantId,
            actor: senderId,
            type: 'new_message',
            title: 'New message',
            body: trimmed.length > 60 ? trimmed.slice(0, 57) + '...' : trimmed,
            data: {
              entityType: 'Conversation',
              entityId: conversationId,
              screen: 'ChatDetail',
              params: { conversationId }
            },
            priority: 'high',
            channels: { inApp: false, push: true, email: false }
          });
        }
      } catch (notifErr) {
        console.warn('[Notification] Non-critical error:', notifErr.message);
      }
    })();
    // END NOTIFICATION

    return res.status(201).json({ 
      success: true, 
      data: populated 
    });
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /messages/:conversationId
// ─────────────────────────────────────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const skip = (page - 1) * limit;

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_CONVERSATION_ID 
      });
    }

    const conversation = await Conversation.exists({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ 
        success: false, 
        message: ERROR_MESSAGES.NOT_PARTICIPANT 
      });
    }

    const query = {
      conversationId,
      deletedFor: { $ne: userId },
    };

    const [messages, total] = await Promise.all([
      Message.find(query)
        .populate('sender', 'name avatar role')
        .populate({
          path: 'replyTo',
          select: 'content type sender createdAt deletedAt',
          populate: { path: 'sender', select: 'name avatar' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('getMessages error:', err);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /messages/:messageId
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;
    const { deleteFor = 'me' } = req.body;

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_MESSAGE_ID 
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: ERROR_MESSAGES.MESSAGE_NOT_FOUND 
      });
    }

    const isParticipant = await Conversation.exists({
      _id: message.conversationId,
      participants: userId,
    });

    if (!isParticipant) {
      return res.status(403).json({ 
        success: false, 
        message: ERROR_MESSAGES.NOT_PARTICIPANT 
      });
    }

    if (deleteFor === 'everyone') {
      if (message.sender.toString() !== userId.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: ERROR_MESSAGES.NOT_SENDER 
        });
      }

      const ageMs = Date.now() - new Date(message.createdAt).getTime();
      if (ageMs > DELETE_EVERYONE_WINDOW_MS) {
        return res.status(400).json({ 
          success: false, 
          message: ERROR_MESSAGES.DELETE_WINDOW_EXPIRED 
        });
      }

      message.type = 'deleted';
      message.content = null;
      message.deletedAt = new Date();
      message.deletedBy = userId;
      await message.save();

      safeEmit(req.io, `conv:${message.conversationId}`, 'chat:message_deleted', {
        messageId: messageId,
        conversationId: message.conversationId.toString(),
        deletedFor: 'everyone',
      });

    } else {
      if (!message.deletedFor) message.deletedFor = [];
      if (!message.deletedFor.some((u) => u.toString() === userId.toString())) {
        message.deletedFor.push(userId);
      }
      await message.save();
    }

    return res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('deleteMessage error:', err);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};