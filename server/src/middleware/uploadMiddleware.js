// server/src/middleware/companyUploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    path.join(process.cwd(), 'public', 'uploads', 'company', 'logos'),
    path.join(process.cwd(), 'public', 'uploads', 'company', 'banners')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage for company files
// FIXED: Better filename generation
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = path.join(process.cwd(), 'public', 'uploads', 'company');
    
    if (file.fieldname === 'logo') {
      uploadPath = path.join(uploadPath, 'logos');
    } else if (file.fieldname === 'banner') {
      uploadPath = path.join(uploadPath, 'banners');
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // FIX: Use only user ID from authenticated user
    const companyId = req.user?.userId || 'unknown';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${companyId}-${timestamp}-${randomString}${fileExtension}`;
    
    console.log(`📁 Saving file: ${fileName} for user: ${companyId}`);
    cb(null, fileName);
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 2 // Maximum 2 files (logo and banner)
  },
  fileFilter: fileFilter
});

// Middleware for handling company file uploads
const companyUpload = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]);

// Error handling middleware for uploads
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.'
      });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

module.exports = {
  companyUpload,
  handleUploadErrors
};