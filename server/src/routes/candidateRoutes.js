const express = require('express');
const { 
  getProfile, 
  updateProfile, 
  uploadCV 
} = require('../controllers/candidateController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require authentication and candidate role
router.use(verifyToken);
router.use(restrictTo('candidate'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/cv', uploadCV); // This now handles file upload

module.exports = router;