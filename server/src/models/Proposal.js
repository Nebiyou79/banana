// models/Proposal.js
// Standalone Mongoose schema — single source of truth for all proposals.
// References other models via ObjectId only. No schema embedding in FreelanceTender.
const mongoose = require('mongoose');

// ========== SUB-SCHEMA: Milestone ==========
const MilestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Milestone title is required'],
    trim: true,
    maxlength: [100, 'Milestone title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Milestone description cannot exceed 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Milestone amount is required'],
    min: [0, 'Milestone amount cannot be negative']
  },
  duration: {
    type: Number,
    required: [true, 'Milestone duration is required'],
    min: [1, 'Milestone duration must be at least 1']
  },
  durationUnit: {
    type: String,
    enum: ['days', 'weeks', 'months'],
    default: 'days'
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

// ========== SUB-SCHEMA: ScreeningAnswer ==========
const ScreeningAnswerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  questionText: {
    type: String,
    trim: true
  },
  answer: {
    type: String,
    trim: true,
    maxlength: [2000, 'Answer cannot exceed 2000 characters']
  },
  isRequired: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// ========== SUB-SCHEMA: Attachment ==========
const AttachmentSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true
  },
  fileName: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [1, 'File size must be at least 1 byte']
  },
  mimetype: {
    type: String,
    required: [true, 'MIME type is required']
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  url: {
    type: String,
    required: [true, 'File URL is required']
  },
  downloadUrl: {
    type: String,
    required: [true, 'Download URL is required']
  },
  fileHash: {
    type: String,
    required: [true, 'File hash is required']
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  attachmentType: {
    type: String,
    enum: ['cv', 'portfolio', 'sample', 'other'],
    default: 'other'
  }
}, { _id: true });

// ========== SUB-SCHEMA: AuditLog ==========
const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedAt: {
    type: Date,
    default: Date.now
  },
  changes: {
    type: mongoose.Schema.Types.Mixed
  },
  note: {
    type: String,
    trim: true
  }
}, { _id: true });

// ========== MAIN SCHEMA: Proposal ==========
const proposalSchema = new mongoose.Schema({

  // ── Core References ────────────────────────────────────────────────────
  tender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FreelanceTender',
    required: [true, 'Tender reference is required']
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Freelancer reference is required']
  },
  freelancerProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FreelancerProfile'
  },

  // ── Section 1: Proposal Content ────────────────────────────────────────
  coverLetter: {
    type: String,
    required: [true, 'Cover letter is required'],
    minlength: [50, 'Cover letter must be at least 50 characters'],
    maxlength: [5000, 'Cover letter cannot exceed 5000 characters']
  },
  coverLetterHtml: {
    type: String,
    maxlength: [50000, 'Cover letter HTML cannot exceed 50000 characters']
  },
  proposalPlan: {
    type: String,
    maxlength: [3000, 'Proposal plan cannot exceed 3000 characters']
  },
  portfolioLinks: {
    type: [String],
    validate: [
      {
        validator: function (links) {
          return links.length <= 5;
        },
        message: 'Maximum 5 portfolio links allowed'
      },
      {
        validator: function (links) {
          return links.every(link => /^https?:\/\/.+\..+/.test(link));
        },
        message: 'All portfolio links must be valid URLs'
      }
    ]
  },

  // ── Section 2: Bid & Pricing ───────────────────────────────────────────
  bidType: {
    type: String,
    enum: ['fixed', 'hourly'],
    required: [true, 'Bid type is required'],
    default: 'fixed'
  },
  proposedAmount: {
    type: Number,
    required: [true, 'Proposed amount is required'],
    min: [0, 'Proposed amount cannot be negative']
  },
  currency: {
    type: String,
    enum: ['ETB', 'USD', 'EUR', 'GBP'],
    default: 'ETB'
  },
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate cannot be negative']
  },
  estimatedWeeklyHours: {
    type: Number,
    min: [1, 'Weekly hours must be at least 1'],
    max: [80, 'Weekly hours cannot exceed 80']
  },

  // ── Section 3: Timeline & Availability ────────────────────────────────
  deliveryTime: {
    value: {
      type: Number,
      required: [true, 'Delivery time value is required'],
      min: [1, 'Delivery time must be at least 1']
    },
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months'],
      required: [true, 'Delivery time unit is required']
    }
  },
  availability: {
    type: String,
    enum: ['full-time', 'part-time', 'flexible'],
    required: [true, 'Availability is required']
  },
  proposedStartDate: {
    type: Date
  },

  // ── Section 4: Milestones ──────────────────────────────────────────────
  milestones: [MilestoneSchema],

  // ── Section 5: Screening Answers ──────────────────────────────────────
  screeningAnswers: [ScreeningAnswerSchema],

  // ── Section 6: Attachments ────────────────────────────────────────────
  attachments: [AttachmentSchema],

  // ── Section 7: Status & Lifecycle ────────────────────────────────────
  status: {
    type: String,
    enum: [
      'draft',
      'submitted',
      'under_review',
      'shortlisted',
      'interview_scheduled',
      'awarded',
      'rejected',
      'withdrawn'
    ],
    default: 'draft'
  },
  isDraft: {
    type: Boolean,
    default: true
  },
  submittedAt: Date,
  reviewedAt: Date,
  shortlistedAt: Date,
  awardedAt: Date,
  rejectedAt: Date,
  withdrawnAt: Date,

  // ── Section 8: Owner Interaction ──────────────────────────────────────
  ownerNotes: {
    type: String,
    maxlength: [1000, 'Owner notes cannot exceed 1000 characters']
  },
  ownerRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  isShortlisted: {
    type: Boolean,
    default: false
  },
  interviewDate: Date,
  interviewNotes: {
    type: String,
    maxlength: [1000, 'Interview notes cannot exceed 1000 characters']
  },
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },

  // ── Section 9: Analytics ──────────────────────────────────────────────
  isBoosted: {
    type: Boolean,
    default: false
  },
  boostedUntil: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  ownerViewCount: {
    type: Number,
    default: 0
  },
  similarityScore: {
    type: Number,
    min: [0, 'Similarity score cannot be negative'],
    max: [1, 'Similarity score cannot exceed 1']
  },

  // ── Section 10: Audit Log ─────────────────────────────────────────────
  auditLog: [AuditLogSchema]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ========== INDEXES ==========

