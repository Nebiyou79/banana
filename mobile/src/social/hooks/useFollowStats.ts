import { useQuery } from '@tanstack/react-query';
import { followService } from '../services/followService';
import { SOCIAL_KEYS } from './queryKeys';
import type { FollowStats } from '../types';

/**
 * Current user's follow summary (followers / following / totalConnections).
 * Short staleTime so the Network screen feels live.
 */
export const useFollowStats = () =>
  useQuery({
    queryKey: SOCIAL_KEYS.followStats,
    queryFn: async () => {
      const res = await followService.getFollowStats();
      return (res.data?.data ?? res.data) as FollowStats;
    },
    staleTime: 1000 * 30,
  });
