/**
 * server/src/controllers/publicProfileController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all CRUD operations for the PublicProfile model.
 *
 * Endpoints wired in publicProfileRoutes.js:
 *   GET    /api/v1/public-profile              → getMyPublicProfile
 *   PUT    /api/v1/public-profile              → updatePublicProfile
 *   PATCH  /api/v1/public-profile/visibility   → toggleVisibility
 *   POST   /api/v1/public-profile/sync         → syncFromMainProfile
 *   GET    /api/v1/public-profile/:userId      → getPublicProfileById
 *   GET    /api/v1/public-profile/u/:username  → getPublicProfileByUsername
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const PublicProfile  = require('../models/PublicProfile');
const User           = require('../models/User');
const Profile        = require('../models/Profile');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve the User + main Profile documents for a given userId.
 * Throws an AppError-style object if not found.
 */
async function resolveUserAndProfile(userId) {
  const [user, mainProfile] = await Promise.all([
    User.findById(userId).lean(),
    Profile.findOne({ user: userId }).lean(),
  ]);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return { user, mainProfile };
}

/**
 * Build a PublicProfile document from User + main Profile data.
 * Called on first sync and every subsequent sync.
 */
function buildSyncPayload(user, mainProfile) {
  const role = user.role;

  const payload = {
    role,
    displayName:  user.name,
    headline:     mainProfile?.headline || user.headline || '',
    bio:          mainProfile?.bio      || user.bio      || '',
    location:     mainProfile?.location || user.location || '',
    phone:        user.phone   || '',
    email:        user.email   || '',
    website:      mainProfile?.website  || user.website  || '',
    lastSyncedAt: new Date(),
  };

  // ── Avatar / Cover (prefer Profile, fallback to User) ─────────────────────
  if (mainProfile?.avatar?.secure_url) {
    payload.avatar = {
      public_id:   mainProfile.avatar.public_id,
      secure_url:  mainProfile.avatar.secure_url,
      uploaded_at: mainProfile.avatar.uploaded_at,
    };
  } else if (user.avatar) {
    payload.avatar = { secure_url: user.avatar };
  }

  if (mainProfile?.cover?.secure_url) {
    payload.cover = {
      public_id:   mainProfile.cover.public_id,
      secure_url:  mainProfile.cover.secure_url,
      uploaded_at: mainProfile.cover.uploaded_at,
    };
  }

  // ── Social links ─────────────────────────────────────────────────────────
  if (mainProfile?.socialLinks || user.socialLinks) {
    payload.socialLinks = {
      ...(user.socialLinks || {}),
      ...(mainProfile?.socialLinks || {}),
    };
  }

  // ── Role-specific fields ─────────────────────────────────────────────────
  const rs = mainProfile?.roleSpecific || {};

  if (['candidate', 'freelancer'].includes(role)) {
    payload.skills         = rs.skills         || user.skills        || [];
    payload.education      = rs.education      || user.education     || [];
    payload.experience     = rs.experience     || user.experience    || [];
    payload.certifications = rs.certifications || user.certifications|| [];
    payload.languages      = mainProfile?.languages || [];
    payload.interests      = mainProfile?.interests || [];
  }

  if (role === 'freelancer') {
    payload.portfolio = rs.portfolio || user.portfolio || [];
  }

  if (['company', 'organization'].includes(role)) {
    payload.companyInfo = {
      size:        rs.companyInfo?.size,
      foundedYear: rs.companyInfo?.foundedYear,
      companyType: rs.companyInfo?.companyType,
      industry:    rs.companyInfo?.industry,
      mission:     rs.companyInfo?.mission,
      values:      rs.companyInfo?.values      || [],
      culture:     rs.companyInfo?.culture,
      specialties: rs.companyInfo?.specialties || [],
    };
  }

  // ── Verification ─────────────────────────────────────────────────────────
  payload.verificationStatus =
    mainProfile?.verificationStatus || user.verificationStatus || 'none';

  // ── Social stats ─────────────────────────────────────────────────────────
  if (mainProfile?.socialStats) {
    payload.socialStats = {
      followerCount:   mainProfile.socialStats.followerCount   || 0,
      followingCount:  mainProfile.socialStats.followingCount  || 0,
      postCount:       mainProfile.socialStats.postCount       || 0,
      profileViews:    mainProfile.socialStats.profileViews    || 0,
      connectionCount: mainProfile.socialStats.connectionCount || 0,
    };
  }

  return payload;
}

/**
 * Standardized JSON response helper.
 */
const respond = (res, statusCode, data, message = 'Success') =>
  res.status(statusCode).json({ success: true, message, data });

