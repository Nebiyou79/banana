/**
 * profileService.ts
 * Matches backend: profileController.js + profileRoutes.js
 * Endpoints: GET/PUT /profile, POST/DELETE /profile/avatar, POST/DELETE /profile/cover
 */
import { apiGet, apiPut, apiPost, apiDelete } from '../lib/api';
import { PROFILE, VERIFICATION } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  uploaded_at?: string;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  telegram?: string;
  youtube?: string;
  whatsapp?: string;
  discord?: string;
  behance?: string;
  dribbble?: string;
  medium?: string;
  devto?: string;
  stackoverflow?: string;
  codepen?: string;
  gitlab?: string;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'connections' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showAge: boolean;
  allowMessages: boolean;
  allowConnections: boolean;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showProfileViews: boolean;
}

export interface NotificationPreferences {
  email: {
    messages: boolean;
    connectionRequests: boolean;
    postInteractions: boolean;
    jobMatches: boolean;
    newFollowers: boolean;
    jobAlerts: boolean;
    newsletter: boolean;
  };
  push: {
    messages: boolean;
    connectionRequests: boolean;
    postInteractions: boolean;
    newFollowers: boolean;
    jobAlerts: boolean;
  };
  inApp: {
    messages: boolean;
    connectionRequests: boolean;
    postInteractions: boolean;
    newFollowers: boolean;
    jobMatches: boolean;
  };
}

export interface SocialStats {
  followerCount: number;
  followingCount: number;
  postCount: number;
  profileViews: number;
  connectionCount: number;
}

export interface ProfileCompletion {
  percentage: number;
  completedSections: string[];
  suggestions: Array<{ type: string; message: string; priority: 'high' | 'medium' | 'low' }>;
  requiredFields: string[];
  completedFields: string[];
}

export interface Education {
  _id?: string;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
  grade?: string;
}

export interface Experience {
  _id?: string;
  company: string;
  position: string;
  location?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance' | 'self-employed';
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
  skills: string[];
  achievements?: string[];
}

export interface Certification {
  _id?: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  skills?: string[];
}

export interface PortfolioProject {
  _id?: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  projectUrl?: string;
  category?: string;
  technologies: string[];
  budget?: number;
  budgetType?: 'fixed' | 'hourly' | 'daily' | 'monthly';
  duration?: string;
  client?: string;
  completionDate?: string;
  teamSize?: number;
  role?: string;
  featured?: boolean;
  visibility?: 'public' | 'private';
}

export interface CompanyInfo {
  size?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  foundedYear?: number;
  companyType?: string;
  industry?: string;
  mission?: string;
  values?: string[];
  culture?: string;
  specialties?: string[];
}

export interface Language {
  language: string;
  proficiency: 'basic' | 'conversational' | 'professional' | 'fluent' | 'native';
}

export interface RoleSpecific {
  skills: string[];
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  portfolio: PortfolioProject[];
  companyInfo?: CompanyInfo;
}

