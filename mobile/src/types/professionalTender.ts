// ─────────────────────────────────────────────────────────────────────────────
//  src/types/professionalTender.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Source of truth: server/src/models/ProfessionalTender.js
//
//  ⚠️  CRITICAL RULES — these are encoded in the type system itself:
//   • P-01  workflowType is 'open' | 'closed'.  NEVER 'sealed'.
//           ('sealed' is a legacy frontend biddingType that maps to 'closed'.)
//   • P-14  preBidMeeting is a ROOT-LEVEL field on the tender.
//           It is NOT inside `procurement`.
//   • Sealed bid amounts/identities must never be exposed in UI until
//           status === 'revealed' || status === 'closed'.
//   • Tenders with status !== 'draft' cannot be edited — use the
//           Addendum system.
// ─────────────────────────────────────────────────────────────────────────────

// ═════════════════════════════════════════════════════════════════════════════
//  ENUMS  (mirror backend exactly)
// ═════════════════════════════════════════════════════════════════════════════

/** P-01: 'open' | 'closed' — never 'sealed'. */
export type ProfessionalTenderWorkflowType = 'open' | 'closed';

export type ProfessionalTenderStatus =
  | 'draft'
  | 'published'
  | 'locked'
  | 'deadline_reached'
  | 'revealed'
  | 'closed'
  | 'cancelled';

export type ProfessionalTenderType =
  | 'works'
  | 'goods'
  | 'services'
  | 'consultancy';

export type ProfessionalTenderVisibilityType = 'public' | 'invite_only';

export type ProcurementMethod =
  | 'open_tender'
  | 'restricted'
  | 'sealed_bid'
  | 'direct'
  | 'framework'
  | 'negotiated';

export type EvaluationMethod =
  | 'technical_only'
  | 'financial_only'
  | 'combined';

export type Currency = 'ETB' | 'USD' | 'EUR' | 'GBP';

export type DocumentType =
  | 'rfp'
  | 'rfq'
  | 'specifications'
  | 'drawings'
  | 'terms'
  | 'addendum'
  | 'other';

// ═════════════════════════════════════════════════════════════════════════════
//  SUB-OBJECTS  (mirror backend sub-schemas)
// ═════════════════════════════════════════════════════════════════════════════

export interface ContactPerson {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
}

export interface Procurement {
  procuringEntity: string;
  procurementMethod?: ProcurementMethod;
  fundingSource?: string;
  contactPerson?: ContactPerson;
  bidSecurityAmount?: number;
  /** P-15: The schema field is `bidSecurityCurrency` (not `currency`). */
  bidSecurityCurrency?: Currency;
}

export interface FinancialCapacity {
  minAnnualTurnover?: number;
  currency?: Currency;
}

export interface PastProjectReferences {
  minCount?: number;
  similarValueProjects?: boolean;
}

export interface Eligibility {
  minimumExperience?: number;                  // years
  requiredCertifications?: string[];           // serialized as repeated keys in FormData
  legalRegistrationRequired?: boolean;
  financialCapacity?: FinancialCapacity;
  pastProjectReferences?: PastProjectReferences;
  geographicPresence?: string;
}

export interface ScopeDeliverable {
  title: string;
  description?: string;
}

export interface ScopeMilestone {
  title: string;
  dueDate?: string;          // ISO
  description?: string;
}

export interface Scope {
  description?: string;
  deliverables?: ScopeDeliverable[];
  milestones?: ScopeMilestone[];
  technicalRequirements?: string;
  expectedOutcomes?: string;
}

export interface Evaluation {
  evaluationMethod: EvaluationMethod;
  technicalWeight: number;        // 0-100
  financialWeight: number;        // 0-100  (technical + financial must equal 100)
  criteria?: string;              // free-text criteria description
}

/**
 * P-14: ROOT-LEVEL on the tender.  NOT nested inside `procurement`.
 *       The mobile form may use an `enabled` toggle to drive UI, but the
 *       payload sent to the server only includes `date | location | onlineLink |
 *       mandatory` when enabled is true.
 */
export interface PreBidMeeting {
  enabled?: boolean;          // form-only convenience flag (NOT persisted)
  date?: string;              // ISO
  location?: string;
  onlineLink?: string;
  mandatory?: boolean;
}

export interface PerformanceBond {
  required?: boolean;
  percentage?: number;
  description?: string;
}

export interface Addendum {
  _id: string;
  title: string;
  description: string;
  newDeadline?: string;       // ISO
  attachments?: TenderAttachment[];
  issuedAt: string;           // ISO
  issuedBy?: string;          // user id
}

