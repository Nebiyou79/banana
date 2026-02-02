const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { verifyToken } = require('../middleware/authMiddleware');
const cloudinaryMediaUpload = require('../middleware/cloudinaryMediaUpload');

// =====================
// AUTH MIDDLEWARE
// =====================
router.use(verifyToken);

// =====================
// POST MANAGEMENT ROUTES
// =====================

// Get personalized feed
router.get('/feed', postController.getFeedPosts);

// Get user's own posts
router.get('/my-posts', postController.getMyPosts);

// Get saved posts (⚠️ MUST be before :id)
router.get('/saved', postController.getSavedPosts);

// Save post
router.post('/:id/save', postController.savePost);

// Unsave post
router.delete('/:id/save', postController.unsavePost);

// Get posts by profile ID
router.get('/profile/:profileId', postController.getProfilePosts);

// Get specific post by ID
router.get('/:id', postController.getPost);

// =====================
// POST CREATION ROUTES
// =====================

// Create new post with Cloudinary media uploads
router.post(
  '/',
  cloudinaryMediaUpload.multiple, // Use Cloudinary middleware for multiple files
  postController.createPost
);

// =====================
// POST UPDATE ROUTES
// =====================

// Update post with Cloudinary media handling
router.put(
  '/:id',
  cloudinaryMediaUpload.multiple, // Use Cloudinary middleware for multiple files
  postController.updatePost
);

// Share a post
router.post('/:id/share', postController.sharePost);

// =====================
// POST DELETION ROUTES
// =====================

// Delete post (soft delete by default, permanent for admin)
router.delete('/:id', postController.deletePost);

// =====================
// HEALTH CHECK
// =====================
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Post routes are operational',
    timestamp: new Date().toISOString(),
    user: req.user ? {
      id: req.user.userId,
      role: req.user.role
    } : null
  });
});

// =====================
// 404 HANDLER
// =====================
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Post route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;