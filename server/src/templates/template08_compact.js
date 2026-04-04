// backend/src/templates/template08_compact.js
// Style: Compact One-Page — dense but clean, good for 1-page ATS-friendly CVs

const { escHtml, avatarTag } = require('./templateHelpers');

module.exports = {
  name: 'Compact One-Page',
  description: 'Dense one-page layout for experienced professionals. ATS-friendly.',
  primaryColor: '#2563EB',
  style: 'compact',
  thumbnailGradient: 'linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)',

  render(d) {
    const avatar = avatarTag(d.avatar, d.fullName, 72, '#2563EB');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Source Sans 3',sans-serif;background:#fff;color:#1a1a1a;padding:28px 36px;max-width:840px;margin:auto}
  .header{display:flex;align-items:center;gap:18px;background:#2563EB;color:#fff;padding:16px 20px;border-radius:6px;margin-bottom:18px}
  .avatar-wrap img,.initials{width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.4);flex-shrink:0}
  .initials{display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.2);font-size:22px;font-weight:700;color:#fff;width:72px;height:72px;border-radius:50%}
  h1{font-size:22px;font-weight:700;color:#fff}
  .tagline{font-size:12px;color:rgba(255,255,255,0.85);margin-top:1px}
  .contacts{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
  .contact{font-size:11px;color:rgba(255,255,255,0.8)}
  .body{display:grid;grid-template-columns:1fr 280px;gap:20px}
  .sec-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#2563EB;border-bottom:2px solid #2563EB;padding-bottom:3px;margin-bottom:10px}
  .section{margin-bottom:16px}
  .bio{font-size:12px;color:#374151;line-height:1.65}
  .exp-item{margin-bottom:12px}
  .exp-item .role{font-weight:700;font-size:13px;color:#1a1a1a}
  .exp-item .sub{font-size:12px;color:#6B7280;display:flex;justify-content:space-between}
  .exp-item .desc{font-size:12px;color:#374151;line-height:1.55;margin-top:3px}
  .edu-item{margin-bottom:10px}
  .edu-item .deg{font-weight:700;font-size:13px}
  .edu-item .inst{font-size:12px;color:#6B7280}
  .edu-item .dt{font-size:11px;color:#9ca3af}
  .skill{display:inline-block;background:#dbeafe;color:#1D4ED8;font-size:11px;padding:3px 8px;border-radius:3px;margin:2px}
  .cert-item{border-left:2px solid #2563EB;padding-left:8px;margin-bottom:8px}
  .cert-item .cn{font-size:12px;font-weight:700}
  .cert-item .ci{font-size:11px;color:#6B7280}
  .social{font-size:11px;color:#2563EB;display:block;margin-bottom:4px}
  .footer{font-size:9px;color:#d1d5db;text-align:right;margin-top:16px}
</style></head><body>
<div class="header">
  <div class="avatar-wrap">${avatar}</div>
  <div>
    <h1>${escHtml(d.fullName)}</h1>
    ${d.headline?`<div class="tagline">${escHtml(d.headline)}</div>`:''}
    <div class="contacts">
      ${d.email?`<span class="contact">✉ ${escHtml(d.email)}</span>`:''}
      ${d.phone?`<span class="contact">✆ ${escHtml(d.phone)}</span>`:''}
      ${d.location?`<span class="contact">⌖ ${escHtml(d.location)}</span>`:''}
      ${d.website?`<span class="contact">⬡ ${escHtml(d.website)}</span>`:''}
    </div>
  </div>
</div>
<div class="body">
  <div>
    ${d.bio?`<div class="section"><div class="sec-title">Summary</div><p class="bio">${escHtml(d.bio)}</p></div>`:''}
    ${d.experience.length?`<div class="section"><div class="sec-title">Experience</div>
    ${d.experience.map(e=>`<div class="exp-item"><div class="role">${escHtml(e.position)}</div><div class="sub"><span>${escHtml(e.company)}</span><span>${escHtml(e.startDate)} – ${escHtml(e.endDate)}</span></div>${e.description?`<div class="desc">${escHtml(e.description)}</div>`:''}</div>`).join('')}
    </div>`:''}
    ${d.education.length?`<div class="section"><div class="sec-title">Education</div>
    ${d.education.map(e=>`<div class="edu-item"><div class="deg">${escHtml(e.degree)}${e.field?` in ${escHtml(e.field)}`:''}</div><div class="inst">${escHtml(e.institution)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}
    </div>`:''}
  </div>
  <div>
    ${d.skills.length?`<div class="section"><div class="sec-title">Skills</div>${d.skills.map(s=>`<span class="skill">${escHtml(s)}</span>`).join('')}</div>`:''}
    ${d.certifications.length?`<div class="section"><div class="sec-title">Certifications</div>
    ${d.certifications.map(c=>`<div class="cert-item"><div class="cn">${escHtml(c.name)}</div><div class="ci">${escHtml(c.issuer)} · ${escHtml(c.issueDate)}</div></div>`).join('')}
    </div>`:''}
    ${d.social.linkedin||d.social.github?`<div class="section"><div class="sec-title">Links</div>
      ${d.social.linkedin?`<a class="social" href="${d.social.linkedin}">LinkedIn</a>`:''}
      ${d.social.github?`<a class="social" href="${d.social.github}">GitHub</a>`:''}
      ${d.social.twitter?`<a class="social" href="${d.social.twitter}">Twitter / X</a>`:''}
    </div>`:''}
  </div>
</div>
<div class="footer">Generated ${d.generatedAt}</div>
</body></html>`;
  }
};
