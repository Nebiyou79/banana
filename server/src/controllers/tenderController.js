const Tender = require('../models/Tender');
const Company = require('../models/Company');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Create a new tender
// @route   POST /api/v1/tender
// @access  Private (Company)
exports.createTender = async (req, res) => {
  console.log('--- [createTender] called ---');
  
  try {
    // Basic validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      category,
      skillsRequired,
      budget,
      deadline,
      duration,
      visibility = 'public',
      invitedFreelancers = [],
      requirements = {},
      status = 'draft'
    } = req.body;

    console.log('Creating tender with data:', {
      title,
      category,
      budget,
      deadline,
      duration,
      status,
      user: req.user
    });

    // Check if user has a company
    const company = await Company.findOne({ user: req.user.userId });
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'You need to create a company profile first'
      });
    }

    // Validate deadline is in future
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be in the future'
      });
    }

    // Create tender with optional budget and duration
    const tenderData = {
      title: title.trim(),
      description: description.trim(),
      category,
      skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : [],
      deadline: deadlineDate,
      visibility,
      status,
      invitedFreelancers: Array.isArray(invitedFreelancers) ? invitedFreelancers : [],
      requirements: {
        experienceLevel: requirements.experienceLevel || 'intermediate',
        location: requirements.location || 'anywhere',
        specificLocation: requirements.specificLocation || '',
        languageRequirements: requirements.languageRequirements || []
      },
      company: company._id,
      createdBy: req.user.userId
    };

    // Add budget if provided
    if (budget) {
      tenderData.budget = {
        min: Number(budget.min) || 0,
        max: Number(budget.max) || 0,
        currency: budget.currency || 'ETB',
        isNegotiable: budget.isNegotiable || false
      };
    }

    // Add duration if provided
    if (duration) {
      tenderData.duration = Number(duration) || 30;
    }

    const tender = new Tender(tenderData);
    await tender.save();
    
    // Populate company details for response
    await tender.populate('company', 'name logo industry verified');

    console.log('Tender created successfully:', tender._id);

    res.status(201).json({
      success: true,
      message: 'Tender created successfully',
      data: { tender }
    });

  } catch (error) {
    console.error('Create tender error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Tender with similar details already exists'
      });
    }

    // Handle validation errors
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
      message: 'Internal server error while creating tender',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all tenders with filtering and pagination
// @route   GET /api/v1/tender
// @access  Public (with role-based filtering)
exports.getTenders = async (req, res) => {
  console.log('--- [getTenders] called ---');
  
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minBudget,
      maxBudget,
      skills,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    // Only apply status filter for non-company users
    if (req.user?.role !== 'company' && req.user?.role !== 'admin') {
      // Show both 'published' AND 'open' tenders to public
      filter.status = { $in: ['published', 'open'] };
      filter.deadline = { $gt: new Date() };
    } else if (status) {
      // Company users can filter by specific status if provided
      filter.status = status;
    }
    // If company user and no status filter, show all statuses

    console.log('🔍 Filter being applied:', filter);

    // Rest of your existing filter logic...
    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.min = { $gte: Number(minBudget) };
      if (maxBudget) filter.budget.max = { $lte: Number(maxBudget) };
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
      filter.skillsRequired = { 
        $in: skillsArray.map(skill => new RegExp(skill.trim(), 'i')) 
      };
    }

    // Execute query with pagination
    const tenders = await Tender.find(filter)
      .populate('company', 'name logo industry verified')
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Tender.countDocuments(filter);

    console.log(`✅ Found ${tenders.length} tenders matching filters`);

    res.json({
      success: true,
      data: tenders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching tenders'
    });
  }
};

// @desc    Get single tender
// @route   GET /api/v1/tender/:id
// @access  Public
exports.getTender = async (req, res) => {
  console.log('--- [getTender] called ---', req.params.id);
  
  try {
    // Validate ID format
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Valid tender ID is required'
      });
    }

    const tender = await Tender.findById(req.params.id)
      .populate('company', 'name logo industry description website verified')
      .populate('createdBy', 'name email')
      .populate('proposals.freelancer', 'name email skills profilePhoto');

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Increment views
    await tender.incrementViews();

    // For freelancers, hide proposal details from other freelancers
    if (req.user?.role === 'freelancer') {
      const modifiedTender = tender.toObject();
      modifiedTender.proposals = modifiedTender.proposals.map(proposal => {
        if (proposal.freelancer._id.toString() !== req.user.userId.toString()) {
          return {
            _id: proposal._id,
            freelancer: {
              _id: proposal.freelancer._id,
              name: proposal.freelancer.name
            },
            status: proposal.status,
            submittedAt: proposal.submittedAt,
            // Hide sensitive information
            bidAmount: undefined,
            proposalText: undefined,
            attachments: undefined,
            companyNotes: undefined
          };
        }
        return proposal;
      });
      
      return res.json({
        success: true,
        data: { tender: modifiedTender }
      });
    }

    res.json({
      success: true,
      data: { tender }
    });

  } catch (error) {
    console.error('Get tender error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching tender'
    });
  }
};

