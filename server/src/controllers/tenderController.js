const Tender = require('../models/Tender');
const Company = require('../models/Company');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const emailService = require('../services/emailService');
const { safeParseJSON, calculateFileHash } = require('../middleware/tenderUploadMiddleware');

// Helper to detect Windows absolute paths
const isWindowsPath = (p) => Boolean(p && typeof p === 'string' && /^[A-Za-z]:\\/.test(p));

// ============ ROLE VALIDATION HELPERS ============

const validateTenderCreationRole = (userRole, tenderCategory) => {
  // Organizations can only create tenders (both types)
  if (userRole === 'organization') return true;

  // Companies can create both types
  if (userRole === 'company') return true;

  // Freelancers cannot create any tenders
  if (userRole === 'freelancer') return false;

  // Admin can create any type
  if (userRole === 'admin') return true;

  return false;
};

const validateTenderApplicationRole = (userRole, tenderCategory) => {
  // Freelancers can only apply to freelance tenders
  if (userRole === 'freelancer') return tenderCategory === 'freelance';

  // Companies can only apply to professional tenders
  if (userRole === 'company') return tenderCategory === 'professional';

  // Organizations cannot apply to any tenders
  if (userRole === 'organization') return false;

  // Admin can apply to any tender (for testing)
  if (userRole === 'admin') return true;

  return false;
};

// ============ CATEGORY MANAGEMENT ============

// @desc    Get categories by tender type
// @route   GET /api/v1/tender/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const { type, format = 'grouped' } = req.query;

    // Get categories from model
    const freelanceCategories = Tender.getFreelanceCategories();
    const professionalCategories = Tender.getProfessionalCategories();

    // Prepare response based on requested type
    let responseData = {};

    if (type === 'freelance') {
      if (format === 'flat') {
        // Return flat list for dropdowns
        const flatCategories = [];
        Object.values(freelanceCategories).forEach(group => {
          group.subcategories.forEach(subcategory => {
            flatCategories.push({
              id: subcategory.id,
              name: subcategory.name,
              group: group.name
            });
          });
        });

        responseData = {
          categories: flatCategories,
          stats: {
            totalCategories: flatCategories.length,
            groups: Object.keys(freelanceCategories).length
          }
        };
      } else {
        // Return grouped structure
        responseData = {
          groups: freelanceCategories,
          allCategories: Tender.getAllFreelanceCategories(),
          stats: {
            totalCategories: Tender.getAllFreelanceCategories().length,
            groups: Object.keys(freelanceCategories).length
          }
        };
      }
    } else if (type === 'professional') {
      if (format === 'flat') {
        // Return flat list for dropdowns
        const flatCategories = [];
        Object.values(professionalCategories).forEach(group => {
          group.subcategories.forEach(subcategory => {
            flatCategories.push({
              id: subcategory.id,
              name: subcategory.name,
              group: group.name
            });
          });
        });

        responseData = {
          categories: flatCategories,
          stats: {
            totalCategories: flatCategories.length,
            groups: Object.keys(professionalCategories).length
          }
        };
      } else {
        // Return grouped structure
        responseData = {
          groups: professionalCategories,
          allCategories: Tender.getAllProfessionalCategories(),
          stats: {
            totalCategories: Tender.getAllProfessionalCategories().length,
            groups: Object.keys(professionalCategories).length
          }
        };
      }
    } else {
      // Return both
      responseData = {
        freelance: freelanceCategories,
        professional: professionalCategories,
        stats: {
          freelance: {
            totalCategories: Tender.getAllFreelanceCategories().length,
            groups: Object.keys(freelanceCategories).length
          },
          professional: {
            totalCategories: Tender.getAllProfessionalCategories().length,
            groups: Object.keys(professionalCategories).length
          }
        }
      };
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
};

// @desc    Get category label
// @route   GET /api/v1/tender/categories/label/:categoryId
// @access  Public
const getCategoryLabel = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { type = 'freelance' } = req.query;

    const label = Tender.getCategoryLabel(categoryId, type);
    const group = Tender.getCategoryGroup(categoryId, type);

    if (!label) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: categoryId,
        name: label,
        group: group,
        type: type
      }
    });
  } catch (error) {
    console.error('Error fetching category label:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category label'
    });
  }
};

