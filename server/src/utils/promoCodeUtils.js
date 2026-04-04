// utils/promoCodeUtils.js
const PromoCode = require('../models/PromoCode');
const User = require('../models/User');
const ReferralHistory = require('../models/ReferralHistory');

/**
 * Generate a unique referral code for a user
 */
const generateReferralCodeForUser = async (userId, userName) => {
    try {
        // Check if user already has a code
        const existingCode = await PromoCode.findOne({ userId, type: 'referral' });
        if (existingCode) {
            return existingCode;
        }

        // Generate new code
        const code = await PromoCode.generateReferralCode(userId, userName);

        // Create promo code record
        const promoCode = new PromoCode({
            code,
            userId,
            type: 'referral',
            referrerBenefits: {
                discountPercentage: 5,
                rewardPoints: 100,
                cashback: 0,
                freeMonths: 0
            },
            newUserBenefits: {
                discountPercentage: 10,
                rewardPoints: 50,
                cashback: 0,
                freeMonths: 0
            }
        });

        await promoCode.save();

        // Update user
        await User.findByIdAndUpdate(userId, {
            referralCode: code,
            referralBackfilled: true
        });

        return promoCode;
    } catch (error) {
        console.error('Error generating referral code:', error);
        throw error;
    }
};

/**
 * Validate a promo code with detailed response
 */
const validatePromoCode = async (code, currentUserId = null) => {
    try {
        if (!code) {
            return { valid: false, message: 'Promo code is required' };
        }

        const promoCode = await PromoCode.findOne({
            code: code.toUpperCase().trim()
        }).populate('userId', 'name email');

        if (!promoCode) {
            return { valid: false, message: 'Invalid promo code' };
        }

        // Check if code is active and valid
        if (!promoCode.isValid()) {
            if (!promoCode.isActive) {
                return { valid: false, message: 'This promo code is inactive' };
            }
            if (promoCode.usedCount >= promoCode.maxUses) {
                return { valid: false, message: 'This promo code has reached its maximum uses' };
            }
            const now = new Date();
            if (promoCode.validFrom > now) {
                return { valid: false, message: 'This promo code is not yet active' };
            }
            if (promoCode.validUntil < now) {
                return { valid: false, message: 'This promo code has expired' };
            }
            return { valid: false, message: 'This promo code is not valid' };
        }

        // Check if current user can use it (prevent self-referral)
        if (currentUserId) {
            const canUse = promoCode.canBeUsedBy(currentUserId);
            if (!canUse.valid) {
                return { valid: false, message: canUse.reason };
            }
        }

        return {
            valid: true,
            promoCode,
            referrer: {
                id: promoCode.userId._id,
                name: promoCode.userId.name,
                code: promoCode.code
            },
            benefits: {
                newUser: promoCode.newUserBenefits,
                referrer: promoCode.referrerBenefits
            }
        };
    } catch (error) {
        console.error('Error validating promo code:', error);
        return { valid: false, message: 'Error validating promo code' };
    }
};

/**
 * Apply promo code to new registration
 */
const applyPromoCodeToRegistration = async (promoCode, newUserId, metadata = {}) => {
    try {
        // Increment usage
        await promoCode.incrementUsage(newUserId, false);

        // Create referral history
        const referralHistory = new ReferralHistory({
            referrerId: promoCode.userId,
            referredUserId: newUserId,
            promoCodeId: promoCode._id,
            promoCode: promoCode.code,
            status: 'pending',
            stages: {
                registration: new Date()
            },
            rewardDetails: {
                referrerReward: {
                    points: promoCode.referrerBenefits.rewardPoints || 0,
                    cashback: promoCode.referrerBenefits.cashback || 0,
                    discount: promoCode.referrerBenefits.discountPercentage || 0,
                    status: 'pending'
                },
                newUserReward: {
                    points: promoCode.newUserBenefits.rewardPoints || 0,
                    cashback: promoCode.newUserBenefits.cashback || 0,
                    discount: promoCode.newUserBenefits.discountPercentage || 0,
                    status: 'pending'
                }
            },
            metadata
        });

        await referralHistory.save();

        // Update referrer's stats (pending)
        await User.findByIdAndUpdate(promoCode.userId, {
            $inc: {
                'referralStats.totalReferrals': 1,
                'referralStats.pendingReferrals': 1
            },
            $set: { 'referralStats.lastReferralAt': new Date() }
        });

        return referralHistory;
    } catch (error) {
        console.error('Error applying promo code:', error);
        throw error;
    }
};

