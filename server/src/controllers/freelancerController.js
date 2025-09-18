const User = require('../models/User');

// Get user's portfolio
exports.getPortfolio = async (req, res) => {
  try {
    console.log('Getting portfolio for user:', req.user._id);
    
    const user = await User.findById(req.user._id).select('portfolio');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('Found user portfolio:', user.portfolio);
    res.status(200).json({ success: true, data: user.portfolio });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add portfolio item with enhanced fields
exports.addPortfolioItem = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      mediaUrl, 
      projectUrl, 
      category, 
      technologies, 
      budget, 
      duration, 
      client, 
      completionDate 
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    console.log('Adding portfolio item for user:', req.user._id, 'with data:', req.body);
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          portfolio: { 
            title, 
            description, 
            mediaUrl,
            projectUrl,
            category,
            technologies,
            budget,
            duration,
            client,
            completionDate
          }
        }
      },
      { new: true, runValidators: true }
    ).select('portfolio');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newItem = user.portfolio[user.portfolio.length - 1];
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    console.error('Add portfolio item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update portfolio item with enhanced fields
exports.updatePortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      mediaUrl, 
      projectUrl, 
      category, 
      technologies, 
      budget, 
      duration, 
      client, 
      completionDate 
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    console.log('Updating portfolio item:', id, 'for user:', req.user._id, 'with data:', req.body);
    
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, 'portfolio._id': id },
      {
        $set: {
          'portfolio.$.title': title,
          'portfolio.$.description': description,
          'portfolio.$.mediaUrl': mediaUrl,
          'portfolio.$.projectUrl': projectUrl,
          'portfolio.$.category': category,
          'portfolio.$.technologies': technologies,
          'portfolio.$.budget': budget,
          'portfolio.$.duration': duration,
          'portfolio.$.client': client,
          'portfolio.$.completionDate': completionDate,
          'portfolio.$.updatedAt': new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('portfolio');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const updatedItem = user.portfolio.find(item => item._id.toString() === id);
    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    console.error('Update portfolio item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete portfolio item
exports.deletePortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Deleting portfolio item:', id, 'for user:', req.user._id);
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: {
          portfolio: { _id: id }
        }
      },
      { new: true }
    ).select('portfolio');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'Item deleted successfully', data: user.portfolio });
  } catch (error) {
    console.error('Delete portfolio item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// UPDATE FREELANCER PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, location, phone, website, skills } = req.body;

    console.log('Updating profile for user:', req.user._id, 'with data:', req.body);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        bio,
        location,
        phone,
        website,
        skills,
        profileCompleted: true
      },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: user 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET FREELANCER PROFILE
exports.getProfile = async (req, res) => {
  try {
    console.log('Getting profile for user:', req.user._id);

    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('Getting dashboard stats for user:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .select('portfolio bio skills name location phone website profileCompleted');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate profile completeness based on your User model fields
    const profileFields = ['name', 'bio', 'skills', 'location', 'phone', 'website'];
    const completedFields = profileFields.filter(field => {
      if (field === 'skills') return user[field] && user[field].length > 0;
      if (field === 'name') return user[field] && user[field].trim().length > 0;
      return user[field] && user[field].toString().trim().length > 0;
    });
    
    const profileCompleteness = Math.round((completedFields.length / profileFields.length) * 100);

    const stats = {
      portfolioItems: user.portfolio?.length || 0,
      profileCompleteness: user.profileCompleted ? 100 : profileCompleteness,
      activeProposals: 0, // You don't have proposals yet
    };

    console.log('Dashboard stats:', stats);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get recent activities from portfolio
exports.getRecentActivities = async (req, res) => {
  try {
    console.log('Getting recent activities for user:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .select('portfolio')
      .sort({ 'portfolio.createdAt': -1 });

    // Create activities from portfolio items (last 5)
    const portfolioActivities = user.portfolio?.slice(0, 5).map(item => ({
      id: item._id,
      type: 'portfolio',
      title: `Added portfolio item: ${item.title}`,
      description: item.description || 'No description provided',
      timestamp: item.createdAt,
      status: 'success'
    })) || [];

    res.status(200).json({ success: true, data: portfolioActivities });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get portfolio count
exports.getPortfolioCount = async (req, res) => {
  try {
    console.log('Getting portfolio count for user:', req.user._id);
    
    const user = await User.findById(req.user._id).select('portfolio');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ 
      success: true, 
      data: user.portfolio?.length || 0 
    });
  } catch (error) {
    console.error('Portfolio count error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};