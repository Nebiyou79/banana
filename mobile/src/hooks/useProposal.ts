// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/useProposal.ts
// Banana Mobile App — Module 6B: Proposals
//
// All 13 React Query hooks for the Proposals module.
// Query key namespace: ['proposals', ...]
//
// Cache-invalidation contracts:
//   useSubmitProposal       → proposal detail + my-proposals list
//   useWithdrawProposal     → proposal detail + my-proposals list
//   useUpdateProposalStatus → tenderProposals list (+ proposal detail)
//   useToggleShortlist      → tenderProposals list + proposal detail
//   useUpdateProposalDraft  → proposal detail (silent — no toast)
//   useUploadProposalAttachment → proposal detail
//   useRemoveProposalAttachment → proposal detail
//
// Mirrors frontend/src/hooks/useProposal.ts pattern exactly.
// ─────────────────────────────────────────────────────────────────────────────

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';

import proposalService from '../services/proposalService';
import { toast } from '../lib/toast';

import type {
  Proposal,
  ProposalListItem,
  ProposalListResponse,
  ProposalStats,
  CreateProposalData,
  UpdateProposalData,
  ProposalFilters,
  UpdateProposalStatusData,
  ProposalAttachment,
  UploadAttachmentResponse,
  getTenderId as GetTenderIdFn,
} from '../types/proposal';

import { getTenderId } from '../types/proposal';

// ─────────────────────────────────────────────────────────────────────────────
// QUERY KEYS
// All keys live under the ['proposals'] namespace.
// Keep keys referentially stable — consumers memoize with these.
// ─────────────────────────────────────────────────────────────────────────────

export const proposalKeys = {
  /** Root namespace — invaldiating this nukes the entire proposal cache */
  all: ['proposals'] as const,

  // ── Freelancer ──────────────────────────────────────────────────────────

  /** My proposal list (optional filters in the key for correct scoping) */
  myProposals: (filters?: ProposalFilters) =>
    [...proposalKeys.all, 'my-proposals', filters ?? {}] as const,

  /** My proposal for a specific tender */
  myProposalForTender: (tenderId: string) =>
    [...proposalKeys.all, 'my-proposal-for-tender', tenderId] as const,

  // ── Detail ──────────────────────────────────────────────────────────────

  /** Full detail for a single proposal */
  detail: (proposalId: string) =>
    [...proposalKeys.all, 'detail', proposalId] as const,

  // ── Company ──────────────────────────────────────────────────────────────

  /** All non-draft proposals for a tender (company view) */
  tenderProposals: (tenderId: string, filters?: ProposalFilters) =>
    [...proposalKeys.all, 'tender-proposals', tenderId, filters ?? {}] as const,

  /** Aggregate stats for a tender's proposals */
  tenderStats: (tenderId: string) =>
    [...proposalKeys.all, 'tender-stats', tenderId] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// QUERY HOOKS (5)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook 1 — Freelancer's own proposal list.
 * Equivalent to frontend Hook 23.
 */
export function useMyProposals(
  filters?: ProposalFilters,
  options?: Omit<UseQueryOptions<ProposalListResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: proposalKeys.myProposals(filters),
    queryFn: () => proposalService.getMyProposals(filters),
    staleTime: 60_000, // 1 min — list can go slightly stale
    ...options,
  });
}

/**
 * Hook 2 — Check if the freelancer already has a proposal for a tender.
 * Returns null when no proposal exists (server returns null, not 404).
 * CRITICAL: Call this in SubmitProposalScreen BEFORE creating a new draft.
 * Equivalent to frontend Hook 24.
 */
export function useMyProposalForTender(
  tenderId: string,
  options?: Omit<UseQueryOptions<Proposal | null>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: proposalKeys.myProposalForTender(tenderId),
    queryFn: () => proposalService.getMyProposalForTender(tenderId),
    enabled: !!tenderId,
    staleTime: 30_000,
    ...options,
  });
}

/**
 * Hook 3 — Full proposal detail for both freelancer and company views.
 * Equivalent to frontend Hook 25.
 */
export function useProposalDetail(
  proposalId: string,
  options?: Omit<UseQueryOptions<Proposal>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: proposalKeys.detail(proposalId),
    queryFn: () => proposalService.getProposalDetail(proposalId),
    enabled: !!proposalId,
    staleTime: 30_000,
    ...options,
  });
}

/**
 * Hook 4 — Company: all non-draft proposals for a tender they own.
 * Supports sort, status filter, pagination, and shortlist-only filter.
 * Equivalent to frontend Hook 26.
 */
export function useTenderProposals(
  tenderId: string,
  filters?: ProposalFilters,
  options?: Omit<UseQueryOptions<ProposalListResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: proposalKeys.tenderProposals(tenderId, filters),
    queryFn: () => proposalService.getTenderProposals(tenderId, filters),
    enabled: !!tenderId,
    staleTime: 30_000,
    ...options,
  });
}

