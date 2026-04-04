/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useFreelanceTender.ts
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { handleSuccess, handleError } from '@/lib/error-handler';
import freelanceTenderService, { FreelanceTenderCategory } from '@/services/freelanceTenderService';
import type {
    FreelanceTender,
    FreelanceTenderListItem,
    FreelanceTenderFilters,
    FreelanceTenderApplication,
    CreateFreelanceTenderData,
    UpdateFreelanceTenderData,
    SubmitApplicationData,
    TenderPagination,
    TenderAttachment,
    FreelanceTenderStats,
} from '@/types/tender.types';

// ========== QUERY KEYS ==========
export const freelanceTenderKeys = {
    all: ['freelance-tenders'] as const,
    categories: () => [...freelanceTenderKeys.all, 'categories'] as const,
    lists: () => [...freelanceTenderKeys.all, 'list'] as const,
    list: (filters: FreelanceTenderFilters) => [...freelanceTenderKeys.lists(), filters] as const,
    details: () => [...freelanceTenderKeys.all, 'detail'] as const,
    detail: (id: string) => [...freelanceTenderKeys.details(), id] as const,
    myTenders: (params?: any) => [...freelanceTenderKeys.all, 'my-tenders', params] as const,
    saved: (params?: any) => [...freelanceTenderKeys.all, 'saved', params] as const,
    applications: (tenderId: string, params?: any) =>
        [...freelanceTenderKeys.detail(tenderId), 'applications', params] as const,
    stats: (id: string) => [...freelanceTenderKeys.detail(id), 'stats'] as const,
};

// ========== CATEGORIES ==========
/**
 * FIX B-04: Return type updated to FreelanceTenderCategory[] (grouped objects).
 * Previously typed as string[] which caused duplicate React keys in the selector.
 */
export const useFreelanceTenderCategories = (
    options?: Omit<UseQueryOptions<FreelanceTenderCategory[]>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<FreelanceTenderCategory[]>({
        queryKey: freelanceTenderKeys.categories(),
        queryFn: () => freelanceTenderService.getCategories(),
        staleTime: Infinity, // categories are static — never refetch
        ...options,
    });
};

// ========== BROWSE ==========
export const useFreelanceTenders = (
    filters?: FreelanceTenderFilters,
    options?: Omit<
        UseQueryOptions<{ tenders: FreelanceTenderListItem[]; pagination: TenderPagination }>,
        'queryKey' | 'queryFn'
    >
) => {
    return useQuery({
        queryKey: freelanceTenderKeys.list(filters || {}),
        queryFn: () => freelanceTenderService.getFreelanceTenders(filters),
        staleTime: 2 * 60 * 1000,
        ...options,
    });
};

