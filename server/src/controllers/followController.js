/**
 * server/src/controllers/followController.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Follow Controller with Notifications
 * ────────────────────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');
const Follow = require('../models/Follow');
const User = require('../models/User');
// 🔔 NOTIFICATION
const notificationService = require('../services/notificationService');

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

async function bumpStat(userId, field, delta) {
  try {
    if (!userId) return;
    await User.findByIdAndUpdate(userId, {
      $inc: { [`socialStats.${field}`]: delta },
    });
  } catch (err) {
    console.warn('bumpStat failed:', field, delta, err.message);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * toggleFollow
 * POST /follow/:targetId
 * ────────────────────────────────────────────────────────────────────────── */
exports.toggleFollow = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const { targetId } = req.params;
    const { targetType = 'User', followSource = 'manual' } = req.body || {};

    console.log('➡️  Handling follow:', {
      followerId,
      targetId,
      targetType,
      followSource,
    });

    if (!isValidObjectId(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid targetId' });
    }

    if (followerId === targetId && targetType === 'User') {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const existing = await Follow.findOne({
      follower: followerId,
      targetType,
      targetId,
    });

    // ── UNFOLLOW path ────────────────────────────────────────────────────
    if (existing && existing.status === 'active') {
      await existing.deleteOne();

      await Promise.all([
        bumpStat(followerId, 'followingCount', -1),
        targetType === 'User'
          ? bumpStat(targetId, 'followerCount', -1)
          : Promise.resolve(),
      ]);

      // 🔔 NOTIFICATION: Dismiss follow notification
      (async () => {
        try {
          await notificationService.dismissGrouped(`new_follower:${targetId}`, followerId);
        } catch (notifErr) {
          console.warn('[Notification] Non-critical error:', notifErr.message);
        }
      })();
      // END NOTIFICATION

      return res.json({
        success: true,
        message: 'Unfollowed',
        data: { following: false, isConnected: false, follow: null },
      });
    }

    // ── Blocked? ─────────────────────────────────────────────────────────
    if (existing && existing.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Cannot follow a blocked target',
      });
    }

    // ── FOLLOW path ──────────────────────────────────────────────────────
    const follow = await Follow.create({
      follower: followerId,
      targetType,
      targetId,
      followSource,
      status: 'active',
      followedAt: new Date(),
    });

    await Promise.all([
      bumpStat(followerId, 'followingCount', 1),
      targetType === 'User'
        ? bumpStat(targetId, 'followerCount', 1)
        : Promise.resolve(),
    ]);

    // 🔔 NOTIFICATION: New follower
    (async () => {
      try {
        await notificationService.create({
          recipient: targetId,
          actor: followerId,
          type: 'new_follower',
          title: 'New follower',
          body: `{actorName} started following you`,
          data: {
            entityType: 'User',
            entityId: followerId,
            screen: 'Profile',
            params: { userId: followerId }
          },
          priority: 'normal',
          groupKey: `new_follower:${targetId}`,
          channels: { inApp: true, push: true, email: false }
        });
      } catch (notifErr) {
        console.warn('[Notification] Non-critical error:', notifErr.message);
      }
    })();
    // END NOTIFICATION

    // Mutual?
    let isConnected = false;
    if (targetType === 'User') {
      const reverse = await Follow.findOne({
        follower: targetId,
        targetType: 'User',
        targetId: followerId,
        status: 'active',
      });
      isConnected = !!reverse;

      if (isConnected) {
        await Promise.all([
          bumpStat(followerId, 'connectionCount', 1),
          bumpStat(targetId, 'connectionCount', 1),
        ]);

        // 🔔 NOTIFICATION: New connection for BOTH users
        (async () => {
          try {
            await Promise.all([
              notificationService.create({
                recipient: followerId,
                actor: targetId,
                type: 'new_connection',
                title: 'New connection',
                body: `You and {actorName} are now connected`,
                data: { entityType: 'User', entityId: targetId, screen: 'Profile', params: { userId: targetId } },
                priority: 'high',
                channels: { inApp: true, push: true, email: false }
              }),
              notificationService.create({
                recipient: targetId,
                actor: followerId,
                type: 'new_connection',
                title: 'New connection',
                body: `You and {actorName} are now connected`,
                data: { entityType: 'User', entityId: followerId, screen: 'Profile', params: { userId: followerId } },
                priority: 'high',
                channels: { inApp: true, push: true, email: false }
              })
            ]);
          } catch (notifErr) {
            console.warn('[Notification] Non-critical error:', notifErr.message);
          }
        })();
        // END NOTIFICATION
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Followed',
      data: {
        following: true,
        isConnected,
        follow,
      },
    });
  } catch (err) {
    console.error('Toggle follow error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to toggle follow',
    });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getFollowStatus
 * GET /follow/:targetId/status
 * ────────────────────────────────────────────────────────────────────────── */
