// backend/src/templates/template12_minimal.js — Pure Minimal, ink-saving, ATS-first
const { escHtml, avatarTag, systemFont } = require('./templateHelpers');
module.exports = {
  name: 'Pure Minimal', description: 'Zero-noise, maximum readability. Ideal for ATS parsing.', primaryColor: '#111827', style: 'minimal', thumbnailGradient: 'linear-gradient(135deg,#111827 0%,#374151 100%)',
  render(d) {
    const sf = systemFont('sans'), sr = systemFont('serif');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:${sf};background:#fff;color:#111827;padding:48px 56px;max-width:800px;margin:auto}
h1{font-family:${sr};font-size:28px;font-weight:400;letter-spacing:-0.5px;color:#111827}
.sub{font-size:13px;color:#6B7280;margin-top:4px}
.contacts{display:flex;flex-wrap:wrap;gap:16px;margin-top:10px;padding-bottom:16px;border-bottom:1px solid #111827}
.c{font-size:11px;color:#374151}
.st{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:#111827;margin:22px 0 10px}
.bio{font-size:13px;line-height:1.8;color:#374151}
.ei{margin-bottom:14px;display:grid;grid-template-columns:1fr auto}
.ei .r{font-weight:700;font-size:13px}.ei .co{font-size:12px;color:#6B7280;margin-top:1px}
.ei .dt{font-size:11px;color:#9ca3af;text-align:right;white-space:nowrap}
.ei .de{font-size:12px;color:#4B5563;line-height:1.6;margin-top:4px;grid-column:1/-1}
.sk{font-size:12px;color:#374151;display:inline;} .sk::after{content:' ·'; color:#d1d5db}
.sk:last-child::after{content:''}
.footer{font-size:9px;color:#d1d5db;text-align:right;margin-top:32px;border-top:1px solid #f3f4f6;padding-top:8px}
</style></head><body>
<h1>${escHtml(d.fullName)}</h1>
${d.headline?`<div class="sub">${escHtml(d.headline)}</div>`:''}
<div class="contacts">
${d.email?`<span class="c">${escHtml(d.email)}</span>`:''}${d.phone?`<span class="c">${escHtml(d.phone)}</span>`:''}${d.location?`<span class="c">${escHtml(d.location)}</span>`:''}${d.website?`<span class="c">${escHtml(d.website)}</span>`:''}
</div>
${d.bio?`<div class="st">Profile</div><p class="bio">${escHtml(d.bio)}</p>`:''}
${d.skills.length?`<div class="st">Skills</div><p>${d.skills.map(s=>`<span class="sk">${escHtml(s)}</span>`).join('')}</p>`:''}
${d.experience.length?`<div class="st">Experience</div>${d.experience.map(e=>`<div class="ei"><div><div class="r">${escHtml(e.position)}</div><div class="co">${escHtml(e.company)}</div></div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>${e.description?`<div class="de">${escHtml(e.description)}</div>`:''}</div>`).join('')}`:''}
${d.education.length?`<div class="st">Education</div>${d.education.map(e=>`<div class="ei"><div><div class="r">${escHtml(e.degree)}${e.field?` in ${escHtml(e.field)}`:''}</div><div class="co">${escHtml(e.institution)}</div></div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}`:''}
${d.certifications.length?`<div class="st">Certifications</div>${d.certifications.map(c=>`<div class="ei"><div><div class="r">${escHtml(c.name)}</div><div class="co">${escHtml(c.issuer)}</div></div><div class="dt">${escHtml(c.issueDate)}</div></div>`).join('')}`:''}
<div class="footer">Generated ${d.generatedAt}</div>
</body></html>`;
  }
};