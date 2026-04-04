/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/freelanceTenderService.ts
import api from '@/lib/axios';
import profileService, { CloudinaryImage } from '@/services/profileService';
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

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * FIX B-04: Grouped category shape returned by the fixed backend.
 * Previously the service flattened everything into string[] causing duplicate React keys.
 */
export interface FreelanceTenderCategory {
    category: string;           // e.g. "Admin Support"  (underscores replaced with spaces)
    subcategories: string[];    // e.g. ["Virtual Assistance", "Customer Service", ...]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getFreelanceEntityAvatar(
    ownerEntity?: { logo?: CloudinaryImage; name?: string },
    owner?: { name?: string; avatar?: string }
): string {
    if (ownerEntity?.logo?.secure_url) {
        return profileService.getOptimizedAvatarUrl(ownerEntity.logo, 'medium');
    }
    if (owner?.avatar) return owner.avatar;
    const name = ownerEntity?.name || owner?.name || 'Unknown';
    return profileService.getPlaceholderAvatar(name);
}

/**
 * Build FormData for tender create / update.
 * FIX B-10: briefDescription sent as a plain string field.
 * FIX B-03: budget sent as part of details JSON — no phantom type/fixedAmount fields.
 */
function buildFreelanceTenderFormData(
    data: CreateFreelanceTenderData | UpdateFreelanceTenderData,
    files?: File[]
): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (key === 'details' && typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
        } else if (key === 'skillsRequired' && Array.isArray(value)) {
            // Send as comma-separated string — controller splits it back
            formData.append(key, (value as string[]).join(','));
        } else if (typeof value !== 'object') {
            formData.append(key, String(value));
        }
        // Note: briefDescription is a plain string, handled by the branch above
    });

    if (files?.length) {
        files.forEach(file => formData.append('documents', file));
    }

    return formData;
}

/**
 * Build FormData for an application submission.
 */
