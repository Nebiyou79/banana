/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useTenders.ts - UPDATED FOR CLOUDINARY
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  tenderService,
  Tender,
  TenderFilter,
  CreateFreelanceTenderData,
  CreateProfessionalTenderData,
  TendersResponse,
  SingleTenderResponse,
  freelanceTenderSchema,
  professionalTenderSchema,
  invitationSchema,
  isTenderActive,
  canEditTender,
  canViewProposals,
  formatDeadline,
  getStatusColor,
  calculateProgress,
  formatFileSize,
  TENDER_STATUSES,
  WORKFLOW_TYPES,
  VISIBILITY_TYPES,
  ENGAGEMENT_TYPES,
  EXPERIENCE_LEVELS,
  PROJECT_TYPES,
  PROCUREMENT_METHODS,
  EVALUATION_METHODS,
  CURRENCIES,
  TIME_UNITS,
  DOCUMENT_TYPES,
  FILE_UPLOAD_CONSTRAINTS,
  DEFAULT_TENDER_SETTINGS,
  ViewMode,
  getViewModeFromStorage,
  saveViewModeToStorage,
  sortTenders,
  getCloudinaryDownloadUrl,
  getCloudinaryPreviewUrl,
  isCloudinaryAttachment,
  TenderAttachment
} from '@/services/tenderService';
import {
  validateFreelanceTender,
  validateProfessionalTender,
  validateInvitation,
  validateDeadline,
  validateBudget,
  validateSkills,
  validateFileUpload,
  validateRequiredFields,
  formatValidationErrors
} from '@/utils/tenderValidation';
import React from 'react';
import { useAuth } from './useAuth';

// ============ QUERY KEYS ============
export const tenderKeys = {
  all: ['tenders'] as const,
  lists: () => [...tenderKeys.all, 'list'] as const,
  list: (filters: TenderFilter) => [...tenderKeys.lists(), filters] as const,
  details: () => [...tenderKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenderKeys.details(), id] as const,
  myTenders: () => [...tenderKeys.all, 'my'] as const,
  savedTenders: () => [...tenderKeys.all, 'saved'] as const,
  invitations: () => [...tenderKeys.all, 'invitations'] as const,
  categories: (type?: string, format?: string) => [...tenderKeys.all, 'categories', type, format] as const,
  stats: (id: string) => [...tenderKeys.detail(id), 'stats'] as const,
  analytics: (timeRange?: string) => [...tenderKeys.all, 'analytics', timeRange] as const,
};

// ============ CPO UTILITIES ============

/**
 * Hook for CPO-related utilities
 */
export const useCPOUtils = () => {
  // Check if a tender requires CPO
  const isCPORequired = useCallback((tender: Tender | undefined): boolean => {
    if (!tender) return false;
    return tender.tenderCategory === 'professional' &&
      tender.professionalSpecific?.cpoRequired === true;
  }, []);

  // Get CPO description from tender
  const getCPODescription = useCallback((tender: Tender | undefined): string => {
    if (!tender || tender.tenderCategory !== 'professional') return '';
    return tender.professionalSpecific?.cpoDescription || '';
  }, []);

  // Get CPO info from tender
  const getCPOInfo = useCallback((tender: Tender) => {
    const isRequired = isCPORequired(tender);
    const description = getCPODescription(tender);

    return {
      required: isRequired,
      description: description,
      hasDescription: !!description.trim(),
    };
  }, [isCPORequired, getCPODescription]);

  return {
    isCPORequired,
    getCPODescription,
    getCPOInfo,
  };
};

// ============ CLOUDINARY UTILITIES ============

/**
 * Hook for Cloudinary attachment utilities
 */
