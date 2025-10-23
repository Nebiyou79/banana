const express = require('express');
const { 
  getProfile, 
  updateProfile, 
  uploadCV,
  setPrimaryCV,
  deleteCV,
  // NEW: Job functions
  getJobsForCandidate,
  saveJob,
  unsaveJob,
  getSavedJobs
} = require('../controllers/candidateController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { upload, handleUploadError } = require('../middleware/cvUploadMiddleware');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

const router = express.Router();

// Rate limiting for candidate routes
const candidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Input validation
const profileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('bio').optional().trim().isLength({ max: 1000 }),
  body('skills').optional().isArray(),
  body('website').optional().isURL(),
  body('phone').optional().isMobilePhone()
];

// Apply authentication, role restriction and rate limiting to all routes
router.use(verifyToken);
router.use(restrictTo('candidate'));
router.use(candidateLimiter);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', profileValidation, updateProfile);

// CV routes
router.post('/cv', 
  upload.array('cvs', 10),
  handleUploadError,
  uploadCV
);
router.patch('/cv/:cvId/primary', setPrimaryCV);
router.delete('/cv/:cvId', deleteCV);

// Job routes (REPLACED tender routes)
router.get('/jobs', getJobsForCandidate);
router.get('/jobs/saved', getSavedJobs);
router.post('/:jobId/save', saveJob);
router.post('/:jobId/unsave', unsaveJob);

module.exports = router;