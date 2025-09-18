const express = require('express');
const {
  getMyCompany,
  getCompany,
  createCompany,
  updateCompany,
  updateMyCompany
} = require('../controllers/companyController');

const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

router.use(verifyToken);

// Change from '/me' to '/'
router.get('/', getMyCompany); // This will create /api/v1/company/
router.post('/', restrictTo('company'), createCompany);
router.put('/me', updateMyCompany);
router.put('/:id', updateCompany);

module.exports = router;