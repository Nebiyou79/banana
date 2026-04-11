import { apiGet, apiPut, apiPost, apiDelete, apiPatch } from '../lib/api';
import { PROFILE, VERIFICATION } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CloudinaryImage {
  secure_url: string;
  public_id?: string;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
}

export interface ProfileCompletion {
  percentage: number;
  completedSections: string[];
  suggestions: Array<{ type: string; message: string; priority: 'high' | 'medium' | 'low' }>;
  requiredFields: string[];
  completedFields: string[];
}

export interface Profile {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    isActive: boolean;
    verificationStatus: string;
  };
  avatar?: CloudinaryImage | null;
  cover?: CloudinaryImage | null;
  headline?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  socialLinks: SocialLinks;
  profileCompletion: ProfileCompletion;
  verificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
  lastActive?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  headline?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
}

export interface VerificationStatus {
  verificationStatus: 'none' | 'partial' | 'full';
  verificationDetails: {
    profileVerified: boolean;
    socialVerified: boolean;
    documentsVerified: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    lastVerified?: string;
  };
  verificationMessage: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const profileService = {
  getProfile: async (): Promise<Profile> => {
    const res = await apiGet<{ success: boolean; data: Profile }>(PROFILE.BASE);
    return res.data.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<Profile> => {
    const res = await apiPut<{ success: boolean; data: Profile }>(PROFILE.BASE, data);
    return res.data.data;
  },

  getPublicProfile: async (userId: string): Promise<Profile> => {
    const res = await apiGet<{ success: boolean; data: Profile }>(PROFILE.PUBLIC(userId));
    return res.data.data;
  },

  uploadAvatar: async (formData: FormData): Promise<{ avatarUrl: string }> => {
    const res = await apiPost<{ success: boolean; data: { avatarUrl: string } }>(
      PROFILE.AVATAR,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },

  uploadCover: async (formData: FormData): Promise<{ coverUrl: string }> => {
    const res = await apiPost<{ success: boolean; data: { coverUrl: string } }>(
      PROFILE.COVER,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },

  deleteAvatar: async (): Promise<void> => {
    await apiDelete(PROFILE.AVATAR);
  },

  deleteCover: async (): Promise<void> => {
    await apiDelete(PROFILE.COVER);
  },

  updateSocialLinks: async (socialLinks: SocialLinks): Promise<SocialLinks> => {
    const res = await apiPut<{ success: boolean; data: SocialLinks }>(
      PROFILE.SOCIAL_LINKS,
      { socialLinks }
    );
    return res.data.data;
  },

  getProfileCompletion: async (): Promise<ProfileCompletion> => {
    const res = await apiGet<{ success: boolean; data: ProfileCompletion }>(PROFILE.COMPLETION);
    return res.data.data;
  },

  // GET /verification/my-status
  getVerificationStatus: async (): Promise<VerificationStatus> => {
    const res = await apiGet<VerificationStatus>(VERIFICATION.MY_STATUS);
    // The backend returns the fields directly, not nested under .data
    return res.data;
  },

  getInitials: (name: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((p) => p.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  getAvatarUrl: (profile?: Profile | null): string | null => {
    return profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null;
  },
};
