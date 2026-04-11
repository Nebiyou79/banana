import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  roleProfileService,
  UpdateCandidateRoleProfileData,
  UpdateFreelancerRoleProfileData,
  UpdateCompanyRoleProfileData,
  UpdateOrganizationRoleProfileData,
} from '../services/roleProfileService';
import { useAuthStore } from '../store/authStore';
import { toast } from '../lib/toast';

export const ROLE_PROFILE_KEYS = {
  candidate: ['roleProfile', 'candidate'] as const,
  company: ['roleProfile', 'company'] as const,
  freelancer: ['roleProfile', 'freelancer'] as const,
  organization: ['roleProfile', 'organization'] as const,
};

// ─── Candidate ────────────────────────────────────────────────────────────────

export const useCandidateProfile = () => {
  const { role } = useAuthStore();
  return useQuery({
    queryKey: ROLE_PROFILE_KEYS.candidate,
    queryFn: roleProfileService.getCandidateProfile,
    enabled: role === 'candidate',
  });
};

export const useUpdateCandidateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCandidateRoleProfileData) =>
      roleProfileService.updateCandidateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLE_PROFILE_KEYS.candidate });
      toast.success('Profile updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Update failed');
    },
  });
};

// ─── Company ──────────────────────────────────────────────────────────────────

export const useCompanyProfile = () => {
  const { role } = useAuthStore();
  return useQuery({
    queryKey: ROLE_PROFILE_KEYS.company,
    queryFn: roleProfileService.getCompanyProfile,
    enabled: role === 'company',
  });
};

export const useUpdateCompanyProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data:   UpdateFreelancerRoleProfileData,) =>
      roleProfileService.updateCompanyProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLE_PROFILE_KEYS.company });
      toast.success('Company profile updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Update failed');
    },
  });
};

// ─── Freelancer ───────────────────────────────────────────────────────────────

export const useFreelancerProfile = () => {
  const { role } = useAuthStore();
  return useQuery({
    queryKey: ROLE_PROFILE_KEYS.freelancer,
    queryFn: roleProfileService.getFreelancerProfile,
    enabled: role === 'freelancer',
  });
};

export const useUpdateFreelancerProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateFreelancerRoleProfileData) =>
      roleProfileService.updateFreelancerProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLE_PROFILE_KEYS.freelancer });
      toast.success('Profile updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Update failed');
    },
  });
};

// ─── Organization ─────────────────────────────────────────────────────────────

export const useOrganizationProfile = () => {
  const { role } = useAuthStore();
  return useQuery({
    queryKey: ROLE_PROFILE_KEYS.organization,
    queryFn: roleProfileService.getOrganizationProfile,
    enabled: role === 'organization',
  });
};

export const useUpdateOrganizationProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOrganizationRoleProfileData) =>
      roleProfileService.updateOrganizationProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLE_PROFILE_KEYS.organization });
      toast.success('Organization profile updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Update failed');
    },
  });
};
