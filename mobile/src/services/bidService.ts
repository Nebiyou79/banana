// src/services/bidService.ts
// Module 7B — Bids
//
// CRITICAL RULES (read before touching):
//   BUG-C1 FIX  → coverSheet currency MUST be sent as 'coverSheetCurrency' in FormData
//   BUG-4a FIX  → files without a documentType THROW before append — never skip silently
//   BUG-FIX     → 'authorizedRepresentative' field is REQUIRED by backend validation
//   Parallel arrays → each file appends 'documents' (binary) + 'documentTypes' (string)
//   CPO fields   → bidSecurityType, cpoNumber, cpoAmount, cpoCurrency, cpoIssuingBank,
//                  cpoIssueDate, cpoExpiryDate all sent as flat top-level FormData fields
// ─────────────────────────────────────────────────────────────────────────────

import httpClient from '../lib/httpClient';
import {
  Bid,
  BidCoverSheet,
  BidDocumentType,
  BidFinancialLineItem,
  BidListParams,
  BidStatus,
  ComplianceItem,
  GetBidsResponse,
  MyAllBidsResponse,
  SubmitBidData,
  UpdateBidStatusData,
  BidEvaluation,
  BidCPO,
} from '../types/bid';

// ─── React Native file shape ─────────────────────────────────────────────────

export interface RNFile {
  uri: string;
  name: string;
  type: string;
}

export interface BidFileEntry {
  file: RNFile;
  documentType: BidDocumentType;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM DATA BUILDER
//
// All cover sheet fields are sent as FLAT individual FormData keys.
// DO NOT JSON.stringify the cover sheet object — the backend reads flat fields.
//
// BUG-C1 FIX: currency sent as 'coverSheetCurrency' (NOT 'currency') to
//             avoid collision with the top-level bid currency field.
// BUG-FIX:    'authorizedRepresentative' is REQUIRED by backend's
//             validateCoverSheet() — must match web version.
// BUG-4a FIX: any file missing a documentType throws immediately — never
//             silently skipped, which would cause backend index mismatches.
// ═══════════════════════════════════════════════════════════════════════════

export function buildBidFormData(
  data: Partial<SubmitBidData>,
  files: BidFileEntry[] = [],
): FormData {
  const form = new FormData();

  // ── 1. Cover sheet — FLAT fields (NEVER JSON.stringify) ──────────────────
  if (data.coverSheet) {
    const cs: BidCoverSheet = data.coverSheet;

    // REQUIRED by backend validateCoverSheet()
    form.append('companyName', cs.companyName);
    form.append('authorizedRepresentative', cs.representative || cs.authorizedRepresentative || '');
    form.append('companyEmail', cs.companyEmail);
    form.append('companyPhone', cs.companyPhone);
    form.append('totalBidValue', String(cs.totalBidValue));
    form.append('declarationAccepted', String(cs.declarationAccepted));

    // BUG-C1 FIX — dedicated key, NOT 'currency'
    form.append('coverSheetCurrency', cs.currency);

    // Optional fields
    if (cs.representative)        form.append('representative', cs.representative);
    if (cs.representativeTitle)   form.append('representativeTitle', cs.representativeTitle);
    if (cs.companyAddress)        form.append('companyAddress', cs.companyAddress);
    if (cs.tinNumber)             form.append('tinNumber', cs.tinNumber);
    if (cs.licenseNumber)         form.append('licenseNumber', cs.licenseNumber);
    if (cs.bidValidityPeriod != null)
      form.append('bidValidityPeriod', String(cs.bidValidityPeriod));
    if (cs.declarationAcceptedAt)
      form.append('declarationAcceptedAt', cs.declarationAcceptedAt);
  }

  // ── 2. Top-level bid fields ───────────────────────────────────────────────
  if (data.bidAmount !== undefined) form.append('bidAmount', String(data.bidAmount));
  if (data.currency)                form.append('currency', data.currency);
  if (data.technicalProposal)       form.append('technicalProposal', data.technicalProposal);
  if (data.financialProposal)       form.append('financialProposal', data.financialProposal);

  // ── 3. Bid security / CPO fields ─────────────────────────────────────────
  if (data.bidSecurityType)         form.append('bidSecurityType', data.bidSecurityType);
  if (data.cpoNumber)               form.append('cpoNumber', data.cpoNumber);
  if (data.cpoAmount !== undefined) form.append('cpoAmount', String(data.cpoAmount));
  if (data.cpoCurrency)             form.append('cpoCurrency', data.cpoCurrency);
  if (data.cpoIssuingBank)          form.append('cpoIssuingBank', data.cpoIssuingBank);
  if (data.cpoIssueDate)            form.append('cpoIssueDate', data.cpoIssueDate);
  if (data.cpoExpiryDate)           form.append('cpoExpiryDate', data.cpoExpiryDate);

  // ── 4. Financial breakdown — JSON string ──────────────────────────────────
  if (data.financialBreakdown) {
    // Handle both array and { items: [...] } formats
    let items: BidFinancialLineItem[];
    if (Array.isArray(data.financialBreakdown)) {
      items = data.financialBreakdown;
    } else if ((data.financialBreakdown as any).items) {
      items = (data.financialBreakdown as any).items;
    } else {
      items = [];
    }
    
    const validRows = items.filter((row) => row?.description?.trim());
    if (validRows.length > 0) {
      form.append('financialBreakdown', JSON.stringify({ items: validRows }));
    }
  }

  // ── 5. Documents — PARALLEL arrays (BUG-4a FIX) ──────────────────────────
  const invalidFiles = files.filter((f) => !f.documentType);
  if (invalidFiles.length > 0) {
    throw new Error(
      `BUG-4a: ${invalidFiles.length} file(s) missing documentType. ` +
      'Every FileEntry must include a documentType before submitting.',
    );
  }

  for (const { file, documentType } of files) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.append('documents', file as any);
    form.append('documentTypes', documentType);
  }

