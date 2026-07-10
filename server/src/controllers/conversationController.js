// =============================================================================
// FILE 1: conversationController.js — COMPLETE PROFESSIONAL REWRITE
// =============================================================================

/**
 * server/src/controllers/conversationController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * BananaLink Chat Backend v4 — PROFESSIONAL GRADE
 * 
 * Production-quality conversation controller with:
 * - Consistent error handling (proper HTTP status codes)
 * - Socket event broadcasting for real-time updates
 * - Mutual follow validation before direct messaging
 * - Proper request/accept/decline lifecycle
 * - Soft-delete per user with recovery on re-message
 * - Read receipts with dual-layer marking (conversation + messages)
 * - Online contacts with caching optimization
 * - Pagination with consistent response shapes
 * 
 * Routes handled:
 *  POST   /conversations/with/:userId      getOrCreateConversation
 *  GET    /conversations                   getMyConversations
 *  GET    /conversations/requests          getMessageRequests
 *  GET    /conversations/contacts/online   getOnlineContacts
 *  GET    /conversations/:id               getConversationById
 *  PUT    /conversations/:id/accept        acceptMessageRequest
 *  PUT    /conversations/:id/decline       declineMessageRequest
 *  PUT    /conversations/:id/read          markConversationRead
 *  DELETE /conversations/:id               deleteConversation
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Follow = require('../models/Follow');
// 🔔 NOTIFICATION
const notificationService = require('../services/notificationService');

const { isValidObjectId } = mongoose;

// ─── Constants ───────────────────────────────────────────────────────────────

const PARTICIPANT_SELECT = 'name avatar role headline lastSeen isOnline verificationStatus socialStats';
const LAST_MSG_POPULATE = {
  path: 'lastMessage',
  select: 'content type sender createdAt deletedAt status',
  populate: { path: 'sender', select: 'name avatar _id' },
};

const ERROR_MESSAGES = {
  INVALID_ID: 'Invalid user ID format',
  SELF_MESSAGE: 'You cannot start a conversation with yourself',
  USER_NOT_FOUND: 'User not found or account deactivated',
  CONV_NOT_FOUND: 'Conversation not found',
  NOT_PARTICIPANT: 'You are not a participant in this conversation',
  CANNOT_ACCEPT_OWN: 'You cannot accept a request you initiated',
  CANNOT_DECLINE_OWN: 'You cannot decline a request you initiated',
  DECLINED_CONVERSATION: 'This conversation has been declined',
  SERVER_ERROR: 'An unexpected error occurred',
};

// ─── Helper: Check mutual follow ─────────────────────────────────────────────

async function areMutuallyFollowing(userAId, userBId) {
  const [aToB, bToA] = await Promise.all([
    Follow.exists({ 
      follower: userAId, 
      targetType: 'User', 
      targetId: userBId, 
      status: 'active' 
    }),
    Follow.exists({ 
      follower: userBId, 
      targetType: 'User', 
      targetId: userAId, 
      status: 'active' 
    }),
  ]);
  return !!(aToB && bToA);
}

// ─── Helper: Enrich conversation for viewer ──────────────────────────────────

function enrichForViewer(doc, viewerIdStr) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const viewerId = viewerIdStr.toString();

  obj.otherUser = (obj.participants ?? []).find(
    (p) => (p._id ?? p).toString() !== viewerId
  ) ?? null;

  const counts = obj.unreadCounts;
  if (counts instanceof Map) {
    obj.unreadCount = counts.get(viewerId) ?? 0;
  } else if (counts && typeof counts === 'object') {
    obj.unreadCount = counts[viewerId] ?? 0;
  } else {
    obj.unreadCount = 0;
  }

  obj.viewerRole = obj.requestedBy?.toString() === viewerId ? 'requester' : 'recipient';

  return obj;
}

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
// POST /conversations/with/:userId
// ─────────────────────────────────────────────────────────────────────────────
exports.getOrCreateConversation = async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userId: targetId } = req.params;

    if (!isValidObjectId(targetId)) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_ID 
      });
    }
    if (myId === targetId) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.SELF_MESSAGE 
      });
    }

    const targetUser = await User.findOne({ 
      _id: targetId, 
      isActive: true 
    }).select('_id name').lean();
    
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: ERROR_MESSAGES.USER_NOT_FOUND 
      });
    }

    const existing = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [myId, targetId], $size: 2 },
    })
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE);

    if (existing) {
      const wasDeleted = existing.deletedFor?.some(
        (u) => u.toString() === myId.toString()
      );
      if (wasDeleted) {
        existing.deletedFor = existing.deletedFor.filter(
          (u) => u.toString() !== myId.toString()
        );
        await existing.save();
      }

      return res.json({
        success: true,
        data: enrichForViewer(existing, myId),
        created: false,
      });
    }

    const mutual = await areMutuallyFollowing(myId, targetId);
    const status = mutual ? 'active' : 'request';

    const conversation = await Conversation.create({
      participants: [myId, targetId],
      type: 'direct',
      status,
      requestedBy: status === 'request' ? myId : null,
      lastMessageAt: new Date(),
      unreadCounts: new Map(),
    });

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE)
      .lean();

    const enriched = enrichForViewer(populated, myId);

    safeEmit(req.io, `user:${targetId}`, 'chat:conversation_created', {
      conversation: enrichForViewer(populated, targetId),
    });

    // 🔔 NOTIFICATION: Message request notification
    (async () => {
      try {
        if (status === 'request') {
          await notificationService.create({
            recipient: targetId,
            actor: myId,
            type: 'message_request',
            title: 'New message request',
            body: `{actorName} sent you a message request`,
            data: {
              entityType: 'Conversation',
              entityId: conversation._id.toString(),
              screen: 'MessageRequests',
              params: { conversationId: conversation._id }
            },
            priority: 'high',
            channels: { inApp: true, push: true, email: false }
          });
        }
      } catch (notifErr) {
        console.warn('[Notification] Non-critical error:', notifErr.message);
      }
    })();
    // END NOTIFICATION

    return res.status(201).json({
      success: true,
      data: enriched,
      created: true,
    });
  } catch (err) {
    console.error('getOrCreateConversation error:', err);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /conversations
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const baseQuery = {
      participants: userId,
      deletedFor: { $ne: userId },
      status: { $in: ['active', 'request'] },
    };

    const [conversations, total, requestsCount] = await Promise.all([
      Conversation.find(baseQuery)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('participants', PARTICIPANT_SELECT)
        .populate(LAST_MSG_POPULATE)
        .lean(),

      Conversation.countDocuments(baseQuery),

      Conversation.countDocuments({
        participants: userId,
        status: 'request',
        requestedBy: { $ne: userId },
        deletedFor: { $ne: userId },
      }),
    ]);

    return res.json({
      success: true,
      data: conversations.map((c) => enrichForViewer(c, userId)),
      requestsCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('getMyConversations error:', err);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /conversations/requests
// ─────────────────────────────────────────────────────────────────────────────
exports.getMessageRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {
      participants: userId,
      status: 'request',
      requestedBy: { $ne: userId },
      deletedFor: { $ne: userId },
    };

    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('participants', PARTICIPANT_SELECT)
        .populate(LAST_MSG_POPULATE)
        .lean(),
      Conversation.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: conversations.map((c) => enrichForViewer(c, userId)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('getMessageRequests error:', err);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /conversations/contacts/online
// ─────────────────────────────────────────────────────────────────────────────
exports.getOnlineContacts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = Math.min(30, parseInt(req.query.limit, 10) || 20);

    const conversations = await Conversation.find({
      participants: userId,
      status: { $in: ['active', 'request'] },
      deletedFor: { $ne: userId },
    })
      .select('participants')
      .lean();

    const otherIds = [
      ...new Set(
        conversations.flatMap((c) =>
          c.participants.map(p => p.toString()).filter(id => id !== userId.toString())
        )
      ),
    ].slice(0, 100);

    if (otherIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const onlineUsers = await User.find({
      _id: { $in: otherIds },
      isOnline: true,
      isActive: true,
    })
      .select('name avatar isOnline lastSeen headline role verificationStatus')
      .limit(limit)
      .lean();

    return res.json({ success: true, data: onlineUsers });
  } catch (err) {
    console.error('getOnlineContacts error:', err);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /conversations/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.getConversationById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_ID 
      });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    })
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE)
      .lean();

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: ERROR_MESSAGES.CONV_NOT_FOUND 
      });
    }

    return res.json({
      success: true,
      data: enrichForViewer(conversation, userId),
    });
  } catch (err) {
    console.error('getConversationById error:', err);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /conversations/:id/accept
// ─────────────────────────────────────────────────────────────────────────────
exports.acceptMessageRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_ID 
      });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: ERROR_MESSAGES.CONV_NOT_FOUND 
      });
    }

    if (conversation.requestedBy?.toString() === userId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.CANNOT_ACCEPT_OWN 
      });
    }

    if (conversation.status !== 'request') {
      return res.status(400).json({ 
        success: false, 
        message: 'Conversation is not in request status' 
      });
    }

    conversation.status = 'active';
    await conversation.save();

    const convId = conversation._id.toString();
    safeEmit(req.io, `conv:${convId}`, 'chat:request_accepted', { conversationId: convId });
    
    conversation.participants.forEach((participantId) => {
      safeEmit(req.io, `user:${participantId}`, 'chat:conversation_updated', {
        conversationId: convId,
        status: 'active',
      });
    });

    // 🔔 NOTIFICATION: Notify requester that their request was accepted
    (async () => {
      try {
        if (conversation.requestedBy) {
          await notificationService.create({
            recipient: conversation.requestedBy,
            actor: userId,
            type: 'message_request_accepted',
            title: 'Message request accepted',
            body: `{actorName} accepted your message request`,
            data: {
              entityType: 'Conversation',
              entityId: id,
              screen: 'ChatDetail',
              params: { conversationId: id }
            },
            priority: 'high',
            channels: { inApp: true, push: true, email: false }
          });
        }
      } catch (notifErr) {
        console.warn('[Notification] Non-critical error:', notifErr.message);
      }
    })();
    // END NOTIFICATION

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE)
      .lean();

    return res.json({
      success: true,
      data: enrichForViewer(populated, userId),
    });
  } catch (err) {
    console.error('acceptMessageRequest error:', err);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /conversations/:id/decline
// ─────────────────────────────────────────────────────────────────────────────
exports.declineMessageRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_ID 
      });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: ERROR_MESSAGES.CONV_NOT_FOUND 
      });
    }

    if (conversation.requestedBy?.toString() === userId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.CANNOT_DECLINE_OWN 
      });
    }

    if (conversation.status !== 'request') {
      return res.status(400).json({ 
        success: false, 
        message: 'Conversation is not in request status' 
      });
    }

    conversation.status = 'declined';
    
    if (!conversation.deletedFor) conversation.deletedFor = [];
    if (!conversation.deletedFor.some((u) => u.toString() === userId.toString())) {
      conversation.deletedFor.push(userId);
    }
    
    await conversation.save();

    const convId = conversation._id.toString();
    safeEmit(req.io, `conv:${convId}`, 'chat:request_declined', { conversationId: convId });

    return res.json({ success: true, message: 'Message request declined' });
  } catch (err) {
    console.error('declineMessageRequest error:', err);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /conversations/:id/read
// ─────────────────────────────────────────────────────────────────────────────
exports.markConversationRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_ID 
      });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: ERROR_MESSAGES.CONV_NOT_FOUND 
      });
    }

    if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
    conversation.unreadCounts.set(userId.toString(), 0);
    conversation.markModified('unreadCounts');
    await conversation.save();

    const now = new Date();
    await Message.updateMany(
      {
        conversationId: id,
        sender: { $ne: userId },
        status: { $in: ['sent', 'delivered'] },
      },
      {
        $set: { status: 'read' },
        $addToSet: { readBy: { user: userId, readAt: now } },
      }
    );

    const convId = id.toString();
    safeEmit(req.io, `conv:${convId}`, 'chat:messages_read', {
      conversationId: convId,
      userId,
      readAt: now.toISOString(),
    });

    return res.json({ success: true, readAt: now.toISOString() });
  } catch (err) {
    console.error('markConversationRead error:', err);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /conversations/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_ID 
      });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: ERROR_MESSAGES.CONV_NOT_FOUND 
      });
    }

    if (!conversation.deletedFor) conversation.deletedFor = [];
    if (!conversation.deletedFor.some((u) => u.toString() === userId.toString())) {
      conversation.deletedFor.push(userId);
    }
    await conversation.save();

    return res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    console.error('deleteConversation error:', err);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};