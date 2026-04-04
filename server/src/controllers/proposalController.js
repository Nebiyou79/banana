// controllers/proposalController.js
// All 14 controller functions for the Proposal microservice.
// Groups: A (Freelancer), B (Owner), C (Attachments)
//
// req.user shape varies by JWT middleware version.
// ALWAYS extract via: const userId = getUid(req);
// which handles both req.user.userId and req.user._id.
//
const path = require('path');
const fs = require('fs');
const Proposal = require('../models/Proposal');
const FreelanceTender = require('../models/FreelanceTender');
const FreelancerProfile = require('../models/Freelancer');
const User = require('../models/User');
const proposalEmailService = require('../services/proposalEmailService');

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Always resolves the caller's userId regardless of JWT middleware version */
const getUid = (req) => (req.user.userId || req.user._id || '').toString();

const handleError = (res, error, context = 'proposalController') => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(error.errors).map(e => e.message).join(', '),
      code: 'VALIDATION_ERROR'
    });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      code: 'INVALID_ID'
    });
  }
  console.error(`[${context}]`, error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'SERVER_ERROR'
  });
};

const ALLOWED_STATUS_TRANSITIONS = {
  submitted: ['under_review', 'rejected'],
  under_review: ['shortlisted', 'rejected'],
  shortlisted: ['interview_scheduled', 'rejected', 'awarded'],
  interview_scheduled: ['awarded', 'rejected']
};

const isValidTransition = (from, to) => {
  const allowed = ALLOWED_STATUS_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
};

const buildPagination = (total, page, limit) => ({
  total,
  page: parseInt(page),
  limit: parseInt(limit),
  totalPages: Math.ceil(total / limit)
});

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP A — FREELANCER ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A1. createDraft
 * POST /api/v1/proposals/create
 * Auth: freelancer
 */
const createDraft = async (req, res) => {
  try {
    const userId = getUid(req);
    const { tenderId, ...fields } = req.body;

    const tender = await FreelanceTender.findById(tenderId)
      .select('status deadline owner title isDeleted');

    if (!tender || tender.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found',
        code: 'TENDER_NOT_FOUND'
      });
    }
    if (tender.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'This tender is not accepting proposals',
        code: 'TENDER_NOT_ACCEPTING'
      });
    }
    if (tender.deadline <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This tender has expired',
        code: 'TENDER_EXPIRED'
      });
    }

    // Only block if a final (non-draft) submission already exists
    const existing = await Proposal.findOne({
      tender: tenderId,
      freelancer: userId,
      isDraft: false
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a proposal for this tender',
        code: 'ALREADY_SUBMITTED',
        data: { proposalId: existing._id }
      });
    }

    const freelancerProfile = await FreelancerProfile
      .findOne({ user: userId })
      .select('_id');

    const proposal = await Proposal.create({
      tender: tenderId,
      freelancer: userId,
      freelancerProfile: freelancerProfile?._id,
      isDraft: true,
      status: 'draft',
      ...fields
    });

    return res.status(201).json({
      success: true,
      data: proposal,
      code: 'DRAFT_CREATED'
    });

  } catch (error) {
    return handleError(res, error, 'createDraft');
  }
};

/**
 * A2. updateDraft
 * PUT /api/v1/proposals/:proposalId
 * Auth: freelancer — requireProposalOwner sets req.proposal
 */
const updateDraft = async (req, res) => {
  try {
    const proposal = req.proposal;

    if (!proposal.isDraft || proposal.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft proposals can be updated this way',
        code: 'NOT_A_DRAFT'
      });
    }

    const UPDATABLE_FIELDS = [
      'coverLetter', 'coverLetterHtml', 'proposalPlan',
      'bidType', 'proposedAmount', 'currency',
      'hourlyRate', 'estimatedWeeklyHours',
      'deliveryTime', 'availability', 'proposedStartDate',
      'milestones', 'screeningAnswers', 'portfolioLinks'
    ];

    UPDATABLE_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) {
        proposal[field] = req.body[field];
      }
    });

    await proposal.save();

    return res.status(200).json({
      success: true,
      data: proposal,
      code: 'DRAFT_UPDATED'
    });

  } catch (error) {
    return handleError(res, error, 'updateDraft');
  }
};

/**
 * A3. submitProposal
 * POST /api/v1/proposals/:proposalId/submit
 * Auth: freelancer — requireProposalOwner sets req.proposal
 */
