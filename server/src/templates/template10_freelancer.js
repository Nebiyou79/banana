// backend/src/templates/template10_freelancer.js
// Style: Freelancer Portfolio — full-width project showcase, vibrant purple

const { escHtml, avatarTag } = require('./templateHelpers');

module.exports = {
  name: 'Freelancer Portfolio',
  description: 'Portfolio-forward layout. Showcases projects prominently alongside skills.',
  primaryColor: '#7C3AED',
  style: 'freelancer',
  thumbnailGradient: 'linear-gradient(135deg,#7C3AED 0%,#4C1D95 100%)',

  render(d) {
    const avatar = avatarTag(d.avatar, d.fullName, 96, '#7C3AED');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Plus Jakarta Sans',sans-serif;background:#fafafa;color:#1a1a2e;min-height:100vh}
  .hero{background:linear-gradient(135deg,#7C3AED 0%,#4C1D95 50%,#2563EB 100%);padding:40px 48px;color:#fff;display:flex;align-items:center;gap:28px}
  .avatar-wrap img,.initials{width:96px;height:96px;border-radius:12px;object-fit:cover;border:3px solid rgba(255,255,255,0.5);display:inline-block;flex-shrink:0}
  .initials{display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.15);font-size:30px;font-weight:800;color:#fff}
  .hero-info h1{font-size:26px;font-weight:800;color:#fff}
  .hero-info .tagline{font-size:14px;color:rgba(255,255,255,0.8);margin-top:3px;font-weight:500}
  .hero-info .contacts{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px}
  .hero-info .contact{font-size:11px;color:rgba(255,255,255,0.75)}
  .hero-info .social-wrap{display:flex;gap:10px;margin-top:8px}
  .hero-info .social{font-size:11px;color:#c4b5fd;text-decoration:none}
  .content{display:grid;grid-template-columns:1fr 300px;gap:0;background:#fff}
  .main-col{padding:32px 36px;border-right:1px solid #f3f4f6;display:flex;flex-direction:column;gap:28px}
  .side-col{padding:32px 24px;background:#fafafa;display:flex;flex-direction:column;gap:22px}
  .sec-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#7C3AED;margin-bottom:14px;display:flex;align-items:center;gap:8px}
  .sec-title::after{content:'';flex:1;height:2px;background:linear-gradient(90deg,#ede9fe,transparent)}
  .bio{font-size:13px;color:#4B5563;line-height:1.8}
  .port-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .port-card{background:#f5f3ff;border-radius:10px;padding:14px;border:1px solid #ede9fe;transition:box-shadow .2s}
  .port-card .title{font-weight:700;font-size:13px;color:#4C1D95}
  .port-card .role-line{font-size:11px;color:#7C3AED;font-weight:600;margin-top:2px}
  .port-card .desc{font-size:12px;color:#6B7280;line-height:1.55;margin-top:5px}
  .port-card .tech-wrap{display:flex;flex-wrap:wrap;gap:3px;margin-top:7px}
  .port-card .tech{font-size:10px;background:#ede9fe;color:#7C3AED;padding:2px 6px;border-radius:4px}
  .exp-item{padding-left:14px;border-left:2px solid #ede9fe;margin-bottom:14px}
  .exp-item .role{font-weight:700;font-size:13px;color:#1a1a2e}
  .exp-item .company{font-size:12px;color:#7C3AED;font-weight:600}
  .exp-item .dates{font-size:11px;color:#9ca3af;margin:2px 0}
  .exp-item .desc{font-size:12px;color:#6B7280;line-height:1.6;margin-top:4px}
  .side-blk h3{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#7C3AED;border-bottom:1px solid #ede9fe;padding-bottom:5px;margin-bottom:10px}
  .skill-tag{display:inline-block;background:#f5f3ff;color:#4C1D95;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;margin:3px;border:1px solid #ede9fe}
  .edu-item{margin-bottom:12px}
  .edu-item .deg{font-weight:700;font-size:12px;color:#1a1a2e}
  .edu-item .inst{font-size:11px;color:#7C3AED}
  .edu-item .dt{font-size:10px;color:#9ca3af}
  .cert-item{padding:8px 10px;background:#f5f3ff;border-radius:6px;margin-bottom:6px;border-left:3px solid #7C3AED}
  .cert-item .cn{font-size:12px;font-weight:700;color:#1a1a2e}
  .cert-item .ci{font-size:10px;color:#7C3AED}
  .footer{text-align:center;font-size:9px;color:#d1d5db;padding:12px;background:#f9fafb;border-top:1px solid #f3f4f6}
</style></head><body>
<div class="hero">
  <div class="avatar-wrap">${avatar}</div>
  <div class="hero-info">
    <h1>${escHtml(d.fullName)}</h1>
    ${d.headline?`<div class="tagline">${escHtml(d.headline)}</div>`:''}
    <div class="contacts">
      ${d.email?`<span class="contact">✉ ${escHtml(d.email)}</span>`:''}
      ${d.phone?`<span class="contact">✆ ${escHtml(d.phone)}</span>`:''}
      ${d.location?`<span class="contact">⌖ ${escHtml(d.location)}</span>`:''}
      ${d.website?`<span class="contact">⬡ ${escHtml(d.website)}</span>`:''}
    </div>
    <div class="social-wrap">
      ${d.social.linkedin?`<a class="social" href="${d.social.linkedin}">LinkedIn</a>`:''}
      ${d.social.github?`<a class="social" href="${d.social.github}">GitHub</a>`:''}
      ${d.social.twitter?`<a class="social" href="${d.social.twitter}">Twitter/X</a>`:''}
    </div>
  </div>
</div>
<div class="content">
  <div class="main-col">
    ${d.bio?`<div><div class="sec-title">About Me</div><p class="bio">${escHtml(d.bio)}</p></div>`:''}
    ${d.portfolio.length?`<div><div class="sec-title">Featured Projects</div>
    <div class="port-grid">
    ${d.portfolio.slice(0,6).map(p=>`
    <div class="port-card">
      <div class="title">${escHtml(p.title)}</div>
      ${p.role?`<div class="role-line">${escHtml(p.role)}</div>`:''}
      ${p.description?`<div class="desc">${escHtml(p.description.substring(0,120))}${p.description.length>120?'…':''}</div>`:''}
      ${p.technologies.length?`<div class="tech-wrap">${p.technologies.slice(0,5).map(t=>`<span class="tech">${escHtml(t)}</span>`).join('')}</div>`:''}
    </div>`).join('')}
    </div></div>`:''}
    ${d.experience.length?`<div><div class="sec-title">Work Experience</div>
    ${d.experience.map(e=>`
    <div class="exp-item">
      <div class="role">${escHtml(e.position)}</div>
      <div class="company">${escHtml(e.company)}${e.employmentType?` · ${escHtml(e.employmentType)}`:''}</div>
      <div class="dates">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>
      ${e.description?`<div class="desc">${escHtml(e.description)}</div>`:''}
    </div>`).join('')}
    </div>`:''}
  </div>
  <div class="side-col">
    ${d.skills.length?`<div class="side-blk"><h3>Skills</h3>
    ${d.skills.map(s=>`<span class="skill-tag">${escHtml(s)}</span>`).join('')}
    </div>`:''}
    ${d.education.length?`<div class="side-blk"><h3>Education</h3>
    ${d.education.map(e=>`<div class="edu-item"><div class="deg">${escHtml(e.degree)}</div><div class="inst">${escHtml(e.institution)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}
    </div>`:''}
    ${d.certifications.length?`<div class="side-blk"><h3>Certifications</h3>
    ${d.certifications.map(c=>`<div class="cert-item"><div class="cn">${escHtml(c.name)}</div><div class="ci">${escHtml(c.issuer)}</div></div>`).join('')}
    </div>`:''}
  </div>
</div>
<div class="footer">Generated ${d.generatedAt}</div>
</body></html>`;
  }
};
