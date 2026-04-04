// routes/freelancerMarketplaceRoutes.js
const express = require('express');
const router  = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo }  = require('../middleware/roleMiddleware');
const ctrl            = require('../controllers/freelancerMarketplaceController');

// All routes require authentication.
// Companies (and admins for oversight) can view freelancers.

// ── Listing & public profile ──────────────────────────────────────────────────
router.get(
  '/',
  verifyToken,
  restrictTo('company', 'admin'),
  ctrl.listFreelancers
);

router.get(
  '/:id',
  verifyToken,
  restrictTo('company', 'admin'),
  ctrl.getFreelancerPublicProfile
);

// ── Reviews ───────────────────────────────────────────────────────────────────
router.get(
  '/:id/reviews',
  verifyToken,
  restrictTo('company', 'admin'),
  ctrl.getReviews
);

router.post(
  '/:id/reviews',
  verifyToken,
  restrictTo('company'),
  ctrl.submitReview
);

module.exports = router;
