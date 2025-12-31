const express = require('express');
const router = express.Router();
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const tenderController = require('../controllers/tenderController');
const { handleTenderUpload } = require('../middleware/tenderUploadMiddleware');

// ============ PUBLIC ROUTES ============

// Get categories
router.get('/categories', tenderController.getCategories);
router.get('/categories/label/:categoryId', tenderController.getCategoryLabel);

// Get tenders (public with optional auth for filtering)
router.get('/', optionalAuth, tenderController.getTenders);

// Get single tender (with access control)
router.get('/:id', optionalAuth, tenderController.getTender);

// ============ AUTHENTICATED ROUTES ============

// Apply authentication middleware to all routes below
router.use(verifyToken);

// ============ TENDER CREATION ROUTES ============

// Create freelance tender (Organizations & Companies only)
router.post(
  '/freelance/create',
  restrictTo('organization', 'company', 'admin'),
  handleTenderUpload,
  tenderController.createFreelanceTender
);

// Create professional tender (Organizations & Companies only)
router.post(
  '/professional/create',
  restrictTo('organization', 'company', 'admin'),
  handleTenderUpload,
  tenderController.createProfessionalTender
);

// ============ TENDER MANAGEMENT ROUTES ============

// Update tender (owner only)
router.put(
  '/:id',
  handleTenderUpload,
  tenderController.updateTender
);

// Delete tender (owner only)
router.delete(
  '/:id',
  tenderController.deleteTender
);

// Publish tender (owner only)
router.post(
  '/:id/publish',
  tenderController.publishTender
);

// Reveal proposals for closed tender (owner only)
router.post(
  '/:id/reveal-proposals',
  tenderController.revealProposals
);

// ============ USER-SPECIFIC ROUTES ============

// Get user's tenders
router.get(
  '/user/my-tenders',
  tenderController.getMyTenders
);

// Toggle save tender
router.post(
  '/:id/toggle-save',
  tenderController.toggleSaveTender
);

// Get saved tenders
router.get(
  '/user/saved',
  tenderController.getSavedTenders
);

// Get tender statistics (owner only)
router.get(
  '/:id/stats',
  tenderController.getTenderStats
);
// ============ OWNER-SPECIFIC ROUTES ============

// Get tender for owner (bypasses visibility)
router.get(
  '/owner/:id',
  tenderController.getOwnerTender
);

// Get tenders owned by user
router.get(
  '/user/owned',
  tenderController.getOwnedTenders
);

// Get pre-filled tender data for editing
router.get(
  '/:id/edit-data',
  tenderController.getTenderForEditing
);

// Update tender route (existing)
router.put(
  '/:id',
  handleTenderUpload,
  tenderController.updateTender
);
// ============ INVITATION MANAGEMENT ROUTES ============

// Invite users to tender (owner only, professional invite-only tenders)
router.post(
  '/:id/invite',
  restrictTo('organization', 'company', 'admin'),
  tenderController.inviteUsersToTender
);

// Respond to invitation
router.post(
  '/:id/invitations/:inviteId/respond',
  restrictTo('company'), // Only companies can respond to professional tender invitations
  tenderController.respondToInvitation
);

// Get user's invitations
router.get(
  '/user/invitations',
  restrictTo('company'), // Only companies get professional tender invitations
  tenderController.getMyInvitations
);
// In TenderRoutes.js, add this route:

// Download attachment
router.get(
  '/:id/attachments/:attachmentId/download',
  verifyToken,
  tenderController.downloadAttachment
);

// Preview attachment (if needed)
router.get(
  '/:id/attachments/:attachmentId/preview',
  verifyToken,
  tenderController.previewAttachment
);
// ============ PROPOSAL ROUTES (FOR FUTURE EXTENSION) ============

// Note: Proposal routes will be added in a separate proposalRoutes.js file
// These are placeholder routes for future implementation

// Apply to tender
router.post(
  '/:id/apply',
  (req, res, next) => {
    // This will be implemented in proposal controller
    res.status(501).json({
      success: false,
      message: 'Proposal system not yet implemented'
    });
  }
);

// Get tender proposals (owner only)
router.get(
  '/:id/proposals',
  (req, res, next) => {
    // This will be implemented in proposal controller
    res.status(501).json({
      success: false,
      message: 'Proposal system not yet implemented'
    });
  }
);

module.exports = router;