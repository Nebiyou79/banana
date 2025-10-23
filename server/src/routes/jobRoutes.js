// routes/jobRoutes.js - FIXED SAVE/UNSAVE ROUTES
const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJob,
  getCompanyJobs,
  createJob,
  updateJob,
  deleteJob,
  getCategories,
  // Organization methods
  getOrganizationJobs,
  createOrganizationJob,
  updateOrganizationJob,
  deleteOrganizationJob,
  // Candidate Methods
  getJobsForCandidate,
  saveJob,
  unsaveJob,
  getSavedJobs
} = require('../controllers/jobController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { body } = require('express-validator');

// Enhanced Validation for CREATE
const createJobValidation = [
  body('title')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
  body('type')
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary', 'volunteer', 'remote', 'hybrid'])
    .withMessage('Invalid job type'),
  body('experienceLevel')
    .isIn(['fresh-graduate', 'entry-level', 'mid-level', 'senior-level', 'managerial', 'director', 'executive'])
    .withMessage('Invalid experience level'),
  body('educationLevel')
    .optional()
    .isIn(['high-school', 'diploma', 'bachelors', 'masters', 'phd', 'none-required'])
    .withMessage('Invalid education level'),
  body('location.region')
    .isIn([
      'addis-ababa', 'afar', 'amhara', 'benishangul-gumuz', 'dire-dawa',
      'gambela', 'harari', 'oromia', 'sidama', 'snnpr', 'somali', 
      'south-west-ethiopia', 'tigray', 'international'
    ])
    .withMessage('Invalid region'),
  body('salary.currency')
    .optional()
    .isIn(['ETB', 'USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),
  body('applicationDeadline')
    .isISO8601()
    .withMessage('Invalid application deadline date')
];

// Enhanced Validation for UPDATE
const updateJobValidation = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('category')
    .optional()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  body('type')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary', 'volunteer', 'remote', 'hybrid'])
    .withMessage('Invalid job type'),
  body('experienceLevel')
    .optional()
    .isIn(['fresh-graduate', 'entry-level', 'mid-level', 'senior-level', 'managerial', 'director', 'executive'])
    .withMessage('Invalid experience level'),
  body('educationLevel')
    .optional()
    .isIn(['high-school', 'diploma', 'bachelors', 'masters', 'phd', 'none-required'])
    .withMessage('Invalid education level'),
  body('location.region')
    .optional()
    .isIn([
      'addis-ababa', 'afar', 'amhara', 'benishangul-gumuz', 'dire-dawa',
      'gambela', 'harari', 'oromia', 'sidama', 'snnpr', 'somali', 
      'south-west-ethiopia', 'tigray', 'international'
    ])
    .withMessage('Invalid region'),
  body('salary.currency')
    .optional()
    .isIn(['ETB', 'USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),
  body('applicationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid application deadline date')
];

// Public routes
router.get('/', getJobs);
router.get('/categories', getCategories);
router.get('/:id', getJob);

// Protected routes
router.use(verifyToken);

// Company routes
router.get('/company/my-jobs', restrictTo('company', 'admin'), getCompanyJobs);
router.post('/', restrictTo('company', 'admin'), createJobValidation, createJob);
router.put('/:id', restrictTo('company', 'admin'), updateJobValidation, updateJob);
router.delete('/:id', restrictTo('company', 'admin'), deleteJob);

// Organization routes
router.get('/organization/my-jobs', restrictTo('organization', 'admin'), getOrganizationJobs);
router.post('/organization', restrictTo('organization', 'admin'), createJobValidation, createOrganizationJob);
router.put('/organization/:id', restrictTo('organization', 'admin'), updateJobValidation, updateOrganizationJob);
router.delete('/organization/:id', restrictTo('organization', 'admin'), deleteOrganizationJob);

// FIXED: Candidate routes - CORRECTED SAVE/UNSAVE PATHS
router.get('/candidate/jobs', verifyToken, restrictTo('candidate'), getJobsForCandidate);
router.post('/:jobId/save', verifyToken, restrictTo('candidate'), saveJob); // FIXED: Removed '/job/' prefix
router.post('/:jobId/unsave', verifyToken, restrictTo('candidate'), unsaveJob); // FIXED: Removed '/job/' prefix
router.get('/saved/jobs', verifyToken, restrictTo('candidate'), getSavedJobs); // FIXED: Added '/jobs' for consistency

module.exports = router;