/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/tenderService.ts - FIXED WITH BLOB PATTERN FOR PREVIEW
import { api } from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';
import { z } from 'zod';

// ============ TYPES ============
export type TenderCategoryType = 'freelance' | 'professional';
export type WorkflowType = 'open' | 'closed';
export type TenderStatus = 'draft' | 'published' | 'locked' | 'deadline_reached' | 'revealed' | 'closed' | 'cancelled';
export type VisibilityType = 'freelancers_only' | 'public' | 'companies_only' | 'invite_only';
export type EngagementType = 'fixed_price' | 'hourly';
export type ExperienceLevel = 'entry' | 'intermediate' | 'expert';
export type ProjectType = 'one_time' | 'ongoing' | 'complex';
export type ProcurementMethod = 'open_tender' | 'restricted' | 'direct' | 'framework';
export type EvaluationMethod = 'technical_only' | 'financial_only' | 'combined';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'ETB';
export type TimeUnit = 'hours' | 'days' | 'weeks' | 'months' | 'years';
export type ProjectTimeUnit = 'days' | 'weeks' | 'months' | 'years';

export interface TenderAttachment {
  _id: string;
  originalName: string;
  fileName: string;
  size: number;
  mimetype: string;
  path: string;          // Local file system path
  url: string;            // /uploads/tenders/filename.pdf
  downloadUrl: string;    // http://localhost:4000/uploads/download/tenders/filename.pdf
  description?: string;
  uploadedBy: string;
  uploadedAt: Date;
  documentType: string;
  version: number;
  fileHash: string;
  previousVersions?: Array<{
    originalName: string;
    fileName: string;
    path: string;
    url: string;
    downloadUrl: string;
    fileHash: string;
    version: number;
    replacedAt: Date;
  }>;
}

export interface TenderProposal {
  _id: string;
  applicant: string;
  applicantModel: 'User' | 'Company';
  applicantRole: 'freelancer' | 'company';
  bidAmount: number;
  proposalText: string;
  deliveryTime: number;
  attachments: any[];
  status: 'submitted' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  notes?: string;
  coverLetter?: string;
  portfolioLink?: string;
  sampleWork?: any[];
  cvPath?: string;
  hourlyRate?: number;
  estimatedHours?: number;
  technicalProposal?: string;
  financialProposal?: string;
  complianceDocuments?: any[];
  companyDocuments?: any[];
  sealed: boolean;
  revealedAt?: Date;
  sealedHash?: string;
  sealedAt?: Date;

  // Add CPO submission field
  cpoSubmission?: CPOSubmission;
}

export interface TenderInvitation {
  _id: string;
  invitedUser?: string;
  invitedCompany?: string;
  email?: string;
  invitationType: 'user' | 'company' | 'email';
  invitationStatus: 'pending' | 'accepted' | 'declined' | 'expired';
  invitedAt: Date;
  respondedAt?: Date;
  invitedBy: string;
  token: string;
  tokenExpires: Date;
}

// Add new interfaces for editing
export interface TenderEditDataResponse {
  success: boolean;
  data: {
    tender: Partial<Tender>;
    originalTender: Tender;
    canEdit: boolean;
    workflowType?: WorkflowType;
    status?: TenderStatus;
    restriction?: string;
  };
}

