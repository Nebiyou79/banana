// models/Freelancer.js
const mongoose = require('mongoose');

// ─── Master profession list ───────────────────────────────────────────────────
// Companies and the filter UI use this to scope search precisely.
const PROFESSION_LIST = [
  // Technology & Engineering
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer (iOS)',
  'Mobile Developer (Android)',
  'Mobile Developer (React Native / Flutter)',
  'DevOps Engineer',
  'Cloud Engineer',
  'Site Reliability Engineer (SRE)',
  'Data Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'AI/ML Researcher',
  'Cybersecurity Engineer',
  'Blockchain Developer',
  'Embedded Systems Engineer',
  'QA Engineer',
  'Database Administrator',
  'Network Engineer',
  'Systems Architect',
  'Game Developer',
  'AR/VR Developer',
  // Design & Creative
  'UI/UX Designer',
  'Graphic Designer',
  'Motion Graphics Designer',
  'Brand Identity Designer',
  'Product Designer',
  'Illustrator',
  '3D Artist',
  'Video Editor',
  'Photographer',
  'Animator',
  'Voice Over Artist',
  'Podcast Producer',
  // Marketing & Growth
  'Digital Marketing Specialist',
  'SEO Specialist',
  'Content Marketer',
  'Social Media Manager',
  'Email Marketing Specialist',
  'Performance Marketer (PPC/Ads)',
  'Growth Hacker',
  'Affiliate Marketer',
  'Influencer Marketing Manager',
  'Market Research Analyst',
  'Public Relations Specialist',
  // Writing & Content
  'Copywriter',
  'Technical Writer',
  'Content Writer',
  'Blog Writer',
  'Ghost Writer',
  'Scriptwriter',
  'Proofreader / Editor',
  'Grant Writer',
  'Resume / CV Writer',
  'Academic Writer',
  // Business & Finance
  'Business Analyst',
  'Financial Analyst',
  'Accountant',
  'Bookkeeper',
  'Tax Consultant',
  'Management Consultant',
  'Strategy Consultant',
  'Investment Analyst',
  'Risk Analyst',
  'Project Manager',
  'Product Manager',
  'Operations Manager',
  'Supply Chain Consultant',
  // Sales & Customer Success
  'Sales Representative',
  'Account Executive',
  'CRM Specialist',
  'Customer Support Specialist',
  'Customer Success Manager',
  'Lead Generation Specialist',
  'B2B Sales Consultant',
  // Legal & Compliance
  'Legal Consultant',
  'Contract Lawyer',
  'Intellectual Property Specialist',
  'Compliance Officer',
  'Legal Researcher',
  // Healthcare & Wellness
  'Medical Consultant',
  'Health Coach',
  'Nutritionist / Dietitian',
  'Fitness Trainer',
  'Mental Health Counselor',
  'Pharmacist (Remote)',
  'Medical Transcriptionist',
  'Telemedicine Physician',
  // Education & Training
  'Online Tutor',
  'Curriculum Developer',
  'Instructional Designer',
  'Corporate Trainer',
  'Language Teacher / Interpreter',
  'Educational Consultant',
  // Architecture & Engineering (non-software)
  'Architect',
  'Interior Designer',
  'Civil Engineer',
  'Mechanical Engineer',
  'Electrical Engineer',
  'Structural Engineer',
  'Environmental Consultant',
  // Admin & Virtual Assistance
  'Virtual Assistant',
  'Executive Assistant',
  'Data Entry Specialist',
  'Research Analyst',
  'Administrative Consultant',
  'Scheduling / Calendar Manager',
  // Logistics & E-Commerce
  'E-Commerce Specialist',
  'Amazon / Shopify Specialist',
  'Dropshipping Consultant',
  'Logistics Coordinator',
  'Procurement Specialist',
  // Other
  'Translator / Localisation Expert',
  'HR Consultant',
  'Recruiter',
  'Event Planner',
  'Real Estate Consultant',
  'Agriculture Consultant',
  'Other',
];

const freelancerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // ── NEW: Primary profession ──────────────────────────────────────────────
  // A single canonical job title chosen from PROFESSION_LIST.
  // Used for precise filtering on the marketplace.
  profession: {
    type: String,
    trim: true,
    enum: { values: PROFESSION_LIST, message: 'Invalid profession value' },
  },

  // Professional Information
  headline: { type: String, trim: true, maxlength: 200 },
  bio:      { type: String, trim: true, maxlength: 2000 },
  hourlyRate: { type: Number, min: 0, max: 1000, default: 0 },
  availability: {
    type: String,
    enum: ['available', 'not-available', 'part-time'],
    default: 'available',
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'expert'],
    default: 'intermediate',
  },
  englishProficiency: {
    type: String,
    enum: ['basic', 'conversational', 'fluent', 'native'],
    default: 'basic',
  },
  timezone: { type: String, trim: true },

  // Social Links
  socialLinks: {
    linkedin:      { type: String, trim: true },
    twitter:       { type: String, trim: true },
    github:        { type: String, trim: true },
    facebook:      { type: String, trim: true },
    instagram:     { type: String, trim: true },
    tiktok:        { type: String, trim: true },
    telegram:      { type: String, trim: true },
    youtube:       { type: String, trim: true },
    whatsapp:      { type: String, trim: true },
    discord:       { type: String, trim: true },
    behance:       { type: String, trim: true },
    dribbble:      { type: String, trim: true },
    medium:        { type: String, trim: true },
    devto:         { type: String, trim: true },
    stackoverflow: { type: String, trim: true },
    codepen:       { type: String, trim: true },
    gitlab:        { type: String, trim: true },
  },

  // Specialization & Services
  specialization: [{ type: String, trim: true }],
  services: [{
    title:        { type: String, required: true, trim: true, maxlength: 100 },
    description:  { type: String, trim: true, maxlength: 500 },
    price:        { type: Number, min: 0 },
    deliveryTime: { type: Number, min: 1 },
    category:     { type: String, trim: true },
  }],

  // Certifications
  certifications: [{
    name:          { type: String, required: true, trim: true, maxlength: 200 },
    issuer:        { type: String, required: true, trim: true, maxlength: 200 },
    issueDate:     { type: Date,  required: true },
    expiryDate:    {
      type: Date,
      validate: {
        validator: function (v) { return !v || v > this.issueDate; },
        message: 'Expiry date must be after issue date',
      },
    },
    credentialId:  { type: String, trim: true, maxlength: 100 },
    credentialUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^https?:\/\/.+\..+/.test(v),
        message: 'Invalid credential URL',
      },
    },
    description:   { type: String, trim: true, maxlength: 500 },
    skills:        [{ type: String, trim: true }],
  }],

  // Verification & Status
  verified:          { type: Boolean, default: false },
  profileCompletion: { type: Number, min: 0, max: 100, default: 0 },

  // Professional Stats
  totalEarnings: { type: Number, default: 0 },
  successRate:   { type: Number, min: 0, max: 100, default: 0 },
  onTimeDelivery:{ type: Number, min: 0, max: 100, default: 0 },
  responseRate:  { type: Number, min: 0, max: 100, default: 0 },

  // Ratings & Reviews
  ratings: {
    average:  { type: Number, min: 0, max: 5, default: 0 },
    count:    { type: Number, default: 0 },
    breakdown: {
      communication:  { type: Number, default: 0 },
      quality:        { type: Number, default: 0 },
      deadlines:      { type: Number, default: 0 },
      professionalism:{ type: Number, default: 0 },
    },
  },

  // Professional Badges
  badges: [{
    name:        String,
    description: String,
    earnedAt:    Date,
    icon:        String,
  }],

  // Business Information
  businessSize: {
    type: String,
    enum: ['individual', 'agency', 'small-team'],
    default: 'individual',
  },
  teamMembers: [{ name: String, role: String, experience: String }],

  // Availability & Preferences
  workingHours: { start: String, end: String, timezone: String },
  responseTime: { type: Number, default: 24 },
  preferredPaymentMethods: [{ type: String, enum: ['hourly', 'fixed', 'milestone'] }],

  // Analytics
  profileViews:       { type: Number, default: 0 },
  profileImpressions: { type: Number, default: 0 },
  proposalViews:      { type: Number, default: 0 },

  // Settings
  profileVisibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public',
  },
  featured:      { type: Boolean, default: false },
  featuredUntil: Date,

  // Membership
  membership: {
    type: String,
    enum: ['basic', 'professional', 'premium'],
    default: 'basic',
  },
  membershipExpires: Date,

}, { timestamps: true });

// ── Indexes ───────────────────────────────────────────────────────────────────
freelancerProfileSchema.index({ user: 1 });
freelancerProfileSchema.index({ profession: 1 });          // NEW
freelancerProfileSchema.index({ specialization: 1 });
freelancerProfileSchema.index({ hourlyRate: 1 });
freelancerProfileSchema.index({ experienceLevel: 1 });
freelancerProfileSchema.index({ verified: 1 });
freelancerProfileSchema.index({ featured: 1 });
freelancerProfileSchema.index({ 'ratings.average': -1 });
freelancerProfileSchema.index({ 'certifications.issueDate': -1 });

// ── Statics ───────────────────────────────────────────────────────────────────
freelancerProfileSchema.statics.PROFESSION_LIST = PROFESSION_LIST;
freelancerProfileSchema.statics.findByUserId = function (userId) {
  return this.findOne({ user: userId }).populate('user');
};

// ── Virtuals ──────────────────────────────────────────────────────────────────
freelancerProfileSchema.virtual('isProfileComplete').get(function () {
  return this.profileCompletion >= 80;
});

// ── Methods ───────────────────────────────────────────────────────────────────
freelancerProfileSchema.methods.calculateProfileCompletion = function (user) {
  const fields = [
    { condition: user.name?.trim().length > 0,                  weight: 5 },
    { condition: !!user.email,                                   weight: 5 },
    { condition: user.avatar?.includes('cloudinary.com'),        weight: 5 },
    { condition: !!user.location?.trim(),                        weight: 5 },
    { condition: this.headline?.trim().length > 0,               weight: 10 },
    { condition: this.bio?.trim().length > 100,                  weight: 10 },
    { condition: this.hourlyRate > 0,                            weight: 5 },
    { condition: !!this.profession,                              weight: 5 },  // NEW
    { condition: user.skills?.length >= 5,                       weight: 10 },
    { condition: user.portfolio?.filter(p => p.mediaUrl?.includes('cloudinary.com')).length >= 2, weight: 10 },
    { condition: this.specialization?.length > 0,                weight: 5 },
    { condition: user.experience?.length > 0,                    weight: 8 },
    { condition: user.education?.length > 0,                     weight: 7 },
    { condition: this.certifications?.length > 0,                weight: 5 },
    { condition: Object.values(this.socialLinks || {}).some(l => l), weight: 5 },
  ];

  const max = fields.reduce((s, f) => s + f.weight, 0);
  const score = fields.reduce((s, f) => s + (f.condition ? f.weight : 0), 0);
  return Math.round((score / max) * 100);
};

freelancerProfileSchema.methods.addCertification = function (data) {
  this.certifications.push(data);
  return this.save();
};

freelancerProfileSchema.methods.removeCertification = function (id) {
  this.certifications.id(id).remove();
  return this.save();
};

module.exports = mongoose.model('FreelancerProfile', freelancerProfileSchema);