// server/src/controllers/proposalController.js
const Proposal = require('../models/Proposal');
const Tender = require('../models/Tender');

/**
 * POST /api/v1/proposals
 * Create a new proposal
 */
exports.createProposal = async (req, res) => {
  try {
    console.log('➡️ Create proposal request:', { body: req.body, user: req.user });

    const freelancerId = req.user._id;
    const { tenderId, bidAmount, proposalText, estimatedTimeline, attachments } = req.body;

    // Validation
    if (!tenderId || bidAmount === undefined || !proposalText || !estimatedTimeline) {
      return res.status(400).json({
        success: false,
        message: 'tenderId, bidAmount, proposalText, and estimatedTimeline are required'
      });
    }

    const tender = await Tender.findById(tenderId);
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });
    if (tender.status !== 'open') return res.status(400).json({ success: false, message: 'Tender is not open' });
    if (new Date(tender.deadline) < new Date()) return res.status(400).json({ success: false, message: 'Tender has expired' });
    if (bidAmount > tender.budget * 2) return res.status(400).json({ success: false, message: 'Bid exceeds allowed budget' });

    const existingProposal = await Proposal.findOne({ tenderId, freelancerId });
    if (existingProposal) {
      return res.status(409).json({ success: false, message: 'You already submitted a proposal' });
    }

    const proposal = await Proposal.create({
      tenderId,
      freelancerId,
      bidAmount,
      proposalText,
      estimatedTimeline,
      attachments: attachments || []
    });

    await proposal.populate([
      { path: 'tenderId', select: 'title budget deadline' },
      { path: 'freelancerId', select: 'name email avatar' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully',
      data: proposal
    });
  } catch (error) {
    console.error('❌ Create proposal error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create proposal' });
  }
};

/**
 * GET /api/v1/proposals/me
 * Get current freelancer’s proposals
 */
exports.getUserProposals = async (req, res) => {
  try {
    console.log(`➡️ Get proposals for user: ${req.user._id}`);

    const proposals = await Proposal.find({ freelancerId: req.user._id })
      .populate({
        path: 'tenderId',
        select: 'title description budget deadline status company',
        populate: { path: 'company', select: 'name logo' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: proposals });
  } catch (error) {
    console.error('❌ Get user proposals error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch proposals' });
  }
};

/**
 * GET /api/v1/proposals/tender/:tenderId
 * Get all proposals for a tender (company/admin only)
 */
exports.getTenderProposals = async (req, res) => {
  try {
    const { tenderId } = req.params;
    console.log('➡️ Get tender proposals for:', tenderId);

    const tender = await Tender.findById(tenderId);
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });

    const userCompanyId = req.user.company?._id?.toString() || req.user.company?.toString();
    if (userCompanyId !== tender.company.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const proposals = await Proposal.find({ tenderId })
      .populate({ path: 'freelancerId', select: 'name email avatar rating portfolio experience' })
      .sort({ bidAmount: 1, createdAt: 1 });

    res.json({ success: true, data: proposals });
  } catch (error) {
    console.error('❌ Get tender proposals error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch proposals' });
  }
};

/**
 * PUT /api/v1/proposals/:id
 * Update a proposal (freelancers only)
 */
exports.updateProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const freelancerId = req.user._id;

    console.log(`➡️ Update proposal ${id} by user ${freelancerId}`);

    const proposal = await Proposal.findById(id).populate('tenderId');
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    // Only the freelancer who created it can update
    if (proposal.freelancerId.toString() !== freelancerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this proposal' });
    }

    const tender = proposal.tenderId;
    if (tender.status !== 'open') return res.status(400).json({ success: false, message: 'Tender is closed' });
    if (new Date(tender.deadline) < new Date()) return res.status(400).json({ success: false, message: 'Tender deadline passed' });

    const { bidAmount, proposalText, estimatedTimeline, attachments } = req.body;

    if (bidAmount !== undefined) proposal.bidAmount = bidAmount;
    if (proposalText) proposal.proposalText = proposalText;
    if (estimatedTimeline) proposal.estimatedTimeline = estimatedTimeline;
    if (attachments) proposal.attachments = attachments;

    await proposal.save();

    await proposal.populate([
      { path: 'tenderId', select: 'title budget deadline' },
      { path: 'freelancerId', select: 'name email avatar' }
    ]);

    res.json({ success: true, message: 'Proposal updated successfully', data: proposal });
  } catch (error) {
    console.error('❌ Update proposal error:', error);
    res.status(500).json({ success: false, message: 'Failed to update proposal' });
  }
};

/**
 * PUT /api/v1/proposals/:id/status
 * Update proposal status (company/admin only)
 */
exports.updateProposalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, companyNotes } = req.body;

    console.log(`➡️ Update proposal status for ${id}`);

    const proposal = await Proposal.findById(id).populate('tenderId');
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    const userCompanyId = req.user.company?._id?.toString() || req.user.company?.toString();
    if (userCompanyId !== proposal.tenderId.company.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    proposal.status = status;
    if (companyNotes) proposal.companyNotes = companyNotes;

    await proposal.save();

    await proposal.populate([
      { path: 'freelancerId', select: 'name email' },
      { path: 'tenderId', select: 'title' }
    ]);

    res.json({ success: true, message: 'Proposal status updated successfully', data: proposal });
  } catch (error) {
    console.error('❌ Update proposal status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update proposal status' });
  }
};

/**
 * DELETE /api/v1/proposals/:id
 * Delete a proposal (freelancer or admin)
 */
exports.deleteProposal = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`➡️ Delete proposal ${id}`);

    const proposal = await Proposal.findById(id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    if (proposal.freelancerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this proposal' });
    }

    await proposal.deleteOne();

    res.json({ success: true, message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('❌ Delete proposal error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete proposal' });
  }
};