  // 🔍 DEBUG: Log all FormData entries
  console.log('📤 FormData entries:');
  // @ts-ignore - React Native FormData supports _parts
  const parts = (form as any)._parts || [];
  parts.forEach((part: any, i: number) => {
    const [key, value] = part;
    if (typeof value === 'string') {
      console.log(`  [${i}] ${key}: ${value.substring(0, 100)}`);
    } else {
      console.log(`  [${i}] ${key}: [File: ${value?.name || value?.uri || 'unknown'}]`);
    }
  });

  return form;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const bidService = {
  /**
   * POST /api/v1/bids/:tenderId
   * Bidder: submit a new bid.
   */
  async submitBid(
    tenderId: string,
    data: SubmitBidData,
    files: BidFileEntry[] = [],
  ): Promise<Bid> {
    console.log('📤 submitBid called');
    console.log('  tenderId:', tenderId);
    console.log('  data keys:', Object.keys(data));
    console.log('  files count:', files.length);
    
    const form = buildBidFormData(data, files);
    
    try {
      const response = await httpClient.post(`/bids/${tenderId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000, // 30 second timeout
      });
      console.log('✅ submitBid success:', response.status);
      return response.data?.data ?? response.data;
    } catch (error: any) {
      console.log('❌ submitBid error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      throw error;
    }
  },

  /**
   * GET /api/v1/bids/:tenderId
   * Owner: get all bids for a tender.
   */
  async getBids(tenderId: string): Promise<GetBidsResponse> {
    const response = await httpClient.get(`/bids/${tenderId}`);
    return response.data?.data ?? response.data;
  },

  /**
   * GET /api/v1/bids/:tenderId/my-bid
   * Bidder: get current user's bid for a tender.
   */
  async getMyBid(tenderId: string): Promise<Bid | null> {
    const response = await httpClient.get(`/bids/${tenderId}/my-bid`);
    return response.data?.data ?? response.data ?? null;
  },

  /**
   * PUT /api/v1/bids/:tenderId/:bidId
   * Bidder: update an existing submitted bid.
   */
  async updateBid(
    tenderId: string,
    bidId: string,
    data: Partial<SubmitBidData>,
    files: BidFileEntry[] = [],
  ): Promise<Bid> {
    console.log('📤 updateBid called');
    console.log('  tenderId:', tenderId, 'bidId:', bidId);
    console.log('  files count:', files.length);
    
    const form = buildBidFormData(data, files);
    
    try {
      const response = await httpClient.put(`/bids/${tenderId}/${bidId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      console.log('✅ updateBid success:', response.status);
      return response.data?.data ?? response.data;
    } catch (error: any) {
      console.log('❌ updateBid error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      throw error;
    }
  },

  /**
   * DELETE /api/v1/bids/:tenderId/:bidId
   */
  async withdrawBid(tenderId: string, bidId: string): Promise<void> {
    await httpClient.delete(`/bids/${tenderId}/${bidId}`);
  },

  /**
   * PATCH /api/v1/bids/:tenderId/:bidId/status
   */
  async updateBidStatus(
    tenderId: string,
    bidId: string,
    data: UpdateBidStatusData,
  ): Promise<Bid> {
    const response = await httpClient.patch(
      `/bids/${tenderId}/${bidId}/status`,
      data,
    );
    return response.data?.data ?? response.data;
  },

  /**
   * POST /api/v1/bids/:tenderId/:bidId/evaluate
   */
  async submitEvaluationScore(
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
    },
  ): Promise<{ evaluation: BidEvaluation; bidNumber: string }> {
    const response = await httpClient.post(
      `/bids/${tenderId}/${bidId}/evaluate`,
      data,
    );
    return response.data?.data ?? response.data;
  },

  /**
   * PATCH /api/v1/bids/:tenderId/:bidId/cpo/return
   */
  async verifyCPOReturn(
    tenderId: string,
    bidId: string,
    data: { returnStatus: 'returned' | 'forfeited'; returnNotes?: string },
  ): Promise<{ cpo: BidCPO }> {
    const response = await httpClient.patch(
      `/bids/${tenderId}/${bidId}/cpo/return`,
      data,
    );
    return response.data?.data ?? response.data;
  },

  /**
   * PATCH /api/v1/bids/:tenderId/:bidId/compliance
   */
  async updateComplianceChecklist(
    tenderId: string,
    bidId: string,
    complianceItems: ComplianceItem[],
  ): Promise<{ complianceChecklist: ComplianceItem[] }> {
    const response = await httpClient.patch(
      `/bids/${tenderId}/${bidId}/compliance`,
      { complianceChecklist: complianceItems },
    );
    return response.data?.data ?? response.data;
  },

  /**
   * GET /api/v1/bids/my-bids
   */
  async getMyAllBids(params?: BidListParams): Promise<MyAllBidsResponse> {
    const response = await httpClient.get('/bids/my-bids', { params });
    return response.data?.data ?? response.data;
  },

  /**
   * GET /api/v1/bids/:tenderId/:bidId/documents/:docId/download
   */
// In mobile bidService.ts, fix downloadBidDocument:
async downloadBidDocument(
  tenderId: string,
  bidId: string,
  docId: string,  // This is actually the _id, but the route expects :fileName
): Promise<Blob> {
  const response = await httpClient.get(
    `/bids/${tenderId}/${bidId}/documents/${docId}/download`,
    { responseType: 'blob' },
  );
  return response.data as Blob;
},
};

export default bidService;