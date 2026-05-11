/**
 * src/models/companyPreview.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for company / organisation avatar resolution on the
 * frontend.  Mirrors the backend resolveOwnerPreview.js logic exactly.
 *
 * The canonical logo URL priority (highest → lowest):
 *   ownerPreview.logoUrl          ← new backend-synthesised field (Profile-backed)
 *   owner.avatarUrl               ← Cloudinary URL stored flat on doc
 *   owner.logoUrl                 ← legacy field
 *   owner.logo                    ← some older docs
 *   owner.profileImage            ← alternative naming
 *   owner.avatar (string only)    ← plain URL
 *   owner.avatar.secure_url       ← Cloudinary object (shouldn't reach frontend, but guard anyway)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type OwnerType = 'company' | 'organization';

/**
 * Canonical company/org preview — what every card and header component
 * should use internally after calling toCompanyPreview().
 */
export interface CompanyPreview {
  _id?: string;
  type: OwnerType;
  name: string;
  /** Always a resolved, valid HTTPS URL string — or undefined if none found */
  logoUrl?: string;
  verified?: boolean;
  industry?: string;
  website?: string;
}

// ─── Core resolver ────────────────────────────────────────────────────────────

/**
 * Resolve the best avatar URL from any raw owner object.
 *
 * Accepts any shape the backend might return:
 *   - new ownerPreview.logoUrl   (guaranteed resolved by backend)
 *   - legacy flat string fields  (avatarUrl, logoUrl, logo, profileImage, avatar)
 *   - Cloudinary object          ({ secure_url, public_id })
 *
 * Returns undefined (not null) so callers can use ?? cleanly.
 */
export const resolveLogoUrl = (
  owner: Record<string, any> | null | undefined,
): string | undefined => {
  if (!owner) return undefined;

  const isValidUrl = (v: unknown): v is string =>
    typeof v === 'string' && v.startsWith('http');

  const candidates: unknown[] = [
    // Priority 1 — backend-resolved ownerPreview.logoUrl (Profile-backed)
    owner.logoUrl,
    // Priority 2 — alternative flat field names
    owner.avatarUrl,
    owner.logo,
    owner.profileImage,
    // Priority 3 — plain `avatar` field (string only)
    typeof owner.avatar === 'string' ? owner.avatar : null,
    // Priority 4 — Cloudinary object (shouldn't reach frontend but guard anyway)
    typeof owner.avatar === 'object' && owner.avatar !== null
      ? (owner.avatar as Record<string, unknown>).secure_url
      : null,
  ];

  return candidates.find(isValidUrl) as string | undefined;
};

/**
 * Convert any raw owner object (Company, Organization, ownerPreview, etc.)
 * into a typed CompanyPreview.  Safe to call with null / undefined — returns
 * a sensible fallback.
 */
export const toCompanyPreview = (
  owner: Record<string, any> | null | undefined,
  type: OwnerType,
): CompanyPreview => ({
  _id:      owner?._id?.toString(),
  type,
  name:     owner?.name ?? (type === 'organization' ? 'Organization' : 'Company'),
  logoUrl:  resolveLogoUrl(owner),
  verified: owner?.verified ?? false,
  industry: owner?.industry ?? owner?.organizationType ?? undefined,
  website:  owner?.website ?? undefined,
});

/**
 * Convert a Job's embedded company or organization into a CompanyPreview.
 * Prefers job.ownerPreview (new backend field) then falls back to
 * job.company / job.organization directly.
 */
export const jobToCompanyPreview = (job: {
  jobType?: 'company' | 'organization';
  company?: Record<string, any> | null;
  organization?: Record<string, any> | null;
  ownerPreview?: Record<string, any> | null;
} | null | undefined): CompanyPreview => {
  if (!job) return { type: 'company', name: 'Company' };
  const isOrg = job.jobType === 'organization';
  const type: OwnerType = isOrg ? 'organization' : 'company';

  // Prefer the new backend-resolved ownerPreview snapshot
  if (job.ownerPreview) {
    return toCompanyPreview(job.ownerPreview, type);
  }

  const owner = isOrg ? job.organization : job.company;
  return toCompanyPreview(owner, type);
};

/**
 * Convert an Application's embedded job into a CompanyPreview.
 * Handles all nesting levels.
 */
export const applicationToCompanyPreview = (application: {
  job?: {
    jobType?: 'company' | 'organization';
    company?: Record<string, any> | null;
    organization?: Record<string, any> | null;
    ownerPreview?: Record<string, any> | null;
  } | null;
} | null | undefined): CompanyPreview => {
  return jobToCompanyPreview(application?.job);
};