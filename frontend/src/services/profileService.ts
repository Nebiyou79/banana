/* eslint-disable @typescript-eslint/no-explicit-any */
// services/profileService.ts
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  telegram?: string;
  youtube?: string;
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
  engagementRate: number;
  averageResponseTime: number;
  endorsementCount: number;
}

export interface ProfileCompletion {
  percentage: number;
  completedSections: string[];
  lastUpdated: string;
  requiredFields: string[];
  completedFields: string[];
}

export interface VerificationDocument {
  documentType: string;
  url: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  verifiedBy?: string;
}

export interface VerificationDetails {
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  documents: VerificationDocument[];
}

export interface Education {
  _id?: string;
  institution: string;
  degree: string;
  field: string;
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
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance' | 'self-employed';
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
  skills: string[];
  achievements: string[];
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
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyInfo {
  size?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  foundedYear?: number;
  companyType?: 'startup' | 'small-business' | 'medium-business' | 'large-enterprise' | 'multinational' | 'non-profit' | 'government' | 'community' | 'ngo' | 'charity' | 'association' | 'educational' | 'healthcare' | 'other';
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

export interface Award {
  _id?: string;
  title: string;
  issuer: string;
  date?: string;
  description?: string;
  url?: string;
}

export interface VolunteerExperience {
  _id?: string;
  organization: string;
  role: string;
  cause?: string;
  startDate?: string;
  endDate?: string;
  current: boolean;
  description?: string;
  hoursPerWeek?: number;
  totalHours?: number;
}

export interface RoleSpecific {
  skills: string[];
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  portfolio: PortfolioProject[];
  companyInfo?: CompanyInfo;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'candidate' | 'company' | 'freelancer' | 'organization' | 'admin';
  avatar?: string;
  coverPhoto?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive: boolean;
  verificationStatus: string;
  hourlyRate?: number;
}

export interface Profile {
  avatar?: string;
  coverPhoto?: string | null;
  _id: string;
  user: User;
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
  verificationDetails?: VerificationDetails;
  roleSpecific: RoleSpecific;
  languages?: Language[];  // Make optional
  interests?: string[];
  awards: Award[];
  volunteerExperience: VolunteerExperience[];
  featured: boolean;
  featuredUntil?: string;
  premium: {
    isPremium: boolean;
    tier: 'basic' | 'professional' | 'business' | 'enterprise';
    validUntil?: string;
    features: string[];
  };
  lastActive: string;
  lastProfileUpdate: string;
  isActive: boolean;
  isVerified: boolean;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfile {
  _id: string;
  user: {
    [x: string]: any;
    _id: string;
    name: string;
    avatar?: string;
    role: string;
    verificationStatus: string;
  };
  headline?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks: SocialLinks;
  roleSpecific: {
    skills: string[];
  };
  socialStats: {
    followerCount: number;
    followingCount: number;
    postCount: number;
    profileViews: number;
    connectionCount: number;
  };
  verificationStatus: string;
  featured: boolean;
  profileCompletion: number;
  createdAt: string;
  lastActive?: string;
}

export interface DetailedProfile extends PublicProfile {
  coverPhoto?: string | null;
  isFollowing?: boolean;
  skills: string[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  languages: Language[];
  interests: string[];
}


// Base response interface
interface BaseResponse {
  success: boolean;
  message?: string;
  code?: string;
}

export interface ProfileResponse extends BaseResponse {
  data: Profile;
}

export interface PublicProfileResponse extends BaseResponse {
  data: DetailedProfile;
}

export interface ProfileCompletionResponse extends BaseResponse {
  data: {
    percentage: number;
    completedSections: string[];
    suggestions: Array<{
      type: string;
      message: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    requiredFields: string[];
    completedFields: string[];
  };
}

export interface VerificationResponse extends BaseResponse {
  data: {
    status: string;
    submittedAt: string;
    documentsCount: number;
  };
}

export interface PopularProfilesResponse extends BaseResponse {
  data: PublicProfile[];
  count: number;
}

export interface SearchProfilesResponse extends BaseResponse {
  data: PublicProfile[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ProfileSummary {
  _id: string;
  userId: string;
  headline?: string;
  location?: string;
  skills: string[];
  experienceYears: number;
  profileCompletion: number;
  isVerified: boolean;
  isFeatured: boolean;
  lastActive?: string;
}

export interface ProfileSummaryResponse extends BaseResponse {
  data: ProfileSummary;
}

export interface UpdateProfileData {
  headline?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  socialLinks?: SocialLinks;
  privacySettings?: Partial<PrivacySettings>;
  notificationPreferences?: Partial<NotificationPreferences>;
  roleSpecific?: Partial<RoleSpecific>;
  languages?: Language[];
  interests?: string[];
  awards?: Award[];
  volunteerExperience?: VolunteerExperience[];
  avatar?: string;
  coverPhoto?: string;
}

export interface UpdateProfessionalInfoData {
  skills?: string[];
  education?: Education[];
  experience?: Experience[];
  certifications?: Certification[];
  portfolio?: PortfolioProject[];
  companyInfo?: CompanyInfo;
}

export interface UploadResponse extends BaseResponse {
  data: {
    avatarUrl?: string;
    coverPhotoUrl?: string;
    publicId?: string;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: any[];
}

class ProfileServiceError extends Error {
  code?: string;
  errors?: any[];

  constructor(message: string, code?: string, errors?: any[]) {
    super(message);
    this.name = 'ProfileServiceError';
    this.code = code;
    this.errors = errors;
  }
}

const handleApiError = (error: any, defaultMessage: string): never => {
  console.error('🔴 Profile Service Error:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });

  if (error.response?.data) {
    const { message, code, errors } = error.response.data;
    const errorMessage = message || error.message || defaultMessage;

    handleError(errorMessage);
    throw new ProfileServiceError(errorMessage, code, errors);
  } else if (error.message) {
    handleError(error.message);
    throw new ProfileServiceError(error.message);
  } else {
    handleError(defaultMessage);
    throw new ProfileServiceError(defaultMessage);
  }
};

export const profileService = {
  // ========== MAIN PROFILE ENDPOINTS ==========

  // Get current user's profile
  // Update the getProfile method in profileService.ts
  getProfile: async (): Promise<Profile> => {
    try {
      const response = await api.get<ProfileResponse>('/profile');

      if (!response.data.success || !response.data.data) {
        if (response.data.code === 'VALIDATION_ERROR' || response.data.message?.includes('validation')) {
          console.warn('Profile validation error, returning minimal profile data');
          return profileService.createSafeProfile();
        }
        throw new ProfileServiceError(
          response.data.message || 'Failed to fetch profile',
          response.data.code
        );
      }

      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.message?.includes('validation') ||
        error.message?.includes('validation')) {
        console.warn('Profile validation error caught, returning safe profile');
        return profileService.createSafeProfile();
      }
      return handleApiError(error, 'Failed to fetch profile') as never;
    }
  },

  // Update profile
  updateProfile: async (data: UpdateProfileData): Promise<Profile> => {
    try {
      const response = await api.put<ProfileResponse>('/profile', data);

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to update profile',
          response.data.code
        );
      }

      handleSuccess('Profile updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update profile') as never;
    }
  },

  // Get public profile
  getPublicProfile: async (userId: string): Promise<DetailedProfile> => {
    try {
      if (!userId) {
        throw new ProfileServiceError('User ID is required', 'USER_ID_REQUIRED');
      }

      const response = await api.get<PublicProfileResponse>(`/profile/public/${userId}`);

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to fetch public profile',
          response.data.code
        );
      }

      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch public profile') as never;
    }
  },

  // Upload avatar (FIXED)
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string; publicId?: string }> => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post<UploadResponse>('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to upload avatar',
          response.data.code
        );
      }

      handleSuccess('Avatar uploaded successfully');

      // The backend returns avatarUrl in the response
      return {
        avatarUrl: response.data.data.avatarUrl || '',
        publicId: response.data.data.publicId
      };
    } catch (error: any) {
      return handleApiError(error, 'Failed to upload avatar') as never;
    }
  },

