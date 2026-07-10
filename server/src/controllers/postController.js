const Post = require('../models/Post');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Save = require('../models/Save');
// 🔔 NOTIFICATION
const notificationService = require('../services/notificationService');

// =====================
// HELPER FUNCTIONS
// =====================

// Helper to batch fetch user interactions and saves
const fetchUserEngagementForPosts = async (userId, postIds) => {
  try {
    const [userLikes, userSaves] = await Promise.all([
      Like.find({
        user: userId,
        targetType: 'Post',
        targetId: { $in: postIds }
      }),
      Save.find({
        user: userId,
        targetType: 'Post',
        targetId: { $in: postIds }
      })
    ]);

    return {
      userLikes,
      userSaves
    };
  } catch (error) {
    console.error('Error fetching user engagement:', error);
    return { userLikes: [], userSaves: [] };
  }
};

// Helper to merge engagement data into posts
const mergeEngagementData = (posts, userLikes, userSaves, userId) => {
  return posts.map(post => {
    const postObj = post.toObject ? post.toObject() : post;

    const userLike = userLikes.find(like => {
      if (!like.targetId || !post._id) return false;
      if (like.targetId.equals && post._id.equals) {
        return like.targetId.equals(post._id);
      }
      return like.targetId.toString() === post._id.toString();
    });

    const isSaved = userSaves.some(save => {
      if (!save.targetId || !post._id) return false;
      if (save.targetId.equals && post._id.equals) {
        return save.targetId.equals(post._id);
      }
      return save.targetId.toString() === post._id.toString();
    });

    let userReaction = null;
    let userDisliked = false;

    if (userLike) {
      if (userLike.interactionType === 'reaction') {
        userReaction = userLike.reaction;
        userDisliked = false;
      } else if (userLike.interactionType === 'dislike') {
        userReaction = null;
        userDisliked = true;
      }
    }

    const stats = postObj.stats || {
      likes: 0,
      dislikes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      saves: 0
    };

    return {
      ...postObj,
      stats: {
        likes: stats.likes || 0,
        dislikes: stats.dislikes || 0,
        comments: stats.comments || 0,
        shares: stats.shares || 0,
        views: stats.views || 0,
        saves: stats.saves || 0
      },
      userReaction,
      userDisliked,
      isSaved,
      canEdit: postObj.author && (
        (postObj.author._id && postObj.author._id.equals && postObj.author._id.equals(userId)) ||
        postObj.author._id === userId ||
        userId === postObj.author
      ),
      canDelete: postObj.author && (
        (postObj.author._id && postObj.author._id.equals && postObj.author._id.equals(userId)) ||
        postObj.author._id === userId ||
        userId === postObj.author
      )
    };
  });
};

// =====================
// CONTROLLER FUNCTIONS
// =====================

