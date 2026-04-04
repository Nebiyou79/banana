const express = require('express');
const {
  getProfile,
  updateProfile,
  uploadCV,
  uploadMultipleCVs,
  setPrimaryCV,
  deleteCV,
  getCV,
  getAllCVs,
  viewCV,
  downloadCV,
  getJobsForCandidate,
  saveJob,
  unsaveJob,
  getSavedJobs,
  getPublicCandidateProfile
} = require('../controllers/candidateController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const localFileUpload = require('../middleware/localFileUpload');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

const router = express.Router();

// Rate limiting
const candidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// CV-specific rate limiting
const cvUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    message: 'Too many CV uploads. Please try again later.'
  },
  skipFailedRequests: true
});

// Input validation
const profileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('bio').optional().trim().isLength({ max: 2000 }),
  body('skills').optional().isArray(),
  body('website').optional().isURL(),
  body('phone').optional().isMobilePhone()
];

// ========== PUBLIC ROUTES (NO AUTH) ==========
router.get('/public/:userId', getPublicCandidateProfile);

// Apply authentication and role restriction
router.use(verifyToken);
router.use(restrictTo('candidate'));
router.use(candidateLimiter);

// ========== PROFILE ROUTES ==========
router.get('/profile', getProfile);
router.put('/profile', profileValidation, updateProfile);

// ========== CV MANAGEMENT ROUTES (LOCAL STORAGE) ==========
// Get all CVs
router.get('/cvs', getAllCVs);

// Upload single CV
router.post('/cv',
  cvUploadLimiter,
  localFileUpload.single('cv', 'cv'),
  uploadCV
);

// Upload multiple CVs - FIXED
router.post('/cvs/multiple',
  cvUploadLimiter,
  localFileUpload.multiple('cvs', 10, 'cv'),
  uploadMultipleCVs
);

// Get single CV metadata
router.get('/cv/:cvId', getCV);

// View CV (redirects to file URL)
router.get('/cv/:cvId/view', viewCV);

// Download CV (serves file directly with headers)
router.get('/cv/:cvId/download', downloadCV);

// Set primary CV
router.patch('/cv/:cvId/primary', setPrimaryCV);

// Delete CV
router.delete('/cv/:cvId', deleteCV);

// ========== JOB ROUTES ==========
router.get('/jobs', getJobsForCandidate);
router.get('/jobs/saved', getSavedJobs);
router.post('/job/:jobId/save', saveJob);
router.post('/job/:jobId/unsave', unsaveJob);

module.exports = router;