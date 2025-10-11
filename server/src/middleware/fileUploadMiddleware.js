const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = {
  tender: 'public/uploads/tenders',
  proposal: 'public/uploads/proposals'
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Tender file upload configuration
const tenderStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.tender);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'tender-' + uniqueSuffix + ext);
  }
});

const tenderFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and images are allowed.'), false);
  }
};

exports.uploadTenderFiles = multer({
  storage: tenderStorage,
  fileFilter: tenderFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Max 5 files
  }
}).array('files', 5);

// Proposal file upload configuration
const proposalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.proposal);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'proposal-' + uniqueSuffix + ext);
  }
});

exports.uploadProposalFiles = multer({
  storage: proposalStorage,
  fileFilter: tenderFileFilter, // Same filter as tender files
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 3 // Max 3 files per proposal
  }
}).array('attachments', 3);

// Error handling middleware
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed for tenders, 3 for proposals.'
      });
    }
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};