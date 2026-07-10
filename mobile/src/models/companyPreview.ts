/**
 * src/models/companyPreview.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for company / organisation avatar resolution on the
 * frontend.  Mirrors the backend resolveOwnerPreview.js logic exactly.
 *
 * The canonical logo URL priority (highest → lowest):
 *   1. ownerPreview.logoUrl          ← Profile.avatar.secure_url (from backend)
 *   2. ownerPreview.avatarUrl        ← same Cloudinary URL
 *   3. owner.avatarUrl               ← flat Cloudinary URL on doc
 *   4. owner.logoUrl                 ← legacy field
 *   5. owner.logo                    ← older docs
 *   6. owner.profileImage            ← alternative naming
 *   7. owner.avatar (string)         ← plain URL
 *   8. owner.avatar.secure_url       ← Cloudinary object (edge case)
 *
 * DEBUG MODE — dumps actual field VALUES to trace empty string vs null issue
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════════════════════
// DEBUG CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
const DEBUG_RESOLVE = __DEV__ && true;

const debugLog = (message: string, data?: any) => {
  if (!DEBUG_RESOLVE) return;
  console.log(`🏢 [companyPreview] ${message}`);
  if (data !== undefined) console.log(JSON.stringify(data, null, 2));
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type OwnerType = 'company' | 'organization';

export interface CompanyPreview {
  _id?: string;
  type: OwnerType;
  name: string;
  /** Always a resolved, valid HTTPS URL string — or undefined if none found */
  logoUrl?: string;
  /** Alternative field — same value as logoUrl */
  avatarUrl?: string;
  /** Cloudinary public_id if available */
  avatarPublicId?: string;
  verified?: boolean;
  industry?: string;
  website?: string;
}

// ─── Sanitizer ────────────────────────────────────────────────────────────────

/**
 * Sanitize a CompanyPreview to ensure empty strings are converted to undefined.
 * This handles the case where the backend returns "" instead of null.
 */
export const sanitizePreview = (preview: CompanyPreview): CompanyPreview => {
  const sanitized = { ...preview };

  // Convert empty strings to undefined for URL fields
  if (sanitized.logoUrl !== undefined) {
    const val = String(sanitized.logoUrl).trim();
    sanitized.logoUrl = val.length > 0 && (val.startsWith('http') || val.startsWith('/')) 
      ? val 
      : undefined;
  }

  if (sanitized.avatarUrl !== undefined) {
    const val = String(sanitized.avatarUrl).trim();
    sanitized.avatarUrl = val.length > 0 && (val.startsWith('http') || val.startsWith('/')) 
      ? val 
      : undefined;
  }

  if (sanitized.avatarPublicId !== undefined) {
    const val = String(sanitized.avatarPublicId).trim();
    sanitized.avatarPublicId = val.length > 0 ? val : undefined;
  }

  return sanitized;
};

// ─── Core resolver ────────────────────────────────────────────────────────────

/**
 * Resolve the best avatar URL from any raw owner object.
 *
 * Accepts any shape the backend might return:
 *   - ownerPreview.logoUrl   (Profile.avatar.secure_url from backend)
 *   - ownerPreview.avatarUrl (same)
 *   - legacy flat string fields (avatarUrl, logoUrl, logo, profileImage, avatar)
 *   - Cloudinary object ({ secure_url, public_id })
 *
 * Returns undefined (not null) so callers can use ?? cleanly.
 */
