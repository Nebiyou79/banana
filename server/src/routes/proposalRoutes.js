// routes/proposalRoutes.js
/**
 * Proposal Routes
 * Base URL mounted at: /api/v1/proposals
 *
 * ROUTE ORDER RULES (mirrors B-09 pattern from freelanceTenderRoutes.js):
 *   Static named routes (/my-proposals, /create, /tenders/:tenderId/*)
 *   MUST be registered BEFORE any /:proposalId wildcard routes.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * Method | Path                                                    | Role        | Function
 * ─────────────────────────────────────────────────────────────────────────────────────────
 *
 * Group 1 — Tender-scoped (static prefix /tenders/:tenderId)
 * GET    | /tenders/:tenderId/proposals                            | company/org | getTenderProposals
 * GET    | /tenders/:tenderId/proposals/stats                      | company/org | getProposalStats
 * GET    | /tenders/:tenderId/my-proposal                          | freelancer  | getMyProposalForTender
 *
 * Group 2 — Static freelancer routes
 * GET    | /my-proposals                                           | freelancer  | getMyProposals
 * POST   | /create                                                 | freelancer  | createDraft
 *
 * Group 3 — /:proposalId routes (AFTER all static routes)
 * GET    | /:proposalId                                            | owner/self  | getProposalDetail
 * PUT    | /:proposalId                                            | freelancer  | updateDraft
 * POST   | /:proposalId/submit                                     | freelancer  | submitProposal
 * POST   | /:proposalId/withdraw                                   | freelancer  | withdrawProposal
 * PATCH  | /:proposalId/status                                     | company/org | updateProposalStatus
 * POST   | /:proposalId/shortlist                                  | company/org | toggleShortlist
 * POST   | /:proposalId/attachments                                | freelancer  | uploadAttachments
 * DELETE | /:proposalId/attachments/:attachmentId                  | freelancer  | deleteAttachment
 * GET    | /:proposalId/attachments/:attachmentId/download         | owner/self  | downloadAttachment
 * ─────────────────────────────────────────────────────────────────────────────────────────
 *
 * Mount in app.js / index.js:
 *   app.use('/api/v1/proposals', proposalRouter);
 */

const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { requireProposalOwner, requireTenderOwner } = require('../middleware/proposalOwnership');
const localFileUpload = require('../middleware/localFileUpload');
const controller = require('../controllers/proposalController');

// ── ALL ROUTES REQUIRE AUTHENTICATION ─────────────────────────────────────────
router.use(verifyToken);

// ════════════════════════════════════════════════════════════════════════════════
// GROUP 1 — TENDER-SCOPED ROUTES (static prefix — must come before /:proposalId)
// ════════════════════════════════════════════════════════════════════════════════

// List all (non-draft) proposals for a tender — owner only
router.get(
    '/tenders/:tenderId/proposals',
    restrictTo('company', 'organization', 'admin'),
    controller.getTenderProposals
);

// Proposal stats for a tender — owner only
// NOTE: /stats must be declared BEFORE /tenders/:tenderId/proposals/:proposalId
// to avoid Express matching "stats" as a proposalId
router.get(
    '/tenders/:tenderId/proposals/stats',
    restrictTo('company', 'organization', 'admin'),
    controller.getProposalStats
);

// Freelancer's own proposal for a specific tender (null if none — no 404)
router.get(
    '/tenders/:tenderId/my-proposal',
    restrictTo('freelancer', 'admin'),
    controller.getMyProposalForTender
);

// ════════════════════════════════════════════════════════════════════════════════
// GROUP 2 — STATIC FREELANCER ROUTES (must come before /:proposalId)
// ════════════════════════════════════════════════════════════════════════════════

// Freelancer's proposal list with filters, sort, pagination
router.get(
    '/my-proposals',
    restrictTo('freelancer', 'admin'),
    controller.getMyProposals
);

// Create a draft proposal (freelancer only)
router.post(
    '/create',
    restrictTo('freelancer', 'admin'),
    controller.createDraft
);

// ════════════════════════════════════════════════════════════════════════════════
// GROUP 3 — /:proposalId ROUTES (ALL wildcard routes AFTER static routes)
// ════════════════════════════════════════════════════════════════════════════════

// Get full proposal detail (owner or the submitting freelancer)
router.get(
    '/:proposalId',
    controller.getProposalDetail
);

// Update draft content (freelancer must own the draft)
router.put(
    '/:proposalId',
    restrictTo('freelancer', 'admin'),
    requireProposalOwner,
    controller.updateDraft
);

// Submit a draft proposal (transitions draft → submitted)
router.post(
    '/:proposalId/submit',
    restrictTo('freelancer', 'admin'),
    requireProposalOwner,
    controller.submitProposal
);

// Withdraw a submitted or under_review proposal
router.post(
    '/:proposalId/withdraw',
    restrictTo('freelancer', 'admin'),
    requireProposalOwner,
    controller.withdrawProposal
);

// Owner: change proposal status with valid transition guard
router.patch(
    '/:proposalId/status',
    restrictTo('company', 'organization', 'admin'),
    requireTenderOwner,
    controller.updateProposalStatus
);

// Owner: toggle shortlist flag (optimistically mirrored on frontend)
router.post(
    '/:proposalId/shortlist',
    restrictTo('company', 'organization', 'admin'),
    requireTenderOwner,
    controller.toggleShortlist
);

// ── ATTACHMENTS ───────────────────────────────────────────────────────────────

// Upload up to 5 files per request (max 10 total on the proposal)
router.post(
    '/:proposalId/attachments',
    restrictTo('freelancer', 'admin'),
    requireProposalOwner,
    localFileUpload.multiple('attachments', 5, 'proposals'),
    controller.uploadAttachments
);

// Delete a specific attachment and its physical file
router.delete(
    '/:proposalId/attachments/:attachmentId',
    restrictTo('freelancer', 'admin'),
    requireProposalOwner,
    controller.deleteAttachment
);

// Stream-download an attachment (proposal owner or tender owner)
router.get(
    '/:proposalId/attachments/:attachmentId/download',
    controller.downloadAttachment
);

module.exports = router;