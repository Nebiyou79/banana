// routes/adminRoutes.js - ADD THESE NEW ROUTES
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
  getReports,
  // NEW TENDER MANAGEMENT METHODS
  getTenderStats,
  getAllTenders,
  getTenderDetails,
  updateTenderStatus,
  moderateTender,
  bulkTenderActions,
  getSuspiciousTenders,
  getTenderAnalytics,
  getPlatformAnalytics,
  getAllProposals,
  updateUserStatus
} = require('../controllers/adminController');

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/analytics', getPlatformAnalytics);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);
router.post('/users/bulk-actions', bulkUserActions);

// Job management routes
router.get('/jobs', getAllJobs);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);

// Tender Management Routes - NEW
router.get('/tenders/stats', getTenderStats);
router.get('/tenders/analytics', getTenderAnalytics);
router.get('/tenders', getAllTenders);
router.get('/tenders/suspicious', getSuspiciousTenders);
router.get('/tenders/:id', getTenderDetails);
router.put('/tenders/:id/status', updateTenderStatus);
router.put('/tenders/:id/moderate', moderateTender);
router.post('/tenders/bulk-actions', bulkTenderActions);

// Proposal Management Routes
router.get('/proposals', getAllProposals);

// System settings routes
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

// Report routes
router.post('/reports/generate', generateReport);
router.get('/reports', getReports);

module.exports = router;