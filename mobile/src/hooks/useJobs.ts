import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, Job, JobFilters, CreateJobData } from '../services/jobService';
import { useToast } from './useToast';

// ─── Keys ────────────────────────────────────────────────────────────────────

const K = {
  list:         (f?: JobFilters) => ['jobs', 'list', f] as const,
  candidateList:(f?: JobFilters) => ['jobs', 'candidate', f] as const,
  companyList:  (f?: JobFilters) => ['jobs', 'company', f] as const,
  orgList:      (f?: JobFilters) => ['jobs', 'organization', f] as const,
  detail:       (id?: string)    => ['job', id] as const,
  saved:        ()               => ['jobs', 'saved'] as const,
  categories:   ()               => ['jobs', 'categories'] as const,
};

// ─── Public / Candidate browse ───────────────────────────────────────────────

export const useJobs = (filters?: Omit<JobFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey:  K.list(filters),
    queryFn:   ({ pageParam = 1 }) =>
      jobService.getJobs({ ...filters, page: pageParam as number }),
    getNextPageParam: (last) =>
      last.pagination.current < last.pagination.totalPages
        ? last.pagination.current + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 3 * 60 * 1000,
  });

export const useCandidateJobs = (filters?: Omit<JobFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey:  K.candidateList(filters),
    queryFn:   ({ pageParam = 1 }) =>
      jobService.getJobsForCandidate({ ...filters, page: pageParam as number }),
    getNextPageParam: (last) =>
      last.pagination.current < last.pagination.totalPages
        ? last.pagination.current + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 3 * 60 * 1000,
  });

export const useJob = (id?: string) =>
  useQuery({
    queryKey: K.detail(id),
    queryFn:  () => jobService.getJob(id!),
    enabled:  !!id,
    staleTime: 5 * 60 * 1000,
  });

export const useJobCategories = () =>
  useQuery({
    queryKey: K.categories(),
    queryFn:  jobService.getCategories,
    staleTime: 30 * 60 * 1000,
  });

// ─── Saved jobs ───────────────────────────────────────────────────────────────

export const useSavedJobs = () =>
  useQuery({
    queryKey: K.saved(),
    queryFn:  jobService.getSavedJobs,
    staleTime: 5 * 60 * 1000,
  });

export const useSaveJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => jobService.saveJob(jobId),
    onMutate: async (jobId) => {
      await qc.cancelQueries({ queryKey: K.saved() });
      const prev = qc.getQueryData<Job[]>(K.saved());
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(K.saved(), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: K.saved() }),
  });
};

export const useUnsaveJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => jobService.unsaveJob(jobId),
    onMutate: async (jobId) => {
      await qc.cancelQueries({ queryKey: K.saved() });
      const prev = qc.getQueryData<Job[]>(K.saved());
      qc.setQueryData<Job[]>(K.saved(), (old) =>
        (old ?? []).filter((j) => j._id !== jobId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(K.saved(), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: K.saved() }),
  });
};

// ─── Company CRUD ─────────────────────────────────────────────────────────────

export const useCompanyJobs = (filters?: Omit<JobFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey:  K.companyList(filters),
    queryFn:   ({ pageParam = 1 }) =>
      jobService.getCompanyJobs({ ...filters, page: pageParam as number }),
    getNextPageParam: (last) =>
      last.pagination.current < last.pagination.totalPages
        ? last.pagination.current + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 3 * 60 * 1000,
  });

export const useCreateJob = () => {
  const qc = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (data: CreateJobData) => jobService.createJob(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', 'company'] });
      showSuccess('Job posted successfully!');
    },
    onError: (e: any) => showError(e?.response?.data?.message ?? 'Failed to post job'),
  });
};

export const useUpdateJob = () => {
  const qc = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateJobData> }) =>
      jobService.updateJob(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: K.detail(id) });
      qc.invalidateQueries({ queryKey: ['jobs', 'company'] });
      showSuccess('Job updated!');
    },
    onError: (e: any) => showError(e?.response?.data?.message ?? 'Failed to update job'),
  });
};

export const useDeleteJob = () => {
  const qc = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (id: string) => jobService.deleteJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', 'company'] });
      showSuccess('Job deleted');
    },
    onError: (e: any) => showError(e?.response?.data?.message ?? 'Failed to delete job'),
  });
};

// ─── Organization CRUD ────────────────────────────────────────────────────────

export const useOrganizationJobs = (filters?: Omit<JobFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey:  K.orgList(filters),
    queryFn:   ({ pageParam = 1 }) =>
      jobService.getOrganizationJobs({ ...filters, page: pageParam as number }),
    getNextPageParam: (last) =>
      last.pagination.current < last.pagination.totalPages
        ? last.pagination.current + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 3 * 60 * 1000,
  });

export const useCreateOrganizationJob = () => {
  const qc = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (data: CreateJobData) => jobService.createOrganizationJob(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', 'organization'] });
      showSuccess('Opportunity posted successfully!');
    },
    onError: (e: any) => showError(e?.response?.data?.message ?? 'Failed to post opportunity'),
  });
};

export const useUpdateOrganizationJob = () => {
  const qc = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateJobData> }) =>
      jobService.updateOrganizationJob(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: K.detail(id) });
      qc.invalidateQueries({ queryKey: ['jobs', 'organization'] });
      showSuccess('Updated!');
    },
    onError: (e: any) => showError(e?.response?.data?.message ?? 'Failed to update'),
  });
};

export const useDeleteOrganizationJob = () => {
  const qc = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (id: string) => jobService.deleteOrganizationJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', 'organization'] });
      showSuccess('Deleted');
    },
    onError: (e: any) => showError(e?.response?.data?.message ?? 'Failed to delete'),
  });
};
