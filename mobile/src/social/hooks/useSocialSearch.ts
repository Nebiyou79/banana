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
import type { SearchParams, SearchResponse } from '../types';
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

export const useSocialSearch = (params: SearchParams) => {
  const debouncedQuery = useDebounced(params.q ?? '');
  const hasTypeFilter = Boolean(params.type && params.type !== 'all');
  const queryLen = debouncedQuery.trim().length;

  return useQuery({
    queryKey: SOCIAL_KEYS.searchProfiles({ ...params, q: debouncedQuery }),
    queryFn: async () => {
      const res = await socialSearchService.searchProfiles({
        ...params,
        q: debouncedQuery,
      });
      const raw = res.data?.data ?? res.data;
      // Normalise to SearchResponse
      return {
        results: raw?.results ?? raw?.data ?? raw ?? [],
        pagination: raw?.pagination ?? {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
        total: raw?.total ?? raw?.pagination?.total ?? 0,
      } as SearchResponse;
    },
    enabled: queryLen >= 2 || hasTypeFilter,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
};

export const useSearchPosts = (params: {
  q: string;
  hashtag?: string;
  type?: string;
}) =>
  useQuery({
    queryKey: SOCIAL_KEYS.searchPosts(params),
    queryFn: async () => {
      const res = await socialSearchService.searchPosts(params);
      return res.data?.data ?? res.data;
    },
    enabled: (params.q?.length ?? 0) >= 2 || Boolean(params.hashtag),
    staleTime: 1000 * 30,
  });

export const useSearchHashtags = (query: string, trending = false) =>
  useQuery({
    queryKey: SOCIAL_KEYS.searchHashtags(query),
    queryFn: async () => {
      const res = await socialSearchService.searchHashtags(query, trending);
      return res.data?.data ?? res.data;
    },
    enabled: trending || (query?.length ?? 0) >= 2,
    staleTime: 1000 * 60,
  });

export const useSearchUnified = (params: SearchParams) => {
  const debouncedQuery = useDebounced(params.q ?? '');
  return useQuery({
    queryKey: SOCIAL_KEYS.unifiedSearch(debouncedQuery),
    queryFn: async () => {
      const res = await socialSearchService.unified({
        ...params,
        q: debouncedQuery,
      });
      return res.data?.data ?? res.data;
    },
    enabled: (debouncedQuery?.length ?? 0) >= 2,
    staleTime: 1000 * 30,
  });
};

// ── History ────────────────────────────────────────────────────
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