// backend/src/utils/cvDataNormalizer.js
// Transforms a raw User mongoose document into a clean, template-ready object.

/**
 * @param {object} user - Mongoose User lean document (with populated fields)
 * @returns {object}    - Normalised candidate data object
 */
function normalizeCandidateData(user) {
  if (!user) throw new Error('User data is required');

  // ── Personal info ─────────────────────────────────────────
  const fullName   = (user.name || '').trim();
  const email      = user.email || '';
  const phone      = user.phone || '';
  const location   = user.location || '';
  const website    = user.website || '';
  const bio        = user.bio || '';
  const headline   = user.headline || '';
  const avatar     = user.avatar || null;

  // ── Social links ──────────────────────────────────────────
  const social = {
    linkedin:  _cleanUrl(user.socialLinks?.linkedin),
    github:    _cleanUrl(user.socialLinks?.github),
    twitter:   _cleanUrl(user.socialLinks?.twitter),
    tiktok:    _cleanUrl(user.socialLinks?.tiktok),
    telegram:  _cleanUrl(user.socialLinks?.telegram),
  };

  // ── Skills ────────────────────────────────────────────────
  const skills = Array.isArray(user.skills)
    ? user.skills.filter(Boolean).map(s => s.toString().trim())
    : [];

  // ── Education ─────────────────────────────────────────────
  const education = (user.education || []).map(edu => ({
    institution: edu.institution || '',
    degree:      edu.degree      || '',
    field:       edu.field       || '',
    startDate:   _formatDate(edu.startDate),
    endDate:     edu.current ? 'Present' : _formatDate(edu.endDate),
    current:     !!edu.current,
    description: edu.description || '',
    grade:       edu.grade       || '',
  })).sort((a, b) => _sortByDate(a.endDate, b.endDate));

  // ── Experience ────────────────────────────────────────────
  const experience = (user.experience || []).map(exp => ({
    company:        exp.company   || '',
    position:       exp.position  || '',
    location:       exp.location  || '',
    employmentType: exp.employmentType || '',
    startDate:      _formatDate(exp.startDate),
    endDate:        exp.current ? 'Present' : _formatDate(exp.endDate),
    current:        !!exp.current,
    description:    exp.description || '',
    skills:         Array.isArray(exp.skills) ? exp.skills.filter(Boolean) : [],
    achievements:   Array.isArray(exp.achievements) ? exp.achievements.filter(Boolean) : [],
  })).sort((a, b) => _sortByDate(a.endDate, b.endDate));

  // ── Certifications ────────────────────────────────────────
  const certifications = (user.certifications || []).map(cert => ({
    name:          cert.name    || '',
    issuer:        cert.issuer  || '',
    issueDate:     _formatDate(cert.issueDate),
    expiryDate:    cert.expiryDate ? _formatDate(cert.expiryDate) : '',
    credentialId:  cert.credentialId  || '',
    credentialUrl: cert.credentialUrl || '',
    description:   cert.description   || '',
  }));

  // ── Portfolio ─────────────────────────────────────────────
  const portfolio = (user.portfolio || [])
    .filter(p => p.visibility !== 'private')
    .map(p => ({
      title:          p.title       || '',
      description:    p.description || '',
      projectUrl:     p.projectUrl  || '',
      mediaUrl:       p.mediaUrl    || (Array.isArray(p.mediaUrls) ? p.mediaUrls[0] : '') || '',
      category:       p.category    || '',
      technologies:   Array.isArray(p.technologies) ? p.technologies.filter(Boolean) : [],
      client:         p.client      || '',
      duration:       p.duration    || '',
      role:           p.role        || '',
      completionDate: p.completionDate ? _formatDate(p.completionDate) : '',
    }));

  // ── Computed ──────────────────────────────────────────────
  const totalExperienceYears = _calcExperienceYears(user.experience || []);

  return {
    fullName,
    email,
    phone,
    location,
    website,
    bio,
    headline,
    avatar,
    social,
    skills,
    education,
    experience,
    certifications,
    portfolio,
    totalExperienceYears,
    generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function _formatDate(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  } catch (_) {
    return '';
  }
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
    const years = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
    total += Math.max(0, years);
  });
  return Math.round(total * 10) / 10;
}

function _sortByDate(a, b) {
  // "Present" sorts to top
  if (a === 'Present') return -1;
  if (b === 'Present') return 1;
  return new Date(b || 0) - new Date(a || 0);
}

module.exports = { normalizeCandidateData };
