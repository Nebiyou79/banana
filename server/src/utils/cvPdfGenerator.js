// backend/src/utils/cvPdfGenerator.js
// ─────────────────────────────────────────────────────────────────────────────
// Cross-platform HTML → PDF pipeline.
//
// Rendering chain (first success wins):
//   1. wkhtmltopdf  — auto-detected on Windows + Linux + macOS
//   2. Puppeteer    — if installed in the project (npm install puppeteer)
//   3. Structured fallback — pure-Node PDF that mirrors the HTML template layout
//
// The KEY FIX for "preview ≠ download":
//   All templates must use INLINE system fonts (no @import, no <link>).
//   The patch script (patch_all_templates.js) removes all Google Font imports.
//   This ensures wkhtmltopdf renders identically to the browser preview.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { spawn, execSync } = require('child_process');
const path  = require('path');
const fs    = require('fs');
const os    = require('os');

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert an HTML string to a PDF at outputPath.
 *
 * @param {string} html       - Complete HTML document (templates must have no @import)
 * @param {string} outputPath - Absolute destination path for the PDF
 * @param {object} [cvData]   - Candidate data (used by structured fallback)
 * @returns {Promise<string>} - Resolves with outputPath
 */
async function htmlToPdf(html, outputPath, cvData = null) {
  // ── 1. Try wkhtmltopdf ────────────────────────────────────────────────────
  const wk = _findWkhtmltopdf();
  if (wk) {
    console.log(`[cvPdfGenerator] Using wkhtmltopdf: ${wk}`);
    try {
      await _runWkhtmltopdf(wk, html, outputPath);
      if (_isValidPdf(outputPath)) return outputPath;
      console.warn('[cvPdfGenerator] wkhtmltopdf produced empty/invalid PDF, trying next renderer');
    } catch (err) {
      console.warn(`[cvPdfGenerator] wkhtmltopdf failed: ${err.message}`);
    }
  } else {
    console.info('[cvPdfGenerator] wkhtmltopdf not found');
  }

  // ── 2. Try Puppeteer (optional dep) ──────────────────────────────────────
  try {
    const pup = require('puppeteer');
    console.log('[cvPdfGenerator] Using Puppeteer');
    await _runPuppeteer(pup, html, outputPath);
    if (_isValidPdf(outputPath)) return outputPath;
  } catch (err) {
    if (!err.code || err.code !== 'MODULE_NOT_FOUND') {
      console.warn(`[cvPdfGenerator] Puppeteer failed: ${err.message}`);
    }
  }

  // ── 3. Structured fallback renderer ──────────────────────────────────────
  console.info('[cvPdfGenerator] Using structured fallback PDF renderer');
  _buildFallbackPdf(html, outputPath, cvData);
  return outputPath;
}

// ─────────────────────────────────────────────────────────────────────────────
// wkhtmltopdf
// ─────────────────────────────────────────────────────────────────────────────

function _findWkhtmltopdf() {
  // PATH lookup
  try {
    const cmd = process.platform === 'win32' ? 'where wkhtmltopdf' : 'which wkhtmltopdf';
    const r = execSync(cmd, { timeout: 3000, stdio: ['ignore','pipe','ignore'] }).toString().trim().split(/\r?\n/)[0];
    if (r && fs.existsSync(r)) return r;
  } catch (_) {}

  // Fixed installation paths
  const paths = [
    // Windows
    'C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe',
    'C:\\Program Files (x86)\\wkhtmltopdf\\bin\\wkhtmltopdf.exe',
    'C:\\wkhtmltopdf\\bin\\wkhtmltopdf.exe',
    path.join(os.homedir(), 'AppData','Local','Programs','wkhtmltopdf','bin','wkhtmltopdf.exe'),
    path.join(os.homedir(), 'scoop','apps','wkhtmltopdf','current','bin','wkhtmltopdf.exe'),
    // Linux / macOS
    '/usr/bin/wkhtmltopdf',
    '/usr/local/bin/wkhtmltopdf',
    '/opt/homebrew/bin/wkhtmltopdf',
    '/snap/bin/wkhtmltopdf',
  ];
  return paths.find(p => { try { return fs.existsSync(p); } catch(_){ return false; } }) || null;
}

