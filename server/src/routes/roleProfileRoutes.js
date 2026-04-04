const express = require('express');
const router = express.Router();
const roleProfileController = require('../controllers/roleProfileController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Candidate routes
router.get('/candidate', roleProfileController.getCandidateProfile);
router.put('/candidate', roleProfileController.updateCandidateProfile);

// Company routes
router.get('/company', roleProfileController.getCompanyProfile);
router.put('/company', roleProfileController.updateCompanyProfile);

// Freelancer routes
router.get('/freelancer', roleProfileController.getFreelancerProfile);
router.put('/freelancer', roleProfileController.updateFreelancerProfile);

// Organization routes
router.get('/organization', roleProfileController.getOrganizationProfile);
router.put('/organization', roleProfileController.updateOrganizationProfile);

module.exports = router;