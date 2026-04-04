/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useTenders.ts - FIXED WITH TRY/CATCH FOR downloadAttachment

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  tenderService,
  Tender,
  TenderFilter,
  CreateFreelanceTenderData,
  CreateProfessionalTenderData,
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
  TenderAttachment,
  WorkflowType,
  Currency,
  EngagementType,
  ExperienceLevel,
  ProjectType,
  TenderCreationStatus,
  getLocalDownloadUrl,
  getLocalPreviewUrl,
  FreelanceTenderFilter,
  ProfessionalTenderFilter,
  TendersResponse
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
import { useRouter, useSearchParams } from 'next/navigation';

// ============ QUERY KEYS ============
export const tenderKeys = {
  all: ['tenders'] as const,
  lists: () => [...tenderKeys.all, 'list'] as const,
  list: (filters: TenderFilter) => [...tenderKeys.lists(), filters] as const,
  professionalList: (filters?: TenderFilter) => [...tenderKeys.all, 'professional', 'list', filters || {}] as const,
  freelanceList: (filters?: TenderFilter) => [...tenderKeys.all, 'freelance', 'list', filters || {}] as const,
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

// ============ LOCAL FILE UTILITIES ============

/**
 * Hook for local file attachment utilities - FIXED with try/catch for downloadAttachment
 */
export const useLocalFileUtils = () => {
  const { toast } = useToast();

  // Get download URL for attachment
  const getAttachmentDownloadUrl = useCallback((attachment: TenderAttachment): string => {
    return getLocalDownloadUrl(attachment);
  }, []);

  // Get preview URL for attachment
  const getAttachmentPreviewUrl = useCallback((attachment: TenderAttachment): string => {
    return getLocalPreviewUrl(attachment);
  }, []);

  // Download attachment - FIXED with try/catch for getAttachmentInfo
  const downloadAttachment = useCallback(async (tenderId: string, attachmentId: string, filename?: string) => {
    try {
      let finalFilename = filename;

      // Try to get attachment info first to get the filename
      if (!finalFilename) {
        try {
          // FIX: Add try/catch around getAttachmentInfo so download still works even if this fails
          const info = await tenderService.getAttachmentInfo(tenderId, attachmentId);
          finalFilename = info.originalName || info.fileName || `attachment-${attachmentId}`;
        } catch (infoError) {
          console.warn("Could not fetch attachment info, using attachmentId as filename", infoError);
          finalFilename = `attachment-${attachmentId}`;
        }
      }

      const blob = await tenderService.downloadAttachment(tenderId, attachmentId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', finalFilename || 'attachment');

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up URL
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download started',
        description: finalFilename,
        variant: 'success',
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error downloading attachment:', error);

      // Check for 403 error
      if (error.response?.status === 403 || error.message?.includes('403')) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to download this file.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Download Failed',
          description: error.message || 'Failed to download file',
          variant: 'destructive',
        });
      }

      return { success: false, error };
    }
  }, [toast]);

  return {
    getAttachmentDownloadUrl,
    getAttachmentPreviewUrl,
    downloadAttachment,
  };
};

// ============ PROFESSIONAL TENDERS HOOK ============
/**
 * Hook for fetching professional tenders only - FIXED VERSION
 */
