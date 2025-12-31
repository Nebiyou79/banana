const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  authorModel: {
    type: String,
    enum: ['User', 'Company', 'Organization'],
    default: 'User'
  },
  
  // Content
  content: {
    type: String,
    required: function() {
      return !this.media || this.media.length === 0;
    },
    trim: true,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'link', 'poll', 'job', 'achievement'],
    default: 'text'
  },
  
  // Enhanced Media handling
  media: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video', 'document'],
      required: true
    },
    thumbnail: String,
    description: String,
    order: Number,
    filename: String,
    originalName: String,
    size: Number,
    mimeType: String,
    dimensions: {
      width: Number,
      height: Number
    }
  }],
  
  // Link preview
  linkPreview: {
    url: String,
    title: String,
    description: String,
    image: String,
    domain: String
  },
  
  // Poll
  poll: {
    question: String,
    options: [{
      text: String,
      votes: { type: Number, default: 0 },
      voters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    endsAt: Date,
    multipleChoice: { type: Boolean, default: false },
    totalVotes: { type: Number, default: 0 }
  },
  
  // Job post reference
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  
  // Hashtags and mentions
  hashtags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Engagement counters
  stats: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    saves: { type: Number, default: 0 }
  },
  
  // Privacy and visibility
  visibility: {
    type: String,
    enum: ['public', 'connections', 'private'],
    default: 'public'
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  allowSharing: {
    type: Boolean,
    default: true
  },
  
  // Shared post reference
  sharedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  originalAuthor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Moderation
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted', 'under_review'],
    default: 'active',
    index: true
  },
  reportedCount: {
    type: Number,
    default: 0
  },
  lastModerated: Date,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Location
  location: {
    name: String,
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  
  // Expiry for temporary posts
  expiresAt: Date,
  
  // Pinned post
  pinned: {
    type: Boolean,
    default: false
  },
  pinnedUntil: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'stats.likes': -1 });
postSchema.index({ 'stats.comments': -1 });
postSchema.index({ type: 1 });
postSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
postSchema.index({ location: '2dsphere' });

// Virtual for isActive
postSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Virtual for isExpired
postSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Method to increment engagement counters
postSchema.methods.incrementStats = async function(field, amount = 1) {
  this.stats[field] += amount;
  await this.save();
};

// Method to add media
postSchema.methods.addMedia = function(mediaData) {
  this.media.push(mediaData);
  return this.save();
};

// Method to remove media
postSchema.methods.removeMedia = function(mediaId) {
  this.media.id(mediaId).remove();
  return this.save();
};

// Static method to get popular posts
postSchema.statics.getPopular = function(days = 7, limit = 10) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  
  return this.find({
    createdAt: { $gte: date },
    status: 'active'
  })
  .sort({ 'stats.likes': -1, 'stats.comments': -1 })
  .limit(limit)
  .populate('author', 'name avatar headline')
  .populate('originalAuthor', 'name avatar headline');
};

// Pre-save middleware to extract hashtags and determine post type
postSchema.pre('save', function(next) {
  // Extract hashtags
  if (this.isModified('content')) {
    const hashtagRegex = /#(\w+)/g;
    const matches = this.content.match(hashtagRegex);
    this.hashtags = matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
  }

  // Determine post type based on content
  if (this.isModified('media') && this.media && this.media.length > 0) {
    const hasImage = this.media.some(m => m.type === 'image');
    const hasVideo = this.media.some(m => m.type === 'video');
    
    if (hasVideo) {
      this.type = 'video';
    } else if (hasImage) {
      this.type = 'image';
    }
  }

  next();
});

module.exports = mongoose.model('Post', postSchema);