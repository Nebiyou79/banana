// controllers/promoCodeController.js
const PromoCode = require('../models/PromoCode');
const User = require('../models/User');
const ReferralHistory = require('../models/ReferralHistory');
const {
    generateReferralCodeForUser,
    validatePromoCode,
    backfillExistingUsers
} = require('../utils/promoCodeUtils');

/**
 * @desc    Generate referral code for current user
 * @route   POST /api/promo-codes/generate
 * @access  Private
 */
exports.generateMyReferralCode = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Check if user already has a code
        const existingPromo = await PromoCode.findOne({ userId, type: 'referral' });
        if (existingPromo) {
            return res.json({
                success: true,
                message: 'Your referral code',
                data: {
                    code: existingPromo.code,
                    usedCount: existingPromo.usedCount,
                    maxUses: existingPromo.maxUses,
                    benefits: existingPromo.referrerBenefits,
                    shareableLink: `${process.env.FRONTEND_URL}/register?ref=${existingPromo.code}`,
                    shareableText: `Join me on our platform using my referral code: ${existingPromo.code}`
                }
            });
        }

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new code
        const promoCode = await generateReferralCodeForUser(userId, user.name);

        res.status(201).json({
            success: true,
            message: 'Referral code generated successfully',
            data: {
                code: promoCode.code,
                usedCount: promoCode.usedCount,
                maxUses: promoCode.maxUses,
                benefits: promoCode.referrerBenefits,
                shareableLink: `${process.env.FRONTEND_URL}/register?ref=${promoCode.code}`,
                shareableText: `Join me on our platform using my referral code: ${promoCode.code}`
            }
        });
    } catch (error) {
        console.error('Error generating referral code:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate referral code',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get my referral statistics
 * @route   GET /api/promo-codes/my-stats
 * @access  Private
 */
exports.getMyReferralStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId)
            .select('name email referralCode referralStats rewardPoints rewardBalance createdAt');

        const promoCode = await PromoCode.findOne({ userId, type: 'referral' });

        // Get detailed referral history with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const referrals = await ReferralHistory.find({ referrerId: userId })
            .populate('referredUserId', 'name email createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalReferrals = await ReferralHistory.countDocuments({ referrerId: userId });

        // Calculate success rate
        const completedReferrals = await ReferralHistory.countDocuments({
            referrerId: userId,
            status: 'completed'
        });

        const successRate = totalReferrals > 0
            ? ((completedReferrals / totalReferrals) * 100).toFixed(1)
            : 0;

        // Get recent activity
        const recentActivity = referrals.slice(0, 5).map(ref => ({
            id: ref._id,
            user: ref.referredUserId?.name || 'Unknown',
            email: ref.referredUserId?.email,
            status: ref.status,
            date: ref.createdAt,
            rewardEarned: ref.rewardDetails?.referrerReward?.points || 0
        }));

        res.json({
            success: true,
            data: {
                user: {
                    name: user.name,
                    email: user.email,
                    memberSince: user.createdAt
                },
                referralCode: {
                    code: user.referralCode || promoCode?.code,
                    usedCount: promoCode?.usedCount || 0,
                    maxUses: promoCode?.maxUses || 100,
                    isActive: promoCode?.isActive || false
                },
                stats: {
                    totalReferrals: user.referralStats?.totalReferrals || 0,
                    completedReferrals: user.referralStats?.completedReferrals || 0,
                    pendingReferrals: user.referralStats?.pendingReferrals || 0,
                    successRate: successRate,
                    rewardPoints: user.rewardPoints || 0,
                    rewardBalance: user.rewardBalance || 0,
                    totalRewardsEarned: user.referralStats?.referralRewards?.points || 0
                },
                recentActivity,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalReferrals / limit),
                    totalItems: totalReferrals,
                    hasNext: page < Math.ceil(totalReferrals / limit),
                    hasPrev: page > 1
                },
                shareable: {
                    link: `${process.env.FRONTEND_URL}/register?ref=${user.referralCode || promoCode?.code}`,
                    text: `Join me on our platform! Use my referral code: ${user.referralCode || promoCode?.code}`,
                    emailSubject: 'Join me on this platform',
                    emailBody: `Hi,\n\nI've been using this platform and thought you might like it. Sign up using my referral code: ${user.referralCode || promoCode?.code}\n\n${process.env.FRONTEND_URL}/register?ref=${user.referralCode || promoCode?.code}`
                }
            }
        });
    } catch (error) {
        console.error('Error getting referral stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get referral statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Validate a promo code (public)
 * @route   POST /api/promo-codes/validate
 * @access  Public
 */
exports.validatePromoCode = async (req, res) => {
    try {
        const { code } = req.body;
        const currentUserId = req.user?.userId; // Optional, if user is logged in

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Promo code is required'
            });
        }

        const result = await validatePromoCode(code, currentUserId);

        if (result.valid) {
            res.json({
                success: true,
                message: 'Valid promo code',
                data: {
                    code: result.promoCode.code,
                    benefits: result.benefits.newUser,
                    referrer: result.referrer,
                    expiresAt: result.promoCode.validUntil
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error validating promo code:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating promo code'
        });
    }
};

/**
 * @desc    Get referral leaderboard
 * @route   GET /api/promo-codes/leaderboard
 * @access  Public
 */
exports.getReferralLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const leaderboard = await User.aggregate([
            {
                $match: {
                    'referralStats.completedReferrals': { $gt: 0 },
                    isActive: true
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    avatar: 1,
                    totalReferrals: '$referralStats.completedReferrals',
                    rewardPoints: '$referralStats.referralRewards.points'
                }
            },
            { $sort: { totalReferrals: -1 } },
            { $limit: limit }
        ]);

        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get leaderboard'
        });
    }
};

/**
 * @desc    Backfill existing users with referral codes (Admin only)
 * @route   POST /api/promo-codes/admin/backfill
 * @access  Admin
 */
exports.backfillUsers = async (req, res) => {
    try {
        const result = await backfillExistingUsers();

        res.json({
            success: true,
            message: `Processed ${result.processed} users`,
            data: result
        });
    } catch (error) {
        console.error('Error backfilling users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to backfill users'
        });
    }
};