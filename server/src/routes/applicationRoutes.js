const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getMyApplications,
  getApplicationDetails,
  getJobApplications,
  updateApplicationStatus,
  addCompanyResponse,
  withdrawApplication,
  getApplicationStatistics,
  getMyCVs,
  getCompanyApplications,
  getOrganizationApplications,
  getCompanyApplicationDetails,
  getOrganizationApplicationDetails
} = require('../controllers/applicationController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { applicationAttachments, handleAttachmentUploadError } = require('../middleware/attachmentUploadMiddleware');

// Apply validation middleware
const { body } = require('express-validator');

// Custom middleware to parse form data JSON strings
const parseFormData = (req, res, next) => {
  // Parse JSON fields from form-data
  const fieldsToParse = ['selectedCVs', 'contactInfo', 'skills', 'references', 'workExperience', 'userInfo'];
  
  fieldsToParse.forEach(field => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (error) {
        console.log(`⚠️ Failed to parse ${field}:`, req.body[field]);
        // Keep as string if parsing fails
      }
    }
  });
  
  next();
};

// Apply for job validation
const applyForJobValidation = [
  body('coverLetter')
    .notEmpty()
    .withMessage('Cover letter is required')
    .isLength({ max: 5000 })
    .withMessage('Cover letter cannot exceed 5000 characters'),
  body('selectedCVs')
    .isArray({ min: 1 })
    .withMessage('At least one CV must be selected'),
  body('selectedCVs.*.cvId')
    .notEmpty()
    .withMessage('CV ID is required'),
  body('contactInfo.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('contactInfo.phone')
    .notEmpty()
    .withMessage('Phone number is required'),
  body('contactInfo.location')
    .notEmpty()
    .withMessage('Location is required')
];

// Update status validation
const updateStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn([
      'applied', 'under-review', 'shortlisted', 'interview-scheduled', 
      'interviewed', 'offer-pending', 'offer-made', 'offer-accepted', 
      'offer-rejected', 'on-hold', 'rejected', 'withdrawn'
    ])
    .withMessage('Invalid status')
];

// Company response validation
const companyResponseValidation = [
  body('status')
    .notEmpty()
    .withMessage('Response status is required')
    .isIn(['active-consideration', 'on-hold', 'rejected', 'selected-for-interview'])
    .withMessage('Invalid response status')
];

// ===== CANDIDATE ROUTES =====

// Get candidate's CVs
router.get(
  '/my-cvs',
  verifyToken,
  restrictTo('candidate'),
  getMyCVs
);

// Get candidate's applications
router.get(
  '/my-applications',
  verifyToken,
  restrictTo('candidate'),
  getMyApplications
);

// Apply for job
router.post(
  '/apply/:jobId',
  verifyToken,
  restrictTo('candidate'),
  applicationAttachments,
  handleAttachmentUploadError,
  parseFormData,
  applyForJobValidation,
  applyForJob
);

// Withdraw application
router.put(
  '/:applicationId/withdraw',
  verifyToken,
  restrictTo('candidate'),
  withdrawApplication
);

// ===== COMPANY ROUTES =====

// Get all company applications (across all jobs)
router.get(
  '/company/applications',
  verifyToken,
  restrictTo('company', 'admin'),
  getCompanyApplications
);

// Get company-specific application details
router.get(
  '/company/:applicationId',
  verifyToken,
  restrictTo('company', 'admin'),
  getCompanyApplicationDetails  // USE CONTROLLER METHOD
);

// ===== ORGANIZATION ROUTES =====

// Get all organization applications (across all jobs)
router.get(
  '/organization/applications',
  verifyToken,
  restrictTo('organization', 'admin'),
  getOrganizationApplications
);

// Get organization-specific application details
router.get(
  '/organization/:applicationId',
  verifyToken,
  restrictTo('organization', 'admin'),
  getOrganizationApplicationDetails  // USE CONTROLLER METHOD
);

// ===== SHARED COMPANY/ORGANIZATION ROUTES =====

// Get applications for a specific job
router.get(
  '/job/:jobId',
  verifyToken,
  restrictTo('company', 'organization', 'admin'),
  getJobApplications
);

// Update application status
router.put(
  '/:applicationId/status',
  verifyToken,
  restrictTo('company', 'organization', 'admin'),
  updateStatusValidation,
  updateApplicationStatus
);

// Add company response
router.put(
  '/:applicationId/company-response',
  verifyToken,
  restrictTo('company', 'organization', 'admin'),
  companyResponseValidation,
  addCompanyResponse
);

// ===== SHARED ROUTES (ALL AUTHENTICATED USERS) =====

// Get application statistics
router.get(
  '/statistics/overview',
  verifyToken,
  getApplicationStatistics
);

// Get application details (with proper permission checks)
router.get(
  '/:applicationId',
  verifyToken,
  getApplicationDetails
);

module.exports = router;