/**
 * Complete referral after email verification
 */
const completeReferralAfterVerification = async (userId) => {
    try {
        // Find referral history
        const referral = await ReferralHistory.findOne({ referredUserId: userId });
        if (!referral) return null;

        // Update referral status
        referral.status = 'email_verified';
        referral.stages.emailVerified = new Date();

        // Update reward status (still pending, but email verified)
        if (referral.rewardDetails.referrerReward) {
            referral.rewardDetails.referrerReward.status = 'pending';
        }
        if (referral.rewardDetails.newUserReward) {
            referral.rewardDetails.newUserReward.status = 'pending';
        }

        await referral.save();

        // Update promo code usage
        await PromoCode.findOneAndUpdate(
            { code: referral.promoCode },
            { $set: { 'usedBy.$[elem].emailVerified': true, 'usedBy.$[elem].registrationCompleted': true } },
            { arrayFilters: [{ 'elem.userId': userId }] }
        );

        // Update referrer's stats
        await User.findByIdAndUpdate(referral.referrerId, {
            $inc: {
                'referralStats.pendingReferrals': -1,
                'referralStats.completedReferrals': 1
            }
        });

        // Credit rewards (if you want to credit after email verification)
        await creditReferralRewards(referral);

        return referral;
    } catch (error) {
        console.error('Error completing referral:', error);
        throw error;
    }
};

/**
 * Credit rewards to both parties
 */
const creditReferralRewards = async (referral) => {
    try {
        // Credit referrer
        if (referral.rewardDetails.referrerReward.points > 0 ||
            referral.rewardDetails.referrerReward.cashback > 0) {
            await User.findByIdAndUpdate(referral.referrerId, {
                $inc: {
                    rewardPoints: referral.rewardDetails.referrerReward.points,
                    rewardBalance: referral.rewardDetails.referrerReward.cashback,
                    'referralStats.referralRewards.points': referral.rewardDetails.referrerReward.points,
                    'referralStats.referralRewards.cashback': referral.rewardDetails.referrerReward.cashback
                }
            });
        }

        // Credit new user
        if (referral.rewardDetails.newUserReward.points > 0 ||
            referral.rewardDetails.newUserReward.cashback > 0) {
            await User.findByIdAndUpdate(referral.referredUserId, {
                $inc: {
                    rewardPoints: referral.rewardDetails.newUserReward.points,
                    rewardBalance: referral.rewardDetails.newUserReward.cashback
                }
            });
        }

        // Update referral record
        referral.status = 'completed';
        referral.stages.rewardCredited = new Date();
        referral.rewardDetails.referrerReward.status = 'credited';
        referral.rewardDetails.newUserReward.status = 'credited';
        await referral.save();

        return true;
    } catch (error) {
        console.error('Error crediting rewards:', error);
        throw error;
    }
};

/**
 * Backfill referral codes for existing users
 */
const backfillExistingUsers = async () => {
    try {
        const users = await User.find({
            referralCode: { $exists: false },
            isActive: true
        }).limit(100); // Process in batches

        let count = 0;
        for (const user of users) {
            try {
                await generateReferralCodeForUser(user._id, user.name);
                count++;
            } catch (err) {
                console.error(`Failed to generate code for user ${user._id}:`, err);
            }
        }

        return { processed: count, total: users.length };
    } catch (error) {
        console.error('Error backfilling users:', error);
        throw error;
    }
};

module.exports = {
    generateReferralCodeForUser,
    validatePromoCode,
    applyPromoCodeToRegistration,
    completeReferralAfterVerification,
    creditReferralRewards,
    backfillExistingUsers
};