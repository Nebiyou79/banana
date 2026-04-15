import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { freelancerService } from '../services/freelancerService';
import type { PortfolioFormData, ServiceFormData, CertificationFormData } from '../types/freelancer';
import toast from '../lib/toast';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const FREELANCER_KEYS = {
  dashboard:    ['freelancer', 'dashboard']    as const,
  stats:        ['freelancer', 'stats']        as const,
  profile:      ['freelancer', 'profile']      as const,
  portfolio:    ['freelancer', 'portfolio']    as const,
  portfolioItem: (id: string) => ['freelancer', 'portfolio', id] as const,
  services:     ['freelancer', 'services']     as const,
  certifications: ['freelancer', 'certifications'] as const,
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const useFreelancerDashboard = () =>
  useQuery({
    queryKey: FREELANCER_KEYS.dashboard,
    queryFn:  freelancerService.getDashboard,
    staleTime: 2 * 60 * 1000,
  });

export const useFreelancerStats = () =>
  useQuery({
    queryKey: FREELANCER_KEYS.stats,
    queryFn:  freelancerService.getStats,
    staleTime: 2 * 60 * 1000,
  });

// ─── Profile ──────────────────────────────────────────────────────────────────

export const useFreelancerProfile = () =>
  useQuery({
    queryKey: FREELANCER_KEYS.profile,
    queryFn:  freelancerService.getProfile,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateFreelancerProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: freelancerService.updateProfile,
    onSuccess: ({ profile }) => {
      qc.setQueryData(FREELANCER_KEYS.profile, profile);
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.dashboard });
      toast.success('Profile updated successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// ─── Portfolio ────────────────────────────────────────────────────────────────

export const useFreelancerPortfolio = (params?: { page?: number; limit?: number; featured?: boolean; category?: string }) =>
  useQuery({
    queryKey: [...FREELANCER_KEYS.portfolio, params],
    queryFn:  () => freelancerService.getPortfolio(params),
    staleTime: 3 * 60 * 1000,
  });

export const usePortfolioItem = (id: string) =>
  useQuery({
    queryKey: FREELANCER_KEYS.portfolioItem(id),
    queryFn:  () => freelancerService.getPortfolioItem(id),
    enabled:  Boolean(id),
  });

export const useAddPortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PortfolioFormData) => freelancerService.addPortfolioItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.portfolio });
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.profile });
      toast.success('Portfolio item added!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdatePortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PortfolioFormData> }) =>
      freelancerService.updatePortfolioItem(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.portfolio });
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.portfolioItem(id) });
      toast.success('Portfolio item updated!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeletePortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freelancerService.deletePortfolioItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.portfolio });
      toast.success('Portfolio item deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// ─── Services ─────────────────────────────────────────────────────────────────

export const useFreelancerServices = () =>
  useQuery({
    queryKey: FREELANCER_KEYS.services,
    queryFn:  freelancerService.getServices,
    staleTime: 5 * 60 * 1000,
  });

export const useAddService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ServiceFormData) => freelancerService.addService(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.services });
      toast.success('Service added!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceFormData> }) =>
      freelancerService.updateService(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.services });
      toast.success('Service updated!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freelancerService.deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.services });
      toast.success('Service deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// ─── Certifications ───────────────────────────────────────────────────────────

export const useFreelancerCertifications = () =>
  useQuery({
    queryKey: FREELANCER_KEYS.certifications,
    queryFn:  freelancerService.getCertifications,
    staleTime: 5 * 60 * 1000,
  });

export const useAddCertification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CertificationFormData) => freelancerService.addCertification(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.certifications });
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.profile });
      toast.success('Certification added!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateCertification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CertificationFormData> }) =>
      freelancerService.updateCertification(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.certifications });
      toast.success('Certification updated!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteCertification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freelancerService.deleteCertification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.certifications });
      qc.invalidateQueries({ queryKey: FREELANCER_KEYS.profile });
      toast.success('Certification deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
