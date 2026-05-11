// =============================================================================
// FILE 7: mobile/src/social/hooks/useSocialSearch.ts — UPDATED
// =============================================================================

/**
 * useSocialSearch — search hooks
 * ─────────────────────────────────────────────────────────────────────────────
 * Aligns with socialSearchController.js v4:
 * - searchProfiles returns normalized results with followState and isMutual
 * - Suggestions hook for typeahead
 * - History hooks with proper cache management
 * - Self-exclusion handled server-side (belt-and-suspenders)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  socialSearchService,
  searchHistoryStorage,  // ← ADD THIS
  type SearchHistoryEntry,
  type SearchType,
} from '../services/socialSearchService';
import type { SearchParams, SearchResponse, SearchResult } from '../types';
import { SOCIAL_KEYS } from './queryKeys';

// ─── Debounce ─────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 300;

const useDebounced = (value: string, delay = DEBOUNCE_MS) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

// ─── Result normalization ─────────────────────────────────────────────────────

/**
 * Normalize server response into a consistent SearchResponse shape.
 * Handles various response envelopes from different endpoints.
 */
function normalizeProfiles(raw: any): SearchResponse {
  // Drill into response layers
  const inner = raw?.data?.data ?? raw?.data ?? raw;

  let results: SearchResult[] = [];
  if (Array.isArray(inner)) {
    results = inner;
  } else if (Array.isArray(inner?.results)) {
    results = inner.results;
  } else if (Array.isArray(inner?.data)) {
    results = inner.data;
  } else if (Array.isArray(inner?.profiles)) {
    results = inner.profiles;
  }

  // Normalize each entry to SearchResult shape
  const normalized: SearchResult[] = results
    .map((entry: any): SearchResult | null => {
      if (!entry) return null;
      return {
        _id: entry._id,
        type: entry.type ?? entry.role ?? 'candidate',
        name: entry.name ?? 'Unknown',
        avatar: entry.avatar ?? null,
        role: entry.role ?? 'candidate',
        headline: entry.headline ?? null,
        followerCount: entry.followerCount ?? 0,
        verificationStatus: entry.verificationStatus ?? 'none',
        followState: entry.followState ?? 'not_following',
        isMutual: entry.isMutual ?? false,
        isOnline: entry.isOnline ?? false,
        lastSeen: entry.lastSeen ?? null,
        skills: entry.skills ?? [],
        location: entry.location ?? null,
        bio: entry.bio ?? null,
      };
    })
    .filter(Boolean) as SearchResult[];

  const pagination = inner?.pagination ?? {
    page: 1,
    limit: 20,
    total: normalized.length,
    pages: 1,
  };

  return {
    results: normalized,
    pagination,
    total: pagination.total ?? normalized.length,
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * People search with debounce.
 * Server excludes the current user automatically.
 * Returns normalized SearchResponse with followState per result.
 */
export function useSocialSearch(params: SearchParams) {
  const debouncedQuery = useDebounced(params.q ?? '', DEBOUNCE_MS);
  const trimmed = debouncedQuery.trim();
  const hasTypeFilter = Boolean(params.type && params.type !== 'all');

  return useQuery<SearchResponse>({
    queryKey: SOCIAL_KEYS.searchProfiles({
      ...params,
      q: trimmed,
    }),
    queryFn: async () => {
      const res = await socialSearchService.searchProfiles({
        ...params,
        q: trimmed,
      });
      return normalizeProfiles(res);
    },
    enabled: trimmed.length >= 2 || hasTypeFilter,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

/**
 * Typeahead suggestions for instant dropdown.
 * Returns ≤8 results, debounced at 200ms for perceived speed.
 */
export function useSearchSuggestions(q: string, type?: SearchType) {
  const debouncedQuery = useDebounced(q, 200);

  return useQuery({
    queryKey: SOCIAL_KEYS.searchSuggestions(debouncedQuery, type),
    queryFn: async () => {
      const res = await socialSearchService.getSuggestions(
        debouncedQuery,
        type
      );
      return res.data?.data ?? [];
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 15_000,
    placeholderData: (prev) => prev ?? [],
  });
}

export function useSearchPosts(params: {
  q: string;
  hashtag?: string;
  type?: string;
}) {
  const debouncedQuery = useDebounced(params.q ?? '', DEBOUNCE_MS);

  return useQuery({
    queryKey: SOCIAL_KEYS.searchPosts({
      ...params,
      q: debouncedQuery,
    }),
    queryFn: async () => {
      const res = await socialSearchService.searchPosts({
        ...params,
        q: debouncedQuery,
      });
      return res.data?.data ?? res.data;
    },
    enabled:
      debouncedQuery.trim().length >= 2 || Boolean(params.hashtag),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useSearchHashtags(query: string, trending = false) {
  const debouncedQuery = useDebounced(query, DEBOUNCE_MS);

  return useQuery({
    queryKey: SOCIAL_KEYS.searchHashtags(debouncedQuery, trending),
    queryFn: async () => {
      const res = await socialSearchService.searchHashtags(
        debouncedQuery,
        trending
      );
      return res.data?.data ?? res.data;
    },
    enabled: trending || debouncedQuery.trim().length >= 2,
    staleTime: 60_000,
  });
}

export function useTrendingHashtags(days = 7, limit = 20) {
  return useQuery({
    queryKey: SOCIAL_KEYS.trendingHashtags(days, limit),
    queryFn: async () => {
      const res = await socialSearchService.getTrending(days, limit);
      return res.data?.data?.hashtags ?? [];
    },
    staleTime: 120_000, // 2 minutes
  });
}

// ─── Search History Hooks ─────────────────────────────────────────────────────

export function useSearchHistory() {
  return useQuery<SearchHistoryEntry[]>({
    queryKey: SOCIAL_KEYS.searchHistory,
    queryFn: () => searchHistoryStorage.get(),
    staleTime: Infinity,
  });
}

export function useAddSearchHistory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (entry: { query: string; type?: SearchType }) =>
      searchHistoryStorage.add(entry),
    onSuccess: (next) => {
      qc.setQueryData(SOCIAL_KEYS.searchHistory, next);
    },
  });
}

export function useRemoveSearchHistoryEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (query: string) =>
      searchHistoryStorage.remove(query),
    onSuccess: (next) => {
      qc.setQueryData(SOCIAL_KEYS.searchHistory, next);
    },
  });
}

export function useClearSearchHistory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => searchHistoryStorage.clear(),
    onSuccess: () => {
      qc.setQueryData(SOCIAL_KEYS.searchHistory, []);
    },
  });
}