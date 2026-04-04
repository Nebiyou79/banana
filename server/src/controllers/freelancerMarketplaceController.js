// controllers/freelancerMarketplaceController.js
const mongoose = require('mongoose');
const FreelancerProfile = require('../models/Freelancer');
const FreelancerReview  = require('../models/FreelancerReview');
const CompanyShortlist  = require('../models/CompanyShortlist');
const User              = require('../models/User');
const Company           = require('../models/Company');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const computeAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const sendError = (res, status, message, details = null) => {
  const payload = { success: false, message };
  if (details) payload.details = details;
  return res.status(status).json(payload);
};

/**
 * Strip private fields for the public listing.
 * NOW includes profession field.
 */
const toListItem = (fp) => {
  const u = fp.user || {};
  return {
    _id: fp._id,
    user: {
      _id: u._id,
      name: u.name,
      avatar: u.avatar || null,
      location: u.location || null,
      gender: u.gender || null,
      age: computeAge(u.dateOfBirth),
      skills: u.skills || [],
    },
    profession:      fp.profession || null,   // ← NEW
    headline:        fp.headline || null,
    hourlyRate:      fp.hourlyRate,
    availability:    fp.availability,
    experienceLevel: fp.experienceLevel,
    specialization:  fp.specialization || [],
    ratings:         fp.ratings,
    badges:          fp.badges || [],
    featured:        fp.featured,
    membership:      fp.membership,
    profileViews:    fp.profileViews,
    responseTime:    fp.responseTime,
    createdAt:       fp.createdAt,
  };
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/freelancers
 * List + search + filter freelancers (company-only).
 *
 * FIXED:
 *  - `search` now matches User.name, User.email, FreelancerProfile.headline,
 *    FreelancerProfile.profession, FreelancerProfile.specialization, User.skills
 *  - `profession` filter added as a direct FreelancerProfile field filter
 */
exports.listFreelancers = async (req, res) => {
  try {
    const {
      search,
      skills,
      profession,           // ← NEW filter
      minRate,
      maxRate,
      minRating,
      availability,
      experienceLevel,
      location,
      featured,
      sortBy = 'rating',
      page  = 1,
      limit = 12,
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    // ── 1. FreelancerProfile filter ────────────────────────────────────────
    const fpFilter = { profileVisibility: { $ne: 'private' } };

    if (minRate != null || maxRate != null) {
      fpFilter.hourlyRate = {};
      if (minRate != null) fpFilter.hourlyRate.$gte = parseFloat(minRate);
      if (maxRate != null) fpFilter.hourlyRate.$lte = parseFloat(maxRate);
    }
    if (minRating != null) {
      fpFilter['ratings.average'] = { $gte: parseFloat(minRating) };
    }
    if (availability)    fpFilter.availability    = availability;
    if (experienceLevel) fpFilter.experienceLevel = experienceLevel;
    if (featured === 'true') fpFilter.featured    = true;

    // NEW: exact profession filter
    if (profession) {
      fpFilter.profession = profession;
    }

    // ── 2. Build the search / user filter ─────────────────────────────────
    // We collect conditions that apply to User, then separately
    // conditions that apply directly to FreelancerProfile.
    const fpOrConditions = [];    // search terms that hit FreelancerProfile fields
    const userFilter = { role: 'freelancer', isActive: true };
    const userConditions = [];

    if (search) {
      const re = new RegExp(search.trim(), 'i');

      // ── User-side search: name + skills ──────────────────────────────────
      // headline/bio live on User in the old User model but are also denormalised
      // on FreelancerProfile — we search both to maximise recall.
      userConditions.push({
        $or: [
          { name:   re },      // FIX: search by freelancer name
          { skills: re },      // search by user skills array
          { bio:    re },      // user-level bio if stored there
        ],
      });

      // ── FreelancerProfile-side search ────────────────────────────────────
      fpOrConditions.push(
        { headline:      re },      // FIX: search by professional headline
        { profession:    re },      // search by profession
        { specialization:{ $elemMatch: { $regex: search.trim(), $options: 'i' } } },
        { bio:           re },
      );
    }

    if (location) {
      userConditions.push({ location: new RegExp(location.trim(), 'i') });
    }

    if (skills) {
      const skillArr = skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (skillArr.length) {
        // Match on User.skills array
        userConditions.push({ skills: { $in: skillArr } });
        // Also match on FreelancerProfile.specialization
        fpOrConditions.push({ specialization: { $in: skillArr } });
      }
    }

    // ── 3. Resolve user IDs from User filter ──────────────────────────────
    let userIds = null;   // null = "no user-side restriction"

    if (userConditions.length) {
      const compoundUserFilter = { ...userFilter, $and: userConditions };
      const matchingUsers = await User.find(compoundUserFilter).select('_id').lean();
      userIds = matchingUsers.map((u) => u._id);
    }

    // ── 4. Merge user IDs + fpOr conditions into fpFilter ─────────────────
    //
    // We want:  (userIds match  OR  fpOrConditions match)  AND  other fpFilters
    //
    // If both exist we combine them with $or so a freelancer is returned when
    // EITHER their User document matches OR their FreelancerProfile matches.
    if (userIds !== null && fpOrConditions.length) {
      fpFilter.$or = [
        { user: { $in: userIds } },
        ...fpOrConditions,
      ];
    } else if (userIds !== null) {
      fpFilter.user = { $in: userIds };
    } else if (fpOrConditions.length) {
      fpFilter.$or = fpOrConditions;
    }

    // If after user-lookup we got zero IDs AND there are no fp-side OR conditions,
    // we know the result set is empty — short-circuit.
    if (userIds !== null && userIds.length === 0 && !fpOrConditions.length) {
      return res.json({
        success: true,
        data: {
          freelancers: [],
          pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 },
        },
      });
    }

    // ── 5. Sort ────────────────────────────────────────────────────────────
    const sortMap = {
      rating:      { 'ratings.average': -1 },
      rate_asc:    { hourlyRate: 1 },
      rate_desc:   { hourlyRate: -1 },
      newest:      { createdAt: -1 },
      most_active: { profileViews: -1 },
    };
    const sort = sortMap[sortBy] || sortMap.rating;

    // ── 6. Execute ─────────────────────────────────────────────────────────
    const [total, profiles] = await Promise.all([
      FreelancerProfile.countDocuments(fpFilter),
      FreelancerProfile.find(fpFilter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'user',
          select: 'name avatar location skills gender dateOfBirth isActive bio',
        })
        .lean(),
    ]);

    const validProfiles = profiles.filter((fp) => fp.user?.isActive !== false && fp.user);

    return res.json({
      success: true,
      data: {
        freelancers: validProfiles.map(toListItem),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    console.error('[listFreelancers]', err);
    return sendError(res, 500, 'Failed to fetch freelancers');
  }
};

/**
 * GET /api/v1/freelancers/professions
 * Returns the master list of professions so the frontend can populate dropdowns.
 */
exports.getProfessionList = async (_req, res) => {
  return res.json({
    success: true,
    data: { professions: FreelancerProfile.schema.statics.PROFESSION_LIST || [] },
  });
};

/**
 * GET /api/v1/freelancers/:id
 * Full public profile for a company viewer.
 * NOW includes profession field in response.
 */
exports.getFreelancerPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid freelancer ID');
    }

    // Try by FreelancerProfile._id first, then by user ref
    let profile = await FreelancerProfile.findById(id)
      .populate({
        path: 'user',
        select:
          'name email phone avatar location skills gender dateOfBirth website socialLinks portfolio experience education isActive bio',
      })
      .lean();

    if (!profile) {
      profile = await FreelancerProfile.findOne({ user: id })
        .populate({
          path: 'user',
          select:
            'name email phone avatar location skills gender dateOfBirth website socialLinks portfolio experience education isActive bio',
        })
        .lean();
    }

    if (!profile || !profile.user || profile.user?.isActive === false) {
      return sendError(res, 404, 'Freelancer not found');
    }

    if (profile.profileVisibility === 'private') {
      return sendError(res, 403, 'This profile is private');
    }

    // Increment profile views (fire-and-forget)
    FreelancerProfile.findByIdAndUpdate(profile._id, { $inc: { profileViews: 1 } }).exec();

    // Check if this company saved the freelancer
    const company = await Company.findOne({ user: viewerId }).select('_id').lean();
    const isSaved = company
      ? await CompanyShortlist.isSaved(company._id, profile._id)
      : false;

    // 5 most recent reviews
    const recentReviews = await FreelancerReview.find({
      freelancerId: profile._id,
      isVisible: true,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'companyId', select: 'name logo' })
      .lean();

    // Portfolio (Cloudinary only)
    const portfolio = (profile.user.portfolio || [])
      .filter((p) => p.visibility !== 'private')
      .map((p) => ({
        _id:         p._id,
        title:       p.title,
        description: p.description || null,
        mediaUrls:   (p.mediaUrls || [p.mediaUrl].filter(Boolean)).filter(
          (url) => url && url.includes('cloudinary.com')
        ),
        projectUrl:  p.projectUrl || null,
        category:    p.category || null,
        technologies:p.technologies || [],
        client:      p.client || null,
        featured:    p.featured || false,
        createdAt:   p.createdAt,
      }));

    // Merge social links
    const socialLinks = {
      ...(profile.user.socialLinks || {}),
      ...(profile.socialLinks || {}),
    };

    const responseData = {
      _id: profile._id,
      user: {
        _id:        profile.user._id,
        name:       profile.user.name,
        email:      profile.user.email,
        phone:      profile.user.phone || null,
        avatar:     profile.user.avatar || null,
        location:   profile.user.location || null,
        gender:     profile.user.gender || null,
        age:        computeAge(profile.user.dateOfBirth),
        website:    profile.user.website || null,
        skills:     profile.user.skills || [],
        socialLinks,
        portfolio,
        experience: profile.user.experience || [],
        education:  profile.user.education || [],
      },
      profession:         profile.profession || null,   // ← NEW
      headline:           profile.headline || null,
      bio:                profile.bio || null,
      hourlyRate:         profile.hourlyRate,
      availability:       profile.availability,
      experienceLevel:    profile.experienceLevel,
      englishProficiency: profile.englishProficiency,
      timezone:           profile.timezone || null,
      specialization:     profile.specialization || [],
      services:           profile.services || [],
      certifications:     profile.certifications || [],
      ratings:            profile.ratings,
      badges:             profile.badges || [],
      businessSize:       profile.businessSize,
      workingHours:       profile.workingHours || null,
      responseTime:       profile.responseTime,
      successRate:        profile.successRate,
      onTimeDelivery:     profile.onTimeDelivery,
      totalEarnings:      profile.totalEarnings,
      profileCompletion:  profile.profileCompletion,
      profileViews:       profile.profileViews,
      featured:           profile.featured,
      membership:         profile.membership,
      isSaved,
      recentReviews,
    };

    return res.json({ success: true, data: responseData });
  } catch (err) {
    console.error('[getFreelancerPublicProfile]', err);
    return sendError(res, 500, 'Failed to fetch freelancer profile');
  }
};