export const useProfessionalTenders = (initialFilters?: ProfessionalTenderFilter) => {
  const [filters, setFilters] = useState<ProfessionalTenderFilter>({
    page: 1,
    limit: 15,
    status: 'published',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    tenderCategory: 'professional',
    ...initialFilters,
  });

  const { user } = useAuth();
  
  // Track if this is the initial mount to prevent unnecessary resets
  const isInitialMount = useRef(true);

  // Use a stable reference for filters to prevent unnecessary rerenders
  const filtersRef = useRef(filters);
  
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Ensure tenderCategory is always professional
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      tenderCategory: 'professional'
    }));
  }, []);

  // Create a stable query key that only changes when filter values actually change
  const queryKey = useMemo(() => {
    // Create a stable representation of filters for the query key
    const stableFilters = {
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      tenderCategory: 'professional' as const,
      // Only include search if it exists
      ...(filters.search && { search: filters.search }),
      ...(filters.workflowType && { workflowType: filters.workflowType }),
      ...(filters.procurementMethod && { procurementMethod: filters.procurementMethod }),
      ...(filters.cpoRequired !== undefined && { cpoRequired: filters.cpoRequired }),
      ...(filters.minBudget && { minBudget: filters.minBudget }),
      ...(filters.maxBudget && { maxBudget: filters.maxBudget }),
      ...(filters.minExperience && { minExperience: filters.minExperience }),
      ...(filters.visibilityType && { visibilityType: filters.visibilityType }),
      ...(filters.evaluationMethod && { evaluationMethod: filters.evaluationMethod }),
      ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters.dateTo && { dateTo: filters.dateTo }),
      ...(filters.procuringEntity && { procuringEntity: filters.procuringEntity }),
      ...(filters.referenceNumber && { referenceNumber: filters.referenceNumber }),
    };
    
    return tenderKeys.professionalList(stableFilters as ProfessionalTenderFilter);
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.sortBy,
    filters.sortOrder,
    filters.search,
    filters.workflowType,
    filters.procurementMethod,
    filters.cpoRequired,
    filters.minBudget,
    filters.maxBudget,
    filters.minExperience,
    filters.visibilityType,
    filters.evaluationMethod,
    filters.dateFrom,
    filters.dateTo,
    filters.procuringEntity,
    filters.referenceNumber,
  ]);

  const { data, isLoading, error, refetch, isFetching } = useQuery<TendersResponse, Error>({
    queryKey,
    queryFn: async () => {
      // Create a clean copy of filters, removing undefined values
      const cleanFilters = Object.entries(filtersRef.current).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          (acc as any)[key] = value;
        }
        return acc;
      }, {} as Record<string, any>) as ProfessionalTenderFilter;

      console.log('🔍 Fetching PROFESSIONAL tenders with filters:', cleanFilters);
      const response = await tenderService.getProfessionalTenders(cleanFilters);
      return response;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!user && (user.role === 'company' || user.role === 'organization' || user.role === 'admin'),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

  const updateFilters = useCallback((newFilters: Partial<ProfessionalTenderFilter>) => {
    setFilters(prev => {
      // Check if we're only changing the page
      const isOnlyPageChange = 
        Object.keys(newFilters).length === 1 && 
        'page' in newFilters && 
        newFilters.page !== undefined;

      const updated: ProfessionalTenderFilter = {
        ...prev,
        ...newFilters,
        // Only reset to page 1 if it's NOT a page-only change
        ...(!isOnlyPageChange && { page: 1 }),
        tenderCategory: 'professional' as const,
      };

      // Stringify to compare
      const newString = JSON.stringify(updated);
      const oldString = JSON.stringify(prev);

      // Only update if actually changed
      if (newString === oldString) {
        return prev;
      }

      console.log('📊 Filters updated:', {
        previousPage: prev.page,
        newPage: updated.page,
        isOnlyPageChange,
        changes: newFilters
      });

      return updated;
    });
  }, []);

  const setPage = useCallback((page: number) => {
    if (page === filtersRef.current.page) return;
    
    console.log('📄 Setting page to:', page);
    // Use updateFilters with only page change - this won't reset to page 1
    updateFilters({ page });
  }, [updateFilters]);

  const setLimit = useCallback((limit: number) => {
    setFilters(prev => {
      if (prev.limit === limit) return prev;
      return { ...prev, limit, page: 1 };
    });
  }, []);

  return {
    tenders: data?.data || [],
    pagination: data?.pagination || { page: 1, limit: 15, total: 0, pages: 0 },
    isLoading: isLoading || isFetching,
    error,
    filters,
    updateFilters,
    refetch,
    setPage,
    setLimit,
  };
};

