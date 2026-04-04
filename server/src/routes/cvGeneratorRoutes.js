// backend/src/routes/cvGeneratorRoutes.js
// Mount under: app.use('/api/v1/candidate', cvGeneratorRoutes)
// so routes become: /api/v1/candidate/cv-generator/...

const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/cvGeneratorController');
const { verifyToken }  = require('../middleware/authMiddleware');
const { restrictTo }   = require('../middleware/roleMiddleware');
const rateLimit        = require('express-rate-limit');

// Rate-limit CV generation (expensive — PDF render)
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'Too many CV generation requests. Please wait before trying again.' },
  skipFailedRequests: true,
});

// All routes require auth + candidate role
router.use(verifyToken);
router.use(restrictTo('candidate'));

// GET  /api/v1/candidate/cv-generator/templates
router.get('/cv-generator/templates', ctrl.getTemplates);

// GET  /api/v1/candidate/cv-generator/list
router.get('/cv-generator/list', ctrl.listGeneratedCVs);

// POST /api/v1/candidate/cv-generator/preview
router.post('/cv-generator/preview', ctrl.previewCV);

// POST /api/v1/candidate/cv-generator/generate
router.post('/cv-generator/generate', generateLimiter, ctrl.generateCV);

// POST /api/v1/candidate/cv-generator/regenerate/:cvId
router.post('/cv-generator/regenerate/:cvId', generateLimiter, ctrl.regenerateCV);

// GET  /api/v1/candidate/cv-generator/download/:cvId
router.get('/cv-generator/download/:cvId', ctrl.downloadGeneratedCV);

module.exports = router;
