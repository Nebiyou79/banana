// backend/src/templates/template13_geometric.js — Geometric, diagonal accents, orange
const { escHtml, avatarTag, systemFont } = require('./templateHelpers');
module.exports = {
  name: 'Geometric', description: 'Bold diagonal accent block, strong typography, energetic orange.', primaryColor: '#EA580C', style: 'geometric', thumbnailGradient: 'linear-gradient(135deg,#EA580C 0%,#FB923C 100%)',
  render(d) {
    const av = avatarTag(d.avatar, d.fullName, 92, '#EA580C');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:${systemFont('sans')};background:#fff;color:#1c1917;display:flex;min-height:100vh}
.left{width:250px;min-width:250px;background:#1c1917;padding:0;display:flex;flex-direction:column;position:relative;overflow:hidden}
.left-top{background:#EA580C;padding:36px 22px 28px;clip-path:polygon(0 0,100% 0,100% 85%,0 100%)}
.av{text-align:center;margin-bottom:14px}
.av img,.av .initials{width:92px;height:92px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.5);display:inline-block}
.av .initials{background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff}
.name{font-size:18px;font-weight:700;color:#fff;text-align:center;line-height:1.2}
.tg{font-size:10px;color:rgba(255,255,255,0.75);text-align:center;text-transform:uppercase;letter-spacing:1px;margin-top:3px}
.left-body{padding:24px 20px;flex:1;display:flex;flex-direction:column;gap:18px}
.bh{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#EA580C;margin-bottom:8px}
.ct{font-size:11px;color:#a8a29e;margin-bottom:6px;word-break:break-all}
.sk{display:inline-block;background:#292524;color:#FB923C;font-size:11px;padding:3px 8px;border-radius:3px;margin:2px}
.sl{font-size:11px;color:#78716c;display:block;margin-bottom:4px}
.main{flex:1;padding:36px 32px;display:flex;flex-direction:column;gap:22px}
.st{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#EA580C;border-bottom:2px solid #EA580C;padding-bottom:3px;margin-bottom:12px}
.bio{font-size:13px;color:#44403c;line-height:1.75}
.ei{margin-bottom:14px;padding-left:12px;border-left:3px solid #fed7aa}
.ei .r{font-weight:700;font-size:13px;color:#1c1917}.ei .co{font-size:12px;color:#EA580C;font-weight:600}
.ei .dt{font-size:11px;color:#a8a29e}.ei .de{font-size:12px;color:#57534e;margin-top:4px;line-height:1.55}
.edu{margin-bottom:10px}.edu .d{font-weight:700;font-size:13px}.edu .i{font-size:12px;color:#78716c}.edu .dt{font-size:11px;color:#a8a29e}
.foot{font-size:9px;color:#d1d5db;text-align:right;margin-top:auto;padding-top:12px}
</style></head><body>
<div class="left"><div class="left-top"><div class="av">${av}</div><div class="name">${escHtml(d.fullName)}</div>${d.headline?`<div class="tg">${escHtml(d.headline)}</div>`:''}</div>
<div class="left-body">
<div><div class="bh">Contact</div>${d.email?`<div class="ct">✉ ${escHtml(d.email)}</div>`:''} ${d.phone?`<div class="ct">✆ ${escHtml(d.phone)}</div>`:''} ${d.location?`<div class="ct">⌖ ${escHtml(d.location)}</div>`:''}</div>
${d.skills.length?`<div><div class="bh">Skills</div>${d.skills.map(s=>`<span class="sk">${escHtml(s)}</span>`).join('')}</div>`:''}
${d.social.linkedin?`<div><div class="bh">Links</div><a class="sl" href="${d.social.linkedin}">LinkedIn</a>${d.social.github?`<a class="sl" href="${d.social.github}">GitHub</a>`:''}</div>`:''}
</div></div>
<div class="main">
${d.bio?`<div><div class="st">Profile</div><p class="bio">${escHtml(d.bio)}</p></div>`:''}
${d.experience.length?`<div><div class="st">Experience</div>${d.experience.map(e=>`<div class="ei"><div class="r">${escHtml(e.position)}</div><div class="co">${escHtml(e.company)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div>${e.description?`<div class="de">${escHtml(e.description)}</div>`:''}</div>`).join('')}</div>`:''}
${d.education.length?`<div><div class="st">Education</div>${d.education.map(e=>`<div class="edu"><div class="d">${escHtml(e.degree)}${e.field?` – ${escHtml(e.field)}`:''}</div><div class="i">${escHtml(e.institution)}</div><div class="dt">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}</div>`:''}
${d.certifications.length?`<div><div class="st">Certifications</div>${d.certifications.map(c=>`<div class="edu"><div class="d">${escHtml(c.name)}</div><div class="i">${escHtml(c.issuer)}</div><div class="dt">${escHtml(c.issueDate)}</div></div>`).join('')}</div>`:''}
<div class="foot">Generated ${d.generatedAt}</div>
</div></body></html>`;
  }
};