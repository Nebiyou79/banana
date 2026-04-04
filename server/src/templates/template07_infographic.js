// backend/src/templates/template07_infographic.js
// Style: Infographic — colorful skill bars, icon-like section markers, vibrant teal/orange

const { escHtml, avatarTag } = require('./templateHelpers');

module.exports = {
  name: 'Infographic',
  description: 'Colourful skill bars and vivid section markers. Stands out in any pile.',
  primaryColor: '#FF8C42',
  style: 'infographic',
  thumbnailGradient: 'linear-gradient(135deg,#FF8C42 0%,#2AA198 100%)',

  render(d) {
    const avatar = avatarTag(d.avatar, d.fullName, 100, '#FF8C42');
    const maxSkill = Math.min(d.skills.length, 10);
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Nunito',sans-serif;background:#fff;color:#1a1a1a;display:flex;min-height:100vh}
  .sidebar{width:260px;min-width:260px;background:linear-gradient(180deg,#0A2540 0%,#1a3a5c 100%);padding:36px 20px;color:#fff;display:flex;flex-direction:column;gap:22px}
  .avatar-wrap{text-align:center}
  .avatar-wrap img,.initials{width:100px;height:100px;border-radius:50%;object-fit:cover;border:4px solid #FF8C42;display:inline-block}
  .initials{display:inline-flex;align-items:center;justify-content:center;background:#1a3a5c;font-size:32px;font-weight:800;color:#FF8C42}
  .name{font-size:18px;font-weight:800;text-align:center;color:#fff;margin-top:8px}
  .tagline{font-size:11px;color:#FF8C42;text-align:center;font-weight:600}
  .blk h3{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:#FF8C42;margin-bottom:8px}
  .ct{font-size:11px;color:#a0b8cc;margin-bottom:6px}
  .skill-bar-wrap{margin-bottom:6px}
  .skill-bar-label{display:flex;justify-content:space-between;font-size:11px;color:#ccc;margin-bottom:3px}
  .skill-bar-track{background:#1a3a5c;border-radius:10px;height:6px;overflow:hidden}
  .skill-bar-fill{height:100%;border-radius:10px;background:linear-gradient(90deg,#2AA198,#FF8C42)}
  .social-link{display:block;font-size:11px;color:#a0b8cc;margin-bottom:4px}
  .main{flex:1;padding:36px 32px;display:flex;flex-direction:column;gap:24px}
  .sec-wrap{display:flex;align-items:center;gap:10px;margin-bottom:14px}
  .sec-icon{width:28px;height:28px;background:#FF8C42;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;flex-shrink:0}
  .sec-title{font-size:13px;font-weight:800;color:#0A2540;text-transform:uppercase;letter-spacing:1px;flex:1;border-bottom:2px dashed #e5e7eb;padding-bottom:4px}
  .bio{font-size:13px;color:#444;line-height:1.75}
  .exp-card{background:#f8fafc;border-radius:8px;padding:12px 14px;margin-bottom:10px;border-left:4px solid #2AA198}
  .exp-card .role{font-weight:800;font-size:13px;color:#0A2540}
  .exp-card .co{font-size:12px;color:#FF8C42;font-weight:600}
  .exp-card .dt{font-size:11px;color:#9ca3af;margin:2px 0}
  .exp-card .desc{font-size:12px;color:#555;line-height:1.6;margin-top:5px}
  .edu-card{background:#f8fafc;border-radius:8px;padding:10px 14px;margin-bottom:8px;border-left:4px solid #FF8C42}
  .edu-card .deg{font-weight:700;font-size:13px;color:#0A2540}
  .edu-card .inst{font-size:12px;color:#2AA198}
  .edu-card .dt{font-size:11px;color:#9ca3af}
  .cert-pill{display:inline-block;background:#e0f5f3;color:#0f766e;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;margin:3px}
  .footer{font-size:9px;color:#d1d5db;text-align:right;margin-top:auto}
</style></head><body>
<div class="sidebar">
  <div>
    <div class="avatar-wrap">${avatar}</div>
    <div class="name">${escHtml(d.fullName)}</div>
    ${d.headline?`<div class="tagline">${escHtml(d.headline)}</div>`:''}
  </div>
  <div class="blk"><h3>Contact</h3>
    ${d.email?`<div class="ct">✉ ${escHtml(d.email)}</div>`:''}
    ${d.phone?`<div class="ct">✆ ${escHtml(d.phone)}</div>`:''}
    ${d.location?`<div class="ct">⌖ ${escHtml(d.location)}</div>`:''}
    ${d.website?`<div class="ct">⬡ ${escHtml(d.website)}</div>`:''}
  </div>
  ${d.skills.length?`
  <div class="blk"><h3>Skills</h3>
    ${d.skills.slice(0, maxSkill).map((s, i)=>`
    <div class="skill-bar-wrap">
      <div class="skill-bar-label"><span>${escHtml(s)}</span></div>
      <div class="skill-bar-track"><div class="skill-bar-fill" style="width:${Math.max(40,100-i*8)}%"></div></div>
    </div>`).join('')}
  </div>`:''}
  ${d.social.linkedin||d.social.github?`
  <div class="blk"><h3>Online</h3>
    ${d.social.linkedin?`<a class="social-link" href="${d.social.linkedin}">LinkedIn</a>`:''}
    ${d.social.github?`<a class="social-link" href="${d.social.github}">GitHub</a>`:''}
  </div>`:''}
</div>
<div class="main">
  ${d.bio?`<div><div class="sec-wrap"><div class="sec-icon">★</div><div class="sec-title">Profile</div></div><p class="bio">${escHtml(d.bio)}</p></div>`:''}
  ${d.experience.length?`<div><div class="sec-wrap"><div class="sec-icon">▶</div><div class="sec-title">Experience</div></div>
  ${d.experience.map(e=>`<div class="exp-card"><div class="role">${escHtml(e.position)}</div><div class="co">${escHtml(e.company)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>${e.description?`<div class="desc">${escHtml(e.description)}</div>`:''}</div>`).join('')}
  </div>`:''}
  ${d.education.length?`<div><div class="sec-wrap"><div class="sec-icon">🎓</div><div class="sec-title">Education</div></div>
  ${d.education.map(e=>`<div class="edu-card"><div class="deg">${escHtml(e.degree)}${e.field?` — ${escHtml(e.field)}`:''}</div><div class="inst">${escHtml(e.institution)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}
  </div>`:''}
  ${d.certifications.length?`<div><div class="sec-wrap"><div class="sec-icon">✓</div><div class="sec-title">Certifications</div></div>
  ${d.certifications.map(c=>`<span class="cert-pill">${escHtml(c.name)} · ${escHtml(c.issuer)}</span>`).join('')}
  </div>`:''}
  <div class="footer">Generated ${d.generatedAt}</div>
</div>
</body></html>`;
  }
};
