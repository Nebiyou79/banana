const mongoose = require('mongoose');
const crypto = require('crypto');

// ============ SCHEMA DEFINITIONS ============

// Proposal Schema
const proposalSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'proposals.applicantModel'
  },
  applicantModel: {
    type: String,
    required: true,
    enum: ['User', 'Company']
  },
  applicantRole: {
    type: String,
    required: true,
    enum: ['freelancer', 'company']
  },
  bidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  proposalText: {
    type: String,
    required: true,
    maxlength: 10000
  },
  deliveryTime: {
    type: Number,
    required: true,
    min: 1
  },
  attachments: [{
    originalName: String,
    fileName: String,
    size: Number,
    mimetype: String,
    path: String,
    url: String,
    downloadUrl: String,
    fileHash: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'shortlisted', 'accepted', 'rejected'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  notes: String,
  // For freelance proposals
  coverLetter: String,
  portfolioLink: String,
  sampleWork: [{
    title: String,
    description: String,
    url: String,
    filePath: String
  }],
  cvPath: String,
  hourlyRate: Number,
  estimatedHours: Number,
  // For professional proposals
  technicalProposal: String,
  financialProposal: String,
  complianceDocuments: [{
    originalName: String,
    fileName: String,
    size: Number,
    mimetype: String,
    path: String,
    url: String,
    downloadUrl: String,
    documentType: String,
    fileHash: String
  }],
  companyDocuments: [{
    originalName: String,
    fileName: String,
    size: Number,
    mimetype: String,
    path: String,
    url: String,
    downloadUrl: String,
    documentType: String,
    fileHash: String
  }],
  // For sealed bids
  sealed: {
    type: Boolean,
    default: false
  },
  revealedAt: Date,
  // Sealed bid integrity
  sealedHash: String,
  sealedAt: Date
}, { timestamps: true });

// Tender Visibility Schema
const tenderVisibilitySchema = new mongoose.Schema({
  visibilityType: {
    type: String,
    required: true,
    enum: ['freelancers_only', 'public', 'companies_only', 'invite_only']
  },
  allowedCompanies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Tender Invitation Schema (SINGLE SCHEMA - NO DUPLICATES)
const tenderInvitationSchema = new mongoose.Schema({
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  invitedCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  invitationType: {
    type: String,
    enum: ['user', 'company', 'email'],
    required: true
  },
  invitationStatus: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: Date,
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: String,
  tokenExpires: Date
});

// Attachment Schema (LOCAL FILES ONLY)
const attachmentSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 1
  },
  mimetype: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  downloadUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 200
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  documentType: {
    type: String,
    enum: [
      'terms_of_reference',
      'technical_specifications',
      'statement_of_work',
      'drawings',
      'bill_of_quantities',
      'compliance_template',
      'reference_designs',
      'nda',
      'design_references',
      'sample_data',
      'brand_guidelines',
      'wireframes',
      'other'
    ],
    default: 'other'
  },
  version: {
    type: Number,
    default: 1
  },
  fileHash: {
    type: String,
    required: true
  },
  previousVersions: [{
    originalName: String,
    fileName: String,
    path: String,
    url: String,
    downloadUrl: String,
    fileHash: String,
    version: Number,
    replacedAt: Date
  }]
});

// Freelance Tender Specific Schema
const freelanceSpecificSchema = new mongoose.Schema({
  projectType: {
    type: String,
    enum: ['one_time', 'ongoing', 'complex'],
    default: 'one_time'
  },
  engagementType: {
    type: String,
    enum: ['fixed_price', 'hourly'],
    required: true
  },
  budget: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'ETB'],
      default: 'USD'
    }
  },
  estimatedDuration: {
    value: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months'],
      default: 'days'
    }
  },
  weeklyHours: {
    type: Number,
    min: 0
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'expert'],
    default: 'intermediate'
  },
  portfolioRequired: {
    type: Boolean,
    default: false
  },
  languagePreference: String,
  timezonePreference: String,
  screeningQuestions: [{
    question: {
      type: String,
      required: true
    },
    required: {
      type: Boolean,
      default: false
    }
  }],
  ndaRequired: {
    type: Boolean,
    default: false
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent'],
    default: 'normal'
  },
  industry: String
});

// Professional Tender Specific Schema
const professionalSpecificSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    required: true,
    uppercase: true,
    unique: true,
    sparse: true
  },
  procuringEntity: {
    type: String,
    required: true
  },
  procurementMethod: {
    type: String,
    enum: ['open_tender', 'restricted', 'direct', 'framework'],
    default: 'open_tender'
  },
  fundingSource: String,

  // Eligibility criteria
  eligibleBidderType: {
    type: String,
    default: 'company',
    enum: ['company']
  },
  minimumExperience: {
    type: Number,
    default: 0,
    min: 0
  },
  requiredCertifications: [{
    name: String,
    issuingAuthority: String
  }],
  legalRegistrationRequired: {
    type: Boolean,
    default: true
  },
  financialCapacity: {
    minAnnualTurnover: Number,
    currency: String
  },
  pastProjectReferences: {
    minCount: {
      type: Number,
      default: 0
    },
    similarValueProjects: Boolean
  },

  // Technical requirements
  projectObjectives: String,
  deliverables: [{
    title: String,
    description: String,
    deadline: Date
  }],
  milestones: [{
    title: String,
    description: String,
    dueDate: Date,
    paymentPercentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  timeline: {
    startDate: Date,
    endDate: Date,
    duration: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months', 'years'],
        default: 'months'
      }
    }
  },

  // Evaluation criteria
  evaluationMethod: {
    type: String,
    enum: ['technical_only', 'financial_only', 'combined'],
    default: 'combined'
  },
  evaluationCriteria: {
    technicalWeight: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    financialWeight: {
      type: Number,
      min: 0,
      max: 100,
      default: 30
    }
  },

  // Submission rules
  bidValidityPeriod: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months'],
      default: 'days'
    }
  },
  clarificationDeadline: Date,
  preBidMeeting: {
    date: Date,
    location: String,
    onlineLink: String
  },
  sealedBidConfirmation: {
    type: Boolean,
    default: false
  },
  cpoRequired: {
    type: Boolean,
    default: false
  },
  cpoDescription: {
    type: String,
    maxlength: 1000,
    trim: true,
    required: function () {
      return this.cpoRequired === true;
    }
  },
  // For closed tender integrity
  sealedDataHash: String,
  sealedAt: Date
});