// ============ FREELANCE TENDERS HOOK ============
/**
 * Hook for fetching freelance tenders only
 */
// hooks/useTenders.ts - Updated useFreelanceTenders hook

export const useFreelanceTenders = (initialFilters?: FreelanceTenderFilter) => {
  const [filters, setFilters] = useState<FreelanceTenderFilter>({
    page: 1,
    limit: 15,
    status: 'published',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    tenderCategory: 'freelance',
    ...initialFilters,
  });

  const { user } = useAuth();
  
  // Track filter state with ref to prevent stale closures
  const filtersRef = useRef(filters);
  
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Ensure tenderCategory is always freelance
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      tenderCategory: 'freelance'
    }));
  }, []);

  // Create a stable query key based on individual filter values
  const queryKey = useMemo(() => {
    // Create a stable representation of filters for the query key
    const stableFilters = {
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      tenderCategory: 'freelance' as const,
      // Only include search if it exists
      ...(filters.search && { search: filters.search }),
      ...(filters.engagementType && { engagementType: filters.engagementType }),
      ...(filters.experienceLevel && { experienceLevel: filters.experienceLevel }),
      ...(filters.projectType && { projectType: filters.projectType }),
      ...(filters.minBudget && { minBudget: filters.minBudget }),
      ...(filters.maxBudget && { maxBudget: filters.maxBudget }),
      ...(filters.currency && { currency: filters.currency }),
      ...(filters.skills?.length && { skills: filters.skills }),
      ...(filters.urgency && { urgency: filters.urgency }),
      ...(filters.ndaRequired && { ndaRequired: filters.ndaRequired }),
      ...(filters.portfolioRequired && { portfolioRequired: filters.portfolioRequired }),
      ...(filters.languagePreference && { languagePreference: filters.languagePreference }),
      ...(filters.timezonePreference && { timezonePreference: filters.timezonePreference }),
      ...(filters.estimatedDurationMin && { estimatedDurationMin: filters.estimatedDurationMin }),
      ...(filters.estimatedDurationMax && { estimatedDurationMax: filters.estimatedDurationMax }),
      ...(filters.estimatedDurationUnit && { estimatedDurationUnit: filters.estimatedDurationUnit }),
      ...(filters.weeklyHoursMin && { weeklyHoursMin: filters.weeklyHoursMin }),
      ...(filters.weeklyHoursMax && { weeklyHoursMax: filters.weeklyHoursMax }),
      ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters.dateTo && { dateTo: filters.dateTo }),
      ...(filters.procurementCategory && { procurementCategory: filters.procurementCategory }),
    };
    
    return tenderKeys.freelanceList(stableFilters as FreelanceTenderFilter);
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.sortBy,
    filters.sortOrder,
    filters.search,
    filters.engagementType,
    filters.experienceLevel,
    filters.projectType,
    filters.minBudget,
    filters.maxBudget,
    filters.currency,
    filters.skills,
    filters.urgency,
    filters.ndaRequired,
    filters.portfolioRequired,
    filters.languagePreference,
    filters.timezonePreference,
    filters.estimatedDurationMin,
    filters.estimatedDurationMax,
    filters.estimatedDurationUnit,
    filters.weeklyHoursMin,
    filters.weeklyHoursMax,
    filters.dateFrom,
    filters.dateTo,
    filters.procurementCategory,
  ]);

  const { data, isLoading, error, refetch, isFetching } = useQuery<TendersResponse, Error>({
    queryKey,
    queryFn: async () => {
      // Create a clean copy of filters, removing undefined values
      const cleanFilters = Object.entries(filtersRef.current).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          (acc as any)[key] = value;
        }
        return acc;
      }, {} as Record<string, any>) as FreelanceTenderFilter;

      console.log('🔍 Fetching FREELANCE tenders with filters:', cleanFilters);
      const response = await tenderService.getFreelanceTenders(cleanFilters);
      return response;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!user && (user.role === 'freelancer' || user.role === 'admin'),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

  const updateFilters = useCallback((newFilters: Partial<FreelanceTenderFilter>) => {
    setFilters(prev => {
      // Check if we're only changing the page
      const isOnlyPageChange = 
        Object.keys(newFilters).length === 1 && 
        'page' in newFilters && 
        newFilters.page !== undefined;

      const updated: FreelanceTenderFilter = {
        ...prev,
        ...newFilters,
        // Only reset to page 1 if it's NOT a page-only change
        ...(!isOnlyPageChange && { page: 1 }),
        tenderCategory: 'freelance' as const,
      };

      // Stringify to compare - only update if actually changed
      const newString = JSON.stringify(updated);
      const oldString = JSON.stringify(prev);

      if (newString === oldString) {
        return prev;
      }

      console.log('📊 Filters updated:', {
        previousPage: prev.page,
        newPage: updated.page,
        isOnlyPageChange,
        changes: newFilters
      });

      return updated;
    });
  }, []);

  const setPage = useCallback((page: number) => {
    if (page === filtersRef.current.page) return;
    
    console.log('📄 Setting page to:', page);
    // Use updateFilters with only page change - this won't reset to page 1
    updateFilters({ page });
  }, [updateFilters]);

  const setLimit = useCallback((limit: number) => {
    setFilters(prev => {
      if (prev.limit === limit) return prev;
      return { ...prev, limit, page: 1 };
    });
  }, []);

  return {
    tenders: data?.data || [],
    pagination: data?.pagination || { page: 1, limit: 15, total: 0, pages: 0 },
    isLoading: isLoading || isFetching,
    error,
    filters,
    updateFilters,
    refetch,
    setPage,
    setLimit,
  };
};

