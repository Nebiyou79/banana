// routes/promoCodeRoutes.js
const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth');
const {
    generateMyReferralCode,
    getMyReferralStats,
    validatePromoCode,
    getReferralLeaderboard,
    backfillUsers
} = require('../controllers/promoCodeController');

const {
    createCampaignPromoCode,
    getAllPromoCodes,
    getPromoCodeStats,
    updatePromoCode,
    getPromoCodeDetails,
    bulkCreatePromoCodes
} = require('../controllers/adminPromoController');

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
/**
 * @route   POST /api/promo-codes/validate
 * @desc    Validate a promo code
 * @access  Public
 */
router.post('/validate', validatePromoCode);

/**
 * @route   GET /api/promo-codes/leaderboard
 * @desc    Get referral leaderboard
 * @access  Public
 */
router.get('/leaderboard', getReferralLeaderboard);

// ==================== USER ROUTES ====================
// All routes below require authentication
router.use(verifyToken);

/**
 * @route   POST /api/promo-codes/generate
 * @desc    Generate referral code for current user
 * @access  Private
 */
router.post('/generate', generateMyReferralCode);

/**
 * @route   GET /api/promo-codes/my-stats
 * @desc    Get current user's referral statistics
 * @access  Private
 */
router.get('/my-stats', getMyReferralStats);

// ==================== ADMIN ROUTES ====================
// All routes below require admin authentication
router.use('/admin', adminAuth);

/**
 * @route   POST /api/promo-codes/admin/create
 * @desc    Create a campaign promo code
 * @access  Admin
 */
router.post('/admin/create', createCampaignPromoCode);

/**
 * @route   POST /api/promo-codes/admin/bulk-create
 * @desc    Bulk create promo codes
 * @access  Admin
 */
router.post('/admin/bulk-create', bulkCreatePromoCodes);

/**
 * @route   GET /api/promo-codes/admin/all
 * @desc    Get all promo codes with filters
 * @access  Admin
 */
router.get('/admin/all', getAllPromoCodes);

/**
 * @route   GET /api/promo-codes/admin/stats
 * @desc    Get promo code statistics
 * @access  Admin
 */
router.get('/admin/stats', getPromoCodeStats);

/**
 * @route   GET /api/promo-codes/admin/:id
 * @desc    Get promo code details
 * @access  Admin
 */
router.get('/admin/:id', getPromoCodeDetails);

/**
 * @route   PUT /api/promo-codes/admin/:id
 * @desc    Update promo code
 * @access  Admin
 */
router.put('/admin/:id', updatePromoCode);

/**
 * @route   POST /api/promo-codes/admin/backfill
 * @desc    Backfill existing users with referral codes
 * @access  Admin
 */
router.post('/admin/backfill', backfillUsers);

module.exports = router;