// ============ CREATE FREELANCE TENDER - FULLY FIXED WITH PROPER DOCUMENT TYPE HANDLING ============
const createFreelanceTender = async (req, res) => {
  try {
    // Check user role
    if (!validateTenderCreationRole(req.user.role, 'freelance')) {
      return res.status(403).json({
        success: false,
        message: 'Your role is not allowed to create freelance tenders'
      });
    }

    const tenderData = req.body || {};

    // Force freelance category
    tenderData.tenderCategory = 'freelance';

    // Validate required fields
    const requiredFields = ['title', 'description', 'procurementCategory', 'deadline'];
    const missingFields = requiredFields.filter(field => !tenderData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields
      });
    }

    // Parse freelanceSpecific from form data - THIS IS THE SOURCE OF TRUTH
    let freelanceSpecific = {};
    if (tenderData.freelanceSpecific) {
      if (typeof tenderData.freelanceSpecific === 'string') {
        freelanceSpecific = safeParseJSON(tenderData.freelanceSpecific, {});
      } else {
        freelanceSpecific = tenderData.freelanceSpecific;
      }
    }

    // Get engagement type from freelanceSpecific ONLY (NEVER from top level)
    const engagementType = freelanceSpecific.engagementType;
    if (!engagementType) {
      return res.status(400).json({
        success: false,
        message: 'Engagement type is required (fixed_price or hourly)'
      });
    }

    // Validate deadline
    const deadlineDate = new Date(tenderData.deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be in the future'
      });
    }

    // Check if user has a company or organization
    const company = await Company.findOne({ user: req.user._id });
    const organization = await Organization.findOne({ user: req.user._id });

    if (!company && !organization) {
      return res.status(400).json({
        success: false,
        message: 'You need to create a company or organization profile first'
      });
    }

    const entity = company || organization;
    const entityId = entity._id;
    const ownerRole = company ? 'company' : 'organization';
    const entityModel = company ? 'Company' : 'Organization';

    // ============ LOCAL FILE UPLOAD HANDLING - FIXED VERSION ============
    const attachments = [];

    // Handle localFileUpload.multiple('documents') format
    if (req.uploadedFiles && req.uploadedFiles.success && req.uploadedFiles.files) {
      console.log(`📎 Processing ${req.uploadedFiles.files.length} local files for freelance tender`);

      // Debug: Log the raw tenderData.fileTypes to see what's coming from frontend
      console.log('📋 Raw fileTypes from request:', tenderData.fileTypes);
      console.log('📋 Raw fileDescriptions from request:', tenderData.fileDescriptions);

      // Valid document types enum from Tender model
      const validDocumentTypes = [
        'terms_of_reference',
        'technical_specifications',
        'statement_of_work',
        'drawings',
        'bill_of_quantities',
        'compliance_template',
        'reference_designs',
        'nda',
        'design_references',
        'sample_data',
        'brand_guidelines',
        'wireframes',
        'other'
      ];

      req.uploadedFiles.files.forEach((file, index) => {
        // Get description - try multiple possible formats
        let description = '';
        if (tenderData.fileDescriptions) {
          if (Array.isArray(tenderData.fileDescriptions)) {
            description = tenderData.fileDescriptions[index] || '';
          } else if (typeof tenderData.fileDescriptions === 'object') {
            // Handle indexed format like fileDescriptions[0]
            description = tenderData.fileDescriptions[index] ||
              tenderData.fileDescriptions[`fileDescriptions[${index}]`] ||
              tenderData.fileDescriptions[`fileDescriptions.${index}`] || '';
          }
        }

        // ============ CRITICAL FIX: Get document type properly ============
        let documentType = 'other'; // Default

        if (tenderData.fileTypes) {
          if (Array.isArray(tenderData.fileTypes)) {
            documentType = tenderData.fileTypes[index] || 'other';
          } else if (typeof tenderData.fileTypes === 'object') {
            // Handle indexed format like fileTypes[0]
            documentType = tenderData.fileTypes[index] ||
              tenderData.fileTypes[`fileTypes[${index}]`] ||
              tenderData.fileTypes[`fileTypes.${index}`] || 'other';
          } else if (typeof tenderData.fileTypes === 'string') {
            // If it's a single string, use it as is (for single file uploads)
            documentType = tenderData.fileTypes;
          }
        }

        // Ensure documentType is a string and not empty
        documentType = String(documentType || 'other').trim();

        // If documentType is just a single character, it's probably wrong - default to 'other'
        if (documentType.length === 1 && documentType !== 'o') {
          console.warn(`⚠️ Suspicious documentType "${documentType}" for file ${file.originalName}, defaulting to "other"`);
          documentType = 'other';
        }

        // Validate against allowed enum values
        if (!validDocumentTypes.includes(documentType)) {
          console.warn(`⚠️ Invalid documentType "${documentType}" for file ${file.originalName}, defaulting to "other"`);
          documentType = 'other';
        }

        // Generate unique file hash
        const fileHash = crypto
          .createHash('md5')
          .update(file.path + Date.now() + index)
          .digest('hex');

        console.log(`📄 File ${index}: ${file.originalName} -> documentType: "${documentType}" (length: ${documentType.length})`);

        attachments.push({
          originalName: file.originalName,
          fileName: file.fileName,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path,
          url: `/uploads/tenders/${file.fileName}`,
          downloadUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/download/tenders/${file.fileName}`,
          description: description,
          uploadedBy: req.user._id,
          uploadedAt: new Date(),
          documentType: documentType, // Now using the properly validated value
          version: 1,
          fileHash: fileHash
        });
      });
    }
    // Handle single file upload (fallback)
    else if (req.uploadedFile && req.uploadedFile.success && req.uploadedFile.file) {
      const file = req.uploadedFile.file;

      // Valid document types enum from Tender model
      const validDocumentTypes = [
        'terms_of_reference',
        'technical_specifications',
        'statement_of_work',
        'drawings',
        'bill_of_quantities',
        'compliance_template',
        'reference_designs',
        'nda',
        'design_references',
        'sample_data',
        'brand_guidelines',
        'wireframes',
        'other'
      ];

      // Get document type for single file
      let documentType = 'other';
      if (tenderData.fileTypes) {
        if (Array.isArray(tenderData.fileTypes)) {
          documentType = tenderData.fileTypes[0] || 'other';
        } else if (typeof tenderData.fileTypes === 'object') {
          documentType = tenderData.fileTypes[0] ||
            tenderData.fileTypes['fileTypes[0]'] ||
            tenderData.fileTypes['fileTypes.0'] || 'other';
        } else if (typeof tenderData.fileTypes === 'string') {
          documentType = tenderData.fileTypes;
        }
      }

      // Validate documentType
      documentType = String(documentType || 'other').trim();

      if (!validDocumentTypes.includes(documentType)) {
        console.warn(`⚠️ Invalid documentType "${documentType}" for file ${file.originalName}, defaulting to "other"`);
        documentType = 'other';
      }

      const fileHash = crypto
        .createHash('md5')
        .update(file.path + Date.now())
        .digest('hex');

      attachments.push({
        originalName: file.originalName,
        fileName: file.fileName,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
        url: `/uploads/tenders/${file.fileName}`,
        downloadUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/download/tenders/${file.fileName}`,
        description: Array.isArray(tenderData.fileDescriptions) ? tenderData.fileDescriptions[0] || '' : '',
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
        documentType: documentType,
        version: 1,
        fileHash: fileHash
      });
    }

    console.log(`✅ Created ${attachments.length} attachments for freelance tender`);

    // Validate engagement specific fields (from freelanceSpecific only)
    if (engagementType === 'hourly') {
      const weeklyHours = freelanceSpecific.weeklyHours;
      if (!weeklyHours || weeklyHours <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Weekly hours is required for hourly engagement'
        });
      }
    }

    if (engagementType === 'fixed_price') {
      const budget = freelanceSpecific.budget;
      if (!budget || typeof budget !== 'object' || !budget.min || !budget.max) {
        return res.status(400).json({
          success: false,
          message: 'Budget range (min and max) is required for fixed price engagement'
        });
      }

      // Ensure budget has proper structure
      if (!budget.currency) {
        budget.currency = 'USD';
      }
    }

    // Handle skills - parse if needed
    let skillsRequired = [];
    if (tenderData.skillsRequired) {
      if (typeof tenderData.skillsRequired === 'string') {
        try {
          skillsRequired = JSON.parse(tenderData.skillsRequired);
        } catch (e) {
          skillsRequired = tenderData.skillsRequired.split(',').map(s => s.trim());
        }
      } else if (Array.isArray(tenderData.skillsRequired)) {
        skillsRequired = tenderData.skillsRequired;
      }
    }

    // Handle screening questions from freelanceSpecific
    let screeningQuestions = freelanceSpecific.screeningQuestions || [];

    // Set default workflowType
    const workflowType = tenderData.workflowType || 'open';

    // Set visibility - MUST match model exactly
    const visibility = {
      visibilityType: 'freelancers_only'  // This is the ONLY valid type for freelance tenders
    };

    // Build freelanceSpecific object - EXACT model contract
    const finalFreelanceSpecific = {
      // Required
      engagementType: engagementType,

      // Conditional based on engagement type
      ...(engagementType === 'fixed_price' && freelanceSpecific.budget ? {
        budget: {
          min: freelanceSpecific.budget.min,
          max: freelanceSpecific.budget.max,
          currency: freelanceSpecific.budget.currency || 'USD'
        }
      } : {}),

      ...(engagementType === 'hourly' && freelanceSpecific.weeklyHours ? {
        weeklyHours: freelanceSpecific.weeklyHours
      } : {}),

      // Optional with defaults
      projectType: freelanceSpecific.projectType || 'one_time',

      estimatedDuration: freelanceSpecific.estimatedDuration || {
        value: 30,
        unit: 'days'
      },

      experienceLevel: freelanceSpecific.experienceLevel || 'intermediate',

      portfolioRequired: freelanceSpecific.portfolioRequired !== undefined
        ? freelanceSpecific.portfolioRequired
        : false,

      ndaRequired: freelanceSpecific.ndaRequired !== undefined
        ? freelanceSpecific.ndaRequired
        : false,

      urgency: freelanceSpecific.urgency || 'normal',

      // Optional fields - only include if they exist and are truthy
      ...(freelanceSpecific.languagePreference ? {
        languagePreference: freelanceSpecific.languagePreference
      } : {}),

      ...(freelanceSpecific.timezonePreference ? {
        timezonePreference: freelanceSpecific.timezonePreference
      } : {}),

      ...(freelanceSpecific.industry ? {
        industry: freelanceSpecific.industry
      } : {}),

      ...(screeningQuestions && screeningQuestions.length > 0 ? {
        screeningQuestions: screeningQuestions
      } : {})
    };

    // Create tender data - EXACT model structure
    const finalTenderData = {
      title: tenderData.title,
      description: tenderData.description,
      procurementCategory: tenderData.procurementCategory,
      tenderCategory: 'freelance',
      workflowType: workflowType,
      status: tenderData.status || 'draft',
      deadline: deadlineDate,
      owner: req.user._id,
      ownerRole: ownerRole,
      ownerEntity: entityId,
      ownerEntityModel: entityModel,
      skillsRequired: skillsRequired,
      attachments: attachments,
      maxFileSize: tenderData.maxFileSize || 50 * 1024 * 1024,
      maxFileCount: tenderData.maxFileCount || 10,
      visibility: visibility,
      freelanceSpecific: finalFreelanceSpecific,
      metadata: {
        views: 0,
        savedBy: [],
        totalApplications: 0,
        visibleApplications: 0,
        updateCount: 0,
        isUpdated: false,
        daysRemaining: Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24))
      }
    };

    // For closed workflow, validate sealed bid confirmation
    if (workflowType === 'closed') {
      const sealedBidConfirmation = tenderData.sealedBidConfirmation === 'true' ||
        tenderData.sealedBidConfirmation === true;

      if (!sealedBidConfirmation) {
        return res.status(400).json({
          success: false,
          message: 'Sealed bid confirmation is required for closed workflow tenders'
        });
      }

      // Add to metadata or appropriate field if needed
      finalTenderData.sealedBidConfirmation = true;
    }

    // Create and save tender
    const tender = new Tender(finalTenderData);

    // Validate against model
    const validationError = tender.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(validationError.errors).map(err => err.message),
        details: validationError.errors
      });
    }

    // For closed tenders, lock immediately if published
    if (workflowType === 'closed' && tenderData.status === 'published') {
      await tender.lockClosedTender(req.user._id);
    } else {
      await tender.save();
    }

    // Add audit log
    await tender.addAuditLog('CREATE_FREELANCE_TENDER', req.user._id, {
      action: 'Freelance tender created',
      data: {
        title: tender.title,
        category: tender.procurementCategory,
        workflowType: tender.workflowType,
        engagementType: tender.freelanceSpecific.engagementType,
        attachmentsCount: attachments.length
      }
    }, req.ip, req.headers['user-agent']);

    // Populate for response
    const populatedTender = await Tender.findById(tender._id)
      .populate('owner', 'name email profilePhoto')
      .populate('ownerEntity', 'name logo industry verified description');

    res.status(201).json({
      success: true,
      message: 'Freelance tender created successfully',
      data: {
        tender: populatedTender,
        attachmentsCount: attachments.length
      }
    });

  } catch (error) {
    console.error('❌ Error creating freelance tender:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Tender with similar details already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating freelance tender',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ============ CREATE PROFESSIONAL TENDER - FIXED WITH PROPER DOCUMENT TYPE HANDLING ============
const createProfessionalTender = async (req, res) => {
  try {
    // Check user role
    if (!validateTenderCreationRole(req.user.role, 'professional')) {
      return res.status(403).json({
        success: false,
        message: 'Your role is not allowed to create professional tenders'
      });
    }

    const tenderData = req.body || {};

    // Force professional category
    tenderData.tenderCategory = 'professional';

    // Validate required fields
    const requiredFields = [
      'title',
      'description',
      'procurementCategory',
      'deadline'
    ];

    const missingFields = requiredFields.filter(field => !tenderData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields
      });
    }

    // Parse professionalSpecific
    let professionalSpecific = {};
    if (tenderData.professionalSpecific) {
      if (typeof tenderData.professionalSpecific === 'string') {
        professionalSpecific = safeParseJSON(tenderData.professionalSpecific, {});
      } else {
        professionalSpecific = tenderData.professionalSpecific;
      }
    }

    // Extract referenceNumber and procuringEntity
    const referenceNumber = tenderData.referenceNumber || professionalSpecific.referenceNumber;
    const procuringEntity = tenderData.procuringEntity || professionalSpecific.procuringEntity;

    // Validate professional-specific required fields
    if (!referenceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Reference number is required for professional tenders'
      });
    }

    if (!procuringEntity) {
      return res.status(400).json({
        success: false,
        message: 'Procuring entity is required for professional tenders'
      });
    }

    // Validate deadline
    const deadlineDate = new Date(tenderData.deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be in the future'
      });
    }

    // Check if user has a company or organization
    const company = await Company.findOne({ user: req.user._id });
    const organization = await Organization.findOne({ user: req.user._id });

    if (!company && !organization) {
      return res.status(400).json({
        success: false,
        message: 'You need to create a company or organization profile first'
      });
    }

    const entity = company || organization;
    const entityId = entity._id;
    const ownerRole = company ? 'company' : 'organization';
    const entityModel = company ? 'Company' : 'Organization';

    // ============ LOCAL FILE UPLOAD HANDLING - FIXED VERSION ============
    const attachments = [];

    // Handle localFileUpload.multiple('documents') format
    if (req.uploadedFiles && req.uploadedFiles.success && req.uploadedFiles.files) {
      console.log(`📎 Processing ${req.uploadedFiles.files.length} local files for professional tender`);

      // Debug: Log the raw tenderData.fileTypes to see what's coming from frontend
      console.log('📋 Raw fileTypes from request:', tenderData.fileTypes);
      console.log('📋 Raw fileDescriptions from request:', tenderData.fileDescriptions);

      // Valid document types enum from Tender model
      const validDocumentTypes = [
        'terms_of_reference',
        'technical_specifications',
        'statement_of_work',
        'drawings',
        'bill_of_quantities',
        'compliance_template',
        'reference_designs',
        'nda',
        'design_references',
        'sample_data',
        'brand_guidelines',
        'wireframes',
        'other'
      ];

      req.uploadedFiles.files.forEach((file, index) => {
        // Get description - try multiple possible formats
        let description = '';
        if (tenderData.fileDescriptions) {
          if (Array.isArray(tenderData.fileDescriptions)) {
            description = tenderData.fileDescriptions[index] || '';
          } else if (typeof tenderData.fileDescriptions === 'object') {
            // Handle indexed format like fileDescriptions[0]
            description = tenderData.fileDescriptions[index] ||
              tenderData.fileDescriptions[`fileDescriptions[${index}]`] ||
              tenderData.fileDescriptions[`fileDescriptions.${index}`] || '';
          }
        }

        // ============ CRITICAL FIX: Get document type properly ============
        let documentType = 'other'; // Default

        if (tenderData.fileTypes) {
          if (Array.isArray(tenderData.fileTypes)) {
            documentType = tenderData.fileTypes[index] || 'other';
          } else if (typeof tenderData.fileTypes === 'object') {
            // Handle indexed format like fileTypes[0]
            documentType = tenderData.fileTypes[index] ||
              tenderData.fileTypes[`fileTypes[${index}]`] ||
              tenderData.fileTypes[`fileTypes.${index}`] || 'other';
          } else if (typeof tenderData.fileTypes === 'string') {
            // If it's a single string, use it as is (for single file uploads)
            documentType = tenderData.fileTypes;
          }
        }

        // Ensure documentType is a string and not empty
        documentType = String(documentType || 'other').trim();

        // If documentType is just a single character, it's probably wrong - default to 'other'
        if (documentType.length === 1 && documentType !== 'o') {
          console.warn(`⚠️ Suspicious documentType "${documentType}" for file ${file.originalName}, defaulting to "other"`);
          documentType = 'other';
        }

        // Validate against allowed enum values
        if (!validDocumentTypes.includes(documentType)) {
          console.warn(`⚠️ Invalid documentType "${documentType}" for file ${file.originalName}, defaulting to "other"`);
          documentType = 'other';
        }

        // Generate unique file hash
        const fileHash = crypto
          .createHash('md5')
          .update(file.path + Date.now() + index)
          .digest('hex');

        console.log(`📄 File ${index}: ${file.originalName} -> documentType: "${documentType}" (length: ${documentType.length})`);

        attachments.push({
          originalName: file.originalName,
          fileName: file.fileName,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path,
          url: `/uploads/tenders/${file.fileName}`,
          downloadUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/download/tenders/${file.fileName}`,
          description: description,
          uploadedBy: req.user._id,
          uploadedAt: new Date(),
          documentType: documentType, // Now using the properly validated value
          version: 1,
          fileHash: fileHash
        });
      });
    }
    // Handle single file upload (fallback)
    else if (req.uploadedFile && req.uploadedFile.success && req.uploadedFile.file) {
      const file = req.uploadedFile.file;

      // Valid document types enum from Tender model
      const validDocumentTypes = [
        'terms_of_reference',
        'technical_specifications',
        'statement_of_work',
        'drawings',
        'bill_of_quantities',
        'compliance_template',
        'reference_designs',
        'nda',
        'design_references',
        'sample_data',
        'brand_guidelines',
        'wireframes',
        'other'
      ];

      // Get document type for single file
      let documentType = 'other';
      if (tenderData.fileTypes) {
        if (Array.isArray(tenderData.fileTypes)) {
          documentType = tenderData.fileTypes[0] || 'other';
        } else if (typeof tenderData.fileTypes === 'object') {
          documentType = tenderData.fileTypes[0] ||
            tenderData.fileTypes['fileTypes[0]'] ||
            tenderData.fileTypes['fileTypes.0'] || 'other';
        } else if (typeof tenderData.fileTypes === 'string') {
          documentType = tenderData.fileTypes;
        }
      }

      // Validate documentType
      documentType = String(documentType || 'other').trim();

      if (!validDocumentTypes.includes(documentType)) {
        console.warn(`⚠️ Invalid documentType "${documentType}" for file ${file.originalName}, defaulting to "other"`);
        documentType = 'other';
      }

      const fileHash = crypto
        .createHash('md5')
        .update(file.path + Date.now())
        .digest('hex');

      attachments.push({
        originalName: file.originalName,
        fileName: file.fileName,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
        url: `/uploads/tenders/${file.fileName}`,
        downloadUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/download/tenders/${file.fileName}`,
        description: Array.isArray(tenderData.fileDescriptions) ? tenderData.fileDescriptions[0] || '' : '',
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
        documentType: documentType,
        version: 1,
        fileHash: fileHash
      });
    }

    console.log(`✅ Created ${attachments.length} attachments for professional tender`);

    // Handle skills - parse if needed
    let skillsRequired = [];
    if (tenderData.skillsRequired) {
      if (typeof tenderData.skillsRequired === 'string') {
        try {
          skillsRequired = JSON.parse(tenderData.skillsRequired);
        } catch (e) {
          skillsRequired = tenderData.skillsRequired.split(',').map(s => s.trim());
        }
      } else if (Array.isArray(tenderData.skillsRequired)) {
        skillsRequired = tenderData.skillsRequired;
      }
    }

    // Handle required certifications
    let requiredCertifications = [];
    if (tenderData.requiredCertifications) {
      if (typeof tenderData.requiredCertifications === 'string') {
        try {
          requiredCertifications = JSON.parse(tenderData.requiredCertifications);
        } catch (e) {
          requiredCertifications = [];
        }
      } else if (Array.isArray(tenderData.requiredCertifications)) {
        requiredCertifications = tenderData.requiredCertifications;
      }
    }

    // Handle deliverables
    let deliverables = [];
    if (tenderData.deliverables) {
      if (typeof tenderData.deliverables === 'string') {
        try {
          deliverables = JSON.parse(tenderData.deliverables).map((deliverable) => ({
            ...deliverable,
            deadline: deliverable.deadline ? new Date(deliverable.deadline) : null
          }));
        } catch (e) {
          deliverables = [];
        }
      } else if (Array.isArray(tenderData.deliverables)) {
        deliverables = tenderData.deliverables.map((deliverable) => ({
          ...deliverable,
          deadline: deliverable.deadline ? new Date(deliverable.deadline) : null
        }));
      }
    }

    // Handle milestones
    let milestones = [];
    if (tenderData.milestones) {
      if (typeof tenderData.milestones === 'string') {
        try {
          milestones = JSON.parse(tenderData.milestones).map((milestone) => ({
            ...milestone,
            dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null
          }));
        } catch (e) {
          milestones = [];
        }
      } else if (Array.isArray(tenderData.milestones)) {
        milestones = tenderData.milestones.map((milestone) => ({
          ...milestone,
          dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null
        }));
      }
    }

    // Set default workflowType
    const workflowType = tenderData.workflowType || 'open';

    // Set visibility
    const visibilityType = tenderData.visibilityType || 'public';
    const visibility = {
      visibilityType: visibilityType
    };

    // Handle allowed companies/users for invite-only tenders
    if (visibilityType === 'invite_only') {
      let allowedCompanies = [];
      let allowedUsers = [];

      if (tenderData.allowedCompanies) {
        if (typeof tenderData.allowedCompanies === 'string') {
          try {
            allowedCompanies = JSON.parse(tenderData.allowedCompanies);
          } catch (e) {
            allowedCompanies = [];
          }
        } else if (Array.isArray(tenderData.allowedCompanies)) {
          allowedCompanies = tenderData.allowedCompanies;
        }
      }

      if (tenderData.allowedUsers) {
        if (typeof tenderData.allowedUsers === 'string') {
          try {
            allowedUsers = JSON.parse(tenderData.allowedUsers);
          } catch (e) {
            allowedUsers = [];
          }
        } else if (Array.isArray(tenderData.allowedUsers)) {
          allowedUsers = tenderData.allowedUsers;
        }
      }

      visibility.allowedCompanies = allowedCompanies;
      visibility.allowedUsers = allowedUsers;
    }

    // Handle CPO requirements
    const cpoRequired = tenderData.cpoRequired === 'true' ||
      tenderData.cpoRequired === true ||
      tenderData.cpoRequired === '1';

    let cpoDescription = '';
    if (cpoRequired) {
      cpoDescription = tenderData.cpoDescription || professionalSpecific.cpoDescription || '';

      if (!cpoDescription.trim()) {
        return res.status(400).json({
          success: false,
          message: 'CPO description is required when CPO is required'
        });
      }
    }

    // Build professionalSpecific object
    const finalProfessionalSpecific = {
      referenceNumber: referenceNumber,
      procuringEntity: procuringEntity,
      procurementMethod: professionalSpecific.procurementMethod || tenderData.procurementMethod || 'open_tender',
      fundingSource: professionalSpecific.fundingSource || tenderData.fundingSource,
      eligibleBidderType: 'company',
      minimumExperience: professionalSpecific.minimumExperience || tenderData.minimumExperience || 0,
      requiredCertifications: requiredCertifications,
      legalRegistrationRequired: professionalSpecific.legalRegistrationRequired !== undefined ?
        professionalSpecific.legalRegistrationRequired : true,
      financialCapacity: professionalSpecific.financialCapacity || tenderData.financialCapacity,
      pastProjectReferences: professionalSpecific.pastProjectReferences || tenderData.pastProjectReferences,
      projectObjectives: professionalSpecific.projectObjectives || tenderData.projectObjectives,
      deliverables: deliverables,
      milestones: milestones,
      timeline: professionalSpecific.timeline || tenderData.timeline,
      evaluationMethod: professionalSpecific.evaluationMethod || tenderData.evaluationMethod || 'combined',
      evaluationCriteria: professionalSpecific.evaluationCriteria || tenderData.evaluationCriteria || {
        technicalWeight: 70,
        financialWeight: 30
      },
      bidValidityPeriod: professionalSpecific.bidValidityPeriod || tenderData.bidValidityPeriod || {
        value: 30,
        unit: 'days'
      },
      clarificationDeadline: professionalSpecific.clarificationDeadline || tenderData.clarificationDeadline ?
        new Date(professionalSpecific.clarificationDeadline || tenderData.clarificationDeadline) : null,
      preBidMeeting: professionalSpecific.preBidMeeting || tenderData.preBidMeeting,
      sealedBidConfirmation: false,
      // CPO fields
      cpoRequired: cpoRequired,
      cpoDescription: cpoDescription
    };

    // Create tender data
    const finalTenderData = {
      title: tenderData.title,
      description: tenderData.description,
      procurementCategory: tenderData.procurementCategory,
      tenderCategory: 'professional',
      workflowType: workflowType,
      status: tenderData.status || 'draft',
      deadline: deadlineDate,
      owner: req.user._id,
      ownerRole: ownerRole,
      ownerEntity: entityId,
      ownerEntityModel: entityModel,
      skillsRequired: skillsRequired,
      attachments: attachments,
      maxFileSize: tenderData.maxFileSize || 50 * 1024 * 1024,
      maxFileCount: tenderData.maxFileCount || 20,
      visibility: visibility,
      professionalSpecific: finalProfessionalSpecific,
      metadata: {
        views: 0,
        savedBy: [],
        totalApplications: 0,
        visibleApplications: 0,
        updateCount: 0,
        isUpdated: false,
        daysRemaining: Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24))
      }
    };

    // Handle sealed bid confirmation for closed workflow
    if (workflowType === 'closed') {
      const sealedBidConfirmation = tenderData.sealedBidConfirmation === 'true' ||
        tenderData.sealedBidConfirmation === true;

      if (!sealedBidConfirmation) {
        return res.status(400).json({
          success: false,
          message: 'Sealed bid confirmation is required for closed workflow professional tenders'
        });
      }

      finalTenderData.professionalSpecific.sealedBidConfirmation = true;
    }

    // Create and save tender
    const tender = new Tender(finalTenderData);

    // Validate against model
    const validationError = tender.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(validationError.errors).map(err => err.message),
        details: validationError.errors
      });
    }

    // For closed tenders, lock immediately if published
    if (workflowType === 'closed' && tenderData.status === 'published') {
      await tender.lockClosedTender(req.user._id);
    } else {
      await tender.save();
    }

    // Handle invitations for invite-only tenders
    if (visibilityType === 'invite_only' && tenderData.invitations) {
      let invitations = {};
      if (typeof tenderData.invitations === 'string') {
        try {
          invitations = JSON.parse(tenderData.invitations);
        } catch (e) {
          invitations = {};
        }
      } else {
        invitations = tenderData.invitations;
      }
      await handleTenderInvitations(tender, invitations, req.user);
    }

    // Add audit log
    await tender.addAuditLog('CREATE_PROFESSIONAL_TENDER', req.user._id, {
      action: 'Professional tender created',
      data: {
        title: tender.title,
        referenceNumber: tender.professionalSpecific.referenceNumber,
        workflowType: tender.workflowType,
        visibilityType: tender.visibility.visibilityType,
        cpoRequired: tender.professionalSpecific.cpoRequired,
        attachmentsCount: attachments.length
      }
    }, req.ip, req.headers['user-agent']);

    // Populate for response
    const populatedTender = await Tender.findById(tender._id)
      .populate('owner', 'name email profilePhoto')
      .populate('ownerEntity', 'name logo industry verified description')
      .populate('invitations.invitedUser', 'name email profilePhoto')
      .populate('invitations.invitedCompany', 'name logo industry');

    res.status(201).json({
      success: true,
      message: 'Professional tender created successfully',
      data: {
        tender: populatedTender,
        attachmentsCount: attachments.length
      }
    });

  } catch (error) {
    console.error('Error creating professional tender:', error);

    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern['professionalSpecific.referenceNumber']) {
        return res.status(400).json({
          success: false,
          message: 'Reference number already exists'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Tender with similar details already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating professional tender',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ============ GET ALL TENDERS (WITH VISIBILITY FILTERS) ============
// ============ GET ALL TENDERS (WITH PROPER VISIBILITY FOR COMPANIES) ============
const getTenders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      tenderCategory,
      workflowType,
      visibilityType,
      procurementCategory,
      minBudget,
      maxBudget,
      skills,
      search,
      status = 'published',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      cpoRequired,
      minExperience,
      evaluationMethod,
      dateFrom,
      dateTo,
      procuringEntity,
      referenceNumber
    } = req.query;

    // Build filter
    const filter = {
      isDeleted: false
    };

    // Status filter - only show published or locked (for sealed bids) tenders
    if (status && status !== 'all') {
      if (status === 'active') {
        filter.status = { $in: ['published', 'locked'] };
        filter.deadline = { $gt: new Date() };
      } else if (status === 'published') {
        filter.status = { $in: ['published', 'locked'] }; // Include locked for sealed bids
        filter.deadline = { $gt: new Date() };
      } else {
        filter.status = status;
      }
    } else {
      // Default: show only active tenders
      filter.status = { $in: ['published', 'locked'] };
      filter.deadline = { $gt: new Date() };
    }

    // Tender category filter
    if (tenderCategory && tenderCategory !== 'all') {
      filter.tenderCategory = tenderCategory;
    }

    // Workflow type filter
    if (workflowType && workflowType !== 'all') {
      filter.workflowType = workflowType;
    }

    // ============ FIXED: ROLE-BASED VISIBILITY FILTERING ============
    const userId = req.user?._id;
    const userRole = req.user?.role;

    // For authenticated users
    if (userId && userRole) {
      // Base condition: exclude user's own tenders (they have their own page)
      filter.owner = { $ne: userId };

      // Add role-specific visibility rules
      if (userRole === 'company') {
        // COMPANIES SHOULD SEE:
        // 1. All professional tenders from other companies and organizations
        // 2. Public and companies_only visibility
        // 3. Invite-only if they are invited

        const visibilityConditions = [
          // Professional tenders with public or companies_only visibility
          {
            tenderCategory: 'professional',
            'visibility.visibilityType': { $in: ['public', 'companies_only'] }
          }
        ];

        // Check for invite-only tenders where the company is invited
        const userCompany = await Company.findOne({ user: userId });
        if (userCompany) {
          visibilityConditions.push({
            tenderCategory: 'professional',
            'visibility.visibilityType': 'invite_only',
            $or: [
              { 'invitations.invitedUser': userId },
              { 'invitations.invitedCompany': userCompany._id },
              { 'invitations.email': req.user.email }
            ]
          });
        }

        filter.$or = visibilityConditions;
      }
      else if (userRole === 'organization') {
        // Organizations can see professional tenders (they might want to apply)
        filter.tenderCategory = 'professional';
        filter['visibility.visibilityType'] = { $in: ['public', 'companies_only'] };
      }
      else if (userRole === 'freelancer') {
        // Freelancers see freelance tenders
        filter.tenderCategory = 'freelance';
        filter['visibility.visibilityType'] = { $in: ['freelancers_only', 'public'] };
      }
      else if (userRole === 'admin') {
        // Admin sees everything except deleted
        // No additional filters
      }
    } else {
      // Unauthenticated users - only see public freelance tenders
      filter.tenderCategory = 'freelance';
      filter['visibility.visibilityType'] = 'freelancers_only';
    }

    // ============ ADDITIONAL FILTERS ============

    // Professional-specific filters
    if (tenderCategory === 'professional' || tenderCategory === 'all') {
      if (cpoRequired !== undefined) {
        if (cpoRequired === 'true' || cpoRequired === true) {
          filter['professionalSpecific.cpoRequired'] = true;
        } else if (cpoRequired === 'false' || cpoRequired === false) {
          filter['professionalSpecific.cpoRequired'] = false;
        }
      }

      if (minExperience) {
        filter['professionalSpecific.minimumExperience'] = { $gte: parseInt(minExperience) };
      }

      if (evaluationMethod) {
        filter['professionalSpecific.evaluationMethod'] = evaluationMethod;
      }

      if (procuringEntity) {
        filter['professionalSpecific.procuringEntity'] = { $regex: procuringEntity, $options: 'i' };
      }

      if (referenceNumber) {
        filter['professionalSpecific.referenceNumber'] = { $regex: referenceNumber, $options: 'i' };
      }
    }

    // Budget filters
    if (minBudget || maxBudget) {
      if (tenderCategory === 'professional') {
        filter['professionalSpecific.financialCapacity.minAnnualTurnover'] = {};
        if (minBudget) filter['professionalSpecific.financialCapacity.minAnnualTurnover']['$gte'] = Number(minBudget);
        if (maxBudget) filter['professionalSpecific.financialCapacity.minAnnualTurnover']['$lte'] = Number(maxBudget);
      } else {
        filter['freelanceSpecific.budget.min'] = {};
        if (minBudget) filter['freelanceSpecific.budget.min']['$gte'] = Number(minBudget);
        if (maxBudget) filter['freelanceSpecific.budget.max']['$lte'] = Number(maxBudget);
      }
    }

    // Date filters
    if (dateFrom || dateTo) {
      filter.deadline = {};
      if (dateFrom) filter.deadline.$gte = new Date(dateFrom);
      if (dateTo) filter.deadline.$lte = new Date(dateTo);
    }

    // Skills filter
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
      filter.skillsRequired = { $in: skillsArray.map(skill => new RegExp(skill.trim(), 'i')) };
    }

    // Search filter
    if (search) {
      filter.$or = (filter.$or || []).concat([
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tenderId: { $regex: search, $options: 'i' } },
        { 'professionalSpecific.referenceNumber': { $regex: search, $options: 'i' } },
        { 'professionalSpecific.procuringEntity': { $regex: search, $options: 'i' } }
      ]);
    }

    // Log the filter for debugging
    console.log('🔍 Tender filter:', JSON.stringify(filter, null, 2));

    // Execute query
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const tenders = await Tender.find(filter)
      .populate('owner', 'name email profilePhoto role')
      .populate('ownerEntity', 'name logo industry verified description')
      .populate('invitations.invitedUser', 'name email profilePhoto')
      .populate('invitations.invitedCompany', 'name logo industry')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Tender.countDocuments(filter);

    console.log(`✅ Found ${tenders.length} tenders (total: ${total})`);
    if (tenders.length > 0) {
      console.log('First tender category:', tenders[0].tenderCategory);
    }

    res.status(200).json({
      success: true,
      data: tenders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching tenders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tenders',
      error: error.message
    });
  }
};

