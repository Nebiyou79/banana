const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Configure storage - FIXED to use proper directory structure
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Always use public/uploads as base directory
    const baseDir = path.join(process.cwd(), 'public', 'uploads');
    
    let uploadPath = baseDir;
    
    // Create subdirectories based on file type
    if (file.fieldname === 'avatar') {
      uploadPath = path.join(baseDir, 'avatars');
    } else if (file.fieldname === 'coverPhoto') {
      uploadPath = path.join(baseDir, 'covers');
    } else if (file.fieldname === 'media') {
      uploadPath = path.join(baseDir, 'general');
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`✅ Created upload directory: ${uploadPath}`);
    }

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

    // Ensure thumbnails directory exists
    const thumbnailsDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnails');
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

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

    // Ensure thumbnails directory exists
    const thumbnailsDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnails');
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

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
        url: `/uploads/${thumbnailPath}`,
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

// Helper function to get the correct base URL
const getBaseUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // First check environment variables
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  
  // Fallback to hardcoded URLs
  return isProduction ? 'https://getbananalink.com' : 'http://localhost:4000';
};

// Enhanced file upload function - FIXED for production
const uploadToCloudinary = async (file, folder = 'general') => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Generate thumbnails for images
    let thumbnails = [];
    let thumbnailUrl = null;

    if (file.mimetype.startsWith('image/')) {
      thumbnails = await generateThumbnails(file);
      if (thumbnails.length > 0) {
        // Use medium size as default thumbnail
        thumbnailUrl = `/uploads/${thumbnails[1].path}`;
      }
    }

    // Get correct base URL
    const baseUrl = getBaseUrl();
    
    // Determine the relative path for the file
    let relativePath = '';
    let fileType = 'general';
    
    if (file.fieldname === 'avatar') {
      relativePath = `avatars/${file.filename}`;
      fileType = 'avatars';
    } else if (file.fieldname === 'coverPhoto') {
      relativePath = `covers/${file.filename}`;
      fileType = 'covers';
    } else {
      relativePath = `general/${file.filename}`;
      fileType = 'general';
    }

    // Get image metadata if it's an image
    let metadata = {};
    if (file.mimetype.startsWith('image/')) {
      metadata = await processImageMetadata(file);
    }

    return {
      // Full URL for frontend use
      url: `${baseUrl}/uploads/${relativePath}`,
      
      // Relative path for database storage (more flexible)
      path: `/uploads/${relativePath}`,
      
      // Thumbnail URLs
      thumbnail: thumbnailUrl ? `${baseUrl}${thumbnailUrl}` : null,
      
      // All thumbnails
      thumbnails: thumbnails.map(thumb => ({
        url: `${baseUrl}/uploads/${thumb.path}`,
        path: `/uploads/${thumb.path}`,
        width: thumb.width,
        height: thumb.height,
        suffix: thumb.suffix
      })),
      
      // File information
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      fieldname: file.fieldname,
      encoding: file.encoding,
      metadata,
      uploadedAt: new Date().toISOString(),
      
      // Additional info for debugging
      baseUrl: baseUrl,
      fileType: fileType
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
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log(`🗑️ Cleaned up file: ${req.file.path}`);
      }
    }

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(`🗑️ Cleaned up file: ${file.path}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up uploaded files:', error);
  }
};

// Helper function to generate file URL (use this in your controllers)
const generateFileUrl = (filename, type = 'general') => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/uploads/${type}/${filename}`;
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
  generateFileUrl, // Export the helper function
  getBaseUrl // Export for use in other files
};