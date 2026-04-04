// src/professional/ProfessionalTender.js
const mongoose = require('mongoose');
const crypto = require('crypto');

// ========== SUB-SCHEMA 1: InvitationSchema ==========
const InvitationSchema = new mongoose.Schema({
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
        required: [true, 'Invitation type is required']
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
        required: [true, 'Inviter is required']
    },
    token: String,
    tokenExpires: Date
}, {
    _id: true
});

// ========== SUB-SCHEMA 2: CPOSubmissionSchema ==========
const CPOSubmissionSchema = new mongoose.Schema({
    bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Bidder is required']
    },
    bidderCompany: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    cpoNumber: {
        type: String,
        required: [true, 'CPO number is required'],
        trim: true,
        uppercase: true
    },
    amount: {
        type: Number,
        required: [true, 'CPO amount is required'],
        min: [0, 'CPO amount cannot be negative']
    },
    currency: {
        type: String,
        default: 'ETB'
    },
    issuingBank: {
        type: String,
        trim: true
    },
    issueDate: Date,
    expiryDate: Date,
    documentPath: String,
    documentUrl: String,
    documentHash: String,
    status: {
        type: String,
        enum: ['submitted', 'verified', 'rejected', 'expired'],
        default: 'submitted'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date,
    verificationNotes: {
        type: String,
        maxlength: [1000, 'Verification notes cannot exceed 1000 characters']
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    _id: true
});

// ========== SUB-SCHEMA 3: AddendumSchema ==========
const AddendumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Addendum title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Addendum description is required']
    },
    issuedAt: {
        type: Date,
        default: Date.now
    },
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    newDeadline: Date,
    documentPath: String,
    documentUrl: String
}, {
    _id: true
});