// Main Tender Schema
const tenderSchema = new mongoose.Schema({
  // ============ BASIC IDENTIFICATION ============
  tenderId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  title: {
    type: String,
    required: [true, 'Tender title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Tender description is required'],
    maxlength: [20000, 'Description cannot exceed 20000 characters']
  },

  // ============ TENDER CLASSIFICATION ============
  tenderCategory: {
    type: String,
    enum: ['freelance', 'professional'],
    required: true
  },

  workflowType: {
    type: String,
    enum: ['open', 'closed'],
    required: true,
    default: 'open'
  },

  status: {
    type: String,
    enum: ['draft', 'published', 'locked', 'deadline_reached', 'revealed', 'closed', 'cancelled'],
    default: 'draft'
  },

  // ============ VISIBILITY & ACCESS CONTROL ============
  visibility: {
    type: tenderVisibilitySchema,
    required: true
  },

  // ============ OWNERSHIP ============
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerRole: {
    type: String,
    enum: ['organization', 'company'],
    required: true
  },
  ownerEntity: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'ownerEntityModel'
  },
  ownerEntityModel: {
    type: String,
    required: true,
    enum: ['Organization', 'Company']
  },

  // ============ TENDER-SPECIFIC FIELDS ============
  freelanceSpecific: freelanceSpecificSchema,
  professionalSpecific: professionalSpecificSchema,

  // ============ COMMON FIELDS ============
  procurementCategory: {
    type: String,
    required: true,
    trim: true
  },

  skillsRequired: [{
    type: String,
    trim: true,
    maxlength: 50
  }],

  // ============ DOCUMENTS & ATTACHMENTS ============
  attachments: [attachmentSchema],

  maxFileSize: {
    type: Number,
    default: 50 * 1024 * 1024,
    min: 1 * 1024 * 1024,
    max: 500 * 1024 * 1024
  },

  maxFileCount: {
    type: Number,
    default: 20,
    min: 1,
    max: 100
  },

  // ============ TIMELINE ============
  deadline: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return value > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },

  publishedAt: Date,
  lockedAt: Date,
  deadlineReachedAt: Date,
  revealedAt: Date,
  closedAt: Date,
  cancelledAt: Date,

  // ============ INVITATIONS ============
  invitations: [tenderInvitationSchema],

  // ============ APPLICATIONS/PROPOSALS ============
  proposals: [proposalSchema],

  // ============ METADATA & TRACKING ============
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    savedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    totalApplications: {
      type: Number,
      default: 0
    },
    visibleApplications: {
      type: Number,
      default: 0
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastUpdatedAt: Date,
    updateCount: {
      type: Number,
      default: 0
    },
    isUpdated: {
      type: Boolean,
      default: false
    },
    sealedProposals: {
      type: Number,
      default: 0
    },
    revealedProposals: {
      type: Number,
      default: 0
    },
    countdownVisible: {
      type: Boolean,
      default: true
    },
    daysRemaining: Number,
    dataHash: String,
    lockedBy: mongoose.Schema.Types.ObjectId,
    revealedBy: mongoose.Schema.Types.ObjectId,
    closedBy: mongoose.Schema.Types.ObjectId
  },

  // ============ AUDIT & COMPLIANCE ============
  auditLog: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    changes: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String
  }],

  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret.__v;
      // Remove sensitive paths from API responses
      if (ret.attachments) {
        ret.attachments = ret.attachments.map(att => {
          const { path, ...safeAtt } = att;
          return safeAtt;
        });
      }
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// ============ INDEXES ============
tenderSchema.index({ tenderId: 1 }, { unique: true, sparse: true });
tenderSchema.index({ tenderCategory: 1, status: 1 });
tenderSchema.index({ tenderCategory: 1, deadline: 1 });
tenderSchema.index({ tenderCategory: 1, 'visibility.visibilityType': 1 });
tenderSchema.index({ workflowType: 1, status: 1 });
tenderSchema.index({ owner: 1, status: 1 });
tenderSchema.index({ status: 1, deadline: 1 });
tenderSchema.index({ procurementCategory: 1, status: 1 });
tenderSchema.index({ 'professionalSpecific.referenceNumber': 1 }, { unique: true, sparse: true });
tenderSchema.index({ 'metadata.savedBy': 1 });
tenderSchema.index({ 'invitations.invitedUser': 1 });
tenderSchema.index({ 'invitations.invitedCompany': 1 });
tenderSchema.index({ 'invitations.email': 1 });
tenderSchema.index({
  'invitations.invitedUser': 1,
  'invitations.invitationStatus': 1
});
tenderSchema.index({
  'invitations.invitedCompany': 1,
  'invitations.invitationStatus': 1
});
tenderSchema.index({
  'invitations.email': 1,
  'invitations.invitationStatus': 1
});
tenderSchema.index({
  tenderCategory: 1,
  status: 1,
  deadline: 1,
  'visibility.visibilityType': 1
});

// ============ VIRTUAL PROPERTIES ============
tenderSchema.virtual('isActive').get(function () {
  return this.status === 'published' && this.deadline > new Date();
});

tenderSchema.virtual('isExpired').get(function () {
  return this.deadline <= new Date();
});

tenderSchema.virtual('isFreelance').get(function () {
  return this.tenderCategory === 'freelance';
});

tenderSchema.virtual('isProfessional').get(function () {
  return this.tenderCategory === 'professional';
});

tenderSchema.virtual('isOpenWorkflow').get(function () {
  return this.workflowType === 'open';
});

tenderSchema.virtual('isClosedWorkflow').get(function () {
  return this.workflowType === 'closed';
});

tenderSchema.virtual('canViewApplications').get(function () {
  if (this.status === 'draft') return false;
  if (this.workflowType === 'open') return true;
  if (this.workflowType === 'closed') {
    return this.status === 'revealed' || this.status === 'closed';
  }
  return false;
});

tenderSchema.virtual('isSealed').get(function () {
  return this.workflowType === 'closed' &&
    (this.status === 'locked' || this.status === 'deadline_reached');
});

// ============ STATIC METHODS ============

