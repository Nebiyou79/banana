/* eslint-disable @typescript-eslint/no-explicit-any */
// services/applicationService.ts - UPDATED TO MATCH BACKEND EXPECTATIONS
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';
import { candidateService } from './candidateService';

export interface PremiumUISettings {
  glassmorphism: boolean;
  accentColor: 'gold' | 'platinum' | 'sapphire';
  animations: 'parallax' | 'fade' | 'both';
  shadowIntensity: 'soft' | 'medium' | 'strong';
}

export const defaultUISettings: PremiumUISettings = {
  glassmorphism: true,
  accentColor: 'gold',
  animations: 'both',
  shadowIntensity: 'soft'
};

// Premium styling utilities
export const premiumStyles = {
  glass: {
    background: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
  },
  shadows: {
    soft: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
    medium: '0 8px 30px 0 rgba(0, 0, 0, 0.08)',
    strong: '0 12px 40px 0 rgba(0, 0, 0, 0.12)'
  },
  gradients: {
    gold: 'linear-gradient(135deg, #FFD700 0%, #FFEC8B 100%)',
    platinum: 'linear-gradient(135deg, #E5E4E2 0%, #F5F5F5 100%)',
    sapphire: 'linear-gradient(135deg, #0F52BA 0%, #7EC8E3 100%)'
  },
  animations: {
    fadeIn: 'fadeIn 0.6s ease-out',
    slideUp: 'slideUp 0.8s ease-out',
    parallax: 'parallax 20s linear infinite'
  }
};

// Reuse your existing interfaces
export interface Attachment {
  _id?: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  url: string;
  uploadedAt: string;
  description?: string;
  downloadUrl?: string;
  viewUrl?: string;
  // Local upload metadata
  fileUrl?: string;
  downloadCount?: number;
  viewCount?: number;
}

export interface CandidateCV {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  uploadedAt: string;
  size?: number;
  mimetype?: string;
  path?: string;
  isDefault?: boolean;
  description?: string;
  downloadUrl?: string;
  viewUrl?: string;
  // Local upload metadata
  fileUrl?: string;
}

export interface CV {
  _id: string;
  filename: string;
  originalName: string;
  path?: string;
  size: number;
  mimetype: string;
  url: string;
  uploadedAt: string;
  isDefault?: boolean;
  description?: string;
  downloadUrl?: string;
  viewUrl?: string;
  // Local upload metadata
  fileUrl?: string;
}

export interface Reference {
  _id?: string;
  document?: Attachment;
  name?: string;
  position?: string;
  company?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  allowsContact?: boolean;
  notes?: string;
  providedAsDocument: boolean;
}

export interface WorkExperience {
  _id?: string;
  document?: Attachment;
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  skills?: string[];
  supervisor?: {
    name: string;
    position: string;
    contact: string;
  };
  providedAsDocument: boolean;
  // Support multiple documents per experience
  documents?: Attachment[];
}

export interface ContactInfo {
  email: string;
  phone?: string;
  telegram?: string;
  location?: string;
}

export interface UserInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
  };
}

export interface InterviewDetails {
  date: string;
  time: string;
  location: string;
  type: 'phone' | 'video' | 'in-person' | 'technical';
  interviewer: string;
  notes: string;
  duration?: number;
}

export interface StatusHistory {
  _id: string;
  status: string;
  changedBy: {
    _id: string;
    name: string;
    email: string;
  };
  changedAt: string;
  message?: string;
  interviewDetails?: InterviewDetails;
}

export interface CompanyResponse {
  status: 'active-consideration' | 'on-hold' | 'rejected' | 'selected-for-interview' | null;
  message?: string;
  interviewLocation?: string;
  interviewDate?: string;
  interviewTime?: string;
  respondedAt?: string;
  respondedBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface Application {
  _id: string;
  job: {
    location: any;
    _id: string;
    title: string;
    description?: string;
    company?: {
      _id: string;
      name: string;
      logoUrl?: string;
      verified: boolean;
      industry?: string;
    };
    organization?: {
      _id: string;
      name: string;
      logoUrl?: string;
      verified: boolean;
      industry?: string;
      organizationType?: string;
    };
    jobType: 'company' | 'organization';
  };
  candidate: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
    location?: string;
  };
  userInfo: UserInfo;
  selectedCVs: Array<{
    cvId: string;
    filename: string;
    originalName: string;
    url: string;
    downloadUrl?: string;
    viewUrl?: string;
    size?: number;
    mimetype?: string;
  }>;
  coverLetter: string;
  skills: string[];
  references: Reference[];
  workExperience: WorkExperience[];
  contactInfo: ContactInfo;
  attachments: {
    referenceDocuments: Attachment[];
    experienceDocuments: Attachment[];
    portfolioFiles: Attachment[];
    otherDocuments: Attachment[];
  };
  status: string;
  statusHistory: StatusHistory[];
  companyResponse?: CompanyResponse;
  createdAt: string;
  updatedAt: string;
}

// New response interfaces for the updated routes
export interface ApplicationResponse {
  success: boolean;
  message: string;
  data: {
    application: Application;
  };
}

