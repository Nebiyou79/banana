/**
 * server/src/models/Message.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Message Model (NEW)
 *
 * Delete semantics:
 *  - "Delete for me": push sender's id to `deletedFor` array — hidden only on
 *    that user's client. No content change, no socket emit.
 *  - "Delete for everyone": only allowed by the sender, only within 2 hours
 *    of send (`canDeleteUntil`). Sets type='deleted', clears content,
 *    broadcasts `chat:message_deleted`.
 *
 * Status lifecycle: sent → delivered → read.
 *  - sent:      just inserted server-side.
 *  - delivered: recipient's socket acknowledged receipt.
 *  - read:      recipient explicitly marked as read (opened the conversation).
 * ────────────────────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');

const DELETE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

const readReceiptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: function () {
        return this.type !== 'deleted';
      },
      maxlength: 2000,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'emoji', 'image', 'system', 'deleted'],
      default: 'text',
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readBy: [readReceiptSchema],
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Who has done "delete for me" on this message.
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    canDeleteUntil: { type: Date, default: null },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  { timestamps: true }
);

// ── INDEXES ────────────────────────────────────────────────────────────────
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// ── HOOKS ──────────────────────────────────────────────────────────────────
messageSchema.pre('save', function (next) {
  if (this.isNew) {
    this.canDeleteUntil = new Date(Date.now() + DELETE_WINDOW_MS);
  }
  next();
});

// ── INSTANCE METHODS ──────────────────────────────────────────────────────

/**
 * Can `userId` delete-for-everyone this message?
 * - Must be the sender.
 * - Must be within the canDeleteUntil window.
 * - Must not already be deleted.
 */
messageSchema.methods.canBeDeletedBy = function (userId) {
  if (!userId) return false;
  if (this.type === 'deleted') return false;
  if (this.sender.toString() !== userId.toString()) return false;
  if (!this.canDeleteUntil) return false;
  return Date.now() < new Date(this.canDeleteUntil).getTime();
};

messageSchema.methods.markDeletedForEveryone = function (userId) {
  this.type = 'deleted';
  this.content = null;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

messageSchema.methods.markDeletedForMe = function (userId) {
  const uid = userId.toString();
  if (!this.deletedFor.some((u) => u.toString() === uid)) {
    this.deletedFor.push(userId);
  }
  return this.save();
};

messageSchema.methods.markReadBy = function (userId) {
  const uid = userId.toString();
  const already = this.readBy?.some((r) => r.user?.toString() === uid);
  if (!already) {
    this.readBy.push({ user: userId, readAt: new Date() });
  }
  this.status = 'read';
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);