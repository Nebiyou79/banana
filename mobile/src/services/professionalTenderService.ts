// ─────────────────────────────────────────────────────────────────────────────
//  src/services/professionalTenderService.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Source of truth: server/src/controllers/professionalTenderController.js
//                   frontend/src/services/profesionalTenderService.ts
//
//  ⚠️  BUG FIXES BAKED IN:
//   • P-01  workflowType is sent as 'open' | 'closed'.  Any incoming
//           biddingType ('open'|'sealed') is normalized to workflowType
//           BEFORE building the FormData.
//   • P-14  preBidMeeting is appended as a TOP-LEVEL FormData key,
//           JSON.stringify'd.  It is NEVER nested inside `procurement`.
//   • All nested objects (procurement, eligibility, scope, evaluation,
//     preBidMeeting, performanceBond, contactPerson, financialCapacity,
//     pastProjectReferences) are JSON.stringify'd.
//   • Arrays (requiredCertifications, deliverables, milestones) are
//     JSON.stringify'd as a single field — the backend parses them back.
// ─────────────────────────────────────────────────────────────────────────────

import api from '../lib/api';
import type {
  AddendumData,
  CPOData,
  CreateProfessionalTenderData,
  MyProfessionalTendersFilters,
  ProfessionalTender,
  ProfessionalTenderBid,
  ProfessionalTenderDetailResponse,
  ProfessionalTenderFilters,
  ProfessionalTenderListResponse,
  UpdateProfessionalTenderData,
} from '../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  PATHS — base is `/api/v1` (set in lib/api.ts), so all paths start with `/`
// ═════════════════════════════════════════════════════════════════════════════

const BASE = '/professional-tenders';
const CATEGORIES_BASE = '/professional-tender-categories';

const PATHS = {
  create:        `${BASE}/create`,
  browse:        `${BASE}`,
  myTenders:     `${BASE}/my-tenders`,
  detail:        (id: string) => `${BASE}/${id}`,
  editData:      (id: string) => `${BASE}/${id}/edit-data`,
  update:        (id: string) => `${BASE}/${id}`,
  remove:        (id: string) => `${BASE}/${id}`,
  publish:       (id: string) => `${BASE}/${id}/publish`,
  /** ⚠ Backend exposes `/reveal-bids` (not `/reveal`).  Source of truth: routes file. */
  revealBids:    (id: string) => `${BASE}/${id}/reveal-bids`,
  addendum:      (id: string) => `${BASE}/${id}/addendum`,
  getAddenda:    (id: string) => `${BASE}/${id}/addendum`,
  cpo:           (id: string) => `${BASE}/${id}/cpo`,
  getCpo:        (id: string) => `${BASE}/${id}/cpo`,
  getBids:       (id: string) => `${BASE}/${id}/bids`,
  /** Categories endpoint — mirrors freelance pattern. Adjust if backend differs. */
  categories:    CATEGORIES_BASE,
} as const;

// ═════════════════════════════════════════════════════════════════════════════
//  FORMDATA HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * P-01: Normalize legacy `biddingType` → `workflowType` BEFORE serialization.
 *       Mobile callers should always send workflowType directly, but this
 *       guards against any reused payloads from the web frontend.
 */
function normalizeWorkflowType<T extends Record<string, any>>(payload: T): T {
  if ((payload as any).biddingType && !(payload as any).workflowType) {
    (payload as any).workflowType =
      (payload as any).biddingType === 'sealed' ? 'closed' : (payload as any).biddingType;
  }
  delete (payload as any).biddingType;
  return payload;
}

/**
 * P-14: preBidMeeting must be ROOT-LEVEL in the FormData.
 *       If a caller mistakenly nested it inside procurement, lift it out.
 */
function liftPreBidMeetingToRoot<T extends Record<string, any>>(payload: T): T {
  const proc = (payload as any).procurement;
  if (proc && typeof proc === 'object' && proc.preBidMeeting) {
    if (!(payload as any).preBidMeeting) {
      (payload as any).preBidMeeting = proc.preBidMeeting;
    }
    delete proc.preBidMeeting;
  }
  return payload;
}

