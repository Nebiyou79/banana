// backend/src/controllers/bidController.js
// ══════════════════════════════════════════════════════════════════════
// FIXES IN THIS VERSION
// ══════════════════════════════════════════════════════════════════════
//  FIX-B1  financialBreakdown items with empty description crash Mongoose.
//          Solution: strip items where description is blank before saving.
//
//  FIX-B2  ProfessionalTender.bids.bidAmount is required by the sub-schema
//          but we set it to null on sealed tenders → ValidationError.
//          Solution: store 0 (or skip the push entirely for sealed tenders;
//          we use 0 so the bid reference still appears in the tender array).
//
//  FIX-B3  tender.bids.push crashes when the tender has already been saved
//          without running full schema validation (use $push via updateOne
//          to avoid re-validating the whole tender document).
//
//  FIX-B4  downloadUrl had the /api/v1 prefix which caused 404 when axios
//          already has baseURL = '/api/v1'. Fixed: path-only URL.
//
//  FIX-B5  All queries that return bids to the client now populate
//          bidder + bidderCompany so cards never show "Unknown Bidder".
//
// All prior bug fixes (BUG-C1, BUG-C2, BUG-C6, BUG-14) are preserved.
// ══════════════════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const ProfessionalTender = require('../models/ProfessionalTender');
const Company = require('../models/Company');
const User = require('../models/User');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// ── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_BID_TRANSITIONS = {
    submitted: ['under_review', 'rejected'],
    under_review: ['shortlisted', 'rejected'],
    shortlisted: ['interview_scheduled', 'awarded', 'rejected'],
    interview_scheduled: ['awarded', 'rejected']
};

const VALID_EVALUATION_STEPS = ['preliminary', 'technical', 'financial'];

// ── Helpers ───────────────────────────────────────────────────────────────────

// FIX-B4: downloadUrl is ROOT-RELATIVE (no /api/v1 prefix).
// Axios baseURL already contains /api/v1, so adding it again causes double-prefix 404.
const buildDocumentObject = (file, bidId, tenderId, documentType = 'other') => {
    const fileName = file.fileName || file.filename;
    const fileHash = crypto
        .createHash('md5')
        .update(file.path + Date.now())
        .digest('hex');

    return {
        originalName: file.originalName || file.originalname,
        fileName,
        path: file.path,
        url: file.url || `/uploads/bids/${fileName}`,
        downloadUrl: `/bids/${tenderId}/${bidId}/documents/${encodeURIComponent(fileName)}/download`,
        mimetype: file.mimetype,
        size: file.size,
        fileHash,
        documentType
    };
};

// BUG-C1 FIX (preserved): coverSheetCurrency key prevents array collision
const safeString = (val) => {
    if (Array.isArray(val)) return val[0] || '';
    return val || '';
};

const parseCoverSheet = (body) => {
    const src = body.coverSheet && typeof body.coverSheet === 'object'
        ? body.coverSheet
        : body;
    const coverCurrency = safeString(body.coverSheetCurrency) || safeString(src.currency) || 'ETB';
    return {
        companyName: safeString(src.companyName),
        authorizedRepresentative: safeString(src.authorizedRepresentative),
        representativeTitle: safeString(src.representativeTitle),
        companyEmail: safeString(src.companyEmail),
        companyPhone: safeString(src.companyPhone),
        companyAddress: safeString(src.companyAddress),
        tinNumber: safeString(src.tinNumber),
        licenseNumber: safeString(src.licenseNumber),
        totalBidValue: Number(src.totalBidValue),
        currency: coverCurrency,
        bidValidityPeriod: src.bidValidityPeriod ? Number(src.bidValidityPeriod) : undefined,
        declarationAccepted: src.declarationAccepted === true || src.declarationAccepted === 'true',
        declarationAcceptedAt: new Date()
    };
};

const validateCoverSheet = (cs) => {
    const required = ['companyName', 'authorizedRepresentative', 'companyEmail', 'companyPhone', 'totalBidValue', 'declarationAccepted'];
    const errors = {};
    required.forEach((field) => {
        if (!cs[field] && cs[field] !== 0) errors[field] = `${field} is required for sealed bid tenders`;
    });
    if (!cs.declarationAccepted) errors.declarationAccepted = 'You must accept the declaration to submit a bid';
    return Object.keys(errors).length ? errors : null;
};

