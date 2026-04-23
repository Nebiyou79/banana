/**
 * server/src/routes/conversationRoutes.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Conversation Routes (NEW)
 *
 * All routes require auth. Specific paths are listed before :id dynamics.
 * ────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const router = express.Router();

const conversationController = require('../controllers/conversationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Specific routes first
router.get('/', conversationController.getMyConversations);
router.get('/requests', conversationController.getMessageRequests);
router.get('/contacts/online', conversationController.getOnlineContacts);

// /with/:userId is specific enough to go before /:id
router.post('/with/:userId', conversationController.getOrCreateConversation);

// Dynamic :id routes
router.get('/:id', conversationController.getConversationById);
router.put('/:id/accept', conversationController.acceptMessageRequest);
router.put('/:id/decline', conversationController.declineMessageRequest);
router.put('/:id/read', conversationController.markAsRead);
router.delete('/:id', conversationController.deleteConversation);

module.exports = router;