// ============ GET SINGLE TENDER (WITH ACCESS CONTROL) ============
const getTender = async (req, res) => {
  try {
    const tenderId = req.params.id;
    if (!tenderId || tenderId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Valid tender ID is required'
      });
    }

    const tender = await Tender.findById(tenderId)
      .populate('owner', 'name email profilePhoto role')
      .populate('ownerEntity', 'name logo industry verified description website');

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Get user info from request (added by optionalAuth middleware)
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    console.log('🔍 Access check:', {
      tenderId: tender._id,
      tenderCategory: tender.tenderCategory,
      userId: userId?.toString(),
      userRole,
      tenderOwner: tender.owner?._id?.toString(),
      isAuthenticated: !!userId,
      visibilityType: tender.visibility?.visibilityType
    });

    // ============ OWNER CHECK ============
    // If user is authenticated, check if they are the owner
    let isOwner = false;
    if (userId && tender.owner && tender.owner._id.toString() === userId.toString()) {
      isOwner = true;
      console.log('✅ User is owner, granting full access');

      // Populate additional fields for owner
      await tender.populate([
        'invitations.invitedUser',
        'invitations.invitedCompany',
        'proposals.applicant'
      ]);

      return res.status(200).json({
        success: true,
        data: {
          tender,
          canViewProposals: true,
          isOwner: true,
          canEdit: tender.status === 'draft' ||
            (tender.status === 'published' && tender.workflowType === 'open')
        }
      });
    }

    // ============ FOR UNAUTHENTICATED USERS ============
    if (!userId || !userRole) {
      // Unauthenticated users can only see public freelance tenders
      if (tender.tenderCategory === 'freelance' &&
        tender.visibility?.visibilityType === 'freelancers_only' &&
        tender.status === 'published' &&
        new Date(tender.deadline) > new Date()) {

        console.log('✅ Unauthenticated user can view public freelance tender');

        // Hide proposals and sensitive data
        const tenderObj = tender.toObject();
        tenderObj.proposals = [];
        tenderObj.invitations = [];
        tenderObj.metadata.visibleApplications = 0;

        return res.status(200).json({
          success: true,
          data: {
            tender: tenderObj,
            canViewProposals: false,
            isOwner: false
          }
        });
      }

      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this tender. Please log in.'
      });
    }

    // ============ AUTHENTICATED NON-OWNER USERS ============

    // Check if user can view based on role and tender category
    let canView = false;
    let reason = '';

    // CASE 1: Freelancer trying to view freelance tender
    if (userRole === 'freelancer' && tender.tenderCategory === 'freelance') {
      // Check visibility for freelance tenders
      if (tender.visibility?.visibilityType === 'freelancers_only' ||
        tender.visibility?.visibilityType === 'public') {

        if (tender.status === 'published' && new Date(tender.deadline) > new Date()) {
          canView = true;
          console.log('✅ Freelancer can view active freelance tender');
        } else {
          reason = 'Tender is not active or deadline has passed';
        }
      } else {
        reason = `Tender visibility is ${tender.visibility?.visibilityType}, not accessible to freelancers`;
      }
    }

    // CASE 2: Company trying to view professional tender
    else if (userRole === 'company' && tender.tenderCategory === 'professional') {
      // Check visibility for professional tenders
      if (tender.visibility?.visibilityType === 'public' ||
        tender.visibility?.visibilityType === 'companies_only') {

        if (tender.status === 'published' && new Date(tender.deadline) > new Date()) {
          canView = true;
          console.log('✅ Company can view active professional tender');
        } else {
          reason = 'Tender is not active or deadline has passed';
        }
      }
      // Check invite-only tenders
      else if (tender.visibility?.visibilityType === 'invite_only') {
        // Check if company is invited
        const userCompany = await Company.findOne({ user: userId });
        if (userCompany) {
          const isInvited = tender.invitations.some(invite =>
            (invite.invitedCompany && invite.invitedCompany.toString() === userCompany._id.toString()) ||
            (invite.invitedUser && invite.invitedUser.toString() === userId.toString()) ||
            (invite.email && invite.email === req.user.email)
          );

          if (isInvited && tender.status === 'published' && new Date(tender.deadline) > new Date()) {
            canView = true;
            console.log('✅ Company is invited to view professional tender');
          } else {
            reason = 'You are not invited to this tender or it is not active';
          }
        } else {
          reason = 'No company profile found';
        }
      } else {
        reason = `Tender visibility is ${tender.visibility?.visibilityType}`;
      }
    }

    // CASE 3: Organization viewing professional tenders (as applicants)
    else if (userRole === 'organization' && tender.tenderCategory === 'professional') {
      // Organizations can view public and companies-only professional tenders
      if (tender.visibility?.visibilityType === 'public' ||
        tender.visibility?.visibilityType === 'companies_only') {

        if (tender.status === 'published' && new Date(tender.deadline) > new Date()) {
          canView = true;
          console.log('✅ Organization can view professional tender');
        } else {
          reason = 'Tender is not active or deadline has passed';
        }
      } else {
        reason = `Tender visibility is ${tender.visibility?.visibilityType}`;
      }
    }

    // CASE 4: Admin can view everything
    else if (userRole === 'admin') {
      canView = true;
      console.log('✅ Admin can view any tender');
    }

    // CASE 5: Mismatched role and category
    else {
      reason = `Your role (${userRole}) cannot view ${tender.tenderCategory} tenders`;
    }

    if (!canView) {
      console.log('❌ Access denied:', reason);
      return res.status(403).json({
        success: false,
        message: reason || 'Not authorized to view this tender',
        debug: {
          userRole,
          tenderCategory: tender.tenderCategory,
          visibilityType: tender.visibility?.visibilityType,
          status: tender.status,
          deadline: tender.deadline
        }
      });
    }

    // ============ PREPARE RESPONSE FOR VALID VIEWERS ============

    // Hide sealed proposals for closed tenders before reveal
    if (tender.workflowType === 'closed' &&
      tender.status !== 'revealed' &&
      tender.status !== 'closed') {

      const tenderObj = tender.toObject();
      tenderObj.proposals = [];
      tenderObj.metadata.visibleApplications = 0;

      // Increment views
      tender.metadata.views = (tender.metadata.views || 0) + 1;
      await tender.save();

      return res.status(200).json({
        success: true,
        data: {
          tender: tenderObj,
          canViewProposals: false,
          isOwner: false
        }
      });
    }

    // For open tenders or revealed closed tenders
    // Hide other applicants' proposals from non-owners
    const tenderObj = tender.toObject();
    if (!isOwner) {
      // Only show the user's own proposal if it exists
      const userProposal = tender.proposals.find(p =>
        p.applicant.toString() === userId.toString()
      );

      tenderObj.proposals = userProposal ? [userProposal] : [];
      tenderObj.metadata.visibleApplications = tender.proposals.length;
    }

    // Increment views
    tender.metadata.views = (tender.metadata.views || 0) + 1;
    await tender.save();

    res.status(200).json({
      success: true,
      data: {
        tender: tenderObj,
        canViewProposals: tender.workflowType === 'open' ||
          tender.status === 'revealed' ||
          tender.status === 'closed',
        isOwner: false
      }
    });

  } catch (error) {
    console.error('Error fetching tender:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching tender',
      error: error.message
    });
  }
};