// ========== SINGLE TENDER ==========
export const useFreelanceTender = (
    id: string,
    options?: Omit<UseQueryOptions<FreelanceTender>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: freelanceTenderKeys.detail(id),
        queryFn: () => freelanceTenderService.getFreelanceTender(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
};

// ========== EDIT DATA ==========
export const useFreelanceTenderEditData = (
    id: string,
    options?: Omit<UseQueryOptions<FreelanceTender>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: [...freelanceTenderKeys.detail(id), 'edit'],
        queryFn: () => freelanceTenderService.getFreelanceTenderEditData(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
};

// ========== MY POSTED TENDERS ==========
export const useMyPostedFreelanceTenders = (
    params?: { status?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string },
    options?: Omit<
        UseQueryOptions<{
            tenders: Array<FreelanceTenderListItem & { applicationCount: number; savedCount: number }>;
            pagination: TenderPagination;
        }>,
        'queryKey' | 'queryFn'
    >
) => {
    return useQuery({
        queryKey: freelanceTenderKeys.myTenders(params),
        queryFn: () => freelanceTenderService.getMyPostedFreelanceTenders(params),
        staleTime: 2 * 60 * 1000,
        ...options,
    });
};

// ========== SAVED TENDERS ==========
export const useSavedFreelanceTenders = (
    params?: { page?: number; limit?: number },
    options?: Omit<
        UseQueryOptions<{ tenders: FreelanceTenderListItem[]; pagination: TenderPagination }>,
        'queryKey' | 'queryFn'
    >
) => {
    return useQuery({
        queryKey: freelanceTenderKeys.saved(params),
        queryFn: () => freelanceTenderService.getSavedFreelanceTenders(params),
        staleTime: 2 * 60 * 1000,
        ...options,
    });
};

// ========== APPLICATIONS ==========
export const useFreelanceTenderApplications = (
    tenderId: string,
    params?: { status?: string; page?: number; limit?: number },
    options?: Omit<
        UseQueryOptions<{
            applications: FreelanceTenderApplication[];
            pagination: TenderPagination;
            summary: any;
        }>,
        'queryKey' | 'queryFn'
    >
) => {
    return useQuery({
        queryKey: freelanceTenderKeys.applications(tenderId, params),
        queryFn: () => freelanceTenderService.getTenderApplications(tenderId, params),
        enabled: !!tenderId,
        staleTime: 2 * 60 * 1000,
        ...options,
    });
};

// ========== STATS ==========
export const useFreelanceTenderStats = (
    id: string,
    options?: Omit<UseQueryOptions<FreelanceTenderStats>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: freelanceTenderKeys.stats(id),
        queryFn: () => freelanceTenderService.getFreelanceTenderStats(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
};

// ========== MUTATIONS ==========

// CREATE
export const useCreateFreelanceTender = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, files }: { data: CreateFreelanceTenderData; files?: File[] }) =>
            freelanceTenderService.createFreelanceTender(data, files),
        onSuccess: () => {
            handleSuccess('Tender created successfully');
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.myTenders() });
        },
        onError: (error: any) => {
            handleError(error.response?.data?.message || error.message || 'Failed to create tender');
        },
    });
};

// UPDATE
export const useUpdateFreelanceTender = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data, files }: { id: string; data: UpdateFreelanceTenderData; files?: File[] }) =>
            freelanceTenderService.updateFreelanceTender(id, data, files),
        onSuccess: (_, variables) => {
            handleSuccess('Tender updated successfully');
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.myTenders() });
        },
        onError: (error: any) => {
            handleError(error.response?.data?.message || error.message || 'Failed to update tender');
        },
    });
};

// DELETE
export const useDeleteFreelanceTender = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => freelanceTenderService.deleteFreelanceTender(id),
        onSuccess: () => {
            handleSuccess('Tender deleted successfully');
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.myTenders() });
        },
        onError: (error: any) => {
            handleError(error.response?.data?.message || error.message || 'Failed to delete tender');
        },
    });
};

// PUBLISH
export const usePublishFreelanceTender = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => freelanceTenderService.publishFreelanceTender(id),
        onSuccess: (_, id) => {
            handleSuccess('Tender published successfully');
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.myTenders() });
        },
        onError: (error: any) => {
            handleError(error.response?.data?.message || error.message || 'Failed to publish tender');
        },
    });
};

// SUBMIT APPLICATION
export const useSubmitApplication = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ tenderId, data, cvFile }: { tenderId: string; data: SubmitApplicationData; cvFile?: File }) =>
            freelanceTenderService.submitApplication(tenderId, data, cvFile),
        onSuccess: (_, variables) => {
            handleSuccess('Application submitted successfully');
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.detail(variables.tenderId) });
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.applications(variables.tenderId) });
        },
        onError: (error: any) => {
            handleError(error.response?.data?.message || error.message || 'Failed to submit application');
        },
    });
};