// Build visibility filter for queries
tenderSchema.statics.buildVisibilityFilter = async function (userId, userRole) {
  const filter = { isDeleted: false };

  // Admin can see everything
  if (userRole === 'admin') {
    return filter;
  }

  // For authenticated users
  if (userId && userRole) {
    // Owner can see their own tenders regardless of status
    filter.$or = [{ owner: userId }];

    // Add visibility-based filters for non-owner tenders
    if (userRole === 'freelancer') {
      // Freelancers can see freelance tenders with freelancers_only visibility
      filter.$or.push({
        tenderCategory: 'freelance',
        'visibility.visibilityType': 'freelancers_only',
        status: { $in: ['published', 'locked'] },
        deadline: { $gt: new Date() }
      });
    } else if (userRole === 'company') {
      // Companies can see professional tenders based on visibility
      const userCompany = await mongoose.model('Company').findOne({ user: userId });

      if (userCompany) {
        const companyId = userCompany._id;

        // Public tenders
        filter.$or.push({
          tenderCategory: 'professional',
          'visibility.visibilityType': 'public',
          status: { $in: ['published', 'locked'] },
          deadline: { $gt: new Date() }
        });

        // Companies-only tenders
        filter.$or.push({
          tenderCategory: 'professional',
          'visibility.visibilityType': 'companies_only',
          status: { $in: ['published', 'locked'] },
          deadline: { $gt: new Date() }
        });

        // Invite-only tenders (check invitations)
        filter.$or.push({
          tenderCategory: 'professional',
          'visibility.visibilityType': 'invite_only',
          status: { $in: ['published', 'locked'] },
          deadline: { $gt: new Date() },
          $or: [
            { 'invitations.invitedUser': userId },
            { 'invitations.invitedCompany': companyId },
            { 'invitations.email': (await mongoose.model('User').findById(userId))?.email }
          ]
        });
      }
    } else if (userRole === 'organization') {
      // Organizations can see professional tenders
      filter.$or.push({
        tenderCategory: 'professional',
        $or: [
          { 'visibility.visibilityType': 'public' },
          { 'visibility.visibilityType': 'companies_only' }
        ],
        status: { $in: ['published', 'locked'] },
        deadline: { $gt: new Date() }
      });
    }
  } else {
    // Public users can only see freelance tenders
    filter.tenderCategory = 'freelance';
    filter['visibility.visibilityType'] = 'freelancers_only';
    filter.status = 'published';
    filter.deadline = { $gt: new Date() };
  }

  return filter;
};

