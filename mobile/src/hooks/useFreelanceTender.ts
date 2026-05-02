// mobile/src/hooks/useFreelanceTender.ts
// Mirrors frontend/src/hooks/useFreelanceTender.ts structure.

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import freelanceTenderService from '../services/freelanceTenderService';
import type {
  FreelanceTender,
  FreelanceTenderFilters,
  FreelanceTenderFormData,
  FreelanceTenderListItem,
  ApplicationStatus,
  SubmitApplicationData,
} from '../types/freelanceTender';

// ─── Query key factory ────────────────────────────────────────────────────────
// (categories key added below)

export const freelanceTenderKeys = {
  categories: ['freelanceTenders', 'categories'] as const,
  all: ['freelanceTenders'] as const,
  lists: () => [...freelanceTenderKeys.all, 'list'] as const,
  list: (filters?: FreelanceTenderFilters) =>
    [...freelanceTenderKeys.lists(), filters ?? {}] as const,
  details: () => [...freelanceTenderKeys.all, 'detail'] as const,
  detail: (id: string) => [...freelanceTenderKeys.details(), id] as const,
  editData: (id: string) =>
    [...freelanceTenderKeys.all, 'editData', id] as const,
  mine: (params?: object) =>
    [...freelanceTenderKeys.all, 'mine', params ?? {}] as const,
  saved: (params?: object) =>
    [...freelanceTenderKeys.all, 'saved', params ?? {}] as const,
  applications: (tenderId: string) =>
    [...freelanceTenderKeys.all, 'applications', tenderId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch procurement categories (used by the create/edit form step 1).
 * staleTime: 1 hour — categories rarely change.
 */
export const useFreelanceTenderCategories = () =>
  useQuery({
    queryKey: freelanceTenderKeys.categories,
    queryFn: () => freelanceTenderService.getCategories(),
    staleTime: 60 * 60 * 1000,
  });

/**
 * Infinite-paginated browse list for freelancers.
 * staleTime: 2min
 */
export const useFreelanceTenders = (filters?: Omit<FreelanceTenderFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey: freelanceTenderKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      freelanceTenderService.getFreelanceTenders({ ...filters, page: pageParam as number, limit: 15 }),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });

/**
 * Single tender detail (both owner and freelancer view).
 * staleTime: 5min
 */
export const useFreelanceTender = (id: string) =>
  useQuery({
    queryKey: freelanceTenderKeys.detail(id),
    queryFn: () => freelanceTenderService.getFreelanceTender(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Pre-populated edit data for the create/edit form.
 */
export const useFreelanceTenderEditData = (id: string) =>
  useQuery({
    queryKey: freelanceTenderKeys.editData(id),
    queryFn: () => freelanceTenderService.getFreelanceTenderEditData(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

/**
 * My posted tenders for company/org dashboard.
 */
export const useMyPostedFreelanceTenders = (params?: {
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) =>
  useQuery({
    queryKey: freelanceTenderKeys.mine(params),
    queryFn: () => freelanceTenderService.getMyPostedFreelanceTenders(params),
    staleTime: 2 * 60 * 1000,
  });

/**
 * Saved tenders list for freelancers.
 */
export const useSavedFreelanceTenders = (params?: { page?: number; limit?: number }) =>
  useQuery({
    queryKey: freelanceTenderKeys.saved(params),
    queryFn: () => freelanceTenderService.getSavedFreelanceTenders(params),
    staleTime: 2 * 60 * 1000,
  });

/**
 * Applications list for a tender (owner view).
 */
export const useFreelanceTenderApplications = (
  tenderId: string,
  params?: { status?: string; page?: number; limit?: number }
) =>
  useQuery({
    queryKey: freelanceTenderKeys.applications(tenderId),
    queryFn: () =>
      freelanceTenderService.getFreelanceTenderApplications(tenderId, params),
    enabled: !!tenderId,
    staleTime: 2 * 60 * 1000,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateFreelanceTender = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      files,
    }: {
      data: FreelanceTenderFormData;
      files?: Array<{ uri: string; name: string; mimeType: string }>;
    }) => freelanceTenderService.createFreelanceTender(data, files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: freelanceTenderKeys.lists() });
      qc.invalidateQueries({ queryKey: freelanceTenderKeys.mine() });
      Toast.show({ type: 'success', text1: 'Tender created!' });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create tender';
      Toast.show({ type: 'error', text1: msg });
    },
  });
};

export const useUpdateFreelanceTender = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
    }: {
      id: string;
      data: Partial<FreelanceTenderFormData>;
      files?: Array<{ uri: string; name: string; mimeType: string }>;
    }) => freelanceTenderService.updateFreelanceTender(id, data, files),
    onSuccess: (updated, { id }) => {
      qc.setQueryData<FreelanceTender>(freelanceTenderKeys.detail(id), updated);
      qc.invalidateQueries({ queryKey: freelanceTenderKeys.lists() });
      qc.invalidateQueries({ queryKey: freelanceTenderKeys.mine() });
      Toast.show({ type: 'success', text1: 'Tender updated!' });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to update tender';
      Toast.show({ type: 'error', text1: msg });
    },
  });
};

