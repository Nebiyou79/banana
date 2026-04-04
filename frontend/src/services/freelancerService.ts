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
  mediaUrls: string[]; // Must be Cloudinary URLs
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
  mediaUrls: string[]; // Cloudinary URLs only
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
  isCloudinary?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProfileData {
  name?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
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
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  age?: number;
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
    socialLinks?: { // Add socialLinks here
      linkedin?: string;
      github?: string;
      twitter?: string;
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
    };
  };
  portfolio: PortfolioItem[];
  socialLinks?: { // Keep this for backward compatibility but will be deprecated
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
    total: number; // Cloudinary items only
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
  age?: number | null;
  gender?: string;
  portfolioCount: number;
}

export interface ServiceData {
  title: string;
  description: string;
  price: number;
  priceType: 'fixed' | 'hourly';
  deliveryTime: number;
  category?: string;
}

export interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  priceType: 'fixed' | 'hourly';
  deliveryTime: number;
  category?: string;
}

export interface UploadedFile {
  filename: string;
  originalName: string;
  url: string; // Cloudinary URL
  path: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  isCloudinary: boolean;
}

export interface AvatarUploadResponse {
  avatarUrl: string; // Cloudinary URL
  filename: string;
  size: number;
  path: string;
  profileCompletion?: number;
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
      console.log('🚀 Fetching dashboard overview...');
      const response = await api.get('/freelancer/dashboard/overview');

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

      // Transform items to ensure mediaUrls is always an array
      const items = response.data.data.items.map((item: any) => {
        // Handle both old and new data structures
        let mediaUrls: string[] = [];

        if (item.mediaUrls && Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0) {
          mediaUrls = item.mediaUrls;
        } else if (item.mediaUrl) {
          mediaUrls = [item.mediaUrl];
        }

        // Filter to only include Cloudinary URLs
        mediaUrls = mediaUrls.filter((url: string) => url && url.includes('cloudinary.com'));

        return {
          ...item,
          mediaUrls,
          isCloudinary: mediaUrls.length > 0
        };
      });

      // Filter out items with no Cloudinary URLs
      const validItems = items.filter((item: { mediaUrls: string | any[]; }) => item.mediaUrls.length > 0);

      console.log(`📊 Returning ${validItems.length} items with images`);

