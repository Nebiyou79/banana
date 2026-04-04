// backend/src/models/Bid.js
// ✅ FIXED: All bugs and schema upgrades from BidSystem_Analysis_FixPrompt.docx applied
//
// FIX SUMMARY:
//   BUG-08  → TIN regex relaxed to /^[A-Z0-9\-]{5,20}$/ (accepts real Ethiopian ERCA format)
//   BUG-12  → Removed manual updatedAt field (timestamps:true already manages it)
//   BUG-13  → bidNumber generation uses atomic $inc counter to prevent race conditions
//   C-1     → Added BidEvaluationSchema (3-step Ethiopian evaluation: preliminary → technical → financial)
//   C-2     → Added ComplianceItemSchema + complianceChecklist array
//   C-3     → Added FinancialBreakdownSchema (VAT, labor, materials, etc.)
//   C-4     → Extended BidCPOSchema with bidSecurityType, returnStatus, returnedAt, returnedBy, returnNotes, validatedAgainstTender
//   C-5     → Added "interview_scheduled" to status enum
//   C-6     → Extended documentType enum with all Ethiopian compliance document types

const mongoose = require('mongoose');
const crypto = require('crypto');

// ══════════════════════════════════════════════════════════════════════
// SUB-SCHEMA 1: BidCoverSheetSchema
// ══════════════════════════════════════════════════════════════════════
const BidCoverSheetSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    authorizedRepresentative: {
        type: String,
        required: [true, 'Authorized representative is required'],
        trim: true
    },
    representativeTitle: {
        type: String,
        trim: true
    },
    companyEmail: {
        type: String,
        required: [true, 'Company email is required'],
        lowercase: true,
        trim: true
    },
    companyPhone: {
        type: String,
        required: [true, 'Company phone is required'],
        trim: true
    },
    companyAddress: {
        type: String,
        trim: true
    },
    // BUG-08 FIX: Relaxed TIN regex to accept both platform format (ETH-XXXXXXXX)
    // and real Ethiopian ERCA format (0012345678 — 10 digit numeric)
    tinNumber: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[A-Z0-9\-]{5,20}$/, 'TIN number must be 5-20 alphanumeric characters (e.g. 0012345678 or ETH-12345678)']
    },
    licenseNumber: {
        type: String,
        trim: true
    },
    totalBidValue: {
        type: Number,
        required: [true, 'Total bid value is required'],
        min: [0, 'Total bid value cannot be negative']
    },
    currency: {
        type: String,
        enum: ['ETB', 'USD', 'EUR', 'GBP'],
        default: 'ETB'
    },
    bidValidityPeriod: {
        type: Number,
        min: [1, 'Bid validity period must be at least 1 day']
    },
    declarationAccepted: {
        type: Boolean,
        required: [true, 'Declaration must be accepted'],
        validate: {
            validator: function (v) { return v === true; },
            message: 'You must accept the declaration to submit a bid'
        }
    },
    declarationAcceptedAt: {
        type: Date
    }
}, { _id: true });

