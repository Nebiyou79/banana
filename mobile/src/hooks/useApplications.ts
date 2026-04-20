/**
 * src/hooks/useApplications.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * All TanStack Query hooks for the Application module.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  applicationService,
  ApplicationFilters,
  ApplyJobData,
  UpdateStatusData,
  CompanyResponseData,
  CV,
  ApplicationStats,
} from '../services/applicationService';

// ─── Query Key factory ────────────────────────────────────────────────────────

const K = {
  myCVs:         ()                => ['applications', 'my-cvs']            as const,
  myList:        (f?: any)         => ['applications', 'my-list', f]        as const,
  stats:         ()                => ['applications', 'stats']              as const,
  companyList:   (f?: any)         => ['applications', 'company-list', f]   as const,
  companyDetail: (id: string)      => ['applications', 'company-detail', id] as const,
  orgList:       (f?: any)         => ['applications', 'org-list', f]       as const,
  orgDetail:     (id: string)      => ['applications', 'org-detail', id]    as const,
  jobList:       (jId: string, f?: any) => ['applications', 'job-list', jId, f] as const,
};

// ─── Candidate ────────────────────────────────────────────────────────────────

export const useMyCVs = () =>
  useQuery<CV[]>({
    queryKey: K.myCVs(),
    queryFn:  applicationService.getMyCVs,
    staleTime: 5 * 60 * 1000,
  });

export const useMyApplications = (filters?: ApplicationFilters) =>
  useQuery({
    queryKey: K.myList(filters),
    queryFn:  () => applicationService.getMyApplications(filters),
    staleTime: 2 * 60 * 1000,
  });

export const useMyApplicationsPaginated = (
  filters?: Omit<ApplicationFilters, 'page'>
) =>
  useInfiniteQuery({
    queryKey: K.myList(filters),
    queryFn:  ({ pageParam = 1 }) =>
      applicationService.getMyApplications({ ...filters, page: pageParam as number }),
    getNextPageParam: (last) => {
      const p = last.pagination;
      return p && p.current < p.totalPages ? p.current + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });

export const useApplicationStats = () =>
  useQuery<ApplicationStats>({
    queryKey: K.stats(),
    queryFn:  applicationService.getApplicationStats,
    staleTime: 5 * 60 * 1000,
  });

export const useApplyForJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: ApplyJobData }) =>
      applicationService.applyForJob(jobId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.myList() });
      qc.invalidateQueries({ queryKey: K.stats() });
    },
  });
};

export const useWithdrawApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) =>
      applicationService.withdrawApplication(applicationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.myList() });
      qc.invalidateQueries({ queryKey: K.stats() });
    },
  });
};

// ─── Company ──────────────────────────────────────────────────────────────────

export const useCompanyApplications = (filters?: ApplicationFilters) =>
  useQuery({
    queryKey: K.companyList(filters),
    queryFn:  () => applicationService.getCompanyApplications(filters),
    staleTime: 2 * 60 * 1000,
  });

export const useCompanyApplicationsPaginated = (
  filters?: Omit<ApplicationFilters, 'page'>
) =>
  useInfiniteQuery({
    queryKey: K.companyList(filters),
    queryFn:  ({ pageParam = 1 }) =>
      applicationService.getCompanyApplications({ ...filters, page: pageParam as number }),
    getNextPageParam: (last) => {
      const p = last.pagination;
      return p && p.current < p.totalPages ? p.current + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });

export const useCompanyApplicationDetails = (applicationId?: string) =>
  useQuery({
    queryKey: K.companyDetail(applicationId ?? ''),
    queryFn:  () => applicationService.getCompanyApplicationDetails(applicationId!),
    enabled:  !!applicationId,
    staleTime: 2 * 60 * 1000,
    select:   (res) => res.data?.application,
  });

// ─── Organization ─────────────────────────────────────────────────────────────

export const useOrgApplications = (filters?: ApplicationFilters) =>
  useQuery({
    queryKey: K.orgList(filters),
    queryFn:  () => applicationService.getOrganizationApplications(filters),
    staleTime: 2 * 60 * 1000,
  });

export const useOrgApplicationsPaginated = (
  filters?: Omit<ApplicationFilters, 'page'>
) =>
  useInfiniteQuery({
    queryKey: K.orgList(filters),
    queryFn:  ({ pageParam = 1 }) =>
      applicationService.getOrganizationApplications({ ...filters, page: pageParam as number }),
    getNextPageParam: (last) => {
      const p = last.pagination;
      return p && p.current < p.totalPages ? p.current + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });

export const useOrgApplicationDetails = (applicationId?: string) =>
  useQuery({
    queryKey: K.orgDetail(applicationId ?? ''),
    queryFn:  () => applicationService.getOrganizationApplicationDetails(applicationId!),
    enabled:  !!applicationId,
    staleTime: 2 * 60 * 1000,
    select:   (res) => res.data?.application,
  });

// ─── Job-level ────────────────────────────────────────────────────────────────

export const useJobApplicationsPaginated = (
  jobId: string,
  filters?: Omit<ApplicationFilters, 'page'>
) =>
  useInfiniteQuery({
    queryKey: K.jobList(jobId, filters),
    queryFn:  ({ pageParam = 1 }) =>
      applicationService.getJobApplications(jobId, { ...filters, page: pageParam as number }),
    getNextPageParam: (last) => {
      const p = last.pagination;
      return p && p.current < p.totalPages ? p.current + 1 : undefined;
    },
    initialPageParam: 1,
    enabled:  !!jobId,
    staleTime: 2 * 60 * 1000,
  });

// ─── Status / Response mutations ─────────────────────────────────────────────

export const useUpdateApplicationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      data,
    }: {
      applicationId: string;
      data: UpdateStatusData;
    }) => applicationService.updateApplicationStatus(applicationId, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: K.companyDetail(vars.applicationId) });
      qc.invalidateQueries({ queryKey: K.orgDetail(vars.applicationId) });
      qc.invalidateQueries({ queryKey: K.companyList() });
      qc.invalidateQueries({ queryKey: K.orgList() });
    },
  });
};

export const useAddCompanyResponse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      data,
    }: {
      applicationId: string;
      data: CompanyResponseData;
    }) => applicationService.addCompanyResponse(applicationId, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: K.companyDetail(vars.applicationId) });
      qc.invalidateQueries({ queryKey: K.orgDetail(vars.applicationId) });
    },
  });
};
