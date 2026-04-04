// backend/src/templates/templateHelpers.js
// Shared helpers used by all CV HTML templates

/**
 * Escape HTML special chars to prevent XSS in generated CVs.
 */
function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build an <img> tag for the avatar, or an initials placeholder div.
 * @param {string|null} avatarUrl
 * @param {string} fullName
 * @param {number} size - pixel size
 * @param {string} borderColor
 */
function avatarTag(avatarUrl, fullName, size = 100, borderColor = 'transparent') {
  const initials = (fullName || 'CV')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  if (avatarUrl) {
    return `<img src="${escHtml(avatarUrl)}" width="${size}" height="${size}" alt="${escHtml(fullName)}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:50%;border:3px solid ${borderColor};" />`;
  }
  return `<div class="initials" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.35)}px;">${escHtml(initials)}</div>`;
}

/**
 * Render a row of social links as plain text labels.
 */
function socialLine(social) {
  const parts = [];
  if (social.linkedin) parts.push(`LinkedIn: ${social.linkedin}`);
  if (social.github)   parts.push(`GitHub: ${social.github}`);
  if (social.twitter)  parts.push(`Twitter: ${social.twitter}`);
  return parts.map(p => `<span style="margin-right:12px;font-size:11px;">${escHtml(p)}</span>`).join('');
}

/**
 * Render skill pills.
 */
function skillBadges(skills, bg = '#e8edf2', color = '#0A2540') {
  return skills
    .map(s => `<span style="display:inline-block;background:${bg};color:${color};font-size:11px;padding:3px 9px;border-radius:20px;margin:2px;">${escHtml(s)}</span>`)
    .join('');
}

/**
 * Section heading helper.
 */
function sectionHead(title, color = '#0A2540', borderColor = '#FFD700') {
  return `<div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${color};border-bottom:2px solid ${borderColor};padding-bottom:5px;margin-bottom:14px;">${escHtml(title)}</div>`;
}

module.exports = { escHtml, avatarTag, socialLine, skillBadges, sectionHead };