// ══════════════════════════════════════════════════════════════════════
// SUB-SCHEMA 2: BidDocumentSchema
// C-6 FIX: Extended documentType enum with full Ethiopian compliance types
// ══════════════════════════════════════════════════════════════════════
const BidDocumentSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: [true, 'Original file name is required']
    },
    fileName: {
        type: String,
        required: [true, 'File name is required']
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
    mimetype: String,
    size: Number,
    fileHash: String,
    // C-6 FIX: Extended enum with Ethiopian compliance doc types
    documentType: {
        type: String,
        enum: [
            // Existing
            'technical_proposal',
            'financial_proposal',
            'company_profile',
            'compliance',
            'cpo_document',
            'other',
            // New Ethiopian compliance document types
            'business_license',       // Valid business license
            'tin_certificate',        // TIN certificate from ERCA
            'vat_certificate',        // VAT registration certificate
            'tax_clearance',          // TCC — issued within last 3 months
            'trade_registration',     // Trade/investment bureau registration
            'iso_certificate',        // ISO or sector-specific certifications
            'opening_page',           // Section 1 cover page document
            'performance_bond',       // For awarded bids
            'financial_breakdown'     // Priced BOQ / Excel price schedule
        ],
        default: 'other'
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

// ══════════════════════════════════════════════════════════════════════
// SUB-SCHEMA 3: BidCPOSchema
// C-4 FIX: Added bidSecurityType, returnStatus tracking, validatedAgainstTender
// ══════════════════════════════════════════════════════════════════════
const BidCPOSchema = new mongoose.Schema({
    cpoNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    amount: {
        type: Number,
        min: [0, 'CPO amount cannot be negative']
    },
    currency: {
        type: String,
        enum: ['ETB', 'USD', 'EUR', 'GBP'],
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
    },
    // C-4 NEW: Bid security type (CPO is most common in Ethiopia but bank guarantees also used)
    bidSecurityType: {
        type: String,
        enum: ['cpo', 'bank_guarantee', 'insurance_bond'],
        default: 'cpo'
    },
    // C-4 NEW: CPO return tracking — Ethiopian law requires returning CPOs to losing bidders
    returnStatus: {
        type: String,
        enum: ['pending', 'returned', 'forfeited'],
        default: 'pending'
    },
    returnedAt: Date,
    returnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    returnNotes: {
        type: String,
        maxlength: [500, 'Return notes cannot exceed 500 characters']
    },
    // C-4 NEW: Was CPO amount validated against tender.procurement.bidSecurityAmount?
    validatedAgainstTender: {
        type: Boolean,
        default: false
    }
}, { _id: true });

// ══════════════════════════════════════════════════════════════════════
// SUB-SCHEMA 4 (NEW): BidEvaluationSchema — C-1
// Supports the mandatory 3-step Ethiopian procurement evaluation process:
//   Step 1: Preliminary (completeness check)
//   Step 2: Technical evaluation (scored)
//   Step 3: Financial evaluation (only if technical passed)
// ══════════════════════════════════════════════════════════════════════
const BidEvaluationSchema = new mongoose.Schema({
    // ── Step 1: Preliminary check (completeness of submission) ──────────
    preliminaryPassed: {
        type: Boolean,
        default: null  // null = not yet checked
    },
    preliminaryNotes: {
        type: String,
        maxlength: [1000, 'Preliminary notes cannot exceed 1000 characters']
    },
    preliminaryCheckedAt: Date,
    preliminaryCheckedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // ── Step 2: Technical evaluation ────────────────────────────────────
    technicalScore: {
        type: Number,
        min: [0, 'Technical score cannot be negative'],
        max: [100, 'Technical score cannot exceed 100'],
        default: null
    },
    technicalPassMark: {
        type: Number,
        default: 70  // Threshold percentage — taken from tender.evaluation.passMark
    },
    passedTechnical: {
        type: Boolean,
        default: null  // null = not yet evaluated
    },
    technicalNotes: {
        type: String,
        maxlength: [2000, 'Technical notes cannot exceed 2000 characters']
    },
    technicalEvaluatedAt: Date,
    technicalEvaluatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // ── Step 3: Financial evaluation (only allowed if passedTechnical=true) ──
    financialScore: {
        type: Number,
        min: [0, 'Financial score cannot be negative'],
        max: [100, 'Financial score cannot exceed 100'],
        default: null
    },
    financialRank: {
        type: Number,
        default: null  // 1 = best (lowest) price among technically compliant bids
    },
    financialEvaluatedAt: Date,

    // ── Combined / final scoring ────────────────────────────────────────
    combinedScore: {
        type: Number,
        default: null  // (technicalWeight * techScore/100) + (financialWeight * finScore/100)
    },
    overallRank: {
        type: Number,
        default: null  // 1 = best overall bid across all evaluation criteria
    },
    qualificationStatus: {
        type: String,
        enum: [
            'pending',
            'preliminary_failed',
            'technical_failed',
            'financial_evaluated',
            'awarded',
            'rejected'
        ],
        default: 'pending'
    }
}, { _id: false });

// ══════════════════════════════════════════════════════════════════════
// SUB-SCHEMA 5 (NEW): ComplianceItemSchema — C-2
// Tracks each mandatory compliance document required by Ethiopian law
// ══════════════════════════════════════════════════════════════════════
const ComplianceItemSchema = new mongoose.Schema({
    documentType: {
        type: String,
        enum: [
            'business_license',
            'tin_certificate',
            'vat_certificate',
            'tax_clearance_certificate',  // TCC — critical, issued within 3 months
            'trade_registration',
            'iso_certificate',
            'other'
        ]
    },
    submitted: {
        type: Boolean,
        default: false
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId  // References bid.documents._id
    },
    expiryDate: Date,  // For time-sensitive docs like TCC and business license
    verifiedByOwner: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        maxlength: [500, 'Compliance notes cannot exceed 500 characters']
    }
}, { _id: false });

// ══════════════════════════════════════════════════════════════════════
// SUB-SCHEMA 6 (NEW): FinancialBreakdownSchema — C-3
// Structured financial breakdown required by Ethiopian procurement law
// Supports itemized pricing with VAT (15% standard Ethiopian rate)
// ══════════════════════════════════════════════════════════════════════
const FinancialBreakdownItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Item description is required'],
        trim: true
    },
    unit: {
        type: String,
        trim: true  // e.g., "m2", "kg", "unit", "month"
    },
    quantity: {
        type: Number,
        min: [0, 'Quantity cannot be negative']
    },
    unitPrice: {
        type: Number,
        min: [0, 'Unit price cannot be negative']
    },
    totalPrice: {
        type: Number,
        required: [true, 'Item total price is required'],
        min: [0, 'Total price cannot be negative']
    },
    category: {
        type: String,
        enum: ['labor', 'materials', 'logistics', 'overhead', 'tax', 'other'],
        default: 'other'
    }
}, { _id: false });

