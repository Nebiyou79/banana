/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/profesionalTenderService.ts
import api from '@/lib/axios';
import profileService, { CloudinaryImage } from '@/services/profileService';
import type {
    ProfessionalTender,
    ProfessionalTenderListItem,
    ProfessionalTenderFilters,
    CreateProfessionalTenderData,
    UpdateProfessionalTenderData,
    ProfessionalTenderInvitation,
    ProfessionalTenderAddendum,
    ProfessionalTenderCPO,
    ProfessionalTenderBid,
    TenderPagination,
    TenderAttachment,
    ProfessionalTenderStats,
    AddendumData,
    InviteCompanyData,
    CPOData,
} from '@/types/tender.types';

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR HELPER
// ─────────────────────────────────────────────────────────────────────────────
export function getProfessionalEntityAvatar(
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

// ─────────────────────────────────────────────────────────────────────────────
// FORM DATA BUILDER
// FIX P-01/P-03: biddingType → workflowType rename; 'sealed' → 'closed'
// FIX P-02: evaluationCriteria[] → evaluation object
// FIX P-04: sealedBidConfirmation auto-injected for closed workflow
// FIX P-05: deliverables mapped as { title, description } objects
// FIX P-14: preBidMeeting promoted to ROOT (not inside procurement)
// FIX P-15: procurement.estimatedValue / currency stripped
// ─────────────────────────────────────────────────────────────────────────────
function buildProfessionalTenderFormData(
    data: CreateProfessionalTenderData | UpdateProfessionalTenderData,
    files?: File[]
): FormData {
    const formData = new FormData();
    const payload: Record<string, any> = { ...data };

    // FIX P-01/P-03: key rename + value remap
    if ('biddingType' in payload && !('workflowType' in payload)) {
        payload.workflowType = payload.biddingType === 'sealed' ? 'closed' : payload.biddingType;
    }
    delete payload.biddingType;

    // FIX P-04: auto-inject sealedBidConfirmation
    if (payload.workflowType === 'closed') {
        payload.sealedBidConfirmation = 'true';
    }

    // FIX P-14: preBidMeeting must be root-level, not inside procurement
    if (payload.procurement && typeof payload.procurement === 'object') {
        const procCopy: Record<string, any> = { ...(payload.procurement as any) };
        if (procCopy.preBidMeeting) {
            if (!payload.preBidMeeting) payload.preBidMeeting = procCopy.preBidMeeting;
            delete procCopy.preBidMeeting;
        }
        // FIX P-15: strip non-schema fields
        delete procCopy.estimatedValue;
        delete procCopy.currency;
        payload.procurement = procCopy;
    }

    // FIX P-02: evaluationCriteria[] → evaluation object
    if (Array.isArray(payload.evaluationCriteria) && !payload.evaluation) {
        const criteria: Array<{ name?: string; weight?: number }> = payload.evaluationCriteria;
        const techItem = criteria.find(c => c.name?.toLowerCase().includes('technical'));
        const finItem = criteria.find(c => c.name?.toLowerCase().includes('financial'));
        payload.evaluation = {
            evaluationMethod: 'combined',
            technicalWeight: techItem?.weight ?? 70,
            financialWeight: finItem?.weight ?? 30,
        };
    }
    delete payload.evaluationCriteria;

    // FIX P-05: deliverables as { title, description } objects
    if (payload.scope && typeof payload.scope === 'object') {
        const scope = payload.scope as any;
        if (Array.isArray(scope.deliverables)) {
            scope.deliverables = scope.deliverables.map((d: any) => {
                if (typeof d === 'string') return { title: d, description: '' };
                if (d.text && !d.title) return { title: d.text, description: d.description ?? '' };
                return d;
            });
        }
        payload.scope = scope;
    }

    // Serialise all fields — objects/arrays as JSON strings
    const JSON_FIELDS = new Set([
        'procurement', 'eligibility', 'scope', 'evaluation',
        'preBidMeeting', 'performanceBond', 'timeline',
        'financialCapacity', 'pastProjectReferences',
        'deliverables', 'milestones', 'bidValidityPeriod',
    ]);

    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (JSON_FIELDS.has(key) && typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
        } else if (typeof value !== 'object') {
            formData.append(key, String(value));
        }
    });

    if (files?.length) files.forEach(f => formData.append('documents', f));

    return formData;
}

