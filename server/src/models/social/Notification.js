const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'like',
      'comment',
      'follow',
      'mention',
      'share',
      'connection_request',
      'job_match',
      'application_update'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application'
    }
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date

}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ type: 1 });

// Virtual for isNew
notificationSchema.virtual('isNew').get(function() {
  return !this.read;
});

// Pre-save middleware to set title based on type
notificationSchema.pre('save', function(next) {
  if (!this.title) {
    const titles = {
      like: 'New Like',
      comment: 'New Comment',
      follow: 'New Follower',
      mention: 'You were mentioned',
      share: 'Post Shared',
      connection_request: 'Connection Request',
      job_match: 'Job Match',
      application_update: 'Application Update'
    };
    this.title = titles[this.type] || 'Notification';
  }
  next();
});

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { 
      read: true,
      readAt: new Date()
    }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

module.exports = mongoose.model('Notification', notificationSchema);