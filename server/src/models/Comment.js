// models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
    index: true
  },

  parentType: {
    type: String,
    enum: {
      values: ['Post', 'Comment'],
      message: 'Parent type must be either Post or Comment'
    },
    required: [true, 'Parent type is required']
  },

  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Parent ID is required'],
    refPath: 'parentType'
  },

  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    minlength: [1, 'Content must be at least 1 character long'],
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },

  media: [{
    url: {
      type: String,
      required: [true, 'Media URL is required']
    },
    type: {
      type: String,
      enum: ['image', 'video', 'gif'],
      required: [true, 'Media type is required']
    },
    thumbnail: String,
    publicId: String // For cloud storage management
  }],

  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function (v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Invalid user ID in mentions'
    }
  }],

  engagement: {
    likes: {
      type: Number,
      default: 0,
      min: 0
    },
    replies: {
      type: Number,
      default: 0,
      min: 0
    },
    shares: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  moderation: {
    status: {
      type: String,
      enum: ['active', 'hidden', 'deleted', 'flagged'],
      default: 'active'
    },
    reportedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    reportedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      reportedAt: {
        type: Date,
        default: Date.now
      }
    }],
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderationNotes: String
  },

  metadata: {
    depth: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
      validate: {
        validator: function (v) {
          return v >= 0 && v <= 10;
        },
        message: 'Depth must be between 0 and 10'
      }
    },
    path: {
      type: String,
      index: true
    },
    edited: {
      isEdited: {
        type: Boolean,
        default: false
      },
      editedAt: Date,
      editHistory: [{
        content: String,
        editedAt: {
          type: Date,
          default: Date.now
        }
      }]
    },
    language: {
      type: String,
      default: 'en'
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral'
    }
  }

}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.metadata.path;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for optimal query performance
commentSchema.index({ parentType: 1, parentId: 1, createdAt: -1 });
commentSchema.index({ 'metadata.path': 1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ 'moderation.status': 1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ 'engagement.likes': -1 });
commentSchema.index({ 'metadata.depth': 1 });

// Virtual for reply population
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentId',
  match: function () {
    return {
      parentType: 'Comment',
      'moderation.status': 'active'
    };
  },
  options: { sort: { createdAt: 1 } }
});

// Fix the virtual for userLike to work properly
commentSchema.virtual('userLike', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'targetId',
  justOne: true,
  options: {
    match: function () {
      const user = this.getOptions()?.user;
      return user ? { user: user._id || user } : {};
    }
  }
});

