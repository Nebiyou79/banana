/**
 * mobile/src/social/hooks/usePublicProfileNew.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TanStack Query hooks for the dedicated PublicProfile backend (Phase 1).
 *
 * Naming convention: "New" suffix avoids colliding with the existing
 * usePublicProfile.ts which wraps the old /profile/public/:userId endpoint.
 * Both can coexist; screens can migrate incrementally.
 *
 * Cache keys all live under ['publicProfile', ...] to stay separate from the
 * existing SOCIAL_KEYS.publicProfile key space.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import {
  publicProfileService,
  type PublicProfileUpdateData,
  type VisibilityUpdate,
} from '../../services/publicProfileService';

// ── Cache key factory ─────────────────────────────────────────────────────────

export const PUB_PROFILE_KEYS = {
  /** Own profile (all fields) */
  mine:     ['publicProfile', 'mine'] as const,
  /** Public view by user ID */
  byId:     (userId: string)   => ['publicProfile', 'byId',     userId]   as const,
  /** Public view by username */
  bySlug:   (username: string) => ['publicProfile', 'bySlug',   username] as const,
  /** Search results */
  search:   (params: object)   => ['publicProfile', 'search',   params]   as const,
  /** Featured */
  featured: (params: object)   => ['publicProfile', 'featured', params]   as const,
} as const;

// ── Own profile ───────────────────────────────────────────────────────────────

/**
 * Fetches the current user's public profile (owner view — all fields).
 * Lazy-creates the document on the backend if it doesn't exist yet.
 */
export const useMyPublicProfile = () =>
  useQuery({
    queryKey: PUB_PROFILE_KEYS.mine,
    queryFn: async () => {
      const res = await publicProfileService.getMyPublicProfile();
      return res.data?.data ?? res.data ?? null;
    },
    staleTime: 1000 * 60 * 3,
  });

// ── Update own public profile ─────────────────────────────────────────────────

/**
 * Partial update with optimistic cache write + rollback on error.
 */
export const useUpdatePublicProfile = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: PublicProfileUpdateData) =>
      publicProfileService.updatePublicProfile(data),

    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: PUB_PROFILE_KEYS.mine });
      const prev = qc.getQueryData(PUB_PROFILE_KEYS.mine);
      if (prev) {
        qc.setQueryData(PUB_PROFILE_KEYS.mine, (old: any) => ({
          ...old,
          ...data,
          // Merge nested objects rather than replacing them
          socialLinks: data.socialLinks
            ? { ...(old?.socialLinks ?? {}), ...data.socialLinks }
            : old?.socialLinks,
        }));
      }
      return { prev };
    },

    onError: (err: any, _vars, ctx: any) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(PUB_PROFILE_KEYS.mine, ctx.prev);
      }
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Update failed',
      });
    },

    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Public profile updated' });
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: PUB_PROFILE_KEYS.mine });
    },
  });
};

// ── Visibility toggle ─────────────────────────────────────────────────────────

/**
 * Toggle overall or granular visibility settings.
 */
export const useTogglePublicVisibility = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (update: VisibilityUpdate) =>
      publicProfileService.toggleVisibility(update),

    onSuccess: (res) => {
      // Patch only the visibility fields in the cache
      const data = res.data?.data;
      if (data) {
        qc.setQueryData(PUB_PROFILE_KEYS.mine, (old: any) =>
          old
            ? {
                ...old,
                isPubliclyVisible: data.isPubliclyVisible ?? old.isPubliclyVisible,
                visibility: data.visibility ?? old.visibility,
              }
            : old
        );
      }
      Toast.show({ type: 'success', text1: 'Visibility updated' });
    },

    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Could not update visibility',
      });
    },
  });
};

// ── Sync from main profile ────────────────────────────────────────────────────

/**
 * One-click sync — pulls all data from the main Profile + User models.
 * Replaces the public profile cache with the fresh synced data.
 */
export const useSyncPublicProfile = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => publicProfileService.syncFromMainProfile(),

    onSuccess: (res) => {
      const fresh = res.data?.data ?? res.data;
      if (fresh) {
        qc.setQueryData(PUB_PROFILE_KEYS.mine, fresh);
      }
      Toast.show({ type: 'success', text1: 'Profile synced successfully' });
    },

    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Sync failed',
      });
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: PUB_PROFILE_KEYS.mine });
    },
  });
};

// ── Public profile by userId ──────────────────────────────────────────────────

/**
 * Fetch a public profile by user ID.
 * Uses the new dedicated endpoint instead of the old /profile/public/:userId.
 */
export const usePublicProfileById = (userId: string | undefined) =>
  useQuery({
    queryKey: PUB_PROFILE_KEYS.byId(userId ?? ''),
    queryFn: async () => {
      const res = await publicProfileService.getById(userId as string);
      return res.data?.data ?? res.data ?? null;
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 3,
  });

// ── Public profile by username slug ──────────────────────────────────────────

/**
 * Fetch a public profile by username slug (e.g. "johndoe").
 */
export const usePublicProfileByUsername = (username: string | undefined) =>
  useQuery({
    queryKey: PUB_PROFILE_KEYS.bySlug(username ?? ''),
    queryFn: async () => {
      const res = await publicProfileService.getByUsername(username as string);
      return res.data?.data ?? res.data ?? null;
    },
    enabled: Boolean(username),
    staleTime: 1000 * 60 * 3,
  });

// ── Search ────────────────────────────────────────────────────────────────────

export const usePublicProfileSearch = (params: {
  q?: string;
  role?: 'candidate' | 'freelancer' | 'company' | 'organization';
  page?: number;
  limit?: number;
}) =>
  useQuery({
    queryKey: PUB_PROFILE_KEYS.search(params),
    queryFn: async () => {
      const res = await publicProfileService.searchPublicProfiles(params);
      return res.data?.data ?? res.data ?? { profiles: [], pagination: {} };
    },
    enabled: Boolean(params.q && params.q.trim().length >= 2) || Boolean(params.role),
    staleTime: 1000 * 30,
  });

// ── Featured ──────────────────────────────────────────────────────────────────

export const useFeaturedPublicProfiles = (params: {
  role?: string;
  limit?: number;
} = {}) =>
  useQuery({
    queryKey: PUB_PROFILE_KEYS.featured(params),
    queryFn: async () => {
      const res = await publicProfileService.getFeaturedProfiles(params);
      const data = res.data?.data ?? res.data;
      return Array.isArray(data?.profiles) ? data.profiles : [];
    },
    staleTime: 1000 * 60 * 5,
  });