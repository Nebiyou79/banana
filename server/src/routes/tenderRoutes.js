const express = require('express');
const {
  createTender,
  getTenders,
  getTender,
  updateTender,
  deleteTender,
  getMyTenders,
  getMyOrganizationTenders, // Add this
  getMyAllTenders, // Add this
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
  restrictTo('company', 'organization', 'admin'), // Add organization
  createTender
);

// Company-specific routes
router.get('/company/my-tenders',
  restrictTo('company', 'admin'),
  getMyTenders
);

// Organization-specific routes
router.get('/organization/my-tenders',
  restrictTo('organization', 'admin'),
  getMyOrganizationTenders
);

// Get all tenders for current user (both company and organization)
router.get('/user/my-tenders',
  restrictTo('company', 'organization', 'admin'),
  getMyAllTenders
);

// Update and delete routes - now work for both company and organization
router.put('/:id',
  restrictTo('company', 'organization', 'admin'),
  updateTender
);

router.delete('/:id',
  restrictTo('company', 'organization', 'admin'),
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