export const useCloudinaryUtils = () => {
  // Get download URL for attachment
  const getAttachmentDownloadUrl = useCallback((attachment: TenderAttachment): string => {
    return getCloudinaryDownloadUrl(attachment);
  }, []);

  // Get preview URL for attachment
  const getAttachmentPreviewUrl = useCallback((attachment: TenderAttachment): string => {
    return getCloudinaryPreviewUrl(attachment);
  }, []);

  // Check if attachment is from Cloudinary
  const isAttachmentFromCloudinary = useCallback((attachment: TenderAttachment): boolean => {
    return isCloudinaryAttachment(attachment);
  }, []);

  // Download attachment
  const downloadAttachment = useCallback(async (tenderId: string, attachmentId: string) => {
    try {
      const blob = await tenderService.downloadAttachment(tenderId, attachmentId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get attachment info for filename
      const attachment = await tenderService.getAttachmentInfo(tenderId, attachmentId);
      link.setAttribute('download', attachment.originalName || 'attachment');
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up URL
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading attachment:', error);
      return { success: false, error };
    }
  }, []);

  return {
    getAttachmentDownloadUrl,
    getAttachmentPreviewUrl,
    isAttachmentFromCloudinary,
    downloadAttachment,
  };
};

// ============ MAIN HOOKS ============

/**
 * Hook for fetching tenders with filters
 */
export const useTenders = (initialFilters?: TenderFilter) => {
  const [filters, setFilters] = useState<TenderFilter>({
    page: 1,
    limit: 12,
    status: 'published',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
    cpoRequired: initialFilters?.cpoRequired ?? false,
  });

  const queryOptions: UseQueryOptions<TendersResponse, Error> = {
    queryKey: tenderKeys.list(filters),
    queryFn: () => tenderService.getTenders(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  };

  const { data, isLoading, error, refetch, isFetching } = useQuery(queryOptions);

  const updateFilters = useCallback((newFilters: Partial<TenderFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  return {
    tenders: data?.data || [],
    pagination: data?.pagination || { page: 1, limit: 12, total: 0, pages: 0 },
    isLoading: isLoading || isFetching,
    error,
    filters,
    updateFilters,
    refetch,
    setPage: (page: number) => updateFilters({ page }),
    setLimit: (limit: number) => updateFilters({ limit }),
  };
};

/**
 * Hook for creating professional tenders with CPO support
 */
export const useCreateProfessionalTender = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ data, files }: { data: CreateProfessionalTenderData; files?: File[] }) => {
      const tenderData: CreateProfessionalTenderData = {
        ...data,
        cpoRequired: data.cpoRequired || false,
        cpoDescription: data.cpoRequired ? data.cpoDescription || '' : undefined,
      };

      return await tenderService.createProfessionalTender(tenderData, files);
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tenderKeys.myTenders() });

      toast({
        title: 'Success',
        description: 'Professional tender created successfully',
        variant: 'success',
      });

      return response.tender;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating tender',
        description: error.message || 'Failed to create professional tender',
        variant: 'destructive',
      });
    },
  });
};

// ============ FREELANCE TENDER FORM HOOK WITH CLOUDINARY ============

/**
 * Hook for freelance tender form management
 */
