// server/src/middleware/organizationUploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    path.join(process.cwd(), 'public', 'uploads', 'organization', 'logos'),
    path.join(process.cwd(), 'public', 'uploads', 'organization', 'banners')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage for organization files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = path.join(process.cwd(), 'public', 'uploads', 'organization');
    
    if (file.fieldname === 'logo') {
      uploadPath = path.join(uploadPath, 'logos');
    } else if (file.fieldname === 'banner') {
      uploadPath = path.join(uploadPath, 'banners');
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const organizationId = req.params.id || req.user?.userId || 'temp';
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${organizationId}-${timestamp}${fileExtension}`;
    
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

// Middleware for handling organization file uploads
const organizationUpload = upload.fields([
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
  organizationUpload,
  handleUploadErrors
};