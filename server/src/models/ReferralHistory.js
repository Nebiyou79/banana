// models/ReferralHistory.js
const mongoose = require('mongoose');

const referralHistorySchema = new mongoose.Schema({
    referrerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    referredUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },

    promoCodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PromoCode',
        required: true
    },

    promoCode: {
        type: String,
        required: true,
        index: true
    },

    status: {
        type: String,
        enum: ['pending', 'email_verified', 'completed', 'cancelled', 'expired'],
        default: 'pending'
    },

    stages: {
        registration: { type: Date, required: true },
        emailVerified: { type: Date },
        firstLogin: { type: Date },
        rewardCredited: { type: Date }
    },

    rewardDetails: {
        referrerReward: {
            points: { type: Number, default: 0 },
            cashback: { type: Number, default: 0 },
            discount: { type: Number, default: 0 },
            status: { type: String, enum: ['pending', 'credited', 'failed'], default: 'pending' },
            creditedAt: Date
        },
        newUserReward: {
            points: { type: Number, default: 0 },
            cashback: { type: Number, default: 0 },
            discount: { type: Number, default: 0 },
            status: { type: String, enum: ['pending', 'credited', 'failed'], default: 'pending' },
            creditedAt: Date
        }
    },

    metadata: {
        ipAddress: String,
        userAgent: String,
        registrationSource: String,
        browser: String,
        device: String
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
referralHistorySchema.index({ referrerId: 1, status: 1 });
referralHistorySchema.index({ referredUserId: 1 }, { unique: true });
referralHistorySchema.index({ createdAt: -1 });
referralHistorySchema.index({ promoCode: 1 });

module.exports = mongoose.model('ReferralHistory', referralHistorySchema);