// Freelance Categories (Upwork-style)
tenderSchema.statics.getFreelanceCategories = function () {
  return {
    'technology_programming': {
      name: 'Technology & Programming',
      subcategories: [
        { id: 'web_development', name: 'Web Development' },
        { id: 'mobile_app_development', name: 'Mobile App Development' },
        { id: 'software_development', name: 'Software Development' },
        { id: 'ecommerce_development', name: 'E-commerce Development' },
        { id: 'cms_development', name: 'CMS Development (WordPress, Drupal)' },
        { id: 'api_development', name: 'API Development & Integration' },
        { id: 'game_development', name: 'Game Development' },
        { id: 'blockchain_development', name: 'Blockchain Development' },
        { id: 'devops_services', name: 'DevOps & Cloud Services' },
        { id: 'qa_testing', name: 'QA & Testing' },
        { id: 'cybersecurity', name: 'Cybersecurity' },
        { id: 'data_science', name: 'Data Science & Analytics' },
        { id: 'machine_learning', name: 'Machine Learning & AI' },
        { id: 'cloud_computing', name: 'Cloud Computing' },
        { id: 'artificial_intelligence', name: 'Artificial Intelligence' },
        { id: 'iot_development', name: 'IoT Development' },
        { id: 'ar_vr_development', name: 'AR/VR Development' },
        { id: 'embedded_systems', name: 'Embedded Systems' },
        { id: 'full_stack_development', name: 'Full Stack Development' },
        { id: 'frontend_development', name: 'Frontend Development' },
        { id: 'backend_development', name: 'Backend Development' }
      ]
    },

    'design_creative': {
      name: 'Design & Creative',
      subcategories: [
        { id: 'graphic_design', name: 'Graphic Design' },
        { id: 'ui_ux_design', name: 'UI/UX Design' },
        { id: 'logo_design', name: 'Logo Design & Branding' },
        { id: 'brand_identity', name: 'Brand Identity' },
        { id: 'illustration', name: 'Illustration' },
        { id: 'animation', name: 'Animation' },
        { id: 'video_editing', name: 'Video Editing & Production' },
        { id: 'photography', name: 'Photography' },
        { id: 'motion_graphics', name: 'Motion Graphics' },
        { id: '3d_modeling', name: '3D Modeling & Rendering' },
        { id: 'interior_design', name: 'Interior Design' },
        { id: 'fashion_design', name: 'Fashion Design' },
        { id: 'product_design', name: 'Product Design' },
        { id: 'packaging_design', name: 'Packaging Design' },
        { id: 'web_design', name: 'Web Design' },
        { id: 'print_design', name: 'Print Design' },
        { id: 'character_design', name: 'Character Design' },
        { id: 'infographic_design', name: 'Infographic Design' },
        { id: 'presentation_design', name: 'Presentation Design' },
        { id: 'social_media_design', name: 'Social Media Graphics' }
      ]
    },

    'writing_translation': {
      name: 'Writing & Translation',
      subcategories: [
        { id: 'content_writing', name: 'Content Writing' },
        { id: 'copywriting', name: 'Copywriting' },
        { id: 'technical_writing', name: 'Technical Writing' },
        { id: 'creative_writing', name: 'Creative Writing' },
        { id: 'editing_proofreading', name: 'Editing & Proofreading' },
        { id: 'translation', name: 'Translation' },
        { id: 'blog_writing', name: 'Blog Writing' },
        { id: 'seo_writing', name: 'SEO Writing' },
        { id: 'ghostwriting', name: 'Ghostwriting' },
        { id: 'script_writing', name: 'Script Writing' },
        { id: 'academic_writing', name: 'Academic Writing' },
        { id: 'business_writing', name: 'Business Writing' },
        { id: 'grant_writing', name: 'Grant Writing' },
        { id: 'resume_writing', name: 'Resume Writing' },
        { id: 'article_writing', name: 'Article Writing' },
        { id: 'product_description', name: 'Product Description' },
        { id: 'social_media_content', name: 'Social Media Content' },
        { id: 'email_copywriting', name: 'Email Copywriting' },
        { id: 'white_paper_writing', name: 'White Paper Writing' },
        { id: 'case_study_writing', name: 'Case Study Writing' }
      ]
    },

    'digital_marketing': {
      name: 'Digital Marketing',
      subcategories: [
        { id: 'social_media_marketing', name: 'Social Media Marketing' },
        { id: 'seo_services', name: 'SEO Services' },
        { id: 'email_marketing', name: 'Email Marketing' },
        { id: 'ppc_management', name: 'PPC Management' },
        { id: 'content_marketing', name: 'Content Marketing' },
        { id: 'influencer_marketing', name: 'Influencer Marketing' },
        { id: 'affiliate_marketing', name: 'Affiliate Marketing' },
        { id: 'marketing_strategy', name: 'Marketing Strategy' },
        { id: 'brand_marketing', name: 'Brand Marketing' },
        { id: 'market_research', name: 'Market Research' },
        { id: 'analytics_reporting', name: 'Analytics & Reporting' },
        { id: 'pr_services', name: 'PR Services' },
        { id: 'video_marketing', name: 'Video Marketing' },
        { id: 'growth_hacking', name: 'Growth Hacking' },
        { id: 'smm_strategy', name: 'Social Media Strategy' },
        { id: 'community_management', name: 'Community Management' },
        { id: 'reputation_management', name: 'Reputation Management' },
        { id: 'crm_management', name: 'CRM Management' },
        { id: 'marketing_automation', name: 'Marketing Automation' },
        { id: 'conversion_rate_optimization', name: 'Conversion Rate Optimization' }
      ]
    },

    'business': {
      name: 'Business',
      subcategories: [
        { id: 'virtual_assistance', name: 'Virtual Assistance' },
        { id: 'data_entry', name: 'Data Entry' },
        { id: 'business_consulting', name: 'Business Consulting' },
        { id: 'financial_modeling', name: 'Financial Modeling' },
        { id: 'presentation_design', name: 'Presentation Design' },
        { id: 'lead_generation', name: 'Lead Generation' },
        { id: 'customer_service', name: 'Customer Service' },
        { id: 'sales_consulting', name: 'Sales Consulting' },
        { id: 'hr_consulting', name: 'HR Consulting' },
        { id: 'legal_consulting', name: 'Legal Consulting' },
        { id: 'bookkeeping', name: 'Bookkeeping' },
        { id: 'tax_preparation', name: 'Tax Preparation' },
        { id: 'business_planning', name: 'Business Planning' },
        { id: 'project_management', name: 'Project Management' },
        { id: 'administrative_support', name: 'Administrative Support' },
        { id: 'market_analysis', name: 'Market Analysis' },
        { id: 'competitive_research', name: 'Competitive Research' },
        { id: 'process_optimization', name: 'Process Optimization' },
        { id: 'kpi_tracking', name: 'KPI Tracking' },
        { id: 'dashboard_creation', name: 'Dashboard Creation' }
      ]
    },

    'engineering_architecture': {
      name: 'Engineering & Architecture',
      subcategories: [
        { id: 'cad_drafting', name: 'CAD Drafting' },
        { id: 'architecture_design', name: 'Architecture Design' },
        { id: 'structural_engineering', name: 'Structural Engineering' },
        { id: 'electrical_engineering', name: 'Electrical Engineering' },
        { id: 'mechanical_design', name: 'Mechanical Design' },
        { id: 'civil_engineering_freelance', name: 'Civil Engineering' },
        { id: 'autocad_services', name: 'AutoCAD Services' },
        { id: 'revit_services', name: 'Revit Services' },
        { id: 'solidworks_services', name: 'SolidWorks Services' },
        { id: 'industrial_design', name: 'Industrial Design' },
        { id: 'mep_engineering', name: 'MEP Engineering' },
        { id: 'product_engineering', name: 'Product Engineering' },
        { id: 'circuit_design', name: 'Circuit Design' },
        { id: 'plc_programming', name: 'PLC Programming' },
        { id: 'piping_design', name: 'Piping Design' },
        { id: 'welding_design', name: 'Welding Design' },
        { id: 'machine_design', name: 'Machine Design' },
        { id: 'tool_design', name: 'Tool Design' },
        { id: 'fea_analysis', name: 'FEA Analysis' },
        { id: 'cfd_analysis', name: 'CFD Analysis' }
      ]
    },

    'education_training': {
      name: 'Education & Training',
      subcategories: [
        { id: 'online_tutoring', name: 'Online Tutoring' },
        { id: 'course_development', name: 'Course Development' },
        { id: 'training_material', name: 'Training Material Creation' },
        { id: 'curriculum_design', name: 'Curriculum Design' },
        { id: 'language_teaching', name: 'Language Teaching' },
        { id: 'test_preparation', name: 'Test Preparation' },
        { id: 'elearning_development', name: 'E-learning Development' },
        { id: 'instructional_design', name: 'Instructional Design' },
        { id: 'coaching_mentoring', name: 'Coaching & Mentoring' },
        { id: 'workshop_facilitation', name: 'Workshop Facilitation' },
        { id: 'educational_consulting', name: 'Educational Consulting' },
        { id: 'subject_matter_expert', name: 'Subject Matter Expert' },
        { id: 'academic_research', name: 'Academic Research' },
        { id: 'thesis_writing', name: 'Thesis Writing' },
        { id: 'dissertation_writing', name: 'Dissertation Writing' },
        { id: 'research_paper_writing', name: 'Research Paper Writing' },
        { id: 'scientific_writing', name: 'Scientific Writing' },
        { id: 'proofreading_editing', name: 'Proofreading & Editing' },
        { id: 'plagiarism_checking', name: 'Plagiarism Checking' },
        { id: 'citation_formatting', name: 'Citation Formatting' }
      ]
    },

    'music_audio': {
      name: 'Music & Audio',
      subcategories: [
        { id: 'music_production', name: 'Music Production' },
        { id: 'voice_over', name: 'Voice Over' },
        { id: 'audio_editing', name: 'Audio Editing' },
        { id: 'podcast_production', name: 'Podcast Production' },
        { id: 'sound_design', name: 'Sound Design' },
        { id: 'jingle_creation', name: 'Jingle Creation' },
        { id: 'audio_mastering', name: 'Audio Mastering' },
        { id: 'songwriting', name: 'Songwriting' },
        { id: 'audio_transcription', name: 'Audio Transcription' },
        { id: 'audio_restoration', name: 'Audio Restoration' }
      ]
    },

    'lifestyle': {
      name: 'Lifestyle',
      subcategories: [
        { id: 'life_coaching', name: 'Life Coaching' },
        { id: 'health_wellness', name: 'Health & Wellness' },
        { id: 'fitness_training', name: 'Fitness Training' },
        { id: 'nutrition_consulting', name: 'Nutrition Consulting' },
        { id: 'travel_planning', name: 'Travel Planning' },
        { id: 'event_planning_freelance', name: 'Event Planning' },
        { id: 'personal_shopping', name: 'Personal Shopping' },
        { id: 'relationship_advice', name: 'Relationship Advice' },
        { id: 'career_coaching', name: 'Career Coaching' },
        { id: 'spiritual_guidance', name: 'Spiritual Guidance' }
      ]
    },

    'other_services': {
      name: 'Other Services',
      subcategories: [
        { id: 'miscellaneous', name: 'Miscellaneous' },
        { id: 'other', name: 'Other' }
      ]
    }
  };
};

