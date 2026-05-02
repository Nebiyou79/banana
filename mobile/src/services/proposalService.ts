// ─────────────────────────────────────────────────────────────────────────────
// src/services/proposalService.ts
// Banana Mobile App — Module 6B: Proposals
//
// API client for all proposal-related endpoints.
// Mirrors frontend/src/services/proposalService.ts pattern exactly.
// All paths are relative to the axios baseURL (/api/v1 is already in httpClient).
//
// Routes:
//   POST   /proposals/create
//   GET    /proposals/my-proposals
//   GET    /proposals/:id
//   PUT    /proposals/:id
//   POST   /proposals/:id/submit
//   POST   /proposals/:id/withdraw
//   GET    /proposals/tenders/:tenderId/proposals
//   GET    /proposals/tenders/:tenderId/stats
//   GET    /proposals/tenders/:tenderId/my-proposal
//   PATCH  /proposals/:id/status
//   PATCH  /proposals/:id/shortlist
//   POST   /proposals/:id/attachments
//   DELETE /proposals/:id/attachments/:attachId
// ─────────────────────────────────────────────────────────────────────────────

import { AxiosError } from 'axios';
import httpClient from '../lib/httpClient';
import type {
  Proposal,
  ProposalListItem,
  ProposalListResponse,
  ProposalStats,
  CreateProposalData,
  UpdateProposalData,
  ProposalFilters,
  UpdateProposalStatusData,
  ProposalAttachment,
  UploadAttachmentResponse,
} from '../types/proposal';

// ─── Generic response envelope from the server ───────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  code?: string;
  message?: string;
}

// ─── Filter serialiser ────────────────────────────────────────────────────────

/**
 * Converts a ProposalFilters object into query-string parameters.
 * Omits undefined / null / 'all' values so the server never receives junk.
 */