// UPDATE APPLICATION STATUS
export const useUpdateApplicationStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ tenderId, applicationId, status, notes }: {
            tenderId: string; applicationId: string; status: string; notes?: string;
        }) => freelanceTenderService.updateApplicationStatus(tenderId, applicationId, status, notes),
        onSuccess: (_, variables) => {
            handleSuccess('Application status updated');
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.applications(variables.tenderId) });
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.detail(variables.tenderId) });
        },
        onError: (error: any) => {
            handleError(error.response?.data?.message || error.message || 'Failed to update status');
        },
    });
};

/**
 * FIX B-05: Optimistic update now correctly compares userId (from server response),
 * not tenderId, against the savedBy array.
 * The isSaved flag is now sourced from the server response (data.saved) rather
 * than inferred from the savedBy array with the wrong id.
 */
export const useToggleSaveFreelanceTender = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => freelanceTenderService.toggleSaveFreelanceTender(id),
        onMutate: async (tenderId) => {
            await queryClient.cancelQueries({ queryKey: freelanceTenderKeys.lists() });
            await queryClient.cancelQueries({ queryKey: freelanceTenderKeys.saved() });

            // Snapshot for rollback
            const previousLists = queryClient.getQueriesData({ queryKey: freelanceTenderKeys.lists() });
            const previousSaved = queryClient.getQueriesData({ queryKey: freelanceTenderKeys.saved() });

            // Optimistically toggle the isSaved flag on list items
            queryClient.setQueriesData(
                { queryKey: freelanceTenderKeys.lists() },
                (old: any) => {
                    if (!old?.tenders) return old;
                    return {
                        ...old,
                        tenders: old.tenders.map((tender: any) => {
                            if (tender._id !== tenderId) return tender;
                            // FIX: Toggle isSaved directly — don't compare savedBy vs tenderId
                            return { ...tender, isSaved: !tender.isSaved };
                        }),
                    };
                }
            );

            return { previousLists, previousSaved };
        },
        onError: (err: any, _id, context) => {
            // Rollback optimistic update
            if (context?.previousLists) {
                context.previousLists.forEach(([queryKey, data]: [any, any]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            if (context?.previousSaved) {
                context.previousSaved.forEach(([queryKey, data]: [any, any]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            handleError(err.response?.data?.message || err.message || 'Failed to save/unsave tender');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.saved() });
        },
        onSuccess: (data) => {
            handleSuccess(data.saved ? 'Tender saved' : 'Tender unsaved');
        },
    });
};

// UPLOAD ATTACHMENTS
export const useUploadFreelanceAttachments = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, files, documentType, description }: {
            id: string; files: File[]; documentType?: string; description?: string;
        }) => freelanceTenderService.uploadFreelanceAttachments(id, files, documentType, description),
        onSuccess: (_, variables) => {
            handleSuccess('Attachments uploaded successfully');
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.detail(variables.id) });
        },
        onError: (error: any) => {
            handleError(error.response?.data?.message || error.message || 'Failed to upload attachments');
        },
    });
};

/**
 * FIX B-05: Download hook — triggers the backend API stream download.
 * NEVER use attachment.url or attachment.downloadUrl directly in href attributes.
 * Always call this hook's mutate() instead.
 */
export const useDownloadFreelanceAttachment = () => {
    return useMutation({
        mutationFn: ({ tenderId, attachmentId }: { tenderId: string; attachmentId: string }) =>
            freelanceTenderService.downloadFreelanceAttachment(tenderId, attachmentId),
        onError: (error: any) => {
            handleError(error.message || 'Failed to download file');
        },
    });
};

// DELETE ATTACHMENT
export const useDeleteFreelanceAttachment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
            freelanceTenderService.deleteFreelanceAttachment(id, attachmentId),
        onSuccess: (_, variables) => {
            handleSuccess('Attachment deleted');
            queryClient.invalidateQueries({ queryKey: freelanceTenderKeys.detail(variables.id) });
        },
        onError: (error: any) => {
            handleError(error.response?.data?.message || error.message || 'Failed to delete attachment');
        },
    });
};