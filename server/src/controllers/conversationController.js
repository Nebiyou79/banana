/**
 * server/src/controllers/conversationController.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Conversation Controller (NEW)
 *
 * Endpoint map (wired in conversationRoutes.js):
 *   POST   /conversations/with/:userId      → getOrCreateConversation
 *   GET    /conversations                   → getMyConversations  (?status=active|request)
 *   GET    /conversations/requests          → getMessageRequests
 *   GET    /conversations/contacts/online   → getOnlineContacts
 *   GET    /conversations/:id               → getConversationById
 *   PUT    /conversations/:id/accept        → acceptMessageRequest
 *   PUT    /conversations/:id/decline       → declineMessageRequest
 *   PUT    /conversations/:id/read          → markAsRead
 *   DELETE /conversations/:id               → deleteConversation
 * ────────────────────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Follow = require('../models/Follow');
const User = require('../models/User');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ──────────────────────────────────────────────────────────────────────────
 * Helper — enrich a conversation doc for the given viewer.
 * Adds `unreadCount` and `otherParticipant` convenience fields.
 * ────────────────────────────────────────────────────────────────────────── */
function enrichForViewer(conv, viewerId) {
  const viewer = viewerId.toString();

  // unreadCounts can be a Map or a plain object depending on .lean() vs doc.
  let unreadCount = 0;
  if (conv?.unreadCounts) {
    if (typeof conv.unreadCounts.get === 'function') {
      unreadCount = conv.unreadCounts.get(viewer) || 0;
    } else if (typeof conv.unreadCounts === 'object') {
      unreadCount = conv.unreadCounts[viewer] || 0;
    }
  }

  const otherParticipant = Array.isArray(conv?.participants)
    ? conv.participants.find(
        (p) => (p?._id ?? p)?.toString() !== viewer
      )
    : null;

  return { ...conv, unreadCount, otherParticipant };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Helper — are two users connected (mutual follow)?
 * ────────────────────────────────────────────────────────────────────────── */
async function areUsersConnected(userAId, userBId) {
  const [a, b] = await Promise.all([
    Follow.findOne({
      follower: userAId,
      targetType: 'User',
      targetId: userBId,
      status: 'active',
    }).select('_id').lean(),
    Follow.findOne({
      follower: userBId,
      targetType: 'User',
      targetId: userAId,
      status: 'active',
    }).select('_id').lean(),
  ]);
  return !!(a && b);
}

/* ──────────────────────────────────────────────────────────────────────────
 * POST /conversations/with/:userId
 * Get-or-create a DM between the current user and :userId.
 * Sets status='active' if they are mutually connected, else 'request'.
 * ────────────────────────────────────────────────────────────────────────── */
exports.getOrCreateConversation = async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid userId' });
    }
    if (myId === userId) {
      return res
        .status(400)
        .json({ success: false, message: 'You cannot message yourself' });
    }

    // Ensure target user exists.
    const targetExists = await User.exists({ _id: userId });
    if (!targetExists) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const existing = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [myId, userId], $size: 2 },
    })
      .populate(
        'participants',
        'name avatar role headline lastSeen isOnline verificationStatus'
      )
      .populate('lastMessage');

    if (existing) {
      // If existed but was previously soft-deleted by me, un-delete for me.
      if (existing.deletedFor?.some((u) => u.toString() === myId)) {
        existing.deletedFor = existing.deletedFor.filter(
          (u) => u.toString() !== myId
        );
        await existing.save();
      }
      return res.json({
        success: true,
        data: enrichForViewer(existing.toObject(), myId),
        created: false,
      });
    }

    const connected = await areUsersConnected(myId, userId);
    const created = await Conversation.create({
      participants: [myId, userId],
      type: 'direct',
      status: connected ? 'active' : 'request',
      requestedBy: connected ? null : myId,
      lastMessageAt: new Date(),
      unreadCounts: new Map(),
    });

    const populated = await Conversation.findById(created._id)
      .populate(
        'participants',
        'name avatar role headline lastSeen isOnline verificationStatus'
      )
      .populate('lastMessage')
      .lean();

    // Notify the other party in real time (if they are online they get a
    // badge immediately; otherwise they'll see it on next fetch).
    try {
      if (req.io) {
        req.io
          .to(`user:${userId}`)
          .emit('chat:conversation_created', {
            conversation: enrichForViewer(populated, userId),
          });
      }
    } catch (_) {
      /* socket optional */
    }

    return res.status(201).json({
      success: true,
      data: enrichForViewer(populated, myId),
      created: true,
    });
  } catch (err) {
    console.error('getOrCreateConversation error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to open conversation' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * GET /conversations
 * Query: ?page=1&limit=20&status=active
 * ────────────────────────────────────────────────────────────────────────── */
exports.getMyConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const status = req.query.status || 'active';

    const { docs, total, pages } = await Conversation.getForUser(userId, {
      page,
      limit,
      status,
    });

    const enriched = docs.map((d) => enrichForViewer(d, userId));

    return res.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, pages },
    });
  } catch (err) {
    console.error('getMyConversations error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to load conversations' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * GET /conversations/requests
 * Returns DMs where the CURRENT user is the recipient of an open request.
 * ────────────────────────────────────────────────────────────────────────── */
exports.getMessageRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;

    const filter = {
      participants: userId,
      status: 'request',
      requestedBy: { $ne: userId },
      deletedFor: { $ne: userId },
    };

    const [docs, total] = await Promise.all([
      Conversation.find(filter)
        .populate(
          'participants',
          'name avatar role headline lastSeen isOnline verificationStatus'
        )
        .populate('lastMessage')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    const enriched = docs.map((d) => enrichForViewer(d, userId));

    return res.json({
      success: true,
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('getMessageRequests error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to load requests' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * GET /conversations/contacts/online
 * Returns users the current user is connected to (mutual follow) who are
 * online OR seen in the last 5 minutes.
 * ────────────────────────────────────────────────────────────────────────── */
exports.getOnlineContacts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);

    const connections = await Follow.getConnections(userId, {
      page: 1,
      limit: 200,
    });

    if (connections.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const ids = connections.map((c) => c._id);

    const onlineUsers = await User.find({
      _id: { $in: ids },
      $or: [
        { isOnline: true },
        { lastSeen: { $gte: fiveMinutesAgo } },
      ],
    })
      .select('name avatar role headline lastSeen isOnline verificationStatus')
      .sort({ isOnline: -1, lastSeen: -1 })
      .limit(limit)
      .lean();

    return res.json({ success: true, data: onlineUsers });
  } catch (err) {
    console.error('getOnlineContacts error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to load online contacts' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * GET /conversations/:id
 * ────────────────────────────────────────────────────────────────────────── */
exports.getConversationById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid conversation id' });
    }

    const conv = await Conversation.findOne({
      _id: id,
      participants: userId,
      deletedFor: { $ne: userId },
    })
      .populate(
        'participants',
        'name avatar role headline lastSeen isOnline verificationStatus'
      )
      .populate('lastMessage')
      .lean();

    if (!conv) {
      return res
        .status(404)
        .json({ success: false, message: 'Conversation not found' });
    }

    return res.json({ success: true, data: enrichForViewer(conv, userId) });
  } catch (err) {
    console.error('getConversationById error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to load conversation' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * PUT /conversations/:id/accept
 * Target accepts an incoming message request → status becomes 'active'.
 * ────────────────────────────────────────────────────────────────────────── */
exports.acceptMessageRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid conversation id' });
    }

    const conv = await Conversation.findOne({
      _id: id,
      participants: userId,
    });
    if (!conv) {
      return res
        .status(404)
        .json({ success: false, message: 'Conversation not found' });
    }

    // Only the non-requester can accept.
    if (conv.requestedBy && conv.requestedBy.toString() === userId) {
      return res
        .status(400)
        .json({ success: false, message: 'Requester cannot accept' });
    }

    conv.status = 'active';
    await conv.save();

    try {
      if (req.io) {
        req.io
          .to(`conv:${conv._id}`)
          .emit('chat:request_accepted', { conversationId: conv._id });
        conv.participants.forEach((p) => {
          req.io
            .to(`user:${p}`)
            .emit('chat:conversation_updated', { conversationId: conv._id });
        });
      }
    } catch (_) {
      /* socket optional */
    }

    return res.json({ success: true, data: conv });
  } catch (err) {
    console.error('acceptMessageRequest error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to accept request' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * PUT /conversations/:id/decline
 * ────────────────────────────────────────────────────────────────────────── */
exports.declineMessageRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid conversation id' });
    }

    const conv = await Conversation.findOne({
      _id: id,
      participants: userId,
    });
    if (!conv) {
      return res
        .status(404)
        .json({ success: false, message: 'Conversation not found' });
    }
    if (conv.requestedBy && conv.requestedBy.toString() === userId) {
      return res
        .status(400)
        .json({ success: false, message: 'Requester cannot decline' });
    }

    conv.status = 'declined';
    // Hide from decliner's inbox.
    if (!conv.deletedFor.some((u) => u.toString() === userId)) {
      conv.deletedFor.push(userId);
    }
    await conv.save();

    return res.json({ success: true, data: conv });
  } catch (err) {
    console.error('declineMessageRequest error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to decline request' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * PUT /conversations/:id/read
 * ────────────────────────────────────────────────────────────────────────── */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid conversation id' });
    }

    const conv = await Conversation.findOne({
      _id: id,
      participants: userId,
    });
    if (!conv) {
      return res
        .status(404)
        .json({ success: false, message: 'Conversation not found' });
    }

    await conv.markReadFor(userId);

    // Update all undelivered/unread messages sent by others in this conv.
    await Message.updateMany(
      {
        conversationId: id,
        sender: { $ne: userId },
        status: { $in: ['sent', 'delivered'] },
      },
      {
        $set: { status: 'read' },
        $addToSet: { readBy: { user: userId, readAt: new Date() } },
      }
    );

    try {
      if (req.io) {
        req.io.to(`conv:${id}`).emit('chat:messages_read', {
          conversationId: id,
          readerId: userId,
          readAt: new Date(),
        });
      }
    } catch (_) {
      /* socket optional */
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to mark as read' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * DELETE /conversations/:id   (soft delete — for me only)
 * ────────────────────────────────────────────────────────────────────────── */
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid conversation id' });
    }

    const conv = await Conversation.findOne({
      _id: id,
      participants: userId,
    });
    if (!conv) {
      return res
        .status(404)
        .json({ success: false, message: 'Conversation not found' });
    }

    if (!conv.deletedFor.some((u) => u.toString() === userId)) {
      conv.deletedFor.push(userId);
    }
    await conv.markReadFor(userId);
    await conv.save();

    return res.json({ success: true });
  } catch (err) {
    console.error('deleteConversation error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to delete conversation' });
  }
};