// Professional Categories (Procurement-style)
tenderSchema.statics.getProfessionalCategories = function () {
  return {
    'construction_infrastructure': {
      name: 'Construction & Infrastructure',
      subcategories: [
        { id: 'construction_building', name: 'Construction & Building Works' },
        { id: 'civil_engineering', name: 'Civil Engineering Works' },
        { id: 'road_construction', name: 'Road Construction' },
        { id: 'bridge_construction', name: 'Bridge Construction' },
        { id: 'water_supply_sanitation', name: 'Water Supply & Sanitation' },
        { id: 'electrical_works', name: 'Electrical Works' },
        { id: 'mechanical_hvac', name: 'Mechanical & HVAC Systems' },
        { id: 'plumbing_works', name: 'Plumbing Works' },
        { id: 'renovation_refurbishment', name: 'Renovation & Refurbishment' },
        { id: 'landscaping', name: 'Landscaping' },
        { id: 'demolition_services', name: 'Demolition Services' },
        { id: 'excavation_earthworks', name: 'Excavation & Earthworks' },
        { id: 'concrete_works', name: 'Concrete Works' },
        { id: 'steel_structure', name: 'Steel Structure' },
        { id: 'roofing_services', name: 'Roofing Services' },
        { id: 'flooring_works', name: 'Flooring Works' },
        { id: 'painting_finishing', name: 'Painting & Finishing' },
        { id: 'glazing_works', name: 'Glazing Works' },
        { id: 'elevator_installation', name: 'Elevator Installation' },
        { id: 'fire_protection_systems', name: 'Fire Protection Systems' }
      ]
    },

    'goods_supply': {
      name: 'Goods & Supply',
      subcategories: [
        { id: 'goods_supply', name: 'Goods Supply (General)' },
        { id: 'medical_equipment', name: 'Medical Equipment' },
        { id: 'laboratory_equipment', name: 'Laboratory Equipment' },
        { id: 'vehicles_transport', name: 'Vehicles & Transport Equipment' },
        { id: 'office_furniture', name: 'Office Furniture' },
        { id: 'it_hardware', name: 'IT Hardware & Equipment' },
        { id: 'agricultural_supplies', name: 'Agricultural Supplies' },
        { id: 'industrial_equipment', name: 'Industrial Equipment' },
        { id: 'construction_materials', name: 'Construction Materials' },
        { id: 'fuel_lubricants', name: 'Fuel & Lubricants' },
        { id: 'office_supplies', name: 'Office Supplies' },
        { id: 'cleaning_supplies', name: 'Cleaning Supplies' },
        { id: 'safety_equipment', name: 'Safety Equipment' },
        { id: 'tools_machinery', name: 'Tools & Machinery' },
        { id: 'electrical_equipment', name: 'Electrical Equipment' },
        { id: 'plumbing_materials', name: 'Plumbing Materials' },
        { id: 'paint_supplies', name: 'Paint Supplies' },
        { id: 'textile_supplies', name: 'Textile Supplies' },
        { id: 'food_beverages', name: 'Food & Beverages' },
        { id: 'pharmaceutical_supplies', name: 'Pharmaceutical Supplies' }
      ]
    },

    'consultancy_services': {
      name: 'Consultancy Services',
      subcategories: [
        { id: 'consultancy_services', name: 'Consultancy Services (General)' },
        { id: 'engineering_design', name: 'Engineering Design' },
        { id: 'feasibility_studies', name: 'Feasibility Studies' },
        { id: 'environmental_assessment', name: 'Environmental Assessment' },
        { id: 'financial_advisory', name: 'Financial Advisory' },
        { id: 'legal_services', name: 'Legal Services' },
        { id: 'audit_accounting', name: 'Audit & Accounting Services' },
        { id: 'project_management', name: 'Project Management' },
        { id: 'architectural_services', name: 'Architectural Services' },
        { id: 'surveying_mapping', name: 'Surveying & Mapping' },
        { id: 'quantity_surveying', name: 'Quantity Surveying' },
        { id: 'construction_management', name: 'Construction Management' },
        { id: 'risk_management', name: 'Risk Management' },
        { id: 'quality_assurance', name: 'Quality Assurance' },
        { id: 'safety_consulting', name: 'Safety Consulting' },
        { id: 'environmental_consulting', name: 'Environmental Consulting' },
        { id: 'business_consulting_pro', name: 'Business Consulting' },
        { id: 'hr_consulting_pro', name: 'HR Consulting' },
        { id: 'marketing_consulting', name: 'Marketing Consulting' },
        { id: 'it_consulting', name: 'IT Consulting' }
      ]
    },

    'facility_services': {
      name: 'Facility & Support Services',
      subcategories: [
        { id: 'maintenance_repair', name: 'Maintenance & Repair Services' },
        { id: 'security_services', name: 'Security Services' },
        { id: 'cleaning_services', name: 'Cleaning Services' },
        { id: 'catering_food', name: 'Catering & Food Services' },
        { id: 'transport_logistics', name: 'Transport & Logistics' },
        { id: 'printing_advertising', name: 'Printing & Advertising' },
        { id: 'event_management', name: 'Event Management' },
        { id: 'waste_management', name: 'Waste Management' },
        { id: 'facility_management', name: 'Facility Management' },
        { id: 'it_support_services', name: 'IT Support Services' },
        { id: 'telecom_services', name: 'Telecom Services' },
        { id: 'utility_services', name: 'Utility Services' },
        { id: 'landscaping_maintenance', name: 'Landscaping Maintenance' },
        { id: 'pool_maintenance', name: 'Pool Maintenance' },
        { id: 'pest_control', name: 'Pest Control' },
        { id: 'janitorial_services', name: 'Janitorial Services' },
        { id: 'laundry_services', name: 'Laundry Services' },
        { id: 'mailroom_services', name: 'Mailroom Services' },
        { id: 'reception_services', name: 'Reception Services' },
        { id: 'concierge_services', name: 'Concierge Services' }
      ]
    },

    'healthcare_services': {
      name: 'Healthcare Services',
      subcategories: [
        { id: 'pharmaceuticals_vaccines', name: 'Pharmaceuticals & Vaccines' },
        { id: 'medical_consumables', name: 'Medical Consumables' },
        { id: 'training_services', name: 'Training Services' },
        { id: 'hospital_equipment', name: 'Hospital Equipment' },
        { id: 'laboratory_services', name: 'Laboratory Services' },
        { id: 'dental_equipment', name: 'Dental Equipment' },
        { id: 'optical_equipment', name: 'Optical Equipment' },
        { id: 'rehabilitation_equipment', name: 'Rehabilitation Equipment' },
        { id: 'ambulance_services', name: 'Ambulance Services' },
        { id: 'medical_waste_disposal', name: 'Medical Waste Disposal' },
        { id: 'healthcare_it', name: 'Healthcare IT Systems' },
        { id: 'educational_technology', name: 'Educational Technology' },
        { id: 'school_supplies', name: 'School Supplies' },
        { id: 'library_services', name: 'Library Services' },
        { id: 'training_facilities', name: 'Training Facilities' },
        { id: 'e_learning_platforms', name: 'E-learning Platforms' },
        { id: 'educational_consulting_pro', name: 'Educational Consulting' },
        { id: 'student_services', name: 'Student Services' },
        { id: 'examination_services', name: 'Examination Services' }
      ]
    },

    'public_services': {
      name: 'Public & Government Services',
      subcategories: [
        { id: 'public_works', name: 'Public Works' },
        { id: 'government_contracts', name: 'Government Contracts' },
        { id: 'municipal_services', name: 'Municipal Services' },
        { id: 'public_transport', name: 'Public Transport' },
        { id: 'urban_planning', name: 'Urban Planning' },
        { id: 'disaster_management', name: 'Disaster Management' },
        { id: 'water_management', name: 'Water Management' },
        { id: 'sewage_management', name: 'Sewage Management' },
        { id: 'street_lighting', name: 'Street Lighting' },
        { id: 'traffic_management', name: 'Traffic Management' },
        { id: 'public_safety', name: 'Public Safety' },
        { id: 'community_services', name: 'Community Services' },
        { id: 'social_services', name: 'Social Services' },
        { id: 'housing_services', name: 'Housing Services' },
        { id: 'urban_renewal', name: 'Urban Renewal' },
        { id: 'infrastructure_development', name: 'Infrastructure Development' },
        { id: 'public_parks', name: 'Public Parks' },
        { id: 'recreation_facilities', name: 'Recreation Facilities' },
        { id: 'cultural_services', name: 'Cultural Services' },
        { id: 'tourism_development', name: 'Tourism Development' }
      ]
    },

    'energy_utilities': {
      name: 'Energy & Utilities',
      subcategories: [
        { id: 'power_generation', name: 'Power Generation' },
        { id: 'renewable_energy', name: 'Renewable Energy' },
        { id: 'electrical_distribution', name: 'Electrical Distribution' },
        { id: 'water_treatment', name: 'Water Treatment' },
        { id: 'wastewater_treatment', name: 'Wastewater Treatment' },
        { id: 'oil_gas_services', name: 'Oil & Gas Services' },
        { id: 'mining_services', name: 'Mining Services' },
        { id: 'telecommunications', name: 'Telecommunications' },
        { id: 'broadband_services', name: 'Broadband Services' },
        { id: 'satellite_services', name: 'Satellite Services' }
      ]
    },

    'it_technology_services': {
      name: 'IT & Technology Services',
      subcategories: [
        { id: 'software_development_pro', name: 'Software Development' },
        { id: 'it_infrastructure', name: 'IT Infrastructure' },
        { id: 'network_security', name: 'Network Security' },
        { id: 'data_center_services', name: 'Data Center Services' },
        { id: 'cloud_services', name: 'Cloud Services' },
        { id: 'cybersecurity_pro', name: 'Cybersecurity' },
        { id: 'system_integration', name: 'System Integration' },
        { id: 'erp_implementation', name: 'ERP Implementation' },
        { id: 'crm_implementation', name: 'CRM Implementation' },
        { id: 'digital_transformation', name: 'Digital Transformation' }
      ]
    },

    'manufacturing_services': {
      name: 'Manufacturing & Production',
      subcategories: [
        { id: 'manufacturing_services', name: 'Manufacturing Services' },
        { id: 'assembly_services', name: 'Assembly Services' },
        { id: 'quality_control_pro', name: 'Quality Control' },
        { id: 'supply_chain_management', name: 'Supply Chain Management' },
        { id: 'logistics_services', name: 'Logistics Services' },
        { id: 'warehousing', name: 'Warehousing' },
        { id: 'inventory_management', name: 'Inventory Management' },
        { id: 'packaging_services', name: 'Packaging Services' },
        { id: 'labeling_services', name: 'Labeling Services' },
        { id: 'distribution_services', name: 'Distribution Services' }
      ]
    },

    'environmental_services': {
      name: 'Environmental Services',
      subcategories: [
        { id: 'environmental_remediation', name: 'Environmental Remediation' },
        { id: 'pollution_control', name: 'Pollution Control' },
        { id: 'waste_recycling', name: 'Waste Recycling' },
        { id: 'hazardous_waste_management', name: 'Hazardous Waste Management' },
        { id: 'air_quality_management', name: 'Air Quality Management' },
        { id: 'water_quality_management', name: 'Water Quality Management' },
        { id: 'noise_control', name: 'Noise Control' },
        { id: 'environmental_monitoring', name: 'Environmental Monitoring' },
        { id: 'conservation_services', name: 'Conservation Services' },
        { id: 'sustainability_consulting', name: 'Sustainability Consulting' }
      ]
    },

    'other_procurement': {
      name: 'Other Procurement',
      subcategories: [
        { id: 'miscellaneous', name: 'Miscellaneous' },
        { id: 'other', name: 'Other' }
      ]
    }
  };
};

