// server/src/routes/organizationRoutes.js
const express = require('express');
const {
  getMyOrganization,
  getOrganization,
  createOrganization,
  updateOrganization,
  updateMyOrganization,
  uploadLogo,
  uploadBanner,
  deleteLogo,
  deleteBanner,
  getPublicOrganization
} = require('../controllers/organizationController');

const { organizationUpload, handleUploadErrors } = require('../middleware/organizationUploadMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();
// Add this before the auth middleware (around line 13)
// ========== PUBLIC ROUTES (NO AUTH) ==========
// Get public organization profile by ID
router.get('/public/:id', getPublicOrganization);
// Apply auth middleware to all routes
router.use(verifyToken);

// 🔥 FIXED: All routes now under /api/v1/organization prefix
// Get current user's organization
router.get('/', getMyOrganization);

// Get organization by ID
router.get('/:id', getOrganization);

// Create organization (only for organization role)
router.post('/', restrictTo('organization'), createOrganization);

// Update current user's organization
router.put('/me', updateMyOrganization);

// Update organization by ID (owner or admin)
router.put('/:id', updateOrganization);

// Upload routes
router.post('/upload/logo', organizationUpload, handleUploadErrors, uploadLogo);
router.post('/upload/banner', organizationUpload, handleUploadErrors, uploadBanner);
router.delete('/upload/logo', deleteLogo);
router.delete('/upload/banner', deleteBanner);

module.exports = router;