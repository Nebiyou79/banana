/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useProposal.ts
// Complete React Query hook library for the Proposal microservice.
// Standalone — do NOT modify useFreelanceTender.ts.
'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query';
import { useEffect, useRef, useState, useCallback } from 'react';

import proposalService, {
  type Proposal,
  type ProposalListItem,
  type ProposalFilters,
  type ProposalStats,
  type CreateProposalData,
  type UpdateProposalData,
  type ProposalStatus,
  type ProposalAttachment,
} from '@/services/proposalService';
import { handleSuccess, handleError } from '@/lib/error-handler';

// ─────────────────────────────────────────────────────────────────────────────
// QUERY KEYS
// ─────────────────────────────────────────────────────────────────────────────

export const proposalKeys = {
  all: ['proposals'] as const,

  myProposals: (filters?: ProposalFilters) =>
    [...proposalKeys.all, 'my-proposals', filters] as const,

  detail: (id: string) =>
    [...proposalKeys.all, 'detail', id] as const,

  tenderProposals: (tenderId: string, filters?: ProposalFilters) =>
    [...proposalKeys.all, 'tender', tenderId, filters] as const,

  tenderProposalStats: (tenderId: string) =>
    [...proposalKeys.all, 'tender', tenderId, 'stats'] as const,

  myProposalForTender: (tenderId: string) =>
    [...proposalKeys.all, 'my-proposal-for-tender', tenderId] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// QUERY HOOKS (5)
// ─────────────────────────────────────────────────────────────────────────────

/** Hook 23 — Freelancer's own proposal list */
export function useMyProposals(
  filters?: ProposalFilters,
  options?: Omit<UseQueryOptions<{ proposals: ProposalListItem[]; pagination: any }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: proposalKeys.myProposals(filters),
    queryFn: () => proposalService.getMyProposals(filters),
    staleTime: 60_000,
    ...options,
  });
}

/** Hook 24 — Freelancer's proposal for a specific tender (null if none) */
export function useMyProposalForTender(
  tenderId: string,
  options?: Omit<UseQueryOptions<Proposal | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: proposalKeys.myProposalForTender(tenderId),
    queryFn:  () => proposalService.getMyProposalForTender(tenderId),
    enabled:  !!tenderId,
    ...options,
  });
}

/** Hook 25 — Full proposal detail */
export function useProposalDetail(
  proposalId: string,
  options?: Omit<UseQueryOptions<Proposal>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: proposalKeys.detail(proposalId),
    queryFn:  () => proposalService.getProposalDetail(proposalId),
    enabled:  !!proposalId,
    ...options,
  });
}

/** Hook 26 — All proposals for a tender (owner view) */
export function useTenderProposals(
  tenderId: string,
  filters?: ProposalFilters,
  options?: Omit<UseQueryOptions<{ proposals: ProposalListItem[]; pagination: any }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: proposalKeys.tenderProposals(tenderId, filters),
    queryFn:  () => proposalService.getTenderProposals(tenderId, filters),
    enabled:  !!tenderId,
    ...options,
  });
}

/** Hook 27 — Aggregated stats for a tender */
export function useTenderProposalStats(
  tenderId: string,
  options?: Omit<UseQueryOptions<ProposalStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: proposalKeys.tenderProposalStats(tenderId),
    queryFn:  () => proposalService.getTenderProposalStats(tenderId),
    enabled:  !!tenderId,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MUTATION HOOKS (8)
// ─────────────────────────────────────────────────────────────────────────────

/** Hook 28 — Create a draft proposal */
export function useCreateDraft(
  options?: UseMutationOptions<Proposal, Error, CreateProposalData>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProposalData) => proposalService.createDraft(data),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: proposalKeys.myProposals() });
      qc.invalidateQueries({
        queryKey: proposalKeys.myProposalForTender(variables.tenderId),
      });
    },
    onError: (err) => handleError(err),
    ...options,
  });
}

/** Hook 29 — Auto-save draft updates — errors are silent (called every few seconds) */
export function useUpdateDraft(
  options?: UseMutationOptions<Proposal, Error, { proposalId: string; data: UpdateProposalData }>
) {
  return useMutation({
    mutationFn: ({ proposalId, data }) => proposalService.updateDraft(proposalId, data),
    onError: (err) => {
      // Silent — do not show toast for auto-save failures
      console.warn('[useUpdateDraft] auto-save failed:', err);
    },
    ...options,
  });
}

/** Hook 30 — Submit a draft — shows success toast and invalidates list + detail */
export function useSubmitProposal(
  options?: UseMutationOptions<Proposal, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => proposalService.submitProposal(proposalId),
    onSuccess: (data) => {
      handleSuccess('Proposal submitted!');
      const tenderId = typeof data.tender === 'string' ? data.tender : data.tender?._id;
      qc.invalidateQueries({ queryKey: proposalKeys.myProposals() });
      qc.invalidateQueries({ queryKey: proposalKeys.detail(data._id) });
      if (tenderId) {
        qc.invalidateQueries({ queryKey: proposalKeys.tenderProposals(tenderId) });
        qc.invalidateQueries({ queryKey: proposalKeys.myProposalForTender(tenderId) });
      }
    },
    onError: (err) => handleError(err),
    ...options,
  });
}

/** Hook 31 — Withdraw a proposal */
export function useWithdrawProposal(
  options?: UseMutationOptions<Proposal, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => proposalService.withdrawProposal(proposalId),
    onSuccess: (data) => {
      handleSuccess('Proposal withdrawn.');
      const tenderId = typeof data.tender === 'string' ? data.tender : data.tender?._id;
      qc.invalidateQueries({ queryKey: proposalKeys.myProposals() });
      qc.invalidateQueries({ queryKey: proposalKeys.detail(data._id) });
      if (tenderId) {
        qc.invalidateQueries({ queryKey: proposalKeys.tenderProposals(tenderId) });
        qc.invalidateQueries({ queryKey: proposalKeys.myProposalForTender(tenderId) });
      }
    },
    onError: (err) => handleError(err),
    ...options,
  });
}