// FIX-B1: Strip financial breakdown items that have an empty description
// before saving — prevents Mongoose ValidationError from blank rows the
// FinancialBreakdownTable component may insert.
const sanitiseFinancialBreakdown = (breakdown) => {
    if (!breakdown || !Array.isArray(breakdown.items)) return breakdown;
    return {
        ...breakdown,
        items: breakdown.items.filter(
            (item) => item && typeof item.description === 'string' && item.description.trim().length > 0
        )
    };
};

// ── FUNCTION 1 — submitBid ────────────────────────────────────────────────────
exports.submitBid = async (req, res) => {
    try {
        const { tenderId } = req.params;

        const tender = await ProfessionalTender.findOne({ _id: tenderId, isDeleted: false });
        if (!tender) return res.status(404).json({ success: false, error: 'Tender not found.' });

        if (!['published', 'locked'].includes(tender.status))
            return res.status(400).json({ success: false, error: 'Tender is not accepting bids.' });
        if (tender.deadline <= new Date())
            return res.status(400).json({ success: false, error: 'Bid deadline has passed.' });

        if (tender.visibilityType === 'invite_only') {
            const inv = tender.invitations?.find(i => {
                const uid = req.user._id.toString();
                return (
                    (i.invitedUser && i.invitedUser.toString() === uid) ||
                    (i.invitedCompany && i.invitedCompany.toString() === req.user.companyId?.toString()) ||
                    (i.email && i.email.toLowerCase() === req.user.email?.toLowerCase())
                );
            });
            if (!inv) return res.status(403).json({ success: false, error: 'You are not invited to bid on this tender.' });
        }

        const existing = await Bid.findOne({ tender: tender._id, bidder: req.user._id, isDeleted: false });
        if (existing) return res.status(409).json({ success: false, error: 'You have already submitted a bid for this tender.' });

        const userCompany = await Company.findOne({ owner: req.user._id });

        const bidAmount = Number(req.body.bidAmount);
        if (isNaN(bidAmount) || bidAmount <= 0)
            return res.status(400).json({ success: false, error: 'A valid bid amount greater than 0 is required.' });

        const currency = safeString(req.body.currency) || 'ETB';
        const { technicalProposal, financialProposal } = req.body;

        let coverSheetData = null;
        if (tender.workflowType === 'closed') {
            coverSheetData = parseCoverSheet(req.body);
            const csErrors = validateCoverSheet(coverSheetData);
            if (csErrors) return res.status(400).json({ success: false, error: 'Cover sheet validation failed', fieldErrors: csErrors });
        }

        const uploadedFiles = req.uploadedFiles ? req.uploadedFiles.files : [];
        // Normalise documentTypes: single string or array
        const rawTypes = req.body.documentTypes;
        const documentTypes = Array.isArray(rawTypes)
            ? rawTypes
            : typeof rawTypes === 'string' ? [rawTypes] : [];

        const newBidId = new mongoose.Types.ObjectId();

        // BUG-C2 FIX: Record original index before filtering CPO files
        const filesWithOriginalIndex = uploadedFiles.map((f, i) => ({
            file: f,
            originalIndex: i,
            documentType: documentTypes[i] || f.documentType || 'other'
        }));

        const cpoFileEntry = filesWithOriginalIndex.find(e => e.documentType === 'cpo_document');
        const regularFileEntries = filesWithOriginalIndex.filter(e => e.documentType !== 'cpo_document');

        const documentsArray = regularFileEntries.map(({ file, documentType }) =>
            buildDocumentObject(file, newBidId, tenderId, documentType)
        );

        let cpoData = null;
        if (tender.cpoRequired) {
            if (!cpoFileEntry) return res.status(400).json({ success: false, error: 'A CPO document file is required for this tender.' });
            const cpoFile = cpoFileEntry.file;
            const cpoHash = crypto.createHash('md5').update(cpoFile.path + Date.now()).digest('hex');
            cpoData = {
                cpoNumber: req.body.cpoNumber,
                amount: req.body.cpoAmount ? Number(req.body.cpoAmount) : undefined,
                currency: safeString(req.body.cpoCurrency) || 'ETB',
                issuingBank: req.body.cpoIssuingBank,
                issueDate: req.body.cpoIssueDate ? new Date(req.body.cpoIssueDate) : undefined,
                expiryDate: req.body.cpoExpiryDate ? new Date(req.body.cpoExpiryDate) : undefined,
                documentPath: cpoFile.path,
                documentUrl: cpoFile.url || `/uploads/bids/${cpoFile.filename || cpoFile.fileName}`,
                documentHash: cpoHash,
                bidSecurityType: req.body.bidSecurityType || 'cpo',
                status: 'submitted',
                submittedAt: new Date()
            };
            const requiredSecurity = tender.procurement?.bidSecurityAmount;
            if (requiredSecurity && cpoData.amount !== undefined && cpoData.amount < requiredSecurity) {
                return res.status(400).json({ success: false, error: `CPO amount (${cpoData.amount} ${cpoData.currency}) is less than the required bid security amount (${requiredSecurity} ETB).` });
            }
        } else if (cpoFileEntry) {
            const cpoFile = cpoFileEntry.file;
            const cpoHash = crypto.createHash('md5').update(cpoFile.path + Date.now()).digest('hex');
            cpoData = {
                cpoNumber: req.body.cpoNumber,
                amount: req.body.cpoAmount ? Number(req.body.cpoAmount) : undefined,
                currency: safeString(req.body.cpoCurrency) || 'ETB',
                issuingBank: req.body.cpoIssuingBank,
                issueDate: req.body.cpoIssueDate ? new Date(req.body.cpoIssueDate) : undefined,
                expiryDate: req.body.cpoExpiryDate ? new Date(req.body.cpoExpiryDate) : undefined,
                documentPath: cpoFile.path,
                documentUrl: cpoFile.url || `/uploads/bids/${cpoFile.filename || cpoFile.fileName}`,
                documentHash: cpoHash,
                bidSecurityType: req.body.bidSecurityType || 'cpo',
                status: 'submitted',
                submittedAt: new Date()
            };
        }

        // FIX-B1: strip blank financial breakdown items before saving
        let financialBreakdownData = null;
        if (req.body.financialBreakdown) {
            try {
                const raw = typeof req.body.financialBreakdown === 'string'
                    ? JSON.parse(req.body.financialBreakdown)
                    : req.body.financialBreakdown;
                financialBreakdownData = sanitiseFinancialBreakdown(raw);
                // If all items were blank, don't save an empty breakdown
                if (financialBreakdownData && financialBreakdownData.items.length === 0) {
                    financialBreakdownData = null;
                }
            } catch (e) {
                console.warn('⚠️ Could not parse financialBreakdown JSON:', e.message);
            }
        }

        const bid = new Bid({
            _id: newBidId,
            tender: tender._id,
            bidder: req.user._id,
            bidderCompany: userCompany?._id,
            bidAmount,
            currency,
            technicalProposal,
            financialProposal,
            ...(financialBreakdownData && { financialBreakdown: financialBreakdownData }),
            documents: documentsArray,
            ...(cpoData && { cpo: cpoData }),
            ...(coverSheetData && { coverSheet: coverSheetData }),
            status: 'submitted',
            submittedAt: new Date()
        });

        if (tender.workflowType === 'closed') bid.seal(req.user._id);

        await bid.save();

        // FIX-B2 + FIX-B3: Use $push via updateOne to avoid re-validating the
        // entire tender document, and never store null for bidAmount.
        // For sealed tenders the amount is hidden at read time via toSafeObject.
        await ProfessionalTender.updateOne(
            { _id: tender._id },
            {
                $push: {
                    bids: {
                        bid: bid._id,
                        bidder: req.user._id,
                        // FIX-B2: store actual amount; toSafeObject masks it for sealed tenders
                        bidAmount: bidAmount,
                        currency,
                        status: 'submitted',
                        submittedAt: new Date()
                    }
                }
            }
        );

        // FIX-B5: populate response so frontend gets full objects immediately
        const populatedBid = await Bid.findById(bid._id)
            .populate('bidder', 'firstName lastName email')
            .populate('bidderCompany', 'name logo')
            .populate('tender', 'title status deadline workflowType referenceNumber');

        return res.status(201).json({
            success: true,
            message: 'Bid submitted successfully',
            data: populatedBid.toSafeObject(req.user._id, false, false)
        });

    } catch (error) {
        console.error('❌ submitBid error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// ── FUNCTION 2 — getBids ──────────────────────────────────────────────────────
exports.getBids = async (req, res) => {
    try {
        const { tenderId } = req.params;
        const tender = await ProfessionalTender.findOne({ _id: tenderId, isDeleted: false })
            .select('owner status workflowType deadline bids visibilityType invitations');
        if (!tender) return res.status(404).json({ success: false, error: 'Tender not found.' });

        const isOwner = tender.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        const isBidsRevealed = ['revealed', 'closed'].includes(tender.status);

        // FIX-B5: always populate bidder + bidderCompany
        const bids = await Bid.find({ tender: tenderId, isDeleted: false })
            .populate('bidder', 'firstName lastName email')
            .populate('bidderCompany', 'name logo')
            .sort({ submittedAt: -1 });

        const safeBids = bids.map(bid =>
            bid.toSafeObject(req.user._id, isOwner || isAdmin, isBidsRevealed)
        );

        const myBid = bids.find(b => b.bidder?._id?.toString() === req.user._id.toString());

        return res.status(200).json({
            success: true,
            data: {
                bids: safeBids,
                totalBids: bids.length,
                sealedBids: bids.filter(b => b.sealed).length,
                visibleBids: bids.filter(b => !b.sealed).length,
                isBidsRevealed,
                canBid: ['published', 'locked'].includes(tender.status) && tender.deadline > new Date(),
                myBidId: myBid ? myBid._id : null,
                hasSubmittedBid: !!myBid
            }
        });
    } catch (error) {
        console.error('❌ getBids error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// ── FUNCTION 3 — getMyBid ─────────────────────────────────────────────────────
exports.getMyBid = async (req, res) => {
    try {
        const bid = await Bid.findOne({
            tender: req.params.tenderId,
            bidder: req.user._id,
            isDeleted: false
        })
            .populate('tender', 'title status deadline workflowType referenceNumber')
            .populate('bidder', 'firstName lastName email')
            .populate('bidderCompany', 'name logo');

        if (!bid) return res.status(200).json({ success: true, data: null });

        const tender = await ProfessionalTender.findById(req.params.tenderId).select('status workflowType owner');
        const isBidsRevealed = tender ? ['revealed', 'closed'].includes(tender.status) : false;

        return res.status(200).json({
            success: true,
            data: bid.toSafeObject(req.user._id, false, isBidsRevealed)
        });
    } catch (error) {
        console.error('❌ getMyBid error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// ── FUNCTION 4 — updateBid ────────────────────────────────────────────────────
exports.updateBid = async (req, res) => {
    try {
        const bid = await Bid.findOne({
            _id: req.params.bidId,
            tender: req.params.tenderId,
            bidder: req.user._id,
            isDeleted: false
        });
        if (!bid) return res.status(404).json({ success: false, error: 'Bid not found or you are not the owner.' });

        const tender = await ProfessionalTender.findOne({ _id: req.params.tenderId, isDeleted: false });
        if (!tender) return res.status(404).json({ success: false, error: 'Tender not found.' });
        if (tender.deadline <= new Date()) return res.status(400).json({ success: false, error: 'Bid deadline has passed.' });
        if (!['published', 'locked'].includes(tender.status)) return res.status(400).json({ success: false, error: 'Tender is no longer accepting bid updates.' });

        if (req.body.bidAmount !== undefined) {
            const newAmount = Number(req.body.bidAmount);
            if (isNaN(newAmount) || newAmount <= 0) return res.status(400).json({ success: false, error: 'A valid bid amount greater than 0 is required.' });
            bid.bidAmount = newAmount;
        }

        if (req.body.currency) bid.currency = safeString(req.body.currency) || bid.currency;
        if (req.body.technicalProposal !== undefined) bid.technicalProposal = req.body.technicalProposal;
        if (req.body.financialProposal !== undefined) bid.financialProposal = req.body.financialProposal;

        if (tender.workflowType === 'closed' && req.body.coverSheet) {
            const cs = parseCoverSheet(req.body);
            const existing = bid.coverSheet ? bid.coverSheet.toObject() : {};
            bid.coverSheet = { ...existing, ...cs };
        }

        // FIX-B1: sanitise financial breakdown on update too
        if (req.body.financialBreakdown) {
            try {
                const raw = typeof req.body.financialBreakdown === 'string'
                    ? JSON.parse(req.body.financialBreakdown)
                    : req.body.financialBreakdown;
                const clean = sanitiseFinancialBreakdown(raw);
                if (clean && clean.items.length > 0) bid.financialBreakdown = clean;
            } catch (e) {
                console.warn('⚠️ Could not parse financialBreakdown on update:', e.message);
            }
        }

        const uploadedFiles = req.uploadedFiles ? req.uploadedFiles.files : [];
        const rawTypes = req.body.documentTypes;
        const documentTypes = Array.isArray(rawTypes) ? rawTypes : typeof rawTypes === 'string' ? [rawTypes] : [];

        const filesWithOriginalIndex = uploadedFiles.map((f, i) => ({
            file: f, originalIndex: i,
            documentType: documentTypes[i] || f.documentType || 'other'
        }));

        const cpoFileEntry = filesWithOriginalIndex.find(e => e.documentType === 'cpo_document');
        const regularFileEntries = filesWithOriginalIndex.filter(e => e.documentType !== 'cpo_document');

        const newDocs = regularFileEntries.map(({ file, documentType }) =>
            buildDocumentObject(file, bid._id, req.params.tenderId, documentType)
        );
        const existingHashes = new Set(bid.documents.map(d => d.fileHash).filter(Boolean));
        const uniqueNewDocs = newDocs.filter(d => !d.fileHash || !existingHashes.has(d.fileHash));
        if (uniqueNewDocs.length > 0) bid.documents.push(...uniqueNewDocs);

        if (tender.cpoRequired || cpoFileEntry) {
            const existingCpo = bid.cpo ? (bid.cpo.toObject ? bid.cpo.toObject() : { ...bid.cpo }) : {};
            if (cpoFileEntry) {
                const cpoFile = cpoFileEntry.file;
                const cpoHash = crypto.createHash('md5').update(cpoFile.path + Date.now()).digest('hex');
                bid.cpo = {
                    ...existingCpo,
                    cpoNumber: req.body.cpoNumber || existingCpo.cpoNumber,
                    amount: req.body.cpoAmount ? Number(req.body.cpoAmount) : existingCpo.amount,
                    currency: safeString(req.body.cpoCurrency) || existingCpo.currency || 'ETB',
                    issuingBank: req.body.cpoIssuingBank || existingCpo.issuingBank,
                    issueDate: req.body.cpoIssueDate ? new Date(req.body.cpoIssueDate) : existingCpo.issueDate,
                    expiryDate: req.body.cpoExpiryDate ? new Date(req.body.cpoExpiryDate) : existingCpo.expiryDate,
                    documentPath: cpoFile.path,
                    documentUrl: cpoFile.url || `/uploads/bids/${cpoFile.filename || cpoFile.fileName}`,
                    documentHash: cpoHash,
                    bidSecurityType: req.body.bidSecurityType || existingCpo.bidSecurityType || 'cpo',
                    status: 'submitted', submittedAt: new Date()
                };
            } else {
                const anyMetaChanged = req.body.cpoNumber || req.body.cpoAmount || req.body.cpoCurrency ||
                    req.body.cpoIssuingBank || req.body.cpoIssueDate || req.body.cpoExpiryDate || req.body.bidSecurityType;
                if (anyMetaChanged && existingCpo.documentPath) {
                    bid.cpo = {
                        ...existingCpo,
                        cpoNumber: req.body.cpoNumber || existingCpo.cpoNumber,
                        amount: req.body.cpoAmount ? Number(req.body.cpoAmount) : existingCpo.amount,
                        currency: safeString(req.body.cpoCurrency) || existingCpo.currency || 'ETB',
                        issuingBank: req.body.cpoIssuingBank || existingCpo.issuingBank,
                        issueDate: req.body.cpoIssueDate ? new Date(req.body.cpoIssueDate) : existingCpo.issueDate,
                        expiryDate: req.body.cpoExpiryDate ? new Date(req.body.cpoExpiryDate) : existingCpo.expiryDate,
                        bidSecurityType: req.body.bidSecurityType || existingCpo.bidSecurityType || 'cpo',
                    };
                } else if (tender.cpoRequired && !existingCpo.documentPath) {
                    return res.status(400).json({ success: false, error: 'A CPO document file is required.' });
                }
            }
        }

        if (tender.workflowType === 'closed') bid.seal(req.user._id);
        await bid.save();

        const populatedBid = await Bid.findById(bid._id)
            .populate('bidder', 'firstName lastName email')
            .populate('bidderCompany', 'name logo')
            .populate('tender', 'title status deadline workflowType referenceNumber');

        return res.status(200).json({
            success: true,
            message: 'Bid updated successfully',
            data: populatedBid.toSafeObject(req.user._id, false, false)
        });
    } catch (error) {
        console.error('❌ updateBid error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// ── FUNCTION 5 — withdrawBid ──────────────────────────────────────────────────
exports.withdrawBid = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const query = { _id: req.params.bidId, tender: req.params.tenderId, isDeleted: false };
        if (!isAdmin) query.bidder = req.user._id;
        const bid = await Bid.findOne(query);
        if (!bid) return res.status(404).json({ success: false, error: 'Bid not found.' });
        bid.status = 'withdrawn';
        bid.isDeleted = true;
        await bid.save();
        return res.status(200).json({ success: true, message: 'Bid withdrawn successfully.' });
    } catch (error) {
        console.error('❌ withdrawBid error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// ── FUNCTION 6 — updateBidStatus ─────────────────────────────────────────────
exports.updateBidStatus = async (req, res) => {
    try {
        const { tenderId, bidId } = req.params;
        const { status, ownerNotes } = req.body;

        const tender = await ProfessionalTender.findOne({ _id: tenderId, isDeleted: false });
        if (!tender) return res.status(404).json({ success: false, error: 'Tender not found.' });

        const isOwner = tender.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) return res.status(403).json({ success: false, error: 'Only the tender owner can update bid status.' });

        const bid = await Bid.findOne({ _id: bidId, tender: tenderId, isDeleted: false })
            .populate('bidder', 'firstName lastName email')
            .populate('bidderCompany', 'name logo');
        if (!bid) return res.status(404).json({ success: false, error: 'Bid not found.' });

        const allowedNext = ALLOWED_BID_TRANSITIONS[bid.status];
        if (!allowedNext || !allowedNext.includes(status)) {
            return res.status(400).json({ success: false, error: `Cannot transition from '${bid.status}' to '${status}'.` });
        }

        bid.status = status;
        bid.reviewedAt = new Date();
        if (ownerNotes !== undefined) bid.ownerNotes = ownerNotes;
        await bid.save();

        return res.status(200).json({
            success: true,
            message: `Bid status updated to ${status}`,
            data: bid.toSafeObject(req.user._id, true, true)
        });
    } catch (error) {
        console.error('❌ updateBidStatus error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// ── FUNCTION 7 — getMyAllBids ─────────────────────────────────────────────────
exports.getMyAllBids = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, tenderId } = req.query;
        const query = { bidder: req.user._id, isDeleted: false };
        if (status) query.status = status;
        if (tenderId) query.tender = tenderId;
 
        const total = await Bid.countDocuments(query);
        const bids = await Bid.find(query)
            .populate('tender', 'title status deadline workflowType referenceNumber')
            .populate('bidder', 'firstName lastName email')
            .populate('bidderCompany', 'name logo')
            .sort({ submittedAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
 
        // For getMyAllBids: every bid belongs to the requesting user.
        // We skip toSafeObject because the isOwnBid check inside it compares
        // this.bidder.toString() which returns "[object Object]" after .populate()
        // causing the bidder to be misidentified as a stranger — stripping tender/documents.
        // Instead, safely strip sealedHash and ownerNotes manually.
        const safeBids = bids.map(b => {
            const obj = b.toObject({ virtuals: false });
            delete obj.sealedHash;
            delete obj.ownerNotes;
            return obj;
        });
 
        return res.status(200).json({
            success: true,
            data: safeBids,
            pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
        });
    } catch (error) {
        console.error('❌ getMyAllBids error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// ── FUNCTION 8 — submitEvaluationScore ───────────────────────────────────────
exports.submitEvaluationScore = async (req, res) => {
    try {
        const { tenderId, bidId } = req.params;
        const { step, technicalScore, financialScore, preliminaryPassed, technicalNotes, financialNotes, preliminaryNotes } = req.body;

        if (!VALID_EVALUATION_STEPS.includes(step)) return res.status(400).json({ success: false, error: `Invalid evaluation step: ${step}` });

        const tender = await ProfessionalTender.findOne({ _id: tenderId, isDeleted: false }).select('owner');
        if (!tender) return res.status(404).json({ success: false, error: 'Tender not found.' });
        if (tender.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Only the tender owner can submit evaluation scores.' });
        }

        const bid = await Bid.findOne({ _id: bidId, tender: tenderId, isDeleted: false });
        if (!bid) return res.status(404).json({ success: false, error: 'Bid not found.' });
        if (!bid.evaluation) bid.evaluation = {};

        if (step === 'preliminary') {
            bid.evaluation.preliminaryPassed = preliminaryPassed;
            bid.evaluation.preliminaryNotes = preliminaryNotes;
            bid.evaluation.preliminaryCheckedAt = new Date();
            if (!preliminaryPassed) bid.evaluation.qualificationStatus = 'preliminary_failed';
        } else if (step === 'technical') {
            if (bid.evaluation.preliminaryPassed !== true) return res.status(400).json({ success: false, error: 'Preliminary check must pass before technical evaluation.' });
            bid.evaluation.technicalScore = Number(technicalScore);
            bid.evaluation.technicalNotes = technicalNotes;
            bid.evaluation.technicalEvaluatedAt = new Date();
            const passMark = bid.evaluation.technicalPassMark ?? 70;
            bid.evaluation.passedTechnical = bid.evaluation.technicalScore >= passMark;
            if (!bid.evaluation.passedTechnical) bid.evaluation.qualificationStatus = 'technical_failed';
        } else if (step === 'financial') {
            if (bid.evaluation.passedTechnical !== true) return res.status(400).json({ success: false, error: 'Technical evaluation must pass before financial evaluation.' });
            bid.evaluation.financialScore = Number(financialScore);
            bid.evaluation.financialEvaluatedAt = new Date();
            bid.evaluation.combinedScore = (bid.evaluation.technicalScore * 0.7) + (bid.evaluation.financialScore * 0.3);
            bid.evaluation.qualificationStatus = 'financial_evaluated';
        }

        await bid.save();
        return res.status(200).json({ success: true, message: `${step} evaluation saved`, data: { evaluation: bid.evaluation, bidNumber: bid.bidNumber } });
    } catch (error) {
        console.error('❌ submitEvaluationScore error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// ── FUNCTION 9 — verifyCPOReturn ─────────────────────────────────────────────
exports.verifyCPOReturn = async (req, res) => {
    try {
        const { tenderId, bidId } = req.params;
        const { returnStatus, returnNotes } = req.body;
        if (!['returned', 'forfeited'].includes(returnStatus)) return res.status(400).json({ success: false, error: 'Invalid returnStatus.' });

        const tender = await ProfessionalTender.findOne({ _id: tenderId, isDeleted: false }).select('owner');
        if (!tender) return res.status(404).json({ success: false, error: 'Tender not found.' });
        if (tender.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Only the tender owner can record CPO returns.' });
        }

        const bid = await Bid.findOne({ _id: bidId, tender: tenderId, isDeleted: false });
        if (!bid) return res.status(404).json({ success: false, error: 'Bid not found.' });
        if (!bid.cpo) return res.status(400).json({ success: false, error: 'This bid has no CPO on record.' });

        bid.cpo.returnStatus = returnStatus;
        bid.cpo.returnedAt = new Date();
        if (returnNotes) bid.cpo.verificationNotes = returnNotes;
        await bid.save();

        return res.status(200).json({ success: true, message: `CPO marked as ${returnStatus}`, data: { cpo: bid.cpo } });
    } catch (error) {
        console.error('❌ verifyCPOReturn error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// ── FUNCTION 10 — updateComplianceChecklist ───────────────────────────────────
exports.updateComplianceChecklist = async (req, res) => {
    try {
        const { tenderId, bidId } = req.params;
        const { complianceChecklist } = req.body;
        if (!Array.isArray(complianceChecklist)) return res.status(400).json({ success: false, error: 'complianceChecklist must be an array.' });

        const tender = await ProfessionalTender.findOne({ _id: tenderId, isDeleted: false }).select('owner');
        if (!tender) return res.status(404).json({ success: false, error: 'Tender not found.' });

        const bid = await Bid.findOne({ _id: bidId, tender: tenderId, isDeleted: false });
        if (!bid) return res.status(404).json({ success: false, error: 'Bid not found.' });

        const isOwner = tender.owner.toString() === req.user._id.toString();
        const isBidder = bid.bidder.toString() === req.user._id.toString();
        if (!isOwner && !isBidder && req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Not authorised to update compliance.' });

        bid.complianceChecklist = complianceChecklist;
        await bid.save();

        return res.status(200).json({ success: true, message: 'Compliance checklist updated', data: { complianceChecklist: bid.complianceChecklist } });
    } catch (error) {
        console.error('❌ updateComplianceChecklist error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// ── FUNCTION 8 — submitEvaluationScore ───────────────────────────────────────
exports.submitEvaluationScore = async (req, res) => {
    try {
        const { tenderId, bidId } = req.params;
        const { step, technicalScore, financialScore, preliminaryPassed,
                technicalNotes, financialNotes, preliminaryNotes } = req.body;

        if (!VALID_EVALUATION_STEPS.includes(step)) {
            return res.status(400).json({ success: false, error: `Invalid evaluation step: ${step}` });
        }

        const tender = await ProfessionalTender.findOne({ _id: tenderId, isDeleted: false }).select('owner');
        if (!tender) return res.status(404).json({ success: false, error: 'Tender not found.' });

        const isOwner = tender.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, error: 'Only the tender owner can submit evaluation scores.' });
        }

        const bid = await Bid.findOne({ _id: bidId, tender: tenderId, isDeleted: false });
        if (!bid) return res.status(404).json({ success: false, error: 'Bid not found.' });

        if (!bid.evaluation) bid.evaluation = {};

        if (step === 'preliminary') {
            bid.evaluation.preliminaryPassed = preliminaryPassed;
            bid.evaluation.preliminaryNotes = preliminaryNotes;
            bid.evaluation.preliminaryCheckedAt = new Date();
            if (!preliminaryPassed) bid.evaluation.qualificationStatus = 'preliminary_failed';
        } else if (step === 'technical') {
            if (bid.evaluation.preliminaryPassed !== true) {
                return res.status(400).json({ success: false, error: 'Preliminary check must pass before technical evaluation.' });
            }
            bid.evaluation.technicalScore = Number(technicalScore);
            bid.evaluation.technicalNotes = technicalNotes;
            bid.evaluation.technicalEvaluatedAt = new Date();
            const passMark = bid.evaluation.technicalPassMark ?? 70;
            bid.evaluation.passedTechnical = bid.evaluation.technicalScore >= passMark;
            if (!bid.evaluation.passedTechnical) bid.evaluation.qualificationStatus = 'technical_failed';
        } else if (step === 'financial') {
            if (bid.evaluation.passedTechnical !== true) {
                return res.status(400).json({ success: false, error: 'Technical evaluation must pass before financial evaluation.' });
            }
            bid.evaluation.financialScore = Number(financialScore);
            bid.evaluation.financialEvaluatedAt = new Date();
            const techWeight = 0.7, finWeight = 0.3;
            bid.evaluation.combinedScore = (bid.evaluation.technicalScore * techWeight) + (bid.evaluation.financialScore * finWeight);
            bid.evaluation.qualificationStatus = 'financial_evaluated';
        }

        await bid.save();

        return res.status(200).json({
            success: true,
            message: `${step} evaluation saved`,
            data: { evaluation: bid.evaluation, bidNumber: bid.bidNumber }
        });

    } catch (error) {
        console.error('❌ submitEvaluationScore error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// ── FUNCTION 9 — verifyCPOReturn ─────────────────────────────────────────────
exports.verifyCPOReturn = async (req, res) => {
    try {
        const { tenderId, bidId } = req.params;
        const { returnStatus, returnNotes } = req.body;

        if (!['returned', 'forfeited'].includes(returnStatus)) {
            return res.status(400).json({ success: false, error: 'Invalid returnStatus.' });
        }

        const tender = await ProfessionalTender.findOne({ _id: tenderId, isDeleted: false }).select('owner');
        if (!tender) return res.status(404).json({ success: false, error: 'Tender not found.' });

        const isOwner = tender.owner.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Only the tender owner can record CPO returns.' });
        }

        const bid = await Bid.findOne({ _id: bidId, tender: tenderId, isDeleted: false });
        if (!bid) return res.status(404).json({ success: false, error: 'Bid not found.' });
        if (!bid.cpo) return res.status(400).json({ success: false, error: 'This bid has no CPO on record.' });

        bid.cpo.returnStatus = returnStatus;
        bid.cpo.returnedAt = new Date();
        if (returnNotes) bid.cpo.verificationNotes = returnNotes;
        await bid.save();

        return res.status(200).json({
            success: true,
            message: `CPO marked as ${returnStatus}`,
            data: { cpo: bid.cpo }
        });

    } catch (error) {
        console.error('❌ verifyCPOReturn error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// ── FUNCTION 10 — updateComplianceChecklist ───────────────────────────────────
exports.updateComplianceChecklist = async (req, res) => {
    try {
        const { tenderId, bidId } = req.params;
        const { complianceChecklist } = req.body;

        if (!Array.isArray(complianceChecklist)) {
            return res.status(400).json({ success: false, error: 'complianceChecklist must be an array.' });
        }

        const tender = await ProfessionalTender.findOne({ _id: tenderId, isDeleted: false }).select('owner');
        if (!tender) return res.status(404).json({ success: false, error: 'Tender not found.' });

        const bid = await Bid.findOne({ _id: bidId, tender: tenderId, isDeleted: false });
        if (!bid) return res.status(404).json({ success: false, error: 'Bid not found.' });

        const isOwner = tender.owner.toString() === req.user._id.toString();
        const isBidder = bid.bidder.toString() === req.user._id.toString();
        if (!isOwner && !isBidder && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Not authorised to update compliance.' });
        }

        bid.complianceChecklist = complianceChecklist;
        await bid.save();

        return res.status(200).json({
            success: true,
            message: 'Compliance checklist updated',
            data: { complianceChecklist: bid.complianceChecklist }
        });

    } catch (error) {
        console.error('❌ updateComplianceChecklist error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};