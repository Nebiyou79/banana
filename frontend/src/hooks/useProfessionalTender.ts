/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useProfessionalTender.ts
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { handleSuccess, handleError } from '@/lib/error-handler';
import professionalTenderService from '@/services/profesionalTenderService';
import type {
    ProfessionalTender,
    ProfessionalTenderListItem,
    ProfessionalTenderFilters,
    ProfessionalTenderInvitation,
    ProfessionalTenderAddendum,
    ProfessionalTenderCPO,
    ProfessionalTenderBid,
    TenderPagination,
    TenderAttachment,
    ProfessionalTenderStats,
    CreateProfessionalTenderData,
    UpdateProfessionalTenderData,
    AddendumData,
    InviteCompanyData,
    CPOData,
} from '@/types/tender.types';

// ─────────────────────────────────────────────────────────────────────────────
// QUERY KEYS
// ─────────────────────────────────────────────────────────────────────────────
export const professionalTenderKeys = {
    all: ['professional-tenders'] as const,
    categories: () => [...professionalTenderKeys.all, 'categories'] as const,
    lists: () => [...professionalTenderKeys.all, 'list'] as const,
    list: (filters: ProfessionalTenderFilters) => [...professionalTenderKeys.lists(), filters] as const,
    details: () => [...professionalTenderKeys.all, 'detail'] as const,
    detail: (id: string) => [...professionalTenderKeys.details(), id] as const,
    myTenders: (params?: any) => [...professionalTenderKeys.all, 'my-tenders', params] as const,
    saved: (params?: any) => [...professionalTenderKeys.all, 'saved', params] as const,
    invitations: (params?: any) => [...professionalTenderKeys.all, 'invitations', params] as const,
    addenda: (tenderId: string) => [...professionalTenderKeys.detail(tenderId), 'addenda'] as const,
    cpo: (tenderId: string) => [...professionalTenderKeys.detail(tenderId), 'cpo'] as const,
    stats: (id: string) => [...professionalTenderKeys.detail(id), 'stats'] as const,
    companies: (search?: string, page?: number) =>
        [...professionalTenderKeys.all, 'companies', { search, page }] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

// FIX P-08: Return type is now { category, subcategories[] }[] — NOT string[].
// Components must render as <optgroup label={category}> groups.
export const useProfessionalTenderCategories = (
    options?: Omit<UseQueryOptions<{ category: string; subcategories: string[] }[]>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: professionalTenderKeys.categories(),
        queryFn: () => professionalTenderService.getCategories(),
        staleTime: Infinity,
        ...options,
    });
};

export const useProfessionalTenders = (
    filters?: ProfessionalTenderFilters,
    options?: Omit<
        UseQueryOptions<{ tenders: ProfessionalTenderListItem[]; pagination: TenderPagination }>,
        'queryKey' | 'queryFn'
    >
) => {
    return useQuery({
        queryKey: professionalTenderKeys.list(filters || {}),
        queryFn: () => professionalTenderService.getProfessionalTenders(filters),
        staleTime: 2 * 60 * 1000,
        ...options,
    });
};

export const useProfessionalTender = (
    id: string,
    options?: Omit<UseQueryOptions<ProfessionalTender>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: professionalTenderKeys.detail(id),
        queryFn: () => professionalTenderService.getProfessionalTender(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
};

export const useProfessionalTenderEditData = (
    id: string,
    options?: Omit<UseQueryOptions<ProfessionalTender>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: [...professionalTenderKeys.detail(id), 'edit'],
        queryFn: () => professionalTenderService.getProfessionalTenderEditData(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
};

export const useMyPostedProfessionalTenders = (
    params?: { status?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string },
    options?: Omit<
        UseQueryOptions<{
            tenders: Array<ProfessionalTenderListItem & { bidCount: number; cpoCount: number; savedCount: number }>;
            pagination: TenderPagination;
        }>,
        'queryKey' | 'queryFn'
    >
) => {
    return useQuery({
        queryKey: professionalTenderKeys.myTenders(params),
        queryFn: () => professionalTenderService.getMyPostedProfessionalTenders(params),
        staleTime: 2 * 60 * 1000,
        ...options,
    });
};

export const useSavedProfessionalTenders = (
    params?: { page?: number; limit?: number },
    options?: Omit<
        UseQueryOptions<{ tenders: ProfessionalTenderListItem[]; pagination: TenderPagination }>,
        'queryKey' | 'queryFn'
    >
) => {
    return useQuery({
        queryKey: professionalTenderKeys.saved(params),
        queryFn: () => professionalTenderService.getSavedProfessionalTenders(params),
        staleTime: 2 * 60 * 1000,
        ...options,
    });
};

export const useMyInvitations = (
    params?: { status?: string; page?: number; limit?: number },
    options?: Omit<
        UseQueryOptions<{ invitations: any[]; pagination: TenderPagination }>,
        'queryKey' | 'queryFn'
    >
) => {
    return useQuery({
        queryKey: professionalTenderKeys.invitations(params),
        queryFn: () => professionalTenderService.getMyInvitations(params),
        staleTime: 2 * 60 * 1000,
        ...options,
    });
};

export const useAddenda = (
    tenderId: string,
    options?: Omit<UseQueryOptions<ProfessionalTenderAddendum[]>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: professionalTenderKeys.addenda(tenderId),
        queryFn: () => professionalTenderService.getAddenda(tenderId),
        enabled: !!tenderId,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
};

export const useCPOSubmissions = (
    tenderId: string,
    options?: Omit<UseQueryOptions<ProfessionalTenderCPO[]>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: professionalTenderKeys.cpo(tenderId),
        queryFn: () => professionalTenderService.getCPOSubmissions(tenderId),
        enabled: !!tenderId,
        staleTime: 2 * 60 * 1000,
        ...options,
    });
};