// Add interface for owned tenders response
export interface OwnedTendersResponse {
  success: boolean;
  data: Tender[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Add interface for editable check
export interface TenderEditableResponse {
  success: boolean;
  data: {
    canEdit: boolean;
    restriction?: string;
    workflowType: WorkflowType;
    status: TenderStatus;
  };
}

export interface TenderVisibility {
  visibilityType: VisibilityType;
  allowedCompanies?: string[];
  allowedUsers?: string[];
}

export interface FreelanceSpecific {
  sealedBidConfirmation: any;
  projectType: ProjectType;
  engagementType: EngagementType;
  budget?: {
    min: number;
    max: number;
    currency: Currency;
  };
  estimatedDuration: {
    value: number;
    unit: 'hours' | 'days' | 'weeks' | 'months';
  };
  weeklyHours?: number;
  experienceLevel: ExperienceLevel;
  portfolioRequired: boolean;
  languagePreference?: string;
  timezonePreference?: string;
  screeningQuestions: Array<{
    question: string;
    required: boolean;
  }>;
  ndaRequired: boolean;
  urgency: 'normal' | 'urgent';
  industry?: string;
}

export interface ProfessionalSpecific {
  referenceNumber: string;
  procuringEntity: string;
  procurementMethod: ProcurementMethod;
  fundingSource?: string;
  eligibleBidderType: 'company';
  minimumExperience: number;
  requiredCertifications: Array<{
    name: string;
    issuingAuthority: string;
  }>;
  legalRegistrationRequired: boolean;
  financialCapacity?: {
    minAnnualTurnover: number;
    currency: string;
  };
  pastProjectReferences?: {
    minCount: number;
    similarValueProjects: boolean;
  };
  projectObjectives?: string;
  deliverables: Array<{
    title: string;
    description: string;
    deadline: Date;
  }>;
  milestones: Array<{
    title: string;
    description: string;
    dueDate: Date;
    paymentPercentage: number;
  }>;
  timeline?: {
    startDate: Date;
    endDate: Date;
    duration: {
      value: number;
      unit: ProjectTimeUnit;
    };
  };
  evaluationMethod: EvaluationMethod;
  evaluationCriteria: {
    technicalWeight: number;
    financialWeight: number;
  };
  bidValidityPeriod: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  clarificationDeadline?: Date;
  preBidMeeting?: {
    date: Date;
    location: string;
    onlineLink: string;
  };
  sealedBidConfirmation: boolean;
  sealedDataHash?: string;
  sealedAt?: Date;

  // Add CPO fields
  cpoRequired: boolean;
  cpoDescription?: string;
  cpoSubmissions?: CPOSubmission[];
}

// Add CPO submission type
export interface CPOSubmission {
  bidder: string;
  bidderModel: 'Company';
  cpoNumber: string;
  issuingBank: string;
  issueDate: Date;
  expiryDate: Date;
  amount: number;
  currency: Currency;
  documentPath: string;
  filename: string;
  originalName: string;
  fileHash: string;
  status: 'submitted' | 'verified' | 'rejected' | 'expired';
  submittedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationNotes?: string;
}

// Add CPO Stats type
export interface CPOStats {
  required: boolean;
  submissionsCount: number;
  verifiedCount: number;
  pendingCount: number;
}

// Update TenderStats to include CPO stats
export interface TenderStats {
  basic: {
    views: number;
    savedCount: number;
    daysRemaining: number;
    isActive: boolean;
    isFreelance: boolean;
    isProfessional: boolean;
    workflowType: WorkflowType;
    status: TenderStatus;
    visibilityType: string;
    createdAt: Date;
    publishedAt?: Date;
    deadline: Date;
  };
  applications: {
    totalApplications: number;
    visibleApplications: number;
    submitted: number;
    underReview: number;
    shortlisted: number;
    accepted: number;
    rejected: number;
    sealed: number;
    revealed: number;
  };
  invitations: {
    totalInvited: number;
    accepted: number;
    pending: number;
    declined: number;
    expired: number;
  };
  engagement: {
    updateCount: number;
    lastUpdatedAt?: Date;
    lastUpdatedBy?: string;
  };
  cpo?: CPOStats;
  financial?: {
    budgetRange?: {
      min: number;
      max: number;
      currency: Currency;
    };
    engagementType?: EngagementType;
    averageBid?: number;
  };
  procurement?: {
    referenceNumber?: string;
    procuringEntity?: string;
    evaluationMethod?: EvaluationMethod;
    financialCapacityRequired?: boolean;
  };
}

export interface Tender {
  procurementMethod: string;
  _id: string;
  tenderId?: string;
  title: string;
  description: string;
  tenderCategory: TenderCategoryType;
  workflowType: WorkflowType;
  status: TenderStatus;
  visibility: TenderVisibility;
  owner: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
    role: string;
  };
  ownerRole: 'organization' | 'company';
  ownerEntity: {
    email: any;
    _id: string;
    name: string;
    logo?: string;
    industry?: string;
    verified?: boolean;
    description?: string;
    website?: string;
  };
  procurementCategory: string;
  skillsRequired: string[];
  attachments: TenderAttachment[];
  maxFileSize: number;
  maxFileCount: number;
  deadline: Date;
  publishedAt?: Date;
  lockedAt?: Date;
  deadlineReachedAt?: Date;
  revealedAt?: Date;
  closedAt?: Date;
  cancelledAt?: Date;
  invitations: TenderInvitation[];
  proposals: TenderProposal[];
  metadata: {
    savedCount: number;
    views: number;
    savedBy: string[];
    totalApplications: number;
    visibleApplications: number;
    lastUpdatedBy?: string;
    lastUpdatedAt?: Date;
    updateCount: number;
    isUpdated: boolean;
    sealedProposals: number;
    revealedProposals: number;
    countdownVisible: boolean;
    daysRemaining: number;
    dataHash?: string;
    lockedBy?: string;
    revealedBy?: string;
    closedBy?: string;
  };
  auditLog: Array<{
    action: string;
    performedBy: string;
    performedAt: Date;
    changes: any;
    ipAddress: string;
    userAgent: string;
  }>;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  freelanceSpecific?: FreelanceSpecific;
  professionalSpecific?: ProfessionalSpecific;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFreelanceTenderData {
  // Core fields - top level
  tenderCategory: 'freelance';
  title: string;
  description: string;
  procurementCategory: string;
  deadline: string | Date;
  workflowType?: WorkflowType;
  status?: TenderCreationStatus;
  skillsRequired?: string[];
  maxFileSize?: number;
  maxFileCount?: number;
  sealedBidConfirmation?: boolean;

  // File metadata
  fileDescriptions?: string[];
  fileTypes?: string[];

  // ✅ ALL freelance fields go inside freelanceSpecific
  freelanceSpecific: {
    // Required
    engagementType: EngagementType;

    // Conditional
    budget?: {
      min: number;
      max: number;
      currency: Currency;
    };
    weeklyHours?: number;

    // Optional with defaults
    projectType?: ProjectType;
    estimatedDuration?: {
      value: number;
      unit: 'hours' | 'days' | 'weeks' | 'months';
    };
    experienceLevel?: ExperienceLevel;
    portfolioRequired?: boolean;
    languagePreference?: string;
    timezonePreference?: string;
    screeningQuestions?: Array<{
      question: string;
      required: boolean;
    }>;
    ndaRequired?: boolean;
    urgency?: 'normal' | 'urgent';
    industry?: string;
  };
}

export interface CreateProfessionalTenderData {
  tenderCategory: 'professional';
  title: string;
  description: string;
  procurementCategory: string;
  deadline: string | Date;
  referenceNumber: string;
  procuringEntity: string;
  procurementMethod?: ProcurementMethod;
  fundingSource?: string;
  skillsRequired?: string[];
  minimumExperience?: number;
  requiredCertifications?: Array<{
    name: string;
    issuingAuthority: string;
  }>;
  legalRegistrationRequired?: boolean;
  financialCapacity?: {
    minAnnualTurnover: number;
    currency: string;
  };
  pastProjectReferences?: {
    minCount: number;
    similarValueProjects: boolean;
  };
  projectObjectives?: string;
  deliverables?: Array<{
    title: string;
    description: string;
    deadline: string | Date;
  }>;
  milestones?: Array<{
    title: string;
    description: string;
    dueDate: string | Date;
    paymentPercentage: number;
  }>;
  timeline?: {
    startDate: string | Date;
    endDate: string | Date;
    duration: {
      value: number;
      unit: ProjectTimeUnit;
    };
  };
  evaluationMethod?: EvaluationMethod;
  evaluationCriteria?: {
    technicalWeight: number;
    financialWeight: number;
  };
  bidValidityPeriod?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  clarificationDeadline?: string | Date;
  preBidMeeting?: {
    date: string | Date;
    location: string;
    onlineLink: string;
  };
  workflowType?: WorkflowType;

  // FIX: Update status to match TenderStatus but restrict to allowed values for creation
  status?: TenderCreationStatus; // Change from 'draft' | 'published' | undefined

  visibilityType?: VisibilityType;
  allowedCompanies?: string[];
  allowedUsers?: string[];
  sealedBidConfirmation?: boolean;
  maxFileSize?: number;
  maxFileCount?: number;
  fileDescriptions?: string[];
  fileTypes?: string[];

  // Add CPO fields - AT TOP LEVEL
  cpoRequired?: boolean;
  cpoDescription?: string;
}
// Add these interfaces to your tenderService.ts file, right after the TenderFilter interface

// Professional Tender Filter (extends TenderFilter with professional-specific fields)
export interface ProfessionalTenderFilter extends TenderFilter {
  procuringEntity?: string;
  referenceNumber?: string;
  minExperience?: number;
  requiredCertifications?: string[];
  evaluationMethod?: EvaluationMethod;
  fundingSource?: string;
  bidValidityDays?: number;
  hasMilestones?: boolean;
  hasDeliverables?: boolean;
  clarificationDeadlineFrom?: string;
  clarificationDeadlineTo?: string;
}

// Freelance Tender Filter (extends TenderFilter with freelance-specific fields)
export interface FreelanceTenderFilter extends TenderFilter {
  engagementType?: EngagementType;
  minBudget?: number;
  maxBudget?: number;
  currency?: Currency;
  experienceLevel?: ExperienceLevel | ExperienceLevel[];
  projectType?: ProjectType | ProjectType[];
  skills?: string[];
  urgency?: 'normal' | 'urgent';
  estimatedDurationMin?: number;
  estimatedDurationMax?: number;
  estimatedDurationUnit?: 'hours' | 'days' | 'weeks' | 'months';
  weeklyHoursMin?: number;
  weeklyHoursMax?: number;
  languagePreference?: string;
  timezonePreference?: string;
  ndaRequired?: boolean;
  portfolioRequired?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// Update your existing TenderFilter interface to include all possible fields
export interface TenderFilter {
  // Pagination
  page?: number;
  limit?: number;

  // Core filters
  tenderCategory?: TenderCategoryType | 'all';
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';

  // Common filters
  workflowType?: WorkflowType | 'all';
  visibilityType?: string;
  procurementCategory?: string;
  skills?: string | string[];
  dateFrom?: string;
  dateTo?: string;

  // Professional-specific fields
  cpoRequired?: boolean;
  procurementMethod?: string;
  minBudget?: number;
  maxBudget?: number;
  minExperience?: number;
  requiredCertifications?: string[];
  evaluationMethod?: EvaluationMethod;
  procuringEntity?: string;
  referenceNumber?: string;
  fundingSource?: string;
  bidValidityDays?: number;
  hasMilestones?: boolean;
  hasDeliverables?: boolean;
  clarificationDeadlineFrom?: string;
  clarificationDeadlineTo?: string;

  // Freelance-specific fields
  engagementType?: EngagementType;
  currency?: Currency;
  experienceLevel?: ExperienceLevel | ExperienceLevel[];
  projectType?: ProjectType | ProjectType[];
  urgency?: 'normal' | 'urgent';
  estimatedDurationMin?: number;
  estimatedDurationMax?: number;
  estimatedDurationUnit?: 'hours' | 'days' | 'weeks' | 'months';
  weeklyHoursMin?: number;
  weeklyHoursMax?: number;
  languagePreference?: string;
  timezonePreference?: string;
  ndaRequired?: boolean;
  portfolioRequired?: boolean;
  location?: string;
}
// Add this type for creation status (only draft or published allowed when creating)
export type TenderCreationStatus = 'draft' | 'published';
export interface ProfessionalTenderFilter extends TenderFilter {
  procuringEntity?: string;
  referenceNumber?: string;
  minExperience?: number;
  requiredCertifications?: string[];
  evaluationMethod?: EvaluationMethod;
  fundingSource?: string;
  bidValidityPeriod?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  clarificationDeadline?: string;
  preBidMeeting?: boolean;
  hasMilestones?: boolean;
  hasDeliverables?: boolean;
}
export interface TenderFilter {
  cpoRequired?: boolean;
  procurementMethod?: string;
  page?: number;
  limit?: number;
  tenderCategory?: TenderCategoryType | 'all';
  workflowType?: WorkflowType | 'all';
  visibilityType?: string;
  procurementCategory?: string;
  minBudget?: number;
  maxBudget?: number;
  skills?: string | string[];
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  engagementType?: EngagementType;
  experienceLevel?: ExperienceLevel | ExperienceLevel[];
  projectType?: ProjectType | ProjectType[];
  dateFrom?: string;
  dateTo?: string;
  // urgency?: string;
  location?: string;
  procuringEntity?: string;
  referenceNumber?: string;
  minExperience?: number;
  requiredCertifications?: string[];
  evaluationMethod?: EvaluationMethod;
  fundingSource?: string;
  bidValidityDays?: number;
  hasMilestones?: boolean;
  hasDeliverables?: boolean;
  clarificationDeadlineFrom?: string;
  clarificationDeadlineTo?: string;
  ndaRequired?: boolean;
  portfolioRequired?: boolean;
  languagePreference?: string;
  timezonePreference?: string;
  estimatedDurationMin?: number;
  estimatedDurationMax?: number;
  estimatedDurationUnit?: 'hours' | 'days' | 'weeks' | 'months';
  weeklyHoursMin?: number;
  weeklyHoursMax?: number;
  currency?: Currency;
}

export interface CategoryGroup {
  name: string;
  subcategories: Array<{
    id: string;
    name: string;
  }>;
}

export interface CategoriesResponse {
  groups?: {
    [key: string]: CategoryGroup;
  };
  freelance?: {
    [key: string]: CategoryGroup;
  };
  professional?: {
    [key: string]: CategoryGroup;
  };
  allCategories?: string[];
  stats?: {
    totalCategories?: number;
    groups?: number;
    freelance?: {
      totalCategories: number;
      groups: number;
    };
    professional?: {
      totalCategories: number;
      groups: number;
    };
  };
}

export interface TendersResponse {
  success: boolean;
  data: Tender[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SingleTenderResponse {
  success: boolean;
  data: {
    tender: Tender;
    canViewProposals: boolean;
    isOwner?: boolean;
    canEdit?: boolean;
    attachmentsCount?: number;
  };
}

// ============ CONSTANTS ============
export const TENDER_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-800' },
  { value: 'locked', label: 'Locked', color: 'bg-blue-100 text-blue-800' },
  { value: 'deadline_reached', label: 'Deadline Reached', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'revealed', label: 'Revealed', color: 'bg-purple-100 text-purple-800' },
  { value: 'closed', label: 'Closed', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
] as const;

export const WORKFLOW_TYPES = [
  { value: 'open', label: 'Open Tender', description: 'Proposals visible immediately' },
  { value: 'closed', label: 'Sealed Bid', description: 'Proposals sealed until deadline' },
] as const;

export const VISIBILITY_TYPES = [
  { value: 'freelancers_only', label: 'Freelancers Only' },
  { value: 'public', label: 'Public' },
  { value: 'companies_only', label: 'Companies Only' },
  { value: 'invite_only', label: 'Invite Only' },
] as const;

export const ENGAGEMENT_TYPES = [
  { value: 'fixed_price', label: 'Fixed Price' },
  { value: 'hourly', label: 'Hourly' },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
] as const;

export const PROJECT_TYPES = [
  { value: 'one_time', label: 'One-time Project' },
  { value: 'ongoing', label: 'Ongoing Work' },
  { value: 'complex', label: 'Complex Project' },
] as const;

export const PROCUREMENT_METHODS = [
  { value: 'open_tender', label: 'Open Tender' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'direct', label: 'Direct' },
  { value: 'framework', label: 'Framework Agreement' },
] as const;

export const EVALUATION_METHODS = [
  { value: 'technical_only', label: 'Technical Only' },
  { value: 'financial_only', label: 'Financial Only' },
  { value: 'combined', label: 'Combined' },
] as const;

export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar' },
  { value: 'EUR', label: 'Euro' },
  { value: 'GBP', label: 'British Pound' },
  { value: 'ETB', label: 'Ethiopian Birr' },
] as const;

export const TIME_UNITS = [
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
] as const;

export const DOCUMENT_TYPES = [
  'terms_of_reference',
  'technical_specifications',
  'statement_of_work',
  'drawings',
  'bill_of_quantities',
  'compliance_template',
  'reference_designs',
  'nda',
  'design_references',
  'sample_data',
  'brand_guidelines',
  'wireframes',
  'other'
] as const;

export const FILE_UPLOAD_CONSTRAINTS = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFileCount: 20,
  allowedTypes: [
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
  ]
};

export const DEFAULT_TENDER_SETTINGS = {
  freelance: {
    maxFileSize: 50 * 1024 * 1024,
    maxFileCount: 10,
    defaultExperienceLevel: 'intermediate' as ExperienceLevel,
    defaultProjectType: 'one_time' as ProjectType,
  },
  professional: {
    maxFileSize: 50 * 1024 * 1024,
    maxFileCount: 20,
    defaultEvaluationMethod: 'combined' as EvaluationMethod,
    defaultEvaluationCriteria: { technicalWeight: 70, financialWeight: 30 },
    defaultBidValidityPeriod: { value: 30, unit: 'days' as const },
  }
};

// ============ UTILITIES ============
export const isTenderActive = (tender: Tender): boolean => {
  return tender.status === 'published' && new Date(tender.deadline) > new Date();
};

export const canEditTender = (tender: Tender, userId: string): boolean => {
  if (tender.status === 'draft') return true;
  if (tender.status === 'published') {
    return tender.workflowType === 'open';
  }
  return false;
};

export const canViewProposals = (tender: Tender): boolean => {
  if (tender.status === 'draft') return false;
  if (tender.workflowType === 'open') return true;
  if (tender.workflowType === 'closed') {
    return tender.status === 'revealed' || tender.status === 'closed';
  }
  return false;
};

export const formatDeadline = (deadline: Date | string): string => {
  const date = new Date(deadline);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `${diffDays} days`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const getStatusColor = (status: TenderStatus): string => {
  const colors: Record<TenderStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    locked: 'bg-blue-100 text-blue-800',
    deadline_reached: 'bg-yellow-100 text-yellow-800',
    revealed: 'bg-purple-100 text-purple-800',
    closed: 'bg-indigo-100 text-indigo-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  return colors[status];
};

export const calculateProgress = (tender: Tender): number => {
  const now = new Date();
  const created = new Date(tender.createdAt);
  const deadline = new Date(tender.deadline);

  const total = deadline.getTime() - created.getTime();
  const elapsed = now.getTime() - created.getTime();

  if (elapsed <= 0) return 0;
  if (elapsed >= total) return 100;

  return Math.round((elapsed / total) * 100);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Add to UTILITIES section in tenderService.ts
export const getOwnerNavigationPath = (
  tender: Tender,
  basePath: 'dashboard/company/tenders/my-tenders' | 'dashboard/organization/tenders'
): string => {
  return `/${basePath}/${tender._id}`;
};

export const getEditRestrictionReason = (tender: Tender): string | null => {
  if (tender.status === 'draft') return null;

  if (tender.status === 'published' && tender.workflowType === 'closed') {
    return "Closed workflow tenders cannot be edited after publishing (sealed bids)";
  }

  if (['locked', 'deadline_reached', 'revealed', 'closed', 'cancelled'].includes(tender.status)) {
    return `Tender is ${tender.status.replace('_', ' ')} - cannot edit`;
  }

  return null;
};

export const canEditBasedOnWorkflow = (tender: Tender): boolean => {
  if (tender.status === 'draft') return true;
  if (tender.status === 'published') {
    return tender.workflowType === 'open';
  }
  return false;
};

// ============ LOCAL FILE UTILITIES ============
export const getLocalDownloadUrl = (attachment: TenderAttachment): string => {
  // Use the downloadUrl provided by the backend
  return attachment.downloadUrl || `${api.defaults.baseURL}${attachment.url}`;
};

export const getLocalPreviewUrl = (attachment: TenderAttachment): string => {
  // For preview, we need to use the API endpoint with token
  const token = localStorage.getItem('token');
  return `${api.defaults.baseURL}/tender/${attachment._id}/preview?token=${token}`;
};

export interface ViewMode {
  type: 'grid' | 'list';
  cardSize?: 'small' | 'medium' | 'large';
}

export const DEFAULT_VIEW_SETTINGS = {
  freelance: {
    defaultView: 'grid' as 'grid' | 'list',
    gridColumns: { small: 1, medium: 2, large: 3 },
    cardSizes: ['small', 'medium', 'large'] as const,
  },
  professional: {
    defaultView: 'list' as 'grid' | 'list',
    gridColumns: { small: 1, medium: 2, large: 3 },
    cardSizes: ['small', 'medium', 'large'] as const,
  }
};

// Add view mode utilities
export const getViewModeFromStorage = (tenderType: TenderCategoryType): ViewMode => {
  if (typeof window === 'undefined') {
    return {
      type: DEFAULT_VIEW_SETTINGS[tenderType].defaultView,
      cardSize: 'medium'
    };
  }

  const saved = localStorage.getItem(`tender_view_${tenderType}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fallback to default
    }
  }

  return {
    type: DEFAULT_VIEW_SETTINGS[tenderType].defaultView,
    cardSize: 'medium'
  };
};

export const saveViewModeToStorage = (tenderType: TenderCategoryType, viewMode: ViewMode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`tender_view_${tenderType}`, JSON.stringify(viewMode));
  }
};

// Add tender sorting utilities
export const sortTenders = (
  tenders: Tender[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Tender[] => {
  const sorted = [...tenders];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'deadline':
        aValue = new Date(a.deadline).getTime();
        bValue = new Date(b.deadline).getTime();
        break;
      case 'budget':
        aValue = a.freelanceSpecific?.budget?.max || a.professionalSpecific?.financialCapacity?.minAnnualTurnover || 0;
        bValue = b.freelanceSpecific?.budget?.max || b.professionalSpecific?.financialCapacity?.minAnnualTurnover || 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'views':
        aValue = a.metadata?.views || 0;
        bValue = b.metadata?.views || 0;
        break;
      default:
        aValue = 0;
        bValue = 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return sorted;
};

// Add tender grouping utilities
export const groupTendersByCategory = (tenders: Tender[]): Record<string, Tender[]> => {
  return tenders.reduce((groups, tender) => {
    const category = tender.procurementCategory || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(tender);
    return groups;
  }, {} as Record<string, Tender[]>);
};

export const groupTendersByDate = (tenders: Tender[]): {
  today: Tender[];
  thisWeek: Tender[];
  thisMonth: Tender[];
  older: Tender[];
} => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  return {
    today: tenders.filter(t => new Date(t.deadline) >= today),
    thisWeek: tenders.filter(t => new Date(t.deadline) >= weekAgo && new Date(t.deadline) < today),
    thisMonth: tenders.filter(t => new Date(t.deadline) >= monthAgo && new Date(t.deadline) < weekAgo),
    older: tenders.filter(t => new Date(t.deadline) < monthAgo),
  };
};

// ============ VALIDATION SCHEMAS ============
const baseTenderSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(20000, 'Description cannot exceed 20000 characters'),
  procurementCategory: z.string().min(1, 'Category is required'),
  deadline: z.string().refine((val) => new Date(val) > new Date(), {
    message: 'Deadline must be in the future'
  }),
  skillsRequired: z.array(z.string()).optional(),
  maxFileSize: z.number().optional(),
  maxFileCount: z.number().optional(),
});

export const freelanceTenderSchema = baseTenderSchema.extend({
  tenderCategory: z.literal('freelance'),
  workflowType: z.enum(['open', 'closed']),
  status: z.enum(['draft', 'published']),
  engagementType: z.enum(['fixed_price', 'hourly']),
  weeklyHours: z.number().optional(),
  budget: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.enum(['USD', 'EUR', 'GBP', 'ETB'])
  }).optional(),
  projectType: z.enum(['one_time', 'ongoing', 'complex']).optional(),
  estimatedDuration: z.object({
    value: z.number().min(0),
    unit: z.enum(['hours', 'days', 'weeks', 'months'])
  }).optional(),
  experienceLevel: z.enum(['entry', 'intermediate', 'expert']).optional(),
  portfolioRequired: z.boolean().optional(),
  languagePreference: z.string().optional(),
  timezonePreference: z.string().optional(),
  screeningQuestions: z.array(z.object({
    question: z.string(),
    required: z.boolean()
  })).optional(),
  ndaRequired: z.boolean().optional(),
  urgency: z.enum(['normal', 'urgent']).optional(),
  industry: z.string().optional(),
  sealedBidConfirmation: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.engagementType === 'hourly' && !data.weeklyHours) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Weekly hours is required for hourly engagements',
      path: ['weeklyHours']
    });
  }
  if (data.engagementType === 'fixed_price' && !data.budget) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Budget is required for fixed price engagements',
      path: ['budget']
    });
  }
  if (data.workflowType === 'closed' && !data.sealedBidConfirmation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Sealed bid confirmation is required for closed workflow',
      path: ['sealedBidConfirmation']
    });
  }
});

export const professionalTenderSchema = baseTenderSchema.extend({
  tenderCategory: z.literal('professional'),
  workflowType: z.enum(['open', 'closed']),
  status: z.enum(['draft', 'published']),
  visibilityType: z.enum(['freelancers_only', 'public', 'companies_only', 'invite_only']),
  referenceNumber: z.string().min(1, 'Reference number is required'),
  procuringEntity: z.string().min(1, 'Procuring entity is required'),
  procurementMethod: z.enum(['open_tender', 'restricted', 'direct', 'framework']).optional(),
  fundingSource: z.string().optional(),
  minimumExperience: z.number().min(0).optional(),
  requiredCertifications: z.array(z.object({
    name: z.string(),
    issuingAuthority: z.string()
  })).optional(),
  legalRegistrationRequired: z.boolean().optional(),
  financialCapacity: z.object({
    minAnnualTurnover: z.number().min(0),
    currency: z.string()
  }).optional(),
  pastProjectReferences: z.object({
    minCount: z.number().min(0),
    similarValueProjects: z.boolean()
  }).optional(),
  projectObjectives: z.string().optional(),
  deliverables: z.array(z.object({
    title: z.string(),
    description: z.string(),
    deadline: z.string()
  })).optional(),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string(),
    dueDate: z.string(),
    paymentPercentage: z.number().min(0).max(100)
  })).optional(),
  timeline: z.object({
    startDate: z.string(),
    endDate: z.string(),
    duration: z.object({
      value: z.number().min(0),
      unit: z.enum(['days', 'weeks', 'months', 'years'])
    })
  }).optional(),
  evaluationMethod: z.enum(['technical_only', 'financial_only', 'combined']).optional(),
  evaluationCriteria: z.object({
    technicalWeight: z.number().min(0).max(100),
    financialWeight: z.number().min(0).max(100)
  }).optional(),
  bidValidityPeriod: z.object({
    value: z.number().min(0),
    unit: z.enum(['days', 'weeks', 'months'])
  }).optional(),
  clarificationDeadline: z.string().optional(),
  preBidMeeting: z.object({
    date: z.string(),
    location: z.string(),
    onlineLink: z.string()
  }).optional(),
  allowedCompanies: z.array(z.string()).optional(),
  allowedUsers: z.array(z.string()).optional(),
  sealedBidConfirmation: z.boolean().optional(),

  // Add CPO validation
  cpoRequired: z.boolean().optional(),
  cpoDescription: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.workflowType === 'closed' && !data.sealedBidConfirmation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Sealed bid confirmation is required for closed workflow',
      path: ['sealedBidConfirmation']
    });
  }

  if (data.evaluationCriteria) {
    const { technicalWeight, financialWeight } = data.evaluationCriteria;
    if (technicalWeight + financialWeight !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Evaluation criteria weights must sum to 100%',
        path: ['evaluationCriteria']
      });
    }
  }

  // CPO validation
  if (data.cpoRequired && !data.cpoDescription) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'CPO description is required when CPO is required',
      path: ['cpoDescription']
    });
  }
});

export const invitationSchema = z.object({
  users: z.array(z.string()).optional(),
  companies: z.array(z.string()).optional(),
  emails: z.array(z.string().email()).optional(),
}).refine(data =>
  data.users?.length || data.companies?.length || data.emails?.length,
  'At least one invitation method is required'
);

// ============ SERVICE FUNCTIONS ============
export const tenderService = {
  // ============ CATEGORY MANAGEMENT ============
  async getCategories(type?: TenderCategoryType, format?: 'grouped' | 'flat'): Promise<CategoriesResponse> {
    try {
      const params: any = {};
      if (type) params.type = type;
      if (format) params.format = format;

      const response = await api.get('/tender/categories', { params });

      // Handle different response structures
      const data = response.data.data;

      // If type is specified, we get groups structure
      if (type) {
        return {
          groups: data.groups,
          allCategories: data.allCategories,
          stats: data.stats
        };
      }

      // If no type specified, we get freelance and professional structure
      return {
        freelance: data.freelance,
        professional: data.professional,
        stats: data.stats
      };
    } catch (error) {
      throw handleError(error, 'getCategories');
    }
  },

  async getCategoryLabel(categoryId: string, type?: TenderCategoryType): Promise<{ id: string; name: string; group: string; type: string }> {
    try {
      const response = await api.get(`/tender/categories/label/${categoryId}`, {
        params: { type }
      });
      return response.data.data;
    } catch (error) {
      throw handleError(error, 'getCategoryLabel');
    }
  },

  // ============ TENDER CRUD ============
  // ============ TENDER CRUD ============
  async getTenders(params?: TenderFilter): Promise<TendersResponse> {
    try {
      // Log the params being sent
      console.log('🌐 API Call - getTenders with params:', {
        ...params,
        tenderCategory: params?.tenderCategory
      });

      // Make sure tenderCategory is properly set
      const queryParams = { ...params };

      // Remove undefined values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key as keyof TenderFilter] === undefined) {
          delete queryParams[key as keyof TenderFilter];
        }
      });

      const response = await api.get('/tender', { params: queryParams });

      // Log the response
      console.log('🌐 API Response - getTenders:', {
        status: response.status,
        success: response.data?.success,
        total: response.data?.pagination?.total,
        count: response.data?.data?.length,
        firstItemCategory: response.data?.data?.[0]?.tenderCategory
      });

      return response.data;
    } catch (error) {
      console.error('❌ API Error - getTenders:', error);
      throw handleError(error, 'getTenders');
    }
  },

  async createFreelanceTender(data: CreateFreelanceTenderData, files?: File[]): Promise<{
    tender: Tender;
    attachmentsCount: number
  }> {
    try {
      const formData = new FormData();

      // ============ CORE FIELDS ============
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('procurementCategory', data.procurementCategory);
      formData.append('deadline', typeof data.deadline === 'string' ? data.deadline : data.deadline.toISOString());
      formData.append('tenderCategory', 'freelance');

      if (data.workflowType) {
        formData.append('workflowType', data.workflowType);
      }

      formData.append('status', data.status || 'draft');

      // ============ SKILLS ============
      if (data.skillsRequired && data.skillsRequired.length > 0) {
        formData.append('skillsRequired', JSON.stringify(data.skillsRequired));
      }

      // ============ FILE SETTINGS ============
      if (data.maxFileSize) {
        formData.append('maxFileSize', data.maxFileSize.toString());
      }
      if (data.maxFileCount) {
        formData.append('maxFileCount', data.maxFileCount.toString());
      }

      // ============ SEALED BID CONFIRMATION ============
      if (data.workflowType === 'closed' && data.sealedBidConfirmation) {
        formData.append('sealedBidConfirmation', 'true');
      }

      // ============ FREELANCE SPECIFIC ============
      // ALL freelance fields go inside this single object
      const freelanceSpecific: any = {
        // Required
        engagementType: data.freelanceSpecific.engagementType,

        // Optional with defaults
        projectType: data.freelanceSpecific.projectType || 'one_time',
        estimatedDuration: data.freelanceSpecific.estimatedDuration || {
          value: 30,
          unit: 'days'
        },
        experienceLevel: data.freelanceSpecific.experienceLevel || 'intermediate',
        portfolioRequired: data.freelanceSpecific.portfolioRequired || false,
        ndaRequired: data.freelanceSpecific.ndaRequired || false,
        urgency: data.freelanceSpecific.urgency || 'normal'
      };

      // Optional fields - only add if they exist
      if (data.freelanceSpecific.languagePreference) {
        freelanceSpecific.languagePreference = data.freelanceSpecific.languagePreference;
      }

      if (data.freelanceSpecific.timezonePreference) {
        freelanceSpecific.timezonePreference = data.freelanceSpecific.timezonePreference;
      }

      if (data.freelanceSpecific.industry) {
        freelanceSpecific.industry = data.freelanceSpecific.industry;
      }

      if (data.freelanceSpecific.screeningQuestions &&
        data.freelanceSpecific.screeningQuestions.length > 0) {
        freelanceSpecific.screeningQuestions = data.freelanceSpecific.screeningQuestions;
      }

      // Conditional fields based on engagement type
      if (data.freelanceSpecific.engagementType === 'fixed_price' &&
        data.freelanceSpecific.budget) {
        freelanceSpecific.budget = data.freelanceSpecific.budget;
      }

      if (data.freelanceSpecific.engagementType === 'hourly' &&
        data.freelanceSpecific.weeklyHours) {
        freelanceSpecific.weeklyHours = data.freelanceSpecific.weeklyHours;
      }

      // Stringify and append the entire freelanceSpecific object
      formData.append('freelanceSpecific', JSON.stringify(freelanceSpecific));

      // ============ FILES - USING 'documents' FIELD FOR LOCAL UPLOAD ============
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          // ✅ CRITICAL: localFileUpload expects 'documents' field name
          formData.append('documents', file);

          // File metadata - append as separate fields with same index order
          if (data.fileDescriptions && data.fileDescriptions[index]) {
            formData.append('fileDescriptions', data.fileDescriptions[index]);
          }
          if (data.fileTypes && data.fileTypes[index]) {
            formData.append('fileTypes', data.fileTypes[index]);
          }
        });

        console.log(`📎 Attached ${files.length} file(s) to 'documents' field for local upload`);
      }

      // Debug log
      console.log('📦 FormData contents for localFileUpload:', {
        title: data.title,
        tenderCategory: 'freelance',
        workflowType: data.workflowType,
        status: data.status,
        skillsCount: data.skillsRequired?.length,
        freelanceSpecificKeys: Object.keys(freelanceSpecific),
        hasFiles: files?.length || 0,
        fileFieldName: 'documents'
      });

      const response = await api.post('/tender/freelance/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });

      handleSuccess('Freelance tender created successfully');

      return {
        tender: response.data.data.tender,
        attachmentsCount: response.data.data.attachmentsCount || 0
      };

    } catch (error: any) {
      console.error('❌ Create freelance tender error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.data?.data,
        errors: error.response?.data?.errors
      });
      throw handleError(error, 'createFreelanceTender');
    }
  },

  async createProfessionalTender(data: CreateProfessionalTenderData, files?: File[]): Promise<{
    tender: Tender;
    attachmentsCount: number
  }> {
    try {
      const formData = new FormData();

      console.log('📦 [createProfessionalTender] Preparing data:', {
        title: data.title,
        referenceNumber: data.referenceNumber,
        procuringEntity: data.procuringEntity,
        hasFiles: files?.length || 0
      });

      // ============ CORE FIELDS ============
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('procurementCategory', data.procurementCategory);
      formData.append('deadline', typeof data.deadline === 'string' ? data.deadline : data.deadline.toISOString());
      formData.append('tenderCategory', 'professional');
      formData.append('workflowType', data.workflowType || 'open');
      formData.append('status', data.status || 'draft');

      // ============ PROFESSIONAL SPECIFIC FIELDS (AT TOP LEVEL) ============
      formData.append('referenceNumber', data.referenceNumber);
      formData.append('procuringEntity', data.procuringEntity);

      if (data.procurementMethod) {
        formData.append('procurementMethod', data.procurementMethod);
      }

      if (data.fundingSource) {
        formData.append('fundingSource', data.fundingSource);
      }

      // ============ VISIBILITY ============
      formData.append('visibilityType', data.visibilityType || 'public');

      // ============ SKILLS ============
      if (data.skillsRequired && data.skillsRequired.length > 0) {
        formData.append('skillsRequired', JSON.stringify(data.skillsRequired));
      }

      // ============ ELIGIBILITY CRITERIA ============
      if (data.minimumExperience !== undefined) {
        formData.append('minimumExperience', data.minimumExperience.toString());
      }

      if (data.requiredCertifications && data.requiredCertifications.length > 0) {
        formData.append('requiredCertifications', JSON.stringify(data.requiredCertifications));
      }

      if (data.legalRegistrationRequired !== undefined) {
        formData.append('legalRegistrationRequired', data.legalRegistrationRequired.toString());
      }

      if (data.financialCapacity) {
        formData.append('financialCapacity', JSON.stringify(data.financialCapacity));
      }

      if (data.pastProjectReferences) {
        formData.append('pastProjectReferences', JSON.stringify(data.pastProjectReferences));
      }

      // ============ PROJECT DETAILS ============
      if (data.projectObjectives) {
        formData.append('projectObjectives', data.projectObjectives);
      }

      if (data.deliverables && data.deliverables.length > 0) {
        formData.append('deliverables', JSON.stringify(data.deliverables));
      }

      if (data.milestones && data.milestones.length > 0) {
        formData.append('milestones', JSON.stringify(data.milestones));
      }

      if (data.timeline) {
        formData.append('timeline', JSON.stringify(data.timeline));
      }

      // ============ EVALUATION ============
      if (data.evaluationMethod) {
        formData.append('evaluationMethod', data.evaluationMethod);
      }

      if (data.evaluationCriteria) {
        formData.append('evaluationCriteria', JSON.stringify(data.evaluationCriteria));
      }

      if (data.bidValidityPeriod) {
        formData.append('bidValidityPeriod', JSON.stringify(data.bidValidityPeriod));
      }

      if (data.clarificationDeadline) {
        formData.append('clarificationDeadline',
          typeof data.clarificationDeadline === 'string'
            ? data.clarificationDeadline
            : data.clarificationDeadline.toISOString()
        );
      }

      if (data.preBidMeeting) {
        formData.append('preBidMeeting', JSON.stringify(data.preBidMeeting));
      }

      // ============ CPO FIELDS (AT TOP LEVEL) ============
      if (data.cpoRequired !== undefined) {
        formData.append('cpoRequired', data.cpoRequired.toString());
      }

      if (data.cpoDescription) {
        formData.append('cpoDescription', data.cpoDescription);
      }

      // ============ SEALED BID CONFIRMATION ============
      if (data.workflowType === 'closed' && data.sealedBidConfirmation) {
        formData.append('sealedBidConfirmation', 'true');
      }

      // ============ FILE SETTINGS ============
      if (data.maxFileSize) {
        formData.append('maxFileSize', data.maxFileSize.toString());
      }

      if (data.maxFileCount) {
        formData.append('maxFileCount', data.maxFileCount.toString());
      }

      // ============ INVITATIONS ============
      if (data.allowedCompanies && data.allowedCompanies.length > 0) {
        formData.append('allowedCompanies', JSON.stringify(data.allowedCompanies));
      }

      if (data.allowedUsers && data.allowedUsers.length > 0) {
        formData.append('allowedUsers', JSON.stringify(data.allowedUsers));
      }

      // ============ FILES - USING 'documents' FIELD FOR LOCAL UPLOAD ============
      if (files && files.length > 0) {
        // Append files with 'documents' field name (local file upload middleware)
        files.forEach((file) => {
          formData.append('documents', file);
        });

        // Append file metadata as separate fields (index-matched)
        if (data.fileDescriptions) {
          data.fileDescriptions.forEach((desc) => {
            formData.append('fileDescriptions', desc || '');
          });
        }

        if (data.fileTypes) {
          data.fileTypes.forEach((type) => {
            formData.append('fileTypes', type || 'other');
          });
        }

        console.log(`📎 Attached ${files.length} file(s) to 'documents' field`);
      }

      // Debug: Log all form data entries
      console.log('📦 FormData entries for professional tender:');
      const entries: any[] = [];
      for (const pair of (formData as any).entries()) {
        if (pair[1] instanceof File) {
          entries.push({ field: pair[0], value: `File: ${pair[1].name}` });
        } else {
          entries.push({ field: pair[0], value: pair[1].substring(0, 100) });
        }
      }
      console.table(entries);

      const response = await api.post('/tender/professional/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });

      console.log('✅ [createProfessionalTender] Success:', response.data);
      handleSuccess('Professional tender created successfully');

      return {
        tender: response.data.data.tender,
        attachmentsCount: response.data.data.attachmentsCount || 0
      };

    } catch (error: any) {
      console.error('❌ [createProfessionalTender] Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.data?.data,
        errors: error.response?.data?.errors
      });
      throw handleError(error, 'createProfessionalTender');
    }
  },

  async updateTender(id: string, data: Partial<Tender>, files?: File[]): Promise<{
    tender: Tender;
    canEdit: boolean;
    attachmentsCount: number
  }> {
    try {
      const formData = new FormData();

      // Add all data fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && !(value instanceof File)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value as string);
          }
        }
      });

      // Add files if any - use 'documents' field for local file upload
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('documents', file);
        });
      }

      const response = await api.put(`/tender/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });

      handleSuccess('Tender updated successfully');
      return {
        tender: response.data.data.tender,
        canEdit: response.data.data.canEdit,
        attachmentsCount: response.data.data.attachmentsCount || 0
      };
    } catch (error) {
      throw handleError(error, 'updateTender');
    }
  },
  // Add these methods to your tenderService object

  // Get professional tenders only
  async getProfessionalTenders(params?: TenderFilter): Promise<TendersResponse> {
    try {
      console.log('🌐 API Call - getProfessionalTenders with params:', params);

      // Clean params
      const queryParams = { ...params };
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key as keyof TenderFilter] === undefined) {
          delete queryParams[key as keyof TenderFilter];
        }
      });

