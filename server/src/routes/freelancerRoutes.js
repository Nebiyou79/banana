const express = require('express');
const router = express.Router();
const {
  getPortfolio,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  updateProfile,
  getProfile,
  getDashboardStats,      // ADD THIS
  getRecentActivities,    // ADD THIS
  getPortfolioCount       // ADD THIS
} = require('../controllers/freelancerController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Portfolio routes
router.get('/portfolio', getPortfolio);
router.post('/portfolio', addPortfolioItem);
router.put('/portfolio/:id', updatePortfolioItem);
router.delete('/portfolio/:id', deletePortfolioItem);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Dashboard routes - ADD THESE
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/activities', getRecentActivities);
router.get('/portfolio/count', getPortfolioCount);

module.exports = router;