const FinancialBreakdownSchema = new mongoose.Schema({
    items: [FinancialBreakdownItemSchema],
    subtotal: {
        type: Number,
        min: [0, 'Subtotal cannot be negative']
    },
    vatPercentage: {
        type: Number,
        default: 15  // Ethiopian standard VAT rate
    },
    vatAmount: {
        type: Number,
        min: [0, 'VAT amount cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    totalWithVAT: {
        type: Number,
        min: [0, 'Total with VAT cannot be negative']
    },
    currency: {
        type: String,
        enum: ['ETB', 'USD', 'EUR', 'GBP'],
        default: 'ETB'
    },
    paymentTerms: {
        type: String,
        trim: true  // e.g., "30% advance, 70% on delivery"
    }
}, { _id: false });

// ══════════════════════════════════════════════════════════════════════
// MAIN BidSchema
// ══════════════════════════════════════════════════════════════════════
const BidSchema = new mongoose.Schema({
    tender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProfessionalTender',
        required: [true, 'Tender reference is required'],
        index: true
    },
    bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Bidder is required'],
        index: true
    },
    bidderCompany: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    bidNumber: {
        type: String,
        unique: true,
        sparse: true  // Allows null during race-condition window, unique once assigned
    },
    coverSheet: BidCoverSheetSchema,
    bidAmount: {
        type: Number,
        required: [true, 'Bid amount is required'],
        min: [1, 'Bid amount must be greater than 0']  // BUG-11 FIX: was min:0, now min:1
    },
    currency: {
        type: String,
        enum: ['ETB', 'USD', 'EUR', 'GBP'],
        default: 'ETB'
    },
    technicalProposal: {
        type: String,
        maxlength: [50000, 'Technical proposal cannot exceed 50,000 characters']
    },
    financialProposal: {
        type: String,
        maxlength: [10000, 'Financial proposal cannot exceed 10,000 characters']
    },
    // C-3 NEW: Structured financial breakdown
    financialBreakdown: FinancialBreakdownSchema,
    documents: [BidDocumentSchema],
    cpo: BidCPOSchema,
    // C-2 NEW: Compliance document checklist
    complianceChecklist: [ComplianceItemSchema],
    // C-1 NEW: 3-step evaluation sub-document
    evaluation: {
        type: BidEvaluationSchema,
        default: () => ({})
    },
    sealed: {
        type: Boolean,
        default: false
    },
    sealedAt: Date,
    revealedAt: Date,
    sealedHash: {
        type: String,
        select: false  // Never returned in API responses
    },
    // C-5 FIX: Added "interview_scheduled" to status enum
    status: {
        type: String,
        enum: ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'awarded', 'rejected', 'withdrawn'],
        default: 'submitted'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    // BUG-12 FIX: Removed manual updatedAt — timestamps:true handles this automatically
    reviewedAt: Date,
    ownerNotes: {
        type: String,
        maxlength: [500, 'Owner notes cannot exceed 500 characters']
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,  // Adds createdAt and updatedAt automatically
    _id: true
});

// ══════════════════════════════════════════════════════════════════════
// INDEXES
// ══════════════════════════════════════════════════════════════════════
BidSchema.index({ tender: 1, bidder: 1 }, { unique: true });
BidSchema.index({ tender: 1, status: 1 });
BidSchema.index({ tender: 1, sealed: 1 });
BidSchema.index({ bidder: 1, status: 1 });
BidSchema.index({ bidderCompany: 1 });
BidSchema.index({ submittedAt: -1 });