const submitProposal = async (req, res) => {
  try {
    const userId = getUid(req);
    const proposal = req.proposal;

    if (!proposal.isDraft) {
      return res.status(400).json({
        success: false,
        message: 'This proposal has already been submitted',
        code: 'ALREADY_SUBMITTED'
      });
    }

    const errors = [];
    if (!proposal.coverLetter || proposal.coverLetter.length < 50)
      errors.push('Cover letter must be at least 50 characters');
    if (!proposal.proposedAmount || proposal.proposedAmount <= 0)
      errors.push('Proposed amount must be greater than 0');
    if (!proposal.deliveryTime?.value || !proposal.deliveryTime?.unit)
      errors.push('Delivery time is required');
    if (!proposal.availability)
      errors.push('Availability is required');

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join('. '),
        code: 'VALIDATION_ERROR'
      });
    }

    // Cross-check required screening questions
    const tender = await FreelanceTender.findById(proposal.tender)
      .select('details.screeningQuestions owner title')
      .populate('owner', 'name email');

    if (tender?.details?.screeningQuestions?.length > 0) {
      const requiredQs = tender.details.screeningQuestions
        .map((q, idx) => ({ ...q.toObject(), idx }))
        .filter(q => q.required);

      for (const q of requiredQs) {
        const answered = proposal.screeningAnswers?.find(
          a => a.questionIndex === q.idx && a.answer?.trim().length > 0
        );
        if (!answered) {
          return res.status(400).json({
            success: false,
            message: `Required screening question "${q.question}" must be answered`,
            code: 'SCREENING_INCOMPLETE'
          });
        }
      }
    }

    await proposal.submitProposal(); // sets isDraft=false, status=submitted, submittedAt=now

    await FreelanceTender.findByIdAndUpdate(
      proposal.tender,
      { $inc: { 'metadata.totalApplications': 1 } }
    );

    await proposal.addAuditEntry('submitted', userId, {}, 'Proposal submitted by freelancer');

    const freelancer = await User.findById(userId).select('name email');

    if (tender?.owner) {
      proposalEmailService.notifyOwnerNewProposal({
        ownerEmail: tender.owner.email,
        ownerName: tender.owner.name,
        freelancerName: freelancer?.name || 'A freelancer',
        tenderTitle: tender.title,
        proposalId: proposal._id.toString()
      });
    }
    if (freelancer) {
      proposalEmailService.notifyFreelancerSubmitted({
        freelancerEmail: freelancer.email,
        freelancerName: freelancer.name,
        tenderTitle: tender?.title || 'the tender',
        proposalId: proposal._id.toString()
      });
    }

    const fresh = await Proposal.findById(proposal._id);
    return res.status(200).json({
      success: true,
      data: fresh,
      code: 'PROPOSAL_SUBMITTED'
    });

  } catch (error) {
    return handleError(res, error, 'submitProposal');
  }
};

/**
 * A4. withdrawProposal
 * POST /api/v1/proposals/:proposalId/withdraw
 * Auth: freelancer — requireProposalOwner sets req.proposal
 */