// One final submission per freelancer per tender (drafts excluded).
// partialFilterExpression scopes the unique constraint to non-draft docs only
// so multiple drafts per freelancer+tender are allowed.
// NOTE: if you see E11000 on tenderId_1_freelancerId_1 from an old schema,
// run the migration script: scripts/dropProposalLegacyIndex.js
proposalSchema.index(
  { tender: 1, freelancer: 1 },
  {
    unique: true,
    partialFilterExpression: { isDraft: false },
    name: 'unique_submitted_per_tender_freelancer'
  }
);

proposalSchema.index({ freelancer: 1, status: 1 });
proposalSchema.index({ tender: 1, status: 1 });
proposalSchema.index({ tender: 1, isShortlisted: 1 });
proposalSchema.index({ submittedAt: -1 });

// ========== PRE-SAVE: MILESTONE SUM VALIDATION ==========
proposalSchema.pre('save', function (next) {
  // Validate milestone sum vs proposedAmount when bidType is fixed
  if (
    this.milestones &&
    this.milestones.length > 0 &&
    this.bidType === 'fixed' &&
    this.proposedAmount
  ) {
    const milestoneTotal = this.milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    const difference = Math.abs(milestoneTotal - this.proposedAmount);
    const tolerance = this.proposedAmount * 0.05; // 5% tolerance

    if (difference > tolerance) {
      const err = new mongoose.Error.ValidationError(this);
      err.errors['milestones'] = new mongoose.Error.ValidatorError({
        message: `Milestone total (${milestoneTotal}) must equal proposed amount (${this.proposedAmount}) within 5% tolerance`,
        path: 'milestones',
        value: milestoneTotal
      });
      return next(err);
    }
  }

  next();
});

// ========== VIRTUALS ==========

proposalSchema.virtual('isExpired').get(function () {
  if (!this.tender || !this.tender.deadline) return false;
  return this.tender.deadline < new Date();
});

proposalSchema.virtual('canBeWithdrawn').get(function () {
  return this.status === 'submitted' || this.status === 'under_review';
});

proposalSchema.virtual('milestonesTotal').get(function () {
  if (!this.milestones || this.milestones.length === 0) return 0;
  return this.milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
});

// ========== INSTANCE METHODS ==========

/**
 * submitProposal — transitions draft to submitted
 * Validates isDraft===true before proceeding
 */
proposalSchema.methods.submitProposal = function () {
  if (!this.isDraft) {
    throw new Error('Proposal has already been submitted');
  }
  this.isDraft = false;
  this.status = 'submitted';
  this.submittedAt = new Date();
  return this.save();
};

/**
 * withdraw — transitions submitted/under_review to withdrawn
 */
proposalSchema.methods.withdraw = function () {
  if (!this.canBeWithdrawn) {
    throw new Error(
      `Cannot withdraw a proposal with status "${this.status}". Only submitted or under_review proposals can be withdrawn.`
    );
  }
  this.status = 'withdrawn';
  this.withdrawnAt = new Date();
  return this.save();
};

/**
 * addAuditEntry — appends an audit log record and saves
 */
proposalSchema.methods.addAuditEntry = function (action, userId, changes = {}, note = '') {
  this.auditLog.push({
    action,
    performedBy: userId,
    changes,
    note,
    performedAt: new Date()
  });
  return this.save();
};

// ========== STATIC METHODS ==========

/**
 * findByTender — query helper for proposals on a tender
 * @param {string} tenderId
 * @param {Object} filters — { status, isShortlisted, page, limit, sortBy }
 */
proposalSchema.statics.findByTender = function (tenderId, filters = {}) {
  const { status, isShortlisted, page = 1, limit = 10, sortBy = 'submittedAt:-1' } = filters;

  const query = {
    tender: tenderId,
    isDraft: false // never return drafts to tender owner
  };

  if (status) query.status = status;
  if (typeof isShortlisted === 'boolean') query.isShortlisted = isShortlisted;

  // Build sort object
  const [sortField, sortOrder] = sortBy.split(':');
  const sort = { [sortField]: parseInt(sortOrder) || -1 };

  const skip = (page - 1) * limit;

  return this.find(query).sort(sort).skip(skip).limit(limit);
};

/**
 * findByFreelancer — query helper for a freelancer's proposals
 * @param {string} userId
 * @param {Object} filters — { status, page, limit, sortBy }
 */
proposalSchema.statics.findByFreelancer = function (userId, filters = {}) {
  const { status, page = 1, limit = 10, sortBy = 'submittedAt:-1' } = filters;

  const query = { freelancer: userId };
  if (status) query.status = status;

  const [sortField, sortOrder] = sortBy.split(':');
  const sort = { [sortField]: parseInt(sortOrder) || -1 };

  const skip = (page - 1) * limit;

  return this.find(query).sort(sort).skip(skip).limit(limit);
};

module.exports = mongoose.model('Proposal', proposalSchema);