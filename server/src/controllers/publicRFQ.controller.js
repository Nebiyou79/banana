// backend/src/controllers/professionalTenderController.js
// ── ADDITION: Public RFQ document download ───────────────────────────────────
//
// BUG-C5 FIX: Add a public (no-auth) endpoint to serve the tender's RFQ /
// opening-page document so that any user (even unauthenticated) can download
// the bidding process document.
//
// PASTE THIS FUNCTION into the existing professionalTenderController.js file,
// then register the route in professionalTenderRoutes.js (see the routes fix).
//
// HOW IT WORKS:
//   GET /api/v1/professional-tenders/:id/public-rfq
//   - Finds the tender by id (public — no verifyToken middleware)
//   - Locates the first attachment with documentType === 'opening_page'
//   - Streams it via res.download()
//   - Prevents directory traversal with path.resolve() check
//   - Sets Content-Disposition: attachment so the browser prompts a download
//   - Also serves inline for PDF preview via a separate /public-rfq/preview route
//
// Security measures:
//   ✅ Only serves files stored under the allowed UPLOAD_BASE_PATH
//   ✅ Uses res.download(path, originalName) — no user-supplied path
//   ✅ No authentication required (public procurement document)
//   ✅ Rate-limiting can be added at the nginx/proxy layer

const fs = require('fs');
const path = require('path');

// Resolve the upload base path (same as rest of the app)
const UPLOAD_BASE_PATH = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');

/**
 * GET /api/v1/professional-tenders/:id/public-rfq
 * Public download of the tender's RFQ / bidding process document.
 * No authentication required.
 */
exports.downloadPublicRFQ = async (req, res) => {
    try {
        const ProfessionalTender = require('../models/ProfessionalTender');
        const { id } = req.params;

        const tender = await ProfessionalTender
            .findOne({ _id: id, isDeleted: false, status: { $ne: 'draft' } })
            .select('title attachments');

        if (!tender) {
            return res.status(404).json({
                success: false,
                error: 'Tender not found or not yet published.'
            });
        }

        // Find the first attachment tagged as an opening/RFQ document
        const rfqAttachment = tender.attachments?.find(
            (a) => a.documentType === 'opening_page' || a.documentType === 'rfq'
        );

        if (!rfqAttachment) {
            return res.status(404).json({
                success: false,
                error: 'No public RFQ document has been uploaded for this tender.'
            });
        }

        const filePath = rfqAttachment.path;

        // ── Security: prevent directory traversal ────────────────────────
        const resolvedPath = path.resolve(filePath);
        const resolvedBase = path.resolve(UPLOAD_BASE_PATH);
        if (!resolvedPath.startsWith(resolvedBase)) {
            return res.status(403).json({ success: false, error: 'Access denied.' });
        }

        if (!fs.existsSync(resolvedPath)) {
            return res.status(404).json({
                success: false,
                error: 'File not found on disk. Please contact the tender owner.'
            });
        }

        // Stream as attachment download
        res.download(resolvedPath, rfqAttachment.originalName, (err) => {
            if (err && !res.headersSent) {
                console.error('❌ downloadPublicRFQ error:', err);
                res.status(500).json({ success: false, error: 'Failed to download file.' });
            }
        });

    } catch (error) {
        console.error('❌ downloadPublicRFQ error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: 'Internal server error.', details: error.message });
        }
    }
};

/**
 * GET /api/v1/professional-tenders/:id/public-rfq/preview
 * Inline preview of the public RFQ document (PDF / image).
 * No authentication required.
 */
exports.previewPublicRFQ = async (req, res) => {
    try {
        const ProfessionalTender = require('../models/ProfessionalTender');
        const { id } = req.params;

        const tender = await ProfessionalTender
            .findOne({ _id: id, isDeleted: false, status: { $ne: 'draft' } })
            .select('attachments');

        if (!tender) {
            return res.status(404).json({ success: false, error: 'Tender not found.' });
        }

        const rfqAttachment = tender.attachments?.find(
            (a) => a.documentType === 'opening_page' || a.documentType === 'rfq'
        );

        if (!rfqAttachment) {
            return res.status(404).json({ success: false, error: 'No public RFQ document found.' });
        }

        const filePath = rfqAttachment.path;
        const resolvedPath = path.resolve(filePath);
        const resolvedBase = path.resolve(UPLOAD_BASE_PATH);
        if (!resolvedPath.startsWith(resolvedBase)) {
            return res.status(403).json({ success: false, error: 'Access denied.' });
        }

        if (!fs.existsSync(resolvedPath)) {
            return res.status(404).json({ success: false, error: 'File not found on disk.' });
        }

        const mimeType = rfqAttachment.mimetype || 'application/octet-stream';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(rfqAttachment.originalName)}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');

        const stream = fs.createReadStream(resolvedPath);
        stream.on('error', (err) => {
            console.error('❌ previewPublicRFQ stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: 'Failed to stream file.' });
            }
        });
        stream.pipe(res);

    } catch (error) {
        console.error('❌ previewPublicRFQ error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: 'Internal server error.', details: error.message });
        }
    }
};