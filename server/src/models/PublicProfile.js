/**
 * server/src/models/PublicProfile.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dedicated public-facing profile. Separated from the main Profile model so
 * the owner can control exactly what the world sees without risking accidental
 * leakage of private main-profile fields.
 *
 * Roles → tab structure (mirrors the markdown guide):
 *   candidate    → Info & Social | Education & Experience | Certificates | Posts | Network | Social Data
 *   freelancer   → Info & Social | Portfolio | Services & Certificates | Posts | Network | Social Data
 *   company      → Info & Social | Products | Posts | Network | Social Data
 *   organization → Info & Social | Posts | Network | Social Data
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const mongoose = require('mongoose');

// ── Shared sub-schemas ────────────────────────────────────────────────────────

const socialLinksSchema = new mongoose.Schema(
  {
    linkedin:  { type: String, trim: true },
    github:    { type: String, trim: true },
    twitter:   { type: String, trim: true },
    instagram: { type: String, trim: true },
    facebook:  { type: String, trim: true },
    tiktok:    { type: String, trim: true },
    telegram:  { type: String, trim: true },
    youtube:   { type: String, trim: true },
    website:   { type: String, trim: true },
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    institution:  { type: String, required: true, trim: true, maxlength: 200 },
    degree:       { type: String, required: true, trim: true, maxlength: 100 },
    field:        { type: String, trim: true, maxlength: 100 },
    startDate:    Date,
    endDate:      Date,
    current:      { type: Boolean, default: false },
    description:  { type: String, trim: true, maxlength: 500 },
    grade:        { type: String, trim: true, maxlength: 20 },
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    company:        { type: String, required: true, trim: true, maxlength: 200 },
    position:       { type: String, required: true, trim: true, maxlength: 100 },
    location:       { type: String, trim: true, maxlength: 100 },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance', 'self-employed'],
    },
    startDate:   Date,
    endDate:     Date,
    current:     { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 1000 },
    skills:      [{ type: String, trim: true, maxlength: 50 }],
  },
  { _id: true }
);

const certificationSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true, maxlength: 200 },
    issuer:        { type: String, required: true, trim: true, maxlength: 200 },
    issueDate:     Date,
    expiryDate:    Date,
    credentialId:  { type: String, trim: true, maxlength: 100 },
    credentialUrl: { type: String, trim: true },
    description:   { type: String, trim: true, maxlength: 500 },
  },
  { _id: true }
);

const portfolioItemSchema = new mongoose.Schema(
  {
    title:          { type: String, required: true, trim: true, maxlength: 200 },
    description:    { type: String, trim: true, maxlength: 1000 },
    mediaUrl:       String,
    mediaUrls:      [String],
    projectUrl:     String,
    category:       { type: String, trim: true, maxlength: 100 },
    technologies:   [{ type: String, trim: true, maxlength: 50 }],
    budget:         Number,
    duration:       { type: String, trim: true, maxlength: 50 },
    client:         { type: String, trim: true, maxlength: 200 },
    completionDate: Date,
    featured:       { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const serviceSchema = new mongoose.Schema(
  {
    title:          { type: String, required: true, trim: true, maxlength: 200 },
    description:    { type: String, trim: true, maxlength: 1000 },
    category:       { type: String, trim: true, maxlength: 100 },
    deliveryTime:   { type: String, trim: true, maxlength: 50 },
    priceRange: {
      min:      Number,
      max:      Number,
      currency: { type: String, default: 'ETB' },
    },
    technologies: [{ type: String, trim: true }],
    isActive:     { type: Boolean, default: true },
  },
  { _id: true }
);

const languageSchema = new mongoose.Schema(
  {
    language:   { type: String, required: true, trim: true },
    proficiency: {
      type: String,
      enum: ['basic', 'conversational', 'professional', 'fluent', 'native'],
      required: true,
    },
  },
  { _id: false }
);

// ── Company-specific sub-schema ───────────────────────────────────────────────

const companyInfoSchema = new mongoose.Schema(
  {
    size:        { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
    foundedYear: Number,
    companyType: {
      type: String,
      enum: ['startup', 'small-business', 'medium-business', 'large-enterprise', 'multinational', 'non-profit', 'government'],
    },
    industry:   { type: String, trim: true, maxlength: 100 },
    mission:    { type: String, trim: true, maxlength: 500 },
    values:     [{ type: String, trim: true, maxlength: 100 }],
    culture:    { type: String, trim: true, maxlength: 1000 },
    specialties:[{ type: String, trim: true, maxlength: 100 }],
    website:    { type: String, trim: true },
    email:      { type: String, trim: true, lowercase: true },
    phone:      { type: String, trim: true },
    address:    { type: String, trim: true, maxlength: 300 },
  },
  { _id: false }
);

// ── Visibility settings ───────────────────────────────────────────────────────

const visibilitySettingsSchema = new mongoose.Schema(
  {
    profile:         { type: String, enum: ['public', 'connections', 'private'], default: 'public' },
    email:           { type: Boolean, default: false },
    phone:           { type: Boolean, default: false },
    location:        { type: Boolean, default: true },
    education:       { type: Boolean, default: true },
    experience:      { type: Boolean, default: true },
    certifications:  { type: Boolean, default: true },
    portfolio:       { type: Boolean, default: true },
    services:        { type: Boolean, default: true },
    socialLinks:     { type: Boolean, default: true },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const publicProfileSchema = new mongoose.Schema(
  {
    // Owner reference — ONE public profile per user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true,
    },

    // Role snapshot (denormalized so queries don't need to join User)
    role: {
      type: String,
      enum: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
      required: true,
      index: true,
    },

    // ── Branding / identity ───────────────────────────────────────────────────
    // Synced from User.avatar / Profile.avatar
    avatar: {
      public_id:   String,
      secure_url:  String,
      uploaded_at: Date,
    },
    cover: {
      public_id:   String,
      secure_url:  String,
      uploaded_at: Date,
    },

    // ── Core fields (editable by owner) ──────────────────────────────────────
    displayName:  { type: String, trim: true, maxlength: 100 },
    username:     { type: String, trim: true, lowercase: true, sparse: true, unique: true, maxlength: 50 },
    headline:     { type: String, trim: true, maxlength: 200 },
    bio:          { type: String, trim: true, maxlength: 2000 },
    location:     { type: String, trim: true, maxlength: 100 },
    phone:        { type: String, trim: true },
    email:        { type: String, trim: true, lowercase: true },
    website:      { type: String, trim: true },
    socialLinks:  { type: socialLinksSchema, default: () => ({}) },

    // ── Candidate / Freelancer fields ─────────────────────────────────────────
    skills:          [{ type: String, trim: true, maxlength: 50 }],
    education:       [educationSchema],
    experience:      [experienceSchema],
    certifications:  [certificationSchema],
    languages:       [languageSchema],
    interests:       [{ type: String, trim: true, maxlength: 50 }],

    // ── Freelancer-specific ───────────────────────────────────────────────────
    portfolio: [portfolioItemSchema],
    services:  [serviceSchema],
    hourlyRate: {
      amount:   Number,
      currency: { type: String, default: 'ETB' },
    },
    availability: {
      type: String,
      enum: ['available', 'partially-available', 'not-available'],
      default: 'available',
    },

    // ── Company / Organization fields ─────────────────────────────────────────
    companyInfo: { type: companyInfoSchema, default: () => ({}) },

    // ── Visibility & privacy ──────────────────────────────────────────────────
    visibility:         { type: visibilitySettingsSchema, default: () => ({}) },
    isPubliclyVisible:  { type: Boolean, default: true, index: true },

    // ── Verification (mirrored from Profile) ──────────────────────────────────
    verificationStatus: {
      type: String,
      enum: ['none', 'pending', 'verified', 'rejected'],
      default: 'none',
      index: true,
    },

    // ── Social stats (synced from Profile / Follow model) ─────────────────────
    socialStats: {
      followerCount:   { type: Number, default: 0, min: 0 },
      followingCount:  { type: Number, default: 0, min: 0 },
      postCount:       { type: Number, default: 0, min: 0 },
      profileViews:    { type: Number, default: 0, min: 0 },
      connectionCount: { type: Number, default: 0, min: 0 },
    },

    // ── Timestamps & activity ─────────────────────────────────────────────────
    lastSyncedAt:     Date,   // when it was last synced from main profile
    lastProfileView:  Date,
    featured:         { type: Boolean, default: false, index: true },
    featuredUntil:    Date,

    // ── SEO ───────────────────────────────────────────────────────────────────
    metaDescription: { type: String, trim: true, maxlength: 160 },
    metaKeywords:    [String],
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

publicProfileSchema.index({ user: 1 }, { unique: true });
publicProfileSchema.index({ username: 1 }, { unique: true, sparse: true });
publicProfileSchema.index({ role: 1, isPubliclyVisible: 1 });
publicProfileSchema.index({ 'socialStats.followerCount': -1 });
publicProfileSchema.index({ featured: 1, isPubliclyVisible: 1 });
publicProfileSchema.index({ verificationStatus: 1, isPubliclyVisible: 1 });
publicProfileSchema.index({ createdAt: -1 });
publicProfileSchema.index(
  { displayName: 'text', headline: 'text', bio: 'text', skills: 'text' },
  { weights: { displayName: 10, headline: 5, skills: 3, bio: 2 } }
);

// ── Virtuals ──────────────────────────────────────────────────────────────────

publicProfileSchema.virtual('avatarUrl').get(function () {
  return this.avatar?.secure_url || null;
});

publicProfileSchema.virtual('coverUrl').get(function () {
  return this.cover?.secure_url || null;
});

publicProfileSchema.virtual('profileUrl').get(function () {
  if (this.username) return `/profile/${this.username}`;
  return `/profile/${this.user}`;
});

// ── Instance methods ──────────────────────────────────────────────────────────

/**
 * Returns the safe, privacy-filtered data object for public consumers.
 * Respects the owner's visibility settings.
 */
