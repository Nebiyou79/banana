// src/professional/professionalTenderController.js
const ProfessionalTender = require('../models/ProfessionalTender');
const Company = require('../models/Company');
const User = require('../models/User');
const Organization = require('../models/Organization');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const emailService = require('../services/emailService');

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// procurementMethod alias map — kept in one place, shared by create & update
const METHOD_ALIAS_MAP = {
    sealed_bid: 'restricted',
    restricted_tender: 'restricted',
    negotiated: 'direct',
    open_tender: 'open_tender',
    restricted: 'restricted',
    direct: 'direct',
    framework: 'framework'
};

// documentType alias map — kept in one place, shared by create & update
const DOC_TYPE_ALIAS_MAP = {
    specifications: 'technical_specifications',
    spec: 'technical_specifications',
    tor: 'terms_of_reference',
    sow: 'statement_of_work',
    boq: 'bill_of_quantities',
    drawing: 'drawings',
    compliance: 'compliance_template',
    addendum: 'other'
};

/**
 * Build an attachments array from req.uploadedFiles.
 * Always stores downloadUrl as the relative API path (never the local /uploads/… path).
 * FIX P-17: Using relative API path prevents stale absolute URLs in the database.
 */
const buildAttachments = (uploadedFiles, tenderId, documentType, uploadedBy) => {
    const rawDocType = documentType || 'other';
    const normalizedDocType = DOC_TYPE_ALIAS_MAP[rawDocType] || rawDocType;

    return uploadedFiles.map(file => {
        const fileHash = crypto.createHash('md5')
            .update(file.path + Date.now())
            .digest('hex');
        return {
            originalName: file.originalName,
            fileName: file.fileName,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path,
            url: file.url,
            // FIX P-17 / P-09: Store only the relative API download path.
            // Frontend MUST call downloadProfessionalAttachment() hook — never use this URL directly.
            downloadUrl: file.url,
            fileHash,
            uploadedBy,
            documentType: normalizedDocType
        };
    });
};

/**
 * Normalize all optional JSON body fields into tenderData in-place.
 * Handles string-encoded JSON (FormData) and plain objects (JSON body) transparently.
 */
const parseOptionalJsonFields = (body, tenderData, fields) => {
    fields.forEach(field => {
        if (body[field] !== undefined && body[field] !== '') {
            if (typeof body[field] === 'string') {
                try {
                    tenderData[field] = JSON.parse(body[field]);
                } catch (e) {
                    tenderData[field] = body[field];
                }
            } else {
                tenderData[field] = body[field];
            }
        }
    });
};

/**
 * Normalize array fields that Mongoose needs as objects, not strings.
 * Also fixes P-05: deliverables must be { title, description } objects, not plain strings.
 */
const normalizeArrayFields = (tenderData) => {
    // requiredCertifications — flatten objects/CSV to string array
    if (tenderData.eligibility?.requiredCertifications) {
        const certs = tenderData.eligibility.requiredCertifications;
        if (typeof certs === 'string') {
            tenderData.eligibility.requiredCertifications = certs
                .split(',').map(s => s.trim()).filter(Boolean);
        } else if (Array.isArray(certs)) {
            tenderData.eligibility.requiredCertifications = certs.map(c =>
                typeof c === 'object' ? (c.name || '') : String(c)
            ).filter(Boolean);
        }
    }

    // FIX P-05: deliverables — accept { text } (legacy form) OR { title } (new form) OR plain string.
    // Always store as { title, description, deadline }.
    if (tenderData.scope?.deliverables && Array.isArray(tenderData.scope.deliverables)) {
        tenderData.scope.deliverables = tenderData.scope.deliverables.map(d => {
            if (typeof d === 'string') return { title: d, description: '' };
            if (d.text && !d.title) return { title: d.text, description: d.description || '' };
            return d;
        });
    }

    // milestones — ensure objects not strings
    if (tenderData.scope?.milestones && Array.isArray(tenderData.scope.milestones)) {
        tenderData.scope.milestones = tenderData.scope.milestones.map(m =>
            typeof m === 'string' ? { title: m } : m
        );
    }
};

/**
 * FIX P-02: Map evaluationCriteria array (legacy form field) → evaluation object (schema shape).
 * The form sends [{ name, weight, description }]; the schema wants { evaluationMethod, technicalWeight, financialWeight }.
 */
const mapEvaluationCriteria = (body, tenderData) => {
    if (!body.evaluationCriteria) return;

    let criteria = body.evaluationCriteria;
    if (typeof criteria === 'string') {
        try { criteria = JSON.parse(criteria); } catch (e) { return; }
    }
    if (!Array.isArray(criteria)) return;

    const evalObj = tenderData.evaluation || {};
    const techItem = criteria.find(c => c.name?.toLowerCase().includes('technical'));
    const finItem = criteria.find(c => c.name?.toLowerCase().includes('financial'));

    evalObj.technicalWeight = techItem?.weight ?? evalObj.technicalWeight ?? 70;
    evalObj.financialWeight = finItem?.weight ?? evalObj.financialWeight ?? 30;
    evalObj.evaluationMethod = evalObj.evaluationMethod || 'combined';

    tenderData.evaluation = evalObj;
};

/**
 * FIX P-14: Extract preBidMeeting from the procurement object (where the old form incorrectly nested it)
 * and promote it to root level. Also strips the non-schema fields estimatedValue and currency from procurement.
 */
