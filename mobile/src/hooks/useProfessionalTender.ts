// ─────────────────────────────────────────────────────────────────────────────
//  src/hooks/useProfessionalTender.ts
// ─────────────────────────────────────────────────────────────────────────────
//  All hooks are NAMED exports (per spec § Prompt 2).
//  Query key namespace: ['professionalTenders', ...]
//
//  Mutation invalidation strategy:
//   • create / update / delete / publish / lock / reveal / close / addAddendum
//     → invalidate the lists (browse + my-tenders) so cards reflect new state.
//   • lock / reveal / close
//     → ALSO directly setQueryData on the detail key so the action bar
//       updates immediately without a network round-trip (spec § Prompt 2).
//   • addAddendum
//     → invalidate the detail key so the addenda list refetches.
// ─────────────────────────────────────────────────────────────────────────────

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import professionalTenderService from '../services/professionalTenderService';
import type {
  AddendumData,
  CPOData,
  CreateProfessionalTenderData,
  MyProfessionalTendersFilters,
  ProfessionalTender,
  ProfessionalTenderBid,
  ProfessionalTenderDetailResponse,
  ProfessionalTenderFilters,
  ProfessionalTenderListResponse,
  UpdateProfessionalTenderData,
} from '../types/professionalTender';
import { CompanyProfile, CompanySearchResult, companyService } from '../services/companyService';

// ═════════════════════════════════════════════════════════════════════════════
//  QUERY KEYS
// ═════════════════════════════════════════════════════════════════════════════

/** Single source of truth for all keys in this module.  Don't inline them. */
export const professionalTenderKeys = {
  all:          ['professionalTenders'] as const,
  lists:        () => [...professionalTenderKeys.all, 'list'] as const,
  list:         (filters?: ProfessionalTenderFilters) =>
                  [...professionalTenderKeys.lists(), filters ?? {}] as const,
  myLists:      () => [...professionalTenderKeys.all, 'myList'] as const,
  myList:       (filters?: MyProfessionalTendersFilters) =>
                  [...professionalTenderKeys.myLists(), filters ?? {}] as const,
  details:      () => [...professionalTenderKeys.all, 'detail'] as const,
  detail:       (id: string) =>
                  [...professionalTenderKeys.details(), id] as const,
  editData:     (id: string) =>
                  [...professionalTenderKeys.all, 'editData', id] as const,
  bids:         (id: string) =>
                  [...professionalTenderKeys.all, 'bids', id] as const,
};

// ═════════════════════════════════════════════════════════════════════════════
//  QUERIES
// ═════════════════════════════════════════════════════════════════════════════

/** Browse other companies' tenders (public list, role-aware on the server). */
export const useProfessionalTenders = (
  filters?: ProfessionalTenderFilters,
  options?: Omit<UseQueryOptions<ProfessionalTenderListResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery<ProfessionalTenderListResponse>({
    queryKey: professionalTenderKeys.list(filters),
    queryFn: () => professionalTenderService.getProfessionalTenders(filters),
    staleTime: 30_000,
    ...options,
  });
};

/**
 * Single tender detail.  Returns `{ data, isOwner }` so the screen can
 * branch correctly between owner controls and bidder controls.
 */
export const useProfessionalTender = (
  id: string | undefined,
  options?: Omit<UseQueryOptions<ProfessionalTenderDetailResponse>, 'queryKey' | 'queryFn' | 'enabled'> & {
    enabled?: boolean;
  },
) => {
  return useQuery<ProfessionalTenderDetailResponse>({
    queryKey: professionalTenderKeys.detail(id ?? ''),
    queryFn: () => professionalTenderService.getProfessionalTender(id as string),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 15_000,
    ...options,
  });
};

/**
 * Owner-only edit-data fetch.  Backend returns 400 for non-draft tenders;
 * EditScreen should still call this and handle the error to render the
 * "use Addendum system" CTA.
 */
