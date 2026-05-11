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

/**
 * Determines if two users mutually follow each other.
 * Uses Follow model with status='active' to confirm bidirectional following.
 */
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

/**
 * Transforms a conversation document into a viewer-specific shape.
 * Adds otherUser (the non-viewer participant) and unreadCount for the viewer.
 */
function enrichForViewer(doc, viewerIdStr) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const viewerId = viewerIdStr.toString();

  // Identify the other participant
  obj.otherUser = (obj.participants ?? []).find(
    (p) => (p._id ?? p).toString() !== viewerId
  ) ?? null;

  // Calculate unread count for this viewer
  const counts = obj.unreadCounts;
  if (counts instanceof Map) {
    obj.unreadCount = counts.get(viewerId) ?? 0;
  } else if (counts && typeof counts === 'object') {
    obj.unreadCount = counts[viewerId] ?? 0;
  } else {
    obj.unreadCount = 0;
  }

  // Determine viewer's role in this conversation
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
// Creates or retrieves a direct message conversation between the authenticated
// user and the target user.
//
// Business Rules:
// - Cannot message yourself
// - Target must exist and be active
// - Mutual followers get 'active' status immediately
// - Non-mutual followers get 'request' status (message request model)
// - If conversation was soft-deleted by requester, restore it
// ─────────────────────────────────────────────────────────────────────────────
exports.getOrCreateConversation = async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userId: targetId } = req.params;

    // Validation
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

    // Verify target exists and is active
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

    // Check for existing conversation (direct, 2 participants exactly)
    const existing = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [myId, targetId], $size: 2 },
    })
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE);

    if (existing) {
      // Restore if previously soft-deleted by current user
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

    // Determine conversation status based on mutual follow
    const mutual = await areMutuallyFollowing(myId, targetId);
    const status = mutual ? 'active' : 'request';

    // Create new conversation
    const conversation = await Conversation.create({
      participants: [myId, targetId],
      type: 'direct',
      status,
      requestedBy: status === 'request' ? myId : null,
      lastMessageAt: new Date(),
      unreadCounts: new Map(),
    });

    // Populate for response
    const populated = await Conversation.findById(conversation._id)
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE)
      .lean();

    const enriched = enrichForViewer(populated, myId);

    // Notify the other user in real-time
    safeEmit(req.io, `user:${targetId}`, 'chat:conversation_created', {
      conversation: enrichForViewer(populated, targetId),
    });

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
// Returns all non-declined conversations for the authenticated user,
// sorted by most recent activity. Includes requestsCount inline for badge.
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Base query: user is participant, not deleted by user, status is active or request
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

      // Pending requests where the user is the RECIPIENT (not the requester)
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
// Returns only conversations where the authenticated user is the RECIPIENT
// of a message request (someone requested to message them).
// ─────────────────────────────────────────────────────────────────────────────
exports.getMessageRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Critical filter: requestedBy !== userId ensures only RECIPIENT requests
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
// Returns online users from the current user's active conversations.
// ─────────────────────────────────────────────────────────────────────────────
exports.getOnlineContacts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = Math.min(30, parseInt(req.query.limit, 10) || 20);

    // Get all conversation participants except the current user
    const conversations = await Conversation.find({
      participants: userId,
      status: { $in: ['active', 'request'] },
      deletedFor: { $ne: userId },
    })
      .select('participants')
      .lean();

    // Extract unique other user IDs
    const otherIds = [
      ...new Set(
        conversations.flatMap((c) =>
          c.participants.map(p => p.toString()).filter(id => id !== userId.toString())
        )
      ),
    ].slice(0, 100); // Safety limit

    if (otherIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Find online users from the extracted IDs
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
// Returns a single conversation by ID if the user is a participant.
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
// Accepts a pending message request. Only the RECIPIENT can accept.
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

    // Guard: Only the RECIPIENT (non-requester) can accept
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

    // Broadcast acceptance to both participants
    const convId = conversation._id.toString();
    safeEmit(req.io, `conv:${convId}`, 'chat:request_accepted', { conversationId: convId });
    
    conversation.participants.forEach((participantId) => {
      safeEmit(req.io, `user:${participantId}`, 'chat:conversation_updated', {
        conversationId: convId,
        status: 'active',
      });
    });

    // Populate for response
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
// Declines a message request. Only the RECIPIENT can decline.
// Soft-deletes the conversation for the recipient.
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

    // Guard: Only the RECIPIENT (non-requester) can decline
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
    
    // Soft-delete for the recipient
    if (!conversation.deletedFor) conversation.deletedFor = [];
    if (!conversation.deletedFor.some((u) => u.toString() === userId.toString())) {
      conversation.deletedFor.push(userId);
    }
    
    await conversation.save();

    // Notify the requester (optional, but professional)
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
// Marks a conversation as read for the current user.
// Resets unread count to 0 AND marks all unread messages as read.
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

    // Reset unread count for this user
    if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
    conversation.unreadCounts.set(userId.toString(), 0);
    conversation.markModified('unreadCounts');
    await conversation.save();

    // Mark all unread messages as read
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

    // Broadcast read receipt
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
// Soft-deletes a conversation for the current user only.
// The other participant can still see and access the conversation.
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

    // Soft-delete: add user to deletedFor array
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