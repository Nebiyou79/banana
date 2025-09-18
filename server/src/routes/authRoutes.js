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
  getAdmins
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const  adminAuth  = require('../middleware/adminAuth');

const router = express.Router();

// Admin routes
router.post('/admin/create', adminAuth, createAdmin);
router.get('/admin/users', adminAuth, getAdmins);

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
// Add the new route for OTP verification
router.post('/verify-reset-otp', verifyResetOTP);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;