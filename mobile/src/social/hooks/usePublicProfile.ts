import { useQuery } from '@tanstack/react-query';
import { profileSocialService } from '../services/profileSocialService';
import { sanitizeSocialData } from '../services/sanitize';
import { SOCIAL_KEYS } from './queryKeys';
import { useFollowStatus } from './useFollow';
import type { PublicProfile } from '../types';

/**
 * Fetches a public profile by userId + join with follow status so the UI
 * gets everything it needs in one object.
 */
export const usePublicProfile = (userId: string) => {
  const followStatusQ = useFollowStatus(userId, 'User');

  const profileQ = useQuery({
    queryKey: SOCIAL_KEYS.publicProfile(userId),
    queryFn: async () => {
      const res = await profileSocialService.getPublicProfile(userId);
      const raw = res.data?.data ?? res.data;
      return raw
        ? (sanitizeSocialData.profile(raw) as PublicProfile)
        : (null as PublicProfile | null);
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 3,
  });

  const isFollowing = followStatusQ.data?.following ?? false;
  const profile: PublicProfile | null | undefined = profileQ.data
    ? { ...profileQ.data, isFollowing }
    : profileQ.data;

  return {
    ...profileQ,
    profile,
    isFollowing,
    followStatus: followStatusQ.data,
    isFollowStatusLoading: followStatusQ.isLoading,
  };
};
