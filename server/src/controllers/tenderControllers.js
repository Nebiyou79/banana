// controllers/tenderController.js
const Tender = require('../models/Tender');

// Create a new tender
exports.createTender = async (req, res) => {
  try {
    if (!req.user.company) {
      return res.status(400).json({
        success: false,
        message: 'You must be associated with a company to create a tender.',
      });
    }

    // Validate deadline is in the future
    if (new Date(req.body.deadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be a future date.',
      });
    }

    // Validate budget is positive
    if (req.body.budget <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be a positive value.',
      });
    }

    const tender = await Tender.create({
      ...req.body,
      createdBy: req.user._id,
      company: req.user.company,
    });

    // Populate the created tender
    const populatedTender = await Tender.findById(tender._id)
      .populate('company', 'name logo')
      .populate('createdBy', 'name email avatar');

    res.status(201).json({ 
      success: true, 
      message: 'Tender created successfully',
      data: populatedTender 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get all tenders with filtering, sorting and pagination
exports.getTenders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      status,
      minBudget,
      maxBudget,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    
    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = Number(minBudget);
      if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const tenders = await Tender.find(filter)
      .populate('company', 'name logo industry')
      .populate('createdBy', 'name email avatar')
      .sort(sort)
      .limit(limit * 1)
      .skip(skip);

    const total = await Tender.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: tenders,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit),
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get single tender
exports.getTender = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id)
      .populate('company', 'name logo industry description website')
      .populate('createdBy', 'name email avatar role');

    if (!tender) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tender not found' 
      });
    }

    res.json({ 
      success: true, 
      data: tender 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Update tender - FIXED
exports.updateTender = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    
    if (!tender) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tender not found' 
      });
    }

    // FIX: Extract the ID from the populated company object
    const userCompanyId = req.user.company._id ? req.user.company._id.toString() : req.user.company.toString();
    const tenderCompanyId = tender.company.toString();
    
    console.log('FIXED - User Company ID:', userCompanyId);
    console.log('FIXED - Tender Company ID:', tenderCompanyId);
    console.log('FIXED - Are they equal?', userCompanyId === tenderCompanyId);

    // Check if user owns this tender or is admin
    if (userCompanyId !== tenderCompanyId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this tender' 
      });
    }

    // Prevent updating certain fields
    const { company, createdBy, ...updateData } = req.body;
    
    const updatedTender = await Tender.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    )
      .populate('company', 'name logo')
      .populate('createdBy', 'name email avatar');

    res.json({ 
      success: true, 
      message: 'Tender updated successfully',
      data: updatedTender 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Apply the same fix to deleteTender
exports.deleteTender = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    
    if (!tender) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tender not found' 
      });
    }

    // FIX: Extract the ID from the populated company object
    const userCompanyId = req.user.company._id ? req.user.company._id.toString() : req.user.company.toString();
    const tenderCompanyId = tender.company.toString();
    
    // Check if user owns this tender or is admin
    if (userCompanyId !== tenderCompanyId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this tender' 
      });
    }

    await Tender.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: 'Tender deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};


// Get tenders by company
exports.getCompanyTenders = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { status } = req.query;
    
    const filter = { company: companyId };
    if (status && status !== 'all') filter.status = status;
    
    const tenders = await Tender.find(filter)
      .populate('company', 'name logo')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tenders
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};