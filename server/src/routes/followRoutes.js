// routes/followRoutes.js
const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');
const { 
  socialLimiter, 
  followListLimiter,
  followStatusLimiter 
} = require('../middleware/rateLimiter'); // Add this import

// Apply authentication middleware to protected routes
router.use(verifyToken);

// Apply DIFFERENT rate limiters to different endpoints
router.post('/:targetId', 
  socialLimiter, // More permissive for follow/unfollow actions
  followController.toggleFollow
);

router.get('/:targetId/status',
  followStatusLimiter, // Most permissive for status checks
  followController.getFollowStatus
);

// Follow management routes
router.put('/:followId/accept',
  socialLimiter,
  followController.acceptFollowRequest
);

router.put('/:followId/reject',
  socialLimiter,
  followController.rejectFollowRequest
);

// Query routes - apply list-specific rate limiter
router.get('/followers', 
  followListLimiter,
  followController.getFollowers
);

router.get('/following', 
  followListLimiter,
  followController.getFollowing
);

router.get('/pending', 
  followListLimiter,
  followController.getPendingRequests
);

router.get('/suggestions', 
  followListLimiter,
  followController.getFollowSuggestions
);

router.get('/stats', 
  followListLimiter,
  followController.getFollowStats
);

// Public routes (optional auth for viewing public profiles)
router.get('/public/followers/:targetId',
  optionalAuth,
  followListLimiter,
  followController.getFollowers
);

router.get('/public/following/:targetId',
  optionalAuth,
  followListLimiter,
  followController.getFollowing
);

module.exports = router;