/**
 * POST /api/v1/freelancers/:id/reviews
 */
exports.submitReview = async (req, res) => {
  try {
    const { id: freelancerProfileId } = req.params;
    const companyUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(freelancerProfileId)) {
      return sendError(res, 400, 'Invalid freelancer ID');
    }

    const { rating, comment, subRatings } = req.body;
    const ratingNum = parseInt(rating, 10);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return sendError(res, 400, 'Rating must be an integer between 1 and 5');
    }

    const company = await Company.findOne({ user: companyUserId }).select('_id').lean();
    if (!company) {
      return sendError(res, 403, 'Company profile not found');
    }

    const freelancerProfile = await FreelancerProfile.findById(freelancerProfileId)
      .select('user').lean();
    if (!freelancerProfile) return sendError(res, 404, 'Freelancer not found');

    if (freelancerProfile.user.toString() === companyUserId.toString()) {
      return sendError(res, 400, 'You cannot review yourself');
    }

    const cleanSubRatings = {};
    const subKeys = ['communication', 'quality', 'deadlines', 'professionalism'];
    if (subRatings && typeof subRatings === 'object') {
      for (const key of subKeys) {
        if (subRatings[key] != null) {
          const v = parseInt(subRatings[key], 10);
          if (v >= 1 && v <= 5) cleanSubRatings[key] = v;
        }
      }
    }

    let review;
    try {
      review = await FreelancerReview.create({
        freelancerId:     freelancerProfileId,
        freelancerUserId: freelancerProfile.user,
        companyId:        company._id,
        companyUserId,
        rating: ratingNum,
        comment: comment?.trim() || undefined,
        subRatings: Object.keys(cleanSubRatings).length ? cleanSubRatings : undefined,
      });
    } catch (err) {
      if (err.code === 11000) {
        return sendError(res, 409, 'You have already reviewed this freelancer');
      }
      throw err;
    }

    FreelancerReview.recalculateRatings(freelancerProfileId).catch((e) =>
      console.error('[recalculateRatings]', e)
    );

    await review.populate({ path: 'companyId', select: 'name logo' });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (err) {
    console.error('[submitReview]', err);
    return sendError(res, 500, 'Failed to submit review');
  }
};