export interface ApplicationsListResponse {
  success: boolean;
  data: Application[];
  pagination: {
    current: number;
    totalPages: number;
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface ApplicationStats {
  totalApplications?: number;
  newApplications?: number;
  underReview?: number;
  shortlisted?: number;
  interviewScheduled?: number;
  rejected?: number;
  hired?: number;
  jobsPosted?: number;
  successRate?: string;
}

export interface StatisticsResponse {
  success: boolean;
  data: {
    statistics: ApplicationStats;
  };
}

export interface ApplyForJobData {
  coverLetter: string;
  skills: string[];
  references: Reference[];
  workExperience: WorkExperience[];
  contactInfo: ContactInfo;
  selectedCVs: Array<{
    cvId: string;
    filename?: string;
    originalName?: string;
    url?: string;
  }>;
  userInfo?: UserInfo;
}

export interface UpdateStatusData {
  status: string;
  message?: string;
  interviewDetails?: {
    date: string;
    location: string;
    type: string;
    interviewer: string;
    notes?: string;
  };
}

export interface CompanyResponseData {
  status: string;
  message?: string;
  interviewLocation?: string;
}

export interface ApplicationFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  jobId?: string;
}

// Enhanced debug logger
const debug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [ApplicationService] ${message}`, data || '');
  }
};

const error = (message: string, error?: any) => {
  console.error(`❌ [ApplicationService] ${message}`, error || '');
};

const handleApiError = (error: any, defaultMessage: string): never => {
  console.error('🔴 API Error Details:', {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    headers: error.response?.headers,
    config: {
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data
    }
  });

  // Log the full response data
  if (error.response?.data) {
    console.error('🔴 Full Server Response:', JSON.stringify(error.response.data, null, 2));
  }

  if (error.response?.data?.message) {
    const message = error.response.data.message;
    console.error('🔴 Server Error Message:', message);
    handleError(message);
    throw new Error(message);
  } else if (error.response?.data?.errors) {
    const validationErrors = error.response.data.errors;
    console.error('🔴 Validation Errors:', validationErrors);
    const errorMessages = validationErrors.map((err: any) => {
      if (typeof err === 'string') return err;
      if (err.msg) return err.msg;
      if (err.message) return err.message;
      if (err.path) return `${err.path}: ${err.message}`;
      return JSON.stringify(err);
    });
    const combinedMessage = errorMessages.join(', ');
    handleError(combinedMessage);
    throw new Error(combinedMessage);
  } else if (error.message) {
    console.error('🔴 Error Message:', error.message);
    handleError(error.message);
    throw error;
  } else {
    console.error('🔴 Default Error:', defaultMessage);
    handleError(defaultMessage);
    throw new Error(defaultMessage);
  }
};

// Clean filters to remove empty values
const cleanFilters = (filters?: ApplicationFilters): ApplicationFilters => {
  if (!filters) return {};

  const cleaned: ApplicationFilters = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined && value !== 'all') {
      cleaned[key as keyof ApplicationFilters] = value;
    }
  });

  return cleaned;
};

// Utility function to convert Mongoose documents to plain objects
const convertMongooseDocToPlainObject = (doc: any): any => {
  if (!doc) return doc;

  // If it's a Mongoose document, convert to plain object
  if (doc._doc && typeof doc._doc === 'object') {
    return { ...doc._doc };
  }

  // If it has toObject method, use it
  if (typeof doc.toObject === 'function') {
    return doc.toObject();
  }

  // Otherwise return as is
  return doc;
};

// Local upload helper functions
const isLocalUploadUrl = (url: string): boolean => {
  return url?.includes('/uploads/') || url?.includes('/api/v1/uploads/');
};

// FIXED: Enhanced file field name detection to match backend expectations
const getFileFieldName = (file: File, context?: {
  type: 'cv' | 'reference' | 'experience';
  index?: number;
}): string => {
  const fileName = file.name.toLowerCase();

  console.log('📁 [Frontend] Detecting field name for file:', file.name, {
    fileName,
    context
  });

  // Check if this is a CV file - backend expects 'cv' field name
  if (context?.type === 'cv') {
    return 'cv';
  }

  // Check if this is a reference document - backend expects 'referencePdfs' field name
  if (context?.type === 'reference' ||
    fileName.includes('reference') ||
    fileName.includes('recommendation') ||
    fileName.includes('letter') ||
    fileName.includes('ref-') ||
    fileName.includes('rec-') ||
    fileName.includes('reference_') ||
    fileName.includes('rec_')) {
    return 'referencePdfs'; // BACKEND EXPECTS THIS FIELD NAME
  }

  // Check if this is an experience document - backend expects 'experiencePdfs' field name
  if (context?.type === 'experience' ||
    fileName.includes('experience') ||
    fileName.includes('work') ||
    fileName.includes('employment') ||
    fileName.includes('exp-') ||
    fileName.includes('job-') ||
    fileName.includes('employment-') ||
    fileName.includes('experience_') ||
    fileName.includes('work_')) {
    return 'experiencePdfs'; // BACKEND EXPECTS THIS FIELD NAME
  }

  // Default: assume it's an experience document
  return 'experiencePdfs';
};

// Enhanced debug function for FormData
const debugFormData = (formData: FormData) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [ApplicationService] FormData contents:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File - ${value.name} (${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  ${key}:`, typeof value === 'string' ? value.substring(0, 100) + '...' : value);
      }
    }
  }
};

// Helper function to extract file extension
const getFileExtension = (file: any): string => {
  if (file.mimetype) {
    const ext = file.mimetype.split('/')[1];
    if (ext) return ext;
  }

  if (file.filename) {
    const ext = file.filename.split('.').pop();
    if (ext && ext.length < 6) return ext;
  }

  if (file.originalName) {
    const ext = file.originalName.split('.').pop();
    if (ext && ext.length < 6) return ext;
  }

  return 'file';
};

