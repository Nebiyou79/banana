// controllers/followController.js
const Follow = require('../models/Follow');
const User = require('../models/User');
const Profile = require('../models/Profile');
const mongoose = require('mongoose');

class FollowController {
   constructor() {
    // Bind all methods to maintain 'this' context
    this.toggleFollow = this.toggleFollow.bind(this);
    this.getFollowStatus = this.getFollowStatus.bind(this);
    this.getFollowers = this.getFollowers.bind(this);
    this.getFollowing = this.getFollowing.bind(this);
    this.getPendingRequests = this.getPendingRequests.bind(this);
    this.acceptFollowRequest = this.acceptFollowRequest.bind(this);
    this.rejectFollowRequest = this.rejectFollowRequest.bind(this);
    this.getFollowSuggestions = this.getFollowSuggestions.bind(this);
    this.getFollowStats = this.getFollowStats.bind(this);
    
    // Bind helper methods
    this.findTarget = this.findTarget.bind(this);
    this.handleUnfollow = this.handleUnfollow.bind(this);
    this.handleFollow = this.handleFollow.bind(this);
    this.updateFollowerCounts = this.updateFollowerCounts.bind(this);
    this.updateFollowingCount = this.updateFollowingCount.bind(this);
  }

  // Toggle follow/unfollow
  async toggleFollow(req, res) {
    try {
      const { targetId } = req.params;
      const { targetType = 'User', followSource = 'manual' } = req.body;
      const followerId = req.user.userId;

      console.log('Toggle follow called:', { targetId, targetType, followerId });

      // Validate input
      if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid target ID is required'
        });
      }

      if (!['User', 'Company', 'Organization'].includes(targetType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target type'
        });
      }

      // Check if target exists
      const target = await this.findTarget(targetType, targetId);
      if (!target) {
        return res.status(404).json({
          success: false,
          message: `${targetType} not found`
        });
      }

      // Prevent self-follow for users
      if (targetType === 'User' && targetId === followerId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot follow yourself'
        });
      }

      const existingFollow = await Follow.findOne({
        follower: followerId,
        targetType,
        targetId
      });

      if (existingFollow) {
        // Unfollow logic
        return await this.handleUnfollow(existingFollow, targetType, followerId, targetId, res);
      } else {
        // Follow logic
        return await this.handleFollow(followerId, targetType, targetId, followSource, target, res);
      }
    } catch (error) {
      console.error('Toggle follow error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while toggling follow'
      });
    }
  }

  // Check follow status
  async getFollowStatus(req, res) {
    try {
      const { targetId } = req.params;
      const { targetType = 'User' } = req.query;
      const followerId = req.user.userId;

      if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid target ID is required'
        });
      }

      const follow = await Follow.getFollowStatus(followerId, targetType, targetId);

      res.json({
        success: true,
        data: {
          following: !!follow && follow.status === 'accepted',
          status: follow ? follow.status : 'none',
          follow: follow || null
        }
      });
    } catch (error) {
      console.error('Get follow status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking follow status'
      });
    }
  }

  // Get followers with advanced filtering
  async getFollowers(req, res) {
    try {
      const { 
        targetType = 'User', 
        targetId = req.user.userId,
        page = 1, 
        limit = 50,
        status = 'accepted'
      } = req.query;

      const options = {
        page: Math.max(1, parseInt(page)),
        limit: Math.min(100, Math.max(1, parseInt(limit))),
        status
      };

      const followers = await Follow.getFollowers(targetType, targetId, options);

      const total = await Follow.countDocuments({
        targetType,
        targetId,
        status
      });

      res.json({
        success: true,
        data: followers,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      });
    } catch (error) {
      console.error('Get followers error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching followers'
      });
    }
  }

  // Get following with filtering
  async getFollowing(req, res) {
    try {
      const { 
        targetType, 
        page = 1, 
        limit = 50,
        status = 'accepted'
      } = req.query;

      const options = {
        page: Math.max(1, parseInt(page)),
        limit: Math.min(100, Math.max(1, parseInt(limit))),
        targetType,
        status
      };

      const following = await Follow.getFollowing(req.user.userId, options);

      const query = { follower: req.user.userId, status };
      if (targetType) query.targetType = targetType;

      const total = await Follow.countDocuments(query);

      res.json({
        success: true,
        data: following,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      });
    } catch (error) {
      console.error('Get following error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching following'
      });
    }
  }

  // Get pending follow requests
  async getPendingRequests(req, res) {
    try {
      const { 
        targetType = 'User',
        page = 1, 
        limit = 50 
      } = req.query;

      const options = {
        page: Math.max(1, parseInt(page)),
        limit: Math.min(100, Math.max(1, parseInt(limit)))
      };

      const pendingRequests = await Follow.getPendingRequests(
        targetType, 
        req.user.userId, 
        options
      );

      const total = await Follow.countDocuments({
        targetType,
        targetId: req.user.userId,
        status: 'pending'
      });

      res.json({
        success: true,
        data: pendingRequests,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      });
    } catch (error) {
      console.error('Get pending requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching pending requests'
      });
    }
  }

  // Accept follow request
  async acceptFollowRequest(req, res) {
    try {
      const { followId } = req.params;

      const follow = await Follow.findById(followId);
      
      if (!follow) {
        return res.status(404).json({
          success: false,
          message: 'Follow request not found'
        });
      }

      // Check if current user is the target of the follow request
      if (follow.targetId.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to accept this follow request'
        });
      }

      if (follow.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Follow request is not pending'
        });
      }

      await follow.accept();

      // Update follower counts
      await this.updateFollowerCounts(follow.targetType, follow.targetId, 1);

      res.json({
        success: true,
        message: 'Follow request accepted',
        data: { follow }
      });
    } catch (error) {
      console.error('Accept follow request error:', error);
      res.status(500).json({
        success: false,
        message: 'Error accepting follow request'
      });
    }
  }

  // Reject follow request
  async rejectFollowRequest(req, res) {
    try {
      const { followId } = req.params;

      const follow = await Follow.findById(followId);
      
      if (!follow) {
        return res.status(404).json({
          success: false,
          message: 'Follow request not found'
        });
      }

      if (follow.targetId.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to reject this follow request'
        });
      }

      await follow.reject();

      res.json({
        success: true,
        message: 'Follow request rejected'
      });
    } catch (error) {
      console.error('Reject follow request error:', error);
      res.status(500).json({
        success: false,
        message: 'Error rejecting follow request'
      });
    }
  }

  // Get AI-based follow suggestions - SIMPLIFIED VERSION
  async getFollowSuggestions(req, res) {
    try {
      const { limit = 10, algorithm = 'popular' } = req.query;
      const userId = req.user.userId;

      let suggestions = [];

      // Get current user's following to exclude them
      const userFollowing = await Follow.find({
        follower: userId,
        status: 'accepted'
      }).select('targetId');

      const followingIds = userFollowing.map(f => f.targetId);
      followingIds.push(userId); // Exclude self

      // SIMPLIFIED: Always use popular algorithm for now
      const popularProfiles = await Profile.find({
        user: { $nin: followingIds }
      })
      .populate('user', 'name avatar headline role verificationStatus')
      .sort({ 'socialStats.followerCount': -1 })
      .limit(parseInt(limit));

      suggestions = popularProfiles.map(profile => ({
        _id: profile.user._id,
        name: profile.user.name,
        avatar: profile.user.avatar,
        headline: profile.headline,
        role: profile.user.role,
        verificationStatus: profile.user.verificationStatus,
        reason: 'Popular in your network',
        mutualConnections: 0,
        followerCount: profile.socialStats.followerCount
      }));

      res.json({
        success: true,
        data: suggestions,
        algorithm: 'popular' // Force popular for now
      });
    } catch (error) {
      console.error('Get follow suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching follow suggestions: ' + error.message
      });
    }
  }

  // Get follow statistics
  async getFollowStats(req, res) {
    try {
      const { targetType = 'User', targetId = req.user.userId } = req.query;

      const counts = await Follow.getFollowCounts(targetType, targetId);
      
      // Additional stats
      const pendingCount = await Follow.countDocuments({
        targetType,
        targetId,
        status: 'pending'
      });

      const stats = {
        ...counts,
        pendingRequests: pendingCount,
        totalConnections: counts.followers + counts.following
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get follow stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching follow statistics'
      });
    }
  }

  // Helper methods - REGULAR METHODS (not private)
  async findTarget(targetType, targetId) {
    try {
      console.log('Finding target:', { targetType, targetId });
      
      switch (targetType) {
        case 'User':
          const user = await User.findById(targetId);
          console.log('User found:', user ? 'Yes' : 'No');
          return user;
        case 'Company':
          const Company = require('../models/Company');
          return await Company.findById(targetId);
        case 'Organization':
          const Organization = require('../models/Organization');
          return await Organization.findById(targetId);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error finding target:', error);
      return null;
    }
  }

  async handleUnfollow(existingFollow, targetType, followerId, targetId, res) {
    console.log('Handling unfollow:', { existingFollow: existingFollow._id });
    
    await Follow.findByIdAndDelete(existingFollow._id);

    // Update follower counts
    await this.updateFollowerCounts(targetType, targetId, -1);
    await this.updateFollowingCount(followerId, -1);

    res.json({
      success: true,
      message: 'Unfollowed successfully',
      data: { following: false }
    });
  }

  async handleFollow(followerId, targetType, targetId, followSource, target, res) {
    console.log('Handling follow:', { followerId, targetType, targetId });
    
    const followData = {
      follower: followerId,
      targetType,
      targetId,
      followSource,
      status: 'accepted'
    };

    const follow = new Follow(followData);
    await follow.save();
    await follow.populate('targetId', 'name avatar headline verificationStatus');

    // Update follower counts
    await this.updateFollowerCounts(targetType, targetId, 1);
    await this.updateFollowingCount(followerId, 1);

    res.status(201).json({
      success: true,
      message: 'Followed successfully',
      data: {
        following: true,
        follow: follow
      }
    });
  }

  async updateFollowerCounts(targetType, targetId, increment) {
    try {
      if (targetType === 'User') {
        await Profile.updateOne(
          { user: targetId },
          { $inc: { 'socialStats.followerCount': increment } }
        );
      }
      // Add similar logic for Company and Organization if needed
    } catch (error) {
      console.error('Error updating follower counts:', error);
    }
  }

  async updateFollowingCount(userId, increment) {
    try {
      await Profile.updateOne(
        { user: userId },
        { $inc: { 'socialStats.followingCount': increment } }
      );
    } catch (error) {
      console.error('Error updating following count:', error);
    }
  }
}

module.exports = new FollowController();