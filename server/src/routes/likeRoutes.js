const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// 🔄 Reaction Management
router.post('/:id/react', likeController.addReaction);           // Add reaction
router.delete('/:id/react', likeController.removeReaction);      // Remove reaction
router.put('/:id/react', likeController.updateReaction);         // Update reaction

// 📊 Get Reactions & Stats
router.get('/:id/reactions', likeController.getTargetReactions); // Get all reactions for target
router.get('/:id/reactions/stats', likeController.getReactionStats); // Get reaction statistics
router.get('/:id/user-reaction', likeController.getUserReaction); // Get user's specific reaction

// 🔍 Bulk Operations
router.post('/bulk/status', likeController.getBulkReactionStatus); // Get status for multiple targets

// ⚠️ Backward Compatibility (Legacy endpoints)
router.post('/posts/:id/like', likeController.addReaction);      // Legacy: Add like
router.delete('/posts/:id/like', likeController.removeReaction); // Legacy: Remove like
router.get('/posts/:id/likes', likeController.getTargetReactions); // Legacy: Get likes

module.exports = router;