// Enhanced getCandidateCVs with proper local upload handling
const getCandidateCVs = async (): Promise<CV[]> => {
  try {
    debug('🔄 Attempting to fetch CVs from applications endpoint...');

    // First try the applications endpoint
    const response = await api.get('/applications/my-cvs');

    if (!response.data.success) {
      throw new Error('Failed to fetch CVs from applications endpoint');
    }

    const cvsData = response.data.data?.cvs || [];
    debug('✅ Loaded CVs from applications endpoint:', cvsData.length);

    // Ensure all CVs have proper file metadata
    const enhancedCVs = cvsData.map((cv: any) => {
      // Convert Mongoose document if needed
      const plainCV = convertMongooseDocToPlainObject(cv);

      return {
        _id: plainCV._id,
        filename: plainCV.filename,
        originalName: plainCV.originalName || plainCV.filename,
        path: plainCV.path || plainCV.url || plainCV.fileUrl,
        size: plainCV.size || 0,
        mimetype: plainCV.mimetype || 'application/octet-stream',
        url: plainCV.url || plainCV.fileUrl,
        uploadedAt: plainCV.uploadedAt,
        isDefault: plainCV.isDefault || plainCV.isPrimary || false,
        description: plainCV.description,
        downloadUrl: plainCV.downloadUrl || plainCV.url || plainCV.fileUrl,
        viewUrl: plainCV.viewUrl || plainCV.url || plainCV.fileUrl,
        fileUrl: plainCV.fileUrl || plainCV.url
      };
    });

    return enhancedCVs;
  } catch (error: any) {
    debug('⚠️ Applications endpoint failed, falling back to candidate service...', error.message);

    // Fallback to candidate service
    try {
      const profile = await candidateService.getProfile();
      debug('✅ Candidate profile loaded for CV fallback');

      if (!profile.cvs || profile.cvs.length === 0) {
        debug('⚠️ No CVs found in candidate profile');
        return [];
      }

      // Transform the CV data to match the CV interface
      const cvs = profile.cvs.map((cv: any) => {
        const plainCV = convertMongooseDocToPlainObject(cv);

        return {
          _id: plainCV._id,
          filename: plainCV.filename,
          originalName: plainCV.originalName || plainCV.filename,
          path: plainCV.path || plainCV.url || plainCV.fileUrl,
          size: plainCV.size || 0,
          mimetype: plainCV.mimetype || 'application/octet-stream',
          url: plainCV.url || plainCV.fileUrl,
          uploadedAt: plainCV.uploadedAt,
          isDefault: plainCV.isDefault || plainCV.isPrimary || false,
          description: plainCV.description,
          downloadUrl: plainCV.downloadUrl || plainCV.url || plainCV.fileUrl,
          viewUrl: plainCV.viewUrl || plainCV.url || plainCV.fileUrl,
          fileUrl: plainCV.fileUrl || plainCV.url
        };
      });

      debug('✅ Loaded CVs from candidate profile fallback:', cvs.length);
      return cvs;
    } catch (fallbackError: any) {
      debug('❌ Both CV fetch methods failed:', fallbackError.message);

      // Provide specific error messages based on the failure
      if (fallbackError.message.includes('network') || fallbackError.message.includes('Network')) {
        throw new Error('Network error: Unable to fetch CVs. Please check your connection.');
      } else if (fallbackError.message.includes('401') || fallbackError.message.includes('403')) {
        throw new Error('Authentication error: Please log in again to access your CVs.');
      } else {
        throw new Error('Unable to load your CVs. Please try again later.');
      }
    }
  }
};

// Enhanced file size formatting
const getFileSize = (file: Attachment | CV): string => {
  // Convert Mongoose document first
  const plainFile = convertMongooseDocToPlainObject(file);

  // Handle various file size scenarios
  const bytes = plainFile.size;

  if (bytes === undefined || bytes === null) {
    debug('⚠️ No file size available for file:', plainFile);
    return 'Unknown size';
  }

  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// FIXED: Enhanced file URL generation for local uploads
const getCorrectFileUrl = (file: any, type: 'cv' | 'references' | 'experience' | 'applications'): string => {
  const plainFile = convertMongooseDocToPlainObject(file);

  console.log('🔗 File URL generation details:', {
    type,
    filename: plainFile.filename,
    originalName: plainFile.originalName,
    _id: plainFile._id,
    url: plainFile.url,
    fileUrl: plainFile.fileUrl,
    path: plainFile.path,
  });

  // Strategy 1: Use fileUrl (local upload metadata)
  if (plainFile.fileUrl) {
    console.log('✅ Using fileUrl from local upload:', plainFile.fileUrl);
    return plainFile.fileUrl;
  }

  // Strategy 2: Use url (legacy field)
  if (plainFile.url) {
    console.log('✅ Using url field:', plainFile.url);
    return plainFile.url;
  }

  // Strategy 3: For application attachments, use the uploads endpoint
  if (type === 'applications' || type === 'references' || type === 'experience') {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const cleanBackendUrl = backendUrl.replace(/\/+$/, '');
    const url = `${cleanBackendUrl}/api/v1/uploads/applications/${plainFile.filename}`;
    console.log('✅ Using applications upload URL:', url);
    return url;
  }

  // Strategy 4: Use filename with proper type-based path
  if (plainFile.filename) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const cleanBackendUrl = backendUrl.replace(/\/+$/, '');
    const url = `${cleanBackendUrl}/api/v1/uploads/${type}/${plainFile.filename}`;
    console.log('✅ Using filename URL:', url);
    return url;
  }

  console.log('❌ No valid file identifiers found:', plainFile);
  throw new Error('Unable to generate download URL: No filename, path, URL, or fileUrl available');
};

// Enhanced file download URL function
const getEnhancedFileDownloadUrl = (file: Attachment | CV | any, type: 'cv' | 'references' | 'experience' | 'applications'): string => {
  try {
    const plainFile = convertMongooseDocToPlainObject(file);
    return getCorrectFileUrl(plainFile, type);
  } catch (error) {
    console.error('❌ Error generating file URL:', error);
    throw error;
  }
};