export const resolveLogoUrl = (
  owner: Record<string, any> | null | undefined,
): string | undefined => {
  if (!owner) {
    debugLog('resolveLogoUrl: owner is null/undefined');
    return undefined;
  }

  // DEBUG: Dump ACTUAL field values to see if they're empty strings
  debugLog('resolveLogoUrl: ACTUAL FIELD VALUES:', {
    'logoUrl': owner.logoUrl !== undefined && owner.logoUrl !== null 
      ? `"${String(owner.logoUrl).substring(0, 100)}"` 
      : String(owner.logoUrl),
    'logoUrl type': typeof owner.logoUrl,
    'logoUrl truthy': !!owner.logoUrl,
    'avatarUrl': owner.avatarUrl !== undefined && owner.avatarUrl !== null 
      ? `"${String(owner.avatarUrl).substring(0, 100)}"` 
      : String(owner.avatarUrl),
    'avatarUrl type': typeof owner.avatarUrl,
    'avatarUrl truthy': !!owner.avatarUrl,
    'logo': owner.logo !== undefined && owner.logo !== null 
      ? `"${String(owner.logo).substring(0, 100)}"` 
      : String(owner.logo),
    'logo type': typeof owner.logo,
    'logo truthy': !!owner.logo,
    'avatar': owner.avatar !== undefined && owner.avatar !== null 
      ? (typeof owner.avatar === 'object' ? JSON.stringify(owner.avatar).substring(0, 100) : `"${String(owner.avatar).substring(0, 100)}"`)
      : String(owner.avatar),
    'avatar type': typeof owner.avatar,
    'profileImage': owner.profileImage !== undefined && owner.profileImage !== null 
      ? `"${String(owner.profileImage).substring(0, 100)}"` 
      : String(owner.profileImage),
    'profileImage type': typeof owner.profileImage,
  });

  const isValidUrl = (v: unknown): v is string => {
    // Must be a string
    if (typeof v !== 'string') return false;
    // Must not be empty or whitespace-only
    if (v.trim().length === 0) return false;
    // Must start with http or / (relative path)
    if (!(v.startsWith('http') || v.startsWith('/'))) return false;
    return true;
  };

  // Priority-ordered candidate list
  const candidates: Array<{ source: string; value: unknown }> = [
    { source: 'logoUrl',       value: owner.logoUrl },
    { source: 'avatarUrl',     value: owner.avatarUrl },
    { source: 'logo',          value: owner.logo },
    { source: 'profileImage',  value: owner.profileImage },
    { source: 'avatar (string)', value: typeof owner.avatar === 'string' ? owner.avatar : null },
    { source: 'avatar.secure_url', value: (owner.avatar && typeof owner.avatar === 'object' && owner.avatar.secure_url) ? owner.avatar.secure_url : null },
    { source: 'avatar.url',    value: (owner.avatar && typeof owner.avatar === 'object' && owner.avatar.url) ? owner.avatar.url : null },
  ];

  for (const { source, value } of candidates) {
    if (value !== null && value !== undefined) {
      if (isValidUrl(value)) {
        debugLog(`✅ resolveLogoUrl: FOUND from "${source}"`, { url: (value as string).substring(0, 100) });
        return (value as string).trim();
      } else {
        // Log WHY this candidate was rejected
        const reason = typeof value !== 'string' 
          ? `not a string (${typeof value})` 
          : value.trim().length === 0 
            ? 'empty string' 
            : `doesn't start with http or / ("${value.substring(0, 40)}")`;
        debugLog(`❌ resolveLogoUrl: "${source}" rejected — ${reason}`);
      }
    }
  }

  debugLog('⚠️ resolveLogoUrl: NO valid URL found in any field — ALL candidates exhausted');
  return undefined;
};

/**
 * Convert any raw owner object (Company, Organization, ownerPreview, etc.)
 * into a typed CompanyPreview.  Safe to call with null / undefined — returns
 * a sensible fallback.
 */
export const toCompanyPreview = (
  owner: Record<string, any> | null | undefined,
  type: OwnerType,
): CompanyPreview => {
  const resolvedUrl = resolveLogoUrl(owner);
  const preview: CompanyPreview = {
    _id:      owner?._id?.toString(),
    type,
    name:     owner?.name ?? (type === 'organization' ? 'Organization' : 'Company'),
    logoUrl:  resolvedUrl,
    avatarUrl: resolvedUrl,
    avatarPublicId: owner?.avatarPublicId ?? undefined,
    verified: owner?.verified ?? false,
    industry: owner?.industry ?? owner?.organizationType ?? undefined,
    website:  owner?.website ?? undefined,
  };

  // Sanitize to convert empty strings to undefined
  return sanitizePreview(preview);
};

