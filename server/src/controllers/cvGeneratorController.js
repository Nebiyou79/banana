// backend/src/controllers/cvGeneratorController.js
// Updated: normalizeCandidateData is now async (fetches avatar as base64).

'use strict';

const path = require('path');
const fs   = require('fs');
const User = require('../models/User');
const { normalizeCandidateData }    = require('../utils/cvDataNormalizer');
const { renderTemplate, listTemplates } = require('../utils/cvTemplateRenderer');
const { htmlToPdf }                 = require('../utils/cvPdfGenerator');

const UPLOAD_BASE = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
const CV_GEN_DIR  = path.join(UPLOAD_BASE, 'cv');

const TEMPLATE_COLORS = {
  executive:'0.04 0.15 0.25', modern:'0.16 0.64 0.60', creative:'0.07 0.07 0.07',
  professional:'0.29 0.34 0.38', elegant:'0.48 0.18 0.26', tech:'0.06 0.72 0.51',
  infographic:'1.00 0.55 0.26', compact:'0.15 0.39 0.92', academic:'0.11 0.31 0.85',
  freelancer:'0.49 0.23 0.93', startup:'0.96 0.25 0.37', minimal:'0.07 0.09 0.13',
  geometric:'0.92 0.35 0.05', timeline:'0.31 0.27 0.90', nordic:'0.03 0.57 0.70',
  impact:'0.85 0.47 0.02', retro:'0.57 0.25 0.05', healthcare:'0.05 0.58 0.53',
  magazine:'0.75 0.09 0.36', glass:'0.39 0.40 0.95',
};

function ensureCvDir() {
  if (!fs.existsSync(CV_GEN_DIR)) fs.mkdirSync(CV_GEN_DIR, { recursive: true });
}

function handleError(error, res, msg = 'Internal server error') {
  console.error('[cvGeneratorController]', error.message || error);
  if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid ID format' });
  return res.status(500).json({ success: false, message: msg, detail: String(error.message || '') });
}

function fmtCV(cv) {
  return {
    _id: cv._id, fileName: cv.fileName, originalName: cv.originalName,
    size: cv.size, uploadedAt: cv.uploadedAt, isPrimary: cv.isPrimary,
    mimetype: cv.mimetype, fileExtension: cv.fileExtension,
    description: cv.description, fileUrl: cv.fileUrl, downloadUrl: cv.downloadUrl,
    isGenerated: cv.isGenerated, templateId: cv.templateId, generatedAt: cv.generatedAt,
  };
}

function resolveFile(cv) {
  const name = cv.fileName || cv.filename;
  if (!name) return null;
  return [
    path.join(CV_GEN_DIR, name),
    path.join(process.cwd(), 'uploads', 'cv', name),
    cv.filePath,
  ].filter(Boolean).find(p => { try { return fs.existsSync(p); } catch(_){ return false; } }) || null;
}

function tplLabel(id) {
  return ({
    executive:'Executive Classic', modern:'Modern Minimal', creative:'Creative Bold',
    professional:'Professional', elegant:'Elegant Serif', tech:'Tech Developer',
    infographic:'Infographic', compact:'Compact One-Page', academic:'Academic',
    freelancer:'Freelancer Portfolio', startup:'Startup', minimal:'Pure Minimal',
    geometric:'Geometric', timeline:'Timeline', nordic:'Nordic',
    impact:'High Impact', retro:'Retro Type', healthcare:'Healthcare',
    magazine:'Magazine', glass:'Glass & Gradient',
  })[id] || id;
}

// ─── GET /templates ──────────────────────────────────────────────────────────
exports.getTemplates = (_req, res) => {
  try {
    res.json({ success: true, data: { templates: listTemplates(), count: listTemplates().length } });
  } catch (e) { handleError(e, res, 'Failed to list templates'); }
};

// ─── POST /preview ───────────────────────────────────────────────────────────
exports.previewCV = async (req, res) => {
  try {
    const { templateId = 'modern' } = req.body;
    const user = await User.findById(req.user.userId)
      .select('-passwordHash -loginAttempts -lockUntil').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // ASYNC — fetches avatar as base64 data URI
    const candidateData = await normalizeCandidateData(user);

    let html;
    try { html = renderTemplate(templateId, candidateData); }
    catch (e) { return res.status(400).json({ success: false, message: e.message }); }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(html);
  } catch (e) { handleError(e, res, 'Failed to generate preview'); }
};

