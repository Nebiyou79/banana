const express = require('express');
const router = express.Router();

// Import controller
const freelancerController = require('../controllers/freelancerController');

// Import middleware
const { verifyToken } = require('../middleware/authMiddleware');
const cloudinaryMediaUpload = require('../middleware/cloudinaryMediaUpload');


// =====================
// AUTH MIDDLEWARE
// =====================
router.use(verifyToken);

// =====================
// DASHBOARD & STATS ROUTES
// =====================

// Get dashboard overview
router.get('/dashboard/overview', freelancerController.getDashboardOverview);

// Get professional stats
router.get('/stats', freelancerController.getFreelancerStats);

// =====================
// PROFILE MANAGEMENT ROUTES
// =====================

// Get complete profile
router.get('/profile', freelancerController.getProfile);

// Update profile
router.put('/profile', freelancerController.updateProfile);

// =====================
// PORTFOLIO MANAGEMENT ROUTES
// =====================

// Get portfolio items with pagination
router.get('/portfolio', freelancerController.getPortfolio);

// Get single portfolio item by ID - ADD THIS ROUTE
router.get('/portfolio/:id', freelancerController.getPortfolioItem);

// Add portfolio item
router.post('/portfolio', freelancerController.addPortfolioItem);

// Update portfolio item
router.put('/portfolio/:id', freelancerController.updatePortfolioItem);

// Delete portfolio item
router.delete('/portfolio/:id', freelancerController.deletePortfolioItem);

// =====================
// SERVICES MANAGEMENT ROUTES
// =====================

// Get services
router.get('/services', freelancerController.getServices);

// Add service
router.post('/services', freelancerController.addService);

// =====================
// CERTIFICATION MANAGEMENT ROUTES
// =====================

// Get certifications
router.get('/certifications', freelancerController.getCertifications);

// Add certification
router.post('/certifications', freelancerController.addCertification);

// Update certification
router.put('/certifications/:id', freelancerController.updateCertification);

// Delete certification
router.delete('/certifications/:id', freelancerController.deleteCertification);
// =====================
// FILE UPLOAD ROUTES - FIXED for Cloudinary
// =====================

// Upload portfolio files - IMPORTANT: Field name must match what frontend sends
router.post('/upload/portfolio',
  verifyToken,
  (req, res, next) => {
    console.log('📤 [Route] Starting Cloudinary portfolio upload...');
    console.log('📦 Headers:', req.headers['content-type']);
    next();
  },
  // Use the multiple middleware from cloudinaryMediaUpload
  // IMPORTANT: This expects field name 'media' by default
  cloudinaryMediaUpload.multiple,
  (req, res, next) => {
    console.log('✅ [Route] Cloudinary upload middleware completed');
    console.log('📦 req.cloudinaryMedia:', req.cloudinaryMedia ? 'Present' : 'Not present');
    if (req.cloudinaryMedia) {
      console.log('📸 Media count:', req.cloudinaryMedia.media?.length || 0);
    }
    next();
  },
  freelancerController.uploadPortfolioFiles
);
// Test endpoint for Cloudinary upload
router.post('/test-upload',
  verifyToken,
  (req, res, next) => {
    console.log('🧪 [Test] Testing Cloudinary upload...');
    next();
  },
  cloudinaryMediaUpload.multiple,
  (req, res) => {
    console.log('🧪 [Test] Cloudinary middleware completed');
    
    if (!req.cloudinaryMedia) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary middleware failed',
        debug: {
          hasFiles: !!req.files,
          filesCount: req.files?.length || 0,
          hasFile: !!req.file
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cloudinary upload test successful',
      data: {
        mediaCount: req.cloudinaryMedia.media?.length || 0,
        successful: req.cloudinaryMedia.successful || 0,
        failed: req.cloudinaryMedia.failed || 0,
        firstFile: req.cloudinaryMedia.media?.[0] ? {
          hasCloudinary: !!req.cloudinaryMedia.media[0].cloudinary,
          url: req.cloudinaryMedia.media[0].cloudinary?.secure_url
        } : null
      },
      code: 'TEST_SUCCESS'
    });
  }
);

// Upload avatar - Use cloudinaryMediaUpload.avatar middleware
router.post('/upload/avatar',
  require('../middleware/cloudinaryMediaUpload').avatar,
  freelancerController.uploadAvatar
);

// Get upload statistics
router.get('/stats/uploads', freelancerController.getUploadStats);

// =====================
// TENDER MANAGEMENT ROUTES
// =====================

// Get tenders with filters
router.get('/tenders', freelancerController.getTenders);

// Get tender details
router.get('/tenders/:id', freelancerController.getTenderDetails);

// Toggle save/unsave tender
router.post('/tenders/:id/save', freelancerController.toggleSaveTender);

// Get saved tenders
router.get('/tenders/saved/all', freelancerController.getSavedTenders);

// =====================
// PUBLIC ROUTES (NO AUTH REQUIRED)
// =====================

// Get public profile
router.get('/public/:usernameOrId', freelancerController.getPublicProfile);

// =====================
// HEALTH CHECK
// =====================
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Freelancer routes are operational',
    timestamp: new Date().toISOString(),
    user: req.user ? {
      id: req.user.userId,
      role: req.user.role
    } : null
  });
});

// =====================
// 404 HANDLER
// =====================
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Freelancer route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;