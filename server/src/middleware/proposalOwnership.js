// middleware/proposalOwnership.js
// Reusable ownership-guard middleware for proposal routes.
// Must be called AFTER verifyToken (req.user must be populated).
const Proposal = require('../models/Proposal');

/**
 * requireProposalOwner
 * Ensures the authenticated freelancer is the author of the proposal.
 * Attaches req.proposal on success.
 */
const requireProposalOwner = async (req, res, next) => {
    try {
        const { proposalId } = req.params;

        const proposal = await Proposal.findById(proposalId);

        if (!proposal) {
            return res.status(404).json({
                success: false,
                message: 'Proposal not found',
                code: 'PROPOSAL_NOT_FOUND'
            });
        }

        const userId = (req.user.userId || req.user._id || '').toString();

        if (proposal.freelancer.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this proposal',
                code: 'FORBIDDEN'
            });
        }

        req.proposal = proposal;
        next();

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid proposal ID format',
                code: 'INVALID_ID'
            });
        }
        console.error('[proposalOwnership.requireProposalOwner]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
};

/**
 * requireTenderOwner
 * Ensures the authenticated company/organization user owns the tender
 * linked to the proposal.
 * Attaches req.proposal and req.tender on success.
 */
const requireTenderOwner = async (req, res, next) => {
    try {
        const { proposalId } = req.params;

        const proposal = await Proposal.findById(proposalId)
            .populate({
                path: 'tender',
                select: 'owner ownerEntityModel ownerEntity title status deadline'
            });

        if (!proposal) {
            return res.status(404).json({
                success: false,
                message: 'Proposal not found',
                code: 'PROPOSAL_NOT_FOUND'
            });
        }

        if (!proposal.tender) {
            return res.status(404).json({
                success: false,
                message: 'Associated tender not found',
                code: 'TENDER_NOT_FOUND'
            });
        }

        const userId = (req.user.userId || req.user._id || '').toString();

        if (proposal.tender.owner.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this proposal',
                code: 'FORBIDDEN'
            });
        }

        req.proposal = proposal;
        req.tender = proposal.tender;
        next();

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid proposal ID format',
                code: 'INVALID_ID'
            });
        }
        console.error('[proposalOwnership.requireTenderOwner]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
};

module.exports = { requireProposalOwner, requireTenderOwner };