const express = require('express');
const router = express.Router();

// Import all controller functions
const freelancerController = require('../controllers/freelancerController');

// Import middleware
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadPortfolio, uploadAvatar, handleUploadError } = require('../middleware/fileUploadMiddleware');

// Apply authentication to all routes (except public routes)
router.use(verifyToken);

// Dashboard & Stats routes
router.get('/dashboard/overview', freelancerController.getDashboardOverview);
router.get('/stats', freelancerController.getFreelancerStats);

// Profile routes
router.get('/profile', freelancerController.getProfile);
router.put('/profile', freelancerController.updateProfile);

// Portfolio routes
router.get('/portfolio', freelancerController.getPortfolio);
router.post('/portfolio', freelancerController.addPortfolioItem);
router.put('/portfolio/:id', freelancerController.updatePortfolioItem);
router.delete('/portfolio/:id', freelancerController.deletePortfolioItem);

// Services routes
router.get('/services', freelancerController.getServices);
router.post('/services', freelancerController.addService);

// Certefication routes
router.get('/certifications', freelancerController.getCertifications);
router.post('/certifications', freelancerController.addCertification);
router.put('/certifications/:id', freelancerController.updateCertification);
router.delete('/certifications/:id', freelancerController.deleteCertification);

// File upload routes - FIXED field names
router.post('/upload/portfolio', 
  uploadPortfolio,
  handleUploadError,
  freelancerController.uploadPortfolioFiles
);

router.post('/upload/avatar',
  uploadAvatar,
  handleUploadError,
  freelancerController.uploadAvatar
);

// Public profile route (no authentication required)
router.get('/public/:usernameOrId', freelancerController.getPublicProfile);

// Tender routes for freelancers
router.get('/tenders', freelancerController.getTenders);
router.get('/tenders/:id', freelancerController.getTenderDetails);
router.post('/tenders/:id/save', freelancerController.toggleSaveTender);
router.get('/tenders/saved/all', freelancerController.getSavedTenders);
module.exports = router;