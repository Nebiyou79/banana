// mobile/src/types/freelanceTender.ts
// Source of truth: server/src/models/FreelanceTender.js

// ─── String literal unions ────────────────────────────────────────────────────

export type TenderStatus = 'draft' | 'published' | 'closed';

export type EngagementType = 'fixed_price' | 'hourly' | 'fixed_salary' | 'negotiable';

export type ExperienceLevel = 'entry' | 'intermediate' | 'expert';

export type ProjectType = 'one_time' | 'ongoing' | 'complex';

export type LocationType = 'remote' | 'on_site' | 'hybrid' | 'flexible';

export type Urgency = 'normal' | 'urgent';

export type Currency = 'ETB' | 'USD' | 'EUR' | 'GBP';

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'awarded'
  | 'rejected';

export type DocumentType =
  | 'statement_of_work'
  | 'design_references'
  | 'brand_guidelines'
  | 'wireframes'
  | 'sample_data'
  | 'nda'
  | 'reference_designs'
  | 'other';

// ─── Nested shapes ────────────────────────────────────────────────────────────

export interface TenderBudget {
  min?: number;
  max?: number;
  currency: Currency;
}

export interface TenderSalaryRange {
  min?: number;
  max?: number;
  currency: Currency;
  period: 'monthly' | 'yearly';
}

export interface TenderEstimatedTimeline {
  value: number;
  unit: 'hours' | 'days' | 'weeks' | 'months';
}

export interface ScreeningQuestion {
  question: string;
  required: boolean;
}

export interface TenderDetails {
  engagementType: EngagementType;
  budget?: TenderBudget;
  salaryRange?: TenderSalaryRange;
  isNegotiable?: boolean;
  weeklyHours?: number;
  estimatedTimeline?: TenderEstimatedTimeline;
  experienceLevel: ExperienceLevel;
  numberOfPositions: number;
  projectType: ProjectType;
  locationType: LocationType;
  portfolioRequired?: boolean;
  ndaRequired?: boolean;
  urgency: Urgency;
  languagePreference?: string;
  screeningQuestions?: ScreeningQuestion[];
  industry?: string;
}

export interface TenderMetadata {
  views: number;
  savedBy: string[];
  totalApplications: number;
  daysRemaining?: number;
  updateCount: number;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
}

export interface TenderAttachment {
  _id: string;
  originalName: string;
  fileName: string;
  size: number;
  mimetype: string;
  path: string;
  url: string;
  downloadUrl: string;
  description?: string;
  documentType: DocumentType;
  uploadedBy?: string;
  uploadedAt: string;
  fileHash: string;
  version: number;
}

// ─── Main interfaces ──────────────────────────────────────────────────────────

export interface TenderOwnerEntity {
  _id: string;
  name: string;
  logo?: { secure_url?: string; url?: string } | string;
  headline?: string;
}

export interface TenderOwner {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface TenderApplicant {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface FreelanceTenderApplication {
  _id: string;
  applicant: TenderApplicant | string;
  coverLetter: string;
  proposedRate: number;
  proposedRateCurrency: Currency;
  estimatedTimeline?: TenderEstimatedTimeline;
  portfolioLinks?: string[];
  cvPath?: string;
  cvFileName?: string;
  cvOriginalName?: string;
  screeningAnswers?: Array<{ questionIndex: number; answer: string }>;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  ownerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FreelanceTender {
  _id: string;
  tenderId?: string;
  title: string;
  description: string;
  briefDescription?: string;
  procurementCategory: string;
  skillsRequired: string[];
  status: TenderStatus;
  maxApplications?: number;
  owner: TenderOwner | string;
  ownerRole: 'company' | 'organization';
  ownerEntity: TenderOwnerEntity | string;
  ownerEntityModel: 'Company' | 'Organization';
  details: TenderDetails;
  deadline: string;
  publishedAt?: string;
  closedAt?: string;
  applications: FreelanceTenderApplication[];
  attachments: TenderAttachment[];
  metadata: TenderMetadata;
  isDeleted: boolean;
  // Virtual fields from backend
  canEdit?: boolean;
  canDelete?: boolean;
  applicationCount?: number;
  isExpired?: boolean;
  isActive?: boolean;
  acceptingApplications?: boolean;
  // Augmented by mobile client
  isSaved?: boolean;
  hasApplied?: boolean;
  myApplication?: FreelanceTenderApplication;
  createdAt: string;
  updatedAt: string;
}

export interface FreelanceTenderListItem {
  _id: string;
  tenderId?: string;
  title: string;
  briefDescription?: string;
  description: string;
  procurementCategory: string;
  skillsRequired: string[];
  status: TenderStatus;
  maxApplications?: number;
  owner: TenderOwner | string;
  ownerEntity: TenderOwnerEntity | string;
  details: TenderDetails;
  deadline: string;
  metadata: TenderMetadata;
  applicationCount?: number;
  isSaved?: boolean;
  hasApplied?: boolean;
  createdAt: string;
}

// ─── Form data ────────────────────────────────────────────────────────────────

export interface FreelanceTenderFormData {
  title: string;
  briefDescription?: string;
  description: string;
  procurementCategory: string;
  skillsRequired: string[];
  maxApplications?: number;
  deadline: string; // ISO string
  details: TenderDetails;
  // file attachments handled separately
  attachmentFiles?: Array<{ uri: string; name: string; mimeType: string; size?: number }>;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface FreelanceTenderFilters {
  search?: string;
  procurementCategory?: string;
  engagementType?: EngagementType;
  minBudget?: number;
  maxBudget?: number;
  experienceLevel?: ExperienceLevel | 'any';
  urgency?: Urgency;
  projectType?: ProjectType;
  skills?: string; // comma-separated
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'deadline';
  sortOrder?: 'asc' | 'desc';
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface TenderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FreelanceTenderListResponse {
  tenders: FreelanceTenderListItem[];
  pagination: TenderPagination;
}

export interface TenderApplicationsResponse {
  applications: FreelanceTenderApplication[];
  pagination: TenderPagination;
  summary: {
    total: number;
    byStatus: Record<ApplicationStatus, number>;
  };
}

export interface SubmitApplicationData {
  coverLetter: string;
  proposedRate: number;
  proposedRateCurrency?: Currency;
  estimatedTimeline?: TenderEstimatedTimeline;
  portfolioLinks?: string[];
  screeningAnswers?: Array<{ questionIndex: number; answer: string }>;
  cvFile?: { uri: string; name: string; mimeType: string };
}