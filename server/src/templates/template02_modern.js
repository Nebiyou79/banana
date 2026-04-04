// backend/src/templates/template02_modern.js
// Style: Modern Minimal — clean white, teal line accents, generous whitespace

const { escHtml, avatarTag, skillBadges } = require('./templateHelpers');

module.exports = {
  name: 'Modern Minimal',
  description: 'Ultra-clean single-column layout with teal accents and ample breathing room.',
  primaryColor: '#2AA198',
  style: 'modern',
  thumbnailGradient: 'linear-gradient(135deg,#2AA198 0%,#17726B 100%)',

  render(d) {
    const avatar = avatarTag(d.avatar, d.fullName, 90, '#2AA198');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;background:#fff;color:#1a1a1a;padding:48px 56px;max-width:840px;margin:auto}
  .header{display:flex;align-items:center;gap:28px;border-bottom:3px solid #2AA198;padding-bottom:24px;margin-bottom:32px}
  .header .avatar-wrap img,.header .avatar-wrap .initials{border-radius:50%;width:90px;height:90px;object-fit:cover}
  .header .initials{background:#e0f5f3;display:inline-flex;align-items:center;justify-content:center;width:90px;height:90px;border-radius:50%;font-size:28px;font-weight:700;color:#2AA198}
  .header .info{flex:1}
  .header h1{font-size:28px;font-weight:700;color:#0A2540;line-height:1.2}
  .header .headline{font-size:14px;color:#2AA198;font-weight:600;margin-top:2px}
  .header .contacts{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px}
  .header .contact{font-size:12px;color:#555}
  .section{margin-bottom:28px}
  .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#2AA198;margin-bottom:12px}
  .bio{font-size:13px;color:#444;line-height:1.75}
  .timeline-item{display:flex;gap:16px;margin-bottom:16px}
  .timeline-dot{width:10px;height:10px;min-width:10px;border-radius:50%;background:#2AA198;margin-top:5px}
  .timeline-content .role{font-weight:700;font-size:13px;color:#0A2540}
  .timeline-content .sub{font-size:12px;color:#666;margin-top:1px}
  .timeline-content .dates{font-size:11px;color:#999;margin:2px 0}
  .timeline-content .desc{font-size:12px;color:#555;line-height:1.6;margin-top:4px}
  .skills-wrap{display:flex;flex-wrap:wrap;gap:6px}
  .skill{display:inline-block;background:#e0f5f3;color:#17726B;font-size:11px;padding:4px 10px;border-radius:20px}
  .cert-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .cert-card{border:1px solid #e0f5f3;border-radius:8px;padding:10px 12px}
  .cert-card .name{font-weight:700;font-size:12px;color:#0A2540}
  .cert-card .issuer{font-size:11px;color:#666}
  .cert-card .dates{font-size:11px;color:#999}
  .footer{margin-top:36px;border-top:1px solid #eee;padding-top:10px;font-size:9px;color:#bbb;text-align:right}
</style></head><body>
<div class="header">
  <div class="avatar-wrap">${avatar}</div>
  <div class="info">
    <h1>${escHtml(d.fullName)}</h1>
    ${d.headline?`<div class="headline">${escHtml(d.headline)}</div>`:''}
    <div class="contacts">
      ${d.email?`<span class="contact">✉ ${escHtml(d.email)}</span>`:''}
      ${d.phone?`<span class="contact">✆ ${escHtml(d.phone)}</span>`:''}
      ${d.location?`<span class="contact">⌖ ${escHtml(d.location)}</span>`:''}
      ${d.website?`<span class="contact">⬡ ${escHtml(d.website)}</span>`:''}
      ${d.social.linkedin?`<span class="contact">in ${escHtml(d.social.linkedin)}</span>`:''}
      ${d.social.github?`<span class="contact">gh ${escHtml(d.social.github)}</span>`:''}
    </div>
  </div>
</div>
${d.bio?`<div class="section"><div class="section-title">About</div><p class="bio">${escHtml(d.bio)}</p></div>`:''}
${d.skills.length?`<div class="section"><div class="section-title">Skills</div><div class="skills-wrap">${d.skills.map(s=>`<span class="skill">${escHtml(s)}</span>`).join('')}</div></div>`:''}
${d.experience.length?`
<div class="section"><div class="section-title">Work Experience</div>
${d.experience.map(e=>`
<div class="timeline-item">
  <div class="timeline-dot"></div>
  <div class="timeline-content">
    <div class="role">${escHtml(e.position)}</div>
    <div class="sub">${escHtml(e.company)}${e.location?` · ${escHtml(e.location)}`:''}</div>
    <div class="dates">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>
    ${e.description?`<div class="desc">${escHtml(e.description)}</div>`:''}
  </div>
</div>`).join('')}
</div>`:''}
${d.education.length?`
<div class="section"><div class="section-title">Education</div>
${d.education.map(e=>`
<div class="timeline-item">
  <div class="timeline-dot"></div>
  <div class="timeline-content">
    <div class="role">${escHtml(e.degree)}${e.field?` — ${escHtml(e.field)}`:''}</div>
    <div class="sub">${escHtml(e.institution)}</div>
    <div class="dates">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>
  </div>
</div>`).join('')}
</div>`:''}
${d.certifications.length?`
<div class="section"><div class="section-title">Certifications</div>
<div class="cert-grid">
${d.certifications.map(c=>`
<div class="cert-card">
  <div class="name">${escHtml(c.name)}</div>
  <div class="issuer">${escHtml(c.issuer)}</div>
  <div class="dates">${escHtml(c.issueDate)}</div>
</div>`).join('')}
</div></div>`:''}
<div class="footer">Generated ${d.generatedAt}</div>
</body></html>`;
  }
};
