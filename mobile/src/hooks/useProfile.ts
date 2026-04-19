/**
 * hooks/useProfile.ts
 * Unified profile hooks for all 4 roles using TanStack Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { profileService, UpdateProfileData, Profile } from '../services/profileService';
import { roleProfileService, UpdateCandidateData, UpdateFreelancerData, UpdateCompanyData, UpdateOrganizationData } from '../services/roleProfileService';
import { candidateService, CandidateProfileUpdate } from '../services/candidateService';
import { freelancerService, FreelancerProfileUpdate } from '../services/freelancerService';
import { companyService, CompanyProfileUpdate } from '../services/companyService';
import { organizationService, OrganizationProfileUpdate } from '../services/companyService';
import { toast } from '../lib/toast';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const PROFILE_KEYS = {
  profile:             ['profile']                as const,
  publicProfile:       (id: string) => ['profile', 'public', id] as const,
  completion:          ['profile', 'completion']  as const,
  verification:        ['profile', 'verification'] as const,
  candidateProfile:    ['candidate', 'profile']   as const,
  candidateRoleProfile: ['candidate', 'roleProfile'] as const,
  candidateCVs:        ['candidate', 'cvs']       as const,
  freelancerProfile:   ['freelancer', 'profile']  as const,
  freelancerRoleProfile: ['freelancer', 'roleProfile'] as const,
  freelancerCerts:     ['freelancer', 'certs']    as const,
  freelancerServices:  ['freelancer', 'services'] as const,
  companyProfile:      ['company', 'profile']     as const,
  companyRoleProfile:  ['company', 'roleProfile'] as const,
  orgProfile:          ['org', 'profile']         as const,
  orgRoleProfile:      ['org', 'roleProfile']     as const,
};

// ─── Base profile (profile controller) ───────────────────────────────────────

export const useProfile = () =>
  useQuery({
    queryKey: PROFILE_KEYS.profile,
    queryFn: profileService.getProfile,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

export const usePublicProfile = (userId: string) =>
  useQuery({
    queryKey: PROFILE_KEYS.publicProfile(userId),
    queryFn: () => profileService.getPublicProfile(userId),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

export const useProfileCompletion = () =>
  useQuery({
    queryKey: PROFILE_KEYS.completion,
    queryFn: profileService.getProfileCompletion,
    staleTime: 2 * 60 * 1000,
  });

export const useVerificationStatus = () =>
  useQuery({
    queryKey: PROFILE_KEYS.verification,
    queryFn: profileService.getVerificationStatus,
    staleTime: 10 * 60 * 1000,
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileData) => profileService.updateProfile(data),
    onSuccess: updatedProfile => {
      qc.setQueryData(PROFILE_KEYS.profile, updatedProfile);
      qc.invalidateQueries({ queryKey: PROFILE_KEYS.completion });
      toast.success('Profile updated!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// ─── Avatar / Cover uploads ───────────────────────────────────────────────────

export const useUploadAvatar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: { uri: string; name: string; type: string }) => {
      const formData = new FormData();
      (formData as FormData).append('avatar', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);
      return profileService.uploadAvatar(formData);
    },
    onSuccess: result => {
      // Patch the cached profile
      qc.setQueryData<Profile>(PROFILE_KEYS.profile, old =>
        old ? { ...old, avatar: result.avatar } : old
      );
      qc.invalidateQueries({ queryKey: PROFILE_KEYS.completion });
      toast.success('Profile photo updated!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUploadCoverPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: { uri: string; name: string; type: string }) => {
      const formData = new FormData();
      (formData as FormData).append('cover', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);
      return profileService.uploadCoverPhoto(formData);
    },
    onSuccess: result => {
      qc.setQueryData<Profile>(PROFILE_KEYS.profile, old =>
        old ? { ...old, cover: result.cover } : old
      );
      toast.success('Cover photo updated!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteAvatar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profileService.deleteAvatar,
    onSuccess: () => {
      qc.setQueryData<Profile>(PROFILE_KEYS.profile, old =>
        old ? { ...old, avatar: null } : old
      );
      toast.success('Profile photo removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteCoverPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profileService.deleteCoverPhoto,
    onSuccess: () => {
      qc.setQueryData<Profile>(PROFILE_KEYS.profile, old =>
        old ? { ...old, cover: null } : old
      );
      toast.success('Cover photo removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// ─── Candidate ────────────────────────────────────────────────────────────────

export const useCandidateProfile = () =>
  useQuery({
    queryKey: PROFILE_KEYS.candidateProfile,
    queryFn: candidateService.getProfile,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateCandidateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CandidateProfileUpdate) => candidateService.updateProfile(data),
    onSuccess: updated => {
      qc.setQueryData(PROFILE_KEYS.candidateProfile, updated);
      qc.invalidateQueries({ queryKey: PROFILE_KEYS.completion });
      toast.success('Profile saved!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useCandidateRoleProfile = () =>
  useQuery({
    queryKey: PROFILE_KEYS.candidateRoleProfile,
    queryFn: roleProfileService.getCandidateProfile,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateCandidateRoleProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCandidateData) => roleProfileService.updateCandidateProfile(data),
    onSuccess: updated => {
      qc.setQueryData(PROFILE_KEYS.candidateRoleProfile, updated);
      toast.success('Profile saved!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useCandidateCVs = () =>
  useQuery({
    queryKey: PROFILE_KEYS.candidateCVs,
    queryFn: candidateService.getAllCVs,
    staleTime: 2 * 60 * 1000,
  });

export const useUploadCV = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { uri: string; name: string; mimeType: string; description?: string }) =>
      candidateService.uploadCV(args.uri, args.name, args.mimeType, args.description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEYS.candidateCVs });
      qc.invalidateQueries({ queryKey: PROFILE_KEYS.candidateProfile });
      toast.success('CV uploaded!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useSetPrimaryCV = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cvId: string) => candidateService.setPrimaryCV(cvId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEYS.candidateCVs });
      toast.success('Primary CV updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteCV = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cvId: string) => candidateService.deleteCV(cvId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEYS.candidateCVs });
      toast.success('CV deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// ─── Freelancer ───────────────────────────────────────────────────────────────

export const useFreelancerProfile = () =>
  useQuery({
    queryKey: PROFILE_KEYS.freelancerProfile,
    queryFn: freelancerService.getProfile,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateFreelancerProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FreelancerProfileUpdate) => freelancerService.updateProfile(data),
    onSuccess: ({ profile }) => {
      qc.setQueryData(PROFILE_KEYS.freelancerProfile, profile);
      qc.invalidateQueries({ queryKey: PROFILE_KEYS.completion });
      toast.success('Profile saved!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useFreelancerRoleProfile = () =>
  useQuery({
    queryKey: PROFILE_KEYS.freelancerRoleProfile,
    queryFn: roleProfileService.getFreelancerProfile,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateFreelancerRoleProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateFreelancerData) => roleProfileService.updateFreelancerProfile(data),
    onSuccess: updated => {
      qc.setQueryData(PROFILE_KEYS.freelancerRoleProfile, updated);
      toast.success('Profile saved!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useFreelancerCertifications = () =>
  useQuery({
    queryKey: PROFILE_KEYS.freelancerCerts,
    queryFn: freelancerService.getCertifications,
    staleTime: 5 * 60 * 1000,
  });

export const useFreelancerServices = () =>
  useQuery({
    queryKey: PROFILE_KEYS.freelancerServices,
    queryFn: freelancerService.getServices,
    staleTime: 5 * 60 * 1000,
  });

// ─── Company ──────────────────────────────────────────────────────────────────

export const useCompanyProfile = () =>
  useQuery({
    queryKey: PROFILE_KEYS.companyProfile,
    queryFn: companyService.getMyCompany,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateCompanyProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CompanyProfileUpdate) => companyService.updateMyCompany(data),
    onSuccess: updated => {
      qc.setQueryData(PROFILE_KEYS.companyProfile, updated);
      toast.success('Company profile saved!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useCompanyRoleProfile = () =>
  useQuery({
    queryKey: PROFILE_KEYS.companyRoleProfile,
    queryFn: roleProfileService.getCompanyProfile,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateCompanyRoleProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCompanyData) => roleProfileService.updateCompanyProfile(data),
    onSuccess: updated => {
      qc.setQueryData(PROFILE_KEYS.companyRoleProfile, updated);
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// ─── Organization ─────────────────────────────────────────────────────────────

export const useOrganizationProfile = () =>
  useQuery({
    queryKey: PROFILE_KEYS.orgProfile,
    queryFn: organizationService.getMyOrganization,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateOrganizationProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OrganizationProfileUpdate) => organizationService.updateMyOrganization(data),
    onSuccess: updated => {
      qc.setQueryData(PROFILE_KEYS.orgProfile, updated);
      toast.success('Organization profile saved!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useOrganizationRoleProfile = () =>
  useQuery({
    queryKey: PROFILE_KEYS.orgRoleProfile,
    queryFn: roleProfileService.getOrganizationProfile,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateOrganizationRoleProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOrganizationData) => roleProfileService.updateOrganizationProfile(data),
    onSuccess: updated => {
      qc.setQueryData(PROFILE_KEYS.orgRoleProfile, updated);
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// ─── Image picker helper hook ─────────────────────────────────────────────────

export const useImagePicker = () => {
  const pickImage = useCallback(async (type: 'avatar' | 'cover') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access in settings.');
      return null;
    }
    const aspect: [number, number] = type === 'avatar' ? [1, 1] : [3, 1];
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    // Max size check: 5MB avatar, 10MB cover
    const maxBytes = type === 'avatar' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (asset.fileSize && asset.fileSize > maxBytes) {
      Alert.alert('File too large', `Max size: ${type === 'avatar' ? '5MB' : '10MB'}`);
      return null;
    }
    return {
      uri: asset.uri,
      name: `${type}-${Date.now()}.jpg`,
      type: 'image/jpeg',
    };
  }, []);

  return { pickImage };
};