type UpdateStatusVars = {
  proposalId: string;
  data: {
    status: ProposalStatus;
    ownerNotes?: string;
    interviewDate?: string;
    interviewNotes?: string;
  };
};

const STATUS_SUCCESS_MESSAGES: Partial<Record<ProposalStatus, string>> = {
  under_review:         'Proposal moved to Under Review.',
  shortlisted:          'Proposal shortlisted!',
  interview_scheduled:  'Interview scheduled.',
  awarded:              '🏆 Proposal awarded!',
  rejected:             'Proposal rejected.',
};

/** Hook 32 — Owner: update proposal status through the lifecycle */
export function useUpdateProposalStatus(
  options?: UseMutationOptions<Proposal, Error, UpdateStatusVars>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, data }) =>
      proposalService.updateProposalStatus(proposalId, data),
    onSuccess: (data, variables) => {
      const msg = STATUS_SUCCESS_MESSAGES[variables.data.status] ?? 'Status updated.';
      handleSuccess(msg);
      const tenderId = typeof data.tender === 'string' ? data.tender : data.tender?._id;
      qc.invalidateQueries({ queryKey: proposalKeys.detail(variables.proposalId) });
      if (tenderId) {
        qc.invalidateQueries({ queryKey: proposalKeys.tenderProposals(tenderId) });
        qc.invalidateQueries({ queryKey: proposalKeys.tenderProposalStats(tenderId) });
      }
    },
    onError: (err) => handleError(err),
    ...options,
  });
}

type ShortlistContext = { previousData?: Proposal };

/** Hook 33 — Owner: toggle shortlist with optimistic update + rollback */
export function useToggleShortlist(
  options?: UseMutationOptions<{ isShortlisted: boolean }, Error, string, ShortlistContext>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => proposalService.toggleShortlist(proposalId),

    onMutate: async (proposalId: string): Promise<ShortlistContext> => {
      await qc.cancelQueries({ queryKey: proposalKeys.detail(proposalId) });
      const previousData = qc.getQueryData<Proposal>(proposalKeys.detail(proposalId));

      qc.setQueryData<Proposal>(proposalKeys.detail(proposalId), (old) => {
        if (!old) return old;
        return { ...old, isShortlisted: !old.isShortlisted };
      });

      return { previousData };
    },

    onError: (err, proposalId, context) => {
      // Roll back optimistic update
      if (context?.previousData) {
        qc.setQueryData(proposalKeys.detail(proposalId), context.previousData);
      }
      handleError(err);
    },

    onSettled: (data, err, proposalId) => {
      qc.invalidateQueries({ queryKey: proposalKeys.detail(proposalId) });
    },

    ...options,
  });
}

type UploadAttachmentsVars = {
  proposalId: string;
  files: File[];
  attachmentType?: string;
};

/** Hook 34 — Freelancer: upload attachments to a proposal */
export function useUploadProposalAttachments(
  options?: UseMutationOptions<
    { attachments: ProposalAttachment[] },
    Error,
    UploadAttachmentsVars
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, files, attachmentType }) =>
      proposalService.uploadAttachments(proposalId, files, attachmentType),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: proposalKeys.detail(variables.proposalId) });
    },
    onError: (err) => handleError(err),
    ...options,
  });
}

type DeleteAttachmentVars = { proposalId: string; attachmentId: string };

/** Hook 35 — Freelancer: delete an attachment */
export function useDeleteProposalAttachment(
  options?: UseMutationOptions<void, Error, DeleteAttachmentVars>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, attachmentId }) =>
      proposalService.deleteAttachment(proposalId, attachmentId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: proposalKeys.detail(variables.proposalId) });
    },
    onError: (err) => handleError(err),
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM HOOK: useProposalAutoSave
// ─────────────────────────────────────────────────────────────────────────────

export type AutoSaveState = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveOptions {
  proposalId: string | undefined | null;
  formData: UpdateProposalData;
  isDirty: boolean;
  isSubmitting: boolean;
}

interface AutoSaveResult {
  saveState: AutoSaveState;
  lastSavedAt: Date | null;
  forceSave: () => void;
}

const DEBOUNCE_MS = 3000;

/**
 * Debounced auto-save for proposal drafts.
 * - Fires 3s after the last form change when isDirty && !isSubmitting && !!proposalId
 * - forceSave() bypasses the debounce immediately
 * - Reports saveState: "idle" | "saving" | "saved" | "error"
 */
export function useProposalAutoSave({
  proposalId,
  formData,
  isDirty,
  isSubmitting,
}: AutoSaveOptions): AutoSaveResult {
  const [saveState, setSaveState] = useState<AutoSaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateDraft = useUpdateDraft();

  const save = useCallback(async () => {
    if (!proposalId || isSubmitting) return;
    setSaveState('saving');
    try {
      await updateDraft.mutateAsync({ proposalId, data: formData });
      setSaveState('saved');
      setLastSavedAt(new Date());
    } catch {
      setSaveState('error');
    }
  }, [proposalId, formData, isSubmitting, updateDraft]);

  // Debounced auto-save triggered by formData changes
  useEffect(() => {
    if (!isDirty || isSubmitting || !proposalId) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, isSubmitting, proposalId, save]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const forceSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    save();
  }, [save]);

  return { saveState, lastSavedAt, forceSave };
}