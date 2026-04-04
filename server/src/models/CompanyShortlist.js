// models/CompanyShortlist.js
const mongoose = require('mongoose');

const companyShortlistSchema = new mongoose.Schema(
  {
    // One shortlist document per Company
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
    },
    // Denormalized for auth checks without an extra join
    companyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Saved FreelancerProfile IDs (order = save order)
    freelancers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FreelancerProfile',
      },
    ],
    // Optional per-freelancer notes: freelancerProfileId.toString() → note string
    notes: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
companyShortlistSchema.index({ companyUserId: 1 });
companyShortlistSchema.index({ freelancers: 1 }); // useful for "who saved me?" queries

// ─── Statics ──────────────────────────────────────────────────────────────────

/**
 * Toggle a freelancer in/out of a company's shortlist.
 * Returns { saved: boolean, shortlistCount: number }.
 */
companyShortlistSchema.statics.toggle = async function (companyId, companyUserId, freelancerId) {
  // Upsert the shortlist document if it doesn't exist yet
  let shortlist = await this.findOneAndUpdate(
    { companyId },
    { $setOnInsert: { companyId, companyUserId, freelancers: [], notes: {} } },
    { upsert: true, new: true }
  );

  const alreadySaved = shortlist.freelancers.some(
    (id) => id.toString() === freelancerId.toString()
  );

  if (alreadySaved) {
    shortlist = await this.findOneAndUpdate(
      { companyId },
      { $pull: { freelancers: freelancerId } },
      { new: true }
    );
  } else {
    shortlist = await this.findOneAndUpdate(
      { companyId },
      { $addToSet: { freelancers: freelancerId } },
      { new: true }
    );
  }

  return {
    saved: !alreadySaved,
    shortlistCount: shortlist.freelancers.length,
  };
};

/**
 * Check whether a specific freelancer is saved by a company.
 */
companyShortlistSchema.statics.isSaved = async function (companyId, freelancerId) {
  if (!companyId || !freelancerId) return false;
  const doc = await this.findOne({ companyId, freelancers: freelancerId });
  return !!doc;
};

module.exports = mongoose.model('CompanyShortlist', companyShortlistSchema);
