// middleware/fileUploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist with proper permissions
const createUploadDirs = () => {
  const uploadDirs = {
    portfolio: path.join(process.cwd(), 'public', 'uploads', 'portfolio'),
    avatars: path.join(process.cwd(), 'public', 'uploads', 'avatars')
  };

  Object.entries(uploadDirs).forEach(([key, dirPath]) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
      console.log(`✅ Created upload directory: ${dirPath}`);
    }
  });

  return uploadDirs;
};

const uploadDirs = createUploadDirs();

// Portfolio upload configuration - FIXED
const portfolioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.portfolio);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname);
    const fileName = `portfolio-${uniqueId}${fileExt}`;
    cb(null, fileName);
  }
});

const portfolioFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/quicktime'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images, PDFs, and videos are allowed.`), false);
  }
};

const uploadPortfolio = multer({
  storage: portfolioStorage,
  fileFilter: portfolioFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for portfolio files
    files: 5 // Max 5 files per upload
  }
}).array('files', 5); // Changed from 'portfolioFiles' to 'files'

// Avatar upload configuration - FIXED
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.avatars);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname);
    const fileName = `avatar-${uniqueId}${fileExt}`;
    cb(null, fileName);
  }
});

const avatarFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed for avatars.'), false);
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for avatars
  }
}).single('avatar');

// Enhanced error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum size is 10MB for portfolio, 2MB for avatar.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 5 files allowed for portfolio.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field. Please check your form data.';
        break;
      default:
        message = `Upload error: ${err.message}`;
    }
    
    return res.status(400).json({
      success: false,
      message
    });
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// Utility function to get file URL
const getFileUrl = (filename, type = 'portfolio') => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
  return `${baseUrl}/uploads/${type}/${filename}`;
};

module.exports = {
  uploadPortfolio,
  uploadAvatar,
  handleUploadError,
  getFileUrl
};