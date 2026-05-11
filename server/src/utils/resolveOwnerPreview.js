/**
 * server/src/utils/resolveOwnerPreview.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for resolving a company / organisation owner's
 * avatar URL and building the ownerPreview snapshot that is attached to
 * Job and Application responses.
 *
 * Architecture mirrors ProductController.buildOwnerSnapshot exactly:
 *   1. Load the Company / Organisation document.
 *   2. Look up the linked Profile document (via company.user / org.user).
 *   3. Return profile.avatar.secure_url as the canonical logoUrl.
 *
 * This file is intentionally framework-free (no Express imports) so it can
 * be required from any controller without side-effects.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Company      = require('../models/Company');
const Organization = require('../models/Organization');
const Profile      = require('../models/Profile');

// ── internal helpers ──────────────────────────────────────────────────────────

/**
 * Resolve the best avatar URL from any raw owner document object.
 *
 * Priority (highest → lowest):
 *   profile.avatar.secure_url          ← Cloudinary via ProfileController
 *   owner.avatarUrl                    ← flat string field on Company/Org doc
 *   owner.logoUrl                      ← legacy logo field
 *   owner.logo                         ← some older documents use this
 *   owner.profileImage                 ← alternative naming
 *   owner.avatar (string only)         ← plain URL stored directly
 *
 * Cloudinary object shapes (e.g. { public_id, secure_url }) are unwrapped
 * at the `profileAvatarSecureUrl` parameter; this helper only handles the
 * flat string fields that live directly on the Company/Org document.
 */
const resolveRawLogoUrl = (ownerDoc, profileAvatarSecureUrl) => {
  if (profileAvatarSecureUrl && typeof profileAvatarSecureUrl === 'string' && profileAvatarSecureUrl.startsWith('http')) {
    return profileAvatarSecureUrl;
  }

  const candidates = [
    ownerDoc?.avatarUrl,
    ownerDoc?.logoUrl,
    ownerDoc?.logo,
    ownerDoc?.profileImage,
    // Guard against Cloudinary objects stored directly on the doc
    (ownerDoc?.avatar && typeof ownerDoc.avatar === 'string') ? ownerDoc.avatar : null,
    (ownerDoc?.avatar?.secure_url)                           ? ownerDoc.avatar.secure_url : null,
  ];

  return candidates.find(v => typeof v === 'string' && v.startsWith('http')) || null;
};

/**
 * Fetch the Profile record for a given userId and extract
 * the Cloudinary avatar.secure_url.
 * Returns null if no profile or no avatar is found.
 */
const fetchProfileAvatarUrl = async (userId) => {
  if (!userId) return null;
  try {
    const profile = await Profile.findOne({ user: userId })
      .select('avatar')
      .lean();
    return profile?.avatar?.secure_url || null;
  } catch {
    return null;
  }
};

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Build a compact ownerPreview from a raw Mongoose lean() company document.
 *
 * If the document already has a `user` ref, the Profile is looked up to
 * get the Cloudinary avatar (same as ProductController.buildOwnerSnapshot).
 *
 * @param {object|null} ownerDoc  - lean() Company or Organization document
 * @param {'company'|'organization'} type
 * @returns {Promise<object>}
 */
const buildOwnerPreviewFromDoc = async (ownerDoc, type = 'company') => {
  if (!ownerDoc) {
    return { type, name: type === 'organization' ? 'Organization' : 'Company', logoUrl: null, verified: false };
  }

  // Identical flow to ProductController.buildOwnerSnapshot
  const profileAvatarUrl = await fetchProfileAvatarUrl(ownerDoc.user);
  const logoUrl = resolveRawLogoUrl(ownerDoc, profileAvatarUrl);

  return {
    _id:            ownerDoc._id?.toString() || null,
    type,
    name:           ownerDoc.name           || (type === 'organization' ? 'Organization' : 'Company'),
    logoUrl,
    avatarUrl:      logoUrl,                 // alias — frontend checks both
    avatarPublicId: ownerDoc.avatarPublicId  || null,
    verified:       ownerDoc.verified        || false,
    industry:       ownerDoc.industry        || ownerDoc.organizationType || null,
    website:        ownerDoc.website         || null,
  };
};