/**
 * Hook 5 — Company: aggregate stats for a tender's proposals.
 * Drives the stats bar at the top of TenderProposalsScreen.
 * Equivalent to frontend Hook 27.
 */
export function useTenderProposalStats(
  tenderId: string,
  options?: Omit<UseQueryOptions<ProposalStats>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: proposalKeys.tenderStats(tenderId),
    queryFn: () => proposalService.getTenderProposalStats(tenderId),
    enabled: !!tenderId,
    staleTime: 60_000,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MUTATION HOOKS (8)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook 6 — Create a draft proposal (MUST be called before saving any content).
 * Equivalent to frontend Hook 28.
 *
 * On success:
 *   • Invalidates myProposals list (the new draft should appear there)
 *   • Invalidates myProposalForTender for the given tenderId
 */
export function useCreateProposalDraft(
  options?: UseMutationOptions<Proposal, Error, CreateProposalData>,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProposalData) => proposalService.createDraft(data),

    onSuccess: (data, variables) => {
      // Seed the detail cache immediately so it's ready when the form steps load
      qc.setQueryData(proposalKeys.detail(data._id), data);

      qc.invalidateQueries({
        queryKey: proposalKeys.myProposals(),
      });
      qc.invalidateQueries({
        queryKey: proposalKeys.myProposalForTender(variables.tenderId),
      });
    },

    onError: (err) => {
      console.error('[useCreateProposalDraft]', err);
      toast.error('Could not start your proposal. Please try again.');
    },

    ...options,
  });
}

/**
 * Hook 7 — Auto-save draft step data.
 * Equivalent to frontend Hook 29.
 *
 * Errors are intentionally SILENT (no toast) because auto-save failures
 * should not interrupt the user's flow — the form will retry on the next
 * step navigation.
 */
export function useUpdateProposalDraft(
  options?: UseMutationOptions<
    Proposal,
    Error,
    { proposalId: string; data: UpdateProposalData }
  >,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ proposalId, data }) =>
      proposalService.updateDraft(proposalId, data),

    onSuccess: (updatedProposal) => {
      // Quietly update the cache — no toast
      qc.setQueryData(
        proposalKeys.detail(updatedProposal._id),
        updatedProposal,
      );
    },

    onError: (err) => {
      // Silent — only log, do NOT show a toast
      console.warn('[useUpdateProposalDraft] auto-save failed:', err);
    },

    ...options,
  });
}

/**
 * Hook 8 — Submit a draft (transitions status → 'submitted').
 * Equivalent to frontend Hook 30.
 *
 * On success:
 *   • Invalidates proposal detail (status changed)
 *   • Invalidates my-proposals list (status changed in list)
 *   • Invalidates myProposalForTender (so SubmitProposalScreen re-evaluates)
 */
export function useSubmitProposal(
  options?: UseMutationOptions<Proposal, Error, string>,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (proposalId: string) =>
      proposalService.submitProposal(proposalId),

    onSuccess: (data) => {
      toast.success('Proposal submitted successfully!');

      const tenderId = getTenderId(data.tender);

      // Invalidate in order of specificity
      qc.invalidateQueries({ queryKey: proposalKeys.detail(data._id) });
      qc.invalidateQueries({ queryKey: proposalKeys.myProposals() });

      if (tenderId) {
        qc.invalidateQueries({
          queryKey: proposalKeys.myProposalForTender(tenderId),
        });
      }
    },

    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        err?.response?.data?.message ?? 'Failed to submit proposal.';
      toast.error(message);
    },

    ...options,
  });
}

/**
 * Hook 9 — Freelancer withdraws a submitted/under-review proposal.
 * Equivalent to frontend Hook 31.
 *
 * On success:
 *   • Invalidates proposal detail
 *   • Invalidates my-proposals list
 *   • Invalidates myProposalForTender
 */
export function useWithdrawProposal(
  options?: UseMutationOptions<Proposal, Error, string>,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (proposalId: string) =>
      proposalService.withdrawProposal(proposalId),

    onSuccess: (data) => {
      toast.info('Proposal withdrawn.');

      const tenderId = getTenderId(data.tender);

      qc.invalidateQueries({ queryKey: proposalKeys.detail(data._id) });
      qc.invalidateQueries({ queryKey: proposalKeys.myProposals() });

      if (tenderId) {
        qc.invalidateQueries({
          queryKey: proposalKeys.myProposalForTender(tenderId),
        });
      }
    },

    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        err?.response?.data?.message ?? 'Could not withdraw proposal.';
      toast.error(message);
    },

    ...options,
  });
}

/**
 * Hook 10 — Company: update proposal status through the lifecycle.
 * Equivalent to frontend Hook 32.
 *
 * On success:
 *   • Invalidates tenderProposals list for the owning tender
 *   • Invalidates proposal detail
 */