// Enhanced downloadFile function with proper error handling and local upload support
const downloadFile = async (file: Attachment | CV | any, type: 'cv' | 'references' | 'experience' | 'applications'): Promise<void> => {
  try {
    // Convert Mongoose document to plain object first
    const plainFile = convertMongooseDocToPlainObject(file);

    debug('📥 Starting download process for file:', {
      type,
      filename: plainFile.originalName || plainFile.filename,
      fileData: {
        _id: plainFile._id,
        filename: plainFile.filename,
        originalName: plainFile.originalName,
        url: plainFile.url,
        fileUrl: plainFile.fileUrl,
        path: plainFile.path,
        size: plainFile.size,
        mimetype: plainFile.mimetype,
      }
    });

    const downloadUrl = getEnhancedFileDownloadUrl(plainFile, type);

    if (!downloadUrl) {
      throw new Error('Could not generate download URL - no valid file identifiers found');
    }

    debug('🔗 Generated download URL:', downloadUrl);

    // For local upload URLs, we can download directly
    if (isLocalUploadUrl(downloadUrl)) {
      debug('📁 Using direct local upload download');
      const downloadFilename = plainFile.originalName ||
        plainFile.filename ||
        `document_${plainFile._id}.${getFileExtension(plainFile)}`;

      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      handleSuccess(`File "${downloadFilename}" download started`);
      return;
    }

    // For non-local URLs, use the API
    const response = await api.get(downloadUrl, {
      responseType: 'blob',
      timeout: 30000,
      validateStatus: (status) => status < 500 // Don't throw on 404, 403 etc.
    });

    // Check response status
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication required. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('File not found on server.');
    }

    if (response.status !== 200) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const blob = response.data;

    // Check if blob is empty
    if (!blob || blob.size === 0) {
      throw new Error('Downloaded file is empty (0 bytes)');
    }

    // Determine filename with fallbacks
    const downloadFilename = plainFile.originalName ||
      plainFile.filename ||
      `document_${plainFile._id}.${getFileExtension(plainFile)}`;

    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    handleSuccess(`File "${downloadFilename}" download started`);

  } catch (error: any) {
    debug('❌ Error downloading file:', {
      error: error.message,
      file: {
        _id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        url: file.url,
        fileUrl: file.fileUrl
      },
      type
    });

    let errorMessage = 'Failed to download file: ';

    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401 || error.response.status === 403) {
        errorMessage = 'Authentication required. Please log in again to download files.';
      } else if (error.response.status === 404) {
        errorMessage = 'File not found on server. It may have been deleted.';
      } else {
        errorMessage += `Server returned ${error.response.status}: ${error.response.statusText}`;
      }
    } else if (error.request) {
      // Request was made but no response received
      errorMessage += 'Network error - no response from server';
    } else {
      // Something else happened
      errorMessage += error.message || 'Unknown error occurred';
    }

    handleError(errorMessage);
    throw new Error(errorMessage);
  }
};

// Enhanced view file function with better error handling and local upload support
const viewFile = async (file: Attachment | CV | any, type: 'cv' | 'references' | 'experience' | 'applications'): Promise<void> => {
  try {
    // Convert Mongoose document first
    const plainFile = convertMongooseDocToPlainObject(file);

    debug('👁️ Attempting to view file:', {
      type,
      file: {
        originalName: plainFile.originalName,
        filename: plainFile.filename,
        mimetype: plainFile.mimetype,
        _id: plainFile._id,
        size: plainFile.size,
        url: plainFile.url,
        fileUrl: plainFile.fileUrl
      }
    });

    // First check if file can be viewed inline
    if (!canViewInline(plainFile)) {
      debug('📄 File cannot be viewed inline, downloading instead...');
      await downloadFile(plainFile, type);
      return;
    }

    const viewUrl = getEnhancedFileDownloadUrl(plainFile, type);

    if (!viewUrl) {
      throw new Error('Could not generate view URL');
    }

    debug('🔗 Generated view URL:', viewUrl);

    // For local upload URLs, we can open directly
    if (isLocalUploadUrl(viewUrl)) {
      debug('📁 Opening local upload URL directly');
      const newWindow = window.open(viewUrl, '_blank');
      if (!newWindow) {
        throw new Error('Popup blocked. Please allow popups for this site to view files.');
      }
      return;
    }

    // For non-local URLs, test if accessible
    try {
      const testResponse = await api.head(viewUrl, { timeout: 10000 });
      if (testResponse.status !== 200) {
        throw new Error(`File not accessible: ${testResponse.status}`);
      }
    } catch (testError) {
      debug('⚠️ View URL test failed, falling back to download:', testError);
      await downloadFile(plainFile, type);
      return;
    }

    // Open in new tab
    const newWindow = window.open(viewUrl, '_blank');
    if (!newWindow) {
      throw new Error('Popup blocked. Please allow popups for this site to view files.');
    }

    debug('✅ File opened in new tab successfully');

  } catch (err) {
    console.error('❌ Error viewing file:', err);

    // Fallback to download if view fails
    try {
      debug('🔄 View failed, attempting download as fallback...');
      await downloadFile(file, type);
    } catch (downloadError) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Both view and download failed:', downloadError);
      handleError('Failed to view file: ' + errorMessage);
      throw err;
    }
  }
};

// Enhanced canViewInline with local upload support
export const canViewInline = (file: Attachment | CV): boolean => {
  // Convert Mongoose document first
  const plainFile = convertMongooseDocToPlainObject(file);

  // Check mimetype
  if (!plainFile.mimetype) {
    // If no mimetype, check by extension
    const filename = plainFile.filename || plainFile.originalName || '';
    const ext = filename.toLowerCase().split('.').pop();
    const viewableExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'webp'];
    const result = viewableExtensions.includes(ext || '');
    debug(`📄 Inline view check by extension: ${filename} -> ${result}`);
    return result;
  }

  const inlineTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/html'
  ];

  const result = inlineTypes.includes(plainFile.mimetype);
  debug(`📄 Inline view check by MIME: ${plainFile.mimetype} -> ${result}`);
  return result;
};

