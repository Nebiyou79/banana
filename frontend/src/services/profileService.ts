/* eslint-disable @typescript-eslint/no-explicit-any */
// services/profileService.ts - COMPLETE FIXED VERSION
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

export interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  resource_type?: string;
  uploaded_at: string;
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
  avatarPublicId?: string;
  coverPhoto?: string;
  coverPhotoPublicId?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive: boolean;
  verificationStatus: string;
  hourlyRate?: number;
}

export interface Profile {
  avatar?: CloudinaryImage | null;
  cover?: CloudinaryImage | null;
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
  languages?: Language[];
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
}

export interface UpdateProfessionalInfoData {
  skills?: string[];
  education?: Education[];
  experience?: Experience[];
  certifications?: Certification[];
  portfolio?: PortfolioProject[];
  companyInfo?: CompanyInfo;
}

export interface AvatarUploadResponse extends BaseResponse {
  data: {
    avatar: CloudinaryImage;
    thumbnailUrl?: string;
    fileInfo?: {
      originalName: string;
      size: number;
      mimetype: string;
      format: string;
    };
  };
}

export interface CoverUploadResponse extends BaseResponse {
  data: {
    cover: CloudinaryImage;
    thumbnailUrl?: string;
    fileInfo?: {
      originalName: string;
      size: number;
      mimetype: string;
      format: string;
    };
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

// Enhanced error handler with better debugging
const handleApiError = (error: any, defaultMessage: string): never => {
  console.error('🔴 Profile Service Error Details:', {
    timestamp: new Date().toISOString(),
    status: error.response?.status,
    statusText: error.response?.statusText,
    url: error.config?.url,
    method: error.config?.method,
    requestData: error.config?.data,
    responseData: error.response?.data,
    headers: error.response?.headers,
    message: error.message,
    code: error.code
  });

  if (error.response?.data) {
    const { message, code, errors, debug } = error.response.data;
    const errorMessage = message || error.message || defaultMessage;
    
    // Handle specific error codes with user-friendly messages
    if (code === 'NO_FILE_PROVIDED') {
      const userMessage = 'No image file was received. Please try selecting the file again.';
      handleError(userMessage);
      throw new ProfileServiceError(userMessage, code, errors);
    }
    
    if (code === 'FILE_TOO_LARGE') {
      const userMessage = 'File is too large. Please select a smaller image.';
      handleError(userMessage);
      throw new ProfileServiceError(userMessage, code, errors);
    }
    
    if (code === 'VALIDATION_ERROR') {
      const userMessage = errors?.[0]?.message || 'Invalid file format. Please use JPEG, PNG, or WebP.';
      handleError(userMessage);
      throw new ProfileServiceError(userMessage, code, errors);
    }
    
    handleError(errorMessage);
    throw new ProfileServiceError(errorMessage, code, errors);
  } else if (error.request) {
    const networkMessage = 'Network error. Please check your internet connection and try again.';
    handleError(networkMessage);
    throw new ProfileServiceError(networkMessage, 'NETWORK_ERROR');
  } else {
    handleError(defaultMessage);
    throw new ProfileServiceError(defaultMessage);
  }
};

// Helper to debug FormData
const debugFormData = (formData: FormData, action: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [DEBUG] FormData for ${action}:`);
    for (const [key, value] of (formData as any).entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File - ${value.name} (${value.type}, ${value.size} bytes)`);
      } else if (typeof value === 'string' && value.length > 100) {
        console.log(`  ${key}: ${value.substring(0, 100)}...`);
      } else {
        console.log(`  ${key}:`, value);
      }
    }
  }
};

