// backend/src/templates/template04_professional.js
// Style: Professional Two-Column — grey sidebar, sharp lines, corporate feel

const { escHtml, avatarTag } = require('./templateHelpers');

module.exports = {
  name: 'Professional',
  description: 'Two-column layout with a grey sidebar. Ideal for corporate roles.',
  primaryColor: '#4B5563',
  style: 'professional',
  thumbnailGradient: 'linear-gradient(135deg,#4B5563 0%,#1f2937 100%)',

  render(d) {
    const avatar = avatarTag(d.avatar, d.fullName, 90, '#6B7280');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'IBM Plex Sans',sans-serif;background:#fff;color:#1f2937;display:flex;min-height:100vh}
  .left{width:240px;min-width:240px;background:#f3f4f6;padding:36px 20px;display:flex;flex-direction:column;gap:22px}
  .avatar-wrap{text-align:center}
  .avatar-wrap img,.initials{border-radius:6px;width:90px;height:90px;object-fit:cover;border:2px solid #6B7280;display:inline-block}
  .initials{display:inline-flex;align-items:center;justify-content:center;background:#e5e7eb;font-size:28px;font-weight:700;color:#4B5563}
  .name{font-size:16px;font-weight:700;text-align:center;margin-top:10px;color:#1f2937}
  .tagline{font-size:11px;color:#6B7280;text-align:center;margin-top:3px}
  .block h3{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#4B5563;border-bottom:1px solid #d1d5db;padding-bottom:5px;margin-bottom:8px}
  .contact-item{font-size:11px;color:#4B5563;margin-bottom:6px}
  .skill-wrap{display:flex;flex-wrap:wrap;gap:4px}
  .skill{font-size:10px;background:#e5e7eb;color:#374151;padding:3px 7px;border-radius:3px}
  .social-item{font-size:11px;color:#4B5563;margin-bottom:4px}
  .main{flex:1;padding:36px 32px;display:flex;flex-direction:column;gap:22px}
  .sec-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#4B5563;border-bottom:2px solid #4B5563;padding-bottom:4px;margin-bottom:12px}
  .bio{font-size:12px;color:#374151;line-height:1.7}
  .item{margin-bottom:14px}
  .item .title{font-weight:700;font-size:13px;color:#1f2937}
  .item .sub{font-size:12px;color:#6B7280}
  .item .dates{font-size:11px;color:#9ca3af;margin:2px 0}
  .item .desc{font-size:12px;color:#374151;line-height:1.6;margin-top:4px}
  .cert-row{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f3f4f6;padding:6px 0}
  .cert-row .cn{font-size:12px;font-weight:600;color:#1f2937}
  .cert-row .ci{font-size:11px;color:#6B7280}
  .footer{margin-top:auto;font-size:9px;color:#d1d5db;text-align:right;padding-top:16px}
</style></head><body>
<div class="left">
  <div>
    <div class="avatar-wrap">${avatar}</div>
    <div class="name">${escHtml(d.fullName)}</div>
    ${d.headline?`<div class="tagline">${escHtml(d.headline)}</div>`:''}
  </div>
  <div class="block"><h3>Contact</h3>
    ${d.email?`<div class="contact-item">✉ ${escHtml(d.email)}</div>`:''}
    ${d.phone?`<div class="contact-item">✆ ${escHtml(d.phone)}</div>`:''}
    ${d.location?`<div class="contact-item">⌖ ${escHtml(d.location)}</div>`:''}
    ${d.website?`<div class="contact-item">⬡ ${escHtml(d.website)}</div>`:''}
  </div>
  ${d.social.linkedin||d.social.github?`<div class="block"><h3>Online</h3>
    ${d.social.linkedin?`<div class="social-item">LinkedIn</div>`:''}
    ${d.social.github?`<div class="social-item">GitHub</div>`:''}
  </div>`:''}
  ${d.skills.length?`<div class="block"><h3>Skills</h3>
    <div class="skill-wrap">${d.skills.map(s=>`<span class="skill">${escHtml(s)}</span>`).join('')}</div>
  </div>`:''}
</div>
<div class="main">
  ${d.bio?`<div><div class="sec-title">Profile</div><p class="bio">${escHtml(d.bio)}</p></div>`:''}
  ${d.experience.length?`<div><div class="sec-title">Experience</div>
  ${d.experience.map(e=>`<div class="item"><div class="title">${escHtml(e.position)}</div><div class="sub">${escHtml(e.company)}${e.location?` · ${escHtml(e.location)}`:''}</div><div class="dates">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>${e.description?`<div class="desc">${escHtml(e.description)}</div>`:''}</div>`).join('')}
  </div>`:''}
  ${d.education.length?`<div><div class="sec-title">Education</div>
  ${d.education.map(e=>`<div class="item"><div class="title">${escHtml(e.degree)}${e.field?` in ${escHtml(e.field)}`:''}</div><div class="sub">${escHtml(e.institution)}</div><div class="dates">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}
  </div>`:''}
  ${d.certifications.length?`<div><div class="sec-title">Certifications</div>
  ${d.certifications.map(c=>`<div class="cert-row"><div><div class="cn">${escHtml(c.name)}</div><div class="ci">${escHtml(c.issuer)}</div></div><div class="ci">${escHtml(c.issueDate)}</div></div>`).join('')}
  </div>`:''}
  <div class="footer">Generated ${d.generatedAt}</div>
</div>
</body></html>`;
  }
};