// ============ BACKWARD COMPATIBILITY HOOK ============
/**
 * Original useTenders hook for backward compatibility
 * Uses the appropriate endpoint based on tenderCategory
 */
export const useTenders = (initialFilters?: TenderFilter) => {
  const [filters, setFilters] = useState<TenderFilter>({
    page: 1,
    limit: 12,
    status: 'published',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  const { user } = useAuth();

  // Determine which endpoint to use based on tenderCategory
  const getTendersFunction = useCallback(async () => {
    // Create a clean copy of filters
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        (acc as any)[key] = value;
      }
      return acc;
    }, {} as Record<string, any>) as TenderFilter;

    console.log('🔍 Fetching tenders with filters:', cleanFilters);

    // Use the appropriate endpoint based on tenderCategory
    if (filters.tenderCategory === 'professional') {
      return await tenderService.getProfessionalTenders(cleanFilters);
    } else if (filters.tenderCategory === 'freelance') {
      return await tenderService.getFreelanceTenders(cleanFilters);
    } else {
      // Fallback to generic endpoint for 'all' or undefined
      return await tenderService.getTenders(cleanFilters);
    }
  }, [filters]);

  const queryKey = useMemo(() =>
    tenderKeys.list(filters),
    [JSON.stringify(filters)]
  );

  const { data, isLoading, error, refetch, isFetching } = useQuery<TendersResponse, Error>({
    queryKey,
    queryFn: getTendersFunction,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!user, // Only fetch if user is logged in
    placeholderData: (previousData) => previousData,
  });

  const updateFilters = useCallback((newFilters: Partial<TenderFilter>) => {
    setFilters(prev => {
      // Check if we're only changing the page
      const isOnlyPageChange = 
        Object.keys(newFilters).length === 1 && 
        'page' in newFilters && 
        newFilters.page !== undefined;

      const updated = {
        ...prev,
        ...newFilters,
        // Only reset to page 1 if it's NOT a page-only change
        ...(!isOnlyPageChange && { page: 1 }),
      };

      // Stringify to compare
      const newString = JSON.stringify(updated);
      const oldString = JSON.stringify(prev);

      // Only update if actually changed
      if (newString === oldString) {
        return prev;
      }

      return updated;
    });
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters(prev => {
      if (prev.page === page) return prev;
      return { ...prev, page };
    });
  }, []);

  const setLimit = useCallback((limit: number) => {
    setFilters(prev => {
      if (prev.limit === limit) return prev;
      return { ...prev, limit, page: 1 };
    });
  }, []);

  return {
    tenders: data?.data || [],
    pagination: data?.pagination || { page: 1, limit: 12, total: 0, pages: 0 },
    isLoading: isLoading || isFetching,
    error,
    filters,
    updateFilters,
    refetch,
    setPage,
    setLimit,
  };
};

