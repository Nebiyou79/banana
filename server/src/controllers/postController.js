const Post = require('../models/Post');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const { uploadToCloudinary, processImageMetadata } = require('../middleware/upload');

// Create new post with professional media handling
exports.createPost = async (req, res) => {
  try {
    const {
      content,
      type = 'text',
      media = [],
      linkPreview,
      poll,
      job,
      visibility = 'public',
      allowComments = true,
      allowSharing = true,
      location,
      expiresAt,
      pinned = false
    } = req.body;

    // Validate content or media requirement
    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Post must contain either content or media'
      });
    }

    // Process file uploads with enhanced metadata
    let processedMedia = [];

    // Parse existing media if provided as string
    if (media && typeof media === 'string') {
      try {
        processedMedia = JSON.parse(media);
      } catch (parseError) {
        console.error('Failed to parse media:', parseError);
        processedMedia = [];
      }
    } else if (Array.isArray(media)) {
      processedMedia = [...media];
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const uploadResult = await uploadToCloudinary(file, 'posts');

        // Get additional metadata for images
        let dimensions = {};
        if (file.mimetype.startsWith('image/')) {
          dimensions = await processImageMetadata(file);
        }

        return {
          url: uploadResult.url,
          type: file.mimetype.startsWith('image/') ? 'image' :
            file.mimetype.startsWith('video/') ? 'video' : 'document',
          thumbnail: uploadResult.thumbnail,
          description: '',
          order: processedMedia.length,
          filename: uploadResult.public_id,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          dimensions: dimensions
        };
      });

      const uploadResults = await Promise.all(uploadPromises);
      processedMedia = [...processedMedia, ...uploadResults];
    }

    // Determine post type
    let postType = type;
    if (processedMedia.length > 0) {
      const hasVideo = processedMedia.some(m => m.type === 'video');
      const hasImage = processedMedia.some(m => m.type === 'image');

      if (hasVideo) postType = 'video';
      else if (hasImage) postType = 'image';
    }

    const post = new Post({
      author: req.user.userId,
      authorModel: 'User',
      content: content || '',
      type: postType,
      media: processedMedia,
      linkPreview,
      poll,
      job,
      visibility,
      allowComments,
      allowSharing,
      location,
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
      data: post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
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

    // Get like status for current user
    const postIds = posts.map(post => post._id);
    const userLikes = await Like.find({
      user: req.user.userId,
      targetType: 'Post',
      targetId: { $in: postIds }
    });

    const postsWithEngagement = posts.map(post => {
      const postObj = post.toObject();
      const userLike = userLikes.find(like => like.targetId.equals(post._id));

      return {
        ...postObj,
        userReaction: userLike ? userLike.reaction : null,
        hasLiked: !!userLike,
        canEdit: post.author._id.equals(req.user.userId) || req.user.role === 'admin',
        canDelete: post.author._id.equals(req.user.userId) || req.user.role === 'admin'
      };
    });

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
      message: 'Error fetching feed posts'
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
        message: 'Post not found'
      });
    }

    // Professional access control
    if (post.status !== 'active' && !(req.user && (post.author._id.equals(req.user.userId) || req.user.role === 'admin'))) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check visibility for non-public posts
    if (post.visibility !== 'public' && req.user) {
      if (!post.author._id.equals(req.user.userId)) {
        if (post.visibility === 'private') {
          return res.status(403).json({
            success: false,
            message: 'This post is private'
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
              message: 'This post is only visible to connections'
            });
          }
        }
      }
    }

    // Increment view count for authenticated users
    if (req.user) {
      post.stats.views += 1;
      await post.save();
    }

    // Get user's like status if authenticated
    let userLike = null;
    if (req.user) {
      userLike = await Like.findOne({
        user: req.user.userId,
        targetType: 'Post',
        targetId: post._id
      });
    }

    const postWithEngagement = {
      ...post.toObject(),
      userReaction: userLike ? userLike.reaction : null,
      hasLiked: !!userLike,
      canEdit: req.user && (post.author._id.equals(req.user.userId) || req.user.role === 'admin'),
      canDelete: req.user && (post.author._id.equals(req.user.userId) || req.user.role === 'admin')
    };

    res.json({
      success: true,
      data: postWithEngagement
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post'
    });
  }
};

