const { body } = require('express-validator');

// Tender creation validation
exports.validateTender = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 50, max: 10000 })
    .withMessage('Description must be between 50 and 10000 characters'),
  
  body('category')
    .isIn([
      'web_development', 'mobile_development', 'design', 'writing', 'marketing',
      'consulting', 'data_science', 'devops', 'other'
    ])
    .withMessage('Invalid category'),
  
  body('budget.min')
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  
  body('budget.max')
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a positive number'),
  
  body('deadline')
    .isISO8601()
    .withMessage('Invalid deadline format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  
  body('duration')
    .isInt({ min: 1, max: 365 })
    .withMessage('Duration must be between 1 and 365 days'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'invite_only'])
    .withMessage('Invalid visibility option'),
  
  body('skillsRequired')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  
  body('skillsRequired.*')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Each skill must not exceed 50 characters')
];

// Tender update validation
exports.validateTenderUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 10000 })
    .withMessage('Description must be between 50 and 10000 characters'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  // Add other validations as needed
];