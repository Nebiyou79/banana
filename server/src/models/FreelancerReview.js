// models/FreelancerReview.js
const mongoose = require('mongoose');

const freelancerReviewSchema = new mongoose.Schema(
  {
    // The FreelancerProfile being reviewed
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FreelancerProfile',
      required: true,
      index: true,
    },
    // The User._id of the freelancer (for quick cross-collection lookup)
    freelancerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // The Company document that submitted the review
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    // The User._id of the company owner (for auth checks)
    companyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Overall star rating 1–5
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },

    // Optional written review
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },

    // Granular sub-ratings (all optional, 1–5)
    subRatings: {
      communication:   { type: Number, min: 1, max: 5 },
      quality:         { type: Number, min: 1, max: 5 },
      deadlines:       { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
    },

    // Soft-delete flag (admin moderation)
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// One review per company per freelancer (enforced at DB level)
freelancerReviewSchema.index(
  { freelancerId: 1, companyId: 1 },
  { unique: true }
);

// Fast listing queries
freelancerReviewSchema.index({ freelancerId: 1, createdAt: -1 });
freelancerReviewSchema.index({ companyUserId: 1 });

// ─── Statics ──────────────────────────────────────────────────────────────────

/**
 * Recalculate aggregate ratings for a FreelancerProfile.
 * Call this after any insert / delete.
 */
freelancerReviewSchema.statics.recalculateRatings = async function (freelancerId) {
  const FreelancerProfile = mongoose.model('FreelancerProfile');

  const reviews = await this.find({ freelancerId, isVisible: true });

  if (reviews.length === 0) {
    await FreelancerProfile.findByIdAndUpdate(freelancerId, {
      'ratings.average': 0,
      'ratings.count': 0,
      'ratings.breakdown.communication': 0,
      'ratings.breakdown.quality': 0,
      'ratings.breakdown.deadlines': 0,
      'ratings.breakdown.professionalism': 0,
    });
    return;
  }

  const count = reviews.length;
  const sum = (field) =>
    reviews.reduce((acc, r) => acc + (r[field] || 0), 0);

  const average = reviews.reduce((acc, r) => acc + r.rating, 0) / count;

  // Sub-rating averages — only include reviews that supplied the sub-rating
  const subAvg = (key) => {
    const withSub = reviews.filter((r) => r.subRatings?.[key] != null);
    if (!withSub.length) return 0;
    return withSub.reduce((acc, r) => acc + r.subRatings[key], 0) / withSub.length;
  };

  await FreelancerProfile.findByIdAndUpdate(freelancerId, {
    'ratings.average': Math.round(average * 10) / 10,
    'ratings.count': count,
    'ratings.breakdown.communication':   Math.round(subAvg('communication') * 10) / 10,
    'ratings.breakdown.quality':         Math.round(subAvg('quality') * 10) / 10,
    'ratings.breakdown.deadlines':       Math.round(subAvg('deadlines') * 10) / 10,
    'ratings.breakdown.professionalism': Math.round(subAvg('professionalism') * 10) / 10,
  });
};

module.exports = mongoose.model('FreelancerReview', freelancerReviewSchema);
