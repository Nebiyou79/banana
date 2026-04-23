/**
 * server/src/controllers/followController.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Follow Controller
 *
 * Methods:
 *   toggleFollow(req,res)         POST   /follow/:targetId
 *   getFollowStatus(req,res)      GET    /follow/:targetId/status
 *   getBulkFollowStatus(req,res)  POST   /follow/bulk-status
 *   getFollowers(req,res)         GET    /follow/followers
 *   getFollowing(req,res)         GET    /follow/following
 *   getConnections(req,res)       GET    /follow/connections        NEW
 *   getFollowStats(req,res)       GET    /follow/stats
 *   getFollowSuggestions(req,res) GET    /follow/suggestions
 *   getPublicFollowers(req,res)   GET    /follow/public/followers/:targetId
 *   getPublicFollowing(req,res)   GET    /follow/public/following/:targetId
 *   isConnected(req,res)          GET    /follow/:userId/is-connected NEW
 *   blockUser(req,res)            POST   /follow/:targetId/block     NEW
 *   // Legacy, kept for frontend compatibility (always empty / 0):
 *   getPendingRequests(req,res)   GET    /follow/pending
 *   acceptFollowRequest(req,res)  PUT    /follow/:followId/accept
 *   rejectFollowRequest(req,res)  PUT    /follow/:followId/reject
 * ────────────────────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');
const Follow = require('../models/Follow');
const User = require('../models/User');

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Safely bump a User's socialStats counter.
 */
