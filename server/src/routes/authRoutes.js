const express = require('express');
const { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser 
} = require('../controllers/authController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);

// Admin only routes
router.get('/admin/users', 
  verifyToken, 
  restrictTo('admin'),
  (req, res) => {
    // Implementation for admin to get all users
    res.json({ message: 'Admin user list endpoint' });
  }
);

module.exports = router;