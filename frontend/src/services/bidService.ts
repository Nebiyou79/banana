// src/services/bidService.ts
// FIXES:
//   BUG-C1  → coverSheet currency sent as 'coverSheetCurrency' (original fix preserved)
//   BUG-4c  → downloadBidDocument constructs path without /api/v1 prefix — matches backend fix
//   BUG-1b  → All download calls use api.get() with a clean /bids/... path

import { api } from '@/lib/axios';

// ══════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ══════════════════════════════════════════════════════════════════════

export type BidStatus =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'awarded'
  | 'rejected'
  | 'withdrawn';

export type BidDocumentType =
  | 'technical_proposal'
  | 'financial_proposal'
  | 'company_profile'
  | 'compliance'
  | 'cpo_document'
  | 'other'
  | 'business_license'
  | 'tin_certificate'
  | 'vat_certificate'
  | 'tax_clearance'
  | 'trade_registration'
  | 'opening_page'
  | 'performance_bond'
  | 'financial_breakdown';

export type BidCurrency = 'ETB' | 'USD' | 'EUR' | 'GBP';

export interface BidTender {
  _id: string;
  title: string;
  status: string;
  deadline: string;
  workflowType: 'open' | 'closed';
  referenceNumber?: string;
}

export interface BidUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface BidCompany {
  _id: string;
  name: string;
  logo?: string;
}

