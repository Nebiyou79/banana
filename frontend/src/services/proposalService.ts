// services/proposalService.ts
// Standalone Proposal API service — do NOT modify freelanceTenderService.ts
//
// IMPORTANT: The axios `api` instance already has baseURL set to include `/api/v1`.
// All paths here must start WITHOUT `/api/v1` — e.g. `/proposals/...` not `/api/v1/proposals/...`
// This matches the pattern in freelanceTenderService.ts which uses `/freelance-tenders/...`
//
import api from '@/lib/axios';
import type { AxiosError } from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ProposalStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'awarded'
  | 'rejected'
  | 'withdrawn';

export type BidType = 'fixed' | 'hourly';

export type ProposalCurrency = 'ETB' | 'USD' | 'EUR' | 'GBP';

export type ProposalAvailability = 'full-time' | 'part-time' | 'flexible';

export type ProposalDurationUnit = 'hours' | 'days' | 'weeks' | 'months';

export interface ProposalMilestone {
  _id?: string;
  title: string;
  description?: string;
  amount: number;
  duration: number;
  durationUnit: ProposalDurationUnit;
  order?: number;
}

export interface ProposalScreeningAnswer {
  questionIndex: number;
  questionText?: string;
  answer: string;
  isRequired?: boolean;
}

export interface ProposalAttachment {
  _id: string;
  originalName: string;
  fileName: string;
  size: number;
  mimetype: string;
  url: string;
  downloadUrl: string;
  attachmentType: 'cv' | 'portfolio' | 'sample' | 'other';
  uploadedAt: string;
  description?: string;
}

export interface ProposalPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProposalStats {
  total: number;
  byStatus: Partial<Record<ProposalStatus, number>>;
  avgBid: number;
  minBid: number;
  maxBid: number;
  avgDeliveryDays?: number;
  shortlistedCount: number;
  viewedByOwner: number;
}

export interface ProposalUser {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
  location?: string;
  phone?: string;
  skills?: string[];
  education?: unknown[];
  experience?: unknown[];
  portfolio?: unknown[];
}

export interface ProposalFreelancerProfile {
  _id: string;
  headline?: string;
  bio?: string;
  hourlyRate?: number;
  specialization?: string[];
  ratings?: { average: number; count: number };
  successRate?: number;
  onTimeDelivery?: number;
  responseRate?: number;
  certifications?: unknown[];
  services?: unknown[];
  socialLinks?: Record<string, string>;
}

export interface ProposalTender {
  _id: string;
  title: string;
  description?: string;
  status: string;
  deadline: string;
  skillsRequired?: string[];
  owner: string;
  ownerEntity?: string;
  ownerEntityModel?: string;
  details?: {
    budget?: { min: number; max: number; currency: string };
    engagementType?: string;
    screeningQuestions?: Array<{ question: string; required: boolean }>;
  };
}

export interface Proposal {
  _id: string;
  tender: ProposalTender;
  freelancer: ProposalUser;
  freelancerProfile?: ProposalFreelancerProfile;
  coverLetter: string;
  coverLetterHtml?: string;
  proposalPlan?: string;
  portfolioLinks?: string[];
  bidType: BidType;
  proposedAmount: number;
  currency: ProposalCurrency;
  hourlyRate?: number;
  estimatedWeeklyHours?: number;
  deliveryTime: { value: number; unit: ProposalDurationUnit };
  availability: ProposalAvailability;
  proposedStartDate?: string;
  milestones: ProposalMilestone[];
  screeningAnswers: ProposalScreeningAnswer[];
  attachments: ProposalAttachment[];
  status: ProposalStatus;
  isDraft: boolean;
  submittedAt?: string;
  reviewedAt?: string;
  shortlistedAt?: string;
  awardedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
  ownerNotes?: string;
  ownerRating?: number;
  isShortlisted: boolean;
  interviewDate?: string;
  interviewNotes?: string;
  contractId?: string;
  isBoosted: boolean;
  boostedUntil?: string;
  viewCount: number;
  ownerViewCount: number;
  similarityScore?: number;
  auditLog?: Array<{
    action: string;
    performedBy: string;
    performedAt: string;
    changes?: unknown;
    note?: string;
  }>;
  isExpired?: boolean;
  canBeWithdrawn?: boolean;
  milestonesTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export type ProposalListItem = Omit<
  Proposal,
  'attachments' | 'auditLog' | 'ownerNotes' | 'coverLetterHtml'
>;

export interface CreateProposalData {
  tenderId: string;
  coverLetter?: string;
  coverLetterHtml?: string;
  proposalPlan?: string;
  bidType: BidType;
  proposedAmount: number;
  currency?: ProposalCurrency;
  hourlyRate?: number;
  estimatedWeeklyHours?: number;
  deliveryTime: { value: number; unit: ProposalDurationUnit };
  availability: ProposalAvailability;
  proposedStartDate?: string;
  milestones?: ProposalMilestone[];
  screeningAnswers?: ProposalScreeningAnswer[];
  portfolioLinks?: string[];
}

export type UpdateProposalData = Partial<Omit<CreateProposalData, 'tenderId'>>;

export interface ProposalFilters {
  status?: ProposalStatus | string;
  sortBy?: string;
  page?: number;
  limit?: number;
  isShortlisted?: boolean;
  tenderId?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  code?: string;
  message?: string;
}

interface ListResponse {
  proposals: ProposalListItem[];
  pagination: ProposalPagination;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const toQueryString = (filters?: ProposalFilters): string => {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      params.append(k, String(v));
    }
  });
  const str = params.toString();
  return str ? `?${str}` : '';
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE METHODS
// ─────────────────────────────────────────────────────────────────────────────
// NOTE: All paths are relative to the axios baseURL which already contains /api/v1.
// Use `/proposals/...` NOT `/api/v1/proposals/...`

