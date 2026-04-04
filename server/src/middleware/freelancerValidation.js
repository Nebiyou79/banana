const { body, param, query, validationResult } = require('express-validator');

// Validation helper
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

// Freelancer profile validation
const validateFreelancerProfile = validate([
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
    
  body('bio')
    .optional()
    .isString()
    .withMessage('Bio must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Bio cannot exceed 2000 characters'),
    
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
    
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .custom((value) => {
      const dob = new Date(value);
      const today = new Date();
      const minAge = 16;
      const maxAge = 100;
      const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
      const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
      
      if (dob > maxDate) {
        throw new Error(`You must be at least ${minAge} years old`);
      }
      if (dob < minDate) {
        throw new Error('Please enter a valid date of birth');
      }
      return true;
    }),
    
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Gender must be one of: male, female, other, prefer-not-to-say'),
    
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
    
  body('experienceLevel')
    .optional()
    .isIn(['entry', 'intermediate', 'expert'])
    .withMessage('Experience level must be entry, intermediate, or expert'),
    
  body('availability')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'freelance'])
    .withMessage('Availability must be full-time, part-time, contract, or freelance')
]);

// Portfolio item validation
const validatePortfolioItem = validate([
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
    
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
    
  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
    
  body('tags')
    .optional()
    .custom((value) => {
      try {
        const tags = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(tags)) {
          throw new Error('Tags must be an array');
        }
        if (tags.length > 10) {
          throw new Error('Cannot have more than 10 tags');
        }
        return true;
      } catch {
        throw new Error('Invalid tags format');
      }
    })
]);

// Certification validation
const validateCertification = validate([
  body('name')
    .notEmpty()
    .withMessage('Certification name is required')
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
    
  body('issuer')
    .notEmpty()
    .withMessage('Issuer is required')
    .isString()
    .withMessage('Issuer must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Issuer must be between 2 and 100 characters'),
    
  body('issueDate')
    .notEmpty()
    .withMessage('Issue date is required')
    .isISO8601()
    .withMessage('Issue date must be a valid date'),
    
  body('credentialId')
    .optional()
    .isString()
    .withMessage('Credential ID must be a string')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Credential ID cannot exceed 50 characters')
]);

// Service validation
const validateService = validate([
  body('title')
    .notEmpty()
    .withMessage('Service title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
    
  body('description')
    .notEmpty()
    .withMessage('Service description is required')
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
    
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
    
  body('deliveryTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Delivery time must be a positive integer (days)')
]);

// Freelancer query validation
const validateFreelancerQuery = validate([
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
    
  query('featured')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Featured must be true or false'),
    
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
    
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search cannot exceed 100 characters')
]);

module.exports = {
  validateFreelancerProfile,
  validatePortfolioItem,
  validateCertification,
  validateService,
  validateFreelancerQuery
};