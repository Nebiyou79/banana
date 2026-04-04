// controllers/adminPromoController.js
const PromoCode = require('../models/PromoCode');
const User = require('../models/User');
const ReferralHistory = require('../models/ReferralHistory');

/**
 * @desc    Create campaign promo code (Admin)
 * @route   POST /api/promo-codes/admin/create
 * @access  Admin
 */
exports.createCampaignPromoCode = async (req, res) => {
    try {
        const {
            code,
            type,
            referrerBenefits,
            newUserBenefits,
            maxUses,
            validFrom,
            validUntil,
            campaign
        } = req.body;

        // Validate required fields
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Code is required'
            });
        }

        // Check if code exists
        const existing = await PromoCode.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Promo code already exists'
            });
        }

        // Create promo code
        const promoCode = new PromoCode({
            code: code.toUpperCase(),
            userId: req.user._id, // Admin as owner
            type: type || 'campaign',
            referrerBenefits: referrerBenefits || {
                discountPercentage: 0,
                rewardPoints: 0,
                cashback: 0
            },
            newUserBenefits: newUserBenefits || {
                discountPercentage: 10,
                rewardPoints: 50,
                cashback: 0
            },
            maxUses: maxUses || 1000,
            validFrom: validFrom || new Date(),
            validUntil: validUntil || new Date(+new Date() + 90 * 24 * 60 * 60 * 1000),
            campaign: campaign || {},
            createdBy: req.user._id
        });

        await promoCode.save();

        // Log admin activity if you have it
        if (req.adminActivityLog) {
            await req.adminActivityLog({
                adminId: req.user._id,
                action: 'CREATE_PROMO_CODE',
                targetId: promoCode._id,
                details: { code: promoCode.code }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Campaign promo code created successfully',
            data: promoCode
        });
    } catch (error) {
        console.error('Error creating campaign promo code:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create promo code',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get all promo codes with filters (Admin)
 * @route   GET /api/promo-codes/admin/all
 * @access  Admin
 */
exports.getAllPromoCodes = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            isActive,
            userId,
            search
        } = req.query;

        const filter = {};
        if (type) filter.type = type;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (userId) filter.userId = userId;

        if (search) {
            filter.$or = [
                { code: { $regex: search, $options: 'i' } },
                { 'campaign.name': { $regex: search, $options: 'i' } }
            ];
        }

        const promoCodes = await PromoCode.find(filter)
            .populate('userId', 'name email')
            .populate('usedBy.userId', 'name email')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 });

        const total = await PromoCode.countDocuments(filter);

        // Enhance with usage stats
        const enhancedCodes = promoCodes.map(code => ({
            ...code.toObject(),
            usageRate: ((code.usedCount / code.maxUses) * 100).toFixed(1),
            isExpired: code.validUntil < new Date(),
            isActive: code.isActive && code.validUntil >= new Date() && code.usedCount < code.maxUses
        }));

        res.json({
            success: true,
            data: enhancedCodes,
            pagination: {
                totalPages: Math.ceil(total / Number(limit)),
                currentPage: Number(page),
                total,
                hasNext: Number(page) < Math.ceil(total / Number(limit)),
                hasPrev: Number(page) > 1
            }
        });
    } catch (error) {
        console.error('Error getting promo codes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get promo codes'
        });
    }
};

/**
 * @desc    Get promo code statistics (Admin)
 * @route   GET /api/promo-codes/admin/stats
 * @access  Admin
 */
