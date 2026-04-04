// backend/src/controllers/cvGeneratorController.js
// Handles CV generation, preview, download, and attachment to user profile.
// Follows the same patterns as candidateController.js in this codebase.

const path  = require('path');
const fs    = require('fs');
const User  = require('../models/User');
const { normalizeCandidateData } = require('../utils/cvDataNormalizer');
const { renderTemplate, listTemplates } = require('../utils/cvTemplateRenderer');
const { htmlToPdf } = require('../utils/cvPdfGenerator');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const UPLOAD_BASE = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
const CV_GEN_DIR  = path.join(UPLOAD_BASE, 'cv');

function ensureCvDir() {
  if (!fs.existsSync(CV_GEN_DIR)) {
    fs.mkdirSync(CV_GEN_DIR, { recursive: true });
  }
}

function handleError(error, res, msg = 'Internal server error') {
  console.error('[cvGeneratorController]', error);
  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  return res.status(500).json({ success: false, message: msg });
}

// ─────────────────────────────────────────────────────────────
// GET /api/v1/candidate/cv-generator/templates
// List all available templates with metadata
// ─────────────────────────────────────────────────────────────
exports.getTemplates = (req, res) => {
  try {
    const templates = listTemplates();
    res.json({ success: true, data: { templates, count: templates.length } });
  } catch (error) {
    handleError(error, res, 'Failed to list templates');
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/v1/candidate/cv-generator/preview
// Body: { templateId }
// Returns raw HTML for inline browser preview (no file written)
// ─────────────────────────────────────────────────────────────
exports.previewCV = async (req, res) => {
  try {
    const { templateId = 'modern' } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .select('-passwordHash -loginAttempts -lockUntil')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const candidateData = normalizeCandidateData(user);
    const html = renderTemplate(templateId, candidateData);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-CV-Template', templateId);
    res.send(html);

  } catch (error) {
    if (error.message && error.message.startsWith('CV template')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    handleError(error, res, 'Failed to generate CV preview');
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/v1/candidate/cv-generator/generate
// Body: { templateId, description, setAsPrimary }
// Generates PDF, saves to disk, attaches to user's cvs[]
// ─────────────────────────────────────────────────────────────
exports.generateCV = async (req, res) => {
  const { templateId = 'modern', description, setAsPrimary = false } = req.body;
  const userId = req.user.userId;

  let pdfPath = null;

  try {
    ensureCvDir();

    // 1. Fetch user
    const user = await User.findById(userId)
      .select('-passwordHash -loginAttempts -lockUntil')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Check CV limit
    if (user.cvs && user.cvs.length >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 CVs allowed. Please delete an existing CV before generating a new one.',
        code: 'CV_LIMIT_REACHED'
      });
    }

    // 3. Normalise data + render HTML
    const candidateData = normalizeCandidateData(user);
    const html = renderTemplate(templateId, candidateData);

    // 4. Write PDF
    const timestamp   = Date.now();
    const safeSlug    = (user.name || 'cv').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().slice(0, 30);
    const fileName    = `${safeSlug}-${templateId}-${timestamp}.pdf`;
    pdfPath           = path.join(CV_GEN_DIR, fileName);

    await htmlToPdf(html, pdfPath);

    // Verify file was created
    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF generation produced no output file');
    }

    const fileStats = fs.statSync(pdfPath);

    // 5. Build CV record (same shape as localFileUpload CVs)
    const cvData = {
      fileName,
      originalName:     `${user.name || 'CV'} - ${_templateLabel(templateId)}.pdf`,
      filePath:         pdfPath,
      fileUrl:          `/uploads/cv/${fileName}`,
      downloadUrl:      `/uploads/download/cv/${fileName}`,
      mimetype:         'application/pdf',
      size:             fileStats.size,
      fileExtension:    'pdf',
      uploadedAt:       new Date(),
      isPrimary:        false,
      description:      description || `Generated CV — ${_templateLabel(templateId)} template`,
      downloadCount:    0,
      viewCount:        0,
      // Extended fields for generated CVs
      isGenerated:      true,
      templateId,
      generatedAt:      new Date(),
      generationSource: 'cv-generator',
    };

    // 6. Attach to user via existing addCV model method
    const userDoc = await User.findById(userId);
    await userDoc.addCV(cvData);

    if (setAsPrimary) {
      const newCV = userDoc.cvs[userDoc.cvs.length - 1];
      await userDoc.setPrimaryCV(newCV._id.toString());
    }

    // 7. Refresh and return new CV
    const updatedUser = await User.findById(userId).select('cvs');
    const newCV = updatedUser.cvs[updatedUser.cvs.length - 1];

    res.status(201).json({
      success: true,
      message: 'CV generated and saved successfully',
      data: {
        cv: {
          _id:          newCV._id,
          fileName:     newCV.fileName,
          originalName: newCV.originalName,
          size:         newCV.size,
          uploadedAt:   newCV.uploadedAt,
          isPrimary:    newCV.isPrimary,
          mimetype:     newCV.mimetype,
          fileExtension: newCV.fileExtension,
          description:  newCV.description,
          fileUrl:      newCV.fileUrl,
          downloadUrl:  newCV.downloadUrl,
          isGenerated:  newCV.isGenerated,
          templateId:   newCV.templateId,
          generatedAt:  newCV.generatedAt,
        },
        totalCVs:    updatedUser.cvs.length,
        primaryCVId: updatedUser.cvs.find(c => c.isPrimary)?._id?.toString(),
      }
    });

  } catch (error) {
    // Clean up orphan file if PDF was partially written
    if (pdfPath && fs.existsSync(pdfPath)) {
      try { fs.unlinkSync(pdfPath); } catch (_) { /* ignore */ }
    }

    if (error.message && error.message.startsWith('CV template')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    handleError(error, res, 'Failed to generate CV');
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/v1/candidate/cv-generator/download/:cvId
// Streams the generated PDF for download (same as downloadCV)
// ─────────────────────────────────────────────────────────────
exports.downloadGeneratedCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const userId   = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const cv = user.getCVById(cvId);
    if (!cv) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }

    const filePath = _resolveFilePath(cv);
    if (!filePath) {
      return res.status(404).json({ success: false, message: 'CV file not found on server' });
    }

    await user.incrementCVDownloadCount(cvId);

    res.set({
      'Content-Disposition': `attachment; filename="${encodeURIComponent(cv.originalName || cv.fileName)}"`,
      'Content-Type':        cv.mimetype || 'application/pdf',
      'Content-Length':      cv.size,
      'Cache-Control':       'no-cache, no-store, must-revalidate',
    });

    fs.createReadStream(filePath).pipe(res);

  } catch (error) {
    handleError(error, res, 'Failed to download generated CV');
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/v1/candidate/cv-generator/regenerate/:cvId
// Body: { templateId }
// Deletes the old PDF, generates a fresh one with new template
// ─────────────────────────────────────────────────────────────
exports.regenerateCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const { templateId = 'modern' } = req.body;
    const userId   = req.user.userId;

    ensureCvDir();

    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existingCV = userDoc.getCVById(cvId);
    if (!existingCV) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }

    // Delete old file
    const oldPath = _resolveFilePath(existingCV);
    if (oldPath && fs.existsSync(oldPath)) {
      try { fs.unlinkSync(oldPath); } catch (_) { /* ignore */ }
    }

    // Re-render and generate new PDF
    const userLean = await User.findById(userId).select('-passwordHash').lean();
    const candidateData = normalizeCandidateData(userLean);
    const html = renderTemplate(templateId, candidateData);

    const timestamp  = Date.now();
    const safeSlug   = (userDoc.name || 'cv').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().slice(0, 30);
    const fileName   = `${safeSlug}-${templateId}-${timestamp}.pdf`;
    const newPdfPath = path.join(CV_GEN_DIR, fileName);

    await htmlToPdf(html, newPdfPath);

    const fileStats = fs.statSync(newPdfPath);

    // Update the CV subdocument in-place
    const cvIdx = userDoc.cvs.findIndex(c => c._id.toString() === cvId);
    if (cvIdx === -1) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }

    userDoc.cvs[cvIdx].fileName    = fileName;
    userDoc.cvs[cvIdx].filePath    = newPdfPath;
    userDoc.cvs[cvIdx].fileUrl     = `/uploads/cv/${fileName}`;
    userDoc.cvs[cvIdx].downloadUrl = `/uploads/download/cv/${fileName}`;
    userDoc.cvs[cvIdx].size        = fileStats.size;
    userDoc.cvs[cvIdx].templateId  = templateId;
    userDoc.cvs[cvIdx].generatedAt = new Date();
    userDoc.cvs[cvIdx].originalName = `${userDoc.name || 'CV'} - ${_templateLabel(templateId)}.pdf`;

    await userDoc.save();

    const updatedCV = userDoc.cvs[cvIdx];

    res.json({
      success: true,
      message: 'CV regenerated successfully',
      data: {
        cv: {
          _id:          updatedCV._id,
          fileName:     updatedCV.fileName,
          originalName: updatedCV.originalName,
          size:         updatedCV.size,
          uploadedAt:   updatedCV.uploadedAt,
          isPrimary:    updatedCV.isPrimary,
          mimetype:     updatedCV.mimetype,
          fileExtension: updatedCV.fileExtension,
          description:  updatedCV.description,
          fileUrl:      updatedCV.fileUrl,
          downloadUrl:  updatedCV.downloadUrl,
          isGenerated:  updatedCV.isGenerated,
          templateId:   updatedCV.templateId,
          generatedAt:  updatedCV.generatedAt,
        }
      }
    });

  } catch (error) {
    handleError(error, res, 'Failed to regenerate CV');
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/v1/candidate/cv-generator/list
// Returns only the generated CVs from the user's cvs[]
// ─────────────────────────────────────────────────────────────
exports.listGeneratedCVs = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('cvs').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const generated = (user.cvs || []).filter(cv => cv.isGenerated);

    res.json({
      success: true,
      data: {
        cvs:   generated,
        count: generated.length,
      }
    });

  } catch (error) {
    handleError(error, res, 'Failed to list generated CVs');
  }
};

// ─────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────

function _resolveFilePath(cv) {
  const filename = cv.fileName || cv.filename;
  if (!filename) return null;

  const candidates = [
    path.join(CV_GEN_DIR, filename),
    path.join(process.cwd(), 'uploads', 'cv', filename),
    cv.filePath,
  ].filter(Boolean);

  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function _templateLabel(templateId) {
  const labels = {
    executive:    'Executive Classic',
    modern:       'Modern Minimal',
    creative:     'Creative Bold',
    professional: 'Professional',
    elegant:      'Elegant Serif',
    tech:         'Tech Developer',
    infographic:  'Infographic',
    compact:      'Compact One-Page',
    academic:     'Academic',
    freelancer:   'Freelancer Portfolio',
  };
  return labels[templateId] || templateId;
}
