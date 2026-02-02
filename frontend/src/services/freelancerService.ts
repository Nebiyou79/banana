/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';

export interface TenderFilters {
  page?: number;
  limit?: number;
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  skills?: string | string[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Tender {
  _id: string;
  title: string;
  description: string;
  category: string;
  skillsRequired: string[];
  budget: {
    min: number;
    max: number;
    currency: string;
    isNegotiable: boolean;
  };
  deadline: string;
  duration: number;
  visibility: 'public' | 'invite_only';
  status: 'draft' | 'published' | 'open' | 'completed' | 'cancelled';
  tenderType: 'company' | 'organization';
  company?: {
    _id: string;
    name: string;
    logo: string;
    industry: string;
    verified: boolean;
  };
  organization?: {
    _id: string;
    name: string;
    logo: string;
    industry: string;
    verified: boolean;
  };
  createdBy: string;
  proposals: any[];
  metadata: {
    savedBy: string[];
    views: number;
    proposalCount: number;
  };
  isSaved?: boolean;
  canSubmitProposal?: boolean;
  daysRemaining?: number;
  isOpen?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioFormData {
  title: string;
  description: string;
  mediaUrls: string[];
  projectUrl?: string;
  category?: string;
  technologies?: string[];
  budget?: number;
  budgetType?: 'fixed' | 'hourly' | 'daily' | 'monthly';
  duration?: string;
  client?: string;
  completionDate?: string;
  featured?: boolean;
  visibility?: 'public' | 'private';
}

export interface PortfolioItem {
  _id: string;
  title: string;
  description: string;
  mediaUrls: string[];
  projectUrl?: string;
  category?: string;
  technologies?: string[];
  budget?: number;
  budgetType?: 'fixed' | 'hourly' | 'daily' | 'monthly';
  duration?: string;
  client?: string;
  completionDate?: string;
  featured?: boolean;
  visibility?: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
}

export interface ProfileData {
  name: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  // NEW: Age and Gender fields
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'expert';
    yearsOfExperience: number;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    skills: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
  }>;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    tiktok?: string;
    telegram?: string;
    twitter?: string;
  };
  freelancerProfile?: {
    headline?: string;
    hourlyRate?: number;
    availability?: 'available' | 'not-available' | 'part-time';
    experienceLevel?: 'entry' | 'intermediate' | 'expert';
    englishProficiency?: 'basic' | 'conversational' | 'fluent' | 'native';
    timezone?: string;
    specialization?: string[];
    services?: ServiceData[];
  };
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'expert';
    yearsOfExperience: number;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    skills: string[];
  }>;
  education?: Array<{
    _id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
  }>;
  certifications?: Certification[];
  profileCompleted: boolean;
  verificationStatus: string;
  // NEW: Age and Gender fields
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  age?: number; // Virtual field calculated from dateOfBirth
  freelancerProfile?: {
    headline?: string;
    hourlyRate?: number;
    availability?: string;
    experienceLevel?: string;
    englishProficiency?: string;
    timezone?: string;
    specialization?: string[];
    services?: Service[];
    profileCompletion: number;
    totalEarnings: number;
    successRate: number;
    ratings: {
      average: number;
      count: number;
    };
    verified?: boolean;
    profileViews?: number;
  };
  portfolio: PortfolioItem[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    tiktok?: string;
    telegram?: string;
    twitter?: string;
  };
}

export interface DashboardStats {
  profile: {
    completion: number;
    views: number;
    verified: boolean;
  };
  portfolio: {
    total: number;
    featured: number;
  };
  skills: {
    total: number;
    categories: string[];
  };
  earnings: {
    total: number;
    successRate: number;
  };
  ratings: {
    average: number;
    count: number;
  };
  proposals: {
    sent: number;
    accepted: number;
    pending: number;
  };
  socialLinks?: {
    total: number;
  };
  // NEW: Age and gender stats
  demographics?: {
    age: number | null;
    gender: string;
  };
}

export interface FreelancerStats {
  profileStrength: number;
  jobSuccessScore: number;
  onTimeDelivery: number;
  responseRate: number;
  totalEarnings: number;
  totalJobs: number;
  activeProposals: number;
  profileViews: number;
  clientReviews: number;
  averageRating: number;
  // NEW: Age and gender
  age?: number | null;
  gender?: string;
}

