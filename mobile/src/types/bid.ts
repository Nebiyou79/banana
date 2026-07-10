// src/types/bid.ts
// Module 7B — Bids
// FIXED: workflowType and deadline made non-optional where needed
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

export enum BidStatus {
  Submitted          = 'submitted',
  UnderReview        = 'under_review',
  Shortlisted        = 'shortlisted',
  InterviewScheduled = 'interview_scheduled',
  Awarded            = 'awarded',
  Rejected           = 'rejected',
  Withdrawn          = 'withdrawn',
}

export enum BidDocumentType {
  TechnicalProposal  = 'technical_proposal',
  FinancialProposal  = 'financial_proposal',
  FinancialBreakdown = 'financial_breakdown',
  BusinessLicense    = 'business_license',
  TinCertificate     = 'tin_certificate',
  VatCertificate     = 'vat_certificate',
  TaxClearance       = 'tax_clearance',
  TradeRegistration  = 'trade_registration',
  Compliance         = 'compliance',
  CpoDocument        = 'cpo_document',
  PerformanceBond    = 'performance_bond',
  CompanyProfile     = 'company_profile',
  OpeningPage        = 'opening_page',
  Other              = 'other',
}

export type BidCurrency = 'ETB' | 'USD' | 'EUR' | 'GBP';

/** Category for financial breakdown line items (web FinancialBreakdownTable pattern). */
export type BidFinancialCategory = 'labor' | 'materials' | 'logistics' | 'overhead' | 'tax' | 'other';

/** Workflow type for tenders */
export type WorkflowType = 'open' | 'closed';

// ═══════════════════════════════════════════════════════════════════════════
// SUB-INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface BidCoverSheet {
  authorizedRepresentative: string;
  companyName: string;
  representative: string;
  representativeTitle?: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress?: string;
  tinNumber?: string;
  licenseNumber?: string;
  totalBidValue: number;
  currency: BidCurrency;
  bidValidityPeriod?: number;
  declarationAccepted: boolean;
  declarationAcceptedAt?: string;
}

export interface BidFinancialLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  category?: BidFinancialCategory;
}

export interface BidDocument {
  _id: string;
  documentType: BidDocumentType;
  originalName: string;
  fileName?: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface BidStatusHistoryEntry {
  status: BidStatus;
  changedAt: string;
  changedBy?: string;
  notes?: string;
}

export interface BidEvaluation {
  preliminaryPassed?: boolean;
  preliminaryNotes?: string;
  preliminaryCheckedAt?: string;
  technicalScore?: number;
  technicalNotes?: string;
  technicalPassMark?: number;
  passedTechnical?: boolean;
  technicalEvaluatedAt?: string;
  financialScore?: number;
  financialNotes?: string;
  financialEvaluatedAt?: string;
  combinedScore?: number;
  overallRank?: number;
}

export interface BidCPO {
  bidSecurityType?: 'cpo' | 'bank_guarantee' | 'insurance_bond';
  cpoNumber?: string;
  amount?: number;
  currency?: BidCurrency;
  issuingBank?: string;
  issueDate?: string;
  expiryDate?: string;
  status?: string;
  returnStatus?: 'pending' | 'returned' | 'forfeited';
  returnNotes?: string;
}

export interface ComplianceItem {
  documentType: BidDocumentType;
  submitted: boolean;
  verifiedByOwner: boolean;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// POPULATED REFERENCE SHAPES
// ═══════════════════════════════════════════════════════════════════════════

export interface BidUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
}

export interface BidCompany {
  _id: string;
  name: string;
  logo?: string;
  email?: string;
  phone?: string;
}

/**
 * Populated tender reference.
 * FIXED: workflowType and deadline are required (non-optional) to match usage.
 */
export interface BidTender {
  _id: string;
  title: string;
  referenceNumber?: string;
  /** Always present when populated — required for sealed/open logic */
  deadline: string;
  status: string;
  /** Always present when populated — required for sealed/open logic */
  workflowType: WorkflowType;
}

// ═══════════════════════════════════════════════════════════════════════════
// FINANCIAL BREAKDOWN (server shape)
// ═══════════════════════════════════════════════════════════════════════════

export interface FinancialBreakdown {
  items: BidFinancialLineItem[];
  subtotal?: number;
  vatPercentage?: number;
  vatAmount?: number;
  discount?: number;
  totalWithVAT?: number;
  paymentTerms?: string;
  currency?: BidCurrency;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN BID MODEL
// ═══════════════════════════════════════════════════════════════════════════

export interface Bid {
  _id: string;
  bidNumber: string;
  bidder: BidUser | string;
  bidderCompany: BidCompany | string;
  tender: BidTender | string;
  status: BidStatus;
  sealed: boolean;
  coverSheet: BidCoverSheet;
  technicalProposal?: string;
  financialProposal?: string;
  financialBreakdown?: FinancialBreakdown;
  bidAmount: number;
  currency: BidCurrency;
  documents: BidDocument[];
  statusHistory: BidStatusHistoryEntry[];
  evaluation?: BidEvaluation;
  cpo?: BidCPO;
  complianceChecklist?: ComplianceItem[];
  ownerNotes?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// LIGHTWEIGHT LIST SHAPE
// ═══════════════════════════════════════════════════════════════════════════

export interface BidListItem {
  _id: string;
  bidNumber: string;
  status: BidStatus;
  sealed: boolean;
  bidAmount: number;
  currency: BidCurrency;
  bidderCompany?: { _id: string; name: string; logo?: string };
  tender: {
    _id: string;
    title: string;
    referenceNumber?: string;
    /** Required for sealed/open logic in list cards */
    deadline: string;
    /** Required for sealed/open logic in list cards */
    workflowType: WorkflowType;
    status?: string;
  };
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM / MUTATION PAYLOADS
// ═══════════════════════════════════════════════════════════════════════════

export interface SubmitBidData {
  coverSheet: BidCoverSheet;
  technicalProposal?: string;
  financialProposal?: string;
  financialBreakdown?: BidFinancialLineItem[];
  currency?: BidCurrency;
  bidAmount?: number;
  bidSecurityType?: 'cpo' | 'bank_guarantee' | 'insurance_bond';
  cpoNumber?: string;
  cpoAmount?: number;
  cpoCurrency?: BidCurrency;
  cpoIssuingBank?: string;
  cpoIssueDate?: string;
  cpoExpiryDate?: string;
}

export interface BidListParams {
  status?: BidStatus;
  page?: number;
  limit?: number;
}

export interface BidPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface MyAllBidsResponse {
  data: BidListItem[];
  pagination: BidPagination;
}

export interface GetBidsResponse {
  bids: Bid[];
  totalBids: number;
  sealedBids?: number;
  isBidsRevealed: boolean;
  canBid?: boolean;
}

export interface UpdateBidStatusData {
  status: BidStatus;
  ownerNotes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RNFile type (used by bidService for React Native file uploads)
// ═══════════════════════════════════════════════════════════════════════════

export interface RNFile {
  uri: string;
  name: string;
  type: string;
}