export function useUpdateProposalStatus(
  options?: UseMutationOptions<
    Proposal,
    Error,
    { proposalId: string; data: UpdateProposalStatusData; tenderId?: string }
  >,
) {
  const qc = useQueryClient();

  const STATUS_MESSAGES: Partial<Record<string, string>> = {
    under_review: 'Moved to Under Review.',
    shortlisted: 'Proposal shortlisted! ⭐',
    interview_scheduled: 'Interview scheduled.',
    awarded: 'Contract awarded! 🏆',
    rejected: 'Proposal rejected.',
  };

  return useMutation({
    mutationFn: ({ proposalId, data }) =>
      proposalService.updateProposalStatus(proposalId, data),

    onSuccess: (updatedProposal, variables) => {
      const msg =
        STATUS_MESSAGES[variables.data.status] ?? 'Status updated.';
      toast.success(msg);

      // Resolve tenderId from variable hint or from the returned proposal
      const tenderId =
        variables.tenderId ?? getTenderId(updatedProposal.tender);

      qc.invalidateQueries({
        queryKey: proposalKeys.detail(variables.proposalId),
      });

      if (tenderId) {
        // Invalidate both the list and the stats (counts change)
        qc.invalidateQueries({
          queryKey: proposalKeys.tenderProposals(tenderId),
        });
        qc.invalidateQueries({
          queryKey: proposalKeys.tenderStats(tenderId),
        });
      }
    },

    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        err?.response?.data?.message ?? 'Failed to update status.';
      toast.error(message);
    },

    ...options,
  });
}

/**
 * Hook 11 — Company: toggle isShortlisted with optimistic update + rollback.
 * Equivalent to frontend Hook 33.
 *
 * On success:
 *   • Invalidates tenderProposals list
 *   • Invalidates proposal detail
 */

type ShortlistContext = { previousDetail?: Proposal };

export function useToggleShortlist(
  options?: UseMutationOptions<
    { isShortlisted: boolean },
    Error,
    { proposalId: string; tenderId?: string },
    ShortlistContext
  >,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ proposalId }) =>
      proposalService.toggleShortlist(proposalId),

    // Optimistic update — flip isShortlisted immediately in the cache
    onMutate: async ({ proposalId }): Promise<ShortlistContext> => {
      await qc.cancelQueries({ queryKey: proposalKeys.detail(proposalId) });

      const previousDetail = qc.getQueryData<Proposal>(
        proposalKeys.detail(proposalId),
      );

      qc.setQueryData<Proposal>(
        proposalKeys.detail(proposalId),
        (old) => {
          if (!old) return old;
          return { ...old, isShortlisted: !old.isShortlisted };
        },
      );

      return { previousDetail };
    },

    onError: (_err, { proposalId }, context) => {
      // Roll back the optimistic update
      if (context?.previousDetail) {
        qc.setQueryData(
          proposalKeys.detail(proposalId),
          context.previousDetail,
        );
      }
      toast.error('Could not update shortlist.');
    },

    onSettled: (_data, _err, { proposalId, tenderId }) => {
      qc.invalidateQueries({ queryKey: proposalKeys.detail(proposalId) });

      if (tenderId) {
        qc.invalidateQueries({
          queryKey: proposalKeys.tenderProposals(tenderId),
        });
      }
    },

    ...options,
  });
}

/**
 * Hook 12 — Freelancer: upload an attachment to a proposal.
 * Equivalent to frontend Hook 34.
 *
 * On success:
 *   • Invalidates proposal detail (attachments array changed)
 */

interface UploadAttachmentVars {
  proposalId: string;
  fileUri: string;
  fileName: string;
  mimeType: string;
  attachmentType?: ProposalAttachment['attachmentType'];
}

export function useUploadProposalAttachment(
  options?: UseMutationOptions<
    UploadAttachmentResponse,
    Error,
    UploadAttachmentVars
  >,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      proposalId,
      fileUri,
      fileName,
      mimeType,
      attachmentType,
    }) =>
      proposalService.uploadAttachment(
        proposalId,
        fileUri,
        fileName,
        mimeType,
        attachmentType,
      ),

    onSuccess: (_data, { proposalId }) => {
      qc.invalidateQueries({ queryKey: proposalKeys.detail(proposalId) });
    },

    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        err?.response?.data?.message ?? 'Upload failed. Please try again.';
      toast.error(message);
    },

    ...options,
  });
}

/**
 * Hook 13 — Freelancer: remove an attachment from a proposal.
 * Equivalent to frontend Hook 35.
 *
 * On success:
 *   • Invalidates proposal detail
 */

interface RemoveAttachmentVars {
  proposalId: string;
  attachmentId: string;
}

export function useRemoveProposalAttachment(
  options?: UseMutationOptions<void, Error, RemoveAttachmentVars>,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ proposalId, attachmentId }) =>
      proposalService.removeAttachment(proposalId, attachmentId),

    onSuccess: (_data, { proposalId }) => {
      qc.invalidateQueries({ queryKey: proposalKeys.detail(proposalId) });
    },

    onError: () => {
      toast.error('Could not remove attachment.');
    },

    ...options,
  });
}
