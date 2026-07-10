// server/src/models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Who receives this notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Who triggered this notification (null for system)
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Notification classification
  type: {
    type: String,
    required: true,
    enum: [
      // Social
      'new_follower', 'new_connection', 'post_liked', 'post_reacted',
      'post_comment', 'comment_reply', 'post_mentioned', 'comment_mentioned', 'post_shared',
      // Messaging
      'new_message', 'message_request', 'message_request_accepted',
      // Jobs
      'new_job_match', 'application_received', 'application_status',
      'application_shortlisted', 'application_rejected', 'offer_made',
      // Tenders/Bids
      'bid_received', 'bid_status_changed', 'bid_shortlisted',
      'bid_awarded', 'bid_rejected', 'bid_revealed', 'tender_addendum', 'tender_invited',
      // Proposals
      'proposal_received', 'proposal_status', 'proposal_shortlisted',
      'proposal_awarded', 'proposal_rejected',
      // Verification
      'verification_submitted', 'verification_status',
      'verification_approved', 'verification_rejected',
      // Appointments
      'appointment_confirmed', 'appointment_reminder',
      'appointment_cancelled', 'new_appointment_admin',
      // Referrals
      'referral_signup', 'referral_completed', 'reward_earned',
      // System
      'system_announcement', 'profile_view'
    ],
    index: true
  },

  // Human-readable title and body
  title: { type: String, required: true, maxlength: 120 },
  body: { type: String, required: true, maxlength: 500 },

  // Deep-link data for mobile navigation
  data: {
    entityType: {
      type: String,
      enum: [
        'Job', 'Application', 'Post', 'Comment', 'Message',
        'Conversation', 'User', 'Company', 'Organization',
        'Tender', 'FreelanceTender', 'Bid', 'Proposal',
        'Appointment', 'PromoCode', null
      ],
      default: null
    },
    entityId: { type: String, default: null },
    screen: { type: String, default: null },
    params: { type: mongoose.Schema.Types.Mixed, default: {} }
  },

  // Delivery channels
  channels: {
    inApp: { type: Boolean, default: true },
    push: { type: Boolean, default: false },
    email: { type: Boolean, default: false }
  },

  // State
  read: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },

  // Delivery state
  delivered: {
    push: { type: Boolean, default: false },
    email: { type: Boolean, default: false }
  },
  deliveredAt: {
    push: { type: Date, default: null },
    email: { type: Date, default: null }
  },

  // Priority: critical > high > normal > low
  priority: {
    type: String,
    enum: ['critical', 'high', 'normal', 'low'],
    default: 'normal',
    index: true
  },

  // Grouping key
  groupKey: { type: String, default: null, index: true },

  // When the underlying entity expires
  expiresAt: { type: Date, default: null },

  // Soft delete
  deleted: { type: Boolean, default: false, index: true }

}, {
  timestamps: true,
});

// ── Indexes ──────────────────────────────────────────────────────────
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, deleted: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // 90-day TTL

// ── Virtuals ─────────────────────────────────────────────────────────
NotificationSchema.virtual('isExpired').get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

module.exports = mongoose.model('Notification', NotificationSchema);