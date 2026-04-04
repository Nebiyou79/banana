// routes/companyShortlistRoutes.js
const express = require('express');
const router  = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo }  = require('../middleware/roleMiddleware');
const ctrl            = require('../controllers/freelancerMarketplaceController');

// Both routes sit under /api/v1/company (mounted in index.js)

router.post(
  '/shortlist/:freelancerId',
  verifyToken,
  restrictTo('company'),
  ctrl.toggleShortlist
);

router.get(
  '/shortlist',
  verifyToken,
  restrictTo('company'),
  ctrl.getShortlist
);

module.exports = router;