// ============ GET OWNER TENDER (FOR TENDERS OWNED BY USER) ============
const getOwnerTender = async (req, res) => {
  try {
    const tenderId = req.params.id;

    const tender = await Tender.findById(tenderId)
      .populate('owner', 'name email profilePhoto role')
      .populate('ownerEntity', 'name logo industry verified description website')
      .populate('invitations.invitedUser', 'name email profilePhoto')
      .populate('invitations.invitedCompany', 'name logo industry')
      .populate('proposals.applicant', 'name email profilePhoto');

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // CRITICAL: Verify ownership
    const isOwner = tender.owner._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      console.log('❌ Owner access denied:', {
        tenderOwner: tender.owner._id.toString(),
        currentUser: req.user._id.toString()
      });

      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this tender as owner'
      });
    }

    // Calculate if tender can be edited
    const canEdit = tender.status === 'draft' ||
      (tender.status === 'published' && tender.workflowType === 'open');

    res.status(200).json({
      success: true,
      data: {
        tender,
        canViewProposals: true,
        isOwner: true,
        canEdit
      }
    });

  } catch (error) {
    console.error('Error fetching owner tender:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tender details',
      error: error.message
    });
  }
};

// @desc    Get tenders owned by the current user
// @route   GET /api/v1/tender/owned
// @access  Private
const getOwnedTenders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      tenderCategory,
      workflowType
    } = req.query;

    const filter = {
      owner: req.user._id,
      isDeleted: false
    };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (tenderCategory && tenderCategory !== 'all') {
      filter.tenderCategory = tenderCategory;
    }

    if (workflowType && workflowType !== 'all') {
      filter.workflowType = workflowType;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const tenders = await Tender.find(filter)
      .populate('ownerEntity', 'name logo industry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Tender.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: tenders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching owned tenders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching owned tenders'
    });
  }
};

