/**
 * mobile/src/constants/api.ts  (UPDATED — PRODUCTS section)
 *
 * Only the PRODUCTS block is shown.  Merge the new entries into your
 * existing constants file; all other sections remain unchanged.
 */

const BASE = '/api/v1';

// ── Products ──────────────────────────────────────────────────────────────────
export const PRODUCTS = {
  LIST:           `${BASE}/products`,
  DETAIL:         (id: string) => `${BASE}/products/${id}`,
  CREATE:         `${BASE}/products`,
  UPDATE:         (id: string) => `${BASE}/products/${id}`,
  DELETE:         (id: string) => `${BASE}/products/${id}`,
  UPDATE_STATUS:  (id: string) => `${BASE}/products/${id}/status`,
  CATEGORIES:     `${BASE}/products/categories`,
  FEATURED:       `${BASE}/products/featured`,
  COMPANY:        (companyId: string) => `${BASE}/products/company/${companyId}`,
  RELATED:        (id: string) => `${BASE}/products/${id}/related`,
  SAVE:           (id: string) => `${BASE}/products/${id}/save`,
  SAVED:          `${BASE}/products/saved`,
};
