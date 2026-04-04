// backend/src/routes/bidRoutes.js
// ✅ FIXED: All route-level bugs from BidSystem_Analysis_FixPrompt.docx applied
//
// FIX SUMMARY:
//   BUG-15 / F-3 → Added role restrictions to getBids, withdrawBid, getMyAllBids
//   Section E     → Added 3 new routes: evaluate, cpo/return, compliance

/**
 * Bid Routes
 * Base URL: /api/v1/bids
 * Mount in server.js: app.use('/api/v1/bids', bidRoutes);
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * Method  | Path                                                  | Auth                | Description
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * GET     | /my-bids                                              | company,admin       | My bids (paginated) — STATIC FIRST
 * POST    | /:tenderId                                            | company             | Submit a bid
 * GET     | /:tenderId                                            | company,org,admin   | Get bids for a tender
 * GET     | /:tenderId/my-bid                                     | company,admin       | Get current user's own bid — STATIC before /:bidId
 * PUT     | /:tenderId/:bidId                                     | company             | Update a bid
 * DELETE  | /:tenderId/:bidId                                     | company,admin       | Withdraw a bid
 * PATCH   | /:tenderId/:bidId/status                              | company,org,admin   | Update bid status (owner only — enforced in controller)
 * POST    | /:tenderId/:bidId/evaluate                            | company,org,admin   | Submit evaluation score (3-step Ethiopian process)
 * PATCH   | /:tenderId/:bidId/cpo/return                          | company,org,admin   | Record CPO return to losing bidder
 * PATCH   | /:tenderId/:bidId/compliance                          | company,org,admin   | Update compliance document checklist
 * GET     | /:tenderId/:bidId/documents/:fileName/download        | company,org,admin   | Download a bid document
 * GET     | /:tenderId/:bidId/documents/:fileName/preview         | company,org,admin   | Preview a bid document inline
 * ─────────────────────────────────────────────────────────────────────────────────────────
 *
 * ⚠️  CRITICAL ROUTE ORDERING RULES:
 *   1. /my-bids MUST be registered before /:tenderId (static before parameterized)
 *   2. /:tenderId/my-bid MUST be registered before /:tenderId/:bidId
 *   3. /:tenderId/:bidId/cpo/return MUST be registered before /:tenderId/:bidId/:any
 *      (Express matches from top to bottom — order matters)
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const bidController = require('../controllers/bidController');
const bidDocumentController = require('../controllers/bidDocumentController');
const localFileUpload = require('../middleware/localFileUpload');

// ══════════════════════════════════════════════════════════════
// STATIC NAMED ROUTES
// MUST be registered before any /:tenderId route
// ══════════════════════════════════════════════════════════════

// BUG-15 / F-3 FIX: Added restrictTo — only company and admin have personal bids
router.get(
    '/my-bids',
    verifyToken,
    restrictTo('company', 'admin'),
    bidController.getMyAllBids
);

// ══════════════════════════════════════════════════════════════
// /:tenderId routes
// ══════════════════════════════════════════════════════════════

// Submit a bid (company only — enforced by both restrictTo and controller)
router.post(
    '/:tenderId',
    verifyToken,
    restrictTo('company'),
    localFileUpload.multiple('documents', 15, 'bids'),
    bidController.submitBid
);

// BUG-15 / F-3 FIX: Added role restriction — organizations also need to view bids on their tenders
router.get(
    '/:tenderId',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    bidController.getBids
);

// ── CRITICAL: /my-bid must come BEFORE /:tenderId/:bidId ─────────────
router.get(
    '/:tenderId/my-bid',
    verifyToken,
    restrictTo('company', 'admin'),
    bidController.getMyBid
);

// ══════════════════════════════════════════════════════════════
// /:tenderId/:bidId routes
// ORDERING: static sub-paths (cpo/return, compliance, evaluate)
// MUST be before parameterized doc routes
// ══════════════════════════════════════════════════════════════

// Update a bid (original bidder only — enforced in controller)
router.put(
    '/:tenderId/:bidId',
    verifyToken,
    restrictTo('company'),
    localFileUpload.multiple('documents', 15, 'bids'),
    bidController.updateBid
);

// BUG-15 / F-3 FIX: Added restrictTo — only company or admin can withdraw
router.delete(
    '/:tenderId/:bidId',
    verifyToken,
    restrictTo('company', 'admin'),
    bidController.withdrawBid
);

// Update bid status — company, org and admin allowed (owner check enforced in controller)
router.patch(
    '/:tenderId/:bidId/status',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    bidController.updateBidStatus
);

// NEW (D-1): Submit evaluation score — 3-step Ethiopian procurement evaluation
router.post(
    '/:tenderId/:bidId/evaluate',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    bidController.submitEvaluationScore
);

// NEW (D-2): Record CPO return to losing bidder — required by Ethiopian law
// ⚠️ Must be registered BEFORE /:tenderId/:bidId/documents/:fileName routes
router.patch(
    '/:tenderId/:bidId/cpo/return',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    bidController.verifyCPOReturn
);

// NEW (D-3): Update compliance document checklist
router.patch(
    '/:tenderId/:bidId/compliance',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    bidController.updateComplianceChecklist
);

// ══════════════════════════════════════════════════════════════
// Document access routes
// Registered last — most specific paths above take precedence
// ══════════════════════════════════════════════════════════════

router.get(
    '/:tenderId/:bidId/documents/:fileName/download',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    bidDocumentController.downloadBidDocument
);

router.get(
    '/:tenderId/:bidId/documents/:fileName/preview',
    verifyToken,
    restrictTo('company', 'organization', 'admin'),
    bidDocumentController.previewBidDocument
);

module.exports = router;