function buildCPOFormData(data: CPOData, file: File): FormData {
    const formData = new FormData();
    formData.append('cpoNumber', data.cpoNumber);
    formData.append('amount', String(data.amount));
    if (data.currency) formData.append('currency', data.currency);
    if (data.issuingBank) formData.append('issuingBank', data.issuingBank);
    if (data.issueDate) formData.append('issueDate', data.issueDate);
    if (data.expiryDate) formData.append('expiryDate', data.expiryDate);
    formData.append('document', file);
    return formData;
}

// FIX P-09: Trigger a real browser download from a Blob.
// Components must call downloadProfessionalAttachment() — NEVER use attachment.url directly.
function triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────
const professionalTenderService = {

    // FIX P-08: Returns structured { category, subcategories[] }[] — NOT flat.
    // Render as <optgroup label={category}> in selects.
    getCategories: async (): Promise<{ category: string; subcategories: string[] }[]> => {
        const response = await api.get<{
            message: string; success: boolean; data: Record<string, string[]>;
        }>('/professional-tenders/categories');
        if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch categories');
        return Object.entries(response.data.data).map(([category, subcategories]) => ({ category, subcategories }));
    },

    // FIX P-10: On-demand reference number generation
    generateReferenceNumber: async (): Promise<string> => {
        const response = await api.get<{
            success: boolean; data: { referenceNumber: string };
        }>('/professional-tenders/generate-ref');
        if (!response.data.success) throw new Error('Failed to generate reference number');
        return response.data.data.referenceNumber;
    },

    createProfessionalTender: async (
        data: CreateProfessionalTenderData,
        files?: File[]
    ): Promise<ProfessionalTender> => {
        const formData = buildProfessionalTenderFormData(data, files);
        const response = await api.post<{ message: string; success: boolean; data: ProfessionalTender }>(
            '/professional-tenders/create', formData, { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to create professional tender');
        return response.data.data;
    },

    getProfessionalTenders: async (
        filters?: ProfessionalTenderFilters
    ): Promise<{ tenders: ProfessionalTenderListItem[]; pagination: TenderPagination }> => {
        const params = new URLSearchParams();
        if (filters) Object.entries(filters).forEach(([k, v]) => { if (v != null) params.append(k, String(v)); });
        const response = await api.get<{ message: string; success: boolean; data: { tenders: ProfessionalTenderListItem[]; pagination: TenderPagination } }>(
            `/professional-tenders?${params.toString()}`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch professional tenders');
        return response.data.data;
    },

    getProfessionalTender: async (id: string): Promise<ProfessionalTender> => {
        const response = await api.get<{ message: string; success: boolean; data: ProfessionalTender }>(
            `/professional-tenders/${id}`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch professional tender');
        return response.data.data;
    },

    getProfessionalTenderEditData: async (id: string): Promise<ProfessionalTender> => {
        const response = await api.get<{ message: string; success: boolean; data: ProfessionalTender }>(
            `/professional-tenders/${id}/edit-data`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch edit data');
        return response.data.data;
    },

    updateProfessionalTender: async (
        id: string,
        data: UpdateProfessionalTenderData,
        files?: File[]
    ): Promise<ProfessionalTender> => {
        const formData = buildProfessionalTenderFormData(data, files);
        const response = await api.put<{ message: string; success: boolean; data: ProfessionalTender }>(
            `/professional-tenders/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to update professional tender');
        return response.data.data;
    },

    deleteProfessionalTender: async (id: string): Promise<void> => {
        const response = await api.delete<{ success: boolean; message: string }>(`/professional-tenders/${id}`);
        if (!response.data.success) throw new Error(response.data.message || 'Failed to delete professional tender');
    },

    publishProfessionalTender: async (id: string): Promise<ProfessionalTender> => {
        const response = await api.post<{ message: string; success: boolean; data: ProfessionalTender }>(
            `/professional-tenders/${id}/publish`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to publish professional tender');
        return response.data.data;
    },

    revealBids: async (id: string): Promise<{ bidsRevealed: number }> => {
        const response = await api.post<{ message: string; success: boolean; data: { bidsRevealed: number } }>(
            `/professional-tenders/${id}/reveal-bids`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to reveal bids');
        return response.data.data;
    },

    issueAddendum: async (id: string, data: AddendumData, files?: File[]): Promise<ProfessionalTenderAddendum> => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        if (data.newDeadline) formData.append('newDeadline', data.newDeadline);
        if (data.documentType) formData.append('documentType', data.documentType);
        if (files?.length) files.forEach(f => formData.append('documents', f));
        const response = await api.post<{ message: string; success: boolean; data: ProfessionalTenderAddendum }>(
            `/professional-tenders/${id}/addendum`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to issue addendum');
        return response.data.data;
    },

    getAddenda: async (id: string): Promise<ProfessionalTenderAddendum[]> => {
        const response = await api.get<{ message: string; success: boolean; data: ProfessionalTenderAddendum[] }>(
            `/professional-tenders/${id}/addendum`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch addenda');
        return response.data.data;
    },

    inviteCompanies: async (id: string, companies: InviteCompanyData[], emails?: string[]): Promise<{ invited: number }> => {
        const response = await api.post<{ message: string; success: boolean; data: { invitationsSent: number } }>(
            `/professional-tenders/${id}/invite`,
            {
                companies,
                ...(emails && emails.length > 0 ? { emails } : {}),
            }
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to send invitations');
        return { invited: response.data.data.invitationsSent };
    },

    respondToInvitation: async (id: string, inviteId: string, response: 'accepted' | 'declined'): Promise<void> => {
        const apiResponse = await api.post<{ success: boolean; message: string }>(
            `/professional-tenders/${id}/invitations/${inviteId}/respond`, { response }
        );
        if (!apiResponse.data.success) throw new Error(apiResponse.data.message || 'Failed to respond to invitation');
    },

    getMyInvitations: async (params?: { status?: string; page?: number; limit?: number }): Promise<{ invitations: any[]; pagination: TenderPagination }> => {
        const q = new URLSearchParams();
        if (params?.status) q.append('status', params.status);
        if (params?.page) q.append('page', String(params.page));
        if (params?.limit) q.append('limit', String(params.limit));
        const response = await api.get<{ message: string; success: boolean; data: { invitations: any[]; pagination: TenderPagination } }>(
            `/professional-tenders/my-invitations?${q.toString()}`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch invitations');
        return response.data.data;
    },

    submitCPO: async (id: string, data: CPOData, file: File): Promise<ProfessionalTenderCPO> => {
        const formData = buildCPOFormData(data, file);
        const response = await api.post<{ message: string; success: boolean; data: ProfessionalTenderCPO }>(
            `/professional-tenders/${id}/cpo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to submit CPO');
        return response.data.data;
    },

    getCPOSubmissions: async (id: string): Promise<ProfessionalTenderCPO[]> => {
        const response = await api.get<{ message: string; success: boolean; data: ProfessionalTenderCPO[] }>(
            `/professional-tenders/${id}/cpo`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch CPO submissions');
        return response.data.data;
    },

    verifyCPO: async (id: string, cpoId: string, status: 'verified' | 'rejected', notes?: string): Promise<ProfessionalTenderCPO> => {
        const response = await api.patch<{ message: string; success: boolean; data: ProfessionalTenderCPO }>(
            `/professional-tenders/${id}/cpo/${cpoId}/verify`, { status, verificationNotes: notes }
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to verify CPO');
        return response.data.data;
    },

    getMyPostedProfessionalTenders: async (params?: { status?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }): Promise<{
        tenders: Array<ProfessionalTenderListItem & { bidCount: number; cpoCount: number; savedCount: number }>;
        pagination: TenderPagination;
    }> => {
        const q = new URLSearchParams();
        if (params?.status) q.append('status', params.status);
        if (params?.page) q.append('page', String(params.page));
        if (params?.limit) q.append('limit', String(params.limit));
        if (params?.sortBy) q.append('sortBy', params.sortBy);
        if (params?.sortOrder) q.append('sortOrder', params.sortOrder);
        const response = await api.get<{ message: string; success: boolean; data: { tenders: any[]; pagination: TenderPagination } }>(
            `/professional-tenders/my-tenders?${q.toString()}`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch your tenders');
        return response.data.data;
    },

    toggleSaveProfessionalTender: async (id: string): Promise<{ saved: boolean; totalSaves: number }> => {
        const response = await api.post<{ message: string; success: boolean; data: { saved: boolean; totalSaves: number } }>(
            `/professional-tenders/${id}/toggle-save`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to save/unsave tender');
        return response.data.data;
    },

    getSavedProfessionalTenders: async (params?: { page?: number; limit?: number }): Promise<{ tenders: ProfessionalTenderListItem[]; pagination: TenderPagination }> => {
        const q = new URLSearchParams();
        if (params?.page) q.append('page', String(params.page));
        if (params?.limit) q.append('limit', String(params.limit));
        const response = await api.get<{ message: string; success: boolean; data: { tenders: ProfessionalTenderListItem[]; pagination: TenderPagination } }>(
            `/professional-tenders/saved?${q.toString()}`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch saved tenders');
        return response.data.data;
    },

    getProfessionalTenderStats: async (id: string): Promise<ProfessionalTenderStats> => {
        const response = await api.get<{ message: string; success: boolean; data: ProfessionalTenderStats }>(
            `/professional-tenders/${id}/stats`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch tender stats');
        return response.data.data;
    },

    getCompaniesForInvitation: async (search?: string, page?: number, limit?: number): Promise<{
        companies: Array<{ _id: string; name: string; logo?: CloudinaryImage; headline?: string; industry?: string }>;
        pagination: TenderPagination;
    }> => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (page) params.append('page', String(page));
        if (limit) params.append('limit', String(limit));
        const response = await api.get<{ message: string; success: boolean; data: { companies: any[]; pagination: TenderPagination } }>(
            `/professional-tenders/companies/list?${params.toString()}`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch companies');
        return response.data.data;
    },

    uploadProfessionalAttachments: async (id: string, files: File[], documentType?: string, description?: string): Promise<TenderAttachment[]> => {
        const formData = new FormData();
        files.forEach(f => formData.append('documents', f));
        if (documentType) formData.append('documentType', documentType);
        if (description) formData.append('description', description);
        const response = await api.post<{ message: string; success: boolean; data: TenderAttachment[] }>(
            `/professional-tenders/${id}/attachments/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to upload attachments');
        return response.data.data;
    },

    // FIX P-09: Streams via API then triggers browser save-as dialog.
    // NEVER use attachment.url or attachment.downloadUrl directly — they are local /uploads/... paths
    // that resolve to Next.js (port 3000) instead of the backend, causing 404.
    downloadProfessionalAttachment: async (id: string, attachmentId: string, filename?: string): Promise<void> => {
        const response = await api.get(
            `/professional-tenders/${id}/attachments/${attachmentId}/download`,
            { responseType: 'blob' }
        );
        const disposition = response.headers['content-disposition'] as string | undefined;
        let resolvedFilename = filename || 'download';
        if (disposition) {
            const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match?.[1]) resolvedFilename = match[1].replace(/['"]/g, '');
        }
        triggerBlobDownload(response.data as Blob, resolvedFilename);
    },

    deleteProfessionalAttachment: async (id: string, attachmentId: string): Promise<void> => {
        const response = await api.delete<{ success: boolean; message: string }>(
            `/professional-tenders/${id}/attachments/${attachmentId}`
        );
        if (!response.data.success) throw new Error(response.data.message || 'Failed to delete attachment');
    },
};

export default professionalTenderService;