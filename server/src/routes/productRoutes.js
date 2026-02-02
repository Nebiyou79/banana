const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const cloudinaryMediaUpload = require('../middleware/cloudinaryMediaUpload'); // ADD THIS IMPORT

// =====================
// PUBLIC ROUTES
// =====================

// Get all products with filtering
router.get('/', productController.getProducts);

// Get product categories
router.get('/categories', productController.getCategories);

// Get featured products
router.get('/featured', productController.getFeaturedProducts);

// Get products by company
router.get('/company/:companyId', productController.getCompanyProducts);

// Get single product
router.get('/:id', productController.getProduct);

// Get related products
router.get('/:id/related', productController.getRelatedProducts);

// =====================
// PROTECTED ROUTES
// =====================
router.use(verifyToken);

// =====================
// DEPRECATED: IMAGE UPLOAD ROUTE (use product creation instead)
// =====================
router.post('/upload',
  restrictTo('company', 'admin'),
  cloudinaryMediaUpload.productImages, // ADD MIDDLEWARE HERE TOO
  productController.uploadImages
);

// Get upload statistics
router.get('/stats/uploads',
  restrictTo('company', 'admin'),
  productController.getProductUploadStats
);

// =====================
// PRODUCT MANAGEMENT ROUTES
// =====================

// Create new product with images
router.post('/',
  restrictTo('company', 'admin'),
  cloudinaryMediaUpload.productImages, // ADD THIS MIDDLEWARE
  productController.createProduct
);

// Update product with optional images
router.put('/:id',
  restrictTo('company', 'admin'),
  cloudinaryMediaUpload.productImages, // ADD THIS MIDDLEWARE
  productController.updateProduct
);

// Update product status (no file upload needed)
router.patch('/:id/status',
  restrictTo('company', 'admin'),
  productController.updateProductStatus
);

// Delete product
router.delete('/:id',
  restrictTo('company', 'admin'),
  productController.deleteProduct
);

// =====================
// HEALTH CHECK
// =====================
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Product routes are operational',
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
    message: 'Product route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;