// backend/src/templates/template06_tech.js
// Style: Tech / Developer — monospace, terminal-inspired, green-on-dark

const { escHtml, avatarTag } = require('./templateHelpers');

module.exports = {
  name: 'Tech Developer',
  description: 'Terminal-inspired monospace design. Ideal for software engineers.',
  primaryColor: '#10B981',
  style: 'tech',
  thumbnailGradient: 'linear-gradient(135deg,#0d1117 0%,#161b22 100%)',

  render(d) {
    const avatar = avatarTag(d.avatar, d.fullName, 88, '#10B981');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'JetBrains Mono',monospace;background:#0d1117;color:#c9d1d9;display:flex;min-height:100vh}
  .left{width:250px;min-width:250px;background:#161b22;border-right:1px solid #21262d;padding:32px 20px;display:flex;flex-direction:column;gap:24px}
  .avatar-wrap{text-align:center}
  .avatar-wrap img,.initials{width:88px;height:88px;border-radius:6px;object-fit:cover;border:2px solid #10B981;display:inline-block}
  .initials{display:inline-flex;align-items:center;justify-content:center;background:#21262d;font-size:26px;font-weight:700;color:#10B981}
  .name{font-size:14px;font-weight:700;color:#e6edf3;text-align:center;margin-top:8px;word-break:break-word}
  .prompt{font-size:10px;color:#10B981;text-align:center;margin-top:3px}
  .bl-title{font-size:9px;font-weight:700;color:#10B981;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #21262d;padding-bottom:5px;margin-bottom:8px}
  .bl-title::before{content:'# '}
  .ct{font-size:11px;color:#8b949e;margin-bottom:6px;word-break:break-all}
  .skill{display:inline-block;font-size:10px;background:#21262d;color:#10B981;padding:2px 6px;border-radius:3px;margin:2px;border:1px solid #30363d}
  .social{font-size:10px;color:#58a6ff;display:block;margin-bottom:4px}
  .main{flex:1;padding:32px 28px;display:flex;flex-direction:column;gap:22px}
  .sec{display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:11px;font-weight:700;color:#10B981}
  .sec::before{content:'> '}
  .sec::after{content:'';flex:1;height:1px;background:#21262d}
  .bio{font-size:12px;color:#8b949e;line-height:1.7}
  .exp-item{background:#161b22;border:1px solid #21262d;border-left:3px solid #10B981;border-radius:4px;padding:10px 12px;margin-bottom:10px}
  .exp-item .role{font-size:13px;font-weight:700;color:#e6edf3}
  .exp-item .co{font-size:11px;color:#58a6ff}
  .exp-item .dt{font-size:10px;color:#6e7681;margin:3px 0}
  .exp-item .desc{font-size:11px;color:#8b949e;line-height:1.6;margin-top:5px}
  .edu-item,.cert-item{border-bottom:1px solid #21262d;padding-bottom:10px;margin-bottom:10px}
  .edu-item .deg{font-size:13px;font-weight:700;color:#e6edf3}
  .edu-item .inst{font-size:11px;color:#58a6ff}
  .edu-item .dt,.cert-item .dt{font-size:10px;color:#6e7681;margin-top:2px}
  .cert-item .cn{font-size:12px;font-weight:700;color:#e6edf3}
  .cert-item .ci{font-size:11px;color:#58a6ff}
  .footer{margin-top:auto;font-size:9px;color:#21262d;padding-top:16px}
</style></head><body>
<div class="left">
  <div>
    <div class="avatar-wrap">${avatar}</div>
    <div class="name">${escHtml(d.fullName)}</div>
    ${d.headline?`<div class="prompt">$ ${escHtml(d.headline)}</div>`:''}
  </div>
  <div><div class="bl-title">contact</div>
    ${d.email?`<div class="ct">${escHtml(d.email)}</div>`:''}
    ${d.phone?`<div class="ct">${escHtml(d.phone)}</div>`:''}
    ${d.location?`<div class="ct">${escHtml(d.location)}</div>`:''}
    ${d.website?`<div class="ct">${escHtml(d.website)}</div>`:''}
  </div>
  ${d.social.linkedin||d.social.github?`<div><div class="bl-title">links</div>
    ${d.social.linkedin?`<a class="social" href="${d.social.linkedin}">linkedin</a>`:''}
    ${d.social.github?`<a class="social" href="${d.social.github}">github</a>`:''}
    ${d.social.twitter?`<a class="social" href="${d.social.twitter}">twitter</a>`:''}
  </div>`:''}
  ${d.skills.length?`<div><div class="bl-title">tech stack</div>
    ${d.skills.map(s=>`<span class="skill">${escHtml(s)}</span>`).join('')}
  </div>`:''}
</div>
<div class="main">
  ${d.bio?`<div><div class="sec">about</div><p class="bio">${escHtml(d.bio)}</p></div>`:''}
  ${d.experience.length?`<div><div class="sec">experience</div>
  ${d.experience.map(e=>`<div class="exp-item"><div class="role">${escHtml(e.position)}</div><div class="co">${escHtml(e.company)}</div><div class="dt">${escHtml(e.startDate)} → ${escHtml(e.endDate)}</div>${e.description?`<div class="desc">${escHtml(e.description)}</div>`:''}</div>`).join('')}
  </div>`:''}
  ${d.education.length?`<div><div class="sec">education</div>
  ${d.education.map(e=>`<div class="edu-item"><div class="deg">${escHtml(e.degree)}${e.field?` / ${escHtml(e.field)}`:''}</div><div class="inst">${escHtml(e.institution)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}
  </div>`:''}
  ${d.certifications.length?`<div><div class="sec">certifications</div>
  ${d.certifications.map(c=>`<div class="cert-item"><div class="cn">${escHtml(c.name)}</div><div class="ci">${escHtml(c.issuer)}</div><div class="dt">${escHtml(c.issueDate)}</div></div>`).join('')}
  </div>`:''}
  <div class="footer">// generated on ${d.generatedAt}</div>
</div>
</body></html>`;
  }
};
