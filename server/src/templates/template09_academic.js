// backend/src/templates/template09_academic.js
// Style: Academic — formal, print-ready, clean black and white with blue rule

const { escHtml, avatarTag } = require('./templateHelpers');

module.exports = {
  name: 'Academic',
  description: 'Formal academic CV format. Ideal for researchers, professors, and scholars.',
  primaryColor: '#1D4ED8',
  style: 'academic',
  thumbnailGradient: 'linear-gradient(135deg,#1D4ED8 0%,#1e3a8a 100%)',

  render(d) {
    const avatar = avatarTag(d.avatar, d.fullName, 80, '#1D4ED8');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Open+Sans:wght@400;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'EB Garamond',serif;background:#fff;color:#111;padding:54px 64px;max-width:840px;margin:auto}
  .header{text-align:center;border-bottom:3px double #1D4ED8;padding-bottom:20px;margin-bottom:28px;display:flex;flex-direction:column;align-items:center;gap:10px}
  .avatar-wrap img,.initials{width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #1D4ED8;display:inline-block}
  .initials{display:inline-flex;align-items:center;justify-content:center;background:#dbeafe;font-size:26px;font-weight:700;color:#1D4ED8}
  h1{font-size:28px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#111}
  .tagline{font-size:14px;color:#1D4ED8;font-style:italic;margin-top:2px}
  .contact-row{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;margin-top:6px}
  .contact{font-size:12px;color:#555;font-family:'Open Sans',sans-serif}
  .section{margin-bottom:26px}
  .sec-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#1D4ED8;border-bottom:1px solid #1D4ED8;padding-bottom:4px;margin-bottom:14px;font-family:'Open Sans',sans-serif}
  .bio{font-size:14px;line-height:1.85;color:#333;font-style:italic}
  .item{margin-bottom:16px}
  .item .role{font-size:15px;font-weight:700;color:#111}
  .item .sub{font-size:13px;color:#1D4ED8;font-style:italic}
  .item .dates{font-size:12px;color:#888;font-family:'Open Sans',sans-serif;margin:2px 0}
  .item .desc{font-size:13px;color:#444;line-height:1.75;margin-top:5px}
  .skill-list{list-style:none;display:flex;flex-wrap:wrap;gap:8px}
  .skill-list li{font-size:13px;color:#333;font-family:'Open Sans',sans-serif}
  .skill-list li::before{content:'·';margin-right:4px;color:#1D4ED8}
  .cert-row{display:flex;justify-content:space-between;border-bottom:1px dotted #d1d5db;padding:6px 0;font-size:13px}
  .cert-row .cn{color:#111;font-weight:600}
  .cert-row .ci{color:#888;font-family:'Open Sans',sans-serif;font-size:11px}
  .port-item{margin-bottom:12px}
  .port-item .title{font-size:14px;font-weight:700;color:#111}
  .port-item .desc{font-size:13px;color:#555;line-height:1.7;margin-top:3px}
  .port-item .tech{font-size:12px;color:#1D4ED8;font-style:italic;margin-top:3px}
  .footer{font-size:10px;color:#bbb;text-align:center;margin-top:36px;border-top:1px solid #e5e7eb;padding-top:10px;font-family:'Open Sans',sans-serif}
</style></head><body>
<div class="header">
  <div class="avatar-wrap">${avatar}</div>
  <div>
    <h1>${escHtml(d.fullName)}</h1>
    ${d.headline?`<div class="tagline">${escHtml(d.headline)}</div>`:''}
    <div class="contact-row">
      ${d.email?`<span class="contact">✉ ${escHtml(d.email)}</span>`:''}
      ${d.phone?`<span class="contact">✆ ${escHtml(d.phone)}</span>`:''}
      ${d.location?`<span class="contact">⌖ ${escHtml(d.location)}</span>`:''}
      ${d.website?`<span class="contact">⬡ ${escHtml(d.website)}</span>`:''}
      ${d.social.linkedin?`<span class="contact">in ${escHtml(d.social.linkedin)}</span>`:''}
    </div>
  </div>
</div>
${d.bio?`<div class="section"><div class="sec-title">Research Interests / Profile</div><p class="bio">${escHtml(d.bio)}</p></div>`:''}
${d.experience.length?`<div class="section"><div class="sec-title">Professional Experience</div>
${d.experience.map(e=>`<div class="item"><div class="role">${escHtml(e.position)}</div><div class="sub">${escHtml(e.company)}${e.location?`, ${escHtml(e.location)}`:''}</div><div class="dates">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>${e.description?`<div class="desc">${escHtml(e.description)}</div>`:''}</div>`).join('')}
</div>`:''}
${d.education.length?`<div class="section"><div class="sec-title">Education</div>
${d.education.map(e=>`<div class="item"><div class="role">${escHtml(e.degree)}${e.field?` in ${escHtml(e.field)}`:''}</div><div class="sub">${escHtml(e.institution)}</div><div class="dates">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>${e.grade?`<div class="dates">Grade: ${escHtml(e.grade)}</div>`:''}</div>`).join('')}
</div>`:''}
${d.certifications.length?`<div class="section"><div class="sec-title">Certifications &amp; Awards</div>
${d.certifications.map(c=>`<div class="cert-row"><div><div class="cn">${escHtml(c.name)}</div><div class="ci">${escHtml(c.issuer)}</div></div><div class="ci">${escHtml(c.issueDate)}</div></div>`).join('')}
</div>`:''}
${d.skills.length?`<div class="section"><div class="sec-title">Skills &amp; Competencies</div>
<ul class="skill-list">${d.skills.map(s=>`<li>${escHtml(s)}</li>`).join('')}</ul>
</div>`:''}
${d.portfolio.length?`<div class="section"><div class="sec-title">Selected Projects &amp; Publications</div>
${d.portfolio.slice(0,5).map(p=>`<div class="port-item"><div class="title">${escHtml(p.title)}</div>${p.description?`<div class="desc">${escHtml(p.description)}</div>`:''}</div>`).join('')}
</div>`:''}
<div class="footer">Curriculum Vitae &mdash; ${escHtml(d.fullName)} &mdash; Generated ${d.generatedAt}</div>
</body></html>`;
  }
};
