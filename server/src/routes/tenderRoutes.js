// tenderRoutes.js - COMPLETELY FIXED WITH PROPER ROUTE ORDER
const express = require('express');
const router = express.Router();
const path = require('path'); // ADD THIS - was missing
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const tenderController = require('../controllers/tenderController');
const localFileUpload = require('../middleware/localFileUpload');
const Tender = require('../models/Tender');
const crypto = require('crypto');
const fs = require('fs');

// Helper to detect Windows absolute paths
const isWindowsPath = (p) => Boolean(p && typeof p === 'string' && /^[A-Za-z]:\\/.test(p));

// ============ CRITICAL: ORDER MATTERS - SPECIFIC ROUTES FIRST ============

// PUBLIC ROUTES (NO AUTH REQUIRED)
router.get('/categories', tenderController.getCategories);
router.get('/categories/label/:categoryId', tenderController.getCategoryLabel);

// ============ DEDICATED TYPE-SPECIFIC ROUTES ============
// These must come BEFORE generic /:id routes

// Get professional tenders (for companies)
router.get(
  '/professional',
  verifyToken,
  restrictTo('company', 'admin'),
  tenderController.getProfessionalTenders
);

// Get freelance tenders (for freelancers)
router.get(
  '/freelance',
  verifyToken,
  restrictTo('freelancer', 'admin'),
  tenderController.getFreelanceTenders
);

// Get tenders list (public with optional auth)
router.get('/', tenderController.getTenders);

// ============ AUTHENTICATED USER-SPECIFIC ROUTES ============
router.get('/user/my-tenders', verifyToken, tenderController.getMyTenders);
router.get('/user/saved', verifyToken, tenderController.getSavedTenders);
router.get('/user/invitations', verifyToken, restrictTo('company'), tenderController.getMyInvitations);
router.get('/user/owned', verifyToken, tenderController.getOwnedTenders);

// ============ OWNER-SPECIFIC ROUTES ============
router.get('/owner/:id', verifyToken, tenderController.getOwnerTender);
router.get('/:id/edit-data', verifyToken, tenderController.getTenderForEditing);

// ============ SINGLE TENDER ROUTES ============
// Generic /:id routes come after specific ones
// IMPORTANT: This route requires authentication for viewing tenders
router.get('/:id', verifyToken, tenderController.getTender);

// Get tender statistics (owner only)
router.get('/:id/stats', verifyToken, tenderController.getTenderStats);

// ============ TENDER CREATION ROUTES ============
router.post(
  '/freelance/create',
  verifyToken,
  restrictTo('organization', 'company', 'admin'),
  localFileUpload.multiple('documents', 20, 'tenders'),
  tenderController.createFreelanceTender
);

router.post(
  '/professional/create',
  verifyToken,
  restrictTo('organization', 'company', 'admin'),
  localFileUpload.multiple('documents', 20, 'tenders'),
  tenderController.createProfessionalTender
);

// ============ TENDER MANAGEMENT ROUTES ============
router.put(
  '/:id',
  verifyToken,
  localFileUpload.multiple('documents', 20, 'tenders'),
  tenderController.updateTender
);

router.delete(
  '/:id',
  verifyToken,
  tenderController.deleteTender
);

router.post(
  '/:id/publish',
  verifyToken,
  tenderController.publishTender
);

router.post(
  '/:id/reveal-proposals',
  verifyToken,
  tenderController.revealProposals
);

router.post(
  '/:id/toggle-save',
  verifyToken,
  tenderController.toggleSaveTender
);

// ============ ATTACHMENT MANAGEMENT ROUTES ============
router.get('/uploads/download/:folder/:filename', (req, res) => {
  try {
    const { folder, filename } = req.params;

    // Security: Prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const sanitizedFolder = path.basename(folder);

    // ============ UNIVERSAL PATH RESOLUTION ============
    const uploadBase = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');

    const possiblePaths = [
      path.join(uploadBase, sanitizedFolder, sanitizedFilename),          // priority 1: UPLOAD_BASE_PATH + folder
      path.join('/app', 'uploads', sanitizedFolder, sanitizedFilename),   // priority 2: Docker explicit
      path.join(process.cwd(), 'uploads', sanitizedFolder, sanitizedFilename), // priority 3: fallback
      path.join(uploadBase, sanitizedFilename),                           // priority 4: without folder
    ].filter(p => p && !isWindowsPath(p)); // Filter out Windows paths

    let filePath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }

    if (!filePath) {
      console.error('File not found. Searched paths:', possiblePaths);
      return res.status(404).json({
        success: false,
        error: 'File not found',
        requested: { folder, filename },
        searchedPaths: possiblePaths
      });
    }

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({
      success: false,
      error: 'Error serving file',
      message: error.message
    });
  }
});

// ============ ATTACHMENT ROUTES WITH PROPER AUTH ============

// Download attachment - requires authentication
router.get(
  '/:id/attachments/:attachmentId/download',
  verifyToken,
  tenderController.downloadAttachment
);

// Preview attachment - requires authentication
router.get(
  '/:id/attachments/:attachmentId/preview',
  verifyToken,
  tenderController.previewAttachment
);

// Upload additional attachments (owner only)
router.post(
  '/:id/attachments/upload',
  verifyToken,
  localFileUpload.multiple('documents', 20, 'tenders'),
  async (req, res) => {
    try {
      const tender = await Tender.findById(req.params.id);
      if (!tender) {
        return res.status(404).json({
          success: false,
          message: 'Tender not found'
        });
      }

      // Check if user owns the tender (company OR organization)
      if (tender.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to upload attachments'
        });
      }

      const attachments = [];

      if (req.uploadedFiles && req.uploadedFiles.success && req.uploadedFiles.files) {
        console.log(`📎 Processing ${req.uploadedFiles.files.length} local files for attachment upload`);

        req.uploadedFiles.files.forEach((file, index) => {
          const fileHash = crypto
            .createHash('md5')
            .update(file.path + Date.now() + index)
            .digest('hex');

          attachments.push({
            originalName: file.originalName,
            fileName: file.fileName,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path,
            url: `/uploads/tenders/${file.fileName}`,
            downloadUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/v1/tender/${tender._id}/attachments/download/${file.fileName}`,
            description: req.body.descriptions?.[index] || '',
            uploadedBy: req.user._id,
            uploadedAt: new Date(),
            documentType: req.body.types?.[index] || 'other',
            version: 1,
            fileHash: fileHash
          });
        });
      }

      if (attachments.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files were uploaded'
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

// Delete attachment (owner only)
router.delete(
  '/:id/attachments/:attachmentId',
  verifyToken,
  async (req, res) => {
    try {
      const tender = await Tender.findById(req.params.id);
      if (!tender) {
        return res.status(404).json({
          success: false,
          message: 'Tender not found'
        });
      }

      // Check if user owns the tender (company OR organization)
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

      // Delete local file if it exists
      if (attachment.path && fs.existsSync(attachment.path)) {
        try {
          fs.unlinkSync(attachment.path);
          console.log(`🗑️ Deleted file: ${attachment.path}`);
        } catch (unlinkError) {
          console.warn('Failed to delete file:', unlinkError);
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

// Invite users to tender (owner only)
router.post(
  '/:id/invite',
  verifyToken,
  restrictTo('organization', 'company', 'admin'),
  tenderController.inviteUsersToTender
);

// Respond to invitation
router.post(
  '/:id/invitations/:inviteId/respond',
  verifyToken,
  restrictTo('company'),
  tenderController.respondToInvitation
);

module.exports = router;