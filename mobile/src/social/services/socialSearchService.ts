// =============================================================================
// FILE 4: mobile/src/social/services/socialSearchService.ts — UPDATED
// =============================================================================

/**
 * mobile/src/social/services/socialSearchService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * BananaLink Social Search Service v4
 * 
 * Aligns with socialSearchController.js v4:
 * - searchProfiles returns followState and isMutual per result
 * - getSuggestions for typeahead (≤8 results, fast)
 * - searchHashtags with trending support
 * - Local search history via AsyncStorage
 * ─────────────────────────────────────────────────────────────────────────────
 */

import api from '../../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchType = 'all' | 'candidate' | 'freelancer' | 'company' | 'organization';
export type SearchSortBy = 'relevance' | 'followers' | 'recent' | 'alphabetical';
export type FollowState = 'following' | 'not_following' | 'blocked';

export interface SearchResult {
  _id: string;
   type: SearchType;
  name: string;
  avatar: string | null;
  role: string;
  headline: string | null;
  bio?: string | null;
  location?: string | null;
  skills?: string[];
  followerCount: number;
  followingCount?: number;
  postCount?: number;
  verificationStatus: string;
  isOnline?: boolean;
  lastSeen?: string | null;
  followState: FollowState;
  isMutual: boolean;
  joinedDate?: string;
}

export interface SearchSuggestion {
  _id: string;
  type: 'user';
  name: string;
  avatar: string | null;
  role: string;
  headline: string | null;
  followerCount: number;
  verificationStatus: string;
  followState: FollowState;
}

export interface SearchParams {
  q?: string;
  type?: SearchType;
  location?: string;
  skills?: string | string[];
  verificationStatus?: string;
  sortBy?: SearchSortBy;
  page?: number;
  limit?: number;
}

export interface SearchPostsParams {
  q?: string;
  hashtag?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface SearchResponse {
  results: SearchResult[];
  pagination: Pagination;
  total: number;
}

export interface SearchProfilesApiResponse {
  success: boolean;
  data: SearchResult[];
  pagination: Pagination;
  filters?: Record<string, unknown>;
}

export interface SearchHashtagResult {
  name: string;
  postsCount: number;
  recentPosts?: number;
  trendScore?: number;
}

export interface SearchHistoryEntry {
  query: string;
  type?: SearchType;
  timestamp: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const POPULAR_SEARCH_CATEGORIES: Array<{
  key: SearchType;
  label: string;
  icon: string;
}> = [
  { key: 'all', label: 'All', icon: 'globe-outline' },
  { key: 'candidate', label: 'Candidates', icon: 'person-outline' },
  { key: 'freelancer', label: 'Freelancers', icon: 'briefcase-outline' },
  { key: 'company', label: 'Companies', icon: 'business-outline' },
  { key: 'organization', label: 'Organizations', icon: 'people-outline' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanParams = (p: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(p).filter(([, v]) => v !== undefined && v !== '')
  );

// ─── Service ──────────────────────────────────────────────────────────────────

export const socialSearchService = {
  /**
   * GET /api/v1/social-search/profiles
   * Full people search with server-side self-exclusion.
   * Returns followState and isMutual for authenticated users.
   */
  searchProfiles: (params: SearchParams = {}) => {
    const skills = Array.isArray(params.skills)
      ? params.skills.join(',')
      : params.skills;

    return api.get<SearchProfilesApiResponse>('/social-search/profiles', {
      params: cleanParams({
        ...params,
        skills,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      }),
    });
  },

  /**
   * GET /api/v1/social-search/suggestions?q=...&type=...
   * Fast typeahead — returns ≤8 results for instant dropdown.
   */
  getSuggestions: (q: string, type?: SearchType) =>
    api.get<{ success: boolean; data: SearchSuggestion[] }>(
      '/social-search/suggestions',
      { params: cleanParams({ q, type }) }
    ),

  /**
   * GET /api/v1/social-search/posts
   */
  searchPosts: (params: SearchPostsParams) =>
    api.get('/social-search/posts', {
      params: cleanParams({ ...params }),
    }),

  /**
   * GET /api/v1/social-search/hashtags?q=...&trending=true
   */
  searchHashtags: (q: string, trending = false) =>
    api.get<{
      success: boolean;
      data: { hashtags: SearchHashtagResult[] };
    }>('/social-search/hashtags', {
      params: cleanParams({ q, trending: trending ? 'true' : undefined }),
    }),

  /**
   * GET /api/v1/social-search/trending
   */
  getTrending: (days = 7, limit = 20) =>
    api.get<{
      success: boolean;
      data: { hashtags: SearchHashtagResult[] };
    }>('/social-search/trending', {
      params: { days, limit },
    }),
};

// ─── Local Search History ─────────────────────────────────────────────────────

const HISTORY_KEY = '@bananalink:search_history';
const MAX_HISTORY = 15;

export const searchHistoryStorage = {
  async get(): Promise<SearchHistoryEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async add(
    entry: Omit<SearchHistoryEntry, 'timestamp'>
  ): Promise<SearchHistoryEntry[]> {
    try {
      const existing = await searchHistoryStorage.get();
      // Remove duplicate, add at front
      const filtered = existing.filter((e) => e.query !== entry.query);
      const updated: SearchHistoryEntry[] = [
        { ...entry, timestamp: new Date().toISOString() },
        ...filtered,
      ].slice(0, MAX_HISTORY);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  async remove(query: string): Promise<SearchHistoryEntry[]> {
    try {
      const existing = await searchHistoryStorage.get();
      const updated = existing.filter((e) => e.query !== query);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch {
      // Silently fail — history is not critical
    }
  },
};

export default socialSearchService;