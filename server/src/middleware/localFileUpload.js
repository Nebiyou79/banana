// backend/src/middleware/localFileUpload.js
// ✅ FIXED: BUG-03 — Expanded ALLOWED_MIME_TYPES and ALLOWED_EXTENSIONS to
//           support Ethiopian bid document requirements:
//           - Images (JPG, PNG, GIF) for scanned CPO docs, stamps, company photos
//           - Spreadsheets (XLS, XLSX) for Bill of Quantities and price schedules
//           - ZIP archives for multiple-document packages
//           Previous config silently rejected all images, Excel, and zip files.

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ══════════════════════════════════════════════════════════════
// BUG-03 FIX: Expanded allowed file types
// ══════════════════════════════════════════════════════════════
const ALLOWED_MIME_TYPES = {
  // ── Documents (original) ────────────────────────────────
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',

  // ── Images (NEW) — for scanned CPO documents, company stamps, photos ──
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/tiff': 'tiff',

  // ── Spreadsheets (NEW) — for BOQ, price schedules, financial breakdowns ──
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',

  // ── Archives (NEW) — for multi-document packages ────────
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/x-zip': 'zip',
  'application/octet-stream': 'bin'  // fallback for browser-specific zip MIME
};

const ALLOWED_EXTENSIONS = [
  // Documents
  '.pdf', '.doc', '.docx', '.txt',
  // Images (NEW)
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff',
  // Spreadsheets (NEW)
  '.xls', '.xlsx',
  // Archives (NEW)
  '.zip'
];

// ══════════════════════════════════════════════════════════════
// File filter function
// ══════════════════════════════════════════════════════════════
const fileFilter = (req, file, cb) => {
  // Check MIME type first
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    return cb(null, true);
  }

  // Check file extension as fallback (handles browser MIME type inconsistencies)
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(null, true);
  }

  cb(new Error(
    `Invalid file type "${file.mimetype}" (${ext}). ` +
    `Allowed: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, WEBP, XLS, XLSX, ZIP`
  ), false);
};

// ══════════════════════════════════════════════════════════════
// Storage configuration
// ══════════════════════════════════════════════════════════════
const getStorage = (folder = 'documents') => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
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
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      const nameWithoutExt = path.basename(file.originalname, ext);

      // Sanitize filename — replace non-alphanumeric chars, limit length
      const sanitizedFilename = `${nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50)}-${uniqueSuffix}${ext}`;

      cb(null, sanitizedFilename.toLowerCase());
    }
  });
};

// ══════════════════════════════════════════════════════════════
// Multer instance factory
// ══════════════════════════════════════════════════════════════
const createMulterInstance = (options = {}) => {
  const storage = getStorage(options.folder);
  const maxSize = parseInt(process.env.MAX_DOCUMENT_SIZE) || 100 * 1024 * 1024; // Default 100MB

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
      files: options.maxFiles || 10
    }
  });
};

// ══════════════════════════════════════════════════════════════
// Error handler helper — shared across all upload types
// ══════════════════════════════════════════════════════════════
const handleUploadError = (err, res, maxFiles) => {
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
        error: maxFiles ? `Maximum ${maxFiles} files allowed` : 'Too many files uploaded'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field. Check the file input field names.'
      });
    }
  }
  return res.status(400).json({
    success: false,
    error: err.message || 'File upload failed'
  });
};

// ══════════════════════════════════════════════════════════════
// localFileUpload API
// ══════════════════════════════════════════════════════════════
const localFileUpload = {

  // ── Single file upload ─────────────────────────────────────────────
  single: (fieldName = 'document', folder = 'documents') => {
    return (req, res, next) => {
      req.uploadFolder = folder;
      req.uploadFieldName = fieldName;

      const upload = createMulterInstance({ folder }).single(fieldName);

      upload(req, res, (err) => {
        if (err) return handleUploadError(err, res, 1);

        if (req.file) {
          req.uploadedFile = {
            success: true,
            fieldName,
            folder,
            file: {
              originalName: req.file.originalname,
              fileName: req.file.filename,
              filename: req.file.filename,
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

  // ── Multiple files upload ──────────────────────────────────────────
  multiple: (fieldName = 'documents', maxFiles = 5, folder = 'documents') => {
    return (req, res, next) => {
      req.uploadFolder = folder;
      req.uploadFieldName = fieldName;

      const upload = createMulterInstance({ folder, maxFiles }).array(fieldName, maxFiles);

      upload(req, res, (err) => {
        if (err) return handleUploadError(err, res, maxFiles);

        if (req.files && req.files.length > 0) {
          req.uploadedFiles = {
            success: true,
            fieldName,
            folder,
            files: req.files.map((file, index) => ({
              originalName: file.originalname,
              fileName: file.filename,
              filename: file.filename,
              size: file.size,
              mimetype: file.mimetype,
              path: file.path,
              destination: file.destination,
              url: `/uploads/${folder}/${file.filename}`,
              downloadUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/download/${folder}/${file.filename}`,
              index
            })),
            count: req.files.length
          };
        }

        next();
      });
    };
  },

  // ── Multiple named fields upload ───────────────────────────────────
  fields: (fields = [], folder = 'documents') => {
    return (req, res, next) => {
      req.uploadFolder = folder;
      req.uploadFields = fields;

      const upload = createMulterInstance({ folder }).fields(fields);

      upload(req, res, (err) => {
        if (err) return handleUploadError(err, res, null);

        req.uploadedFilesByField = {};

        fields.forEach(field => {
          const fieldName = typeof field === 'string' ? field : field.name;
          const files = req.files ? req.files[fieldName] : [];

          if (files && files.length > 0) {
            req.uploadedFilesByField[fieldName] = {
              success: true,
              fieldName,
              folder,
              files: files.map((file, index) => {
                const fileData = {
                  originalName: file.originalname,
                  fileName: file.filename,
                  filename: file.filename,
                  size: file.size,
                  mimetype: file.mimetype,
                  path: file.path,
                  destination: file.destination,
                  url: `/uploads/${folder}/${file.filename}`,
                  downloadUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/download/${folder}/${file.filename}`,
                  index
                };

                // Extract per-file metadata from request body
                const metaKey = `${fieldName}[${index}]`;
                if (req.body[metaKey]) {
                  try {
                    fileData.metadata = JSON.parse(req.body[metaKey]);
                  } catch (e) {
                    console.warn(`⚠️ Could not parse metadata for ${metaKey}:`, e.message);
                  }
                }

                return fileData;
              }),
              count: files.length
            };
          }
        });

        // Flatten for backward compatibility
        if (req.files) {
          const allFiles = Object.values(req.files).flat();
          if (allFiles.length > 0) {
            req.uploadedFiles = {
              success: true,
              fieldName: 'multiple',
              folder,
              files: allFiles.map(file => ({
                originalName: file.originalname,
                fileName: file.filename,
                filename: file.filename,
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

  // ── Specialized shortcuts ──────────────────────────────────────────
  cv: () => localFileUpload.single('cv', 'cv'),
  application: () => localFileUpload.single('application', 'applications'),
  tender: () => localFileUpload.single('tender', 'tenders'),
  proposal: () => localFileUpload.single('proposal', 'proposals'),

  applicationWithFiles: () => {
    return localFileUpload.fields([
      { name: 'cv', maxCount: 1 },
      { name: 'referencePdfs', maxCount: 5 },
      { name: 'experiencePdfs', maxCount: 5 }
    ], 'applications');
  },

  custom: (options = {}) => {
    return localFileUpload.single(
      options.fieldName || 'document',
      options.folder || 'documents'
    );
  }
};

module.exports = localFileUpload;