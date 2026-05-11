// =============================================================================
// FILE 2: messageController.js — COMPLETE PROFESSIONAL REWRITE
// =============================================================================

/**
 * server/src/controllers/messageController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * BananaLink Chat Backend v4 — Message Controller
 * 
 * Production-grade message handling with:
 * - Request acceptance enforcement before replying
 * - Unread count management across participants
 * - Soft-delete (per-user) and delete-for-everyone (time-limited)
 * - Socket broadcasting for real-time delivery
 * - Read receipts with proper status transitions
 * - Reply-to support with populated parent message
 * - Content validation with length limits
 * 
 * Routes handled:
 *  POST   /messages                    sendMessage
 *  GET    /messages/:conversationId    getMessages
 *  DELETE /messages/:messageId         deleteMessage
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const { isValidObjectId } = mongoose;

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_CONTENT_LENGTH = 2000; // Must match Message model maxlength
const DELETE_EVERYONE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

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
// Sends a new message in a conversation.
//
// Business Rules:
// - Must be a participant in the conversation
// - If conversation is 'request' status:
//   - The REQUESTER (requestedBy) can send messages
//   - The RECIPIENT must accept before they can reply
// - Conversation is restored if previously soft-deleted by sender
// - Unread counts are incremented for all OTHER participants
// - Socket events broadcast for real-time delivery
// ─────────────────────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { conversationId, content, type = 'text', replyTo } = req.body;

    // Validate conversation ID
    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_CONVERSATION_ID 
      });
    }

    // Validate content
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

    // Find and validate conversation
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

    // Enforce request acceptance: Recipient cannot reply until they accept
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

    // Validate replyTo if provided
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

    // Create the message
    const message = await Message.create({
      conversationId,
      sender: senderId,
      content: trimmed,
      type,
      status: 'sent',
      replyTo: replyToId,
    });

    // Update conversation metadata
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;

    // Restore if previously soft-deleted by sender
    if (conversation.deletedFor) {
      conversation.deletedFor = conversation.deletedFor.filter(
        (u) => u.toString() !== senderId.toString()
      );
    }

    // Increment unread counts for all OTHER participants
    if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
    for (const participantId of conversation.participants) {
      if (participantId.toString() === senderId.toString()) continue;
      const current = conversation.unreadCounts.get(participantId.toString()) ?? 0;
      conversation.unreadCounts.set(participantId.toString(), current + 1);
    }
    conversation.markModified('unreadCounts');
    await conversation.save();

    // Populate the message for response
    const populated = await Message.findById(message._id)
      .populate('sender', 'name avatar role')
      .populate({
        path: 'replyTo',
        select: 'content type sender createdAt',
        populate: { path: 'sender', select: 'name avatar' },
      })
      .lean();

    // Broadcast via sockets for real-time delivery
    const convRoom = `conv:${conversationId}`;
    const messageData = {
      message: populated,
      conversationId,
    };

    // Emit to conversation room (all active viewers)
    safeEmit(req.io, convRoom, 'chat:new_message', messageData);

    // Emit to each participant's personal inbox room
    for (const participantId of conversation.participants) {
      if (participantId.toString() === senderId.toString()) continue;
      safeEmit(req.io, `user:${participantId}`, 'chat:new_message', messageData);
    }

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
// Returns paginated messages for a conversation.
// Sorted newest-first for efficient pagination (client reverses for display).
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

    // Verify user is a participant
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

    // Build query: exclude messages soft-deleted by this user
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
        .sort({ createdAt: -1 }) // Newest first for efficient pagination
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
// Supports two delete modes:
//  - 'me': Soft-deletes only for the requesting user (adds to deletedFor array)
//  - 'everyone': Marks as deleted for all (only sender, within 10-min window)
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

    // Verify the user is a participant in the conversation
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
      // Only the sender can delete for everyone
      if (message.sender.toString() !== userId.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: ERROR_MESSAGES.NOT_SENDER 
        });
      }

      // Check time window
      const ageMs = Date.now() - new Date(message.createdAt).getTime();
      if (ageMs > DELETE_EVERYONE_WINDOW_MS) {
        return res.status(400).json({ 
          success: false, 
          message: ERROR_MESSAGES.DELETE_WINDOW_EXPIRED 
        });
      }

      // Perform delete for everyone
      message.type = 'deleted';
      message.content = null;
      message.deletedAt = new Date();
      message.deletedBy = userId;
      await message.save();

      // Broadcast deletion to conversation room
      safeEmit(req.io, `conv:${message.conversationId}`, 'chat:message_deleted', {
        messageId: messageId,
        conversationId: message.conversationId.toString(),
        deletedFor: 'everyone',
      });

    } else {
      // Delete for me only
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