/**
 * server/src/models/Follow.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Follow Model (FULL REPLACEMENT)
 *
 * Key changes from v1:
 *  - status simplified from ['pending','accepted','rejected','blocked']
 *            to         ['active','blocked']
 *  - followSource expanded to include 'network', 'profile', 'feed'
 *  - followedAt replaces requestedAt/acceptedAt (no approval flow)
 *  - Added getConnections (mutual-follow) static
 *  - Added countConnections static (for follow stats)
 *
 * Philosophy: Instagram / Twitter model — follow is immediate for public
 * profiles. "Connection" is computed from mutual follow; it is NOT stored.
 * ────────────────────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['User', 'Company', 'Organization'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    followSource: {
      type: String,
      enum: [
        'search',
        'suggestion',
        'connection',
        'manual',
        'network',
        'profile',
        'feed',
      ],
      default: 'manual',
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    followedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ── INDEXES ────────────────────────────────────────────────────────────────
// Unique per (follower, targetType, targetId) triple
followSchema.index(
  { follower: 1, targetType: 1, targetId: 1 },
  { unique: true }
);
// Fast "who follows X?" queries
followSchema.index({ targetType: 1, targetId: 1, status: 1 });
// Fast "who does X follow?" queries
followSchema.index({ follower: 1, status: 1 });

// ── INSTANCE METHODS ──────────────────────────────────────────────────────
followSchema.methods.block = async function () {
  this.status = 'blocked';
  return this.save();
};

followSchema.methods.unblock = async function () {
  this.status = 'active';
  return this.save();
};

// ── STATIC METHODS ────────────────────────────────────────────────────────

/**
 * Get paginated followers for a target (User / Company / Organization).
 * Returns populated follower documents.
 */
followSchema.statics.getFollowers = async function (
  targetType,
  targetId,
  options = {}
) {
  const {
    page = 1,
    limit = 20,
    populateFields = 'name avatar headline role verificationStatus socialStats',
  } = options;

  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    this.find({
      targetType,
      targetId,
      status: 'active',
    })
      .populate('follower', populateFields)
      .sort({ followedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments({
      targetType,
      targetId,
      status: 'active',
    }),
  ]);

  return {
    data: docs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Get paginated following list for a user.
 * Returns populated target documents (User / Company / Organization).
 */
followSchema.statics.getFollowing = async function (followerId, options = {}) {
  const {
    page = 1,
    limit = 20,
    targetType, // optional filter
    populateFields = 'name avatar headline role verificationStatus socialStats',
  } = options;

  const skip = (page - 1) * limit;

  const query = { follower: followerId, status: 'active' };
  if (targetType) query.targetType = targetType;

  const [docs, total] = await Promise.all([
    this.find(query)
      .populate('targetId', populateFields)
      .sort({ followedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query),
  ]);

  return {
    data: docs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Get mutual-follow connections for a user.
 * Returns paginated array of populated User documents (not Follow docs).
 */
followSchema.statics.getConnections = async function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    populateFields = 'name avatar headline role verificationStatus socialStats',
  } = options;

  const skip = (page - 1) * limit;

  // Step 1: find everyone that userId follows (User targets only).
  const following = await this.find({
    follower: userId,
    targetType: 'User',
    status: 'active',
  })
    .select('targetId')
    .lean();

  const followingIds = following.map((f) => f.targetId);

  if (followingIds.length === 0) return [];

  // Step 2: among those, keep the ones who follow userId back.
  const mutualFollows = await this.find({
    follower: { $in: followingIds },
    targetType: 'User',
    targetId: userId,
    status: 'active',
  })
    .populate('follower', populateFields)
    .sort({ followedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return mutualFollows.map((f) => f.follower).filter(Boolean);
};

/**
 * Count mutual connections for a user.
 */
followSchema.statics.countConnections = async function (userId) {
  const following = await this.find({
    follower: userId,
    targetType: 'User',
    status: 'active',
  })
    .select('targetId')
    .lean();

  const followingIds = following.map((f) => f.targetId);
  if (followingIds.length === 0) return 0;

  return this.countDocuments({
    follower: { $in: followingIds },
    targetType: 'User',
    targetId: userId,
    status: 'active',
  });
};

/**
 * Get the follow document between a follower and a target, if any.
 */
followSchema.statics.getFollowStatus = async function (
  followerId,
  targetType,
  targetId
) {
  return this.findOne({
    follower: followerId,
    targetType,
    targetId,
  });
};

/**
 * Get follower / following / connection counts for a target.
 * For Company / Organization, `connections` is 0 (concept only applies to users).
 */
followSchema.statics.getFollowCounts = async function (targetType, targetId) {
  const [followers, following, connections] = await Promise.all([
    this.countDocuments({ targetType, targetId, status: 'active' }),
    targetType === 'User'
      ? this.countDocuments({
          follower: targetId,
          status: 'active',
        })
      : Promise.resolve(0),
    targetType === 'User'
      ? this.countConnections(targetId)
      : Promise.resolve(0),
  ]);

  return { followers, following, connections };
};

/**
 * Bulk follow-status lookup for an array of target userIds.
 * Returns an object { [userId]: { following: boolean, followId?: string } }
 */
followSchema.statics.getBulkFollowStatus = async function (
  followerId,
  targetIds,
  targetType = 'User'
) {
  if (!Array.isArray(targetIds) || targetIds.length === 0) return {};

  const follows = await this.find({
    follower: followerId,
    targetType,
    targetId: { $in: targetIds },
    status: 'active',
  })
    .select('targetId _id')
    .lean();

  const map = follows.reduce((acc, f) => {
    acc[f.targetId.toString()] = {
      following: true,
      followId: f._id.toString(),
    };
    return acc;
  }, {});

  targetIds.forEach((id) => {
    if (!map[id.toString()]) {
      map[id.toString()] = { following: false };
    }
  });

  return map;
};

module.exports = mongoose.model('Follow', followSchema);