export interface ServiceData {
  title: string;
  description: string;
  price: number;
  deliveryTime: number;
  category?: string;
}

export interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  deliveryTime: number;
  category?: string;
}

export interface UploadedFile {
  filename: string;
  originalName: string;
  url: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

export interface AvatarUploadResponse {
  avatarUrl: string;
  filename: string;
  size: number;
  path: string;
  profileCompletion?: number;
}

export interface Certification {
  _id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  skills?: string[];
}

export interface CertificationFormData {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  skills?: string[];
}

export interface UploadStats {
  freelancerStats: {
    portfolio: {
      files: number;
      size: string;
      sizeBytes: number;
    };
    avatars: {
      files: number;
      size: string;
      sizeBytes: number;
    };
  };
  totalStats: {
    files: number;
    size: string;
    sizeBytes: number;
  };
  environment: string;
  baseDirectory: string;
}

export const freelancerService = {
  // Dashboard Overview
  getDashboardOverview: async (): Promise<{
    stats: DashboardStats;
    recentActivities: any[];
    profileStrength: {
      score: number;
      strengths: string[];
      suggestions: string[];
    };
  }> => {
    try {
      console.log('🚀 Fetching dashboard overview...');
      const response = await api.get('/freelancer/dashboard/overview');

      console.log('📊 Dashboard response:', {
        success: response.data.success,
        data: response.data.data,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch dashboard data';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Dashboard overview error:', error);
      handleError(error, 'Failed to fetch dashboard data');
      throw error;
    }
  },

  // Professional Stats
  getFreelancerStats: async (): Promise<FreelancerStats> => {
    try {
      console.log('📈 Fetching freelancer stats...');
      const response = await api.get('/freelancer/stats');

      console.log('📊 Stats response:', {
        success: response.data.success,
        data: response.data.data,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch freelancer stats';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Get freelancer stats error:', error);
      handleError(error, 'Failed to fetch freelancer stats');
      throw error;
    }
  },

  // Portfolio Management
  getPortfolio: async (params?: {
    page?: number;
    limit?: number;
    featured?: boolean;
    category?: string;
  }): Promise<{
    items: PortfolioItem[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    try {
      console.log('📁 Fetching portfolio with params:', params);
      const response = await api.get('/freelancer/portfolio', { params });

      console.log('📁 Portfolio response:', {
        success: response.data.success,
        itemsCount: response.data.data?.items?.length,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch portfolio';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Get portfolio error:', error);
      handleError(error, 'Failed to fetch portfolio');
      throw error;
    }
  },

  addPortfolioItem: async (data: PortfolioFormData): Promise<{ item: PortfolioItem; profileCompletion: number }> => {
    try {
      console.log('➕ Adding portfolio item:', data.title);

      // Transform mediaUrls to mediaUrl for backend compatibility
      const transformedData = {
        ...data,
        mediaUrl: data.mediaUrls && data.mediaUrls.length > 0 ? data.mediaUrls[0] : '',
      };

      const response = await api.post('/freelancer/portfolio', transformedData);

      console.log('✅ Portfolio item added:', {
        success: response.data.success,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to add portfolio item';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      handleSuccess('Portfolio item added successfully');
      return {
        item: response.data.data,
        profileCompletion: response.data.profileCompletion
      };
    } catch (error: any) {
      console.error('❌ Add portfolio item error:', error);
      handleError(error, 'Failed to add portfolio item');
      throw error;
    }
  },

  updatePortfolioItem: async (id: string, data: PortfolioFormData): Promise<PortfolioItem> => {
    try {
      console.log('✏️ Updating portfolio item:', id);

      // Transform mediaUrls to mediaUrl for backend compatibility
      const transformedData = {
        ...data,
        mediaUrl: data.mediaUrls && data.mediaUrls.length > 0 ? data.mediaUrls[0] : '',
      };

      const response = await api.put(`/freelancer/portfolio/${id}`, transformedData);

      console.log('✅ Portfolio item updated:', {
        success: response.data.success,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to update portfolio item';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      handleSuccess('Portfolio item updated successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Update portfolio item error:', error);
      handleError(error, 'Failed to update portfolio item');
      throw error;
    }
  },

  deletePortfolioItem: async (id: string): Promise<{ profileCompletion: number }> => {
    try {
      console.log('🗑️ Deleting portfolio item:', id);

      const response = await api.delete(`/freelancer/portfolio/${id}`);

      console.log('✅ Portfolio item deleted:', {
        success: response.data.success,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to delete portfolio item';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      handleSuccess('Portfolio item deleted successfully');
      return {
        profileCompletion: response.data.profileCompletion
      };
    } catch (error: any) {
      console.error('❌ Delete portfolio item error:', error);
      handleError(error, 'Failed to delete portfolio item');
      throw error;
    }
  },

  // Profile Management
  getProfile: async (): Promise<UserProfile> => {
    try {
      console.log('👤 Fetching freelancer profile...');
      const response = await api.get('/freelancer/profile');

      console.log('📋 Profile response:', {
        success: response.data.success,
        hasData: !!response.data.data,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch profile';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      // Transform portfolio items to include mediaUrls
      const profile = response.data.data;
      if (profile.portfolio) {
        profile.portfolio = profile.portfolio.map((item: any) => ({
          ...item,
          mediaUrls: item.mediaUrl ? [item.mediaUrl] : []
        }));
      }

      return profile;
    } catch (error: any) {
      console.error('❌ Get profile error:', error);
      handleError(error, 'Failed to fetch profile');
      throw error;
    }
  },

  updateProfile: async (data: ProfileData): Promise<{ profile: UserProfile; profileCompletion: number }> => {
    try {
      console.log('🔄 Updating freelancer profile...');

      // Clean the data for backend
      const cleanedData = { ...data };

      // Handle bio field safely
      if (cleanedData.bio && typeof cleanedData.bio === 'string') {
        cleanedData.bio = cleanedData.bio.substring(0, 1000); // Limit to 1000 chars
      }

      // Transform skills array if needed
      if (cleanedData.skills && Array.isArray(cleanedData.skills)) {
        cleanedData.skills = cleanedData.skills.map(skill =>
          typeof skill === 'string' ? { name: skill, level: 'intermediate', yearsOfExperience: 1 } : skill
        );
      }

      // Clean social links (remove empty strings)
      if (cleanedData.socialLinks) {
        Object.keys(cleanedData.socialLinks).forEach(key => {
          if (!cleanedData.socialLinks![key as keyof typeof cleanedData.socialLinks] ||
            cleanedData.socialLinks![key as keyof typeof cleanedData.socialLinks]!.trim() === '') {
            (cleanedData.socialLinks as any)[key] = undefined;
          }
        });
      }

      const response = await api.put('/freelancer/profile', cleanedData);

      console.log('✅ Profile update response:', {
        success: response.data.success,
        profileCompletion: response.data.profileCompletion,
        code: response.data.code
      });

      if (!response.data.success) {
        if (response.data.errors) {
          response.data.errors.forEach((error: string) => {
            handleError(error);
          });
          throw new Error('Validation failed');
        }

        const errorMessage = response.data.message || 'Failed to update profile';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      // Transform portfolio items in response
      const profile = response.data.data;
      if (profile.portfolio) {
        profile.portfolio = profile.portfolio.map((item: any) => ({
          ...item,
          mediaUrls: item.mediaUrl ? [item.mediaUrl] : []
        }));
      }

      handleSuccess('Profile updated successfully');
      return {
        profile: profile,
        profileCompletion: response.data.profileCompletion
      };
    } catch (error: any) {
      console.error('❌ Update profile error:', error);

      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: string) => {
          handleError(err);
        });
      } else if (error.response?.data?.message) {
        handleError(error.response.data.message);
      } else {
        handleError(error, 'Failed to update profile');
      }

      throw error;
    }
  },

  // Services Management
  getServices: async (): Promise<Service[]> => {
    try {
      console.log('📋 Fetching services...');
      const response = await api.get('/freelancer/services');

      console.log('✅ Services response:', {
        success: response.data.success,
        count: response.data.data?.length,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch services';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Get services error:', error);
      handleError(error, 'Failed to fetch services');
      throw error;
    }
  },

  addService: async (data: ServiceData): Promise<Service> => {
    try {
      console.log('➕ Adding service:', data.title);

      const response = await api.post('/freelancer/services', data);

      console.log('✅ Service added:', {
        success: response.data.success,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to add service';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      handleSuccess('Service added successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Add service error:', error);
      handleError(error, 'Failed to add service');
      throw error;
    }
  },

  // File Uploads - UPDATED to match new controller
  uploadPortfolioFiles: async (files: File[]): Promise<UploadedFile[]> => {
    try {
      console.log('📤 Uploading portfolio files:', files.length);

      if (!files || files.length === 0) {
        throw new Error('No files provided');
      }

      const formData = new FormData();
      files.forEach(file => {
        // Validate file size (50MB max - matches backend)
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 50MB.`);
        }

        // Use the correct field name that matches backend
        formData.append('files', file);
      });

      console.log('📁 FormData entries:', Array.from(formData.entries()).length);

      const response = await api.post('/freelancer/upload/portfolio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 120 seconds for large files
      });

      console.log('✅ Portfolio files upload response:', {
        success: response.data.success,
        filesCount: response.data.data?.length,
        code: response.data.code
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload files');
      }

      handleSuccess('Files uploaded successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Upload portfolio files error:', error);
      handleError(error, error.message || 'Failed to upload files');
      throw error;
    }
  },

  uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
    try {
      console.log('📤 Uploading avatar...');

      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File is too large. Maximum size is 5MB.');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      }

      const formData = new FormData();
      formData.append('avatar', file);

      console.log('📁 Avatar FormData prepared');

      const response = await api.post('/freelancer/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      console.log('✅ Avatar upload response:', {
        success: response.data.success,
        profileCompletion: response.data.profileCompletion,
        code: response.data.code
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload avatar');
      }

      handleSuccess('Avatar uploaded successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Upload avatar error:', error);
      handleError(error, error.message || 'Failed to upload avatar');
      throw error;
    }
  },

  // Public Profile
  getPublicProfile: async (usernameOrId: string): Promise<any> => {
    try {
      console.log('🌐 Fetching public profile for:', usernameOrId);

      const response = await api.get(`/freelancer/public/${usernameOrId}`);

      console.log('✅ Public profile response:', {
        success: response.data.success,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch public profile';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      // Transform portfolio items
      const profile = response.data.data;
      if (profile.user?.portfolio) {
        profile.user.portfolio = profile.user.portfolio.map((item: any) => ({
          ...item,
          mediaUrls: item.mediaUrl ? [item.mediaUrl] : []
        }));
      }

      return profile;
    } catch (error: any) {
      console.error('❌ Get public profile error:', error);
      handleError(error, 'Failed to fetch public profile');
      throw error;
    }
  },

  // Tender Management
  getTenders: async (filters: TenderFilters = {}): Promise<{
    data: Tender[];
    pagination: {
      page: number;
      pages: number;
      total: number;
      limit: number;
    };
  }> => {
    try {
      console.log('📋 Fetching tenders with filters:', filters);

      const response = await api.get('/freelancer/tenders', { params: filters });

      console.log('✅ Tenders response:', {
        success: response.data.success,
        count: response.data.data?.length,
        pagination: response.data.pagination,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch tenders';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error: any) {
      console.error('❌ Get tenders error:', error);
      handleError(error, 'Failed to fetch tenders');
      throw error;
    }
  },

  getTenderDetails: async (id: string): Promise<Tender> => {
    try {
      console.log('🔍 Fetching tender details:', id);

      if (!id || id === 'undefined') {
        throw new Error('Tender ID is required');
      }

      const response = await api.get(`/freelancer/tenders/${id}`);

      console.log('✅ Tender details response:', {
        success: response.data.success,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch tender details';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Get tender details error:', error);
      handleError(error, 'Failed to fetch tender details');
      throw error;
    }
  },

  toggleSaveTender: async (id: string): Promise<{ saved: boolean; totalSaves: number; tenderId: string }> => {
    try {
      console.log('💾 Toggling save for tender:', id);

      if (!id || id === 'undefined') {
        throw new Error('Tender ID is required');
      }

      const response = await api.post(`/freelancer/tenders/${id}/save`);

      console.log('✅ Save tender response:', {
        success: response.data.success,
        saved: response.data.data?.saved,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to save tender';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      const message = response.data.data.saved
        ? 'Tender saved successfully'
        : 'Tender removed from saved list';
      handleSuccess(message);

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Toggle save tender error:', error);
      handleError(error, 'Failed to save tender');
      throw error;
    }
  },

  getSavedTenders: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    data: Tender[];
    pagination: {
      page: number;
      pages: number;
      total: number;
      limit: number;
    };
  }> => {
    try {
      console.log('📚 Fetching saved tenders with params:', params);

      const response = await api.get('/freelancer/tenders/saved/all', { params });

      console.log('✅ Saved tenders response:', {
        success: response.data.success,
        count: response.data.data?.length,
        pagination: response.data.pagination,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch saved tenders';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error: any) {
      console.error('❌ Get saved tenders error:', error);
      handleError(error, 'Failed to fetch saved tenders');
      throw error;
    }
  },

  // Certification Management
  getCertifications: async (): Promise<Certification[]> => {
    try {
      console.log('📜 Fetching certifications...');

      const response = await api.get('/freelancer/certifications');

      console.log('✅ Certifications response:', {
        success: response.data.success,
        count: response.data.data?.length,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch certifications';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Get certifications error:', error);
      handleError(error, 'Failed to fetch certifications');
      throw error;
    }
  },

  addCertification: async (data: CertificationFormData): Promise<{ certification: Certification; profileCompletion: number }> => {
    try {
      console.log('➕ Adding certification:', data.name);

      const response = await api.post('/freelancer/certifications', data);

      console.log('✅ Certification added:', {
        success: response.data.success,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to add certification';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      handleSuccess('Certification added successfully');
      return {
        certification: response.data.data,
        profileCompletion: response.data.profileCompletion
      };
    } catch (error: any) {
      console.error('❌ Add certification error:', error);
      handleError(error, 'Failed to add certification');
      throw error;
    }
  },

  updateCertification: async (id: string, data: CertificationFormData): Promise<{ certification: Certification; profileCompletion: number }> => {
    try {
      console.log('✏️ Updating certification:', id);

      const response = await api.put(`/freelancer/certifications/${id}`, data);

      console.log('✅ Certification updated:', {
        success: response.data.success,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to update certification';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      handleSuccess('Certification updated successfully');
      return {
        certification: response.data.data,
        profileCompletion: response.data.profileCompletion
      };
    } catch (error: any) {
      console.error('❌ Update certification error:', error);
      handleError(error, 'Failed to update certification');
      throw error;
    }
  },

  deleteCertification: async (id: string): Promise<{ profileCompletion: number }> => {
    try {
      console.log('🗑️ Deleting certification:', id);

      const response = await api.delete(`/freelancer/certifications/${id}`);

      console.log('✅ Certification deleted:', {
        success: response.data.success,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to delete certification';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      handleSuccess('Certification deleted successfully');
      return {
        profileCompletion: response.data.profileCompletion
      };
    } catch (error: any) {
      console.error('❌ Delete certification error:', error);
      handleError(error, 'Failed to delete certification');
      throw error;
    }
  },

  // Upload Statistics
  getUploadStats: async (): Promise<UploadStats> => {
    try {
      console.log('📊 Fetching upload statistics...');

      const response = await api.get('/freelancer/stats/uploads');

      console.log('✅ Upload stats response:', {
        success: response.data.success,
        code: response.data.code
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch upload statistics';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Get upload stats error:', error);
      handleError(error, 'Failed to fetch upload statistics');
      throw error;
    }
  },

  // Helper functions
  calculateAge: (dateOfBirth: string): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  },

  getFullMediaUrl: (url: string): string => {
    if (!url) return '';

    if (url.startsWith('http')) return url;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

    if (url.startsWith('/')) {
      return `${backendUrl}${url}`;
    } else if (url.startsWith('uploads/') || url.startsWith('avatars/') || url.startsWith('portfolio/')) {
      return `${backendUrl}/${url}`;
    } else {
      return `${backendUrl}/uploads/${url}`;
    }
  },

  validateDateOfBirth: (dateOfBirth: string): boolean => {
    if (!dateOfBirth) return true; // Optional field

    const dob = new Date(dateOfBirth);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());

    return dob >= minDate && dob <= maxDate;
  },

  validateGender: (gender: string): boolean => {
    if (!gender) return true; // Optional field

    const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
    return validGenders.includes(gender);
  }
};