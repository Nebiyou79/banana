const Like = require('../models/Like');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Add reaction to a target
const addReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction = 'like', targetType = 'Post' } = req.body;

    console.log('Add reaction request:', { id, reaction, targetType, userId: req.user.userId });

    // Validate input
    if (!['Post', 'Comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type. Must be Post or Comment.',
        code: 'INVALID_TARGET_TYPE'
      });
    }

    // Validate reaction type
    const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry', 'celebrate', 'support'];
    if (!validReactions.includes(reaction)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type.',
        code: 'INVALID_REACTION',
        validReactions
      });
    }

    // Check if user already reacted to this target
    const existingReaction = await Like.findOne({
      user: req.user.userId,
      targetType,
      targetId: id
    });

    if (existingReaction) {
      return res.status(409).json({
        success: false,
        message: `You have already reacted to this ${targetType.toLowerCase()}.`,
        code: 'ALREADY_REACTED',
        data: {
          existingReaction: {
            reaction: existingReaction.reaction,
            reactedAt: existingReaction.createdAt
          }
        }
      });
    }

    // Verify target exists
    const TargetModel = targetType === 'Post' ? Post : Comment;
    const target = await TargetModel.findById(id);
    
    if (!target) {
      return res.status(404).json({
        success: false,
        message: `${targetType} not found.`,
        code: 'TARGET_NOT_FOUND'
      });
    }

    // Check if target is active (if status field exists)
    if (target.status && target.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: `${targetType} is not available.`,
        code: 'TARGET_UNAVAILABLE'
      });
    }

    // Create new reaction
    const newReaction = new Like({
      user: req.user.userId,
      targetType,
      targetId: id,
      reaction
    });

    await newReaction.save();
    await newReaction.populate('user', 'name avatar headline username');

    // Update target stats
    const updateField = targetType === 'Post' ? 'stats.likes' : 'likes';
    await TargetModel.findByIdAndUpdate(id, { 
      $inc: { [updateField]: 1 } 
    });

    // Get updated reaction stats
    const reactionStats = await Like.getReactionStats(targetType, id);

    res.status(201).json({
      success: true,
      message: `Reaction added successfully.`,
      data: {
        reaction: newReaction,
        stats: reactionStats
      }
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    
    // Handle duplicate key error (unique index violation)
    if (error.code === 11000) {
      // Clean up the duplicate
      await Like.deleteMany({
        user: req.user.userId,
        targetType: req.body.targetType || 'Post',
        targetId: req.params.id
      });
      
      return res.status(409).json({
        success: false,
        message: 'Duplicate reaction detected and cleaned. Please try again.',
        code: 'DUPLICATE_CLEANED'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add reaction.',
      code: 'REACTION_ADD_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Remove reaction from a target
const removeReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetType = 'Post' } = req.body;

    console.log('Remove reaction request:', { id, targetType, userId: req.user.userId });

    // Validate target type
    if (!['Post', 'Comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type.',
        code: 'INVALID_TARGET_TYPE'
      });
    }

    // Find and remove ALL reactions by this user to this target (in case of duplicates)
    const result = await Like.deleteMany({
      user: req.user.userId,
      targetType,
      targetId: id
    });

    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No reaction found to remove.',
        code: 'REACTION_NOT_FOUND'
      });
    }

    // Update target stats
    const TargetModel = targetType === 'Post' ? Post : Comment;
    const updateField = targetType === 'Post' ? 'stats.likes' : 'likes';
    await TargetModel.findByIdAndUpdate(id, { 
      $inc: { [updateField]: -result.deletedCount } 
    });

    // Get updated reaction stats
    const reactionStats = await Like.getReactionStats(targetType, id);

    res.json({
      success: true,
      message: `Removed ${result.deletedCount} reaction(s) successfully.`,
      data: {
        removedCount: result.deletedCount,
        stats: reactionStats
      }
    });

  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction.',
      code: 'REACTION_REMOVE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update existing reaction
const updateReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction, targetType = 'Post' } = req.body;

    console.log('Update reaction request:', { id, reaction, targetType, userId: req.user.userId });

    // Validate reaction type
    const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry', 'celebrate', 'support'];
    if (!reaction || !validReactions.includes(reaction)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type.',
        code: 'INVALID_REACTION',
        validReactions
      });
    }

    // Find and update reaction
    const existingReaction = await Like.findOneAndUpdate(
      {
        user: req.user.userId,
        targetType,
        targetId: id
      },
      { reaction },
      { new: true } // Return updated document
    );

    if (!existingReaction) {
      return res.status(404).json({
        success: false,
        message: 'No reaction found to update. Please add a reaction first.',
        code: 'REACTION_NOT_FOUND'
      });
    }

    await existingReaction.populate('user', 'name avatar headline username');

    // Get updated reaction stats
    const reactionStats = await Like.getReactionStats(targetType, id);

    res.json({
      success: true,
      message: `Reaction updated successfully.`,
      data: {
        previousReaction: existingReaction.reaction, // This is actually the new reaction after update
        updatedReaction: existingReaction,
        stats: reactionStats
      }
    });

  } catch (error) {
    console.error('Update reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reaction.',
      code: 'REACTION_UPDATE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get reactions for a target
const getTargetReactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      targetType = 'Post',
      page = 1, 
      limit = 50, 
      reaction,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('Get reactions request:', { id, targetType, page, limit, reaction });

    // Validate target type
    if (!['Post', 'Comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type.',
        code: 'INVALID_TARGET_TYPE'
      });
    }

    // Build query
    const query = { targetType, targetId: id };
    if (reaction && reaction !== 'all') {
      query.reaction = reaction;
    }

    // Get reactions with pagination
    const reactions = await Like.find(query)
      .populate('user', 'name avatar headline username')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Like.countDocuments(query);

    // Get reaction statistics
    const reactionStats = await Like.getReactionStats(targetType, id);

    // Check user's reaction status
    const userReaction = await Like.findOne({
      user: req.user.userId, 
      targetType, 
      targetId: id
    });

    res.json({
      success: true,
      data: {
        reactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        stats: reactionStats,
        userReaction: userReaction ? {
          reaction: userReaction.reaction,
          reactedAt: userReaction.createdAt
        } : null
      }
    });

  } catch (error) {
    console.error('Get target reactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reactions.',
      code: 'FETCH_REACTIONS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get reaction statistics for a target
const getReactionStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetType = 'Post' } = req.query;

    console.log('Get reaction stats request:', { id, targetType });

    const reactionStats = await Like.getReactionStats(targetType, id);

    res.json({
      success: true,
      data: reactionStats
    });

  } catch (error) {
    console.error('Get reaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reaction statistics.',
      code: 'FETCH_STATS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's reaction status for multiple targets
const getBulkReactionStatus = async (req, res) => {
  try {
    const { targetType = 'Post', targetIds } = req.body;

    console.log('Bulk status request:', { targetType, targetIds: targetIds?.length });

    if (!Array.isArray(targetIds) || targetIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'targetIds must be a non-empty array.',
        code: 'INVALID_TARGET_IDS'
      });
    }

    // Limit batch size
    const limitedTargetIds = targetIds.slice(0, 100);
    
    const reactions = await Like.find({
      user: req.user.userId,
      targetType,
      targetId: { $in: limitedTargetIds }
    }).select('targetId reaction createdAt');

    // Create a map for easy lookup
    const reactionMap = {};
    reactions.forEach(react => {
      reactionMap[react.targetId.toString()] = {
        reaction: react.reaction,
        reactedAt: react.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        reactions: reactionMap,
        totalQueried: limitedTargetIds.length,
        totalFound: reactions.length
      }
    });

  } catch (error) {
    console.error('Get bulk reaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bulk reaction status.',
      code: 'BULK_STATUS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's specific reaction to a target
const getUserReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetType = 'Post' } = req.query;

    console.log('Get user reaction request:', { id, targetType, userId: req.user.userId });

    const reaction = await Like.findOne({
      user: req.user.userId,
      targetType,
      targetId: id
    });

    res.json({
      success: true,
      data: {
        hasReaction: !!reaction,
        reaction: reaction ? reaction.reaction : null,
        reactedAt: reaction ? reaction.createdAt : null
      }
    });

  } catch (error) {
    console.error('Get user reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reaction.',
      code: 'FETCH_USER_REACTION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export all controller functions
module.exports = {
  addReaction,
  removeReaction,
  updateReaction,
  getTargetReactions,
  getReactionStats,
  getBulkReactionStatus,
  getUserReaction
};