// ============ REMAINING HOOKS (UNCHANGED) ============

/**
 * Hook for creating professional tenders with CPO support
 */
export const useCreateProfessionalTender = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ data, files }: { data: CreateProfessionalTenderData; files?: File[] }) => {
      console.log('🎯 [useCreateProfessionalTender] Preparing data for submission:', {
        status: data.status,
        workflowType: data.workflowType,
        procurementMethod: data.procurementMethod,
        cpoRequired: data.cpoRequired,
        hasFiles: files?.length || 0
      });

      // Ensure all required fields are present
      const tenderData: CreateProfessionalTenderData = {
        ...data,
        tenderCategory: 'professional',

        // Ensure status is set correctly
        status: data.status || 'draft',

        // Ensure workflow type is set
        workflowType: data.workflowType || 'open',

        // Ensure procurement method is set
        procurementMethod: data.procurementMethod || 'open_tender',

        // Handle CPO fields - AT TOP LEVEL
        cpoRequired: data.cpoRequired || false,
        cpoDescription: data.cpoRequired ? (data.cpoDescription || '') : undefined,

        // Ensure evaluation criteria has valid weights
        evaluationCriteria: data.evaluationCriteria || {
          technicalWeight: 70,
          financialWeight: 30,
        },

        // Set default bid validity period if not provided
        bidValidityPeriod: data.bidValidityPeriod || {
          value: 30,
          unit: 'days' as const,
        },

        // Ensure visibility type
        visibilityType: data.visibilityType || 'public',

        // Ensure skills array
        skillsRequired: data.skillsRequired || [],

        // Set default file settings if not provided
        maxFileSize: data.maxFileSize || FILE_UPLOAD_CONSTRAINTS.maxFileSize,
        maxFileCount: data.maxFileCount || 10,
      };

      console.log('🚀 [useCreateProfessionalTender] Final data to send:', {
        title: tenderData.title,
        status: tenderData.status,
        workflowType: tenderData.workflowType,
        procurementMethod: tenderData.procurementMethod,
        cpoRequired: tenderData.cpoRequired,
        filesCount: files?.length || 0
      });

      return await tenderService.createProfessionalTender(tenderData, files);
    },
    onSuccess: (response, variables) => {
      console.log('✅ [useCreateProfessionalTender] Tender created successfully:', {
        tenderId: response.tender._id,
        status: response.tender.status,
        title: response.tender.title
      });

      queryClient.invalidateQueries({ queryKey: tenderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tenderKeys.professionalList({} as any) });
      queryClient.invalidateQueries({ queryKey: tenderKeys.myTenders() });

      const status = variables.data.status || 'draft';
      const message = status === 'published'
        ? 'Professional tender published successfully'
        : 'Professional tender saved as draft';

      toast({
        title: 'Success',
        description: message,
        variant: 'success',
      });

      return response.tender;
    },
    onError: (error: Error) => {
      console.error('❌ [useCreateProfessionalTender] Error creating tender:', error);

      toast({
        title: 'Error creating tender',
        description: error.message || 'Failed to create professional tender',
        variant: 'destructive',
      });
    },
  });
};

// ============ FIXED FREELANCE TENDER FORM HOOK ============

/**
 * Hook for freelance tender form management
 * EXACT backend contract compliance with localFileUpload
 */
