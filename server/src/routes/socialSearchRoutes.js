// =============================================================================
// FILE 6: socialSearchRoutes.js — CORRECTED WITH OPTIONAL AUTH
// =============================================================================

/**
 * server/src/routes/socialSearchRoutes.js
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v4 — Social Search Routes (CORRECTED)
 * 
 * Uses optionalAuth middleware to allow both authenticated and
 * unauthenticated users to search, while providing enhanced results
 * (follow state, mutual status) for authenticated users.
 * ────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const searchController = require('../controllers/socialSearchController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Apply optional authentication to all search routes
router.use(optionalAuth);

// ── Core search endpoints ──────────────────────────────────────────────

// Profile/user search with filters
router.get('/profiles', searchController.searchProfiles);

// Post search
router.get('/posts', searchController.searchPosts);

// Hashtag search (prefix match)
router.get('/hashtags', searchController.searchHashtags);

// Trending hashtags (separate endpoint for clarity)
router.get('/trending', searchController.getTrendingHashtags);

// Typeahead suggestions for search bars
router.get('/suggestions', searchController.getSearchSuggestions);

// ── Advanced role-specific search shortcuts ─────────────────────────────

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