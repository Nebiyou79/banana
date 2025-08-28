const express = require('express');
const {
  createCompany,
  getCompanyProfile,
  updateCompanyProfile
} = require('../controllers/companyController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public route
router.get('/:id', getCompanyProfile);

// Protected routes
router.use(verifyToken);
router.use(restrictTo('company', 'organization'));

router.post('/', createCompany);
router.put('/:id', updateCompanyProfile);

module.exports = router;