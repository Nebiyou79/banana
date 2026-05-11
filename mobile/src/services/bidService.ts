// src/services/bidService.ts
// Module 7B — Bids
//
// CRITICAL RULES (read before touching):
//   BUG-C1 FIX  → coverSheet currency key MUST be 'coverSheetCurrency' in FormData
//   BUG-4a FIX  → files without a documentType are REJECTED before append — never skip
//   Parallel arrays → each file appends 'documents' (binary) + 'documentTypes' (string)
// ─────────────────────────────────────────────────────────────────────────────

import httpClient from '../lib/httpClient';
import {
  Bid,
  BidCoverSheet,
  BidDocumentType,
  BidFinancialLineItem,
  BidListParams,
  GetBidsResponse,
  MyAllBidsResponse,
  SubmitBidData,
  UpdateBidStatusData,
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
// Serialises cover sheet as FLAT individual FormData fields (NOT JSON).
// BUG-C1 FIX: currency → 'coverSheetCurrency'
// BUG-4a FIX: files without documentType throw before appending.
// ═══════════════════════════════════════════════════════════════════════════

function buildBidFormData(
  data: SubmitBidData,
  files: BidFileEntry[] = [],
): FormData {
  const form = new FormData();

  // ── 1. Cover sheet — FLAT fields (never JSON.stringify) ──────────────────
  const cs: BidCoverSheet = data.coverSheet;

  form.append('companyName',         cs.companyName);
  form.append('representative',      cs.representative);
  form.append('companyEmail',        cs.companyEmail);
  form.append('companyPhone',        cs.companyPhone);
  form.append('totalBidValue',       String(cs.totalBidValue));
  form.append('declarationAccepted', String(cs.declarationAccepted));

  // BUG-C1 FIX — must be 'coverSheetCurrency', never 'currency'
  form.append('coverSheetCurrency',  cs.currency);

  if (cs.representativeTitle)       form.append('representativeTitle', cs.representativeTitle);
  if (cs.companyAddress)            form.append('companyAddress',      cs.companyAddress);
  if (cs.tinNumber)                 form.append('tinNumber',           cs.tinNumber);
  if (cs.licenseNumber)             form.append('licenseNumber',       cs.licenseNumber);
  if (cs.bidValidityPeriod != null) form.append('bidValidityPeriod',   String(cs.bidValidityPeriod));
  if (cs.declarationAcceptedAt)     form.append('declarationAcceptedAt', cs.declarationAcceptedAt);

  // ── 2. Top-level bid fields ───────────────────────────────────────────────
  if (data.currency)           form.append('currency',          data.currency);
  if (data.technicalProposal)  form.append('technicalProposal', data.technicalProposal);

  // ── 3. Financial breakdown — JSON array ───────────────────────────────────
  if (data.financialBreakdown && data.financialBreakdown.length > 0) {
    const validRows: BidFinancialLineItem[] = data.financialBreakdown.filter(
      (row) => row.description?.trim(),
    );
    if (validRows.length > 0) {
      form.append('financialBreakdown', JSON.stringify(validRows));
    }
  }

  // ── 4. Documents — PARALLEL arrays (BUG-4a FIX) ──────────────────────────
  // Every file MUST have a documentType. Files without one are rejected here.
  const invalidFiles = files.filter((f) => !f.documentType);
  if (invalidFiles.length > 0) {
    throw new Error(
      `BUG-4a: ${invalidFiles.length} file(s) are missing a documentType. ` +
      'Every file must have a documentType before submitting.',
    );
  }

  for (const { file, documentType } of files) {
    // React Native FormData append — binary file
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.append('documents', file as any);
    // Matching type string at same index
    form.append('documentTypes', documentType);
  }

  return form;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const bidService = {
  /**
   * POST /api/v1/bids/:tenderId
   * Submit a new bid for a tender.
   */
  async submitBid(
    tenderId: string,
    data: SubmitBidData,
    files: BidFileEntry[] = [],
  ): Promise<Bid> {
    const form = buildBidFormData(data, files);
    const response = await httpClient.post(`/bids/${tenderId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data ?? response.data;
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
   * Returns null if no bid exists (404 is handled by the hook layer).
   */
  async getMyBid(tenderId: string): Promise<Bid | null> {
    const response = await httpClient.get(`/bids/${tenderId}/my-bid`);
    return response.data?.data ?? response.data ?? null;
  },

  /**
   * PUT /api/v1/bids/:tenderId/:bidId
   * Bidder: update a submitted bid.
   */
  async updateBid(
    tenderId: string,
    bidId: string,
    data: Partial<SubmitBidData>,
    files: BidFileEntry[] = [],
  ): Promise<Bid> {
    const form = buildBidFormData(data as SubmitBidData, files);
    const response = await httpClient.put(`/bids/${tenderId}/${bidId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data ?? response.data;
  },

  /**
   * DELETE /api/v1/bids/:tenderId/:bidId
   * Bidder: withdraw a submitted bid.
   */
  async withdrawBid(tenderId: string, bidId: string): Promise<void> {
    await httpClient.delete(`/bids/${tenderId}/${bidId}`);
  },

  /**
   * PATCH /api/v1/bids/:tenderId/:bidId/status
   * Owner: update bid status + optional notes.
   */
  async updateBidStatus(
    tenderId: string,
    bidId: string,
    data: UpdateBidStatusData,
  ): Promise<Bid> {
    const response = await httpClient.patch(`/bids/${tenderId}/${bidId}/status`, data);
    return response.data?.data ?? response.data;
  },

  /**
   * GET /api/v1/bids/my-bids
   * Bidder: all bids submitted by current company across all tenders.
   */
  async getMyAllBids(params?: BidListParams): Promise<MyAllBidsResponse> {
    const response = await httpClient.get('/bids/my-bids', { params });
    return response.data?.data ?? response.data;
  },

  /**
   * GET /api/v1/bids/:tenderId/:bidId/documents/:docId/download
   * Authenticated document download — returns Blob for mobile file handling.
   */
  async downloadBidDocument(
    tenderId: string,
    bidId: string,
    docId: string,
  ): Promise<Blob> {
    const response = await httpClient.get(
      `/bids/${tenderId}/${bidId}/documents/${docId}/download`,
      { responseType: 'blob' },
    );
    return response.data as Blob;
  },
};

export default bidService;
export { buildBidFormData };
