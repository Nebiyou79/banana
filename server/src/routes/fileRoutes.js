// routes/fileRoutes.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/authMiddleware');
const cloudinaryStorageService = require('../services/cloudinaryStorageService');

const router = express.Router();

/**
 * Allowed public-access upload types
 * Now includes both local and Cloudinary sources
 */
const ALLOWED_FOLDERS = ['cv', 'applications', 'documents'];

/**
 * Helper: Check if URL is from Cloudinary
 */
const isCloudinaryUrl = (url) => {
  return url && typeof url === 'string' && url.includes('cloudinary.com');
};

/**
 * Helper: Extract Cloudinary public_id from URL
 */
const extractPublicIdFromUrl = (url) => {
  if (!isCloudinaryUrl(url)) return null;
  
  try {
    // Extract public_id from Cloudinary URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Cloudinary URL pattern: /v<version>/<cloud_name>/<resource_type>/upload/.../<public_id>
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex > -1 && uploadIndex < pathParts.length - 1) {
      // Get the part after 'upload' and remove file extension
      const publicIdWithExtension = pathParts.slice(uploadIndex + 1).join('/');
      return publicIdWithExtension.replace(/\.[^/.]+$/, '');
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting Cloudinary public_id:', error);
    return null;
  }
};

// ===============================
// DOWNLOAD FILE (Supports both local and Cloudinary)
// ===============================
router.get('/uploads/:folder/:filename', verifyToken, async (req, res) => {
  try {
    const { folder, filename } = req.params;
    const { userId, role } = req.user;

    console.log(`📥 File request: ${folder}/${filename} by ${userId} (${role})`);

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid folder'
      });
    }

    // Check if filename is actually a Cloudinary URL (encoded)
    const decodedFilename = decodeURIComponent(filename);
    
    if (isCloudinaryUrl(decodedFilename)) {
      // This is a Cloudinary URL - redirect to Cloudinary
      console.log('📁 Serving Cloudinary file:', decodedFilename);
      
      const publicId = extractPublicIdFromUrl(decodedFilename);
      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Cloudinary URL'
        });
      }
      
      // Get optimized download URL from Cloudinary
      const optimizedUrl = decodedFilename.replace('/upload/', '/upload/fl_attachment/');
      
      // Redirect to Cloudinary for download
      return res.redirect(optimizedUrl);
    }

    // Check if this is a request for a text content placeholder
    if (decodedFilename.match(/(reference|experience)-\d+-\d+\.txt/)) {
      // Handle text content (unchanged)
      const match = decodedFilename.match(/(reference|experience)-(\d+)-(\d+)\.txt/);
      const contentType = match[1];
      const index = Number(match[3]);

      let originalName, content;

      if (contentType === 'reference') {
        originalName = `Reference_Details_${index + 1}.txt`;
        content =
          `REFERENCE DETAILS\n\n` +
          `Reference Index: ${index + 1}\n` +
          `Generated on: ${new Date().toLocaleDateString()}\n\n` +
          `Provided via form submission.\n` +
          `Stored in application database.`;
      } else {
        originalName = `Work_Experience_${index + 1}.txt`;
        content =
          `WORK EXPERIENCE DETAILS\n\n` +
          `Experience Index: ${index + 1}\n` +
          `Generated on: ${new Date().toLocaleDateString()}\n\n` +
          `Provided via form submission.\n` +
          `Stored in application database.`;
      }

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Length', Buffer.byteLength(content));
      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
      res.setHeader('Cache-Control', 'private, max-age=3600');

      return res.send(content);
    }

    // Legacy local file serving (for backward compatibility)
    console.log('📁 Serving local file:', decodedFilename);
    
    // For backward compatibility, check if it's a local path
    const localFilePath = path.join(process.cwd(), 'uploads', folder, decodedFilename);
    
    if (!fs.existsSync(localFilePath)) {
      console.error(`❌ Local file not found: ${localFilePath}`);
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const ext = path.extname(decodedFilename).toLowerCase();
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
    const stats = fs.statSync(localFilePath);
    const originalName = req.query.originalName || decodedFilename;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    fs.createReadStream(localFilePath).pipe(res);
  } catch (error) {
    console.error('❌ File serving error:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving file'
    });
  }
});

