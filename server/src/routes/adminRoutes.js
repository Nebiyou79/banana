const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllJobs,
  updateJob,
  deleteJob,
  bulkUserActions,
  getSystemSettings,
  updateSystemSettings,
  generateReport,
  getReports
} = require('../controllers/adminController');

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// Dashboard routes
router.get('/stats', getDashboardStats);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/bulk-actions', bulkUserActions);

// Job management routes
router.get('/jobs', getAllJobs);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);

// System settings routes
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

// Report routes
router.post('/reports/generate', generateReport);
router.get('/reports', getReports);

module.exports = router;