export const useFreelanceTenderForm = () => {
  const [formData, setFormData] = useState<Partial<CreateFreelanceTenderData>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileDescriptions, setFileDescriptions] = useState<string[]>([]);
  const [fileTypes, setFileTypes] = useState<string[]>([]);

  const constants = useTenderConstants();
  const utils = useTenderUtils();
  const validation = useTenderValidation();

  // Update form field
  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // File management
  const addFile = useCallback((file: File, description?: string, fileType?: string) => {
    if (utils.checkFileUpload([file])) {
      setFiles(prev => [...prev, file]);
      setFileDescriptions(prev => [...prev, description || '']);
      setFileTypes(prev => [...prev, fileType || 'other']);
    }
  }, [utils]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileDescriptions(prev => prev.filter((_, i) => i !== index));
    setFileTypes(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Validate form
  const validateForm = useCallback(() => {
    return validation.validateFreelanceTender(formData);
  }, [formData, validation]);

  // Prepare form data for submission
  const getFormDataForSubmit = useCallback((): CreateFreelanceTenderData => {
    const data: CreateFreelanceTenderData = {
      tenderCategory: 'freelance',
      title: formData.title || '',
      description: formData.description || '',
      procurementCategory: formData.procurementCategory || '',
      deadline: formData.deadline || '',
      workflowType: formData.workflowType || 'open',
      status: formData.status || 'draft',
      engagementType: formData.engagementType || 'fixed_price',

      projectType: formData.projectType || constants.defaultSettings.freelance.defaultProjectType,
      skillsRequired: formData.skillsRequired,
      budget: formData.budget || { min: 0, max: 0, currency: 'USD' },
      estimatedDuration: formData.estimatedDuration || { value: 30, unit: 'days' },
      weeklyHours: formData.weeklyHours,
      experienceLevel: formData.experienceLevel || constants.defaultSettings.freelance.defaultExperienceLevel,
      portfolioRequired: formData.portfolioRequired || false,
      languagePreference: formData.languagePreference,
      timezonePreference: formData.timezonePreference,
      screeningQuestions: formData.screeningQuestions || [],
      ndaRequired: formData.ndaRequired || false,
      urgency: formData.urgency || 'normal',
      industry: formData.industry,
      sealedBidConfirmation: formData.sealedBidConfirmation,
      maxFileSize: formData.maxFileSize,
      maxFileCount: formData.maxFileCount,

      fileDescriptions: files.length > 0 ? fileDescriptions : undefined,
      fileTypes: files.length > 0 ? fileTypes : undefined,
    };

    return data;
  }, [formData, files, fileDescriptions, fileTypes, constants]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({});
    setFiles([]);
    setFileDescriptions([]);
    setFileTypes([]);
  }, []);

  return {
    formData,
    files,
    fileDescriptions,
    fileTypes,
    updateFormData,
    addFile,
    removeFile,
    validateForm,
    getFormDataForSubmit,
    resetForm,
  };
};

// ============ PROFESSIONAL TENDER FORM HOOK WITH CLOUDINARY ============

/**
 * Hook for professional tender form management with CPO
 */
export const useProfessionalTenderForm = () => {
  const [formData, setFormData] = useState<Partial<CreateProfessionalTenderData>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileDescriptions, setFileDescriptions] = useState<string[]>([]);
  const [fileTypes, setFileTypes] = useState<string[]>([]);

  const constants = useTenderConstants();
  const utils = useTenderUtils();
  const validation = useTenderValidation();

  // Update form field
  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Toggle CPO requirement
  const toggleCPORequired = useCallback((required: boolean) => {
    setFormData(prev => ({
      ...prev,
      cpoRequired: required,
      cpoDescription: required ? prev.cpoDescription || '' : undefined,
    }));
  }, []);

  // Update CPO description
  const updateCPODescription = useCallback((description: string) => {
    setFormData(prev => ({
      ...prev,
      cpoDescription: description,
    }));
  }, []);

  // File management
  const addFile = useCallback((file: File, description?: string, fileType?: string) => {
    if (utils.checkFileUpload([file])) {
      setFiles(prev => [...prev, file]);
      setFileDescriptions(prev => [...prev, description || '']);
      setFileTypes(prev => [...prev, fileType || 'other']);
    }
  }, [utils]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileDescriptions(prev => prev.filter((_, i) => i !== index));
    setFileTypes(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Validate form
  const validateForm = useCallback(() => {
    return validation.validateProfessionalTender(formData);
  }, [formData, validation]);

  // Prepare form data for submission
  const getFormDataForSubmit = useCallback((): CreateProfessionalTenderData => {
    const data: CreateProfessionalTenderData = {
      tenderCategory: 'professional',
      title: formData.title || '',
      description: formData.description || '',
      procurementCategory: formData.procurementCategory || '',
      deadline: formData.deadline || '',
      referenceNumber: formData.referenceNumber || '',
      procuringEntity: formData.procuringEntity || '',
      workflowType: formData.workflowType || 'open',
      status: formData.status || 'draft',
      visibilityType: formData.visibilityType || 'public',

      cpoRequired: formData.cpoRequired || false,
      cpoDescription: formData.cpoRequired ? formData.cpoDescription || '' : undefined,

      procurementMethod: formData.procurementMethod,
      fundingSource: formData.fundingSource,
      skillsRequired: formData.skillsRequired,
      minimumExperience: formData.minimumExperience,
      requiredCertifications: formData.requiredCertifications,
      legalRegistrationRequired: formData.legalRegistrationRequired,
      financialCapacity: formData.financialCapacity,
      pastProjectReferences: formData.pastProjectReferences,
      projectObjectives: formData.projectObjectives,
      deliverables: formData.deliverables,
      milestones: formData.milestones,
      timeline: formData.timeline,
      evaluationMethod: formData.evaluationMethod,
      evaluationCriteria: formData.evaluationCriteria,
      bidValidityPeriod: formData.bidValidityPeriod,
      clarificationDeadline: formData.clarificationDeadline,
      preBidMeeting: formData.preBidMeeting,
      allowedCompanies: formData.allowedCompanies,
      allowedUsers: formData.allowedUsers,
      sealedBidConfirmation: formData.sealedBidConfirmation,
      maxFileSize: formData.maxFileSize,
      maxFileCount: formData.maxFileCount,

      fileDescriptions: files.length > 0 ? fileDescriptions : undefined,
      fileTypes: files.length > 0 ? fileTypes : undefined,
    };

    return data;
  }, [formData, files, fileDescriptions, fileTypes]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({});
    setFiles([]);
    setFileDescriptions([]);
    setFileTypes([]);
  }, []);

  // Check if CPO is required
  const isCPORequired = useMemo(() => {
    return formData.cpoRequired === true;
  }, [formData.cpoRequired]);

  return {
    formData,
    files,
    fileDescriptions,
    fileTypes,
    isCPORequired,
    updateFormData,
    toggleCPORequired,
    updateCPODescription,
    addFile,
    removeFile,
    validateForm,
    getFormDataForSubmit,
    resetForm,
  };
};