// Get all freelance categories as flat array
tenderSchema.statics.getAllFreelanceCategories = function () {
  const groups = this.getFreelanceCategories();
  const allCategories = [];

  Object.values(groups).forEach(group => {
    group.subcategories.forEach(subcategory => {
      allCategories.push(subcategory.id);
    });
  });

  return allCategories;
};

// Get all professional categories as flat array
tenderSchema.statics.getAllProfessionalCategories = function () {
  const groups = this.getProfessionalCategories();
  const allCategories = [];

  Object.values(groups).forEach(group => {
    group.subcategories.forEach(subcategory => {
      allCategories.push(subcategory.id);
    });
  });

  return allCategories;
};

// Get category label by ID
tenderSchema.statics.getCategoryLabel = function (categoryId, tenderType = 'freelance') {
  const groups = tenderType === 'freelance' ? this.getFreelanceCategories() : this.getProfessionalCategories();

  for (const group of Object.values(groups)) {
    for (const subcategory of group.subcategories) {
      if (subcategory.id === categoryId) {
        return subcategory.name;
      }
    }
  }

  return categoryId;
};

// Get group name for a category
tenderSchema.statics.getCategoryGroup = function (categoryId, tenderType = 'freelance') {
  const groups = tenderType === 'freelance' ? this.getFreelanceCategories() : this.getProfessionalCategories();

  for (const [groupKey, group] of Object.entries(groups)) {
    for (const subcategory of group.subcategories) {
      if (subcategory.id === categoryId) {
        return group.name;
      }
    }
  }

  return null;
};

