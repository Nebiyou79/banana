// src/freelance/FreelanceTender.js
const mongoose = require('mongoose');
const crypto = require('crypto');

// ========== SUB-SCHEMA 1: FreelanceApplicationSchema ==========
const FreelanceApplicationSchema = new mongoose.Schema({
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Applicant is required']
    },
    coverLetter: {
        type: String,
        required: [true, 'Cover letter is required'],
        maxlength: [5000, 'Cover letter cannot exceed 5000 characters']
    },
    proposedRate: {
        type: Number,
        required: [true, 'Proposed rate is required'],
        min: [0, 'Proposed rate cannot be negative']
    },
    proposedRateCurrency: {
        type: String,
        enum: ['USD', 'EUR', 'GBP', 'ETB'],
        default: 'ETB'
    },
    estimatedTimeline: {
        value: {
            type: Number,
            min: [1, 'Timeline value must be at least 1']
        },
        unit: {
            type: String,
            enum: ['hours', 'days', 'weeks', 'months']
        }
    },
    portfolioLinks: {
        type: [String],
        validate: {
            validator: function (links) {
                return links.length <= 5;
            },
            message: 'Maximum 5 portfolio links allowed'
        }
    },
    cvPath: String,
    cvFileName: String,
    cvOriginalName: String,
    screeningAnswers: [{
        questionIndex: Number,
        answer: String
    }],
    status: {
        type: String,
        enum: ['submitted', 'under_review', 'shortlisted', 'awarded', 'rejected'],
        default: 'submitted'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: Date,
    ownerNotes: {
        type: String,
        maxlength: [500, 'Owner notes cannot exceed 500 characters']
    }
}, {
    _id: true,
    timestamps: true
});

