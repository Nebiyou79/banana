import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  applicationService,
  ApplicationFilters,
  ApplicationStatus,
  ApplyFormData,
} from '../services/applicationService';

// ─── useMyApplications ────────────────────────────────────────────────────────
export const useMyApplications = (filters?: ApplicationFilters) =>
  useQuery({
    queryKey: ['applications', 'mine', filters],
    queryFn: () => applicationService.getMyApplications(filters),
    staleTime: 2 * 60 * 1000,
  });

// ─── useMyCVs ─────────────────────────────────────────────────────────────────
export const useMyCVs = () =>
  useQuery({
    queryKey: ['applications', 'cvs'],
    queryFn: applicationService.getMyCVs,
    staleTime: 10 * 60 * 1000,
  });

// ─── useApplicationDetails ────────────────────────────────────────────────────
export const useApplicationDetails = (id?: string) =>
  useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationService.getApplicationDetails(id!),
    enabled: !!id,
  });

// ─── useApplyForJob ───────────────────────────────────────────────────────────
export const useApplyForJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, formData }: { jobId: string; formData: ApplyFormData }) =>
      applicationService.applyForJob(jobId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications', 'mine'] });
    },
  });
};

// ─── useWithdrawApplication ───────────────────────────────────────────────────
export const useWithdrawApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicationService.withdrawApplication(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['applications', 'mine'] });
      qc.invalidateQueries({ queryKey: ['application', id] });
    },
  });
};

// ─── useCompanyApplications ───────────────────────────────────────────────────
export const useCompanyApplications = (filters?: ApplicationFilters) =>
  useInfiniteQuery({
    queryKey: ['applications', 'company', filters],
    queryFn: ({ pageParam = 1 }) =>
      applicationService.getCompanyApplications({ ...filters, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { current, totalPages } = lastPage.pagination ?? {};
      return current < totalPages ? current + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });

// ─── useOrganizationApplications ─────────────────────────────────────────────
export const useOrganizationApplications = (filters?: ApplicationFilters) =>
  useInfiniteQuery({
    queryKey: ['applications', 'organization', filters],
    queryFn: ({ pageParam = 1 }) =>
      applicationService.getOrganizationApplications({ ...filters, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { current, totalPages } = lastPage.pagination ?? {};
      return current < totalPages ? current + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });

// ─── useJobApplications ───────────────────────────────────────────────────────
export const useJobApplications = (jobId?: string) =>
  useQuery({
    queryKey: ['applications', 'job', jobId],
    queryFn: () => applicationService.getJobApplications(jobId!),
    enabled: !!jobId,
  });

// ─── useUpdateApplicationStatus ───────────────────────────────────────────────
export const useUpdateApplicationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, message }: { id: string; status: ApplicationStatus; message?: string }) =>
      applicationService.updateApplicationStatus(id, status, message),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['applications', 'company'] });
      qc.invalidateQueries({ queryKey: ['applications', 'organization'] });
      qc.invalidateQueries({ queryKey: ['application', id] });
    },
  });
};

// ─── useApplicationStatistics ─────────────────────────────────────────────────
export const useApplicationStatistics = () =>
  useQuery({
    queryKey: ['applications', 'stats'],
    queryFn: applicationService.getApplicationStatistics,
    staleTime: 5 * 60 * 1000,
  });

// ─── useCompanyApplicationDetails ─────────────────────────────────────────────
export const useCompanyApplicationDetails = (id?: string, role: 'company' | 'organization' = 'company') =>
  useQuery({
    queryKey: ['application', role, id],
    queryFn: () =>
      role === 'company'
        ? applicationService.getCompanyApplicationDetails(id!)
        : applicationService.getOrganizationApplicationDetails(id!),
    enabled: !!id,
  });