/**
 * Strip the form-only `enabled` flag from preBidMeeting before sending.
 * The backend doesn't store it — it derives presence from the other fields.
 * If `enabled === false`, drop the whole object so we don't persist empty data.
 */
function sanitizePreBidMeeting<T extends Record<string, any>>(payload: T): T {
  const pbm = (payload as any).preBidMeeting;
  if (!pbm || typeof pbm !== 'object') return payload;

  if (pbm.enabled === false) {
    delete (payload as any).preBidMeeting;
    return payload;
  }

  // Only send when there's actually something to send
  if (!pbm.date && !pbm.location && !pbm.onlineLink) {
    delete (payload as any).preBidMeeting;
    return payload;
  }

  const { enabled: _enabled, ...rest } = pbm;
  (payload as any).preBidMeeting = rest;
  return payload;
}

/**
 * Set of fields that must be JSON.stringify'd when building FormData.
 * Includes preBidMeeting at root level (P-14).
 */
const JSON_FIELDS = new Set<string>([
  'procurement',
  'eligibility',
  'scope',
  'evaluation',
  'preBidMeeting',          // P-14: ROOT-LEVEL, JSON-encoded
  'performanceBond',
  'financialCapacity',
  'pastProjectReferences',
  'deliverables',
  'milestones',
  'contactPerson',
]);

/**
 * Builds a multipart FormData payload for create / update.
 * Files are appended under the `documents` key (matches backend multer config).
 */
export function buildProfessionalTenderFormData(
  data: CreateProfessionalTenderData | UpdateProfessionalTenderData,
  files?: File[] | Array<{ uri: string; name: string; type: string }>,
): FormData {
  // Clone so we never mutate the caller's payload
  const payload: Record<string, any> = { ...data };

  normalizeWorkflowType(payload);
  liftPreBidMeetingToRoot(payload);
  sanitizePreBidMeeting(payload);

  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (JSON_FIELDS.has(key) && typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
      return;
    }

    if (Array.isArray(value)) {
      // Arrays of primitives (e.g., requiredCertifications) — JSON.stringify
      // matches the frontend service pattern; backend `normalizeArrayFields`
      // accepts both repeated keys and JSON strings.
      formData.append(key, JSON.stringify(value));
      return;
    }

    if (typeof value === 'object') {
      // Defensive — any unlisted nested object still gets JSON-encoded.
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  });

  // ── Attachments ────────────────────────────────────────────────────────────
  if (files?.length) {
    files.forEach((f: any) => {
      // RN-style file objects ({ uri, name, type }) and web File objects both
      // serialize correctly via FormData.append in React Native.
      formData.append('documents', f);
    });
  }

  return formData;
}

/**
 * Builds FormData for an addendum.  Addenda also support attachments.
 */
function buildAddendumFormData(
  data: AddendumData,
  files?: Array<{ uri: string; name: string; type: string }> | File[],
): FormData {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('description', data.description);
  if (data.newDeadline) formData.append('newDeadline', data.newDeadline);

  if (files?.length) {
    files.forEach((f: any) => formData.append('documents', f));
  }
  return formData;
}

/**
 * Builds FormData for a CPO submission (single document).
 */
function buildCPOFormData(data: CPOData, file: { uri: string; name: string; type: string } | File): FormData {
  const formData = new FormData();
  formData.append('cpoNumber', data.cpoNumber);
  formData.append('amount', String(data.amount));
  if (data.currency) formData.append('currency', data.currency);
  if (data.issuingBank) formData.append('issuingBank', data.issuingBank);
  if (data.issueDate) formData.append('issueDate', data.issueDate);
  if (data.expiryDate) formData.append('expiryDate', data.expiryDate);
  formData.append('document', file as any);
  return formData;
}

/**
 * URLSearchParams from a filter object — drops undefined / null / '' values.
 */
function buildQueryString(filters?: Record<string, any>): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (v === 'all') return;                     // status='all' means no filter
    params.append(k, String(v));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ═════════════════════════════════════════════════════════════════════════════