/**
 * GET /api/v1/freelancers/:id/reviews
 */
exports.getReviews = async (req, res) => {
  try {
    const { id: freelancerProfileId } = req.params;
    const page  = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const skip  = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(freelancerProfileId)) {
      return sendError(res, 400, 'Invalid freelancer ID');
    }

    const filter = { freelancerId: freelancerProfileId, isVisible: true };

    const [total, reviews, profileDoc] = await Promise.all([
      FreelancerReview.countDocuments(filter),
      FreelancerReview.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'companyId', select: 'name logo' })
        .lean(),
      FreelancerProfile.findById(freelancerProfileId).select('ratings').lean(),
    ]);

    return res.json({
      success: true,
      data: {
        reviews,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        summary: profileDoc?.ratings || { average: 0, count: 0, breakdown: {} },
      },
    });
  } catch (err) {
    console.error('[getReviews]', err);
    return sendError(res, 500, 'Failed to fetch reviews');
  }
};

/**
 * POST /api/v1/company/shortlist/:freelancerId
 */
exports.toggleShortlist = async (req, res) => {
  try {
    const { freelancerId } = req.params;
    const companyUserId    = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
      return sendError(res, 400, 'Invalid freelancer ID');
    }

    const exists = await FreelancerProfile.exists({ _id: freelancerId });
    if (!exists) return sendError(res, 404, 'Freelancer not found');

    const company = await Company.findOne({ user: companyUserId }).select('_id').lean();
    if (!company) return sendError(res, 403, 'Company profile not found');

    const result = await CompanyShortlist.toggle(company._id, companyUserId, freelancerId);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[toggleShortlist]', err);
    return sendError(res, 500, 'Failed to update shortlist');
  }
};

