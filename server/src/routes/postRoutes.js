const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');
const { uploadMedia, fileSizeLimit } = require('../middleware/upload');

// Apply authentication middleware to most routes
router.use(verifyToken);

// Get feed posts (professional feed)
router.get('/feed', postController.getFeedPosts);

// Get user's own posts (for dashboard)
router.get('/my/posts', postController.getMyPosts);

// Create post with media handling
router.post('/', uploadMedia, fileSizeLimit, postController.createPost);

// Get specific post (optional auth for public posts)
router.get('/:id', optionalAuth, postController.getPost);

// Update post with proper media handling
router.put('/:id', uploadMedia, fileSizeLimit, postController.updatePost);

// Delete post (with permanent delete option for admins)
router.delete('/:id', postController.deletePost);

// Get profile posts with professional privacy
router.get('/profile/:profileId', postController.getProfilePosts);

// Share post
router.post('/:id/share', postController.sharePost);

module.exports = router;