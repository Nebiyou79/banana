import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  profileSocialService,
  type ProfileUpdateData,
} from '../services/profileSocialService';
import { sanitizeSocialData } from '../services/sanitize';
import { SOCIAL_KEYS } from './queryKeys';
import type { Profile, SocialLinks } from '../types';

/**
 * Own profile. Returns the sanitized Profile object.
 */
export const useOwnProfile = () =>
  useQuery({
    queryKey: SOCIAL_KEYS.ownProfile,
    queryFn: async () => {
      const res = await profileSocialService.getProfile();
      const raw = res.data?.data ?? res.data;
      return raw ? sanitizeSocialData.profile(raw) : (null as Profile | null);
    },
    staleTime: 1000 * 60 * 5,
  });

export const useProfileCompletion = () =>
  useQuery({
    queryKey: SOCIAL_KEYS.profileCompletion,
    queryFn: async () => {
      const res = await profileSocialService.getProfileCompletion();
      return res.data?.data ?? res.data;
    },
    staleTime: 1000 * 60 * 2,
  });

/**
 * Update basic profile fields (headline, bio, location, website).
 * Optimistically writes to the own-profile cache.
 */
export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileUpdateData) =>
      profileSocialService.updateProfile(data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: SOCIAL_KEYS.ownProfile });
      const prev = qc.getQueryData<Profile | null>(SOCIAL_KEYS.ownProfile);
      if (prev) {
        qc.setQueryData<Profile>(SOCIAL_KEYS.ownProfile, {
          ...prev,
          headline: data.headline ?? prev.headline,
          bio: data.bio ?? prev.bio,
          location: data.location ?? prev.location,
          website: data.website ?? prev.website,
        });
      }
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev !== undefined)
        qc.setQueryData(SOCIAL_KEYS.ownProfile, ctx.prev);
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Update failed',
      });
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Profile updated' });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.ownProfile });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.profileCompletion });
    },
  });
};

export const useUploadAvatar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      uri,
      type,
      name,
    }: {
      uri: string;
      type: string;
      name: string;
    }) => profileSocialService.uploadAvatar(uri, type, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.ownProfile });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.profileCompletion });
      Toast.show({ type: 'success', text1: 'Profile picture updated' });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Avatar upload failed',
      });
    },
  });
};

export const useUploadCover = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      uri,
      type,
      name,
    }: {
      uri: string;
      type: string;
      name: string;
    }) => profileSocialService.uploadCover(uri, type, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.ownProfile });
      Toast.show({ type: 'success', text1: 'Cover photo updated' });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Cover upload failed',
      });
    },
  });
};

export const useDeleteAvatar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => profileSocialService.deleteAvatar(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.ownProfile });
    },
  });
};

export const useDeleteCover = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => profileSocialService.deleteCover(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.ownProfile });
    },
  });
};

export const useUpdateSocialLinks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (links: SocialLinks) =>
      profileSocialService.updateSocialLinks(links),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.ownProfile });
      Toast.show({ type: 'success', text1: 'Links updated' });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Update failed',
      });
    },
  });
};

export const usePopularProfiles = (
  params?: { role?: 'candidate' | 'freelancer' | 'company' | 'organization'; limit?: number }
) =>
  useQuery({
    queryKey: SOCIAL_KEYS.popularProfiles(params),
    queryFn: async () => {
      const res = await profileSocialService.getPopularProfiles(params);
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
