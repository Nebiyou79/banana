const express = require('express');
const { 
  getProfile, 
  updateProfile, 
  uploadCV,
  setPrimaryCV,
  deleteCV,
  getOpenTenders,
  toggleSaveTender,
  getSavedTenders
} = require('../controllers/candidateController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { upload, handleUploadError } = require('../middleware/cvUploadMiddleware'); // CHANGED

const router = express.Router();

// Apply authentication and role restriction to all routes
router.use(verifyToken);
router.use(restrictTo('candidate'));

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// CV routes - USE CV UPLOAD MIDDLEWARE
router.post('/cv', 
  upload.array('cvs', 5),
  handleUploadError, // Add error handling
  uploadCV
);

router.patch('/cv/:cvId/primary', setPrimaryCV);
router.delete('/cv/:cvId', deleteCV);

// Tender routes
router.get('/tenders', getOpenTenders);
router.post('/tenders/:tenderId/save', toggleSaveTender);
router.get('/tenders/saved', getSavedTenders);

module.exports = router;