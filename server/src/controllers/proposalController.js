// backend/controllers/proposalController.js
const Proposal = require('../models/Proposal');
const Tender = require('../models/Tender');
// const Notification = require('../models/Notification'); // If you have notifications

/**
 * POST /api/v1/proposals
 * Create a new proposal
 */
exports.createProposal = async (req, res) => {
  try {
    const freelancerId = req.user._id;
    const { tenderId, bidAmount, proposalText, estimatedTimeline, attachments } = req.body;

    // Validation
    if (!tenderId || bidAmount === undefined || !proposalText || !estimatedTimeline) {
      return res.status(400).json({
        success: false,
        message: 'tenderId, bidAmount, proposalText, and estimatedTimeline are required'
      });
    }

    // Check if tender exists and is open
    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    if (tender.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Cannot submit proposal to a closed tender'
      });
    }

    if (bidAmount > tender.budget * 2) {
      return res.status(400).json({
        success: false,
        message: 'Bid amount cannot exceed twice the tender budget'
      });
    }

    // Check for existing proposal
    const existingProposal = await Proposal.findOne({ tenderId, freelancerId });
    if (existingProposal) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a proposal for this tender'
      });
    }

    // Create proposal
    const proposal = new Proposal({
      tenderId,
      freelancerId,
      bidAmount,
      proposalText,
      estimatedTimeline,
      attachments: attachments || []
    });

    await proposal.save();
    
    // Populate for response
    await proposal.populate([
      { path: 'tenderId', select: 'title budget deadline' },
      { path: 'freelancerId', select: 'name email avatar' }
    ]);

    // Create notification for company (optional)
    // await Notification.create({
    //   userId: tender.createdBy,
    //   type: 'new_proposal',
    //   message: `New proposal received for ${tender.title}`,
    //   relatedId: proposal._id
    // });

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully',
      data: proposal
    });

  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create proposal'
    });
  }
};

/**
 * GET /api/v1/proposals/me
 * Get current user's proposals
 */
exports.getUserProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancerId: req.user._id })
      .populate({
        path: 'tenderId',
        select: 'title description budget deadline status company',
        populate: {
          path: 'company',
          select: 'name logo'
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: proposals
    });

  } catch (error) {
    console.error('Get user proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proposals'
    });
  }
};

/**
 * GET /api/v1/proposals/tender/:tenderId
 * Get all proposals for a specific tender (company owners only)
 */
exports.getTenderProposals = async (req, res) => {
  try {
    const { tenderId } = req.params;

    // Verify tender exists and user owns it
    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    if (tender.company.toString() !== req.user.company.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these proposals'
      });
    }

    const proposals = await Proposal.find({ tenderId })
      .populate({
        path: 'freelancerId',
        select: 'name email avatar rating portfolio experience'
      })
      .sort({ bidAmount: 1, createdAt: 1 });

    res.json({
      success: true,
      data: proposals
    });

  } catch (error) {
    console.error('Get tender proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proposals'
    });
  }
};

/**
 * PUT /api/v1/proposals/:id/status
 * Update proposal status (company owners only)
 */
exports.updateProposalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, companyNotes } = req.body;

    const proposal = await Proposal.findById(id).populate('tenderId');
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Verify user owns the tender
    if (proposal.tenderId.company.toString() !== req.user.company.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this proposal'
      });
    }

    // Update status and notes
    proposal.status = status;
    if (companyNotes) proposal.companyNotes = companyNotes;
    
    await proposal.save();

    // Populate for response
    await proposal.populate([
      { path: 'freelancerId', select: 'name email' },
      { path: 'tenderId', select: 'title' }
    ]);

    // Create notification for freelancer (optional)
    // if (status === 'accepted') {
    //   await Notification.create({
    //     userId: proposal.freelancerId,
    //     type: 'proposal_accepted',
    //     message: `Your proposal for ${proposal.tenderId.title} has been accepted!`,
    //     relatedId: proposal._id
    //   });
    // }

    res.json({
      success: true,
      message: 'Proposal status updated successfully',
      data: proposal
    });

  } catch (error) {
    console.error('Update proposal status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update proposal status'
    });
  }
};

/**
 * PUT /api/v1/proposals/:id
 * Update proposal (freelancer only)
 */
exports.updateProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { bidAmount, proposalText, estimatedTimeline, attachments } = req.body;

    const proposal = await Proposal.findById(id).populate('tenderId');
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Verify user owns the proposal
    if (proposal.freelancerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this proposal'
      });
    }

    // Check if tender is still open
    if (proposal.tenderId.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update proposal for a closed tender'
      });
    }

    // Update allowed fields
    if (bidAmount !== undefined) proposal.bidAmount = bidAmount;
    if (proposalText !== undefined) proposal.proposalText = proposalText;
    if (estimatedTimeline !== undefined) proposal.estimatedTimeline = estimatedTimeline;
    if (attachments !== undefined) proposal.attachments = attachments;

    await proposal.save();

    res.json({
      success: true,
      message: 'Proposal updated successfully',
      data: proposal
    });

  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update proposal'
    });
  }
};

/**
 * DELETE /api/v1/proposals/:id
 * Delete proposal
 */
exports.deleteProposal = async (req, res) => {
  try {
    const { id } = req.params;

    const proposal = await Proposal.findById(id).populate('tenderId');
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Verify user owns the proposal or is admin
    if (proposal.freelancerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this proposal'
      });
    }

    await Proposal.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Proposal deleted successfully'
    });

  } catch (error) {
    console.error('Delete proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete proposal'
    });
  }
};