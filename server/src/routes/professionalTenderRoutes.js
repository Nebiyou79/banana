// backend/src/routes/professionalTenderRoutes.js
// BUG-C5 FIX: Added two public (no-auth) RFQ document routes.
//             These MUST be registered before the /:id param routes.
//
// Only the NEW routes are shown here with their exact insertion position.
// The rest of the file is unchanged — do NOT modify anything else.
//
// ─────────────────────────────────────────────────────────────────────
// PASTE INSTRUCTIONS:
//   1. At the top of the file, add the publicRFQ controller import:
//        const publicRFQController = require('../controllers/publicRFQ.controller');
//      OR merge the two functions into professionalTenderController and import from there.
//
//   2. After the '/categories' route (line ~54 in original), add:
// ─────────────────────────────────────────────────────────────────────

/**
 * COMPLETE UPDATED FILE
 * Only changed lines are: import addition + 2 new route registrations.
 * All other routes are identical to the original.
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const controller = require('../controllers/professionalTenderController');
// BUG-C5 FIX: import the public RFQ handlers
const publicRFQController = require('../controllers/publicRFQ.controller');
const localFileUpload = require('../middleware/localFileUpload');

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES — no auth required
// ══════════════════════════════════════════════════════════════════════════════

router.get('/categories', controller.getCategories);

// BUG-C5 FIX: Public RFQ download — MUST be before /:id routes
// Anyone (including unauthenticated users) can download the bidding process doc.
router.get('/:id/public-rfq', publicRFQController.downloadPublicRFQ);
router.get('/:id/public-rfq/preview', publicRFQController.previewPublicRFQ);

// ══════════════════════════════════════════════════════════════════════════════
// STATIC NAMED ROUTES — ALL must be registered before ANY /:id route
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    '/generate-ref',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.generateReferenceNumber
);

router.get(
    '/',
    verifyToken,
    restrictTo('company', 'admin'),
    controller.getProfessionalTenders
);

router.get(
    '/my-tenders',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.getMyPostedTenders
);

router.get(
    '/my-invitations',
    verifyToken,
    restrictTo('company', 'admin'),
    controller.getMyInvitations
);

router.get(
    '/saved',
    verifyToken,
    restrictTo('company', 'admin'),
    controller.getSavedProfessionalTenders
);

router.get(
    '/companies/list',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.getCompaniesForInvitation
);

router.post(
    '/create',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    localFileUpload.multiple('documents', 20, 'professional-tenders'),
    controller.createProfessionalTender
);

// ══════════════════════════════════════════════════════════════════════════════
// PARAMETERIZED ROUTES — all /:id routes MUST come after static routes
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    '/:id/edit-data',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.getProfessionalTender
);

router.get(
    '/:id/stats',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.getProfessionalTenderStats
);

router.get(
    '/:id',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.getProfessionalTender
);

router.put(
    '/:id',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    localFileUpload.multiple('documents', 20, 'professional-tenders'),
    controller.updateProfessionalTender
);

router.delete(
    '/:id',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.deleteProfessionalTender
);

router.post(
    '/:id/publish',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.publishProfessionalTender
);

router.post(
    '/:id/addendum',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    localFileUpload.multiple('documents', 5, 'addenda'),
    controller.issueAddendum
);

router.get('/:id/addendum', verifyToken, controller.getAddenda);

router.post(
    '/:id/reveal-bids',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.revealBids
);

router.post(
    '/:id/invite',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.inviteCompanies
);

router.post(
    '/:id/invitations/:inviteId/respond',
    verifyToken,
    restrictTo('company', 'admin'),
    controller.respondToInvitation
);

router.post(
    '/:id/cpo',
    verifyToken,
    restrictTo('company', 'admin'),
    localFileUpload.multiple('document', 1, 'cpo'),
    controller.submitCPO
);

router.get('/:id/cpo', verifyToken, controller.getCPOSubmissions);

router.patch(
    '/:id/cpo/:cpoId/verify',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.verifyCPO
);

router.post(
    '/:id/toggle-save',
    verifyToken,
    restrictTo('company', 'admin'),
    controller.toggleSaveProfessionalTender
);

router.post(
    '/:id/attachments/upload',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    localFileUpload.multiple('documents', 20, 'professional-tenders'),
    controller.uploadAdditionalAttachments
);

router.get('/:id/attachments/:attachmentId/download', verifyToken, controller.downloadAttachment);
router.get('/:id/attachments/:attachmentId/preview', verifyToken, controller.previewAttachment);

router.delete(
    '/:id/attachments/:attachmentId',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    controller.deleteAttachment
);

module.exports = router;