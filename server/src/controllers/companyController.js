const Company = require('../models/Company');
const User = require('../models/User');

// @desc    Create a new company
// @route   POST /api/companies
// @access  Private (Company/Organization role)
exports.createCompany = async (req, res) => {
  try {
    const { name, tin, industry, description } = req.body;

    // Check if company with same name or TIN already exists
    const existingCompany = await Company.findOne({
      $or: [{ name }, { tin }]
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this name or TIN already exists'
      });
    }

    const company = new Company({
      name,
      tin,
      industry,
      description,
      createdBy: req.user.userId
    });

    await company.save();

    // Add company to user's profile
    await User.findByIdAndUpdate(req.user.userId, {
      company: company._id
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: { company }
    });

  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get company profile
// @route   GET /api/companies/:id
// @access  Public
exports.getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('employees', 'name email role');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: { company }
    });

  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update company profile
// @route   PUT /api/companies/:id
// @access  Private (Company Admin)
exports.updateCompanyProfile = async (req, res) => {
  try {
    const { name, industry, description } = req.body;

    // Check if user is the creator of the company
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (company.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this company'
      });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      { name, industry, description },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Company profile updated successfully',
      data: { company: updatedCompany }
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};