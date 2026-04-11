// backend/src/templates/template19_magazine.js — Magazine Editorial, bold columns
const { escHtml, avatarTag, systemFont } = require('./templateHelpers');
module.exports = {
  name: 'Magazine', description: 'Editorial magazine layout with dramatic typography and bold columns.', primaryColor: '#be185d', style: 'magazine', thumbnailGradient: 'linear-gradient(135deg,#be185d 0%,#9d174d 100%)',
  render(d) {
    const av = avatarTag(d.avatar, d.fullName, 100, '#be185d');
    const sr = systemFont('serif'), sf = systemFont('sans');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:${sf};background:#fff;color:#1a1a1a;max-width:840px;margin:auto}
.cover{display:flex;background:#1a1a1a;min-height:200px}
.cover-left{width:220px;min-width:220px;background:#be185d;padding:32px 24px;display:flex;flex-direction:column;justify-content:flex-end}
.av img,.av .initials{width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.5);display:inline-block;margin-bottom:10px}
.av .initials{background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#fff}
.cv-title{font-size:8px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.6);margin-bottom:4px}
.cover-right{flex:1;padding:32px 36px;display:flex;flex-direction:column;justify-content:center}
h1{font-family:${sr};font-size:32px;font-weight:700;color:#fff;line-height:1.1;letter-spacing:-1px}
.tg{font-size:12px;color:#f9a8d4;margin-top:6px;text-transform:uppercase;letter-spacing:1.5px}
.ct-strip{background:#be185d;padding:8px 36px;display:flex;flex-wrap:wrap;gap:16px}
.c{font-size:11px;color:rgba(255,255,255,0.9)}
.body{display:grid;grid-template-columns:1fr 1fr;border-left:4px solid #be185d}
.col{padding:26px 28px}
.col:first-child{border-right:1px solid #f3f4f6}
.st{font-family:${sr};font-size:16px;font-weight:700;color:#be185d;border-bottom:2px solid #be185d;padding-bottom:3px;margin-bottom:14px}
.bio{font-size:13px;line-height:1.8;color:#374151;margin-bottom:20px}
.ei{margin-bottom:14px;padding:10px;border:1px solid #fce7f3;border-radius:4px}
.ei .r{font-weight:700;font-size:13px;color:#1a1a1a}.ei .co{font-size:12px;color:#be185d;font-weight:600}
.ei .dt{font-size:11px;color:#9ca3af}.ei .de{font-size:12px;color:#4B5563;margin-top:4px;line-height:1.55}
.sk{display:inline-block;background:#fdf2f8;border:1px solid #fce7f3;color:#be185d;font-size:11px;padding:3px 9px;border-radius:3px;margin:2px}
.edu{margin-bottom:10px;padding:8px;background:#fdf2f8;border-radius:4px}
.edu .d{font-weight:700;font-size:12px}.edu .i{font-size:11px;color:#be185d}.edu .dt{font-size:10px;color:#9ca3af}
.cert{border-left:3px solid #be185d;padding:6px 10px;margin-bottom:6px}
.cert .n{font-size:12px;font-weight:700}.cert .is{font-size:10px;color:#be185d}
.foot{text-align:center;font-size:9px;color:#d1d5db;padding:10px;border-top:1px solid #f3f4f6}
</style></head><body>
<div class="cover">
  <div class="cover-left"><div class="av">${av}</div><div class="cv-title">Curriculum Vitae</div></div>
  <div class="cover-right"><h1>${escHtml(d.fullName)}</h1>${d.headline?`<div class="tg">${escHtml(d.headline)}</div>`:''}</div>
</div>
<div class="ct-strip">${d.email?`<span class="c">✉ ${escHtml(d.email)}</span>`:''} ${d.phone?`<span class="c">✆ ${escHtml(d.phone)}</span>`:''} ${d.location?`<span class="c">⌖ ${escHtml(d.location)}</span>`:''} ${d.website?`<span class="c">⬡ ${escHtml(d.website)}</span>`:''}</div>
<div class="body">
<div class="col">
${d.bio?`<div class="st">Profile</div><p class="bio">${escHtml(d.bio)}</p>`:''}
${d.experience.length?`<div class="st">Experience</div>${d.experience.map(e=>`<div class="ei"><div class="r">${escHtml(e.position)}</div><div class="co">${escHtml(e.company)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>${e.description?`<div class="de">${escHtml(e.description)}</div>`:''}</div>`).join('')}`:''}
</div>
<div class="col">
${d.skills.length?`<div class="st">Skills</div><div style="margin-bottom:20px">${d.skills.map(s=>`<span class="sk">${escHtml(s)}</span>`).join('')}</div>`:''}
${d.education.length?`<div class="st">Education</div>${d.education.map(e=>`<div class="edu"><div class="d">${escHtml(e.degree)}</div><div class="i">${escHtml(e.institution)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}`:''}
${d.certifications.length?`<div class="st" style="margin-top:16px">Certifications</div>${d.certifications.map(c=>`<div class="cert"><div class="n">${escHtml(c.name)}</div><div class="is">${escHtml(c.issuer)}</div></div>`).join('')}`:''}
</div>
</div>
<div class="foot">Generated ${d.generatedAt}</div></body></html>`;
  }
};