/**
 * server/src/routes/publicProfileRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Public Profile Routes
 * Mount in index.js: app.use('/api/v1/public-profile', publicProfileRoutes);
 *
 * ROUTE ORDER RULES (mirrors the rest of the codebase):
 *   Static named routes (/me, /search, /featured, /u/:username, /sync, /visibility)
 *   MUST be registered BEFORE any /:userId wildcard routes.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * Method  | Path                               | Auth          | Description
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * GET     | /                                  | ✅ owner      | Get own public profile
 * PUT     | /                                  | ✅ owner      | Update own public profile
 * PATCH   | /visibility                        | ✅ owner      | Toggle visibility settings
 * POST    | /sync                              | ✅ owner      | Sync from main profile
 * GET     | /search                            | Public        | Search public profiles
 * GET     | /featured                          | Public        | Get featured profiles
 * GET     | /u/:username                       | Public (+opt) | Get by username slug
 * GET     | /:userId                           | Public (+opt) | Get by user ID
 * ─────────────────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');

const ctrl = require('../controllers/publicProfileController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

// ── Validation middleware ─────────────────────────────────────────────────────

const updateValidation = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be 2–100 characters'),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3–50 characters')
    .matches(/^[a-z0-9_.-]+$/i)
    .withMessage('Username may only contain letters, numbers, underscores, dots, and hyphens'),

  body('headline')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Headline cannot exceed 200 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Bio cannot exceed 2000 characters'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),

  body('website')
    .optional()
    .trim()
    .isURL({ require_protocol: false })
    .withMessage('Invalid website URL'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{8,15}$/)
    .withMessage('Invalid phone number'),

  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),

  body('availability')
    .optional()
    .isIn(['available', 'partially-available', 'not-available'])
    .withMessage('Invalid availability value'),
];

// ══════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES — authenticated owner only
// ══════════════════════════════════════════════════════════════════════════════

// Get own public profile (all fields)
router.get('/', verifyToken, ctrl.getMyPublicProfile);

// Update own public profile
router.put('/', verifyToken, updateValidation, ctrl.updatePublicProfile);

// Toggle visibility settings
router.patch('/visibility', verifyToken, ctrl.toggleVisibility);

// Sync from main profile (one-click)
router.post('/sync', verifyToken, ctrl.syncFromMainProfile);

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES — static named before /:userId wildcard
// ══════════════════════════════════════════════════════════════════════════════

// Search profiles
router.get('/search', optionalAuth, ctrl.searchPublicProfiles);

// Featured profiles
router.get('/featured', optionalAuth, ctrl.getFeaturedProfiles);

// Get by username slug (e.g. /u/johndoe)
router.get('/u/:username', optionalAuth, ctrl.getPublicProfileByUsername);

// ══════════════════════════════════════════════════════════════════════════════
// PARAMETERIZED — MUST come last
// ══════════════════════════════════════════════════════════════════════════════

// Get by userId
router.get('/:userId', optionalAuth, ctrl.getPublicProfileById);

module.exports = router;