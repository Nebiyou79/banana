// src/types/bid.ts
// Module 7B — Bids
// Matches server/src/models/Bid.js exactly.
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

export enum BidStatus {
  Submitted         = 'submitted',
  UnderReview       = 'under_review',
  Shortlisted       = 'shortlisted',
  InterviewScheduled = 'interview_scheduled',
  Awarded           = 'awarded',
  Rejected          = 'rejected',
  Withdrawn         = 'withdrawn',
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

// ═══════════════════════════════════════════════════════════════════════════
// SUB-INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cover sheet — all required company details submitted with a bid.
 * BUG-C1: `currency` here is the *cover-sheet* currency.
 * When serialised to FormData it MUST be sent as `coverSheetCurrency`
 * to avoid collision with the top-level bid `currency` field.
 */
export interface BidCoverSheet {
  companyName: string;
  representative: string;
  representativeTitle?: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress?: string;
  tinNumber?: string;
  licenseNumber?: string;
  totalBidValue: number;
  /** Serialise as `coverSheetCurrency` in FormData (BUG-C1 FIX). */
  currency: BidCurrency;
  bidValidityPeriod?: number;
  declarationAccepted: boolean;
  declarationAcceptedAt?: string; // ISO
}

/** A single line item in the financial breakdown table. */
export interface BidFinancialLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

/** A document attached to a bid. */
export interface BidDocument {
  _id: string;
  documentType: BidDocumentType;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string; // ISO
}

/** One entry in the bid's status history timeline. */
export interface BidStatusHistoryEntry {
  status: BidStatus;
  changedAt: string; // ISO
  changedBy?: string; // user id
  notes?: string;
}

/** Populated reference shapes. */
export interface BidBidder {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface BidBidderCompany {
  _id: string;
  name: string;
  logo?: { secure_url?: string; url?: string } | string;
}

export interface BidTenderRef {
  _id: string;
  title: string;
  referenceNumber?: string;
  deadline: string;
  status: string;
  workflowType?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN BID MODEL
// ═══════════════════════════════════════════════════════════════════════════

export interface Bid {
  _id: string;
  bidNumber: string;                            // BID-YYYY-NNNN

  bidder: BidBidder | string;
  bidderCompany: BidBidderCompany | string;
  tender: BidTenderRef | string;

  status: BidStatus;
  sealed: boolean;

  coverSheet: BidCoverSheet;
  technicalProposal?: string;
  financialBreakdown: BidFinancialLineItem[];

  bidAmount: number;
  currency: BidCurrency;

  documents: BidDocument[];
  statusHistory: BidStatusHistoryEntry[];

  /** Owner-only notes visible only to tender owner. */
  ownerNotes?: string;

  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// LIGHTWEIGHT LIST SHAPE
// ═══════════════════════════════════════════════════════════════════════════

/** Compact shape for list views — avoids loading full document arrays. */
export interface BidListItem {
  _id: string;
  bidNumber: string;
  status: BidStatus;
  sealed: boolean;
  bidAmount: number;
  currency: BidCurrency;
  bidderCompany?: { _id: string; name: string; logo?: string };
  tender: { _id: string; title: string; referenceNumber?: string; deadline: string };
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM / MUTATION PAYLOADS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Data payload used by useSubmitBid / useUpdateBid.
 * Files are passed separately as `{ file, documentType }[]`.
 * The service layer builds FormData from this via buildBidFormData().
 */
export interface SubmitBidData {
  coverSheet: BidCoverSheet;
  technicalProposal?: string;
  financialBreakdown?: BidFinancialLineItem[];
  /** Top-level bid currency (separate from coverSheet.currency). */
  currency?: BidCurrency;
}

/** Params for useGetMyAllBids pagination / filtering. */
export interface BidListParams {
  status?: BidStatus;
  page?: number;
  limit?: number;
}

/** Paginated response shape from GET /bids/my-bids. */
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

/** Response shape from GET /bids/:tenderId (owner endpoint). */
export interface GetBidsResponse {
  bids: Bid[];
  totalBids: number;
  sealedBids?: number;
  isBidsRevealed: boolean;
  canBid?: boolean;
}

/** Payload for PATCH .../status (owner only). */
export interface UpdateBidStatusData {
  status: BidStatus;
  ownerNotes?: string;
}
