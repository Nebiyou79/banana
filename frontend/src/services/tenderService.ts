/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/tenderService.ts
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
  filename: string;
  originalName: string;
  path: string;
  fileSize: number;
  fileType: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: Date;
  documentType: string;
  version: number;
  fileHash: string;
  previousVersions?: any[];
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
  invitedEmails?: Array<{
    email: string;
    token: string;
    tokenExpires: Date;
    status: 'pending' | 'accepted' | 'declined';
  }>;
}

export interface FreelanceSpecific {
  sealedBidConfirmation: any;
  projectType: ProjectType;
  engagementType: EngagementType;
  budget: {
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

// Add to ProfessionalSpecific interface
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
}

// Add CPO submission type for proposals
export interface CPOSubmission {
  cpoNumber: string;
  issuingBank: string;
  amount: number;
  currency: Currency;
  validityDate: Date;
  documentPath?: string;
  filename?: string;
  originalName?: string;
  fileHash?: string;
  submittedAt?: Date;
  verified?: boolean;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
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
  views: number;
  totalApplications: number;
  visibleApplications: number;
  savedCount: number;
  updateCount: number;
  daysRemaining: number;
  isActive: boolean;
  isFreelance: boolean;
  isProfessional: boolean;
  workflowType: WorkflowType;
  visibilityType: string;
  status: string;
  invitationStats: {
    totalInvited: number;
    accepted: number;
    pending: number;
    declined: number;
    expired: number;
  };
  proposalStats: {
    submitted: number;
    underReview: number;
    shortlisted: number;
    accepted: number;
    rejected: number;
    sealed: number;
    revealed: number;
  };
  cpoStats?: CPOStats; // Add CPO stats
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
  tenderCategory: 'freelance';
  title: string;
  description: string;
  procurementCategory: string;
  deadline: string | Date;
  // ... other fields

  // Make sure these match what the backend expects
  workflowType?: WorkflowType;
  status?: 'draft' | 'published';
  engagementType: EngagementType;
  projectType?: ProjectType;
  budget?: {
    min: number;
    max: number;
    currency: Currency;
  };
  estimatedDuration?: {
    value: number;
    unit: 'hours' | 'days' | 'weeks' | 'months';
  };
  weeklyHours?: number;
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
  skillsRequired?: string[];
  maxFileSize?: number;
  maxFileCount?: number;
  sealedBidConfirmation?: boolean;
  fileDescriptions?: string[];
  fileTypes?: string[];
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
  status?: 'draft' | 'published';
  visibilityType?: VisibilityType;
  allowedCompanies?: string[];
  allowedUsers?: string[];
  sealedBidConfirmation?: boolean;
  maxFileSize?: number;
  maxFileCount?: number;
  fileDescriptions?: string[];
  fileTypes?: string[];

  // Add CPO fields
  cpoRequired?: boolean;
  cpoDescription?: string;
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
  experienceLevel?: ExperienceLevel;
  projectType?: ProjectType;
  dateFrom?: string;
  dateTo?: string;
  urgency?: string;
  location?: string;
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
  basePath: 'dashboard/company/my-tenders' | 'dashboard/organization/tenders'
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
// Add to UTILITIES section in tenderService.ts
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
  async getTenders(params?: TenderFilter): Promise<TendersResponse> {
    try {
      const response = await api.get('/tender', { params });
      return response.data;
    } catch (error) {
      throw handleError(error, 'getTenders');
    }
  },