function buildApplicationFormData(data: SubmitApplicationData, cvFile?: File): FormData {
    const formData = new FormData();

    formData.append('coverLetter', data.coverLetter);
    formData.append('proposedRate', String(data.proposedRate));

    if (data.proposedRateCurrency) {
        formData.append('proposedRateCurrency', data.proposedRateCurrency);
    }

    if (data.estimatedTimeline) {
        formData.append(
            'estimatedTimeline',
            typeof data.estimatedTimeline === 'string'
                ? data.estimatedTimeline
                : JSON.stringify(data.estimatedTimeline)
        );
    }

    if (data.portfolioLinks) {
        formData.append(
            'portfolioLinks',
            Array.isArray(data.portfolioLinks)
                ? data.portfolioLinks.join(',')
                : data.portfolioLinks
        );
    }

    if (data.screeningAnswers) {
        formData.append(
            'screeningAnswers',
            typeof data.screeningAnswers === 'string'
                ? data.screeningAnswers
                : JSON.stringify(data.screeningAnswers)
        );
    }

    if (cvFile) {
        formData.append('cv', cvFile);
    }

    return formData;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const freelanceTenderService = {

    // ========== CATEGORIES ==========
    /**
     * FIX B-04: Returns grouped categories so the UI can render
     * a two-level Category → Subcategory selector with <optgroup>.
     * Previously this was Object.values().flat() which produced duplicates.
     */
    getCategories: async (): Promise<FreelanceTenderCategory[]> => {
        const response = await api.get<{
            message: string;
            success: boolean;
            data: Record<string, string[]>;
        }>('/freelance-tenders/categories');

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch categories');
        }

        return Object.entries(response.data.data).map(([category, subcategories]) => ({
            // Convert "Admin_Support" → "Admin Support" for display
            category: category.replace(/_/g, ' '),
            subcategories,
        }));
    },

    // ========== CREATE ==========
    createFreelanceTender: async (
        data: CreateFreelanceTenderData,
        files?: File[]
    ): Promise<FreelanceTender> => {
        const formData = buildFreelanceTenderFormData(data, files);

        const response = await api.post<{
            message: string; success: boolean; data: FreelanceTender;
        }>(
            '/freelance-tenders/create',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to create freelance tender');
        }

        return response.data.data;
    },

    // ========== BROWSE ==========
    getFreelanceTenders: async (
        filters?: FreelanceTenderFilters
    ): Promise<{ tenders: FreelanceTenderListItem[]; pagination: TenderPagination }> => {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, String(value));
                }
            });
        }

        const response = await api.get<{
            message: string;
            success: boolean;
            // FIX: Controller wraps data in { tenders, pagination } — service accesses .data.data
            data: { tenders: FreelanceTenderListItem[]; pagination: TenderPagination };
        }>(`/freelance-tenders?${params.toString()}`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch freelance tenders');
        }

        return response.data.data;
    },

    // ========== GET SINGLE ==========
    getFreelanceTender: async (id: string): Promise<FreelanceTender> => {
        const response = await api.get<{
            message: string; success: boolean; data: FreelanceTender;
        }>(`/freelance-tenders/${id}`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch freelance tender');
        }

        return response.data.data;
    },

    // ========== GET EDIT DATA ==========
    getFreelanceTenderEditData: async (id: string): Promise<FreelanceTender> => {
        const response = await api.get<{
            message: string; success: boolean; data: FreelanceTender;
        }>(`/freelance-tenders/${id}/edit-data`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch edit data');
        }

        return response.data.data;
    },

    // ========== UPDATE ==========
    updateFreelanceTender: async (
        id: string,
        data: UpdateFreelanceTenderData,
        files?: File[]
    ): Promise<FreelanceTender> => {
        const formData = buildFreelanceTenderFormData(data, files);

        const response = await api.put<{
            message: string; success: boolean; data: FreelanceTender;
        }>(
            `/freelance-tenders/${id}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to update freelance tender');
        }

        return response.data.data;
    },

    // ========== DELETE ==========
    deleteFreelanceTender: async (id: string): Promise<void> => {
        const response = await api.delete<{ success: boolean; message: string }>(
            `/freelance-tenders/${id}`
        );

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to delete freelance tender');
        }
    },

    // ========== PUBLISH ==========
    publishFreelanceTender: async (id: string): Promise<FreelanceTender> => {
        const response = await api.post<{
            message: string; success: boolean; data: FreelanceTender;
        }>(`/freelance-tenders/${id}/publish`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to publish freelance tender');
        }

        return response.data.data;
    },

    // ========== SUBMIT APPLICATION ==========
    submitApplication: async (
        id: string,
        data: SubmitApplicationData,
        cvFile?: File
    ): Promise<FreelanceTenderApplication> => {
        const formData = buildApplicationFormData(data, cvFile);

        const response = await api.post<{
            message: string; success: boolean; data: FreelanceTenderApplication;
        }>(
            `/freelance-tenders/${id}/apply`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to submit application');
        }

        return response.data.data;
    },

    // ========== GET APPLICATIONS ==========
    getTenderApplications: async (
        id: string,
        params?: { status?: string; page?: number; limit?: number }
    ): Promise<{
        applications: FreelanceTenderApplication[];
        pagination: TenderPagination;
        summary: any;
    }> => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));

        const response = await api.get<{
            message: string;
            success: boolean;
            data: {
                applications: FreelanceTenderApplication[];
                pagination: TenderPagination;
                summary: any;
            };
        }>(`/freelance-tenders/${id}/applications?${queryParams.toString()}`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch applications');
        }

        return response.data.data;
    },

    // ========== UPDATE APPLICATION STATUS ==========
    updateApplicationStatus: async (
        id: string,
        appId: string,
        status: string,
        notes?: string
    ): Promise<FreelanceTenderApplication> => {
        const response = await api.patch<{
            message: string; success: boolean; data: FreelanceTenderApplication;
        }>(
            `/freelance-tenders/${id}/applications/${appId}/status`,
            { status, notes }
        );

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to update application status');
        }

        return response.data.data;
    },

    // ========== MY POSTED TENDERS ==========
    getMyPostedFreelanceTenders: async (params?: {
        status?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<{
        tenders: Array<FreelanceTenderListItem & { applicationCount: number; savedCount: number }>;
        pagination: TenderPagination;
    }> => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await api.get<{
            success: boolean;
            message?: string;
            data: {
                tenders: Array<FreelanceTenderListItem & { applicationCount: number; savedCount: number }>;
                pagination: TenderPagination;
            };
        }>(`/freelance-tenders/my-tenders?${queryParams.toString()}`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch your tenders');
        }

        return response.data.data;
    },

    // ========== TOGGLE SAVE ==========
    toggleSaveFreelanceTender: async (id: string): Promise<{ saved: boolean; totalSaves: number }> => {
        const response = await api.post<{
            message: string; success: boolean; data: { saved: boolean; totalSaves: number };
        }>(`/freelance-tenders/${id}/toggle-save`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to save/unsave tender');
        }

        return response.data.data;
    },

    // ========== GET SAVED TENDERS ==========
    getSavedFreelanceTenders: async (params?: {
        page?: number;
        limit?: number;
    }): Promise<{ tenders: FreelanceTenderListItem[]; pagination: TenderPagination }> => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));

        const response = await api.get<{
            message: string;
            success: boolean;
            data: { tenders: FreelanceTenderListItem[]; pagination: TenderPagination };
        }>(`/freelance-tenders/saved?${queryParams.toString()}`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch saved tenders');
        }

        return response.data.data;
    },

    // ========== GET STATS ==========
    getFreelanceTenderStats: async (id: string): Promise<FreelanceTenderStats> => {
        const response = await api.get<{
            message: string; success: boolean; data: FreelanceTenderStats;
        }>(`/freelance-tenders/${id}/stats`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch tender stats');
        }

        return response.data.data;
    },

    // ========== UPLOAD ATTACHMENTS ==========
    uploadFreelanceAttachments: async (
        id: string,
        files: File[],
        documentType?: string,
        description?: string
    ): Promise<TenderAttachment[]> => {
        const formData = new FormData();
        files.forEach(file => formData.append('documents', file));
        if (documentType) formData.append('documentType', documentType);
        if (description) formData.append('description', description);

        const response = await api.post<{
            message: string; success: boolean; data: TenderAttachment[];
        }>(
            `/freelance-tenders/${id}/attachments/upload`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to upload attachments');
        }

        return response.data.data;
    },

    /**
     * FIX B-05: Download MUST go through the backend API route — NEVER via attachment.url
     * or any static /uploads/ path. The controller streams the file with res.download().
     * This function triggers a browser download from the blob response.
     */
    downloadFreelanceAttachment: async (tenderId: string, attachmentId: string): Promise<void> => {
        const response = await api.get(
            `/freelance-tenders/${tenderId}/attachments/${attachmentId}/download`,
            { responseType: 'blob' }
        );

        // Extract filename from Content-Disposition header
        const disposition = response.headers['content-disposition'] ?? '';
        const fileNameMatch = disposition.match(/filename[^;=\n]*=(['"]*)(.*?)\1/);
        const fileName = fileNameMatch ? fileNameMatch[2] : 'download';

        // Trigger browser download
        const blobUrl = URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
    },

    // ========== DELETE ATTACHMENT ==========
    deleteFreelanceAttachment: async (id: string, attachmentId: string): Promise<void> => {
        const response = await api.delete<{ success: boolean; message: string }>(
            `/freelance-tenders/${id}/attachments/${attachmentId}`
        );

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to delete attachment');
        }
    },
};

export default freelanceTenderService;