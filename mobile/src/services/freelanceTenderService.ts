// mobile/src/services/freelanceTenderService.ts
// Mirrors frontend/src/services/freelanceTenderService.ts exactly.
// Source of truth: server/src/controllers/freelanceTenderController.js

import httpClient from '../lib/httpClient';
import type {
  FreelanceTender,
  FreelanceTenderListItem,
  FreelanceTenderFilters,
  FreelanceTenderFormData,
  FreelanceTenderListResponse,
  TenderApplicationsResponse,
  SubmitApplicationData,
  TenderAttachment,
} from '../types/freelanceTender';

// ─── FormData builder ─────────────────────────────────────────────────────────
// E.2 rules: arrays as repeated fields, nested objects as JSON strings, files as RN objects.

function buildTenderFormData(
  data: FreelanceTenderFormData,
  files?: Array<{ uri: string; name: string; mimeType: string }>
): FormData {
  const fd = new FormData();

  fd.append('title', data.title);
  fd.append('description', data.description);
  fd.append('procurementCategory', data.procurementCategory);
  fd.append('deadline', data.deadline);

  if (data.briefDescription) fd.append('briefDescription', data.briefDescription);
  if (data.maxApplications != null)
    fd.append('maxApplications', String(data.maxApplications));

  // Arrays as repeated fields (E.2 rule)
  data.skillsRequired.forEach((skill) => fd.append('skillsRequired', skill));

  // Nested object as a single JSON-stringified field (E.2 rule)
  fd.append('details', JSON.stringify(data.details));

  // Files (E.2 rule)
  if (files?.length) {
    files.forEach((file) => {
      fd.append('documents', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as unknown as Blob);
    });
  }

  return fd;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const freelanceTenderService = {
  // ── Categories ──────────────────────────────────────────────────────────────

  getCategories: async (): Promise<Record<string, string[]>> => {
    const res = await httpClient.get<{ success: boolean; data: Record<string, string[]> }>(
      '/freelance-tenders/categories'
    );
    return res.data.data;
  },

  // ── Browse (freelancer) ──────────────────────────────────────────────────────

  getFreelanceTenders: async (
    filters?: FreelanceTenderFilters
  ): Promise<FreelanceTenderListResponse> => {
    const res = await httpClient.get<{
      success: boolean;
      data: FreelanceTenderListResponse;
    }>('/freelance-tenders', { params: filters });
    return res.data.data;
  },

  // ── Single tender ──────────────────────────────────────────────────────────

  getFreelanceTender: async (id: string): Promise<FreelanceTender> => {
    const res = await httpClient.get<{
      success: boolean;
      data: FreelanceTender;
      myApplication?: import('../types/freelanceTender').FreelanceTenderApplication | null;
      isOwner: boolean;
    }>(`/freelance-tenders/${id}`);
    // Merge myApplication + isSaved into the data object for convenience
    const tender = res.data.data;
    if (res.data.myApplication) {
      tender.myApplication = res.data.myApplication;
      tender.hasApplied = true;
    }
    return tender;
  },

  // ── Edit data (pre-populated for form) ────────────────────────────────────

  getFreelanceTenderEditData: async (id: string): Promise<FreelanceTender> => {
    const res = await httpClient.get<{ success: boolean; data: FreelanceTender }>(
      `/freelance-tenders/${id}/edit-data`
    );
    return res.data.data;
  },

  // ── Create ────────────────────────────────────────────────────────────────

  createFreelanceTender: async (
    data: FreelanceTenderFormData,
    files?: Array<{ uri: string; name: string; mimeType: string }>
  ): Promise<FreelanceTender> => {
    const fd = buildTenderFormData(data, files);
    const res = await httpClient.post<{ success: boolean; data: FreelanceTender }>(
      '/freelance-tenders/create',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },

  // ── Update ────────────────────────────────────────────────────────────────

  updateFreelanceTender: async (
    id: string,
    data: Partial<FreelanceTenderFormData>,
    files?: Array<{ uri: string; name: string; mimeType: string }>
  ): Promise<FreelanceTender> => {
    const fd = buildTenderFormData(data as FreelanceTenderFormData, files);
    const res = await httpClient.put<{ success: boolean; data: FreelanceTender }>(
      `/freelance-tenders/${id}`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },

  // ── Delete ────────────────────────────────────────────────────────────────

  deleteFreelanceTender: async (id: string): Promise<void> => {
    await httpClient.delete(`/freelance-tenders/${id}`);
  },

  // ── Publish ───────────────────────────────────────────────────────────────

  publishFreelanceTender: async (id: string): Promise<FreelanceTender> => {
    const res = await httpClient.post<{ success: boolean; data: FreelanceTender }>(
      `/freelance-tenders/${id}/publish`
    );
    return res.data.data;
  },

  // ── Close (status published → closed) ────────────────────────────────────
  // Note: backend does not have a dedicated /close route; we use update with status field.
  // The controller's updateFreelanceTender accepts status changes.

  closeFreelanceTender: async (id: string): Promise<FreelanceTender> => {
    const fd = new FormData();
    fd.append('status', 'closed');
    const res = await httpClient.put<{ success: boolean; data: FreelanceTender }>(
      `/freelance-tenders/${id}`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },

  // ── My posted tenders (company/org) ───────────────────────────────────────

  getMyPostedFreelanceTenders: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<FreelanceTenderListResponse> => {
    const res = await httpClient.get<{
      success: boolean;
      data: FreelanceTenderListResponse;
    }>('/freelance-tenders/my-tenders', { params });
    return res.data.data;
  },

  // ── Saved tenders (freelancer) ─────────────────────────────────────────────

  getSavedFreelanceTenders: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<FreelanceTenderListResponse> => {
    const res = await httpClient.get<{
      success: boolean;
      data: FreelanceTenderListResponse;
    }>('/freelance-tenders/saved', { params });
    return res.data.data;
  },

  // ── Toggle save (single endpoint handles both save + unsave) ──────────────

  toggleSaveFreelanceTender: async (
    id: string
  ): Promise<{ saved: boolean; totalSaves: number }> => {
    const res = await httpClient.post<{
      success: boolean;
      data: { saved: boolean; totalSaves: number; operation: string };
    }>(`/freelance-tenders/${id}/toggle-save`);
    return { saved: res.data.data.saved, totalSaves: res.data.data.totalSaves };
  },

  // saveFreelanceTender / unsaveFreelanceTender are aliases for the toggle
  saveFreelanceTender: async (id: string) =>
    freelanceTenderService.toggleSaveFreelanceTender(id),
  unsaveFreelanceTender: async (id: string) =>
    freelanceTenderService.toggleSaveFreelanceTender(id),

  // ── Applications ──────────────────────────────────────────────────────────

  getFreelanceTenderApplications: async (
    tenderId: string,
    params?: { status?: string; page?: number; limit?: number }
  ): Promise<TenderApplicationsResponse> => {
    const res = await httpClient.get<{
      success: boolean;
      data: TenderApplicationsResponse;
    }>(`/freelance-tenders/${tenderId}/applications`, { params });
    return res.data.data;
  },

  submitApplication: async (
    tenderId: string,
    data: SubmitApplicationData
  ): Promise<import('../types/freelanceTender').FreelanceTenderApplication> => {
    const fd = new FormData();
    fd.append('coverLetter', data.coverLetter);
    fd.append('proposedRate', String(data.proposedRate));
    if (data.proposedRateCurrency) fd.append('proposedRateCurrency', data.proposedRateCurrency);
    if (data.estimatedTimeline)
      fd.append('estimatedTimeline', JSON.stringify(data.estimatedTimeline));
    if (data.portfolioLinks?.length) {
      data.portfolioLinks.forEach((link) => fd.append('portfolioLinks', link));
    }
    if (data.screeningAnswers?.length) {
      fd.append('screeningAnswers', JSON.stringify(data.screeningAnswers));
    }
    if (data.cvFile) {
      fd.append('cv', {
        uri: data.cvFile.uri,
        name: data.cvFile.name,
        type: data.cvFile.mimeType,
      } as unknown as Blob);
    }
    const res = await httpClient.post<{
      success: boolean;
      data: import('../types/freelanceTender').FreelanceTenderApplication;
    }>(`/freelance-tenders/${tenderId}/apply`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  updateApplicationStatus: async (
    tenderId: string,
    appId: string,
    status: import('../types/freelanceTender').ApplicationStatus,
    notes?: string
  ): Promise<import('../types/freelanceTender').FreelanceTenderApplication> => {
    const res = await httpClient.patch<{
      success: boolean;
      data: import('../types/freelanceTender').FreelanceTenderApplication;
    }>(`/freelance-tenders/${tenderId}/applications/${appId}/status`, { status, notes });
    return res.data.data;
  },

  // ── Attachments ───────────────────────────────────────────────────────────

  uploadAttachments: async (
    tenderId: string,
    files: Array<{ uri: string; name: string; mimeType: string }>,
    documentType?: string
  ): Promise<TenderAttachment[]> => {
    const fd = new FormData();
    files.forEach((file) => {
      fd.append('documents', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as unknown as Blob);
    });
    if (documentType) fd.append('documentType', documentType);
    const res = await httpClient.post<{ success: boolean; data: TenderAttachment[] }>(
      `/freelance-tenders/${tenderId}/attachments/upload`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },

  deleteAttachment: async (tenderId: string, attachmentId: string): Promise<void> => {
    await httpClient.delete(
      `/freelance-tenders/${tenderId}/attachments/${attachmentId}`
    );
  },

  // ── Stats ─────────────────────────────────────────────────────────────────

  getFreelanceTenderStats: async (
    id: string
  ): Promise<Record<string, unknown>> => {
    const res = await httpClient.get<{ success: boolean; data: Record<string, unknown> }>(
      `/freelance-tenders/${id}/stats`
    );
    return res.data.data;
  },
};

export default freelanceTenderService;