  async createFreelanceTender(data: CreateFreelanceTenderData, files?: File[]): Promise<{ tender: Tender }> {
    try {
      const formData = new FormData();

      // Build the freelanceSpecific object
      const freelanceSpecific: any = {
        engagementType: data.engagementType,
        projectType: data.projectType || 'one_time',
        estimatedDuration: data.estimatedDuration || { value: 30, unit: 'days' },
        experienceLevel: data.experienceLevel || 'intermediate',
        portfolioRequired: data.portfolioRequired || false,
        ndaRequired: data.ndaRequired || false,
        urgency: data.urgency || 'normal',
      };

      // Add optional fields to freelanceSpecific if they exist
      if (data.languagePreference) {
        freelanceSpecific.languagePreference = data.languagePreference;
      }

      if (data.timezonePreference) {
        freelanceSpecific.timezonePreference = data.timezonePreference;
      }

      if (data.industry) {
        freelanceSpecific.industry = data.industry;
      }

      if (data.screeningQuestions && data.screeningQuestions.length > 0) {
        freelanceSpecific.screeningQuestions = data.screeningQuestions;
      }

      // Add budget or weeklyHours based on engagement type
      if (data.engagementType === 'fixed_price' && data.budget) {
        freelanceSpecific.budget = data.budget;
      }

      if (data.engagementType === 'hourly' && data.weeklyHours) {
        freelanceSpecific.weeklyHours = data.weeklyHours;
      }

      // Add basic fields to formData
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('procurementCategory', data.procurementCategory);
      formData.append('deadline', typeof data.deadline === 'string' ? data.deadline : data.deadline.toISOString());
      formData.append('tenderCategory', data.tenderCategory);
      if (data.workflowType) {
        formData.append('workflowType', data.workflowType);
      }
      formData.append('status', data.status || 'draft');

      // Add skills as JSON string
      if (data.skillsRequired && data.skillsRequired.length > 0) {
        formData.append('skillsRequired', JSON.stringify(data.skillsRequired));
      }

      // Add max file settings
      if (data.maxFileSize) {
        formData.append('maxFileSize', data.maxFileSize.toString());
      }

      if (data.maxFileCount) {
        formData.append('maxFileCount', data.maxFileCount.toString());
      }

      // Add freelanceSpecific as JSON string
      formData.append('freelanceSpecific', JSON.stringify(freelanceSpecific));

      // Add files if any
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('attachments', file); // Use 'attachments' field name
        });

        // Add file descriptions and types if they exist
        if (data.fileDescriptions && data.fileDescriptions.length > 0) {
          formData.append('fileDescriptions', JSON.stringify(data.fileDescriptions));
        }

        if (data.fileTypes && data.fileTypes.length > 0) {
          formData.append('fileTypes', JSON.stringify(data.fileTypes));
        }
      }

      // Debug: Log form data entries
      const entries = Array.from(formData.entries());
      console.log('FormData entries:', entries.map(([key, value]) => ({
        key,
        value: value instanceof File ? `File: ${value.name} (${value.size} bytes)` :
          (typeof value === 'string' && value.length > 100 ?
            `${value.substring(0, 100)}...` : value)
      })));