export interface ProfileUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  coverPhoto?: string;
  isActive: boolean;
  verificationStatus: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface Profile {
  _id: string;
  user: ProfileUser;
  avatar?: CloudinaryImage | null;
  cover?: CloudinaryImage | null;
  headline?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  socialLinks: SocialLinks;
  privacySettings: PrivacySettings;
  notificationPreferences: NotificationPreferences;
  socialStats: SocialStats;
  profileCompletion: ProfileCompletion;
  verificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
  roleSpecific: RoleSpecific;
  languages?: Language[];
  interests?: string[];
  awards?: Array<{ title: string; issuer: string; date?: string; description?: string }>;
  volunteerExperience?: Array<{ organization: string; role: string; startDate?: string; endDate?: string; current: boolean; description?: string }>;
  featured: boolean;
  premium: { isPremium: boolean; tier: string; features: string[] };
  lastActive: string;
  lastProfileUpdate: string;
  isActive: boolean;
  isVerified: boolean;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  headline?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  socialLinks?: Partial<SocialLinks>;
  privacySettings?: Partial<PrivacySettings>;
  notificationPreferences?: Partial<NotificationPreferences>;
  roleSpecific?: Partial<RoleSpecific>;
  languages?: Language[];
  interests?: string[];
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

export interface AvatarUploadResult {
  avatar: CloudinaryImage;
  thumbnailUrl?: string;
  fileInfo?: { originalName: string; size: number; mimetype: string; format: string };
  user: { id: string; avatar: string; name: string; email: string };
}

export interface CoverUploadResult {
  cover: CloudinaryImage;
  thumbnailUrl?: string;
  fileInfo?: { originalName: string; size: number; mimetype: string; format: string };
  user: { id: string; coverPhoto: string; name: string; email: string };
}

// ─── API Response wrapper ─────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const profileService = {
  // GET /profile
  getProfile: async (): Promise<Profile> => {
    const res = await apiGet<ApiResponse<Profile>>(PROFILE.BASE);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to fetch profile');
    }
    return res.data.data;
  },

  // PUT /profile
  updateProfile: async (data: UpdateProfileData): Promise<Profile> => {
    const res = await apiPut<ApiResponse<Profile>>(PROFILE.BASE, data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to update profile');
    }
    return res.data.data;
  },

  // GET /profile/public/:id
  getPublicProfile: async (userId: string): Promise<Profile> => {
    const res = await apiGet<ApiResponse<Profile>>(PROFILE.PUBLIC(userId));
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to fetch public profile');
    }
    return res.data.data;
  },

  // POST /profile/avatar — multipart/form-data field: 'avatar'
  uploadAvatar: async (formData: FormData): Promise<AvatarUploadResult> => {
    const res = await apiPost<ApiResponse<AvatarUploadResult>>(
      PROFILE.AVATAR,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 }
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to upload avatar');
    }
    return res.data.data;
  },

  // POST /profile/cover — multipart/form-data field: 'cover'
  uploadCoverPhoto: async (formData: FormData): Promise<CoverUploadResult> => {
    const res = await apiPost<ApiResponse<CoverUploadResult>>(
      PROFILE.COVER,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180_000 }
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to upload cover photo');
    }
    return res.data.data;
  },

  // DELETE /profile/avatar
  deleteAvatar: async (): Promise<void> => {
    await apiDelete(PROFILE.AVATAR);
  },

  // DELETE /profile/cover
  deleteCoverPhoto: async (): Promise<void> => {
    await apiDelete(PROFILE.COVER);
  },

  // PUT /profile/social-links
  updateSocialLinks: async (socialLinks: Partial<SocialLinks>): Promise<SocialLinks> => {
    const res = await apiPut<ApiResponse<SocialLinks>>(
      PROFILE.SOCIAL_LINKS,
      { socialLinks }
    );
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to update social links');
    return res.data.data;
  },

  // GET /profile/completion
  getProfileCompletion: async (): Promise<ProfileCompletion> => {
    const res = await apiGet<ApiResponse<ProfileCompletion>>(PROFILE.COMPLETION);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to fetch completion');
    return res.data.data;
  },

  // GET /verification/my-status
  getVerificationStatus: async (): Promise<VerificationStatus> => {
    const res = await apiGet<VerificationStatus>(VERIFICATION.MY_STATUS);
    return res.data;
  },

  // PUT /profile/privacy-settings
  updatePrivacySettings: async (settings: Partial<PrivacySettings>): Promise<PrivacySettings> => {
    const res = await apiPut<ApiResponse<PrivacySettings>>(
      PROFILE.PRIVACY,
      { privacySettings: settings }
    );
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to update privacy');
    return res.data.data;
  },

  // Helpers
  getAvatarUrl: (profile?: Profile | null): string | null =>
    profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null,

  getCoverUrl: (profile?: Profile | null): string | null =>
    profile?.cover?.secure_url ?? profile?.user?.coverPhoto ?? null,

  getInitials: (name: string): string =>
    name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2),
};
