// server/src/routes/profileRoutes.js
const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profileController');
const roleProfileController = require('../controllers/roleProfileController');
const { verifyToken } = require('../middleware/authMiddleware');
const cloudinaryMediaUpload = require('../middleware/cloudinaryMediaUpload');

// =====================
// AUTH MIDDLEWARE
// =====================
router.use(verifyToken);

// =====================
// MAIN PROFILE ROUTES
// =====================

// Get current profile
router.get('/', profileController.getProfile);

// Update profile
router.put('/', profileController.updateProfile);

// Get public profile by user ID
router.get('/public/:id', profileController.getPublicProfile);

// =====================
// CLOUDINARY UPLOAD ROUTES
// =====================

// ========== UPLOAD ROUTES WITH CLOUDINARY ==========
router.post(
  '/avatar',
  cloudinaryMediaUpload.avatar, // This creates req.cloudinaryAvatar
  profileController.uploadAvatar
);

// Cover photo upload with cloudinaryMediaUpload.cover middleware
router.post(
  '/cover',
  cloudinaryMediaUpload.cover, // This creates req.cloudinaryCover
  profileController.uploadCoverPhoto
);

// Delete avatar
router.delete('/avatar', profileController.deleteAvatar);

// Delete cover photo
router.delete('/cover', profileController.deleteCoverPhoto);

// Test upload route
router.get('/test-upload', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Upload routes are available',
    routes: {
      avatar: 'POST /api/v1/profile/avatar',
      cover: 'POST /api/v1/profile/cover',
      deleteAvatar: 'DELETE /api/v1/profile/avatar',
      deleteCover: 'DELETE /api/v1/profile/cover'
    }
  });
});

// =====================
// PROFILE DATA UPDATES
// =====================

// Professional information
router.put('/professional-info', profileController.updateProfessionalInfo);

// Social links
router.put('/social-links', profileController.updateSocialLinks);

// Profile completion
router.get('/completion', profileController.getProfileCompletion);

// Verification
router.post('/verification', profileController.submitVerification);

// Privacy settings
router.put('/privacy-settings', profileController.updatePrivacySettings);

// Notification preferences
router.put('/notification-preferences', profileController.updateNotificationPreferences);

// Profile summary
router.get('/summary', profileController.getProfileSummary);

// =====================
// PUBLIC ROUTES (NO AUTH REQUIRED)
// =====================

// Popular profiles
router.get('/popular', profileController.getPopularProfiles);

// Search profiles
router.get('/search', profileController.searchProfiles);

// =====================
// ROLE-SPECIFIC ROUTES
// =====================

// Candidate routes
router.get('/candidate', roleProfileController.getCandidateProfile);
router.put('/candidate', roleProfileController.updateCandidateProfile);

// Company routes
router.get('/company', roleProfileController.getCompanyProfile);
router.put('/company', roleProfileController.updateCompanyProfile);

// Freelancer routes
router.get('/freelancer', roleProfileController.getFreelancerProfile);
router.put('/freelancer', roleProfileController.updateFreelancerProfile);

// Organization routes
router.get('/organization', roleProfileController.getOrganizationProfile);
router.put('/organization', roleProfileController.updateOrganizationProfile);

// =====================
// ADMIN/INTERNAL ROUTES
// =====================

// Social stats update (admin/internal use)
router.put('/social-stats', profileController.updateSocialStats);

// =====================
// HEALTH CHECK ROUTE
// =====================
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Profile routes are working',
    timestamp: new Date().toISOString(),
    user: req.user ? {
      id: req.user.userId,
      role: req.user.role
    } : null
  });
});

module.exports = router;