publicProfileSchema.methods.getPublicData = function (viewerIsOwner = false) {
  const v = this.visibility;

  const base = {
    _id:                this._id,
    user:               this.user,
    role:               this.role,
    displayName:        this.displayName,
    username:           this.username,
    headline:           this.headline,
    bio:                this.bio,
    avatar:             this.avatar,
    cover:              this.cover,
    avatarUrl:          this.avatarUrl,
    coverUrl:           this.coverUrl,
    profileUrl:         this.profileUrl,
    verificationStatus: this.verificationStatus,
    socialStats:        this.socialStats,
    featured:           this.featured,
    isPubliclyVisible:  this.isPubliclyVisible,
    availability:       this.availability,
    createdAt:          this.createdAt,
    updatedAt:          this.updatedAt,
  };

  // Fields gated by visibility settings (or always shown to owner)
  if (viewerIsOwner || v?.location)      base.location    = this.location;
  if (viewerIsOwner || v?.email)         base.email       = this.email;
  if (viewerIsOwner || v?.phone)         base.phone       = this.phone;
  if (viewerIsOwner || v?.socialLinks)   base.socialLinks = this.socialLinks;
  base.website = this.website; // website is always public

  // Role-specific gated content
  if (viewerIsOwner || v?.education)      base.education      = this.education;
  if (viewerIsOwner || v?.experience)     base.experience     = this.experience;
  if (viewerIsOwner || v?.certifications) base.certifications = this.certifications;
  if (viewerIsOwner || v?.portfolio)      base.portfolio      = this.portfolio;
  if (viewerIsOwner || v?.services)       base.services       = this.services;

  // Always public fields
  base.skills    = this.skills;
  base.languages = this.languages;
  base.interests = this.interests;

  // Company/Org
  if (['company', 'organization'].includes(this.role)) {
    base.companyInfo = this.companyInfo;
  }

  // Freelancer extras
  if (this.role === 'freelancer') {
    base.hourlyRate = this.hourlyRate;
  }

  // Owner sees everything including settings
  if (viewerIsOwner) {
    base.visibility      = this.visibility;
    base.lastSyncedAt    = this.lastSyncedAt;
    base.metaDescription = this.metaDescription;
    base.metaKeywords    = this.metaKeywords;
  }

  return base;
};

/**
 * Increment the profile view counter and update lastProfileView timestamp.
 */
publicProfileSchema.methods.incrementViews = function () {
  this.socialStats.profileViews += 1;
  this.lastProfileView = new Date();
  return this.save();
};

// ── Static methods ────────────────────────────────────────────────────────────

/**
 * Find by username (case-insensitive).
 */
publicProfileSchema.statics.findByUsername = function (username) {
  return this.findOne({ username: username.toLowerCase(), isPubliclyVisible: true });
};

/**
 * Find by user ID, optionally including private profiles (for owner access).
 */
publicProfileSchema.statics.findByUserId = function (userId, includePrivate = false) {
  const query = { user: userId };
  if (!includePrivate) query.isPubliclyVisible = true;
  return this.findOne(query);
};

module.exports = mongoose.model('PublicProfile', publicProfileSchema);