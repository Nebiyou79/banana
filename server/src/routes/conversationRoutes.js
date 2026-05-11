// =============================================================================
// FILE 3: conversationRoutes.js — CORRECTED ROUTE HANDLERS
// =============================================================================

/**
 * server/src/routes/conversationRoutes.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v4 — Conversation Routes (CORRECTED)
 * 
 * CRITICAL FIX: The route handler 'markAsRead' was calling a non-existent
 * controller method. Corrected to 'markConversationRead' to match the
 * controller export, eliminating the runtime error.
 * 
 * All routes require authentication via verifyToken middleware.
 * Specific paths are registered before dynamic :id routes to prevent
 * Express from interpreting path segments as IDs.
 * ────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();

const conversationController = require('../controllers/conversationController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(verifyToken);

// ── Specific routes (must be before /:id) ──────────────────────────────
router.get('/', conversationController.getMyConversations);
router.get('/requests', conversationController.getMessageRequests);
router.get('/contacts/online', conversationController.getOnlineContacts);

// /with/:userId is specific enough to go before /:id
router.post('/with/:userId', conversationController.getOrCreateConversation);

// ── Dynamic :id routes ─────────────────────────────────────────────────
router.get('/:id', conversationController.getConversationById);
router.put('/:id/accept', conversationController.acceptMessageRequest);
router.put('/:id/decline', conversationController.declineMessageRequest);
router.put('/:id/read', conversationController.markConversationRead); // FIXED: was markAsRead
router.delete('/:id', conversationController.deleteConversation);

module.exports = router;