// ============ INSTANCE METHODS ============

// Check if user can view tender (with invitation support)
tenderSchema.methods.canUserView = async function (user) {
  try {
    const userId = user?._id;
    const userRole = user?.role;

    // Admin can view everything
    if (userRole === 'admin') return true;

    // Owner can always view their own tenders
    if (this.owner && this.owner.toString() === userId?.toString()) return true;

    // Draft tenders only visible to owner
    if (this.status === 'draft') {
      return this.owner.toString() === userId?.toString();
    }

    // Handle unauthenticated users
    if (!userId) {
      // Public users can only see published freelance tenders
      return this.tenderCategory === 'freelance' &&
        this.status === 'published' &&
        this.deadline > new Date() &&
        this.visibility.visibilityType === 'freelancers_only';
    }

    // Check tender category specific rules
    if (this.tenderCategory === 'freelance') {
      // Freelance tenders only visible to freelancers
      if (userRole !== 'freelancer') return false;

      // Must be published and active
      if (this.status !== 'published' || this.deadline <= new Date()) return false;

      return this.visibility.visibilityType === 'freelancers_only';
    }

    if (this.tenderCategory === 'professional') {
      // Professional tenders visible to companies and organizations
      if (userRole !== 'company' && userRole !== 'organization' && userRole !== 'admin') return false;

      // Owner can see all their professional tenders regardless of status
      if (this.owner.toString() === userId.toString()) return true;

      // Must be published/locked and active (except for owner)
      if (this.status !== 'published' && this.status !== 'locked') {
        return false;
      }

      // Check if deadline has passed (non-owners can't see expired tenders)
      if (this.deadline <= new Date() && this.owner.toString() !== userId.toString()) {
        return false;
      }

      // Check visibility rules
      const visibilityType = this.visibility.visibilityType;

      if (visibilityType === 'public' || visibilityType === 'companies_only') {
        // Public and companies-only tenders visible to companies and organizations
        return userRole === 'company' || userRole === 'organization' || userRole === 'admin';
      }

      if (visibilityType === 'invite_only') {
        // Check if user/company is invited
        return await this.checkInvitationStatus(userId, userRole);
      }
    }

    return false;
  } catch (error) {
    console.error('Error in canUserView:', error);
    return false;
  }
};

