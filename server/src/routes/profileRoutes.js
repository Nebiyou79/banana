const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const roleProfileController = require('../controllers/roleProfileController');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  uploadAvatar,
  uploadCoverPhoto,
  validateFileType,
  validateFileSize
} = require('../middleware/upload');
const {
  validateProfileUpdate,
  validateProfessionalInfo,
  validateSocialLinks,
  validateVerification,
  validateCandidateProfile,
  validateCompanyProfile,
  validateFreelancerProfile,
  validateOrganizationProfile,
  validatePrivacySettings,
  validateNotificationPreferences
} = require('../middleware/profileValidation');

// Apply authentication middleware to all routes
router.use(verifyToken);

// ========== MAIN PROFILE ROUTES ==========

// Get current profile
router.get('/', profileController.getProfile);

// Update profile
router.put('/', validateProfileUpdate, profileController.updateProfile);

// Get public profile by user ID
router.get('/public/:id', profileController.getPublicProfile);

// Upload avatar with validation
router.post('/avatar',
  uploadAvatar,
  validateFileType(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  validateFileSize(5), // 5MB
  profileController.uploadAvatar
);

// Upload cover photo with validation
router.post('/cover-photo',
  uploadCoverPhoto,
  validateFileType(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  validateFileSize(10), // 10MB
  profileController.uploadCoverPhoto
);

// Update professional info
router.put('/professional-info', validateProfessionalInfo, profileController.updateProfessionalInfo);

// Update social links
router.put('/social-links', validateSocialLinks, profileController.updateSocialLinks);

// Get profile completion
router.get('/completion', profileController.getProfileCompletion);

// Submit verification
router.post('/verification', validateVerification, profileController.submitVerification);

// Update privacy settings
router.put('/privacy-settings', validatePrivacySettings, profileController.updatePrivacySettings);

// Update notification preferences
router.put('/notification-preferences', validateNotificationPreferences, profileController.updateNotificationPreferences);

// Get profile summary
router.get('/summary', profileController.getProfileSummary);

// Update social stats (admin/internal use)
router.put('/social-stats', profileController.updateSocialStats);

// ========== PUBLIC PROFILE ROUTES (No Auth Required) ==========

// Get popular profiles
router.get('/popular', profileController.getPopularProfiles);

// Search profiles
router.get('/search', profileController.searchProfiles);

// ========== ROLE-SPECIFIC PROFILE ROUTES ==========

// Candidate routes
router.get('/candidate', roleProfileController.getCandidateProfile);
router.put('/candidate', validateCandidateProfile, roleProfileController.updateCandidateProfile);

// Company routes
router.get('/company', roleProfileController.getCompanyProfile);
router.put('/company', validateCompanyProfile, roleProfileController.updateCompanyProfile);

// Freelancer routes
router.get('/freelancer', roleProfileController.getFreelancerProfile);
router.put('/freelancer', validateFreelancerProfile, roleProfileController.updateFreelancerProfile);

// Organization routes
router.get('/organization', roleProfileController.getOrganizationProfile);
router.put('/organization', validateOrganizationProfile, roleProfileController.updateOrganizationProfile);

// 404 handler for profile routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Profile route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

module.exports = router;