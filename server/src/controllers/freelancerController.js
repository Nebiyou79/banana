const User = require('../models/User');

// Get user's portfolio
exports.getPortfolio = async (req, res) => {
  try {
    console.log('Getting portfolio for user:', req.user._id);
    
    // FIX: Use req.user._id instead of req.user.userId
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

// Add portfolio item
exports.addPortfolioItem = async (req, res) => {
  try {
    const { title, description, mediaUrl } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    console.log('Adding portfolio item for user:', req.user._id);
    
    // FIX: Use req.user._id instead of req.user.userId
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          portfolio: { title, description, mediaUrl }
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

// Update portfolio item
exports.updatePortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, mediaUrl } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    console.log('Updating portfolio item:', id, 'for user:', req.user._id);
    
    // FIX: Use req.user._id instead of req.user.userId
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, 'portfolio._id': id },
      {
        $set: {
          'portfolio.$.title': title,
          'portfolio.$.description': description,
          'portfolio.$.mediaUrl': mediaUrl
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
    
    // FIX: Use req.user._id instead of req.user.userId
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