// backend/src/utils/cvDataNormalizer.js
// FIXED: avatar is fetched from Cloudinary URL and embedded as a base64 data URI
// so it renders correctly inside both the iframe preview and wkhtmltopdf PDF.

const https  = require('https');
const http   = require('http');
const { URL } = require('url');

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a User mongoose lean document into template-ready data.
 * Avatar is fetched and base64-encoded so it embeds into HTML without CORS.
 *
 * @param {object} user - User lean document
 * @returns {Promise<object>} - Normalised candidate data
 */
async function normalizeCandidateData(user) {
  if (!user) throw new Error('User data is required');

  const fullName  = (user.name   || '').trim();
  const email     = user.email   || '';
  const phone     = user.phone   || '';
  const location  = user.location || '';
  const website   = user.website  || '';
  const bio       = user.bio      || '';
  const headline  = user.headline || '';

  // ── Avatar: embed as data URI ──────────────────────────────────────────────
  // user.avatar is a Cloudinary HTTPS URL. We fetch it and convert to base64
  // so it renders in: sandboxed iframes, wkhtmltopdf, and the fallback PDF.
  let avatar = null;
  const avatarSrc = user.avatar || null;
  if (avatarSrc && avatarSrc.startsWith('http')) {
    try {
      // Optimise via Cloudinary transformation if URL supports it
      const optimisedUrl = avatarSrc.includes('cloudinary.com')
        ? avatarSrc.replace('/upload/', '/upload/w_200,h_200,c_fill,g_face,f_jpg,q_80/')
        : avatarSrc;

      avatar = await _fetchAsDataUri(optimisedUrl, 3000); // 3s timeout
    } catch (err) {
      console.warn('[cvDataNormalizer] Avatar fetch failed (will use initials):', err.message);
      avatar = null;
    }
  }

  // ── Social links ────────────────────────────────────────────────────────────
  const social = {
    linkedin: _cleanUrl(user.socialLinks?.linkedin),
    github:   _cleanUrl(user.socialLinks?.github),
    twitter:  _cleanUrl(user.socialLinks?.twitter),
    tiktok:   _cleanUrl(user.socialLinks?.tiktok),
    telegram: _cleanUrl(user.socialLinks?.telegram),
  };

  // ── Skills ──────────────────────────────────────────────────────────────────
  const skills = Array.isArray(user.skills)
    ? user.skills.filter(Boolean).map(s => String(s).trim()).filter(s => s.length > 0)
    : [];

  // ── Education ───────────────────────────────────────────────────────────────
  const education = (user.education || []).map(edu => ({
    institution: edu.institution || '',
    degree:      edu.degree      || '',
    field:       edu.field       || '',
    startDate:   _fmtDate(edu.startDate),
    endDate:     edu.current ? 'Present' : _fmtDate(edu.endDate),
    current:     !!edu.current,
    description: edu.description || '',
    grade:       edu.grade       || '',
  })).sort((a, b) => _sortByDate(a.endDate, b.endDate));

  // ── Experience ──────────────────────────────────────────────────────────────
  const experience = (user.experience || []).map(exp => ({
    company:        exp.company         || '',
    position:       exp.position        || '',
    location:       exp.location        || '',
    employmentType: exp.employmentType  || '',
    startDate:      _fmtDate(exp.startDate),
    endDate:        exp.current ? 'Present' : _fmtDate(exp.endDate),
    current:        !!exp.current,
    description:    exp.description     || '',
    skills:         Array.isArray(exp.skills) ? exp.skills.filter(Boolean) : [],
    achievements:   Array.isArray(exp.achievements) ? exp.achievements.filter(Boolean) : [],
  })).sort((a, b) => _sortByDate(a.endDate, b.endDate));

  // ── Certifications ───────────────────────────────────────────────────────────
  const certifications = (user.certifications || []).map(cert => ({
    name:          cert.name          || '',
    issuer:        cert.issuer        || '',
    issueDate:     _fmtDate(cert.issueDate),
    expiryDate:    cert.expiryDate ? _fmtDate(cert.expiryDate) : '',
    credentialId:  cert.credentialId  || '',
    credentialUrl: cert.credentialUrl || '',
    description:   cert.description   || '',
  }));

  // ── Portfolio ────────────────────────────────────────────────────────────────
  const portfolio = (user.portfolio || [])
    .filter(p => p.visibility !== 'private')
    .map(p => ({
      title:          p.title       || '',
      description:    p.description || '',
      projectUrl:     p.projectUrl  || '',
      mediaUrl:       p.mediaUrl || (Array.isArray(p.mediaUrls) ? p.mediaUrls[0] : '') || '',
      category:       p.category    || '',
      technologies:   Array.isArray(p.technologies) ? p.technologies.filter(Boolean) : [],
      client:         p.client      || '',
      duration:       p.duration    || '',
      role:           p.role        || '',
      completionDate: p.completionDate ? _fmtDate(p.completionDate) : '',
    }));

  // ── Computed ─────────────────────────────────────────────────────────────────
  const totalExperienceYears = _calcExperienceYears(user.experience || []);

  return {
    fullName,
    email,
    phone,
    location,
    website,
    bio,
    headline,
    avatar,         // null OR data URI string
    social,
    skills,
    education,
    experience,
    certifications,
    portfolio,
    totalExperienceYears,
    generatedAt: new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar fetch helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a URL and return it as a base64 data URI.
 * Times out after `timeoutMs` milliseconds.
 */
function _fetchAsDataUri(url, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const parsed   = new URL(url);
    const protocol = parsed.protocol === 'https:' ? https : http;

    const req = protocol.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      const contentType = res.headers['content-type'] || 'image/jpeg';
      const chunks = [];

      res.on('data',  chunk => chunks.push(chunk));
      res.on('end',   () => {
        const buffer = Buffer.concat(chunks);
        resolve(`data:${contentType};base64,${buffer.toString('base64')}`);
      });
      res.on('error', reject);
    });

    req.on('error',   reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Avatar fetch timeout')); });
    req.setTimeout(timeoutMs);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

function _fmtDate(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  } catch (_) { return ''; }
}

function _cleanUrl(url) {
  if (!url) return '';
  return url.startsWith('http') ? url : `https://${url}`;
}

function _calcExperienceYears(experience) {
  let total = 0;
  (experience || []).forEach(exp => {
    const start = exp.startDate ? new Date(exp.startDate) : null;
    if (!start) return;
    const end = (exp.current || !exp.endDate) ? new Date() : new Date(exp.endDate);
    total += Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 365.25));
  });
  return Math.round(total * 10) / 10;
}

function _sortByDate(a, b) {
  if (a === 'Present') return -1;
  if (b === 'Present') return 1;
  return new Date(b || 0) - new Date(a || 0);
}

module.exports = { normalizeCandidateData };