// Create new post with Cloudinary media handling
exports.createPost = async (req, res) => {
  try {
    const {
      content,
      type = 'text',
      visibility = 'public',
      allowComments = true,
      allowSharing = true,
      location,
      expiresAt,
      pinned = false
    } = req.body;

    if (!content && !req.cloudinaryMedia && !req.cloudinaryMedia?.media) {
      return res.status(400).json({
        success: false,
        message: 'Post must contain either content or media',
        code: 'CONTENT_REQUIRED'
      });
    }

    let processedMedia = [];
    let postType = type;

    const generateProperThumbnailUrl = (mediaItem) => {
      if (mediaItem.thumbnailUrl && !mediaItem.thumbnailUrl.includes('.mp4.jpg')) {
        return mediaItem.thumbnailUrl;
      }
      if (mediaItem.type === 'video' && mediaItem.cloudinary?.secure_url) {
        const videoUrl = mediaItem.cloudinary.secure_url;
        if (videoUrl.includes('/upload/')) {
          return videoUrl.replace('/upload/', '/upload/w_600,h_400,c_fill/');
        }
        return videoUrl;
      }
      if (mediaItem.type === 'image' && mediaItem.cloudinary?.secure_url) {
        const imageUrl = mediaItem.cloudinary.secure_url;
        if (imageUrl.includes('/upload/')) {
          return imageUrl.replace('/upload/', '/upload/w_600,h_400,c_fill/');
        }
        return imageUrl;
      }
      return mediaItem.thumbnailUrl || mediaItem.cloudinary?.secure_url || '';
    };

    if (req.cloudinaryMedia?.media) {
      if (!Array.isArray(req.cloudinaryMedia.media)) {
        const mediaItem = req.cloudinaryMedia.media;
        const formattedMedia = {
          type: mediaItem.type,
          public_id: mediaItem.cloudinary.public_id,
          secure_url: mediaItem.cloudinary.secure_url,
          resource_type: mediaItem.cloudinary.resource_type,
          format: mediaItem.cloudinary.format,
          bytes: mediaItem.cloudinary.bytes,
          width: mediaItem.cloudinary.width,
          height: mediaItem.cloudinary.height,
          duration: mediaItem.cloudinary.duration,
          created_at: mediaItem.cloudinary.created_at,
          tags: mediaItem.cloudinary.tags || [],
          url: mediaItem.cloudinary.secure_url,
          thumbnail: generateProperThumbnailUrl(mediaItem),
          originalName: mediaItem.originalName,
          size: mediaItem.size,
          mimeType: mediaItem.mimetype,
          description: req.body.mediaDescription || '',
          order: 0
        };
        processedMedia.push(formattedMedia);
        if (mediaItem.type === 'video') postType = 'video';
        else if (mediaItem.type === 'image') postType = 'image';
      } else if (Array.isArray(req.cloudinaryMedia.media)) {
        processedMedia = req.cloudinaryMedia.media
          .filter(mediaItem => mediaItem.success !== false)
          .map((mediaItem, index) => ({
            type: mediaItem.type,
            public_id: mediaItem.cloudinary.public_id,
            secure_url: mediaItem.cloudinary.secure_url,
            resource_type: mediaItem.cloudinary.resource_type,
            format: mediaItem.cloudinary.format,
            bytes: mediaItem.cloudinary.bytes,
            width: mediaItem.cloudinary.width,
            height: mediaItem.cloudinary.height,
            duration: mediaItem.cloudinary.duration,
            created_at: mediaItem.cloudinary.created_at,
            tags: mediaItem.cloudinary.tags || [],
            url: mediaItem.cloudinary.secure_url,
            thumbnail: generateProperThumbnailUrl(mediaItem),
            originalName: mediaItem.originalName,
            size: mediaItem.size,
            mimeType: mediaItem.mimetype,
            description: req.body.mediaDescription || '',
            order: index
          }));
        const hasVideo = processedMedia.some(m => m.type === 'video');
        const hasImage = processedMedia.some(m => m.type === 'image');
        if (hasVideo) postType = 'video';
        else if (hasImage) postType = 'image';
      }
    }

    if (!content && processedMedia.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post must contain either content or media',
        code: 'CONTENT_REQUIRED'
      });
    }

    const post = new Post({
      author: req.user.userId,
      authorModel: 'User',
      content: content || '',
      type: postType,
      media: processedMedia,
      visibility,
      allowComments,
      allowSharing,
      location: location ? JSON.parse(location) : null,
      expiresAt,
      pinned
    });

    await post.save();
    await post.populate('author', 'name avatar headline role verificationStatus company');

    const Profile = require('../models/Profile');
    await Profile.updateOne(
      { user: req.user.userId },
      { $inc: { 'socialStats.postCount': 1 } }
    );

    // 🔔 NOTIFICATION: Notify mentioned users in post
    (async () => {
      try {
        const mentionRegex = /@([a-zA-Z0-9_]+)/g;
        const mentionedUsernames = [...new Set([...(content?.matchAll(mentionRegex) || [])].map(m => m[1]))];
        if (mentionedUsernames.length > 0) {
          const User = require('../models/User');
          const mentionedUsers = await User.find({ username: { $in: mentionedUsernames } }).select('_id');
          for (const mentionedUser of mentionedUsers) {
            if (mentionedUser._id.toString() !== req.user.userId.toString()) {
              await notificationService.create({
                recipient: mentionedUser._id,
                actor: req.user.userId,
                type: 'post_mentioned',
                title: 'You were mentioned',
                body: `{actorName} mentioned you in a post`,
                data: {
                  entityType: 'Post',
                  entityId: post._id.toString(),
                  screen: 'PostDetail',
                  params: { postId: post._id }
                },
                priority: 'high',
                channels: { inApp: true, push: true, email: false }
              });
            }
          }
        }
      } catch (notifErr) {
        console.warn('[Notification] Non-critical error:', notifErr.message);
      }
    })();
    // END NOTIFICATION

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
      code: 'POST_CREATED'
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      code: 'POST_CREATION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get personalized feed with professional filtering
exports.getFeedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, author, hashtag, sortBy } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: 'active' };

    console.log('🔍 Feed request from user:', req.user.userId);

    if (!author && !hashtag) {
      const follows = await Follow.find({
        follower: req.user.userId,
        status: 'accepted'
      }).select('targetId targetType');

      const followedIds = follows.map(f => f.targetId);

      query.$or = [
        { author: req.user.userId },
        { author: { $in: followedIds } },
        {
          visibility: 'public',
          author: { $ne: req.user.userId }
        }
      ];
    }

    if (author) {
      query.author = author;
      delete query.$or;
    }

    if (hashtag) {
      query.hashtags = { $in: [hashtag.toLowerCase()] };
    }

    if (type) {
      query.type = type;
    }

    let sortOptions = { pinned: -1, createdAt: -1 };
    if (sortBy === 'trending') {
      sortOptions = {
        'stats.likes': -1,
        'stats.comments': -1,
        createdAt: -1
      };
    }

    const posts = await Post.find(query)
      .populate('author', 'name avatar headline role verificationStatus company')
      .populate('originalAuthor', 'name avatar headline')
      .populate('job')
      .populate('sharedPost')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const postIds = posts.map(post => post._id);
    const { userLikes, userSaves } = await fetchUserEngagementForPosts(req.user.userId, postIds);
    const postsWithEngagement = mergeEngagementData(posts, userLikes, userSaves, req.user.userId);

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: postsWithEngagement,
      code: 'FEED_RETRIEVED',
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get feed posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feed posts',
      code: 'FEED_ERROR'
    });
  }
};

