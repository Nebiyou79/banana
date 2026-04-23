/**
 * server/src/models/Conversation.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Conversation Model (NEW)
 *
 * A Conversation is a DM channel between two users. Group chats are not in
 * v2 scope (the `type` enum has `direct` only — we keep it open for future
 * `group` support).
 *
 * Status lifecycle:
 *  - active:   both users can send freely.
 *  - request:  the target has not accepted yet. The requester can still send,
 *              but `getMyConversations(status='active')` won't return it for
 *              the target until the target accepts (or replies).
 *  - declined: target pressed Decline. Hidden from both sides until unblocked.
 *
 * Unread counts are stored as a Map<userId, count>. On each new message we
 * bump the count for every participant except the sender; markAsRead resets.
 * ────────────────────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    type: {
      type: String,
      enum: ['direct'],
      default: 'direct',
    },
    status: {
      type: String,
      enum: ['active', 'request', 'declined'],
      default: 'active',
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── INDEXES ────────────────────────────────────────────────────────────────
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ participants: 1, status: 1 });

// ── INSTANCE METHODS ──────────────────────────────────────────────────────

conversationSchema.methods.addParticipant = function (userId) {
  const exists = this.participants.some(
    (p) => p.toString() === userId.toString()
  );
  if (!exists) this.participants.push(userId);
  return this.save();
};

conversationSchema.methods.markReadFor = function (userId) {
  if (!this.unreadCounts) this.unreadCounts = new Map();
  this.unreadCounts.set(userId.toString(), 0);
  this.markModified('unreadCounts');
  return this.save();
};

conversationSchema.methods.incrementUnread = function (userId, amount = 1) {
  if (!this.unreadCounts) this.unreadCounts = new Map();
  const key = userId.toString();
  const current = this.unreadCounts.get(key) ?? 0;
  this.unreadCounts.set(key, current + amount);
  this.markModified('unreadCounts');
  return this.save();
};

/**
 * Return the other participant in a DM from `userId`'s perspective.
 */
conversationSchema.methods.otherParticipantId = function (userId) {
  const me = userId.toString();
  return this.participants.find((p) => p.toString() !== me) || null;
};

// ── STATIC METHODS ────────────────────────────────────────────────────────

/**
 * Find an existing DM between two users, or create a new one.
 * Caller is responsible for setting status + requestedBy based on connection.
 */
conversationSchema.statics.findOrCreate = async function (
  user1Id,
  user2Id,
  opts = {}
) {
  const existing = await this.findOne({
    type: 'direct',
    participants: { $all: [user1Id, user2Id], $size: 2 },
  });

  if (existing) return { conversation: existing, created: false };

  const created = await this.create({
    participants: [user1Id, user2Id],
    type: 'direct',
    status: opts.status || 'active',
    requestedBy: opts.requestedBy || null,
    lastMessageAt: new Date(),
    unreadCounts: new Map(),
  });

  return { conversation: created, created: true };
};

/**
 * Paginated list of conversations for a user.
 */
conversationSchema.statics.getForUser = async function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    status = 'active',
  } = options;

  const skip = (page - 1) * limit;

  const query = {
    participants: userId,
    deletedFor: { $ne: userId },
  };
  if (status) query.status = status;

  const [docs, total] = await Promise.all([
    this.find(query)
      .populate(
        'participants',
        'name avatar role headline lastSeen isOnline verificationStatus'
      )
      .populate({
        path: 'lastMessage',
        select: 'content type sender createdAt readBy deletedAt',
      })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query),
  ]);

  return {
    docs,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
  };
};

module.exports = mongoose.model('Conversation', conversationSchema);