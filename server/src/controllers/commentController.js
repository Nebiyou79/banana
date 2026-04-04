// controllers/commentController.js
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Like = require('../models/Like');
const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * @desc    Add comment to post or reply to comment
 * @route   POST /api/comments/posts/:id/comments
 * @access  Private
 */
exports.addComment = async (req, res) => {
  const session = await Comment.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      content,
      parentType = 'Post',
      parentId = id,
      media = [],
      mentions = [],
      hashtags = []
    } = req.body;

    console.log('Adding comment:', { parentType, parentId, content: content?.substring(0, 50) });

    // Validate parent exists and is active
    let parent;
    if (parentType === 'Post') {
      parent = await Post.findById(parentId).session(session);
      if (!parent) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      // Check if post allows comments
      if (!parent.allowComments) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({
          success: false,
          message: 'Comments are disabled for this post'
        });
      }
    } else if (parentType === 'Comment') {
      // FIX: Properly handle comment replies
      parent = await Comment.findById(parentId).session(session);
      if (!parent || parent.moderation.status !== 'active') {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found or inactive'
        });
      }

      // Check depth limit
      if (parent.metadata.depth >= 10) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Maximum reply depth reached'
        });
      }

      // FIX: Ensure we're replying to a comment, not creating duplicate
      console.log('Replying to comment:', {
        parentId: parent._id,
        parentDepth: parent.metadata.depth
      });
    }

    // Process mentions
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentionUsernames = [...new Set(mentions)];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentionUsernames.push(match[1]);
    }

    // Resolve usernames to user IDs
    const mentionedUsers = await User.find(
      { username: { $in: mentionUsernames } },
      '_id'
    ).session(session);

    const mentionIds = mentionedUsers.map(user => user._id);

    // Create comment
    const commentData = {
      author: req.user.userId,
      parentType,
      parentId,
      content: content.trim(),
      media,
      mentions: mentionIds,
      metadata: {
        depth: parentType === 'Post' ? 0 : (parent.metadata.depth + 1),
        path: '', // Will be set in pre-save
        hashtags: hashtags || []
      }
    };

    console.log('Creating comment with data:', {
      parentType: commentData.parentType,
      parentId: commentData.parentId,
      depth: commentData.metadata.depth
    });

    const comment = new Comment(commentData);
    await comment.save({ session });

    // FIX: Proper population
    await comment.populate([
      {
        path: 'author',
        select: 'name username avatar headline verificationStatus role'
      },
      {
        path: 'mentions',
        select: 'name username avatar'
      }
    ]);

    // Update parent engagement metrics
    if (parentType === 'Post') {
      await Post.findByIdAndUpdate(
        parentId,
        { $inc: { 'stats.comments': 1 } },
        { session, new: true }
      );
      console.log('Updated post comments count');
    } else {
      // FIX: Increment parent comment replies
      await Comment.findByIdAndUpdate(
        parentId,
        { $inc: { 'engagement.replies': 1 } },
        { session, new: true }
      );
      console.log('Updated parent comment replies count');
    }

    await session.commitTransaction();
    session.endSession();

    // FIX: Add user reaction status
    const commentWithReaction = comment.toObject();
    const userLike = await Like.findOne({
      user: req.user.userId,
      targetType: 'Comment',
      targetId: comment._id
    });

    commentWithReaction.userReaction = userLike ? userLike.reaction : null;
    commentWithReaction.hasLiked = !!userLike;

    res.status(201).json({
      success: true,
      message: parentType === 'Post' ? 'Comment added successfully' : 'Reply added successfully',
      data: commentWithReaction
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc    Get comments for post with pagination and replies
 * @route   GET /api/comments/posts/:id/comments
 * @access  Public (with optional auth)
 */
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 50,
      depth = 2,
      sortBy = 'createdAt',
      sortOrder = 'asc',
      includeReplies = 'true'
    } = req.query;

    console.log('Fetching comments for post:', {
      postId: id,
      depth,
      includeReplies,
      page,
      limit
    });

    // Validate post exists
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get comments with replies
    const comments = await Comment.getForParent('Post', id, {
      page: parseInt(page),
      limit: parseInt(limit),
      depth: parseInt(depth),
      sortBy,
      sortOrder,
      includeReplies: includeReplies === 'true'
    });

    console.log(`Found ${comments.length} root comments for post ${id}`);

    // Get like status for authenticated users
    let userLikes = [];
    if (req.user) {
      const commentIds = comments.map(comment => comment._id);
      userLikes = await Like.find({
        user: req.user.userId,
        targetType: 'Comment',
        targetId: { $in: commentIds }
      });
      console.log(`Found ${userLikes.length} user likes`);
    }

    // FIXED: Get replies for each comment if includeReplies is true
    const enhancedComments = await Promise.all(
      comments.map(async (comment) => {
        const commentObj = comment.toObject ? comment.toObject() : comment;
        const userLike = userLikes.find(like =>
          like.targetId.toString() === comment._id.toString()
        );

        // Get replies if includeReplies is true and comment has replies
        let replies = [];
        if (includeReplies === 'true' && comment.engagement?.replies > 0) {
          try {
            console.log(`Fetching replies for comment ${comment._id} (${comment.engagement.replies} replies)`);
            replies = await Comment.getReplies(comment._id, {
              page: 1,
              limit: 10,
              sortBy: 'createdAt',
              sortOrder: 'asc'
            });
            console.log(`Found ${replies.length} replies for comment ${comment._id}`);

            // Get user likes for replies
            if (req.user && replies.length > 0) {
              const replyIds = replies.map(reply => reply._id);
              const replyLikes = await Like.find({
                user: req.user.userId,
                targetType: 'Comment',
                targetId: { $in: replyIds }
              });

              replies = replies.map(reply => {
                const replyLike = replyLikes.find(like =>
                  like.targetId.toString() === reply._id.toString()
                );
                return {
                  ...reply,
                  userReaction: replyLike ? replyLike.reaction : null,
                  hasLiked: !!replyLike
                };
              });
            }
          } catch (error) {
            console.error(`Error fetching replies for comment ${comment._id}:`, error);
            replies = [];
          }
        }

        return {
          ...commentObj,
          userReaction: userLike ? userLike.reaction : null,
          hasLiked: !!userLike,
          replies: replies || []
        };
      })
    );

    const total = await Comment.countDocuments({
      parentType: 'Post',
      parentId: id,
      'moderation.status': 'active'
    });

    console.log(`Total comments for post ${id}: ${total}`);

    res.json({
      success: true,
      data: enhancedComments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc    Update comment
 * @route   PUT /api/comments/:id
 * @access  Private
 */
exports.updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { content, media } = req.body;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership or admin role
    if (!comment.author.equals(req.user.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own comments'
      });
    }

    // Check if comment can be edited (not deleted)
    if (comment.moderation.status === 'deleted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a deleted comment'
      });
    }

    // Update fields
    const updateData = {};
    if (content !== undefined) updateData.content = content.trim();
    if (media !== undefined) updateData.media = media;

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name avatar headline verificationStatus role')
      .populate('mentions', 'name avatar');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete comment (soft delete)
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
exports.deleteComment = async (req, res) => {
  const session = await Comment.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const comment = await Comment.findById(id).session(session);

    if (!comment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership or admin role
    if (!comment.author.equals(req.user.userId) && req.user.role !== 'admin') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own comments'
      });
    }

    // Soft delete
    comment.moderation.status = 'deleted';
    await comment.save({ session });

    // Decrement comment count on parent
    if (comment.parentType === 'Post') {
      await Post.findByIdAndUpdate(
        comment.parentId,
        { $inc: { 'stats.comments': -1 } },
        { session }
      );
    } else {
      await Comment.findByIdAndUpdate(
        comment.parentId,
        { $inc: { 'engagement.replies': -1 } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get comment replies
 * @route   GET /api/comments/:id/replies
 * @access  Public (with optional auth)
 */
exports.getCommentReplies = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'asc'
    } = req.query;

    console.log(`Fetching replies for comment ${id}:`, { page, limit });

    const comment = await Comment.findById(id);
    if (!comment || comment.moderation.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const replies = await Comment.getReplies(id, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    console.log(`Found ${replies.length} replies for comment ${id}`);

    // Get like status for authenticated users
    let userLikes = [];
    if (req.user) {
      const replyIds = replies.map(reply => reply._id);
      userLikes = await Like.find({
        user: req.user.userId,
        targetType: 'Comment',
        targetId: { $in: replyIds }
      });
    }

    const enhancedReplies = replies.map(reply => {
      const replyObj = reply;
      const userLike = userLikes.find(like =>
        like.targetId.toString() === reply._id.toString()
      );

      return {
        ...replyObj,
        userReaction: userLike ? userLike.reaction : null,
        hasLiked: !!userLike
      };
    });

    const total = await Comment.countDocuments({
      parentType: 'Comment',
      parentId: id,
      'moderation.status': 'active'
    });

    res.json({
      success: true,
      data: enhancedReplies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get comment replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comment replies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc    Toggle comment like/unlike
 * @route   POST /api/comments/:id/like
 * @access  Private
 */
exports.toggleCommentLike = async (req, res) => {
  const session = await Comment.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log('Toggle comment like:', { commentId: id, userId });

    const comment = await Comment.findById(id).session(session);
    if (!comment || comment.moderation.status !== 'active') {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Comment not found or not active'
      });
    }

    // Check for existing like
    const existingLike = await Like.findOne({
      user: userId,
      targetType: 'Comment',
      targetId: id
    }).session(session);

    let result;

    if (existingLike) {
      // Unlike
      await Like.findByIdAndDelete(existingLike._id, { session });
      await comment.incrementLikes(-1);

      result = {
        liked: false,
        likes: comment.engagement.likes - 1,
        action: 'unliked'
      };

      console.log('Comment unliked:', result);
    } else {
      // Like
      const like = new Like({
        user: userId,
        targetType: 'Comment',
        targetId: id,
        reaction: 'like'
      });

      await like.save({ session });
      await comment.incrementLikes(1);

      result = {
        liked: true,
        likes: comment.engagement.likes + 1,
        like: {
          _id: like._id,
          user: userId,
          reaction: 'like',
          createdAt: like.createdAt
        },
        action: 'liked'
      };

      console.log('Comment liked:', result);
    }

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: existingLike ? 'Comment like removed successfully' : 'Comment liked successfully',
      data: result
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Toggle comment like error:', error);

    if (error.code === 11000) {
      // Clean up duplicate likes
      await Like.deleteMany({
        user: req.user.userId,
        targetType: 'Comment',
        targetId: req.params.id
      });

      return res.status(400).json({
        success: false,
        message: 'Duplicate like detected and cleaned. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error toggling comment like',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc    Report a comment
 * @route   POST /api/comments/:id/report
 * @access  Private
 */
exports.reportComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;

    const comment = await Comment.findById(id);
    if (!comment || comment.moderation.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Users cannot report their own comments
    if (comment.author.equals(req.user.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report your own comment'
      });
    }

    await comment.report(req.user.userId, reason);

    res.json({
      success: true,
      message: 'Comment reported successfully',
      data: {
        reportedCount: comment.moderation.reportedCount,
        status: comment.moderation.status
      }
    });

  } catch (error) {
    console.error('Report comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get user's comments
 * @route   GET /api/comments/user/:userId
 * @access  Public
 */
exports.getUserComments = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const comments = await Comment.getUserComments(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    const total = await Comment.countDocuments({
      author: userId,
      'moderation.status': 'active'
    });

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Search comments
 * @route   GET /api/comments/search
 * @access  Public
 */
exports.searchComments = async (req, res) => {
  try {
    const {
      q,
      page = 1,
      limit = 20,
      parentType,
      parentId
    } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const comments = await Comment.search(q.trim(), {
      page: parseInt(page),
      limit: parseInt(limit),
      parentType,
      parentId
    });

    const total = await Comment.countDocuments({
      'moderation.status': 'active',
      content: { $regex: q.trim(), $options: 'i' },
      ...(parentType && parentId && { parentType, parentId })
    });

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Search comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * @desc    Moderate comment (Admin/Moderator only)
 * @route   PATCH /api/comments/admin/comments/:id/moderate
 * @access  Private (Admin/Moderator)
 */
exports.moderateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, moderationNotes } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Update moderation fields
    comment.moderation.status = status;
    comment.moderation.moderatedBy = req.user.userId;

    if (moderationNotes) {
      comment.moderation.moderationNotes = moderationNotes;
    }

    // If restoring comment, reset report counts
    if (status === 'active') {
      comment.moderation.reportedCount = 0;
      comment.moderation.reportedBy = [];
    }

    await comment.save();
    await comment.populate([
      { path: 'author', select: 'name avatar headline verificationStatus role' },
      { path: 'moderatedBy', select: 'name role' }
    ]);

    res.json({
      success: true,
      message: `Comment ${status} successfully`,
      data: comment
    });

  } catch (error) {
    console.error('Moderate comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error moderating comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};