// ========== SUB-SCHEMA 2: FreelanceAttachmentSchema ==========
const FreelanceAttachmentSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: [true, 'Original filename is required']
    },
    fileName: {
        type: String,
        required: [true, 'Filename is required']
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
    description: {
        type: String,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    documentType: {
        type: String,
        enum: [
            'statement_of_work',
            'design_references',
            'brand_guidelines',
            'wireframes',
            'sample_data',
            'nda',
            'reference_designs',
            'other'
        ],
        default: 'other'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    fileHash: {
        type: String,
        required: [true, 'File hash is required']
    },
    version: {
        type: Number,
        default: 1
    }
}, {
    _id: true
});

// ========== MAIN SCHEMA: freelanceTenderSchema ==========
const freelanceTenderSchema = new mongoose.Schema({
    tenderId: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true,
        trim: true
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
        maxlength: [50000, 'Description cannot exceed 50000 characters']
    },
    briefDescription: {
        type: String,
        maxlength: [500, 'Brief description cannot exceed 500 characters'],
        trim: true
    },
    procurementCategory: {
        type: String,
        required: [true, 'Procurement category is required'],
        trim: true
    },
    skillsRequired: [{
        type: String,
        trim: true,
        maxlength: [50, 'Skill cannot exceed 50 characters']
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'closed'],
        default: 'draft'
    },
    maxApplications: {
        type: Number,
        min: [1, 'Must allow at least 1 application'],
        max: [500, 'Cannot exceed 500 applications']
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Owner is required']
    },
    ownerRole: {
        type: String,
        enum: ['company', 'organization'],
        required: [true, 'Owner role is required']
    },
    ownerEntity: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Owner entity is required'],
        refPath: 'ownerEntityModel'
    },
    ownerEntityModel: {
        type: String,
        enum: ['Company', 'Organization'],
        required: [true, 'Owner entity model is required']
    },

    details: {
        // FIX: Added fixed_salary and negotiable to engagementType enum
        engagementType: {
            type: String,
            enum: ['fixed_price', 'hourly', 'fixed_salary', 'negotiable'],
            required: [true, 'Engagement type is required']
        },
        // FIX: salaryRange for fixed_salary option
        salaryRange: {
            min: {
                type: Number,
                min: [0, 'Salary minimum cannot be negative']
            },
            max: {
                type: Number,
                min: [0, 'Salary maximum cannot be negative']
            },
            currency: {
                type: String,
                enum: ['USD', 'EUR', 'GBP', 'ETB'],
                default: 'ETB'
            },
            period: {
                type: String,
                enum: ['monthly', 'yearly'],
                default: 'monthly'
            }
        },
        // FIX: isNegotiable flag for negotiable option
        isNegotiable: {
            type: Boolean,
            default: false
        },
        budget: {
            min: {
                type: Number,
                min: [0, 'Budget minimum cannot be negative']
            },
            max: {
                type: Number,
                min: [0, 'Budget maximum cannot be negative']
            },
            currency: {
                type: String,
                enum: ['USD', 'EUR', 'GBP', 'ETB'],
                default: 'ETB'
            }
        },
        weeklyHours: {
            type: Number,
            min: [1, 'Weekly hours must be at least 1']
        },
        estimatedTimeline: {
            value: {
                type: Number,
                min: [1, 'Duration value must be at least 1']
            },
            unit: {
                type: String,
                enum: ['hours', 'days', 'weeks', 'months']
            }
        },
        experienceLevel: {
            type: String,
            enum: ['entry', 'intermediate', 'expert'],
            default: 'intermediate'
        },
        numberOfPositions: {
            type: Number,
            default: 1,
            min: [1, 'Number of positions must be at least 1'],
            max: [50, 'Number of positions cannot exceed 50']
        },
        projectType: {
            type: String,
            enum: ['one_time', 'ongoing', 'complex'],
            default: 'one_time'
        },
        locationType: {
            type: String,
            enum: ['remote', 'on_site', 'hybrid', 'flexible'],
            default: 'remote'
        },
        portfolioRequired: {
            type: Boolean,
            default: false
        },
        ndaRequired: {
            type: Boolean,
            default: false
        },
        urgency: {
            type: String,
            enum: ['normal', 'urgent'],
            default: 'normal'
        },
        languagePreference: String,
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
        industry: String
    },

    visibility: {
        type: String,
        default: 'freelancers_only',
        immutable: true
    },

    deadline: {
        type: Date,
        required: [true, 'Deadline is required'],
        validate: {
            validator: function (value) {
                if (this.status === 'published' || this.isNew) {
                    return value > new Date();
                }
                return true;
            },
            message: 'Deadline must be in the future'
        }
    },

    publishedAt: Date,
    closedAt: Date,

    applications: [FreelanceApplicationSchema],
    attachments: [FreelanceAttachmentSchema],

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
        daysRemaining: Number,
        updateCount: {
            type: Number,
            default: 0
        },
        lastUpdatedAt: Date,
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },

    auditLog: [{
        action: {
            type: String,
            required: true
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ========== INDEXES ==========
freelanceTenderSchema.index({ owner: 1, status: 1 });
freelanceTenderSchema.index({ status: 1, deadline: 1 });
freelanceTenderSchema.index({ procurementCategory: 1, status: 1 });
freelanceTenderSchema.index({ tenderId: 1 }, { unique: true, sparse: true });
freelanceTenderSchema.index({ 'metadata.savedBy': 1 });

// ========== VIRTUALS ==========
freelanceTenderSchema.virtual('canEdit').get(function () {
    return !this.isDeleted;
});

freelanceTenderSchema.virtual('canDelete').get(function () {
    return !this.isDeleted;
});

freelanceTenderSchema.virtual('applicationCount').get(function () {
    return this.applications?.length ?? 0;
});

freelanceTenderSchema.virtual('isExpired').get(function () {
    return this.deadline < new Date();
});

freelanceTenderSchema.virtual('isActive').get(function () {
    return this.status === 'published' && this.deadline > new Date() && !this.isDeleted;
});

freelanceTenderSchema.virtual('acceptingApplications').get(function () {
    if (!this.isActive) return false;
    if (!this.maxApplications) return true;
    return (this.metadata?.totalApplications ?? 0) < this.maxApplications;
});

// ========== PRE-SAVE MIDDLEWARE ==========
freelanceTenderSchema.pre('save', async function (next) {
    // Auto-generate tenderId when status changes to published and tenderId not set
    if (this.status === 'published' && !this.tenderId) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('FreelanceTender').countDocuments({
            tenderId: { $regex: `^FT-${year}-` }
        });
        const sequence = (count + 1).toString().padStart(4, '0');
        this.tenderId = `FT-${year}-${sequence}`;
    }

    // Calculate days remaining
    if (this.deadline && this.metadata) {
        const now = new Date();
        const diffTime = this.deadline - now;
        this.metadata.daysRemaining = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
    }

    // Update total applications count
    if (this.applications) {
        if (this.metadata) {
            this.metadata.totalApplications = this.applications.length;
        }
    }

    // Set publishedAt timestamp
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }

    // Set closedAt timestamp
    if (this.isModified('status') && this.status === 'closed' && !this.closedAt) {
        this.closedAt = new Date();
    }

    next();
});

// ========== INSTANCE METHODS ==========
freelanceTenderSchema.methods.canUserApply = function (user) {
    if (this.status !== 'published') return false;
    if (this.deadline <= new Date()) return false;
    if (user.role !== 'freelancer') return false;

    if (this.maxApplications && this.applications) {
        if (this.applications.length >= this.maxApplications) return false;
    }

    if (!this.applications) return true;

    const alreadyApplied = this.applications.some(
        app => app.applicant.toString() === user._id.toString()
    );

    return !alreadyApplied;
};

freelanceTenderSchema.methods.addAuditLog = function (action, performedBy, changes = {}, ipAddress = '', userAgent = '') {
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

// ========== STATIC METHODS ==========
freelanceTenderSchema.statics.getCategories = function () {
    return {
        Development: [
            'Web Development',
            'Mobile App Development',
            'Desktop Application',
            'API Integration',
            'Database Design',
            'DevOps & Cloud',
            'Game Development',
            'Blockchain Development',
            'AI & Machine Learning',
            'Cybersecurity',
            'QA & Testing'
        ],
        Design: [
            'Graphic Design',
            'UI/UX Design',
            'Logo Design',
            'Web Design',
            '3D Modeling',
            'Illustration',
            'Brand Identity',
            'Motion Graphics',
            'Packaging Design',
            'Video Editing'
        ],
        Writing: [
            'Content Writing',
            'Copywriting',
            'Technical Writing',
            'Blog Writing',
            'Creative Writing',
            'Translation',
            'Proofreading',
            'Grant Writing',
            'Ghostwriting',
            'Scriptwriting',
            'Academic Writing'
        ],
        Marketing: [
            'Social Media Marketing',
            'SEO',
            'Email Marketing',
            'Digital Marketing',
            'Market Research',
            'Advertising',
            'Content Marketing',
            'Brand Strategy',
            'Lead Generation',
            'Influencer Marketing'
        ],
        Data: [
            'Data Entry',
            'Data Analysis',
            'Data Science',
            'Machine Learning',
            'Data Visualization',
            'Database Management',
            'Data Mining',
            'Statistical Analysis',
            'Web Scraping',
            'AI Data Labeling'
        ],
        Business: [
            'Business Consulting',
            'Project Management',
            'Financial Analysis',
            'Legal Consulting',
            'HR Consulting',
            'Market Analysis',
            'Business Development',
            'Accounting',
            'Tax Preparation',
            'Business Plans'
        ],
        Admin_Support: [
            'Virtual Assistance',
            'Administrative Support',
            'Customer Service',
            'Email Management',
            'Calendar Management',
            'Research',
            'Social Media Management',
            'Technical Support',
            'Scheduling'
        ],
        Engineering: [
            'Civil Engineering',
            'Mechanical Engineering',
            'Electrical Engineering',
            'CAD Design',
            'Architecture',
            'Structural Engineering',
            'Product Design'
        ],
        Video_Audio: [
            'Video Editing',
            'Podcast Editing',
            'Voice Over',
            'Music Production',
            'Animation',
            'Whiteboard Video',
            'Subtitles & Captions',
            'Jingles'
        ],
        Other: [
            'Photography',
            'Healthcare Consulting',
            'Education & Tutoring',
            'Real Estate Services',
            'Event Planning',
            'Fashion Design',
            'Sports Coaching'
        ]
    };
};

module.exports = mongoose.model('FreelanceTender', freelanceTenderSchema);