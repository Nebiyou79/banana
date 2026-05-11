// src/hooks/useBid.ts
// Module 7B — Bids
// All React Query hooks for the bid system.
//
// Key contracts:
//   useGetMyBid   → handles 404 gracefully (null, hasBid: false)
//   useUpdateBidStatus → optimistically updates cache before server confirms
//   All mutations → toast on success/error via Alert (mobile pattern)
// ─────────────────────────────────────────────────────────────────────────────

import { Alert } from 'react-native';
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';

import bidService, { BidFileEntry } from '../services/bidService';
import {
  Bid,
  BidListItem,
  BidListParams,
  BidPagination,
  BidStatus,
  GetBidsResponse,
  MyAllBidsResponse,
  SubmitBidData,
  UpdateBidStatusData,
} from '../types/bid';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY KEY FACTORY
// Namespace: ['bids', ...]
// ═══════════════════════════════════════════════════════════════════════════

export const bidKeys = {
  all:          ['bids'] as const,
  tender:       (tenderId: string)           => ['bids', tenderId] as const,
  allBids:      (tenderId: string)           => ['bids', tenderId, 'all'] as const,
  myBid:        (tenderId: string)           => ['bids', tenderId, 'my-bid'] as const,
  detail:       (tenderId: string, bidId: string) => ['bids', tenderId, bidId] as const,
  myAllBids:    (params?: object)            => ['bids', 'my-all-bids', params] as const,
};

// ═══════════════════════════════════════════════════════════════════════════
// TOAST HELPERS (React Native — Alert)
// ═══════════════════════════════════════════════════════════════════════════

function toastSuccess(message: string): void {
  Alert.alert('✓', message);
}

function toastError(error: unknown, fallback = 'Something went wrong'): void {
  const message =
    (error as { response?: { data?: { error?: string; message?: string } } })
      ?.response?.data?.error ??
    (error as { response?: { data?: { message?: string } } })
      ?.response?.data?.message ??
    (error as Error)?.message ??
    fallback;
  Alert.alert('Error', message);
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS MESSAGE MAP
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_MESSAGES: Record<BidStatus, string> = {
  [BidStatus.Submitted]:          'Bid status updated',
  [BidStatus.UnderReview]:        'Moved to Under Review',
  [BidStatus.Shortlisted]:        'Bid Shortlisted ⭐',
  [BidStatus.InterviewScheduled]: 'Interview Scheduled',
  [BidStatus.Awarded]:            'Bid Awarded! 🏆',
  [BidStatus.Rejected]:           'Bid Rejected',
  [BidStatus.Withdrawn]:          'Bid Withdrawn',
};

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch current user's bid for a specific tender.
 * Returns { data: Bid | null, hasBid: boolean, isLoading, error }.
 * 404 → treated as "no bid" — never throws.
 */
export const useGetMyBid = (
  tenderId: string,
  options?: Omit<UseQueryOptions<Bid | null>, 'queryKey' | 'queryFn'>,
) => {
  const query = useQuery<Bid | null>({
    queryKey: bidKeys.myBid(tenderId),
    queryFn: async () => {
      try {
        return await bidService.getMyBid(tenderId);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return null; // graceful — no bid exists yet
        throw err;
      }
    },
    staleTime: 60_000,
    enabled: !!tenderId,
    ...options,
  });

  return {
    ...query,
    hasBid: !!query.data,
  };
};

/**
 * Owner hook — fetch all bids for a tender.
 * Returns full GetBidsResponse (bids[], totalBids, isBidsRevealed, canBid).
 */
export const useGetBids = (
  tenderId: string,
  options?: Omit<UseQueryOptions<GetBidsResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery<GetBidsResponse>({
    queryKey: bidKeys.allBids(tenderId),
    queryFn: () => bidService.getBids(tenderId),
    staleTime: 30_000,
    enabled: !!tenderId,
    ...options,
  });
};

/**
 * Bidder hook — all bids submitted by current company across all tenders.
 * Paginated. Supports status / page / limit filters.
 */
export const useGetMyAllBids = (
  params?: BidListParams,
  options?: Omit<
    UseQueryOptions<MyAllBidsResponse>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<MyAllBidsResponse>({
    queryKey: bidKeys.myAllBids(params),
    queryFn: () => bidService.getMyAllBids(params),
    staleTime: 120_000,
    ...options,
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Submit a new bid.
 * On success: invalidates my-bid + my-all-bids.
 */
export const useSubmitBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenderId,
      data,
      files,
    }: {
      tenderId: string;
      data: SubmitBidData;
      files?: BidFileEntry[];
    }) => bidService.submitBid(tenderId, data, files ?? []),

    onSuccess: (_result, { tenderId }) => {
      toastSuccess('Bid submitted successfully! 🎉');
      queryClient.invalidateQueries({ queryKey: bidKeys.myBid(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.allBids(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.myAllBids() });
    },

    onError: (error) => toastError(error, 'Failed to submit bid'),
  });
};

/**
 * Update an existing submitted bid.
 * On success: invalidates my-bid + my-all-bids.
 */
export const useUpdateBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenderId,
      bidId,
      data,
      files,
    }: {
      tenderId: string;
      bidId: string;
      data: Partial<SubmitBidData>;
      files?: BidFileEntry[];
    }) => bidService.updateBid(tenderId, bidId, data, files ?? []),

    onSuccess: (_result, { tenderId, bidId }) => {
      toastSuccess('Bid updated successfully');
      queryClient.invalidateQueries({ queryKey: bidKeys.myBid(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.detail(tenderId, bidId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.myAllBids() });
    },

    onError: (error) => toastError(error, 'Failed to update bid'),
  });
};