// Get specific post with professional access control
exports.getPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('author', 'name avatar headline role verificationStatus company')
      .populate('originalAuthor', 'name avatar headline')
      .populate('job')
      .populate('sharedPost')
      .populate('mentions', 'name avatar headline');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }

    if (post.status !== 'active' && !(req.user && (post.author._id.equals(req.user.userId) || req.user.role === 'admin'))) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }

    if (post.visibility !== 'public' && req.user) {
      if (!post.author._id.equals(req.user.userId)) {
        if (post.visibility === 'private') {
          return res.status(403).json({
            success: false,
            message: 'This post is private',
            code: 'POST_PRIVATE'
          });
        } else if (post.visibility === 'connections') {
          const isConnected = await Follow.findOne({
            follower: req.user.userId,
            targetId: post.author._id,
            status: 'accepted'
          });
          if (!isConnected) {
            return res.status(403).json({
              success: false,
              message: 'This post is only visible to connections',
              code: 'CONNECTION_REQUIRED'
            });
          }
        }
      }
    }

    if (req.user) {
      await Post.findByIdAndUpdate(id, { $inc: { 'stats.views': 1 } });
      post.stats.views = (post.stats.views || 0) + 1;
    }

    const [userLike, userSave] = await Promise.all([
      Like.findOne({ user: req.user.userId, targetType: 'Post', targetId: post._id }),
      Save.findOne({ user: req.user.userId, targetType: 'Post', targetId: post._id })
    ]);

    let userReaction = null;
    let userDisliked = false;

    if (userLike) {
      if (userLike.interactionType === 'reaction') {
        userReaction = userLike.reaction;
        userDisliked = false;
      } else if (userLike.interactionType === 'dislike') {
        userReaction = null;
        userDisliked = true;
      }
    }

    const stats = post.stats || { likes: 0, dislikes: 0, comments: 0, shares: 0, views: 0, saves: 0 };

    const postWithEngagement = {
      ...post.toObject(),
      stats: {
        likes: stats.likes || 0,
        dislikes: stats.dislikes || 0,
        comments: stats.comments || 0,
        shares: stats.shares || 0,
        views: stats.views || 0,
        saves: stats.saves || 0
      },
      userReaction,
      userDisliked,
      isSaved: !!userSave,
      canEdit: req.user && (post.author._id.equals(req.user.userId) || req.user.role === 'admin'),
      canDelete: req.user && (post.author._id.equals(req.user.userId) || req.user.role === 'admin')
    };

    res.json({
      success: true,
      data: postWithEngagement,
      code: 'POST_RETRIEVED'
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      code: 'POST_FETCH_ERROR'
    });
  }
};

