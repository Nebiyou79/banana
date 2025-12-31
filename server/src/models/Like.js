const mongoose = require('mongoose');

const reactionTypes = {
  LIKE: 'like',
  LOVE: 'love',
  LAUGH: 'laugh',
  WOW: 'wow',
  SAD: 'sad',
  ANGRY: 'angry',
  CELEBRATE: 'celebrate',
  SUPPORT: 'support'
};

const reactionEmojis = {
  [reactionTypes.LIKE]: '👍',
  [reactionTypes.LOVE]: '❤️',
  [reactionTypes.LAUGH]: '😂',
  [reactionTypes.WOW]: '😮',
  [reactionTypes.SAD]: '😢',
  [reactionTypes.ANGRY]: '😠',
  [reactionTypes.CELEBRATE]: '🎉',
  [reactionTypes.SUPPORT]: '🤝'
};

const reactionLabels = {
  [reactionTypes.LIKE]: 'Like',
  [reactionTypes.LOVE]: 'Love',
  [reactionTypes.LAUGH]: 'Laugh',
  [reactionTypes.WOW]: 'Wow',
  [reactionTypes.SAD]: 'Sad',
  [reactionTypes.ANGRY]: 'Angry',
  [reactionTypes.CELEBRATE]: 'Celebrate',
  [reactionTypes.SUPPORT]: 'Support'
};

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  targetType: {
    type: String,
    enum: ['Post', 'Comment'],
    required: true
  },
  
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  
  reaction: {
    type: String,
    enum: Object.values(reactionTypes),
    default: reactionTypes.LIKE
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reaction emoji
likeSchema.virtual('reactionEmoji').get(function() {
  return reactionEmojis[this.reaction] || '👍';
});

// Virtual for reaction label
likeSchema.virtual('reactionLabel').get(function() {
  return reactionLabels[this.reaction] || 'Like';
});

// Compound index for unique like per user per target
likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { 
  unique: true,
  name: 'unique_user_target_like'
});

// Indexes for efficient querying
likeSchema.index({ targetType: 1, targetId: 1 });
likeSchema.index({ createdAt: -1 });
likeSchema.index({ reaction: 1 });

// Static methods
likeSchema.statics = {
  // Get reactions for a specific target
  getForTarget: function(targetType, targetId, options = {}) {
    const { 
      page = 1, 
      limit = 50, 
      reaction,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const query = { targetType, targetId };
    if (reaction && Object.values(reactionTypes).includes(reaction)) {
      query.reaction = reaction;
    }
    
    return this.find(query)
      .populate('user', 'name avatar headline username')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  },

  // Get detailed reaction counts with percentages
  getReactionStats: async function(targetType, targetId) {
    const stats = await this.aggregate([
      { 
        $match: { 
          targetType, 
          targetId 
        } 
      },
      {
        $group: {
          _id: '$reaction',
          count: { $sum: 1 },
          users: { $push: '$user' }
        }
      },
      {
        $project: {
          reaction: '$_id',
          count: 1,
          emoji: {
            $switch: {
              branches: Object.entries(reactionEmojis).map(([key, value]) => ({
                case: { $eq: ['$_id', key] },
                then: value
              })),
              default: '👍'
            }
          },
          label: {
            $switch: {
              branches: Object.entries(reactionLabels).map(([key, value]) => ({
                case: { $eq: ['$_id', key] },
                then: value
              })),
              default: 'Like'
            }
          },
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    const total = stats.reduce((sum, item) => sum + item.count, 0);
    
    // Add percentages
    const statsWithPercentages = stats.map(stat => ({
      ...stat,
      percentage: total > 0 ? Math.round((stat.count / total) * 100) : 0
    }));

    return {
      total,
      breakdown: statsWithPercentages,
      hasReactions: total > 0
    };
  },

  // Check if user has reacted to a target
  getUserReaction: function(userId, targetType, targetId) {
    return this.findOne({ 
      user: userId, 
      targetType, 
      targetId 
    })
    .populate('user', 'name avatar headline username')
    .lean();
  },

  // Get user's reaction history
  getUserReactions: function(userId, options = {}) {
    const { 
      page = 1, 
      limit = 20,
      targetType,
      reaction
    } = options;
    
    const skip = (page - 1) * limit;
    
    const query = { user: userId };
    if (targetType) query.targetType = targetType;
    if (reaction) query.reaction = reaction;
    
    return this.find(query)
      .populate('user', 'name avatar headline username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  },

  // Get multiple targets reaction status for a user
  getBulkReactionStatus: function(userId, targetType, targetIds) {
    return this.find({
      user: userId,
      targetType,
      targetId: { $in: targetIds }
    })
    .select('targetId reaction createdAt')
    .lean();
  }
};

// Instance methods
likeSchema.methods = {
  toResponse: function() {
    return {
      id: this._id,
      user: this.user,
      targetType: this.targetType,
      targetId: this.targetId,
      reaction: this.reaction,
      reactionEmoji: this.reactionEmoji,
      reactionLabel: this.reactionLabel,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
};

module.exports = mongoose.model('Like', likeSchema);
module.exports.reactionTypes = reactionTypes;
module.exports.reactionEmojis = reactionEmojis;
module.exports.reactionLabels = reactionLabels;