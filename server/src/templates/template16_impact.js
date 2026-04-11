// backend/src/templates/template16_impact.js — High Impact, big name, dark/amber
const { escHtml, avatarTag, systemFont } = require('./templateHelpers');
module.exports = {
  name: 'High Impact', description: 'Large name dominates the page. Maximum presence for senior roles.', primaryColor: '#D97706', style: 'impact', thumbnailGradient: 'linear-gradient(135deg,#1a1a1a 0%,#D97706 100%)',
  render(d) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:${systemFont('sans')};background:#fff;color:#1a1a1a;max-width:840px;margin:auto}
.banner{background:#1a1a1a;padding:44px 48px}
.banner h1{font-size:42px;font-weight:900;color:#fff;line-height:1;letter-spacing:-2px}
.banner .accent{color:#D97706}
.banner .tg{font-size:13px;color:#D97706;margin-top:8px;text-transform:uppercase;letter-spacing:2px;font-weight:600}
.ct-bar{background:#D97706;padding:10px 48px;display:flex;flex-wrap:wrap;gap:20px}
.c{font-size:11px;color:#1a1a1a;font-weight:600}
.body{display:grid;grid-template-columns:1fr 240px;padding:32px 48px;gap:36px}
.st{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#D97706;border-bottom:3px solid #D97706;padding-bottom:4px;margin-bottom:14px}
.bio{font-size:13px;line-height:1.75;color:#374151;margin-bottom:22px}
.ei{margin-bottom:16px;padding:12px;background:#fffbeb;border-radius:4px;border-left:4px solid #D97706}
.ei .r{font-weight:800;font-size:13px;color:#1a1a1a}.ei .co{font-size:12px;color:#D97706;font-weight:700}
.ei .dt{font-size:11px;color:#9ca3af}.ei .de{font-size:12px;color:#4B5563;margin-top:4px;line-height:1.55}
.sk{display:inline-block;background:#fffbeb;color:#D97706;border:1.5px solid #D97706;font-size:11px;font-weight:700;padding:3px 9px;border-radius:3px;margin:2px}
.bh{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#374151;margin:16px 0 8px}
.edu{margin-bottom:10px;padding:8px;background:#f9fafb;border-radius:4px}
.edu .d{font-weight:700;font-size:12px}.edu .i{font-size:11px;color:#D97706}.edu .dt{font-size:10px;color:#9ca3af}
.cert{border-left:3px solid #D97706;padding:5px 8px;margin-bottom:6px}
.cert .n{font-size:12px;font-weight:700}.cert .is{font-size:10px;color:#D97706}
.foot{border-top:3px solid #1a1a1a;padding:10px 48px;font-size:9px;color:#d1d5db;display:flex;justify-content:space-between}
</style></head><body>
<div class="banner"><h1>${escHtml(d.fullName.split(' ')[0])} <span class="accent">${escHtml(d.fullName.split(' ').slice(1).join(' '))}</span></h1>${d.headline?`<div class="tg">${escHtml(d.headline)}</div>`:''}</div>
<div class="ct-bar">${d.email?`<span class="c">✉ ${escHtml(d.email)}</span>`:''} ${d.phone?`<span class="c">✆ ${escHtml(d.phone)}</span>`:''} ${d.location?`<span class="c">⌖ ${escHtml(d.location)}</span>`:''} ${d.website?`<span class="c">⬡ ${escHtml(d.website)}</span>`:''}</div>
<div class="body"><div>
${d.bio?`<p class="bio">${escHtml(d.bio)}</p>`:''}
${d.experience.length?`<div class="st">Experience</div>${d.experience.map(e=>`<div class="ei"><div class="r">${escHtml(e.position)}</div><div class="co">${escHtml(e.company)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>${e.description?`<div class="de">${escHtml(e.description)}</div>`:''}</div>`).join('')}`:''}
${d.education.length?`<div class="st" style="margin-top:20px">Education</div>${d.education.map(e=>`<div class="edu"><div class="d">${escHtml(e.degree)}${e.field?` / ${escHtml(e.field)}`:''}</div><div class="i">${escHtml(e.institution)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}`:''}
</div><div>
${d.skills.length?`<div class="bh" style="margin-top:0">Skills</div>${d.skills.map(s=>`<span class="sk">${escHtml(s)}</span>`).join('')}`:''}
${d.certifications.length?`<div class="bh">Certifications</div>${d.certifications.map(c=>`<div class="cert"><div class="n">${escHtml(c.name)}</div><div class="is">${escHtml(c.issuer)}</div></div>`).join('')}`:''}
${d.social.linkedin||d.social.github?`<div class="bh">Links</div>${d.social.linkedin?`<div style="font-size:11px;color:#D97706;margin-bottom:4px">LinkedIn</div>`:''} ${d.social.github?`<div style="font-size:11px;color:#D97706;margin-bottom:4px">GitHub</div>`:''}`:''}
</div></div>
<div class="foot"><span>${escHtml(d.fullName)}</span><span>Generated ${d.generatedAt}</span></div></body></html>`;
  }
};