// @desc    Update tender
// @route   PUT /api/v1/tender/:id
// @access  Private (Company - owner only)
exports.updateTender = async (req, res) => {
  console.log('--- [updateTender] called ---', req.params.id);
  
  try {
    // Validate ID format
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Valid tender ID is required'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if user owns the tender - FIXED: populate company first
    const company = await Company.findOne({ user: req.user.userId });
    if (!company || tender.company.toString() !== company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this tender'
      });
    }

    // Cannot update if there are already proposals and trying to change to draft
    if (tender.proposals.length > 0 && req.body.status === 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status to draft when proposals exist'
      });
    }

    const allowedUpdates = [
      'title', 'description', 'category', 'skillsRequired', 'budget',
      'deadline', 'duration', 'visibility', 'invitedFreelancers',
      'requirements', 'status'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        tender[field] = req.body[field];
      }
    });

    // Validate deadline if being updated
    if (req.body.deadline) {
      const newDeadline = new Date(req.body.deadline);
      if (newDeadline <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Deadline must be in the future'
        });
      }
      tender.deadline = newDeadline;
    }

    await tender.save();
    await tender.populate('company', 'name logo industry verified');

    console.log('Tender updated successfully:', tender._id);

    res.json({
      success: true,
      message: 'Tender updated successfully',
      data: { tender }
    });

  } catch (error) {
    console.error('Update tender error:', error);
    
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
      message: 'Internal server error while updating tender'
    });
  }
};

// @desc    Delete tender
// @route   DELETE /api/v1/tender/:id
// @access  Private (Company - owner only)
exports.deleteTender = async (req, res) => {
  console.log('--- [deleteTender] called ---', req.params.id);
  
  try {
    // Validate ID format
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Valid tender ID is required'
      });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if user owns the tender - FIXED: populate company first
    const company = await Company.findOne({ user: req.user.userId });
    if (!company || tender.company.toString() !== company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this tender'
      });
    }

    // Cannot delete if there are proposals
    if (tender.proposals.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tender with existing proposals'
      });
    }

    await Tender.findByIdAndDelete(req.params.id);

    console.log('Tender deleted successfully:', req.params.id);

    res.json({
      success: true,
      message: 'Tender deleted successfully'
    });

  } catch (error) {
    console.error('Delete tender error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting tender'
    });
  }
};

// @desc    Get company's tenders
// @route   GET /api/v1/tender/company/my-tenders
// @access  Private (Company)
exports.getMyTenders = async (req, res) => {
  console.log('--- [getMyTenders] called ---');
  
  try {
    const company = await Company.findOne({ user: req.user.userId });
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    const tenders = await Tender.find({ company: company._id })
      .populate('company', 'name logo industry verified')
      .sort({ createdAt: -1 });

    console.log(`Found ${tenders.length} tenders for company ${company.name}`);

    res.json({
      success: true,
      data: { tenders }
    });

  } catch (error) {
    console.error('Get my tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching company tenders'
    });
  }
};

// @desc    Save/unsave tender
// @route   POST /api/v1/tender/:id/save
// @access  Private (Freelancer)
exports.toggleSaveTender = async (req, res) => {
  console.log('--- [toggleSaveTender] called ---', req.params.id);
  
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if tender is published and active
    if (tender.status !== 'published' || tender.deadline < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot save an inactive or expired tender'
      });
    }

    const isSaved = tender.metadata.savedBy.includes(req.user.userId);

    if (isSaved) {
      tender.metadata.savedBy.pull(req.user.userId);
    } else {
      tender.metadata.savedBy.push(req.user.userId);
    }

    await tender.save();

    console.log(`Tender ${isSaved ? 'unsaved' : 'saved'} by user ${req.user.userId}`);

    res.json({
      success: true,
      message: isSaved ? 'Tender removed from saved list' : 'Tender saved successfully',
      data: { 
        saved: !isSaved,
        tenderId: tender._id,
        totalSaves: tender.metadata.savedBy.length 
      }
    });

  } catch (error) {
    console.error('Toggle save tender error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while saving tender'
    });
  }
};

// @desc    Get saved tenders
// @route   GET /api/v1/tender/saved
// @access  Private (Freelancer)
exports.getSavedTenders = async (req, res) => {
  console.log('--- [getSavedTenders] called ---');
  
  try {
    const tenders = await Tender.find({
      'metadata.savedBy': req.user.userId,
      status: 'published',
      deadline: { $gt: new Date() }
    })
    .populate('company', 'name logo industry verified')
    .sort({ createdAt: -1 });

    console.log(`Found ${tenders.length} saved tenders for user ${req.user.userId}`);

    res.json({
      success: true,
      data: { tenders }
    });

  } catch (error) {
    console.error('Get saved tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching saved tenders'
    });
  }
};