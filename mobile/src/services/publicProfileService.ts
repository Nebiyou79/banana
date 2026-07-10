/**
 * mobile/src/social/services/publicProfileService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API service for the /api/v1/public-profile backend (Phase 1).
 *
 * Mirrors the backend route surface exactly:
 *   GET    /public-profile              → getMyPublicProfile
 *   PUT    /public-profile              → updatePublicProfile
 *   PATCH  /public-profile/visibility   → toggleVisibility
 *   POST   /public-profile/sync         → syncFromMainProfile
 *   GET    /public-profile/search       → searchPublicProfiles
 *   GET    /public-profile/featured     → getFeaturedProfiles
 *   GET    /public-profile/u/:username  → getByUsername
 *   GET    /public-profile/:userId      → getById
 *
 * All methods return the raw Axios response so callers can access
 * res.data?.data (same pattern as profileSocialService / followService).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import api from "../lib/api";


// ── Types ─────────────────────────────────────────────────────────────────────

export interface PublicProfileUpdateData {
  displayName?:     string;
  username?:        string;
  headline?:        string;
  bio?:             string;
  location?:        string;
  phone?:           string;
  email?:           string;
  website?:         string;
  availability?:    'available' | 'partially-available' | 'not-available';
  skills?:          string[];
  languages?:       { language: string; proficiency: string }[];
  interests?:       string[];
  socialLinks?: {
    linkedin?:  string;
    github?:    string;
    twitter?:   string;
    instagram?: string;
    facebook?:  string;
    tiktok?:    string;
    telegram?:  string;
    youtube?:   string;
    website?:   string;
  };
  // Role-specific — backend whitelists by role
  education?:       unknown[];
  experience?:      unknown[];
  certifications?:  unknown[];
  portfolio?:       unknown[];
  services?:        unknown[];
  companyInfo?:     Record<string, unknown>;
  hourlyRate?:      { amount: number; currency: string };
  metaDescription?: string;
  metaKeywords?:    string[];
}

export interface VisibilityUpdate {
  isPubliclyVisible?: boolean;
  visibility?: {
    profile?:        'public' | 'connections' | 'private';
    email?:          boolean;
    phone?:          boolean;
    location?:       boolean;
    education?:      boolean;
    experience?:     boolean;
    certifications?: boolean;
    portfolio?:      boolean;
    services?:       boolean;
    socialLinks?:    boolean;
  };
}

export interface PublicProfileSearchParams {
  q?:     string;
  role?:  'candidate' | 'freelancer' | 'company' | 'organization';
  page?:  number;
  limit?: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const publicProfileService = {
  /**
   * GET /api/v1/public-profile
   * Returns the current user's own public profile (all fields).
   * Lazy-creates it on the backend if it doesn't exist yet.
   */
  getMyPublicProfile: () =>
    api.get('/public-profile'),

  /**
   * PUT /api/v1/public-profile
   * Partial update — only provided fields are changed.
   */
  updatePublicProfile: (data: PublicProfileUpdateData) =>
    api.put('/public-profile', data),

  /**
   * PATCH /api/v1/public-profile/visibility
   * Toggle overall visibility or granular field visibility.
   */
  toggleVisibility: (update: VisibilityUpdate) =>
    api.patch('/public-profile/visibility', update),

  /**
   * POST /api/v1/public-profile/sync
   * One-click pull from main Profile + User models.
   */
  syncFromMainProfile: () =>
    api.post('/public-profile/sync'),

  /**
   * GET /api/v1/public-profile/search?q=&role=&page=&limit=
   */
  searchPublicProfiles: (params: PublicProfileSearchParams = {}) =>
    api.get('/public-profile/search', {
      params: { page: 1, limit: 20, ...params },
    }),

  /**
   * GET /api/v1/public-profile/featured?role=&limit=
   */
  getFeaturedProfiles: (params: { role?: string; limit?: number } = {}) =>
    api.get('/public-profile/featured', {
      params: { limit: 10, ...params },
    }),

  /**
   * GET /api/v1/public-profile/u/:username
   */
  getByUsername: (username: string) =>
    api.get(`/public-profile/u/${username}`),

  /**
   * GET /api/v1/public-profile/:userId
   */
  getById: (userId: string) =>
    api.get(`/public-profile/${userId}`),
};

export default publicProfileService;