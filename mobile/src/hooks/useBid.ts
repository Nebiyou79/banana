// src/hooks/useBid.ts
// Module 7B — Bids
//
// All React Query hooks for the bid system.
//
// Key contracts:
//   useGetMyBid          → handles 404 gracefully (null, hasBid: false)
//   useUpdateBidStatus   → OPTIMISTIC UPDATE — patches cache before server confirms, rolls back on error
//   useSubmitEvaluationScore → 3-step Ethiopian procurement evaluation
//   useVerifyCPOReturn   → CPO return recording (required by law for losing bidders)
//   useUpdateComplianceChecklist → compliance doc verification by owner
//   All mutations        → Alert.alert on success/error (mobile pattern)
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
  BidListParams,
  BidStatus,
  ComplianceItem,
  GetBidsResponse,
  MyAllBidsResponse,
  SubmitBidData,
  UpdateBidStatusData,
  BidEvaluation,
  BidCPO,
} from '../types/bid';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY KEY FACTORY
// Namespace: ['bids', ...]
// ═══════════════════════════════════════════════════════════════════════════

export const bidKeys = {
  all:       ['bids'] as const,
  tender:    (tenderId: string)                    => ['bids', tenderId] as const,
  allBids:   (tenderId: string)                    => ['bids', tenderId, 'all'] as const,
  myBid:     (tenderId: string)                    => ['bids', tenderId, 'my-bid'] as const,
  detail:    (tenderId: string, bidId: string)     => ['bids', tenderId, bidId] as const,
  myAllBids: (params?: object)                     => ['bids', 'my-all-bids', params] as const,
};

// ═══════════════════════════════════════════════════════════════════════════
// ALERT HELPERS (React Native — Alert replaces web toast)
// ═══════════════════════════════════════════════════════════════════════════

function toastSuccess(message: string): void {
  Alert.alert('✓ Success', message);
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
// Matches web useBid.ts statusMessages record exactly.
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
 * 404 → treated as "no bid" — never throws to the consumer.
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
        if (status === 404) return null; // no bid yet — not an error
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
  options?: Omit<UseQueryOptions<MyAllBidsResponse>, 'queryKey' | 'queryFn'>,
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
 * On success: invalidates my-bid + allBids + my-all-bids.
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
 * On success: invalidates my-bid + detail + my-all-bids.
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
 * On success: invalidates bid detail, my-bid, allBids, and my-all-bids.
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
 * OPTIMISTIC UPDATE — sets new status in cache immediately before server confirms.
 * Rolls back on error to maintain data integrity.
 * On success: invalidates allBids + detail + my-all-bids.
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
      // Cancel in-flight refetches to avoid overwriting our optimistic patch
      await queryClient.cancelQueries({ queryKey: bidKeys.allBids(tenderId) });
      await queryClient.cancelQueries({ queryKey: bidKeys.detail(tenderId, bidId) });

      // Snapshot for rollback
      const prevAll    = queryClient.getQueryData<GetBidsResponse>(bidKeys.allBids(tenderId));
      const prevDetail = queryClient.getQueryData<Bid>(bidKeys.detail(tenderId, bidId));

      // Patch allBids list
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

      // Patch detail
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
      // Roll back optimistic patches
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

      // If awarded, refresh professional tender caches too
      if (status === BidStatus.Awarded) {
        queryClient.invalidateQueries({ queryKey: ['professionalTenders'] });
        queryClient.invalidateQueries({ queryKey: ['tenders'] });
      }
    },
  });
};

/**
 * Owner: submit evaluation score — 3-step Ethiopian procurement process.
 * step: 'preliminary' | 'technical' | 'financial'
 */
export const useSubmitEvaluationScore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenderId,
      bidId,
      ...data
    }: {
      tenderId: string;
      bidId: string;
      step: 'preliminary' | 'technical' | 'financial';
      technicalScore?: number;
      financialScore?: number;
      preliminaryPassed?: boolean;
      technicalNotes?: string;
      financialNotes?: string;
      preliminaryNotes?: string;
    }) => bidService.submitEvaluationScore(tenderId, bidId, data),

    onSuccess: (_result, { tenderId, bidId }) => {
      toastSuccess('Evaluation saved');
      queryClient.invalidateQueries({ queryKey: bidKeys.allBids(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.detail(tenderId, bidId) });
    },

    onError: (error) => toastError(error, 'Failed to save evaluation'),
  });
};

/**
 * Owner: record CPO return to a losing bidder.
 * Required by Ethiopian procurement law after contract award.
 */
export const useVerifyCPOReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenderId,
      bidId,
      ...data
    }: {
      tenderId: string;
      bidId: string;
      returnStatus: 'returned' | 'forfeited';
      returnNotes?: string;
    }) => bidService.verifyCPOReturn(tenderId, bidId, data),

    onSuccess: (_result, { tenderId, bidId }) => {
      toastSuccess('CPO return recorded');
      queryClient.invalidateQueries({ queryKey: bidKeys.allBids(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.detail(tenderId, bidId) });
    },

    onError: (error) => toastError(error, 'Failed to record CPO return'),
  });
};

/**
 * Owner: update compliance document checklist for a bid.
 */
export const useUpdateComplianceChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenderId,
      bidId,
      complianceItems,
    }: {
      tenderId: string;
      bidId: string;
      complianceItems: ComplianceItem[];
    }) => bidService.updateComplianceChecklist(tenderId, bidId, complianceItems),

    onSuccess: (_result, { tenderId, bidId }) => {
      toastSuccess('Compliance checklist updated');
      queryClient.invalidateQueries({ queryKey: bidKeys.allBids(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.detail(tenderId, bidId) });
    },

    onError: (error) => toastError(error, 'Failed to update compliance checklist'),
  });
};

/**
 * Download a bid document — returns a Blob for mobile file handling.
 * Consumer is responsible for writing/sharing via expo-file-system + expo-sharing.
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

export { BidFileEntry };