// ============ UPDATE TENDER (WITH WORKFLOW CHECKS) ============
const updateTender = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if user owns the tender
    if (tender.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this tender'
      });
    }

    // Check update restrictions based on workflow type
    let canUpdate = false;
    let restrictionReason = '';

    // Draft tenders can always be updated
    if (tender.status === 'draft') {
      canUpdate = true;
    }
    // Published open tenders can be updated
    else if (tender.status === 'published' && tender.workflowType === 'open') {
      canUpdate = true;
    }
    // Published closed tenders cannot be updated (sealed bids)
    else if (tender.status === 'published' && tender.workflowType === 'closed') {
      canUpdate = false;
      restrictionReason = 'Closed workflow tenders cannot be updated after publishing (sealed bids)';
    }
    // Locked, revealed, or closed tenders cannot be updated
    else if (['locked', 'deadline_reached', 'revealed', 'closed', 'cancelled'].includes(tender.status)) {
      canUpdate = false;
      restrictionReason = `Cannot update tender in ${tender.status} status`;
    }

    if (!canUpdate) {
      return res.status(400).json({
        success: false,
        message: restrictionReason || 'Tender cannot be updated in its current state',
        restriction: restrictionReason
      });
    }

    const updates = req.body || {};

    // Don't allow changing critical fields
    delete updates.tenderCategory;
    delete updates.workflowType;
    delete updates.owner;
    delete updates.ownerRole;
    delete updates.ownerEntity;
    delete updates.ownerEntityModel;

    // For professional closed tenders, don't allow changing sealed bid confirmation
    if (tender.workflowType === 'closed' && tender.tenderCategory === 'professional') {
      delete updates.sealedBidConfirmation;
    }

    // Validate deadline if being updated
    if (updates.deadline) {
      const newDeadline = new Date(updates.deadline);
      if (newDeadline <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Deadline must be in the future'
        });
      }
      updates.deadline = newDeadline;
    }

    // Don't allow changing visibility for published tenders
    if (tender.status === 'published') {
      delete updates.visibility;
    }

    // ==== CLOUDINARY ATTACHMENTS HANDLING ====
    if (req.cloudinaryFiles && req.cloudinaryFiles.success && req.cloudinaryFiles.files) {
      console.log(`Processing ${req.cloudinaryFiles.files.length} Cloudinary files for tender update`);

      req.cloudinaryFiles.files.forEach((cloudinaryFile, index) => {
        // Skip files that failed to upload
        if (cloudinaryFile.success === false) {
          console.warn(`File ${cloudinaryFile.originalName} failed to upload:`, cloudinaryFile.error);
          return;
        }

        const description = updates.fileDescriptions && updates.fileDescriptions[index]
          ? updates.fileDescriptions[index]
          : '';

        const documentType = updates.fileTypes && updates.fileTypes[index]
          ? updates.fileTypes[index]
          : 'other';

        // Get Cloudinary data
        const cloudinaryData = cloudinaryFile.cloudinary;

        if (!cloudinaryData || !cloudinaryData.public_id) {
          console.error('Missing Cloudinary data for file:', cloudinaryFile.originalName);
          return;
        }

        const newAttachment = {
          filename: cloudinaryData.public_id,
          originalName: cloudinaryFile.originalName,
          path: cloudinaryData.secure_url,
          fileSize: cloudinaryFile.size,
          fileType: cloudinaryFile.mimetype,
          description: description,
          uploadedBy: req.user._id,
          uploadedAt: new Date(),
          documentType: documentType,
          version: 1,
          fileHash: cloudinaryData.public_id,
          // Cloudinary metadata
          cloudinaryPublicId: cloudinaryData.public_id,
          cloudinaryUrl: cloudinaryData.secure_url,
          cloudinaryFormat: cloudinaryData.format,
          cloudinaryResourceType: cloudinaryData.resource_type,
          cloudinaryCreatedAt: cloudinaryData.created_at,
          cloudinaryBytes: cloudinaryData.bytes,
          cloudinaryTags: cloudinaryData.tags || []
        };

        // Add new attachment to existing ones
        tender.attachments.push(newAttachment);
      });
    } else if (req.cloudinaryFile && req.cloudinaryFile.success && req.cloudinaryFile.file) {
      // Handle single file upload
      const cloudinaryFile = req.cloudinaryFile.file;
      const cloudinaryData = cloudinaryFile.cloudinary;

      const newAttachment = {
        filename: cloudinaryData.public_id,
        originalName: cloudinaryFile.originalName,
        path: cloudinaryData.secure_url,
        fileSize: cloudinaryFile.size,
        fileType: cloudinaryFile.mimetype,
        description: updates.fileDescriptions?.[0] || '',
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
        documentType: updates.fileTypes?.[0] || 'other',
        version: 1,
        fileHash: cloudinaryData.public_id,
        // Cloudinary metadata
        cloudinaryPublicId: cloudinaryData.public_id,
        cloudinaryUrl: cloudinaryData.secure_url,
        cloudinaryFormat: cloudinaryData.format,
        cloudinaryResourceType: cloudinaryData.resource_type,
        cloudinaryCreatedAt: cloudinaryData.created_at,
        cloudinaryBytes: cloudinaryData.bytes,
        cloudinaryTags: cloudinaryData.tags || []
      };

      tender.attachments.push(newAttachment);
    }

    // Update tender fields
    Object.keys(updates).forEach(key => {
      if (key === 'freelanceSpecific' || key === 'professionalSpecific') {
        // Merge nested objects
        tender[key] = { ...tender[key].toObject(), ...updates[key] };
      } else if (key === 'skillsRequired') {
        tender[key] = Array.isArray(updates[key]) ? updates[key] : JSON.parse(updates[key] || '[]');
      } else if (!['fileDescriptions', 'fileTypes'].includes(key)) {
        tender[key] = updates[key];
      }
    });

    // Update metadata
    tender.metadata.isUpdated = true;
    tender.metadata.updateCount += 1;
    tender.metadata.lastUpdatedBy = req.user._id;
    tender.metadata.lastUpdatedAt = new Date();

    await tender.validate();
    await tender.save();

    // Add audit log
    await tender.addAuditLog('UPDATE', req.user._id, {
      action: 'Tender updated',
      changes: Object.keys(updates),
      workflowType: tender.workflowType,
      status: tender.status,
      newAttachmentsCount: req.cloudinaryFiles?.files?.length || req.cloudinaryFile ? 1 : 0
    }, req.ip, req.headers['user-agent']);

    // Populate for response
    const populatedTender = await Tender.findById(tender._id)
      .populate('owner', 'name email profilePhoto')
      .populate('ownerEntity', 'name logo industry verified description');

    res.status(200).json({
      success: true,
      message: 'Tender updated successfully',
      data: {
        tender: populatedTender,
        canEdit: tender.canEdit,
        attachmentsCount: tender.attachments.length
      }
    });

  } catch (error) {
    console.error('Error updating tender:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error - check reference numbers'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating tender',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get pre-filled tender data for editing
// @route   GET /api/v1/tender/:id/edit-data
// @access  Private (Owner only)
const getTenderForEditing = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id)
      .populate('owner', 'name email profilePhoto role')
      .populate('ownerEntity', 'name logo industry verified description');

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if user owns the tender
    if (tender.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this tender'
      });
    }

    // Check if tender can be edited
    if (!tender.canEdit) {
      return res.status(400).json({
        success: false,
        message: 'Tender cannot be edited in its current state',
        restriction: getEditRestrictionReason(tender)
      });
    }

    // Prepare data in format suitable for form
    const editableData = {
      // Basic info
      title: tender.title,
      description: tender.description,
      procurementCategory: tender.procurementCategory,
      deadline: tender.deadline,
      skillsRequired: tender.skillsRequired,

      // Status and workflow
      status: tender.status,
      workflowType: tender.workflowType,

      // Category specific
      tenderCategory: tender.tenderCategory,

      // Freelance specific
      ...(tender.tenderCategory === 'freelance' && tender.freelanceSpecific ? {
        freelanceSpecific: {
          engagementType: tender.freelanceSpecific.engagementType,
          projectType: tender.freelanceSpecific.projectType,
          budget: tender.freelanceSpecific.budget,
          estimatedDuration: tender.freelanceSpecific.estimatedDuration,
          weeklyHours: tender.freelanceSpecific.weeklyHours,
          experienceLevel: tender.freelanceSpecific.experienceLevel,
          portfolioRequired: tender.freelanceSpecific.portfolioRequired,
          languagePreference: tender.freelanceSpecific.languagePreference,
          timezonePreference: tender.freelanceSpecific.timezonePreference,
          screeningQuestions: tender.freelanceSpecific.screeningQuestions,
          ndaRequired: tender.freelanceSpecific.ndaRequired,
          urgency: tender.freelanceSpecific.urgency,
          industry: tender.freelanceSpecific.industry
        },
        sealedBidConfirmation: tender.freelanceSpecific.sealedBidConfirmation
      } : {}),

      // Professional specific
      ...(tender.tenderCategory === 'professional' && tender.professionalSpecific ? {
        professionalSpecific: {
          referenceNumber: tender.professionalSpecific.referenceNumber,
          procuringEntity: tender.professionalSpecific.procuringEntity,
          procurementMethod: tender.professionalSpecific.procurementMethod,
          fundingSource: tender.professionalSpecific.fundingSource,
          minimumExperience: tender.professionalSpecific.minimumExperience,
          requiredCertifications: tender.professionalSpecific.requiredCertifications,
          legalRegistrationRequired: tender.professionalSpecific.legalRegistrationRequired,
          financialCapacity: tender.professionalSpecific.financialCapacity,
          pastProjectReferences: tender.professionalSpecific.pastProjectReferences,
          projectObjectives: tender.professionalSpecific.projectObjectives,
          deliverables: tender.professionalSpecific.deliverables,
          milestones: tender.professionalSpecific.milestones,
          timeline: tender.professionalSpecific.timeline,
          evaluationMethod: tender.professionalSpecific.evaluationMethod,
          evaluationCriteria: tender.professionalSpecific.evaluationCriteria,
          bidValidityPeriod: tender.professionalSpecific.bidValidityPeriod,
          clarificationDeadline: tender.professionalSpecific.clarificationDeadline,
          preBidMeeting: tender.professionalSpecific.preBidMeeting,
          sealedBidConfirmation: tender.professionalSpecific.sealedBidConfirmation,
          cpoRequired: tender.professionalSpecific.cpoRequired,
          cpoDescription: tender.professionalSpecific.cpoDescription
        },
        visibilityType: tender.visibility.visibilityType
      } : {}),

      // Attachments
      attachments: tender.attachments,
      maxFileSize: tender.maxFileSize,
      maxFileCount: tender.maxFileCount
    };

    res.status(200).json({
      success: true,
      data: {
        tender: editableData,
        originalTender: tender,
        canEdit: tender.canEdit,
        workflowType: tender.workflowType,
        status: tender.status
      }
    });

  } catch (error) {
    console.error('Error fetching tender for editing:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tender data for editing',
      error: error.message
    });
  }
};

// ============ DEDICATED PROFESSIONAL TENDERS ENDPOINT ============
// @desc    Get professional tenders for companies
// @route   GET /api/v1/tender/professional
// @access  Private (Companies)
const getProfessionalTenders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      workflowType,
      procurementMethod,
      cpoRequired,
      minBudget,
      maxBudget,
      minExperience,
      visibilityType,
      evaluationMethod,
      dateFrom,
      dateTo,
      procuringEntity,
      referenceNumber,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Base filter - ONLY professional tenders, exclude user's own
    const filter = {
      tenderCategory: 'professional',
      isDeleted: false,
      owner: { $ne: req.user._id }, // Exclude user's own tenders
      status: { $in: ['published', 'locked'] },
      deadline: { $gt: new Date() }
    };

    // Get user's company for invitation checks
    const userCompany = await Company.findOne({ user: req.user._id });

    // ============ VISIBILITY FILTER ============
    // Companies can see:
    // 1. Public tenders
    // 2. Companies-only tenders
    // 3. Invite-only tenders where they are invited

    const visibilityConditions = [
      { 'visibility.visibilityType': 'public' },
      { 'visibility.visibilityType': 'companies_only' }
    ];

    // Add invite-only condition if company is invited
    if (userCompany) {
      visibilityConditions.push({
        'visibility.visibilityType': 'invite_only',
        $or: [
          { 'invitations.invitedUser': req.user._id },
          { 'invitations.invitedCompany': userCompany._id },
          { 'invitations.email': req.user.email }
        ]
      });
    }

    filter.$or = visibilityConditions;

    // ============ ADDITIONAL FILTERS ============

    // Workflow type
    if (workflowType && workflowType !== 'all') {
      filter.workflowType = workflowType;
    }

    // Procurement method
    if (procurementMethod && procurementMethod !== 'all') {
      filter['professionalSpecific.procurementMethod'] = procurementMethod;
    }

    // CPO required
    if (cpoRequired !== undefined && cpoRequired !== 'all') {
      const isRequired = cpoRequired === 'true' || cpoRequired === true;
      filter['professionalSpecific.cpoRequired'] = isRequired;
    }

    // Budget range (financial capacity)
    if (minBudget || maxBudget) {
      filter['professionalSpecific.financialCapacity.minAnnualTurnover'] = {};
      if (minBudget) {
        filter['professionalSpecific.financialCapacity.minAnnualTurnover']['$gte'] = Number(minBudget);
      }
      if (maxBudget) {
        filter['professionalSpecific.financialCapacity.minAnnualTurnover']['$lte'] = Number(maxBudget);
      }
    }

    // Minimum experience
    if (minExperience) {
      filter['professionalSpecific.minimumExperience'] = { $gte: Number(minExperience) };
    }

    // Visibility type (overrides the base if specified)
    if (visibilityType && visibilityType !== 'all') {
      filter['visibility.visibilityType'] = visibilityType;
    }

    // Evaluation method
    if (evaluationMethod && evaluationMethod !== 'all') {
      filter['professionalSpecific.evaluationMethod'] = evaluationMethod;
    }

    // Date range
    if (dateFrom || dateTo) {
      filter.deadline = {};
      if (dateFrom) filter.deadline.$gte = new Date(dateFrom);
      if (dateTo) filter.deadline.$lte = new Date(dateTo);
    }

    // Procuring entity search
    if (procuringEntity) {
      filter['professionalSpecific.procuringEntity'] = {
        $regex: procuringEntity,
        $options: 'i'
      };
    }

    // Reference number search
    if (referenceNumber) {
      filter['professionalSpecific.referenceNumber'] = {
        $regex: referenceNumber,
        $options: 'i'
      };
    }

    // General search (title, description, reference, entity)
    if (search) {
      filter.$and = [
        { $or: visibilityConditions }, // Preserve visibility conditions
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { 'professionalSpecific.referenceNumber': { $regex: search, $options: 'i' } },
            { 'professionalSpecific.procuringEntity': { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Log the filter for debugging
    console.log('🔍 Professional Tenders Filter:', JSON.stringify(filter, null, 2));

    // Execute query
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const tenders = await Tender.find(filter)
      .populate('owner', 'name email profilePhoto role')
      .populate('ownerEntity', 'name logo industry verified description website')
      .populate('invitations.invitedUser', 'name email profilePhoto')
      .populate('invitations.invitedCompany', 'name logo industry')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Tender.countDocuments(filter);

    console.log(`✅ Found ${tenders.length} professional tenders (total: ${total})`);

    res.status(200).json({
      success: true,
      data: tenders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching professional tenders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professional tenders',
      error: error.message
    });
  }
};

// ============ DEDICATED FREELANCE TENDERS ENDPOINT ============
// @desc    Get freelance tenders for freelancers
// @route   GET /api/v1/tender/freelance
// @access  Private (Freelancers)
const getFreelanceTenders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      engagementType,
      minBudget,
      maxBudget,
      experienceLevel,
      projectType,
      skills,
      urgency,
      estimatedDurationMin,
      estimatedDurationMax,
      estimatedDurationUnit,
      weeklyHoursMin,
      weeklyHoursMax,
      languagePreference,
      timezonePreference,
      ndaRequired,
      portfolioRequired,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Base filter - ONLY freelance tenders, exclude user's own
    const filter = {
      tenderCategory: 'freelance',
      isDeleted: false,
      owner: { $ne: req.user._id }, // Exclude user's own tenders
      status: 'published',
      deadline: { $gt: new Date() },
      'visibility.visibilityType': { $in: ['freelancers_only', 'public'] }
    };

    // ============ ADDITIONAL FILTERS ============

    // Engagement type
    if (engagementType && engagementType !== 'all') {
      filter['freelanceSpecific.engagementType'] = engagementType;
    }

    // Budget range
    if (minBudget || maxBudget) {
      filter['freelanceSpecific.budget.min'] = {};
      filter['freelanceSpecific.budget.max'] = {};

      if (minBudget) {
        filter['freelanceSpecific.budget.min']['$gte'] = Number(minBudget);
      }
      if (maxBudget) {
        filter['freelanceSpecific.budget.max']['$lte'] = Number(maxBudget);
      }
    }

    // Experience level
    if (experienceLevel && experienceLevel !== 'all') {
      filter['freelanceSpecific.experienceLevel'] = experienceLevel;
    }

    // Project type
    if (projectType && projectType !== 'all') {
      filter['freelanceSpecific.projectType'] = projectType;
    }

    // Skills
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
      filter.skillsRequired = { $in: skillsArray.map(skill => new RegExp(skill.trim(), 'i')) };
    }

    // Urgency
    if (urgency && urgency !== 'all') {
      if (urgency === 'urgent') {
        filter['freelanceSpecific.urgency'] = 'urgent';
      }
    }

    // Estimated duration
    if (estimatedDurationMin || estimatedDurationMax) {
      filter['freelanceSpecific.estimatedDuration.value'] = {};
      if (estimatedDurationMin) {
        filter['freelanceSpecific.estimatedDuration.value']['$gte'] = Number(estimatedDurationMin);
      }
      if (estimatedDurationMax) {
        filter['freelanceSpecific.estimatedDuration.value']['$lte'] = Number(estimatedDurationMax);
      }
      if (estimatedDurationUnit) {
        filter['freelanceSpecific.estimatedDuration.unit'] = estimatedDurationUnit;
      }
    }

    // Weekly hours (for hourly engagements)
    if (weeklyHoursMin || weeklyHoursMax) {
      filter['freelanceSpecific.weeklyHours'] = {};
      if (weeklyHoursMin) {
        filter['freelanceSpecific.weeklyHours']['$gte'] = Number(weeklyHoursMin);
      }
      if (weeklyHoursMax) {
        filter['freelanceSpecific.weeklyHours']['$lte'] = Number(weeklyHoursMax);
      }
    }

    // Language preference
    if (languagePreference) {
      filter['freelanceSpecific.languagePreference'] = {
        $regex: languagePreference,
        $options: 'i'
      };
    }

    // Timezone preference
    if (timezonePreference) {
      filter['freelanceSpecific.timezonePreference'] = {
        $regex: timezonePreference,
        $options: 'i'
      };
    }

    // Requirements
    if (ndaRequired !== undefined && ndaRequired !== 'all') {
      const required = ndaRequired === 'true' || ndaRequired === true;
      filter['freelanceSpecific.ndaRequired'] = required;
    }

    if (portfolioRequired !== undefined && portfolioRequired !== 'all') {
      const required = portfolioRequired === 'true' || portfolioRequired === true;
      filter['freelanceSpecific.portfolioRequired'] = required;
    }

    // Date range
    if (dateFrom || dateTo) {
      filter.deadline = {};
      if (dateFrom) filter.deadline.$gte = new Date(dateFrom);
      if (dateTo) filter.deadline.$lte = new Date(dateTo);
    }

    // General search
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skillsRequired: { $regex: search, $options: 'i' } }
      ];
    }

    // Log the filter for debugging
    console.log('🔍 Freelance Tenders Filter:', JSON.stringify(filter, null, 2));

    // Execute query
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const tenders = await Tender.find(filter)
      .populate('owner', 'name email profilePhoto role')
      .populate('ownerEntity', 'name logo industry verified description')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Tender.countDocuments(filter);

    console.log(`✅ Found ${tenders.length} freelance tenders (total: ${total})`);

    res.status(200).json({
      success: true,
      data: tenders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching freelance tenders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching freelance tenders',
      error: error.message
    });
  }
};