// ===============================
// TEXT CONTENT (FORM-BASED) - Unchanged
// ===============================
router.get('/text-content/:type/:filename', verifyToken, async (req, res) => {
  try {
    const { filename } = req.params;

    const match = filename.match(/(reference|experience)-(\d+)-(\d+)\.txt/);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'Invalid text content filename'
      });
    }

    const contentType = match[1];
    const index = Number(match[3]);

    let originalName;
    let content;

    if (contentType === 'reference') {
      originalName = `Reference_Details_${index + 1}.txt`;
      content =
        `REFERENCE DETAILS\n\n` +
        `Reference Index: ${index + 1}\n` +
        `Generated on: ${new Date().toLocaleDateString()}\n\n` +
        `Provided via form submission.\n` +
        `Stored in application database.`;
    } else {
      originalName = `Work_Experience_${index + 1}.txt`;
      content =
        `WORK EXPERIENCE DETAILS\n\n` +
        `Experience Index: ${index + 1}\n` +
        `Generated on: ${new Date().toLocaleDateString()}\n\n` +
        `Provided via form submission.\n` +
        `Stored in application database.`;
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', Buffer.byteLength(content));
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    res.send(content);
  } catch (error) {
    console.error('❌ Text content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving text content'
    });
  }
});

// ===============================
// VIEW FILE INLINE (Supports both local and Cloudinary)
// ===============================
router.get('/uploads/:folder/view/:filename', verifyToken, async (req, res) => {
  try {
    const { folder, filename } = req.params;

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid folder'
      });
    }

    const decodedFilename = decodeURIComponent(filename);
    
    if (isCloudinaryUrl(decodedFilename)) {
      // Cloudinary file - redirect to optimized view URL
      console.log('📁 Viewing Cloudinary file inline:', decodedFilename);
      
      // For inline viewing, we can use the regular URL
      // Cloudinary serves appropriate Content-Type headers
      return res.redirect(decodedFilename);
    }

    // Legacy local file serving
    const localFilePath = path.join(process.cwd(), 'uploads', folder, decodedFilename);

    if (!fs.existsSync(localFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const ext = path.extname(decodedFilename).toLowerCase();
    const inlineTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.txt'];

    if (!inlineTypes.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: 'File type cannot be viewed inline'
      });
    }

    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain'
    };

    const stats = fs.statSync(localFilePath);

    res.setHeader('Content-Type', mimeTypes[ext]);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${decodedFilename}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    fs.createReadStream(localFilePath).pipe(res);
  } catch (error) {
    console.error('❌ Inline view error:', error);
    res.status(500).json({
      success: false,
      message: 'Error viewing file'
    });
  }
});

// ===============================
// DIRECT CLOUDINARY DOWNLOAD ENDPOINT
// ===============================
router.get('/cloudinary/download/:publicId', verifyToken, async (req, res) => {
  try {
    const { publicId } = req.params;
    const { format, filename } = req.query;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    // Import Cloudinary config
    const { cloudinary } = require('../config/cloudinary');
    
    // Generate download URL with attachment flag
    const downloadUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      attachment: true,
      filename: filename || 'download',
      format: format || 'auto'
    });

    console.log(`📥 Cloudinary download: ${publicId} -> ${downloadUrl}`);
    
    // Redirect to Cloudinary download URL
    return res.redirect(downloadUrl);
  } catch (error) {
    console.error('❌ Cloudinary download error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating download URL'
    });
  }
});

// ===============================
// FILE INFO ENDPOINT (for checking file existence)
// ===============================
router.get('/file-info/:folder/:filename', verifyToken, async (req, res) => {
  try {
    const { folder, filename } = req.params;
    const decodedFilename = decodeURIComponent(filename);

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid folder'
      });
    }

    if (isCloudinaryUrl(decodedFilename)) {
      // Cloudinary file info
      const publicId = extractPublicIdFromUrl(decodedFilename);
      
      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Cloudinary URL'
        });
      }

      // Try to get file info from Cloudinary mapping
      const fileInfo = cloudinaryStorageService.getFileInfo(publicId);
      
      if (fileInfo) {
        return res.json({
          success: true,
          exists: true,
          source: 'cloudinary',
          fileInfo: {
            originalName: fileInfo.originalName,
            size: fileInfo.size,
            uploadedAt: fileInfo.uploadedAt,
            backupExists: fileInfo.backupExists
          },
          cloudinaryUrl: decodedFilename
        });
      }

      // File exists in Cloudinary but not in our mapping
      return res.json({
        success: true,
        exists: true,
        source: 'cloudinary',
        cloudinaryUrl: decodedFilename,
        message: 'File exists in Cloudinary'
      });
    }

    // Check local file
    const localFilePath = path.join(process.cwd(), 'uploads', folder, decodedFilename);
    const exists = fs.existsSync(localFilePath);

    if (exists) {
      const stats = fs.statSync(localFilePath);
      return res.json({
        success: true,
        exists: true,
        source: 'local',
        fileInfo: {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        }
      });
    }

    return res.json({
      success: true,
      exists: false,
      source: 'unknown',
      message: 'File not found'
    });
  } catch (error) {
    console.error('❌ File info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking file info'
    });
  }
});

module.exports = router;