const withdrawProposal = async (req, res) => {
  try {
    const userId = getUid(req);
    const proposal = req.proposal;

    if (!proposal.canBeWithdrawn) {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw a proposal with status "${proposal.status}"`,
        code: 'CANNOT_WITHDRAW'
      });
    }

    await proposal.withdraw();

    await FreelanceTender.findByIdAndUpdate(
      proposal.tender,
      { $inc: { 'metadata.totalApplications': -1 } }
    );

    await proposal.addAuditEntry('withdrawn', userId, {}, 'Proposal withdrawn by freelancer');

    return res.status(200).json({
      success: true,
      data: proposal,
      code: 'PROPOSAL_WITHDRAWN'
    });

  } catch (error) {
    return handleError(res, error, 'withdrawProposal');
  }
};

/**
 * A5. getMyProposals
 * GET /api/v1/proposals/my-proposals
 * Auth: freelancer
 */
const getMyProposals = async (req, res) => {
  try {
    const userId = getUid(req);
    const { status, page = 1, limit = 10, sortBy = 'submittedAt:-1' } = req.query;

    const [sortField, sortOrder] = sortBy.split(':');
    const sort = { [sortField]: parseInt(sortOrder) || -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { freelancer: userId };
    if (status) query.status = status;

    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate({ path: 'tender', select: 'title deadline status details.budget ownerEntity ownerEntityModel' })
        .populate('freelancerProfile', 'headline')
        .select('-auditLog -ownerNotes -coverLetterHtml -attachments'),
      Proposal.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: { proposals, pagination: buildPagination(total, page, limit) }
    });

  } catch (error) {
    return handleError(res, error, 'getMyProposals');
  }
};

/**
 * A6. getMyProposalForTender
 * GET /api/v1/proposals/tenders/:tenderId/my-proposal
 * Auth: freelancer — returns null (not 404) when no proposal exists
 */
const getMyProposalForTender = async (req, res) => {
  try {
    const userId = getUid(req);
    const { tenderId } = req.params;

    const proposal = await Proposal.findOne({
      tender: tenderId,
      freelancer: userId
    });

    return res.status(200).json({
      success: true,
      data: proposal || null
    });

  } catch (error) {
    return handleError(res, error, 'getMyProposalForTender');
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP B — OWNER ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * B1. getTenderProposals
 * GET /api/v1/proposals/tenders/:tenderId/proposals
 * Auth: company/organization
 */
const getTenderProposals = async (req, res) => {
  try {
    const userId = getUid(req);
    const { tenderId } = req.params;
    const { status, sortBy = 'newest', page = 1, limit = 10, isShortlisted } = req.query;

    const tender = await FreelanceTender.findById(tenderId).select('owner');
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found', code: 'TENDER_NOT_FOUND' });
    }
    if (tender.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied', code: 'FORBIDDEN' });
    }

    const query = { tender: tenderId, isDraft: false };
    if (status) query.status = status;
    if (isShortlisted !== undefined) query.isShortlisted = (isShortlisted === 'true');

    let sort = {};
    switch (sortBy) {
      case 'highest_bid': sort = { proposedAmount: -1 }; break;
      case 'lowest_bid': sort = { proposedAmount: 1 }; break;
      case 'best_rating': sort = { 'freelancerProfile.ratings.average': -1 }; break;
      default: sort = { submittedAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('freelancer', 'name avatar location')
        .populate('freelancerProfile', 'headline hourlyRate ratings.average successRate specialization')
        .select('-auditLog -coverLetterHtml'),
      Proposal.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: { proposals, pagination: buildPagination(total, page, limit) }
    });

  } catch (error) {
    return handleError(res, error, 'getTenderProposals');
  }
};

/**
 * B2. getProposalDetail
 * GET /api/v1/proposals/:proposalId
 * Auth: tender owner OR the freelancer who submitted
 */
const getProposalDetail = async (req, res) => {
  try {
    const userId = getUid(req);
    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId)
      .populate('freelancer', 'name email avatar location phone skills education experience portfolio')
      .populate('freelancerProfile')
      .populate({
        path: 'tender',
        select: 'title description skillsRequired status deadline owner ownerEntity ownerEntityModel details'
      });

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found', code: 'PROPOSAL_NOT_FOUND' });
    }

    // Safe extraction — freelancer and tender.owner may be populated objects or raw ObjectIds
    const freelancerId = (proposal.freelancer?._id || proposal.freelancer || '').toString();
    const tenderOwnerId = (proposal.tender?.owner?._id || proposal.tender?.owner || '').toString();

    const isFreelancerOwner = freelancerId === userId;
    const isTenderOwner = tenderOwnerId === userId;

    if (!isFreelancerOwner && !isTenderOwner) {
      return res.status(403).json({ success: false, message: 'Access denied', code: 'FORBIDDEN' });
    }

    if (isTenderOwner) {
      await Proposal.findByIdAndUpdate(proposalId, { $inc: { ownerViewCount: 1 } });
    }

    const data = proposal.toJSON();
    if (isFreelancerOwner && !isTenderOwner) {
      delete data.ownerNotes;
      delete data.ownerRating;
      delete data.interviewNotes;
      delete data.auditLog;
    }

    return res.status(200).json({ success: true, data });

  } catch (error) {
    return handleError(res, error, 'getProposalDetail');
  }
};

/**
 * B3. updateProposalStatus
 * PATCH /api/v1/proposals/:proposalId/status
 * Auth: tender owner — requireTenderOwner sets req.proposal + req.tender
 */
const updateProposalStatus = async (req, res) => {
  try {
    const userId = getUid(req);
    const proposal = req.proposal;
    const { status, ownerNotes, interviewDate, interviewNotes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required', code: 'MISSING_STATUS' });
    }

    if (!isValidTransition(proposal.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from "${proposal.status}" to "${status}"`,
        code: 'INVALID_TRANSITION'
      });
    }

    const prevStatus = proposal.status;
    proposal.status = status;

    const now = new Date();
    if (status === 'under_review') proposal.reviewedAt = now;
    if (status === 'shortlisted') { proposal.shortlistedAt = now; proposal.isShortlisted = true; }
    if (status === 'awarded') proposal.awardedAt = now;
    if (status === 'rejected') proposal.rejectedAt = now;
    if (status === 'interview_scheduled') {
      if (interviewDate) proposal.interviewDate = new Date(interviewDate);
      if (interviewNotes) proposal.interviewNotes = interviewNotes;
    }
    if (ownerNotes !== undefined) proposal.ownerNotes = ownerNotes;

    await proposal.save();
    await proposal.addAuditEntry(
      `status_changed_to_${status}`,
      userId,
      { from: prevStatus, to: status },
      ownerNotes || ''
    );

    const freelancer = await User.findById(proposal.freelancer).select('name email');
    const tenderTitle = req.tender?.title || 'the tender';

    if (freelancer) {
      const emailPayload = {
        freelancerEmail: freelancer.email,
        freelancerName: freelancer.name,
        tenderTitle,
        proposalId: proposal._id.toString(),
        ownerNotes: ownerNotes || null
      };

      switch (status) {
        case 'under_review':
          proposalEmailService.notifyFreelancerUnderReview(emailPayload);
          break;
        case 'shortlisted':
          proposalEmailService.notifyFreelancerShortlisted(emailPayload);
          break;
        case 'rejected':
          proposalEmailService.notifyFreelancerRejected(emailPayload);
          break;
        case 'awarded': {
          const owner = await User.findById(userId).select('name');
          proposalEmailService.notifyFreelancerAwarded({
            ...emailPayload,
            ownerName: owner?.name || 'the client'
          });
          break;
        }
        default: break;
      }
    }

    return res.status(200).json({ success: true, data: proposal, code: 'STATUS_UPDATED' });

  } catch (error) {
    return handleError(res, error, 'updateProposalStatus');
  }
};