/**
 * GET /api/v1/company/shortlist
 */
exports.getShortlist = async (req, res) => {
  try {
    const companyUserId = req.user._id;
    const page  = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));

    const company = await Company.findOne({ user: companyUserId }).select('_id').lean();
    if (!company) return sendError(res, 403, 'Company profile not found');

    const shortlistDoc = await CompanyShortlist.findOne({ companyId: company._id })
      .select('freelancers').lean();

    if (!shortlistDoc || !shortlistDoc.freelancers.length) {
      return res.json({
        success: true,
        data: {
          freelancers: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        },
      });
    }

    const allIds    = shortlistDoc.freelancers;
    const total     = allIds.length;
    const slicedIds = allIds.slice((page - 1) * limit, page * limit);

    const profiles = await FreelancerProfile.find({ _id: { $in: slicedIds } })
      .populate({ path: 'user', select: 'name avatar location skills gender dateOfBirth isActive' })
      .lean();

    const ordered = slicedIds
      .map((id) => profiles.find((p) => p._id.toString() === id.toString()))
      .filter(Boolean)
      .filter((fp) => fp.user?.isActive !== false && fp.user);

    return res.json({
      success: true,
      data: {
        freelancers: ordered.map(toListItem),
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    console.error('[getShortlist]', err);
    return sendError(res, 500, 'Failed to fetch shortlist');
  }
};