exports.getPromoCodeStats = async (req, res) => {
    try {
        const [
            totalCodes,
            activeCodes,
            totalUses,
            typeBreakdown,
            topReferrers,
            dailyStats
        ] = await Promise.all([
            // Total codes
            PromoCode.countDocuments(),

            // Active codes
            PromoCode.countDocuments({
                isActive: true,
                validUntil: { $gt: new Date() },
                usedCount: { $lt: '$maxUses' }
            }),

            // Total uses
            PromoCode.aggregate([
                { $group: { _id: null, total: { $sum: '$usedCount' } } }
            ]),

            // Breakdown by type
            PromoCode.aggregate([
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        totalUses: { $sum: '$usedCount' },
                        avgUses: { $avg: '$usedCount' }
                    }
                }
            ]),

            // Top referrers
            User.aggregate([
                { $match: { 'referralStats.completedReferrals': { $gt: 0 } } },
                {
                    $project: {
                        name: 1,
                        email: 1,
                        completedReferrals: '$referralStats.completedReferrals',
                        totalReferrals: '$referralStats.totalReferrals'
                    }
                },
                { $sort: { completedReferrals: -1 } },
                { $limit: 10 }
            ]),

            // Daily stats for last 30 days
            ReferralHistory.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        registrations: { $sum: 1 },
                        completed: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        const usersWithReferral = await User.countDocuments({
            referralCode: { $exists: true, $ne: null }
        });

        const totalReferred = await User.countDocuments({
            referredBy: { $exists: true, $ne: null }
        });

        res.json({
            success: true,
            data: {
                overview: {
                    totalCodes,
                    activeCodes,
                    totalUses: totalUses[0]?.total || 0,
                    usersWithReferral,
                    totalReferred,
                    conversionRate: usersWithReferral > 0
                        ? ((totalReferred / usersWithReferral) * 100).toFixed(2)
                        : 0
                },
                typeBreakdown,
                topReferrers,
                dailyTrends: dailyStats,
                lastUpdated: new Date()
            }
        });
    } catch (error) {
        console.error('Error getting promo stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get promo statistics'
        });
    }
};

/**
 * @desc    Update promo code (Admin)
 * @route   PUT /api/promo-codes/admin/:id
 * @access  Admin
 */
exports.updatePromoCode = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent changing critical fields
        delete updates.code;
        delete updates.userId;
        delete updates._id;

        const promoCode = await PromoCode.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!promoCode) {
            return res.status(404).json({
                success: false,
                message: 'Promo code not found'
            });
        }

        res.json({
            success: true,
            message: 'Promo code updated successfully',
            data: promoCode
        });
    } catch (error) {
        console.error('Error updating promo code:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update promo code'
        });
    }
};

/**
 * @desc    Get promo code details (Admin)
 * @route   GET /api/promo-codes/admin/:id
 * @access  Admin
 */
exports.getPromoCodeDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const promoCode = await PromoCode.findById(id)
            .populate('userId', 'name email')
            .populate('usedBy.userId', 'name email createdAt');

        if (!promoCode) {
            return res.status(404).json({
                success: false,
                message: 'Promo code not found'
            });
        }

        // Get usage details
        const usageStats = {
            totalUsed: promoCode.usedCount,
            remaining: promoCode.maxUses - promoCode.usedCount,
            usageRate: ((promoCode.usedCount / promoCode.maxUses) * 100).toFixed(1),
            verifiedUsers: promoCode.usedBy.filter(u => u.emailVerified).length,
            pendingUsers: promoCode.usedBy.filter(u => !u.emailVerified).length,
            recentUses: promoCode.usedBy.slice(-10).reverse()
        };

        res.json({
            success: true,
            data: {
                ...promoCode.toObject(),
                usageStats
            }
        });
    } catch (error) {
        console.error('Error getting promo code details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get promo code details'
        });
    }
};

/**
 * @desc    Bulk create promo codes (Admin)
 * @route   POST /api/promo-codes/admin/bulk-create
 * @access  Admin
 */
exports.bulkCreatePromoCodes = async (req, res) => {
    try {
        const { count = 10, prefix = 'CAMPAIGN', ...options } = req.body;

        const codes = [];
        const created = [];

        for (let i = 0; i < count; i++) {
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            const code = `${prefix}${randomNum}${i}`;

            if (!codes.includes(code)) {
                codes.push(code);

                const promoCode = new PromoCode({
                    code: code.toUpperCase(),
                    userId: req.user._id,
                    type: options.type || 'campaign',
                    referrerBenefits: options.referrerBenefits || {},
                    newUserBenefits: options.newUserBenefits || {
                        discountPercentage: 10,
                        rewardPoints: 50
                    },
                    maxUses: options.maxUses || 100,
                    validUntil: options.validUntil || new Date(+new Date() + 90 * 24 * 60 * 60 * 1000),
                    campaign: {
                        name: options.campaignName || 'Bulk Campaign',
                        source: options.source || 'bulk'
                    },
                    createdBy: req.user._id
                });

                await promoCode.save();
                created.push(promoCode);
            }
        }

        res.status(201).json({
            success: true,
            message: `Created ${created.length} promo codes`,
            data: created
        });
    } catch (error) {
        console.error('Error bulk creating promo codes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk create promo codes'
        });
    }
};