// Validation method for application form data
const validateApplicationData = (formData: any): string[] => {
  const errors: string[] = [];

  // Validate contact info
  if (!formData.contactInfo?.email?.trim()) {
    errors.push('Email address is required');
  }
  if (!formData.contactInfo?.phone?.trim()) {
    errors.push('Phone number is required');
  }
  if (!formData.contactInfo?.location?.trim()) {
    errors.push('Location is required');
  }

  // Validate CV selection
  if (!formData.selectedCVs || formData.selectedCVs.length === 0) {
    errors.push('At least one CV must be selected');
  }

  // Validate cover letter
  if (!formData.coverLetter?.trim()) {
    errors.push('Cover letter is required');
  } else if (formData.coverLetter.length < 50) {
    errors.push('Cover letter should be at least 50 characters long');
  }

  return errors;
};

// Get application by ID (for organization view)
const getApplication = async (applicationId: string): Promise<Application> => {
  try {
    const response = await api.get<ApplicationResponse>(`/applications/${applicationId}`);
    return response.data.data.application;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch application');
  }
};

// Enhanced CV service methods with local upload support
export const cvService = {
  getUserCVs: async (): Promise<CV[]> => {
    try {
      debug('🔄 Fetching user CVs...');
      const candidateProfile = await candidateService.getProfile();

      if (!candidateProfile.cvs || candidateProfile.cvs.length === 0) {
        debug('⚠️ No CVs found in candidate profile');
        return [];
      }

      const cvs: CV[] = candidateProfile.cvs.map(cv => {
        const plainCV = convertMongooseDocToPlainObject(cv);

        return {
          _id: plainCV._id,
          filename: plainCV.filename,
          originalName: plainCV.originalName || plainCV.filename,
          path: plainCV.path || plainCV.url || plainCV.fileUrl,
          size: plainCV.size || 0,
          mimetype: plainCV.mimetype || 'application/octet-stream',
          url: plainCV.url || plainCV.fileUrl,
          uploadedAt: plainCV.uploadedAt,
          isDefault: plainCV.isPrimary || false,
          downloadUrl: plainCV.downloadUrl || plainCV.url || plainCV.fileUrl,
          viewUrl: plainCV.viewUrl || plainCV.url || plainCV.fileUrl,
          fileUrl: plainCV.fileUrl || plainCV.url
        };
      });

      debug(`✅ Loaded ${cvs.length} CVs from candidate profile`);
      return cvs;
    } catch (error: any) {
      console.error('❌ Failed to fetch CVs:', error);
      return [];
    }
  },

  uploadCV: async (file: File): Promise<CV> => {
    try {
      // Use candidateService's uploadCVs method
      const uploadedCVs = await candidateService.uploadCVs([file]);

      if (!uploadedCVs || uploadedCVs.length === 0) {
        throw new Error('Failed to upload CV - no CV returned');
      }

      const uploadedCV = uploadedCVs[0];

      // Transform to CV format
      const cv: CV = {
        _id: uploadedCV._id,
        filename: uploadedCV.fileName,
        originalName: uploadedCV.originalName,
        url: uploadedCV.url || uploadedCV.fileUrl,
        size: uploadedCV.size || file.size,
        mimetype: uploadedCV.mimetype || file.type,
        uploadedAt: uploadedCV.uploadedAt,
        path: uploadedCV.path || uploadedCV.url || uploadedCV.fileUrl,
        isDefault: uploadedCV.isPrimary || false,
        downloadUrl: uploadedCV.downloadUrl || uploadedCV.url || uploadedCV.fileUrl,
        // viewUrl: uploadedCV.viewUrl || uploadedCV.url || uploadedCV.fileUrl,
        fileUrl: uploadedCV.fileUrl || uploadedCV.url
      };

      return cv;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to upload CV') as never;
    }
  },

  deleteCV: async (cvId: string): Promise<void> => {
    try {
      await candidateService.deleteCV(cvId);
    } catch (error: any) {
      throw handleApiError(error, 'Failed to delete CV') as never;
    }
  },

  formatFileSize: (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Local upload specific helpers
  isLocalUploadUrl,
};

// CRITICAL FIX: Updated main application service to match backend expectations
export const applicationService = {
  getCandidateCVs,

  async applyForJob(jobId: string, data: ApplyForJobData, files?: {
    cvFile?: File; // Optional - user can upload new CV or use existing
    referenceFiles?: File[];
    experienceFiles?: File[];
  }): Promise<ApplicationResponse> {
    try {
      console.log('📤 [Frontend] Submitting application for job:', jobId);
      console.log('📁 [Frontend] Files to upload:', {
        cvFile: files?.cvFile ? { name: files.cvFile.name, size: files.cvFile.size } : 'No CV file',
        referenceFiles: files?.referenceFiles?.map(f => ({ name: f.name, size: f.size })) || 'No reference files',
        experienceFiles: files?.experienceFiles?.map(f => ({ name: f.name, size: f.size })) || 'No experience files'
      });

      // Validate application data before proceeding
      const validationErrors = validateApplicationData(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const formData = new FormData();

      // Add JSON data fields
      formData.append('coverLetter', data.coverLetter);
      formData.append('skills', JSON.stringify(data.skills || []));
      formData.append('references', JSON.stringify(data.references || []));
      formData.append('workExperience', JSON.stringify(data.workExperience || []));
      formData.append('contactInfo', JSON.stringify(data.contactInfo || {}));
      formData.append('selectedCVs', JSON.stringify(data.selectedCVs || []));

      if (data.userInfo) {
        formData.append('userInfo', JSON.stringify(data.userInfo));
      }

      // CRITICAL: Add CV file if provided (OPTIONAL - backend can use selectedCVs)
      if (files?.cvFile) {
        formData.append('cv', files.cvFile);
        console.log(`📎 [Frontend] Appended CV file: ${files.cvFile.name} as 'cv'`);
      } else {
        console.log('ℹ️ [Frontend] No CV file uploaded - using selectedCVs from profile');
      }

      // Add reference documents with field name 'referencePdfs'
      if (files?.referenceFiles && files.referenceFiles.length > 0) {
        files.referenceFiles.forEach((file, index) => {
          formData.append('referencePdfs', file);
          console.log(`📎 [Frontend] Appended reference document ${index + 1}: ${file.name} as 'referencePdfs'`);
        });
      }

      // Add experience documents with field name 'experiencePdfs'
      if (files?.experienceFiles && files.experienceFiles.length > 0) {
        files.experienceFiles.forEach((file, index) => {
          formData.append('experiencePdfs', file);
          console.log(`📎 [Frontend] Appended experience document ${index + 1}: ${file.name} as 'experiencePdfs'`);
        });
      }

      // Debug form data contents
      debugFormData(formData);

      console.log('🚀 [Frontend] Sending request to backend...');
      const response = await api.post<ApplicationResponse>(
        `/applications/apply/${jobId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        }
      );

      console.log('✅ [Frontend] Application submitted successfully!');
      handleSuccess('Application submitted successfully!');
      return response.data;
    } catch (error: any) {
      console.error('❌ [Frontend] Application submission error:', error);

      // Log the actual error response from backend
      if (error.response?.data) {
        console.error('🔴 Backend Response:', error.response.data);

        // If it's a validation error, extract the specific field errors
        if (error.response.data.errors) {
          console.error('🔴 Field Errors:', error.response.data.errors);
        }
      }

      throw handleApiError(error, 'Failed to submit application');
    }
  },

  // // Alternative method that accepts the old format and adapts it
  // async applyForJobWithLegacyFormat(
  //   jobId: string,
  //   data: ApplyForJobData,
  //   files?: File[]
  // ): Promise<ApplicationResponse> {
  //   try {
  //     console.log('📤 [Frontend] Submitting application with legacy format for job:', jobId);

  //     // Convert legacy files array to new format
  //     const newFiles = this.convertLegacyFilesToNewFormat(files, data);

  //     // Use the new applyForJob method
  //     return this.applyForJob(jobId, data, newFiles);
  //    } catch (error: any) {
  //     console.error('❌ [Frontend] Application submission error:', error);
  //     throw handleApiError(error, 'Failed to submit application');
  //   }
  // },

  // Helper to convert legacy files array to new format with correct field names
  convertLegacyFilesToNewFormat(files?: File[], data?: ApplyForJobData): {
    cvFile?: File;
    referenceFiles?: File[];
    experienceFiles?: File[];
  } {
    if (!files || files.length === 0) {
      return {};
    }

    const result: {
      cvFile?: File;
      referenceFiles?: File[];
      experienceFiles?: File[];
    } = {
      referenceFiles: [],
      experienceFiles: []
    };

    console.log('🔄 Converting legacy files to new format:', files.map(f => f.name));

    // CRITICAL FIX: Categorize files based on backend expectations

    // First, check if we have data about references and experiences
    const hasReferenceDocuments = data?.references?.some(ref => ref.providedAsDocument) || false;
    const hasExperienceDocuments = data?.workExperience?.some(exp => exp.providedAsDocument) || false;

    // Categorize files based on naming patterns and context
    files.forEach((file) => {
      const fileName = file.name.toLowerCase();

      // 1. Identify CV file - should be first file or has CV in name
      if (!result.cvFile && (
        fileName.includes('cv') ||
        fileName.includes('resume') ||
        fileName.includes('curriculum') ||
        // If it's the first file and we haven't identified a CV yet, assume it's the CV
        (files.length > 0 && file === files[0])
      )) {
        result.cvFile = file;
        console.log(`✅ Identified as CV: ${file.name}`);
      }
      // 2. Identify reference documents
      else if (fileName.includes('reference') ||
        fileName.includes('recommendation') ||
        fileName.includes('letter') ||
        fileName.includes('ref-') ||
        fileName.includes('rec-') ||
        // If we know there should be reference documents from data context
        hasReferenceDocuments) {
        result.referenceFiles!.push(file);
        console.log(`✅ Identified as reference document: ${file.name}`);
      }
      // 3. Identify experience documents
      else {
        result.experienceFiles!.push(file);
        console.log(`✅ Identified as experience document: ${file.name}`);
      }
    });

    // IMPORTANT: CV file is REQUIRED - if none identified, use first file
    if (!result.cvFile && files.length > 0) {
      result.cvFile = files[0];
      console.log(`⚠️ No CV identified, using first file as CV: ${files[0].name}`);

      // Remove this file from other categories if it was added there
      if (result.referenceFiles?.includes(files[0])) {
        result.referenceFiles = result.referenceFiles.filter(f => f !== files[0]);
      }
      if (result.experienceFiles?.includes(files[0])) {
        result.experienceFiles = result.experienceFiles.filter(f => f !== files[0]);
      }
    }

    return result;
  },

  // Get candidate's applications
  async getMyApplications(params?: ApplicationFilters): Promise<ApplicationsListResponse> {
    try {
      const response = await api.get<ApplicationsListResponse>('/applications/my-applications', {
        params: cleanFilters(params),
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch your applications');
    }
  },

  async getCompanyApplicationDetails(applicationId: string): Promise<ApplicationResponse> {
    try {
      const response = await api.get<ApplicationResponse>(`/applications/company/${applicationId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch application details');
    }
  },

  // Get organization-specific application details
  async getOrganizationApplicationDetails(applicationId: string): Promise<ApplicationResponse> {
    try {
      const response = await api.get<ApplicationResponse>(`/applications/organization/${applicationId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch application details');
    }
  },

  // Enhanced get application details with role-based routing
  async getApplicationDetails(applicationId: string, viewType?: 'company' | 'organization'): Promise<ApplicationResponse> {
    try {
      // Use role-specific endpoints if viewType is provided
      if (viewType === 'company') {
        return this.getCompanyApplicationDetails(applicationId);
      } else if (viewType === 'organization') {
        return this.getOrganizationApplicationDetails(applicationId);
      }

      // Fallback to general endpoint
      const response = await api.get<ApplicationResponse>(`/applications/${applicationId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch application details');
    }
  },

  // Get applications for a job (Company/Organization)
  async getJobApplications(jobId: string, params?: ApplicationFilters): Promise<ApplicationsListResponse> {
    try {
      const response = await api.get<ApplicationsListResponse>(`/applications/job/${jobId}`, {
        params: cleanFilters(params),
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch job applications');
    }
  },

  // Get all company applications (across all jobs)
  async getCompanyApplications(params?: ApplicationFilters): Promise<ApplicationsListResponse> {
    try {
      const response = await api.get<ApplicationsListResponse>('/applications/company/applications', {
        params: cleanFilters(params),
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch company applications');
    }
  },

  // Get all organization applications (across all jobs)
  async getOrganizationApplications(params?: ApplicationFilters): Promise<ApplicationsListResponse> {
    try {
      const response = await api.get<ApplicationsListResponse>('/applications/organization/applications', {
        params: cleanFilters(params),
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch organization applications');
    }
  },

  // Update application status
  async updateApplicationStatus(applicationId: string, data: UpdateStatusData): Promise<ApplicationResponse> {
    try {
      const response = await api.put<ApplicationResponse>(`/applications/${applicationId}/status`, data);

      const statusMessages: Record<string, string> = {
        'shortlisted': 'Candidate shortlisted successfully!',
        'interview-scheduled': 'Interview scheduled successfully!',
        'rejected': 'Application rejected',
        'on-hold': 'Application put on hold',
        'offer-made': 'Offer made to candidate!',
        'offer-accepted': 'Offer accepted!',
      };

      if (statusMessages[data.status]) {
        handleSuccess(statusMessages[data.status]);
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to update application status');
    }
  },

  // Add company response
  async addCompanyResponse(applicationId: string, data: CompanyResponseData): Promise<ApplicationResponse> {
    try {
      const response = await api.put<ApplicationResponse>(`/applications/${applicationId}/company-response`, data);

      const responseMessages: Record<string, string> = {
        'selected-for-interview': 'Candidate selected for interview!',
        'active-consideration': 'Response sent to candidate',
        'on-hold': 'Candidate notified about hold status',
      };

      if (responseMessages[data.status]) {
        handleSuccess(responseMessages[data.status]);
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to send company response');
    }
  },

  // Withdraw application
  async withdrawApplication(applicationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.put<{ success: boolean; message: string }>(
        `/applications/${applicationId}/withdraw`
      );

      handleSuccess('Application withdrawn successfully');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to withdraw application');
    }
  },

  async getApplicationStats(): Promise<{ success: boolean; data: { statistics: ApplicationStats } }> {
    try {
      const response = await api.get<StatisticsResponse>('/applications/statistics/overview');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch application statistics');
    }
  },

  // Alias for getApplicationStats to fix the organization error
  async getApplicationStatistics(): Promise<StatisticsResponse> {
    try {
      const response = await api.get<StatisticsResponse>('/applications/statistics/overview');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch application statistics');
    }
  },

  // ===== ENHANCED FILE HANDLING METHODS =====
  downloadFile,
  viewFile,
  getFileDownloadUrl: getEnhancedFileDownloadUrl,
  getFileViewUrl: getEnhancedFileDownloadUrl,
  getFileSize,
  canViewInline,

  // Local upload helpers
  isLocalUploadUrl,

  // Enhanced file handling methods with debug
  downloadCV: async (cv: CV): Promise<void> => {
    debug('📥 Downloading CV:', cv);
    return downloadFile(cv, 'cv');
  },

  viewCV: async (cv: CV): Promise<void> => {
    debug('👀 Viewing CV:', cv);
    return viewFile(cv, 'cv');
  },

  downloadReference: async (reference: Reference): Promise<void> => {
    if (!reference.document) {
      throw new Error('No document available for this reference');
    }
    debug('📥 Downloading reference document:', reference.document);
    return downloadFile(reference.document, 'references');
  },

  viewReference: async (reference: Reference): Promise<void> => {
    if (!reference.document) {
      throw new Error('No document available for this reference');
    }
    debug('👀 Viewing reference document:', reference.document);
    return viewFile(reference.document, 'references');
  },

  downloadExperience: async (experience: WorkExperience): Promise<void> => {
    if (!experience.document) {
      throw new Error('No document available for this experience');
    }
    debug('📥 Downloading experience document:', experience.document);
    return downloadFile(experience.document, 'experience');
  },

  viewExperience: async (experience: WorkExperience): Promise<void> => {
    if (!experience.document) {
      throw new Error('No document available for this experience');
    }
    debug('👀 Viewing experience document:', experience.document);
    return viewFile(experience.document, 'experience');
  },

  // ===== HELPER METHODS =====

  getFileFieldName,
  validateApplicationData,
  getApplication,

  // FIXED: Check if reference has document - now properly checks providedAsDocument flag
  hasReferenceDocument: (reference: Reference): boolean => {
    return reference.providedAsDocument && !!reference.document;
  },

  // FIXED: Check if experience has document - now properly checks providedAsDocument flag
  hasExperienceDocument: (experience: WorkExperience): boolean => {
    return experience.providedAsDocument && !!experience.document;
  },

  // Get all attachments from application
  getAllAttachments: (application: Application): Attachment[] => {
    const attachments = [
      ...(application.attachments.referenceDocuments || []),
      ...(application.attachments.experienceDocuments || []),
      ...(application.attachments.portfolioFiles || []),
      ...(application.attachments.otherDocuments || [])
    ];

    // Add documents from references - only if they have actual uploaded files
    if (application.references) {
      application.references.forEach(ref => {
        if (ref.document && ref.providedAsDocument) {
          attachments.push(ref.document);
        }
      });
    }

    // Add documents from work experience - only if they have actual uploaded files
    if (application.workExperience) {
      application.workExperience.forEach(exp => {
        if (exp.document && exp.providedAsDocument) {
          attachments.push(exp.document);
        }
      });
    }

    return attachments;
  },

  // Status formatting helpers
  getStatusLabel: (status: string): string => {
    const statusLabels: { [key: string]: string } = {
      'applied': 'Applied',
      'under-review': 'Under Review',
      'shortlisted': 'Shortlisted',
      'interview-scheduled': 'Interview Scheduled',
      'interviewed': 'Interview Completed',
      'offer-pending': 'Offer Pending',
      'offer-made': 'Offer Made',
      'offer-accepted': 'Offer Accepted',
      'offer-rejected': 'Offer Rejected',
      'on-hold': 'On Hold',
      'rejected': 'Rejected',
      'withdrawn': 'Withdrawn',
    };
    return statusLabels[status] || status;
  },

  getStatusColor: (status: string): string => {
    const statusColors: { [key: string]: string } = {
      'applied': 'blue',
      'under-review': 'yellow',
      'shortlisted': 'green',
      'interview-scheduled': 'purple',
      'interviewed': 'indigo',
      'offer-pending': 'orange',
      'offer-made': 'teal',
      'offer-accepted': 'green',
      'offer-rejected': 'red',
      'on-hold': 'gray',
      'rejected': 'red',
      'withdrawn': 'gray',
    };
    return statusColors[status] || 'gray';
  },

  // Check if application can be withdrawn
  canWithdraw: (status: string): boolean => {
    const nonWithdrawableStatuses = ['offer-accepted', 'interviewed', 'offer-pending', 'rejected', 'withdrawn'];
    return !nonWithdrawableStatuses.includes(status);
  },

  // Format application for display
  formatApplication: (application: Application) => {
    return {
      ...application,
      statusLabel: applicationService.getStatusLabel(application.status),
      statusColor: applicationService.getStatusColor(application.status),
      companyResponseLabel: application.companyResponse?.status
        ? applicationService.getCompanyResponseLabel(application.companyResponse.status)
        : null,
      canWithdraw: applicationService.canWithdraw(application.status),
      daysSinceApplied: Math.floor((new Date().getTime() - new Date(application.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    };
  },

  getCompanyResponseLabel: (status: string): string => {
    const responseLabels: { [key: string]: string } = {
      'active-consideration': 'Active Consideration',
      'on-hold': 'On Hold / Waiting List',
      'rejected': 'Rejected',
      'selected-for-interview': 'Selected for Interview'
    };
    return responseLabels[status] || status;
  },

  // Utility function to convert Mongoose documents
  convertMongooseDocToPlainObject,

  // Debug helper for application data
  debugApplicationFiles: (application: Application) => {
    debug('🔍 Debugging application file data:', {
      applicationId: application._id,
      selectedCVs: application.selectedCVs?.map((cv, index) => ({
        index,
        cvId: cv.cvId,
        filename: cv.filename,
        originalName: cv.originalName,
        url: cv.url,
        downloadUrl: cv.downloadUrl,
        viewUrl: cv.viewUrl,
        size: (cv as any).size,
        mimetype: (cv as any).mimetype,
        fileUrl: (cv as any).fileUrl
      })),
      workExperience: application.workExperience?.map((exp, index) => ({
        index,
        company: exp.company,
        position: exp.position,
        providedAsDocument: exp.providedAsDocument,
        document: exp.document ? {
          _id: exp.document._id,
          filename: exp.document.filename,
          originalName: exp.document.originalName,
          url: exp.document.url,
          fileUrl: exp.document.fileUrl,
          path: exp.document.path,
          size: exp.document.size,
          mimetype: exp.document.mimetype,
        } : null
      })),
      references: application.references?.map((ref, index) => ({
        index,
        name: ref.name,
        providedAsDocument: ref.providedAsDocument,
        document: ref.document ? {
          _id: ref.document._id,
          filename: ref.document.filename,
          originalName: ref.document.originalName,
          url: ref.document.url,
          fileUrl: ref.document.fileUrl,
          path: ref.document.path,
          size: ref.document.size,
          mimetype: ref.document.mimetype,
        } : null
      })),
      attachments: {
        referenceDocuments: application.attachments.referenceDocuments?.length || 0,
        experienceDocuments: application.attachments.experienceDocuments?.length || 0,
        portfolioFiles: application.attachments.portfolioFiles?.length || 0,
        otherDocuments: application.attachments.otherDocuments?.length || 0
      }
    });
  },

  // Enhanced file type detection
  getFileType: (file: Attachment | any): 'pdf' | 'word' | 'image' | 'text' | 'document' => {
    if (!file) return 'document';
    const plainFile = convertMongooseDocToPlainObject(file);

    if (plainFile.mimetype) {
      if (plainFile.mimetype.includes('pdf')) return 'pdf';
      if (plainFile.mimetype.includes('word')) return 'word';
      if (plainFile.mimetype.includes('image')) return 'image';
      if (plainFile.mimetype.includes('text')) return 'text';
    }

    if (plainFile.filename) {
      const ext = plainFile.filename.toLowerCase().split('.').pop();
      if (ext === 'pdf') return 'pdf';
      if (['doc', 'docx'].includes(ext || '')) return 'word';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
      if (ext === 'txt') return 'text';
    }

    return 'document';
  },

  // Enhanced file icon helper
  getFileIcon: (file: Attachment | any): string => {
    const fileType = applicationService.getFileType(file);

    const icons: Record<'pdf' | 'word' | 'image' | 'text' | 'document', string> = {
      pdf: '📄',
      word: '📝',
      image: '🖼️',
      text: '📃',
      document: '📎'
    };

    return icons[fileType] || '📎';
  },

  // Enhanced helper to check if file is downloadable
  isFileDownloadable: (file: Attachment | any): boolean => {
    if (!file) return false;
    const plainFile = convertMongooseDocToPlainObject(file);
    return !!(plainFile.filename || plainFile.url || plainFile._id || plainFile.fileUrl);
  }
};

export default applicationService;