const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'tender', 'documents');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = 'tender-doc-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only documents, images, and archives are allowed.`));
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
    files: 50 // Maximum 50 files
  },
  fileFilter: fileFilter
});

// Helper function to safely parse JSON or handle strings
const safeParseJSON = (input, defaultValue = null) => {
  if (!input) return defaultValue;
  if (typeof input === 'object') return input;
  
  try {
    return JSON.parse(input);
  } catch (e) {
    // Handle strings that might be arrays or objects
    if (typeof input === 'string') {
      // Try to handle comma-separated arrays
      if (input.includes(',') && !input.startsWith('{') && !input.startsWith('[')) {
        return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
      }
      
      // Try to handle array-like strings without proper JSON
      if (input.startsWith('[') && input.endsWith(']')) {
        try {
          // Replace single quotes with double quotes for JSON parsing
          const cleaned = input.replace(/'/g, '"');
          return JSON.parse(cleaned);
        } catch (err) {
          // If still fails, try to extract values
          const matches = input.match(/['"]([^'"]+)['"]/g);
          if (matches) {
            return matches.map(match => match.replace(/['"]/g, ''));
          }
          return [input];
        }
      }
      
      // Try to handle object-like strings
      if (input.startsWith('{') && input.endsWith('}')) {
        try {
          const cleaned = input.replace(/'/g, '"');
          return JSON.parse(cleaned);
        } catch (err) {
          return { value: input };
        }
      }
      
      // Single string value
      return input;
    }
    return defaultValue;
  }
};

// Helper function to calculate file hash
const calculateFileHash = (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    console.error('Error calculating file hash:', error);
    return null;
  }
};

// Middleware to handle tender uploads and parse form data
const handleTenderUpload = (req, res, next) => {
  upload.array('attachments', 50)(req, res, function(err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 500MB per file'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Maximum 50 files allowed'
          });
        }
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading files'
      });
    }

    // Parse form-data fields
    const parsedData = {};
    
    // Check if frontend sent a single 'data' field with JSON
    if (req.body.data) {
      try {
        const mainData = safeParseJSON(req.body.data, {});
        Object.assign(parsedData, mainData);
      } catch (error) {
        console.error('Failed to parse data field:', error);
      }
    }
    
    // Parse individual form fields
    const directFields = [
      // Basic fields
      'title', 'description', 'procurementCategory', 'deadline', 'duration',
      'status', 'workflowType', 'visibilityType', 'tenderId', 'tenderCategory',
      
      // Freelance fields
      'projectType', 'engagementType', 'weeklyHours', 'experienceLevel',
      'portfolioRequired', 'languagePreference', 'timezonePreference',
      'ndaRequired', 'urgency', 'industry',
      
      // Professional fields
      'referenceNumber', 'procuringEntity', 'procurementMethod', 'fundingSource',
      'minimumExperience', 'legalRegistrationRequired', 'projectObjectives',
      'evaluationMethod', 'clarificationDeadline', 'sealedBidConfirmation'
    ];
    
    directFields.forEach(field => {
      if (req.body[field] !== undefined && parsedData[field] === undefined) {
        parsedData[field] = req.body[field];
      }
    });
    
    // Parse visibility
    if (req.body.visibility !== undefined) {
      parsedData.visibility = safeParseJSON(req.body.visibility, {});
    } else if (req.body.visibilityType !== undefined) {
      // Handle visibilityType as a string with allowed lists
      parsedData.visibility = {
        visibilityType: req.body.visibilityType,
        allowedCompanies: safeParseJSON(req.body.allowedCompanies || '[]', []),
        allowedUsers: safeParseJSON(req.body.allowedUsers || '[]', [])
      };
    }
    
    // Parse nested objects from stringified JSON
    const nestedFields = [
      'budget', 'estimatedDuration', 'freelanceSpecific', 'professionalSpecific',
      'timeline', 'evaluationCriteria', 'bidValidityPeriod', 'preBidMeeting',
      'financialCapacity', 'pastProjectReferences',
      'invitations'
    ];
    
    nestedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        parsedData[field] = safeParseJSON(req.body[field]);
      }
    });
    
    // Handle skillsRequired
    if (req.body.skillsRequired !== undefined) {
      parsedData.skillsRequired = safeParseJSON(req.body.skillsRequired, []);
    }
    
    // Handle requiredCertifications
    if (req.body.requiredCertifications !== undefined) {
      parsedData.requiredCertifications = safeParseJSON(req.body.requiredCertifications, []);
    }
    
    // Handle deliverables
    if (req.body.deliverables !== undefined) {
      parsedData.deliverables = safeParseJSON(req.body.deliverables, []);
    }
    
    // Handle milestones
    if (req.body.milestones !== undefined) {
      parsedData.milestones = safeParseJSON(req.body.milestones, []);
    }
    
    // Handle screeningQuestions
    if (req.body.screeningQuestions !== undefined) {
      parsedData.screeningQuestions = safeParseJSON(req.body.screeningQuestions, []);
    }
    
    // Handle file descriptions and types
    if (req.body.fileDescriptions !== undefined) {
      parsedData.fileDescriptions = safeParseJSON(req.body.fileDescriptions, []);
    }
    
    if (req.body.fileTypes !== undefined) {
      parsedData.fileTypes = safeParseJSON(req.body.fileTypes, []);
    }
    
    // Handle boolean fields
    const booleanFields = [
      'portfolioRequired', 'ndaRequired', 'legalRegistrationRequired',
      'sealedBidConfirmation', 'similarValueProjects'
    ];
    
    booleanFields.forEach(field => {
      if (parsedData[field] !== undefined) {
        parsedData[field] = parsedData[field] === 'true' || parsedData[field] === true || parsedData[field] === '1';
      }
    });
    
    // Handle numeric fields
    const numericFields = ['weeklyHours', 'minimumExperience', 'duration'];
    
    numericFields.forEach(field => {
      if (parsedData[field] !== undefined) {
        parsedData[field] = Number(parsedData[field]);
      }
    });
    
    // Handle budget object
    if (parsedData.budget && typeof parsedData.budget === 'object') {
      if (parsedData.budget.min !== undefined) parsedData.budget.min = Number(parsedData.budget.min);
      if (parsedData.budget.max !== undefined) parsedData.budget.max = Number(parsedData.budget.max);
      if (!parsedData.budget.currency) parsedData.budget.currency = 'USD';
    }
    
    // Handle financial capacity
    if (parsedData.financialCapacity && typeof parsedData.financialCapacity === 'object') {
      if (parsedData.financialCapacity.minAnnualTurnover !== undefined) {
        parsedData.financialCapacity.minAnnualTurnover = Number(parsedData.financialCapacity.minAnnualTurnover);
      }
      if (!parsedData.financialCapacity.currency) {
        parsedData.financialCapacity.currency = 'ETB';
      }
    }
    
    // Handle evaluation criteria
    if (parsedData.evaluationCriteria && typeof parsedData.evaluationCriteria === 'object') {
      if (parsedData.evaluationCriteria.technicalWeight !== undefined) {
        parsedData.evaluationCriteria.technicalWeight = Number(parsedData.evaluationCriteria.technicalWeight);
      }
      if (parsedData.evaluationCriteria.financialWeight !== undefined) {
        parsedData.evaluationCriteria.financialWeight = Number(parsedData.evaluationCriteria.financialWeight);
      }
    }
    
    // Handle date fields
    const dateFields = ['deadline', 'clarificationDeadline'];
    
    dateFields.forEach(field => {
      if (parsedData[field]) {
        parsedData[field] = new Date(parsedData[field]);
      }
    });
    
    // Handle pre-bid meeting date
    if (parsedData.preBidMeeting && parsedData.preBidMeeting.date) {
      parsedData.preBidMeeting.date = new Date(parsedData.preBidMeeting.date);
    }
    
    // Calculate file hashes for attachments
    if (req.files && req.files.length > 0) {
      parsedData.attachmentsWithHash = req.files.map((file, index) => {
        const description = parsedData.fileDescriptions && parsedData.fileDescriptions[index] 
          ? parsedData.fileDescriptions[index] 
          : '';
        
        const documentType = parsedData.fileTypes && parsedData.fileTypes[index]
          ? parsedData.fileTypes[index]
          : 'other';
        
        return {
          fileInfo: file,
          description: description,
          documentType: documentType,
          fileHash: calculateFileHash(file.path)
        };
      });
    }
    
    // Attach parsed data to request object
    req.parsedBody = parsedData;
    
    next();
  });
};

module.exports = {
  handleTenderUpload,
  safeParseJSON,
  upload,
  calculateFileHash
};