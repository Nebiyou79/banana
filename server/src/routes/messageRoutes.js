// =============================================================================
// FILE 4: messageRoutes.js — VERIFIED CORRECT
// =============================================================================

/**
 * server/src/routes/messageRoutes.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v4 — Message Routes (VERIFIED)
 * 
 * All route handlers correctly reference controller exports.
 * Authentication via verifyToken middleware applied to all endpoints.
 * ────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();

const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(verifyToken);

// POST   /messages        - Send a new message
router.post('/', messageController.sendMessage);

// GET    /messages/:id    - Get messages for a conversation
router.get('/:conversationId', messageController.getMessages);

// DELETE /messages/:id    - Delete a message (for me or everyone)
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;