      const response = await api.get('/tender/professional', { params: queryParams });

      console.log('🌐 API Response - getProfessionalTenders:', {
        status: response.status,
        total: response.data?.pagination?.total,
        count: response.data?.data?.length
      });

      return response.data;
    } catch (error) {
      console.error('❌ API Error - getProfessionalTenders:', error);
      throw handleError(error, 'getProfessionalTenders');
    }
  },

  // Get freelance tenders only
  async getFreelanceTenders(params?: TenderFilter): Promise<TendersResponse> {
    try {
      console.log('🌐 API Call - getFreelanceTenders with params:', params);

      // Clean params
      const queryParams = { ...params };
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key as keyof TenderFilter] === undefined) {
          delete queryParams[key as keyof TenderFilter];
        }
      });

      const response = await api.get('/tender/freelance', { params: queryParams });

      console.log('🌐 API Response - getFreelanceTenders:', {
        status: response.status,
        total: response.data?.pagination?.total,
        count: response.data?.data?.length
      });

      return response.data;
    } catch (error) {
      console.error('❌ API Error - getFreelanceTenders:', error);
      throw handleError(error, 'getFreelanceTenders');
    }
  },
  async deleteTender(id: string): Promise<void> {
    try {
      await api.delete(`/tender/${id}`);
      handleSuccess('Tender deleted successfully');
    } catch (error) {
      throw handleError(error, 'deleteTender');
    }
  },

  async publishTender(id: string): Promise<{ tender: Tender }> {
    try {
      const response = await api.post(`/tender/${id}/publish`);
      handleSuccess('Tender published successfully');
      return response.data.data;
    } catch (error) {
      throw handleError(error, 'publishTender');
    }
  },

  async revealProposals(id: string): Promise<{ tender: Tender }> {
    try {
      const response = await api.post(`/tender/${id}/reveal-proposals`);
      handleSuccess('Proposals revealed successfully');
      return response.data.data;
    } catch (error) {
      throw handleError(error, 'revealProposals');
    }
  },

  // ============ USER-SPECIFIC ============
  async getMyTenders(): Promise<Tender[]> {
    try {
      const response = await api.get('/tender/user/my-tenders');
      return response.data.data.tenders;
    } catch (error) {
      throw handleError(error, 'getMyTenders');
    }
  },

  async getTender(id: string, options?: { isOwner?: boolean }): Promise<SingleTenderResponse> {
    try {
      console.log('🔍 [tenderService] Fetching tender with ID:', id, 'isOwner:', options?.isOwner);

      // Use the appropriate endpoint based on isOwner flag
      const endpoint = options?.isOwner ? `/tender/owner/${id}` : `/tender/${id}`;

      console.log('🌐 [tenderService] Making request to:', endpoint);

      const response = await api.get(endpoint, {
        timeout: 10000
      });

      console.log('✅ [tenderService] Response received, status:', response.status);
      return response.data;
    } catch (error: any) {
      console.error('❌ [tenderService] Error in getTender:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // Enhance error message for 403
      if (error.response?.status === 403) {
        const errorMsg = error.response?.data?.message ||
          'Access denied. You do not have permission to view this tender.';
        throw new Error(errorMsg);
      }

      throw handleError(error, 'getTender');
    }
  },

  async getOwnerTender(id: string): Promise<{
    tender: Tender;
    canViewProposals: boolean;
    isOwner: boolean;
    canEdit: boolean;
  }> {
    try {
      console.log('🔍 [tenderService] Fetching owner tender with ID:', id);

      const response = await api.get(`/tender/owner/${id}`, {
        timeout: 10000
      });

      console.log('✅ [tenderService] Owner tender response received');
      return response.data.data;
    } catch (error: any) {
      console.error('❌ [tenderService] Error in getOwnerTender:', error);
      throw handleError(error, 'getOwnerTender');
    }
  },

  async getTenderForEditing(id: string): Promise<{
    tender: Partial<Tender>;
    originalTender: Tender;
    canEdit: boolean;
    workflowType?: WorkflowType;
    status?: TenderStatus;
    restriction?: string;
  }> {
    try {
      const response = await api.get(`/tender/${id}/edit-data`);
      return response.data.data;
    } catch (error) {
      throw handleError(error, 'getTenderForEditing');
    }
  },

  async checkTenderEditable(id: string): Promise<{
    canEdit: boolean;
    restriction?: string;
    workflowType: WorkflowType;
    status: TenderStatus;
  }> {
    try {
      const response = await api.get(`/tender/${id}/edit-data`);
      return response.data.data;
    } catch (error) {
      throw handleError(error, 'checkTenderEditable');
    }
  },

  async getOwnedTenders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    tenderCategory?: string;
    workflowType?: string;
  }): Promise<{
    tenders: Tender[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await api.get('/tender/user/owned', { params });
      return {
        tenders: response.data.data || [],
        pagination: response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
      };
    } catch (error) {
      throw handleError(error, 'getOwnedTenders');
    }
  },

  async getPublicTender(id: string): Promise<Tender> {
    console.log('🌍 [tenderService] Fetching public tender:', id);
    const response = await tenderService.getTender(id, { isOwner: false });
    return response.data.tender;
  },

  async toggleSaveTender(id: string): Promise<{ saved: boolean; savedCount: number }> {
    try {
      const response = await api.post(`/tender/${id}/toggle-save`);
      const message = response.data.data.saved
        ? 'Tender saved successfully'
        : 'Tender removed from saved list';
      handleSuccess(message);
      return response.data.data;
    } catch (error) {
      throw handleError(error, 'toggleSaveTender');
    }
  },

  async getSavedTenders(): Promise<Tender[]> {
    try {
      const response = await api.get('/tender/user/saved');
      return response.data.data.tenders;
    } catch (error) {
      throw handleError(error, 'getSavedTenders');
    }
  },

  async getTenderStats(id: string): Promise<{ stats: TenderStats }> {
    try {
      const response = await api.get(`/tender/${id}/stats`);
      return response.data.data;
    } catch (error) {
      throw handleError(error, 'getTenderStats');
    }
  },

  // ============ INVITATION MANAGEMENT ============
  async inviteUsersToTender(id: string, data: { users?: string[]; companies?: string[]; emails?: string[] }): Promise<{ stats: { users: number; companies: number; emails: number } }> {
    try {
      const response = await api.post(`/tender/${id}/invite`, data);
      handleSuccess('Invitations sent successfully');
      return response.data.data;
    } catch (error) {
      throw handleError(error, 'inviteUsersToTender');
    }
  },

  async respondToInvitation(tenderId: string, inviteId: string, status: 'accepted' | 'declined'): Promise<{ invitation: TenderInvitation; tender: { _id: string; title: string; deadline: Date } }> {
    try {
      const response = await api.post(`/tender/${tenderId}/invitations/${inviteId}/respond`, { status });
      const message = status === 'accepted'
        ? 'Invitation accepted successfully'
        : 'Invitation declined';
      handleSuccess(message);
      return response.data.data;
    } catch (error) {
      throw handleError(error, 'respondToInvitation');
    }
  },

  async getMyInvitations(): Promise<{ tenders: Tender[]; stats: { total: number } }> {
    try {
      const response = await api.get('/tender/user/invitations');
      return response.data.data;
    } catch (error) {
      throw handleError(error, 'getMyInvitations');
    }
  },

  // ============ ATTACHMENT MANAGEMENT WITH LOCAL FILE SUPPORT ============
