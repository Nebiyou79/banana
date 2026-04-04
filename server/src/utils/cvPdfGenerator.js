// backend/src/utils/cvPdfGenerator.js
// Converts rendered HTML CV templates into PDFs using wkhtmltopdf
// Falls back to writing raw HTML if PDF generation is unavailable.

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Convert an HTML string into a PDF file saved at outputPath.
 * @param {string} html        - Fully rendered HTML document
 * @param {string} outputPath  - Absolute destination path for the .pdf
 * @returns {Promise<string>}  - Resolves with outputPath on success
 */
async function htmlToPdf(html, outputPath) {
  // Write HTML to a temp file so wkhtmltopdf can read it
  const tmpHtml = path.join(os.tmpdir(), `cv_${Date.now()}_${Math.random().toString(36).slice(2)}.html`);

  try {
    fs.writeFileSync(tmpHtml, html, 'utf8');
    await _runWkhtmltopdf(tmpHtml, outputPath);
    return outputPath;
  } finally {
    // Always clean up the temp file
    try { fs.unlinkSync(tmpHtml); } catch (_) { /* ignore */ }
  }
}

/**
 * Render an HTML string of the CV for preview (returns raw HTML string).
 * The browser renders this directly as an inline preview.
 */
function renderHtmlPreview(html) {
  return html;
}

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

function _runWkhtmltopdf(inputHtmlPath, outputPdfPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '--page-size', 'A4',
      '--margin-top', '0',
      '--margin-right', '0',
      '--margin-bottom', '0',
      '--margin-left', '0',
      '--encoding', 'UTF-8',
      '--enable-local-file-access',
      '--quiet',
      inputHtmlPath,
      outputPdfPath,
    ];

    const proc = spawn('wkhtmltopdf', args);
    let stderr = '';

    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code === 0 || fs.existsSync(outputPdfPath)) {
        resolve(outputPdfPath);
      } else {
        reject(new Error(`wkhtmltopdf exited with code ${code}: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn wkhtmltopdf: ${err.message}`));
    });
  });
}

module.exports = { htmlToPdf, renderHtmlPreview };
