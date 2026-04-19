/**
 * server/src/routes/productRoutes.js  (UPDATED)
 *
 * New endpoints:
 *   POST  /api/v1/products/:id/save      → save product
 *   DELETE /api/v1/products/:id/save     → unsave product
 *   GET   /api/v1/products/saved         → list saved products (auth)
 */
const express = require('express');
const router  = express.Router();
const productController  = require('../controllers/ProductController');
const { verifyToken }    = require('../middleware/authMiddleware');
const { restrictTo }     = require('../middleware/roleMiddleware');
const cloudinaryMediaUpload = require('../middleware/cloudinaryMediaUpload');

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────
router.get('/',               productController.getProducts);
router.get('/categories',     productController.getCategories);
router.get('/featured',       productController.getFeaturedProducts);
router.get('/company/:companyId', productController.getCompanyProducts);
router.get('/:id/related',    productController.getRelatedProducts);
router.get('/:id',            productController.getProduct);

// ── PROTECTED ROUTES ──────────────────────────────────────────────────────────
router.use(verifyToken);

// Saved products
router.get('/saved',          productController.getSavedProducts);
router.post('/:id/save',      productController.saveProduct);
router.delete('/:id/save',    productController.unsaveProduct);

// Stats
router.get('/stats/uploads',
  restrictTo('company', 'admin'),
  productController.getProductUploadStats
);

// Standalone image upload (legacy)
router.post('/upload',
  restrictTo('company', 'admin'),
  cloudinaryMediaUpload.productImages,
  productController.uploadImages
);

// Create / Update / Delete
router.post('/',
  restrictTo('company', 'admin'),
  cloudinaryMediaUpload.productImages,
  productController.createProduct
);

router.put('/:id',
  restrictTo('company', 'admin'),
  cloudinaryMediaUpload.productImages,
  productController.updateProduct
);

router.patch('/:id/status',
  restrictTo('company', 'admin'),
  productController.updateProductStatus
);

router.delete('/:id',
  restrictTo('company', 'admin'),
  productController.deleteProduct
);

// ── 404 handler ────────────────────────────────────────────────────────────────
router.use('*', (req, res) => res.status(404).json({ success: false, message: 'Product route not found', code: 'ROUTE_NOT_FOUND' }));

module.exports = router;
