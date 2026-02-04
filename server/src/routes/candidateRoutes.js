const express = require('express');
const {
  getProfile,
  updateProfile,
  uploadCV,
  uploadMultipleCVs,  // Add new function
  setPrimaryCV,
  deleteCV,
  getCV,
  getAllCVs,
  viewCV,
  downloadCV,
  getJobsForCandidate,
  saveJob,
  unsaveJob,
  getSavedJobs
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
  max: 20, // Increased to 20 for multiple uploads
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

// Upload single CV - USING LOCALFILEUPLOAD CV MIDDLEWARE
router.post('/cv',
  cvUploadLimiter,
  localFileUpload.single('cv', 'cv'), // Changed from .cv() to .single()
  uploadCV
);

// ✅ NEW: Upload multiple CVs
router.post('/cvs/multiple',
  cvUploadLimiter,
  localFileUpload.multiple('cvs', 10, 'cv'), // Allows up to 10 files at once
  uploadMultipleCVs  // New controller function
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

// ========== DEBUG ENDPOINT ==========
router.post('/cv-debug', (req, res) => {
  console.log('=== CV DEBUG ENDPOINT ===');
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Files in request:', req.files ? Object.keys(req.files) : 'No files');
  console.log('File count:', req.files ? Object.keys(req.files).length : 0);

  if (req.files) {
    Object.keys(req.files).forEach(key => {
      const file = req.files[key];
      if (Array.isArray(file)) {
        console.log(`Field "${key}" has ${file.length} files:`);
        file.forEach((f, i) => {
          console.log(`  [${i}] ${f.name} - ${f.mimetype} - ${f.size} bytes`);
        });
      } else {
        console.log(`Field "${key}": ${file.name} - ${file.mimetype} - ${file.size} bytes`);
      }
    });
  }

  res.json({
    success: true,
    message: 'Debug endpoint working',
    filesReceived: req.files ? Object.keys(req.files) : [],
    fileCount: req.files ? Object.keys(req.files).length : 0
  });
});

// ========== JOB ROUTES ==========
// Get jobs for candidate (with filters)
router.get('/jobs', getJobsForCandidate);

// Get saved jobs
router.get('/jobs/saved', getSavedJobs);

// Save job
router.post('/job/:jobId/save', saveJob);

// Unsave job
router.post('/job/:jobId/unsave', unsaveJob);

module.exports = router;
