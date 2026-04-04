const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { uploadConfig } = require('../config/uploads');

/**
 * MAIN UPLOAD MIDDLEWARE
 * For general uploads (avatars, covers, general media)
 */

// Configure storage using centralized config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadType = 'general';
    
    // Determine upload type based on fieldname
    if (file.fieldname === 'avatar') {
      uploadType = 'avatars';
    } else if (file.fieldname === 'coverPhoto') {
      uploadType = 'covers';
    } else if (file.fieldname === 'media') {
      uploadType = 'general';
    }
    
    const uploadPath = uploadConfig.getPath(uploadType);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Enhanced file filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|mov|avi|mkv|webm/;
  const allowedDocumentTypes = /pdf|doc|docx|txt/;

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mimeType = file.mimetype;

  // Check by MIME type first, then by extension
  if (mimeType.startsWith('image/') && allowedImageTypes.test(ext)) {
    cb(null, true);
  } else if (mimeType.startsWith('video/') && allowedVideoTypes.test(ext)) {
    cb(null, true);
  } else if (mimeType.startsWith('application/') || mimeType === 'text/plain') {
    if (allowedDocumentTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid document type: ${ext}`), false);
    }
  } else {
    cb(new Error(`Invalid file type: ${mimeType}. Only images, videos, and documents are allowed.`), false);
  }
};

// Create multer instance
const createUpload = (config = {}) => {
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: config.fileSize || 50 * 1024 * 1024, // Default 50MB
      files: config.files || 10
    }
  });
};

// Specific upload configurations
const upload = createUpload();

// Avatar upload configuration (max 5MB)
const uploadAvatar = createUpload({
  fileSize: 5 * 1024 * 1024 // 5MB
}).single('avatar');

// Cover photo upload configuration (max 10MB)
const uploadCoverPhoto = createUpload({
  fileSize: 10 * 1024 * 1024 // 10MB
}).single('coverPhoto');

// Media upload configuration (max 50MB per file, max 10 files)
const uploadMedia = createUpload({
  fileSize: 50 * 1024 * 1024 // 50MB
}).array('media', 10);

// Document upload configuration (max 20MB per file)
const uploadDocument = createUpload({
  fileSize: 20 * 1024 * 1024 // 20MB
}).single('document');

// Process image metadata
const processImageMetadata = async (file) => {
  try {
    const image = sharp(file.path);
    const metadata = await image.metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      space: metadata.space,
      channels: metadata.channels,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      isProgressive: metadata.isProgressive,
      orientation: metadata.orientation
    };
  } catch (error) {
    console.error('Error processing image metadata:', error);
    return {};
  }
};

// Generate thumbnail for images
const generateThumbnail = async (file, width = 300, height = 300) => {
  try {
    if (!file.mimetype.startsWith('image/')) {
      return null;
    }

    const thumbnailsDir = uploadConfig.getPath('thumbnails');
    const fileName = path.basename(file.filename);
    const thumbnailPath = path.join('thumbnails', fileName);
    const fullThumbnailPath = path.join(thumbnailsDir, fileName);

    await sharp(file.path)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(fullThumbnailPath);

    return thumbnailPath;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
};

// Generate multiple thumbnail sizes
const generateThumbnails = async (file, sizes = [
  { width: 150, height: 150, suffix: 'sm' },
  { width: 300, height: 300, suffix: 'md' },
  { width: 600, height: 600, suffix: 'lg' }
]) => {
  try {
    if (!file.mimetype.startsWith('image/')) {
      return [];
    }

    const thumbnailsDir = uploadConfig.getPath('thumbnails');
    const thumbnails = [];
    const baseFileName = path.basename(file.filename, path.extname(file.filename));

    for (const size of sizes) {
      const thumbnailFileName = `${baseFileName}_${size.suffix}.jpg`;
      const thumbnailPath = path.join('thumbnails', thumbnailFileName);
      const fullThumbnailPath = path.join(thumbnailsDir, thumbnailFileName);

      await sharp(file.path)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(fullThumbnailPath);

      thumbnails.push({
        path: thumbnailPath,
        fullPath: fullThumbnailPath,
        url: uploadConfig.getUrl(thumbnailFileName, 'thumbnails'),
        width: size.width,
        height: size.height,
        suffix: size.suffix
      });
    }

    return thumbnails;
  } catch (error) {
    console.error('Error generating thumbnails:', error);
    return [];
  }
};

// Enhanced file upload function using centralized config
const uploadToCloudinary = async (file, folder = 'general') => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Determine file type
    let fileType = 'general';
    if (file.fieldname === 'avatar') {
      fileType = 'avatars';
    } else if (file.fieldname === 'coverPhoto') {
      fileType = 'covers';
    }

    // Generate thumbnails for images
    let thumbnails = [];
    let thumbnailUrl = null;

    if (file.mimetype.startsWith('image/')) {
      thumbnails = await generateThumbnails(file);
      if (thumbnails.length > 0) {
        // Use medium size as default thumbnail
        thumbnailUrl = thumbnails[1].url;
      }
    }

    // Generate file info using centralized config
    const fileInfo = uploadConfig.generateFileInfo(file, fileType);

    // Get image metadata if it's an image
    let metadata = {};
    if (file.mimetype.startsWith('image/')) {
      metadata = await processImageMetadata(file);
    }

    return {
      ...fileInfo,
      // Thumbnail URLs
      thumbnail: thumbnailUrl,
      // All thumbnails
      thumbnails: thumbnails,
      // Image metadata
      metadata,
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

// File size limit error handler
const fileSizeLimit = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
    if (err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many parts in the request.'
      });
    }
    if (err.code === 'LIMIT_FIELD_KEY') {
      return res.status(400).json({
        success: false,
        message: 'Field name too long.'
      });
    }
    if (err.code === 'LIMIT_FIELD_VALUE') {
      return res.status(400).json({
        success: false,
        message: 'Field value too long.'
      });
    }
    if (err.code === 'LIMIT_FIELD_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many fields in the request.'
      });
    }
  }

  if (err.message) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next(err);
};

// Validate file type middleware
const validateFileType = (allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        code: 'INVALID_FILE_TYPE'
      });
    }

    next();
  };
};

// Validate file size middleware
const validateFileSize = (maxSizeInMB = 5) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }

    const maxSize = maxSizeInMB * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum size is ${maxSizeInMB}MB`,
        code: 'FILE_TOO_LARGE'
      });
    }

    next();
  };
};

// Clean up uploaded files on error
const cleanupUploadedFiles = async (req) => {
  try {
    if (req.file) {
      uploadConfig.deleteFile(req.file.filename, getFileTypeFromFieldname(req.file.fieldname));
    }

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        uploadConfig.deleteFile(file.filename, getFileTypeFromFieldname(file.fieldname));
      }
    }
  } catch (error) {
    console.error('Error cleaning up uploaded files:', error);
  }
};

// Helper to determine file type from fieldname
const getFileTypeFromFieldname = (fieldname) => {
  if (fieldname === 'avatar') return 'avatars';
  if (fieldname === 'coverPhoto') return 'covers';
  return 'general';
};

// Helper function to generate file URL using centralized config
const generateFileUrl = (filename, type = 'general') => {
  return uploadConfig.getUrl(filename, type);
};

module.exports = {
  upload,
  uploadAvatar,
  uploadCoverPhoto,
  uploadMedia,
  uploadDocument,
  fileSizeLimit,
  uploadToCloudinary,
  processImageMetadata,
  generateThumbnail,
  generateThumbnails,
  validateFileType,
  validateFileSize,
  cleanupUploadedFiles,
  generateFileUrl,
  // Export uploadConfig for convenience
  uploadConfig
};