/**
 * Convert a Job's embedded company or organization into a CompanyPreview.
 * Prefers job.ownerPreview (new backend field with Profile.avatar.secure_url),
 * then falls back to job.company / job.organization directly.
 */
export const jobToCompanyPreview = (job: {
  jobType?: 'company' | 'organization';
  company?: Record<string, any> | null;
  organization?: Record<string, any> | null;
  ownerPreview?: Record<string, any> | null;
} | null | undefined): CompanyPreview => {
  if (!job) {
    debugLog('jobToCompanyPreview: job is null/undefined');
    return sanitizePreview({ type: 'company', name: 'Company' });
  }

  debugLog('jobToCompanyPreview:', {
    jobType: job.jobType,
    hasOwnerPreview: !!job.ownerPreview,
    hasCompany: !!job.company,
    hasOrganization: !!job.organization,
  });

  const isOrg = job.jobType === 'organization';
  const type: OwnerType = isOrg ? 'organization' : 'company';

  // PREFER the backend-resolved ownerPreview (Profile.avatar.secure_url)
  if (job.ownerPreview) {
    debugLog('jobToCompanyPreview: Using ownerPreview');
    debugLog('jobToCompanyPreview: ownerPreview raw data:', {
      _id: job.ownerPreview._id,
      type: job.ownerPreview.type,
      name: job.ownerPreview.name,
      logoUrl: `${JSON.stringify(job.ownerPreview.logoUrl)}`,
      avatarUrl: `${JSON.stringify(job.ownerPreview.avatarUrl)}`,
      avatarPublicId: `${JSON.stringify(job.ownerPreview.avatarPublicId)}`,
      verified: job.ownerPreview.verified,
    });
    return toCompanyPreview(job.ownerPreview, type);
  }

  // FALLBACK to raw populated sub-doc
  const owner = isOrg ? job.organization : job.company;
  debugLog('jobToCompanyPreview: Falling back to raw owner doc');
  if (owner) {
    debugLog('jobToCompanyPreview: raw owner data:', {
      _id: owner._id,
      name: owner.name,
      logoUrl: `${JSON.stringify(owner.logoUrl)}`,
      logo: `${JSON.stringify(owner.logo)}`,
      avatarUrl: `${JSON.stringify(owner.avatarUrl)}`,
      avatar: `${JSON.stringify(owner.avatar)}`,
      profileImage: `${JSON.stringify(owner.profileImage)}`,
    });
  }
  return toCompanyPreview(owner, type);
};

/**
 * Convert an Application's embedded job into a CompanyPreview.
 */
export const applicationToCompanyPreview = (application: {
  job?: {
    jobType?: 'company' | 'organization';
    company?: Record<string, any> | null;
    organization?: Record<string, any> | null;
    ownerPreview?: Record<string, any> | null;
  } | null;
} | null | undefined): CompanyPreview => {
  if (!application) {
    debugLog('applicationToCompanyPreview: application is null/undefined');
    return sanitizePreview({ type: 'company', name: 'Company' });
  }

  debugLog('applicationToCompanyPreview:', {
    hasJob: !!application.job,
    jobType: application.job?.jobType,
    hasOwnerPreview: !!application.job?.ownerPreview,
    hasCompany: !!application.job?.company,
    hasOrganization: !!application.job?.organization,
  });

  if (application.job?.ownerPreview) {
    debugLog('applicationToCompanyPreview: ownerPreview raw data:', {
      _id: application.job.ownerPreview._id,
      type: application.job.ownerPreview.type,
      name: application.job.ownerPreview.name,
      logoUrl: `${JSON.stringify(application.job.ownerPreview.logoUrl)}`,
      avatarUrl: `${JSON.stringify(application.job.ownerPreview.avatarUrl)}`,
    });
  }

  return jobToCompanyPreview(application.job);
};

/**
 * Debug helper: Print full job object avatar fields to console.
 * Call this from screens to see exactly what the API returned.
 */
