// server/src/routes/verificationRoutes.js
const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// Public route - Get verification status for any user
router.get('/status/:userId', verificationController.getVerificationStatus);

// Protected routes - require authentication
router.use(verifyToken);

// Get current user's verification status
router.get('/my-status', verificationController.getVerificationStatus);

// Update verification status (Admin only)
router.patch(
    '/update/:userId',
    restrictTo('admin'),
    verificationController.updateVerification
);

// Request verification (for users)
router.post(
    '/request',
    restrictTo('candidate', 'freelancer', 'company', 'organization'),
    verificationController.requestVerification
);

// Get verification requests (Admin only)
router.get(
    '/requests',
    restrictTo('admin'),
    verificationController.getVerificationRequests
);

// Bulk update verification (Admin only)
router.post(
    '/bulk-update',
    restrictTo('admin'),
    verificationController.bulkUpdateVerification
);

// Get verification statistics (Admin only)
router.get(
    '/stats',
    restrictTo('admin'),
    verificationController.getVerificationStats
);

module.exports = router;