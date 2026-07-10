/**
 * server/src/utils/resolveOwnerPreview.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for company/organization logo/avatar resolution.
 * 
 * FIXED: Falls back to direct Company/Organization lookup when `user` is
 * not populated by Mongoose.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Profile = require('../models/Profile');

// ─── Populate projections ────────────────────────────────────────────────────

const COMPANY_POPULATE_SELECT = [
  '_id', 'name',
  'logoUrl', 'logo',
  'avatarUrl', 'avatar',
  'profileImage',
  'avatarPublicId',
  'verified', 'industry', 'website',
  'user',
].join(' ');

const ORGANIZATION_POPULATE_SELECT = [
  '_id', 'name',
  'logoUrl', 'logo',
  'avatarUrl', 'avatar',
  'profileImage',
  'avatarPublicId',
  'verified', 'industry', 'organizationType', 'website',
  'user',
].join(' ');

// ─── Core resolver ────────────────────────────────────────────────────────────

const resolveLogoUrl = (owner) => {
  if (!owner) return null;
  if (owner._profileAvatarUrl) return owner._profileAvatarUrl;

  const candidates = [
    owner.avatarUrl,
    owner.logoUrl,
    owner.logo,
    owner.profileImage,
    typeof owner.avatar === 'string' ? owner.avatar : null,
    (owner.avatar && typeof owner.avatar === 'object') ? owner.avatar.secure_url : null,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
};

// ─── Owner preview builder ───────────────────────────────────────────────────

const buildOwnerPreviewFromJob = async (job) => {
  if (!job) return null;

  const isOrg = job.jobType === 'organization';
  const owner = isOrg ? job.organization : job.company;

  if (!owner) {
    console.log('⚠️ [resolveOwnerPreview] No owner on job');
    return null;
  }

  const type = isOrg ? 'organization' : 'company';
  const ownerName = owner.name || (isOrg ? 'Organization' : 'Company');

  console.log(`\n🔍 [resolveOwnerPreview] Building preview for: "${ownerName}" (${type})`);
  console.log(`   owner._id: ${owner._id}`);
  console.log(`   owner.user (from populate): ${owner.user} (type: ${typeof owner.user})`);

  const preview = {
    _id: owner._id?.toString(),
    type,
    name: ownerName,
    logoUrl: null,
    avatarUrl: null,
    avatarPublicId: null,
    verified: owner.verified || false,
    industry: owner.industry || owner.organizationType || null,
    website: owner.website || null,
  };

  // ── Get the user ID ────────────────────────────────────────────────────────
  let ownerUserId = owner.user;

  // CRITICAL FIX: If user is not populated, look it up directly
  if (!ownerUserId && owner._id) {
    try {
      console.log(`   🔄 user not populated — doing direct ${isOrg ? 'Organization' : 'Company'} lookup...`);
      const modelToUse = isOrg 
        ? require('../models/Organization') 
        : require('../models/Company');
      const fullDoc = await modelToUse.findById(owner._id).select('user logoUrl logo avatarUrl avatar profileImage').lean();
      
      if (fullDoc) {
        console.log(`   Direct lookup result - user: ${fullDoc.user}, logoUrl: "${fullDoc.logoUrl}", avatarUrl: "${fullDoc.avatarUrl}"`);
        ownerUserId = fullDoc.user;
        
        // Also check for logo fields from the direct lookup
        if (!preview.logoUrl) {
          const directLogo = resolveLogoUrl(fullDoc);
          if (directLogo) {
            console.log(`   ✅ Found logo via direct lookup: ${directLogo.substring(0, 80)}`);
            preview.logoUrl = directLogo;
            preview.avatarUrl = directLogo;
            return preview;
          }
        }
      }
    } catch (err) {
      console.warn(`   ⚠️ Direct lookup error: ${err.message}`);
    }
  }

  // ── Try Profile lookup ─────────────────────────────────────────────────────
  if (ownerUserId) {
    try {
      const userId = typeof ownerUserId === 'object' ? ownerUserId._id || ownerUserId : ownerUserId;
      console.log(`   Looking up Profile for user: ${userId}`);
      
      const profile = await Profile.findOne({ user: userId }).select('avatar').lean();
      
      if (profile?.avatar?.secure_url) {
        console.log(`   ✅ Profile.avatar.secure_url: ${profile.avatar.secure_url.substring(0, 80)}`);
        preview.logoUrl = profile.avatar.secure_url;
        preview.avatarUrl = profile.avatar.secure_url;
        preview.avatarPublicId = profile.avatar.public_id || null;
        return preview;
      } else {
        console.log(`   ❌ No Profile avatar (secure_url empty or profile missing)`);
      }
    } catch (err) {
      console.warn(`   ⚠️ Profile lookup error: ${err.message}`);
    }
  } else {
    console.log(`   ⚠️ No user ref — cannot look up Profile`);
  }

  // ── Fallback to Company/Organization doc fields ────────────────────────────
  if (!preview.logoUrl) {
    const resolvedUrl = resolveLogoUrl(owner);
    if (resolvedUrl) {
      console.log(`   ✅ Using fallback from owner doc: ${resolvedUrl.substring(0, 80)}`);
      preview.logoUrl = resolvedUrl;
      preview.avatarUrl = resolvedUrl;
    } else {
      console.log(`   ❌ NO logo/avatar found — will show initials`);
    }
  }

  return preview;
};

const enrichJobsWithOwnerPreview = async (jobs) => {
  if (!jobs || !Array.isArray(jobs)) return;
  await Promise.all(jobs.map(async (job) => {
    if (job) job.ownerPreview = await buildOwnerPreviewFromJob(job);
  }));
};

const enrichApplicationsWithOwnerPreview = async (applications) => {
  if (!applications || !Array.isArray(applications)) return;
  await Promise.all(applications.map(async (app) => {
    if (app?.job) app.job.ownerPreview = await buildOwnerPreviewFromJob(app.job);
  }));
};

module.exports = {
  COMPANY_POPULATE_SELECT,
  ORGANIZATION_POPULATE_SELECT,
  resolveLogoUrl,
  buildOwnerPreviewFromJob,
  enrichJobsWithOwnerPreview,
  enrichApplicationsWithOwnerPreview,
};