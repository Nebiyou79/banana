/**
 * src/hooks/useApplications.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * React Query hooks for all application operations.
 * Mirrors frontend web hooks exactly.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  applicationService,
  Application,
  ApplicationFilters,
  ApplyJobData,
  UpdateStatusData,
  CompanyResponseData,
} from '../services/applicationService';

// ─── Query key factory ────────────────────────────────────────────────────────
const K = {
  myList:        (f?: ApplicationFilters) => ['applications', 'my',      f] as const,
  companyList:   (f?: ApplicationFilters) => ['applications', 'company', f] as const,
  orgList:       (f?: ApplicationFilters) => ['applications', 'org',     f] as const,
  jobList:       (jobId: string, f?: ApplicationFilters) => ['applications', 'job', jobId, f] as const,
  companyDetail: (id: string) => ['applications', 'company', 'detail', id] as const,
  orgDetail:     (id: string) => ['applications', 'org',     'detail', id] as const,
  stats:         ()           => ['applications', 'stats']                  as const,
  cvs:           ()           => ['applications', 'cvs']                    as const,
};

const toast = {
  success: (msg: string) => Alert.alert('✅ Success', msg),
  error:   (msg: string, title = 'Error') => Alert.alert(`❌ ${title}`, msg),
};

// ─── Candidate ────────────────────────────────────────────────────────────────

/** Paginated list of candidate's own applications */
export const useMyApplicationsPaginated = (filters?: Omit<ApplicationFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey: K.myList(filters),
    queryFn: ({ pageParam = 1 }) =>
      applicationService.getMyApplications({ ...filters, page: pageParam as number }),
    getNextPageParam: last => {
      const p = last.pagination;
      return p && p.current < p.totalPages ? p.current + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });

/** Single-page list (for trackers/stats) */
export const useMyApplications = (filters?: ApplicationFilters) =>
  useQuery({
    queryKey: K.myList(filters),
    queryFn: () => applicationService.getMyApplications(filters),
    staleTime: 2 * 60 * 1000,
  });

export const useMyCVs = () =>
  useQuery({
    queryKey: K.cvs(),
    queryFn:  applicationService.getMyCVs,
    staleTime: 10 * 60 * 1000,
  });

export const useApplicationStats = () =>
  useQuery({
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
      qc.invalidateQueries({ queryKey: ['applications', 'my'] });
      toast.success('Application submitted successfully!');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to submit application', 'Submission Failed'),
  });
};

export const useWithdrawApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => applicationService.withdrawApplication(applicationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications', 'my'] });
      toast.success('Application withdrawn.');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to withdraw application'),
  });
};

// ─── Company ─────────────────────────────────────────────────────────────────

export const useCompanyApplicationsPaginated = (filters?: Omit<ApplicationFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey: K.companyList(filters),
    queryFn: ({ pageParam = 1 }) =>
      applicationService.getCompanyApplications({ ...filters, page: pageParam as number }),
    getNextPageParam: last => {
      const p = last.pagination;
      return p && p.current < p.totalPages ? p.current + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });

export const useCompanyApplications = (filters?: ApplicationFilters) =>
  useQuery({
    queryKey: K.companyList(filters),
    queryFn: () => applicationService.getCompanyApplications(filters),
    staleTime: 2 * 60 * 1000,
  });

export const useCompanyApplicationDetails = (applicationId?: string) =>
  useQuery({
    queryKey: K.companyDetail(applicationId ?? ''),
    queryFn:  () => applicationService.getCompanyApplicationDetails(applicationId!),
    enabled:  !!applicationId,
    staleTime: 2 * 60 * 1000,
    select:   res => res.data?.application,
  });

// ─── Organization ─────────────────────────────────────────────────────────────

export const useOrgApplicationsPaginated = (filters?: Omit<ApplicationFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey: K.orgList(filters),
    queryFn: ({ pageParam = 1 }) =>
      applicationService.getOrganizationApplications({ ...filters, page: pageParam as number }),
    getNextPageParam: last => {
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
    select:   res => res.data?.application,
  });

// ─── Job-level applications (company/org drilling into a specific job) ────────

export const useJobApplicationsPaginated = (jobId: string, filters?: Omit<ApplicationFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey: K.jobList(jobId, filters),
    queryFn: ({ pageParam = 1 }) =>
      applicationService.getJobApplications(jobId, { ...filters, page: pageParam as number }),
    getNextPageParam: last => {
      const p = last.pagination;
      return p && p.current < p.totalPages ? p.current + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000,
  });

export const useJobApplications = (jobId: string, filters?: ApplicationFilters) =>
  useQuery({
    queryKey: K.jobList(jobId, filters),
    queryFn:  () => applicationService.getJobApplications(jobId, filters),
    enabled:  !!jobId,
    staleTime: 2 * 60 * 1000,
  });

// ─── Status management ────────────────────────────────────────────────────────

export const useUpdateApplicationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, data }: { applicationId: string; data: UpdateStatusData }) =>
      applicationService.updateApplicationStatus(applicationId, data),
    onSuccess: (_res, { applicationId }) => {
      qc.invalidateQueries({ queryKey: K.companyDetail(applicationId) });
      qc.invalidateQueries({ queryKey: K.orgDetail(applicationId) });
      qc.invalidateQueries({ queryKey: ['applications', 'company'] });
      qc.invalidateQueries({ queryKey: ['applications', 'org'] });
      qc.invalidateQueries({ queryKey: ['applications', 'job'] });
      toast.success('Status updated successfully.');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to update status'),
  });
};

export const useSendCompanyResponse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, data }: { applicationId: string; data: CompanyResponseData }) =>
      applicationService.sendCompanyResponse(applicationId, data),
    onSuccess: (_res, { applicationId }) => {
      qc.invalidateQueries({ queryKey: K.companyDetail(applicationId) });
      qc.invalidateQueries({ queryKey: K.orgDetail(applicationId) });
      toast.success('Response sent successfully.');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to send response'),
  });
};