// Helper to validate file before upload
const validateImageFile = (file: File, type: 'avatar' | 'cover'): { valid: boolean; error?: string } => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];
  
  const maxSize = type === 'avatar' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  const maxSizeMB = type === 'avatar' ? '5MB' : '10MB';
  
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file type. Please use ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${maxSizeMB}`
    };
  }
  
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    };
  }
  
  return { valid: true };
};

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const profileService = {
  // ========== MAIN PROFILE ENDPOINTS ==========

  // Get current user's profile
  getProfile: async (): Promise<Profile> => {
    try {
      console.log('🔄 Fetching profile...');
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

      console.log('✅ Profile fetched successfully');
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
      console.log('🔄 Updating profile...', { data: Object.keys(data) });
      const response = await api.put<ProfileResponse>('/profile', data);

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to update profile',
          response.data.code
        );
      }

      handleSuccess('Profile updated successfully');
      console.log('✅ Profile updated successfully');
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

      console.log('🔄 Fetching public profile for user:', userId);
      const response = await api.get<PublicProfileResponse>(`/profile/public/${userId}`);

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to fetch public profile',
          response.data.code
        );
      }

      console.log('✅ Public profile fetched successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch public profile') as never;
    }
  },

  // ========== CLOUDINARY UPLOAD ENDPOINTS (FIXED) ==========

  // UPLOAD AVATAR - FIXED VERSION
  uploadAvatar: async (file: File, onProgress?: (progressEvent: any) => void): Promise<{
    avatar: CloudinaryImage;
    thumbnailUrl?: string;
    fileInfo?: any;
  }> => {
    try {
      console.log('🔄 Starting avatar upload process...');
      
      // 1. Validate file locally first
      const validation = validateImageFile(file, 'avatar');
      if (!validation.valid) {
        throw new ProfileServiceError(validation.error || 'Invalid file', 'INVALID_FILE');
      }

      // 2. Create FormData with correct field name
      const formData = new FormData();
      // ✅ CRITICAL: Field name must be 'avatar' to match backend middleware
      formData.append('avatar', file);
      
      // Add metadata for debugging
      formData.append('uploadMetadata', JSON.stringify({
        timestamp: new Date().toISOString(),
        client: 'bananalink-web',
        version: '1.0.0'
      }));

      // 3. Debug FormData
      debugFormData(formData, 'avatar upload');
      
      console.log('📤 Uploading avatar...', {
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: file.type,
        fieldName: 'avatar' // Should be 'avatar'
      });

      // 4. Make API call with progress tracking
      const response = await api.post<AvatarUploadResponse>('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for upload
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            onProgress(progressEvent);
          }
          
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`📊 Avatar upload progress: ${percentCompleted}%`);
          }
        },
      });

      // 5. Check response
      if (!response.data.success) {
        console.error('❌ Avatar upload failed:', response.data);
        throw new ProfileServiceError(
          response.data.message || 'Upload failed',
          response.data.code || 'UPLOAD_ERROR'
        );
      }

      if (!response.data.data || !response.data.data.avatar) {
        throw new ProfileServiceError('No avatar data returned from server', 'NO_DATA_RETURNED');
      }

      console.log('✅ Avatar uploaded successfully!', {
        publicId: response.data.data.avatar.public_id,
        url: response.data.data.avatar.secure_url
      });
      
      handleSuccess('Profile picture updated successfully!');
      
      return {
        avatar: response.data.data.avatar,
        thumbnailUrl: response.data.data.thumbnailUrl,
        fileInfo: response.data.data.fileInfo
      };
    } catch (error: any) {
      console.error('🔥 Avatar upload service error details:', {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        isAxiosError: error.isAxiosError,
        requestUrl: error.config?.url
      });

      // Enhanced error messages for common issues
      if (error.response?.status === 400) {
        if (error.response.data?.code === 'NO_FILE_PROVIDED') {
          throw new ProfileServiceError(
            'No image file was received. Please try selecting the file again.',
            'NO_FILE_PROVIDED'
          );
        }
        if (error.response.data?.code === 'FILE_TOO_LARGE') {
          throw new ProfileServiceError(
            'Image is too large. Please select a file smaller than 5MB.',
            'FILE_TOO_LARGE'
          );
        }
      }

      if (error.response?.status === 413) {
        throw new ProfileServiceError(
          'File is too large. Maximum size is 5MB for profile pictures.',
          'FILE_TOO_LARGE'
        );
      }

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new ProfileServiceError(
          'Upload timed out. Please check your internet connection and try again.',
          'TIMEOUT'
        );
      }

      if (!error.response) {
        throw new ProfileServiceError(
          'Network error. Please check your internet connection.',
          'NETWORK_ERROR'
        );
      }

      // Fallback to generic error handler
      return handleApiError(error, 'Failed to upload avatar') as never;
    }
  },

  // UPLOAD COVER PHOTO - FIXED VERSION
  uploadCoverPhoto: async (file: File, onProgress?: (progressEvent: any) => void): Promise<{
    cover: CloudinaryImage;
    thumbnailUrl?: string;
    fileInfo?: any;
  }> => {
    try {
      console.log('🔄 Starting cover photo upload process...');
      
      // 1. Validate file locally first
      const validation = validateImageFile(file, 'cover');
      if (!validation.valid) {
        throw new ProfileServiceError(validation.error || 'Invalid file', 'INVALID_FILE');
      }

      // 2. Create FormData with correct field name
      const formData = new FormData();
      // ✅ CRITICAL: Field name must be 'cover' to match backend middleware
      formData.append('cover', file);
      
      // Add metadata for debugging
      formData.append('uploadMetadata', JSON.stringify({
        timestamp: new Date().toISOString(),
        client: 'bananalink-web',
        version: '1.0.0'
      }));

      // 3. Debug FormData
      debugFormData(formData, 'cover upload');
      
      console.log('📤 Uploading cover photo...', {
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: file.type,
        fieldName: 'cover' // Should be 'cover'
      });

      // 4. Make API call with progress tracking
      const response = await api.post<CoverUploadResponse>('/profile/cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3 minutes for larger cover photos
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            onProgress(progressEvent);
          }
          
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`📊 Cover upload progress: ${percentCompleted}%`);
          }
        },
      });

      // 5. Check response
      if (!response.data.success) {
        console.error('❌ Cover photo upload failed:', response.data);
        throw new ProfileServiceError(
          response.data.message || 'Upload failed',
          response.data.code || 'UPLOAD_ERROR'
        );
      }

      if (!response.data.data || !response.data.data.cover) {
        throw new ProfileServiceError('No cover data returned from server', 'NO_DATA_RETURNED');
      }

      console.log('✅ Cover photo uploaded successfully!', {
        publicId: response.data.data.cover.public_id,
        url: response.data.data.cover.secure_url
      });

      handleSuccess('Cover photo updated successfully!');
      
      return {
        cover: response.data.data.cover,
        thumbnailUrl: response.data.data.thumbnailUrl,
        fileInfo: response.data.data.fileInfo
      };
    } catch (error: any) {
      console.error('🔥 Cover photo upload service error details:', {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        responseStatus: error.response?.status,
        responseData: error.response?.data
      });

      // Enhanced error messages for common issues
      if (error.response?.status === 400) {
        if (error.response.data?.code === 'NO_FILE_PROVIDED') {
          throw new ProfileServiceError(
            'No image file was received. Please try selecting the file again.',
            'NO_FILE_PROVIDED'
          );
        }
        if (error.response.data?.code === 'FILE_TOO_LARGE') {
          throw new ProfileServiceError(
            'Image is too large. Please select a file smaller than 10MB.',
            'FILE_TOO_LARGE'
          );
        }
      }

      if (error.response?.status === 413) {
        throw new ProfileServiceError(
          'File is too large. Maximum size is 10MB for cover photos.',
          'FILE_TOO_LARGE'
        );
      }

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new ProfileServiceError(
          'Upload timed out. Please check your internet connection and try again.',
          'TIMEOUT'
        );
      }

      if (!error.response) {
        throw new ProfileServiceError(
          'Network error. Please check your internet connection.',
          'NETWORK_ERROR'
        );
      }

      return handleApiError(error, 'Failed to upload cover photo') as never;
    }
  },

  // Delete avatar
  deleteAvatar: async (): Promise<{ success: boolean; cloudinaryDeleted?: boolean }> => {
    try {
      console.log('🗑️ Deleting avatar...');
      const response = await api.delete<BaseResponse>('/profile/avatar');

      if (!response.data.success) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to delete avatar',
          response.data.code
        );
      }

      handleSuccess('Profile picture removed successfully');
      console.log('✅ Avatar deleted successfully');
      
      return {
        success: true,
        cloudinaryDeleted: response.data.code === 'AVATAR_DELETED'
      };
    } catch (error: any) {
      console.error('❌ Delete avatar failed:', error);
      return handleApiError(error, 'Failed to delete avatar') as never;
    }
  },

  // Delete cover photo
  deleteCoverPhoto: async (): Promise<{ success: boolean; cloudinaryDeleted?: boolean }> => {
    try {
      console.log('🗑️ Deleting cover photo...');
      const response = await api.delete<BaseResponse>('/profile/cover');

      if (!response.data.success) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to delete cover photo',
          response.data.code
        );
      }

      handleSuccess('Cover photo removed successfully');
      console.log('✅ Cover photo deleted successfully');
      
      return {
        success: true,
        cloudinaryDeleted: response.data.code === 'COVER_PHOTO_DELETED'
      };
    } catch (error: any) {
      console.error('❌ Delete cover photo failed:', error);
      return handleApiError(error, 'Failed to delete cover photo') as never;
    }
  },

  // Update professional info
  updateProfessionalInfo: async (data: UpdateProfessionalInfoData): Promise<{
    roleSpecific: RoleSpecific;
    profileCompletion: ProfileCompletion;
  }> => {
    try {
      console.log('🔄 Updating professional info...');
      const response = await api.put<{
        success: boolean;
        data: {
          roleSpecific: RoleSpecific;
          profileCompletion: ProfileCompletion;
        };
        message?: string;
        code?: string;
      }>('/profile/professional', data);

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to update professional information',
          response.data.code
        );
      }

      handleSuccess('Professional information updated successfully');
      console.log('✅ Professional info updated');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update professional information') as never;
    }
  },

  // Update social links
  updateSocialLinks: async (socialLinks: SocialLinks): Promise<SocialLinks> => {
    try {
      console.log('🔄 Updating social links...');
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
      console.log('✅ Social links updated');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update social links') as never;
    }
  },

  // Get profile completion
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
      console.log('🔄 Fetching profile completion...');
      const response = await api.get<ProfileCompletionResponse>('/profile/completion');

      if (!response.data.success || !response.data.data) {
        console.warn('Profile completion fetch failed:', response.data.message);
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

      console.log('✅ Profile completion fetched:', response.data.data.percentage + '%');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch profile completion:', error);
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

      console.log('🔄 Submitting verification...', { documentCount: documents.length });
      const response = await api.post<VerificationResponse>('/profile/verification', { documents });

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to submit verification',
          response.data.code
        );
      }

      handleSuccess('Verification submitted successfully');
      console.log('✅ Verification submitted');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to submit verification') as never;
    }
  },

  // Update privacy settings
  updatePrivacySettings: async (privacySettings: Partial<PrivacySettings>): Promise<PrivacySettings> => {
    try {
      console.log('🔄 Updating privacy settings...');
      const response = await api.put<{
        success: boolean;
        data: PrivacySettings;
        message?: string;
        code?: string;
      }>('/profile/privacy', { privacySettings });

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to update privacy settings',
          response.data.code
        );
      }

      handleSuccess('Privacy settings updated successfully');
      console.log('✅ Privacy settings updated');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update privacy settings') as never;
    }
  },

  // Update notification preferences
  updateNotificationPreferences: async (notificationPreferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    try {
      console.log('🔄 Updating notification preferences...');
      const response = await api.put<{
        success: boolean;
        data: NotificationPreferences;
        message?: string;
        code?: string;
      }>('/profile/notifications', { notificationPreferences });

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to update notification preferences',
          response.data.code
        );
      }

      handleSuccess('Notification preferences updated successfully');
      console.log('✅ Notification preferences updated');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update notification preferences') as never;
    }
  },

  // Get profile summary
  getProfileSummary: async (): Promise<ProfileSummary> => {
    try {
      console.log('🔄 Fetching profile summary...');
      const response = await api.get<ProfileSummaryResponse>('/profile/summary');

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to fetch profile summary',
          response.data.code
        );
      }

      console.log('✅ Profile summary fetched');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch profile summary') as never;
    }
  },

  // Update social stats
  updateSocialStats: async (): Promise<SocialStats> => {
    try {
      console.log('🔄 Updating social stats...');
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
      console.log('✅ Social stats updated');
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

      console.log('🔄 Fetching popular profiles...', { options });
      const response = await api.get<PopularProfilesResponse>(`/profile/popular?${params.toString()}`);

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to fetch popular profiles',
          response.data.code
        );
      }

      console.log('✅ Popular profiles fetched:', response.data.count);
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

      console.log('🔍 Searching profiles...', { options });
      const response = await api.get<SearchProfilesResponse>(`/profile/search?${params.toString()}`);

      if (!response.data.success || !response.data.data) {
        throw new ProfileServiceError(
          response.data.message || 'Failed to search profiles',
          response.data.code
        );
      }

      console.log('✅ Profiles search complete:', response.data.meta);
      return {
        profiles: response.data.data,
        meta: response.data.meta
      };
    } catch (error: any) {
      return handleApiError(error, 'Failed to search profiles') as never;
    }
  },

  // ========== CLOUDINARY HELPER FUNCTIONS ==========

  // Get avatar URL (with fallback to user.avatar)
  getAvatarUrl: (profile: Profile): string => {
    if (profile.avatar?.secure_url) {
      return profile.avatar.secure_url;
    }
    return profile.user.avatar || '';
  },

  // Get cover URL (with fallback to user.coverPhoto)
  getCoverUrl: (profile: Profile): string => {
    if (profile.cover?.secure_url) {
      return profile.cover.secure_url;
    }
    return profile.user.coverPhoto || '';
  },

  // Generate Cloudinary URL with transformations
  generateCloudinaryUrl: (
    publicId: string, 
    options?: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    }
  ): string => {
    if (!publicId) return '';
    
    // Base Cloudinary URL
    const cloudName = 'dpdkc9upr'; // Replace with your actual cloud name
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
    
    // Build transformations string
    const transformations: string[] = [];
    
    if (options?.width && options?.height && options?.crop) {
      transformations.push(`c_${options.crop},w_${options.width},h_${options.height}`);
    } else if (options?.width) {
      transformations.push(`w_${options.width}`);
    } else if (options?.height) {
      transformations.push(`h_${options.height}`);
    }
    
    if (options?.quality) {
      transformations.push(`q_${options.quality}`);
    }
    
    if (options?.format) {
      transformations.push(`f_${options.format}`);
    }
    
    const transformStr = transformations.length > 0 ? transformations.join(',') + '/' : '';
    
    return `${baseUrl}/${transformStr}${publicId}`;
  },

  // Get optimized avatar URL with different sizes
  getOptimizedAvatarUrl: (avatarUrl: string | CloudinaryImage, size: 'small' | 'medium' | 'large' = 'medium'): string => {
    if (!avatarUrl) return '';
    
    // If it's a CloudinaryImage object
    if (typeof avatarUrl !== 'string' && avatarUrl.secure_url) {
      const url = avatarUrl.secure_url;
      const sizes = {
        small: 'w_50,h_50,c_fill',
        medium: 'w_150,h_150,c_fill',
        large: 'w_300,h_300,c_fill'
      };
      
      // Replace the transformation part of the URL
      return url.replace('/upload/', `/upload/${sizes[size]}/`);
    }
    
    // If it's already a Cloudinary URL string
    if (typeof avatarUrl === 'string' && avatarUrl.includes('cloudinary.com')) {
      const sizes = {
        small: 'w_50,h_50,c_fill',
        medium: 'w_150,h_150,c_fill',
        large: 'w_300,h_300,c_fill'
      };
      
      return avatarUrl.replace('/upload/', `/upload/${sizes[size]}/`);
    }
    
    // If not a Cloudinary URL, return as-is
    return avatarUrl as string;
  },

  // Get optimized cover photo URL
  getOptimizedCoverUrl: (coverUrl: string | CloudinaryImage): string => {
    if (!coverUrl) return '';
    
    // If it's a CloudinaryImage object
    if (typeof coverUrl !== 'string' && coverUrl.secure_url) {
      const url = coverUrl.secure_url;
      // Optimize for web display
      return url.replace('/upload/', '/upload/c_fill,w_1200,h_400,q_auto,f_auto/');
    }
    
    // If it's already a Cloudinary URL string
    if (typeof coverUrl === 'string' && coverUrl.includes('cloudinary.com')) {
      // Optimize for web display
      return coverUrl.replace('/upload/', '/upload/c_fill,w_1200,h_400,q_auto,f_auto/');
    }
    
    return coverUrl as string;
  },

  // Get thumbnail URL for avatar
  getAvatarThumbnailUrl: (avatarUrl: string | CloudinaryImage): string => {
    return profileService.getOptimizedAvatarUrl(avatarUrl, 'small');
  },

  // Get thumbnail URL for cover
  getCoverThumbnailUrl: (coverUrl: string | CloudinaryImage): string => {
    if (!coverUrl) return '';
    
    if (typeof coverUrl !== 'string' && coverUrl.secure_url) {
      return coverUrl.secure_url.replace('/upload/', '/upload/w_400,h_150,c_fill/');
    }
    
    if (typeof coverUrl === 'string' && coverUrl.includes('cloudinary.com')) {
      return coverUrl.replace('/upload/', '/upload/w_400,h_150,c_fill/');
    }
    
    return coverUrl as string;
  },

  // Check if URL is from Cloudinary
  isCloudinaryUrl: (url: string): boolean => {
    return url?.includes('cloudinary.com') || false;
  },

  // Extract public_id from Cloudinary URL
  extractPublicIdFromUrl: (url: string): string | null => {
    if (!url || !url.includes('cloudinary.com')) return null;
    
    try {
      const urlParts = url.split('/upload/');
      if (urlParts.length < 2) return null;
      
      const afterUpload = urlParts[1];
      const publicIdWithFormat = afterUpload.includes('/') 
        ? afterUpload.split('/')[1] 
        : afterUpload;
      
      return publicIdWithFormat.replace(/\.[^/.]+$/, '');
    } catch {
      return null;
    }
  },

  // ========== FILE VALIDATION ==========

  // Validate avatar file
  validateAvatarFile: (file: File): { valid: boolean; error?: string } => {
    return validateImageFile(file, 'avatar');
  },

  // Validate cover file
  validateCoverFile: (file: File): { valid: boolean; error?: string } => {
    return validateImageFile(file, 'cover');
  },

  // ========== HELPER FUNCTIONS ==========

  // Calculate profile strength
  calculateProfileStrength: (profile: Profile): number => {
    return profile.profileCompletion?.percentage || 0;
  },

  // Get user initials
  getInitials: (name: string): string => {
    if (!name) return 'US';

    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  // Format social link
  formatSocialLink: (platform: string, url: string): string => {
    if (!url) return '';

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }

    return url;
  },

  // Validate website URL
  validateWebsite: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  },

  // Validate phone number
  validatePhone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  // Get display role
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

  // Check if profile is complete
  isProfileComplete: (profile: Profile, threshold: number = 80): boolean => {
    return (profile.profileCompletion?.percentage || 0) >= threshold;
  },

  // Get missing profile fields
  getMissingFields: (profile: Profile): string[] => {
    const missing: string[] = [];

    if (!profile.avatar?.secure_url && !profile.user.avatar) missing.push('Profile picture');
    if (!profile.headline) missing.push('Headline');
    if (!profile.bio) missing.push('Bio');
    if (!profile.location) missing.push('Location');
    if (profile.roleSpecific.skills.length === 0) missing.push('Skills');

    const socialLinksCount = Object.values(profile.socialLinks).filter(link => link).length;
    if (socialLinksCount < 2) missing.push('Social links');

    return missing;
  },

  // Calculate total experience years
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

  // Format date
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Get proficiency label
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

  // Create safe profile (fallback)
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
      avatar: null,
      cover: null,
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

  // Format file size for display (reuse)
  formatFileSize: (bytes: number): string => {
    return formatFileSize(bytes);
  },

  // Get image dimensions from Cloudinary URL
  getImageDimensions: (url: string): { width: number; height: number } | null => {
    if (!url || !url.includes('cloudinary.com')) return null;
    
    try {
      // Extract from URL pattern like /w_300,h_300/
      const match = url.match(/w_(\d+),h_(\d+)/);
      if (match) {
        return { width: parseInt(match[1]), height: parseInt(match[2]) };
      }
    } catch {
      return null;
    }
    
    return null;
  },

  // Generate placeholder avatar URL
  getPlaceholderAvatar: (name: string): string => {
    const initials = profileService.getInitials(name);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=150`;
  },

  // ========== TEST UTILITIES ==========
  
  // Test file upload (debugging)
  testFileUpload: async (file: File, type: 'avatar' | 'cover' = 'avatar'): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append(type, file);
      formData.append('test', 'true');
      formData.append('timestamp', Date.now().toString());

      console.log('🧪 Testing file upload...', { type, file: file.name });
      debugFormData(formData, 'test upload');

      const response = await api.post(`/profile/test-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('✅ Test upload response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Test upload failed:', error);
      throw error;
    }
  },

  // Verify upload configuration
  verifyUploadConfig: async (): Promise<boolean> => {
    try {
      console.log('🔧 Verifying upload configuration...');
      
      // Test endpoint availability
      const healthResponse = await api.get('/health');
      console.log('🌡️ Health check:', healthResponse.data);
      
      // Test a small file upload
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      
      const testFormData = new FormData();
      testFormData.append('testFile', testFile);
      
      const testResponse = await api.post('/profile/test-upload', testFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('✅ Upload config verified:', testResponse.data);
      return true;
    } catch (error: any) {
      console.error('❌ Upload config verification failed:', error);
      return false;
    }
  }
};

export default profileService;