// ── Freelancer methods ────────────────────────────────────────────────────────

/** Create a draft proposal. tenderId is required. */
const createDraft = async (data: CreateProposalData): Promise<Proposal> => {
  const res = await api.post<ApiResponse<Proposal>>('/proposals/create', data);
  return res.data.data;
};

/** Update any content field on a draft before submitting. */
const updateDraft = async (proposalId: string, data: UpdateProposalData): Promise<Proposal> => {
  const res = await api.put<ApiResponse<Proposal>>(`/proposals/${proposalId}`, data);
  return res.data.data;
};

/** Finalize and submit a draft. No body required. */
const submitProposal = async (proposalId: string): Promise<Proposal> => {
  const res = await api.post<ApiResponse<Proposal>>(`/proposals/${proposalId}/submit`);
  return res.data.data;
};

/** Withdraw a submitted or under_review proposal. */
const withdrawProposal = async (proposalId: string): Promise<Proposal> => {
  const res = await api.post<ApiResponse<Proposal>>(`/proposals/${proposalId}/withdraw`);
  return res.data.data;
};

/** Get the authenticated freelancer's proposals with optional filters. */
const getMyProposals = async (filters?: ProposalFilters): Promise<ListResponse> => {
  const res = await api.get<ApiResponse<ListResponse>>(
    `/proposals/my-proposals${toQueryString(filters)}`
  );
  return res.data.data;
};

/**
 * Get the authenticated freelancer's proposal for a specific tender.
 * Returns null (does NOT throw) if no proposal exists yet.
 */
const getMyProposalForTender = async (tenderId: string): Promise<Proposal | null> => {
  try {
    const res = await api.get<ApiResponse<Proposal | null>>(
      `/proposals/tenders/${tenderId}/my-proposal`
    );
    return res.data.data ?? null;
  } catch (err) {
    const axiosErr = err as AxiosError;
    // 404 just means no proposal yet — not an error
    if (axiosErr.response?.status === 404) return null;
    throw err;
  }
};

// ── Owner methods ─────────────────────────────────────────────────────────────

/** List all non-draft proposals for a tender the caller owns. */
const getTenderProposals = async (
  tenderId: string,
  filters?: ProposalFilters
): Promise<ListResponse> => {
  const res = await api.get<ApiResponse<ListResponse>>(
    `/proposals/tenders/${tenderId}/proposals${toQueryString(filters)}`
  );
  return res.data.data;
};

/** Fetch full proposal detail — populates freelancer, freelancerProfile, tender. */
const getProposalDetail = async (proposalId: string): Promise<Proposal> => {
  const res = await api.get<ApiResponse<Proposal>>(`/proposals/${proposalId}`);
  return res.data.data;
};

/** Move a proposal through the status lifecycle with optional notes/dates. */
const updateProposalStatus = async (
  proposalId: string,
  data: {
    status: ProposalStatus;
    ownerNotes?: string;
    interviewDate?: string;
    interviewNotes?: string;
  }
): Promise<Proposal> => {
  const res = await api.patch<ApiResponse<Proposal>>(
    `/proposals/${proposalId}/status`,
    data
  );
  return res.data.data;
};

/** Toggle isShortlisted on a proposal. Returns the new boolean state. */
const toggleShortlist = async (proposalId: string): Promise<{ isShortlisted: boolean }> => {
  const res = await api.post<ApiResponse<{ isShortlisted: boolean }>>(
    `/proposals/${proposalId}/shortlist`
  );
  return res.data.data;
};

/** Aggregated stats for all proposals on a tender. */
const getTenderProposalStats = async (tenderId: string): Promise<ProposalStats> => {
  const res = await api.get<ApiResponse<ProposalStats>>(
    `/proposals/tenders/${tenderId}/proposals/stats`
  );
  return res.data.data;
};

// ── Attachment methods ────────────────────────────────────────────────────────

/** Upload one or more attachment files to a proposal. */
const uploadAttachments = async (
  proposalId: string,
  files: File[],
  attachmentType?: string
): Promise<{ attachments: ProposalAttachment[] }> => {
  const form = new FormData();
  files.forEach((file) => form.append('attachments', file));
  if (attachmentType) form.append('attachmentType', attachmentType);

  const res = await api.post<ApiResponse<{ attachments: ProposalAttachment[] }>>(
    `/proposals/${proposalId}/attachments`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data.data;
};

/** Remove a specific attachment by ID. */
const deleteAttachment = async (proposalId: string, attachmentId: string): Promise<void> => {
  await api.delete(`/proposals/${proposalId}/attachments/${attachmentId}`);
};

/**
 * Build the download URL for an attachment client-side — no API call.
 * Mirrors the URL pattern used by the backend controller.
 */
const getDownloadUrl = (proposalId: string, attachmentId: string): string => {
  const base =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : process.env.NEXT_PUBLIC_API_URL ?? '';
  return `${base}/api/v1/proposals/${proposalId}/attachments/${attachmentId}/download`;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

const proposalService = {
  createDraft,
  updateDraft,
  submitProposal,
  withdrawProposal,
  getMyProposals,
  getMyProposalForTender,
  getTenderProposals,
  getProposalDetail,
  updateProposalStatus,
  toggleShortlist,
  getTenderProposalStats,
  uploadAttachments,
  deleteAttachment,
  getDownloadUrl,
};

export default proposalService;