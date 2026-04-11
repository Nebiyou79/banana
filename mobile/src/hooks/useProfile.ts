import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, UpdateProfileData } from '../services/profileService';
import { roleProfileService } from '../services/roleProfileService';
import { useToast } from './useToast';

// ─── Profile ──────────────────────────────────────────────────────────────────

export const useProfile = () =>
  useQuery({
    queryKey: ['profile'],
    queryFn:  () => profileService.getProfile(),
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (data: UpdateProfileData) => profileService.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      showSuccess('Profile updated');
    },
    onError: (e: any) => showError(e?.response?.data?.message ?? 'Update failed'),
  });
};

export const useProfileCompletion = () =>
  useQuery({
    queryKey: ['profile', 'completion'],
    queryFn:  () => profileService.getProfileCompletion(),
    staleTime: 5 * 60 * 1000,
  });

// ─── Verification — FIX: never return undefined ───────────────────────────────
// The original code had `queryFn: () => verificationService.getVerificationStatus()`
// which could resolve to undefined if the backend returns an unexpected shape.
// React Query treats undefined as "no data returned" and logs the warning.
// We guard with a fallback so the query always resolves to a defined value.

const VERIFICATION_FALLBACK = {
  verificationStatus: 'none' as const,
  verificationDetails: {
    profileVerified: false,
    socialVerified:  false,
    documentsVerified: false,
    emailVerified:   false,
    phoneVerified:   false,
  },
  verificationMessage: '',
};

export const useVerificationStatus = () =>
  useQuery({
    queryKey: ['verification', 'me'],
    queryFn: async () => {
      const result = await profileService.getVerificationStatus();
      // Always return a defined value — React Query will warn if undefined is returned
      return result ?? VERIFICATION_FALLBACK;
    },
    staleTime: 10 * 60 * 1000,
    // Don't retry on 404 (user has no verification record yet — that's fine)
    retry: (count, err: any) => {
      if (err?.response?.status === 404) return false;
      return count < 1;
    },
  });

// ─── Role profiles ────────────────────────────────────────────────────────────

export const useCandidateRoleProfile = () =>
  useQuery({
    queryKey: ['roleProfile', 'candidate'],
    queryFn:  () => roleProfileService.getCandidateProfile(),
    staleTime: 5 * 60 * 1000,
  });

export const useFreelancerRoleProfile = () =>
  useQuery({
    queryKey: ['roleProfile', 'freelancer'],
    queryFn:  () => roleProfileService.getFreelancerProfile(),
    staleTime: 5 * 60 * 1000,
  });

export const useCompanyRoleProfile = () =>
  useQuery({
    queryKey: ['roleProfile', 'company'],
    queryFn:  () => roleProfileService.getCompanyProfile(),
    staleTime: 5 * 60 * 1000,
  });

export const useOrganizationRoleProfile = () =>
  useQuery({
    queryKey: ['roleProfile', 'organization'],
    queryFn:  () => roleProfileService.getOrganizationProfile(),
    staleTime: 5 * 60 * 1000,
  });
