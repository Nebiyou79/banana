const multer = require('multer');
const path = require('path');
const { FILE_CATEGORIES } = require('../config/cloudinary');

// Memory storage for faster processing
const storage = multer.memoryStorage();

// File filter for CV/document types - FIXED: Added more MIME types
const fileFilter = (req, file, cb) => {
    console.log(`File filter checking: ${file.originalname} (${file.mimetype})`);
    
    const allowedMimeTypes = [
        // PDF
        'application/pdf',
        // Word documents
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // OpenDocument
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.presentation',
        // Text files
        'text/plain',
        // Rich text
        'application/rtf',
        'text/rtf',
        // PowerPoint
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Excel
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf', '.ppt', '.pptx', '.xls', '.xlsx'];
    
    // Check by MIME type first
    if (allowedMimeTypes.includes(file.mimetype)) {
        console.log(`✓ MIME type accepted: ${file.mimetype}`);
        return cb(null, true);
    }
    
    // Check by extension as fallback
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(fileExtension)) {
        console.log(`✓ Extension accepted: ${fileExtension}`);
        return cb(null, true);
    }
    
    // Reject file
    console.log(`✗ File rejected: ${file.originalname} (${file.mimetype})`);
    cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`), false);
};

// Configure multer for single file
const uploadSingle = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 1
    }
}).single('file');

// Configure multer for multiple files
const uploadMultiple = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
        files: 10 // Max 10 files per request
    }
}).array('files', 10);

/**
 * Cloudinary File Upload Middleware
 * Enhanced for better document handling
 */
const cloudinaryFileUpload = {
    // Single file upload
    single: (req, res, next) => {
        console.log('📤 Single file upload middleware called');
        
        // Check if express-fileupload already processed the files
        if (req.files && req.files.file) {
            console.log('Using express-fileupload processed file');
            
            // Validate the file
            const file = req.files.file;
            const fileExtension = path.extname(file.name).toLowerCase();
            const allowedExtensions = ['.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf', '.ppt', '.pptx', '.xls', '.xlsx'];
            
            if (!allowedExtensions.includes(fileExtension)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid file type: ${file.name}. Allowed: ${allowedExtensions.join(', ')}`
                });
            }
            
            next();
            return;
        }
        
        // Fallback to multer
        uploadSingle(req, res, (err) => {
            if (err) {
                console.error('Multer single upload error:', err.message);
                return res.status(400).json({
                    success: false,
                    message: err.message || 'File upload validation failed'
                });
            }
            
            // Convert multer format to express-fileupload format for consistency
            if (req.file) {
                req.files = req.files || {};
                req.files.file = {
                    name: req.file.originalname,
                    data: req.file.buffer,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                    tempFilePath: req.file.path
                };
                console.log(`✅ File ready for upload: ${req.file.originalname}`);
            }
            
            next();
        });
    },
    
    // Multiple files upload
    multiple: (req, res, next) => {
        console.log('📤 Multiple files upload middleware called');
        
        // Check if express-fileupload already processed the files
        if (req.files && (req.files.files || Object.keys(req.files).length > 0)) {
            console.log('Using express-fileupload processed files');
            
            // Validate all files
            const files = [];
            Object.keys(req.files).forEach(key => {
                const fileOrArray = req.files[key];
                if (Array.isArray(fileOrArray)) {
                    files.push(...fileOrArray);
                } else {
                    files.push(fileOrArray);
                }
            });
            
            const allowedExtensions = ['.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf', '.ppt', '.pptx', '.xls', '.xlsx'];
            
            for (const file of files) {
                const fileExtension = path.extname(file.name).toLowerCase();
                if (!allowedExtensions.includes(fileExtension)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid file type: ${file.name}. Allowed: ${allowedExtensions.join(', ')}`
                    });
                }
            }
            
            next();
            return;
        }
        
        // Fallback to multer
        uploadMultiple(req, res, (err) => {
            if (err) {
                console.error('Multer multiple upload error:', err.message);
                return res.status(400).json({
                    success: false,
                    message: err.message || 'Files upload validation failed'
                });
            }
            
            // Convert multer format to express-fileupload format
            if (req.files && req.files.length > 0) {
                console.log(`✅ ${req.files.length} files ready for upload`);
                
                const files = {};
                if (req.files.length === 1) {
                    files.file = {
                        name: req.files[0].originalname,
                        data: req.files[0].buffer,
                        mimetype: req.files[0].mimetype,
                        size: req.files[0].size,
                        tempFilePath: req.files[0].path
                    };
                } else {
                    files.files = req.files.map(file => ({
                        name: file.originalname,
                        data: file.buffer,
                        mimetype: file.mimetype,
                        size: file.size,
                        tempFilePath: file.path
                    }));
                }
                req.files = files;
            }
            
            next();
        });
    },
    
    // Simplified validation middleware for documents only
    document: (req, res, next) => {
        console.log('📄 Document validation middleware called');
        
        // If no files, continue
        if (!req.files) {
            return next();
        }
        
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.oasis.opendocument.text',
            'text/plain',
            'application/rtf',
            'text/rtf'
        ];
        
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf'];
        
        const files = [];
        
        // Collect all files
        Object.keys(req.files).forEach(key => {
            const fileOrArray = req.files[key];
            if (Array.isArray(fileOrArray)) {
                files.push(...fileOrArray);
            } else {
                files.push(fileOrArray);
            }
        });
        
        // Validate each file
        for (const file of files) {
            const fileExtension = path.extname(file.name).toLowerCase();
            
            if (!allowedMimeTypes.includes(file.mimetype) && !allowedExtensions.includes(fileExtension)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid file type: ${file.name}. Allowed: ${allowedExtensions.join(', ')}`
                });
            }
            
            if (file.size > 50 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: `File too large: ${file.name}. Maximum 50MB allowed.`
                });
            }
            
            console.log(`✓ Document validated: ${file.name} (${file.size} bytes)`);
        }
        
        next();
    }
};

module.exports = cloudinaryFileUpload;