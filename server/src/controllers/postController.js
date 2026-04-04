const Post = require('../models/Post');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Save = require('../models/Save');

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

    // Find user's interaction
    const userLike = userLikes.find(like => {
      if (!like.targetId || !post._id) return false;

      if (like.targetId.equals && post._id.equals) {
        return like.targetId.equals(post._id);
      }
      return like.targetId.toString() === post._id.toString();
    });

    // Find if post is saved
    const isSaved = userSaves.some(save => {
      if (!save.targetId || !post._id) return false;

      if (save.targetId.equals && post._id.equals) {
        return save.targetId.equals(post._id);
      }
      return save.targetId.toString() === post._id.toString();
    });

    // Determine engagement state based on interaction type
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

    // Ensure stats exist
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

// Create new post with Cloudinary media handling - UPDATED
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

    // Validate content or media requirement
    if (!content && !req.cloudinaryMedia && !req.cloudinaryMedia?.media) {
      return res.status(400).json({
        success: false,
        message: 'Post must contain either content or media',
        code: 'CONTENT_REQUIRED'
      });
    }

    let processedMedia = [];
    let postType = type;

    // Helper function to generate proper thumbnail URL
    const generateProperThumbnailUrl = (mediaItem) => {
      // If thumbnailUrl is provided and valid, use it
      if (mediaItem.thumbnailUrl && !mediaItem.thumbnailUrl.includes('.mp4.jpg')) {
        return mediaItem.thumbnailUrl;
      }

      // For videos, generate proper Cloudinary video thumbnail
      if (mediaItem.type === 'video' && mediaItem.cloudinary?.secure_url) {
        const videoUrl = mediaItem.cloudinary.secure_url;
        // Cloudinary video thumbnail transformation - no .jpg extension
        if (videoUrl.includes('/upload/')) {
          // Use proper video thumbnail transformation
          return videoUrl.replace('/upload/', '/upload/w_600,h_400,c_fill/');
        }
        return videoUrl;
      }

      // For images, use the secure_url with transformation
      if (mediaItem.type === 'image' && mediaItem.cloudinary?.secure_url) {
        const imageUrl = mediaItem.cloudinary.secure_url;
        if (imageUrl.includes('/upload/')) {
          return imageUrl.replace('/upload/', '/upload/w_600,h_400,c_fill/');
        }
        return imageUrl;
      }

      // Fallback
      return mediaItem.thumbnailUrl || mediaItem.cloudinary?.secure_url || '';
    };

    // Process Cloudinary media if available
    if (req.cloudinaryMedia?.media) {
      // Handle single media upload
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
          // Backward compatibility fields
          url: mediaItem.cloudinary.secure_url,
          thumbnail: generateProperThumbnailUrl(mediaItem), // FIXED: Use helper function
          originalName: mediaItem.originalName,
          size: mediaItem.size,
          mimeType: mediaItem.mimetype,
          description: req.body.mediaDescription || '',
          order: 0
        };

        processedMedia.push(formattedMedia);

        // Determine post type based on media
        if (mediaItem.type === 'video') {
          postType = 'video';
        } else if (mediaItem.type === 'image') {
          postType = 'image';
        }
      }
      // Handle multiple media upload
      else if (Array.isArray(req.cloudinaryMedia.media)) {
        processedMedia = req.cloudinaryMedia.media.map((mediaItem, index) => {
          // Skip failed uploads
          if (mediaItem.success === false) {
            return null;
          }

          return {
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
            // Backward compatibility fields
            url: mediaItem.cloudinary.secure_url,
            thumbnail: generateProperThumbnailUrl(mediaItem), // FIXED: Use helper function
            originalName: mediaItem.originalName,
            size: mediaItem.size,
            mimeType: mediaItem.mimetype,
            description: req.body.mediaDescription || '',
            order: index
          };
        }).filter(item => item !== null);

        // Determine post type based on media
        const hasVideo = processedMedia.some(m => m.type === 'video');
        const hasImage = processedMedia.some(m => m.type === 'image');

        if (hasVideo) postType = 'video';
        else if (hasImage) postType = 'image';
      }
    }

    // Validate that we have at least content or media
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

    // Update user's post count
    const Profile = require('../models/Profile');
    await Profile.updateOne(
      { user: req.user.userId },
      { $inc: { 'socialStats.postCount': 1 } }
    );

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

