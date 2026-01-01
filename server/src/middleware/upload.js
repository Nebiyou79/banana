const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';

    // Create subdirectories based on file type
    if (file.fieldname === 'avatar') {
      uploadPath = 'uploads/avatars/';
    } else if (file.fieldname === 'coverPhoto') {
      uploadPath = 'uploads/covers/';
    }

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
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

    const fileName = path.basename(file.filename);
    const thumbnailPath = `uploads/thumbnails/${fileName}`;

    // Create thumbnails directory if it doesn't exist
    const thumbDir = path.dirname(thumbnailPath);
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }

    await sharp(file.path)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

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

    const thumbnails = [];

    for (const size of sizes) {
      const fileName = path.basename(file.filename, path.extname(file.filename));
      const thumbnailPath = `uploads/thumbnails/${fileName}_${size.suffix}.jpg`;

      // Create thumbnails directory if it doesn't exist
      const thumbDir = path.dirname(thumbnailPath);
      if (!fs.existsSync(thumbDir)) {
        fs.mkdirSync(thumbDir, { recursive: true });
      }

      await sharp(file.path)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      thumbnails.push({
        path: thumbnailPath,
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

// Enhanced file upload function
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
        thumbnailUrl = `/thumbnails/${path.basename(thumbnails[1].path)}`; // Use medium size as default thumbnail
      }
    }

    // Determine the base URL
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';

    // Determine the file path based on fieldname
    let filePath = '';
    if (file.fieldname === 'avatar') {
      filePath = `avatars/${file.filename}`;
    } else if (file.fieldname === 'coverPhoto') {
      filePath = `covers/${file.filename}`;
    } else {
      filePath = `general/${file.filename}`;
    }

    // Get image metadata if it's an image
    let metadata = {};
    if (file.mimetype.startsWith('image/')) {
      metadata = await processImageMetadata(file);
    }

    return {
      url: `${baseUrl}/uploads/${filePath}`,
      path: `/uploads/${filePath}`,
      thumbnail: thumbnailUrl ? `${baseUrl}${thumbnailUrl}` : null,
      thumbnails: thumbnails.map(thumb => ({
        url: `${baseUrl}/${thumb.path}`,
        path: `/${thumb.path}`,
        width: thumb.width,
        height: thumb.height,
        suffix: thumb.suffix
      })),
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      fieldname: file.fieldname,
      encoding: file.encoding,
      metadata,
      uploadedAt: new Date().toISOString()
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
      }
    }

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up uploaded files:', error);
  }
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
  cleanupUploadedFiles
};