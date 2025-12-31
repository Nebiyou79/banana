// routes/followRoutes.js
const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

// Apply authentication middleware to protected routes
router.use(verifyToken);

// Follow/Unfollow routes
router.post('/:targetId', 
  followController.toggleFollow
);

router.get('/:targetId/status',
  followController.getFollowStatus
);

// Follow management routes
router.put('/:followId/accept',
  followController.acceptFollowRequest
);

router.put('/:followId/reject',
  followController.rejectFollowRequest
);

// Query routes
router.get('/followers', followController.getFollowers);
router.get('/following', followController.getFollowing);
router.get('/pending', followController.getPendingRequests);
router.get('/suggestions', followController.getFollowSuggestions);
router.get('/stats', followController.getFollowStats);

// Public routes (optional auth for viewing public profiles)
router.get('/public/followers/:targetId',
  optionalAuth,
  followController.getFollowers
);

router.get('/public/following/:targetId',
  optionalAuth,
  followController.getFollowing
);

module.exports = router;