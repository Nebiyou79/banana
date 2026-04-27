// src/social/services/socialSearchService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../lib/api';
import type { SearchParams } from '../types';

const HISTORY_KEY = 'social_search_history';
const HISTORY_LIMIT = 15;

export interface SearchHistoryEntry {
  query: string;
  type?: string;
  /** ISO timestamp — used for sorting and dedupe */
  createdAt: string;
}

const sanitizeQuery = (q?: string) => (q ?? '').trim();

/**
 * socialSearchService
 * -----------------------------------------------------------------------------
 * Backend endpoints:
 *   GET  /social-search/profiles   ← authoritative people search
 *   GET  /social-search/posts      ← post search
 *   GET  /social-search/hashtags   ← hashtag search / trending
 *   GET  /social-search/unified    ← cross-entity search
 *
 * History is local-only (AsyncStorage). Sanitization, deduping, and the
 * 15-entry cap all live here so hooks/components don't repeat the logic.
 */
export const socialSearchService = {
  // ── Remote search ─────────────────────────────────────────────────────
  searchProfiles: (params: SearchParams) => {
    const q = sanitizeQuery(params.q);
    return api.get('/social-search/profiles', {
      params: {
        page: 1,
        limit: 20,
        ...params,
        q,
      },
    });
  },

  searchPosts: (params: {
    q?: string;
    hashtag?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get('/social-search/posts', {
      params: {
        page: 1,
        limit: 20,
        ...params,
        q: sanitizeQuery(params.q),
      },
    }),

  searchHashtags: (query: string, trending = false) =>
    api.get('/social-search/hashtags', {
      params: { q: sanitizeQuery(query), trending },
    }),

  unified: (params: SearchParams) => {
    const q = sanitizeQuery(params.q);
    return api.get('/social-search/unified', {
      params: { page: 1, limit: 20, ...params, q },
    });
  },

  // ── Local history ─────────────────────────────────────────────────────
  getHistory: async (): Promise<SearchHistoryEntry[]> => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  addHistory: async (entry: {
    query: string;
    type?: string;
  }): Promise<SearchHistoryEntry[]> => {
    const query = sanitizeQuery(entry.query);
    if (!query) {
      // Don't store empty queries, but return current history so the
      // mutation hook still has something to set.
      return socialSearchService.getHistory();
    }
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const current: SearchHistoryEntry[] = raw ? JSON.parse(raw) : [];
      const lower = query.toLowerCase();
      const deduped = current.filter(
        (e) => e?.query?.toLowerCase() !== lower,
      );
      const next: SearchHistoryEntry[] = [
        { query, type: entry.type, createdAt: new Date().toISOString() },
        ...deduped,
      ].slice(0, HISTORY_LIMIT);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    } catch {
      return [];
    }
  },

  removeHistoryEntry: async (query: string): Promise<SearchHistoryEntry[]> => {
    const lower = sanitizeQuery(query).toLowerCase();
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const current: SearchHistoryEntry[] = raw ? JSON.parse(raw) : [];
      const next = current.filter(
        (e) => e?.query?.toLowerCase() !== lower,
      );
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    } catch {
      return [];
    }
  },

  clearHistory: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch {
      /* noop */
    }
  },
};

export default socialSearchService;