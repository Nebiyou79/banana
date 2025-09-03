const express = require('express');
const {
  getJobs,
  getJob,
  getCompanyJobs,
  createJob,
  updateJob,
  deleteJob
} = require('../controllers/jobController');

const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// Public routes
router.get('/', getJobs);

// Protected routes
router.use(verifyToken);

// SPECIFIC ROUTES FIRST
router.get('/company/my-jobs', restrictTo('company'), getCompanyJobs); // Specific route first
router.post('/', restrictTo('company'), createJob);

// PARAMETERIZED ROUTES LAST
router.get('/:id', getJob); // This comes after specific routes
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

module.exports = router;