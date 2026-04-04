// routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const { body, param, query } = require('express-validator');

// Validation rules
const commentValidation = {
  createComment: [
    body('content')
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Content must be between 1 and 2000 characters'),
    body('parentType')
      .optional()
      .isIn(['Post', 'Comment'])
      .withMessage('Parent type must be either Post or Comment'),
    body('media')
      .optional()
      .isArray()
      .withMessage('Media must be an array'),
    body('media.*.url')
      .if(body('media').exists())
      .isURL()
      .withMessage('Media URL must be valid'),
    body('media.*.type')
      .if(body('media').exists())
      .isIn(['image', 'video', 'gif'])
      .withMessage('Media type must be image, video, or gif')
  ],

  updateComment: [
    body('content')
      .optional()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Content must be between 1 and 2000 characters'),
    body('media')
      .optional()
      .isArray()
      .withMessage('Media must be an array')
  ],

  idParam: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format')
  ],

  userIdParam: [
    param('userId')
      .isMongoId()
      .withMessage('Invalid user ID format')
  ],

  queryParams: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('depth')
      .optional()
      .isInt({ min: 0, max: 10 })
      .withMessage('Depth must be between 0 and 10'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'engagement.likes', 'updatedAt'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ]
};

// Apply authentication middleware to protected routes
router.use(verifyToken);

// Comment management routes
router.post(
  '/posts/:id/comments',
  commentValidation.idParam,
  commentValidation.createComment,
  commentController.addComment
);

router.post(
  '/comments/:id/replies',
  commentValidation.idParam,
  commentValidation.createComment,
  commentController.addComment
);

router.put(
  '/comments/:id',
  commentValidation.idParam,
  commentValidation.updateComment,
  commentController.updateComment
);

router.delete(
  '/comments/:id',
  commentValidation.idParam,
  commentController.deleteComment
);

// Like/engagement routes
router.post(
  '/comments/:id/like',
  commentValidation.idParam,
  commentController.toggleCommentLike
);

router.post(
  '/comments/:id/report',
  commentValidation.idParam,
  [
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  ],
  commentController.reportComment
);

// Public routes (with optional auth)
router.get(
  '/posts/:id/comments',
  commentValidation.idParam,
  commentValidation.queryParams,
  optionalAuth,
  commentController.getComments
);

router.get(
  '/comments/:id/replies',
  commentValidation.idParam,
  commentValidation.queryParams,
  optionalAuth,
  commentController.getCommentReplies
);

router.get(
  '/comments/user/:userId',
  commentValidation.userIdParam,
  commentValidation.queryParams,
  commentController.getUserComments
);

router.get(
  '/comments/search',
  [
    query('q')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Search query must be at least 2 characters long'),
    query('parentType')
      .optional()
      .isIn(['Post', 'Comment'])
      .withMessage('Parent type must be Post or Comment'),
    query('parentId')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent ID format')
  ],
  commentController.searchComments
);

// Admin routes
router.patch(
  '/admin/comments/:id/moderate',
  commentValidation.idParam,
  restrictTo('admin'),
  [
    body('status')
      .isIn(['active', 'hidden', 'deleted'])
      .withMessage('Invalid status'),
    body('moderationNotes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Moderation notes cannot exceed 1000 characters')
  ],
  commentController.moderateComment
);

module.exports = router;