exports.getFollowStatus = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const { targetId } = req.params;
    const targetType = req.query.targetType || 'User';

    if (!isValidObjectId(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid targetId' });
    }

    const follow = await Follow.findOne({
      follower: followerId,
      targetType,
      targetId,
    });

    let isConnected = false;
    if (follow && follow.status === 'active' && targetType === 'User') {
      const reverse = await Follow.findOne({
        follower: targetId,
        targetType: 'User',
        targetId: followerId,
        status: 'active',
      });
      isConnected = !!reverse;
    }

    return res.json({
      success: true,
      data: {
        following: !!(follow && follow.status === 'active'),
        status: follow ? follow.status : 'none',
        followId: follow?._id?.toString() ?? null,
        isConnected,
        follow: follow || null,
      },
    });
  } catch (err) {
    console.error('getFollowStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get follow status' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getBulkFollowStatus
 * POST /follow/bulk-status
 * ────────────────────────────────────────────────────────────────────────── */
exports.getBulkFollowStatus = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const { userIds = [], targetType = 'User' } = req.body || {};

    const valid = (Array.isArray(userIds) ? userIds : []).filter(isValidObjectId);

    if (valid.length === 0) {
      return res.json({ success: true, data: {} });
    }

    const map = await Follow.getBulkFollowStatus(followerId, valid, targetType);

    const simple = {};
    Object.keys(map).forEach((uid) => {
      simple[uid] = !!map[uid]?.following;
    });

    return res.json({ success: true, data: simple });
  } catch (err) {
    console.error('getBulkFollowStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get bulk follow status' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getFollowers
 * GET /follow/followers
 * ────────────────────────────────────────────────────────────────────────── */
exports.getFollowers = async (req, res) => {
  try {
    const { page = 1, limit = 20, targetType = 'User' } = req.query;
    const userId = req.query.userId || req.user.userId;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const result = await Follow.getFollowers(targetType, userId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('getFollowers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get followers' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getFollowing
 * GET /follow/following
 * ────────────────────────────────────────────────────────────────────────── */
exports.getFollowing = async (req, res) => {
  try {
    const { page = 1, limit = 20, targetType } = req.query;
    const userId = req.query.userId || req.user.userId;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const result = await Follow.getFollowing(userId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      targetType,
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('getFollowing error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get following' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getConnections
 * GET /follow/connections
 * ────────────────────────────────────────────────────────────────────────── */
exports.getConnections = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const [connections, total] = await Promise.all([
      Follow.getConnections(userId, { page, limit }),
      Follow.countConnections(userId),
    ]);

    return res.json({
      success: true,
      data: connections,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('getConnections error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get connections' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * isConnected
 * GET /follow/:userId/is-connected
 * ────────────────────────────────────────────────────────────────────────── */
exports.isConnected = async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    if (myId === userId) {
      return res.json({
        success: true,
        data: { isConnected: false, iFollow: false, theyFollow: false },
      });
    }

    const [iFollow, theyFollow] = await Promise.all([
      Follow.findOne({
        follower: myId,
        targetType: 'User',
        targetId: userId,
        status: 'active',
      }),
      Follow.findOne({
        follower: userId,
        targetType: 'User',
        targetId: myId,
        status: 'active',
      }),
    ]);

    return res.json({
      success: true,
      data: {
        isConnected: !!(iFollow && theyFollow),
        iFollow: !!iFollow,
        theyFollow: !!theyFollow,
      },
    });
  } catch (err) {
    console.error('isConnected error:', err);
    return res.status(500).json({ success: false, message: 'Failed to check connection' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * blockUser
 * POST /follow/:targetId/block
 * ────────────────────────────────────────────────────────────────────────── */
exports.blockUser = async (req, res) => {
  try {
    const blockerId = req.user.userId;
    const { targetId } = req.params;

    if (!isValidObjectId(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid targetId' });
    }
    if (blockerId === targetId) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }

    await Follow.findOneAndUpdate(
      { follower: blockerId, targetType: 'User', targetId },
      {
        $set: {
          follower: blockerId,
          targetType: 'User',
          targetId,
          status: 'blocked',
          followSource: 'manual',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Follow.findOneAndDelete({
      follower: targetId,
      targetType: 'User',
      targetId: blockerId,
      status: 'active',
    });

    return res.json({ success: true, message: 'User blocked' });
  } catch (err) {
    console.error('blockUser error:', err);
    return res.status(500).json({ success: false, message: 'Failed to block user' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getFollowStats
 * GET /follow/stats
 * ────────────────────────────────────────────────────────────────────────── */
exports.getFollowStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [followers, following, connections] = await Promise.all([
      Follow.countDocuments({
        targetType: 'User',
        targetId: userId,
        status: 'active',
      }),
      Follow.countDocuments({ follower: userId, status: 'active' }),
      Follow.countConnections(userId),
    ]);

    return res.json({
      success: true,
      data: {
        followers,
        following,
        connections,
        totalConnections: connections,
        pendingRequests: 0,
      },
    });
  } catch (err) {
    console.error('getFollowStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get follow stats' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getFollowSuggestions
 * GET /follow/suggestions
 * ────────────────────────────────────────────────────────────────────────── */
exports.getFollowSuggestions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const algorithm = String(req.query.algorithm || 'hybrid').toLowerCase();
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const following = await Follow.find({
      follower: userId,
      targetType: 'User',
      status: 'active',
    })
      .select('targetId')
      .lean();
    const followingIds = following.map((f) => f.targetId.toString());
    const excludeIds = [...followingIds, userId];

    const baseMatch = {
      _id: { $nin: excludeIds.map((id) => new mongoose.Types.ObjectId(id)) },
      isActive: { $ne: false },
    };

    if (algorithm === 'popular') {
      const users = await User.find(baseMatch)
        .sort({ 'socialStats.followerCount': -1, createdAt: -1 })
        .limit(limit)
        .select('name avatar headline role verificationStatus socialStats')
        .lean();
      return res.json({ success: true, data: users });
    }

    if (algorithm === 'skills') {
      const me = await User.findById(userId).select('skills').lean();
      const mySkills =
        (me?.skills || [])
          .map((s) => (typeof s === 'string' ? s : s?.name))
          .filter(Boolean)
          .slice(0, 20) || [];

      if (mySkills.length === 0) {
        const users = await User.find(baseMatch)
          .sort({ 'socialStats.followerCount': -1 })
          .limit(limit)
          .select('name avatar headline role verificationStatus socialStats')
          .lean();
        return res.json({ success: true, data: users });
      }

      const users = await User.find({
        ...baseMatch,
        $or: [
          { 'skills.name': { $in: mySkills } },
          { skills: { $in: mySkills } },
        ],
      })
        .sort({ 'socialStats.followerCount': -1 })
        .limit(limit)
        .select('name avatar headline role verificationStatus socialStats')
        .lean();
      return res.json({ success: true, data: users });
    }

    if (algorithm === 'connections') {
      const connections = await Follow.getConnections(userId, {
        page: 1,
        limit: 50,
      });
      const connectionIds = connections.map((u) => u._id);

      if (connectionIds.length === 0) {
        const users = await User.find(baseMatch)
          .sort({ 'socialStats.followerCount': -1 })
          .limit(limit)
          .select('name avatar headline role verificationStatus socialStats')
          .lean();
        return res.json({ success: true, data: users });
      }

      const hops = await Follow.aggregate([
        {
          $match: {
            follower: { $in: connectionIds },
            targetType: 'User',
            status: 'active',
            targetId: {
              $nin: excludeIds.map(
                (id) => new mongoose.Types.ObjectId(id)
              ),
            },
          },
        },
        {
          $group: {
            _id: '$targetId',
            score: { $sum: 1 },
          },
        },
        { $sort: { score: -1 } },
        { $limit: limit },
      ]);

      const ids = hops.map((h) => h._id);
      const users = await User.find({ _id: { $in: ids } })
        .select('name avatar headline role verificationStatus socialStats')
        .lean();

      const ordered = ids
        .map((id) => users.find((u) => u._id.toString() === id.toString()))
        .filter(Boolean);

      return res.json({ success: true, data: ordered });
    }

    // Hybrid (default)
    const me = await User.findById(userId).select('skills').lean();
    const mySkills =
      (me?.skills || [])
        .map((s) => (typeof s === 'string' ? s : s?.name))
        .filter(Boolean)
        .slice(0, 20) || [];

    const [popularPool, skillsPool, connections] = await Promise.all([
      User.find(baseMatch)
        .sort({ 'socialStats.followerCount': -1 })
        .limit(limit * 2)
        .select('name avatar headline role verificationStatus socialStats')
        .lean(),
      mySkills.length
        ? User.find({
            ...baseMatch,
            $or: [
              { 'skills.name': { $in: mySkills } },
              { skills: { $in: mySkills } },
            ],
          })
            .sort({ 'socialStats.followerCount': -1 })
            .limit(limit * 2)
            .select('name avatar headline role verificationStatus socialStats')
            .lean()
        : Promise.resolve([]),
      Follow.getConnections(userId, { page: 1, limit: 50 }),
    ]);

    const connectionIds = connections.map((u) => u._id);
    let hopUsers = [];
    if (connectionIds.length > 0) {
      const hops = await Follow.aggregate([
        {
          $match: {
            follower: { $in: connectionIds },
            targetType: 'User',
            status: 'active',
            targetId: {
              $nin: excludeIds.map(
                (id) => new mongoose.Types.ObjectId(id)
              ),
            },
          },
        },
        { $group: { _id: '$targetId', score: { $sum: 1 } } },
        { $sort: { score: -1 } },
        { $limit: limit * 2 },
      ]);
      const ids = hops.map((h) => h._id);
      hopUsers = await User.find({ _id: { $in: ids } })
        .select('name avatar headline role verificationStatus socialStats')
        .lean();
    }

    const scoreMap = new Map();
    const addToMap = (users, weight) => {
      users.forEach((u) => {
        const id = u._id.toString();
        const prev = scoreMap.get(id) || { user: u, score: 0 };
        prev.score += weight;
        scoreMap.set(id, prev);
      });
    };
    addToMap(hopUsers, 3);
    addToMap(skillsPool, 2);
    addToMap(popularPool, 1);

    const merged = Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.user);

    return res.json({ success: true, data: merged });
  } catch (err) {
    console.error('getFollowSuggestions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get suggestions' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getPublicFollowers / getPublicFollowing
 * ────────────────────────────────────────────────────────────────────────── */
exports.getPublicFollowers = async (req, res) => {
  try {
    const { targetId } = req.params;
    const targetType = req.query.targetType || 'User';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    if (!isValidObjectId(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid targetId' });
    }

    const result = await Follow.getFollowers(targetType, targetId, {
      page,
      limit,
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('getPublicFollowers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get public followers' });
  }
};

exports.getPublicFollowing = async (req, res) => {
  try {
    const { targetId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    if (!isValidObjectId(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid targetId' });
    }

    const result = await Follow.getFollowing(targetId, { page, limit });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('getPublicFollowing error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get public following' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * LEGACY
 * ────────────────────────────────────────────────────────────────────────── */
exports.getPendingRequests = async (_req, res) =>
  res.json({
    success: true,
    data: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  });

exports.acceptFollowRequest = async (_req, res) =>
  res.json({ success: true, message: 'No-op (new system has no pending state)' });

exports.rejectFollowRequest = async (_req, res) =>
  res.json({ success: true, message: 'No-op (new system has no pending state)' });