// Professional post update
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }

    if (!post.author.equals(req.user.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts',
        code: 'EDIT_PERMISSION_DENIED'
      });
    }

    const generateProperThumbnailUrl = (mediaItem) => {
      if (mediaItem.thumbnailUrl && !mediaItem.thumbnailUrl.includes('.mp4.jpg')) return mediaItem.thumbnailUrl;
      if (mediaItem.type === 'video' && mediaItem.cloudinary?.secure_url) {
        const videoUrl = mediaItem.cloudinary.secure_url;
        if (videoUrl.includes('/upload/')) return videoUrl.replace('/upload/', '/upload/w_600,h_400,c_fill/');
        return videoUrl;
      }
      if (mediaItem.type === 'image' && mediaItem.cloudinary?.secure_url) {
        const imageUrl = mediaItem.cloudinary.secure_url;
        if (imageUrl.includes('/upload/')) return imageUrl.replace('/upload/', '/upload/w_600,h_400,c_fill/');
        return imageUrl;
      }
      return mediaItem.thumbnailUrl || mediaItem.cloudinary?.secure_url || '';
    };

    let updateData = {
      content: req.body.content !== undefined ? req.body.content : post.content,
      visibility: req.body.visibility !== undefined ? req.body.visibility : post.visibility,
      allowComments: req.body.allowComments !== undefined ? req.body.allowComments : post.allowComments,
      allowSharing: req.body.allowSharing !== undefined ? req.body.allowSharing : post.allowSharing,
      pinned: req.body.pinned !== undefined ? req.body.pinned : post.pinned,
      lastEditedAt: new Date()
    };

    let finalMedia = [...post.media];
    let mediaToDelete = [];

    if (req.body.mediaToRemove && finalMedia.length > 0) {
      try {
        let mediaToRemove = [];
        if (typeof req.body.mediaToRemove === 'string') {
          mediaToRemove = JSON.parse(req.body.mediaToRemove);
        } else if (Array.isArray(req.body.mediaToRemove)) {
          mediaToRemove = req.body.mediaToRemove;
        }

        const remainingMedia = [];
        const toDelete = [];

        finalMedia.forEach((mediaItem) => {
          const shouldRemove =
            mediaToRemove.includes(mediaItem.public_id) ||
            mediaToRemove.includes(mediaItem._id?.toString()) ||
            mediaToRemove.includes(mediaItem.url) ||
            mediaToRemove.includes(mediaItem.secure_url);

          if (shouldRemove) {
            if (mediaItem.public_id) toDelete.push(mediaItem.public_id);
          } else {
            remainingMedia.push(mediaItem);
          }
        });

        finalMedia = remainingMedia;
        mediaToDelete = [...mediaToDelete, ...toDelete];
      } catch (error) {
        console.error('❌ Failed to parse mediaToRemove:', error);
      }
    }

    if (req.body.media && finalMedia.length > 0) {
      try {
        let updatedMedia = [];
        if (typeof req.body.media === 'string') {
          updatedMedia = JSON.parse(req.body.media);
        } else if (Array.isArray(req.body.media)) {
          updatedMedia = req.body.media;
        }

        const mediaMap = new Map();
        finalMedia.forEach((item, index) => {
          const key = item._id?.toString() || item.public_id;
          if (key) mediaMap.set(key, { item, index });
        });

        updatedMedia.forEach(updatedItem => {
          const key = updatedItem._id || updatedItem.public_id;
          if (key && mediaMap.has(key)) {
            const { index } = mediaMap.get(key);
            if (updatedItem.description !== undefined) finalMedia[index].description = updatedItem.description;
            if (updatedItem.order !== undefined) finalMedia[index].order = updatedItem.order;
          }
        });

        const hasOrderUpdates = updatedMedia.some(item => item.order !== undefined);
        if (hasOrderUpdates) finalMedia.sort((a, b) => (a.order || 0) - (b.order || 0));
      } catch (error) {
        console.error('❌ Failed to process media updates:', error);
      }
    }

    if (req.cloudinaryMedia?.media) {
      let newMediaItems = [];
      if (!Array.isArray(req.cloudinaryMedia.media)) {
        const mediaItem = req.cloudinaryMedia.media;
        newMediaItems.push({
          type: mediaItem.type,
          public_id: mediaItem.cloudinary.public_id,
          secure_url: mediaItem.cloudinary.secure_url,
          resource_type: mediaItem.cloudinary.resource_type,
          format: mediaItem.cloudinary.format,
          bytes: mediaItem.cloudinary.bytes,
          width: mediaItem.cloudinary.width,
          height: mediaItem.cloudinary.height,
          duration: mediaItem.cloudinary.duration,
          created_at: mediaItem.cloudinary.created_at,
          tags: mediaItem.cloudinary.tags || [],
          url: mediaItem.cloudinary.secure_url,
          thumbnail: generateProperThumbnailUrl(mediaItem),
          originalName: mediaItem.originalName,
          size: mediaItem.size,
          mimeType: mediaItem.mimetype,
          description: req.body.mediaDescription || '',
          order: finalMedia.length
        });
      } else if (Array.isArray(req.cloudinaryMedia.media)) {
        newMediaItems = req.cloudinaryMedia.media
          .filter(mediaItem => mediaItem.success !== false)
          .map((mediaItem, index) => ({
            type: mediaItem.type,
            public_id: mediaItem.cloudinary.public_id,
            secure_url: mediaItem.cloudinary.secure_url,
            resource_type: mediaItem.cloudinary.resource_type,
            format: mediaItem.cloudinary.format,
            bytes: mediaItem.cloudinary.bytes,
            width: mediaItem.cloudinary.width,
            height: mediaItem.cloudinary.height,
            duration: mediaItem.cloudinary.duration,
            created_at: mediaItem.cloudinary.created_at,
            tags: mediaItem.cloudinary.tags || [],
            url: mediaItem.cloudinary.secure_url,
            thumbnail: generateProperThumbnailUrl(mediaItem),
            originalName: mediaItem.originalName,
            size: mediaItem.size,
            mimeType: mediaItem.mimetype,
            description: req.body.mediaDescription || '',
            order: finalMedia.length + index
          }));
      }
      finalMedia = [...finalMedia, ...newMediaItems];
    }

    updateData.media = finalMedia;

    if (finalMedia.length > 0) {
      const hasVideo = finalMedia.some(m => m.type === 'video');
      const hasImage = finalMedia.some(m => m.type === 'image');
      if (hasVideo) updateData.type = 'video';
      else if (hasImage) updateData.type = 'image';
    } else if (!updateData.content || updateData.content.trim() === '') {
      updateData.type = 'text';
    } else {
      updateData.type = post.type;
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true, context: 'query' }
    )
      .populate('author', 'name avatar headline role verificationStatus company')
      .populate('originalAuthor', 'name avatar headline')
      .populate('job');

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found after update',
        code: 'POST_NOT_FOUND'
      });
    }

    if (mediaToDelete.length > 0) {
      const cloudinaryStorageService = require('../services/cloudinaryStorageService');
      mediaToDelete.forEach((publicId, index) => {
        setTimeout(async () => {
          try {
            await cloudinaryStorageService.deleteFile(publicId);
          } catch (error) {
            console.error(`❌ Error deleting media from Cloudinary: ${publicId}`, error);
          }
        }, index * 200);
      });
    }

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost,
      code: 'POST_UPDATED'
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post: ' + error.message,
      code: 'POST_UPDATE_ERROR'
    });
  }
};

