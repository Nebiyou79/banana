// routes/fileRoutes.js - ENHANCED VERSION WITH TEXT CONTENT SUPPORT
const express = require('express');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/authMiddleware');
const Application = require('../models/Application');

const router = express.Router();

// Serve uploaded files
router.get('/uploads/:folder/:filename', verifyToken, async (req, res) => {
  try {
    const { folder, filename } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    console.log(`📥 File request: ${folder}/${filename} by user ${userId} (${userRole})`);

    // Allow only specific folders for security
    const allowedFolders = ['cv', 'applications'];
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid folder'
      });
    }

    // Construct file path
    const filePath = path.join(process.cwd(), 'public', 'uploads', folder, filename);
    
    console.log(`📁 Looking for file: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // SIMPLE PERMISSION: Any authenticated user can access files
    console.log(`✅ Permission granted for ${folder}/${filename}`);

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg', 
      '.png': 'image/png',
      '.txt': 'text/plain'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    const stats = fs.statSync(filePath);
    
    // Set proper filename for download
    const originalName = req.query.originalName || filename;
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('❌ File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });

  } catch (error) {
    console.error('❌ File serving error:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving file'
    });
  }
});

// NEW: Serve text content for form-based references and experience
router.get('/text-content/:type/:filename', verifyToken, async (req, res) => {
  try {
    const { type, filename } = req.params;
    
    console.log(`📝 Text content request: ${type}/${filename}`);

    // Extract the index from filename (format: reference-1234567890-0.txt)
    const match = filename.match(/(reference|experience)-(\d+)-(\d+)\.txt/);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'Invalid text content filename'
      });
    }

    const contentType = match[1]; // 'reference' or 'experience'
    const timestamp = match[2];
    const index = parseInt(match[3]);

    // In a real implementation, you would fetch this from the database
    // For now, we'll create the content dynamically
    
    let content = '';
    let originalName = '';

    if (contentType === 'reference') {
      originalName = `Reference_Details_${index + 1}.txt`;
      content = `REFERENCE DETAILS\n\n` +
                `This is a dynamically generated reference document.\n` +
                `Reference Index: ${index + 1}\n` +
                `Generated on: ${new Date().toLocaleDateString()}\n\n` +
                `Note: This reference was provided via form submission.\n` +
                `The detailed reference information is stored in the application data.`;
    } else if (contentType === 'experience') {
      originalName = `Work_Experience_${index + 1}.txt`;
      content = `WORK EXPERIENCE DETAILS\n\n` +
                `This is a dynamically generated experience document.\n` +
                `Experience Index: ${index + 1}\n` +
                `Generated on: ${new Date().toLocaleDateString()}\n\n` +
                `Note: This work experience was provided via form submission.\n` +
                `The detailed experience information is stored in the application data.`;
    }

    // Set headers for text file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', Buffer.byteLength(content));
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Send the content
    res.send(content);

  } catch (error) {
    console.error('❌ Text content serving error:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving text content'
    });
  }
});

// View file inline (for PDFs, images)
router.get('/uploads/:folder/view/:filename', verifyToken, async (req, res) => {
  try {
    const { folder, filename } = req.params;
    
    console.log(`👁️ File view request: ${folder}/${filename}`);

    // Allow only specific folders
    const allowedFolders = ['cv', 'applications'];
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid folder'
      });
    }

    // Construct file path
    const filePath = path.join(process.cwd(), 'public', 'uploads', folder, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if file can be viewed inline
    const ext = path.extname(filename).toLowerCase();
    const inlineTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.txt'];
    
    if (!inlineTypes.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: 'File type cannot be viewed inline'
      });
    }

    // Set headers for inline viewing
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    const stats = fs.statSync(filePath);
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('❌ File viewing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error viewing file'
    });
  }
});

module.exports = router;