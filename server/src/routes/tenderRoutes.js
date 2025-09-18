// routes/tenderRoutes.js - Enhanced
const express = require('express');
const {
  createTender,
  getTenders,
  getTender,
  updateTender,
  deleteTender,
  getCompanyTenders
} = require('../controllers/tenderControllers');

const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes (with optional auth)
router.get('/public', getTenders); // Get public tenders

// Protected routes
router.use(verifyToken);

router.post('/', restrictTo('company'), createTender);
router.get('/', getTenders); // With filters for authenticated users
router.get('/:id', getTender);
router.put('/:id', restrictTo('company', 'admin'), updateTender);
router.delete('/:id', restrictTo('company', 'admin'), deleteTender);
router.get('/company/:companyId', getCompanyTenders);

module.exports = router;