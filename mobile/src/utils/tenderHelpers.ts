// src/utils/tenderHelpers.ts
// Safe helpers for extracting tender properties from hook responses
// Handles cases where deadline/workflowType might be optional or malformed
// ─────────────────────────────────────────────────────────────────────────────

import type { ProfessionalTender, ProfessionalTenderDetailResponse } from '../types/professionalTender';
import type { WorkflowType } from '../types/bid';

/**
 * Safely extract deadline as a string from any tender-like object.
 * Returns current ISO date as fallback if deadline is missing/invalid.
 */
export function getSafeDeadline(
  tender: ProfessionalTender | ProfessionalTenderDetailResponse | null | undefined
): string {
  if (!tender) return new Date().toISOString();
  
  // Handle ProfessionalTenderDetailResponse wrapper
  const data = 'data' in tender ? (tender as ProfessionalTenderDetailResponse).data : tender;
  if (!data) return new Date().toISOString();
  
  const deadline = (data as any).deadline;
  
  // If deadline is a function (unlikely but handles the TS error), call it
  if (typeof deadline === 'function') {
    try {
      return deadline() ?? new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
  
  // If it's a string, use it; otherwise fallback
  if (typeof deadline === 'string' && deadline.length > 0) {
    return deadline;
  }
  
  return new Date().toISOString();
}

/**
 * Safely extract workflowType as 'open' | 'closed'.
 * Defaults to 'open' if missing or invalid.
 */
export function getSafeWorkflowType(
  tender: ProfessionalTender | ProfessionalTenderDetailResponse | null | undefined
): WorkflowType {
  if (!tender) return 'open';
  
  const data = 'data' in tender ? (tender as ProfessionalTenderDetailResponse).data : tender;
  if (!data) return 'open';
  
  const wt = (data as any).workflowType;
  
  if (wt === 'closed') return 'closed';
  return 'open';
}

/**
 * Check if a tender is a sealed tender.
 */
export function isSealedTender(
  tender: ProfessionalTender | ProfessionalTenderDetailResponse | null | undefined
): boolean {
  return getSafeWorkflowType(tender) === 'closed';
}