/**
 * Build ownerPreview by loading the Company document from DB.
 * Call this when you only have a company ID (e.g. during job creation).
 *
 * @param {string|ObjectId} companyId
 * @returns {Promise<object>}
 */
const buildCompanyOwnerPreview = async (companyId) => {
  if (!companyId) return { type: 'company', name: 'Company', logoUrl: null, verified: false };
  try {
    const company = await Company.findById(companyId).lean();
    return buildOwnerPreviewFromDoc(company, 'company');
  } catch {
    return { type: 'company', name: 'Company', logoUrl: null, verified: false };
  }
};

/**
 * Build ownerPreview by loading the Organization document from DB.
 *
 * @param {string|ObjectId} orgId
 * @returns {Promise<object>}
 */
const buildOrganizationOwnerPreview = async (orgId) => {
  if (!orgId) return { type: 'organization', name: 'Organization', logoUrl: null, verified: false };
  try {
    const org = await Organization.findById(orgId).lean();
    return buildOwnerPreviewFromDoc(org, 'organization');
  } catch {
    return { type: 'organization', name: 'Organization', logoUrl: null, verified: false };
  }
};

/**
 * Build ownerPreview from a populated (or lean) job document.
 * Works on any job object regardless of whether it came from .lean() or
 * .populate(), because it accepts the already-hydrated company/org object.
 *
 * @param {object} job - populated job doc (company/organization already populated)
 * @returns {Promise<object>}
 */
const buildOwnerPreviewFromJob = async (job) => {
  if (!job) return null;
  const isOrg  = job.jobType === 'organization';
  const owner  = isOrg ? job.organization : job.company;
  const type   = isOrg ? 'organization' : 'company';
  return buildOwnerPreviewFromDoc(owner, type);
};

/**
 * Enrich an array of lean job objects with ownerPreview in parallel.
 * Mutates each job object (adds job.ownerPreview).
 *
 * @param {object[]} jobs - array of lean job objects
 * @returns {Promise<object[]>} same array, mutated
 */
const enrichJobsWithOwnerPreview = async (jobs) => {
  if (!Array.isArray(jobs) || jobs.length === 0) return jobs;
  await Promise.all(
    jobs.map(async (job) => {
      job.ownerPreview = await buildOwnerPreviewFromJob(job);
    })
  );
  return jobs;
};

/**
 * Enrich an array of lean application objects with ownerPreview on job.
 * Mutates each application.job object.
 *
 * @param {object[]} applications
 * @returns {Promise<object[]>}
 */
const enrichApplicationsWithOwnerPreview = async (applications) => {
  if (!Array.isArray(applications) || applications.length === 0) return applications;
  await Promise.all(
    applications.map(async (app) => {
      if (app.job) {
        app.job.ownerPreview = await buildOwnerPreviewFromJob(app.job);
      }
    })
  );
  return applications;
};

// ── The populate projection string every controller should use ─────────────────
// Include the `user` ref so buildOwnerPreviewFromDoc can look up the Profile.
const COMPANY_POPULATE_SELECT =
  'name logoUrl logo avatar avatarUrl profileImage avatarPublicId verified industry website user';

const ORGANIZATION_POPULATE_SELECT =
  'name logoUrl logo avatar avatarUrl profileImage avatarPublicId verified industry organizationType website mission user';

module.exports = {
  // Core builders
  buildOwnerPreviewFromDoc,
  buildOwnerPreviewFromJob,
  buildCompanyOwnerPreview,
  buildOrganizationOwnerPreview,

  // Batch enrichment helpers
  enrichJobsWithOwnerPreview,
  enrichApplicationsWithOwnerPreview,

  // Populate projection strings
  COMPANY_POPULATE_SELECT,
  ORGANIZATION_POPULATE_SELECT,

  // Exposed for unit tests
  resolveRawLogoUrl,
  fetchProfileAvatarUrl,
};