function _runWkhtmltopdf(wkPath, html, outputPath) {
  return new Promise((resolve, reject) => {
    const tmpHtml = path.join(os.tmpdir(), `cv_${Date.now()}_${Math.random().toString(36).slice(2)}.html`);
    try { fs.writeFileSync(tmpHtml, html, 'utf8'); } catch (e) { return reject(e); }

    const args = [
      '--page-size', 'A4',
      '--margin-top', '0', '--margin-right', '0',
      '--margin-bottom', '0', '--margin-left', '0',
      '--encoding', 'UTF-8',
      '--enable-local-file-access',
      '--disable-smart-shrinking',
      '--print-media-type',
      '--quiet',
      tmpHtml, outputPath,
    ];

    const proc = spawn(wkPath, args, { timeout: 60000 });
    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => {
      try { fs.unlinkSync(tmpHtml); } catch (_) {}
      if (_isValidPdf(outputPath)) resolve(outputPath);
      else reject(new Error(`wkhtmltopdf exit ${code}: ${stderr.slice(0, 300)}`));
    });
    proc.on('error', err => {
      try { fs.unlinkSync(tmpHtml); } catch (_) {}
      reject(err);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Puppeteer (optional)
// ─────────────────────────────────────────────────────────────────────────────

async function _runPuppeteer(puppeteer, html, outputPath) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.pdf({
      path: outputPath, format: 'A4',
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Structured Fallback PDF Builder
// Produces a clean, well-formatted PDF from the candidate data
// ─────────────────────────────────────────────────────────────────────────────

function _buildFallbackPdf(html, outputPath, cvData) {
  // Step 1: Properly extract clean text by removing <head>, <style>, <script> first
  const cleanText = _extractCleanText(html);

  // Step 2: If cvData provided, use structured layout
  if (cvData && cvData.fullName) {
    const pdf = _renderStructuredPdf(cvData);
    fs.writeFileSync(outputPath, pdf);
  } else {
    // Step 3: Plain text layout from extracted content
    const pdf = _renderTextPdf(cleanText, cvData);
    fs.writeFileSync(outputPath, pdf);
  }
}

/**
 * Extract ONLY visible text from HTML — strips head, style, script first.
 */
function _extractCleanText(html) {
  let s = html;
  // Remove everything in <head>
  s = s.replace(/<head[\s\S]*?<\/head>/gi, '');
  // Remove style blocks anywhere
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Remove script blocks
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
  // Decode entities
  s = s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
       .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ')
       .replace(/&ndash;/g,'–').replace(/&mdash;/g,'—').replace(/&middot;/g,' · ')
       .replace(/&#\d+;/g, ' ');
  // Strip remaining tags
  s = s.replace(/<[^>]+>/g, '\n');
  // Clean up whitespace
  return s.split('\n')
    .map(l => l.replace(/\s+/g,' ').trim())
    .filter(l => l.length > 1)
    // Remove lines that look like CSS
    .filter(l => !_isCssLike(l))
    // Deduplicate
    .filter((l, i, arr) => arr[i - 1] !== l);
}

function _isCssLike(line) {
  if (/^[.#*][\w\-\[\].:, >~+]+\s*\{/.test(line)) return true;
  if (/^\s*[\w-]+\s*:\s*[^;]{0,100};\s*$/.test(line) && !/\s/.test(line.split(':')[0])) return true;
  if (/^@(import|media|keyframes|font-face)/.test(line)) return true;
  if (/^\}$/.test(line.trim())) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Structured PDF — renders cvData directly into a beautiful layout
// ─────────────────────────────────────────────────────────────────────────────

function _renderStructuredPdf(d) {
  const W = 595, H = 842;
  const ML = 50, MR = 545;
  const SIDEBAR_W = 190;
  const MAIN_X = ML + SIDEBAR_W + 16;
  const colorRgb = d.primaryColor || '0.04 0.15 0.25';

  const pages = [];
  let currentOps = [];
  let y = H - 20;

  function newPage(isFirst) {
    if (currentOps.length) pages.push([...currentOps]);
    currentOps = [];
    y = isFirst ? H - 20 : H - 30;
    // Sidebar background
    currentOps.push(`${colorRgb} rg 0 0 ${ML + SIDEBAR_W} ${H} re f 0 0 0 rg`);
    // Header bar across full width
    currentOps.push(`${colorRgb} rg 0 ${H - 65} ${W} 65 re f 0 0 0 rg`);
  }

  newPage(true);

  // ── Header ───────────────────────────────────────────────────────────────
  currentOps.push(`BT /HB 20 Tf 1 1 1 rg ${ML + SIDEBAR_W + 16} ${H - 40} Td (${ps(d.fullName)}) Tj 0 0 0 rg ET`);
  if (d.headline) {
    currentOps.push(`BT /HI 10 Tf 0.85 0.85 0.85 rg ${ML + SIDEBAR_W + 16} ${H - 55} Td (${ps(d.headline)}) Tj 0 0 0 rg ET`);
  }

  // ── Sidebar ───────────────────────────────────────────────────────────────
  let sy = H - 80; // sidebar Y

  function sidebarSection(title) {
    sy -= 8;
    currentOps.push(`BT /HB 8 Tf 1 1 0.7 rg ${ML} ${sy} Td (${ps(title.toUpperCase())}) Tj 0 0 0 rg ET`);
    sy -= 14;
    // underline
    currentOps.push(`1 1 1 RG 0.5 w ${ML} ${sy + 2} m ${ML + SIDEBAR_W - 4} ${sy + 2} l S 0 0 0 RG`);
    sy -= 4;
  }

  function sidebarLine(text, italic = false) {
    if (sy < 60) return;
    const font = italic ? 'HI' : 'HR';
    currentOps.push(`BT /${font} 9 Tf 0.85 0.85 0.85 rg ${ML} ${sy} Td (${ps(text)}) Tj 0 0 0 rg ET`);
    sy -= 13;
  }

  // Contact
  sidebarSection('Contact');
  if (d.email)    sidebarLine(`@ ${d.email}`);
  if (d.phone)    sidebarLine(`T  ${d.phone}`);
  if (d.location) sidebarLine(`+  ${d.location}`);
  if (d.website)  sidebarLine(`W  ${d.website.replace(/^https?:\/\//, '')}`);

  // Social
  if (d.social?.linkedin || d.social?.github) {
    sidebarSection('Online');
    if (d.social.linkedin) sidebarLine('LinkedIn');
    if (d.social.github)   sidebarLine('GitHub');
    if (d.social.twitter)  sidebarLine('Twitter / X');
  }

  // Skills
  if (d.skills?.length) {
    sidebarSection('Skills');
    d.skills.forEach(s => sidebarLine(s));
  }

  // ── Main content ───────────────────────────────────────────────────────────
  let my = H - 80; // main content Y
  const MAIN_W = W - MAIN_X - 20;

  function mainSection(title) {
    my -= 10;
    if (my < 80) {
      pages.push([...currentOps]);
      currentOps = [];
      // Continuation page header
      currentOps.push(`${colorRgb} rg 0 ${H - 30} ${W} 30 re f 0 0 0 rg`);
      currentOps.push(`BT /HB 10 Tf 1 1 1 rg ${MAIN_X} ${H - 18} Td (${ps(d.fullName)} — continued) Tj 0 0 0 rg ET`);
      my = H - 50;
    }
    // Section heading with accent line
    const C = colorRgb;
    currentOps.push(`${C} RG 1.5 w ${MAIN_X} ${my - 2} m ${MR} ${my - 2} l S 0 0 0 RG 0.5 w`);
    currentOps.push(`BT /HB 9 Tf ${MAIN_X} ${my + 1} Td (${ps(title.toUpperCase())}) Tj ET`);
    my -= 16;
  }

  function mainLine(text, size = 10, bold = false, color = '0.1 0.1 0.1') {
    if (!text || text.trim() === '') return;
    if (my < 60) {
      pages.push([...currentOps]);
      currentOps = [];
      currentOps.push(`${colorRgb} rg 0 ${H - 30} ${W} 30 re f 0 0 0 rg`);
      my = H - 50;
    }
    const font = bold ? 'HB' : 'HR';
    const truncated = ps(text).substring(0, 90);
    currentOps.push(`BT /${font} ${size} Tf ${color} rg ${MAIN_X} ${my} Td (${truncated}) Tj 0 0 0 rg ET`);
    my -= size + 3;
  }

  function mainMuted(text) { mainLine(text, 9, false, '0.5 0.5 0.5'); }
  function mainAccent(text) {
    const C = colorRgb;
    mainLine(text, 10, false, C);
  }

  // Bio
  if (d.bio) {
    mainSection('Profile');
    // Wrap bio text to fit main column width (~75 chars)
    const words = d.bio.split(' ');
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).length > 72) { mainLine(line.trim(), 10); line = w; }
      else line += (line ? ' ' : '') + w;
    }
    if (line) mainLine(line, 10);
    my -= 4;
  }

  // Experience
  if (d.experience?.length) {
    mainSection('Experience');
    for (const e of d.experience) {
      mainLine(e.position, 11, true);
      mainAccent(e.company + (e.location ? `  ·  ${e.location}` : ''));
      mainMuted(`${e.startDate}  –  ${e.endDate}${e.employmentType ? `  ·  ${e.employmentType}` : ''}`);
      if (e.description) {
        const words = e.description.split(' ');
        let line = '';
        for (const w of words) {
          if ((line + ' ' + w).length > 72) { mainLine(line.trim(), 9); line = w; }
          else line += (line ? ' ' : '') + w;
        }
        if (line) mainLine(line, 9);
      }
      my -= 5;
    }
  }

  // Education
  if (d.education?.length) {
    mainSection('Education');
    for (const e of d.education) {
      mainLine(`${e.degree}${e.field ? ` in ${e.field}` : ''}`, 11, true);
      mainAccent(e.institution);
      mainMuted(`${e.startDate}  –  ${e.endDate}`);
      if (e.description) mainLine(e.description.substring(0, 80), 9);
      my -= 5;
    }
  }

  // Certifications
  if (d.certifications?.length) {
    mainSection('Certifications');
    for (const c of d.certifications) {
      mainLine(c.name, 11, true);
      mainAccent(c.issuer);
      mainMuted(c.issueDate + (c.expiryDate ? `  –  ${c.expiryDate}` : ''));
      my -= 3;
    }
  }

  // Portfolio
  if (d.portfolio?.length) {
    mainSection('Portfolio');
    for (const p of d.portfolio.slice(0, 4)) {
      mainLine(p.title, 11, true);
      if (p.technologies?.length) mainMuted(p.technologies.slice(0,6).join('  ·  '));
      my -= 3;
    }
  }

  // Footer on last page
  currentOps.push(`BT /HR 8 Tf 0.7 0.7 0.7 rg ${MAIN_X} 12 Td (Generated ${d.generatedAt || new Date().toLocaleDateString()}) Tj 0 0 0 rg ET`);
  pages.push([...currentOps]);

  // ── Assemble PDF ──────────────────────────────────────────────────────────
  const objs = [];
  const push = s => { objs.push(s); return objs.length; };

  push('CATALOG'); // 1
  push('PAGES');   // 2
  // Fonts: regular, bold, italic, header-bold, header-italic
  push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj'); // HR
  push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj'); // HB
  push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj'); // HI

  const resources = '<< /Font << /HR 3 0 R /HB 4 0 R /HI 5 0 R >> >>';
  const pageNums = [];

  pages.forEach(ops => {
    const stream = ops.join('\n');
    const si = objs.length + 1;
    push(`${si} 0 obj\n<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream\nendobj`);
    const pi = objs.length + 1;
    push(`${pi} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${si} 0 R /Resources ${resources} >>\nendobj`);
    pageNums.push(pi);
  });

  objs[0] = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`;
  objs[1] = `2 0 obj\n<< /Type /Pages /Kids [${pageNums.map(n=>`${n} 0 R`).join(' ')}] /Count ${pageNums.length} >>\nendobj`;

  return _assemblePdf(objs);
}

/** Plain text fallback (last resort) */
function _renderTextPdf(lines, cvData) {
  const W = 595, H = 842;
  const ML = 50, MB = 50;
  const colorRgb = cvData?.primaryColor || '0.04 0.15 0.25';

  const SECTION_KEYWORDS = new Set(['experience','education','skills','certifications','portfolio','about','profile','contact','languages','awards','work experience','summary']);

  const objs = [];
  const push = s => { objs.push(s); return objs.length; };
  push('CATALOG'); push('PAGES');
  push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj');
  push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj');
  push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj');
  const resources = '<< /Font << /HR 3 0 R /HB 4 0 R /HI 5 0 R >> >>';

  const pageNums = [];
  const LINES_PER_PAGE = 52;
  const chunks = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) chunks.push(lines.slice(i, i + LINES_PER_PAGE));
  if (!chunks.length) chunks.push(['No content']);

  chunks.forEach((chunk, pi) => {
    const ops = [];
    ops.push(`${colorRgb} rg 0 ${H - 55} ${W} 55 re f 0 0 0 rg`);
    if (pi === 0 && cvData?.fullName) {
      ops.push(`BT /HB 18 Tf 1 1 1 rg ${ML} ${H - 33} Td (${ps(cvData.fullName)}) Tj 0 0 0 rg ET`);
    }
    let y = pi === 0 ? H - 75 : H - 30;
    for (const line of chunk) {
      if (y < MB) break;
      const lower = line.toLowerCase().trim();
      const isSection = SECTION_KEYWORDS.has(lower) && line.length < 40;
      if (isSection) {
        y -= 4;
        ops.push(`${colorRgb} RG 1.5 w ${ML} ${y - 1} m ${W - 50} ${y - 1} l S 0 0 0 RG`);
        ops.push(`BT /HB 10 Tf ${ML} ${y + 2} Td (${ps(line.toUpperCase())}) Tj ET`);
        y -= 16;
      } else {
        ops.push(`BT /HR 10 Tf ${ML} ${y} Td (${ps(line)}) Tj ET`);
        y -= 14;
      }
    }
    ops.push(`${colorRgb} rg 0 0 ${W} 22 re f 0 0 0 rg`);
    ops.push(`BT /HR 8 Tf 1 1 1 rg ${ML} 7 Td (${ps(cvData?.fullName || '')}) Tj ET`);
    ops.push(`BT /HR 8 Tf 1 1 1 rg ${W - 85} 7 Td (Page ${pi + 1} of ${chunks.length}) Tj ET`);

    const stream = ops.join('\n');
    const si = objs.length + 1;
    push(`${si} 0 obj\n<< /Length ${Buffer.byteLength(stream,'latin1')} >>\nstream\n${stream}\nendstream\nendobj`);
    const pageIdx = objs.length + 1;
    push(`${pageIdx} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${si} 0 R /Resources ${resources} >>\nendobj`);
    pageNums.push(pageIdx);
  });

  objs[0] = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`;
  objs[1] = `2 0 obj\n<< /Type /Pages /Kids [${pageNums.map(n=>`${n} 0 R`).join(' ')}] /Count ${pageNums.length} >>\nendobj`;
  return _assemblePdf(objs);
}

function _assemblePdf(objs) {
  const header = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  let body = '';
  const xrefOffsets = [0];
  for (const obj of objs) { xrefOffsets.push(header.length + body.length); body += obj + '\n'; }
  const xrefStart = header.length + body.length;
  let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) xref += String(xrefOffsets[i]).padStart(10,'0') + ' 00000 n \n';
  return Buffer.from(header + body + xref + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`, 'latin1');
}

function _isValidPdf(p) { try { const s = fs.statSync(p); return s.size > 500; } catch(_){ return false; } }

/** PDF-safe string: ASCII only, escape parens and backslash */
function ps(s) {
  if (!s) return '';
  return String(s)
    .replace(/[^\x20-\x7E]/g, c => {
      // Keep common latin chars via latin1 encoding
      const code = c.charCodeAt(0);
      return (code >= 0x80 && code <= 0xFF) ? c : ' ';
    })
    .replace(/\\/g,'\\\\')
    .replace(/\(/g,'\\(')
    .replace(/\)/g,'\\)')
    .substring(0, 200);
}

module.exports = { htmlToPdf };