// Professional post deletion with Cloudinary cleanup
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }

    if (!post.author.equals(req.user.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts',
        code: 'DELETE_PERMISSION_DENIED'
      });
    }

    if (post.media && Array.isArray(post.media)) {
      const cloudinaryStorageService = require('../services/cloudinaryStorageService');
      post.media.forEach(mediaItem => {
        if (mediaItem.public_id) {
          cloudinaryStorageService.deleteFile(mediaItem.public_id)
            .then(result => {
              if (result.success) console.log(`✅ Deleted media from Cloudinary: ${mediaItem.public_id}`);
            })
            .catch(error => console.error(`❌ Error deleting media from Cloudinary: ${mediaItem.public_id}`, error));
        }
      });
    }

    if (permanent && req.user.role === 'admin') {
      await Post.findByIdAndDelete(id);
    } else {
      post.status = 'deleted';
      post.deletedAt = new Date();
      await post.save();
    }

    const Profile = require('../models/Profile');
    await Profile.updateOne(
      { user: post.author },
      { $inc: { 'socialStats.postCount': -1 } }
    );

    res.json({
      success: true,
      message: permanent ? 'Post permanently deleted' : 'Post deleted successfully',
      code: permanent ? 'POST_PERMANENTLY_DELETED' : 'POST_DELETED'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      code: 'POST_DELETE_ERROR'
    });
  }
};

