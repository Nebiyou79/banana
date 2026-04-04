/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types/tender.types.ts
import { CloudinaryImage } from '@/services/profileService';

// ========== SHARED TYPES ==========

export interface TenderPagination {
  page: number;
  limit: number;
  total: number;
  pages: number; // backend uses "pages"
  totalPages?: number; // legacy alias
}

export interface TenderOwner {
  _id: string;
  name: string;
  email: string;
}

export interface TenderOwnerEntity {
  _id: string;
  name: string;
  logo?: CloudinaryImage;
  headline?: string;
}

export interface TenderAttachment {
  fileUrl: any;
  _id: string;
  originalName: string;
  fileName: string;
  size: number;
  mimetype: string;
  path: string;
  url: string;
  downloadUrl: string;
  description?: string;
  documentType: string;
  uploadedBy: string;
  uploadedAt: string;
  fileHash: string;
  version: number;
}

export interface TenderAuditLog {
  action: string;
  performedBy: string;
  changes: any;
  performedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// ========== FREELANCE TENDER TYPES ==========

export type FreelanceEngagementType = 'fixed_price' | 'hourly';
export type FreelanceExperienceLevel = 'entry' | 'intermediate' | 'expert';
export type FreelanceProjectType = 'one_time' | 'ongoing' | 'complex';
export type FreelanceUrgency = 'normal' | 'urgent';
export type FreelanceTenderStatus = 'draft' | 'published' | 'closed';
export type ApplicationStatus = 'submitted' | 'under_review' | 'shortlisted' | 'awarded' | 'rejected';

export interface FreelanceTenderDetails {
  engagementType: FreelanceEngagementType;
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  weeklyHours?: number;
  estimatedDuration?: {
    value: number;
    unit: 'hours' | 'days' | 'weeks' | 'months';
  };
  experienceLevel?: FreelanceExperienceLevel;
  numberOfPositions?: number;
  projectType?: FreelanceProjectType;
  portfolioRequired?: boolean;
  ndaRequired?: boolean;
  urgency?: FreelanceUrgency;
  languagePreference?: string;
  screeningQuestions?: Array<{
    question: string;
    required: boolean;
  }>;
  industry?: string;
}

export interface FreelanceTenderApplication {
  _id: string;
  applicant: string | TenderOwner;
  applicantProfile?: any; // Extended profile if populated
  coverLetter: string;
  proposedRate: number;
  proposedRateCurrency: string;
  estimatedTimeline?: {
    value: number;
    unit: string;
  };
  portfolioLinks?: string[];
  cvPath?: string;
  cvFileName?: string;
  cvOriginalName?: string;
  screeningAnswers?: Array<{
    questionIndex: number;
    answer: string;
  }>;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  ownerNotes?: string;
}

export interface FreelanceTender {
  _id: string;
  tenderId?: string;
  title: string;
  description: string;
  procurementCategory: string;
  skillsRequired: string[];
  status: FreelanceTenderStatus;
  owner: TenderOwner | string;
  ownerRole: 'company' | 'organization';
  ownerEntity: TenderOwnerEntity | string;
  ownerEntityModel: 'Company' | 'Organization';
  details: FreelanceTenderDetails;
  visibility: 'freelancers_only';
  deadline: string;
  publishedAt?: string;
  closedAt?: string;
  applications: FreelanceTenderApplication[];
  attachments: TenderAttachment[];
  metadata: {
    views: number;
    savedBy: string[];
    totalApplications: number;
    daysRemaining: number;
    updateCount: number;
    lastUpdatedAt?: string;
    lastUpdatedBy?: string;
  };
  auditLog: TenderAuditLog[];
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type FreelanceTenderListItem = Omit<FreelanceTender, 'applications'>;

export interface CreateFreelanceTenderData {
  title: string;
  description: string;
  procurementCategory: string;
  deadline: string;
  details: FreelanceTenderDetails;
  skillsRequired?: string[];
  status?: 'draft' | 'published';
  documentType?: string;
}

export type UpdateFreelanceTenderData = Partial<CreateFreelanceTenderData>;

export interface FreelanceTenderFilters {
  search?: string;
  procurementCategory?: string;
  engagementType?: FreelanceEngagementType;
  minBudget?: number;
  maxBudget?: number;
  experienceLevel?: FreelanceExperienceLevel;
  urgency?: FreelanceUrgency;
  projectType?: FreelanceProjectType;
  skills?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SubmitApplicationData {
  coverLetter: string;
  proposedRate: number;
  proposedRateCurrency?: string;
  estimatedTimeline?: string | { value: number; unit: string };
  portfolioLinks?: string[] | string;
  screeningAnswers?: Array<{ questionIndex: number; answer: string }> | string;
}

export interface FreelanceTenderStats {
  applicationCount: number;
  viewCount: number;
  totalApplications: number;
  byStatus: Record<ApplicationStatus, number>;
  views: number;
  savedCount: number;
  engagementType: FreelanceEngagementType;
  status: FreelanceTenderStatus;
  deadline: string;
  daysRemaining: number;
  publishedAt?: string;
  createdAt: string;
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  weeklyHours?: number;
  averageProposedRate?: number;
  minProposedRate?: number;
  maxProposedRate?: number;
}

// ========== PROFESSIONAL TENDER TYPES ==========

export type ProfessionalTenderType = 'works' | 'goods' | 'services' | 'consultancy';
export type ProfessionalWorkflowType = 'open' | 'closed';
export type ProfessionalVisibilityType = 'public' | 'invite_only';
export type ProfessionalTenderStatus =
  | 'draft'
  | 'published'
  | 'locked'
  | 'deadline_reached'
  | 'revealed'
  | 'closed'
  | 'cancelled';
export type ProcurementMethod =
  | 'open_tender'
  | 'restricted'
  | 'restricted_tender'
  | 'sealed_bid'
  | 'direct'
  | 'framework'
  | 'negotiated';
export type EvaluationMethod = 'technical_only' | 'financial_only' | 'combined';
export type CPOStatus = 'submitted' | 'verified' | 'rejected' | 'expired';
export type BidStatus = 'submitted' | 'under_review' | 'shortlisted' | 'awarded' | 'rejected';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type InvitationType = 'user' | 'company' | 'email';

export interface ProfessionalTenderProcurement {
  bidSecurityRequired: boolean;
  estimatedValue: any;
  currency: string;
  bidValidityPeriod: any;
  procuringEntity: string;
  procurementMethod: ProcurementMethod;
  fundingSource?: string;
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  bidSecurityAmount?: number;
  bidSecurityCurrency?: string;
}

export interface ProfessionalTenderEligibility {
  minimumExperience?: number;
  requiredCertifications?: string[];
  legalRegistrationRequired?: boolean;
  financialCapacity?: {
    minAnnualTurnover?: number;
    currency?: string;
  };
  pastProjectReferences?: {
    minCount?: number;
    similarValueProjects?: boolean;
  };
  geographicPresence?: string;
}

export interface ProfessionalTenderScope {
  projectObjectives?: string;
  deliverables?: Array<{
    title: string;
    description?: string;
    deadline?: string;
  }>;
  milestones?: Array<{
    title: string;
    description?: string;
    dueDate?: string;
    paymentPercentage?: number;
  }>;
  timeline?: {
    startDate?: string;
    endDate?: string;
    duration?: {
      value: number;
      unit: 'days' | 'weeks' | 'months' | 'years';
    };
  };
  lotItems?: Array<{
    title: string;
    description?: string;
    quantity?: number;
    unit?: string;
    estimatedValue?: number;
  }>;
}

export interface ProfessionalTenderEvaluation {
  evaluationMethod?: EvaluationMethod;
  technicalWeight?: number;
  financialWeight?: number;
}

export interface PreBidMeeting {
  date?: string;
  location?: string;
  onlineLink?: string;
}

export interface ProfessionalTenderBidDocument {
  originalName: string;
  fileName: string;
  path: string;
  url: string;
  downloadUrl: string;
  mimetype: string;
  fileHash: string;
  documentType: 'technical_proposal' | 'financial_proposal' | 'company_profile' | 'compliance' | 'other';
}

export interface ProfessionalTenderBid {
  _id: string;
  bidder: string | TenderOwner;
  bidderCompany?: string | TenderOwnerEntity;
  bidAmount: number;
  currency: string;
  technicalProposal?: string;
  financialProposal?: string;
  documents: ProfessionalTenderBidDocument[];
  sealed: boolean;
  sealedAt?: string;
  revealedAt?: string;
  sealedHash?: string;
  status: BidStatus;
  submittedAt: string;
  reviewedAt?: string;
  ownerNotes?: string;
}

export interface ProfessionalTenderInvitation {
  _id: string;
  invitedUser?: string;
  invitedCompany?: string;
  email?: string;
  invitationType: InvitationType;
  invitationStatus: InvitationStatus;
  invitedAt: string;
  respondedAt?: string;
  invitedBy: string;
  token?: string;
  tokenExpires?: string;
}

export interface ProfessionalTenderAddendum {
  _id: string;
  title: string;
  description: string;
  issuedAt: string;
  issuedBy: string;
  newDeadline?: string;
  documentPath?: string;
  documentUrl?: string;
}

export interface ProfessionalTenderCPO {
  _id: string;
  bidder: string | TenderOwner;
  bidderCompany?: string | TenderOwnerEntity;
  cpoNumber: string;
  amount: number;
  currency: string;
  issuingBank?: string;
  issueDate?: string;
  expiryDate?: string;
  documentPath: string;
  documentUrl: string;
  documentHash: string;
  status: CPOStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  submittedAt: string;
}

export interface ProfessionalTender {
  professionalSpecific: any;
  _id: string;
  tenderId?: string;
  referenceNumber: string;
  title: string;
  description: string;
  procurementCategory: string;
  tenderType: ProfessionalTenderType;
  workflowType: ProfessionalWorkflowType;
  status: ProfessionalTenderStatus;
  visibilityType: ProfessionalVisibilityType;
  owner: string | TenderOwner;
  ownerRole: 'company' | 'organization';
  ownerEntity: string | TenderOwnerEntity;
  ownerEntityModel: 'Company' | 'Organization';
  procurement: ProfessionalTenderProcurement;
  eligibility?: ProfessionalTenderEligibility;
  scope?: ProfessionalTenderScope;
  evaluation?: ProfessionalTenderEvaluation;
  bidValidityPeriod?: number;
  clarificationDeadline?: string;
  preBidMeeting?: PreBidMeeting;
  cpoRequired?: boolean;
  cpoDescription?: string;
  cpoSubmissions: ProfessionalTenderCPO[];
  bids: ProfessionalTenderBid[];
  invitations: ProfessionalTenderInvitation[];
  addenda: ProfessionalTenderAddendum[];
  attachments: TenderAttachment[];
  deadline: string;
  bidOpeningDate?: string;
  publishedAt?: string;
  lockedAt?: string;
  deadlineReachedAt?: string;
  revealedAt?: string;
  closedAt?: string;
  cancelledAt?: string;
  metadata: {
    bidsByStatus: any;
    views: number;
    savedBy: string[];
    totalBids: number;
    sealedBids: number;
    visibleBids: number;
    daysRemaining: number;
    needsReveal: boolean;
    dataHash?: string;
    lockedBy?: string;
    revealedBy?: string;
    closedBy?: string;
    updateCount: number;
    lastUpdatedAt?: string;
    isUpdated: boolean;
  };
  auditLog: TenderAuditLog[];
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProfessionalTenderListItem = Omit<ProfessionalTender, 'bids' | 'cpoSubmissions' | 'addenda'> & {
  bidCount: number;
  sealedBidCount?: number;
  cpoCount: number;
  savedCount: number;
};

export interface CreateProfessionalTenderData {
  title: string;
  description: string;
  procurementCategory: string;
  tenderType: ProfessionalTenderType;
  workflowType: ProfessionalWorkflowType;
  deadline: string;
  referenceNumber: string;
  procurement: ProfessionalTenderProcurement | string;
  sealedBidConfirmation?: boolean | string;
  visibilityType?: ProfessionalVisibilityType;
  status?: 'draft';
  eligibility?: ProfessionalTenderEligibility | string;
  scope?: ProfessionalTenderScope | string;
  evaluation?: ProfessionalTenderEvaluation | string;
  bidValidityPeriod?: number;
  clarificationDeadline?: string;
  preBidMeeting?: PreBidMeeting | string;
  cpoRequired?: boolean;
  cpoDescription?: string;
  documentType?: string;
}

export type UpdateProfessionalTenderData = Partial<CreateProfessionalTenderData>;

export interface ProfessionalTenderFilters {
  search?: string;
  procurementCategory?: string;
  tenderType?: ProfessionalTenderType;
  workflowType?: ProfessionalWorkflowType;
  status?: ProfessionalTenderStatus;
  minBudget?: number;
  maxBudget?: number;
  cpoRequired?: boolean;
  minExperience?: number;
  visibilityType?: ProfessionalVisibilityType;
  referenceNumber?: string;
  procuringEntity?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AddendumData {
  title: string;
  description: string;
  newDeadline?: string;
  documentType?: string;
}

export interface InviteCompanyData {
  userId?: string;
  companyId?: string;
  email?: string;
  message?: string;
}

export interface CPOData {
  cpoNumber: string;
  amount: number;
  currency?: string;
  issuingBank?: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface ProfessionalTenderStats {
  totalBids: number;
  bidsByStatus: Record<BidStatus, number>;
  sealedBids: number;
  visibleBids: number;
  cpoSubmissions: {
    total: number;
    verified: number;
    rejected: number;
    pending: number;
    expired: number;
  };
  views: number;
  savedCount: number;
  invitations: {
    total: number;
    pending: number;
    accepted: number;
    declined: number;
    expired: number;
  };
  addendaCount: number;
  status: ProfessionalTenderStatus;
  workflowType: ProfessionalWorkflowType;
  deadline: string;
  daysRemaining: number;
  publishedAt?: string;
  createdAt: string;
  bidAmounts?: {
    min: number;
    max: number;
    average: number;
  };
}