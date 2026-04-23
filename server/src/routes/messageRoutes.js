/**
 * server/src/routes/messageRoutes.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Message Routes (NEW)
 * ────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const router = express.Router();

const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', messageController.sendMessage);
router.get('/:conversationId', messageController.getMessages);
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;