export const useDeleteFreelanceTender = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freelanceTenderService.deleteFreelanceTender(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: freelanceTenderKeys.mine() });
      // Optimistic removal from 'mine' lists
      const snapshots: Array<[readonly unknown[], unknown]> = [];
      qc.getQueriesData<{ tenders: FreelanceTenderListItem[] }>({
        queryKey: freelanceTenderKeys.mine(),
      }).forEach(([key, data]) => {
        snapshots.push([key, data]);
        if (data?.tenders) {
          qc.setQueryData(key, {
            ...data,
            tenders: data.tenders.filter((t) => t._id !== id),
          });
        }
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
      Toast.show({ type: 'error', text1: 'Failed to delete tender' });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: freelanceTenderKeys.mine() });
      qc.invalidateQueries({ queryKey: freelanceTenderKeys.lists() });
    },
    onSuccess: () => Toast.show({ type: 'success', text1: 'Tender deleted' }),
  });
};

export const usePublishFreelanceTender = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freelanceTenderService.publishFreelanceTender(id),
    onSuccess: (updated, id) => {
      qc.setQueryData<FreelanceTender>(freelanceTenderKeys.detail(id), updated);
      qc.invalidateQueries({ queryKey: freelanceTenderKeys.mine() });
      Toast.show({ type: 'success', text1: 'Tender published!' });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to publish tender';
      Toast.show({ type: 'error', text1: msg });
    },
  });
};

export const useCloseFreelanceTender = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freelanceTenderService.closeFreelanceTender(id),
    onSuccess: (updated, id) => {
      qc.setQueryData<FreelanceTender>(freelanceTenderKeys.detail(id), updated);
      qc.invalidateQueries({ queryKey: freelanceTenderKeys.mine() });
      Toast.show({ type: 'success', text1: 'Tender closed' });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to close tender';
      Toast.show({ type: 'error', text1: msg });
    },
  });
};

/**
 * Single toggle hook — optimistically flips isSaved on detail + invalidates saved list.
 */
export const useSaveUnsaveTender = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freelanceTenderService.toggleSaveFreelanceTender(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: freelanceTenderKeys.detail(id) });
      const prev = qc.getQueryData<FreelanceTender>(freelanceTenderKeys.detail(id));
      if (prev) {
        qc.setQueryData<FreelanceTender>(freelanceTenderKeys.detail(id), {
          ...prev,
          isSaved: !prev.isSaved,
        });
      }
      return { prev };
    },
    onError: (_err, id, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(freelanceTenderKeys.detail(id), ctx.prev);
      }
      Toast.show({ type: 'error', text1: 'Save failed' });
    },
    onSettled: (_data, _err, id) => {
      qc.invalidateQueries({ queryKey: freelanceTenderKeys.saved() });
      qc.invalidateQueries({ queryKey: freelanceTenderKeys.detail(id) });
    },
  });
};

export const useUpdateApplicationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenderId,
      appId,
      status,
      notes,
    }: {
      tenderId: string;
      appId: string;
      status: ApplicationStatus;
      notes?: string;
    }) =>
      freelanceTenderService.updateApplicationStatus(tenderId, appId, status, notes),
    onSuccess: (_updated, { tenderId }) => {
      qc.invalidateQueries({ queryKey: freelanceTenderKeys.applications(tenderId) });
      qc.invalidateQueries({ queryKey: freelanceTenderKeys.detail(tenderId) });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to update status';
      Toast.show({ type: 'error', text1: msg });
    },
  });
};

export const useSubmitApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenderId,
      data,
    }: {
      tenderId: string;
      data: SubmitApplicationData;
    }) => freelanceTenderService.submitApplication(tenderId, data),
    onSuccess: (_app, { tenderId }) => {
      qc.invalidateQueries({ queryKey: freelanceTenderKeys.detail(tenderId) });
      Toast.show({ type: 'success', text1: 'Application submitted!' });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to submit application';
      Toast.show({ type: 'error', text1: msg });
    },
  });
};