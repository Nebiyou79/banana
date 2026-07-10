// routes/freelancerMarketplaceRoutes.js
const express = require('express');
const router  = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo }  = require('../middleware/roleMiddleware');
const ctrl            = require('../controllers/freelancerMarketplaceController');

// All routes require authentication.

// ── Freelancer viewing their OWN data (no company restriction) ────────────────
router.get(
  '/me',
  verifyToken,
  restrictTo('freelancer', 'company', 'admin'),  // FIX: Allow freelancers
  ctrl.getMyFreelancerProfile
);

router.get(
  '/me/reviews',
  verifyToken,
  restrictTo('freelancer', 'company', 'admin'),  // FIX: Allow freelancers
  ctrl.getMyReviews
);

// ── Listing & public profile (freelancers can view marketplace too) ───────────
router.get(
  '/',
  verifyToken,
  restrictTo('freelancer', 'company', 'admin'),  // FIX: Allow freelancers
  ctrl.listFreelancers
);

router.get(
  '/professions',
  verifyToken,
  restrictTo('freelancer', 'company', 'admin'),  // FIX: Allow freelancers
  ctrl.getProfessionList
);

router.get(
  '/:id',
  verifyToken,
  restrictTo('freelancer', 'company', 'admin'),  // FIX: Allow freelancers
  ctrl.getFreelancerPublicProfile
);

// ── Reviews ───────────────────────────────────────────────────────────────────
router.get(
  '/:id/reviews',
  verifyToken,
  restrictTo('freelancer', 'company', 'admin'),  // FIX: Allow freelancers to view reviews
  ctrl.getReviews
);

router.post(
  '/:id/reviews',
  verifyToken,
  restrictTo('company'),  // Only companies can submit reviews (correct)
  ctrl.submitReview
);

// ── Shortlist (remains company-only) ──────────────────────────────────────────
router.post(
  '/company/shortlist/:freelancerId',
  verifyToken,
  restrictTo('company'),  // Only companies can shortlist
  ctrl.toggleShortlist
);

router.get(
  '/company/shortlist',
  verifyToken,
  restrictTo('company'),  // Only companies can view their shortlist
  ctrl.getShortlist
);

module.exports = router;