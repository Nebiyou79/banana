const mongoose = require('mongoose');

const reactionTypes = {
  LIKE: 'like',
  HEART: 'heart',
  CELEBRATE: 'celebrate',
  PERCENT_100: 'percent_100',
  CLAP: 'clap'
};

const dislikeTypes = {
  DISLIKE: 'dislike'
};

const reactionEmojis = {
  [reactionTypes.LIKE]: '👍',
  [reactionTypes.HEART]: '❤️',
  [reactionTypes.CELEBRATE]: '🎉',
  [reactionTypes.PERCENT_100]: '💯',
  [reactionTypes.CLAP]: '👏'
};

const dislikeEmojis = {
  [dislikeTypes.DISLIKE]: '👎'
};

const reactionLabels = {
  [reactionTypes.LIKE]: 'Like',
  [reactionTypes.HEART]: 'Heart',
  [reactionTypes.CELEBRATE]: 'Celebrate',
  [reactionTypes.PERCENT_100]: '100%',
  [reactionTypes.CLAP]: 'Clap'
};

const dislikeLabels = {
  [dislikeTypes.DISLIKE]: 'Dislike'
};

const interactionSchema = new mongoose.Schema({
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
  
  interactionType: {
    type: String,
    enum: ['reaction', 'dislike'],
    required: true,
    default: 'reaction'
  },
  
  reaction: {
    type: String,
    enum: Object.values(reactionTypes),
    required: function() {
      return this.interactionType === 'reaction';
    }
  },
  
  dislike: {
    type: String,
    enum: Object.values(dislikeTypes),
    required: function() {
      return this.interactionType === 'dislike';
    }
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

// Virtual for emoji
interactionSchema.virtual('emoji').get(function() {
  if (this.interactionType === 'reaction' && this.reaction) {
    return reactionEmojis[this.reaction] || '👍';
  } else if (this.interactionType === 'dislike' && this.dislike) {
    return dislikeEmojis[this.dislike] || '👎';
  }
  return '';
});

// Virtual for label
interactionSchema.virtual('label').get(function() {
  if (this.interactionType === 'reaction' && this.reaction) {
    return reactionLabels[this.reaction] || 'Like';
  } else if (this.interactionType === 'dislike' && this.dislike) {
    return dislikeLabels[this.dislike] || 'Dislike';
  }
  return '';
});

// Virtual for value (either reaction or dislike)
interactionSchema.virtual('value').get(function() {
  return this.interactionType === 'reaction' ? this.reaction : this.dislike;
});

// Virtual for isDisliked (convenience for frontend)
interactionSchema.virtual('isDisliked').get(function() {
  return this.interactionType === 'dislike';
});

// Compound index for unique interaction per user per target
// CRITICAL: One interaction total (reaction OR dislike) per user per target
interactionSchema.index({ 
  user: 1, 
  targetType: 1, 
  targetId: 1 
}, { 
  unique: true,
  name: 'unique_user_target_interaction',
  background: true
});

// Indexes for efficient querying
interactionSchema.index({ targetType: 1, targetId: 1 });
interactionSchema.index({ createdAt: -1 });
interactionSchema.index({ interactionType: 1 });
interactionSchema.index({ reaction: 1 });
interactionSchema.index({ dislike: 1 });
interactionSchema.index({ user: 1, interactionType: 1 });
interactionSchema.index({ targetType: 1, targetId: 1, interactionType: 1 });

// Static methods
interactionSchema.statics = {
  // Get reactions for a specific target
  getReactionsForTarget: function(targetType, targetId, options = {}) {
    const { 
      page = 1, 
      limit = 50, 
      reaction,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const query = { 
      targetType, 
      targetId,
      interactionType: 'reaction' 
    };
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

  // Get dislikes for a specific target
  getDislikesForTarget: function(targetType, targetId, options = {}) {
    const { 
      page = 1, 
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const query = { 
      targetType, 
      targetId,
      interactionType: 'dislike' 
    };
    
    return this.find(query)
      .populate('user', 'name avatar headline username')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  },

  // Get detailed reaction stats
  getReactionStats: async function(targetType, targetId) {
    const stats = await this.aggregate([
      { 
        $match: { 
          targetType, 
          targetId,
          interactionType: 'reaction'
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

  // Get dislike stats
  getDislikeStats: async function(targetType, targetId) {
    const stats = await this.aggregate([
      { 
        $match: { 
          targetType, 
          targetId,
          interactionType: 'dislike'
        } 
      },
      {
        $group: {
          _id: '$dislike',
          count: { $sum: 1 },
          users: { $push: '$user' }
        }
      },
      {
        $project: {
          dislike: '$_id',
          count: 1,
          emoji: {
            $switch: {
              branches: Object.entries(dislikeEmojis).map(([key, value]) => ({
                case: { $eq: ['$_id', key] },
                then: value
              })),
              default: '👎'
            }
          },
          label: {
            $switch: {
              branches: Object.entries(dislikeLabels).map(([key, value]) => ({
                case: { $eq: ['$_id', key] },
                then: value
              })),
              default: 'Dislike'
            }
          },
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    const total = stats.reduce((sum, item) => sum + item.count, 0);

    return {
      total,
      breakdown: stats,
      hasDislikes: total > 0
    };
  },

  // Get overall interaction stats (reactions + dislikes)
  getInteractionStats: async function(targetType, targetId) {
    const [reactionStats, dislikeStats] = await Promise.all([
      this.getReactionStats(targetType, targetId),
      this.getDislikeStats(targetType, targetId)
    ]);

    const totalInteractions = reactionStats.total + dislikeStats.total;

    return {
      reactions: reactionStats,
      dislikes: dislikeStats,
      totalInteractions,
      hasInteractions: totalInteractions > 0
    };
  },

  // Check if user has interacted with a target
  getUserInteraction: function(userId, targetType, targetId) {
    return this.findOne({ 
      user: userId, 
      targetType, 
      targetId 
    })
    .populate('user', 'name avatar headline username')
    .lean();
  },

  // Get user's reaction to a target
  getUserReaction: function(userId, targetType, targetId) {
    return this.findOne({ 
      user: userId, 
      targetType, 
      targetId,
      interactionType: 'reaction'
    })
    .lean();
  },

  // Get user's dislike to a target
  getUserDislike: function(userId, targetType, targetId) {
    return this.findOne({ 
      user: userId, 
      targetType, 
      targetId,
      interactionType: 'dislike'
    })
    .lean();
  },

  // Remove all interactions (both reaction and dislike) for a user-target pair
  removeAllInteractions: function(userId, targetType, targetId) {
    return this.deleteMany({
      user: userId,
      targetType,
      targetId
    });
  },

  // Get user's interaction history
  getUserInteractions: function(userId, options = {}) {
    const { 
      page = 1, 
      limit = 20,
      targetType,
      interactionType,
      value
    } = options;
    
    const skip = (page - 1) * limit;
    
    const query = { user: userId };
    if (targetType) query.targetType = targetType;
    if (interactionType) query.interactionType = interactionType;
    if (value) {
      if (interactionType === 'reaction') {
        query.reaction = value;
      } else if (interactionType === 'dislike') {
        query.dislike = value;
      }
    }
    
    return this.find(query)
      .populate('user', 'name avatar headline username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  },

  // Get multiple targets interaction status for a user
  getBulkInteractionStatus: function(userId, targetType, targetIds) {
    return this.find({
      user: userId,
      targetType,
      targetId: { $in: targetIds }
    })
    .select('targetId interactionType reaction dislike createdAt')
    .lean();
  }
};

// Instance methods
interactionSchema.methods = {
  toResponse: function() {
    const response = {
      id: this._id,
      user: this.user,
      targetType: this.targetType,
      targetId: this.targetId,
      interactionType: this.interactionType,
      value: this.value,
      emoji: this.emoji,
      label: this.label,
      isDisliked: this.isDisliked,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    if (this.interactionType === 'reaction') {
      response.reaction = this.reaction;
    } else if (this.interactionType === 'dislike') {
      response.dislike = this.dislike;
    }

    return response;
  }
};

module.exports = mongoose.model('Interaction', interactionSchema);
module.exports.reactionTypes = reactionTypes;
module.exports.dislikeTypes = dislikeTypes;
module.exports.reactionEmojis = reactionEmojis;
module.exports.dislikeEmojis = dislikeEmojis;
module.exports.reactionLabels = reactionLabels;
module.exports.dislikeLabels = dislikeLabels;