import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../lib/api';
import type { SearchParams } from '../types';

const HISTORY_KEY = 'social_search_history';
const HISTORY_MAX = 20;

export interface SearchHistoryEntry {
  query: string;
  type?: string;
  timestamp: number;
}

export const POPULAR_SEARCH_CATEGORIES = [
  { label: 'Frontend Engineers', query: 'frontend engineer', type: 'freelancer' },
  { label: 'Product Designers', query: 'product designer', type: 'freelancer' },
  { label: 'Startups', query: 'startup', type: 'company' },
  { label: 'Non-profits', query: 'non-profit', type: 'organization' },
  { label: 'Marketing', query: 'marketing', type: 'candidate' },
  { label: 'Data Science', query: 'data science', type: 'candidate' },
];

const formatFollowerCount = (n?: number): string => {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(v);
};

export const socialSearchService = {
  // GET /social-search/profiles
  searchProfiles: (params: SearchParams) =>
    api.get('/social-search/profiles', {
      params: { page: 1, limit: 20, ...params },
    }),

  // GET /social-search/posts
  searchPosts: (query: string, page = 1, limit = 10) =>
    api.get('/social-search/posts', { params: { q: query, page, limit } }),

  // GET /social-search/hashtags
  searchHashtags: (query: string, trending = false) =>
    api.get('/social-search/hashtags', { params: { q: query, trending } }),

  // GET /social-search/unified
  unifiedSearch: (query: string) =>
    api.get('/social-search/unified', { params: { q: query } }),

  getPopularSearchCategories: () => POPULAR_SEARCH_CATEGORIES,

  formatFollowerCount,

  // ---------- SEARCH HISTORY (AsyncStorage) ----------
  addToSearchHistory: async (query: string, type?: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history: SearchHistoryEntry[] = raw ? JSON.parse(raw) : [];
      const filtered = history.filter((h) => h.query !== trimmed);
      const updated: SearchHistoryEntry[] = [
        { query: trimmed, type, timestamp: Date.now() },
        ...filtered,
      ].slice(0, HISTORY_MAX);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      /* noop */
    }
  },

  getSearchHistory: async (): Promise<SearchHistoryEntry[]> => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      return raw ? (JSON.parse(raw) as SearchHistoryEntry[]) : [];
    } catch {
      return [];
    }
  },

  removeSearchHistoryEntry: async (query: string) => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history: SearchHistoryEntry[] = raw ? JSON.parse(raw) : [];
      const filtered = history.filter((h) => h.query !== query);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    } catch {
      /* noop */
    }
  },

  clearSearchHistory: async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch {
      /* noop */
    }
  },
};

export default socialSearchService;