export const useProfessionalTenderEditData = (
  id: string | undefined,
  options?: Omit<UseQueryOptions<ProfessionalTender>, 'queryKey' | 'queryFn' | 'enabled'> & {
    enabled?: boolean;
  },
) => {
  return useQuery<ProfessionalTender>({
    queryKey: professionalTenderKeys.editData(id ?? ''),
    queryFn: () => professionalTenderService.getProfessionalTenderEditData(id as string),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 0,                    // edit data is always fresh — no caching
    ...options,
  });
};

/** Owner's posted tenders. */
export const useMyPostedProfessionalTenders = (
  filters?: MyProfessionalTendersFilters,
  options?: Omit<UseQueryOptions<ProfessionalTenderListResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery<ProfessionalTenderListResponse>({
    queryKey: professionalTenderKeys.myList(filters),
    queryFn: () => professionalTenderService.getMyPostedProfessionalTenders(filters),
    staleTime: 30_000,
    ...options,
  });
};

/**
 * Bids on a single tender (owner only, post-reveal for sealed tenders).
 * Caller must gate with `areSealedBidsViewable` before rendering amounts.
 */
export const useTenderBids = (
  id: string | undefined,
  options?: Omit<UseQueryOptions<ProfessionalTenderBid[]>, 'queryKey' | 'queryFn' | 'enabled'> & {
    enabled?: boolean;
  },
) => {
  return useQuery<ProfessionalTenderBid[]>({
    queryKey: professionalTenderKeys.bids(id ?? ''),
    queryFn: () => professionalTenderService.getBidsForTender(id as string),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 15_000,
    ...options,
  });
};

// ═════════════════════════════════════════════════════════════════════════════
//  MUTATIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Invalidate every list-shaped query in the module.  Used by mutations that
 * change a tender's identity or status — both browse AND my-tenders need
 * refresh because a tender can appear in either.
 */
function invalidateAllLists(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: professionalTenderKeys.lists() });
  qc.invalidateQueries({ queryKey: professionalTenderKeys.myLists() });
}

/**
 * Patch the detail cache in place after a status transition.  Avoids a
 * round-trip when the user is sitting on the detail screen and taps a
 * status-change button.
 */
function patchDetailCache(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  patcher: (current: ProfessionalTender) => ProfessionalTender,
) {
  qc.setQueryData<ProfessionalTenderDetailResponse>(
    professionalTenderKeys.detail(id),
    (prev) => (prev ? { ...prev, data: patcher(prev.data) } : prev),
  );
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

interface CreateVars {
  data: CreateProfessionalTenderData;
  files?: Array<{ uri: string; name: string; type: string }>;
}

export const useCreateProfessionalTender = (
  options?: UseMutationOptions<ProfessionalTender, Error, CreateVars>,
) => {
  const qc = useQueryClient();
  return useMutation<ProfessionalTender, Error, CreateVars>({
    mutationFn: ({ data, files }) =>
      professionalTenderService.createProfessionalTender(data, files),
    onSuccess: (...args) => {
      const [created] = args;
      invalidateAllLists(qc);
      // Seed detail cache so the post-create navigation reads from cache
      qc.setQueryData<ProfessionalTenderDetailResponse>(
        professionalTenderKeys.detail(created._id),
        { data: created, isOwner: true },
      );
      (options?.onSuccess as any)?.(...args);
    },
    ...options,
  });
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────

interface UpdateVars {
  id: string;
  data: UpdateProfessionalTenderData;
  files?: Array<{ uri: string; name: string; type: string }>;
}

export const useUpdateProfessionalTender = (
  options?: UseMutationOptions<ProfessionalTender, Error, UpdateVars>,
) => {
  const qc = useQueryClient();
  return useMutation<ProfessionalTender, Error, UpdateVars>({
    mutationFn: ({ id, data, files }) =>
      professionalTenderService.updateProfessionalTender(id, data, files),
    onSuccess: (...args) => {
      const [updated, vars] = args;
      invalidateAllLists(qc);
      qc.invalidateQueries({ queryKey: professionalTenderKeys.editData(vars.id) });
      patchDetailCache(qc, vars.id, () => updated);
      (options?.onSuccess as any)?.(...args);
    },
    ...options,
  });
};

// ─── DELETE ──────────────────────────────────────────────────────────────────

export const useDeleteProfessionalTender = (
  options?: UseMutationOptions<void, Error, string>,
) => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => professionalTenderService.deleteProfessionalTender(id),
    onSuccess: (...args) => {
      const [, id] = args;
      invalidateAllLists(qc);
      qc.removeQueries({ queryKey: professionalTenderKeys.detail(id) });
      qc.removeQueries({ queryKey: professionalTenderKeys.editData(id) });
      (options?.onSuccess as any)?.(...args);
    },
    ...options,
  });
};

