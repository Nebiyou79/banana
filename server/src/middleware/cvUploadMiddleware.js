const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadConfig } = require('../config/uploads');

/**
 * CV UPLOAD MIDDLEWARE
 * For CV/resume uploads
 */

// Configure storage using centralized config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = uploadConfig.getPath('cv');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    
    // Clean filename
    const baseName = path.basename(file.originalname, fileExtension)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    
    const filename = `cv-${baseName}-${uniqueSuffix}${fileExtension}`;
    console.log(`📁 Saving CV: ${filename}`);
    cb(null, filename);
  }
});

// File filter for CVs (PDF, DOC, DOCX)
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Please upload only PDF, DOC, or DOCX files.'), false);
  }
};

// Create multer instance for CV uploads
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  }
});

// Middleware for single CV upload
const uploadCV = upload.single('cv');

// Middleware for multiple CV uploads
const uploadMultipleCVs = upload.array('cvs', 10);

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 CVs allowed per upload.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Invalid file field.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  // For other errors
  console.error('Upload error:', error);
  return res.status(500).json({
    success: false,
    message: 'File upload failed.'
  });
};

// Helper function to get CV URL
const getCVUrl = (filename) => {
  return uploadConfig.getUrl(filename, 'cv');
};

// Process uploaded CV
const processUploadedCV = (file) => {
  if (!file) return null;
  
  return uploadConfig.generateFileInfo(file, 'cv');
};

// Delete CV file
const deleteCVFile = (filename) => {
  return uploadConfig.deleteFile(filename, 'cv');
};

module.exports = {
  upload,
  uploadCV,
  uploadMultipleCVs,
  handleUploadError,
  getCVUrl,
  processUploadedCV,
  deleteCVFile
};