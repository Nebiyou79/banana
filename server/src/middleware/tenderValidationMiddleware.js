// server/src/middleware/tenderValidationMiddleware.js
const Tender = require('../models/Tender');

/**
 * Middleware to validate if closed tender can be edited
 */
const validateClosedTenderEdit = async (req, res, next) => {
  try {
    if (req.method === 'GET') {
      return next();
    }

    const tenderId = req.params.id || req.body.id;
    
    if (!tenderId) {
      return next();
    }

    const tender = await Tender.findById(tenderId);
    
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if it's a closed tender that's locked
    if (tender.workflowType === 'closed' && tender.status === 'locked') {
      return res.status(403).json({
        success: false,
        message: 'Closed tender cannot be edited after publishing. This is a sealed bid tender.',
        code: 'CLOSED_TENDER_LOCKED'
      });
    }

    // Check if it's a closed tender that's published but not yet locked
    if (tender.workflowType === 'closed' && tender.status === 'published') {
      return res.status(403).json({
        success: false,
        message: 'Closed tender is in published state and cannot be edited. It will be locked soon.',
        code: 'CLOSED_TENDER_PUBLISHED'
      });
    }

    next();
  } catch (error) {
    console.error('Error in validateClosedTenderEdit:', error);
    next(error);
  }
};

/**
 * Middleware to validate tender visibility for current user
 */
const validateTenderVisibility = async (req, res, next) => {
  try {
    const tenderId = req.params.id;
    
    if (!tenderId) {
      return next();
    }

    const tender = await Tender.findById(tenderId);
    
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    
    const canView = await tender.canUserView(userId, userRole);

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this tender',
        code: 'TENDER_ACCESS_DENIED'
      });
    }

    next();
  } catch (error) {
    console.error('Error in validateTenderVisibility:', error);
    next(error);
  }
};

/**
 * Middleware to validate if user can apply to tender
 */
const validateCanApplyToTender = async (req, res, next) => {
  try {
    const tenderId = req.params.id || req.body.tenderId;
    
    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: 'Tender ID is required'
      });
    }

    const tender = await Tender.findById(tenderId);
    
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    const userId = req.user._id;
    const userRole = req.user.role;
    
    const canApply = await tender.canUserApply(userId, userRole);

    if (!canApply) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to apply to this tender',
        code: 'TENDER_APPLY_DENIED',
        reason: getApplyDeniedReason(tender, userRole)
      });
    }

    next();
  } catch (error) {
    console.error('Error in validateCanApplyToTender:', error);
    next(error);
  }
};

/**
 * Helper function to get reason for apply denial
 */
const getApplyDeniedReason = (tender, userRole) => {
  if (tender.status !== 'published') {
    return 'Tender is not published';
  }
  
  if (tender.deadline <= new Date()) {
    return 'Tender deadline has passed';
  }
  
  if (tender.tenderCategory === 'freelance' && userRole !== 'freelancer') {
    return 'Only freelancers can apply to freelance tenders';
  }
  
  if (tender.tenderCategory === 'professional' && userRole !== 'company') {
    return 'Only companies can apply to professional tenders';
  }
  
  if (tender.visibility.visibilityType === 'invite_only') {
    return 'This is an invite-only tender';
  }
  
  return 'Unknown reason';
};

/**
 * Middleware to validate tender creation permissions
 */
const validateTenderCreation = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const tenderCategory = req.parsedBody?.tenderCategory || req.body.tenderCategory;
    
    // Freelancers cannot create tenders
    if (userRole === 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Freelancers cannot create tenders',
        code: 'ROLE_NO_CREATE_PERMISSION'
      });
    }
    
    // Validate tender category based on role
    if (tenderCategory === 'freelance') {
      // Both companies and organizations can create freelance tenders
      if (userRole !== 'company' && userRole !== 'organization' && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only companies and organizations can create freelance tenders',
          code: 'INVALID_ROLE_FOR_FREELANCE'
        });
      }
    } else if (tenderCategory === 'professional') {
      // Both companies and organizations can create professional tenders
      if (userRole !== 'company' && userRole !== 'organization' && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only companies and organizations can create professional tenders',
          code: 'INVALID_ROLE_FOR_PROFESSIONAL'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in validateTenderCreation:', error);
    next(error);
  }
};

module.exports = {
  validateClosedTenderEdit,
  validateTenderVisibility,
  validateCanApplyToTender,
  validateTenderCreation
};