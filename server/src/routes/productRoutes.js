const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductController');
const { productUpload, processImages, handleUploadErrors } = require('../middleware/productUploadMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
// Public routes
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/featured', productController.getFeaturedProducts);
router.get('/company/:companyId', productController.getCompanyProducts);
router.get('/:id', productController.getProduct);
router.get('/:id/related', productController.getRelatedProducts);

// Protected routes
router.use(verifyToken);

// Image upload endpoint
router.post('/upload', 
  productUpload,
  handleUploadErrors,
  processImages,
  productController.uploadImages
);

// Product management routes
router.post('/',
  restrictTo('company', 'admin'),
  productUpload,
  handleUploadErrors,
  processImages,
  productController.createProduct
);

router.put('/:id',
  restrictTo('company', 'admin'),
  productUpload,
  handleUploadErrors,
  processImages,
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

module.exports = router;