// Helper function to get edit restriction reason
const getEditRestrictionReason = (tender) => {
  if (tender.status === 'draft') return null;

  if (tender.status === 'published' && tender.workflowType === 'closed') {
    return 'Closed workflow tenders cannot be edited after publishing';
  }

  if (['locked', 'deadline_reached', 'revealed', 'closed', 'cancelled'].includes(tender.status)) {
    return `Tender is ${tender.status.replace('_', ' ')}`;
  }

  return null;
};

// ============ DELETE TENDER ============
const deleteTender = async (req, res) => {
  try {
    const tenderId = req.params.id;
    if (!tenderId || tenderId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Valid tender ID is required'
      });
    }

    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if user owns the tender
    if (tender.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this tender'
      });
    }

    // Cannot delete if there are proposals and tender is active
    if (tender.proposals.length > 0 && tender.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tender with existing proposals'
      });
    }

    // Soft delete
    tender.isDeleted = true;
    tender.deletedAt = new Date();
    tender.deletedBy = req.user._id;
    await tender.save();

    // Add audit log
    await tender.addAuditLog('DELETE', req.user._id, {
      action: 'Tender deleted',
      reason: 'Soft delete by owner'
    }, req.ip, req.headers['user-agent']);

    res.status(200).json({
      success: true,
      message: 'Tender deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting tender:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tender'
    });
  }
};

// ============ PUBLISH TENDER ============
const publishTender = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if user owns the tender
    if (tender.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to publish this tender'
      });
    }

    // Check if tender can be published
    if (tender.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft tenders can be published'
      });
    }

    // Validate required fields based on tender category
    if (tender.tenderCategory === 'professional') {
      if (!tender.professionalSpecific || !tender.professionalSpecific.referenceNumber) {
        return res.status(400).json({
          success: false,
          message: 'Reference number is required for professional tenders'
        });
      }
    }

    // Update status
    tender.status = 'published';
    tender.publishedAt = new Date();

    // For closed tenders, lock immediately
    if (tender.workflowType === 'closed') {
      await tender.lockClosedTender(req.user._id);
    } else {
      await tender.save();
    }

    // Add audit log
    await tender.addAuditLog('PUBLISH', req.user._id, {
      action: 'Tender published',
      workflowType: tender.workflowType
    }, req.ip, req.headers['user-agent']);

    res.status(200).json({
      success: true,
      message: tender.workflowType === 'closed'
        ? 'Tender published and locked as sealed bid'
        : 'Tender published successfully',
      data: { tender }
    });

  } catch (error) {
    console.error('Error publishing tender:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing tender'
    });
  }
};

// ============ REVEAL PROPOSALS (CLOSED TENDERS) ============
const revealProposals = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if user owns the tender
    if (tender.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reveal proposals'
      });
    }

    // Check if tender is closed workflow
    if (tender.workflowType !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Only closed workflow tenders can reveal proposals'
      });
    }

    // Check if deadline has passed
    if (tender.deadline > new Date() && tender.status !== 'deadline_reached') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reveal proposals before deadline'
      });
    }

    // Check if already revealed
    if (tender.status === 'revealed' || tender.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Proposals have already been revealed'
      });
    }

    // Reveal proposals
    await tender.revealProposals(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Proposals revealed successfully',
      data: {
        tender,
        revealedAt: tender.revealedAt,
        revealedCount: tender.proposals.length
      }
    });
  } catch (error) {
    console.error('Error revealing proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Error revealing proposals'
    });
  }
};

// ============ FIXED: ATTACHMENT DOWNLOAD WITH PROPER ACCESS CONTROL ============
const downloadAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    // User is now available because verifyToken middleware runs
    const user = req.user;

    console.log('📥 Download attachment request:', {
      tenderId: id,
      attachmentId,
      userId: user?._id,
      userRole: user?.role,
      timestamp: new Date().toISOString()
    });

    const tender = await Tender.findById(id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    const attachment = tender.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // ============ IMPROVED ACCESS CONTROL ============
    // Check if user can view this tender AND the attachment

    // For owners (company OR organization), always allow
    const isOwner = tender.owner.toString() === user?._id.toString();
    const isOwnerRole = user?.role === 'company' || user?.role === 'organization';

    if (isOwner && isOwnerRole) {
      console.log('✅ Owner downloading attachment');
      // Continue with download
    } else {
      // For non-owners, check if they can view the tender
      const canViewTender = await tender.canUserView(user?._id, user?.role);

      if (!canViewTender) {
        console.log('❌ User not authorized to view tender:', {
          userId: user?._id,
          userRole: user?.role,
          tenderId: tender._id,
          tenderOwner: tender.owner
        });
        return res.status(403).json({
          success: false,
          message: 'Not authorized to download this attachment'
        });
      }
    }

    // ============ UNIVERSAL PATH RESOLUTION ============
    const uploadBase = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
    const filename = attachment.fileName || attachment.filename;
    const storedPath = attachment.path;

    if (!filename) {
      return res.status(404).json({
        success: false,
        message: 'Attachment has no filename'
      });
    }

    const possiblePaths = [
      path.join(uploadBase, 'tenders', filename),                 // priority 1: UPLOAD_BASE_PATH + tenders folder
      path.join('/app', 'uploads', 'tenders', filename),          // priority 2: Docker explicit
      path.join(process.cwd(), 'uploads', 'tenders', filename),   // priority 3: fallback
      path.join(uploadBase, filename),                            // priority 4: without tenders subdir
      (!isWindowsPath(storedPath) ? storedPath : null)            // priority 5: stored path only if Linux
    ].filter(Boolean);

    console.log('🔍 Searching for file in paths:', possiblePaths);

    let filePath = null;
    for (const candidate of possiblePaths) {
      if (candidate && fs.existsSync(candidate)) {
        filePath = candidate;
        console.log(`✅ Found file at: ${filePath}`);
        break;
      }
    }

    if (!filePath) {
      console.error('❌ File not found. Searched paths:', possiblePaths);
      return res.status(404).json({
        success: false,
        message: 'File not found on server',
        requested: {
          id: attachment._id,
          filename: attachment.fileName,
          originalName: attachment.originalName
        },
        searchedPaths: possiblePaths
      });
    }

    const sanitizedFilename = attachment.originalName.replace(/[^\x20-\x7E]/g, '_');

    res.setHeader('Content-Type', attachment.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(sanitizedFilename)}"`);
    res.setHeader('Content-Length', attachment.size);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file',
          error: error.message
        });
      }
    });

    fileStream.pipe(res);

    res.on('close', () => {
      fileStream.destroy();
    });

  } catch (error) {
    console.error('Error downloading attachment:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error downloading attachment',
        error: error.message
      });
    }
  }
};

// ============ FIXED: ATTACHMENT PREVIEW WITH PROPER ACCESS CONTROL ============
const previewAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    // User is now available because verifyToken middleware runs
    const user = req.user;

    console.log('👁️ Preview attachment request:', {
      tenderId: id,
      attachmentId,
      userId: user?._id,
      userRole: user?.role,
      timestamp: new Date().toISOString()
    });

    const tender = await Tender.findById(id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    const attachment = tender.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // ============ IMPROVED ACCESS CONTROL ============
    // Check if user can view this tender AND the attachment

    // For owners (company OR organization), always allow
    const isOwner = tender.owner.toString() === user?._id.toString();
    const isOwnerRole = user?.role === 'company' || user?.role === 'organization';

    if (isOwner && isOwnerRole) {
      console.log('✅ Owner previewing attachment');
      // Continue with preview
    } else {
      // For non-owners, check if they can view the tender
      const canViewTender = await tender.canUserView(user?._id, user?.role);

      if (!canViewTender) {
        console.log('❌ User not authorized to preview attachment:', {
          userId: user?._id,
          userRole: user?.role,
          tenderId: tender._id
        });
        return res.status(403).json({
          success: false,
          message: 'Not authorized to preview this attachment'
        });
      }
    }

    // Only allow preview for images and PDFs
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf'
    ];

    if (!allowedTypes.includes(attachment.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Preview not available for this file type'
      });
    }

    // ============ UNIVERSAL PATH RESOLUTION ============
    const uploadBase = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
    const filename = attachment.fileName || attachment.filename;
    const storedPath = attachment.path;

    if (!filename) {
      return res.status(404).json({
        success: false,
        message: 'Attachment has no filename'
      });
    }

    const possiblePaths = [
      path.join(uploadBase, 'tenders', filename),                 // priority 1: UPLOAD_BASE_PATH + tenders folder
      path.join('/app', 'uploads', 'tenders', filename),          // priority 2: Docker explicit
      path.join(process.cwd(), 'uploads', 'tenders', filename),   // priority 3: fallback
      path.join(uploadBase, filename),                            // priority 4: without tenders subdir
      (!isWindowsPath(storedPath) ? storedPath : null)            // priority 5: stored path only if Linux
    ].filter(Boolean);

    console.log('🔍 Searching for file in paths:', possiblePaths);

    let filePath = null;
    for (const candidate of possiblePaths) {
      if (candidate && fs.existsSync(candidate)) {
        filePath = candidate;
        console.log(`✅ Found file for preview at: ${filePath}`);
        break;
      }
    }

    if (!filePath) {
      console.error('❌ File not found for preview. Searched paths:', possiblePaths);
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    res.setHeader('Content-Type', attachment.mimetype);
    res.setHeader('Content-Length', attachment.size);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (attachment.mimetype === 'application/pdf') {
      res.setHeader('Content-Disposition', 'inline');
    }

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error previewing file'
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error('Error previewing attachment:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error previewing attachment',
        error: error.message
      });
    }
  }
};

