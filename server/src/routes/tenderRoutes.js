const express = require('express');
const {
  createTender,
  getTenders,
  getTender,
  updateTender,
  deleteTender,
  getMyTenders,
  toggleSaveTender,
  getSavedTenders
} = require('../controllers/tenderController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes - anyone can view tenders
router.get('/', getTenders);
router.get('/:id', getTender);

// Protected routes
router.use(verifyToken);

// Company routes - only companies can create/update/delete tenders
router.post('/', 
  restrictTo('company', 'admin'),
  createTender
);

router.get('/company/my-tenders',
  restrictTo('company', 'admin'),
  getMyTenders
);

router.put('/:id',
  restrictTo('company', 'admin'),
  updateTender
);

router.delete('/:id',
  restrictTo('company', 'admin'),
  deleteTender
);

// Freelancer routes - only freelancers can save tenders
router.post('/:id/save',
  restrictTo('freelancer'),
  toggleSaveTender
);

router.get('/saved/saved',
  restrictTo('freelancer'),
  getSavedTenders
);

module.exports = router;