      return {
        items: validItems,
        pagination: response.data.data.pagination
      };
    } catch (error: any) {
      console.error('❌ Get portfolio error:', error);
      handleError(error, 'Failed to fetch portfolio');
      throw error;
    }
  },
  // Update the getPortfolioItem method in freelancerService.ts
  getPortfolioItem: async (id: string, token?: string): Promise<{
    item: PortfolioItem;
    related: PortfolioItem[];
  }> => {
    try {
      console.log('🔍 Fetching portfolio item:', id);

      if (!id || id === 'undefined') {
        throw new Error('Portfolio item ID is required');
      }

      // If token is provided (for SSR), use custom headers
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {};

      const response = await api.get(`/freelancer/portfolio/${id}`, config);

      console.log('✅ Portfolio item response:', {
        success: response.data.success,
        code: response.data.code,
        hasData: !!response.data.data
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch portfolio item';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      // Check if the response has the expected structure
      // Some APIs return { item, related } directly in data
      if (response.data.data && typeof response.data.data === 'object') {
        // Case 1: Response is { item, related }
        if ('item' in response.data.data) {
          const item = response.data.data.item;
          const transformedItem = {
            ...item,
            mediaUrls: item.mediaUrls || (item.mediaUrl ? [item.mediaUrl] : []),
            isCloudinary: true
          };

          return {
            item: transformedItem,
            related: response.data.data.related || []
          };
        }

        // Case 2: Response is just the portfolio item
        const transformedItem = {
          ...response.data.data,
          mediaUrls: response.data.data.mediaUrls ||
            (response.data.data.mediaUrl ? [response.data.data.mediaUrl] : []),
          isCloudinary: true
        };

        return {
          item: transformedItem,
          related: [] // No related items provided
        };
      }

      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('❌ Get portfolio item error:', error);

      if (error.response) {
        console.error('Server response:', error.response.data);
        handleError(error.response.data.message || 'Failed to fetch portfolio item');
      } else {
        handleError(error, 'Failed to fetch portfolio item');
      }

      throw error;
    }
  },

  addPortfolioItem: async (data: PortfolioFormData): Promise<{ item: PortfolioItem; profileCompletion: number }> => {
    try {
      console.log('➕ Adding portfolio item:', data.title);

      // Validate Cloudinary URLs
      const cloudinaryUrls = data.mediaUrls.filter(url => url && url.includes('cloudinary.com'));
      if (cloudinaryUrls.length === 0) {
        throw new Error('Please upload images to Cloudinary first');
      }

      // Send both mediaUrl (first image) and mediaUrls (all images)
      const transformedData = {
        title: data.title,
        description: data.description,
        mediaUrl: cloudinaryUrls[0], // First image for backward compatibility
        mediaUrls: cloudinaryUrls,    // All images
        projectUrl: data.projectUrl || '',
        category: data.category || '',
        technologies: data.technologies || [],
        budget: data.budget,
        budgetType: data.budgetType || 'fixed',
        duration: data.duration || '',
        client: data.client || '',
        completionDate: data.completionDate || '',
        featured: data.featured || false,
        visibility: data.visibility || 'public'
      };

      console.log('📦 Sending to backend:', {
        ...transformedData,
        mediaUrls: `${transformedData.mediaUrls.length} images`
      });

      const response = await api.post('/freelancer/portfolio', transformedData);

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to add portfolio item';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      // Ensure the response includes mediaUrls
      const responseItem = response.data.data;
      const formattedItem = {
        ...responseItem,
        mediaUrls: responseItem.mediaUrls || (responseItem.mediaUrl ? [responseItem.mediaUrl] : []),
        isCloudinary: true
      };

      console.log('✅ Portfolio item added with', formattedItem.mediaUrls.length, 'images');
      handleSuccess('Portfolio item added successfully');

      return {
        item: formattedItem,
        profileCompletion: response.data.profileCompletion
      };
    } catch (error: any) {
      console.error('❌ Add portfolio item error:', error);

      // Log the actual error response
      if (error.response) {
        console.error('Server response:', error.response.data);
        handleError(error.response.data.message || 'Failed to add portfolio item');
      } else {
        handleError(error, 'Failed to add portfolio item');
      }

      throw error;
    }
  },

  updatePortfolioItem: async (id: string, data: PortfolioFormData): Promise<PortfolioItem> => {
    try {
      console.log('✏️ Updating portfolio item:', id);

      // Validate Cloudinary URLs if provided
      let cloudinaryUrls: string[] = [];
      if (data.mediaUrls && data.mediaUrls.length > 0) {
        cloudinaryUrls = data.mediaUrls.filter(url => url && url.includes('cloudinary.com'));
        if (cloudinaryUrls.length === 0) {
          throw new Error('Please upload images to Cloudinary first');
        }
      }

      // Prepare update data
      const updateData: any = {
        title: data.title,
        description: data.description,
        projectUrl: data.projectUrl || '',
        category: data.category || '',
        technologies: data.technologies || [],
        budget: data.budget,
        budgetType: data.budgetType || 'fixed',
        duration: data.duration || '',
        client: data.client || '',
        completionDate: data.completionDate || '',
        featured: data.featured || false,
        visibility: data.visibility || 'public'
      };

      // Only update media if new ones were provided
      if (cloudinaryUrls.length > 0) {
        updateData.mediaUrl = cloudinaryUrls[0]; // First image for backward compatibility
        updateData.mediaUrls = cloudinaryUrls;    // All images
      }

      console.log('📦 Updating with:', {
        ...updateData,
        mediaUrls: updateData.mediaUrls ? `${updateData.mediaUrls.length} images` : 'unchanged'
      });

      const response = await api.put(`/freelancer/portfolio/${id}`, updateData);

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to update portfolio item';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      // Ensure the response includes mediaUrls
      const responseItem = response.data.data;
      const formattedItem = {
        ...responseItem,
        mediaUrls: responseItem.mediaUrls || (responseItem.mediaUrl ? [responseItem.mediaUrl] : []),
        isCloudinary: true
      };

      console.log('✅ Portfolio item updated with', formattedItem.mediaUrls.length, 'images');
      handleSuccess('Portfolio item updated successfully');

      return formattedItem;
    } catch (error: any) {
      console.error('❌ Update portfolio item error:', error);

      if (error.response) {
        console.error('Server response:', error.response.data);
        handleError(error.response.data.message || 'Failed to update portfolio item');
      } else {
        handleError(error, 'Failed to update portfolio item');
      }

      throw error;
    }
  },

  deletePortfolioItem: async (id: string): Promise<{ profileCompletion: number }> => {
    try {
      console.log('🗑️ Deleting portfolio item:', id);

      const response = await api.delete(`/freelancer/portfolio/${id}`);

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

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch profile';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      const profile = response.data.data;

      // Only include Cloudinary portfolio items
      if (profile.portfolio) {
        profile.portfolio = profile.portfolio
          .filter((item: any) =>
            item.mediaUrl?.includes('cloudinary.com') ||
            item.mediaUrls?.some((url: string) => url.includes('cloudinary.com'))
          )
          .map((item: any) => ({
            ...item,
            mediaUrls: item.mediaUrls || (item.mediaUrl ? [item.mediaUrl] : []),
            isCloudinary: true
          }));
      }

      // Only include Cloudinary avatar
      if (profile.avatar && !profile.avatar.includes('cloudinary.com')) {
        profile.avatar = '';
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

      const cleanedData = { ...data };

      if (cleanedData.bio && typeof cleanedData.bio === 'string') {
        cleanedData.bio = cleanedData.bio.substring(0, 1000);
      }

      if (cleanedData.skills && Array.isArray(cleanedData.skills)) {
        cleanedData.skills = cleanedData.skills.map(skill =>
          typeof skill === 'string' ? { name: skill, level: 'intermediate', yearsOfExperience: 1 } : skill
        );
      }

      if (cleanedData.socialLinks) {
        Object.keys(cleanedData.socialLinks).forEach(key => {
          if (!cleanedData.socialLinks![key as keyof typeof cleanedData.socialLinks] ||
            cleanedData.socialLinks![key as keyof typeof cleanedData.socialLinks]!.trim() === '') {
            (cleanedData.socialLinks as any)[key] = undefined;
          }
        });
      }

      const response = await api.put('/freelancer/profile', cleanedData);

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

      const profile = response.data.data;

      // Only include Cloudinary portfolio items
      if (profile.portfolio) {
        profile.portfolio = profile.portfolio
          .filter((item: any) =>
            item.mediaUrl?.includes('cloudinary.com') ||
            item.mediaUrls?.some((url: string) => url.includes('cloudinary.com'))
          )
          .map((item: any) => ({
            ...item,
            mediaUrls: item.mediaUrls || (item.mediaUrl ? [item.mediaUrl] : []),
            isCloudinary: true
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
  // Add these to freelancerService.ts

  // Get public freelancer profile
  getPublicProfile: async (userId: string): Promise<UserProfile> => {
    try {
      console.log('👤 Fetching public freelancer profile for:', userId);
      const response = await api.get(`/freelancer/public/${userId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch profile');
      }

      const profile = response.data.data;

      // Only include Cloudinary portfolio items
      if (profile.portfolio) {
        profile.portfolio = profile.portfolio
          .filter((item: any) =>
            item.mediaUrl?.includes('cloudinary.com') ||
            item.mediaUrls?.some((url: string) => url.includes('cloudinary.com'))
          )
          .map((item: any) => ({
            ...item,
            mediaUrls: item.mediaUrls || (item.mediaUrl ? [item.mediaUrl] : []),
            isCloudinary: true
          }));
      }

      return profile;
    } catch (error: any) {
      console.error('❌ Get public profile error:', error);
      handleError(error, 'Failed to fetch profile');
      throw error;
    }
  },

  // Get public portfolio items
  getPublicPortfolio: async (userId: string, params?: {
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
      console.log('📁 Fetching public portfolio for user:', userId, params);
      const response = await api.get(`/freelancer/public/${userId}/portfolio`, { params });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch portfolio');
      }

      // Transform items to ensure mediaUrls is always an array
      const items = response.data.data.items.map((item: any) => {
        let mediaUrls: string[] = [];

        if (item.mediaUrls && Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0) {
          mediaUrls = item.mediaUrls;
        } else if (item.mediaUrl) {
          mediaUrls = [item.mediaUrl];
        }

        // Filter to only include Cloudinary URLs
        mediaUrls = mediaUrls.filter((url: string) => url && url.includes('cloudinary.com'));

        return {
          ...item,
          mediaUrls,
          isCloudinary: mediaUrls.length > 0
        };
      });

      // Filter out items with no Cloudinary URLs
      const validItems = items.filter((item: { mediaUrls: string | any[]; }) => item.mediaUrls.length > 0);

      console.log(`📊 Returning ${validItems.length} items with images`);

      return {
        items: validItems,
        pagination: response.data.data.pagination
      };
    } catch (error: any) {
      console.error('❌ Get public portfolio error:', error);
      handleError(error, 'Failed to fetch portfolio');
      throw error;
    }
  },
  // File Uploads - CLOUDINARY ONLY - FIXED with fetch
  uploadPortfolioFiles: async (files: File[]): Promise<UploadedFile[]> => {
    try {
      console.log('📤 Uploading portfolio files to Cloudinary:', files.length);

      if (!files || files.length === 0) {
        throw new Error('No files provided');
      }

      const formData = new FormData();
      files.forEach(file => {
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 50MB.`);
        }
        // IMPORTANT: Use 'media' as field name to match cloudinaryMediaUpload.multiple
        formData.append('media', file);
      });

      console.log('📁 FormData entries:', Array.from(formData.entries()).map(e => e[0]));
      console.log('📁 Files being uploaded:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));

      // Get token from localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

      const response = await fetch(`${baseUrl}/api/v1/freelancer/upload/portfolio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Upload failed:', response.status, errorData);
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();

      console.log('✅ Portfolio files upload response:', {
        success: data.success,
        filesCount: data.data?.length,
        code: data.code
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to upload files');
      }

      // Log the actual data received
      console.log('📦 Upload response data:', JSON.stringify(data.data, null, 2));

      // Ensure we have valid Cloudinary URLs
      const uploadedFiles = data.data.map((file: any) => {
        const url = file.url || file.path || '';
        const isCloudinary = url.includes('cloudinary.com');

        if (!isCloudinary) {
          console.warn('⚠️ File does not have Cloudinary URL:', file);
        }

        return {
          filename: file.filename || `file-${Date.now()}`,
          originalName: file.originalName || file.originalname || 'unknown',
          url: url,
          path: file.path || url,
          size: file.size || 0,
          mimetype: file.mimetype || 'image/jpeg',
          uploadedAt: file.uploadedAt || new Date().toISOString(),
          isCloudinary: isCloudinary
        };
      });

      // Filter to only Cloudinary URLs
      const cloudinaryFiles = uploadedFiles.filter((f: { isCloudinary: any; }) => f.isCloudinary);

      if (cloudinaryFiles.length === 0) {
        console.error('❌ No Cloudinary URLs in response');
        throw new Error('Upload failed: No Cloudinary URLs received');
      }

      console.log('✅ Cloudinary URLs received:', cloudinaryFiles.map((f: { url: any; }) => f.url));
      handleSuccess(`Successfully uploaded ${cloudinaryFiles.length} file(s) to Cloudinary`);

      return cloudinaryFiles;
    } catch (error: any) {
      console.error('❌ Upload portfolio files error:', error);
      handleError(error, error.message || 'Failed to upload files to Cloudinary');
      throw error;
    }
  },

  uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
    try {
      console.log('📤 Uploading avatar to Cloudinary...');

      if (!file) {
        throw new Error('No file provided');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File is too large. Maximum size is 5MB.');
      }

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

      handleSuccess('Avatar uploaded successfully to Cloudinary');
      return {
        ...response.data.data,
        avatarUrl: response.data.data.avatarUrl // Cloudinary URL
      };
    } catch (error: any) {
      console.error('❌ Upload avatar error:', error);
      handleError(error, error.message || 'Failed to upload avatar');
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

  // Get optimized Cloudinary URL
  getOptimizedCloudinaryUrl: (url: string, width?: number, height?: number): string => {
    if (!url || !url.includes('cloudinary.com')) return url;

    try {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        let transformation = '';
        if (width && height) {
          transformation = `w_${width},h_${height},c_fill,g_auto,q_auto,f_auto/`;
        } else {
          transformation = 'q_auto,f_auto/';
        }
        return `${parts[0]}/upload/${transformation}${parts[1]}`;
      }
    } catch (e) {
      console.error('Error optimizing Cloudinary URL:', e);
    }
    return url;
  },

  // Check if URL is Cloudinary
  isCloudinaryUrl: (url: string): boolean => {
    return url?.includes('cloudinary.com') || false;
  },

  validateCloudinaryUrl: (url: string): boolean => {
    return url?.includes('cloudinary.com') || false;
  },

  validateDateOfBirth: (dateOfBirth: string): boolean => {
    if (!dateOfBirth) return true;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    return dob >= minDate && dob <= maxDate;
  },

  validateGender: (gender: string): boolean => {
    if (!gender) return true;
    const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
    return validGenders.includes(gender);
  }
};