export const debugJobAvatarFields = (job: any, label: string = 'Job') => {
  if (!DEBUG_RESOLVE || !job) return;

  console.log(`\n📋 [DEBUG] ${label} — Full avatar-related fields:`);
  console.log(`  job._id: ${job._id}`);
  console.log(`  job.jobType: ${job.jobType}`);
  console.log(`  job.title: ${job.title}`);

  if (job.ownerPreview) {
    console.log(`  ✅ ownerPreview EXISTS:`);
    console.log(`     _id: ${job.ownerPreview._id}`);
    console.log(`     type: ${job.ownerPreview.type}`);
    console.log(`     name: ${job.ownerPreview.name}`);
    console.log(`     logoUrl: ${JSON.stringify(job.ownerPreview.logoUrl)} (type: ${typeof job.ownerPreview.logoUrl}, length: ${String(job.ownerPreview.logoUrl || '').length})`);
    console.log(`     avatarUrl: ${JSON.stringify(job.ownerPreview.avatarUrl)} (type: ${typeof job.ownerPreview.avatarUrl}, length: ${String(job.ownerPreview.avatarUrl || '').length})`);
    console.log(`     avatarPublicId: ${JSON.stringify(job.ownerPreview.avatarPublicId)}`);
    console.log(`     verified: ${job.ownerPreview.verified}`);
    console.log(`     industry: ${job.ownerPreview.industry}`);
    console.log(`     ALL keys: [${Object.keys(job.ownerPreview).join(', ')}]`);
  } else {
    console.log(`  ❌ ownerPreview: NOT PRESENT`);
  }

  if (job.company) {
    console.log(`  company EXISTS:`);
    console.log(`     _id: ${job.company._id}`);
    console.log(`     name: ${job.company.name}`);
    console.log(`     logoUrl: ${JSON.stringify(job.company.logoUrl)} (type: ${typeof job.company.logoUrl})`);
    console.log(`     logo: ${JSON.stringify(job.company.logo)} (type: ${typeof job.company.logo})`);
    console.log(`     avatarUrl: ${JSON.stringify(job.company.avatarUrl)} (type: ${typeof job.company.avatarUrl})`);
    console.log(`     avatar: ${JSON.stringify(job.company.avatar)} (type: ${typeof job.company.avatar})`);
    console.log(`     profileImage: ${JSON.stringify(job.company.profileImage)}`);
    console.log(`     avatarPublicId: ${JSON.stringify(job.company.avatarPublicId)}`);
    console.log(`     verified: ${job.company.verified}`);
    console.log(`     user: ${job.company.user}`);
    console.log(`     ALL keys: [${Object.keys(job.company).join(', ')}]`);
  } else {
    console.log(`  ❌ company: NOT PRESENT`);
  }

  if (job.organization) {
    console.log(`  organization EXISTS:`);
    console.log(`     _id: ${job.organization._id}`);
    console.log(`     name: ${job.organization.name}`);
    console.log(`     logoUrl: ${JSON.stringify(job.organization.logoUrl)}`);
    console.log(`     logo: ${JSON.stringify(job.organization.logo)}`);
    console.log(`     avatarUrl: ${JSON.stringify(job.organization.avatarUrl)}`);
    console.log(`     ALL keys: [${Object.keys(job.organization).join(', ')}]`);
  } else {
    console.log(`  ❌ organization: NOT PRESENT`);
  }
  console.log(`  ─────────────────────────────────────\n`);
};

/**
 * Debug helper: Print full application job avatar fields to console.
 */
export const debugApplicationAvatarFields = (app: any, label: string = 'Application') => {
  if (!DEBUG_RESOLVE || !app) return;

  console.log(`\n📋 [DEBUG] ${label} — Application avatar fields:`);
  console.log(`  app._id: ${app._id}`);
  if (app.job) {
    debugJobAvatarFields(app.job, `${label}.job`);
  } else {
    console.log(`  ❌ app.job: NOT PRESENT`);
  }
};