const respondError = (res, statusCode, message) =>
  res.status(statusCode).json({ success: false, message });

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/public-profile
 * Returns the current user's own public profile (all fields visible).
 * Creates the profile if it doesn't exist yet (lazy bootstrap).
 */
exports.getMyPublicProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    let pubProfile = await PublicProfile.findOne({ user: userId });

    // Lazy create if this user has never had a public profile bootstrapped
    if (!pubProfile) {
      const { user, mainProfile } = await resolveUserAndProfile(userId);
      const payload = buildSyncPayload(user, mainProfile);
      pubProfile = await PublicProfile.create({ user: userId, ...payload });
    }

    return respond(res, 200, pubProfile.getPublicData(true), 'Public profile retrieved');
  } catch (err) {
    console.error('[PublicProfile] getMyPublicProfile:', err);
    return respondError(res, err.statusCode || 500, err.message || 'Server error');
  }
};

/**
 * PUT /api/v1/public-profile
 * Owner updates their public profile manually (partial update supported).
 */
exports.updatePublicProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return respondError(res, 422, errors.array()[0].msg);
    }

    const userId = req.user.userId || req.user._id;

    // Whitelist of directly settable fields
    const ALLOWED_TOP = [
      'displayName', 'username', 'headline', 'bio', 'location',
      'phone', 'email', 'website', 'socialLinks', 'skills',
      'languages', 'interests', 'availability', 'hourlyRate',
      'metaDescription', 'metaKeywords',
    ];

    const ALLOWED_ROLE_FIELDS = {
      candidate:    ['education', 'experience', 'certifications'],
      freelancer:   ['education', 'experience', 'certifications', 'portfolio', 'services'],
      company:      ['companyInfo'],
      organization: ['companyInfo'],
    };

    const update = {};
    ALLOWED_TOP.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    const role = req.user.role;
    const roleFields = ALLOWED_ROLE_FIELDS[role] || [];
    roleFields.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    // Username uniqueness check
    if (update.username) {
      update.username = update.username.toLowerCase().trim();
      const clash = await PublicProfile.findOne({
        username: update.username,
        user:     { $ne: userId },
      }).lean();
      if (clash) return respondError(res, 409, 'Username already taken');
    }

    const pubProfile = await PublicProfile.findOneAndUpdate(
      { user: userId },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );

    return respond(res, 200, pubProfile.getPublicData(true), 'Public profile updated');
  } catch (err) {
    console.error('[PublicProfile] updatePublicProfile:', err);
    if (err.code === 11000) {
      return respondError(res, 409, 'Username already taken');
    }
    return respondError(res, err.statusCode || 500, err.message || 'Server error');
  }
};

/**
 * PATCH /api/v1/public-profile/visibility
 * Toggle overall visibility or granular field visibility.
 *
 * Body: { isPubliclyVisible?: boolean, visibility?: { email?: bool, ... } }
 */
exports.toggleVisibility = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { isPubliclyVisible, visibility } = req.body;

    const update = {};
    if (typeof isPubliclyVisible === 'boolean') {
      update.isPubliclyVisible = isPubliclyVisible;
    }
    if (visibility && typeof visibility === 'object') {
      // Merge granular visibility fields
      const ALLOWED_VIS = [
        'profile', 'email', 'phone', 'location', 'education',
        'experience', 'certifications', 'portfolio', 'services', 'socialLinks',
      ];
      ALLOWED_VIS.forEach((key) => {
        if (visibility[key] !== undefined) {
          update[`visibility.${key}`] = visibility[key];
        }
      });
    }

    if (Object.keys(update).length === 0) {
      return respondError(res, 400, 'No visibility settings provided');
    }

    const pubProfile = await PublicProfile.findOneAndUpdate(
      { user: userId },
      { $set: update },
      { new: true, upsert: true }
    );

    return respond(
      res,
      200,
      {
        isPubliclyVisible: pubProfile.isPubliclyVisible,
        visibility:        pubProfile.visibility,
      },
      'Visibility updated'
    );
  } catch (err) {
    console.error('[PublicProfile] toggleVisibility:', err);
    return respondError(res, 500, 'Server error');
  }
};

/**
 * POST /api/v1/public-profile/sync
 * One-click sync: pull all data from the main Profile + User models
 * into this user's PublicProfile. Owner-customised fields are REPLACED.
 */
