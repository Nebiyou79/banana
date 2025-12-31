// routes/jobRoutes.js - FIXED ROUTE ORDERING
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
    .isIn([
      'primary-education',
      'secondary-education', 
      'tvet-level-i',
      'tvet-level-ii',
      'tvet-level-iii',
      'tvet-level-iv',
      'tvet-level-v',
      'undergraduate-bachelors',
      'postgraduate-masters',
      'doctoral-phd',
      'lecturer',
      'professor',
      'none-required',
      // Backward compatibility
      'high-school',
      'diploma',
      'bachelors',
      'masters',
      'phd'
    ])
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
    .isIn([
      'primary-education',
      'secondary-education', 
      'tvet-level-i',
      'tvet-level-ii',
      'tvet-level-iii',
      'tvet-level-iv',
      'tvet-level-v',
      'undergraduate-bachelors',
      'postgraduate-masters',
      'doctoral-phd',
      'lecturer',
      'professor',
      'none-required',
      // Backward compatibility
      'high-school',
      'diploma',
      'bachelors',
      'masters',
      'phd'
    ])
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

// ========== PUBLIC ROUTES ==========
router.get('/', getJobs);
router.get('/categories', getCategories);

// ========== PROTECTED ROUTES ==========
router.use(verifyToken);

// ========== SPECIFIC ROUTES (MUST COME BEFORE PARAMETERIZED ROUTES) ==========

// Company specific routes
router.get('/company/my-jobs', restrictTo('company', 'admin'), getCompanyJobs);

// Organization specific routes
router.get('/organization/my-jobs', restrictTo('organization', 'admin'), getOrganizationJobs);

// Candidate specific routes
router.get('/candidate/jobs', restrictTo('candidate'), getJobsForCandidate);
router.get('/saved/jobs', restrictTo('candidate'), getSavedJobs);

// ========== CREATE ROUTES ==========
router.post('/', restrictTo('company', 'admin'), createJobValidation, createJob);
router.post('/organization', restrictTo('organization', 'admin'), createJobValidation, createOrganizationJob);

// ========== SAVE/UNSAVE ROUTES ==========
router.post('/:jobId/save', restrictTo('candidate'), saveJob);
router.post('/:jobId/unsave', restrictTo('candidate'), unsaveJob);

// ========== ORGANIZATION PARAMETERIZED ROUTES ==========
router.put('/organization/:id', restrictTo('organization', 'admin'), updateJobValidation, updateOrganizationJob);
router.delete('/organization/:id', restrictTo('organization', 'admin'), deleteOrganizationJob);

// ========== GENERAL PARAMETERIZED ROUTES (MUST BE LAST) ==========
router.get('/:id', getJob);
router.put('/:id', restrictTo('company', 'admin'), updateJobValidation, updateJob);
router.delete('/:id', restrictTo('company', 'admin'), deleteJob);

module.exports = router;