// ============ INVITATION MANAGEMENT ============

// Helper function to handle invitations
const handleTenderInvitations = async (tender, invitations, invitingUser) => {
  const newInvitations = [];

  if (invitations.users && Array.isArray(invitations.users)) {
    for (const userId of invitations.users) {
      const user = await User.findById(userId);
      if (!user || user.role !== 'company') continue;

      const token = crypto.randomBytes(32).toString('hex');
      newInvitations.push({
        invitedUser: userId,
        invitationType: 'user',
        invitedBy: invitingUser._id,
        invitationStatus: 'pending',
        token: token,
        tokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      // Send invitation email
      try {
        await emailService.sendTenderInvitationEmail(
          user.email,
          user.name,
          tender,
          invitingUser
        );
      } catch (emailError) {
        console.error(`Failed to send invitation to ${user.email}:`, emailError);
      }
    }
  }

  if (invitations.companies && Array.isArray(invitations.companies)) {
    for (const companyId of invitations.companies) {
      const company = await Company.findById(companyId);
      if (!company) continue;

      const token = crypto.randomBytes(32).toString('hex');
      newInvitations.push({
        invitedCompany: companyId,
        invitationType: 'company',
        invitedBy: invitingUser._id,
        invitationStatus: 'pending',
        token: token,
        tokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      // Send invitations to company users
      const companyUsers = await User.find({
        _id: company.user,
        role: 'company'
      });

      for (const user of companyUsers) {
        try {
          await emailService.sendTenderInvitationEmail(
            user.email,
            user.name,
            tender,
            invitingUser
          );
        } catch (emailError) {
          console.error(`Failed to send invitation to ${user.email}:`, emailError);
        }
      }
    }
  }

  if (invitations.emails && Array.isArray(invitations.emails)) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const email of invitations.emails) {
      if (!emailRegex.test(email)) continue;

      const token = crypto.randomBytes(32).toString('hex');
      newInvitations.push({
        email: email.toLowerCase(),
        invitationType: 'email',
        invitedBy: invitingUser._id,
        invitationStatus: 'pending',
        token: token,
        tokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      // Send email invitation
      try {
        await emailService.sendTenderEmailInvitation(
          email,
          tender,
          invitingUser,
          token
        );
      } catch (emailError) {
        console.error(`Failed to send email invitation to ${email}:`, emailError);
      }
    }
  }

  tender.invitations = newInvitations;
  await tender.save();
};

// Invite users to tender
const inviteUsersToTender = async (req, res) => {
  try {
    const { users = [], companies = [], emails = [] } = req.body;

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if tender is professional and invite-only
    if (tender.tenderCategory !== 'professional' || tender.visibility.visibilityType !== 'invite_only') {
      return res.status(400).json({
        success: false,
        message: 'Only professional invite-only tenders can have invited users'
      });
    }

    // Check if user owns the tender
    if (tender.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to invite users to this tender'
      });
    }

    // Check if tender is still active
    // IMPORTANT: For closed tenders, status is 'locked', not 'published'
    if ((tender.status !== 'published' && tender.status !== 'locked') || tender.deadline <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot invite users to inactive or expired tender'
      });
    }

    // Handle invitations
    await handleTenderInvitations(tender, { users, companies, emails }, req.user);

    res.status(200).json({
      success: true,
      message: 'Invitations sent successfully',
      data: {
        stats: {
          users: users.length,
          companies: companies.length,
          emails: emails.length
        }
      }
    });
  } catch (error) {
    console.error('Error inviting users to tender:', error);
    res.status(500).json({
      success: false,
      message: 'Error inviting users to tender'
    });
  }
};

// Respond to invitation
const respondToInvitation = async (req, res) => {
  try {
    const { status } = req.body;

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    const inviteIndex = tender.invitations.findIndex(
      invite => invite._id.toString() === req.params.inviteId
    );

    if (inviteIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    const invite = tender.invitations[inviteIndex];

    // Check if current user is the invited user
    let isInvitedUser = false;

    if (invite.invitationType === 'user' && invite.invitedUser) {
      isInvitedUser = invite.invitedUser.toString() === req.user._id.toString();
    } else if (invite.invitationType === 'company' && invite.invitedCompany) {
      // Check if user belongs to invited company
      const userCompany = await Company.findOne({ user: req.user._id });
      isInvitedUser = userCompany && userCompany._id.toString() === invite.invitedCompany.toString();
    } else if (invite.invitationType === 'email') {
      // Check if email matches
      isInvitedUser = invite.email === req.user.email;
    }

    if (!isInvitedUser) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this invitation'
      });
    }

    // Check if invitation is still pending
    if (invite.invitationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invitation has already been responded to'
      });
    }

    // Check if tender is still active
    // IMPORTANT: For closed tenders, status is 'locked', not 'published'
    if ((tender.status !== 'published' && tender.status !== 'locked') || tender.deadline <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Tender is no longer active'
      });
    }

    // Update invitation status
    tender.invitations[inviteIndex].invitationStatus = status;
    tender.invitations[inviteIndex].respondedAt = new Date();
    await tender.save();

    // Send notification to tender owner
    if (status === 'accepted') {
      try {
        const owner = await User.findById(tender.owner);
        if (owner) {
          await emailService.sendInvitationAcceptedEmail(
            owner.email,
            owner.name,
            req.user.name || req.user.email,
            tender
          );
        }
      } catch (emailError) {
        console.error('Error sending acceptance notification:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: `Invitation ${status} successfully`,
      data: {
        invitation: tender.invitations[inviteIndex],
        tender: {
          _id: tender._id,
          title: tender.title,
          deadline: tender.deadline
        }
      }
    });
  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to invitation'
    });
  }
};

// Get user's invitations
const getMyInvitations = async (req, res) => {
  try {
    let invitationFilter = {};

    if (req.user.role === 'company') {
      // Get user's companies
      const userCompanies = await Company.find({ user: req.user._id });
      const companyIds = userCompanies.map(company => company._id);

      invitationFilter = {
        $or: [
          { 'invitations.invitedUser': req.user._id },
          { 'invitations.invitedCompany': { $in: companyIds } },
          { 'invitations.email': req.user.email }
        ]
      };
    } else if (req.user.role === 'freelancer') {
      // Freelancers should not get professional tender invitations
      return res.status(200).json({
        success: true,
        data: {
          tenders: [],
          stats: { total: 0 }
        }
      });
    }

    const tenders = await Tender.find({
      ...invitationFilter,
      'invitations.invitationStatus': 'pending',
      tenderCategory: 'professional',
      status: { $in: ['published', 'locked'] },
      deadline: { $gt: new Date() },
      isDeleted: false
    })
      .populate('owner', 'name email profilePhoto')
      .populate('ownerEntity', 'name logo industry verified description')
      .populate('invitations.invitedUser', 'name email profilePhoto')
      .populate('invitations.invitedCompany', 'name logo industry')
      .sort({ createdAt: -1 });

    // Add invitation status to each tender
    const tendersWithInvitationStatus = tenders.map(tender => {
      const tenderObj = tender.toObject();
      const userInvitations = tender.invitations.filter(invite => {
        if (invite.invitationType === 'user' && invite.invitedUser) {
          return invite.invitedUser.toString() === req.user._id.toString();
        }
        if (invite.invitationType === 'company' && invite.invitedCompany) {
          const companyIds = userCompanies ? userCompanies.map(c => c._id.toString()) : [];
          return companyIds.includes(invite.invitedCompany.toString());
        }
        if (invite.invitationType === 'email') {
          return invite.email === req.user.email;
        }
        return false;
      });

      tenderObj.userInvitation = userInvitations[0] || null;
      return tenderObj;
    });

    res.status(200).json({
      success: true,
      data: {
        tenders: tendersWithInvitationStatus,
        stats: {
          total: tendersWithInvitationStatus.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitations'
    });
  }
};

// ============ USER-SPECIFIC TENDER MANAGEMENT ============

// Get user's tenders
const getMyTenders = async (req, res) => {
  try {
    const query = {
      owner: req.user._id,
      isDeleted: false
    };

    const tenders = await Tender.find(query)
      .populate('ownerEntity', 'name logo industry verified description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { tenders }
    });
  } catch (error) {
    console.error('Error fetching user tenders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user tenders'
    });
  }
};

// Toggle save tender
const toggleSaveTender = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if user can view this tender
    const canView = await tender.canUserView(req.user._id, req.user.role);
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to save this tender'
      });
    }

    // Check if tender is active
    if (tender.status !== 'published' || tender.deadline <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot save an inactive or expired tender'
      });
    }

    const userId = req.user._id.toString();
    const isSaved = tender.metadata.savedBy.some(id => id.toString() === userId);

    if (isSaved) {
      // Remove from saved
      tender.metadata.savedBy = tender.metadata.savedBy.filter(id => id.toString() !== userId);
    } else {
      // Add to saved
      tender.metadata.savedBy.push(userId);
    }

    await tender.save();

    res.status(200).json({
      success: true,
      message: isSaved ? 'Tender removed from saved list' : 'Tender saved successfully',
      data: {
        saved: !isSaved,
        savedCount: tender.metadata.savedBy.length
      }
    });

  } catch (error) {
    console.error('Error saving tender:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving tender'
    });
  }
};

// Get saved tenders
const getSavedTenders = async (req, res) => {
  try {
    const tenders = await Tender.find({
      'metadata.savedBy': req.user._id,
      isDeleted: false,
      status: { $in: ['published', 'locked'] },
      deadline: { $gt: new Date() }
    })
      .populate('owner', 'name email profilePhoto')
      .populate('ownerEntity', 'name logo industry verified description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { tenders }
    });

  } catch (error) {
    console.error('Error fetching saved tenders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved tenders'
    });
  }
};

// ============ TENDER STATISTICS ============
const getTenderStats = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if user owns the tender or can view it
    const canViewStats = tender.owner.toString() === req.user._id.toString() ||
      req.user.role === 'admin' ||
      await tender.canUserView(req.user._id, req.user.role);

    if (!canViewStats) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view tender statistics'
      });
    }

    // Calculate days remaining
    const now = new Date();
    const deadline = new Date(tender.deadline);
    const daysRemaining = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));

    // Calculate application stats
    const proposals = tender.proposals || [];
    const submittedProposals = proposals.filter(p => p.status === 'submitted').length;
    const underReviewProposals = proposals.filter(p => p.status === 'under_review').length;
    const shortlistedProposals = proposals.filter(p => p.status === 'shortlisted').length;
    const acceptedProposals = proposals.filter(p => p.status === 'accepted').length;
    const rejectedProposals = proposals.filter(p => p.status === 'rejected').length;

    // Calculate sealed/revealed stats for closed tenders
    let sealedProposals = 0;
    let revealedProposals = 0;
    if (tender.workflowType === 'closed') {
      sealedProposals = proposals.filter(p => p.sealed).length;
      revealedProposals = proposals.filter(p => p.revealedAt).length;
    }

    // Calculate invitation stats
    const invitations = tender.invitations || [];
    const totalInvited = invitations.length;
    const acceptedInvitations = invitations.filter(i => i.invitationStatus === 'accepted').length;
    const pendingInvitations = invitations.filter(i => i.invitationStatus === 'pending').length;
    const declinedInvitations = invitations.filter(i => i.invitationStatus === 'declined').length;
    const expiredInvitations = invitations.filter(i => i.invitationStatus === 'expired').length;

    // Calculate CPO stats (if applicable)
    let cpoStats = null;
    if (tender.tenderCategory === 'professional' && tender.professionalSpecific) {
      const cpoRequired = tender.professionalSpecific.cpoRequired || false;
      let cpoSubmissions = 0;
      let cpoVerified = 0;
      let cpoPending = 0;

      // Count CPO submissions from proposals
      if (cpoRequired) {
        proposals.forEach(proposal => {
          if (proposal.cpoSubmission) {
            cpoSubmissions++;
            if (proposal.cpoSubmission.verified) {
              cpoVerified++;
            } else {
              cpoPending++;
            }
          }
        });
      }

      cpoStats = {
        required: cpoRequired,
        submissionsCount: cpoSubmissions,
        verifiedCount: cpoVerified,
        pendingCount: cpoPending
      };
    }

    // Prepare statistics
    const stats = {
      basic: {
        views: tender.metadata?.views || 0,
        savedCount: tender.metadata?.savedBy?.length || 0,
        daysRemaining: daysRemaining,
        isActive: tender.status === 'published' && deadline > now,
        isFreelance: tender.tenderCategory === 'freelance',
        isProfessional: tender.tenderCategory === 'professional',
        workflowType: tender.workflowType,
        status: tender.status,
        visibilityType: tender.visibility.visibilityType,
        createdAt: tender.createdAt,
        publishedAt: tender.publishedAt,
        deadline: tender.deadline
      },

      applications: {
        totalApplications: proposals.length,
        visibleApplications: tender.metadata?.visibleApplications || 0,
        submitted: submittedProposals,
        underReview: underReviewProposals,
        shortlisted: shortlistedProposals,
        accepted: acceptedProposals,
        rejected: rejectedProposals,
        sealed: sealedProposals,
        revealed: revealedProposals
      },

      invitations: {
        totalInvited: totalInvited,
        accepted: acceptedInvitations,
        pending: pendingInvitations,
        declined: declinedInvitations,
        expired: expiredInvitations
      },

      engagement: {
        updateCount: tender.metadata?.updateCount || 0,
        lastUpdatedAt: tender.metadata?.lastUpdatedAt,
        lastUpdatedBy: tender.metadata?.lastUpdatedBy
      },

      cpo: cpoStats
    };

    // Add financial stats for freelance tenders
    if (tender.tenderCategory === 'freelance' && tender.freelanceSpecific) {
      stats.financial = {
        budgetRange: tender.freelanceSpecific.budget,
        engagementType: tender.freelanceSpecific.engagementType,
        averageBid: proposals.length > 0
          ? proposals.reduce((sum, p) => sum + (p.bidAmount || 0), 0) / proposals.length
          : 0
      };
    }

    // Add procurement stats for professional tenders
    if (tender.tenderCategory === 'professional' && tender.professionalSpecific) {
      stats.procurement = {
        referenceNumber: tender.professionalSpecific.referenceNumber,
        procuringEntity: tender.professionalSpecific.procuringEntity,
        evaluationMethod: tender.professionalSpecific.evaluationMethod,
        financialCapacityRequired: !!tender.professionalSpecific.financialCapacity
      };
    }

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error fetching tender statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tender statistics'
    });
  }
};

