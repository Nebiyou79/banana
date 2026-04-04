// models/PromoCode.js
const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    type: {
        type: String,
        enum: ['referral', 'campaign', 'welcome', 'special'],
        default: 'referral'
    },

    // Benefits for referrer
    referrerBenefits: {
        discountPercentage: { type: Number, default: 5 },
        rewardPoints: { type: Number, default: 100 },
        cashback: { type: Number, default: 0 },
        freeMonths: { type: Number, default: 0 },
        customReward: { type: String, default: '' }
    },

    // Benefits for new user
    newUserBenefits: {
        discountPercentage: { type: Number, default: 10 },
        rewardPoints: { type: Number, default: 50 },
        cashback: { type: Number, default: 0 },
        freeMonths: { type: Number, default: 0 },
        customReward: { type: String, default: '' }
    },

    // Usage limits
    maxUses: {
        type: Number,
        default: 100
    },

    usedCount: {
        type: Number,
        default: 0
    },

    usedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        usedAt: {
            type: Date,
            default: Date.now
        },
        registrationCompleted: {
            type: Boolean,
            default: false
        },
        emailVerified: {
            type: Boolean,
            default: false
        },
        rewardClaimed: {
            type: Boolean,
            default: false
        }
    }],

    // Validity
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date,
        default: () => new Date(+new Date() + 365 * 24 * 60 * 60 * 1000)
    },

    isActive: {
        type: Boolean,
        default: true
    },

    // Campaign tracking
    campaign: {
        name: { type: String },
        source: { type: String },
        medium: { type: String },
        notes: { type: String }
    },

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // For existing users backfill
    isBackfilled: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
promoCodeSchema.index({ code: 1 }, { unique: true });
promoCodeSchema.index({ userId: 1, type: 1 });
promoCodeSchema.index({ isActive: 1, validUntil: 1 });
promoCodeSchema.index({ 'usedBy.userId': 1 });

// Methods
promoCodeSchema.methods.isValid = function () {
    const now = new Date();
    return this.isActive &&
        this.usedCount < this.maxUses &&
        this.validFrom <= now &&
        this.validUntil >= now;
};

promoCodeSchema.methods.canBeUsedBy = function (userId) {
    // Prevent self-referral
    if (this.userId.toString() === userId.toString()) {
        return { valid: false, reason: 'Cannot use your own referral code' };
    }

    // Check if already used by this user
    const alreadyUsed = this.usedBy.some(u => u.userId.toString() === userId.toString());
    if (alreadyUsed) {
        return { valid: false, reason: 'You have already used this code' };
    }

    return { valid: true };
};

promoCodeSchema.methods.incrementUsage = async function (userId, emailVerified = false) {
    if (!this.isValid()) {
        throw new Error('Promo code is no longer valid');
    }

    const canUse = this.canBeUsedBy(userId);
    if (!canUse.valid) {
        throw new Error(canUse.reason);
    }

    this.usedCount += 1;
    this.usedBy.push({
        userId,
        usedAt: new Date(),
        emailVerified,
        registrationCompleted: emailVerified
    });

    return this.save();
};

promoCodeSchema.methods.markEmailVerified = async function (userId) {
    const usage = this.usedBy.find(u => u.userId.toString() === userId.toString());
    if (usage) {
        usage.emailVerified = true;
        usage.registrationCompleted = true;
        await this.save();
    }
};

// Static methods
promoCodeSchema.statics.generateReferralCode = async function (userId, userName) {
    // Clean username - remove special chars, take first 5 chars
    const cleanName = userName
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 5)
        .toUpperCase();

    // Generate random numbers
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    // Try different combinations if code exists
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const suffix = attempts === 0 ? '' : attempts.toString();
        const code = `${cleanName}${randomNum}${suffix}`;

        const existing = await this.findOne({ code });
        if (!existing) {
            return code;
        }
        attempts++;
    }

    // Fallback: use timestamp
    return `REF${Date.now().toString().slice(-8)}`;
};

module.exports = mongoose.model('PromoCode', promoCodeSchema);