export interface TenderAttachment {
  _id: string;
  filename: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  documentType?: DocumentType;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface CPOSubmission {
  _id: string;
  cpoNumber: string;
  amount: number;
  currency: Currency;
  issuingBank?: string;
  issueDate?: string;
  expiryDate?: string;
  status: 'submitted' | 'verified' | 'rejected' | 'expired';
  document?: TenderAttachment;
  submittedAt: string;
  submittedBy: string;
}

// ═════════════════════════════════════════════════════════════════════════════
//  TENDER — MAIN SHAPE
// ═════════════════════════════════════════════════════════════════════════════

export interface ProfessionalTenderOwnerEntity {
  _id: string;
  name: string;
  logo?: string;
}

export interface ProfessionalTenderMetadata {
  totalBids?: number;
  sealedBids?: number;
  visibleBids?: number;
  daysUntilDeadline?: number;
  lockedBy?: string;
  revealedBy?: string;
}

/**
 * Lightweight bidder summary attached to GET /:id by the role-aware controller.
 * Owners get full bid objects post-reveal; bidders get only `myBid` summary.
 */
export interface MyBidSummary {
  _id: string;
  status: string;
  submittedAt: string;
  sealed: boolean;
}

/** Bid info as exposed inside a tender response (varies by role + status). */
export interface ProfessionalTenderBid {
  _id: string;
  bidder?: string;
  bidderCompany?: string | { _id: string; name: string };
  /** Hidden in the UI until status === 'revealed' || 'closed'. */
  bidAmount?: number;
  currency?: Currency;
  status: string;
  submittedAt: string;
  sealed?: boolean;
}

/**
 * Full tender shape returned by GET /:id (owner) and GET /:id/edit-data.
 * Bidder responses also use this shape but with masked `bids[]` and `myBid`
 * populated. Callers should branch on the `isOwner` flag returned alongside.
 */
export interface ProfessionalTender {
  _id: string;
  owner: string;
  ownerRole: 'company' | 'organization';
  ownerEntity: string | ProfessionalTenderOwnerEntity;
  ownerEntityModel: 'Company' | 'Organization';

  // Identity
  title: string;
  briefDescription?: string;
  description: string;
  referenceNumber?: string;
  procurementCategory: string;
  tenderType: ProfessionalTenderType;
  /** P-01 */
  workflowType: ProfessionalTenderWorkflowType;
  visibilityType: ProfessionalTenderVisibilityType;
  status: ProfessionalTenderStatus;

  // Dates
  deadline: string;                // ISO, required
  bidOpeningDate?: string;
  clarificationDeadline?: string;
  publishedAt?: string;
  lockedAt?: string;
  deadlineReachedAt?: string;
  revealedAt?: string;
  closedAt?: string;
  cancelledAt?: string;

  // Sub-objects
  procurement: Procurement;
  eligibility?: Eligibility;
  scope?: Scope;
  evaluation?: Evaluation;

  /** P-14: ROOT-LEVEL — not nested inside `procurement`. */
  preBidMeeting?: PreBidMeeting;

  performanceBond?: PerformanceBond;
  bidValidityPeriod?: number;

  // Bids — content depends on role + status
  bids?: ProfessionalTenderBid[];
  bidCount?: number;
  sealedBidCount?: number;
  myBid?: MyBidSummary;

  // Addenda
  addenda?: Addendum[];

  // CPO
  cpoRequired?: boolean;
  cpoDescription?: string;
  cpoSubmissions?: CPOSubmission[];

  // Attachments
  attachments?: TenderAttachment[];

  // Bookkeeping
  metadata?: ProfessionalTenderMetadata;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Compact card-shape returned by list endpoints (browse + my-tenders).
 * Bid amounts and bidder identities are intentionally omitted at this
 * level — sealed contents are never exposed in lists.
 */
export interface ProfessionalTenderListItem {
  _id: string;
  title: string;
  briefDescription?: string;
  referenceNumber?: string;
  procurementCategory: string;
  tenderType: ProfessionalTenderType;
  workflowType: ProfessionalTenderWorkflowType;
  status: ProfessionalTenderStatus;
  visibilityType: ProfessionalTenderVisibilityType;
  deadline: string;
  ownerEntity?: ProfessionalTenderOwnerEntity | string;
  bidCount?: number;
  myBid?: MyBidSummary;          // populated when current user has bid on it
  createdAt: string;
  updatedAt: string;
}

// ═════════════════════════════════════════════════════════════════════════════
//  WRITE / FILTER / RESPONSE SHAPES
// ═════════════════════════════════════════════════════════════════════════════

/** Payload for POST /create.  Sub-objects must be JSON.stringify'd in FormData. */
export interface CreateProfessionalTenderData {
  title: string;
  briefDescription?: string;
  description: string;
  procurementCategory: string;
  tenderType: ProfessionalTenderType;
  /** P-01 */
  workflowType: ProfessionalTenderWorkflowType;
  visibilityType?: ProfessionalTenderVisibilityType;
  referenceNumber?: string;        // optional — auto-generated on publish
  deadline: string;                // ISO
  bidOpeningDate?: string;
  clarificationDeadline?: string;
  status?: 'draft' | 'published';

  procurement: Procurement;
  eligibility?: Eligibility;
  scope?: Scope;
  evaluation?: Evaluation;

  /** P-14: ROOT-LEVEL */
  preBidMeeting?: PreBidMeeting;

  performanceBond?: PerformanceBond;
  bidValidityPeriod?: number;

  cpoRequired?: boolean;
  cpoDescription?: string;
}

/** Same shape as create — backend still rejects with 400 if status !== 'draft'. */
export type UpdateProfessionalTenderData = Partial<CreateProfessionalTenderData>;

export interface ProfessionalTenderFilters {
  search?: string;
  category?: string;
  procurementCategory?: string;
  tenderType?: ProfessionalTenderType;
  workflowType?: ProfessionalTenderWorkflowType;
  status?: ProfessionalTenderStatus;
  visibilityType?: ProfessionalTenderVisibilityType;
  deadlineFrom?: string;          // ISO
  deadlineTo?: string;            // ISO
  page?: number;
  limit?: number;
  sortBy?: 'deadline' | 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface MyProfessionalTendersFilters {
  status?: ProfessionalTenderStatus | 'all';
  workflowType?: ProfessionalTenderWorkflowType;
  page?: number;
  limit?: number;
}

export interface TenderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface ProfessionalTenderListResponse {
  tenders: ProfessionalTenderListItem[];
  pagination: TenderPagination;
}

/** GET /:id wraps the tender with an `isOwner` flag for role-aware rendering. */
export interface ProfessionalTenderDetailResponse {
  data: ProfessionalTender;
  isOwner: boolean;
}

// ─── Addendum write payload ──────────────────────────────────────────────────
export interface AddendumData {
  title: string;
  description: string;
  newDeadline?: string;           // ISO
}

// ─── CPO write payload ───────────────────────────────────────────────────────
export interface CPOData {
  cpoNumber: string;
  amount: number;
  currency?: Currency;
  issuingBank?: string;
  issueDate?: string;
  expiryDate?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
//  UI HELPERS — co-located so screens/components import from one place
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Drives the action bar on ProfessionalTenderDetailScreen (owner).
 * Mirrors §7.1 of the module spec.
 */
export type TenderAction =
  | 'publish'
  | 'edit'
  | 'delete'
  | 'lock'
  | 'reveal'
  | 'close'
  | 'addAddendum'
  | 'viewAllBids';

export const getAvailableActions = (
  status: ProfessionalTenderStatus,
  workflowType: ProfessionalTenderWorkflowType,
): TenderAction[] => {
  switch (status) {
    case 'draft':
      return ['publish', 'edit', 'delete'];
    case 'published':
      return workflowType === 'closed'
        ? ['lock', 'addAddendum']
        : ['close', 'addAddendum'];
    case 'locked':
      return ['addAddendum'];
    case 'deadline_reached':
      return workflowType === 'closed' ? ['reveal'] : ['close'];
    case 'revealed':
      return ['close', 'viewAllBids'];
    case 'closed':
    case 'cancelled':
    default:
      return [];
  }
};

/**
 * The single rule that gates every UI surface that might leak sealed bid
 * contents. Use this — never reach into status/workflowType ad-hoc.
 */
export const areSealedBidsViewable = (
  status: ProfessionalTenderStatus,
  workflowType: ProfessionalTenderWorkflowType,
): boolean => {
  if (workflowType !== 'closed') return true;          // open tenders: always viewable
  return status === 'revealed' || status === 'closed'; // closed: only post-reveal
};

/** Edit-lock check.  Tender is editable iff status === 'draft'. */
export const isTenderEditable = (status: ProfessionalTenderStatus): boolean =>
  status === 'draft';