// ============ CPO SUBMISSION MANAGEMENT ============

// @desc    Submit CPO for a tender
// @route   POST /api/v1/tender/:id/cpo/submit
// @access  Private (Company users)
const submitCPO = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if tender requires CPO
    if (!tender.professionalSpecific.cpoRequirement ||
      !tender.professionalSpecific.cpoRequirement.required) {
      return res.status(400).json({
        success: false,
        message: 'This tender does not require CPO'
      });
    }

    // Check if user is a company and has applied to the tender
    if (req.user.role !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'Only company users can submit CPO'
      });
    }

    // Check if company has submitted a proposal
    const hasProposal = tender.proposals.some(p =>
      p.applicant.toString() === req.user._id.toString() &&
      p.applicantRole === 'company'
    );

    if (!hasProposal) {
      return res.status(400).json({
        success: false,
        message: 'You must submit a proposal before submitting CPO'
      });
    }

    // Check if CPO submission deadline has passed
    const cpoDeadline = tender.professionalSpecific.cpoRequirement.submissionDeadline;
    if (new Date() > cpoDeadline) {
      return res.status(400).json({
        success: false,
        message: 'CPO submission deadline has passed'
      });
    }

    // Check if already submitted CPO
    const existingCPO = tender.professionalSpecific.cpoSubmissions.find(
      cpo => cpo.bidder.toString() === req.user._id.toString()
    );

    if (existingCPO) {
      return res.status(400).json({
        success: false,
        message: 'CPO already submitted for this tender'
      });
    }

    // Validate required fields
    const { cpoNumber, issuingBank, issueDate, expiryDate, amount, currency } = req.body;

    const requiredFields = ['cpoNumber', 'issuingBank', 'issueDate', 'expiryDate', 'amount', 'currency'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required CPO fields',
        missingFields: missingFields
      });
    }

    // Validate CPO file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CPO document is required'
      });
    }

    // Validate amount matches tender requirement
    const requiredAmount = tender.professionalSpecific.cpoRequirement.amount;
    if (amount < requiredAmount) {
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: `CPO amount must be at least ${requiredAmount} ${tender.professionalSpecific.cpoRequirement.currency}`
      });
    }

    // Validate expiry date
    const expiryDateObj = new Date(expiryDate);
    const issueDateObj = new Date(issueDate);
    const tenderDeadline = tender.deadline;

    if (expiryDateObj <= new Date()) {
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'CPO expiry date must be in the future'
      });
    }

    if (expiryDateObj < tenderDeadline) {
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'CPO must be valid until at least the tender deadline'
      });
    }

    // Check issuing bank against accepted banks if specified
    const acceptedBanks = tender.professionalSpecific.cpoRequirement.acceptedBanks;
    if (acceptedBanks && acceptedBanks.length > 0) {
      const bankAccepted = acceptedBanks.some(bank =>
        bank.bankName.toLowerCase().includes(issuingBank.toLowerCase()) ||
        issuingBank.toLowerCase().includes(bank.bankName.toLowerCase())
      );

      if (!bankAccepted) {
        // Clean up uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Issuing bank is not in the list of accepted banks',
          acceptedBanks: acceptedBanks.map(b => b.bankName)
        });
      }
    }

    // Calculate file hash
    const fileHash = calculateFileHash(req.file.path);

    // Create CPO submission
    const cpoSubmission = {
      bidder: req.user._id,
      bidderModel: 'Company',
      cpoNumber: cpoNumber.toUpperCase(),
      issuingBank: issuingBank.trim(),
      issueDate: issueDateObj,
      expiryDate: expiryDateObj,
      amount: parseFloat(amount),
      currency: currency,
      documentPath: req.file.path,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileHash: fileHash,
      status: 'submitted',
      submittedAt: new Date()
    };

    // Add CPO submission to tender
    tender.professionalSpecific.cpoSubmissions.push(cpoSubmission);
    await tender.save();

    // Add audit log
    await tender.addAuditLog('SUBMIT_CPO', req.user._id, {
      action: 'CPO submitted',
      data: {
        cpoNumber: cpoNumber,
        amount: amount,
        currency: currency,
        issuingBank: issuingBank
      }
    }, req.ip, req.headers['user-agent']);

    res.status(201).json({
      success: true,
      message: 'CPO submitted successfully',
      data: {
        cpoSubmission: {
          cpoNumber: cpoNumber,
          issuingBank: issuingBank,
          amount: amount,
          currency: currency,
          status: 'submitted',
          submittedAt: cpoSubmission.submittedAt
        }
      }
    });

  } catch (error) {
    console.error('Error submitting CPO:', error);

    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete CPO file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error submitting CPO',
      error: error.message
    });
  }
};

// @desc    Verify CPO submission
// @route   PUT /api/v1/tender/:id/cpo/:cpoId/verify
// @access  Private (Tender owner/Admin)
const verifyCPO = async (req, res) => {
  try {
    const { status, verificationNotes } = req.body;

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if user owns the tender or is admin
    if (tender.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify CPO'
      });
    }

    // Find CPO submission
    const cpoSubmission = tender.professionalSpecific.cpoSubmissions.id(req.params.cpoId);
    if (!cpoSubmission) {
      return res.status(404).json({
        success: false,
        message: 'CPO submission not found'
      });
    }

    // Update CPO status
    cpoSubmission.status = status;
    cpoSubmission.verificationNotes = verificationNotes;
    cpoSubmission.verifiedBy = req.user._id;
    cpoSubmission.verifiedAt = new Date();

    await tender.save();

    // Add audit log
    await tender.addAuditLog('VERIFY_CPO', req.user._id, {
      action: 'CPO verified',
      data: {
        cpoId: req.params.cpoId,
        status: status,
        bidder: cpoSubmission.bidder
      }
    }, req.ip, req.headers['user-agent']);

    // Send notification to bidder
    try {
      const bidder = await User.findById(cpoSubmission.bidder);
      if (bidder) {
        await emailService.sendCPOStatusEmail(
          bidder.email,
          bidder.name,
          tender,
          cpoSubmission,
          status,
          verificationNotes
        );
      }
    } catch (emailError) {
      console.error('Error sending CPO status email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: `CPO ${status} successfully`,
      data: {
        cpoSubmission: {
          _id: cpoSubmission._id,
          status: cpoSubmission.status,
          verificationNotes: cpoSubmission.verificationNotes,
          verifiedBy: req.user._id,
          verifiedAt: cpoSubmission.verifiedAt
        }
      }
    });

  } catch (error) {
    console.error('Error verifying CPO:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying CPO'
    });
  }
};

// @desc    Get CPO submissions for a tender
// @route   GET /api/v1/tender/:id/cpo
// @access  Private (Tender owner/Admin)
const getCPOSubmissions = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id)
      .populate('professionalSpecific.cpoSubmissions.bidder', 'name email profilePhoto')
      .populate('professionalSpecific.cpoSubmissions.verifiedBy', 'name email profilePhoto');

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if user owns the tender or is admin
    if (tender.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view CPO submissions'
      });
    }

    // If user is bidder, only show their own CPO
    if (req.user.role === 'company') {
      const userCPO = tender.professionalSpecific.cpoSubmissions.find(
        cpo => cpo.bidder.toString() === req.user._id.toString()
      );

      if (!userCPO) {
        return res.status(200).json({
          success: true,
          data: {
            cpoSubmissions: [],
            stats: {
              total: 0,
              submitted: 0,
              verified: 0,
              rejected: 0,
              expired: 0
            }
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          cpoSubmissions: [userCPO],
          stats: {
            total: 1,
            submitted: userCPO.status === 'submitted' ? 1 : 0,
            verified: userCPO.status === 'verified' ? 1 : 0,
            rejected: userCPO.status === 'rejected' ? 1 : 0,
            expired: userCPO.status === 'expired' ? 1 : 0
          }
        }
      });
    }

    // For tender owner/admin, show all CPO submissions
    const stats = {
      total: tender.professionalSpecific.cpoSubmissions.length,
      submitted: tender.professionalSpecific.cpoSubmissions.filter(c => c.status === 'submitted').length,
      verified: tender.professionalSpecific.cpoSubmissions.filter(c => c.status === 'verified').length,
      rejected: tender.professionalSpecific.cpoSubmissions.filter(c => c.status === 'rejected').length,
      expired: tender.professionalSpecific.cpoSubmissions.filter(c => c.status === 'expired').length
    };

    res.status(200).json({
      success: true,
      data: {
        cpoSubmissions: tender.professionalSpecific.cpoSubmissions,
        cpoRequirement: tender.professionalSpecific.cpoRequirement,
        stats: stats
      }
    });

  } catch (error) {
    console.error('Error fetching CPO submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching CPO submissions'
    });
  }
};

// @desc    Check CPO expiry (cron job)
// @route   POST /api/v1/tender/check-cpo-expiry
// @access  Private (Admin only)
const checkCPOExpiry = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can run CPO expiry check'
      });
    }

    const now = new Date();
    const tenders = await Tender.find({
      'professionalSpecific.cpoRequirement.required': true,
      'professionalSpecific.cpoSubmissions.status': { $in: ['submitted', 'verified'] },
      status: { $in: ['published', 'locked', 'deadline_reached'] }
    });

    let expiredCount = 0;
    const results = [];

    for (const tender of tenders) {
      for (const cpo of tender.professionalSpecific.cpoSubmissions) {
        if (cpo.expiryDate && cpo.expiryDate < now &&
          (cpo.status === 'submitted' || cpo.status === 'verified')) {

          cpo.status = 'expired';
          expiredCount++;

          results.push({
            tenderId: tender._id,
            tenderTitle: tender.title,
            cpoId: cpo._id,
            cpoNumber: cpo.cpoNumber,
            bidder: cpo.bidder,
            expiryDate: cpo.expiryDate
          });
        }
      }

      if (tender.professionalSpecific.cpoSubmissions.some(c => c.isModified())) {
        await tender.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `CPO expiry check completed. ${expiredCount} CPOs marked as expired.`,
      data: {
        expiredCount: expiredCount,
        results: results
      }
    });

  } catch (error) {
    console.error('Error checking CPO expiry:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking CPO expiry'
    });
  }
};

// ============ EXPORT ALL FUNCTIONS ============
module.exports = {
  // Category management
  getCategories,
  getCategoryLabel,

  // Tender creation
  createFreelanceTender,
  createProfessionalTender,

  // Tender management
  getTenders,
  getTender,
  updateTender,
  deleteTender,
  publishTender,
  getTenderStats,
  getProfessionalTenders,
  getFreelanceTenders,

  // User-specific
  getMyTenders,
  toggleSaveTender,
  getSavedTenders,

  // Invitation management
  inviteUsersToTender,
  respondToInvitation,
  getMyInvitations,

  //Download Mangment
  downloadAttachment,
  previewAttachment,
  // Workflow management
  revealProposals,
  // OwnerSpecifc
  getTenderForEditing,
  getOwnerTender,
  getOwnedTenders,
};