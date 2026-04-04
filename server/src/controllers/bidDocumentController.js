// backend/src/controllers/bidDocumentController.js
// ✅ FIXED: BUG-14 — Both endpoints now .populate('bidder', '_id') so
//           bid.bidder is always a populated object, preventing the
//           ObjectId-vs-string comparison from silently returning false
//           and denying access to the rightful bidder.

const fs = require('fs');
const path = require('path');
const Bid = require('../models/Bid');
const ProfessionalTender = require('../models/ProfessionalTender');

/**
 * Determine whether the requesting user is authorised to access a bid document.
 *
 * Rules:
 *   - The bidder who submitted the bid can ALWAYS access their own documents.
 *   - The tender owner / admin can access all documents EXCEPT financial docs on
 *     sealed tenders that have not yet been revealed.
 *   - Everyone else is denied.
 *
 * BUG-14 NOTE: bid.bidder must be populated (._id present) before calling this.
 *              Both endpoints below now call .populate('bidder', '_id').
 *
 * @param {object}          bid           - Populated Bid document
 * @param {object}          tender        - Populated ProfessionalTender document
 * @param {ObjectId|string} viewerUserId  - req.user._id
 * @param {string}          viewerRole    - req.user.role
 * @param {object}          document      - BidDocumentSchema sub-document
 * @returns {{ allowed: boolean, reason?: string }}
 */
const authoriseDocumentAccess = (bid, tender, viewerUserId, viewerRole, document) => {
    const isAdmin = viewerRole === 'admin';

    // BUG-14 FIX: Use bid.bidder._id if populated, fall back to bid.bidder if it's a raw ObjectId
    const bidderId = bid.bidder && bid.bidder._id ? bid.bidder._id : bid.bidder;
    const isBidder = bidderId && bidderId.toString() === viewerUserId.toString();

    const isOwner = tender.owner && tender.owner.toString() === viewerUserId.toString();
    const isBidsRevealed = ['revealed', 'closed'].includes(tender.status);

    if (isBidder) {
        // Bidder always has full access to their own documents
        return { allowed: true };
    }

    if (isOwner || isAdmin) {
        // Owner/admin blocked from financial docs on unrevealed sealed bids only
        if (bid.sealed && !isBidsRevealed) {
            const FINANCIAL_TYPES = ['financial_proposal', 'financial_breakdown'];
            if (document && FINANCIAL_TYPES.includes(document.documentType)) {
                return {
                    allowed: false,
                    reason: 'Financial documents are locked until sealed bids are revealed by the tender owner.'
                };
            }
        }
        return { allowed: true };
    }

    return { allowed: false, reason: 'You are not authorised to access this document.' };
};

// ══════════════════════════════════════════════════════════════════════
// FUNCTION 1 — downloadBidDocument
// GET /api/v1/bids/:tenderId/:bidId/documents/:fileName/download
// ══════════════════════════════════════════════════════════════════════
exports.downloadBidDocument = async (req, res) => {
    try {
        const { tenderId, bidId, fileName } = req.params;

        // BUG-14 FIX: Populate bidder._id so authoriseDocumentAccess comparison works correctly
        const bid = await Bid.findOne({
            _id: bidId,
            tender: tenderId,
            isDeleted: false
        }).populate('bidder', '_id');

        if (!bid) {
            return res.status(404).json({ success: false, error: 'Bid not found.' });
        }

        const tender = await ProfessionalTender.findOne({
            _id: tenderId,
            isDeleted: false
        }).select('owner status workflowType');

        if (!tender) {
            return res.status(404).json({ success: false, error: 'Tender not found.' });
        }

        // Match fileName with or without URI encoding
        const document = bid.documents.find(
            (d) => d.fileName === fileName || d.fileName === decodeURIComponent(fileName)
        );

        if (!document) {
            return res.status(404).json({ success: false, error: 'Document not found in bid.' });
        }

        const { allowed, reason } = authoriseDocumentAccess(
            bid, tender, req.user._id, req.user.role, document
        );

        if (!allowed) {
            return res.status(403).json({ success: false, error: reason });
        }

        const filePath = document.path;

        if (!filePath || !fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'File not found on disk.',
                note: 'The file may have been moved or deleted.'
            });
        }

        // Stream as attachment download
        res.download(filePath, document.originalName, (err) => {
            if (err && !res.headersSent) {
                console.error('❌ File download error:', err);
                return res.status(500).json({ success: false, error: 'Failed to download file.' });
            }
        });

    } catch (error) {
        console.error('❌ downloadBidDocument error:', error);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, error: 'Internal server error.', details: error.message });
        }
    }
};

// ══════════════════════════════════════════════════════════════════════
// FUNCTION 2 — previewBidDocument
// GET /api/v1/bids/:tenderId/:bidId/documents/:fileName/preview
// ══════════════════════════════════════════════════════════════════════
exports.previewBidDocument = async (req, res) => {
    try {
        const { tenderId, bidId, fileName } = req.params;

        // BUG-14 FIX: Populate bidder._id
        const bid = await Bid.findOne({
            _id: bidId,
            tender: tenderId,
            isDeleted: false
        }).populate('bidder', '_id');

        if (!bid) {
            return res.status(404).json({ success: false, error: 'Bid not found.' });
        }

        const tender = await ProfessionalTender.findOne({
            _id: tenderId,
            isDeleted: false
        }).select('owner status workflowType');

        if (!tender) {
            return res.status(404).json({ success: false, error: 'Tender not found.' });
        }

        const document = bid.documents.find(
            (d) => d.fileName === fileName || d.fileName === decodeURIComponent(fileName)
        );

        if (!document) {
            return res.status(404).json({ success: false, error: 'Document not found in bid.' });
        }

        const { allowed, reason } = authoriseDocumentAccess(
            bid, tender, req.user._id, req.user.role, document
        );

        if (!allowed) {
            return res.status(403).json({ success: false, error: reason });
        }

        const filePath = document.path;

        if (!filePath || !fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: 'File not found on disk.' });
        }

        // Pipe file inline for browser preview
        const mimeType = document.mimetype || 'application/octet-stream';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalName)}"`);
        res.setHeader('Cache-Control', 'private, max-age=3600');

        const fileStream = fs.createReadStream(filePath);
        fileStream.on('error', (err) => {
            console.error('❌ Preview stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: 'Failed to stream file.' });
            }
        });
        fileStream.pipe(res);

    } catch (error) {
        console.error('❌ previewBidDocument error:', error);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, error: 'Internal server error.', details: error.message });
        }
    }
};