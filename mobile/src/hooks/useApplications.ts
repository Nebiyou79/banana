/**
 * mobile/src/hooks/useApplications.ts
 * React Query hooks — audited response unwrapping to match backend shape.
 *
 * FIX: Backend returns { success, data: Application[], pagination }
 * The old `select: (res) => res.data` was ambiguous because AxiosResponse.data
 * is the top-level body, and applicationService already returns the parsed body.
 * Now select properly accesses the applications array.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  applicationService, Application, ApplicationFilters,
  ApplyJobData, UpdateStatusData, CompanyResponseData,
} from '../services/applicationService';

const K = {
  myList:       (f?: ApplicationFilters) => ['applications', 'my', f]                    as const,
  companyList:  (f?: ApplicationFilters) => ['applications', 'company', f]               as const,
  orgList:      (f?: ApplicationFilters) => ['applications', 'org', f]                   as const,
  jobList:      (jobId: string, f?: ApplicationFilters) => ['applications', 'job', jobId, f] as const,
  companyDetail:(id: string)             => ['applications', 'company', 'detail', id]    as const,
  orgDetail:    (id: string)             => ['applications', 'org', 'detail', id]        as const,
  stats:        ()                       => ['applications', 'stats']                    as const,
  cvs:          ()                       => ['applications', 'cvs']                      as const,
};

const showError = (msg: string, title = 'Error') => Alert.alert(title, msg);
const showSuccess = (msg: string) => Alert.alert('Success', msg);

// ─── Candidate hooks ──────────────────────────────────────────────────────────

/** Returns the normalized { data: Application[]; pagination } object */
export const useMyApplications = (filters?: ApplicationFilters) =>
  useQuery({
    queryKey: K.myList(filters),
    queryFn:  () => applicationService.getMyApplications(filters),
    staleTime: 2 * 60 * 1000,
  });

export const useMyApplicationsPaginated = (filters?: Omit<ApplicationFilters, 'page'>) =>
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

export const useApplyForJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: ApplyJobData }) =>
      applicationService.applyForJob(jobId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications', 'my'] });
      showSuccess('Application submitted successfully!');
    },
    onError: (e: any) => showError(e.message ?? 'Failed to submit application', 'Submission Failed'),
  });
};

export const useWithdrawApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => applicationService.withdrawApplication(applicationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications', 'my'] });
      showSuccess('Application withdrawn.');
    },
    onError: (e: any) => showError(e.message ?? 'Failed to withdraw application'),
  });
};

export const useApplicationStats = () =>
  useQuery({
    queryKey: K.stats(),
    queryFn:  applicationService.getApplicationStats,
    staleTime: 5 * 60 * 1000,
  });

export const useMyCVs = () =>
  useQuery({
    queryKey: K.cvs(),
    queryFn:  applicationService.getMyCVs,
    staleTime: 10 * 60 * 1000,
  });

// ─── Company hooks ────────────────────────────────────────────────────────────

export const useCompanyApplications = (filters?: ApplicationFilters) =>
  useQuery({
    queryKey: K.companyList(filters),
    queryFn:  () => applicationService.getCompanyApplications(filters),
    staleTime: 2 * 60 * 1000,
  });

export const useCompanyApplicationDetails = (applicationId?: string) =>
  useQuery({
    queryKey: K.companyDetail(applicationId ?? ''),
    queryFn:  () => applicationService.getCompanyApplicationDetails(applicationId!),
    enabled:  !!applicationId,
    staleTime: 2 * 60 * 1000,
    select:   (res) => res.data.application,
  });

export const useJobApplications = (jobId: string, filters?: ApplicationFilters) =>
  useQuery({
    queryKey: K.jobList(jobId, filters),
    queryFn:  () => applicationService.getJobApplications(jobId, filters),
    enabled:  !!jobId,
    staleTime: 2 * 60 * 1000,
  });

export const useUpdateApplicationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, data }: { applicationId: string; data: UpdateStatusData }) =>
      applicationService.updateApplicationStatus(applicationId, data),
    onSuccess: (_res, { applicationId }) => {
      qc.invalidateQueries({ queryKey: K.companyDetail(applicationId) });
      qc.invalidateQueries({ queryKey: ['applications', 'company'] });
      qc.invalidateQueries({ queryKey: ['applications', 'org'] });
      showSuccess('Status updated successfully.');
    },
    onError: (e: any) => showError(e.message ?? 'Failed to update status', 'Update Failed'),
  });
};

export const useAddCompanyResponse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, data }: { applicationId: string; data: CompanyResponseData }) =>
      applicationService.addCompanyResponse(applicationId, data),
    onSuccess: (_res, { applicationId }) => {
      qc.invalidateQueries({ queryKey: K.companyDetail(applicationId) });
      qc.invalidateQueries({ queryKey: ['applications', 'company'] });
      showSuccess('Response sent to candidate.');
    },
    onError: (e: any) => showError(e.message ?? 'Failed to send response', 'Response Failed'),
  });
};

// ─── Organization hooks ───────────────────────────────────────────────────────

export const useOrganizationApplications = (filters?: ApplicationFilters) =>
  useQuery({
    queryKey: K.orgList(filters),
    queryFn:  () => applicationService.getOrganizationApplications(filters),
    staleTime: 2 * 60 * 1000,
  });

export const useOrganizationApplicationDetails = (applicationId?: string) =>
  useQuery({
    queryKey: K.orgDetail(applicationId ?? ''),
    queryFn:  () => applicationService.getOrganizationApplicationDetails(applicationId!),
    enabled:  !!applicationId,
    staleTime: 2 * 60 * 1000,
    select:   (res) => res.data.application,
  });