// ─── POST /generate ──────────────────────────────────────────────────────────
exports.generateCV = async (req, res) => {
  const { templateId = 'modern', description, setAsPrimary = false } = req.body;
  const userId = req.user.userId;
  let pdfPath = null;

  try {
    ensureCvDir();
    const userLean = await User.findById(userId)
      .select('-passwordHash -loginAttempts -lockUntil').lean();
    if (!userLean) return res.status(404).json({ success: false, message: 'User not found' });
    if ((userLean.cvs || []).length >= 10) {
      return res.status(400).json({ success: false, message: 'Maximum 10 CVs reached. Delete one first.', code: 'CV_LIMIT_REACHED' });
    }

    // ASYNC — fetches avatar
    const candidateData = await normalizeCandidateData(userLean);

    let html;
    try { html = renderTemplate(templateId, candidateData); }
    catch (e) { return res.status(400).json({ success: false, message: e.message }); }

    const fileName  = `${(userLean.name||'cv').replace(/[^a-zA-Z0-9]/g,'-').toLowerCase().slice(0,30)}-${templateId}-${Date.now()}.pdf`;
    pdfPath = path.join(CV_GEN_DIR, fileName);

    await htmlToPdf(html, pdfPath, {
      ...candidateData,
      primaryColor: TEMPLATE_COLORS[templateId] || '0.04 0.15 0.25',
    });

    if (!fs.existsSync(pdfPath) || fs.statSync(pdfPath).size < 200) {
      throw new Error('PDF generation produced no valid output');
    }

    const stats   = fs.statSync(pdfPath);
    const userDoc = await User.findById(userId);
    await userDoc.addCV({
      fileName, originalName: `${userLean.name||'CV'} - ${tplLabel(templateId)}.pdf`,
      filePath: pdfPath, fileUrl: `/uploads/cv/${fileName}`,
      downloadUrl: `/uploads/download/cv/${fileName}`,
      mimetype: 'application/pdf', size: stats.size, fileExtension: 'pdf',
      uploadedAt: new Date(), isPrimary: false,
      description: description || `Generated — ${tplLabel(templateId)} template`,
      downloadCount: 0, viewCount: 0,
      isGenerated: true, templateId, generatedAt: new Date(), generationSource: 'cv-generator',
    });

    if (setAsPrimary) {
      const nCV = userDoc.cvs[userDoc.cvs.length - 1];
      await userDoc.setPrimaryCV(nCV._id.toString());
    }

    const updated = await User.findById(userId).select('cvs');
    const newCV   = updated.cvs[updated.cvs.length - 1];
    res.status(201).json({
      success: true, message: 'CV generated successfully',
      data: { cv: fmtCV(newCV), totalCVs: updated.cvs.length, primaryCVId: updated.cvs.find(c=>c.isPrimary)?._id?.toString() },
    });
  } catch (e) {
    if (pdfPath && fs.existsSync(pdfPath)) try { fs.unlinkSync(pdfPath); } catch(_){}
    handleError(e, res, 'Failed to generate CV');
  }
};

// ─── GET /download/:cvId ─────────────────────────────────────────────────────
exports.downloadGeneratedCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const cv = user.getCVById(cvId);
    if (!cv) return res.status(404).json({ success: false, message: 'CV not found' });
    const filePath = resolveFile(cv);
    if (!filePath) return res.status(404).json({ success: false, message: 'File not found on server' });
    await user.incrementCVDownloadCount(cvId);
    res.set({ 'Content-Disposition': `attachment; filename="${encodeURIComponent(cv.originalName||cv.fileName)}"`, 'Content-Type': 'application/pdf', 'Content-Length': cv.size, 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  } catch (e) { handleError(e, res, 'Failed to download CV'); }
};

// ─── POST /regenerate/:cvId ──────────────────────────────────────────────────
exports.regenerateCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const { templateId = 'modern' } = req.body;
    ensureCvDir();
    const userDoc = await User.findById(req.user.userId);
    if (!userDoc) return res.status(404).json({ success: false, message: 'User not found' });
    const existing = userDoc.getCVById(cvId);
    if (!existing) return res.status(404).json({ success: false, message: 'CV not found' });
    const oldPath = resolveFile(existing);
    if (oldPath) try { fs.unlinkSync(oldPath); } catch(_){}

    const userLean = await User.findById(req.user.userId).select('-passwordHash').lean();
    const candidateData = await normalizeCandidateData(userLean);
    let html;
    try { html = renderTemplate(templateId, candidateData); }
    catch (e) { return res.status(400).json({ success: false, message: e.message }); }

    const fileName   = `${(userDoc.name||'cv').replace(/[^a-zA-Z0-9]/g,'-').toLowerCase().slice(0,30)}-${templateId}-${Date.now()}.pdf`;
    const newPdfPath = path.join(CV_GEN_DIR, fileName);
    await htmlToPdf(html, newPdfPath, { ...candidateData, primaryColor: TEMPLATE_COLORS[templateId]||'0.04 0.15 0.25' });

    const stats = fs.statSync(newPdfPath);
    const idx   = userDoc.cvs.findIndex(c => c._id.toString() === cvId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'CV index not found' });
    Object.assign(userDoc.cvs[idx], {
      fileName, filePath: newPdfPath,
      fileUrl: `/uploads/cv/${fileName}`, downloadUrl: `/uploads/download/cv/${fileName}`,
      size: stats.size, templateId, generatedAt: new Date(),
      originalName: `${userDoc.name||'CV'} - ${tplLabel(templateId)}.pdf`,
    });
    await userDoc.save();
    res.json({ success: true, message: 'CV regenerated', data: { cv: fmtCV(userDoc.cvs[idx]) } });
  } catch (e) { handleError(e, res, 'Failed to regenerate CV'); }
};

// ─── GET /list ───────────────────────────────────────────────────────────────
exports.listGeneratedCVs = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('cvs').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const generated = (user.cvs||[]).filter(c => c.isGenerated);
    res.json({ success: true, data: { cvs: generated, count: generated.length } });
  } catch (e) { handleError(e, res, 'Failed to list CVs'); }
};