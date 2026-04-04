// backend/src/templates/template05_elegant.js
// Style: Elegant Serif — warm ivory background, burgundy accents, serif everywhere

const { escHtml, avatarTag } = require('./templateHelpers');

module.exports = {
  name: 'Elegant Serif',
  description: 'Warm ivory tones, burgundy accents, full-serif typesetting. Timeless elegance.',
  primaryColor: '#7B2D42',
  style: 'elegant',
  thumbnailGradient: 'linear-gradient(135deg,#7B2D42 0%,#a84060 100%)',

  render(d) {
    const avatar = avatarTag(d.avatar, d.fullName, 100, '#7B2D42');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Crimson Text',serif;background:#fdf8f0;color:#2d1f1a;padding:48px 56px;max-width:840px;margin:auto}
  .header{display:grid;grid-template-columns:auto 1fr;gap:28px;align-items:center;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #7B2D42}
  .avatar-wrap img,.initials{width:100px;height:100px;border-radius:50%;object-fit:cover;border:2px solid #7B2D42;display:inline-block}
  .initials{display:inline-flex;align-items:center;justify-content:center;background:#f5e8e0;font-size:34px;font-weight:700;color:#7B2D42;font-family:'Cormorant Garamond',serif}
  h1{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:700;color:#2d1f1a;line-height:1.1}
  .tagline{font-size:14px;color:#7B2D42;font-style:italic;margin-top:4px}
  .contacts{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px}
  .contact{font-size:12px;color:#6b4c3b}
  .section{margin-bottom:26px}
  .sec-title{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;color:#7B2D42;border-bottom:1px solid #c9a090;padding-bottom:3px;margin-bottom:14px}
  .bio{font-size:14px;line-height:1.8;color:#4a2e24;font-style:italic}
  .item{margin-bottom:16px;display:grid;grid-template-columns:1fr auto;gap:8px}
  .item .left-col .role{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:600;color:#2d1f1a}
  .item .left-col .sub{font-size:13px;color:#7B2D42}
  .item .right-col{font-size:12px;color:#a07060;text-align:right;white-space:nowrap}
  .item .desc{font-size:13px;color:#4a2e24;line-height:1.7;margin-top:4px;grid-column:1/-1}
  .skill-wrap{display:flex;flex-wrap:wrap;gap:6px}
  .skill{font-size:12px;background:#f5e8e0;color:#7B2D42;padding:4px 10px;border-radius:3px;border:1px solid #c9a090}
  .footer{font-size:9px;color:#c9a090;text-align:center;margin-top:32px;border-top:1px solid #e8d4c4;padding-top:10px}
</style></head><body>
<div class="header">
  <div class="avatar-wrap">${avatar}</div>
  <div>
    <h1>${escHtml(d.fullName)}</h1>
    ${d.headline?`<div class="tagline">${escHtml(d.headline)}</div>`:''}
    <div class="contacts">
      ${d.email?`<span class="contact">✉ ${escHtml(d.email)}</span>`:''}
      ${d.phone?`<span class="contact">✆ ${escHtml(d.phone)}</span>`:''}
      ${d.location?`<span class="contact">⌖ ${escHtml(d.location)}</span>`:''}
      ${d.website?`<span class="contact">⬡ ${escHtml(d.website)}</span>`:''}
    </div>
  </div>
</div>
${d.bio?`<div class="section"><div class="sec-title">Profile</div><p class="bio">${escHtml(d.bio)}</p></div>`:''}
${d.skills.length?`<div class="section"><div class="sec-title">Expertise</div><div class="skill-wrap">${d.skills.map(s=>`<span class="skill">${escHtml(s)}</span>`).join('')}</div></div>`:''}
${d.experience.length?`<div class="section"><div class="sec-title">Professional Experience</div>
${d.experience.map(e=>`<div class="item"><div class="left-col"><div class="role">${escHtml(e.position)}</div><div class="sub">${escHtml(e.company)}</div>${e.description?`<div class="desc">${escHtml(e.description)}</div>`:''}</div><div class="right-col">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}
</div>`:''}
${d.education.length?`<div class="section"><div class="sec-title">Education</div>
${d.education.map(e=>`<div class="item"><div class="left-col"><div class="role">${escHtml(e.degree)}${e.field?` in ${escHtml(e.field)}`:''}</div><div class="sub">${escHtml(e.institution)}</div></div><div class="right-col">${escHtml(e.startDate)} – ${escHtml(e.endDate)}</div></div>`).join('')}
</div>`:''}
${d.certifications.length?`<div class="section"><div class="sec-title">Certifications</div>
${d.certifications.map(c=>`<div class="item"><div class="left-col"><div class="role">${escHtml(c.name)}</div><div class="sub">${escHtml(c.issuer)}</div></div><div class="right-col">${escHtml(c.issueDate)}</div></div>`).join('')}
</div>`:''}
<div class="footer">Curriculum Vitae · Generated ${d.generatedAt}</div>
</body></html>`;
  }
};