// ─── PUBLISH ─────────────────────────────────────────────────────────────────

export const usePublishProfessionalTender = (
  options?: UseMutationOptions<ProfessionalTender, Error, string>,
) => {
  const qc = useQueryClient();
  return useMutation<ProfessionalTender, Error, string>({
    mutationFn: (id) => professionalTenderService.publishProfessionalTender(id),
    onSuccess: (...args) => {
      const [published, id] = args;
      invalidateAllLists(qc);
      patchDetailCache(qc, id, () => published);
      (options?.onSuccess as any)?.(...args);
    },
    ...options,
  });
};

// ─── LOCK (sealed-bid: published → locked) ───────────────────────────────────

export const useLockProfessionalTender = (
  options?: UseMutationOptions<ProfessionalTender, Error, string>,
) => {
  const qc = useQueryClient();
  return useMutation<ProfessionalTender, Error, string>({
    mutationFn: (id) => professionalTenderService.lockProfessionalTender(id),
    onSuccess: (...args) => {
      const [locked, id] = args;
      invalidateAllLists(qc);
      // Direct cache patch — spec requires immediate UI update
      patchDetailCache(qc, id, (current) => ({
        ...current,
        ...locked,
        status: 'locked',
        lockedAt: locked.lockedAt ?? new Date().toISOString(),
      }));
      (options?.onSuccess as any)?.(...args);
    },
    ...options,
  });
};

// ─── REVEAL (sealed-bid: deadline_reached → revealed) ────────────────────────

interface RevealResult {
  bidsRevealed: number;
  tender?: ProfessionalTender;
}

export const useRevealProfessionalTender = (
  options?: UseMutationOptions<RevealResult, Error, string>,
) => {
  const qc = useQueryClient();
  return useMutation<RevealResult, Error, string>({
    mutationFn: (id) => professionalTenderService.revealProfessionalTender(id),
    onSuccess: (...args) => {
      const [result, id] = args;
      invalidateAllLists(qc);
      // Bids list is now meaningful — invalidate so it refetches on the
      // IncomingBidsScreen.
      qc.invalidateQueries({ queryKey: professionalTenderKeys.bids(id) });
      // Direct cache patch — flip status to 'revealed' immediately
      patchDetailCache(qc, id, (current) => ({
        ...current,
        ...(result.tender ?? {}),
        status: 'revealed',
        revealedAt: result.tender?.revealedAt ?? new Date().toISOString(),
      }));
      (options?.onSuccess as any)?.(...args);
    },
    ...options,
  });
};

// ─── CLOSE ───────────────────────────────────────────────────────────────────

export const useCloseProfessionalTender = (
  options?: UseMutationOptions<ProfessionalTender, Error, string>,
) => {
  const qc = useQueryClient();
  return useMutation<ProfessionalTender, Error, string>({
    mutationFn: (id) => professionalTenderService.closeProfessionalTender(id),
    onSuccess: (...args) => {
      const [closed, id] = args;
      invalidateAllLists(qc);
      patchDetailCache(qc, id, (current) => ({
        ...current,
        ...closed,
        status: 'closed',
        closedAt: closed.closedAt ?? new Date().toISOString(),
      }));
      (options?.onSuccess as any)?.(...args);
    },
    ...options,
  });
};

