// server/src/routes/companyRoutes.js - FIXED VERSION
const express = require('express');
const {
  getMyCompany,
  getCompany,
  createCompany,
  updateCompany,
  updateMyCompany,
  uploadLogo,
  uploadBanner,
  deleteLogo,
  deleteBanner,
  searchCompanies,
  getPublicCompany
} = require('../controllers/companyController');

const { companyUpload, handleUploadErrors } = require('../middleware/uploadMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();
// Add this before the auth middleware (around line 13)
// ========== PUBLIC ROUTES (NO AUTH) ==========
// Get public company profile by ID
router.get('/public/:id', getPublicCompany);
// Apply auth middleware to all routes
router.use(verifyToken);

// 🔥 FIXED: All routes now under /api/v1/company prefix
// Get current user's company
router.get('/', getMyCompany);

// Get company by ID
router.get('/:id', getCompany);
router.get('/search', searchCompanies);
// Create company (only for company role)
router.post('/', restrictTo('company'), createCompany);

// Update current user's company
router.put('/me', updateMyCompany);

// Update company by ID (owner or admin)
router.put('/:id', updateCompany);

// Upload routes
router.post('/upload/logo', companyUpload, handleUploadErrors, uploadLogo);
router.post('/upload/banner', companyUpload, handleUploadErrors, uploadBanner);
router.delete('/upload/logo', deleteLogo);
router.delete('/upload/banner', deleteBanner);

module.exports = router;