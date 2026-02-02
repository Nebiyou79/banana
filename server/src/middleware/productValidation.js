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

// Product ID validation
const validateProductId = validate([
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format')
]);

// Product creation validation
const validateCreateProduct = validate([
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isString()
    .withMessage('Product name must be a string')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Product name must be between 3 and 100 characters'),
    
  body('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
    
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .custom((value) => {
      try {
        const priceData = typeof value === 'string' ? JSON.parse(value) : value;
        if (!priceData || typeof priceData.amount !== 'number' || priceData.amount < 0) {
          throw new Error('Valid price amount is required');
        }
        return true;
      } catch {
        throw new Error('Invalid price format. Must be a valid JSON with amount field');
      }
    }),
    
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isString()
    .withMessage('Category must be a string')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
    
  body('subcategory')
    .optional()
    .isString()
    .withMessage('Subcategory must be a string')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Subcategory cannot exceed 50 characters'),
    
  body('tags')
    .optional()
    .custom((value) => {
      try {
        const tags = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(tags)) {
          throw new Error('Tags must be an array');
        }
        if (tags.length > 20) {
          throw new Error('Cannot have more than 20 tags');
        }
        return true;
      } catch {
        throw new Error('Invalid tags format');
      }
    }),
    
  body('specifications')
    .optional()
    .custom((value) => {
      try {
        const specs = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(specs)) {
          throw new Error('Specifications must be an array');
        }
        return true;
      } catch {
        throw new Error('Invalid specifications format');
      }
    }),
    
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
    
  body('metaTitle')
    .optional()
    .isString()
    .withMessage('Meta title must be a string')
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title cannot exceed 60 characters'),
    
  body('metaDescription')
    .optional()
    .isString()
    .withMessage('Meta description must be a string')
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
    
  body('sku')
    .optional()
    .isString()
    .withMessage('SKU must be a string')
    .trim()
    .isLength({ max: 50 })
    .withMessage('SKU cannot exceed 50 characters'),
    
  body('inventory')
    .optional()
    .custom((value) => {
      try {
        const inventory = typeof value === 'string' ? JSON.parse(value) : value;
        if (inventory.quantity !== undefined && typeof inventory.quantity !== 'number') {
          throw new Error('Inventory quantity must be a number');
        }
        return true;
      } catch {
        throw new Error('Invalid inventory format');
      }
    })
]);

// Product update validation
const validateUpdateProduct = validate([
  body('name')
    .optional()
    .isString()
    .withMessage('Product name must be a string')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Product name must be between 3 and 100 characters'),
    
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
    
  body('price')
    .optional()
    .custom((value) => {
      try {
        const priceData = typeof value === 'string' ? JSON.parse(value) : value;
        if (priceData && priceData.amount !== undefined && typeof priceData.amount !== 'number') {
          throw new Error('Price amount must be a number');
        }
        return true;
      } catch {
        throw new Error('Invalid price format');
      }
    }),
    
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('Status must be active, inactive, or draft')
]);

// Product query validation
const validateProductQuery = validate([
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search cannot exceed 100 characters'),
    
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
    
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
    
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
    
  query('sortBy')
    .optional()
    .isIn(['name', 'price.amount', 'createdAt', 'updatedAt', 'views', 'featured'])
    .withMessage('Invalid sort field'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
]);

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validateProductQuery
};