// Pre-save middleware to set path and handle mentions
commentSchema.pre('save', async function (next) {
  try {
    // Set path based on parent type
    if (this.parentType === 'Post') {
      this.metadata.path = this._id.toString();
      this.metadata.depth = 0;
    } else if (this.parentType === 'Comment') {
      const parent = await this.constructor.findById(this.parentId);
      if (!parent) {
        throw new Error('Parent comment not found');
      }

      if (parent.metadata.depth >= 10) {
        throw new Error('Maximum comment depth reached');
      }

      this.metadata.path = `${parent.metadata.path}.${this._id}`;
      this.metadata.depth = parent.metadata.depth + 1;
    }

    // Extract mentions from content
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(this.content)) !== null) {
      // In a real implementation, you'd look up users by username
      // For now, we'll store the usernames and resolve to user IDs in controller
      mentions.push(match[1]);
    }

    // Store raw mentions for processing in controller
    this.mentions = mentions;

    // Track edit history if content changed
    if (this.isModified('content') && !this.isNew) {
      this.metadata.edited.isEdited = true;
      this.metadata.edited.editedAt = new Date();

      // Store edit history (keep last 5 edits)
      this.metadata.edited.editHistory.unshift({
        content: this.previous('content'),
        editedAt: new Date()
      });

      if (this.metadata.edited.editHistory.length > 5) {
        this.metadata.edited.editHistory = this.metadata.edited.editHistory.slice(0, 5);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Pre-remove middleware to handle nested comment deletion
commentSchema.pre('remove', async function (next) {
  try {
    // Delete all nested replies
    await this.constructor.deleteMany({
      parentType: 'Comment',
      parentId: this._id
    });

    // Decrement parent comment count
    if (this.parentType === 'Comment') {
      await this.constructor.findByIdAndUpdate(
        this.parentId,
        { $inc: { 'engagement.replies': -1 } }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
commentSchema.methods = {
  // Increment engagement metrics
  // Increment engagement metrics - FIXED
  incrementLikes: async function (amount = 1) {
    this.engagement.likes += amount;
    return await this.save();
  },

  incrementReplies: async function (amount = 1) {
    this.engagement.replies += amount;
    return await this.save();
  },

  // Add method to check if user liked the comment
  isLikedByUser: async function (userId) {
    const Like = mongoose.model('Like');
    const like = await Like.findOne({
      user: userId,
      targetType: 'Comment',
      targetId: this._id
    });
    return !!like;
  },

  // Moderation methods
  hide: function (moderatorId, notes = '') {
    this.moderation.status = 'hidden';
    this.moderation.moderatedBy = moderatorId;
    this.moderation.moderationNotes = notes;
    return this.save();
  },

  restore: function () {
    this.moderation.status = 'active';
    this.moderation.reportedCount = 0;
    this.moderation.reportedBy = [];
    return this.save();
  },

  report: function (userId, reason = '') {
    // Check if user already reported
    const existingReport = this.moderation.reportedBy.find(
      report => report.user.toString() === userId.toString()
    );

    if (!existingReport) {
      this.moderation.reportedBy.push({
        user: userId,
        reason: reason,
        reportedAt: new Date()
      });
      this.moderation.reportedCount += 1;

      // Auto-flag if multiple reports
      if (this.moderation.reportedCount >= 3) {
        this.moderation.status = 'flagged';
      }
    }

    return this.save();
  }
};

// Static methods
commentSchema.statics = {
  getReplies: async function (commentId, options = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'asc'
    } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const replies = await this.find({
      parentType: 'Comment',
      parentId: commentId,
      'moderation.status': 'active'
    })
      .populate('author', 'name username avatar headline verificationStatus role')
      .populate('mentions', 'name username avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log(`Model: Found ${replies.length} replies for comment ${commentId}`);

    return replies;
  },

  // Also update the getForParent method to include replies if needed:
  getForParent: async function (parentType, parentId, options = {}) {
    const {
      page = 1,
      limit = 50,
      depth = 0,
      sortBy = 'createdAt',
      sortOrder = 'asc',
      includeReplies = false
    } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    let query = {
      parentType,
      parentId,
      'moderation.status': 'active'
    };

    if (depth > 0) {
      query['metadata.depth'] = { $lte: depth };
    }

    const comments = await this.find(query)
      .populate('author', 'name username avatar headline verificationStatus role')
      .populate('mentions', 'name username avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log(`Model: Found ${comments.length} comments for ${parentType} ${parentId}`);

    return comments;
  },
  // // Get comments for a parent with pagination and filtering
  // getForParent: function (parentType, parentId, options = {}) {
  //   const {
  //     page = 1,
  //     limit = 50,
  //     depth = 0,
  //     sortBy = 'createdAt',
  //     sortOrder = 'asc',
  //     includeReplies = false
  //   } = options;

  //   const skip = (page - 1) * limit;
  //   const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  //   let query = {
  //     parentType,
  //     parentId,
  //     'moderation.status': 'active'
  //   };

  //   if (depth > 0) {
  //     query['metadata.depth'] = { $lte: depth };
  //   }

  //   return this.find(query)
  //     .populate('author', 'name avatar headline verificationStatus role')
  //     .populate('mentions', 'name avatar')
  //     .sort(sort)
  //     .skip(skip)
  //     .limit(parseInt(limit))
  //     .lean();
  // },

  // // Get nested replies with pagination
  // getReplies: function (commentId, options = {}) {
  //   const {
  //     page = 1,
  //     limit = 50,
  //     sortBy = 'createdAt',
  //     sortOrder = 'asc'
  //   } = options;

  //   const skip = (page - 1) * limit;
  //   const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  //   return this.find({
  //     parentType: 'Comment',
  //     parentId: commentId,
  //     'moderation.status': 'active'
  //   })
  //     .populate('author', 'name avatar headline verificationStatus role')
  //     .populate('mentions', 'name avatar')
  //     .sort(sort)
  //     .skip(skip)
  //     .limit(parseInt(limit))
  //     .lean();
  // },

  // Search comments by content
  search: function (query, options = {}) {
    const {
      page = 1,
      limit = 20,
      parentType,
      parentId
    } = options;

    const skip = (page - 1) * limit;

    let searchQuery = {
      'moderation.status': 'active',
      content: { $regex: query, $options: 'i' }
    };

    if (parentType && parentId) {
      searchQuery.parentType = parentType;
      searchQuery.parentId = parentId;
    }

    return this.find(searchQuery)
      .populate('author', 'name avatar headline')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
  },

  // Get user's comments
  getUserComments: function (userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    return this.find({
      author: userId,
      'moderation.status': 'active'
    })
      .populate('parentId', 'title content')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
  }
};

// Query helper for active comments only
commentSchema.query.active = function () {
  return this.where({ 'moderation.status': 'active' });
};

commentSchema.query.byAuthor = function (authorId) {
  return this.where({ author: authorId });
};

module.exports = mongoose.model('Comment', commentSchema);