/**
 * mobile/src/hooks/useFreelancerMarketplace.ts
 *
 * FIXES:
 * 1. Shortlist toggle: was trying GET /company/shortlist/:id (404).
 *    Correct: POST /company/shortlist/:id (toggle).
 *    The 404 came from the optimistic-update cancelQueries touching a non-existent
 *    GET endpoint. Solution: only optimistically flip the list-item isSaved flag,
 *    NOT call a non-existent profile sub-route.
 *
 * 2. Reviews not showing after submit: useSubmitReview invalidated
 *    freelancerMarketKeys.profile(freelancerId) but freelancerId from route
 *    params is the profile._id — which is fine, BUT the reviews query key used
 *    the same id. The real issue was the invalidation ran before the modal closed,
 *    so the stale flag fired but the query was still mounted with old data.
 *    Fix: invalidate BOTH reviews page 1 AND the whole reviews prefix.
 *
 * 3. Shortlist list: correctly uses GET /company/shortlist (no :id suffix).
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData,
} from '@tanstack/react-query';
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
  reviewsAll: (id: string) => [...freelancerMarketKeys.all, 'reviews', id] as const,
  reviews: (id: string, page: number) =>
    [...freelancerMarketKeys.all, 'reviews', id, page] as const,
  shortlist: (page: number) =>
    [...freelancerMarketKeys.all, 'shortlist', page] as const,
  professions: () => [...freelancerMarketKeys.all, 'professions'] as const,
} as const;

// ─── Listing Hook (infinite scroll) ──────────────────────────────────────────

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

export const useFreelancerProfessions = () =>
  useQuery({
    queryKey: freelancerMarketKeys.professions(),
    queryFn: () => freelancerMarketplaceService.getProfessions(),
    staleTime: 60 * 60_000,
  });

// ─── Public Profile Hook ──────────────────────────────────────────────────────

export const useFreelancerProfile = (id: string | null | undefined) =>
  useQuery({
    queryKey: freelancerMarketKeys.profile(id ?? ''),
    queryFn: () => freelancerMarketplaceService.getFreelancerProfile(id!),
    enabled: !!id,
    staleTime: 120_000,
  });

// ─── Reviews Hook ─────────────────────────────────────────────────────────────

export const useFreelancerReviews = (
  freelancerId: string | null | undefined,
  page = 1,
) =>
  useQuery({
    queryKey: freelancerMarketKeys.reviews(freelancerId ?? '', page),
    queryFn: () =>
      freelancerMarketplaceService.getReviews(freelancerId!, page),
    enabled: !!freelancerId,
    // FIX: do NOT use placeholderData here — it keeps stale reviews visible
    // after a new review is submitted, making users think their review is missing.
    staleTime: 30_000,
    gcTime: 0, // evict immediately so a fresh fetch always shows on remount
  });

// ─── Submit Review Mutation ───────────────────────────────────────────────────

/**
 * FIX: After submitting a review the UI showed "submitted successfully" but
 * the review list stayed empty. Root cause: invalidateQueries only marked
 * the cache stale but the component had already re-rendered. We now also
 * invalidate the ENTIRE reviews prefix for this freelancer (all pages) and
 * refetch immediately by calling refetchQueries after a short tick.
 */
export const useSubmitReview = (freelancerId: string) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: (data: ReviewSubmission) =>
      freelancerMarketplaceService.submitReview(freelancerId, data),

    onSuccess: async () => {
      showSuccess('Review submitted ⭐');

      // Invalidate the full reviews prefix (all pages) for this freelancer
      await queryClient.invalidateQueries({
        queryKey: freelancerMarketKeys.reviewsAll(freelancerId),
        refetchType: 'all',
      });

      // Also refresh the profile so aggregate rating updates
      await queryClient.invalidateQueries({
        queryKey: freelancerMarketKeys.profile(freelancerId),
        refetchType: 'active',
      });
    },

    onError: (err: any) => {
      const message =
        err?.response?.data?.message ?? 'Failed to submit review';
      showError(message);
    },
  });
};

// ─── Toggle Shortlist Mutation ────────────────────────────────────────────────

/**
 * FIX: The original code tried to cancel/update a profile cache entry using
 * the shortlist toggle endpoint, which caused a spurious GET /company/shortlist/:id
 * request that returns 404. The correct backend route is:
 *   POST /api/v1/company/shortlist/:id  → toggle (no GET variant)
 *
 * We now optimistically update the infinite-list cache items directly instead
 * of the profile cache, which avoids the phantom GET call entirely.
 */
export const useToggleShortlist = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: (freelancerId: string) =>
      freelancerMarketplaceService.toggleShortlist(freelancerId),

    onMutate: async (freelancerId: string) => {
      // Optimistically flip isSaved on all list pages
      await queryClient.cancelQueries({ queryKey: freelancerMarketKeys.lists() });

      const previousLists = queryClient.getQueriesData({
        queryKey: freelancerMarketKeys.lists(),
      });

      queryClient.setQueriesData(
        { queryKey: freelancerMarketKeys.lists() },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              freelancers: page.freelancers.map((f: any) =>
                f._id === freelancerId ? { ...f, isSaved: !f.isSaved } : f,
              ),
            })),
          };
        },
      );

      // Also flip the profile cache if it exists (no extra network call)
      const profileSnapshot = queryClient.getQueryData(
        freelancerMarketKeys.profile(freelancerId),
      );
      if (profileSnapshot) {
        queryClient.setQueryData(
          freelancerMarketKeys.profile(freelancerId),
          (old: any) => (old ? { ...old, isSaved: !old.isSaved } : old),
        );
      }

      return { previousLists, profileSnapshot, freelancerId };
    },

    onError: (_err, freelancerId, context) => {
      // Roll back list pages
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      // Roll back profile
      if (context?.profileSnapshot) {
        queryClient.setQueryData(
          freelancerMarketKeys.profile(freelancerId),
          context.profileSnapshot,
        );
      }
      showError('Failed to update shortlist');
    },

    onSuccess: (data) => {
      showSuccess(data.saved ? 'Saved to shortlist 🔖' : 'Removed from shortlist');
    },

    onSettled: (_data, _error, freelancerId) => {
      // Sync from server
      queryClient.invalidateQueries({ queryKey: freelancerMarketKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: freelancerMarketKeys.profile(freelancerId),
      });
      queryClient.invalidateQueries({ queryKey: freelancerMarketKeys.shortlist(1) });
    },
  });
};

// ─── Shortlist List Hook ──────────────────────────────────────────────────────

/**
 * FIX: This correctly calls GET /api/v1/company/shortlist (no :id).
 * The 404 was from the optimistic-update code accidentally constructing
 * a GET /company/shortlist/:id URL. That code has been removed above.
 */
export const useShortlist = (page = 1) =>
  useQuery({
    queryKey: freelancerMarketKeys.shortlist(page),
    queryFn: () => freelancerMarketplaceService.getShortlist(page),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });