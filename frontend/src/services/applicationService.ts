/* eslint-disable @typescript-eslint/no-explicit-any */
// services/applicationService.ts - FIXED WITH BLOB DOWNLOAD PATTERN
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';
import { candidateService } from './candidateService';

export interface PremiumUISettings {
  glassmorphism: boolean;
  accentColor: 'gold' | 'platinum' | 'sapphire';
  animations: 'parallax' | 'fade' | 'both';
  shadowIntensity: 'soft' | 'medium' | 'strong';
}
export interface FileWithTempId {
  file: File;
  tempId: string;
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

// UPDATED INTERFACES - Simplified and aligned with backend
export interface Attachment {
  _id?: string;
  filename: string; // ✅ Backend expects 'filename' not 'fileName'
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  url: string;
  uploadedAt: string;
  description?: string;
  downloadUrl?: string;
  viewUrl?: string;
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
}

// UPDATED: Reference interface aligned with backend schema
export interface Reference {
  _id?: string;
  _tempId?: string; // For frontend-backend file matching
  document?: Attachment; // Files live ONLY here
  name?: string;
  position?: string;
  company?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  allowsContact?: boolean;
  notes?: string;
  providedAsDocument: boolean; // MUST match backend
}

// UPDATED: WorkExperience interface aligned with backend schema
export interface WorkExperience {
  _id?: string;
  _tempId?: string; // For frontend-backend file matching
  document?: Attachment; // Files live ONLY here
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
  providedAsDocument: boolean; // MUST match backend
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
  interviewDetails: { date: string; location: string; type: string; } | undefined;
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

// Add these interfaces at the top
export interface ApplicationAttachment {
  _id: string;
  filename: string;
  originalName: string;
  type: 'cv' | 'reference' | 'experience' | 'portfolio' | 'other';
  size: number;
  mimetype: string;
  description?: string;
  uploadedAt: string;
  category?: string;
}

export interface ApplicationAttachmentsResponse {
  success: boolean;
  data: {
    attachments: ApplicationAttachment[];
    applicationId: string;
    jobTitle: string;
    candidateName: string;
  };
}

// UPDATED: Application interface aligned with backend changes
// FIX 5: Add _id to selectedCVs array type
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
    _id?: string;       // ADD THIS LINE
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
    referenceDocuments: Attachment[]; // ✅ These will be empty - files are in references[].document
    experienceDocuments: Attachment[]; // ✅ These will be empty - files are in workExperience[].document
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
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    current: number;
    totalPages: number;
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface ApplicationStats {
  newToday: number;
  thisWeek: number;
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

// UPDATED: ApplyForJobData aligned with backend
export interface ApplyForJobData {
  coverLetter: string;
  skills: string[];
  references: Reference[]; // Must include _tempId for document-based references
  workExperience: WorkExperience[]; // Must include _tempId for document-based experience
  contactInfo: ContactInfo;
  selectedCVs: Array<{
    cvId: string;
  }>; // ✅ SIMPLIFIED - backend doesn't need filename/url
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
  dateTo: string;
  dateFrom: string;
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  jobId?: string;
}

export interface ApplicationAttachment {
  _id: string;
  filename: string;
  originalName: string;
  type: 'cv' | 'reference' | 'experience' | 'portfolio' | 'other';
  size: number;
  mimetype: string;
  description?: string;
  uploadedAt: string;
}

export interface ApplicationAttachmentsResponse {
  success: boolean;
  data: {
    attachments: ApplicationAttachment[];
    applicationId: string;
    jobTitle: string;
    candidateName: string;
  };
}

// File metadata for backend matching
export interface FileMetadata {
  _tempId: string;
  type: 'reference' | 'experience';
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
    config: {
      url: error.config?.url,
      method: error.config?.method,
    }
  });