// Check if user can update tender (HARD BUSINESS RULES)
tenderSchema.methods.canUpdate = function (user) {
  try {
    // Admin can update anything
    if (user.role === 'admin') return true;

    // Check ownership
    if (this.owner.toString() !== user._id.toString()) {
      return false;
    }

    // HARD RULE: Only draft tenders can be updated
    if (this.status !== 'draft') {
      return false;
    }

    // HARD RULE: Only freelance tenders can be updated
    if (this.tenderCategory !== 'freelance') {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in canUpdate:', error);
    return false;
  }
};

// Check if user can delete tender (HARD BUSINESS RULES)
tenderSchema.methods.canDelete = function (user) {
  try {
    // Admin can delete anything
    if (user.role === 'admin') return true;

    // Check ownership
    if (this.owner.toString() !== user._id.toString()) {
      return false;
    }

    // HARD RULE: Only draft tenders can be deleted
    if (this.status !== 'draft') {
      return false;
    }

    // HARD RULE: Only freelance tenders can be deleted
    if (this.tenderCategory !== 'freelance') {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in canDelete:', error);
    return false;
  }
};

// Check if user can apply to tender
tenderSchema.methods.canUserApply = async function (user) {
  try {
    const userId = user._id;
    const userRole = user.role;

    // Must be published and active
    if (this.status !== 'published' || this.deadline <= new Date()) {
      return false;
    }

    // Check if already applied
    const hasApplied = this.proposals.some(p =>
      p.applicant.toString() === userId.toString()
    );
    if (hasApplied) return false;

    if (this.tenderCategory === 'freelance') {
      // Only freelancers can apply to freelance tenders
      if (userRole !== 'freelancer') return false;

      return this.visibility.visibilityType === 'freelancers_only';
    }

    if (this.tenderCategory === 'professional') {
      // Only companies can apply to professional tenders
      if (userRole !== 'company') return false;

      const visibilityType = this.visibility.visibilityType;

      if (visibilityType === 'public' || visibilityType === 'companies_only') {
        return true;
      }

      if (visibilityType === 'invite_only') {
        return await this.checkInvitationStatus(userId, userRole);
      }
    }

    return false;
  } catch (error) {
    console.error('Error in canUserApply:', error);
    return false;
  }
};

// Check invitation status for user
tenderSchema.methods.checkInvitationStatus = async function (userId, userRole) {
  if (userRole === 'admin') return true;

  for (const invite of this.invitations) {
    if (invite.invitationStatus !== 'accepted') continue;

    if (invite.invitationType === 'user' && invite.invitedUser) {
      if (invite.invitedUser.toString() === userId.toString()) {
        return true;
      }
    }

    if (invite.invitationType === 'company' && invite.invitedCompany) {
      // Check if user belongs to the invited company
      const Company = mongoose.model('Company');
      const userCompany = await Company.findOne({ user: userId });

      if (userCompany && userCompany._id.toString() === invite.invitedCompany.toString()) {
        return true;
      }
    }

    if (invite.invitationType === 'email') {
      const User = mongoose.model('User');
      const user = await User.findById(userId);

      if (user && user.email === invite.email) {
        return true;
      }
    }
  }

  return false;
};

// Lock closed tender
tenderSchema.methods.lockClosedTender = async function (userId) {
  if (this.workflowType !== 'closed') {
    throw new Error('Only closed workflow tenders can be locked');
  }

  if (this.status !== 'published') {
    throw new Error('Only published tenders can be locked');
  }

  // Calculate data hash for integrity
  const dataToHash = {
    title: this.title,
    description: this.description,
    deadline: this.deadline,
    tenderCategory: this.tenderCategory,
    visibility: this.visibility,
    attachments: this.attachments.map(att => ({
      fileName: att.fileName,
      size: att.size,
      fileHash: att.fileHash
    }))
  };

  if (this.tenderCategory === 'professional') {
    dataToHash.professionalSpecific = {
      referenceNumber: this.professionalSpecific.referenceNumber,
      sealedBidConfirmation: this.professionalSpecific.sealedBidConfirmation
    };
  }

  const dataString = JSON.stringify(dataToHash);
  const dataHash = crypto.createHash('sha256').update(dataString).digest('hex');

  this.status = 'locked';
  this.lockedAt = new Date();
  this.metadata.dataHash = dataHash;
  this.metadata.lockedBy = userId;

  await this.save();

  // Add audit log
  await this.addAuditLog('LOCK_CLOSED_TENDER', userId, {
    action: 'Closed tender locked',
    dataHash: dataHash,
    reason: 'Tender published as closed workflow'
  });

  return this;
};

// Reveal proposals for closed tenders
tenderSchema.methods.revealProposals = async function (userId) {
  if (this.workflowType !== 'closed') {
    throw new Error('Only closed workflow tenders can reveal proposals');
  }

  if (this.status !== 'deadline_reached') {
    throw new Error('Cannot reveal proposals before deadline is reached');
  }

  this.status = 'revealed';
  this.revealedAt = new Date();
  this.metadata.revealedBy = userId;

  // Reveal all sealed proposals
  this.proposals.forEach(proposal => {
    if (proposal.sealed) {
      proposal.sealed = false;
      proposal.revealedAt = new Date();
    }
  });

  this.metadata.visibleApplications = this.proposals.length;
  this.metadata.revealedProposals = this.proposals.length;

  await this.save();

  // Add audit log
  await this.addAuditLog('REVEAL_PROPOSALS', userId, {
    action: 'Proposals revealed',
    revealedCount: this.proposals.length
  });

  return this;
};

// Add audit log entry
tenderSchema.methods.addAuditLog = async function (action, performedBy, changes = {}, ipAddress = '', userAgent = '') {
  this.auditLog.push({
    action,
    performedBy,
    changes,
    ipAddress,
    userAgent,
    performedAt: new Date()
  });

  return this.save();
};

// ============ PRE-SAVE MIDDLEWARE ============
tenderSchema.pre('save', async function (next) {
  try {
    const now = new Date();

    // Generate tender ID if not provided
    if (!this.tenderId && this.status === 'published') {
      const currentYear = now.getFullYear();
      const prefix = this.tenderCategory === 'freelance' ? 'FT' : 'PT';

      const lastTender = await this.constructor.findOne(
        {
          tenderId: new RegExp(`^${prefix}-${currentYear}-`),
          tenderCategory: this.tenderCategory
        },
        { tenderId: 1 },
        { sort: { createdAt: -1 } }
      );

      let sequenceNumber = 1;
      if (lastTender && lastTender.tenderId) {
        const lastSequence = parseInt(lastTender.tenderId.split('-')[2]) || 0;
        sequenceNumber = lastSequence + 1;
      }

      this.tenderId = `${prefix}-${currentYear}-${sequenceNumber.toString().padStart(4, '0')}`;
    }

    // Set timestamps based on status
    if (this.isModified('status')) {
      if (this.status === 'published' && !this.publishedAt) {
        this.publishedAt = now;
      } else if (this.status === 'locked' && !this.lockedAt) {
        this.lockedAt = now;
      } else if (this.status === 'revealed' && !this.revealedAt) {
        this.revealedAt = now;
      } else if (this.status === 'closed' && !this.closedAt) {
        this.closedAt = now;
      } else if (this.status === 'cancelled' && !this.cancelledAt) {
        this.cancelledAt = now;
      }
    }

    // Calculate days remaining
    if (this.deadline) {
      const diffTime = this.deadline - now;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.metadata.daysRemaining = daysRemaining > 0 ? daysRemaining : 0;
    }

    // Update proposal counts
    if (this.proposals) {
      this.metadata.totalApplications = this.proposals.length;

      if (this.workflowType === 'open') {
        this.metadata.visibleApplications = this.proposals.length;
      } else if (this.workflowType === 'closed') {
        const sealedCount = this.proposals.filter(p => p.sealed).length;
        this.metadata.sealedProposals = sealedCount;
        this.metadata.visibleApplications = this.proposals.length - sealedCount;
      }
    }

    // Update metadata if modified
    if (!this.isNew) {
      this.metadata.isUpdated = true;
      this.metadata.updateCount += 1;
      this.metadata.lastUpdatedAt = now;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ============ VALIDATION MIDDLEWARE ============
tenderSchema.pre('validate', function (next) {
  // Ensure only one specific schema is populated based on tenderCategory
  if (this.tenderCategory === 'freelance') {
    // Clear professional specific if present
    this.professionalSpecific = undefined;

    // Validate freelance specific required fields
    if (!this.freelanceSpecific || !this.freelanceSpecific.engagementType) {
      this.invalidate('freelanceSpecific.engagementType', 'Engagement type is required for freelance tenders');
    }
  } else if (this.tenderCategory === 'professional') {
    // Clear freelance specific if present
    this.freelanceSpecific = undefined;

    // Validate professional specific required fields
    if (!this.professionalSpecific || !this.professionalSpecific.referenceNumber) {
      this.invalidate('professionalSpecific.referenceNumber', 'Reference number is required for professional tenders');
    }
    if (!this.professionalSpecific.procuringEntity) {
      this.invalidate('professionalSpecific.procuringEntity', 'Procuring entity is required for professional tenders');
    }
  }

  // Set default visibility based on category
  if (this.isNew && !this.visibility) {
    this.visibility = {
      visibilityType: this.tenderCategory === 'freelance' ? 'freelancers_only' : 'public'
    };
  }

  next();
});

module.exports = mongoose.model('Tender', tenderSchema);