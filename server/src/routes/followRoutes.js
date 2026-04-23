/**
 * server/src/routes/followRoutes.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Follow Routes
 *
 * Phase 0 fix: removed duplicate verifyToken on /bulk-status.
 * Phase 1: added /connections, /:userId/is-connected, /:targetId/block.
 *
 * IMPORTANT: route ordering — specific paths MUST come before dynamic
 * `/:targetId` paths, otherwise Express will interpret 'connections' or
 * 'stats' as a targetId.
 * ────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const router = express.Router();

const followController = require('../controllers/followController');
const { verifyToken } = require('../middleware/authMiddleware');

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────
// These do NOT require authentication.
router.get(
  '/public/followers/:targetId',
  followController.getPublicFollowers
);
router.get(
  '/public/following/:targetId',
  followController.getPublicFollowing
);

// ── PROTECTED ROUTES ──────────────────────────────────────────────────────
router.use(verifyToken);

// Specific routes (must come before `/:targetId/...`)
router.get('/followers', followController.getFollowers);
router.get('/following', followController.getFollowing);
router.get('/connections', followController.getConnections); // NEW
router.get('/stats', followController.getFollowStats);
router.get('/suggestions', followController.getFollowSuggestions);
router.get('/pending', followController.getPendingRequests);

// Bulk status (POST)
// Phase 0 fix: removed the duplicate verifyToken argument here.
router.post('/bulk-status', followController.getBulkFollowStatus);

// Legacy accept/reject — kept as no-ops for FE compatibility.
router.put('/:followId/accept', followController.acceptFollowRequest);
router.put('/:followId/reject', followController.rejectFollowRequest);

// Dynamic :targetId / :userId routes
router.get('/:userId/is-connected', followController.isConnected); // NEW
router.get('/:targetId/status', followController.getFollowStatus);
router.post('/:targetId/block', followController.blockUser); // NEW
router.post('/:targetId', followController.toggleFollow);

module.exports = router;