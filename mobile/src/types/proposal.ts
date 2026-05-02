// ─────────────────────────────────────────────────────────────────────────────
// src/types/proposal.ts
// Banana Mobile App — Module 6B: Proposals
// Single source of truth for all proposal-related TypeScript interfaces.
// Derived from:
//   • server/src/models/Proposal.js   (MilestoneSchema, AttachmentSchema, etc.)
//   • frontend/src/services/proposalService.ts (type contracts)
// ─────────────────────────────────────────────────────────────────────────────

// ─── Primitive enums ──────────────────────────────────────────────────────────

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

export type ProposalAttachmentType = 'cv' | 'portfolio' | 'sample' | 'other';

// ─── Sub-document types ───────────────────────────────────────────────────────

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
  attachmentType: ProposalAttachmentType;
  uploadedAt: string;
  description?: string;
}

export interface ProposalDeliveryTime {
  value: number;
  unit: ProposalDurationUnit;
}

export interface ProposalAuditEntry {
  action: string;
  performedBy: string;
  performedAt: string;
  changes?: Record<string, unknown>;
  note?: string;
}

// ─── Populated sub-documents (from server population) ────────────────────────

export interface ProposalUser {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
  location?: string;
  skills?: string[];
}

export interface ProposalFreelancerProfile {
  _id: string;
  headline?: string;
  bio?: string;
  hourlyRate?: number;
  specialization?: string[];
  experienceLevel?: string;
  ratings?: {
    average: number;
    count: number;
    breakdown?: {
      communication: number;
      quality: number;
      deadlines: number;
      professionalism: number;
    };
  };
  successRate?: number;
  onTimeDelivery?: number;
  responseRate?: number;
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    credentialUrl?: string;
  }>;
  services?: Array<{
    title: string;
    description?: string;
    price?: number;
    deliveryTime?: number;
  }>;
  socialLinks?: Record<string, string>;
  badges?: Array<{
    name: string;
    icon?: string;
    earnedAt?: string;
  }>;
  totalEarnings?: number;
  profileViews?: number;
}

export interface ProposalTender {
  _id: string;
  title: string;
  description?: string;
  status: string;
  deadline: string;
  skillsRequired?: string[];
  procurementCategory?: string;
  owner: string | ProposalUser;
  ownerEntity?: string | { _id: string; name: string; logo?: string };
  ownerEntityModel?: string;
  details?: {
    budget?: { min: number; max: number; currency: string };
    engagementType?: string;
    screeningQuestions?: TenderScreeningQuestion[];
    experienceLevel?: string;
    projectType?: string;
  };
}

export interface TenderScreeningQuestion {
  question: string;
  required: boolean;
}

// ─── Full Proposal document ───────────────────────────────────────────────────

export interface Proposal {
  _id: string;
  id: string; // virtual alias

  // Core references (may be populated)
  tender: string | ProposalTender;
  freelancer: string | ProposalUser;
  freelancerProfile?: string | ProposalFreelancerProfile;

  // Content
  coverLetter: string;
  coverLetterHtml?: string;
  proposalPlan?: string;
  portfolioLinks?: string[];

  // Bid & pricing
  bidType: BidType;
  proposedAmount: number;
  currency: ProposalCurrency;
  hourlyRate?: number;
  estimatedWeeklyHours?: number;

  // Timeline
  deliveryTime: ProposalDeliveryTime;
  availability: ProposalAvailability;
  proposedStartDate?: string;

  // Optional sections
  milestones: ProposalMilestone[];
  screeningAnswers: ProposalScreeningAnswer[];
  attachments: ProposalAttachment[];

  // Status
  status: ProposalStatus;
  isDraft: boolean;

  // Timestamps (ISO strings from server)
  submittedAt?: string;
  reviewedAt?: string;
  shortlistedAt?: string;
  awardedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
  createdAt: string;
  updatedAt: string;

  // Owner interaction
  ownerNotes?: string;
  ownerRating?: number;
  isShortlisted: boolean;
  interviewDate?: string;
  interviewNotes?: string;
  contractId?: string;

  // Analytics
  isBoosted: boolean;
  boostedUntil?: string;
  viewCount: number;
  ownerViewCount: number;
  similarityScore?: number;

  // Audit
  auditLog?: ProposalAuditEntry[];

  // Virtuals from server
  isExpired?: boolean;
  canBeWithdrawn?: boolean;
  milestonesTotal?: number;
}

/**
 * Lightweight version of Proposal for list views.
 * Omits heavy fields: attachments, auditLog, ownerNotes, coverLetterHtml.
 */
export type ProposalListItem = Omit<
  Proposal,
  'attachments' | 'auditLog' | 'ownerNotes' | 'coverLetterHtml'
>;

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface ProposalPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Stats (company aggregate) ────────────────────────────────────────────────

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

// ─── Request DTOs ─────────────────────────────────────────────────────────────

/**
 * Payload for POST /proposals/create
 * tenderId is always required; everything else is optional for draft creation.
 */
export interface CreateProposalData {
  tenderId: string;
  coverLetter?: string;
  coverLetterHtml?: string;
  proposalPlan?: string;
  bidType?: BidType;
  proposedAmount?: number;
  currency?: ProposalCurrency;
  hourlyRate?: number;
  estimatedWeeklyHours?: number;
  deliveryTime?: ProposalDeliveryTime;
  availability?: ProposalAvailability;
  proposedStartDate?: string;
  milestones?: ProposalMilestone[];
  screeningAnswers?: ProposalScreeningAnswer[];
  portfolioLinks?: string[];
}

/**
 * Payload for PUT /proposals/:id  (update draft).
 * All fields are optional — patch-style update.
 */
export type UpdateProposalData = Partial<Omit<CreateProposalData, 'tenderId'>>;

/**
 * Query params for GET /proposals/my-proposals  and  GET /proposals/tenders/:id/proposals
 */
export interface ProposalFilters {
  status?: ProposalStatus | 'all';
  sortBy?: ProposalSortBy;
  page?: number;
  limit?: number;
  isShortlisted?: boolean;
}

export type ProposalSortBy =
  | 'newest'
  | 'highest_bid'
  | 'lowest_bid'
  | 'best_rating';

/**
 * Payload for PATCH /proposals/:id/status
 */
export interface UpdateProposalStatusData {
  status: ProposalStatus;
  ownerNotes?: string;
  interviewDate?: string;
  interviewNotes?: string;
}

// ─── Response wrappers ────────────────────────────────────────────────────────

export interface ProposalListResponse {
  proposals: ProposalListItem[];
  pagination: ProposalPagination;
}

export interface UploadAttachmentResponse {
  attachments: ProposalAttachment[];
}

// ─── Helper type-guards ───────────────────────────────────────────────────────

/** Narrow a populated-or-string tender to its ID string */
export const getTenderId = (tender: string | ProposalTender): string =>
  typeof tender === 'string' ? tender : tender._id;

/** Narrow a populated-or-string freelancer to its ID string */
export const getFreelancerId = (fl: string | ProposalUser): string =>
  typeof fl === 'string' ? fl : fl._id;

/** True if the proposal is in a state that allows withdrawal */
export const canWithdraw = (status: ProposalStatus): boolean =>
  status === 'submitted' || status === 'under_review';

/** True if the proposal is a live (non-terminal) submission */
export const isActiveProposal = (status: ProposalStatus): boolean =>
  ['submitted', 'under_review', 'shortlisted', 'interview_scheduled'].includes(status);
