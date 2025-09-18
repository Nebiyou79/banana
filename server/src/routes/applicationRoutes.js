// backend/routes/applicationRoutes.js
const express = require('express');
const {
  applyJob,
  getUserApplications,
  getApplicationsForJob,
  updateApplicationStatus
} = require('../controllers/applicationController');

const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// All endpoints require auth
router.use(verifyToken);

// Candidate applies to a job
router.post('/', restrictTo('candidate'), applyJob);

// Candidate fetches their applications
router.get('/me', restrictTo('candidate'), getUserApplications);

// Company/Admin fetches applications for job
router.get('/job/:jobId', restrictTo('company', 'admin'), getApplicationsForJob);

// Company/Admin updates application status
router.patch('/:id/status', restrictTo('company', 'admin'), updateApplicationStatus);

module.exports = router;
