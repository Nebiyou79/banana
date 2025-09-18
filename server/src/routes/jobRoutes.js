const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJob,
  getPublicJobs, // ADD THIS
  getCompanyJobs,
  createJob,
  updateJob,
  deleteJob,
  saveJob, // ADD THIS
  unsaveJob, // ADD THIS
  getSavedJobs, // ADD THIS
  applyToJob // ADD THIS
} = require('../controllers/jobController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// Public routes
router.get('/public', getPublicJobs); // ADD THIS
router.get('/:id', getJob);

// Protected routes
router.use(verifyToken);
router.get('/', getJobs);
router.get('/company/my-jobs', restrictTo('company'), getCompanyJobs);
router.post('/', restrictTo('company'), createJob);
router.put('/:id', restrictTo('company'), updateJob);
router.delete('/:id', restrictTo('company'), deleteJob);

// Freelancer routes - ADD THESE
router.post('/:id/save', saveJob);
router.delete('/:id/save', unsaveJob);
router.get('/saved/get', getSavedJobs);
router.post('/:id/apply', applyToJob);

module.exports = router;