export const useProfessionalTenderStats = (
    id: string,
    options?: Omit<UseQueryOptions<ProfessionalTenderStats>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: professionalTenderKeys.stats(id),
        queryFn: () => professionalTenderService.getProfessionalTenderStats(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
};

export const useCompaniesForInvitation = (
    search?: string,
    page?: number,
    limit?: number,
    options?: Omit<
        UseQueryOptions<{
            companies: Array<{ _id: string; name: string; logo?: any; headline?: string; industry?: string }>;
            pagination: TenderPagination;
        }>,
        'queryKey' | 'queryFn'
    >
) => {
    return useQuery({
        queryKey: professionalTenderKeys.companies(search, page),
        queryFn: () => professionalTenderService.getCompaniesForInvitation(search, page, limit),
        staleTime: 5 * 60 * 1000,
        ...options,
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const useCreateProfessionalTender = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ data, files }: { data: CreateProfessionalTenderData; files?: File[] }) =>
            professionalTenderService.createProfessionalTender(data, files),
        onSuccess: () => {
            handleSuccess('Tender created successfully');
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.myTenders() });
        },
        onError: (error: any) =>
            handleError(error.response?.data?.message || error.message || 'Failed to create tender'),
    });
};

export const useUpdateProfessionalTender = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data, files }: { id: string; data: UpdateProfessionalTenderData; files?: File[] }) =>
            professionalTenderService.updateProfessionalTender(id, data, files),
        onSuccess: (_, variables) => {
            handleSuccess('Tender updated successfully');
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.myTenders() });
        },
        onError: (error: any) =>
            handleError(error.response?.data?.message || error.message || 'Failed to update tender'),
    });
};

export const useDeleteProfessionalTender = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => professionalTenderService.deleteProfessionalTender(id),
        onSuccess: () => {
            handleSuccess('Tender deleted successfully');
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.myTenders() });
        },
        onError: (error: any) =>
            handleError(error.response?.data?.message || error.message || 'Failed to delete tender'),
    });
};

export const usePublishProfessionalTender = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => professionalTenderService.publishProfessionalTender(id),
        onSuccess: (_, id) => {
            handleSuccess('Tender published successfully');
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.myTenders() });
        },
        onError: (error: any) =>
            handleError(error.response?.data?.message || error.message || 'Failed to publish tender'),
    });
};

export const useRevealBids = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => professionalTenderService.revealBids(id),
        onSuccess: (data, id) => {
            handleSuccess(`${data.bidsRevealed} bid(s) revealed`);
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.detail(id) });
        },
        onError: (error: any) =>
            handleError(error.response?.data?.message || error.message || 'Failed to reveal bids'),
    });
};

export const useIssueAddendum = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data, files }: { id: string; data: AddendumData; files?: File[] }) =>
            professionalTenderService.issueAddendum(id, data, files),
        onSuccess: (_, variables) => {
            handleSuccess('Addendum issued successfully');
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.addenda(variables.id) });
        },
        onError: (error: any) =>
            handleError(error.response?.data?.message || error.message || 'Failed to issue addendum'),
    });
};

export const useInviteCompanies = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, companies, emails }: { id: string; companies: InviteCompanyData[]; emails?: string[] }) =>
            professionalTenderService.inviteCompanies(id, companies, emails),
        onSuccess: (_, variables) => {
            handleSuccess('Invitations sent successfully');
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.detail(variables.id) });
        },
        onError: (error: any) =>
            handleError(error.response?.data?.message || error.message || 'Failed to send invitations'),
    });
};

