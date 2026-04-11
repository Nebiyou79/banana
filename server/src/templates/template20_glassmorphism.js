// backend/src/templates/template20_glassmorphism.js — Glass/Gradient, vibrant
const { escHtml, avatarTag, systemFont } = require('./templateHelpers');
module.exports = {
  name: 'Glass & Gradient', description: 'Vibrant gradient background with frosted-glass cards. Eye-catching.', primaryColor: '#6366F1', style: 'glass', thumbnailGradient: 'linear-gradient(135deg,#6366F1 0%,#8B5CF6 50%,#EC4899 100%)',
  render(d) {
    const av = avatarTag(d.avatar, d.fullName, 90, 'rgba(255,255,255,0.8)');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:${systemFont('sans')};background:linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4c1d95 70%,#831843 100%);min-height:100vh;padding:32px 36px;color:#fff}
.card{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:16px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.header{display:flex;align-items:center;gap:24px;padding:28px 32px;margin-bottom:16px}
.av img,.av .initials{width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.5);display:inline-block}
.av .initials{background:rgba(255,255,255,0.15);display:inline-flex;align-items:center;justify-content:center;font-size:30px;font-weight:700;color:#fff}
h1{font-size:26px;font-weight:800;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,0.3)}
.tg{font-size:12px;color:rgba(255,255,255,0.75);margin-top:3px}
.ct{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.c{font-size:11px;color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.1);padding:3px 9px;border-radius:20px}
.grid{display:grid;grid-template-columns:1fr 240px;gap:16px}
.inner{padding:22px 26px}
.st{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.5);margin-bottom:12px}
.bio{font-size:13px;line-height:1.75;color:rgba(255,255,255,0.85);margin-bottom:20px}
.ei{padding:12px;margin-bottom:10px;background:rgba(255,255,255,0.06);border-radius:8px;border:1px solid rgba(255,255,255,0.1)}
.ei .r{font-weight:700;font-size:13px;color:#fff}.ei .co{font-size:12px;color:#c4b5fd;font-weight:600}
.ei .dt{font-size:11px;color:rgba(255,255,255,0.4);margin:2px 0}.ei .de{font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;line-height:1.55}
.sk{display:inline-block;background:rgba(255,255,255,0.15);color:#fff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;margin:2px;border:1px solid rgba(255,255,255,0.2)}
.bh{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.4);margin-bottom:8px;margin-top:16px}
.edu{margin-bottom:10px;padding:8px;background:rgba(255,255,255,0.06);border-radius:6px}
.edu .d{font-weight:700;font-size:12px;color:#fff}.edu .i{font-size:11px;color:#c4b5fd}.edu .dt{font-size:10px;color:rgba(255,255,255,0.4)}
.cert{border-left:3px solid rgba(196,181,253,0.6);padding:6px 10px;margin-bottom:6px}
.cert .n{font-size:12px;font-weight:700;color:#fff}.cert .is{font-size:10px;color:#c4b5fd}
.foot{text-align:center;font-size:9px;color:rgba(255,255,255,0.25);margin-top:16px;padding-top:10px}
</style></head><body>
<div class="card header">
  <div class="av">${av}</div>
  <div><h1>${escHtml(d.fullName)}</h1>${d.headline?`<div class="tg">${escHtml(d.headline)}</div>`:''}<div class="ct">${d.email?`<span class="c">✉ ${escHtml(d.email)}</span>`:''} ${d.phone?`<span class="c">✆ ${escHtml(d.phone)}</span>`:''} ${d.location?`<span class="c">⌖ ${escHtml(d.location)}</span>`:''}</div></div>
</div>
<div class="grid">
<div class="card inner">
${d.bio?`<div class="st">About</div><p class="bio">${escHtml(d.bio)}</p>`:''}
${d.experience.length?`<div class="st">Experience</div>${d.experience.map(e=>`<div class="ei"><div class="r">${escHtml(e.position)}</div><div class="co">${escHtml(e.company)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>${e.description?`<div class="de">${escHtml(e.description)}</div>`:''}</div>`).join('')}`:''}
${d.education.length?`<div class="st" style="margin-top:16px">Education</div>${d.education.map(e=>`<div class="edu"><div class="d">${escHtml(e.degree)}</div><div class="i">${escHtml(e.institution)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}`:''}
</div>
<div class="card inner">
${d.skills.length?`<div class="bh" style="margin-top:0">Skills</div>${d.skills.map(s=>`<span class="sk">${escHtml(s)}</span>`).join('')}`:''}
${d.certifications.length?`<div class="bh">Certifications</div>${d.certifications.map(c=>`<div class="cert"><div class="n">${escHtml(c.name)}</div><div class="is">${escHtml(c.issuer)}</div></div>`).join('')}`:''}
${d.social.linkedin||d.social.github?`<div class="bh">Links</div>${d.social.linkedin?`<div style="font-size:11px;color:#c4b5fd;margin-bottom:4px">LinkedIn</div>`:''} ${d.social.github?`<div style="font-size:11px;color:#c4b5fd;">GitHub</div>`:''}`:''}
</div>
</div>
<div class="foot">Generated ${d.generatedAt}</div></body></html>`;
  }
};