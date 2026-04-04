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
  getOrganizationApplicationDetails,
  getApplicationAttachments,
  downloadApplicationFile,
  viewApplicationFile,
  downloadCV,
  viewCV
} = require('../controllers/applicationController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const localFileUpload = require('../middleware/localFileUpload');

// Apply validation middleware
const { body } = require('express-validator');

// SIMPLIFIED parseFormData middleware
const parseFormData = (req, res, next) => {
  try {
    console.log('🔍 [Routes] Parsing form data...');

    // Debug: Show ALL request body keys
    console.log('📋 [Routes] All request body keys:', Object.keys(req.body));

    // Find and log metadata fields
    Object.keys(req.body).forEach(key => {
      if (key.includes('tempId') || key.includes('referencePdfs') || key.includes('experiencePdfs')) {
        console.log(`📋 [Routes] Metadata field: ${key} = "${req.body[key]}"`);
      }
    });

    // Parse JSON fields
    const fieldsToParse = ['selectedCVs', 'contactInfo', 'skills', 'references', 'workExperience', 'userInfo'];
    fieldsToParse.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (error) {
          console.log(`⚠️ [Routes] Failed to parse ${field}:`, error.message);
        }
      }
    });

    console.log('✅ [Routes] Form data parsed');
    console.log('📊 [Routes] Summary:', {
      references: req.body.references?.length || 0,
      workExperience: req.body.workExperience?.length || 0,
      selectedCVs: req.body.selectedCVs?.length || 0,
      metadataFields: Object.keys(req.body).filter(k => k.includes('tempId')).length
    });

  } catch (error) {
    console.error('❌ [Routes] Error:', error.message);
  }

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
    .custom((value) => {
      if (!value || !Array.isArray(value) || value.length === 0) {
        throw new Error('At least one CV must be selected');
      }
      return true;
    })
    .withMessage('At least one CV must be selected'),
  body('selectedCVs.*.cvId')
    .notEmpty()
    .withMessage('CV ID is required'),
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  body('contactInfo.phone')
    .optional()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('contactInfo.location')
    .optional()
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

// ✅ UPDATED: Apply for job
router.post(
  '/apply/:jobId',
  verifyToken,
  restrictTo('candidate'),
  localFileUpload.applicationWithFiles(),
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

// Get all company applications
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
  getCompanyApplicationDetails
);

// ===== ORGANIZATION ROUTES =====

// Get all organization applications
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
  getOrganizationApplicationDetails
);

// ===== SHARED ROUTES =====

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

// Get application details
router.get(
  '/:applicationId',
  verifyToken,
  getApplicationDetails
);
// ===== FILE ACCESS ROUTES =====

// Get all attachments for an application
router.get(
  '/:applicationId/attachments',
  verifyToken,
  getApplicationAttachments
);

// Download application file
router.get(
  '/:applicationId/files/:fileId/download',
  verifyToken,
  downloadApplicationFile
);

// View application file inline
router.get(
  '/:applicationId/files/:fileId/view',
  verifyToken,
  viewApplicationFile
);
// ===== CV SPECIFIC ROUTES =====

// Download CV
router.get(
  '/cv/:cvId/download',
  verifyToken,
  downloadCV
);

// View CV
router.get(
  '/cv/:cvId/view',
  verifyToken,
  viewCV
);
module.exports = router;