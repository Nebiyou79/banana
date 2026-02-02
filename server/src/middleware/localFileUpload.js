const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Validate file types
const ALLOWED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt'
};

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

// File filter function
const fileFilter = (req, file, cb) => {
  // Check MIME type first
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    return cb(null, true);
  }

  // Check file extension as fallback
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(null, true);
  }

  cb(new Error(`Invalid document type. Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed.`), false);
};

// Configure storage
const getStorage = (folder = 'documents') => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      // Determine upload path based on folder parameter
      const fullPath = path.join(
        process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads'),
        folder
      );

      // Create directory if it doesn't exist
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }

      cb(null, fullPath);
    },
    filename: function (req, file, cb) {
      // Generate unique filename with original extension
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);

      // Sanitize filename
      const sanitizedFilename = `${nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50)}-${uniqueSuffix}${ext}`;

      cb(null, sanitizedFilename.toLowerCase());
    }
  });
};

// Create multer instances for different use cases
const createMulterInstance = (options = {}) => {
  const storage = getStorage(options.folder);
  const maxSize = parseInt(process.env.MAX_DOCUMENT_SIZE) || 100 * 1024 * 1024; // Default 100MB

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: maxSize,
      files: options.maxFiles || 10 // Increased for multiple fields
    }
  });
};

// Middleware factory function
const localFileUpload = {
  // Single document upload
  single: (fieldName = 'document', folder = 'documents') => {
    return (req, res, next) => {
      // Store folder in request for controller access
      req.uploadFolder = folder;
      req.uploadFieldName = fieldName;

      const upload = createMulterInstance({ folder }).single(fieldName);

      upload(req, res, (err) => {
        if (err) {
          // Handle multer errors
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                success: false,
                error: `File too large. Maximum size is ${process.env.MAX_DOCUMENT_SIZE || '100MB'}`
              });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
              return res.status(400).json({
                success: false,
                error: 'Too many files uploaded'
              });
            }
          }
          return res.status(400).json({
            success: false,
            error: err.message || 'File upload failed'
          });
        }

        // If file was uploaded, add file info to request
        if (req.file) {
          req.uploadedFile = {
            success: true,
            fieldName: fieldName,
            folder: folder,
            file: {
              originalName: req.file.originalname,
              fileName: req.file.filename,
              size: req.file.size,
              mimetype: req.file.mimetype,
              path: req.file.path,
              destination: req.file.destination,
              url: `/uploads/${folder}/${req.file.filename}`,
              downloadUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/download/${folder}/${req.file.filename}`
            }
          };
        }

        next();
      });
    };
  },

  // Multiple documents upload
  multiple: (fieldName = 'documents', maxFiles = 5, folder = 'documents') => {
    return (req, res, next) => {
      // Store folder in request for controller access
      req.uploadFolder = folder;
      req.uploadFieldName = fieldName;

      const upload = createMulterInstance({ folder, maxFiles }).array(fieldName, maxFiles);

      upload(req, res, (err) => {
        if (err) {
          // Handle multer errors
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                success: false,
                error: `File too large. Maximum size is ${process.env.MAX_DOCUMENT_SIZE || '100MB'}`
              });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
              return res.status(400).json({
                success: false,
                error: `Maximum ${maxFiles} files allowed`
              });
            }
          }
          return res.status(400).json({
            success: false,
            error: err.message || 'Files upload failed'
          });
        }

        // If files were uploaded, add files info to request
        if (req.files && req.files.length > 0) {
          req.uploadedFiles = {
            success: true,
            fieldName: fieldName,
            folder: folder,
            files: req.files.map(file => ({
              originalName: file.originalname,
              fileName: file.filename,
              size: file.size,
              mimetype: file.mimetype,
              path: file.path,
              destination: file.destination,
              url: `/uploads/${folder}/${file.filename}`,
              downloadUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/download/${folder}/${file.filename}`
            })),
            count: req.files.length
          };
        }

        next();
      });
    };
  },

  // NEW: Multiple fields upload (for application with cv, referencePdfs, experiencePdfs)
  fields: (fields = [], folder = 'documents') => {
    return (req, res, next) => {
      // Store folder in request for controller access
      req.uploadFolder = folder;
      req.uploadFields = fields;

      const upload = createMulterInstance({ folder }).fields(fields);

      upload(req, res, (err) => {
        if (err) {
          // Handle multer errors
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                success: false,
                error: `File too large. Maximum size is ${process.env.MAX_DOCUMENT_SIZE || '100MB'}`
              });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
              return res.status(400).json({
                success: false,
                error: 'Too many files uploaded'
              });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
              return res.status(400).json({
                success: false,
                error: 'Unexpected file field. Check file field names'
              });
            }
          }
          return res.status(400).json({
            success: false,
            error: err.message || 'File upload failed'
          });
        }

        // Process uploaded files from multiple fields
        req.uploadedFilesByField = {};

        fields.forEach(field => {
          const fieldName = typeof field === 'string' ? field : field.name;
          const files = req.files ? req.files[fieldName] : [];

          if (files && files.length > 0) {
            req.uploadedFilesByField[fieldName] = {
              success: true,
              fieldName: fieldName,
              folder: folder,
              files: files.map(file => ({
                originalName: file.originalname,
                fileName: file.filename,
                size: file.size,
                mimetype: file.mimetype,
                path: file.path,
                destination: file.destination,
                url: `/uploads/${folder}/${file.filename}`,
                downloadUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/download/${folder}/${file.filename}`
              })),
              count: files.length
            };
          }
        });

        // Also maintain backward compatibility
        if (req.files) {
          // Flatten all files into a single array for backward compatibility
          const allFiles = Object.values(req.files).flat();
          if (allFiles.length > 0) {
            req.uploadedFiles = {
              success: true,
              fieldName: 'multiple',
              folder: folder,
              files: allFiles.map(file => ({
                originalName: file.originalname,
                fileName: file.filename,
                size: file.size,
                mimetype: file.mimetype,
                path: file.path,
                destination: file.destination,
                url: `/uploads/${folder}/${file.filename}`,
                downloadUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/download/${folder}/${file.filename}`
              })),
              count: allFiles.length
            };
          }
        }

        next();
      });
    };
  },

  // Specialized uploaders for different document types
  cv: () => localFileUpload.single('cv', 'cv'),
  application: () => localFileUpload.single('application', 'applications'),
  tender: () => localFileUpload.single('tender', 'tenders'),
  proposal: () => localFileUpload.single('proposal', 'proposals'),

  // NEW: Application upload with multiple file types
  applicationWithFiles: () => {
    return localFileUpload.fields([
      { name: 'cv', maxCount: 1 }, // CV is required
      { name: 'referencePdfs', maxCount: 5 },
      { name: 'experiencePdfs', maxCount: 5 }
    ], 'applications');
  },

  // Custom upload with options
  custom: (options = {}) => {
    return localFileUpload.single(
      options.fieldName || 'document',
      options.folder || 'documents'
    );
  }
};

module.exports = localFileUpload;