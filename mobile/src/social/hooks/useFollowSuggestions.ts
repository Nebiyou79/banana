import { useQuery } from '@tanstack/react-query';
import { followService } from '../services/followService';
import { SOCIAL_KEYS } from './queryKeys';
import type { FollowTarget } from '../types';

/**
 * "People you may know" style suggestions. The server decides who to return
 * based on role, shared connections, and location.
 */
export const useFollowSuggestions = (limit = 10) =>
  useQuery({
    queryKey: [...SOCIAL_KEYS.suggestions, limit] as const,
    queryFn: async () => {
      const res = await followService.getFollowSuggestions(limit);
      return (res.data?.data ?? res.data ?? []) as FollowTarget[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