// ========== SUB-SCHEMA 4: ProfessionalAttachmentSchema ==========
const ProfessionalAttachmentSchema = new mongoose.Schema({
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
            'terms_of_reference',
            'technical_specifications',
            'specifications',
            'statement_of_work',
            'drawings',
            'bill_of_quantities',
            'compliance_template',
            'reference_designs',
            'nda',
            'sample_data',
            'addendum',
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

// ========== SUB-SCHEMA 5: BidSchema ==========
const BidSchema = new mongoose.Schema({
    bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Bidder is required']
    },
    bidderCompany: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    bidAmount: {
        type: Number,
        required: [true, 'Bid amount is required'],
        min: [0, 'Bid amount cannot be negative']
    },
    currency: {
        type: String,
        default: 'ETB'
    },
    technicalProposal: {
        type: String,
        maxlength: [20000, 'Technical proposal cannot exceed 20000 characters']
    },
    financialProposal: {
        type: String,
        maxlength: [5000, 'Financial proposal cannot exceed 5000 characters']
    },
    documents: [{
        originalName: String,
        fileName: String,
        path: String,
        url: String,
        downloadUrl: String,
        mimetype: String,
        fileHash: String,
        documentType: {
            type: String,
            enum: ['technical_proposal', 'financial_proposal', 'company_profile', 'compliance', 'other'],
            default: 'other'
        }
    }],
    sealed: {
        type: Boolean,
        default: false
    },
    sealedAt: Date,
    revealedAt: Date,
    sealedHash: String,
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
    _id: true
});

// ========== MAIN SCHEMA: professionalTenderSchema ==========
const professionalTenderSchema = new mongoose.Schema({
    tenderId: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true,
        trim: true
    },
    referenceNumber: {
        type: String,
        required: [true, 'Reference number is required'],
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

    // FIX P-16: briefDescription added as a dedicated short summary field
    briefDescription: {
        type: String,
        maxlength: [500, 'Brief description cannot exceed 500 characters'],
        trim: true
    },

    // FIX P-11: Increased maxlength from 20000 → 100000 to accommodate Quill HTML markup
    description: {
        type: String,
        required: [true, 'Tender description is required'],
        maxlength: [100000, 'Description cannot exceed 100000 characters']
    },

    procurementCategory: {
        type: String,
        required: [true, 'Procurement category is required'],
        trim: true
    },
    tenderType: {
        type: String,
        enum: ['works', 'goods', 'services', 'consultancy'],
        required: [true, 'Tender type is required']
    },
    workflowType: {
        type: String,
        enum: ['open', 'closed'],
        required: [true, 'Workflow type is required'],
        default: 'open'
    },

    status: {
        type: String,
        enum: ['draft', 'published', 'locked', 'deadline_reached', 'revealed', 'closed', 'cancelled'],
        default: 'draft'
    },

    visibilityType: {
        type: String,
        enum: ['public', 'invite_only'],
        default: 'public'
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

    procurement: {
        procuringEntity: {
            type: String,
            required: [true, 'Procuring entity is required'],
            trim: true
        },
        procurementMethod: {
            type: String,
            enum: ['open_tender', 'restricted', 'restricted_tender', 'sealed_bid', 'direct', 'framework', 'negotiated'],
            default: 'open_tender'
        },
        fundingSource: String,
        contactPerson: {
            name: String,
            email: {
                type: String,
                trim: true,
                lowercase: true
            },
            phone: String
        },
        bidSecurityAmount: {
            type: Number,
            min: [0, 'Bid security amount cannot be negative']
        },
        bidSecurityCurrency: {
            type: String,
            default: 'ETB'
        }
        // NOTE: preBidMeeting intentionally NOT nested here — it lives at the root level below
    },

    eligibility: {
        minimumExperience: {
            type: Number,
            default: 0,
            min: [0, 'Minimum experience cannot be negative']
        },
        requiredCertifications: [{ type: String, trim: true }],
        legalRegistrationRequired: {
            type: Boolean,
            default: true
        },
        financialCapacity: {
            minAnnualTurnover: {
                type: Number,
                min: [0, 'Annual turnover cannot be negative']
            },
            currency: {
                type: String,
                default: 'ETB'
            }
        },
        pastProjectReferences: {
            minCount: {
                type: Number,
                default: 0
            },
            similarValueProjects: {
                type: Boolean,
                default: false
            }
        },
        geographicPresence: String
    },

    scope: {
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
                min: [0, 'Payment percentage cannot be negative'],
                max: [100, 'Payment percentage cannot exceed 100']
            }
        }],
        timeline: {
            startDate: Date,
            endDate: Date,
            duration: {
                value: Number,
                unit: {
                    type: String,
                    enum: ['days', 'weeks', 'months', 'years']
                }
            }
        },
        lotItems: [{
            title: String,
            description: String,
            quantity: Number,
            unit: String,
            estimatedValue: {
                type: Number,
                min: [0, 'Estimated value cannot be negative']
            }
        }]
    },

    evaluation: {
        evaluationMethod: {
            type: String,
            enum: ['technical_only', 'financial_only', 'combined'],
            default: 'combined'
        },
        technicalWeight: {
            type: Number,
            min: [0, 'Technical weight cannot be negative'],
            max: [100, 'Technical weight cannot exceed 100'],
            default: 70
        },
        financialWeight: {
            type: Number,
            min: [0, 'Financial weight cannot be negative'],
            max: [100, 'Financial weight cannot exceed 100'],
            default: 30
        }
    },

    bidValidityPeriod: {
        type: Number,
        min: [1, 'Bid validity period must be at least 1 day']
    },
    clarificationDeadline: Date,

    // ROOT-LEVEL preBidMeeting — NOT inside procurement (P-14 fix)
    preBidMeeting: {
        date: Date,
        location: String,
        onlineLink: String,
        mandatory: {
            type: Boolean,
            default: false
        }
    },

    // FIX: performanceBond — required for Ethiopian Works/ERA/EEP tenders
    performanceBond: {
        required: { type: Boolean, default: false },
        percentage: {
            type: Number,
            min: [0, 'Cannot be negative'],
            max: [100, 'Cannot exceed 100']
        },
        amount: {
            type: Number,
            min: [0, 'Cannot be negative']
        },
        currency: {
            type: String,
            default: 'ETB'
        }
    },

    cpoRequired: {
        type: Boolean,
        default: false
    },
    cpoDescription: {
        type: String,
        maxlength: [1000, 'CPO description cannot exceed 1000 characters']
    },
    cpoSubmissions: [CPOSubmissionSchema],

    bids: [BidSchema],
    invitations: [InvitationSchema],
    addenda: [AddendumSchema],
    attachments: [ProfessionalAttachmentSchema],

    deadline: {
        type: Date,
        required: [true, 'Deadline is required']
    },
    bidOpeningDate: Date,

    publishedAt: Date,
    lockedAt: Date,
    deadlineReachedAt: Date,
    revealedAt: Date,
    closedAt: Date,
    cancelledAt: Date,

    metadata: {
        views: {
            type: Number,
            default: 0
        },
        savedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        totalBids: {
            type: Number,
            default: 0
        },
        sealedBids: {
            type: Number,
            default: 0
        },
        visibleBids: {
            type: Number,
            default: 0
        },
        daysRemaining: Number,
        needsReveal: {
            type: Boolean,
            default: false
        },
        dataHash: String,
        lockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        revealedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        closedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updateCount: {
            type: Number,
            default: 0
        },
        lastUpdatedAt: Date,
        isUpdated: {
            type: Boolean,
            default: false
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
professionalTenderSchema.index({ owner: 1, status: 1 });
professionalTenderSchema.index({ status: 1, deadline: 1 });
professionalTenderSchema.index({ procurementCategory: 1, status: 1 });
professionalTenderSchema.index({ tenderId: 1 }, { unique: true, sparse: true });
professionalTenderSchema.index({ referenceNumber: 1 }, { unique: true, sparse: true });
professionalTenderSchema.index({ 'invitations.invitedUser': 1 });
professionalTenderSchema.index({ 'invitations.invitedCompany': 1 });
professionalTenderSchema.index({ 'invitations.email': 1 });
professionalTenderSchema.index({ 'metadata.savedBy': 1 });

// ========== VIRTUALS ==========
professionalTenderSchema.virtual('canEdit').get(function () {
    return this.status === 'draft' && !this.isDeleted;
});

professionalTenderSchema.virtual('canDelete').get(function () {
    return this.status === 'draft' && !this.isDeleted;
});

professionalTenderSchema.virtual('isSealed').get(function () {
    return this.workflowType === 'closed';
});

professionalTenderSchema.virtual('isBidsVisible').get(function () {
    return this.workflowType === 'open' || ['revealed', 'closed'].includes(this.status);
});

// ========== PRE-SAVE MIDDLEWARE ==========
professionalTenderSchema.pre('save', async function (next) {
    // Auto-generate tenderId on first publish
    if ((this.status === 'published' || this.status === 'locked') && !this.tenderId) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('ProfessionalTender').countDocuments({
            tenderId: { $regex: `^PT-${year}-` }
        });
        const sequence = (count + 1).toString().padStart(4, '0');
        this.tenderId = `PT-${year}-${sequence}`;
    }

    // Calculate days remaining
    if (this.deadline) {
        const now = new Date();
        const diffTime = this.deadline - now;
        this.metadata.daysRemaining = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
    }

    // Update bid counts
    this.metadata.totalBids = this.bids.length;
    this.metadata.sealedBids = this.bids.filter(bid => bid.sealed).length;
    this.metadata.visibleBids = this.bids.filter(bid => !bid.sealed).length;

    // Set status timestamps
    const now = new Date();
    if (this.isModified('status')) {
        if (this.status === 'published' && !this.publishedAt) {
            this.publishedAt = now;
        }
        if (this.status === 'locked' && !this.lockedAt) {
            this.lockedAt = now;
        }
        if (this.status === 'deadline_reached' && !this.deadlineReachedAt) {
            this.deadlineReachedAt = now;
        }
        if (this.status === 'revealed' && !this.revealedAt) {
            this.revealedAt = now;
        }
        if (this.status === 'closed' && !this.closedAt) {
            this.closedAt = now;
        }
        if (this.status === 'cancelled' && !this.cancelledAt) {
            this.cancelledAt = now;
        }
    }

    next();
});

// ========== INSTANCE METHODS ==========
professionalTenderSchema.methods.lockForSealedBid = async function (userId) {
    if (this.workflowType !== 'closed') {
        throw new Error('Cannot lock: not a sealed bid tender');
    }

    // Generate data hash for integrity verification
    const dataString = `${this.title}|${this.description}|${this.deadline.toISOString()}|${this.referenceNumber}`;
    this.metadata.dataHash = crypto.createHash('sha256').update(dataString).digest('hex');

    this.status = 'locked';
    this.lockedAt = new Date();
    this.metadata.lockedBy = userId;

    await this.addAuditLog('LOCK_TENDER', userId, { workflowType: 'closed' });
    return this;
};

professionalTenderSchema.methods.revealAllBids = async function (userId) {
    if (this.status !== 'deadline_reached') {
        throw new Error('Cannot reveal bids: tender status must be deadline_reached');
    }
    if (this.workflowType !== 'closed') {
        throw new Error('Cannot reveal bids: not a sealed bid tender');
    }

    // Reveal all bids
    this.bids.forEach(bid => {
        bid.sealed = false;
        bid.revealedAt = new Date();
    });

    this.status = 'revealed';
    this.revealedAt = new Date();
    this.metadata.revealedBy = userId;

    await this.addAuditLog('REVEAL_BIDS', userId, { bidsRevealed: this.bids.length });
    return this;
};

professionalTenderSchema.methods.canUserView = function (userId, userRole) {
    if (userRole === 'admin') return true;
    if (this.owner.toString() === userId.toString()) return true;

    if (this.visibilityType === 'public' && ['published', 'locked'].includes(this.status)) {
        return true;
    }

    if (this.visibilityType === 'invite_only') {
        return false; // handled separately by checkInvitationStatus
    }

    return false;
};

professionalTenderSchema.methods.checkInvitationStatus = async function (userId, userRole) {
    if (userRole === 'admin') return true;
    if (this.owner.toString() === userId.toString()) return true;

    const Company = mongoose.model('Company');
    const User = mongoose.model('User');

    const user = await User.findById(userId);
    const userCompany = await Company.findOne({ user: userId });

    const matchingInvitation = this.invitations.find(inv => {
        if (inv.invitedUser && inv.invitedUser.toString() === userId.toString()) return true;
        if (inv.invitedCompany && userCompany && inv.invitedCompany.toString() === userCompany._id.toString()) return true;
        if (inv.email && user.email === inv.email) return true;
        return false;
    });

    return matchingInvitation && matchingInvitation.invitationStatus === 'accepted';
};

professionalTenderSchema.methods.addAuditLog = function (action, performedBy, changes = {}, ipAddress = '', userAgent = '') {
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

// FIX P-12: Expanded from 4 → 10 categories with full Ethiopian procurement coverage.
// FIX P-08: Returns structured { category, subcategories[] } objects — NOT a flat array.
//           The service layer (getCategories in profesionalTenderService.ts) must use
//           Object.entries() to preserve grouping for <optgroup> rendering.
professionalTenderSchema.statics.getCategories = function () {
    return {
        Works: [
            'Road Construction', 'Road Rehabilitation', 'Bridge Construction',
            'Building Construction', 'School Construction', 'Hospital Construction',
            'Renovation & Refurbishment', 'Electrical Installation',
            'Water Supply & Sanitation', 'Irrigation Works', 'Dam Construction',
            'Railway Construction', 'Airport Works', 'Port & Harbor Works',
            'Soil Conservation', 'Urban Infrastructure'
        ],
        Goods: [
            'Medical Equipment & Supplies', 'Pharmaceuticals & Drugs',
            'Laboratory Equipment', 'Diagnostic Kits & Reagents',
            'Office Equipment & Furniture', 'IT Equipment & Hardware',
            'Vehicles & Transport Equipment', 'Agricultural Equipment & Inputs',
            'Industrial Machinery', 'Construction Materials',
            'Textbooks & Educational Materials', 'PPE & Safety Equipment',
            'Cold Chain Equipment', 'Solar & Renewable Energy Equipment',
            'Food & Nutrition Supplies', 'Uniforms & Clothing'
        ],
        Services: [
            'Security Services', 'Cleaning & Janitorial Services',
            'Maintenance & Repair Services', 'Transport & Logistics',
            'Catering & Food Services', 'Printing & Publishing',
            'ICT Services & Support', 'Training & Capacity Building',
            'Event Management', 'Waste Management',
            'Insurance Services', 'Audit & Assurance Services',
            'Legal Services', 'Human Resources Services',
            'Healthcare & Medical Services', 'Telecommunications Services'
        ],
        Consultancy: [
            'Project Management Consultancy', 'Engineering Design',
            'Environmental & Social Impact Assessment',
            'Financial Consultancy & Audit', 'Legal Consultancy',
            'IT Consultancy & Systems Integration',
            'Monitoring & Evaluation', 'Research & Studies',
            'Urban & Regional Planning', 'Agricultural Extension',
            'Healthcare Consultancy', 'Education Sector Consultancy',
            'Capacity Building & Training Design', 'Policy & Regulatory Advisory'
        ],
        ICT: [
            'Software Development', 'ERP & Management Systems',
            'Network Infrastructure', 'Data Center Services',
            'Cybersecurity', 'Digital Transformation Consultancy',
            'Biometric & ID Systems', 'E-Government Solutions',
            'Geographic Information Systems (GIS)', 'Mobile Application Development'
        ],
        Health: [
            'Hospital Construction & Equipping', 'Pharmacy Management Systems',
            'Health Extension Program Supplies', 'Vaccine Supply Chain',
            'Ambulance & Emergency Services', 'Blood Bank Equipment',
            'Telemedicine Systems', 'Medical Waste Management'
        ],
        Agriculture: [
            'Seeds & Fertilizer Supply', 'Irrigation Infrastructure',
            'Agricultural Extension Services', 'Livestock Supplies',
            'Food Storage & Post-Harvest', 'Agricultural Mechanization',
            'Market Infrastructure', 'Rural Electrification'
        ],
        Energy: [
            'Power Generation', 'Transmission & Distribution Lines',
            'Rural Electrification', 'Solar Power Systems',
            'Wind Energy', 'Hydropower', 'Petroleum & Gas',
            'Energy Efficiency Services', 'Smart Metering'
        ],
        Finance: [
            'Core Banking Systems', 'Payment & Settlement Systems',
            'Insurance Technology', 'Microfinance Solutions',
            'Treasury Management', 'Accounting Software',
            'Audit & Risk Management', 'Tax Administration Systems'
        ],
        Education: [
            'School Furniture & Equipment', 'E-Learning Platforms',
            'Curriculum Development', 'Teacher Training',
            'University Equipment & Labs', 'Library Systems',
            'Vocational Training Equipment', 'Student Information Systems'
        ]
    };
};

module.exports = mongoose.model('ProfessionalTender', professionalTenderSchema);