// ══════════════════════════════════════════════════════════════════════
// PRE-SAVE MIDDLEWARE
// BUG-13 FIX: Use atomic $inc on a counter document to prevent bidNumber
//             race conditions on concurrent saves
// ══════════════════════════════════════════════════════════════════════
BidSchema.pre('save', async function (next) {
    try {
        if (this.isNew && !this.bidNumber) {
            // Atomic counter — prevents duplicate bidNumber on concurrent saves
            const CounterModel = mongoose.model('BidCounter');
            const year = new Date().getFullYear();
            const counterKey = `bid_${year}`;

            const counter = await CounterModel.findOneAndUpdate(
                { key: counterKey },
                { $inc: { seq: 1 } },
                { upsert: true, new: true }
            );

            this.bidNumber = `BID-${year}-${String(counter.seq).padStart(4, '0')}`;
        }

        // Set declarationAcceptedAt when declaration is accepted for first time
        if (
            this.coverSheet &&
            this.coverSheet.declarationAccepted === true &&
            !this.coverSheet.declarationAcceptedAt
        ) {
            this.coverSheet.declarationAcceptedAt = new Date();
        }

        next();
    } catch (err) {
        next(err);
    }
});

// ══════════════════════════════════════════════════════════════════════
// INSTANCE METHODS
// ══════════════════════════════════════════════════════════════════════

/**
 * Seal the bid — set sealed=true and generate a SHA-256 hash commitment.
 * @param {string|ObjectId} userId - The bidder's user ID
 */
BidSchema.methods.seal = function (userId) {
    const now = new Date();
    this.sealed = true;
    this.sealedAt = now;
    const raw = `${this.bidAmount}|${userId}|${this.tender}|${now.getTime()}`;
    this.sealedHash = crypto.createHash('sha256').update(raw).digest('hex');
};

/**
 * Reveal the bid — clear sealed flag and record reveal time.
 */
BidSchema.methods.reveal = function () {
    this.sealed = false;
    this.revealedAt = new Date();
};

/**
 * Return bid data appropriate for the given viewer.
 * Enforces all visibility rules — sealedHash is never sent.
 *
 * @param {string|ObjectId} viewerUserId
 * @param {boolean} isOwner         - true when viewer is tender owner or admin
 * @param {boolean} isBidsRevealed  - true when tender.status is 'revealed' or 'closed'
 * @returns {Object}
 */
BidSchema.methods.toSafeObject = function (viewerUserId, isOwner, isBidsRevealed) {
    const bidObj = this.toObject({ virtuals: false });

    // sealedHash is NEVER sent in any response
    delete bidObj.sealedHash;

    // FIX: after .populate('bidder', ...) this.bidder is an object, not an ObjectId.
    // Use _id if present (populated), otherwise fall back to the raw value (unpopulated).
    const bidderId = this.bidder && this.bidder._id ? this.bidder._id : this.bidder;
    const isOwnBid =
        viewerUserId &&
        bidderId &&
        bidderId.toString() === viewerUserId.toString();

    // ── Owner / Admin: full data, but mask financials on unrevealed sealed bids ──
    if (isOwner) {
        if (this.sealed && !isBidsRevealed) {
            bidObj.bidAmount = null;
            bidObj.financialProposal = null;
            bidObj.financialBreakdown = null;
            bidObj.coverSheet = bidObj.coverSheet
                ? { companyName: bidObj.coverSheet.companyName, totalBidValue: null }
                : null;
        }
        return bidObj;  // ownerNotes visible to owner
    }

    // ── Bidder — own bid: always full details ──
    if (isOwnBid) {
        delete bidObj.ownerNotes;  // ownerNotes stripped for bidder
        return bidObj;
    }

    // ── Other bidders on an open tender OR after reveal ──
    if (isBidsRevealed) {
        return {
            _id: bidObj._id,
            bidNumber: bidObj.bidNumber,
            bidAmount: bidObj.bidAmount,
            currency: bidObj.currency,
            status: bidObj.status,
            submittedAt: bidObj.submittedAt,
            bidderCompany: bidObj.bidderCompany
        };
    }

    // ── Non-owner, non-bidder on sealed tender before reveal ──
    return {
        _id: bidObj._id,
        bidNumber: bidObj.bidNumber,
        status: bidObj.status,
        submittedAt: bidObj.submittedAt
    };
};

// ══════════════════════════════════════════════════════════════════════
// BID COUNTER MODEL (for atomic bidNumber generation — BUG-13 fix)
// ══════════════════════════════════════════════════════════════════════
const BidCounterSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 }
});

// Register BidCounter model (guard against re-registration in hot-reload environments)
const BidCounter = mongoose.models.BidCounter || mongoose.model('BidCounter', BidCounterSchema);

const Bid = mongoose.model('Bid', BidSchema);

module.exports = Bid;