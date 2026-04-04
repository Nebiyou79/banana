// routes/authRoutes.js
const express = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  verifyResetOTP,
  createAdmin,
  getAdmins,
  // NEW: Import referral functions
  generateReferralCode,
  getMyReferralStats
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// ==================== ADMIN ROUTES ====================
router.post('/admin/create', adminAuth, createAdmin);
router.get('/admin/users', adminAuth, getAdmins);

// ==================== PUBLIC ROUTES ====================
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-otp', verifyResetOTP);

// ==================== PROTECTED USER ROUTES ====================
router.get('/me', verifyToken, getCurrentUser);

// NEW: Referral system routes (protected)
/**
 * @route   POST /api/auth/generate-referral
 * @desc    Generate referral code for authenticated user
 * @access  Private
 */
router.post('/generate-referral', verifyToken, generateReferralCode);

/**
 * @route   GET /api/auth/referral-stats
 * @desc    Get referral statistics for authenticated user
 * @access  Private
 */
router.get('/referral-stats', verifyToken, getMyReferralStats);

module.exports = router;