// Get personalized feed with professional filtering - FIXED VERSION
exports.getFeedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, author, hashtag, sortBy } = req.query;
    const skip = (page - 1) * limit;

    // Build query based on filters
    let query = {
      status: 'active'
    };

    console.log('🔍 Feed request from user:', req.user.userId);

    // Professional feed: More inclusive approach
    if (!author && !hashtag) {
      // Get followed users
      const follows = await Follow.find({
        follower: req.user.userId,
        status: 'accepted'
      }).select('targetId targetType');

      const followedIds = follows.map(f => f.targetId);

      console.log('📊 User network stats:', {
        userId: req.user.userId,
        followedCount: followedIds.length,
        followedIds: followedIds
      });

      // Build inclusive query for feed
      query.$or = [
        { author: req.user.userId },                           // User's own posts
        { author: { $in: followedIds } },                      // Posts from followed users
        {
          visibility: 'public',
          author: { $ne: req.user.userId }                     // All public posts except user's own
        }
      ];

      console.log('🔍 Feed query:', JSON.stringify(query, null, 2));
    }

    // Filter by author if specified
    if (author) {
      query.author = author;
      // Remove the complex $or when filtering by specific author
      delete query.$or;
    }

    // Filter by hashtag if specified
    if (hashtag) {
      query.hashtags = { $in: [hashtag.toLowerCase()] };
    }

    // Filter by post type if specified
    if (type) {
      query.type = type;
    }

    console.log('🎯 Final query:', JSON.stringify(query, null, 2));

    // Determine sort order
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

    console.log('📨 Found posts:', posts.length);

    // Get post IDs for batch fetching
    const postIds = posts.map(post => post._id);

    // Batch fetch user interactions and saves
    const { userLikes, userSaves } = await fetchUserEngagementForPosts(req.user.userId, postIds);

    // Merge engagement data
    const postsWithEngagement = mergeEngagementData(posts, userLikes, userSaves, req.user.userId);

    const total = await Post.countDocuments(query);

    console.log('✅ Feed response:', {
      success: true,
      postCount: postsWithEngagement.length,
      totalPosts: total,
      userId: req.user.userId
    });

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

    // Professional access control
    if (post.status !== 'active' && !(req.user && (post.author._id.equals(req.user.userId) || req.user.role === 'admin'))) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }

    // Check visibility for non-public posts
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

    // Increment view count for authenticated users (atomic update)
    if (req.user) {
      await Post.findByIdAndUpdate(
        id,
        { $inc: { 'stats.views': 1 } }
      );
      // Update the post object with incremented view count
      post.stats.views = (post.stats.views || 0) + 1;
    }

    // Get user's interaction and save status
    const [userLike, userSave] = await Promise.all([
      Like.findOne({
        user: req.user.userId,
        targetType: 'Post',
        targetId: post._id
      }),
      Save.findOne({
        user: req.user.userId,
        targetType: 'Post',
        targetId: post._id
      })
    ]);

    // Determine engagement state
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

    // Ensure stats exist
    const stats = post.stats || {
      likes: 0,
      dislikes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      saves: 0
    };

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

