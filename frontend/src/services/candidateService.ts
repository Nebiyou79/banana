/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/candidateService.ts (FIXED - includes blob download pattern)
import api from '@/lib/axios';
import { toast } from '@/hooks/use-toast';

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
  skills: string[];
}

export interface MultipleUploadResponse {
  success: boolean;
  message: string;
  data: {
    cvs: CV[];
    totalCVs: number;
    primaryCVId?: string;
    errors?: Array<{ fileName: string; error: string }>;
  };
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  tiktok?: string;
  telegram?: string;
}

export interface CV {
  _id: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  downloadUrl: string;
  size: number;
  uploadedAt: string;
  isPrimary: boolean;
  mimetype: string;
  fileExtension: string;
  description?: string;
  downloadCount?: number;
  viewCount?: number;
  path?: string;
  url?: string;
}

export interface CandidateProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  verificationStatus: 'none' | 'partial' | 'full';
  profileCompleted: boolean;
  skills: string[];
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  cvs: CV[];
  portfolio: Array<{
    title: string;
    description?: string;
    url?: string;
    image?: string;
    skills: string[];
  }>;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  socialLinks?: SocialLinks;
  lastLogin?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  age?: number;
  avatar?: string;
  avatarPublicId?: string;
  coverPhoto?: string;
  coverPhotoPublicId?: string;
}

export interface UploadCVResponse {
  success: boolean;
  message: string;
  data: {
    cv: {
      _id: string;
      fileName: string;
      originalName: string;
      size: number;
      uploadedAt: string;
      isPrimary: boolean;
      mimetype: string;
      fileExtension: string;
      description?: string;
      fileUrl: string;
      downloadUrl: string;
    };
    totalCVs: number;
    primaryCVId?: string;
  };
}

export interface CVListResponse {
  message: string;
  success: boolean;
  data: {
    cvs: CV[];
    count: number;
    primaryCV?: CV;
  };
}

export interface JobFilters {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  category?: string;
  type?: string;
  experienceLevel?: string;
  minSalary?: number;
  maxSalary?: number;
  remote?: string;
}

export interface JobsResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// File validation constants
export const ALLOWED_CV_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'text/plain',
  'application/rtf'
];

export const ALLOWED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf'];
export const MAX_CV_SIZE_MB = 100;
export const MAX_CV_SIZE_BYTES = MAX_CV_SIZE_MB * 1024 * 1024;
export const MAX_CVS_PER_USER = 10;

// Helper function to validate MongoDB ObjectId
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// File validation
export const validateCVFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type by MIME
  if (!ALLOWED_CV_MIME_TYPES.includes(file.type)) {
    const fileExtension = `.${file.name.toLowerCase().split('.').pop()}`;
    if (!ALLOWED_CV_EXTENSIONS.includes(fileExtension)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${ALLOWED_CV_EXTENSIONS.join(', ')}`
      };
    }
  }

  // Check file size
  if (file.size > MAX_CV_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_CV_SIZE_MB}MB`
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

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Extract file extension from filename
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE';
};

// Process CV data from backend response
export const processCVResponse = (cvData: any): CV => {
  const downloadUrl = cvData.downloadUrl || '';
  const fileUrl = cvData.fileUrl || cvData.url || '';

  return {
    _id: cvData._id,
    fileName: cvData.fileName || cvData.originalName,
    originalName: cvData.originalName || 'Unknown',
    fileUrl: fileUrl,
    downloadUrl: downloadUrl,
    size: cvData.size || 0,
    uploadedAt: cvData.uploadedAt,
    isPrimary: cvData.isPrimary || false,
    mimetype: cvData.mimetype || 'application/octet-stream',
    fileExtension: cvData.fileExtension || getFileExtension(cvData.originalName || '').toLowerCase(),
    description: cvData.description,
    downloadCount: cvData.downloadCount || 0,
    viewCount: cvData.viewCount || 0,
    path: cvData.path,
    url: fileUrl
  };
};

// ============ UNIVERSAL DOWNLOAD PATTERN FOR CVS ============
const downloadCVBlob = async (cvId: string, filename?: string): Promise<void> => {
  try {
    const endpoint = `/candidate/cv/${cvId}/download`;

    const response = await api.get(endpoint, {
      responseType: 'blob',
      timeout: 120000,
    });

    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    });

    // Get filename from Content-Disposition header or use provided filename
    let finalFilename = filename || `cv-${cvId}`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^'";]*)['"]?/i);
      if (filenameMatch && filenameMatch[1]) {
        finalFilename = decodeURIComponent(filenameMatch[1]);
      }
    }

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
  } catch (error) {
    console.error('❌ Error downloading CV:', error);
    throw error;
  }
};