/**
 * Unified hook for tender form management
 */
export const useTenderForm = (type: 'freelance' | 'professional') => {
  const professionalForm = useProfessionalTenderForm();
  const freelanceForm = useFreelanceTenderForm();

  return type === 'professional' ? professionalForm : freelanceForm;
};

/**
 * Hook for creating freelance tenders
 */
export const useCreateFreelanceTender = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ data, files }: { data: CreateFreelanceTenderData; files?: File[] }) =>
      tenderService.createFreelanceTender(data, files),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tenderKeys.myTenders() });

      toast({
        title: 'Success',
        description: 'Freelance tender created successfully',
        variant: 'success',
      });

      return response.tender;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating tender',
        description: error.message || 'Failed to create freelance tender',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for updating tenders
 */
export const useUpdateTender = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data, files }: { id: string; data: Partial<Tender>; files?: File[] }) =>
      tenderService.updateTender(id, data, files),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: tenderKeys.lists() });

      toast({
        title: 'Success',
        description: 'Tender updated successfully',
        variant: 'success',
      });

      return response.tender;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating tender',
        description: error.message || 'Failed to update tender',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for deleting tenders
 */
export const useDeleteTender = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => tenderService.deleteTender(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tenderKeys.myTenders() });
      queryClient.removeQueries({ queryKey: tenderKeys.detail(id) });

      toast({
        title: 'Success',
        description: 'Tender deleted successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting tender',
        description: error.message || 'Failed to delete tender',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for publishing tenders
 */
export const usePublishTender = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => tenderService.publishTender(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tenderKeys.lists() });

      toast({
        title: 'Success',
        description: 'Tender published successfully',
        variant: 'success',
      });

      return response.tender;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error publishing tender',
        description: error.message || 'Failed to publish tender',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for revealing proposals in closed tenders
 */
export const useRevealProposals = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => tenderService.revealProposals(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.detail(id) });

      toast({
        title: 'Success',
        description: 'Proposals revealed successfully',
        variant: 'success',
      });

      return response.tender;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error revealing proposals',
        description: error.message || 'Failed to reveal proposals',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for fetching user's tenders
 */