// ─── ADDENDUM ────────────────────────────────────────────────────────────────

interface AddendumVars {
  id: string;
  data: AddendumData;
  files?: Array<{ uri: string; name: string; type: string }>;
}

export const useAddAddendum = (
  options?: UseMutationOptions<
    { _id: string; title: string; description: string; issuedAt: string },
    Error,
    AddendumVars
  >,
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, files }: AddendumVars) =>
      professionalTenderService.addAddendum(id, data, files),
    onSuccess: (...args) => {
      const [, vars] = args;
      // Detail must refetch so the addenda list reflects the new entry
      qc.invalidateQueries({ queryKey: professionalTenderKeys.detail(vars.id) });
      // Lists carry the addendum count too
      invalidateAllLists(qc);
      (options?.onSuccess as any)?.(...args);
    },
    ...options,
  });
};

// ─── CPO ─────────────────────────────────────────────────────────────────────

interface CPOVars {
  id: string;
  data: CPOData;
  file: { uri: string; name: string; type: string } | File;
}

export const useSubmitCPO = (
  options?: UseMutationOptions<ProfessionalTender, Error, CPOVars>,
) => {
  const qc = useQueryClient();
  return useMutation<ProfessionalTender, Error, CPOVars>({
    mutationFn: ({ id, data, file }) =>
      professionalTenderService.submitCPO(id, data, file),
    onSuccess: (...args) => {
      const [, vars] = args;
      qc.invalidateQueries({ queryKey: professionalTenderKeys.detail(vars.id) });
      (options?.onSuccess as any)?.(...args);
    },
    ...options,
  });
};

// ═════════════════════════════════════════════════════════════════════════════
//  CATEGORIES (1.1)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Fetches the available professional-tender categories. Categories are
 * relatively static — cache aggressively (5 min staleTime).
 */
export const useProfessionalTenderCategories = (
  options?: Omit<UseQueryOptions<string[]>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery<string[]>({
    queryKey: [...professionalTenderKeys.all, 'categories'] as const,
    queryFn: () => professionalTenderService.getCategories(),
    staleTime: 5 * 60_000,
    ...options,
  });
};

// ═════════════════════════════════════════════════════════════════════════════
//  COMPANY SEARCH (1.4) — for the invitee picker
// ═════════════════════════════════════════════════════════════════════════════
;

/** Live-as-you-type company search. Disabled when query is empty. */
export const useCompanySearch = (
  query: string,
  options?: Omit<UseQueryOptions<CompanySearchResult[]>, 'queryKey' | 'queryFn' | 'enabled'> & {
    enabled?: boolean;
  },
) => {
  const trimmed = query.trim();
  return useQuery<CompanySearchResult[]>({
    queryKey: ['companies', 'search', trimmed] as const,
    queryFn: () => companyService.searchCompanies(trimmed),
    enabled: trimmed.length >= 1 && (options?.enabled ?? true),
    staleTime: 30_000,
    ...options,
  });
};

/** Resolve a set of company ids to their full profiles. */
export const useCompaniesByIds = (
  ids: string[],
  options?: Omit<UseQueryOptions<CompanyProfile[]>, 'queryKey' | 'queryFn' | 'enabled'> & {
    enabled?: boolean;
  },
) => {
  return useQuery<CompanyProfile[]>({
    queryKey: ['companies', 'byIds', [...ids].sort()] as const,
    queryFn: () => companyService.getCompaniesByIds(ids),
    enabled: ids.length > 0 && (options?.enabled ?? true),
    staleTime: 60_000,
    ...options,
  });
};