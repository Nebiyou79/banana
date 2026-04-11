// backend/src/templates/template18_medical.js — Clean Medical/Healthcare style
const { escHtml, avatarTag, systemFont } = require('./templateHelpers');
module.exports = {
  name: 'Healthcare', description: 'Clinical precision and calm blue-green palette. Healthcare & medical.', primaryColor: '#0D9488', style: 'healthcare', thumbnailGradient: 'linear-gradient(135deg,#0D9488 0%,#0891B2 100%)',
  render(d) {
    const av = avatarTag(d.avatar, d.fullName, 86, '#0D9488');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:${systemFont('sans')};background:#f0fdfa;color:#134e4a;padding:0;max-width:840px;margin:auto}
.header{background:#fff;padding:28px 40px;border-bottom:3px solid #0D9488;display:flex;align-items:center;gap:22px}
.av img,.av .initials{width:86px;height:86px;border-radius:8px;object-fit:cover;border:2px solid #0D9488;display:inline-block}
.av .initials{background:#ccfbf1;display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#0D9488}
h1{font-size:22px;font-weight:700;color:#134e4a}
.tg{font-size:12px;color:#0D9488;margin-top:2px}
.ct{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px}.c{font-size:11px;color:#0f766e}
.body{display:grid;grid-template-columns:1fr 240px}
.main{padding:26px 32px;background:#fff;border-right:1px solid #ccfbf1}
.side{padding:26px 20px;background:#f0fdfa}
.st{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#0D9488;background:#ccfbf1;padding:4px 10px;margin-bottom:12px;border-radius:3px;display:inline-block}
.bio{font-size:13px;line-height:1.75;color:#374151;margin-bottom:20px}
.ei{border:1px solid #ccfbf1;border-radius:6px;padding:12px;margin-bottom:10px;background:#f0fdfa}
.ei .r{font-weight:700;font-size:13px;color:#134e4a}.ei .co{font-size:12px;color:#0D9488;font-weight:600}
.ei .dt{font-size:11px;color:#5eead4;margin:2px 0}.ei .de{font-size:12px;color:#0f766e;margin-top:4px;line-height:1.55}
.sk{display:inline-block;background:#ccfbf1;color:#0D9488;font-size:11px;font-weight:600;padding:3px 9px;border-radius:3px;margin:2px}
.bh{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#5eead4;margin-bottom:8px;margin-top:16px}
.edu{margin-bottom:10px;padding:8px;background:#fff;border-radius:4px;border:1px solid #ccfbf1}
.edu .d{font-weight:700;font-size:12px;color:#134e4a}.edu .i{font-size:11px;color:#0D9488}.edu .dt{font-size:10px;color:#5eead4}
.cert{background:#fff;border:1px solid #ccfbf1;border-radius:4px;padding:7px;margin-bottom:6px}
.cert .n{font-size:11px;font-weight:700;color:#134e4a}.cert .is{font-size:10px;color:#0D9488}
.foot{background:#0D9488;text-align:center;font-size:9px;color:rgba(255,255,255,0.7);padding:8px}
</style></head><body>
<div class="header"><div class="av">${av}</div><div><h1>${escHtml(d.fullName)}</h1>${d.headline?`<div class="tg">${escHtml(d.headline)}</div>`:''}<div class="ct">${d.email?`<span class="c">✉ ${escHtml(d.email)}</span>`:''} ${d.phone?`<span class="c">✆ ${escHtml(d.phone)}</span>`:''} ${d.location?`<span class="c">⌖ ${escHtml(d.location)}</span>`:''}</div></div></div>
<div class="body"><div class="main">
${d.bio?`<p class="bio">${escHtml(d.bio)}</p>`:''}
${d.experience.length?`<div class="st">Experience</div>${d.experience.map(e=>`<div class="ei"><div class="r">${escHtml(e.position)}</div><div class="co">${escHtml(e.company)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>${e.description?`<div class="de">${escHtml(e.description)}</div>`:''}</div>`).join('')}`:''}
${d.education.length?`<div style="margin-top:16px"><div class="st">Education</div>${d.education.map(e=>`<div class="edu"><div class="d">${escHtml(e.degree)}</div><div class="i">${escHtml(e.institution)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}</div>`:''}
</div><div class="side">
${d.skills.length?`<div class="bh" style="margin-top:0">Skills</div>${d.skills.map(s=>`<span class="sk">${escHtml(s)}</span>`).join('')}`:''}
${d.certifications.length?`<div class="bh">Certifications</div>${d.certifications.map(c=>`<div class="cert"><div class="n">${escHtml(c.name)}</div><div class="is">${escHtml(c.issuer)}</div></div>`).join('')}`:''}
${d.social.linkedin||d.social.github?`<div class="bh">Links</div>${d.social.linkedin?`<div style="font-size:11px;color:#0D9488;margin-bottom:4px">LinkedIn</div>`:''} ${d.social.github?`<div style="font-size:11px;color:#0D9488;">GitHub</div>`:''}`:''}
</div></div>
<div class="foot">Generated ${d.generatedAt}</div></body></html>`;
  }
};