exports.syncFromMainProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    const { user, mainProfile } = await resolveUserAndProfile(userId);
    const payload = buildSyncPayload(user, mainProfile);

    const pubProfile = await PublicProfile.findOneAndUpdate(
      { user: userId },
      { $set: payload },
      { new: true, upsert: true }
    );

    return respond(
      res,
      200,
      pubProfile.getPublicData(true),
      'Profile synced from main profile successfully'
    );
  } catch (err) {
    console.error('[PublicProfile] syncFromMainProfile:', err);
    return respondError(res, err.statusCode || 500, err.message || 'Server error');
  }
};

/**
 * GET /api/v1/public-profile/:userId
 * Public endpoint — returns filtered data based on owner's visibility settings.
 * Also increments view count (debounced: max once per viewer per session via
 * a lightweight in-memory guard is left to the caller; we always increment here).
 */
exports.getPublicProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return respondError(res, 400, 'Invalid user ID format');
    }

    const pubProfile = await PublicProfile.findOne({
      user:              userId,
      isPubliclyVisible: true,
    });

    if (!pubProfile) {
      return respondError(res, 404, 'Public profile not found');
    }

    // Determine if the requester is the owner
    const requesterId = req.user?.userId || req.user?._id;
    const isOwner = requesterId && String(requesterId) === String(pubProfile.user);

    // Increment views asynchronously (fire-and-forget)
    if (!isOwner) {
      pubProfile.incrementViews().catch(() => {});
    }

    return respond(res, 200, pubProfile.getPublicData(isOwner));
  } catch (err) {
    console.error('[PublicProfile] getPublicProfileById:', err);
    return respondError(res, 500, 'Server error');
  }
};

/**
 * GET /api/v1/public-profile/u/:username
 * Public endpoint — find by username slug.
 */
exports.getPublicProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const pubProfile = await PublicProfile.findOne({
      username:          username.toLowerCase(),
      isPubliclyVisible: true,
    });

    if (!pubProfile) {
      return respondError(res, 404, 'Public profile not found');
    }

    const requesterId = req.user?.userId || req.user?._id;
    const isOwner = requesterId && String(requesterId) === String(pubProfile.user);

    if (!isOwner) {
      pubProfile.incrementViews().catch(() => {});
    }

    return respond(res, 200, pubProfile.getPublicData(isOwner));
  } catch (err) {
    console.error('[PublicProfile] getPublicProfileByUsername:', err);
    return respondError(res, 500, 'Server error');
  }
};

/**
 * GET /api/v1/public-profile/search
 * Search public profiles with pagination.
 * Query: ?q=&role=&page=&limit=
 */
exports.searchPublicProfiles = async (req, res) => {
  try {
    const { q, role, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { isPubliclyVisible: true };
    if (role && ['candidate', 'freelancer', 'company', 'organization'].includes(role)) {
      filter.role = role;
    }

    let query;
    if (q && q.trim().length >= 2) {
      filter.$text = { $search: q.trim() };
      query = PublicProfile.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, 'socialStats.followerCount': -1 });
    } else {
      query = PublicProfile.find(filter).sort({ 'socialStats.followerCount': -1, createdAt: -1 });
    }

    const [profiles, total] = await Promise.all([
      query.skip(skip).limit(Number(limit)).lean(),
      PublicProfile.countDocuments(filter),
    ]);

    return respond(res, 200, {
      profiles: profiles.map((p) => {
        // Lean objects don't have methods, so construct minimal public view
        return {
          _id:                p._id,
          user:               p.user,
          role:               p.role,
          displayName:        p.displayName,
          username:           p.username,
          headline:           p.headline,
          bio:                p.bio,
          location:           p.location,
          avatar:             p.avatar,
          cover:              p.cover,
          skills:             p.skills,
          verificationStatus: p.verificationStatus,
          socialStats:        p.socialStats,
          featured:           p.featured,
          availability:       p.availability,
          website:            p.website,
        };
      }),
      pagination: {
        page:  Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('[PublicProfile] searchPublicProfiles:', err);
    return respondError(res, 500, 'Server error');
  }
};

/**
 * GET /api/v1/public-profile/featured
 * Returns featured public profiles, optionally filtered by role.
 */
exports.getFeaturedProfiles = async (req, res) => {
  try {
    const { role, limit = 10 } = req.query;

    const filter = {
      isPubliclyVisible: true,
      featured:          true,
      $or: [{ featuredUntil: null }, { featuredUntil: { $gte: new Date() } }],
    };
    if (role) filter.role = role;

    const profiles = await PublicProfile.find(filter)
      .sort({ 'socialStats.followerCount': -1, createdAt: -1 })
      .limit(Number(limit))
      .lean();

    return respond(res, 200, { profiles });
  } catch (err) {
    console.error('[PublicProfile] getFeaturedProfiles:', err);
    return respondError(res, 500, 'Server error');
  }
};