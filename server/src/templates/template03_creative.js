// backend/src/templates/template03_creative.js
// Style: Creative Bold — near-black background, golden mustard headline, expressive typography

const { escHtml, avatarTag } = require('./templateHelpers');

module.exports = {
  name: 'Creative Bold',
  description: 'Dark background, golden mustard accents. Perfect for designers and creatives.',
  primaryColor: '#F1BB03',
  style: 'creative',
  thumbnailGradient: 'linear-gradient(135deg,#111 0%,#2a2a2a 100%)',

  render(d) {
    const avatar = avatarTag(d.avatar, d.fullName, 100, '#F1BB03');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Space Grotesk',sans-serif;background:#111;color:#eee;display:flex;min-height:100vh}
  .left{width:260px;min-width:260px;padding:40px 24px;border-right:1px solid #222;display:flex;flex-direction:column;gap:28px}
  .avatar-wrap{text-align:center}
  .avatar-wrap img,.avatar-wrap .initials{width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid #F1BB03;display:inline-block}
  .avatar-wrap .initials{background:#222;display:inline-flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#F1BB03}
  .name{font-size:20px;font-weight:700;color:#F1BB03;text-align:center;line-height:1.2;margin-top:10px}
  .tagline{font-size:11px;color:#888;text-align:center;margin-top:4px;text-transform:uppercase;letter-spacing:1.5px}
  .block-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:#F1BB03;border-bottom:1px solid #333;padding-bottom:6px;margin-bottom:10px}
  .contact-item{font-size:12px;color:#aaa;margin-bottom:7px;word-break:break-all}
  .skill-wrap{display:flex;flex-wrap:wrap;gap:4px}
  .skill{font-size:11px;background:#1e1e1e;color:#F1BB03;padding:3px 8px;border-radius:4px;border:1px solid #333}
  .social-link{display:block;font-size:11px;color:#888;margin-bottom:4px;text-decoration:none}
  .main{flex:1;padding:40px 36px;display:flex;flex-direction:column;gap:30px}
  .section-head{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#F1BB03;margin-bottom:14px;display:flex;align-items:center;gap:10px}
  .section-head::after{content:'';flex:1;height:1px;background:#222}
  .bio{font-size:13px;color:#ccc;line-height:1.75}
  .exp-item{margin-bottom:18px;padding-left:16px;border-left:2px solid #F1BB03}
  .exp-item .role{font-weight:700;font-size:13px;color:#fff}
  .exp-item .company{font-size:12px;color:#aaa}
  .exp-item .dates{font-size:11px;color:#555;margin:2px 0}
  .exp-item .desc{font-size:12px;color:#aaa;line-height:1.6;margin-top:5px}
  .edu-item,.cert-item{margin-bottom:12px}
  .edu-item .deg{font-weight:600;font-size:13px;color:#fff}
  .edu-item .inst,.cert-item .issuer{font-size:12px;color:#aaa}
  .edu-item .dates,.cert-item .dates{font-size:11px;color:#555}
  .port-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .port-card{background:#1a1a1a;border:1px solid #222;border-radius:6px;padding:12px}
  .port-card .title{font-weight:700;font-size:12px;color:#F1BB03}
  .port-card .desc{font-size:11px;color:#888;margin-top:4px;line-height:1.5}
  .port-card .tech{font-size:10px;color:#555;margin-top:6px}
  .footer{margin-top:auto;font-size:9px;color:#444;text-align:right}
</style></head><body>
<div class="left">
  <div>
    <div class="avatar-wrap">${avatar}</div>
    <div class="name">${escHtml(d.fullName)}</div>
    ${d.headline?`<div class="tagline">${escHtml(d.headline)}</div>`:''}
  </div>
  <div>
    <div class="block-title">Contact</div>
    ${d.email?`<div class="contact-item">✉ ${escHtml(d.email)}</div>`:''}
    ${d.phone?`<div class="contact-item">✆ ${escHtml(d.phone)}</div>`:''}
    ${d.location?`<div class="contact-item">⌖ ${escHtml(d.location)}</div>`:''}
    ${d.website?`<div class="contact-item">⬡ ${escHtml(d.website)}</div>`:''}
  </div>
  ${d.social.linkedin||d.social.github?`
  <div>
    <div class="block-title">Online</div>
    ${d.social.linkedin?`<a class="social-link" href="${d.social.linkedin}">LinkedIn</a>`:''}
    ${d.social.github?`<a class="social-link" href="${d.social.github}">GitHub</a>`:''}
    ${d.social.twitter?`<a class="social-link" href="${d.social.twitter}">Twitter / X</a>`:''}
  </div>`:''}
  ${d.skills.length?`
  <div>
    <div class="block-title">Skills</div>
    <div class="skill-wrap">${d.skills.map(s=>`<span class="skill">${escHtml(s)}</span>`).join('')}</div>
  </div>`:''}
</div>
<div class="main">
  ${d.bio?`<div><div class="section-head">Profile</div><p class="bio">${escHtml(d.bio)}</p></div>`:''}
  ${d.experience.length?`
  <div><div class="section-head">Experience</div>
  ${d.experience.map(e=>`
  <div class="exp-item">
    <div class="role">${escHtml(e.position)}</div>
    <div class="company">${escHtml(e.company)}${e.location?` · ${escHtml(e.location)}`:''}</div>
    <div class="dates">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>
    ${e.description?`<div class="desc">${escHtml(e.description)}</div>`:''}
  </div>`).join('')}
  </div>`:''}
  ${d.education.length?`
  <div><div class="section-head">Education</div>
  ${d.education.map(e=>`
  <div class="edu-item">
    <div class="deg">${escHtml(e.degree)}${e.field?` in ${escHtml(e.field)}`:''}</div>
    <div class="inst">${escHtml(e.institution)}</div>
    <div class="dates">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>
  </div>`).join('')}
  </div>`:''}
  ${d.certifications.length?`
  <div><div class="section-head">Certifications</div>
  ${d.certifications.map(c=>`
  <div class="cert-item">
    <div class="deg">${escHtml(c.name)}</div>
    <div class="issuer">${escHtml(c.issuer)}</div>
    <div class="dates">${escHtml(c.issueDate)}</div>
  </div>`).join('')}
  </div>`:''}
  ${d.portfolio.length?`
  <div><div class="section-head">Portfolio</div>
  <div class="port-grid">
  ${d.portfolio.slice(0,4).map(p=>`
  <div class="port-card">
    <div class="title">${escHtml(p.title)}</div>
    ${p.description?`<div class="desc">${escHtml(p.description.substring(0,100))}${p.description.length>100?'…':''}</div>`:''}
    ${p.technologies.length?`<div class="tech">${p.technologies.slice(0,4).map(escHtml).join(' · ')}</div>`:''}
  </div>`).join('')}
  </div></div>`:''}
  <div class="footer">Generated ${d.generatedAt}</div>
</div>
</body></html>`;
  }
};