/**
 * B4. toggleShortlist
 * POST /api/v1/proposals/:proposalId/shortlist
 * Auth: tender owner — requireTenderOwner sets req.proposal
 */
const toggleShortlist = async (req, res) => {
  try {
    const proposal = req.proposal;
    const newShortlistState = !proposal.isShortlisted;

    proposal.isShortlisted = newShortlistState;

    if (newShortlistState && proposal.status === 'under_review') {
      proposal.status = 'shortlisted';
      proposal.shortlistedAt = new Date();
    }

    await proposal.save();

    return res.status(200).json({
      success: true,
      data: { isShortlisted: proposal.isShortlisted },
      code: 'SHORTLIST_TOGGLED'
    });

  } catch (error) {
    return handleError(res, error, 'toggleShortlist');
  }
};

/**
 * B5. getProposalStats
 * GET /api/v1/proposals/tenders/:tenderId/proposals/stats
 * Auth: tender owner
 */
const getProposalStats = async (req, res) => {
  try {
    const userId = getUid(req);
    const { tenderId } = req.params;

    const tender = await FreelanceTender.findById(tenderId).select('owner');
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found', code: 'TENDER_NOT_FOUND' });
    }
    if (tender.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied', code: 'FORBIDDEN' });
    }

    const [stats] = await Proposal.aggregate([
      { $match: { tender: tender._id, isDraft: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgBid: { $avg: '$proposedAmount' },
          minBid: { $min: '$proposedAmount' },
          maxBid: { $max: '$proposedAmount' },
          shortlistedCount: { $sum: { $cond: ['$isShortlisted', 1, 0] } },
          viewedByOwner: { $sum: { $cond: [{ $gt: ['$ownerViewCount', 0] }, 1, 0] } },
          byStatus_submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          byStatus_under_review: { $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] } },
          byStatus_shortlisted: { $sum: { $cond: [{ $eq: ['$status', 'shortlisted'] }, 1, 0] } },
          byStatus_interview_scheduled: { $sum: { $cond: [{ $eq: ['$status', 'interview_scheduled'] }, 1, 0] } },
          byStatus_awarded: { $sum: { $cond: [{ $eq: ['$status', 'awarded'] }, 1, 0] } },
          byStatus_rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0, total: 1,
          avgBid: { $round: ['$avgBid', 2] },
          minBid: 1, maxBid: 1,
          shortlistedCount: 1, viewedByOwner: 1,
          byStatus: {
            submitted: '$byStatus_submitted',
            under_review: '$byStatus_under_review',
            shortlisted: '$byStatus_shortlisted',
            interview_scheduled: '$byStatus_interview_scheduled',
            awarded: '$byStatus_awarded',
            rejected: '$byStatus_rejected'
          }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: stats || {
        total: 0, avgBid: 0, minBid: 0, maxBid: 0,
        shortlistedCount: 0, viewedByOwner: 0, byStatus: {}
      }
    });

  } catch (error) {
    return handleError(res, error, 'getProposalStats');
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP C — ATTACHMENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * C1. uploadAttachments
 * POST /api/v1/proposals/:proposalId/attachments
 * Auth: proposal owner — requireProposalOwner sets req.proposal
 * Middleware: localFileUpload.multiple('attachments', 5, 'proposals')
 */
const uploadAttachments = async (req, res) => {
  try {
    const proposal = req.proposal;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded', code: 'NO_FILES' });
    }

    const MAX_TOTAL = 10;
    const remaining = MAX_TOTAL - (proposal.attachments?.length || 0);

    if (remaining <= 0) {
      return res.status(400).json({
        success: false,
        message: `Attachment limit reached (max ${MAX_TOTAL})`,
        code: 'ATTACHMENT_LIMIT_REACHED'
      });
    }

    const filesToAdd = req.files.slice(0, remaining);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const { attachmentType = 'other' } = req.body;

    const newAttachments = filesToAdd.map(file => ({
      originalName: file.originalname,
      fileName: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
      url: `${baseUrl}/uploads/proposals/${file.filename}`,
      downloadUrl: `${baseUrl}/api/v1/proposals/${proposal._id}/attachments/PLACEHOLDER/download`,
      fileHash: require('crypto').createHash('md5').update(file.originalname + file.size).digest('hex'),
      attachmentType,
      uploadedAt: new Date()
    }));

    proposal.attachments.push(...newAttachments);
    await proposal.save();

    // Patch downloadUrl now that _id values are assigned
    for (const att of proposal.attachments) {
      if (att.downloadUrl.includes('PLACEHOLDER')) {
        att.downloadUrl = `${baseUrl}/api/v1/proposals/${proposal._id}/attachments/${att._id}/download`;
      }
    }
    await proposal.save();

    return res.status(201).json({
      success: true,
      data: { attachments: proposal.attachments },
      code: 'ATTACHMENTS_UPLOADED'
    });

  } catch (error) {
    return handleError(res, error, 'uploadAttachments');
  }
};

