/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/candidateService.ts (UPDATED FOR LOCAL STORAGE CVs)
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
// Add this interface in candidateService.ts
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

// REMOVED: CloudinaryData interface - not needed for local storage CVs

export interface CV {
  // Local storage fields
  _id: string;
  fileName: string;
  originalName: string;
  fileUrl: string;           // URL for viewing (e.g., /uploads/cv/filename.pdf)
  downloadUrl: string;       // URL for downloading (e.g., /uploads/download/cv/filename.pdf)

  // File metadata
  size: number;
  uploadedAt: string;
  isPrimary: boolean;
  mimetype: string;
  fileExtension: string;
  description?: string;

  // Statistics
  downloadCount?: number;
  viewCount?: number;

  // Legacy/backward compatibility fields
  path?: string;             // Server file path (not exposed to frontend)
  url?: string;              // Alias for fileUrl
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
  avatar?: string;           // Still uses Cloudinary for images
  avatarPublicId?: string;
  coverPhoto?: string;       // Still uses Cloudinary for images
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
export const MAX_CV_SIZE_MB = 100; // Increased from 50MB to match backend
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

// UPDATED: Process CV data from backend response - uses local storage format
export const processCVResponse = (cvData: any): CV => {
  // Use downloadUrl and fileUrl from backend
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

    // Legacy/backward compatibility
    path: cvData.path,
    url: fileUrl
  };
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