async downloadAttachment(tenderId: string, attachmentId: string): Promise<Blob> {
  try {
    const token = localStorage.getItem('token');
    
    // No need to get user role - it's in the JWT token
    console.log('📥 Downloading attachment:', {
      tenderId,
      attachmentId,
      hasToken: !!token
    });

    // Remove the X-User-Role header
    const response = await api.get(`/tender/${tenderId}/attachments/${attachmentId}/download`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${token}`
        // Remove this line: 'X-User-Role': userRole
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Download attachment error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.message
    });
    throw handleError(error, 'downloadAttachment');
  }
},

  // FIXED: previewAttachment with blob pattern (no token in URL)
  async previewAttachment(tenderId: string, attachmentId: string): Promise<Blob> {
    try {
      console.log('👁️ Previewing attachment:', {
        tenderId,
        attachmentId
      });

      const response = await api.get(`/tender/${tenderId}/attachments/${attachmentId}/preview`, {
        responseType: 'blob',
        timeout: 60000
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Preview attachment error:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message
      });
      throw handleError(error, 'previewAttachment');
    }
  },

  async deleteAttachment(tenderId: string, attachmentId: string): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/tender/${tenderId}/attachments/${attachmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      handleSuccess('Attachment deleted successfully');
    } catch (error) {
      throw handleError(error, 'deleteAttachment');
    }
  },

  async uploadAttachments(tenderId: string, files: File[], descriptions?: string[], types?: string[]): Promise<TenderAttachment[]> {
    try {
      const formData = new FormData();
      const token = localStorage.getItem('token');

      files.forEach((file) => {
        formData.append('documents', file);
      });

      if (descriptions) {
        descriptions.forEach((desc) => {
          formData.append('descriptions', desc || '');
        });
      }

      if (types) {
        types.forEach((type) => {
          formData.append('types', type || 'other');
        });
      }

      const response = await api.post(`/tender/${tenderId}/attachments/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000
      });

      handleSuccess(`${files.length} file(s) uploaded successfully`);
      return response.data.data.attachments;
    } catch (error) {
      throw handleError(error, 'uploadAttachments');
    }
  },

  async getAttachmentInfo(tenderId: string, attachmentId: string): Promise<TenderAttachment> {
    try {
      const token = localStorage.getItem('token');
      const tenderResponse = await api.get(`/tender/${tenderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const tender = tenderResponse.data.data.tender;
      const attachment = tender.attachments.find((att: TenderAttachment) =>
        att._id === attachmentId
      );

      if (!attachment) {
        throw new Error('Attachment not found');
      }

      return attachment;
    } catch (error) {
      throw handleError(error, 'getAttachmentInfo');
    }
  },
  // ============ ANALYTICS & EXPORT ============
  async getAnalytics(timeRange?: 'today' | 'week' | 'month' | 'year'): Promise<any> {
    try {
      const response = await api.get('/tender/analytics', { params: { timeRange } });
      return response.data.data;
    } catch (error) {
      throw handleError(error, 'getAnalytics');
    }
  },

  async exportTenders(params?: TenderFilter): Promise<Blob> {
    try {
      const response = await api.get('/tender/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'exportTenders');
    }
  },

  async getNormalizedCategories(type?: TenderCategoryType): Promise<{
    groups: { [key: string]: CategoryGroup };
    allCategories: string[];
  }> {
    try {
      const categories = await tenderService.getCategories(type);

      if (type) {
        return {
          groups: categories.groups || {},
          allCategories: categories.allCategories || []
        };
      } else {
        // If no type specified, return based on the structure
        if (type === 'freelance' && categories.freelance) {
          return {
            groups: categories.freelance,
            allCategories: []
          };
        } else if (type === 'professional' && categories.professional) {
          return {
            groups: categories.professional,
            allCategories: []
          };
        }
        return { groups: {}, allCategories: [] };
      }
    } catch (error) {
      throw handleError(error, 'getNormalizedCategories');
    }
  },

  // ============ BULK OPERATIONS ============
  async bulkUpdateStatus(ids: string[], status: TenderStatus): Promise<void> {
    try {
      await api.patch('/tender/bulk/status', { ids, status });
      handleSuccess(`Status updated for ${ids.length} tender(s)`);
    } catch (error) {
      throw handleError(error, 'bulkUpdateStatus');
    }
  },

  // ============ LOCAL FILE UTILITIES ============
  getLocalDownloadUrl,
  getLocalPreviewUrl
};