/**
 * Withdraw a submitted bid.
 * On success: invalidates bid detail, my-bid, and my-all-bids.
 */
export const useWithdrawBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenderId, bidId }: { tenderId: string; bidId: string }) =>
      bidService.withdrawBid(tenderId, bidId),

    onSuccess: (_result, { tenderId, bidId }) => {
      toastSuccess('Bid withdrawn');
      queryClient.invalidateQueries({ queryKey: bidKeys.myBid(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.detail(tenderId, bidId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.allBids(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.myAllBids() });
    },

    onError: (error) => toastError(error, 'Failed to withdraw bid'),
  });
};

/**
 * Owner: update bid status.
 *
 * OPTIMISTIC UPDATE — sets new status in cache immediately.
 * Rolls back on error.
 * On success: invalidates allBids + detail caches.
 */
export const useUpdateBidStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenderId,
      bidId,
      status,
      ownerNotes,
    }: {
      tenderId: string;
      bidId: string;
      status: BidStatus;
      ownerNotes?: string;
    }) => bidService.updateBidStatus(tenderId, bidId, { status, ownerNotes }),

    // ── Optimistic update ──────────────────────────────────────────────────
    onMutate: async ({ tenderId, bidId, status, ownerNotes }) => {
      // Cancel any in-flight refetches
      await queryClient.cancelQueries({ queryKey: bidKeys.allBids(tenderId) });
      await queryClient.cancelQueries({ queryKey: bidKeys.detail(tenderId, bidId) });

      // Snapshot previous values for rollback
      const prevAll    = queryClient.getQueryData<GetBidsResponse>(bidKeys.allBids(tenderId));
      const prevDetail = queryClient.getQueryData<Bid>(bidKeys.detail(tenderId, bidId));

      // Optimistically patch allBids list
      if (prevAll) {
        queryClient.setQueryData<GetBidsResponse>(bidKeys.allBids(tenderId), {
          ...prevAll,
          bids: prevAll.bids.map((b) =>
            b._id === bidId
              ? { ...b, status, ownerNotes: ownerNotes ?? b.ownerNotes }
              : b,
          ),
        });
      }

      // Optimistically patch detail
      if (prevDetail) {
        queryClient.setQueryData<Bid>(bidKeys.detail(tenderId, bidId), {
          ...prevDetail,
          status,
          ownerNotes: ownerNotes ?? prevDetail.ownerNotes,
        });
      }

      return { prevAll, prevDetail };
    },

    onError: (error, { tenderId, bidId }, context) => {
      // Roll back optimistic update
      if (context?.prevAll) {
        queryClient.setQueryData(bidKeys.allBids(tenderId), context.prevAll);
      }
      if (context?.prevDetail) {
        queryClient.setQueryData(bidKeys.detail(tenderId, bidId), context.prevDetail);
      }
      toastError(error, 'Failed to update bid status');
    },

    onSuccess: (_result, { tenderId, bidId, status }) => {
      toastSuccess(STATUS_MESSAGES[status] ?? 'Bid status updated');
      queryClient.invalidateQueries({ queryKey: bidKeys.allBids(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.detail(tenderId, bidId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.myAllBids() });

      // If awarded, also refresh professional tender caches
      if (status === BidStatus.Awarded) {
        queryClient.invalidateQueries({ queryKey: ['professionalTenders'] });
      }
    },
  });
};

/**
 * Download a bid document — returns a Blob for mobile file handling.
 * Consumer is responsible for writing / sharing the blob.
 */
export const useDownloadBidDocument = () => {
  return useMutation({
    mutationFn: ({
      tenderId,
      bidId,
      docId,
    }: {
      tenderId: string;
      bidId: string;
      docId: string;
    }) => bidService.downloadBidDocument(tenderId, bidId, docId),

    onError: (error) => toastError(error, 'Failed to download document'),
  });
};