export interface BidCoverSheet {
  companyName: string;
  authorizedRepresentative: string;
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

export interface BidCPO {
  cpoNumber?: string;
  amount?: number;
  currency: BidCurrency;
  issuingBank?: string;
  issueDate?: string;
  expiryDate?: string;
  documentPath?: string;
  documentUrl?: string;
  bidSecurityType?: 'cpo' | 'bank_guarantee' | 'insurance_bond';
  status: 'submitted' | 'verified' | 'rejected' | 'expired';
  returnStatus?: 'pending' | 'returned' | 'forfeited';
  returnedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
}

export interface BidDocument {
  _id: string;
  originalName: string;
  fileName: string;
  path: string;
  url: string;
  downloadUrl: string;
  mimetype: string;
  size: number;
  fileHash?: string;
  documentType: BidDocumentType;
  uploadedAt: string;
}

export interface BidEvaluation {
  preliminaryPassed?: boolean | null;
  preliminaryNotes?: string;
  preliminaryCheckedAt?: string;
  technicalScore?: number | null;
  technicalPassMark?: number;
  passedTechnical?: boolean | null;
  technicalNotes?: string;
  technicalEvaluatedAt?: string;
  financialScore?: number | null;
  financialRank?: number | null;
  financialEvaluatedAt?: string;
  combinedScore?: number | null;
  overallRank?: number | null;
  qualificationStatus?:
    | 'pending'
    | 'preliminary_failed'
    | 'technical_failed'
    | 'financial_evaluated'
    | 'awarded'
    | 'rejected';
}

export interface FinancialBreakdownItem {
  description: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
  category?: 'labor' | 'materials' | 'logistics' | 'overhead' | 'tax' | 'other';
}

export interface FinancialBreakdown {
  items: FinancialBreakdownItem[];
  subtotal?: number;
  vatPercentage?: number;
  vatAmount?: number;
  discount?: number;
  totalWithVAT?: number;
  currency?: string;
  paymentTerms?: string;
}

export interface ComplianceItem {
  documentType: BidDocumentType;
  submitted: boolean;
  documentId?: string;
  expiryDate?: string;
  verifiedByOwner: boolean;
  notes?: string;
}

export interface Bid {
  _id: string;
  tender: BidTender | string;
  bidder: BidUser | string;
  bidderCompany?: BidCompany | string;
  bidNumber?: string;
  coverSheet?: BidCoverSheet;
  bidAmount: number | null;
  currency: BidCurrency;
  technicalProposal?: string;
  financialProposal?: string | null;
  financialBreakdown?: FinancialBreakdown | null;
  documents: BidDocument[];
  cpo?: BidCPO;
  complianceChecklist: ComplianceItem[];
  evaluation?: BidEvaluation;
  sealed: boolean;
  sealedAt?: string;
  revealedAt?: string;
  status: BidStatus;
  submittedAt: string;
  reviewedAt?: string;
  ownerNotes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetBidsResponse {
  bids: Bid[];
  totalBids: number;
  sealedBids: number;
  visibleBids: number;
  isBidsRevealed: boolean;
  canBid: boolean;
  myBidId: string | null;
  hasSubmittedBid: boolean;
}

export interface SubmitBidData {
  bidAmount: number;
  currency?: BidCurrency;
  technicalProposal?: string;
  financialProposal?: string;
  financialBreakdown?: FinancialBreakdown;
  coverSheet?: BidCoverSheet;
  cpoNumber?: string;
  cpoAmount?: number;
  cpoCurrency?: BidCurrency;
  cpoIssuingBank?: string;
  cpoIssueDate?: string;
  cpoExpiryDate?: string;
  bidSecurityType?: 'cpo' | 'bank_guarantee' | 'insurance_bond';
  documentTypes?: BidDocumentType[];
}

export interface BidPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ══════════════════════════════════════════════════════════════════════
// FORM DATA BUILDER
// BUG-C1 FIX: cover-sheet currency sent as 'coverSheetCurrency'
// BUG-4a FIX: documentType is required on FileEntry — validated before append
// ══════════════════════════════════════════════════════════════════════

const buildBidFormData = (
  data: Partial<SubmitBidData>,
  files?: { file: File; documentType: BidDocumentType }[]
): FormData => {
  const form = new FormData();

  if (data.bidAmount !== undefined) form.append('bidAmount', String(data.bidAmount));
  if (data.currency) form.append('currency', data.currency);
  if (data.technicalProposal) form.append('technicalProposal', data.technicalProposal);
  if (data.financialProposal) form.append('financialProposal', data.financialProposal);
  if (data.bidSecurityType)   form.append('bidSecurityType',   data.bidSecurityType);

  if (data.cpoNumber)                  form.append('cpoNumber',    data.cpoNumber);
  if (data.cpoAmount !== undefined)    form.append('cpoAmount',    String(data.cpoAmount));
  if (data.cpoCurrency)                form.append('cpoCurrency',  data.cpoCurrency);
  if (data.cpoIssuingBank)             form.append('cpoIssuingBank', data.cpoIssuingBank);
  if (data.cpoIssueDate)               form.append('cpoIssueDate', data.cpoIssueDate);
  if (data.cpoExpiryDate)              form.append('cpoExpiryDate', data.cpoExpiryDate);

  if (data.coverSheet) {
    const cs = data.coverSheet;
    form.append('companyName',              cs.companyName);
    form.append('authorizedRepresentative', cs.authorizedRepresentative);
    if (cs.representativeTitle) form.append('representativeTitle', cs.representativeTitle);
    form.append('companyEmail',   cs.companyEmail);
    form.append('companyPhone',   cs.companyPhone);
    if (cs.companyAddress)  form.append('companyAddress',  cs.companyAddress);
    if (cs.tinNumber)       form.append('tinNumber',       cs.tinNumber);
    if (cs.licenseNumber)   form.append('licenseNumber',   cs.licenseNumber);
    form.append('totalBidValue', String(cs.totalBidValue));
    // BUG-C1 FIX: coverSheet currency sent under a dedicated key
    form.append('coverSheetCurrency', cs.currency);
    if (cs.bidValidityPeriod !== undefined)
      form.append('bidValidityPeriod', String(cs.bidValidityPeriod));
    form.append('declarationAccepted', String(cs.declarationAccepted));
    if (cs.declarationAcceptedAt) form.append('declarationAcceptedAt', cs.declarationAcceptedAt);
  }

  if (data.financialBreakdown) {
    form.append('financialBreakdown', JSON.stringify(data.financialBreakdown));
  }

  // BUG-4a FIX: skip files with missing documentType and log a warning
  if (files && files.length > 0) {
    files.forEach(({ file, documentType }) => {
      if (!documentType) {
        console.warn('[bidService] File missing documentType, skipping:', file.name);
        return;
      }
      form.append('documents',     file);
      form.append('documentTypes', documentType);
    });
  }

  return form;
};

// ══════════════════════════════════════════════════════════════════════
// SERVICE FUNCTIONS
// ══════════════════════════════════════════════════════════════════════

const submitBid = async (
  tenderId: string,
  data: SubmitBidData,
  files: { file: File; documentType: BidDocumentType }[]
): Promise<Bid> => {
  const form = buildBidFormData(data, files);
  const response = await api.post(`/bids/${tenderId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data as Bid;
};

const getBids = async (tenderId: string): Promise<GetBidsResponse> => {
  const response = await api.get(`/bids/${tenderId}`);
  return response.data.data as GetBidsResponse;
};

const getMyBid = async (tenderId: string): Promise<Bid | null> => {
  const response = await api.get(`/bids/${tenderId}/my-bid`);
  return response.data.data as Bid | null;
};

const updateBid = async (
  tenderId: string,
  bidId: string,
  data: Partial<SubmitBidData>,
  files?: { file: File; documentType: BidDocumentType }[]
): Promise<Bid> => {
  const form = buildBidFormData(data, files);
  const response = await api.put(`/bids/${tenderId}/${bidId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data as Bid;
};

const withdrawBid = async (tenderId: string, bidId: string): Promise<void> => {
  await api.delete(`/bids/${tenderId}/${bidId}`);
};

const updateBidStatus = async (
  tenderId: string,
  bidId: string,
  data: { status: BidStatus; ownerNotes?: string }
): Promise<Bid> => {
  const response = await api.patch(`/bids/${tenderId}/${bidId}/status`, data);
  return response.data.data as Bid;
};

const submitEvaluationScore = async (
  tenderId: string,
  bidId: string,
  data: {
    step: 'preliminary' | 'technical' | 'financial';
    technicalScore?: number;
    financialScore?: number;
    preliminaryPassed?: boolean;
    technicalNotes?: string;
    financialNotes?: string;
    preliminaryNotes?: string;
  }
): Promise<{ evaluation: BidEvaluation; bidNumber: string }> => {
  const response = await api.post(`/bids/${tenderId}/${bidId}/evaluate`, data);
  return response.data.data as { evaluation: BidEvaluation; bidNumber: string };
};

const verifyCPOReturn = async (
  tenderId: string,
  bidId: string,
  data: { returnStatus: 'returned' | 'forfeited'; returnNotes?: string }
): Promise<{ cpo: BidCPO }> => {
  const response = await api.patch(`/bids/${tenderId}/${bidId}/cpo/return`, data);
  return response.data.data as { cpo: BidCPO };
};

const updateComplianceChecklist = async (
  tenderId: string,
  bidId: string,
  complianceItems: ComplianceItem[]
): Promise<{ complianceChecklist: ComplianceItem[] }> => {
  const response = await api.patch(`/bids/${tenderId}/${bidId}/compliance`, {
    complianceChecklist: complianceItems,
  });
  return response.data.data as { complianceChecklist: ComplianceItem[] };
};

// BUG-4c / BUG-1b FIX:
// downloadUrl stored on BidDocument is now a ROOT-RELATIVE path like
// /bids/:tenderId/:bidId/documents/:fileName/download (no /api/v1 prefix).
// We construct the axios path directly from tenderId + bidId + fileName
// so there is NO double-prefix issue regardless of what downloadUrl contains.
const downloadBidDocument = async (
  tenderId: string,
  bidId: string,
  fileName: string
): Promise<void> => {
  const path = `/bids/${tenderId}/${bidId}/documents/${encodeURIComponent(fileName)}/download`;
  const response = await api.get(path, { responseType: 'blob' });
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

const getMyAllBids = async (params?: {
  page?: number;
  limit?: number;
  status?: BidStatus;
  tenderId?: string;
}): Promise<{ data: Bid[]; pagination: BidPagination }> => {
  const response = await api.get('/bids/my-bids', { params });
  return {
    data: response.data.data as Bid[],
    pagination: response.data.pagination as BidPagination,
  };
};

const bidService = {
  submitBid,
  getBids,
  getMyBid,
  updateBid,
  withdrawBid,
  updateBidStatus,
  submitEvaluationScore,
  verifyCPOReturn,
  updateComplianceChecklist,
  downloadBidDocument,
  getMyAllBids,
};

export default bidService;