// backend/src/templates/template14_timeline.js — Visual Timeline, indigo, clean
const { escHtml, avatarTag, systemFont } = require('./templateHelpers');
module.exports = {
  name: 'Timeline', description: 'Visual timeline layout with indigo connector lines. Clean & chronological.', primaryColor: '#4F46E5', style: 'timeline', thumbnailGradient: 'linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%)',
  render(d) {
    const av = avatarTag(d.avatar, d.fullName, 80, '#4F46E5');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:${systemFont('sans')};background:#f8fafc;color:#0f172a;padding:0;max-width:860px;margin:auto}
.header{background:#0f172a;padding:32px 40px;display:flex;align-items:center;gap:24px}
.av img,.av .initials{width:80px;height:80px;border-radius:12px;object-fit:cover;border:2px solid #4F46E5;display:inline-block}
.av .initials{display:inline-flex;align-items:center;justify-content:center;background:#1e293b;font-size:26px;font-weight:700;color:#4F46E5}
.hi h1{font-size:24px;font-weight:700;color:#f8fafc}
.hi .tg{font-size:12px;color:#94a3b8;margin-top:2px}
.ct{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px}.c{font-size:11px;color:#94a3b8}
.body{display:grid;grid-template-columns:1fr 240px;background:#fff}
.main{padding:28px 32px;border-right:1px solid #f1f5f9}
.side{padding:28px 20px;background:#f8fafc}
.st{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#4F46E5;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.st::after{content:'';flex:1;height:1px;background:#e2e8f0}
.bio{font-size:13px;line-height:1.75;color:#475569;margin-bottom:22px}
.tl{position:relative;padding-left:20px}
.tl::before{content:'';position:absolute;left:6px;top:0;bottom:0;width:2px;background:#e2e8f0}
.tl-item{position:relative;margin-bottom:18px}
.tl-item::before{content:'';position:absolute;left:-17px;top:4px;width:10px;height:10px;border-radius:50%;background:#4F46E5;border:2px solid #fff;box-shadow:0 0 0 2px #4F46E5}
.tl-item .r{font-weight:700;font-size:13px;color:#0f172a}
.tl-item .co{font-size:12px;color:#4F46E5;font-weight:600;margin-top:1px}
.tl-item .dt{font-size:11px;color:#94a3b8;margin:2px 0}
.tl-item .de{font-size:12px;color:#64748b;line-height:1.55;margin-top:4px}
.sk{display:inline-block;background:#eef2ff;color:#4F46E5;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;margin:2px}
.bh{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:8px;margin-top:16px}
.edu{margin-bottom:10px}.edu .d{font-weight:700;font-size:12px;color:#0f172a}.edu .i{font-size:11px;color:#4F46E5}.edu .dt{font-size:10px;color:#94a3b8}
.cert{border-left:3px solid #4F46E5;padding:6px 10px;margin-bottom:6px;background:#eef2ff;border-radius:0 4px 4px 0}
.cert .n{font-size:11px;font-weight:700;color:#0f172a}.cert .is{font-size:10px;color:#4F46E5}
.foot{background:#0f172a;text-align:center;font-size:9px;color:#334155;padding:8px}
</style></head><body>
<div class="header"><div class="av">${av}</div><div class="hi"><h1>${escHtml(d.fullName)}</h1>${d.headline?`<div class="tg">${escHtml(d.headline)}</div>`:''}<div class="ct">${d.email?`<span class="c">✉ ${escHtml(d.email)}</span>`:''} ${d.phone?`<span class="c">✆ ${escHtml(d.phone)}</span>`:''} ${d.location?`<span class="c">⌖ ${escHtml(d.location)}</span>`:''}</div></div></div>
<div class="body"><div class="main">
${d.bio?`<div class="bio">${escHtml(d.bio)}</div>`:''}
${d.experience.length?`<div class="st">Experience</div><div class="tl">${d.experience.map(e=>`<div class="tl-item"><div class="r">${escHtml(e.position)}</div><div class="co">${escHtml(e.company)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>${e.description?`<div class="de">${escHtml(e.description)}</div>`:''}</div>`).join('')}</div>`:''}
${d.education.length?`<div class="st" style="margin-top:20px">Education</div><div class="tl">${d.education.map(e=>`<div class="tl-item"><div class="r">${escHtml(e.degree)}</div><div class="co">${escHtml(e.institution)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}</div>`:''}
</div>
<div class="side">
${d.skills.length?`<div class="bh" style="margin-top:0">Skills</div>${d.skills.map(s=>`<span class="sk">${escHtml(s)}</span>`).join('')}`:''}
${d.certifications.length?`<div class="bh">Certifications</div>${d.certifications.map(c=>`<div class="cert"><div class="n">${escHtml(c.name)}</div><div class="is">${escHtml(c.issuer)}</div></div>`).join('')}`:''}
${d.social.linkedin||d.social.github?`<div class="bh">Links</div>${d.social.linkedin?`<div style="font-size:11px;color:#4F46E5;margin-bottom:4px">LinkedIn</div>`:''} ${d.social.github?`<div style="font-size:11px;color:#4F46E5;margin-bottom:4px">GitHub</div>`:''}`:''}
</div></div>
<div class="foot">Generated ${d.generatedAt}</div></body></html>`;
  }
};