export const useMyTenders = () => {
  return useQuery({
    queryKey: tenderKeys.myTenders(),
    queryFn: () => tenderService.getMyTenders(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for fetching pre-filled tender data for editing
 */
export const useTenderForEditing = (id: string) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['tenderForEditing', id],
    queryFn: async () => {
      return await tenderService.getTenderForEditing(id);
    },
    enabled: !!id && !!user,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403) {
        return false;
      }
      return failureCount < 1;
    },
  });

  return {
    tender: query.data?.tender,
    originalTender: query.data?.originalTender,
    canEdit: query.data?.canEdit || false,
    workflowType: query.data?.workflowType,
    status: query.data?.status,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for checking if tender can be edited
 */
export const useTenderEditable = (id: string) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['tenderEditable', id],
    queryFn: () => tenderService.checkTenderEditable(id),
    enabled: !!id && !!user,
  });

  return {
    canEdit: query.data?.canEdit || false,
    restriction: query.data?.restriction,
    workflowType: query.data?.workflowType,
    status: query.data?.status,
    isLoading: query.isLoading,
    error: query.error,
  };
};

/**
 * Hook for fetching owned tenders
 */
export const useOwnedTenders = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  tenderCategory?: string;
  workflowType?: string;
}) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['ownedTenders', params],
    queryFn: () => tenderService.getOwnedTenders(params),
    enabled: !!user,
  });

  return {
    tenders: query.data?.tenders || [],
    pagination: query.data?.pagination || { page: 1, limit: 10, total: 0, pages: 0 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching owner-specific tender data
 */
export const useOwnerTender = (id: string) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['ownerTender', id],
    queryFn: async () => {
      return await tenderService.getOwnerTender(id);
    },
    enabled: !!id && !!user,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403) {
        return false;
      }
      return failureCount < 1;
    },
  });

  return {
    tender: query.data?.tender,
    canViewProposals: query.data?.canViewProposals || false,
    isOwner: query.data?.isOwner || false,
    canEdit: query.data?.canEdit || false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching company-owned tenders
 */
export const useCompanyTender = (id: string) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['companyTender', id],
    queryFn: async () => {
      const response = await tenderService.getTender(id, { isOwner: true });
      return response;
    },
    enabled: !!id && !!user && (user.role === 'company' || user.role === 'organization'),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403 || error?.message?.includes('Access denied')) {
        return false;
      }
      return failureCount < 1;
    },
  });

  return {
    tender: query.data?.data?.tender,
    canViewProposals: query.data?.data?.canViewProposals || false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching public tenders (for freelancers)
 */
export const usePublicTender = (id: string) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['publicTender', id],
    queryFn: async () => {
      const response = await tenderService.getTender(id, { isOwner: false });
      return response;
    },
    enabled: !!id,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403 || error?.message?.includes('Access denied')) {
        return false;
      }
      return failureCount < 1;
    },
  });

  return {
    tender: query.data?.data?.tender,
    canViewProposals: query.data?.data?.canViewProposals || false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};

