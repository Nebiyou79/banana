/**
 * mobile/src/hooks/useFreelancerMarketplace.ts
 *
 * TanStack Query hooks for the freelancer marketplace.
 * Mirrors the frontend hooks exactly, adapted for React Native.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData,
} from '@tanstack/react-query';
import { Alert } from 'react-native';
import freelancerMarketplaceService, {
  FreelancerFilters,
  ReviewSubmission,
} from '../services/freelancerMarketplaceService';
import { useToast } from './useToast';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const freelancerMarketKeys = {
  all: ['freelancer-market'] as const,
  lists: () => [...freelancerMarketKeys.all, 'list'] as const,
  list: (filters: FreelancerFilters) =>
    [...freelancerMarketKeys.lists(), filters] as const,
  profiles: () => [...freelancerMarketKeys.all, 'profile'] as const,
  profile: (id: string) => [...freelancerMarketKeys.profiles(), id] as const,
  reviews: (id: string, page: number) =>
    [...freelancerMarketKeys.all, 'reviews', id, page] as const,
  shortlist: (page: number) =>
    [...freelancerMarketKeys.all, 'shortlist', page] as const,
  professions: () => [...freelancerMarketKeys.all, 'professions'] as const,
} as const;

// ─── Listing Hook (infinite scroll) ──────────────────────────────────────────

/**
 * Infinite-scroll paginated list of freelancers with filters.
 * Suitable for FlashList / FlatList with onEndReached.
 */
export const useListFreelancers = (filters: Omit<FreelancerFilters, 'page'> = {}) =>
  useInfiniteQuery({
    queryKey: freelancerMarketKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      freelancerMarketplaceService.listFreelancers({
        ...filters,
        page: pageParam as number,
        limit: 12,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

// ─── Professions Hook ─────────────────────────────────────────────────────────

/**
 * Master profession list for filter dropdowns.
 * Cached for 1 hour — professions rarely change.
 */
export const useFreelancerProfessions = () =>
  useQuery({
    queryKey: freelancerMarketKeys.professions(),
    queryFn: () => freelancerMarketplaceService.getProfessions(),
    staleTime: 60 * 60_000,
  });

// ─── Public Profile Hook ──────────────────────────────────────────────────────

/**
 * Full public profile for a single freelancer.
 * Disabled when no id is provided.
 */
export const useFreelancerProfile = (id: string | null | undefined) =>
  useQuery({
    queryKey: freelancerMarketKeys.profile(id ?? ''),
    queryFn: () => freelancerMarketplaceService.getFreelancerProfile(id!),
    enabled: !!id,
    staleTime: 120_000,
  });

// ─── Reviews Hook ─────────────────────────────────────────────────────────────

/**
 * Paginated reviews for a single freelancer.
 */
export const useFreelancerReviews = (
  freelancerId: string | null | undefined,
  page = 1,
) =>
  useQuery({
    queryKey: freelancerMarketKeys.reviews(freelancerId ?? '', page),
    queryFn: () =>
      freelancerMarketplaceService.getReviews(freelancerId!, page),
    enabled: !!freelancerId,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

// ─── Submit Review Mutation ───────────────────────────────────────────────────

/**
 * Submit a star-rating review for a freelancer.
 * Invalidates profile (updated aggregate ratings) and reviews cache on success.
 */
export const useSubmitReview = (freelancerId: string) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: (data: ReviewSubmission) =>
      freelancerMarketplaceService.submitReview(freelancerId, data),
    onSuccess: () => {
      showSuccess('Review submitted successfully ⭐');
      queryClient.invalidateQueries({
        queryKey: freelancerMarketKeys.profile(freelancerId),
      });
      queryClient.invalidateQueries({
        queryKey: freelancerMarketKeys.reviews(freelancerId, 1),
      });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ?? 'Failed to submit review';
      showError(message);
    },
  });
};

// ─── Toggle Shortlist Mutation (Optimistic) ───────────────────────────────────

/**
 * Toggle a freelancer in/out of the company shortlist.
 * Applies an optimistic update so the save button flips instantly.
 */
export const useToggleShortlist = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: (freelancerId: string) =>
      freelancerMarketplaceService.toggleShortlist(freelancerId),

    onMutate: async (freelancerId: string) => {
      // Cancel in-flight fetches for this profile
      await queryClient.cancelQueries({
        queryKey: freelancerMarketKeys.profile(freelancerId),
      });
      const previous = queryClient.getQueryData(
        freelancerMarketKeys.profile(freelancerId),
      );
      // Flip isSaved optimistically
      queryClient.setQueryData(
        freelancerMarketKeys.profile(freelancerId),
        (old: any) => (old ? { ...old, isSaved: !old.isSaved } : old),
      );
      return { previous, freelancerId };
    },

    onError: (_err, freelancerId, context) => {
      // Roll back
      if (context?.previous) {
        queryClient.setQueryData(
          freelancerMarketKeys.profile(freelancerId),
          context.previous,
        );
      }
      showError('Failed to update shortlist');
    },

    onSuccess: (data) => {
      showSuccess(data.saved ? 'Added to shortlist 🔖' : 'Removed from shortlist');
    },

    onSettled: (_data, _error, freelancerId) => {
      queryClient.invalidateQueries({
        queryKey: freelancerMarketKeys.profile(freelancerId),
      });
      queryClient.invalidateQueries({
        queryKey: freelancerMarketKeys.shortlist(1),
      });
    },
  });
};

// ─── Shortlist List Hook ──────────────────────────────────────────────────────

/**
 * Fetch company's saved freelancers list, paginated.
 */
export const useShortlist = (page = 1) =>
  useQuery({
    queryKey: freelancerMarketKeys.shortlist(page),
    queryFn: () => freelancerMarketplaceService.getShortlist(page),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
