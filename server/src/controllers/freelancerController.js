const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Get current user's portfolio
// @route   GET /api/freelancer/portfolio
// @access  Private (Freelancer)
exports.getPortfolio = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('portfolio');
    res.status(200).json({ success: true, portfolio: user.portfolio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Add a new portfolio item
// @route   POST /api/freelancer/portfolio
// @access  Private (Freelancer)
exports.addPortfolioItem = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const imageUrl = `/uploads/portfolio/${req.file.filename}`;
    const { title, description, url, skills } = req.body;
    const skillsArray = skills ? skills.split(',').map(skill => skill.trim()) : [];

    const newItem = { title, description, url, image: imageUrl, skills: skillsArray };

    const user = await User.findById(req.user.userId);
    user.portfolio.push(newItem);
    await user.save();

    res.status(201).json({ success: true, portfolioItem: newItem });
  } catch (error) {
    console.error(error);
    if (req.file) {
      fs.unlink(req.file.path, (err) => { if (err) console.error(err); });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a portfolio item
// @route   PUT /api/freelancer/portfolio/:itemId
// @access  Private (Freelancer)
exports.updatePortfolioItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { title, description, url, skills } = req.body;
    let updateData = { title, description, url, skills };

    const user = await User.findById(req.user.userId);
    const itemToUpdate = user.portfolio.id(itemId);

    if (!itemToUpdate) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }

    if (req.file) {
      // Delete old image
      if (itemToUpdate.image) {
        const oldImagePath = path.join(process.cwd(), 'public', itemToUpdate.image);
        fs.unlink(oldImagePath, (err) => { if (err) console.error("Error deleting old image:", err); });
      }
      
      const newImageUrl = `/uploads/portfolio/${req.file.filename}`;
      updateData.image = newImageUrl;
    }

    itemToUpdate.set(updateData);
    await user.save();

    res.status(200).json({ success: true, portfolioItem: itemToUpdate });
  } catch (error) {
    console.error(error);
    if (req.file) {
      fs.unlink(req.file.path, (err) => { if (err) console.error(err); });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a portfolio item
// @route   DELETE /api/freelancer/portfolio/:itemId
// @access  Private (Freelancer)
exports.deletePortfolioItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const user = await User.findById(req.user.userId);
    const itemToDelete = user.portfolio.id(itemId);

    if (!itemToDelete) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }

    // Delete associated image
    if (itemToDelete.image) {
      const imagePath = path.join(process.cwd(), 'public', itemToDelete.image);
      fs.unlink(imagePath, (err) => { if (err) console.error("Error deleting image:", err); });
    }

    itemToDelete.deleteOne();
    await user.save();

    res.status(200).json({ success: true, message: 'Portfolio item deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};