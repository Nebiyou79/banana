const express = require('express');
const router = express.Router();
const {
  getPortfolio,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem
} = require('../controllers/freelancerController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes require authentication and freelancer role
router.use(verifyToken);
router.use(restrictTo('freelancer'));

router.route('/portfolio')
  .get(getPortfolio)
  .post(upload.single('image'), addPortfolioItem);

router.route('/portfolio/:itemId')
  .put(upload.single('image'), updatePortfolioItem)
  .delete(deletePortfolioItem);

module.exports = router;