// backend/src/templates/template17_retro.js — Retro, typewriter feel, sepia
const { escHtml, avatarTag, systemFont } = require('./templateHelpers');
module.exports = {
  name: 'Retro Type', description: 'Typewriter aesthetic with sepia tones. Vintage and memorable.', primaryColor: '#92400E', style: 'retro', thumbnailGradient: 'linear-gradient(135deg,#92400E 0%,#B45309 100%)',
  render(d) {
    const av = avatarTag(d.avatar, d.fullName, 80, '#92400E');
    const mono = systemFont('mono');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:${mono};background:#fef3c7;color:#451a03;padding:44px 52px;max-width:840px;margin:auto}
.top{border:2px solid #92400E;padding:28px;margin-bottom:28px;display:flex;gap:20px;align-items:center;background:#fffbeb}
.av img,.av .initials{width:80px;height:80px;border-radius:4px;object-fit:cover;border:2px solid #92400E;display:inline-block}
.av .initials{background:#fef3c7;display:inline-flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#92400E}
h1{font-size:22px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#451a03}
.tg{font-size:11px;color:#92400E;margin-top:4px;text-transform:uppercase;letter-spacing:1.5px}
.ct{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}.c{font-size:10px;color:#92400E}
.st{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:#92400E;border-bottom:1px solid #92400E;padding-bottom:3px;margin:20px 0 12px}
.bio{font-size:12px;line-height:1.8;color:#451a03;border-left:3px solid #92400E;padding-left:12px;font-style:italic}
.ei{margin-bottom:14px;padding:10px;border:1px solid #d97706;background:#fffbeb}
.ei .r{font-weight:700;font-size:12px;text-transform:uppercase;color:#451a03}
.ei .co{font-size:11px;color:#92400E}.ei .dt{font-size:10px;color:#b45309}.ei .de{font-size:11px;color:#451a03;margin-top:4px;line-height:1.6}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.sk{display:inline-block;border:1px solid #92400E;color:#92400E;font-size:10px;padding:2px 7px;margin:2px}
.edu{margin-bottom:10px;padding:8px;border:1px dashed #d97706}
.edu .d{font-weight:700;font-size:11px;text-transform:uppercase}.edu .i{font-size:11px;color:#92400E}.edu .dt{font-size:10px;color:#b45309}
.cert{border:1px solid #d97706;padding:6px;margin-bottom:5px}
.cert .n{font-size:11px;font-weight:700}.cert .is{font-size:10px;color:#92400E}
.foot{margin-top:28px;text-align:center;font-size:9px;color:#b45309;border-top:1px solid #d97706;padding-top:8px;text-transform:uppercase;letter-spacing:1px}
</style></head><body>
<div class="top"><div class="av">${av}</div><div><h1>${escHtml(d.fullName)}</h1>${d.headline?`<div class="tg">${escHtml(d.headline)}</div>`:''}<div class="ct">${d.email?`<span class="c">✉ ${escHtml(d.email)}</span>`:''} ${d.phone?`<span class="c">✆ ${escHtml(d.phone)}</span>`:''} ${d.location?`<span class="c">⌖ ${escHtml(d.location)}</span>`:''}</div></div></div>
${d.bio?`<div class="st">Profile</div><p class="bio">${escHtml(d.bio)}</p>`:''}
${d.experience.length?`<div class="st">Work Experience</div>${d.experience.map(e=>`<div class="ei"><div class="r">${escHtml(e.position)}</div><div class="co">${escHtml(e.company)}</div><div class="dt">${escHtml(e.startDate)} &mdash; ${escHtml(e.endDate)}</div>${e.description?`<div class="de">${escHtml(e.description)}</div>`:''}</div>`).join('')}`:''}
<div class="cols">
${d.education.length?`<div><div class="st" style="margin-top:0">Education</div>${d.education.map(e=>`<div class="edu"><div class="d">${escHtml(e.degree)}</div><div class="i">${escHtml(e.institution)}</div><div class="dt">${escHtml(e.startDate)} &mdash; ${escHtml(e.endDate)}</div></div>`).join('')}</div>`:'<div></div>'}
<div>${d.skills.length?`<div class="st" style="margin-top:0">Skills</div>${d.skills.map(s=>`<span class="sk">${escHtml(s)}</span>`).join('')}`:''} ${d.certifications.length?`<div class="st">Certifications</div>${d.certifications.map(c=>`<div class="cert"><div class="n">${escHtml(c.name)}</div><div class="is">${escHtml(c.issuer)}</div></div>`).join('')}`:''}</div>
</div>
<div class="foot">Curriculum Vitae &mdash; ${escHtml(d.fullName)} &mdash; Generated ${d.generatedAt}</div></body></html>`;
  }
};