      const response = await api.post('/tender/freelance/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      handleSuccess('Freelance tender created successfully');
      return response.data.data;
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        // @ts-expect-error: error is unknown, but we expect response property
        console.error('Create freelance tender error details:', error.response?.data);
      }
      throw handleError(error, 'createFreelanceTender');
    }
  },

  // In tenderService.ts, update the createProfessionalTender function
  async createProfessionalTender(data: CreateProfessionalTenderData, files?: File[]): Promise<{ tender: Tender }> {
    try {
      const formData = new FormData();

      // Add all data fields with CPO handling
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && !(value instanceof File)) {
            // Stringify objects, but handle CPO specially if needed
            if (key === 'cpoRequired' || key === 'cpoDescription') {
              // These will be sent as separate fields, not stringified in professionalSpecific
              formData.append(key, value.toString());
            } else {
              formData.append(key, JSON.stringify(value));
            }
          } else {
            formData.append(key, value as string);
          }
        }
      });

      // Explicitly add CPO fields to form data if they exist
      if (data.cpoRequired !== undefined) {
        formData.append('cpoRequired', data.cpoRequired.toString());
      }

      if (data.cpoDescription) {
        formData.append('cpoDescription', data.cpoDescription);
      }

      // Add files if any
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append('files', file);
          if (data.fileDescriptions && data.fileDescriptions[index]) {
            formData.append('fileDescriptions', data.fileDescriptions[index]);
          }
          if (data.fileTypes && data.fileTypes[index]) {
            formData.append('fileTypes', data.fileTypes[index]);
          }
        });
      }

      const response = await api.post('/tender/professional/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      handleSuccess('Professional tender created successfully');
      return response.data.data;
    } catch (error) {
      throw handleError(error, 'createProfessionalTender');
    }
  },

  async updateTender(id: string, data: Partial<Tender>, files?: File[]): Promise<{ tender: Tender }> {
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

      // Add files if any
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await api.put(`/tender/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      handleSuccess('Tender updated successfully');
      return response.data.data;
    } catch (error) {
      throw handleError(error, 'updateTender');
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
    
    // Get token from multiple sources
    const getToken = () => {
      if (typeof window === 'undefined') return null;
      
      // Try localStorage
      const localStorageToken = localStorage.getItem('token');
      if (localStorageToken) return localStorageToken;
      
      // Try sessionStorage
      const sessionStorageToken = sessionStorage.getItem('token');
      if (sessionStorageToken) return sessionStorageToken;
      
      // Try cookies
      const cookies = document.cookie.split('; ');
      const tokenCookie = cookies.find(row => row.startsWith('token='));
      if (tokenCookie) return tokenCookie.split('=')[1];
      
      return null;
    };
    
    const token = getToken();
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Use owner endpoint if isOwner is true
    const endpoint = options?.isOwner ? `/tender/owner/${id}` : `/tender/${id}`;
    
    console.log('🌐 [tenderService] Making request to:', endpoint);
    
    const response = await api.get(endpoint, { 
      headers,
      timeout: 10000
    });
    
    console.log('✅ [tenderService] Response received, status:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('❌ [tenderService] Error in getTender:', error.message);
    
    if (error.response?.status === 403) {
      const errorMsg = error.response?.data?.message || 'Access denied. You do not have permission to view this tender.';
      throw new Error(errorMsg);
    }
    
    throw handleError(error, 'getTender');
  }
},

// // Add this method to TenderService
// async getOwnerTender(id: string): Promise<SingleTenderResponse> {
//   return this.getTender(id, { isOwner: true });
// }
// Get tender for owner editing
// Get tender for owner editing
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
    // The API returns { success: true, data: { ... } }
    // So we need to extract the data property
    return response.data.data;
  } catch (error) {
    throw handleError(error, 'getTenderForEditing');
  }
},

// Check if tender can be edited
async checkTenderEditable(id: string): Promise<{
  canEdit: boolean;
  restriction?: string;
  workflowType: WorkflowType;
  status: TenderStatus;
}> {
  try {
    const response = await api.get(`/tender/${id}/edit-data`);
    // Extract the data property
    return response.data.data;
  } catch (error) {
    throw handleError(error, 'checkTenderEditable');
  }
},

// Get owned tenders
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
    // Extract data from response
    return {
      tenders: response.data.data || [],
      pagination: response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
    };
  } catch (error) {
    throw handleError(error, 'getOwnedTenders');
  }
},

// Get owner-specific tender
async getOwnerTender(id: string): Promise<any> {
  try {
    // Try the owner endpoint first
    try {
      const response = await api.get(`/tender/owner/${id}`);
      return response.data.data;
    } catch (ownerError: any) {
      // If owner endpoint fails (404 or 403), fall back to regular endpoint
      if (ownerError.response?.status === 403 || ownerError.response?.status === 404) {
        console.log('⚠️ Owner endpoint failed, falling back to regular endpoint');
        
        const regularResponse = await api.get(`/tender/${id}`);
        const tender = regularResponse.data.data.tender;
        
        // Check if user is owner using frontend logic
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;
        const isOwner = user && tender.owner && tender.owner._id === user._id;
        
        return {
          tender,
          canViewProposals: regularResponse.data.data.canViewProposals || false,
          isOwner,
          canEdit: isOwner && (tender.status === 'draft' || 
                   (tender.status === 'published' && tender.workflowType === 'open'))
        };
      }
      throw ownerError;
    }
  } catch (error) {
    throw handleError(error, 'getOwnerTender');
  }
},

// Add separate function for public tenders
async getPublicTender(id: string): Promise<Tender> {
  console.log('🌍 [tenderService] Fetching public tender:', id);
  const response = await this.getTender(id, { isOwner: false });
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

// ============ ATTACHMENT MANAGEMENT ============
async downloadAttachment(tenderId: string, attachmentId: string): Promise<Blob> {
  try {
    // CORRECTED URL - Remove the duplicate /api
    const response = await api.get(`/tender/${tenderId}/attachments/${attachmentId}/download`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw handleError(error, 'downloadAttachment');
  }
},

async previewAttachment(tenderId: string, attachmentId: string): Promise<string> {
  try {
    const token = localStorage.getItem('token');
    // CORRECTED URL - Use the correct endpoint
    return `${api.defaults.baseURL || ''}/tender/${tenderId}/attachments/${attachmentId}/preview?token=${token}`;
  } catch (error) {
    throw handleError(error, 'previewAttachment');
  }
},

async deleteAttachment(tenderId: string, attachmentId: string): Promise<void> {
  try {
    // CORRECTED URL
    await api.delete(`/tender/${tenderId}/attachments/${attachmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
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
    
    files.forEach((file, index) => {
      formData.append('files', file);
      if (descriptions && descriptions[index]) {
        formData.append('descriptions', descriptions[index]);
      }
      if (types && types[index]) {
        formData.append('types', types[index]);
      }
    });

    // CORRECTED URL
    const response = await api.post(`/tender/${tenderId}/attachments/upload`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    
    handleSuccess('Files uploaded successfully');
    return response.data.data.attachments;
  } catch (error) {
    throw handleError(error, 'uploadAttachments');
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
      const categories = await this.getCategories(type);

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
  }
};
