// src/hooks/useBid.ts
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import bidService, {
  Bid,
  BidCPO,
  BidDocumentType,
  BidEvaluation,
  BidStatus,
  ComplianceItem,
  GetBidsResponse,
  BidPagination,
  SubmitBidData,
} from '@/services/bidService';

// ══════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ══════════════════════════════════════════════════════════════════════

export const bidKeys = {
  all: ['bids'] as const,
  tender: (tenderId: string) => [...bidKeys.all, 'tender', tenderId] as const,
  myBid: (tenderId: string) => [...bidKeys.tender(tenderId), 'my-bid'] as const,
  myAll: (params?: object) => [...bidKeys.all, 'my-bids', params] as const,
};

// ══════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ══════════════════════════════════════════════════════════════════════

const handleSuccess = (message: string) => {
  toast({ title: message });
};

const handleError = (error: unknown, fallback = 'Something went wrong') => {
  const message =
    (error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;
  toast({ title: message, variant: 'destructive' });
};

// ══════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ══════════════════════════════════════════════════════════════════════

/**
 * Fetch all bids for a tender.
 * Returns the full GetBidsResponse including canBid, isBidsRevealed, totalBids, etc.
 */
export const useGetBids = (
  tenderId: string,
  options?: Omit<UseQueryOptions<GetBidsResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetBidsResponse>({
    queryKey: bidKeys.tender(tenderId),
    queryFn: () => bidService.getBids(tenderId),
    staleTime: 30_000, // bids update frequently
    enabled: !!tenderId,
    ...options,
  });
};

/**
 * Fetch the current user's own bid on a specific tender.
 * Returns { data, hasBid } — hasBid is a derived boolean for convenience.
 */
export const useGetMyBid = (
  tenderId: string,
  options?: Omit<UseQueryOptions<Bid | null>, 'queryKey' | 'queryFn'>
) => {
  const query = useQuery<Bid | null>({
    queryKey: bidKeys.myBid(tenderId),
    queryFn: () => bidService.getMyBid(tenderId),
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
 * Fetch all bids submitted by the current user, paginated.
 */
export const useGetMyAllBids = (
  params?: { page?: number; limit?: number; status?: BidStatus; tenderId?: string },
  options?: Omit<
    UseQueryOptions<{ data: Bid[]; pagination: BidPagination }>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<{ data: Bid[]; pagination: BidPagination }>({
    queryKey: bidKeys.myAll(params),
    queryFn: () => bidService.getMyAllBids(params),
    staleTime: 120_000, // 2 minutes
    ...options,
  });
};

// ══════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ══════════════════════════════════════════════════════════════════════

/**
 * Submit a new bid for a tender.
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
      files: { file: File; documentType: BidDocumentType }[];
    }) => bidService.submitBid(tenderId, data, files),

    onSuccess: (_data, { tenderId }) => {
      handleSuccess('Bid submitted successfully! 🎉');
      queryClient.invalidateQueries({ queryKey: bidKeys.tender(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.myBid(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.myAll() });
    },

    onError: (error) => handleError(error),
  });
};

/**
 * Update an existing bid.
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
      files?: { file: File; documentType: BidDocumentType }[];
    }) => bidService.updateBid(tenderId, bidId, data, files),

    onSuccess: (_data, { tenderId }) => {
      handleSuccess('Bid updated');
      queryClient.invalidateQueries({ queryKey: bidKeys.myBid(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.tender(tenderId) });
    },

    onError: (error) => handleError(error),
  });
};

/**
 * Withdraw (soft-delete) a bid.
 */
export const useWithdrawBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenderId, bidId }: { tenderId: string; bidId: string }) =>
      bidService.withdrawBid(tenderId, bidId),

    onSuccess: (_data, { tenderId }) => {
      handleSuccess('Bid withdrawn');
      queryClient.invalidateQueries({ queryKey: bidKeys.tender(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.myBid(tenderId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.myAll() });
    },

    onError: (error) => handleError(error),
  });
};

/**
 * Update the status of a bid (tender owner / admin only — enforced server-side).
 * Shows a status-specific success message.
 */
export const useUpdateBidStatus = () => {
  const queryClient = useQueryClient();

  const statusMessages: Record<BidStatus, string> = {
    under_review: 'Moved to Under Review',
    shortlisted: 'Bid Shortlisted ⭐',
    interview_scheduled: 'Interview Scheduled',
    awarded: 'Bid Awarded! 🏆',
    rejected: 'Bid Rejected',
    submitted: 'Bid status updated',
    withdrawn: 'Bid Withdrawn',
  };

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

    onSuccess: (data, { tenderId, status }) => {
      handleSuccess(statusMessages[status] ?? 'Bid status updated');
      queryClient.invalidateQueries({ queryKey: bidKeys.tender(tenderId) });

      // If the bid was awarded, also invalidate professional tender cache
      if (status === 'awarded') {
        queryClient.invalidateQueries({ queryKey: ['professionalTenders'] });
        queryClient.invalidateQueries({ queryKey: ['tenders'] });
      }
    },

    onError: (error) => handleError(error),
  });
};

/**
 * Submit an evaluation score — 3-step Ethiopian procurement process.
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

    onSuccess: (_data, { tenderId }) => {
      handleSuccess('Evaluation saved');
      queryClient.invalidateQueries({ queryKey: bidKeys.tender(tenderId) });
    },

    onError: (error) => handleError(error),
  });
};

/**
 * Record a CPO return to a losing bidder (required by Ethiopian law).
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

    onSuccess: (_data, { tenderId }) => {
      handleSuccess('CPO return recorded');
      queryClient.invalidateQueries({ queryKey: bidKeys.tender(tenderId) });
    },

    onError: (error) => handleError(error),
  });
};

/**
 * Update the compliance document checklist for a bid.
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

    onSuccess: (_data, { tenderId }) => {
      handleSuccess('Compliance checklist updated');
      queryClient.invalidateQueries({ queryKey: bidKeys.tender(tenderId) });
    },

    onError: (error) => handleError(error),
  });
};

/**
 * Download a bid document — triggers a browser file download.
 */
export const useDownloadBidDocument = () => {
  return useMutation({
    mutationFn: ({
      tenderId,
      bidId,
      fileName,
    }: {
      tenderId: string;
      bidId: string;
      fileName: string;
    }) => bidService.downloadBidDocument(tenderId, bidId, fileName),

    onError: () => handleError(null, 'Failed to download document'),
  });
};