// middleware/fileUploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
let uuidv4;

// Import uuid properly
const initializeUUID = async () => {
  const uuidModule = await import('uuid');
  uuidv4 = uuidModule.v4;
};

// Ensure upload directories exist with proper permissions
const createUploadDirs = () => {
  const uploadDirs = {
    portfolio: path.join(process.cwd(), 'public', 'uploads', 'portfolio'),
    avatars: path.join(process.cwd(), 'public', 'uploads', 'avatars'),
    'cover-photos': path.join(process.cwd(), 'public', 'uploads', 'cover-photos'),
    'post-media': path.join(process.cwd(), 'public', 'uploads', 'post-media')
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

// Initialize UUID
initializeUUID().catch(console.error);

// Portfolio upload configuration
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
}).array('files', 5);

// Avatar upload configuration
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

// Cover photo upload configuration
const coverPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs['cover-photos']);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname);
    const fileName = `cover-${uniqueId}${fileExt}`;
    cb(null, fileName);
  }
});

const coverPhotoFileFilter = (req, file, cb) => {
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
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed for cover photos.'), false);
  }
};

const uploadCoverPhoto = multer({
  storage: coverPhotoStorage,
  fileFilter: coverPhotoFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for cover photos
  }
}).single('coverPhoto');

// Post media upload configuration
const postMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs['post-media']);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname);
    const fileName = `post-${uniqueId}${fileExt}`;
    cb(null, fileName);
  }
});

const postMediaFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed for post media.'), false);
  }
};

const uploadPostMedia = multer({
  storage: postMediaStorage,
  fileFilter: postMediaFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for post media
    files: 10 // Max 10 files per post
  }
}).array('media', 10);

// Enhanced error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum size is 10MB for portfolio, 5MB for cover photos, 2MB for avatar.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 5 files allowed for portfolio, 10 for post media.';
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

// Utility to delete file
const deleteFile = (filePath) => {
  const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
};

module.exports = {
  uploadPortfolio,
  uploadAvatar,
  uploadCoverPhoto,
  uploadPostMedia,
  handleUploadError,
  getFileUrl,
  deleteFile
};