// Professional post update with media handling - COMPLETELY FIXED VERSION
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📨 Received update request:', {
      id,
      bodyKeys: Object.keys(req.body),
      filesCount: req.files?.length || 0,
      hasMedia: !!req.body.media,
      mediaType: typeof req.body.media
    });

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Professional ownership check
    if (!post.author.equals(req.user.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    // Start with existing post data
    let updateData = {
      content: req.body.content !== undefined ? req.body.content : post.content,
      visibility: req.body.visibility !== undefined ? req.body.visibility : post.visibility,
      allowComments: req.body.allowComments !== undefined ? req.body.allowComments : post.allowComments,
      allowSharing: req.body.allowSharing !== undefined ? req.body.allowSharing : post.allowSharing,
      pinned: req.body.pinned !== undefined ? req.body.pinned : post.pinned
    };

    // Handle media removal first
    let finalMedia = [...post.media];

    if (req.body.mediaToRemove) {
      let mediaToRemove = [];
      try {
        if (typeof req.body.mediaToRemove === 'string') {
          mediaToRemove = JSON.parse(req.body.mediaToRemove);
        } else if (Array.isArray(req.body.mediaToRemove)) {
          mediaToRemove = req.body.mediaToRemove;
        }
        console.log('🗑️ Removing media:', mediaToRemove);

        finalMedia = finalMedia.filter(mediaItem =>
          !mediaToRemove.includes(mediaItem.url) &&
          !mediaToRemove.includes(mediaItem._id?.toString())
        );
      } catch (error) {
        console.error('❌ Failed to parse mediaToRemove:', error);
      }
    }

    // Handle existing media updates
    if (req.body.media) {
      try {
        let updatedMedia = [];
        if (typeof req.body.media === 'string') {
          updatedMedia = JSON.parse(req.body.media);
        } else if (Array.isArray(req.body.media)) {
          updatedMedia = req.body.media;
        }

        console.log('🔄 Processing media updates:', updatedMedia.length);

        // Merge existing media with updates, preserving order
        const existingMediaMap = new Map();
        finalMedia.forEach(item => {
          if (item._id) {
            existingMediaMap.set(item._id.toString(), item);
          }
        });

        // Apply updates to existing media
        updatedMedia.forEach(updatedItem => {
          if (updatedItem._id && existingMediaMap.has(updatedItem._id)) {
            // Update existing media item
            const existingItem = existingMediaMap.get(updatedItem._id);
            Object.assign(existingItem, updatedItem);
          } else if (!updatedItem._id) {
            // This is new media from client (shouldn't happen in updates, but handle it)
            finalMedia.push(updatedItem);
          }
        });

      } catch (error) {
        console.error('❌ Failed to process media updates:', error);
      }
    }

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      console.log('📤 Uploading new media files:', req.files.length);

      const uploadPromises = req.files.map(async (file, index) => {
        const uploadResult = await uploadToCloudinary(file, 'posts');

        let dimensions = {};
        if (file.mimetype.startsWith('image/')) {
          dimensions = await processImageMetadata(file);
        }

        return {
          url: uploadResult.url,
          type: file.mimetype.startsWith('image/') ? 'image' :
            file.mimetype.startsWith('video/') ? 'video' : 'document',
          thumbnail: uploadResult.thumbnail,
          description: req.body.mediaDescription || '',
          order: finalMedia.length + index,
          filename: uploadResult.public_id,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          dimensions: dimensions
        };
      });

      const uploadResults = await Promise.all(uploadPromises);
      finalMedia = [...finalMedia, ...uploadResults];
    }

    // Update media array and determine post type
    updateData.media = finalMedia;

    if (finalMedia.length > 0) {
      const hasVideo = finalMedia.some(m => m.type === 'video');
      const hasImage = finalMedia.some(m => m.type === 'image');

      if (hasVideo) updateData.type = 'video';
      else if (hasImage) updateData.type = 'image';
      else updateData.type = 'document';
    } else if (!updateData.content || updateData.content.trim() === '') {
      updateData.type = 'text';
    } else {
      updateData.type = post.type; // Keep existing type
    }

    console.log('🔄 Final update data:', {
      contentLength: updateData.content?.length,
      mediaCount: updateData.media.length,
      type: updateData.type
    });

    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
        context: 'query' // This helps with array validation
      }
    )
      .populate('author', 'name avatar headline role verificationStatus company')
      .populate('originalAuthor', 'name avatar headline')
      .populate('job');

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found after update'
      });
    }

    console.log('✅ Post updated successfully:', updatedPost._id);

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post: ' + error.message
    });
  }
};

// Professional post deletion
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Professional ownership check
    if (!post.author.equals(req.user.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    if (permanent && req.user.role === 'admin') {
      // Permanent deletion (admin only)
      await Post.findByIdAndDelete(id);
    } else {
      // Soft delete
      post.status = 'deleted';
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
      message: permanent ? 'Post permanently deleted' : 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post'
    });
  }
};

// Get posts by specific profile with professional filtering - FIXED VERSION
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
            message: 'This profile is private'
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

    // Get like status for current user
    const postIds = posts.map(post => post._id);
    const userLikes = await Like.find({
      user: req.user.userId,
      targetType: 'Post',
      targetId: { $in: postIds }
    });

    const postsWithEngagement = posts.map(post => {
      const postObj = post.toObject();
      const userLike = userLikes.find(like => like.targetId.equals(post._id));

      return {
        ...postObj,
        userReaction: userLike ? userLike.reaction : null,
        hasLiked: !!userLike,
        canEdit: post.author._id.equals(req.user.userId) || req.user.role === 'admin',
        canDelete: post.author._id.equals(req.user.userId) || req.user.role === 'admin'
      };
    });

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
      message: 'Error fetching profile posts'
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
        message: 'Original post not found'
      });
    }

    if (!originalPost.allowSharing) {
      return res.status(403).json({
        success: false,
        message: 'This post cannot be shared'
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
      data: sharedPost
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing post'
    });
  }
};

// Get user's own posts for professional dashboard - FIXED VERSION
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

    // Get like status for current user
    const postIds = posts.map(post => post._id);
    const userLikes = await Like.find({
      user: req.user.userId,
      targetType: 'Post',
      targetId: { $in: postIds }
    });

    const postsWithEngagement = posts.map(post => {
      const postObj = post.toObject();
      const userLike = userLikes.find(like => like.targetId.equals(post._id));

      return {
        ...postObj,
        userReaction: userLike ? userLike.reaction : null,
        hasLiked: !!userLike,
        canEdit: true, // User can always edit their own posts
        canDelete: true // User can always delete their own posts
      };
    });

    console.log('✅ My Posts response:', {
      success: true,
      postCount: postsWithEngagement.length,
      totalPosts: total
    });

    res.json({
      success: true,
      data: postsWithEngagement,
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
      message: 'Error fetching your posts'
    });
  }
};