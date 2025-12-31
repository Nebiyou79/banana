const express = require('express');
const router = express.Router();
const searchController = require('../controllers/socialSearchController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Apply optional authentication middleware
router.use(optionalAuth);

// Search profiles (users, candidates, freelancers, companies, organizations)
router.get('/profiles', searchController.searchProfiles);

// Search posts
router.get('/posts', searchController.searchPosts);

// Global search across all content types
router.get('/global', searchController.globalSearch);

// Get trending hashtags
router.get('/trending/hashtags', searchController.getTrendingHashtags);

// Get search suggestions for all entity types
router.get('/suggestions', searchController.getSearchSuggestions);

// Advanced search endpoints
router.get('/advanced/users', searchController.searchProfiles);
router.get('/advanced/companies', (req, res, next) => {
  req.query.type = 'company';
  searchController.searchProfiles(req, res, next);
});
router.get('/advanced/organizations', (req, res, next) => {
  req.query.type = 'organization';
  searchController.searchProfiles(req, res, next);
});
router.get('/advanced/freelancers', (req, res, next) => {
  req.query.type = 'freelancer';
  searchController.searchProfiles(req, res, next);
});
router.get('/advanced/candidates', (req, res, next) => {
  req.query.type = 'candidate';
  searchController.searchProfiles(req, res, next);
});

module.exports = router;