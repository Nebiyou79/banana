// src/social/hooks/useSocialSearch.ts
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  socialSearchService,
  type SearchHistoryEntry,
} from '../services/socialSearchService';
import type {
  SearchParams,
  SearchResponse,
  SearchResult,
} from '../types';
import { SOCIAL_KEYS } from './queryKeys';

const DEBOUNCE_MS = 300;

const useDebounced = (value: string, delay = DEBOUNCE_MS) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

// ──────────────────────────────────────────────────────────────────────────────
// Result normalization
// ──────────────────────────────────────────────────────────────────────────────
//
// Different endpoints return different envelopes. We normalize every shape
// into a single SearchResponse so consumers don't have to defend.
//   - Express controllers usually return { success, data: { results, pagination } }
//   - Some legacy endpoints return { success, data: [...] }
//   - Some return the array directly
// ──────────────────────────────────────────────────────────────────────────────

const normalizeProfiles = (raw: any): SearchResponse => {
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

  // Normalize each entry — backend may return a Profile object, a User, or
  // a flattened search hit. We collapse them onto the SearchResult shape.
  const normalized: SearchResult[] = results
    .map((entry: any): SearchResult | null => {
      if (!entry) return null;
      const u = entry.user ?? entry;
      const id = u._id ?? entry._id;
      if (!id) return null;
      return {
        _id: id,
        name: u.name ?? entry.name ?? 'Unknown',
        avatar: u.avatar ?? entry.avatar ?? entry.avatarUrl,
        role: u.role ?? entry.role ?? 'candidate',
        headline: entry.headline ?? u.headline,
        followerCount:
          entry.socialStats?.followerCount ??
          u.socialStats?.followerCount ??
          entry.followerCount,
        verificationStatus:
          u.verificationStatus ?? entry.verificationStatus,
        location: entry.location ?? u.location,
        skills: entry.skills,
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
};

// ──────────────────────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────────────────────

/**
 * People search. Debounces the query (300ms), enables only when the trimmed
 * query is ≥2 chars OR a non-default type filter is active. Returns a
 * normalized SearchResponse so consumers can rely on `.results` and
 * `.pagination`.
 */
export const useSocialSearch = (params: SearchParams) => {
  const debouncedQuery = useDebounced(params.q ?? '');
  const trimmed = debouncedQuery.trim();
  const hasTypeFilter = Boolean(params.type && params.type !== 'all');

  return useQuery<SearchResponse>({
    queryKey: SOCIAL_KEYS.searchProfiles({ ...params, q: trimmed }),
    queryFn: async () => {
      const res = await socialSearchService.searchProfiles({
        ...params,
        q: trimmed,
      });
      return normalizeProfiles(res);
    },
    enabled: trimmed.length >= 2 || hasTypeFilter,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
};

export const useSearchPosts = (params: {
  q: string;
  hashtag?: string;
  type?: string;
}) => {
  const debouncedQuery = useDebounced(params.q ?? '');
  return useQuery({
    queryKey: SOCIAL_KEYS.searchPosts({ ...params, q: debouncedQuery }),
    queryFn: async () => {
      const res = await socialSearchService.searchPosts({
        ...params,
        q: debouncedQuery,
      });
      return res.data?.data ?? res.data;
    },
    enabled:
      debouncedQuery.trim().length >= 2 || Boolean(params.hashtag),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
};

export const useSearchHashtags = (query: string, trending = false) => {
  const debouncedQuery = useDebounced(query);
  return useQuery({
    queryKey: SOCIAL_KEYS.searchHashtags(debouncedQuery, trending),
    queryFn: async () => {
      const res = await socialSearchService.searchHashtags(
        debouncedQuery,
        trending,
      );
      return res.data?.data ?? res.data;
    },
    enabled: trending || debouncedQuery.trim().length >= 2,
    staleTime: 1000 * 60,
  });
};

export const useSearchUnified = (params: SearchParams) => {
  const debouncedQuery = useDebounced(params.q ?? '');
  return useQuery({
    queryKey: SOCIAL_KEYS.searchUnified({ ...params, q: debouncedQuery }),
    queryFn: async () => {
      const res = await socialSearchService.unified({
        ...params,
        q: debouncedQuery,
      });
      return res.data?.data ?? res.data;
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 1000 * 30,
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// History (local AsyncStorage, surfaced via Query for cache consistency)
// ──────────────────────────────────────────────────────────────────────────────

export const useSearchHistory = () =>
  useQuery({
    queryKey: SOCIAL_KEYS.searchHistory,
    queryFn: () => socialSearchService.getHistory(),
    staleTime: Infinity,
  });

export const useAddSearchHistory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: { query: string; type?: string }) =>
      socialSearchService.addHistory(entry),
    onSuccess: (next: SearchHistoryEntry[]) => {
      qc.setQueryData(SOCIAL_KEYS.searchHistory, next);
    },
  });
};

export const useRemoveSearchHistoryEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (query: string) =>
      socialSearchService.removeHistoryEntry(query),
    onSuccess: (next: SearchHistoryEntry[]) => {
      qc.setQueryData(SOCIAL_KEYS.searchHistory, next);
    },
  });
};

export const useClearSearchHistory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => socialSearchService.clearHistory(),
    onSuccess: () => {
      qc.setQueryData(SOCIAL_KEYS.searchHistory, []);
    },
  });
};