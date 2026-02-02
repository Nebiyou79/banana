const Interaction = require('../models/Like');
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
    const validReactions = Object.values(Interaction.reactionTypes);
    if (!validReactions.includes(reaction)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type.',
        code: 'INVALID_REACTION',
        validReactions
      });
    }

    // Get existing interaction (if any) BEFORE removal
    const existingInteraction = await Interaction.getUserInteraction(req.user.userId, targetType, id);

    // Remove any existing interaction (reaction or dislike) for this user-target
    await Interaction.removeAllInteractions(req.user.userId, targetType, id);

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
    const newInteraction = new Interaction({
      user: req.user.userId,
      targetType,
      targetId: id,
      interactionType: 'reaction',
      reaction
    });

    await newInteraction.save();
    await newInteraction.populate('user', 'name avatar headline username');

    // Update target stats - handle transitions correctly
    const update = {};
    const likeField = targetType === 'Post' ? 'stats.likes' : 'likes';
    const dislikeField = targetType === 'Post' ? 'stats.dislikes' : 'dislikes';
    
    // Check what existed before
    if (existingInteraction) {
      if (existingInteraction.interactionType === 'reaction') {
        // User changed reaction type - no net change in like count
        update.$inc = {};
      } else if (existingInteraction.interactionType === 'dislike') {
        // User switched from dislike to reaction
        update.$inc = {
          [likeField]: 1,
          [dislikeField]: -1
        };
      }
    } else {
      // User had no previous interaction
      update.$inc = { [likeField]: 1 };
    }
    
    if (Object.keys(update.$inc || {}).length > 0) {
      await TargetModel.findByIdAndUpdate(id, update);
    }

    // Get updated interaction stats
    const interactionStats = await Interaction.getInteractionStats(targetType, id);

    res.status(201).json({
      success: true,
      message: `Reaction added successfully.`,
      data: {
        interaction: newInteraction,
        stats: interactionStats
      }
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    
    // Handle duplicate key error (unique index violation)
    if (error.code === 11000) {
      // Clean up the duplicate
      await Interaction.deleteMany({
        user: req.user.userId,
        targetType: req.body.targetType || 'Post',
        targetId: req.params.id,
        interactionType: 'reaction'
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

// Add dislike to a target
const addDislike = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetType = 'Post' } = req.body;

    console.log('Add dislike request:', { id, targetType, userId: req.user.userId });

    // Validate input
    if (!['Post', 'Comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type. Must be Post or Comment.',
        code: 'INVALID_TARGET_TYPE'
      });
    }

    // Get existing interaction (if any) BEFORE removal
    const existingInteraction = await Interaction.getUserInteraction(req.user.userId, targetType, id);

    // Remove any existing interaction (reaction or dislike) for this user-target
    await Interaction.removeAllInteractions(req.user.userId, targetType, id);

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

    // Create new dislike
    const newInteraction = new Interaction({
      user: req.user.userId,
      targetType,
      targetId: id,
      interactionType: 'dislike',
      dislike: 'dislike'
    });

    await newInteraction.save();
    await newInteraction.populate('user', 'name avatar headline username');

    // Update target stats - handle transitions correctly
    const update = {};
    const likeField = targetType === 'Post' ? 'stats.likes' : 'likes';
    const dislikeField = targetType === 'Post' ? 'stats.dislikes' : 'dislikes';
    
    // Check what existed before
    if (existingInteraction) {
      if (existingInteraction.interactionType === 'dislike') {
        // User was already disliking - no change
        update.$inc = {};
      } else if (existingInteraction.interactionType === 'reaction') {
        // User switched from reaction to dislike
        update.$inc = {
          [likeField]: -1,
          [dislikeField]: 1
        };
      }
    } else {
      // User had no previous interaction
      update.$inc = { [dislikeField]: 1 };
    }
    
    if (Object.keys(update.$inc || {}).length > 0) {
      await TargetModel.findByIdAndUpdate(id, update);
    }

    // Get updated interaction stats
    const interactionStats = await Interaction.getInteractionStats(targetType, id);

    res.status(201).json({
      success: true,
      message: `Dislike added successfully.`,
      data: {
        interaction: newInteraction,
        stats: interactionStats
      }
    });

  } catch (error) {
    console.error('Add dislike error:', error);
    
    // Handle duplicate key error (unique index violation)
    if (error.code === 11000) {
      // Clean up the duplicate
      await Interaction.deleteMany({
        user: req.user.userId,
        targetType: req.body.targetType || 'Post',
        targetId: req.params.id,
        interactionType: 'dislike'
      });
      
      return res.status(409).json({
        success: false,
        message: 'Duplicate dislike detected and cleaned. Please try again.',
        code: 'DUPLICATE_CLEANED'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add dislike.',
      code: 'DISLIKE_ADD_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Remove interaction (both reaction and dislike) from a target
const removeInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetType = 'Post' } = req.body;

    console.log('Remove interaction request:', { id, targetType, userId: req.user.userId });

    // Validate target type
    if (!['Post', 'Comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type.',
        code: 'INVALID_TARGET_TYPE'
      });
    }

    // Get the interaction before removing to know what type it was
    const existingInteraction = await Interaction.getUserInteraction(req.user.userId, targetType, id);
    
    if (!existingInteraction) {
      return res.status(404).json({
        success: false,
        message: 'No interaction found to remove.',
        code: 'INTERACTION_NOT_FOUND'
      });
    }

    // Remove ALL interactions by this user to this target
    const result = await Interaction.removeAllInteractions(req.user.userId, targetType, id);

    console.log('Delete result:', result);

    // Update target stats based on what was removed
    const TargetModel = targetType === 'Post' ? Post : Comment;
    const update = {};
    
    if (existingInteraction.interactionType === 'reaction') {
      const likeField = targetType === 'Post' ? 'stats.likes' : 'likes';
      update.$inc = { [likeField]: -1 };
    } else if (existingInteraction.interactionType === 'dislike') {
      const dislikeField = targetType === 'Post' ? 'stats.dislikes' : 'dislikes';
      update.$inc = { [dislikeField]: -1 };
    }
    
    await TargetModel.findByIdAndUpdate(id, update);

    // Get updated interaction stats
    const interactionStats = await Interaction.getInteractionStats(targetType, id);

    res.json({
      success: true,
      message: `Interaction removed successfully.`,
      data: {
        removedType: existingInteraction.interactionType,
        removedValue: existingInteraction.value,
        stats: interactionStats
      }
    });

  } catch (error) {
    console.error('Remove interaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove interaction.',
      code: 'INTERACTION_REMOVE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update existing reaction (change reaction type)
const updateReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction, targetType = 'Post' } = req.body;

    console.log('Update reaction request:', { id, reaction, targetType, userId: req.user.userId });

    // Validate reaction type
    const validReactions = Object.values(Interaction.reactionTypes);
    if (!reaction || !validReactions.includes(reaction)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type.',
        code: 'INVALID_REACTION',
        validReactions
      });
    }

    // Find existing interaction
    const existingInteraction = await Interaction.findOne({
      user: req.user.userId,
      targetType,
      targetId: id
    });

    if (!existingInteraction) {
      return res.status(404).json({
        success: false,
        message: 'No interaction found to update. Please add a reaction first.',
        code: 'INTERACTION_NOT_FOUND'
      });
    }

    // Check if current interaction is a reaction
    if (existingInteraction.interactionType !== 'reaction') {
      // If it's a dislike, we need to switch to reaction
      // Remove the dislike first
      await Interaction.removeAllInteractions(req.user.userId, targetType, id);
      
      // Create new reaction
      const newInteraction = new Interaction({
        user: req.user.userId,
        targetType,
        targetId: id,
        interactionType: 'reaction',
        reaction
      });
      
      await newInteraction.save();
      await newInteraction.populate('user', 'name avatar headline username');
      
      // Update target stats (dislike → reaction)
      const TargetModel = targetType === 'Post' ? Post : Comment;
      const likeField = targetType === 'Post' ? 'stats.likes' : 'likes';
      const dislikeField = targetType === 'Post' ? 'stats.dislikes' : 'dislikes';
      
      await TargetModel.findByIdAndUpdate(id, {
        $inc: {
          [likeField]: 1,
          [dislikeField]: -1
        }
      });
      
      // Get updated interaction stats
      const interactionStats = await Interaction.getInteractionStats(targetType, id);

      return res.json({
        success: true,
        message: `Reaction updated from dislike successfully.`,
        data: {
          previousInteraction: existingInteraction,
          updatedReaction: reaction,
          interaction: newInteraction,
          stats: interactionStats
        }
      });
    }

    // Store old reaction
    const oldReaction = existingInteraction.reaction;

    // Update reaction
    existingInteraction.reaction = reaction;
    await existingInteraction.save();
    await existingInteraction.populate('user', 'name avatar headline username');

    // Get updated interaction stats
    const interactionStats = await Interaction.getInteractionStats(targetType, id);

    res.json({
      success: true,
      message: `Reaction updated successfully.`,
      data: {
        previousReaction: oldReaction,
        updatedReaction: reaction,
        interaction: existingInteraction,
        stats: interactionStats
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

    // Get reactions with pagination
    const reactions = await Interaction.getReactionsForTarget(targetType, id, {
      page: parseInt(page),
      limit: parseInt(limit),
      reaction: reaction !== 'all' ? reaction : undefined,
      sortBy,
      sortOrder
    });

    const total = await Interaction.countDocuments({
      targetType,
      targetId: id,
      interactionType: 'reaction',
      ...(reaction && reaction !== 'all' ? { reaction } : {})
    });

    // Get interaction statistics
    const interactionStats = await Interaction.getInteractionStats(targetType, id);

    // Check user's interaction status
    const userInteraction = await Interaction.getUserInteraction(req.user.userId, targetType, id);

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
        stats: interactionStats,
        userInteraction: userInteraction ? {
          interactionType: userInteraction.interactionType,
          value: userInteraction.value,
          emoji: userInteraction.emoji,
          reactedAt: userInteraction.createdAt,
          isDisliked: userInteraction.interactionType === 'dislike'
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

// Get dislikes for a target
const getTargetDislikes = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      targetType = 'Post',
      page = 1, 
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('Get dislikes request:', { id, targetType, page, limit });

    // Validate target type
    if (!['Post', 'Comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type.',
        code: 'INVALID_TARGET_TYPE'
      });
    }

    // Get dislikes with pagination
    const dislikes = await Interaction.getDislikesForTarget(targetType, id, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    const total = await Interaction.countDocuments({
      targetType,
      targetId: id,
      interactionType: 'dislike'
    });

    // Get interaction statistics
    const interactionStats = await Interaction.getInteractionStats(targetType, id);

    // Check user's interaction status
    const userInteraction = await Interaction.getUserInteraction(req.user.userId, targetType, id);

    res.json({
      success: true,
      data: {
        dislikes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        stats: interactionStats,
        userInteraction: userInteraction ? {
          interactionType: userInteraction.interactionType,
          value: userInteraction.value,
          emoji: userInteraction.emoji,
          reactedAt: userInteraction.createdAt,
          isDisliked: userInteraction.interactionType === 'dislike'
        } : null
      }
    });

  } catch (error) {
    console.error('Get target dislikes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dislikes.',
      code: 'FETCH_DISLIKES_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get interaction statistics for a target
const getInteractionStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetType = 'Post' } = req.query;

    console.log('Get interaction stats request:', { id, targetType });

    const interactionStats = await Interaction.getInteractionStats(targetType, id);

    res.json({
      success: true,
      data: interactionStats
    });

  } catch (error) {
    console.error('Get interaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interaction statistics.',
      code: 'FETCH_STATS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's interaction status for multiple targets
const getBulkInteractionStatus = async (req, res) => {
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
    
    const interactions = await Interaction.getBulkInteractionStatus(req.user.userId, targetType, limitedTargetIds);

    // Create a map for easy lookup
    const interactionMap = {};
    interactions.forEach(interaction => {
      interactionMap[interaction.targetId.toString()] = {
        interactionType: interaction.interactionType,
        value: interaction.interactionType === 'reaction' ? interaction.reaction : interaction.dislike,
        emoji: interaction.interactionType === 'reaction' 
          ? Interaction.reactionEmojis[interaction.reaction] 
          : Interaction.dislikeEmojis[interaction.dislike],
        reactedAt: interaction.createdAt,
        isDisliked: interaction.interactionType === 'dislike'
      };
    });

    res.json({
      success: true,
      data: {
        interactions: interactionMap,
        totalQueried: limitedTargetIds.length,
        totalFound: interactions.length
      }
    });

  } catch (error) {
    console.error('Get bulk interaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bulk interaction status.',
      code: 'BULK_STATUS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's specific interaction with a target
const getUserInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetType = 'Post' } = req.query;

    console.log('Get user interaction request:', { id, targetType, userId: req.user.userId });

    const interaction = await Interaction.getUserInteraction(req.user.userId, targetType, id);

    res.json({
      success: true,
      data: {
        hasInteraction: !!interaction,
        interaction: interaction ? {
          interactionType: interaction.interactionType,
          value: interaction.interactionType === 'reaction' ? interaction.reaction : interaction.dislike,
          emoji: interaction.interactionType === 'reaction' 
            ? Interaction.reactionEmojis[interaction.reaction] 
            : Interaction.dislikeEmojis[interaction.dislike],
          label: interaction.interactionType === 'reaction'
            ? Interaction.reactionLabels[interaction.reaction]
            : Interaction.dislikeLabels[interaction.dislike],
          reactedAt: interaction.createdAt,
          isDisliked: interaction.interactionType === 'dislike'
        } : null
      }
    });

  } catch (error) {
    console.error('Get user interaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user interaction.',
      code: 'FETCH_USER_INTERACTION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Toggle between reaction and dislike
const toggleInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetType = 'Post' } = req.body;

    console.log('Toggle interaction request:', { id, targetType, userId: req.user.userId });

    // Get current interaction
    const currentInteraction = await Interaction.getUserInteraction(req.user.userId, targetType, id);

    let result;
    let update = {};
    const TargetModel = targetType === 'Post' ? Post : Comment;
    const likeField = targetType === 'Post' ? 'stats.likes' : 'likes';
    const dislikeField = targetType === 'Post' ? 'stats.dislikes' : 'dislikes';
    
    if (!currentInteraction) {
      // No current interaction → add default like
      const newInteraction = new Interaction({
        user: req.user.userId,
        targetType,
        targetId: id,
        interactionType: 'reaction',
        reaction: 'like'
      });
      
      await newInteraction.save();
      result = newInteraction;
      
      // Update stats: increment like
      update.$inc = { [likeField]: 1 };
    } 
    else if (currentInteraction.interactionType === 'reaction') {
      // Switch from reaction to dislike
      await Interaction.removeAllInteractions(req.user.userId, targetType, id);
      
      const newInteraction = new Interaction({
        user: req.user.userId,
        targetType,
        targetId: id,
        interactionType: 'dislike',
        dislike: 'dislike'
      });
      
      await newInteraction.save();
      result = newInteraction;
      
      // Update stats: decrement like, increment dislike
      update.$inc = {
        [likeField]: -1,
        [dislikeField]: 1
      };
    } 
    else {
      // Switch from dislike to default reaction (like)
      await Interaction.removeAllInteractions(req.user.userId, targetType, id);
      
      const newInteraction = new Interaction({
        user: req.user.userId,
        targetType,
        targetId: id,
        interactionType: 'reaction',
        reaction: 'like'
      });
      
      await newInteraction.save();
      result = newInteraction;
      
      // Update stats: decrement dislike, increment like
      update.$inc = {
        [likeField]: 1,
        [dislikeField]: -1
      };
    }

    // Apply target stats update
    if (Object.keys(update.$inc || {}).length > 0) {
      await TargetModel.findByIdAndUpdate(id, update);
    }

    await result.populate('user', 'name avatar headline username');

    // Get updated interaction stats
    const interactionStats = await Interaction.getInteractionStats(targetType, id);

    res.json({
      success: true,
      message: `Interaction toggled successfully.`,
      data: {
        previousInteraction: currentInteraction,
        newInteraction: result,
        stats: interactionStats
      }
    });

  } catch (error) {
    console.error('Toggle interaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle interaction.',
      code: 'TOGGLE_INTERACTION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export all controller functions
module.exports = {
  addReaction,
  addDislike,
  removeInteraction,
  updateReaction,
  getTargetReactions,
  getTargetDislikes,
  getInteractionStats,
  getBulkInteractionStatus,
  getUserInteraction,
  toggleInteraction
};