function buildQueryString(filters?: ProposalFilters): string {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  }
  if (filters.page != null) {
    params.append('page', String(filters.page));
  }
  if (filters.limit != null) {
    params.append('limit', String(filters.limit));
  }
  if (filters.isShortlisted != null) {
    params.append('isShortlisted', String(filters.isShortlisted));
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ─────────────────────────────────────────────────────────────────────────────
// ── A. FREELANCER METHODS ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A1. Create a draft proposal.
 * POST /proposals/create
 *
 * CRITICAL: This must be called BEFORE any form data is saved.
 * Store the returned proposal._id as draftId in component state.
 */
const createDraft = async (data: CreateProposalData): Promise<Proposal> => {
  const res = await httpClient.post<ApiResponse<Proposal>>('/proposals/create', data);
  return res.data.data;
};

/**
 * A2. Update an existing draft (patch-style — only provided fields change).
 * PUT /proposals/:id
 *
 * Called automatically on every step navigation to auto-save progress.
 */
const updateDraft = async (
  proposalId: string,
  data: UpdateProposalData,
): Promise<Proposal> => {
  const res = await httpClient.put<ApiResponse<Proposal>>(
    `/proposals/${proposalId}`,
    data,
  );
  return res.data.data;
};

/**
 * A3. Submit a draft — transitions isDraft=false, status='submitted'.
 * POST /proposals/:id/submit
 *
 * No body required. The draft must already be saved with valid content.
 * This is the ONLY correct way to finalise submission.
 */
const submitProposal = async (proposalId: string): Promise<Proposal> => {
  const res = await httpClient.post<ApiResponse<Proposal>>(
    `/proposals/${proposalId}/submit`,
  );
  return res.data.data;
};

/**
 * A4. Withdraw a submitted proposal.
 * POST /proposals/:id/withdraw
 *
 * Only valid when status is 'submitted' or 'under_review'.
 */
const withdrawProposal = async (proposalId: string): Promise<Proposal> => {
  const res = await httpClient.post<ApiResponse<Proposal>>(
    `/proposals/${proposalId}/withdraw`,
  );
  return res.data.data;
};

/**
 * A5. Freelancer's own proposal list with optional filters.
 * GET /proposals/my-proposals
 */
const getMyProposals = async (
  filters?: ProposalFilters,
): Promise<ProposalListResponse> => {
  const res = await httpClient.get<ApiResponse<ProposalListResponse>>(
    `/proposals/my-proposals${buildQueryString(filters)}`,
  );
  return res.data.data;
};

/**
 * A6. Full proposal detail — works for both freelancer and company owner.
 * GET /proposals/:id
 */
const getProposalDetail = async (proposalId: string): Promise<Proposal> => {
  const res = await httpClient.get<ApiResponse<Proposal>>(
    `/proposals/${proposalId}`,
  );
  return res.data.data;
};

/**
 * A7. Check if the authenticated freelancer has a proposal for a specific tender.
 * GET /proposals/tenders/:tenderId/my-proposal
 *
 * Returns null (does NOT throw) when no proposal exists yet.
 * Used by SubmitProposalScreen to decide whether to resume a draft or create new.
 */
const getMyProposalForTender = async (
  tenderId: string,
): Promise<Proposal | null> => {
  try {
    const res = await httpClient.get<ApiResponse<Proposal | null>>(
      `/proposals/tenders/${tenderId}/my-proposal`,
    );
    return res.data.data ?? null;
  } catch (err) {
    const axiosErr = err as AxiosError;
    // 404 simply means the freelancer hasn't applied yet — not an error
    if (axiosErr.response?.status === 404) return null;
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ── B. COMPANY / OWNER METHODS ────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/**
 * B1. All non-draft proposals for a tender the caller owns.
 * GET /proposals/tenders/:tenderId/proposals
 */
const getTenderProposals = async (
  tenderId: string,
  filters?: ProposalFilters,
): Promise<ProposalListResponse> => {
  const res = await httpClient.get<ApiResponse<ProposalListResponse>>(
    `/proposals/tenders/${tenderId}/proposals${buildQueryString(filters)}`,
  );
  return res.data.data;
};

/**
 * B2. Aggregated stats for all proposals on a tender.
 * GET /proposals/tenders/:tenderId/stats
 */
const getTenderProposalStats = async (
  tenderId: string,
): Promise<ProposalStats> => {
  const res = await httpClient.get<ApiResponse<ProposalStats>>(
    `/proposals/tenders/${tenderId}/stats`,
  );
  return res.data.data;
};

/**
 * B3. Move a proposal through its status lifecycle.
 * PATCH /proposals/:id/status
 *
 * Valid transitions (enforced server-side):
 *   submitted     → under_review | rejected
 *   under_review  → shortlisted  | interview_scheduled | rejected
 *   shortlisted   → interview_scheduled | awarded | rejected
 *   interview_scheduled → awarded | rejected
 */
const updateProposalStatus = async (
  proposalId: string,
  data: UpdateProposalStatusData,
): Promise<Proposal> => {
  const res = await httpClient.patch<ApiResponse<Proposal>>(
    `/proposals/${proposalId}/status`,
    data,
  );
  return res.data.data;
};

/**
 * B4. Toggle the isShortlisted flag on a proposal.
 * PATCH /proposals/:id/shortlist
 *
 * Returns the new boolean state, not the full proposal.
 */
const toggleShortlist = async (
  proposalId: string,
): Promise<{ isShortlisted: boolean }> => {
  const res = await httpClient.patch<ApiResponse<{ isShortlisted: boolean }>>(
    `/proposals/${proposalId}/shortlist`,
  );
  return res.data.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// ── C. ATTACHMENT METHODS ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/**
 * C1. Upload one or more files as proposal attachments.
 * POST /proposals/:id/attachments   (multipart/form-data)
 *
 * @param proposalId  Target proposal (must be a draft owned by the caller)
 * @param fileUri     Local file URI from the document/image picker
 * @param fileName    Display name for the attachment
 * @param mimeType    MIME type string (e.g. 'application/pdf')
 * @param attachmentType  cv | portfolio | sample | other
 */
const uploadAttachment = async (
  proposalId: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
  attachmentType: ProposalAttachment['attachmentType'] = 'other',
): Promise<UploadAttachmentResponse> => {
  const formData = new FormData();

  // React Native FormData file object
  formData.append('attachments', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  formData.append('attachmentType', attachmentType);

  const res = await httpClient.post<ApiResponse<UploadAttachmentResponse>>(
    `/proposals/${proposalId}/attachments`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return res.data.data;
};

/**
 * C2. Remove a specific attachment from a proposal.
 * DELETE /proposals/:id/attachments/:attachId
 */
const removeAttachment = async (
  proposalId: string,
  attachmentId: string,
): Promise<void> => {
  await httpClient.delete(
    `/proposals/${proposalId}/attachments/${attachmentId}`,
  );
};

// ─── Named export object (mirrors proposalService pattern from web) ───────────

const proposalService = {
  // Freelancer
  createDraft,
  updateDraft,
  submitProposal,
  withdrawProposal,
  getMyProposals,
  getProposalDetail,
  getMyProposalForTender,
  // Company
  getTenderProposals,
  getTenderProposalStats,
  updateProposalStatus,
  toggleShortlist,
  // Attachments
  uploadAttachment,
  removeAttachment,
};

export default proposalService;
