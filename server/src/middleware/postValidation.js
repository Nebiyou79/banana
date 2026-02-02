const { body, param, query, validationResult } = require('express-validator');

// Validation helpers
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      location: err.location
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
      code: 'VALIDATION_ERROR'
    });
  };
};

// Post creation validation
const validateCreatePost = validate([
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Content cannot exceed 5000 characters'),
    
  body('type')
    .optional()
    .isIn(['text', 'image', 'video', 'document', 'poll', 'job', 'link'])
    .withMessage('Invalid post type'),
    
  body('media')
    .optional()
    .custom((value, { req }) => {
      if (value && !req.files && !req.body.content) {
        throw new Error('Post must contain either content or media');
      }
      return true;
    }),
    
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'connections'])
    .withMessage('Visibility must be public, private, or connections'),
    
  body('allowComments')
    .optional()
    .isBoolean()
    .withMessage('allowComments must be a boolean'),
    
  body('allowSharing')
    .optional()
    .isBoolean()
    .withMessage('allowSharing must be a boolean'),
    
  body('pinned')
    .optional()
    .isBoolean()
    .withMessage('pinned must be a boolean'),
    
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
    
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('expiresAt must be a valid ISO date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('expiresAt must be in the future');
      }
      return true;
    }),
    
  body('linkPreview')
    .optional()
    .isObject()
    .withMessage('linkPreview must be an object'),
    
  body('poll')
    .optional()
    .isObject()
    .withMessage('poll must be an object'),
    
  body('job')
    .optional()
    .isMongoId()
    .withMessage('job must be a valid MongoDB ID'),
    
  body('mentions')
    .optional()
    .isArray()
    .withMessage('mentions must be an array')
    .custom((value) => {
      if (value.length > 10) {
        throw new Error('Cannot mention more than 10 users');
      }
      return true;
    })
]);

// Post update validation
const validateUpdatePost = validate([
  param('id')
    .isMongoId()
    .withMessage('Invalid post ID format'),
    
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Content cannot exceed 5000 characters'),
    
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'connections'])
    .withMessage('Visibility must be public, private, or connections'),
    
  body('allowComments')
    .optional()
    .isBoolean()
    .withMessage('allowComments must be a boolean'),
    
  body('allowSharing')
    .optional()
    .isBoolean()
    .withMessage('allowSharing must be a boolean'),
    
  body('pinned')
    .optional()
    .isBoolean()
    .withMessage('pinned must be a boolean'),
    
  body('mediaToRemove')
    .optional()
    .custom((value) => {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(parsed);
      } catch {
        throw new Error('mediaToRemove must be a valid JSON array or array');
      }
    }),
    
  body('media')
    .optional()
    .custom((value) => {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(parsed);
      } catch {
        throw new Error('media must be a valid JSON array or array');
      }
    })
]);

// Post share validation
const validateSharePost = validate([
  param('id')
    .isMongoId()
    .withMessage('Invalid post ID format'),
    
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Content cannot exceed 1000 characters'),
    
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'connections'])
    .withMessage('Visibility must be public, private, or connections')
]);

// Query validation for feed
const validateFeedQuery = validate([
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('type')
    .optional()
    .isIn(['text', 'image', 'video', 'document', 'poll', 'job', 'link'])
    .withMessage('Invalid post type filter'),
    
  query('author')
    .optional()
    .isMongoId()
    .withMessage('Invalid author ID format'),
    
  query('hashtag')
    .optional()
    .isString()
    .withMessage('Hashtag must be a string')
    .isLength({ max: 50 })
    .withMessage('Hashtag cannot exceed 50 characters'),
    
  query('sortBy')
    .optional()
    .isIn(['newest', 'trending', 'popular'])
    .withMessage('Invalid sort option')
]);

// Query validation for profile posts
const validateProfilePostsQuery = validate([
  param('profileId')
    .isMongoId()
    .withMessage('Invalid profile ID format'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
    
  query('type')
    .optional()
    .isIn(['text', 'image', 'video', 'document', 'poll', 'job', 'link'])
    .withMessage('Invalid post type filter'),
    
  query('includeShared')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('includeShared must be true or false')
]);

module.exports = {
  validateCreatePost,
  validateUpdatePost,
  validateSharePost,
  validateFeedQuery,
  validateProfilePostsQuery
};