// Professional post update with Cloudinary media handling - UPDATED VERSION
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📨 Received update request:', {
      id,
      bodyKeys: Object.keys(req.body),
      cloudinaryMedia: !!req.cloudinaryMedia,
      cloudinaryMediaCount: Array.isArray(req.cloudinaryMedia?.media) ? req.cloudinaryMedia.media.length :
        req.cloudinaryMedia?.media ? 1 : 0,
      timestamp: new Date().toISOString()
    });

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }

    // Professional ownership check
    if (!post.author.equals(req.user.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts',
        code: 'EDIT_PERMISSION_DENIED'
      });
    }

    // Helper function to generate proper thumbnail URL
    const generateProperThumbnailUrl = (mediaItem) => {
      // If thumbnailUrl is provided and valid, use it
      if (mediaItem.thumbnailUrl && !mediaItem.thumbnailUrl.includes('.mp4.jpg')) {
        return mediaItem.thumbnailUrl;
      }

      // For videos, generate proper Cloudinary video thumbnail
      if (mediaItem.type === 'video' && mediaItem.cloudinary?.secure_url) {
        const videoUrl = mediaItem.cloudinary.secure_url;
        // Cloudinary video thumbnail transformation - no .jpg extension
        if (videoUrl.includes('/upload/')) {
          return videoUrl.replace('/upload/', '/upload/w_600,h_400,c_fill/');
        }
        return videoUrl;
      }

      // For images, use the secure_url with transformation
      if (mediaItem.type === 'image' && mediaItem.cloudinary?.secure_url) {
        const imageUrl = mediaItem.cloudinary.secure_url;
        if (imageUrl.includes('/upload/')) {
          return imageUrl.replace('/upload/', '/upload/w_600,h_400,c_fill/');
        }
        return imageUrl;
      }

      // Fallback
      return mediaItem.thumbnailUrl || mediaItem.cloudinary?.secure_url || '';
    };

    // Start with existing post data
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

    console.log('📊 Initial media state:', {
      existingCount: post.media.length,
      finalMediaCount: finalMedia.length
    });

    // FIX 1: Handle media removal - Fixed array mutation issues
    if (req.body.mediaToRemove && finalMedia.length > 0) {
      try {
        let mediaToRemove = [];
        if (typeof req.body.mediaToRemove === 'string') {
          mediaToRemove = JSON.parse(req.body.mediaToRemove);
        } else if (Array.isArray(req.body.mediaToRemove)) {
          mediaToRemove = req.body.mediaToRemove;
        }

        console.log('🗑️ Processing media removal:', {
          requestCount: mediaToRemove.length,
          currentMediaCount: finalMedia.length,
          mediaIds: mediaToRemove
        });

        // Create a new array instead of modifying in-place to avoid index issues
        const remainingMedia = [];
        const toDelete = [];

        finalMedia.forEach((mediaItem) => {
          const shouldRemove =
            mediaToRemove.includes(mediaItem.public_id) ||
            mediaToRemove.includes(mediaItem._id?.toString()) ||
            mediaToRemove.includes(mediaItem.url) ||
            mediaToRemove.includes(mediaItem.secure_url);

          if (shouldRemove) {
            if (mediaItem.public_id) {
              toDelete.push(mediaItem.public_id);
            }
            console.log(`🗑️ Marked for removal: ${mediaItem.public_id || mediaItem._id}`);
          } else {
            remainingMedia.push(mediaItem);
          }
        });

        finalMedia = remainingMedia;
        mediaToDelete = [...mediaToDelete, ...toDelete];

        console.log('✅ Media removal complete:', {
          removedCount: toDelete.length,
          remainingCount: finalMedia.length
        });

      } catch (error) {
        console.error('❌ Failed to parse mediaToRemove:', error);
        // Don't fail the entire update if media removal parsing fails
      }
    }

    // FIX 2: Handle existing media updates (reordering, descriptions)
    if (req.body.media && finalMedia.length > 0) {
      try {
        let updatedMedia = [];
        if (typeof req.body.media === 'string') {
          updatedMedia = JSON.parse(req.body.media);
        } else if (Array.isArray(req.body.media)) {
          updatedMedia = req.body.media;
        }

        console.log('🔄 Processing media updates:', {
          updateCount: updatedMedia.length,
          currentMediaCount: finalMedia.length
        });

        // Create a map for quick lookup
        const mediaMap = new Map();
        finalMedia.forEach((item, index) => {
          const key = item._id?.toString() || item.public_id;
          if (key) {
            mediaMap.set(key, { item, index });
          }
        });

        // Update existing media items (descriptions, order)
        updatedMedia.forEach(updatedItem => {
          const key = updatedItem._id || updatedItem.public_id;
          if (key && mediaMap.has(key)) {
            const { index } = mediaMap.get(key);

            // Update existing item
            if (updatedItem.description !== undefined) {
              finalMedia[index].description = updatedItem.description;
            }
            if (updatedItem.order !== undefined) {
              finalMedia[index].order = updatedItem.order;
            }

            console.log(`🔄 Updated media: ${key}`, {
              description: updatedItem.description !== undefined,
              order: updatedItem.order !== undefined
            });
          } else {
            console.log(`⚠️ Media not found for update: ${key}`);
          }
        });

        // Sort by order if specified
        const hasOrderUpdates = updatedMedia.some(item => item.order !== undefined);
        if (hasOrderUpdates) {
          finalMedia.sort((a, b) => (a.order || 0) - (b.order || 0));
          console.log('🔄 Sorted media by order');
        }

      } catch (error) {
        console.error('❌ Failed to process media updates:', error);
        // Don't fail the entire update if media update parsing fails
      }
    }

    // FIX 3: Handle new Cloudinary media uploads
    if (req.cloudinaryMedia?.media) {
      console.log('📤 Processing new Cloudinary media uploads');

      let newMediaItems = [];

      // Handle single upload
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
          // Backward compatibility fields
          url: mediaItem.cloudinary.secure_url,
          thumbnail: generateProperThumbnailUrl(mediaItem), // FIXED: Use helper function
          originalName: mediaItem.originalName,
          size: mediaItem.size,
          mimeType: mediaItem.mimetype,
          description: req.body.mediaDescription || '',
          order: finalMedia.length
        };

        newMediaItems.push(formattedMedia);
      }
      // Handle multiple uploads
      else if (Array.isArray(req.cloudinaryMedia.media)) {
        newMediaItems = req.cloudinaryMedia.media
          .filter(mediaItem => mediaItem.success !== false) // Skip failed uploads
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
            // Backward compatibility fields
            url: mediaItem.cloudinary.secure_url,
            thumbnail: generateProperThumbnailUrl(mediaItem), // FIXED: Use helper function
            originalName: mediaItem.originalName,
            size: mediaItem.size,
            mimeType: mediaItem.mimetype,
            description: req.body.mediaDescription || '',
            order: finalMedia.length + index
          }));
      }

      // Add new media to final array
      finalMedia = [...finalMedia, ...newMediaItems];
      console.log(`✅ Added ${newMediaItems.length} new media items`);
    }

    // Update media array and determine post type
    updateData.media = finalMedia;

    if (finalMedia.length > 0) {
      const hasVideo = finalMedia.some(m => m.type === 'video');
      const hasImage = finalMedia.some(m => m.type === 'image');

      if (hasVideo) updateData.type = 'video';
      else if (hasImage) updateData.type = 'image';
    } else if (!updateData.content || updateData.content.trim() === '') {
      updateData.type = 'text';
    } else {
      updateData.type = post.type; // Keep existing type
    }

    console.log('🔄 Final update data:', {
      contentLength: updateData.content?.length,
      mediaCount: updateData.media.length,
      type: updateData.type,
      mediaToDeleteCount: mediaToDelete.length,
      finalMediaIds: finalMedia.map(m => m.public_id || m._id).slice(0, 5) // Log first 5
    });

    // Atomic update operation
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
        context: 'query'
      }
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

    // FIX 4: Staggered Cloudinary deletions after successful update
    if (mediaToDelete.length > 0) {
      console.log('🗑️ Scheduling Cloudinary deletions:', {
        count: mediaToDelete.length,
        ids: mediaToDelete.slice(0, 3) // Log first 3
      });

      const cloudinaryStorageService = require('../services/cloudinaryStorageService');

      // Stagger deletions to avoid rate limits
      mediaToDelete.forEach((publicId, index) => {
        setTimeout(async () => {
          try {
            const result = await cloudinaryStorageService.deleteFile(publicId);
            if (result.success) {
              console.log(`✅ Deleted media from Cloudinary: ${publicId}`);
            } else {
              console.error(`❌ Failed to delete media from Cloudinary: ${publicId}`, result.error);
            }
          } catch (error) {
            console.error(`❌ Error deleting media from Cloudinary: ${publicId}`, error);
          }
        }, index * 200); // 200ms delay between deletions
      });
    }

    console.log('✅ Post updated successfully:', updatedPost._id);

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

    // Professional ownership check
    if (!post.author.equals(req.user.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts',
        code: 'DELETE_PERMISSION_DENIED'
      });
    }

    // Delete all media files from Cloudinary
    if (post.media && Array.isArray(post.media)) {
      const cloudinaryStorageService = require('../services/cloudinaryStorageService');

      // Delete each media item asynchronously
      post.media.forEach(mediaItem => {
        if (mediaItem.public_id) {
          cloudinaryStorageService.deleteFile(mediaItem.public_id)
            .then(result => {
              if (result.success) {
                console.log(`✅ Deleted media from Cloudinary: ${mediaItem.public_id}`);
              } else {
                console.error(`❌ Failed to delete media from Cloudinary: ${mediaItem.public_id}`, result.error);
              }
            })
            .catch(error => {
              console.error(`❌ Error deleting media from Cloudinary: ${mediaItem.public_id}`, error);
            });
        }
      });
    }

    if (permanent && req.user.role === 'admin') {
      // Permanent deletion (admin only)
      await Post.findByIdAndDelete(id);
    } else {
      // Soft delete
      post.status = 'deleted';
      post.deletedAt = new Date();
      await post.save();
    }

    // Update user's post count
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

    console.log('🔍 Profile posts request:', {
      requestedProfile: profileId,
      requestingUser: req.user.userId
    });

    let query = {
      $or: [
        { author: profileId }
      ],
      status: 'active'
    };

    // Include shared posts if requested
    if (includeShared === 'true') {
      query.$or.push({ originalAuthor: profileId });
    }

    // Filter by post type if specified
    if (type) {
      query.type = type;
    }

    // Professional privacy check
    const isOwnProfile = profileId === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      // Check if profile is private
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

        // For private profiles, only show posts visible to connections
        query.visibility = { $in: ['connections', 'public'] };
      } else {
        // For public profiles, show public and connections posts
        query.visibility = { $in: ['public', 'connections'] };
      }
    }

    console.log('🎯 Profile Posts query:', JSON.stringify(query, null, 2));

    const posts = await Post.find(query)
      .populate('author', 'name avatar headline role verificationStatus company')
      .populate('originalAuthor', 'name avatar headline')
      .populate('sharedPost')
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('📨 Found profile posts:', posts.length);

    // Get post IDs for batch fetching
    const postIds = posts.map(post => post._id);

    // Batch fetch user interactions and saves
    const { userLikes, userSaves } = await fetchUserEngagementForPosts(req.user.userId, postIds);

    // Merge engagement data
    const postsWithEngagement = mergeEngagementData(posts, userLikes, userSaves, req.user.userId);

    const total = await Post.countDocuments(query);

    console.log('✅ Profile Posts response:', {
      success: true,
      postCount: postsWithEngagement.length,
      totalPosts: total,
      profileId: profileId
    });

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

    // Increment share count on original post
    await originalPost.incrementStats('shares');

    // Update user's post count
    const Profile = require('../models/Profile');
    await Profile.updateOne(
      { user: req.user.userId },
      { $inc: { 'socialStats.postCount': 1 } }
    );

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

    await Post.findByIdAndUpdate(postId, {
      $inc: { 'stats.saves': 1 }
    });

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

    await Post.findByIdAndUpdate(postId, {
      $inc: { 'stats.saves': -1 }
    });

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

    // Get saved post IDs
    const saves = await Save.find({
      user: req.user.userId,
      targetType: 'Post'
    })
      .select('targetId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const postIds = saves.map(save => save.targetId);

    // Get posts with their save status
    const posts = await Post.find({
      _id: { $in: postIds },
      status: 'active'
    })
      .populate('author', 'name avatar headline role verificationStatus company')
      .populate('originalAuthor', 'name avatar headline')
      .populate('sharedPost')
      .sort({ createdAt: -1 });

    // Get like status for current user
    const userLikes = await Like.find({
      user: req.user.userId,
      targetType: 'Post',
      targetId: { $in: postIds }
    });

    // Get save status for current user (all should be saved)
    const userSaves = await Save.find({
      user: req.user.userId,
      targetType: 'Post',
      targetId: { $in: postIds }
    });

    const postsWithEngagement = posts.map(post => {
      const postObj = post.toObject();
      const userLike = userLikes.find(like => like.targetId.equals(post._id));
      const isSaved = userSaves.some(save => save.targetId.equals(post._id));

      // Determine engagement state
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

      // Ensure stats exist
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
        canEdit: post.author._id.equals(req.user.userId) || req.user.role === 'admin',
        canDelete: post.author._id.equals(req.user.userId) || req.user.role === 'admin'
      };
    });

    // Maintain original save order
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
        { author: req.user.userId },                    // User's own posts
        { originalAuthor: req.user.userId }            // Posts shared by user
      ]
    };

    console.log('🔍 My Posts request from user:', req.user.userId);

    // Filter by status (allow seeing deleted posts for owner)
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'deleted' };
    }

    // Filter by post type if specified
    if (type) {
      query.type = type;
    }

    console.log('🎯 My Posts query:', JSON.stringify(query, null, 2));

    const posts = await Post.find(query)
      .populate('author', 'name avatar headline role verificationStatus company')
      .populate('originalAuthor', 'name avatar headline')
      .populate('sharedPost')
      .sort({ createdAt: -1, pinned: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('📨 Found my posts:', posts.length);

    const total = await Post.countDocuments(query);

    // Get post IDs for batch fetching
    const postIds = posts.map(post => post._id);

    // Batch fetch user interactions and saves
    const { userLikes, userSaves } = await fetchUserEngagementForPosts(req.user.userId, postIds);

    // Merge engagement data
    const postsWithEngagement = mergeEngagementData(posts, userLikes, userSaves, req.user.userId);

    console.log('✅ My Posts response:', {
      success: true,
      postCount: postsWithEngagement.length,
      totalPosts: total
    });

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