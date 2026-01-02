// middleware/attachmentUploadMiddleware.js - FIXED VERSION
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureUploadDirectories = () => {
  const baseDir = path.join(process.cwd(), 'public', 'uploads');
  const directories = [
    path.join(baseDir, 'cv'),
    path.join(baseDir, 'applications')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created upload directory: ${dir}`);
    }
  });
};

ensureUploadDirectories();

// Configure storage for different attachment types
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // All application files go to the same directory for simplicity
    let uploadPath = path.join(process.cwd(), 'public', 'uploads', 'applications');
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    
    const filename = `attachment-${baseName}-${uniqueSuffix}${fileExtension}`;
    console.log(`📁 Saving file: ${filename}`);
    cb(null, filename);
  }
});

// File filter for attachments
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/rtf',
    
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log(`✅ File type allowed: ${file.mimetype}`);
    cb(null, true);
  } else {
    console.log(`❌ File type rejected: ${file.mimetype}`);
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, Word, Excel, PowerPoint, Images, Text`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
    files: 10 // Maximum 10 files per upload (5 references + 5 experience)
  }
});

// Only handle reference and experience documents
const applicationAttachments = upload.fields([
  { name: 'referencePdfs', maxCount: 5 },  // Reference documents for reference entries
  { name: 'experiencePdfs', maxCount: 5 }  // Experience documents for work experience entries
]);

// Error handling middleware
const handleAttachmentUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 15MB per file.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 reference documents and 5 experience documents allowed.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Only referencePdfs and experiencePdfs are allowed.'
      });
    }
  } else if (err.message) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// Helper function to get file URLs
const getFileUrl = (filename, fileType = 'applications') => {
  if (!filename) return null;
  
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = isProduction 
    ? 'https://getbananalink.com' 
    : 'http://localhost:4000';
  
  // The path should be /uploads/... not /api/v1/uploads/...
  return `${baseUrl}/uploads/${fileType}/${filename}`;
};

// Helper function to process uploaded files
const processUploadedFiles = (files) => {
  const processedFiles = {
    referencePdfs: [],
    experiencePdfs: []
  };

  if (!files) {
    console.log('📁 No files to process');
    return processedFiles;
  }

  console.log('📁 Processing uploaded files:', Object.keys(files));

  // Process reference PDFs
  if (files.referencePdfs) {
    processedFiles.referencePdfs = files.referencePdfs.map(file => {
      const fileData = {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        url: getFileUrl(file.filename, 'applications'),
        uploadedAt: new Date()
      };
      console.log(`📄 Processed reference document: ${fileData.originalName} -> ${fileData.filename}`);
      return fileData;
    });
  }

  // Process experience PDFs
  if (files.experiencePdfs) {
    processedFiles.experiencePdfs = files.experiencePdfs.map(file => {
      const fileData = {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        url: getFileUrl(file.filename, 'applications'),
        uploadedAt: new Date()
      };
      console.log(`📄 Processed experience document: ${fileData.originalName} -> ${fileData.filename}`);
      return fileData;
    });
  }

  console.log('📁 Final processed files:', {
    referencePdfs: processedFiles.referencePdfs.length,
    experiencePdfs: processedFiles.experiencePdfs.length
  });

  return processedFiles;
};

// Cleanup function to delete files on error
const cleanupUploadedFiles = (files) => {
  if (!files) return;
  
  console.log('🧹 Cleaning up uploaded files due to error');
  
  Object.values(files).forEach(fileArray => {
    if (Array.isArray(fileArray)) {
      fileArray.forEach(file => {
        try {
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`🗑️ Deleted file: ${file.path}`);
          }
        } catch (error) {
          console.error('❌ Error deleting file during cleanup:', error);
        }
      });
    }
  });
};

module.exports = {
  upload,
  applicationAttachments,
  handleAttachmentUploadError,
  processUploadedFiles,
  cleanupUploadedFiles,
  getFileUrl
};