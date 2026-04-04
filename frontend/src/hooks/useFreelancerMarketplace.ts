// src/hooks/useFreelancerMarketplace.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import freelancerMarketplaceService, {
  FreelancerFilters,
  ReviewSubmission,
} from '@/services/freelancerMarketplaceService';
import { toast } from '@/hooks/use-toast';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const freelancerMarketKeys = {
  all: ['freelancer-market'] as const,
  lists: () => [...freelancerMarketKeys.all, 'list'] as const,
  list: (filters: FreelancerFilters) =>
    [...freelancerMarketKeys.lists(), filters] as const,
  profiles: () => [...freelancerMarketKeys.all, 'profile'] as const,
  profile: (id: string) =>
    [...freelancerMarketKeys.profiles(), id] as const,
  reviews: (id: string, page: number) =>
    [...freelancerMarketKeys.all, 'reviews', id, page] as const,
  shortlist: (page: number) =>
    [...freelancerMarketKeys.all, 'shortlist', page] as const,
} as const;

// ─── Listing Hook ─────────────────────────────────────────────────────────────

/**
 * Paginated, filterable list of freelancers.
 * Results are cached for 60 s and paginated smoothly via keepPreviousData.
 */
export const useListFreelancers = (filters: FreelancerFilters = {}) =>
  useQuery({
    queryKey: freelancerMarketKeys.list(filters),
    queryFn: () => freelancerMarketplaceService.listFreelancers(filters),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

// ─── Public Profile Hook ──────────────────────────────────────────────────────

/**
 * Full public profile for a single freelancer.
 * Disabled automatically when no id is provided.
 */
export const useFreelancerProfile = (id: string | null | undefined) =>
  useQuery({
    queryKey: freelancerMarketKeys.profile(id ?? ''),
    queryFn: () => freelancerMarketplaceService.getFreelancerProfile(id!),
    enabled: !!id,
    staleTime: 120_000,
  });

// ─── Reviews Hooks ────────────────────────────────────────────────────────────

/**
 * Paginated reviews for a freelancer.
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

/**
 * Submit a review mutation.
 * On success, invalidates the profile and reviews caches for the freelancer.
 */
export const useSubmitReview = (freelancerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReviewSubmission) =>
      freelancerMarketplaceService.submitReview(freelancerId, data),

    onSuccess: () => {
      toast({ title: 'Review submitted successfully ⭐' });
      // Refresh profile (updated ratings) + first reviews page
      queryClient.invalidateQueries({
        queryKey: freelancerMarketKeys.profile(freelancerId),
      });
      queryClient.invalidateQueries({
        queryKey: freelancerMarketKeys.reviews(freelancerId, 1),
      });
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message ?? 'Failed to submit review';
      toast({ title: message, variant: 'destructive' });
    },
  });
};

// ─── Shortlist Hooks ──────────────────────────────────────────────────────────

/**
 * Toggle a freelancer in / out of the company's shortlist.
 * Optimistically updates the profile cache so the save button flips instantly.
 */
export const useToggleShortlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (freelancerId: string) =>
      freelancerMarketplaceService.toggleShortlist(freelancerId),

    // Optimistic update on the profile cache
    onMutate: async (freelancerId: string) => {
      await queryClient.cancelQueries({
        queryKey: freelancerMarketKeys.profile(freelancerId),
      });
      const previous = queryClient.getQueryData(
        freelancerMarketKeys.profile(freelancerId),
      );
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
      toast({ title: 'Failed to update shortlist', variant: 'destructive' });
    },

    onSuccess: (data) => {
      toast({
        title: data.saved
          ? 'Freelancer saved to shortlist ❤️'
          : 'Removed from shortlist',
      });
    },

    onSettled: (_data, _err, freelancerId) => {
      // Always sync from server
      queryClient.invalidateQueries({
        queryKey: freelancerMarketKeys.profile(freelancerId),
      });
      queryClient.invalidateQueries({
        queryKey: freelancerMarketKeys.shortlist(1),
      });
    },
  });
};

/**
 * Fetch the company's saved freelancer list (paginated).
 */
export const useShortlist = (page = 1) =>
  useQuery({
    queryKey: freelancerMarketKeys.shortlist(page),
    queryFn: () => freelancerMarketplaceService.getShortlist(page),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