// Get posts by specific profile with professional filtering
exports.getProfilePosts = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { page = 1, limit = 20, type, includeShared = true } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      $or: [{ author: profileId }],
      status: 'active'
    };

    if (includeShared === 'true') {
      query.$or.push({ originalAuthor: profileId });
    }

    if (type) query.type = type;

    const isOwnProfile = profileId === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      const Profile = require('../models/Profile');
      const profile = await Profile.findOne({ user: profileId });

      if (profile && profile.privacySettings.profileVisibility === 'private') {
        const isFollowing = await Follow.findOne({
          follower: req.user.userId,
          targetId: profileId,
          status: 'accepted'
        });

        if (!isFollowing) {
          return res.status(403).json({
            success: false,
            message: 'This profile is private',
            code: 'PROFILE_PRIVATE'
          });
        }
        query.visibility = { $in: ['connections', 'public'] };
      } else {
        query.visibility = { $in: ['public', 'connections'] };
      }
    }

    const posts = await Post.find(query)
      .populate('author', 'name avatar headline role verificationStatus company')
      .populate('originalAuthor', 'name avatar headline')
      .populate('sharedPost')
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const postIds = posts.map(post => post._id);
    const { userLikes, userSaves } = await fetchUserEngagementForPosts(req.user.userId, postIds);
    const postsWithEngagement = mergeEngagementData(posts, userLikes, userSaves, req.user.userId);

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: postsWithEngagement,
      code: 'PROFILE_POSTS_RETRIEVED',
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get profile posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile posts',
      code: 'PROFILE_POSTS_ERROR'
    });
  }
};

// Professional share functionality
exports.sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, visibility = 'public' } = req.body;

    const originalPost = await Post.findById(id);

    if (!originalPost || originalPost.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Original post not found',
        code: 'ORIGINAL_POST_NOT_FOUND'
      });
    }

    if (!originalPost.allowSharing) {
      return res.status(403).json({
        success: false,
        message: 'This post cannot be shared',
        code: 'SHARING_NOT_ALLOWED'
      });
    }

    const sharedPost = new Post({
      author: req.user.userId,
      authorModel: 'User',
      content: content || '',
      type: 'text',
      sharedPost: originalPost._id,
      originalAuthor: originalPost.author,
      visibility
    });

    await sharedPost.save();
    await sharedPost.populate('author', 'name avatar headline');
    await sharedPost.populate('sharedPost');
    await sharedPost.populate('originalAuthor', 'name avatar headline');

    await originalPost.incrementStats('shares');

    const Profile = require('../models/Profile');
    await Profile.updateOne(
      { user: req.user.userId },
      { $inc: { 'socialStats.postCount': 1 } }
    );

    // 🔔 NOTIFICATION: Notify original post author about share
    (async () => {
      try {
        if (!originalPost.author._id.equals(req.user.userId)) {
          await notificationService.create({
            recipient: originalPost.author._id || originalPost.author,
            actor: req.user.userId,
            type: 'post_shared',
            title: 'Post shared',
            body: `{actorName} shared your post`,
            data: {
              entityType: 'Post',
              entityId: sharedPost._id.toString(),
              screen: 'PostDetail',
              params: { postId: sharedPost._id }
            },
            priority: 'normal',
            groupKey: `post_shared:${id}`,
            channels: { inApp: true, push: false, email: false }
          });
        }
      } catch (notifErr) {
        console.warn('[Notification] Non-critical error:', notifErr.message);
      }
    })();
    // END NOTIFICATION

    res.status(201).json({
      success: true,
      message: 'Post shared successfully',
      data: sharedPost,
      code: 'POST_SHARED'
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing post',
      code: 'SHARE_ERROR'
    });
  }
};