  // Upload cover photo (FIXED)
  uploadCoverPhoto: async (file: File): Promise<{ coverPhotoUrl: string; publicId?: string }> => {
    try {
      const formData = new FormData();
      formData.append('coverPhoto', file);

      const response = await api.post<UploadResponse>('/profile/cover-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to upload cover photo',
          response.data.code
        );
      }

      handleSuccess('Cover photo uploaded successfully');

      // The backend returns coverPhotoUrl in the response
      return {
        coverPhotoUrl: response.data.data.coverPhotoUrl || '',
        publicId: response.data.data.publicId
      };
    } catch (error: any) {
      return handleApiError(error, 'Failed to upload cover photo') as never;
    }
  },
  // Update professional info
  updateProfessionalInfo: async (data: UpdateProfessionalInfoData): Promise<{
    roleSpecific: RoleSpecific;
    profileCompletion: ProfileCompletion;
  }> => {
    try {
      const response = await api.put<{
        success: boolean;
        data: {
          roleSpecific: RoleSpecific;
          profileCompletion: ProfileCompletion;
        };
        message?: string;
        code?: string;
      }>('/profile/professional-info', data);

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to update professional information',
          response.data.code
        );
      }

      handleSuccess('Professional information updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update professional information') as never;
    }
  },

  // Update social links
  updateSocialLinks: async (socialLinks: SocialLinks): Promise<SocialLinks> => {
    try {
      const response = await api.put<{
        success: boolean;
        data: SocialLinks;
        message?: string;
        code?: string;
      }>('/profile/social-links', { socialLinks });

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to update social links',
          response.data.code
        );
      }

      handleSuccess('Social links updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update social links') as never;
    }
  },

  // Get profile completion
  // Update this method in profileService.ts
  getProfileCompletion: async (): Promise<{
    percentage: number;
    completedSections: string[];
    suggestions: Array<{
      type: string;
      message: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    requiredFields: string[];
    completedFields: string[];
  }> => {
    try {
      const response = await api.get<ProfileCompletionResponse>('/profile/completion');

      if (!response.data.success || !response.data.data) {
        console.warn('Profile completion fetch failed:', response.data.message);
        // Return default values instead of throwing
        return {
          percentage: 0,
          completedSections: [],
          suggestions: [
            { type: 'basic', message: 'Complete your basic information', priority: 'high' },
            { type: 'avatar', message: 'Add a profile picture', priority: 'high' },
            { type: 'bio', message: 'Write a compelling bio', priority: 'medium' }
          ],
          requiredFields: [],
          completedFields: []
        };
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch profile completion:', error);

      // Return default values for graceful degradation
      return {
        percentage: 0,
        completedSections: [],
        suggestions: [
          { type: 'basic', message: 'Complete your basic information', priority: 'high' },
          { type: 'avatar', message: 'Add a profile picture', priority: 'high' },
          { type: 'bio', message: 'Write a compelling bio', priority: 'medium' }
        ],
        requiredFields: [],
        completedFields: []
      };
    }
  },

  // Submit verification
  submitVerification: async (documents: Array<{
    documentType: string;
    url: string;
    remarks?: string;
  }>): Promise<{
    status: string;
    submittedAt: string;
    documentsCount: number;
  }> => {
    try {
      if (!documents || documents.length === 0) {
        throw new ProfileServiceError('At least one document is required', 'DOCUMENTS_REQUIRED');
      }

      const response = await api.post<VerificationResponse>('/profile/verification', { documents });

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to submit verification',
          response.data.code
        );
      }

      handleSuccess('Verification submitted successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to submit verification') as never;
    }
  },

  // Update privacy settings
  updatePrivacySettings: async (privacySettings: Partial<PrivacySettings>): Promise<PrivacySettings> => {
    try {
      const response = await api.put<{
        success: boolean;
        data: PrivacySettings;
        message?: string;
        code?: string;
      }>('/profile/privacy-settings', { privacySettings });

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to update privacy settings',
          response.data.code
        );
      }

      handleSuccess('Privacy settings updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update privacy settings') as never;
    }
  },

  // Update notification preferences
  updateNotificationPreferences: async (notificationPreferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    try {
      const response = await api.put<{
        success: boolean;
        data: NotificationPreferences;
        message?: string;
        code?: string;
      }>('/profile/notification-preferences', { notificationPreferences });

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to update notification preferences',
          response.data.code
        );
      }

      handleSuccess('Notification preferences updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update notification preferences') as never;
    }
  },

  // Get profile summary
  getProfileSummary: async (): Promise<ProfileSummary> => {
    try {
      const response = await api.get<ProfileSummaryResponse>('/profile/summary');

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to fetch profile summary',
          response.data.code
        );
      }

      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch profile summary') as never;
    }
  },

  // Update social stats (admin/internal use)
  updateSocialStats: async (): Promise<SocialStats> => {
    try {
      const response = await api.put<{
        success: boolean;
        data: SocialStats;
        message?: string;
        code?: string;
      }>('/profile/social-stats');

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to update social stats',
          response.data.code
        );
      }

      handleSuccess('Social stats updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update social stats') as never;
    }
  },

  // ========== PUBLIC PROFILE ENDPOINTS ==========

  // Get popular profiles
  getPopularProfiles: async (options?: {
    limit?: number;
    role?: string;
  }): Promise<{
    profiles: PublicProfile[];
    count: number;
  }> => {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.role) params.append('role', options.role);

      const response = await api.get<PopularProfilesResponse>(`/profile/popular?${params.toString()}`);

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to fetch popular profiles',
          response.data.code
        );
      }

      return {
        profiles: response.data.data,
        count: response.data.count || 0
      };
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch popular profiles') as never;
    }
  },

  // Search profiles
  searchProfiles: async (options: {
    query?: string;
    location?: string;
    skills?: string[];
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    profiles: PublicProfile[];
    meta: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }> => {
    try {
      const params = new URLSearchParams();
      if (options.query) params.append('q', options.query);
      if (options.location) params.append('location', options.location);
      if (options.skills && options.skills.length > 0) params.append('skills', options.skills.join(','));
      if (options.role) params.append('role', options.role);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await api.get<SearchProfilesResponse>(`/profile/search?${params.toString()}`);

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to search profiles',
          response.data.code
        );
      }

      return {
        profiles: response.data.data,
        meta: response.data.meta
      };
    } catch (error: any) {
      return handleApiError(error, 'Failed to search profiles') as never;
    }
  },

  // ========== HELPER FUNCTIONS ==========

  calculateProfileStrength: (profile: Profile): number => {
    return profile.profileCompletion?.percentage || 0;
  },

  getInitials: (name: string): string => {
    if (!name) return 'US';

    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  formatSocialLink: (platform: string, url: string): string => {
    if (!url) return '';

    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }

    return url;
  },

  validateWebsite: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  },

  validatePhone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  getDisplayRole: (role: string): string => {
    const roleMap: Record<string, string> = {
      candidate: 'Job Seeker',
      company: 'Company',
      freelancer: 'Freelancer',
      organization: 'Organization',
      admin: 'Administrator'
    };

    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
  },

  isProfileComplete: (profile: Profile, threshold: number = 80): boolean => {
    return (profile.profileCompletion?.percentage || 0) >= threshold;
  },

  getMissingFields: (profile: Profile): string[] => {
    const missing: string[] = [];

    if (!profile.user.avatar) missing.push('Profile picture');
    if (!profile.headline) missing.push('Headline');
    if (!profile.bio) missing.push('Bio');
    if (!profile.location) missing.push('Location');
    if (profile.roleSpecific.skills.length === 0) missing.push('Skills');

    const socialLinksCount = Object.values(profile.socialLinks).filter(link => link).length;
    if (socialLinksCount < 2) missing.push('Social links');

    return missing;
  },

  getExperienceYears: (experience: Experience[]): number => {
    let totalYears = 0;

    experience.forEach(exp => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.current || !exp.endDate ? new Date() : new Date(exp.endDate);
      const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      totalYears += Math.max(0, years);
    });

    return Math.round(totalYears * 10) / 10;
  },

  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  getProficiencyLabel: (proficiency: string): string => {
    const labels: Record<string, string> = {
      'basic': 'Basic',
      'conversational': 'Conversational',
      'professional': 'Professional',
      'fluent': 'Fluent',
      'native': 'Native'
    };

    return labels[proficiency] || proficiency;
  },
  // Add this helper function at the end of the profileService object
  createSafeProfile: (): Profile => {
    const userId = 'temp-id';
    const userEmail = 'user@example.com';
    const userName = 'User';

    return {
      _id: userId,
      user: {
        _id: userId,
        name: userName,
        email: userEmail,
        role: 'candidate',
        isActive: true,
        verificationStatus: 'pending'
      },
      coverPhoto: null,
      headline: 'Welcome to Banana Social',
      bio: '',
      location: '',
      phone: '',
      website: '',
      socialLinks: {},
      privacySettings: {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showLocation: false,
        showAge: false,
        allowMessages: true,
        allowConnections: true,
        showOnlineStatus: true,
        showLastSeen: true,
        showProfileViews: true
      },
      notificationPreferences: {
        email: {
          messages: true,
          connectionRequests: true,
          postInteractions: true,
          jobMatches: true,
          newFollowers: true,
          jobAlerts: true,
          newsletter: true
        },
        push: {
          messages: true,
          connectionRequests: true,
          postInteractions: true,
          newFollowers: true,
          jobAlerts: true
        },
        inApp: {
          messages: true,
          connectionRequests: true,
          postInteractions: true,
          newFollowers: true,
          jobMatches: true
        }
      },
      socialStats: {
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        profileViews: 0,
        connectionCount: 0,
        engagementRate: 0,
        averageResponseTime: 0,
        endorsementCount: 0
      },
      profileCompletion: {
        percentage: 0,
        completedSections: [],
        lastUpdated: new Date().toISOString(),
        requiredFields: [],
        completedFields: []
      },
      verificationStatus: 'none',
      roleSpecific: {
        skills: [],
        education: [],
        experience: [],
        certifications: [],
        portfolio: [],
        companyInfo: undefined
      },
      languages: [],
      interests: [],
      awards: [],
      volunteerExperience: [],
      featured: false,
      premium: {
        isPremium: false,
        tier: 'basic',
        features: []
      },
      lastActive: new Date().toISOString(),
      lastProfileUpdate: new Date().toISOString(),
      isActive: true,
      isVerified: false,
      isComplete: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },
};

export default profileService;

function createSafeProfile(): Profile | PromiseLike<Profile> {
  throw new Error('Function not implemented.');
}