  if (error.response?.data?.message) {
    const message = error.response.data.message;
    handleError(message);
    throw new Error(message);
  } else if (error.response?.data?.errors) {
    const validationErrors = error.response.data.errors;
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
    handleError(error.message);
    throw error;
  } else {
    handleError(defaultMessage);
    throw new Error(defaultMessage);
  }
};

// Clean filters to remove empty values
const cleanFilters = (filters?: ApplicationFilters): Partial<ApplicationFilters> => {
  if (!filters) return {
    dateTo: '',
    dateFrom: ''
  };

  const cleaned: Partial<ApplicationFilters> = {
    dateTo: '',
    dateFrom: ''
  };
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined && value !== 'all') {
      // Use a cast to avoid keyof assignment issues while keeping typesafe return
      (cleaned as any)[key] = value;
    }
  });

  return cleaned;
};

// Enhanced debug function for FormData
const debugFormData = (formData: FormData) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [ApplicationService] FormData contents:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File - ${value.name} (${value.size} bytes, ${value.type})`);
      } else if (key.includes('[') && key.includes(']')) {
        console.log(`  ${key}: ${value}`);
      } else {
        console.log(`  ${key}:`, typeof value === 'string' ? value.substring(0, 100) + '...' : value);
      }
    }
  }
};

// CRITICAL: Generate unique tempId for frontend-backend matching
const generateTempId = (): string => {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Enhanced getCandidateCVs
const getCandidateCVs = async (): Promise<CV[]> => {
  try {
    debug('🔄 Fetching CVs...');
    const response = await api.get('/applications/my-cvs');

    if (!response.data.success) {
      throw new Error('Failed to fetch CVs');
    }

    const cvsData = response.data.data?.cvs || [];
    debug('✅ Loaded CVs:', cvsData.length);

    return cvsData.map((cv: any) => ({
      _id: cv._id,
      filename: cv.filename,
      originalName: cv.originalName || cv.filename,
      path: cv.path || '',
      size: cv.size || 0,
      mimetype: cv.mimetype || 'application/octet-stream',
      url: cv.url || '',
      uploadedAt: cv.uploadedAt,
      isDefault: cv.isDefault || cv.isPrimary || false,
      description: cv.description,
      downloadUrl: cv.downloadUrl,
      viewUrl: cv.viewUrl
    }));
  } catch (error: any) {
    debug('❌ Failed to fetch CVs:', error.message);
    throw error;
  }
};

// ============ UNIVERSAL DOWNLOAD PATTERN ============
const downloadFile = async (
  file: Attachment | CV | any,  // Changed from FileDocument to Attachment
  applicationId: string,
  type: string
): Promise<void> => {
  try {
    const fileId = (file as any)._id || (file as any).cvId;
    if (!applicationId || !fileId) {
      throw new Error("Missing applicationId or fileId");
    }

    const filename = file.originalName || file.filename || "document";
    const endpoint = `/applications/${applicationId}/files/${fileId}/download`;

    console.log(`📥 Downloading file: ${filename} from ${endpoint}`);

    const response = await api.get(endpoint, {
      responseType: "blob",
      timeout: 120000, // 2 minutes for large files
    });

    const blob = new Blob([response.data], {
      type: response.headers["content-type"] || "application/octet-stream",
    });

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
  } catch (error) {
    console.error("❌ Error downloading file:", error);
    handleApiError(error, "Failed to download file");
    throw error;
  }
};

// ============ UNIVERSAL VIEW PATTERN ============
const viewFile = async (
  file: Attachment | CV | any,  // Changed from FileDocument to Attachment
  applicationId: string,
  type: string
): Promise<void> => {
  try {
    const fileId = (file as any)._id || (file as any).cvId;
    if (!applicationId || !fileId) {
      throw new Error("Missing applicationId or fileId");
    }

    const filename = file.originalName || file.filename || "document";
    const endpoint = `/applications/${applicationId}/files/${fileId}/view`;

    console.log(`👁️ Viewing file: ${filename} from ${endpoint}`);

    const response = await api.get(endpoint, {
      responseType: "blob",
      timeout: 60000, // 1 minute for viewing
    });

    const blob = new Blob([response.data], {
      type: response.headers["content-type"] || "application/octet-stream",
    });

    const blobUrl = window.URL.createObjectURL(blob);
    const tab = window.open(blobUrl, "_blank", "noopener,noreferrer");

    if (!tab) {
      // Fallback if popup blocked
      window.location.href = blobUrl;
    }

    // Clean up
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
  } catch (error) {
    console.error("❌ Error viewing file:", error);
    handleApiError(error, "Failed to view file");
    throw error;
  }
};

// Check if file can be viewed inline
const canViewInline = (file: Attachment): boolean => {
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

  return inlineTypes.includes(file.mimetype);
};

// Validation method for application form data
const validateApplicationData = (formData: any): string[] => {
  const errors: string[] = [];

  if (!formData.coverLetter?.trim()) {
    errors.push('Cover letter is required');
  }

  if (!formData.selectedCVs || formData.selectedCVs.length === 0) {
    errors.push('At least one CV must be selected');
  }

  if (!formData.contactInfo?.email?.trim()) {
    errors.push('Email address is required');
  }

  if (!formData.contactInfo?.phone?.trim()) {
    errors.push('Phone number is required');
  }

  return errors;
};

// Helper function to convert Map to FileWithTempId array
const convertMapToFileWithTempIdArray = (map: Map<string, File>): FileWithTempId[] => {
  return Array.from(map.entries()).map(([tempId, file]) => ({
    file,
    tempId
  }));
};

// Helper to get file size display
const getFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ✅ CRITICAL FIX: Main application service with backend alignment
export const applicationService = {
  getCandidateCVs,
  convertMapToFileWithTempIdArray, // Add this
  getFileSize,
  // Update the applyForJob method in applicationService.ts:
  async applyForJob(
    jobId: string,
    data: ApplyForJobData,
    files?: {
      referenceFiles?: Map<string, File> | FileWithTempId[];
      experienceFiles?: Map<string, File> | FileWithTempId[];
    }
  ): Promise<ApplicationResponse> {
    try {
      console.log('📤 [Frontend] Submitting application for job:', jobId);
      console.log('📁 [Frontend] Files to upload:', {
        referenceFiles: files?.referenceFiles
          ? (files.referenceFiles instanceof Map ? files.referenceFiles.size : files.referenceFiles.length)
          : 0,
        experienceFiles: files?.experienceFiles
          ? (files.experienceFiles instanceof Map ? files.experienceFiles.size : files.experienceFiles.length)
          : 0
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

      // CRITICAL FIX: Send metadata in a SIMPLER format
      const addFilesWithSimpleMetadata = (
        filesInput: Map<string, File> | FileWithTempId[] | undefined,
        fieldName: 'referencePdfs' | 'experiencePdfs'
      ) => {
        if (!filesInput) return;

        let filesArray: FileWithTempId[] = [];

        if (filesInput instanceof Map) {
          filesArray = convertMapToFileWithTempIdArray(filesInput);
        } else {
          filesArray = filesInput;
        }

        filesArray.forEach(({ file, tempId }, index) => {
          // Add the file
          formData.append(fieldName, file);

          // SIMPLE FORMAT: Just send tempId as a separate field
          // Format 1: Simple key-value
          formData.append(`${fieldName}_${index}_tempId`, tempId);

          // Format 2: Alternative format for backward compatibility
          formData.append(`${fieldName}_metadata_${index}`, JSON.stringify({
            _tempId: tempId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          }));

          console.log(`📎 [Frontend] Appended ${fieldName} document: ${file.name} with tempId: ${tempId}`);
        });
      };

      // Add reference documents with metadata
      addFilesWithSimpleMetadata(files?.referenceFiles, 'referencePdfs');

      // Add experience documents with metadata
      addFilesWithSimpleMetadata(files?.experienceFiles, 'experiencePdfs');

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

      // Debug the response
      console.log('📦 [Frontend] Response data:', {
        success: response.data.success,
        message: response.data.message,
        applicationId: response.data.data?.application?._id,
        referencesCount: response.data.data?.application?.references?.length,
        referencesWithDocs: response.data.data?.application?.references?.filter((ref: any) => ref.document)?.length,
        experienceCount: response.data.data?.application?.workExperience?.length,
        experienceWithDocs: response.data.data?.application?.workExperience?.filter((exp: any) => exp.document)?.length
      });

      handleSuccess('Application submitted successfully!');
      return response.data;
    } catch (error: any) {
      console.error('❌ [Frontend] Application submission error:', error);

      if (error.response?.data) {
        console.error('🔴 Backend Response:', error.response.data);

        if (error.response.data.errors) {
          console.error('🔴 Field Errors:', error.response.data.errors);
        }
      }

      throw handleError(error, 'Failed to submit application');
    }
  },

  // Get candidate's applications
  async getMyApplications(params?: ApplicationFilters): Promise<ApplicationsListResponse> {
    try {
      const response = await api.get<ApplicationsListResponse>('/applications/my-applications', {
        params: cleanFilters(params),
      });
      return response.data;
    } catch (error: any) {
      throw handleError(error, 'Failed to fetch your applications');
    }
  },

  async getCompanyApplicationDetails(applicationId: string): Promise<ApplicationResponse> {
    try {
      const response = await api.get<ApplicationResponse>(`/applications/company/${applicationId}`);
      return response.data;
    } catch (error: any) {
      throw handleError(error, 'Failed to fetch application details');
    }
  },

  // Get organization-specific application details
  async getOrganizationApplicationDetails(applicationId: string): Promise<ApplicationResponse> {
    try {
      const response = await api.get<ApplicationResponse>(`/applications/organization/${applicationId}`);
      return response.data;
    } catch (error: any) {
      throw handleError(error, 'Failed to fetch application details');
    }
  },

  // Enhanced get application details with role-based routing
  async getApplicationDetails(applicationId: string, viewType?: 'company' | 'organization'): Promise<ApplicationResponse> {
    try {
      if (viewType === 'company') {
        return this.getCompanyApplicationDetails(applicationId);
      } else if (viewType === 'organization') {
        return this.getOrganizationApplicationDetails(applicationId);
      }

      const response = await api.get<ApplicationResponse>(`/applications/${applicationId}`);
      return response.data;
    } catch (error: any) {
      throw handleError(error, 'Failed to fetch application details');
    }
  },

  // Get applications for a job (Company/Organization)
  async getJobApplications(jobId: string, params?: ApplicationFilters): Promise<ApplicationsListResponse> {
    try {
      const response = await api.get<ApplicationsListResponse>(`/applications/job/${jobId}`, {
        params: cleanFilters(params),
      });
      return response.data;
    } catch (error: any) {
      throw handleError(error, 'Failed to fetch job applications');
    }
  },

  // Get all company applications (across all jobs)
  async getCompanyApplications(params?: ApplicationFilters): Promise<ApplicationsListResponse> {
    try {
      const response = await api.get<ApplicationsListResponse>('/applications/company/applications', {
        params: cleanFilters(params),
      });
      return response.data;
    } catch (error: any) {
      throw handleError(error, 'Failed to fetch company applications');
    }
  },

  // Get all organization applications (across all jobs)
  async getOrganizationApplications(params?: ApplicationFilters): Promise<ApplicationsListResponse> {
    try {
      const response = await api.get<ApplicationsListResponse>('/applications/organization/applications', {
        params: cleanFilters(params),
      });
      return response.data;
    } catch (error: any) {
      throw handleError(error, 'Failed to fetch organization applications');
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
    } catch (error: any) {
      throw handleError(error, 'Failed to update application status');
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
    } catch (error: any) {
      throw handleError(error, 'Failed to send company response');
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
    } catch (error: any) {
      throw handleError(error, 'Failed to withdraw application');
    }
  },

  async getApplicationStats(): Promise<{ success: boolean; data: { statistics: ApplicationStats } }> {
    try {
      const response = await api.get<StatisticsResponse>('/applications/statistics/overview');
      return response.data;
    } catch (error: any) {
      throw handleError(error, 'Failed to fetch application statistics');
    }
  },

  // Alias for getApplicationStats
  async getApplicationStatistics(): Promise<StatisticsResponse> {
    try {
      const response = await api.get<StatisticsResponse>('/applications/statistics/overview');
      return response.data;
    } catch (error: any) {
      throw handleError(error, 'Failed to fetch application statistics');
    }
  },

  // Add these methods to the applicationService object:

  // Get all attachments for an application
  async getApplicationAttachments(applicationId: string): Promise<ApplicationAttachmentsResponse> {
    try {
      debug(`🔄 Fetching attachments for application: ${applicationId}`);

      const response = await api.get<ApplicationAttachmentsResponse>(
        `/applications/${applicationId}/attachments`
      );

      debug(`✅ Found ${response.data.data.attachments.length} attachments`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch application attachments');
    }
  },

  // Download application file with authentication
  async downloadApplicationFile(
    applicationId: string,
    fileId: string,
    fileType?: 'cv' | 'reference' | 'experience' | 'portfolio' | 'other'
  ): Promise<void> {
    try {
      debug(`📥 Downloading file: ${fileId} from application: ${applicationId}`);

      // Use authenticated endpoint
      const downloadUrl = `/applications/${applicationId}/files/${fileId}/download`;

      const response = await api.get(downloadUrl, {
        responseType: 'blob',
        headers: {
          'Accept': '*/*'
        }
      });

      // Create blob from response
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });

      // Get filename from Content-Disposition header or use fileId
      let filename = `file-${fileId}`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^'";]*)['"]?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      debug(`✅ File downloaded: ${filename}`);
      handleSuccess(`Downloaded ${filename}`);

    } catch (error: any) {
      console.error('❌ Error downloading application file:', error);

      if (error.response?.status === 401) {
        handleError('Please log in to download files');
        throw new Error('Authentication required');
      } else if (error.response?.status === 403) {
        handleError('You do not have permission to download this file');
        throw new Error('Permission denied');
      } else if (error.response?.status === 404) {
        handleError('File not found');
        throw new Error('File not found');
      } else {
        throw handleApiError(error, 'Failed to download file');
      }
    }
  },

  // View application file inline with authentication (returns Blob)
  async viewApplicationFile(
    applicationId: string,
    fileId: string,
    fileType?: 'cv' | 'reference' | 'experience' | 'portfolio' | 'other'
  ): Promise<Blob> {
    try {
      debug(`👁️ Viewing file: ${fileId} from application: ${applicationId}`);

      // Use authenticated endpoint
      const viewUrl = `/applications/${applicationId}/files/${fileId}/view`;

      const response = await api.get(viewUrl, {
        responseType: 'blob',
        headers: {
          'Accept': '*/*'
        }
      });

      // Return blob for inline viewing
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });

      debug(`✅ File loaded for viewing`);
      return blob;

    } catch (error: any) {
      console.error('❌ Error viewing application file:', error);

      if (error.response?.status === 401) {
        handleError('Please log in to view files');
        throw new Error('Authentication required');
      } else if (error.response?.status === 403) {
        handleError('You do not have permission to view this file');
        throw new Error('Permission denied');
      } else if (error.response?.status === 404) {
        handleError('File not found');
        throw new Error('File not found');
      } else if (error.response?.status === 400) {
        handleError('This file type cannot be viewed inline. Please download it.');
        throw new Error('File type not viewable inline');
      } else {
        throw handleApiError(error, 'Failed to view file');
      }
    }
  },

  // Helper: Get file from application by ID
  getFileById(application: Application, fileId: string): any {
    // Clean file ID (remove cv-, ref-, exp- prefixes)
    const cleanFileId = fileId.replace(/^(cv-|ref-|exp-|att-)/, '');

    // Search in selected CVs - FIXED TYPE ERROR
    if (application.selectedCVs && application.selectedCVs.length > 0) {
      for (const cv of application.selectedCVs) {
        // CV can have either cvId or _id, handle both
        const cvId = cv.cvId ? cv.cvId.toString() : '';

        // Check if cv has _id property (it might not in some cases)
        const cvHasId = (cv as any)._id;
        const cvDocId = cvHasId ? (cv as any)._id.toString() : '';

        if (cvId === cleanFileId || cvDocId === cleanFileId) {
          return cv;
        }
      }
    }

    // Search in references
    if (application.references && application.references.length > 0) {
      for (const ref of application.references) {
        if (ref.document && ref.document._id && ref.document._id.toString() === cleanFileId) {
          return ref.document;
        }
      }
    }

    // Search in work experience
    if (application.workExperience && application.workExperience.length > 0) {
      for (const exp of application.workExperience) {
        if (exp.document && exp.document._id && exp.document._id.toString() === cleanFileId) {
          return exp.document;
        }
      }
    }

    // Search in other attachments
    if (application.attachments) {
      const allAttachments = [
        ...(application.attachments.referenceDocuments || []),
        ...(application.attachments.experienceDocuments || []),
        ...(application.attachments.portfolioFiles || []),
        ...(application.attachments.otherDocuments || [])
      ];

      for (const att of allAttachments) {
        if (att._id && att._id.toString() === cleanFileId) {
          return att;
        }
      }
    }

    return null;
  },

  // Helper: Get file type from file data
  getFileType(file: any): 'cv' | 'reference' | 'experience' | 'portfolio' | 'other' {
    if (file.cvId || (file.filename && file.filename.includes('cv'))) return 'cv';
    if (file._id && file._id.toString().includes('ref')) return 'reference';
    if (file._id && file._id.toString().includes('exp')) return 'experience';
    if (file._id && file._id.toString().includes('port')) return 'portfolio';
    return 'other';
  },

  // Enhanced file download function that works with all file types
  async downloadFile(file: Attachment | CV | any, type: 'cv' | 'references' | 'experience' | 'applications'): Promise<void> {
    try {
      const plainFile = applicationService.convertMongooseDocToPlainObject(file);

      // If we have an application context, use the new authenticated endpoint
      if (plainFile._id && type !== 'cv') {
        // For non-CV files, we need application context
        throw new Error('Use downloadApplicationFile for application files');
      }

      // For CVs or files without context, use direct download
      const downloadUrl = plainFile.downloadUrl || plainFile.url;

      if (!downloadUrl) {
        throw new Error('No download URL available');
      }

      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = plainFile.originalName || plainFile.filename || 'document';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  // Enhanced view file function
  async viewFile(file: Attachment | CV | any, type: 'cv' | 'references' | 'experience' | 'applications'): Promise<void> {
    try {
      const plainFile = applicationService.convertMongooseDocToPlainObject(file);

      // Get authenticated view URL
      const viewUrl = plainFile.viewUrl || plainFile.url;

      if (!viewUrl) {
        throw new Error('No view URL available');
      }

      // Open in new tab
      window.open(viewUrl, '_blank');
    } catch (error) {
      console.error('Error viewing file:', error);
      throw error;
    }
  },

  // ===== FILE HANDLING METHODS (FIXED - WITH APPLICATION ID) =====

  downloadCV: async (cv: CV, applicationId: string): Promise<void> => {
    return downloadFile(cv, applicationId, 'cv');
  },

  viewCV: async (cv: CV, applicationId: string): Promise<void> => {
    return viewFile(cv, applicationId, 'cv');
  },

  downloadReference: async (reference: Reference, applicationId: string): Promise<void> => {
    if (!reference.document) {
      throw new Error('No document available for this reference');
    }
    return downloadFile(reference.document, applicationId, 'references');
  },

  viewReference: async (reference: Reference, applicationId: string): Promise<void> => {
    if (!reference.document) {
      throw new Error('No document available for this reference');
    }
    return viewFile(reference.document, applicationId, 'references');
  },

  downloadExperience: async (experience: WorkExperience, applicationId: string): Promise<void> => {
    if (!experience.document) {
      throw new Error('No document available for this experience');
    }
    return downloadFile(experience.document, applicationId, 'experience');
  },

  viewExperience: async (experience: WorkExperience, applicationId: string): Promise<void> => {
    if (!experience.document) {
      throw new Error('No document available for this experience');
    }
    return viewFile(experience.document, applicationId, 'experience');
  },

  // Add to applicationService object:

  // Download CV with authentication
  async downloadCVFile(cvId: string, fileName?: string): Promise<void> {
    try {
      debug(`📥 Downloading CV: ${cvId}`);

      const downloadUrl = `/applications/cv/${cvId}/download`;

      const response = await api.get(downloadUrl, {
        responseType: 'blob',
        headers: {
          'Accept': '*/*'
        }
      });

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/pdf'
      });

      let filename = fileName || `cv-${cvId}.pdf`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^'";]*)['"]?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      debug(`✅ CV downloaded: ${filename}`);
      handleSuccess(`Downloaded ${filename}`);

    } catch (error: any) {
      console.error('❌ Error downloading CV:', error);

      if (error.response?.status === 401) {
        handleError('Please log in to download CV');
        throw new Error('Authentication required');
      } else if (error.response?.status === 403) {
        handleError('You do not have permission to download this CV');
        throw new Error('Permission denied');
      } else if (error.response?.status === 404) {
        handleError('CV not found');
        throw new Error('CV not found');
      } else {
        throw handleApiError(error, 'Failed to download CV');
      }
    }
  },

  // View CV inline with authentication
  async viewCVFile(cvId: string): Promise<Blob> {
    try {
      debug(`👁️ Viewing CV: ${cvId}`);

      const viewUrl = `/applications/cv/${cvId}/view`;

      const response = await api.get(viewUrl, {
        responseType: 'blob',
        headers: {
          'Accept': '*/*'
        }
      });

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/pdf'
      });

      debug(`✅ CV loaded for viewing`);
      return blob;

    } catch (error: any) {
      console.error('❌ Error viewing CV:', error);

      if (error.response?.status === 401) {
        handleError('Please log in to view CV');
        throw new Error('Authentication required');
      } else if (error.response?.status === 403) {
        handleError('You do not have permission to view this CV');
        throw new Error('Permission denied');
      } else if (error.response?.status === 404) {
        handleError('CV not found');
        throw new Error('CV not found');
      } else if (error.response?.status === 400) {
        handleError('This CV type cannot be viewed inline. Please download it.');
        throw new Error('CV type not viewable inline');
      } else {
        throw handleApiError(error, 'Failed to view CV');
      }
    }
  },

  // ===== HELPER METHODS =====
  generateTempId,
  validateApplicationData,
  canViewInline,
  // Check if reference has document
  hasReferenceDocument: (reference: Reference): boolean => {
    return reference.providedAsDocument && !!reference.document;
  },

  // Check if experience has document
  hasExperienceDocument: (experience: WorkExperience): boolean => {
    return experience.providedAsDocument && !!experience.document;
  },

  // Get all attachments from application
  getAllAttachments: (application: Application): Attachment[] => {
    const attachments: Attachment[] = [];

    // Add documents from references
    if (application.references) {
      application.references.forEach(ref => {
        if (ref.document && ref.providedAsDocument) {
          attachments.push(ref.document);
        }
      });
    }

    // Add documents from work experience
    if (application.workExperience) {
      application.workExperience.forEach(exp => {
        if (exp.document && exp.providedAsDocument) {
          attachments.push(exp.document);
        }
      });
    }

    return attachments;
  },

  // Add these inside the applicationService = { ... } object

  /**
   * Converts a Mongoose document (or any data object) to a plain JS object
   * and handles common ID and date conversions.
   */
  convertMongooseDocToPlainObject: (doc: any): any => {
    if (!doc) return null;

    // If it's an array, map over it
    if (Array.isArray(doc)) {
      return doc.map(item => applicationService.convertMongooseDocToPlainObject(item));
    }

    // Clone the object to avoid mutating the original
    const plainObj = { ...doc };

    // Normalize ID: Ensure _id is a string and handle 'id' alias
    if (plainObj._id) plainObj._id = plainObj._id.toString();
    if (plainObj.id) plainObj.id = plainObj.id.toString();

    // Clean up Mongoose internal fields
    delete plainObj.__v;

    return plainObj;
  },

  /**
   * Formats a raw application response to ensure it adheres to the 
   * Application interface and handles nested objects.
   */
  formatApplication: (application: any): Application => {
    if (!application) return null as any;

    const formatted = {
      ...application,
      _id: application._id?.toString() || application.id?.toString(),
      // Ensure arrays exist even if backend returns undefined
      skills: application.skills || [],
      references: application.references || [],
      workExperience: application.workExperience || [],
      statusHistory: application.statusHistory || [],
      selectedCVs: application.selectedCVs || [],

      // Ensure dates are stringified if they come as Date objects
      createdAt: application.createdAt ? new Date(application.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: application.updatedAt ? new Date(application.updatedAt).toISOString() : new Date().toISOString(),
    };

    // Format nested Job information if available
    if (formatted.job && typeof formatted.job === 'object') {
      formatted.job._id = formatted.job._id?.toString() || formatted.job.id?.toString();
    }

    // Format nested Candidate information if available
    if (formatted.candidate && typeof formatted.candidate === 'object') {
      formatted.candidate._id = formatted.candidate._id?.toString() || formatted.candidate.id?.toString();
    }

    return formatted as Application;
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

  getCompanyResponseLabel: (status: string): string => {
    const responseLabels: { [key: string]: string } = {
      'active-consideration': 'Active Consideration',
      'on-hold': 'On Hold / Waiting List',
      'rejected': 'Rejected',
      'selected-for-interview': 'Selected for Interview'
    };
    return responseLabels[status] || status;
  },

  // Helper to prepare references for submission
  prepareReferencesForSubmission: (references: Reference[]): Reference[] => {
    return references.map(ref => {
      const { _tempId, ...rest } = ref;
      return {
        ...rest,
        _tempId: ref.providedAsDocument ? (_tempId || generateTempId()) : undefined
      };
    });
  },

  // Helper to prepare work experience for submission
  prepareWorkExperienceForSubmission: (workExperience: WorkExperience[]): WorkExperience[] => {
    return workExperience.map(exp => {
      const { _tempId, ...rest } = exp;
      return {
        ...rest,
        _tempId: exp.providedAsDocument ? (_tempId || generateTempId()) : undefined
      };
    });
  },

  // Debug helper
  debugApplicationData: (data: ApplyForJobData) => {
    console.log('🔍 [ApplicationService] Debug application data:', {
      coverLetterLength: data.coverLetter?.length,
      skills: data.skills?.length,
      references: data.references?.map((ref, i) => ({
        index: i,
        name: ref.name,
        providedAsDocument: ref.providedAsDocument,
        hasTempId: !!ref._tempId
      })),
      workExperience: data.workExperience?.map((exp, i) => ({
        index: i,
        company: exp.company,
        providedAsDocument: exp.providedAsDocument,
        hasTempId: !!exp._tempId
      })),
      selectedCVs: data.selectedCVs?.length
    });
  }
};

export default applicationService;