/**
 * C2. deleteAttachment
 * DELETE /api/v1/proposals/:proposalId/attachments/:attachmentId
 * Auth: proposal owner — requireProposalOwner sets req.proposal
 */
const deleteAttachment = async (req, res) => {
  try {
    const proposal = req.proposal;
    const { attachmentId } = req.params;

    const attachment = proposal.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found', code: 'ATTACHMENT_NOT_FOUND' });
    }

    if (attachment.path && fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }

    attachment.deleteOne();
    await proposal.save();

    return res.status(200).json({ success: true, message: 'Attachment deleted', code: 'ATTACHMENT_DELETED' });

  } catch (error) {
    return handleError(res, error, 'deleteAttachment');
  }
};

/**
 * C3. downloadAttachment
 * GET /api/v1/proposals/:proposalId/attachments/:attachmentId/download
 * Auth: proposal owner OR tender owner
 */
const downloadAttachment = async (req, res) => {
  try {
    const userId = getUid(req);
    const { proposalId, attachmentId } = req.params;

    const proposal = await Proposal.findById(proposalId)
      .populate({ path: 'tender', select: 'owner' });

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found', code: 'PROPOSAL_NOT_FOUND' });
    }

    const freelancerId = (proposal.freelancer?._id || proposal.freelancer || '').toString();
    const tenderOwnerId = (proposal.tender?.owner?._id || proposal.tender?.owner || '').toString();

    if (freelancerId !== userId && tenderOwnerId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied', code: 'FORBIDDEN' });
    }

    const attachment = proposal.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found', code: 'ATTACHMENT_NOT_FOUND' });
    }
    if (!attachment.path || !fs.existsSync(attachment.path)) {
      return res.status(404).json({ success: false, message: 'File no longer exists on disk', code: 'FILE_NOT_FOUND' });
    }

    return res.download(attachment.path, attachment.originalName);

  } catch (error) {
    return handleError(res, error, 'downloadAttachment');
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  createDraft,
  updateDraft,
  submitProposal,
  withdrawProposal,
  getMyProposals,
  getMyProposalForTender,
  getTenderProposals,
  getProposalDetail,
  updateProposalStatus,
  toggleShortlist,
  getProposalStats,
  uploadAttachments,
  deleteAttachment,
  downloadAttachment
};