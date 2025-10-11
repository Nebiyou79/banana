// routes/jobRoutes.js - UPDATED
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
  // Add the new organization methods
  getOrganizationJobs,
  createOrganizationJob,
  updateOrganizationJob,
  deleteOrganizationJob
} = require('../controllers/jobController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { body } = require('express-validator');

// Validation for CREATE (strict)
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
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary', 'volunteer', 'remote', 'hybrid'])
    .withMessage('Invalid job type'),
  body('experienceLevel')
    .optional()
    .isIn(['fresh-graduate', 'entry-level', 'mid-level', 'senior-level', 'managerial', 'director', 'executive'])
    .withMessage('Invalid experience level'),
  body('salary.currency')
    .optional()
    .isIn(['ETB', 'USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency')
];

// Validation for UPDATE (optional - only validate if field is provided)
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
  body('salary.currency')
    .optional()
    .isIn(['ETB', 'USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency')
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

module.exports = router;