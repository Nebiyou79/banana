// backend/src/templates/template01_executive.js
// Style: Executive Classic — deep navy sidebar, serif headings, gold accents

const { escHtml, avatarTag, socialLine, skillBadges, sectionHead } = require('./templateHelpers');

module.exports = {
  name: 'Executive Classic',
  description: 'A timeless executive style with a deep navy sidebar and gold accents.',
  primaryColor: '#0A2540',
  style: 'classic',
  thumbnailGradient: 'linear-gradient(135deg,#0A2540 0%,#1a3a5c 100%)',

  render(d) {
    const avatar = avatarTag(d.avatar, d.fullName, 110);
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Lato',sans-serif;display:flex;min-height:100vh;background:#fff;color:#222}
  .sidebar{width:270px;min-width:270px;background:#0A2540;color:#fff;padding:36px 24px;display:flex;flex-direction:column;gap:24px}
  .sidebar .name{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#FFD700;line-height:1.3}
  .sidebar .headline{font-size:11px;color:#a0b8cc;text-transform:uppercase;letter-spacing:1.5px;margin-top:4px}
  .sidebar .avatar-wrap{text-align:center;margin-bottom:8px}
  .sidebar .avatar-wrap img,.sidebar .avatar-wrap .initials{border-radius:50%;width:110px;height:110px;object-fit:cover;border:3px solid #FFD700;display:inline-block}
  .sidebar .avatar-wrap .initials{background:#1a3a5c;display:inline-flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#FFD700}
  .sidebar h3{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#FFD700;border-bottom:1px solid #1a3a5c;padding-bottom:6px;margin-bottom:10px}
  .sidebar .contact-item{font-size:12px;color:#c5d5e4;margin-bottom:6px;word-break:break-all}
  .sidebar .skill-tag{display:inline-block;background:#1a3a5c;color:#a0c4dc;font-size:11px;padding:3px 8px;border-radius:3px;margin:2px 2px 2px 0}
  .sidebar .social-link{display:block;font-size:11px;color:#a0c4dc;text-decoration:none;margin-bottom:4px}
  .main{flex:1;padding:40px 36px;display:flex;flex-direction:column;gap:28px}
  .section-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:#0A2540;border-bottom:2px solid #FFD700;padding-bottom:4px;margin-bottom:14px;text-transform:uppercase;letter-spacing:1px}
  .bio{font-size:13px;color:#444;line-height:1.7}
  .exp-item,.edu-item,.cert-item{margin-bottom:16px}
  .exp-item .role{font-weight:700;font-size:13px;color:#0A2540}
  .exp-item .company,.edu-item .institution{font-size:13px;color:#555}
  .exp-item .dates,.edu-item .dates,.cert-item .dates{font-size:11px;color:#888;margin:2px 0}
  .exp-item .desc,.edu-item .desc,.cert-item .desc{font-size:12px;color:#555;line-height:1.6;margin-top:4px}
  .port-item{border-left:3px solid #FFD700;padding-left:12px;margin-bottom:14px}
  .port-item .title{font-weight:700;font-size:13px;color:#0A2540}
  .port-item .tech{font-size:11px;color:#888;margin-top:3px}
  .footer{font-size:9px;color:#bbb;text-align:right;margin-top:auto;padding-top:16px}
</style></head><body>
<div class="sidebar">
  <div class="avatar-wrap">${avatar}</div>
  <div>
    <div class="name">${escHtml(d.fullName)}</div>
    ${d.headline ? `<div class="headline">${escHtml(d.headline)}</div>` : ''}
  </div>
  <div>
    <h3>Contact</h3>
    ${d.email    ? `<div class="contact-item">✉ ${escHtml(d.email)}</div>` : ''}
    ${d.phone    ? `<div class="contact-item">✆ ${escHtml(d.phone)}</div>` : ''}
    ${d.location ? `<div class="contact-item">⌖ ${escHtml(d.location)}</div>` : ''}
    ${d.website  ? `<div class="contact-item">⬡ ${escHtml(d.website)}</div>` : ''}
  </div>
  ${d.social.linkedin||d.social.github||d.social.twitter ? `
  <div>
    <h3>Online</h3>
    ${d.social.linkedin ? `<a class="social-link" href="${d.social.linkedin}">LinkedIn</a>` : ''}
    ${d.social.github   ? `<a class="social-link" href="${d.social.github}">GitHub</a>`    : ''}
    ${d.social.twitter  ? `<a class="social-link" href="${d.social.twitter}">Twitter / X</a>` : ''}
  </div>` : ''}
  ${d.skills.length ? `
  <div>
    <h3>Skills</h3>
    ${d.skills.map(s=>`<span class="skill-tag">${escHtml(s)}</span>`).join('')}
  </div>` : ''}
</div>
<div class="main">
  ${d.bio ? `<div><div class="section-title">Profile</div><p class="bio">${escHtml(d.bio)}</p></div>` : ''}
  ${d.experience.length ? `
  <div>
    <div class="section-title">Experience</div>
    ${d.experience.map(e=>`
    <div class="exp-item">
      <div class="role">${escHtml(e.position)}</div>
      <div class="company">${escHtml(e.company)}${e.location?` · ${escHtml(e.location)}`:''}</div>
      <div class="dates">${escHtml(e.startDate)} – ${escHtml(e.endDate)}${e.employmentType?` · ${escHtml(e.employmentType)}`:''}</div>
      ${e.description?`<div class="desc">${escHtml(e.description)}</div>`:''}
    </div>`).join('')}
  </div>` : ''}
  ${d.education.length ? `
  <div>
    <div class="section-title">Education</div>
    ${d.education.map(e=>`
    <div class="edu-item">
      <div class="role">${escHtml(e.degree)}${e.field?` in ${escHtml(e.field)}`:''}</div>
      <div class="institution">${escHtml(e.institution)}</div>
      <div class="dates">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>
      ${e.description?`<div class="desc">${escHtml(e.description)}</div>`:''}
    </div>`).join('')}
  </div>` : ''}
  ${d.certifications.length ? `
  <div>
    <div class="section-title">Certifications</div>
    ${d.certifications.map(c=>`
    <div class="cert-item">
      <div class="role">${escHtml(c.name)}</div>
      <div class="company">${escHtml(c.issuer)}</div>
      <div class="dates">${escHtml(c.issueDate)}${c.expiryDate?` – ${escHtml(c.expiryDate)}`:''}</div>
    </div>`).join('')}
  </div>` : ''}
  ${d.portfolio.length ? `
  <div>
    <div class="section-title">Portfolio</div>
    ${d.portfolio.slice(0,4).map(p=>`
    <div class="port-item">
      <div class="title">${escHtml(p.title)}</div>
      ${p.description?`<div class="desc">${escHtml(p.description)}</div>`:''}
      ${p.technologies.length?`<div class="tech">${p.technologies.map(escHtml).join(' · ')}</div>`:''}
    </div>`).join('')}
  </div>` : ''}
  <div class="footer">Generated ${d.generatedAt}</div>
</div>
</body></html>`;
  }
};