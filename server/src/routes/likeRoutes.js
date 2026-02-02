const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/likeController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// 🔄 Reaction Management
router.post('/:id/react', interactionController.addReaction);           // Add reaction
router.post('/:id/dislike', interactionController.addDislike);          // Add dislike
router.delete('/:id/interact', interactionController.removeInteraction); // Remove interaction (both reaction and dislike)
router.put('/:id/react', interactionController.updateReaction);         // Update reaction type

// 🔄 Toggle between reaction and dislike
router.post('/:id/toggle', interactionController.toggleInteraction);    // Toggle reaction/dislike

// 📊 Get Reactions & Dislikes
router.get('/:id/reactions', interactionController.getTargetReactions); // Get all reactions for target
router.get('/:id/dislikes', interactionController.getTargetDislikes);   // Get all dislikes for target
router.get('/:id/stats', interactionController.getInteractionStats);    // Get interaction statistics
router.get('/:id/user-interaction', interactionController.getUserInteraction); // Get user's interaction

// 🔍 Bulk Operations
router.post('/bulk/status', interactionController.getBulkInteractionStatus); // Get status for multiple targets

// ⚠️ Backward Compatibility (Legacy endpoints - update your existing code to use new endpoints)
router.post('/posts/:id/like', interactionController.addReaction);      // Legacy: Add reaction
router.delete('/posts/:id/like', interactionController.removeInteraction); // Legacy: Remove interaction
router.get('/posts/:id/likes', interactionController.getTargetReactions); // Legacy: Get reactions

module.exports = router;