async function bumpStat(userId, field, delta) {
  try {
    if (!userId) return;
    await User.findByIdAndUpdate(userId, {
      $inc: { [`socialStats.${field}`]: delta },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('bumpStat failed:', field, delta, err.message);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * toggleFollow
 * POST /follow/:targetId
 * body: { targetType?: 'User'|'Company'|'Organization', followSource?: string }
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
      return res
        .status(400)
        .json({ success: false, message: 'Invalid targetId' });
    }

    if (followerId === targetId && targetType === 'User') {
      return res
        .status(400)
        .json({ success: false, message: 'You cannot follow yourself' });
    }

    const existing = await Follow.findOne({
      follower: followerId,
      targetType,
      targetId,
    });

    // ── UNFOLLOW path ────────────────────────────────────────────────────
    if (existing && existing.status === 'active') {
      await existing.deleteOne();

      // Update stats
      await Promise.all([
        bumpStat(followerId, 'followingCount', -1),
        targetType === 'User'
          ? bumpStat(targetId, 'followerCount', -1)
          : Promise.resolve(),
      ]);

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

      // Bump connectionCount for both users when a new connection forms.
      if (isConnected) {
        await Promise.all([
          bumpStat(followerId, 'connectionCount', 1),
          bumpStat(targetId, 'connectionCount', 1),
        ]);
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
    // eslint-disable-next-line no-console
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
      return res
        .status(400)
        .json({ success: false, message: 'Invalid targetId' });
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
    // eslint-disable-next-line no-console
    console.error('getFollowStatus error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to get follow status' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getBulkFollowStatus
 * POST /follow/bulk-status
 * body: { userIds: string[], targetType?: 'User'|'Company'|'Organization' }
 *
 * Legacy response shape kept: { data: { [userId]: boolean } }
 * Plus detailed status accessible via getFollowStatus.
 * ────────────────────────────────────────────────────────────────────────── */
exports.getBulkFollowStatus = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const { userIds = [], targetType = 'User' } = req.body || {};

    const valid = (Array.isArray(userIds) ? userIds : []).filter(
      isValidObjectId
    );

    if (valid.length === 0) {
      return res.json({ success: true, data: {} });
    }

    const map = await Follow.getBulkFollowStatus(followerId, valid, targetType);

    // Legacy simple shape: { userId: true/false }
    const simple = {};
    Object.keys(map).forEach((uid) => {
      simple[uid] = !!map[uid]?.following;
    });

    return res.json({ success: true, data: simple });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getBulkFollowStatus error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to get bulk follow status' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getFollowers
 * GET /follow/followers   (authenticated — current user's followers)
 * Also supports ?userId=... to fetch another user's followers (public view).
 * ────────────────────────────────────────────────────────────────────────── */
exports.getFollowers = async (req, res) => {
  try {
    const { page = 1, limit = 20, targetType = 'User' } = req.query;
    const userId = req.query.userId || req.user.userId;

    if (!isValidObjectId(userId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid userId' });
    }

    const result = await Follow.getFollowers(targetType, userId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getFollowers error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to get followers' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getFollowing
 * GET /follow/following   (authenticated — current user's following)
 * Also supports ?userId=... to fetch another user's following.
 * ────────────────────────────────────────────────────────────────────────── */
exports.getFollowing = async (req, res) => {
  try {
    const { page = 1, limit = 20, targetType } = req.query;
    const userId = req.query.userId || req.user.userId;

    if (!isValidObjectId(userId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid userId' });
    }

    const result = await Follow.getFollowing(userId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      targetType,
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getFollowing error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to get following' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getConnections (NEW)
 * GET /follow/connections
 * Returns mutual-follow users (paginated).
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
    // eslint-disable-next-line no-console
    console.error('getConnections error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to get connections' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * isConnected (NEW)
 * GET /follow/:userId/is-connected
 * Returns { isConnected, iFollow, theyFollow }
 * ────────────────────────────────────────────────────────────────────────── */
exports.isConnected = async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid userId' });
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
    // eslint-disable-next-line no-console
    console.error('isConnected error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to check connection' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * blockUser (NEW)
 * POST /follow/:targetId/block
 * Blocks a user: any existing follow edges (either direction) become status=blocked.
 * ────────────────────────────────────────────────────────────────────────── */
exports.blockUser = async (req, res) => {
  try {
    const blockerId = req.user.userId;
    const { targetId } = req.params;

    if (!isValidObjectId(targetId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid targetId' });
    }
    if (blockerId === targetId) {
      return res
        .status(400)
        .json({ success: false, message: 'You cannot block yourself' });
    }

    // Upsert blocker→target as blocked
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

    // Remove any reverse active follow the target has on blocker.
    await Follow.findOneAndDelete({
      follower: targetId,
      targetType: 'User',
      targetId: blockerId,
      status: 'active',
    });

    return res.json({ success: true, message: 'User blocked' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('blockUser error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to block user' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getFollowStats
 * GET /follow/stats
 * Returns { followers, following, connections, pendingRequests: 0 }
 * `pendingRequests` is always 0 in the new system (kept for FE compatibility).
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
        totalConnections: connections, // legacy alias
        pendingRequests: 0, // always 0, kept for FE compatibility
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getFollowStats error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to get follow stats' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getFollowSuggestions
 * GET /follow/suggestions?algorithm=popular|skills|connections|hybrid&limit=10
 * ────────────────────────────────────────────────────────────────────────── */
exports.getFollowSuggestions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const algorithm = String(req.query.algorithm || 'hybrid').toLowerCase();
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    // Users I already follow → exclude them from suggestions.
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

    // ── Popular ─────────────────────────────────────────────────────────
    if (algorithm === 'popular') {
      const users = await User.find(baseMatch)
        .sort({ 'socialStats.followerCount': -1, createdAt: -1 })
        .limit(limit)
        .select('name avatar headline role verificationStatus socialStats')
        .lean();
      return res.json({ success: true, data: users });
    }

    // ── Skills ──────────────────────────────────────────────────────────
    if (algorithm === 'skills') {
      const me = await User.findById(userId).select('skills').lean();
      const mySkills =
        (me?.skills || [])
          .map((s) => (typeof s === 'string' ? s : s?.name))
          .filter(Boolean)
          .slice(0, 20) || [];

      if (mySkills.length === 0) {
        // fall through to popular
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

    // ── Connections-of-connections ──────────────────────────────────────
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

      // Who do my connections follow (that I don't)?
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

      // preserve hop order
      const ordered = ids
        .map((id) => users.find((u) => u._id.toString() === id.toString()))
        .filter(Boolean);

      return res.json({ success: true, data: ordered });
    }

    // ── Hybrid (default): weighted blend ────────────────────────────────
    // Gather 3 pools, weight them, dedupe, truncate to limit.
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

    // Weighted merge: connections-of-connections (3) > skills (2) > popular (1)
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
    // eslint-disable-next-line no-console
    console.error('getFollowSuggestions error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to get suggestions' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * getPublicFollowers / getPublicFollowing
 * GET /follow/public/followers/:targetId
 * GET /follow/public/following/:targetId
 * ────────────────────────────────────────────────────────────────────────── */
exports.getPublicFollowers = async (req, res) => {
  try {
    const { targetId } = req.params;
    const targetType = req.query.targetType || 'User';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    if (!isValidObjectId(targetId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid targetId' });
    }

    const result = await Follow.getFollowers(targetType, targetId, {
      page,
      limit,
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getPublicFollowers error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to get public followers' });
  }
};

exports.getPublicFollowing = async (req, res) => {
  try {
    const { targetId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    if (!isValidObjectId(targetId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid targetId' });
    }

    const result = await Follow.getFollowing(targetId, { page, limit });
    return res.json({ success: true, ...result });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getPublicFollowing error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to get public following' });
  }
};

/* ──────────────────────────────────────────────────────────────────────────
 * LEGACY — kept for frontend compatibility.
 * New system has no pending/approval flow; these always resolve empty / noop.
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