// ============ UNIVERSAL VIEW PATTERN FOR CVS ============
const viewCVBlob = async (cvId: string): Promise<void> => {
  try {
    const endpoint = `/candidate/cv/${cvId}/view`;

    const response = await api.get(endpoint, {
      responseType: 'blob',
      timeout: 60000,
    });

    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/pdf',
    });

    const blobUrl = window.URL.createObjectURL(blob);
    const tab = window.open(blobUrl, '_blank', 'noopener,noreferrer');

    if (!tab) {
      // Fallback if popup blocked
      window.location.href = blobUrl;
    }

    // Clean up
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
  } catch (error) {
    console.error('❌ Error viewing CV:', error);
    throw error;
  }
};

export const candidateService = {
  // Get candidate profile
  getProfile: async (): Promise<CandidateProfile> => {
    try {
      const response = await api.get<{
        message: string;
        success: boolean;
        data: { user: CandidateProfile }
      }>('/candidate/profile');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch profile');
      }

      const user = response.data.data.user;
      if (user.cvs) {
        user.cvs = user.cvs.map(processCVResponse);
      }

      return user;
    } catch (error: any) {
      console.error('Failed to fetch candidate profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load profile';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    }
  },

  // Update candidate profile
  updateProfile: async (data: Partial<CandidateProfile>): Promise<CandidateProfile> => {
    try {
      const response = await api.put<{
        message: string;
        success: boolean;
        data: { user: CandidateProfile }
      }>('/candidate/profile', data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update profile');
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'default',
      });

      const user = response.data.data.user;
      if (user.cvs) {
        user.cvs = user.cvs.map(processCVResponse);
      }

      return user;
    } catch (error: any) {
      console.error('Failed to update candidate profile:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.errors?.join(', ') ||
        'Server error during profile update';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    }
  },

  /**
   * @desc Upload CVs (single or multiple)
   */
  uploadCVs: async (files: File[], description?: string): Promise<CV[]> => {
    try {
      console.log(`Starting CV upload for ${files.length} file(s)...`);

      // Validate files first
      const validation = candidateService.validateCVFiles(files);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Create FormData
      const formData = new FormData();

      if (files.length === 1) {
        // Single file upload - use 'cv' field
        formData.append('cv', files[0]);
        console.log(`Added file: ${files[0].name} (${files[0].size} bytes)`);
      } else {
        // Multiple file upload - use 'cvs' field
        files.forEach((file) => {
          formData.append('cvs', file);
          console.log(`Added file: ${file.name} (${file.size} bytes)`);
        });
      }

      if (description) {
        formData.append('description', description);
      }

      console.log('Uploading file(s) to server...');

      // Determine which endpoint to use
      const endpoint = files.length === 1 ? '/candidate/cv' : '/candidate/cvs/multiple';

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      });

      console.log('Server response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed');
      }

      // Handle response based on endpoint
      let uploadedCVs: CV[] = [];

      if (files.length === 1) {
        if (!response.data.data?.cv) {
          throw new Error('No CV returned from server');
        }
        uploadedCVs = [processCVResponse(response.data.data.cv)];
      } else {
        if (!response.data.data?.cvs || response.data.data.cvs.length === 0) {
          throw new Error('No CVs returned from server');
        }
        uploadedCVs = response.data.data.cvs.map(processCVResponse);
      }

      toast({
        title: 'Success',
        description: `${uploadedCVs.length} CV(s) uploaded successfully`,
        variant: 'default',
      });

      return uploadedCVs;

    } catch (error: any) {
      console.error('Failed to upload CV(s):', error);

      let errorMessage = 'Failed to upload CV(s)';
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. File might be too large or server is busy.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        if (Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.join(', ');
        } else {
          errorMessage = JSON.stringify(error.response.data.errors);
        }
      }

      toast({
        title: 'Upload Error',
        description: errorMessage,
        variant: 'destructive',
      });

      throw new Error(errorMessage);
    }
  },

  /**
   * @desc Upload single CV (convenience method - FIXED)
   */
  uploadSingleCV: async (file: File, description?: string): Promise<CV> => {
    const cvs = await candidateService.uploadCVs([file], description);
    return cvs[0];
  },

  /**
   * @desc Get all CVs
   */
  getAllCVs: async (): Promise<{ cvs: CV[]; count: number; primaryCV?: CV }> => {
    try {
      const response = await api.get<CVListResponse>('/candidate/cvs');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch CVs');
      }

      const processedCVs = response.data.data.cvs.map(processCVResponse);
      const processedPrimaryCV = response.data.data.primaryCV ?
        processCVResponse(response.data.data.primaryCV) : undefined;

      return {
        cvs: processedCVs,
        count: processedCVs.length,
        primaryCV: processedPrimaryCV
      };
    } catch (error: any) {
      console.error('Failed to fetch CVs:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load CVs';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    }
  },

  /**
   * @desc Get single CV
   */
  getCV: async (cvId: string): Promise<CV> => {
    try {
      if (!isValidObjectId(cvId)) {
        throw new Error('Invalid CV ID format');
      }

      const response = await api.get<{
        success: boolean;
        message?: string;
        data: CV;
      }>(`/candidate/cv/${cvId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch CV');
      }

      return processCVResponse(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch CV:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load CV';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    }
  },

  /**
   * @desc View CV - uses blob pattern
   */
  viewCV: async (cvId: string): Promise<void> => {
    try {
      await viewCVBlob(cvId);

      toast({
        title: 'Viewing CV',
        description: 'Opening CV in new tab',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Failed to view CV:', error);

      let errorMessage = 'Failed to view CV';
      if (error.response?.status === 401) {
        errorMessage = 'Please log in to view CV';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view this CV';
      } else if (error.response?.status === 404) {
        errorMessage = 'CV not found';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  },

  /**
   * @desc Download CV - uses blob pattern
   */
  downloadCV: async (cvId: string, filename?: string): Promise<void> => {
    try {
      await downloadCVBlob(cvId, filename);

      toast({
        title: 'Download Started',
        description: 'CV is downloading',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Failed to download CV:', error);

      let errorMessage = 'Failed to download CV';
      if (error.response?.status === 401) {
        errorMessage = 'Please log in to download CV';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to download this CV';
      } else if (error.response?.status === 404) {
        errorMessage = 'CV not found';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Download Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  },

  /**
   * @desc Get CV download URL
   */
  getCVDownloadUrl: (cv: CV): string => {
    if (!cv) return '';

    let downloadUrl = cv.downloadUrl || '';
    if (downloadUrl && downloadUrl.startsWith('/')) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');
      downloadUrl = `${backendUrl}${downloadUrl}`;
    }

    return downloadUrl;
  },

  /**
   * @desc Get CV preview URL
   */
  getCVPreviewUrl: (cv: CV): string => {
    if (!cv) return '';

    let fileUrl = cv.fileUrl || cv.url || '';
    if (fileUrl && fileUrl.startsWith('/')) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');
      fileUrl = `${backendUrl}${fileUrl}`;
    }

    return fileUrl;
  },

  /**
   * @desc Set primary CV
   */
  setPrimaryCV: async (cvId: string): Promise<{ primaryCVId: string }> => {
    try {
      if (!isValidObjectId(cvId)) {
        throw new Error('Invalid CV ID format');
      }

      const response = await api.patch<{
        success: boolean;
        message: string;
        data: {
          primaryCVId: string;
        };
      }>(`/candidate/cv/${cvId}/primary`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to set primary CV');
      }

      toast({
        title: 'Success',
        description: 'Primary CV updated successfully',
        variant: 'default',
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to set primary CV:', error);

      let errorMessage = 'Failed to set primary CV';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      throw new Error(errorMessage);
    }
  },

  /**
   * @desc Delete CV
   */
  deleteCV: async (cvId: string): Promise<{
    deletedCVId: string;
    newPrimaryCVId?: string;
    remainingCVs: number;
  }> => {
    try {
      if (!isValidObjectId(cvId)) {
        throw new Error('Invalid CV ID format');
      }

      const response = await api.delete<{
        success: boolean;
        message: string;
        data: {
          deletedCVId: string;
          newPrimaryCVId?: string;
          remainingCVs: number;
        };
      }>(`/candidate/cv/${cvId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete CV');
      }

      toast({
        title: 'Success',
        description: 'CV deleted successfully',
        variant: 'default',
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to delete CV:', error);

      let errorMessage = 'Failed to delete CV';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(', ');
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      throw new Error(errorMessage);
    }
  },

  /**
   * @desc Get CV thumbnail URL
   */
  getCVThumbnailUrl: (cv: CV): string => {
    if (!cv) return '/images/document-icon.png';
    return '/images/document-icon.png';
  },

  /**
   * @desc Get CV file size
   */
  getCVFileSize: (cv: CV): string => {
    if (cv.size) {
      return formatFileSize(cv.size);
    }
    return 'Unknown size';
  },

  /**
   * @desc Get CV file extension
   */
  getCVFileExtension: (cv: CV): string => {
    if (cv.fileExtension) {
      return cv.fileExtension.toUpperCase();
    }
    if (cv.originalName) {
      return getFileExtension(cv.originalName);
    }
    if (cv.mimetype) {
      const type = cv.mimetype.split('/').pop();
      if (type) return type.toUpperCase();
    }
    return 'PDF';
  },

  /**
   * @desc Get jobs for candidate
   */
  getJobs: async (params?: JobFilters): Promise<JobsResponse> => {
    try {
      const response = await api.get<{
        message: string;
        success: boolean;
        data: any[];
        pagination: any
      }>('/candidate/jobs', { params });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch jobs');
      }

      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error: any) {
      console.error('Failed to fetch jobs:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch jobs');
    }
  },

  /**
   * @desc Get public candidate profile
   */
  getPublicCandidateProfile: async (userId: string): Promise<CandidateProfile> => {
    try {
      const response = await api.get<{
        message: string;
        success: boolean;
        data: { user: CandidateProfile }
      }>(`/candidate/public/${userId}`);

      if (!response.data.success) {
        console.warn('Public candidate endpoint returned error, using fallback');
        return candidateService.createFallbackProfile(userId);
      }

      const user = response.data.data.user;
      if (user.cvs) {
        user.cvs = user.cvs.map(processCVResponse);
      }

      return user;
    } catch (error: any) {
      console.warn('Failed to fetch public candidate profile:', error.message);
      return candidateService.createFallbackProfile(userId);
    }
  },

  /**
   * @desc Create fallback profile
   */
  createFallbackProfile: (userId?: string): CandidateProfile => {
    return {
      _id: userId || 'temp-id',
      name: 'User',
      email: '',
      role: 'candidate',
      verificationStatus: 'none',
      profileCompleted: false,
      skills: [],
      education: [],
      experience: [],
      certifications: [],
      cvs: [],
      portfolio: [],
      bio: '',
      location: '',
      phone: '',
      website: '',
      socialLinks: {},
      lastLogin: new Date().toISOString(),
      dateOfBirth: '',
      gender: 'prefer-not-to-say',
      age: 0,
      avatar: '',
      avatarPublicId: '',
      coverPhoto: '',
      coverPhotoPublicId: ''
    };
  },

  /**
   * @desc Save job
   */
  saveJob: async (jobId: string): Promise<{ saved: boolean }> => {
    try {
      const response = await api.post<{
        message: string;
        success: boolean;
        data: { saved: boolean }
      }>(`/candidate/job/${jobId}/save`);

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to save job';
        if (errorMessage.toLowerCase().includes('already saved')) {
          return { saved: true };
        }
        throw new Error(errorMessage);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to save job:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save job';
      if (errorMessage.toLowerCase().includes('already saved')) {
        return { saved: true };
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * @desc Unsave job
   */
  unsaveJob: async (jobId: string): Promise<{ saved: boolean }> => {
    try {
      const response = await api.post<{
        message: string;
        success: boolean;
        data: { saved: boolean }
      }>(`/candidate/job/${jobId}/unsave`);

      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to unsave job';
        if (errorMessage.toLowerCase().includes('not saved') || 
            errorMessage.toLowerCase().includes('not found')) {
          return { saved: false };
        }
        throw new Error(errorMessage);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to unsave job:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to unsave job';
      if (errorMessage.toLowerCase().includes('not saved') || 
          errorMessage.toLowerCase().includes('not found')) {
        return { saved: false };
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * @desc Get saved jobs
   */
  getSavedJobs: async (): Promise<any[]> => {
    try {
      const response = await api.get<{
        message: string;
        success: boolean;
        data: any[]
      }>('/candidate/jobs/saved');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch saved jobs');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch saved jobs:', error);
      return [];
    }
  },

  /**
   * @desc Validate files before upload
   */
  validateCVFiles: (files: File[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!files || files.length === 0) {
      errors.push('No files selected');
      return { valid: false, errors };
    }

    // Check total number of files (max 10)
    if (files.length > 10) {
      errors.push('Maximum 10 files allowed per upload');
    }

    // Validate each file
    files.forEach((file, index) => {
      const validation = validateCVFile(file);
      if (!validation.valid && validation.error) {
        errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * @desc Get CV metadata for display
   */
  getCVMetadata: (cv: CV): {
    name: string;
    size: string;
    type: string;
    uploaded: string;
    isPrimary: boolean;
    downloadCount: number;
    viewCount: number;
  } => {
    return {
      name: cv.originalName || 'Unknown',
      size: candidateService.getCVFileSize(cv),
      type: candidateService.getCVFileExtension(cv),
      uploaded: new Date(cv.uploadedAt).toLocaleDateString(),
      isPrimary: cv.isPrimary || false,
      downloadCount: cv.downloadCount || 0,
      viewCount: cv.viewCount || 0
    };
  },

  /**
   * @desc Check if CV URL is valid
   */
  isCVUrlValid: (cv: CV): boolean => {
    return !!(cv.downloadUrl || cv.fileUrl);
  },

  /**
   * @desc Get CV icon based on file extension
   */
  getCVIcon: (cv: CV): string => {
    const extension = cv.fileExtension?.toLowerCase() || '';

    switch (extension) {
      case 'pdf':
        return '/images/pdf-icon.png';
      case 'doc':
      case 'docx':
        return '/images/word-icon.png';
      case 'txt':
        return '/images/text-icon.png';
      default:
        return '/images/document-icon.png';
    }
  }
};