//  RESPONSE ENVELOPE — backend always wraps in { success, data, message }
// ═════════════════════════════════════════════════════════════════════════════

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface DetailEnvelope {
  success: boolean;
  message?: string;
  data: ProfessionalTender;
  isOwner: boolean;
}

function unwrap<T>(envelope: ApiEnvelope<T>, fallbackError: string): T {
  if (!envelope?.success) {
    throw new Error(envelope?.message || fallbackError);
  }
  return envelope.data;
}

// ═════════════════════════════════════════════════════════════════════════════
//  SERVICE
// ═════════════════════════════════════════════════════════════════════════════

const professionalTenderService = {
  // ─── CREATE ────────────────────────────────────────────────────────────────
  createProfessionalTender: async (
    data: CreateProfessionalTenderData,
    files?: Array<{ uri: string; name: string; type: string }>,
  ): Promise<ProfessionalTender> => {
    const formData = buildProfessionalTenderFormData(data, files);
    const response = await api.post<ApiEnvelope<ProfessionalTender>>(
      PATHS.create,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return unwrap(response.data, 'Failed to create professional tender');
  },

  // ─── BROWSE ────────────────────────────────────────────────────────────────
  getProfessionalTenders: async (
    filters?: ProfessionalTenderFilters,
  ): Promise<ProfessionalTenderListResponse> => {
    const response = await api.get<ApiEnvelope<ProfessionalTenderListResponse>>(
      `${PATHS.browse}${buildQueryString(filters)}`,
    );
    return unwrap(response.data, 'Failed to fetch professional tenders');
  },

  // ─── MY TENDERS (owner) ────────────────────────────────────────────────────
  getMyPostedProfessionalTenders: async (
    filters?: MyProfessionalTendersFilters,
  ): Promise<ProfessionalTenderListResponse> => {
    const response = await api.get<ApiEnvelope<ProfessionalTenderListResponse>>(
      `${PATHS.myTenders}${buildQueryString(filters)}`,
    );
    return unwrap(response.data, 'Failed to fetch my professional tenders');
  },

  // ─── DETAIL (role-aware) ───────────────────────────────────────────────────
  /**
   * Returns the tender along with `isOwner` so callers can pick the right
   * screen (owner detail vs. public detail) and hide sealed contents
   * appropriately.
   */
  getProfessionalTender: async (id: string): Promise<ProfessionalTenderDetailResponse> => {
    const response = await api.get<DetailEnvelope>(PATHS.detail(id));
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to fetch professional tender');
    }
    return { data: response.data.data, isOwner: !!response.data.isOwner };
  },

  // ─── EDIT DATA (owner-only, draft) ─────────────────────────────────────────
  getProfessionalTenderEditData: async (id: string): Promise<ProfessionalTender> => {
    const response = await api.get<ApiEnvelope<ProfessionalTender>>(PATHS.editData(id));
    return unwrap(response.data, 'Failed to fetch edit data');
  },

  // ─── UPDATE (draft only — backend rejects with 400 otherwise) ──────────────
  updateProfessionalTender: async (
    id: string,
    data: UpdateProfessionalTenderData,
    files?: Array<{ uri: string; name: string; type: string }>,
  ): Promise<ProfessionalTender> => {
    const formData = buildProfessionalTenderFormData(data, files);
    const response = await api.put<ApiEnvelope<ProfessionalTender>>(
      PATHS.update(id),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return unwrap(response.data, 'Failed to update professional tender');
  },

  // ─── DELETE (soft) ─────────────────────────────────────────────────────────
  deleteProfessionalTender: async (id: string): Promise<void> => {
    const response = await api.delete<ApiEnvelope<null>>(PATHS.remove(id));
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to delete professional tender');
    }
  },

  // ─── STATUS TRANSITIONS ────────────────────────────────────────────────────
  publishProfessionalTender: async (id: string): Promise<ProfessionalTender> => {
    const response = await api.post<ApiEnvelope<ProfessionalTender>>(PATHS.publish(id));
    return unwrap(response.data, 'Failed to publish professional tender');
  },

  /**
   * Lock a sealed-bid tender (published → locked).
   * NOTE: The backend exposes `lockForSealedBid()` as a model method but no
   * REST route currently maps to it.  Hooks and screens reference this
   * method per the module spec; if/when the backend adds the route, only
   * this path string needs to change.
   */
  lockProfessionalTender: async (id: string): Promise<ProfessionalTender> => {
    const response = await api.post<ApiEnvelope<ProfessionalTender>>(`${BASE}/${id}/lock`);
    return unwrap(response.data, 'Failed to lock professional tender');
  },

  /** Reveal sealed bids (deadline_reached → revealed).  Closed workflow only. */
  revealProfessionalTender: async (id: string): Promise<{ bidsRevealed: number; tender?: ProfessionalTender }> => {
    const response = await api.post<ApiEnvelope<{ bidsRevealed: number; tender?: ProfessionalTender }>>(
      PATHS.revealBids(id),
    );
    return unwrap(response.data, 'Failed to reveal bids');
  },

  /**
   * Close the tender (manual close).
   * NOTE: Like `lock`, the backend has no dedicated `/close` route yet —
   * this path is reserved per the spec.  When implemented, the model's
   * status transitions handle the rest.
   */
  closeProfessionalTender: async (id: string): Promise<ProfessionalTender> => {
    const response = await api.post<ApiEnvelope<ProfessionalTender>>(`${BASE}/${id}/close`);
    return unwrap(response.data, 'Failed to close professional tender');
  },

  // ─── ADDENDUM ──────────────────────────────────────────────────────────────
  addAddendum: async (
    id: string,
    data: AddendumData,
    files?: Array<{ uri: string; name: string; type: string }>,
  ): Promise<{ _id: string; title: string; description: string; issuedAt: string }> => {
    const formData = buildAddendumFormData(data, files);
    const response = await api.post<ApiEnvelope<{ _id: string; title: string; description: string; issuedAt: string }>>(
      PATHS.addendum(id),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return unwrap(response.data, 'Failed to issue addendum');
  },

  // ─── CPO ───────────────────────────────────────────────────────────────────
  submitCPO: async (
    id: string,
    data: CPOData,
    file: { uri: string; name: string; type: string } | File,
  ): Promise<ProfessionalTender> => {
    const formData = buildCPOFormData(data, file);
    const response = await api.post<ApiEnvelope<ProfessionalTender>>(
      PATHS.cpo(id),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return unwrap(response.data, 'Failed to submit CPO');
  },

  // ─── BIDS (owner — only meaningful post-reveal for sealed tenders) ─────────
  /**
   * UI MUST also gate this with `areSealedBidsViewable(status, workflowType)`
   * before rendering bid amounts/identities.  The backend masks sealed data
   * but defense-in-depth in the client matters for the legally-significant
   * sealed-bid workflow.
   */
  getBidsForTender: async (id: string): Promise<ProfessionalTenderBid[]> => {
    const response = await api.get<ApiEnvelope<ProfessionalTenderBid[]>>(PATHS.getBids(id));
    return unwrap(response.data, 'Failed to fetch bids');
  },

  // ─── CATEGORIES ────────────────────────────────────────────────────────────
  /**
   * Fetches all professional-tender categories. Backend returns either an
   * array of strings or an array of { _id, name, description? } objects;
   * we normalize to a string array client-side.
   */
  getCategories: async (): Promise<string[]> => {
    const response = await api.get<ApiEnvelope<Array<string | { name: string }>>>(PATHS.categories);
    const raw = unwrap(response.data, 'Failed to fetch categories');
    if (!Array.isArray(raw)) return [];
    return raw
      .map((c) => (typeof c === 'string' ? c : c?.name))
      .filter((c): c is string => !!c && c.length > 0);
  },
};

export default professionalTenderService;
export {
  buildAddendumFormData,
  buildCPOFormData,
  buildQueryString,
  PATHS as PROFESSIONAL_TENDER_PATHS,
};