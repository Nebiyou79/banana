const express = require('express');
const  adminAuth  = require('../middleware/adminAuth');
const { adminLimiter } = require('../middleware/rateLimit');
const {
  getJobTemplates,
  getTemplateById,
  createJobTemplate,
  updateJobTemplate,
  deleteJobTemplate,
  createJobFromTemplate,
  duplicateTemplate,
  exportTemplates
} = require('../controllers/jobTemplateController');

const router = express.Router();

// All routes require admin authentication and rate limiting
router.use(adminAuth);
router.use(adminLimiter);

// Template management routes
router.get('/templates', getJobTemplates);
router.get('/templates/:id', getTemplateById);
router.post('/templates', createJobTemplate);
router.put('/templates/:id', updateJobTemplate);
router.delete('/templates/:id', deleteJobTemplate);
router.post('/templates/:id/duplicate', duplicateTemplate);
router.post('/templates/create-job', createJobFromTemplate);
router.get('/templates/export/csv', exportTemplates);

module.exports = router;