export const useFreelanceTenderForm = () => {
  // Form state - stores UI form values, NOT the submission structure
  const [formData, setFormData] = useState<Partial<{
    title: string;
    description: string;
    procurementCategory: string;
    deadline: string | Date;
    workflowType: WorkflowType;
    status: TenderCreationStatus;
    skillsRequired: string[];
    maxFileSize: number;
    maxFileCount: number;
    sealedBidConfirmation: boolean;

    // UI-ONLY field - NOT submitted
    shortDescription: string;

    // ✅ ALL freelance fields are nested inside freelanceSpecific
    freelanceSpecific: Partial<{
      engagementType: EngagementType;
      projectType: ProjectType;
      budget: {
        min: number;
        max: number;
        currency: Currency;
      };
      weeklyHours: number;
      estimatedDuration: {
        value: number;
        unit: 'hours' | 'days' | 'weeks' | 'months';
      };
      experienceLevel: ExperienceLevel;
      portfolioRequired: boolean;
      languagePreference: string;
      timezonePreference: string;
      screeningQuestions: Array<{
        question: string;
        required: boolean;
      }>;
      ndaRequired: boolean;
      urgency: 'normal' | 'urgent';
      industry: string;
    }>;
  }>>({});

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

  // Update nested freelanceSpecific field
  const updateFreelanceSpecific = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      freelanceSpecific: {
        ...prev.freelanceSpecific,
        [field]: value,
      },
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

  // ✅ FIXED: Prepare form data for submission - EXACT backend contract
  const getFormDataForSubmit = useCallback((): CreateFreelanceTenderData => {
    // Core fields - top level
    const data: CreateFreelanceTenderData = {
      tenderCategory: 'freelance',
      title: formData.title || '',
      description: formData.description || '',
      procurementCategory: formData.procurementCategory || '',
      deadline: formData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      workflowType: formData.workflowType || 'open',
      status: formData.status || 'draft',

      // Skills & attachments
      skillsRequired: formData.skillsRequired || [],
      maxFileSize: formData.maxFileSize || FILE_UPLOAD_CONSTRAINTS.maxFileSize,
      maxFileCount: formData.maxFileCount || 10,

      // Sealed bid confirmation for closed workflow
      ...(formData.workflowType === 'closed' && formData.sealedBidConfirmation ? {
        sealedBidConfirmation: formData.sealedBidConfirmation
      } : {}),

      // File metadata
      ...(files.length > 0 ? {
        fileDescriptions,
        fileTypes
      } : {}),

      // ✅ ALL freelance fields go inside freelanceSpecific
      freelanceSpecific: {
        // Required
        engagementType: formData.freelanceSpecific?.engagementType || 'fixed_price',

        // Conditional - required based on engagement type
        ...(formData.freelanceSpecific?.engagementType === 'fixed_price' &&
          formData.freelanceSpecific?.budget ? {
          budget: formData.freelanceSpecific.budget
        } : {}),

        ...(formData.freelanceSpecific?.engagementType === 'hourly' &&
          formData.freelanceSpecific?.weeklyHours ? {
          weeklyHours: formData.freelanceSpecific.weeklyHours
        } : {}),

        // Optional with defaults
        projectType: formData.freelanceSpecific?.projectType ||
          constants.defaultSettings.freelance.defaultProjectType,

        estimatedDuration: formData.freelanceSpecific?.estimatedDuration || {
          value: 30,
          unit: 'days'
        },

        experienceLevel: formData.freelanceSpecific?.experienceLevel ||
          constants.defaultSettings.freelance.defaultExperienceLevel,

        portfolioRequired: formData.freelanceSpecific?.portfolioRequired || false,
        ndaRequired: formData.freelanceSpecific?.ndaRequired || false,
        urgency: formData.freelanceSpecific?.urgency || 'normal',

        // Optional fields - only include if they have values
        ...(formData.freelanceSpecific?.languagePreference ? {
          languagePreference: formData.freelanceSpecific.languagePreference
        } : {}),

        ...(formData.freelanceSpecific?.timezonePreference ? {
          timezonePreference: formData.freelanceSpecific.timezonePreference
        } : {}),

        ...(formData.freelanceSpecific?.industry ? {
          industry: formData.freelanceSpecific.industry
        } : {}),

        ...(formData.freelanceSpecific?.screeningQuestions?.length ? {
          screeningQuestions: formData.freelanceSpecific.screeningQuestions
        } : {})
      }
    };

    // Debug log to verify structure
    console.log('📦 Submit data structure:', {
      topLevelFields: Object.keys(data).filter(k => k !== 'freelanceSpecific'),
      freelanceSpecificFields: Object.keys(data.freelanceSpecific),
      hasFiles: files.length > 0,
      workflowType: data.workflowType,
      status: data.status
    });

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
    updateFreelanceSpecific,
    addFile,
    removeFile,
    validateForm,
    getFormDataForSubmit,
    resetForm,
  };
};

// ============ PROFESSIONAL TENDER FORM HOOK WITH LOCAL FILE UPLOAD ============

/**
 * Hook for professional tender form management with local file upload
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

  // Bulk add files with metadata
  const addFiles = useCallback((newFiles: Array<{ file: File; description?: string; fileType?: string }>) => {
    const validFiles = newFiles.filter(f => utils.checkFileUpload([f.file]));

    setFiles(prev => [...prev, ...validFiles.map(f => f.file)]);
    setFileDescriptions(prev => [...prev, ...validFiles.map(f => f.description || '')]);
    setFileTypes(prev => [...prev, ...validFiles.map(f => f.fileType || 'other')]);
  }, [utils]);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
    setFileDescriptions([]);
    setFileTypes([]);
  }, []);

  // Validate form
  const validateForm = useCallback(() => {
    return validation.validateProfessionalTender(formData);
  }, [formData, validation]);

  // Prepare form data for submission - ALL FIELDS AT TOP LEVEL
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

      // CPO fields - AT TOP LEVEL
      cpoRequired: formData.cpoRequired || false,
      cpoDescription: formData.cpoRequired ? formData.cpoDescription || '' : undefined,

      // Procurement fields
      procurementMethod: formData.procurementMethod,
      fundingSource: formData.fundingSource,

      // Skills
      skillsRequired: formData.skillsRequired || [],

      // Eligibility criteria
      minimumExperience: formData.minimumExperience,
      requiredCertifications: formData.requiredCertifications,
      legalRegistrationRequired: formData.legalRegistrationRequired,
      financialCapacity: formData.financialCapacity,
      pastProjectReferences: formData.pastProjectReferences,

      // Project details
      projectObjectives: formData.projectObjectives,
      deliverables: formData.deliverables,
      milestones: formData.milestones,
      timeline: formData.timeline,

      // Evaluation
      evaluationMethod: formData.evaluationMethod,
      evaluationCriteria: formData.evaluationCriteria,
      bidValidityPeriod: formData.bidValidityPeriod,
      clarificationDeadline: formData.clarificationDeadline,
      preBidMeeting: formData.preBidMeeting,

      // Invitations
      allowedCompanies: formData.allowedCompanies,
      allowedUsers: formData.allowedUsers,

      // Sealed bid
      sealedBidConfirmation: formData.sealedBidConfirmation,

      // File settings
      maxFileSize: formData.maxFileSize,
      maxFileCount: formData.maxFileCount,

      // File metadata for local upload
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

  // Get file stats
  const fileStats = useMemo(() => {
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    return {
      count: files.length,
      totalSize,
      formattedTotalSize: utils.formatFileSize(totalSize),
    };
  }, [files, utils]);

  return {
    formData,
    files,
    fileDescriptions,
    fileTypes,
    fileStats,
    isCPORequired,
    updateFormData,
    toggleCPORequired,
    updateCPODescription,
    addFile,
    addFiles,
    removeFile,
    clearFiles,
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
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tenderKeys.freelanceList({} as any) });
      queryClient.invalidateQueries({ queryKey: tenderKeys.myTenders() });

      toast({
        title: 'Success',
        description: variables.data.status === 'published'
          ? 'Freelance tender published successfully'
          : 'Freelance tender saved as draft',
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
 * Hook for viewing a tender as a non-owner (for browsing)
 * This hook does NOT perform owner checks, just fetches the tender with proper authentication
 */
export const useViewTender = (id: string) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['viewTender', id, user?._id],
    queryFn: async () => {
      if (!id) throw new Error('Tender ID is required');

      console.log('📊 [useViewTender] Fetching tender for viewing:', {
        tenderId: id,
        userId: user?._id,
        userRole: user?.role
      });

      // Use the regular endpoint, NOT the owner endpoint
      const response = await tenderService.getTender(id, { isOwner: false });
      return response;
    },
    enabled: !!id && !!user, // Only fetch if we have both id and user
    retry: (failureCount, error: any) => {
      // Don't retry on 403 errors
      if (error?.message?.includes('Access denied') || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    tender: query.data?.data?.tender,
    canViewProposals: query.data?.data?.canViewProposals || false,
    isOwner: query.data?.data?.isOwner || false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
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

/**
 * FIXED: Hook for fetching tender with proper owner detection
 */
export const useTender = (id: string, options?: { isOwner?: boolean }) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['tender', id, options?.isOwner, user?._id],
    queryFn: async () => {
      // Determine if this should be an owner view
      // If options.isOwner is explicitly provided, use that
      // Otherwise, check if the user might be the owner (based on role)
      const shouldUseOwnerView = options?.isOwner !== undefined
        ? options.isOwner
        : (user?.role === 'company' || user?.role === 'organization');

      console.log('📊 [useTender] Determining view type:', {
        explicitIsOwner: options?.isOwner,
        userRole: user?.role,
        shouldUseOwnerView,
        userId: user?._id,
        tenderId: id
      });

      const response = await tenderService.getTender(id, {
        isOwner: shouldUseOwnerView
      });

      return response;
    },
    enabled: !!id && !!user, // Only run if we have both id and user
    retry: (failureCount, error: any) => {
      // Don't retry on 403 errors
      if (error?.message?.includes('Access denied') || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    tender: query.data?.data?.tender,
    canViewProposals: query.data?.data?.canViewProposals || false,
    isOwner: query.data?.data?.isOwner || false,
    canEdit: query.data?.data?.canEdit || false,
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

// ============ ATTACHMENT HOOKS WITH LOCAL FILE SUPPORT ============

/**
 * Hook for downloading attachments with local file support
 */
export const useDownloadAttachment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const localFileUtils = useLocalFileUtils();

  return useMutation({
    mutationFn: async ({ tenderId, attachmentId }: { tenderId: string; attachmentId: string }) => {
      return await localFileUtils.downloadAttachment(tenderId, attachmentId);
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: tenderKeys.detail(variables.tenderId) });
      } else {
        toast({
          title: 'Download Failed',
          description: 'Failed to download file',
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
 * Hook for deleting attachments with local file support
 */
export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tenderId, attachmentId }: {
      tenderId: string;
      attachmentId: string;
    }) => tenderService.deleteAttachment(tenderId, attachmentId),
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
 * Hook for uploading attachments with local file upload
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
 * Hook for getting attachment preview URL with local file support
 */
export const useAttachmentPreview = () => {
  const localFileUtils = useLocalFileUtils();

  return {
    getPreviewUrl: localFileUtils.getAttachmentPreviewUrl,
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
  const localFileUtils = useLocalFileUtils();

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
      if (formatted.clarificationDeadline) {
        formatted.clarificationDeadline =
          new Date(formatted.clarificationDeadline).toISOString();
      }

      if (formatted.preBidMeeting?.date) {
        formatted.preBidMeeting.date =
          new Date(formatted.preBidMeeting.date).toISOString();
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
    getAttachmentDownloadUrl: localFileUtils.getAttachmentDownloadUrl,
    getAttachmentPreviewUrl: localFileUtils.getAttachmentPreviewUrl,
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