// backend/src/templates/template15_nordic.js — Nordic, cool grey, serif headings, calm
const { escHtml, avatarTag, systemFont } = require('./templateHelpers');
module.exports = {
  name: 'Nordic', description: 'Calm Scandinavian design. Cool greys, serif headings, lots of space.', primaryColor: '#0891B2', style: 'nordic', thumbnailGradient: 'linear-gradient(135deg,#0891B2 0%,#0E7490 100%)',
  render(d) {
    const av = avatarTag(d.avatar, d.fullName, 84, '#0891B2');
    const sf = systemFont('sans'), sr = systemFont('serif');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:${sf};background:#f0f9ff;color:#0c4a6e;padding:48px 56px;max-width:840px;margin:auto}
.top{display:flex;align-items:center;gap:24px;margin-bottom:32px;padding-bottom:28px;border-bottom:2px solid #0891B2}
.av img,.av .initials{width:84px;height:84px;border-radius:50%;object-fit:cover;border:2px solid #0891B2;display:inline-block}
.av .initials{background:#e0f2fe;display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#0891B2}
h1{font-family:${sr};font-size:26px;font-weight:700;color:#0c4a6e;letter-spacing:-0.3px}
.tg{font-size:12px;color:#0891B2;margin-top:3px;font-style:italic}
.ct{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px}.c{font-size:11px;color:#0369a1}
.grid{display:grid;grid-template-columns:1fr 240px;gap:36px}
.st{font-family:${sr};font-size:16px;font-weight:700;color:#0891B2;margin-bottom:14px;padding-bottom:4px;border-bottom:1px solid #bae6fd}
.sec{margin-bottom:24px}
.bio{font-size:13px;line-height:1.8;color:#0369a1}
.ei{margin-bottom:14px}
.ei .r{font-weight:700;font-size:13px;color:#0c4a6e}.ei .co{font-size:12px;color:#0891B2;margin-top:1px}
.ei .dt{font-size:11px;color:#7dd3fc;margin:2px 0}.ei .de{font-size:12px;color:#0369a1;line-height:1.6;margin-top:4px}
.sk{display:inline-block;background:#e0f2fe;color:#0891B2;font-size:11px;padding:3px 9px;border-radius:3px;margin:2px}
.bh{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#7dd3fc;margin-bottom:8px}
.edu{margin-bottom:10px}.edu .d{font-weight:700;font-size:12px;color:#0c4a6e}.edu .i{font-size:11px;color:#0891B2}.edu .dt{font-size:10px;color:#7dd3fc}
.cert{border-left:2px solid #0891B2;padding:5px 9px;margin-bottom:7px}
.cert .n{font-size:12px;font-weight:700;color:#0c4a6e}.cert .is{font-size:10px;color:#0891B2}
.foot{font-size:9px;color:#bae6fd;text-align:center;margin-top:32px;padding-top:10px;border-top:1px solid #e0f2fe}
</style></head><body>
<div class="top"><div class="av">${av}</div><div><h1>${escHtml(d.fullName)}</h1>${d.headline?`<div class="tg">${escHtml(d.headline)}</div>`:''}<div class="ct">${d.email?`<span class="c">✉ ${escHtml(d.email)}</span>`:''} ${d.phone?`<span class="c">✆ ${escHtml(d.phone)}</span>`:''} ${d.location?`<span class="c">⌖ ${escHtml(d.location)}</span>`:''}</div></div></div>
<div class="grid"><div>
${d.bio?`<div class="sec"><div class="st">Profile</div><p class="bio">${escHtml(d.bio)}</p></div>`:''}
${d.experience.length?`<div class="sec"><div class="st">Experience</div>${d.experience.map(e=>`<div class="ei"><div class="r">${escHtml(e.position)}</div><div class="co">${escHtml(e.company)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>${e.description?`<div class="de">${escHtml(e.description)}</div>`:''}</div>`).join('')}</div>`:''}
${d.education.length?`<div class="sec"><div class="st">Education</div>${d.education.map(e=>`<div class="ei"><div class="r">${escHtml(e.degree)}</div><div class="co">${escHtml(e.institution)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}</div>`:''}
</div><div>
${d.skills.length?`<div style="margin-bottom:20px"><div class="bh">Skills</div>${d.skills.map(s=>`<span class="sk">${escHtml(s)}</span>`).join('')}</div>`:''}
${d.certifications.length?`<div style="margin-bottom:20px"><div class="bh">Certifications</div>${d.certifications.map(c=>`<div class="cert"><div class="n">${escHtml(c.name)}</div><div class="is">${escHtml(c.issuer)}</div></div>`).join('')}</div>`:''}
${d.social.linkedin?`<div><div class="bh">Online</div><div style="font-size:11px;color:#0891B2;margin-bottom:4px">LinkedIn</div>${d.social.github?`<div style="font-size:11px;color:#0891B2;">GitHub</div>`:''}</div>`:''}
</div></div>
<div class="foot">Curriculum Vitae &mdash; Generated ${d.generatedAt}</div></body></html>`;
  }
};