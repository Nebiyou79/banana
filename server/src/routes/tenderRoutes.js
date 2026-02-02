// tenderRoutes.js - COMPLETE UPDATED FILE
const express = require('express');
const router = express.Router();
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const tenderController = require('../controllers/tenderController');

// ==== IMPORT NEW CLOUDINARY MIDDLEWARE ====
const cloudinaryFileUpload = require('../middleware/cloudinaryFileUpload');

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
  cloudinaryFileUpload.multiple, // For multiple document uploads
  tenderController.createFreelanceTender
);

// Create professional tender (Organizations & Companies only)
router.post(
  '/professional/create',
  restrictTo('organization', 'company', 'admin'),
  cloudinaryFileUpload.multiple, // For multiple document uploads
  tenderController.createProfessionalTender
);

// ============ TENDER MANAGEMENT ROUTES ============

// Update tender (owner only) - supports file uploads
router.put(
  '/:id',
  cloudinaryFileUpload.multiple, // For multiple document uploads
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

// ============ ATTACHMENT MANAGEMENT ROUTES ============

// Download attachment
router.get(
  '/:id/attachments/:attachmentId/download',
  tenderController.downloadAttachment
);

// Preview attachment
router.get(
  '/:id/attachments/:attachmentId/preview',
  tenderController.previewAttachment
);

// Upload additional attachments to tender
router.post(
  '/:id/attachments/upload',
  cloudinaryFileUpload.multiple,
  async (req, res) => {
    try {
      const tender = await Tender.findById(req.params.id);
      if (!tender) {
        return res.status(404).json({
          success: false,
          message: 'Tender not found'
        });
      }

      // Check if user owns the tender
      if (tender.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to upload attachments'
        });
      }

      const attachments = [];
      if (req.cloudinaryFiles && req.cloudinaryFiles.success && req.cloudinaryFiles.files) {
        req.cloudinaryFiles.files.forEach((cloudinaryFile, index) => {
          if (cloudinaryFile.success === false) return;

          const cloudinaryData = cloudinaryFile.cloudinary;

          attachments.push({
            filename: cloudinaryData.public_id,
            originalName: cloudinaryFile.originalName,
            path: cloudinaryData.secure_url,
            fileSize: cloudinaryFile.size,
            fileType: cloudinaryFile.mimetype,
            description: req.body.descriptions?.[index] || '',
            uploadedBy: req.user._id,
            uploadedAt: new Date(),
            documentType: req.body.types?.[index] || 'other',
            version: 1,
            fileHash: cloudinaryData.public_id,
            cloudinaryPublicId: cloudinaryData.public_id,
            cloudinaryUrl: cloudinaryData.secure_url,
            cloudinaryFormat: cloudinaryData.format,
            cloudinaryResourceType: cloudinaryData.resource_type
          });
        });
      }

      tender.attachments.push(...attachments);
      await tender.save();

      res.status(200).json({
        success: true,
        message: `${attachments.length} attachment(s) uploaded successfully`,
        data: { attachments }
      });
    } catch (error) {
      console.error('Error uploading attachments:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading attachments',
        error: error.message
      });
    }
  }
);

// Delete attachment from tender
router.delete(
  '/:id/attachments/:attachmentId',
  async (req, res) => {
    try {
      const tender = await Tender.findById(req.params.id);
      if (!tender) {
        return res.status(404).json({
          success: false,
          message: 'Tender not found'
        });
      }

      // Check if user owns the tender
      if (tender.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete attachments'
        });
      }

      const attachment = tender.attachments.id(req.params.attachmentId);
      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found'
        });
      }

      // If it's a Cloudinary attachment, delete from Cloudinary
      if (attachment.cloudinaryPublicId) {
        // You would need to import and use Cloudinary service here
        const { deleteFromCloudinary } = require('../config/cloudinary');
        const deleteResult = await deleteFromCloudinary(
          attachment.cloudinaryPublicId,
          attachment.cloudinaryResourceType || 'raw'
        );

        if (!deleteResult.success) {
          console.warn('Failed to delete from Cloudinary:', deleteResult.error);
        }
      }

      // Remove from tender attachments
      tender.attachments.pull({ _id: req.params.attachmentId });
      await tender.save();

      res.status(200).json({
        success: true,
        message: 'Attachment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting attachment',
        error: error.message
      });
    }
  }
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

module.exports = router;