// Update the existing useTender hook to include isOwner option
export const useTender = (id: string, options?: { isOwner?: boolean }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['tender', id, options?.isOwner],
    queryFn: async () => {
      const isOwnerView = options?.isOwner !== undefined
        ? options.isOwner
        : (user?.role === 'company' || user?.role === 'organization');

      const response = await tenderService.getTender(id, { isOwner: isOwnerView });
      return response;
    },
    enabled: !!id,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403 || error?.message?.includes('Access denied')) {
        return false;
      }
      return failureCount < 1;
    },
  });

  return {
    tender: query.data?.data?.tender,
    canViewProposals: query.data?.data?.canViewProposals || false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for toggling tender save status
 */
export const useToggleSaveTender = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => tenderService.toggleSaveTender(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tenderKeys.savedTenders() });

      toast({
        title: response.saved ? 'Saved' : 'Removed',
        description: response.saved
          ? 'Tender added to saved list'
          : 'Tender removed from saved list',
        variant: response.saved ? 'success' : 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update save status',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for fetching saved tenders
 */
export const useSavedTenders = () => {
  return useQuery({
    queryKey: tenderKeys.savedTenders(),
    queryFn: () => tenderService.getSavedTenders(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for fetching tender statistics
 */
export const useTenderStats = (id: string) => {
  return useQuery({
    queryKey: tenderKeys.stats(id),
    queryFn: () => tenderService.getTenderStats(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook for fetching categories
 */
export const useCategories = (type?: string, format?: string) => {
  return useQuery({
    queryKey: tenderKeys.categories(type, format),
    queryFn: async () => {
      const response = await tenderService.getCategories(type as any, format as any);

      if (type) {
        return {
          groups: response.groups || {},
          allCategories: response.allCategories || [],
          stats: response.stats
        };
      } else {
        return response;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for handling category selection in forms
 */
export const useTenderCategories = (tenderType: 'freelance' | 'professional') => {
  const { data: categoriesData, isLoading, error } = useCategories(tenderType, 'grouped');

  const groups = categoriesData?.groups || {};

  const categoryOptions = React.useMemo(() => {
    const options: Array<{ value: string; label: string; group?: string }> = [];

    Object.entries(groups).forEach(([groupKey, group]) => {
      options.push({
        value: `group_${groupKey}`,
        label: group.name,
        group: 'header'
      });

      group.subcategories.forEach(subcat => {
        options.push({
          value: subcat.id,
          label: `  ${subcat.name}`,
          group: group.name
        });
      });
    });

    return options;
  }, [groups]);

  const allCategories = React.useMemo(() => {
    return categoriesData?.allCategories || [];
  }, [categoriesData]);

  const findCategoryById = React.useCallback((categoryId: string) => {
    for (const [groupKey, group] of Object.entries(groups)) {
      const subcategory = group.subcategories.find(sub => sub.id === categoryId);
      if (subcategory) {
        return {
          ...subcategory,
          group: group.name,
          groupKey
        };
      }
    }
    return null;
  }, [groups]);

  return {
    groups,
    categoryOptions,
    allCategories,
    findCategoryById,
    isLoading,
    error,
    stats: categoriesData?.stats
  };
};

/**
 * Hook for invitation management
 */
export const useInvitations = () => {
  return useQuery({
    queryKey: tenderKeys.invitations(),
    queryFn: () => tenderService.getMyInvitations(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook for inviting users to tender
 */
export const useInviteUsersToTender = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { users?: string[]; companies?: string[]; emails?: string[] } }) =>
      tenderService.inviteUsersToTender(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.detail(variables.id) });

      toast({
        title: 'Success',
        description: 'Invitations sent successfully',
        variant: 'success',
      });

      return response.stats;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error sending invitations',
        description: error.message || 'Failed to send invitations',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for responding to invitations
 */
export const useRespondToInvitation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tenderId, inviteId, status }: {
      tenderId: string;
      inviteId: string;
      status: 'accepted' | 'declined'
    }) => tenderService.respondToInvitation(tenderId, inviteId, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.invitations() });

      toast({
        title: 'Success',
        description: status === 'accepted'
          ? 'Invitation accepted'
          : 'Invitation declined',
        variant: 'success',
      });

      return response;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to respond to invitation',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for analytics
 */
export const useTenderAnalytics = (timeRange?: string) => {
  return useQuery({
    queryKey: tenderKeys.analytics(timeRange),
    queryFn: () => tenderService.getAnalytics(timeRange as any),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for bulk operations
 */
export const useBulkOperations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const bulkUpdateStatus = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      tenderService.bulkUpdateStatus(ids, status as any),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.lists() });

      toast({
        title: 'Success',
        description: `Updated status for ${variables.ids.length} tender(s)`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating status',
        description: error.message || 'Failed to update tender status',
        variant: 'destructive',
      });
    },
  });

  const exportTenders = useMutation({
    mutationFn: (filters?: TenderFilter) => tenderService.exportTenders(filters),
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tenders-${new Date().toISOString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Success',
        description: 'Tenders exported successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error exporting tenders',
        description: error.message || 'Failed to export tenders',
        variant: 'destructive',
      });
    },
  });

  return {
    bulkUpdateStatus: {
      mutate: bulkUpdateStatus.mutate,
      mutateAsync: bulkUpdateStatus.mutateAsync,
      isLoading: bulkUpdateStatus.status === 'pending',
      isError: bulkUpdateStatus.status === 'error',
      error: bulkUpdateStatus.error,
    },
    exportTenders: {
      mutate: exportTenders.mutate,
      mutateAsync: exportTenders.mutateAsync,
      isLoading: exportTenders.status === 'pending',
      isError: exportTenders.status === 'error',
      error: exportTenders.error,
    },
  };
};

// ============ ATTACHMENT HOOKS WITH CLOUDINARY ============

/**
 * Hook for downloading attachments with Cloudinary support
 */
export const useDownloadAttachment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const cloudinaryUtils = useCloudinaryUtils();

  return useMutation({
    mutationFn: async ({ tenderId, attachmentId }: { tenderId: string; attachmentId: string }) => {
      return await cloudinaryUtils.downloadAttachment(tenderId, attachmentId);
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: tenderKeys.detail(variables.tenderId) });
      } else {
        toast({
          title: 'Download Failed',
          description: result.error?.message || 'Failed to download file',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download file',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for deleting attachments with Cloudinary support
 */
export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tenderId, attachmentId, cloudinaryPublicId }: { 
      tenderId: string; 
      attachmentId: string; 
      cloudinaryPublicId?: string 
    }) => tenderService.deleteAttachment(tenderId, attachmentId, cloudinaryPublicId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.detail(variables.tenderId) });

      toast({
        title: 'Success',
        description: 'Attachment deleted successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete attachment',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for uploading attachments with Cloudinary
 */
export const useUploadAttachments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      tenderId,
      files,
      descriptions,
      types
    }: {
      tenderId: string;
      files: File[];
      descriptions?: string[];
      types?: string[]
    }) => tenderService.uploadAttachments(tenderId, files, descriptions, types),
    onSuccess: (attachments, variables) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.detail(variables.tenderId) });

      toast({
        title: 'Success',
        description: `${attachments.length} file(s) uploaded successfully`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload files',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for getting attachment preview URL with Cloudinary support
 */
export const useAttachmentPreview = () => {
  const cloudinaryUtils = useCloudinaryUtils();

  return {
    getPreviewUrl: cloudinaryUtils.getAttachmentPreviewUrl,
    isCloudinaryAttachment: cloudinaryUtils.isAttachmentFromCloudinary,
  };
};

// ============ UTILITY HOOKS ============

/**
 * Hook for tender validation
 */
export const useTenderValidation = () => {
  return {
    validateFreelanceTender,
    validateProfessionalTender,
    validateInvitation,
    validateDeadline,
    validateBudget,
    validateSkills,
    validateFileUpload,
    validateRequiredFields,
    formatValidationErrors,
  };
};

/**
 * Hook for tender utilities
 */
export const useTenderUtils = () => {
  const { toast } = useToast();
  const cloudinaryUtils = useCloudinaryUtils();

  const checkFileUpload = useCallback((files: File[]) => {
    const errors: string[] = [];

    if (files.length > FILE_UPLOAD_CONSTRAINTS.maxFileCount) {
      errors.push(`Maximum ${FILE_UPLOAD_CONSTRAINTS.maxFileCount} files allowed`);
    }

    files.forEach((file, index) => {
      if (file.size > FILE_UPLOAD_CONSTRAINTS.maxFileSize) {
        errors.push(`${file.name} exceeds maximum file size of ${formatFileSize(FILE_UPLOAD_CONSTRAINTS.maxFileSize)}`);
      }

      const isAllowedType = FILE_UPLOAD_CONSTRAINTS.allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return file.type.startsWith(category + '/');
        }
        return file.type === type;
      });

      if (!isAllowedType) {
        errors.push(`${file.name} has unsupported file type: ${file.type}`);
      }
    });

    if (errors.length > 0) {
      errors.forEach(error => {
        toast({
          title: 'File Error',
          description: error,
          variant: 'destructive',
        });
      });
      return false;
    }

    return true;
  }, [toast]);

  const formatTenderData = useCallback((data: any, type: 'freelance' | 'professional') => {
    const formatted = { ...data };

    if (formatted.deadline) {
      formatted.deadline = new Date(formatted.deadline).toISOString();
    }

    if (type === 'freelance') {
      if (formatted.freelanceSpecific?.estimatedDuration?.deadline) {
        formatted.freelanceSpecific.estimatedDuration.deadline =
          new Date(formatted.freelanceSpecific.estimatedDuration.deadline).toISOString();
      }
    }

    if (type === 'professional') {
      if (formatted.professionalSpecific?.clarificationDeadline) {
        formatted.professionalSpecific.clarificationDeadline =
          new Date(formatted.professionalSpecific.clarificationDeadline).toISOString();
      }

      if (formatted.professionalSpecific?.preBidMeeting?.date) {
        formatted.professionalSpecific.preBidMeeting.date =
          new Date(formatted.professionalSpecific.preBidMeeting.date).toISOString();
      }
    }

    return formatted;
  }, []);

  return {
    isTenderActive,
    canEditTender,
    canViewProposals,
    formatDeadline,
    getStatusColor,
    calculateProgress,
    formatFileSize,
    checkFileUpload,
    formatTenderData,
    getAttachmentDownloadUrl: cloudinaryUtils.getAttachmentDownloadUrl,
    getAttachmentPreviewUrl: cloudinaryUtils.getAttachmentPreviewUrl,
    isAttachmentFromCloudinary: cloudinaryUtils.isAttachmentFromCloudinary,
  };
};

/**
 * Hook for managing tender view mode
 */
export const useTenderViewMode = (tenderType: 'freelance' | 'professional') => {
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getViewModeFromStorage(tenderType)
  );

  const updateViewMode = useCallback((newMode: Partial<ViewMode>) => {
    setViewMode(prev => {
      const updated = { ...prev, ...newMode };
      saveViewModeToStorage(tenderType, updated);
      return updated;
    });
  }, [tenderType]);

  const setCardSize = useCallback((size: 'small' | 'medium' | 'large') => {
    setViewMode(prev => {
      const updated = { ...prev, cardSize: size };
      saveViewModeToStorage(tenderType, updated);
      return updated;
    });
  }, [tenderType]);

  return {
    viewMode,
    updateViewMode,
    setCardSize,
    isGridView: viewMode.type === 'grid',
    isListView: viewMode.type === 'list',
  };
};

/**
 * Enhanced hook for fetching tenders with view mode
 */
export const useTendersWithViewMode = (initialFilters?: TenderFilter, tenderType?: 'freelance' | 'professional') => {
  const filters = useTenders(initialFilters);
  const viewMode = useTenderViewMode(tenderType || 'freelance');

  return {
    ...filters,
    ...viewMode,
  };
};

/**
 * Hook for tender sorting
 */
export const useTenderSorting = (tenders: Tender[]) => {
  const [sortConfig, setSortConfig] = useState<{
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const sortedTenders = useMemo(() => {
    return sortTenders(tenders, sortConfig.sortBy, sortConfig.sortOrder);
  }, [tenders, sortConfig]);

  const updateSort = useCallback((sortBy: string, sortOrder?: 'asc' | 'desc') => {
    setSortConfig(prev => {
      if (sortBy === prev.sortBy) {
        return {
          sortBy,
          sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        sortBy,
        sortOrder: sortOrder || 'desc',
      };
    });
  }, []);

  return {
    sortedTenders,
    sortConfig,
    updateSort,
  };
};

/**
 * Hook for getting tender constants
 */
export const useTenderConstants = () => {
  return {
    statuses: TENDER_STATUSES,
    workflowTypes: WORKFLOW_TYPES,
    visibilityTypes: VISIBILITY_TYPES,
    engagementTypes: ENGAGEMENT_TYPES,
    experienceLevels: EXPERIENCE_LEVELS,
    projectTypes: PROJECT_TYPES,
    procurementMethods: PROCUREMENT_METHODS,
    evaluationMethods: EVALUATION_METHODS,
    currencies: CURRENCIES,
    timeUnits: TIME_UNITS,
    documentTypes: DOCUMENT_TYPES,
    fileUploadConstraints: FILE_UPLOAD_CONSTRAINTS,
    defaultSettings: DEFAULT_TENDER_SETTINGS,
  };
};