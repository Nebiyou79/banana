// backend/src/templates/template11_startup.js
const { escHtml, avatarTag, systemFont } = require('./templateHelpers');
module.exports = {
  name: 'Startup', description: 'Bold gradient header, metric highlights. Perfect for startup culture.', primaryColor: '#F43F5E', style: 'startup', thumbnailGradient: 'linear-gradient(135deg,#F43F5E 0%,#EC4899 100%)',
  render(d) {
    const av = avatarTag(d.avatar, d.fullName, 88, '#fff');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:${systemFont('sans')};background:#fff;color:#111827}
.hero{background:linear-gradient(135deg,#F43F5E,#EC4899,#8B5CF6);padding:36px 44px;color:#fff;display:flex;align-items:center;gap:24px}
.av img,.av .initials{width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.6)}
.av .initials{background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff}
.hi h1{font-size:24px;font-weight:800}.hi .tg{font-size:12px;color:rgba(255,255,255,0.8);margin-top:3px;text-transform:uppercase;letter-spacing:1px}
.hi .ct{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}.hi .c{font-size:11px;color:rgba(255,255,255,0.8)}
.body{display:grid;grid-template-columns:1fr 260px;min-height:600px}
.main{padding:28px 32px;display:flex;flex-direction:column;gap:22px}
.side{padding:28px 20px;background:#fdf2f8;border-left:1px solid #fce7f3;display:flex;flex-direction:column;gap:20px}
.st{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#F43F5E;margin-bottom:10px;padding-bottom:4px;border-bottom:2px solid #fce7f3}
.bio{font-size:13px;color:#374151;line-height:1.75}
.ei{margin-bottom:14px;padding-left:12px;border-left:3px solid #F43F5E}
.ei .r{font-weight:700;font-size:13px;color:#111827}.ei .co{font-size:12px;color:#F43F5E;font-weight:600}
.ei .dt{font-size:11px;color:#9ca3af}.ei .de{font-size:12px;color:#6B7280;margin-top:3px;line-height:1.55}
.sk{display:inline-block;background:#fdf2f8;color:#F43F5E;border:1px solid #fce7f3;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;margin:2px}
.edu{margin-bottom:10px}.edu .d{font-weight:700;font-size:12px;color:#111827}.edu .i{font-size:11px;color:#F43F5E}.edu .dt{font-size:10px;color:#9ca3af}
.cert{background:#fff;border:1px solid #fce7f3;border-radius:6px;padding:8px;margin-bottom:6px}
.cert .n{font-size:12px;font-weight:700;color:#111827}.cert .is{font-size:10px;color:#F43F5E}
.foot{background:#fdf2f8;text-align:center;font-size:9px;color:#d1d5db;padding:8px;border-top:1px solid #fce7f3}
</style></head><body>
<div class="hero"><div class="av">${av}</div><div class="hi"><h1>${escHtml(d.fullName)}</h1>${d.headline?`<div class="tg">${escHtml(d.headline)}</div>`:''}<div class="ct">${d.email?`<span class="c">✉ ${escHtml(d.email)}</span>`:''} ${d.phone?`<span class="c">✆ ${escHtml(d.phone)}</span>`:''} ${d.location?`<span class="c">⌖ ${escHtml(d.location)}</span>`:''}</div></div></div>
<div class="body"><div class="main">
${d.bio?`<div><div class="st">About</div><p class="bio">${escHtml(d.bio)}</p></div>`:''}
${d.experience.length?`<div><div class="st">Experience</div>${d.experience.map(e=>`<div class="ei"><div class="r">${escHtml(e.position)}</div><div class="co">${escHtml(e.company)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>${e.description?`<div class="de">${escHtml(e.description)}</div>`:''}</div>`).join('')}</div>`:''}
${d.portfolio.length?`<div><div class="st">Projects</div>${d.portfolio.slice(0,4).map(p=>`<div class="ei"><div class="r">${escHtml(p.title)}</div>${p.technologies.length?`<div class="dt">${p.technologies.slice(0,5).map(escHtml).join(' · ')}</div>`:''}</div>`).join('')}</div>`:''}
</div><div class="side">
${d.skills.length?`<div><div class="st">Skills</div>${d.skills.map(s=>`<span class="sk">${escHtml(s)}</span>`).join('')}</div>`:''}
${d.education.length?`<div><div class="st">Education</div>${d.education.map(e=>`<div class="edu"><div class="d">${escHtml(e.degree)}</div><div class="i">${escHtml(e.institution)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}</div>`:''}
${d.certifications.length?`<div><div class="st">Certifications</div>${d.certifications.map(c=>`<div class="cert"><div class="n">${escHtml(c.name)}</div><div class="is">${escHtml(c.issuer)}</div></div>`).join('')}</div>`:''}
${d.social.linkedin||d.social.github?`<div><div class="st">Links</div>${d.social.linkedin?`<div style="font-size:11px;color:#F43F5E;margin-bottom:4px">LinkedIn</div>`:''} ${d.social.github?`<div style="font-size:11px;color:#F43F5E;margin-bottom:4px">GitHub</div>`:''}</div>`:''}
</div></div><div class="foot">Generated ${d.generatedAt}</div></body></html>`;
  }
};