// src/social/services/socialSearchService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../lib/api';
import type { SearchParams } from '../types';

const HISTORY_KEY = 'social_search_history';
const HISTORY_LIMIT = 15;

export interface SearchHistoryEntry {
  query: string;
  type?: string;
  createdAt: string;
}

export const socialSearchService = {
  // Profile search — the authoritative endpoint for people search
  searchProfiles: (params: SearchParams) =>
    api.get('/social-search/profiles', {
      params: { page: 1, limit: 20, ...params },
    }),

  searchPosts: (params: {
    q: string;
    hashtag?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get('/social-search/posts', {
      params: { page: 1, limit: 20, ...params },
    }),

  searchHashtags: (query: string, trending = false) =>
    api.get('/social-search/hashtags', { params: { q: query, trending } }),

  unified: (params: SearchParams) =>
    api.get('/social-search/unified', {
      params: { page: 1, limit: 20, ...params },
    }),

  // ── History (local AsyncStorage) ──────────────────────────────
  getHistory: async (): Promise<SearchHistoryEntry[]> => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addHistory: async (entry: {
    query: string;
    type?: string;
  }): Promise<SearchHistoryEntry[]> => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const current: SearchHistoryEntry[] = raw ? JSON.parse(raw) : [];
      const deduped = current.filter(
        (e) => e.query.toLowerCase() !== entry.query.toLowerCase()
      );
      const next: SearchHistoryEntry[] = [
        { ...entry, createdAt: new Date().toISOString() },
        ...deduped,
      ].slice(0, HISTORY_LIMIT);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    } catch {
      return [];
    }
  },

  removeHistoryEntry: async (query: string): Promise<SearchHistoryEntry[]> => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const current: SearchHistoryEntry[] = raw ? JSON.parse(raw) : [];
      const next = current.filter(
        (e) => e.query.toLowerCase() !== query.toLowerCase()
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