  // UPDATED: Upload CVs with local storage
  uploadCVs: async (files: File[], description?: string): Promise<CV[]> => {
    try {
      console.log(`Starting CV upload for ${files.length} file(s)...`);

      // Validate files first
      const validation = candidateService.validateCVFiles(files);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Create FormData - NOTE: Changed from 'files' to 'cv' field to match middleware
      const formData = new FormData();

      // Add single file with field name 'cv' (matches localFileUpload.cv() middleware)
      // The middleware expects a single file with field name 'cv'
      if (files.length > 0) {
        formData.append('cv', files[0]);
        console.log(`Added file: ${files[0].name} (${files[0].size} bytes)`);
      }

      // Add description if provided
      if (description) {
        formData.append('description', description);
      }

      console.log('Uploading file to server (local storage)...');

      // Upload file
      const response = await api.post<UploadCVResponse>('/candidate/cv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes for large files
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

      if (!response.data.data?.cv) {
        throw new Error('No CV returned from server');
      }

      // Process CV
      const uploadedCV = processCVResponse(response.data.data.cv);

      // Show success message
      toast({
        title: 'Success',
        description: 'CV uploaded successfully',
        variant: 'default',
      });

      return [uploadedCV];

    } catch (error: any) {
      console.error('Failed to upload CV:', error);

      let errorMessage = 'Failed to upload CV';

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
  // Add this method to the candidateService object
  uploadMultipleCVs: async (files: File[], descriptions?: string[]): Promise<CV[]> => {
    try {
      console.log(`Starting multiple CV upload for ${files.length} file(s)...`);

      // Validate files first
      const validation = candidateService.validateCVFiles(files);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Create FormData for multiple files
      const formData = new FormData();

      // Add multiple files with field name 'cvs' (matches middleware)
      files.forEach((file, index) => {
        formData.append('cvs', file); // Field name 'cvs' for multiple files
        console.log(`Added file ${index + 1}: ${file.name} (${file.size} bytes)`);
      });

      // Add descriptions if provided
      if (descriptions && descriptions.length > 0) {
        descriptions.forEach((desc, index) => {
          if (desc) {
            formData.append(`descriptions[${index}]`, desc);
          }
        });
      }

      console.log('Uploading multiple files to server...');

      // Upload files to the new endpoint
      const response = await api.post<MultipleUploadResponse>('/candidate/cvs/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes for large files
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      });

      console.log('Server response for multiple upload:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed');
      }

      if (!response.data.data?.cvs || response.data.data.cvs.length === 0) {
        throw new Error('No CVs returned from server');
      }

      // Process uploaded CVs
      const uploadedCVs = response.data.data.cvs.map(processCVResponse);

      // Show success message
      let message = `Successfully uploaded ${uploadedCVs.length} CV(s)`;
      if (response.data.data.errors && response.data.data.errors.length > 0) {
        message += ` (${response.data.data.errors.length} failed)`;
      }

      toast({
        title: 'Success',
        description: message,
        variant: 'default',
      });

      // Show individual errors if any
      if (response.data.data.errors && response.data.data.errors.length > 0) {
        response.data.data.errors.forEach(error => {
          toast({
            title: 'Upload Warning',
            description: `${error.fileName}: ${error.error}`,
            variant: 'warning',
          });
        });
      }

      return uploadedCVs;

    } catch (error: any) {
      console.error('Failed to upload multiple CVs:', error);

      let errorMessage = 'Failed to upload CVs';
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Files might be too large or server is busy.';
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
  // UPDATED: Upload single CV (convenience method)
  uploadSingleCV: async (file: File, description?: string): Promise<CV> => {
    const cvs = await candidateService.uploadCVs([file], description);
    return cvs[0];
  },

  // Get all CVs
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

  // Get single CV
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

  // UPDATED: View CV - opens file URL directly
  viewCV: async (cvId: string): Promise<void> => {
    try {
      const cv = await candidateService.getCV(cvId);
      const viewUrl = cv.fileUrl || cv.url;

      if (!viewUrl) {
        throw new Error('No view URL available');
      }

      // Ensure URL is absolute
      let absoluteUrl = viewUrl;
      if (viewUrl.startsWith('/')) {
        // Make it absolute by adding the backend base URL
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
        absoluteUrl = `${backendUrl}${viewUrl}`;
      }

      window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      console.error('Failed to view CV:', error);
      const errorMessage = error.response?.data?.message || 'Failed to view CV';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    }
  },

  // UPDATED: Download CV - triggers download via backend endpoint
  downloadCV: async (cvId: string, filename?: string): Promise<void> => {
    try {
      const cv = await candidateService.getCV(cvId);
      const downloadUrl = cv.downloadUrl;

      if (!downloadUrl) {
        throw new Error('No download URL available');
      }

      // Ensure URL is absolute
      let absoluteUrl = downloadUrl;
      if (downloadUrl.startsWith('/')) {
        // Make it absolute by adding the backend base URL
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
        absoluteUrl = `${backendUrl}${downloadUrl}`;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = absoluteUrl;
      link.download = filename || cv.originalName || 'cv';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Download Started',
        description: `${cv.originalName || 'CV'} is downloading`,
        variant: 'default',
      });

    } catch (error: any) {
      console.error('Failed to download CV:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to download CV';
      toast({
        title: 'Download Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    }
  },

  // UPDATED: Get CV download URL - returns the downloadUrl from CV object
  getCVDownloadUrl: (cv: CV): string => {
    if (!cv) return '';

    // Return download URL from CV object
    let downloadUrl = cv.downloadUrl || '';

    // Make it absolute if it's relative
    if (downloadUrl && downloadUrl.startsWith('/')) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      downloadUrl = `${backendUrl}${downloadUrl}`;
    }

    return downloadUrl;
  },

  // UPDATED: Get CV preview URL - returns fileUrl for viewing
  getCVPreviewUrl: (cv: CV): string => {
    if (!cv) return '';

    // Return file URL from CV object
    let fileUrl = cv.fileUrl || cv.url || '';

    // Make it absolute if it's relative
    if (fileUrl && fileUrl.startsWith('/')) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      fileUrl = `${backendUrl}${fileUrl}`;
    }

    return fileUrl;
  },

  // Set primary CV
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

  // Delete CV
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

  // UPDATED: Get CV thumbnail URL - returns document icon since CVs are now local files
  getCVThumbnailUrl: (cv: CV): string => {
    if (!cv) return '/images/document-icon.png';

    // For local storage CVs, we return a generic document icon
    // You can customize this based on file extension if needed
    return '/images/document-icon.png';
  },

  // UPDATED: Get formatted file size
  getCVFileSize: (cv: CV): string => {
    if (cv.size) {
      return formatFileSize(cv.size);
    }

    return 'Unknown size';
  },

  // UPDATED: Get file extension
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

  // REMOVED: hasCloudinaryData - not needed for local storage
  // REMOVED: getCloudinaryPublicId - not needed for local storage

  // Get jobs for candidate
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

  // Save job
  saveJob: async (jobId: string): Promise<{ saved: boolean }> => {
    try {
      const response = await api.post<{
        message: string;
        success: boolean;
        data: { saved: boolean }
      }>(`/candidate/job/${jobId}/save`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to save job');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to save job:', error);
      throw new Error(error.response?.data?.message || 'Failed to save job');
    }
  },

  // Unsave job
  unsaveJob: async (jobId: string): Promise<{ saved: boolean }> => {
    try {
      const response = await api.post<{
        message: string;
        success: boolean;
        data: { saved: boolean }
      }>(`/candidate/job/${jobId}/unsave`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to unsave job');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to unsave job:', error);
      throw new Error(error.response?.data?.message || 'Failed to unsave job');
    }
  },

  // Get saved jobs
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

  // Validate files before upload
  validateCVFiles: (files: File[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!files || files.length === 0) {
      errors.push('No files selected');
      return { valid: false, errors };
    }

    // Check total number of files (now only 1 allowed at a time with localFileUpload)
    if (files.length > 1) {
      errors.push('Please upload one CV at a time');
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

  // UPDATED: Get CV metadata for display
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

  // NEW: Helper to check if CV URL is valid
  isCVUrlValid: (cv: CV): boolean => {
    return !!(cv.downloadUrl || cv.fileUrl);
  },

  // NEW: Get CV icon based on file extension
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