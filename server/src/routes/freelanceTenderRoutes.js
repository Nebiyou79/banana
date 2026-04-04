// src/freelance/freelanceTenderRoutes.js
/**
 * Freelance Tenders Routes
 * Base URL: /api/v1/freelance-tenders
 *
 * ROUTE ORDER RULES (B-09):
 *   Static named routes (/categories, /my-tenders, /saved, /create)
 *   MUST be registered BEFORE any /:id wildcard routes.
 *   Express matches routes in declaration order — if /:id comes first,
 *   a request to /saved is matched with id="saved" → CastError 500.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Method | Path                                    | Auth          | Description
 * ─────────────────────────────────────────────────────────────────────────────
 * GET    | /categories                             | Public        | Get grouped categories
 * GET    | /                                       | Freelancer    | Browse published tenders
 * GET    | /my-tenders                             | Company/Org   | My posted tenders
 * GET    | /saved                                  | Freelancer    | My saved tenders
 * POST   | /create                                 | Company/Org   | Create new tender
 * GET    | /:id                                    | Any Auth      | Get single tender
 * GET    | /:id/edit-data                          | Company/Org   | Get tender for editing
 * GET    | /:id/stats                              | Owner         | Tender stats
 * GET    | /:id/applications                       | Owner         | List applications
 * PUT    | /:id                                    | Owner         | Update tender
 * DELETE | /:id                                    | Owner         | Soft-delete tender
 * POST   | /:id/publish                            | Owner         | Publish draft tender
 * POST   | /:id/apply                              | Freelancer    | Submit application
 * PATCH  | /:id/applications/:appId/status         | Owner         | Update application status
 * POST   | /:id/toggle-save                        | Freelancer    | Save / unsave tender
 * POST   | /:id/attachments/upload                 | Owner         | Upload extra attachments
 * GET    | /:id/attachments/:attachmentId/download | Any Auth      | Stream file download
 * GET    | /:id/attachments/:attachmentId/preview  | Any Auth      | Inline file preview
 * DELETE | /:id/attachments/:attachmentId          | Owner         | Delete attachment
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const controller = require('../controllers/freelanceTenderController');
const localFileUpload = require('../middleware/localFileUpload');

// ── PUBLIC ─────────────────────────────────────────────────────────────────────
// FIX B-04: Returns grouped {Category: [subcategories]} object, not a flat array
router.get('/categories', controller.getCategories);

// ── STATIC NAMED ROUTES — MUST ALL APPEAR BEFORE /:id ─────────────────────────

// Browse published tenders (freelancers only)
router.get(
    '/',
    verifyToken,
    restrictTo('freelancer', 'admin'),
    controller.getFreelanceTenders
);

// My posted tenders (company / org owners)
router.get(
    '/my-tenders',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.getMyPostedTenders
);

// FIX B-09: /saved MUST be declared before /:id — otherwise Express matches
// id="saved" on the wildcard route → Mongoose CastError 500
router.get(
    '/saved',
    verifyToken,
    restrictTo('freelancer', 'admin'),
    controller.getSavedFreelanceTenders
);

// Create a new tender (accepts up to 20 document uploads)
router.post(
    '/create',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    localFileUpload.multiple('documents', 20, 'freelance-tenders'),
    controller.createFreelanceTender
);

// ── BY ID — ALL /:id ROUTES MUST COME AFTER STATIC NAMED ROUTES ───────────────

// Get single tender (owner sees full data + applications; freelancer sees public view)
router.get('/:id', verifyToken, controller.getFreelanceTender);

// Get tender data pre-populated for the edit form
router.get(
    '/:id/edit-data',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.getFreelanceTender   // same handler — returns full data for owner
);

// Tender analytics / stats (owner only)
router.get(
    '/:id/stats',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.getFreelanceTenderStats
);

// List all applications for a tender (owner only)
router.get(
    '/:id/applications',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.getTenderApplications
);

// ── TENDER MANAGEMENT ──────────────────────────────────────────────────────────

router.put(
    '/:id',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    localFileUpload.multiple('documents', 20, 'freelance-tenders'),
    controller.updateFreelanceTender
);

router.delete(
    '/:id',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.deleteFreelanceTender
);

router.post(
    '/:id/publish',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.publishFreelanceTender
);

// ── APPLICATIONS ───────────────────────────────────────────────────────────────

// Submit an application (freelancers may attach a CV)
router.post(
    '/:id/apply',
    verifyToken,
    restrictTo('freelancer', 'admin'),
    localFileUpload.multiple('cv', 1, 'applications'),
    controller.submitApplication
);

// Update a single application's status (owner only)
router.patch(
    '/:id/applications/:appId/status',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.updateApplicationStatus
);

// ── SAVE / UNSAVE ──────────────────────────────────────────────────────────────

router.post(
    '/:id/toggle-save',
    verifyToken,
    restrictTo('freelancer', 'admin'),
    controller.toggleSaveFreelanceTender
);

// ── ATTACHMENTS ────────────────────────────────────────────────────────────────

// Upload additional documents to an existing tender
router.post(
    '/:id/attachments/upload',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    localFileUpload.multiple('documents', 20, 'freelance-tenders'),
    controller.uploadAdditionalAttachments
);

// FIX B-05: File download goes through the API — NEVER via a static /uploads URL
// The controller streams the file with res.download() and builds the URL on-the-fly
router.get(
    '/:id/attachments/:attachmentId/download',
    verifyToken,
    controller.downloadAttachment
);

// Inline preview (images and PDFs only)
router.get(
    '/:id/attachments/:attachmentId/preview',
    verifyToken,
    controller.previewAttachment
);

// Delete a specific attachment (owner only)
router.delete(
    '/:id/attachments/:attachmentId',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.deleteAttachment
);

module.exports = router;