export const useRespondToInvitation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, inviteId, response }: { id: string; inviteId: string; response: 'accepted' | 'declined' }) =>
            professionalTenderService.respondToInvitation(id, inviteId, response),
        onSuccess: (_, variables) => {
            handleSuccess(`Invitation ${variables.response}`);
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.invitations() });
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.detail(variables.id) });
        },
        onError: (error: any) =>
            handleError(error.response?.data?.message || error.message || 'Failed to respond to invitation'),
    });
};

export const useSubmitCPO = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data, file }: { id: string; data: CPOData; file: File }) =>
            professionalTenderService.submitCPO(id, data, file),
        onSuccess: (_, variables) => {
            handleSuccess('CPO submitted successfully');
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.cpo(variables.id) });
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.detail(variables.id) });
        },
        onError: (error: any) =>
            handleError(error.response?.data?.message || error.message || 'Failed to submit CPO'),
    });
};

export const useVerifyCPO = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, cpoId, status, notes }: { id: string; cpoId: string; status: 'verified' | 'rejected'; notes?: string }) =>
            professionalTenderService.verifyCPO(id, cpoId, status, notes),
        onSuccess: (_, variables) => {
            handleSuccess(`CPO ${variables.status}`);
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.cpo(variables.id) });
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.detail(variables.id) });
        },
        onError: (error: any) =>
            handleError(error.response?.data?.message || error.message || 'Failed to verify CPO'),
    });
};

// Optimistic save/unsave
export const useToggleSaveProfessionalTender = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => professionalTenderService.toggleSaveProfessionalTender(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: professionalTenderKeys.lists() });
            await queryClient.cancelQueries({ queryKey: professionalTenderKeys.saved() });
            const previousLists = queryClient.getQueriesData({ queryKey: professionalTenderKeys.lists() });
            const previousSaved = queryClient.getQueryData(professionalTenderKeys.saved());
            queryClient.setQueriesData(
                { queryKey: professionalTenderKeys.lists() },
                (old: any) => {
                    if (!old?.tenders) return old;
                    return {
                        ...old,
                        tenders: old.tenders.map((tender: any) => {
                            if (tender._id === id) {
                                const isSaved = tender.metadata?.savedBy?.includes(id) || false;
                                return {
                                    ...tender,
                                    metadata: {
                                        ...tender.metadata,
                                        savedBy: isSaved
                                            ? tender.metadata.savedBy.filter((uid: string) => uid !== id)
                                            : [...(tender.metadata.savedBy || []), id],
                                    },
                                };
                            }
                            return tender;
                        }),
                    };
                }
            );
            return { previousLists, previousSaved };
        },
        onError: (err: any, _id, context) => {
            if (context?.previousLists) {
                context.previousLists.forEach(([queryKey, data]: any) => queryClient.setQueryData(queryKey, data));
            }
            handleError(err.response?.data?.message || err.message || 'Failed to save/unsave tender');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.saved() });
        },
        onSuccess: (data) => handleSuccess(data.saved ? 'Tender saved' : 'Tender unsaved'),
    });
};

export const useUploadProfessionalAttachments = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, files, documentType, description }: { id: string; files: File[]; documentType?: string; description?: string }) =>
            professionalTenderService.uploadProfessionalAttachments(id, files, documentType, description),
        onSuccess: (_, variables) => {
            handleSuccess('Attachments uploaded successfully');
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.detail(variables.id) });
        },
        onError: (error: any) =>
            handleError(error.response?.data?.message || error.message || 'Failed to upload attachments'),
    });
};

// FIX P-09: Downloads via the API — triggers browser save-as dialog.
// Components MUST use this hook — never use attachment.url or attachment.downloadUrl directly.
export const useDownloadProfessionalAttachment = () => {
    return useMutation({
        mutationFn: ({ tenderId, attachmentId, filename }: { tenderId: string; attachmentId: string; filename?: string }) =>
            professionalTenderService.downloadProfessionalAttachment(tenderId, attachmentId, filename),
        onError: (error: any) =>
            handleError(error.response?.data?.message || error.message || 'Failed to download attachment'),
    });
};

export const useDeleteProfessionalAttachment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
            professionalTenderService.deleteProfessionalAttachment(id, attachmentId),
        onSuccess: (_, variables) => {
            handleSuccess('Attachment deleted');
            queryClient.invalidateQueries({ queryKey: professionalTenderKeys.detail(variables.id) });
        },
        onError: (error: any) =>
            handleError(error.response?.data?.message || error.message || 'Failed to delete attachment'),
    });
};

// FIX P-10: Hook for on-demand reference number generation
export const useGenerateReferenceNumber = () => {
    return useMutation({
        mutationFn: () => professionalTenderService.generateReferenceNumber(),
        onError: (error: any) =>
            handleError(error.message || 'Failed to generate reference number'),
    });
};