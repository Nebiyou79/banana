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
  freelancerProfile?: {
    headline?: string;
    hourlyRate?: number;
    availability?: string;
    experienceLevel?: string;
    englishProficiency?: string;
    timezone?: string;
    specialization?: string[];
    profileCompletion: number;
    totalEarnings: number;
    successRate: number;
    ratings: {
      average: number;
      count: number;
    };
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
  size: number;
  mimetype: string;
  uploadedAt: string;
}

export interface AvatarUploadResponse {
  avatarUrl: string;
  filename: string;
  size: number;
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
      const response = await api.get('/freelancer/dashboard/overview');
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch dashboard data';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Dashboard overview error:', error);
      handleError(error, 'Failed to fetch dashboard data');
      return Promise.reject(error);
    }
  },

  // Professional Stats (Like Upwork/Fiverr)
  getFreelancerStats: async (): Promise<FreelancerStats> => {
    try {
      const response = await api.get('/freelancer/stats');
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch freelancer stats';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get freelancer stats error:', error);
      handleError(error, 'Failed to fetch freelancer stats');
      return Promise.reject(error);
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
      const response = await api.get('/freelancer/portfolio', { params });
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch portfolio';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get portfolio error:', error);
      handleError(error, 'Failed to fetch portfolio');
      return Promise.reject(error);
    }
  },

  addPortfolioItem: async (data: PortfolioFormData): Promise<{ item: PortfolioItem; profileCompletion: number }> => {
    try {
      const response = await api.post('/freelancer/portfolio', data);
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to add portfolio item';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      handleSuccess('Portfolio item added successfully');
      return {
        item: response.data.data,
        profileCompletion: response.data.profileCompletion
      };
    } catch (error: any) {
      console.error('Add portfolio item error:', error);
      handleError(error, 'Failed to add portfolio item');
      return Promise.reject(error);
    }
  },

  updatePortfolioItem: async (id: string, data: PortfolioFormData): Promise<PortfolioItem> => {
    try {
      const response = await api.put(`/freelancer/portfolio/${id}`, data);
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to update portfolio item';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      handleSuccess('Portfolio item updated successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('Update portfolio item error:', error);
      handleError(error, 'Failed to update portfolio item');
      return Promise.reject(error);
    }
  },

  deletePortfolioItem: async (id: string): Promise<{ profileCompletion: number }> => {
    try {
      const response = await api.delete(`/freelancer/portfolio/${id}`);
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to delete portfolio item';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      handleSuccess('Portfolio item deleted successfully');
      return {
        profileCompletion: response.data.profileCompletion
      };
    } catch (error: any) {
      console.error('Delete portfolio item error:', error);
      handleError(error, 'Failed to delete portfolio item');
      return Promise.reject(error);
    }
  },

  // Profile Management
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await api.get('/freelancer/profile');
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch profile';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get profile error:', error);
      handleError(error, 'Failed to fetch profile');
      return Promise.reject(error);
    }
  },

 updateProfile: async (data: ProfileData): Promise<{ profile: UserProfile; profileCompletion: number }> => {
    try {
      const response = await api.put('/freelancer/profile', data);
      
      if (!response.data.success) {
        // Handle validation errors from backend
        if (response.data.errors) {
          response.data.errors.forEach((error: string) => {
            handleError(error);
          });
          return Promise.reject(new Error('Validation failed'));
        }
        
        const errorMessage = response.data.message || 'Failed to update profile';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      handleSuccess('Profile updated successfully');
      return {
        profile: response.data.data,
        profileCompletion: response.data.profileCompletion
      };
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      // Handle axios error with validation messages
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: string) => {
          handleError(err);
        });
      } else if (error.response?.data?.message) {
        handleError(error.response.data.message);
      } else {
        handleError(error, 'Failed to update profile');
      }
      
      return Promise.reject(error);
    }
  },

  // Services Management
  getServices: async (): Promise<Service[]> => {
    try {
      const response = await api.get('/freelancer/services');
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch services';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get services error:', error);
      handleError(error, 'Failed to fetch services');
      return Promise.reject(error);
    }
  },

  addService: async (data: ServiceData): Promise<Service> => {
    try {
      const response = await api.post('/freelancer/services', data);
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to add service';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      handleSuccess('Service added successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('Add service error:', error);
      handleError(error, 'Failed to add service');
      return Promise.reject(error);
    }
  },

  // File Uploads - COMPLETELY FIXED
  uploadPortfolioFiles: async (files: File[]): Promise<UploadedFile[]> => {
    try {
      // Validate files
      if (!files || files.length === 0) {
        throw new Error('No files provided');
      }

      const formData = new FormData();
      files.forEach(file => {
        // Validate file size (10MB max - matches backend)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }
        
        // FIX: Use 'files' instead of 'portfolioFiles' to match backend
        formData.append('files', file);
      });

      const response = await api.post('/freelancer/upload/portfolio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for larger files
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload files');
      }
      
      handleSuccess('Files uploaded successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('Upload portfolio files error:', error);
      handleError(error, error.message || 'Failed to upload files');
      return Promise.reject(error);
    }
  },

  uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File is too large. Maximum size is 2MB.');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      }

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/freelancer/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload avatar');
      }
      
      handleSuccess('Avatar uploaded successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      handleError(error, error.message || 'Failed to upload avatar');
      return Promise.reject(error);
    }
  },

  // Public Profile
  getPublicProfile: async (usernameOrId: string): Promise<any> => {
    try {
      const response = await api.get(`/freelancer/public/${usernameOrId}`);
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch public profile';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get public profile error:', error);
      handleError(error, 'Failed to fetch public profile');
      return Promise.reject(error);
    }
  },
 // Tender Management
  getTenders: async (filters: TenderFilters = {}): Promise<{
    data: Tender[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    try {
      const response = await api.get('/freelancer/tenders', { params: filters });
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch tenders';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      return {
        data: response.data.data,
        pagination: {
          current: response.data.pagination.page,
          pages: response.data.pagination.pages,
          total: response.data.pagination.total,
          hasNext: response.data.pagination.page < response.data.pagination.pages,
          hasPrev: response.data.pagination.page > 1
        }
      };
    } catch (error: any) {
      console.error('Get tenders error:', error);
      handleError(error, 'Failed to fetch tenders');
      return Promise.reject(error);
    }
  },

  getTenderDetails: async (id: string): Promise<Tender> => {
    try {
      if (!id || id === 'undefined') {
        throw new Error('Tender ID is required');
      }

      const response = await api.get(`/freelancer/tenders/${id}`);
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch tender details';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get tender details error:', error);
      handleError(error, 'Failed to fetch tender details');
      return Promise.reject(error);
    }
  },

  toggleSaveTender: async (id: string): Promise<{ saved: boolean; totalSaves: number }> => {
    try {
      if (!id || id === 'undefined') {
        throw new Error('Tender ID is required');
      }

      const response = await api.post(`/freelancer/tenders/${id}/save`);
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to save tender';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      const message = response.data.data.saved 
        ? 'Tender saved successfully' 
        : 'Tender removed from saved list';
      handleSuccess(message);
      
      return response.data.data;
    } catch (error: any) {
      console.error('Toggle save tender error:', error);
      handleError(error, 'Failed to save tender');
      return Promise.reject(error);
    }
  },

  getSavedTenders: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    data: Tender[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    try {
      const response = await api.get('/freelancer/tenders/saved/all', { params });
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch saved tenders';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      return {
        data: response.data.data,
        pagination: {
          current: response.data.pagination.page,
          pages: response.data.pagination.pages,
          total: response.data.pagination.total,
          hasNext: response.data.pagination.page < response.data.pagination.pages,
          hasPrev: response.data.pagination.page > 1
        }
      };
    } catch (error: any) {
      console.error('Get saved tenders error:', error);
      handleError(error, 'Failed to fetch saved tenders');
      return Promise.reject(error);
    }
  },
   getCertifications: async (): Promise<Certification[]> => {
    try {
      const response = await api.get('/freelancer/certifications');
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch certifications';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get certifications error:', error);
      handleError(error, 'Failed to fetch certifications');
      return Promise.reject(error);
    }
  },

  addCertification: async (data: CertificationFormData): Promise<{ certification: Certification; profileCompletion: number }> => {
    try {
      const response = await api.post('/freelancer/certifications', data);
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to add certification';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      handleSuccess('Certification added successfully');
      return {
        certification: response.data.data,
        profileCompletion: response.data.profileCompletion
      };
    } catch (error: any) {
      console.error('Add certification error:', error);
      handleError(error, 'Failed to add certification');
      return Promise.reject(error);
    }
  },

  updateCertification: async (id: string, data: CertificationFormData): Promise<{ certification: Certification; profileCompletion: number }> => {
    try {
      const response = await api.put(`/freelancer/certifications/${id}`, data);
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to update certification';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      handleSuccess('Certification updated successfully');
      return {
        certification: response.data.data,
        profileCompletion: response.data.profileCompletion
      };
    } catch (error: any) {
      console.error('Update certification error:', error);
      handleError(error, 'Failed to update certification');
      return Promise.reject(error);
    }
  },

  deleteCertification: async (id: string): Promise<{ profileCompletion: number }> => {
    try {
      const response = await api.delete(`/freelancer/certifications/${id}`);
      
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to delete certification';
        handleError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      handleSuccess('Certification deleted successfully');
      return {
        profileCompletion: response.data.profileCompletion
      };
    } catch (error: any) {
      console.error('Delete certification error:', error);
      handleError(error, 'Failed to delete certification');
      return Promise.reject(error);
    }
  },
};