const extractPreBidMeetingFromProcurement = (procurementObj, tenderData) => {
    if (!procurementObj) return;

    if (procurementObj.preBidMeeting) {
        const pbm = procurementObj.preBidMeeting;
        if (pbm.enabled || pbm.date) {
            tenderData.preBidMeeting = {
                date: pbm.date ? new Date(pbm.date) : undefined,
                location: pbm.location || '',
                onlineLink: pbm.onlineLink || '',
                mandatory: pbm.mandatory || false
            };
        }
        delete procurementObj.preBidMeeting;
    }

    // FIX P-15: estimatedValue and currency don't exist in the procurement sub-schema — strip them
    delete procurementObj.estimatedValue;
    delete procurementObj.currency;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. getCategories
// ─────────────────────────────────────────────────────────────────────────────
exports.getCategories = async (req, res) => {
    try {
        const categories = ProfessionalTender.getCategories();
        // FIX P-08: Return the full structured object (not flattened).
        // The frontend service must use Object.entries() to build <optgroup> lists.
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error in getCategories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// FIX P-10: generateReferenceNumber — new endpoint for on-demand reference generation
// Route: GET /api/v1/professional-tenders/generate-ref
// ─────────────────────────────────────────────────────────────────────────────
exports.generateReferenceNumber = async (req, res) => {
    try {
        const year = new Date().getFullYear();
        const count = await ProfessionalTender.countDocuments({
            referenceNumber: { $regex: `^BANANA/PROC/${year}/` }
        });
        const seq = String(count + 1).padStart(4, '0');
        const referenceNumber = `BANANA/PROC/${year}/${seq}`;

        res.status(200).json({
            success: true,
            data: { referenceNumber }
        });
    } catch (error) {
        console.error('Error in generateReferenceNumber:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate reference number',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. createProfessionalTender
// ─────────────────────────────────────────────────────────────────────────────
exports.createProfessionalTender = async (req, res) => {
    try {
        const { role, _id } = req.user;

        if (!['company', 'organization'].includes(role)) {
            return res.status(403).json({
                success: false,
                message: 'Only companies and organizations can create professional tenders'
            });
        }

        // ── FIX P-01 / P-03: Normalize biddingType → workflowType BEFORE destructuring ──
        // The old form sends biddingType:'open'|'sealed'; the schema expects workflowType:'open'|'closed'.
        if (req.body.biddingType && !req.body.workflowType) {
            req.body.workflowType = req.body.biddingType === 'sealed' ? 'closed' : req.body.biddingType;
        }

        const {
            title, description, procurementCategory, tenderType,
            workflowType, deadline, procurement
        } = req.body;

        // FIX P-10: Auto-generate referenceNumber if blank (form hint says "leave blank to auto-generate")
        let referenceNumber = req.body.referenceNumber;
        if (!referenceNumber || String(referenceNumber).trim() === '') {
            const year = new Date().getFullYear();
            const count = await ProfessionalTender.countDocuments({
                referenceNumber: { $regex: `^BANANA/PROC/${year}/` }
            });
            const seq = String(count + 1).padStart(4, '0');
            referenceNumber = `BANANA/PROC/${year}/${seq}`;
        }

        // Required field check — workflowType is now always present after normalization above
        if (!title || !description || !procurementCategory || !tenderType ||
            !workflowType || !deadline || !procurement) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, description, procurementCategory, tenderType, workflowType, deadline, procurement'
            });
        }

        // Parse procurement object
        let procurementObj = procurement;
        if (typeof procurement === 'string') {
            try {
                procurementObj = JSON.parse(procurement);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid procurement format: must be a valid JSON object'
                });
            }
        }

        // FIX P-14: Strip preBidMeeting / estimatedValue / currency from procurement BEFORE building tenderData
        extractPreBidMeetingFromProcurement(procurementObj, {}); // dry run to clean the object

        // FIX P-04: Auto-inject sealedBidConfirmation for closed tenders if not already present
        if (workflowType === 'closed') {
            if (req.body.sealedBidConfirmation !== 'true' && req.body.sealedBidConfirmation !== true) {
                req.body.sealedBidConfirmation = 'true'; // backend normalizes on behalf of the frontend
            }
        }

        // Resolve owner entity
        let ownerEntity = null;
        let ownerEntityModel = null;

        if (role === 'company') {
            ownerEntity = await Company.findOne({ user: _id });
            ownerEntityModel = 'Company';
        } else if (role === 'organization') {
            ownerEntity = await Organization.findOne({ user: _id });
            ownerEntityModel = 'Organization';
        }

        if (!ownerEntity) {
            return res.status(400).json({
                success: false,
                message: `No ${role} profile found for this user`
            });
        }

        const rawMethod = procurementObj.procurementMethod || 'open_tender';
        const normalizedMethod = METHOD_ALIAS_MAP[rawMethod] || 'open_tender';

        const tenderData = {
            title,
            description,
            procurementCategory,
            tenderType,
            workflowType,
            referenceNumber,
            deadline: new Date(deadline),
            owner: _id,
            ownerRole: role,
            ownerEntity: ownerEntity._id,
            ownerEntityModel,
            procurement: {
                procuringEntity: procurementObj.procuringEntity,
                procurementMethod: normalizedMethod,
                fundingSource: procurementObj.fundingSource,
                contactPerson: procurementObj.contactPerson,
                bidSecurityAmount: procurementObj.bidSecurityAmount,
                // FIX P-15: bidSecurityCurrency (not currency) is the correct schema field
                bidSecurityCurrency: procurementObj.bidSecurityCurrency || procurementObj.currency || 'ETB'
            },
            visibilityType: req.body.visibilityType || 'public',
            status: req.body.status || 'draft'
        };

        // FIX P-16 / briefDescription
        if (req.body.briefDescription) {
            tenderData.briefDescription = String(req.body.briefDescription).slice(0, 500);
        }

        // Optional JSON fields
        parseOptionalJsonFields(req.body, tenderData, [
            'eligibility', 'scope', 'evaluation',
            'clarificationDeadline', 'cpoRequired', 'cpoDescription',
            'performanceBond'
        ]);

        // FIX P-14: preBidMeeting — parse as root-level field, NOT from inside procurement
        if (req.body.preBidMeeting) {
            let pbm = req.body.preBidMeeting;
            if (typeof pbm === 'string') {
                try { pbm = JSON.parse(pbm); } catch (e) { pbm = null; }
            }
            if (pbm && (pbm.enabled || pbm.date)) {
                tenderData.preBidMeeting = {
                    date: pbm.date ? new Date(pbm.date) : undefined,
                    location: pbm.location || '',
                    onlineLink: pbm.onlineLink || '',
                    mandatory: pbm.mandatory || false
                };
            }
        }

        // bidValidityPeriod — root-level Number
        if (req.body.bidValidityPeriod !== undefined && req.body.bidValidityPeriod !== '') {
            const parsed = Number(req.body.bidValidityPeriod);
            if (!isNaN(parsed)) tenderData.bidValidityPeriod = parsed;
        }

        // FIX P-02: Map legacy evaluationCriteria array → evaluation object
        mapEvaluationCriteria(req.body, tenderData);

        // Normalize arrays
        normalizeArrayFields(tenderData);

        if (!tenderData.bidOpeningDate && workflowType === 'open') {
            tenderData.bidOpeningDate = new Date(deadline);
        }

        // Attachments
        if (req.uploadedFiles?.files?.length > 0) {
            tenderData.attachments = buildAttachments(
                req.uploadedFiles.files,
                null,
                req.body.documentType,
                _id
            );
        }

        const tender = new ProfessionalTender(tenderData);
        await tender.save();

        await tender.addAuditLog('CREATE_PROFESSIONAL_TENDER', _id, {
            title: tender.title,
            referenceNumber: tender.referenceNumber,
            status: tender.status
        }, req.ip, req.get('User-Agent'));

        await tender.populate('owner', 'name email');

        res.status(201).json({
            success: true,
            data: tender,
            message: 'Professional tender created successfully'
        });

    } catch (error) {
        console.error('Error in createProfessionalTender:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create professional tender',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. getProfessionalTenders (browse — companies only)
// ─────────────────────────────────────────────────────────────────────────────
exports.getProfessionalTenders = async (req, res) => {
    try {
        const { role, _id } = req.user;

        if (role !== 'company' && role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only companies can browse professional tenders'
            });
        }

        const userCompany = await Company.findOne({ user: _id });

        const visibilityConditions = [{ visibilityType: 'public' }];

        if (userCompany) {
            visibilityConditions.push({
                visibilityType: 'invite_only',
                'invitations.invitedCompany': userCompany._id,
                'invitations.invitationStatus': 'accepted'
            });
        }

        const filter = {
            owner: { $ne: _id },
            status: { $in: ['published', 'locked'] },
            deadline: { $gt: new Date() },
            isDeleted: false,
            $or: visibilityConditions
        };

        const {
            search, tenderType, workflowType, procurementCategory, cpoRequired,
            minExperience, visibilityType, dateFrom, dateTo, referenceNumber,
            procuringEntity, page = 1, limit = 15, sortBy = 'createdAt', sortOrder = 'desc'
        } = req.query;

        if (search) {
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { referenceNumber: { $regex: search, $options: 'i' } }
                ]
            });
        }

        if (tenderType) filter.tenderType = tenderType;
        if (workflowType) filter.workflowType = workflowType;
        if (procurementCategory) filter.procurementCategory = procurementCategory;
        if (cpoRequired !== undefined) filter.cpoRequired = cpoRequired === 'true';
        if (minExperience) filter['eligibility.minimumExperience'] = { $gte: Number(minExperience) };
        if (visibilityType) filter.visibilityType = visibilityType;
        if (referenceNumber) filter.referenceNumber = { $regex: referenceNumber, $options: 'i' };
        if (procuringEntity) filter['procurement.procuringEntity'] = { $regex: procuringEntity, $options: 'i' };

        if (dateFrom || dateTo) {
            filter.deadline = {};
            if (dateFrom) filter.deadline.$gte = new Date(dateFrom);
            if (dateTo) filter.deadline.$lte = new Date(dateTo);
        }

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const skip = (pageNum - 1) * limitNum;

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const tenders = await ProfessionalTender.find(filter)
            .select('-bids.documents -bids.technicalProposal -bids.financialProposal')
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate('owner', 'name email')
            .populate('ownerEntity', 'name logo headline');

        const processedTenders = tenders.map(tender => {
            const tenderObj = tender.toObject();
            tenderObj.bidCount = tender.bids.length;
            if (tender.workflowType === 'closed') {
                tenderObj.sealedBidCount = tender.bids.filter(b => b.sealed).length;
            }
            delete tenderObj.bids;
            return tenderObj;
        });

        const total = await ProfessionalTender.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                tenders: processedTenders,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });

    } catch (error) {
        console.error('Error in getProfessionalTenders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch professional tenders',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. getProfessionalTender (single tender by :id)
// ─────────────────────────────────────────────────────────────────────────────
exports.getProfessionalTender = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Professional tender not found'
            });
        }

        const canView = await tender.canUserView(userId, userRole);

        if (!canView && userRole !== 'admin') {
            const hasInvitation = await tender.checkInvitationStatus(userId, userRole);
            if (!hasInvitation) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to view this tender'
                });
            }
        }

        const isOwner = tender.owner.toString() === userId.toString();

        ProfessionalTender.updateOne(
            { _id: id },
            { $inc: { 'metadata.views': 1 } }
        ).catch(err => console.error('Failed to increment views:', err));

        if (isOwner || userRole === 'admin') {
            await tender.populate([
                { path: 'bids.bidder', select: '_id name email' },
                { path: 'bids.bidderCompany', select: 'name logo' },
                { path: 'cpoSubmissions.bidder', select: '_id name email' },
                { path: 'cpoSubmissions.bidderCompany', select: 'name logo' },
                { path: 'owner', select: '_id name email' },
                { path: 'ownerEntity', select: 'name logo headline' }
            ]);
            return res.status(200).json({ success: true, data: tender, isOwner: true });
        }

        const tenderObj = tender.toObject();

        if (tender.workflowType === 'closed' && !['revealed', 'closed'].includes(tender.status)) {
            tenderObj.bidCount = tender.bids.length;
            tenderObj.sealedBidCount = tender.bids.filter(b => b.sealed).length;
            delete tenderObj.bids;

            const userCompany = await Company.findOne({ user: userId });
            if (userCompany) {
                const myBid = tender.bids.find(b =>
                    b.bidderCompany && b.bidderCompany.toString() === userCompany._id.toString()
                );
                if (myBid) {
                    tenderObj.myBid = {
                        _id: myBid._id,
                        status: myBid.status,
                        submittedAt: myBid.submittedAt,
                        sealed: myBid.sealed
                    };
                }
            }
        } else {
            tenderObj.bidCount = tender.bids.length;
            tenderObj.bids = tender.bids.map(bid => ({
                _id: bid._id,
                bidder: bid.bidder,
                bidderCompany: bid.bidderCompany,
                bidAmount: bid.bidAmount,
                currency: bid.currency,
                status: bid.status,
                submittedAt: bid.submittedAt
            }));
        }

        delete tenderObj.cpoSubmissions;

        res.status(200).json({ success: true, data: tenderObj, isOwner: false });

    } catch (error) {
        console.error('Error in getProfessionalTender:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch professional tender',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. updateProfessionalTender
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProfessionalTender = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({ success: false, message: 'Professional tender not found' });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'You do not have permission to update this tender' });
        }

        if (tender.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Active tenders cannot be edited. Use the addendum system at POST /api/v1/professional-tenders/:id/addendum to issue changes.'
            });
        }

        // FIX P-01: Normalize biddingType → workflowType before processing
        if (req.body.biddingType && !req.body.workflowType) {
            req.body.workflowType = req.body.biddingType === 'sealed' ? 'closed' : req.body.biddingType;
        }

        const changes = {};

        const updatableScalarFields = [
            'title', 'description', 'briefDescription', 'procurementCategory', 'tenderType',
            'workflowType', 'deadline', 'referenceNumber', 'visibilityType',
            'cpoRequired', 'cpoDescription'
        ];

        updatableScalarFields.forEach(field => {
            if (req.body[field] !== undefined && req.body[field] !== '') {
                const oldValue = tender[field];
                tender[field] = req.body[field];
                if (JSON.stringify(oldValue) !== JSON.stringify(req.body[field])) {
                    changes[field] = { old: oldValue, new: req.body[field] };
                }
            }
        });

        const updatableJsonFields = ['eligibility', 'scope', 'evaluation', 'performanceBond', 'clarificationDeadline'];

        updatableJsonFields.forEach(field => {
            if (req.body[field] !== undefined && req.body[field] !== '') {
                let value = req.body[field];
                if (typeof value === 'string') {
                    try { value = JSON.parse(value); } catch (e) { /* keep as-is */ }
                }
                const oldValue = tender[field];
                tender[field] = value;
                if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
                    changes[field] = { old: oldValue, new: value };
                }
            }
        });

        // FIX P-14: preBidMeeting at root level
        if (req.body.preBidMeeting !== undefined) {
            let pbm = req.body.preBidMeeting;
            if (typeof pbm === 'string') {
                try { pbm = JSON.parse(pbm); } catch (e) { pbm = null; }
            }
            if (pbm) {
                tender.preBidMeeting = {
                    date: pbm.date ? new Date(pbm.date) : tender.preBidMeeting?.date,
                    location: pbm.location ?? tender.preBidMeeting?.location ?? '',
                    onlineLink: pbm.onlineLink ?? tender.preBidMeeting?.onlineLink ?? '',
                    mandatory: pbm.mandatory ?? tender.preBidMeeting?.mandatory ?? false
                };
                changes.preBidMeeting = pbm;
            }
        }

        // bidValidityPeriod
        if (req.body.bidValidityPeriod !== undefined && req.body.bidValidityPeriod !== '') {
            const parsed = Number(req.body.bidValidityPeriod);
            if (!isNaN(parsed)) {
                changes.bidValidityPeriod = { old: tender.bidValidityPeriod, new: parsed };
                tender.bidValidityPeriod = parsed;
            }
        }

        // FIX P-02: map evaluationCriteria array → evaluation object
        mapEvaluationCriteria(req.body, tender);

        // Normalize array fields (P-05 fix applies on update too)
        normalizeArrayFields(tender);

        // procurement update — normalize method alias + strip bad fields (P-14, P-15)
        if (req.body.procurement) {
            let procurement = req.body.procurement;
            if (typeof procurement === 'string') {
                try { procurement = JSON.parse(procurement); } catch (e) { procurement = {}; }
            }

            extractPreBidMeetingFromProcurement(procurement, tender); // also updates tender.preBidMeeting if nested

            if (procurement.procurementMethod) {
                procurement.procurementMethod =
                    METHOD_ALIAS_MAP[procurement.procurementMethod] || procurement.procurementMethod;
            }

            if (procurement.bidSecurityCurrency === undefined && procurement.currency) {
                procurement.bidSecurityCurrency = procurement.currency;
                delete procurement.currency;
            }

            Object.assign(tender.procurement, procurement);
            changes.procurement = procurement;
        }

        // File uploads
        if (req.uploadedFiles?.files?.length > 0) {
            const newAttachments = buildAttachments(
                req.uploadedFiles.files,
                id,
                req.body.documentType,
                userId
            );
            tender.attachments.push(...newAttachments);
            changes.attachmentsAdded = newAttachments.length;
        }

        tender.metadata.updateCount = (tender.metadata.updateCount || 0) + 1;
        tender.metadata.lastUpdatedAt = new Date();

        await tender.save();
        await tender.addAuditLog('UPDATE_PROFESSIONAL_TENDER', userId, changes, req.ip, req.get('User-Agent'));
        await tender.populate('owner', 'name email');

        res.status(200).json({
            success: true,
            data: tender,
            message: 'Professional tender updated successfully'
        });

    } catch (error) {
        console.error('Error in updateProfessionalTender:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update professional tender',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. deleteProfessionalTender
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteProfessionalTender = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({ success: false, message: 'Professional tender not found' });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'You do not have permission to delete this tender' });
        }

        if (tender.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Only draft tenders can be deleted. Published tenders must be cancelled.'
            });
        }

        tender.isDeleted = true;
        tender.deletedAt = new Date();
        tender.deletedBy = userId;
        await tender.save();

        await tender.addAuditLog('DELETE_PROFESSIONAL_TENDER', userId, {
            title: tender.title,
            referenceNumber: tender.referenceNumber
        }, req.ip, req.get('User-Agent'));

        res.status(200).json({ success: true, message: 'Professional tender deleted successfully' });

    } catch (error) {
        console.error('Error in deleteProfessionalTender:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete professional tender',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. publishProfessionalTender
// ─────────────────────────────────────────────────────────────────────────────
exports.publishProfessionalTender = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({ success: false, message: 'Professional tender not found' });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'You do not have permission to publish this tender' });
        }

        if (tender.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: `Cannot publish tender with status: ${tender.status}`
            });
        }

        const validationErrors = [];
        if (!tender.title) validationErrors.push('title');
        if (!tender.description) validationErrors.push('description');
        if (!tender.procurementCategory) validationErrors.push('procurementCategory');
        if (!tender.tenderType) validationErrors.push('tenderType');
        if (!tender.workflowType) validationErrors.push('workflowType');
        if (!tender.referenceNumber) validationErrors.push('referenceNumber');
        if (!tender.deadline || tender.deadline <= new Date()) validationErrors.push('deadline must be in the future');
        if (!tender.procurement?.procuringEntity) validationErrors.push('procurement.procuringEntity');

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot publish: missing required fields',
                missingFields: validationErrors
            });
        }

        if (tender.workflowType === 'closed') {
            await tender.lockForSealedBid(userId);
        } else {
            tender.status = 'published';
            tender.publishedAt = new Date();
        }

        await tender.save();

        if (tender.visibilityType === 'invite_only' && tender.invitations.length > 0) {
            const pendingInvites = tender.invitations.filter(inv => inv.invitationStatus === 'pending');
            pendingInvites.forEach(async (invite) => {
                try {
                    if (invite.email) {
                        await emailService.sendTenderInvitationEmail(
                            invite.email,
                            invite.email.split('@')[0],
                            tender,
                            req.user
                        );
                    }
                } catch (emailError) {
                    console.error('Failed to send invitation email:', emailError);
                }
            });
        }

        await tender.addAuditLog('PUBLISH_PROFESSIONAL_TENDER', userId, {
            previousStatus: 'draft',
            newStatus: tender.status,
            workflowType: tender.workflowType
        }, req.ip, req.get('User-Agent'));

        await tender.populate('owner', 'name email');

        res.status(200).json({
            success: true,
            data: tender,
            message: `Professional tender published successfully as ${tender.status}`
        });

    } catch (error) {
        console.error('Error in publishProfessionalTender:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to publish professional tender',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. revealBids
// ─────────────────────────────────────────────────────────────────────────────
exports.revealBids = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({ success: false, message: 'Professional tender not found' });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'You do not have permission to reveal bids' });
        }

        if (tender.workflowType !== 'closed') {
            return res.status(400).json({ success: false, message: 'Cannot reveal bids: not a sealed bid tender' });
        }

        if (tender.status !== 'deadline_reached') {
            return res.status(400).json({ success: false, message: 'Cannot reveal bids: tender status must be deadline_reached' });
        }

        const bidCount = tender.bids.length;
        await tender.revealAllBids(userId);

        await tender.addAuditLog('REVEAL_BIDS', userId, { bidsRevealed: bidCount }, req.ip, req.get('User-Agent'));

        res.status(200).json({
            success: true,
            data: { bidsRevealed: bidCount, tender },
            message: `${bidCount} bid(s) revealed successfully`
        });

    } catch (error) {
        console.error('Error in revealBids:', error);
        res.status(500).json({ success: false, message: 'Failed to reveal bids', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. issueAddendum
// ─────────────────────────────────────────────────────────────────────────────
exports.issueAddendum = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { title, description, newDeadline } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Title and description are required for addendum' });
        }

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({ success: false, message: 'Professional tender not found' });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'You do not have permission to issue addenda' });
        }

        if (!['published', 'locked'].includes(tender.status)) {
            return res.status(400).json({ success: false, message: 'Addenda can only be issued for published or locked tenders' });
        }

        if (newDeadline) {
            const newDeadlineDate = new Date(newDeadline);
            if (newDeadlineDate <= new Date()) {
                return res.status(400).json({ success: false, message: 'New deadline must be in the future' });
            }
            if (newDeadlineDate <= tender.deadline) {
                return res.status(400).json({ success: false, message: 'New deadline must be after current deadline' });
            }
        }

        const addendum = {
            title,
            description,
            issuedAt: new Date(),
            issuedBy: userId
        };

        if (newDeadline) addendum.newDeadline = new Date(newDeadline);

        if (req.uploadedFiles?.files?.length > 0) {
            const file = req.uploadedFiles.files[0];
            addendum.documentPath = file.path;
            addendum.documentUrl = file.url;
        }

        await ProfessionalTender.updateOne(
            { _id: id },
            {
                $push: { addenda: addendum },
                ...(newDeadline && { $set: { deadline: new Date(newDeadline) } })
            }
        );

        const updatedTender = await ProfessionalTender.findById(id);
        const newAddendum = updatedTender.addenda[updatedTender.addenda.length - 1];

        // Notify bidders (non-blocking)
        try {
            const bidderIds = [...new Set(updatedTender.bids.map(b => b.bidder.toString()))];
            const bidders = await User.find({ _id: { $in: bidderIds } }).select('email name');
            bidders.forEach(bidder => {
                if (bidder.email) {
                    console.log(`Addendum email would be sent to ${bidder.email}`);
                }
            });
        } catch (notifyError) {
            console.error('Error notifying bidders:', notifyError);
        }

        await ProfessionalTender.updateOne({ _id: id }, {
            $push: {
                auditLog: {
                    action: 'ISSUE_ADDENDUM',
                    performedBy: userId,
                    changes: { addendumId: newAddendum._id, title, newDeadline: newDeadline || null },
                    performedAt: new Date(),
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            }
        });

        res.status(200).json({ success: true, data: newAddendum, message: 'Addendum issued successfully' });

    } catch (error) {
        console.error('Error in issueAddendum:', error);
        res.status(500).json({ success: false, message: 'Failed to issue addendum', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. getAddenda
// ─────────────────────────────────────────────────────────────────────────────
exports.getAddenda = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({ success: false, message: 'Professional tender not found' });
        }

        const canView = await tender.canUserView(userId, userRole);

        if (!canView && userRole !== 'admin') {
            const hasInvitation = await tender.checkInvitationStatus(userId, userRole);
            if (!hasInvitation) {
                return res.status(403).json({ success: false, message: 'You do not have permission to view this tender' });
            }
        }

        res.status(200).json({ success: true, data: tender.addenda || [] });

    } catch (error) {
        console.error('Error in getAddenda:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch addenda', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. inviteCompanies
// ─────────────────────────────────────────────────────────────────────────────
exports.inviteCompanies = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { users, companies, emails } = req.body;

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({ success: false, message: 'Professional tender not found' });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'You do not have permission to invite companies' });
        }

        if (tender.visibilityType !== 'invite_only') {
            return res.status(400).json({ success: false, message: 'Invitations can only be sent for invite_only tenders' });
        }

        if (!['draft', 'published', 'locked'].includes(tender.status)) {
            return res.status(400).json({ success: false, message: 'Invitations can only be sent for draft, published, or locked tenders' });
        }

        const invitations = [];
        const tokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;

        if (users && Array.isArray(users)) {
            for (const uid of users) {
                invitations.push({
                    invitedUser: uid,
                    invitationType: 'user',
                    invitedBy: req.user._id,
                    token: crypto.randomBytes(32).toString('hex'),
                    tokenExpires: tokenExpiry
                });
            }
        }

        if (companies && Array.isArray(companies)) {
            for (const entry of companies) {
                // Accept both plain ID strings and { companyId, message } objects
                // (the frontend service sends objects; legacy callers may send strings)
                const companyId = typeof entry === 'string' ? entry : entry.companyId;
                const personalMessage = typeof entry === 'object' ? (entry.message || '') : '';

                if (!companyId) continue;

                // Prevent duplicate invitations for the same company
                const alreadyInvited = tender.invitations.some(
                    (inv) => inv.invitedCompany && inv.invitedCompany.toString() === companyId.toString()
                );
                if (alreadyInvited) continue;

                invitations.push({
                    invitedCompany: companyId,
                    invitationType: 'company',
                    invitedBy: req.user._id,
                    token: crypto.randomBytes(32).toString('hex'),
                    tokenExpires: tokenExpiry,
                    ...(personalMessage ? { message: personalMessage } : {}),
                });
            }
        }

        if (emails && Array.isArray(emails)) {
            for (const email of emails) {
                if (!email || typeof email !== 'string') continue;
                const normalised = email.toLowerCase().trim();

                // Prevent duplicate email invitations
                const alreadyInvited = tender.invitations.some(
                    (inv) => inv.email && inv.email === normalised
                );
                if (alreadyInvited) continue;

                invitations.push({
                    email: normalised,
                    invitationType: 'email',
                    invitedBy: req.user._id,
                    token: crypto.randomBytes(32).toString('hex'),
                    tokenExpires: tokenExpiry,
                });
            }
        }

        if (invitations.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid invitations provided' });
        }

        await ProfessionalTender.updateOne(
            { _id: id },
            { $push: { invitations: { $each: invitations } } }
        );

        const emailPromises = invitations.map(async (invite) => {
            try {
                if (invite.invitationType === 'email' && invite.email) {
                    await emailService.sendTenderEmailInvitation(invite.email, tender, req.user, invite.token);
                } else if (invite.invitationType === 'user' && invite.invitedUser) {
                    const user = await User.findById(invite.invitedUser);
                    if (user?.email) await emailService.sendTenderInvitationEmail(user.email, user.name, tender, req.user);
                } else if (invite.invitationType === 'company' && invite.invitedCompany) {
                    const company = await Company.findById(invite.invitedCompany).populate('user');
                    if (company?.user?.email) await emailService.sendTenderInvitationEmail(company.user.email, company.name, tender, req.user);
                }
            } catch (emailError) {
                console.error('Failed to send invitation email:', emailError);
            }
        });

        Promise.allSettled(emailPromises);

        await ProfessionalTender.updateOne({ _id: id }, {
            $push: {
                auditLog: {
                    action: 'INVITE_COMPANIES',
                    performedBy: userId,
                    changes: { invitationsCount: invitations.length },
                    performedAt: new Date(),
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            }
        });

        res.status(200).json({
            success: true,
            data: { invitationsSent: invitations.length },
            message: `${invitations.length} invitation(s) sent successfully`
        });

    } catch (error) {
        console.error('Error in inviteCompanies:', error);
        res.status(500).json({ success: false, message: 'Failed to send invitations', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 12. respondToInvitation
// ─────────────────────────────────────────────────────────────────────────────
exports.respondToInvitation = async (req, res) => {
    try {
        const { id, inviteId } = req.params;
        const userId = req.user._id;
        const { response } = req.body;

        if (!response || !['accepted', 'declined'].includes(response)) {
            return res.status(400).json({ success: false, message: 'Response must be either "accepted" or "declined"' });
        }

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({ success: false, message: 'Professional tender not found' });
        }

        const invitation = tender.invitations.id(inviteId);
        if (!invitation) {
            return res.status(404).json({ success: false, message: 'Invitation not found' });
        }

        const user = await User.findById(userId);
        const userCompany = await Company.findOne({ user: userId });

        let isValidInvitee = false;
        if (invitation.invitedUser && invitation.invitedUser.toString() === userId.toString()) isValidInvitee = true;
        else if (invitation.invitedCompany && userCompany && invitation.invitedCompany.toString() === userCompany._id.toString()) isValidInvitee = true;
        else if (invitation.email && user.email === invitation.email) isValidInvitee = true;

        if (!isValidInvitee && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'You are not authorized to respond to this invitation' });
        }

        if (invitation.tokenExpires && invitation.tokenExpires < new Date()) {
            invitation.invitationStatus = 'expired';
            await tender.save();
            return res.status(400).json({ success: false, message: 'This invitation has expired' });
        }

        invitation.invitationStatus = response;
        invitation.respondedAt = new Date();
        await tender.save();

        if (response === 'accepted') {
            try {
                const owner = await User.findById(tender.owner);
                if (owner?.email) {
                    await emailService.sendInvitationAcceptedEmail(
                        owner.email, owner.name,
                        user.name || userCompany?.name || 'A company',
                        tender
                    );
                }
            } catch (emailError) {
                console.error('Failed to send acceptance notification:', emailError);
            }
        }

        await ProfessionalTender.updateOne({ _id: id }, {
            $push: {
                auditLog: {
                    action: 'RESPOND_TO_INVITATION',
                    performedBy: userId,
                    changes: { invitationId: inviteId, response },
                    performedAt: new Date(),
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            }
        });

        res.status(200).json({ success: true, data: invitation, message: `Invitation ${response} successfully` });

    } catch (error) {
        console.error('Error in respondToInvitation:', error);
        res.status(500).json({ success: false, message: 'Failed to respond to invitation', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 13. getMyInvitations
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyInvitations = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status = 'pending', page = 1, limit = 20 } = req.query;

        const userCompany = await Company.findOne({ user: userId });
        const user = await User.findById(userId);

        const orConditions = [{ 'invitations.invitedUser': userId }];
        if (userCompany) orConditions.push({ 'invitations.invitedCompany': userCompany._id });
        if (user?.email) orConditions.push({ 'invitations.email': user.email.toLowerCase() });

        const filter = { isDeleted: false, $or: orConditions };

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const skip = (pageNum - 1) * limitNum;

        const tenders = await ProfessionalTender.find(filter)
            .select('_id title referenceNumber deadline status visibilityType invitations')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('owner', 'name email');

        const tendersWithInvites = tenders.map(tender => {
            const tenderObj = tender.toObject();
            tenderObj.myInvitations = tender.invitations.filter(inv => {
                if (status && inv.invitationStatus !== status) return false;
                if (inv.invitedUser && inv.invitedUser.toString() === userId.toString()) return true;
                if (userCompany && inv.invitedCompany && inv.invitedCompany.toString() === userCompany._id.toString()) return true;
                if (user?.email && inv.email === user.email.toLowerCase()) return true;
                return false;
            });
            delete tenderObj.invitations;
            return tenderObj;
        }).filter(t => t.myInvitations.length > 0);

        const total = tendersWithInvites.length;

        res.status(200).json({
            success: true,
            data: {
                invitations: tendersWithInvites,
                pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
            }
        });

    } catch (error) {
        console.error('Error in getMyInvitations:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch invitations', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 14. submitCPO
// ─────────────────────────────────────────────────────────────────────────────
exports.submitCPO = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (req.user.role !== 'company' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only companies can submit CPO' });
        }

        const userCompany = await Company.findOne({ user: userId });
        if (!userCompany && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, message: 'No company profile found' });
        }

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) return res.status(404).json({ success: false, message: 'Professional tender not found' });
        if (!tender.cpoRequired) return res.status(400).json({ success: false, message: 'This tender does not require CPO submission' });
        if (!['published', 'locked'].includes(tender.status)) return res.status(400).json({ success: false, message: 'CPO can only be submitted for published or locked tenders' });
        if (tender.deadline <= new Date()) return res.status(400).json({ success: false, message: 'Tender deadline has passed' });

        const existingCPO = tender.cpoSubmissions.find(cpo => cpo.bidder.toString() === userId.toString());
        if (existingCPO) return res.status(400).json({ success: false, message: 'You have already submitted a CPO for this tender' });

        const { cpoNumber, amount, currency, issuingBank, issueDate, expiryDate } = req.body;

        if (!cpoNumber || !amount) {
            return res.status(400).json({ success: false, message: 'CPO number and amount are required' });
        }

        if (!req.uploadedFiles?.files?.length) {
            return res.status(400).json({ success: false, message: 'CPO document is required' });
        }

        const file = req.uploadedFiles.files[0];
        const fileHash = crypto.createHash('md5').update(file.path + Date.now()).digest('hex');

        const cpoSubmission = {
            bidder: userId,
            bidderCompany: userCompany?._id,
            cpoNumber: cpoNumber.toUpperCase().trim(),
            amount: Number(amount),
            currency: currency || 'ETB',
            issuingBank,
            issueDate: issueDate ? new Date(issueDate) : undefined,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            documentPath: file.path,
            documentUrl: file.url,
            documentHash: fileHash,
            submittedAt: new Date()
        };

        await ProfessionalTender.updateOne({ _id: id }, { $push: { cpoSubmissions: cpoSubmission } });

        await ProfessionalTender.updateOne({ _id: id }, {
            $push: {
                auditLog: {
                    action: 'SUBMIT_CPO',
                    performedBy: userId,
                    changes: { cpoNumber },
                    performedAt: new Date(),
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            }
        });

        res.status(201).json({ success: true, data: cpoSubmission, message: 'CPO submitted successfully' });

    } catch (error) {
        console.error('Error in submitCPO:', error);
        res.status(500).json({ success: false, message: 'Failed to submit CPO', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 15. getCPOSubmissions
// ─────────────────────────────────────────────────────────────────────────────
exports.getCPOSubmissions = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) return res.status(404).json({ success: false, message: 'Professional tender not found' });

        const isOwner = tender.owner.toString() === userId.toString();

        if (isOwner || req.user.role === 'admin') {
            await tender.populate([
                { path: 'cpoSubmissions.bidder', select: '_id name email' },
                { path: 'cpoSubmissions.bidderCompany', select: 'name logo tin' },
                { path: 'cpoSubmissions.verifiedBy', select: '_id name email' }
            ]);
            return res.status(200).json({ success: true, data: tender.cpoSubmissions || [] });
        }

        const userCompany = await Company.findOne({ user: userId });
        const myCPOs = tender.cpoSubmissions.filter(cpo =>
            cpo.bidder.toString() === userId.toString() ||
            (userCompany && cpo.bidderCompany && cpo.bidderCompany.toString() === userCompany._id.toString())
        );

        const sanitizedCPOs = myCPOs.map(cpo => {
            const cpoObj = cpo.toObject();
            delete cpoObj.verificationNotes;
            return cpoObj;
        });

        res.status(200).json({ success: true, data: sanitizedCPOs });

    } catch (error) {
        console.error('Error in getCPOSubmissions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch CPO submissions', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 16. verifyCPO
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyCPO = async (req, res) => {
    try {
        const { id, cpoId } = req.params;
        const userId = req.user._id;
        const { status, verificationNotes } = req.body;

        if (!status || !['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be either "verified" or "rejected"' });
        }

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) return res.status(404).json({ success: false, message: 'Professional tender not found' });

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'You do not have permission to verify CPO' });
        }

        const cpo = tender.cpoSubmissions.id(cpoId);
        if (!cpo) return res.status(404).json({ success: false, message: 'CPO submission not found' });

        cpo.status = status;
        cpo.verifiedBy = userId;
        cpo.verifiedAt = new Date();
        if (verificationNotes) cpo.verificationNotes = verificationNotes;

        await tender.save();
        await tender.addAuditLog('VERIFY_CPO', userId, { cpoId, status, bidderId: cpo.bidder }, req.ip, req.get('User-Agent'));

        res.status(200).json({ success: true, data: cpo, message: `CPO ${status} successfully` });

    } catch (error) {
        console.error('Error in verifyCPO:', error);
        res.status(500).json({ success: false, message: 'Failed to verify CPO', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 17. getMyPostedTenders
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyPostedTenders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, page = 1, limit = 15, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        const filter = { owner: userId, isDeleted: false };
        if (status) filter.status = status;

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const skip = (pageNum - 1) * limitNum;

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const tenders = await ProfessionalTender.find(filter)
            .select('-bids.technicalProposal -bids.financialProposal -bids.documents -addenda')
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate('owner', 'name email');

        const tendersWithCounts = tenders.map(tender => {
            const tenderObj = tender.toObject();
            tenderObj.bidCount = tender.bids?.length || 0;
            tenderObj.cpoCount = tender.cpoSubmissions?.length || 0;
            tenderObj.savedCount = tender.metadata?.savedBy?.length || 0;
            return tenderObj;
        });

        const total = await ProfessionalTender.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                tenders: tendersWithCounts,
                pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
            }
        });

    } catch (error) {
        console.error('Error in getMyPostedTenders:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch your posted tenders', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 18. toggleSaveProfessionalTender
// ─────────────────────────────────────────────────────────────────────────────
exports.toggleSaveProfessionalTender = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (req.user.role !== 'company' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only companies can save professional tenders' });
        }

        const tender = await ProfessionalTender.findOne({
            _id: id,
            isDeleted: false,
            status: { $in: ['published', 'locked'] },
            deadline: { $gt: new Date() }
        });

        if (!tender) {
            return res.status(404).json({ success: false, message: 'Tender not found or not available for saving' });
        }

        const isSaved = tender.metadata.savedBy.some(sid => sid.toString() === userId.toString());

        if (isSaved) {
            await ProfessionalTender.updateOne({ _id: id }, { $pull: { 'metadata.savedBy': userId } });
        } else {
            await ProfessionalTender.updateOne({ _id: id }, { $addToSet: { 'metadata.savedBy': userId } });
        }

        const updatedTender = await ProfessionalTender.findById(id).select('metadata.savedBy');

        res.status(200).json({
            success: true,
            data: {
                saved: !isSaved,
                totalSaves: updatedTender.metadata.savedBy.length,
                operation: isSaved ? 'unsaved' : 'saved'
            },
            message: `Tender ${isSaved ? 'unsaved' : 'saved'} successfully`
        });

    } catch (error) {
        console.error('Error in toggleSaveProfessionalTender:', error);
        res.status(500).json({ success: false, message: 'Failed to save/unsave tender', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 19. getSavedProfessionalTenders
// ─────────────────────────────────────────────────────────────────────────────
exports.getSavedProfessionalTenders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 15 } = req.query;

        const filter = {
            'metadata.savedBy': userId,
            status: { $in: ['published', 'locked'] },
            isDeleted: false
        };

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const skip = (pageNum - 1) * limitNum;

        const tenders = await ProfessionalTender.find(filter)
            .select('-bids -cpoSubmissions -addenda')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('owner', 'name email')
            .populate('ownerEntity', 'name logo headline');

        const total = await ProfessionalTender.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                tenders,
                pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
            }
        });

    } catch (error) {
        console.error('Error in getSavedProfessionalTenders:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch saved tenders', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 20. getProfessionalTenderStats
// ─────────────────────────────────────────────────────────────────────────────
exports.getProfessionalTenderStats = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) return res.status(404).json({ success: false, message: 'Professional tender not found' });

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'You do not have permission to view stats' });
        }

        const stats = {
            totalBids: tender.bids.length,
            bidsByStatus: {
                submitted: tender.bids.filter(b => b.status === 'submitted').length,
                under_review: tender.bids.filter(b => b.status === 'under_review').length,
                shortlisted: tender.bids.filter(b => b.status === 'shortlisted').length,
                awarded: tender.bids.filter(b => b.status === 'awarded').length,
                rejected: tender.bids.filter(b => b.status === 'rejected').length
            },
            sealedBids: tender.bids.filter(b => b.sealed).length,
            visibleBids: tender.bids.filter(b => !b.sealed).length,
            cpoSubmissions: {
                total: tender.cpoSubmissions.length,
                verified: tender.cpoSubmissions.filter(c => c.status === 'verified').length,
                rejected: tender.cpoSubmissions.filter(c => c.status === 'rejected').length,
                pending: tender.cpoSubmissions.filter(c => c.status === 'submitted').length,
                expired: tender.cpoSubmissions.filter(c => c.status === 'expired').length
            },
            views: tender.metadata.views || 0,
            savedCount: tender.metadata.savedBy.length,
            invitations: {
                total: tender.invitations.length,
                pending: tender.invitations.filter(i => i.invitationStatus === 'pending').length,
                accepted: tender.invitations.filter(i => i.invitationStatus === 'accepted').length,
                declined: tender.invitations.filter(i => i.invitationStatus === 'declined').length,
                expired: tender.invitations.filter(i => i.invitationStatus === 'expired').length
            },
            addendaCount: tender.addenda.length,
            status: tender.status,
            workflowType: tender.workflowType,
            deadline: tender.deadline,
            daysRemaining: tender.metadata.daysRemaining,
            publishedAt: tender.publishedAt,
            createdAt: tender.createdAt
        };

        if (tender.bids.length > 0 && (tender.workflowType === 'open' || ['revealed', 'closed'].includes(tender.status))) {
            const amounts = tender.bids.map(b => b.bidAmount).filter(a => a);
            if (amounts.length > 0) {
                stats.bidAmounts = {
                    min: Math.min(...amounts),
                    max: Math.max(...amounts),
                    average: amounts.reduce((a, b) => a + b, 0) / amounts.length
                };
            }
        }

        res.status(200).json({ success: true, data: stats });

    } catch (error) {
        console.error('Error in getProfessionalTenderStats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tender stats', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 21. uploadAdditionalAttachments
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadAdditionalAttachments = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!req.uploadedFiles?.files?.length) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) return res.status(404).json({ success: false, message: 'Professional tender not found' });

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'You do not have permission to upload attachments' });
        }

        const newAttachments = buildAttachments(
            req.uploadedFiles.files,
            id,
            req.body.documentType,
            userId
        );

        // Override description if provided
        if (req.body.description) {
            newAttachments.forEach(a => { a.description = req.body.description; });
        }

        tender.attachments.push(...newAttachments);
        await tender.save();

        await tender.addAuditLog('UPLOAD_ATTACHMENTS', userId, { count: newAttachments.length }, req.ip, req.get('User-Agent'));

        res.status(200).json({
            success: true,
            data: newAttachments,
            message: `${newAttachments.length} attachment(s) uploaded successfully`
        });

    } catch (error) {
        console.error('Error in uploadAdditionalAttachments:', error);
        res.status(500).json({ success: false, message: 'Failed to upload attachments', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 22. downloadAttachment
// FIX P-09: Uses attachment.path (filesystem path) via res.download() — CORRECT.
// The frontend must call this endpoint via the API hook; never use attachment.url directly.
// ─────────────────────────────────────────────────────────────────────────────
exports.downloadAttachment = async (req, res) => {
    try {
        const { id, attachmentId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) return res.status(404).json({ success: false, message: 'Professional tender not found' });

        const canView = await tender.canUserView(userId, userRole);

        if (!canView && userRole !== 'admin') {
            const hasInvitation = await tender.checkInvitationStatus(userId, userRole);
            if (!hasInvitation) {
                return res.status(403).json({ success: false, message: 'You do not have permission to access this tender' });
            }
        }

        const attachment = tender.attachments.id(attachmentId);
        if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });

        if (!fs.existsSync(attachment.path)) {
            return res.status(404).json({ success: false, message: 'File not found on disk' });
        }

        res.download(attachment.path, attachment.originalName, (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Failed to download file' });
                }
            }
        });

    } catch (error) {
        console.error('Error in downloadAttachment:', error);
        res.status(500).json({ success: false, message: 'Failed to download attachment', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 23. previewAttachment
// ─────────────────────────────────────────────────────────────────────────────
exports.previewAttachment = async (req, res) => {
    try {
        const { id, attachmentId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) return res.status(404).json({ success: false, message: 'Professional tender not found' });

        const canView = await tender.canUserView(userId, userRole);

        if (!canView && userRole !== 'admin') {
            const hasInvitation = await tender.checkInvitationStatus(userId, userRole);
            if (!hasInvitation) {
                return res.status(403).json({ success: false, message: 'You do not have permission to access this tender' });
            }
        }

        const attachment = tender.attachments.id(attachmentId);
        if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });

        if (!fs.existsSync(attachment.path)) {
            return res.status(404).json({ success: false, message: 'File not found on disk' });
        }

        const isPreviewable = attachment.mimetype.startsWith('image/') || attachment.mimetype === 'application/pdf';

        if (!isPreviewable) {
            return res.status(400).json({
                success: false,
                message: 'This file type cannot be previewed. Please download it instead.'
            });
        }

        if (attachment.mimetype === 'application/pdf') {
            res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
        }

        const fileStream = fs.createReadStream(attachment.path);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Error reading file' });
            }
        });

    } catch (error) {
        console.error('Error in previewAttachment:', error);
        res.status(500).json({ success: false, message: 'Failed to preview attachment', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 24. deleteAttachment
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteAttachment = async (req, res) => {
    try {
        const { id, attachmentId } = req.params;
        const userId = req.user._id;

        const tender = await ProfessionalTender.findOne({ _id: id, isDeleted: false });

        if (!tender) return res.status(404).json({ success: false, message: 'Professional tender not found' });

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'You do not have permission to delete attachments' });
        }

        if (tender.status !== 'draft') {
            return res.status(400).json({ success: false, message: 'Attachments can only be deleted from draft tenders' });
        }

        const attachment = tender.attachments.id(attachmentId);
        if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });

        try {
            if (fs.existsSync(attachment.path)) fs.unlinkSync(attachment.path);
        } catch (fileError) {
            console.error('Error deleting file from disk:', fileError);
        }

        tender.attachments.pull(attachmentId);
        await tender.save();

        await tender.addAuditLog('DELETE_ATTACHMENT', userId, {
            attachmentId,
            fileName: attachment.originalName
        }, req.ip, req.get('User-Agent'));

        res.status(200).json({ success: true, message: 'Attachment deleted successfully' });

    } catch (error) {
        console.error('Error in deleteAttachment:', error);
        res.status(500).json({ success: false, message: 'Failed to delete attachment', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 25. getCompaniesForInvitation
// ─────────────────────────────────────────────────────────────────────────────
exports.getCompaniesForInvitation = async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'contactInfo.email': { $regex: search, $options: 'i' } }
            ];
        }

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const skip = (pageNum - 1) * limitNum;

        const companies = await Company.find(filter)
            .select('_id name logo headline industry')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Company.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                companies,
                pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
            }
        });

    } catch (error) {
        console.error('Error in getCompaniesForInvitation:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch companies', error: error.message });
    }
};