// Save a post
exports.savePost = async (req, res) => {
  try {
    const { id: postId } = req.params;

    const post = await Post.findById(postId);

    if (!post || post.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Post not found or unavailable',
        code: 'POST_NOT_FOUND'
      });
    }

    const existingSave = await Save.findOne({
      user: req.user.userId,
      targetId: postId,
      targetType: 'Post'
    });

    if (existingSave) {
      return res.status(200).json({
        success: true,
        message: 'Post already saved',
        code: 'POST_ALREADY_SAVED'
      });
    }

    await Save.create({
      user: req.user.userId,
      targetId: postId,
      targetType: 'Post'
    });

    await Post.findByIdAndUpdate(postId, { $inc: { 'stats.saves': 1 } });

    return res.status(200).json({
      success: true,
      message: 'Post saved successfully',
      code: 'POST_SAVED'
    });
  } catch (error) {
    console.error('Save post error:', error);
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: 'Post already saved',
        code: 'POST_ALREADY_SAVED'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error saving post',
      code: 'SAVE_ERROR'
    });
  }
};

// Unsave a post
exports.unsavePost = async (req, res) => {
  try {
    const { id: postId } = req.params;

    const result = await Save.findOneAndDelete({
      user: req.user.userId,
      targetId: postId,
      targetType: 'Post'
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Post not found in saved items',
        code: 'SAVE_NOT_FOUND'
      });
    }

    await Post.findByIdAndUpdate(postId, { $inc: { 'stats.saves': -1 } });

    return res.status(200).json({
      success: true,
      message: 'Post unsaved successfully',
      code: 'POST_UNSAVED'
    });
  } catch (error) {
    console.error('Unsave post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error unsaving post',
      code: 'UNSAVE_ERROR'
    });
  }
};

// Get saved posts
exports.getSavedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const saves = await Save.find({
      user: req.user.userId,
      targetType: 'Post'
    })
      .select('targetId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const postIds = saves.map(save => save.targetId);

    const posts = await Post.find({
      _id: { $in: postIds },
      status: 'active'
    })
      .populate('author', 'name avatar headline role verificationStatus company')
      .populate('originalAuthor', 'name avatar headline')
      .populate('sharedPost')
      .sort({ createdAt: -1 });

    const userLikes = await Like.find({
      user: req.user.userId,
      targetType: 'Post',
      targetId: { $in: postIds }
    });

    const userSaves = await Save.find({
      user: req.user.userId,
      targetType: 'Post',
      targetId: { $in: postIds }
    });

    const postsWithEngagement = mergeEngagementData(posts, userLikes, userSaves, req.user.userId);

    const orderedPosts = saves.map(save =>
      postsWithEngagement.find(post => post._id.equals(save.targetId))
    ).filter(Boolean);

    const total = await Save.countDocuments({
      user: req.user.userId,
      targetType: 'Post'
    });

    res.json({
      success: true,
      data: orderedPosts,
      code: 'SAVED_POSTS_RETRIEVED',
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get saved posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved posts',
      code: 'SAVED_POSTS_ERROR'
    });
  }
};

// Get user's own posts for professional dashboard
exports.getMyPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      $or: [
        { author: req.user.userId },
        { originalAuthor: req.user.userId }
      ]
    };

    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'deleted' };
    }

    if (type) query.type = type;

    const posts = await Post.find(query)
      .populate('author', 'name avatar headline role verificationStatus company')
      .populate('originalAuthor', 'name avatar headline')
      .populate('sharedPost')
      .sort({ createdAt: -1, pinned: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    const postIds = posts.map(post => post._id);
    const { userLikes, userSaves } = await fetchUserEngagementForPosts(req.user.userId, postIds);
    const postsWithEngagement = mergeEngagementData(posts, userLikes, userSaves, req.user.userId);

    res.json({
      success: true,
      data: postsWithEngagement,
      code: 'MY_POSTS_RETRIEVED',
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get my posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your posts',
      code: 'MY_POSTS_ERROR'
    });
  }
};