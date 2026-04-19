import { useEffect, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { socialSearchService } from '../services/socialSearchService';
import { SOCIAL_KEYS } from './queryKeys';
import type {
  SearchParams,
  SearchResponse,
} from '../types';
import type { SearchHistoryEntry } from '../services/socialSearchService';

/**
 * Local debounce hook. Avoids pulling in lodash.
 */
function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

/**
 * Profile search. Debounces the `q` param so we don't hammer the API
 * on every keystroke. Query is disabled until the debounced term has at
 * least 2 characters.
 */
export const useSocialSearch = (params: SearchParams) => {
  const debouncedQuery = useDebounce(params.q, 400);

  return useQuery({
    queryKey: SOCIAL_KEYS.searchProfiles({
      ...params,
      q: debouncedQuery,
    }),
    queryFn: async () => {
      const res = await socialSearchService.searchProfiles({
        ...params,
        q: debouncedQuery,
      });
      return (res.data?.data ?? res.data) as SearchResponse;
    },
    enabled: (debouncedQuery?.length ?? 0) >= 2,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
};

export const useSearchPosts = (query: string, page = 1, limit = 10) => {
  const debounced = useDebounce(query, 400);
  return useQuery({
    queryKey: SOCIAL_KEYS.searchPosts(debounced),
    queryFn: async () => {
      const res = await socialSearchService.searchPosts(debounced, page, limit);
      return res.data?.data ?? res.data;
    },
    enabled: (debounced?.length ?? 0) >= 2,
    staleTime: 1000 * 30,
  });
};

export const useSearchHashtags = (query: string, trending = false) => {
  const debounced = useDebounce(query, 400);
  return useQuery({
    queryKey: SOCIAL_KEYS.searchHashtags(debounced),
    queryFn: async () => {
      const res = await socialSearchService.searchHashtags(debounced, trending);
      return res.data?.data ?? res.data;
    },
    enabled: (debounced?.length ?? 0) >= 2,
    staleTime: 1000 * 60,
  });
};

export const useUnifiedSearch = (query: string) => {
  const debounced = useDebounce(query, 400);
  return useQuery({
    queryKey: SOCIAL_KEYS.unifiedSearch(debounced),
    queryFn: async () => {
      const res = await socialSearchService.unifiedSearch(debounced);
      return res.data?.data ?? res.data;
    },
    enabled: (debounced?.length ?? 0) >= 2,
    staleTime: 1000 * 30,
  });
};

// ---------- Search history ----------

export const useSearchHistory = () =>
  useQuery({
    queryKey: SOCIAL_KEYS.searchHistory,
    queryFn: () => socialSearchService.getSearchHistory(),
    staleTime: 1000 * 60,
  });

export const useAddSearchHistory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ query, type }: { query: string; type?: string }) =>
      socialSearchService.addToSearchHistory(query, type),
    onMutate: async ({ query, type }) => {
      await qc.cancelQueries({ queryKey: SOCIAL_KEYS.searchHistory });
      const prev = qc.getQueryData<SearchHistoryEntry[]>(
        SOCIAL_KEYS.searchHistory
      );
      const trimmed = query.trim();
      if (!trimmed) return { prev };
      const next: SearchHistoryEntry[] = [
        { query: trimmed, type, timestamp: Date.now() },
        ...(prev ?? []).filter((h) => h.query !== trimmed),
      ].slice(0, 20);
      qc.setQueryData(SOCIAL_KEYS.searchHistory, next);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(SOCIAL_KEYS.searchHistory, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.searchHistory });
    },
  });
};

export const useRemoveSearchHistoryEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (query: string) =>
      socialSearchService.removeSearchHistoryEntry(query),
    onMutate: async (query) => {
      await qc.cancelQueries({ queryKey: SOCIAL_KEYS.searchHistory });
      const prev = qc.getQueryData<SearchHistoryEntry[]>(
        SOCIAL_KEYS.searchHistory
      );
      qc.setQueryData<SearchHistoryEntry[]>(
        SOCIAL_KEYS.searchHistory,
        (old) => (old ?? []).filter((h) => h.query !== query)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(SOCIAL_KEYS.searchHistory, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.searchHistory });
    },
  });
};

export const useClearSearchHistory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => socialSearchService.clearSearchHistory(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: SOCIAL_KEYS.searchHistory });
      const prev = qc.getQueryData<SearchHistoryEntry[]>(
        SOCIAL_KEYS.searchHistory
      );
      qc.setQueryData<SearchHistoryEntry[]>(SOCIAL_KEYS.searchHistory, []);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(SOCIAL_KEYS.searchHistory, ctx.prev);
    },
  });
};
