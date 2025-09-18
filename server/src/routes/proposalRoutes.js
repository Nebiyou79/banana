// backend/routes/proposalRoutes.js
const express = require('express');
const {
  createProposal,
  getUserProposals,
  getTenderProposals,
  updateProposalStatus,
  updateProposal,
  deleteProposal
} = require('../controllers/proposalController');

const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(verifyToken);

// Freelancer routes
router.post('/', restrictTo('freelancer'), createProposal);
router.get('/me', restrictTo('freelancer'), getUserProposals);
router.put('/:id', restrictTo('freelancer'), updateProposal);

// Company routes
router.get('/tender/:tenderId', restrictTo('company', 'admin'), getTenderProposals);
router.put('/:id/status', restrictTo('company', 'admin'), updateProposalStatus);

// Admin routes
router.delete('/:id', restrictTo('freelancer', 'admin'), deleteProposal);

module.exports = router;