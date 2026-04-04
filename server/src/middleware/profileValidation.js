const { body, param, query, validationResult } = require('express-validator');

const validateProfileUpdate = [
  body('headline')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Headline cannot exceed 200 characters')
    .trim(),
  
  body('bio')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Bio cannot exceed 2000 characters')
    .trim(),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters')
    .trim(),
  
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Invalid phone number format')
    .trim(),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL')
    .trim(),
  
  body('socialLinks.linkedin')
    .optional()
    .isURL()
    .withMessage('Invalid LinkedIn URL')
    .trim(),
  
  body('socialLinks.github')
    .optional()
    .isURL()
    .withMessage('Invalid GitHub URL')
    .trim(),
  
  body('socialLinks.twitter')
    .optional()
    .isURL()
    .withMessage('Invalid Twitter URL')
    .trim(),
  
  body('socialLinks.facebook')
    .optional()
    .isURL()
    .withMessage('Invalid Facebook URL')
    .trim(),
  
  body('socialLinks.instagram')
    .optional()
    .isURL()
    .withMessage('Invalid Instagram URL')
    .trim(),
  
  body('socialLinks.tiktok')
    .optional()
    .isURL()
    .withMessage('Invalid TikTok URL')
    .trim(),
  
  body('socialLinks.telegram')
    .optional()
    .isURL()
    .withMessage('Invalid Telegram URL')
    .trim(),
  
  body('socialLinks.youtube')
    .optional()
    .isURL()
    .withMessage('Invalid YouTube URL')
    .trim(),
  
  body('privacySettings.profileVisibility')
    .optional()
    .isIn(['public', 'connections', 'private'])
    .withMessage('Invalid profile visibility setting'),
  
  body('privacySettings.showEmail')
    .optional()
    .isBoolean()
    .withMessage('showEmail must be a boolean'),
  
  body('privacySettings.showPhone')
    .optional()
    .isBoolean()
    .withMessage('showPhone must be a boolean'),
  
  body('privacySettings.allowMessages')
    .optional()
    .isBoolean()
    .withMessage('allowMessages must be a boolean'),
  
  body('privacySettings.allowConnections')
    .optional()
    .isBoolean()
    .withMessage('allowConnections must be a boolean'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  }
];

const validateProfessionalInfo = [
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  
  body('skills.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each skill cannot exceed 50 characters'),
  
  body('education')
    .optional()
    .isArray()
    .withMessage('Education must be an array'),
  
  body('education.*.institution')
    .if(body('education').exists())
    .notEmpty()
    .withMessage('Institution name is required')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Institution name cannot exceed 200 characters'),
  
  body('education.*.degree')
    .if(body('education').exists())
    .notEmpty()
    .withMessage('Degree is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Degree cannot exceed 100 characters'),
  
  body('education.*.field')
    .if(body('education').exists())
    .notEmpty()
    .withMessage('Field of study is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Field of study cannot exceed 100 characters'),
  
  body('education.*.startDate')
    .if(body('education').exists())
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  body('education.*.endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  
  body('education.*.current')
    .optional()
    .isBoolean()
    .withMessage('Current must be a boolean'),
  
  body('education.*.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('experience')
    .optional()
    .isArray()
    .withMessage('Experience must be an array'),
  
  body('experience.*.company')
    .if(body('experience').exists())
    .notEmpty()
    .withMessage('Company name is required')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),
  
  body('experience.*.position')
    .if(body('experience').exists())
    .notEmpty()
    .withMessage('Position is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position cannot exceed 100 characters'),
  
  body('experience.*.startDate')
    .if(body('experience').exists())
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  body('experience.*.endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  
  body('experience.*.current')
    .optional()
    .isBoolean()
    .withMessage('Current must be a boolean'),
  
  body('experience.*.description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('experience.*.skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  
  body('experience.*.skills.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each skill cannot exceed 50 characters'),
  
  body('certifications')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array'),
  
  body('certifications.*.name')
    .if(body('certifications').exists())
    .notEmpty()
    .withMessage('Certification name is required')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Certification name cannot exceed 200 characters'),
  
  body('certifications.*.issuer')
    .if(body('certifications').exists())
    .notEmpty()
    .withMessage('Issuer is required')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Issuer cannot exceed 200 characters'),
  
  body('certifications.*.issueDate')
    .if(body('certifications').exists())
    .notEmpty()
    .withMessage('Issue date is required')
    .isISO8601()
    .withMessage('Invalid issue date format'),
  
  body('certifications.*.expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date format'),
  
  body('certifications.*.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('portfolio')
    .optional()
    .isArray()
    .withMessage('Portfolio must be an array'),
  
  body('portfolio.*.title')
    .if(body('portfolio').exists())
    .notEmpty()
    .withMessage('Project title is required')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Project title cannot exceed 200 characters'),
  
  body('portfolio.*.description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('portfolio.*.mediaUrl')
    .optional()
    .isURL()
    .withMessage('Invalid media URL'),
  
  body('portfolio.*.projectUrl')
    .optional()
    .isURL()
    .withMessage('Invalid project URL'),
  
  body('portfolio.*.category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category cannot exceed 100 characters'),
  
  body('portfolio.*.technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  
  body('portfolio.*.technologies.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each technology cannot exceed 50 characters'),
  
  body('companyInfo.size')
    .optional()
    .isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
    .withMessage('Invalid company size'),
  
  body('companyInfo.foundedYear')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage('Invalid founded year'),
  
  body('companyInfo.companyType')
    .optional()
    .isIn(['startup', 'small-business', 'medium-business', 'large-enterprise', 'multinational', 'non-profit', 'government'])
    .withMessage('Invalid company type'),
  
  body('companyInfo.industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Industry cannot exceed 100 characters'),
  
  body('companyInfo.mission')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mission cannot exceed 500 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  }
];

const validateSocialLinks = [
  body('socialLinks')
    .exists()
    .withMessage('Social links are required')
    .isObject()
    .withMessage('Social links must be an object'),
  
  body('socialLinks.linkedin')
    .optional()
    .isURL()
    .withMessage('Invalid LinkedIn URL')
    .trim(),
  
  body('socialLinks.github')
    .optional()
    .isURL()
    .withMessage('Invalid GitHub URL')
    .trim(),
  
  body('socialLinks.twitter')
    .optional()
    .isURL()
    .withMessage('Invalid Twitter URL')
    .trim(),
  
  body('socialLinks.facebook')
    .optional()
    .isURL()
    .withMessage('Invalid Facebook URL')
    .trim(),
  
  body('socialLinks.instagram')
    .optional()
    .isURL()
    .withMessage('Invalid Instagram URL')
    .trim(),
  
  body('socialLinks.tiktok')
    .optional()
    .isURL()
    .withMessage('Invalid TikTok URL')
    .trim(),
  
  body('socialLinks.telegram')
    .optional()
    .isURL()
    .withMessage('Invalid Telegram URL')
    .trim(),
  
  body('socialLinks.youtube')
    .optional()
    .isURL()
    .withMessage('Invalid YouTube URL')
    .trim(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  }
];

const validateVerification = [
  body('documents')
    .exists()
    .withMessage('Documents are required')
    .isArray({ min: 1 })
    .withMessage('At least one document is required'),
  
  body('documents.*.documentType')
    .notEmpty()
    .withMessage('Document type is required')
    .isIn(['government_id', 'passport', 'driver_license', 'proof_of_address', 'company_registration', 'tax_certificate', 'other'])
    .withMessage('Invalid document type'),
  
  body('documents.*.url')
    .notEmpty()
    .withMessage('Document URL is required')
    .isURL()
    .withMessage('Invalid document URL'),
  
  body('documents.*.remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  }
];

const validateCandidateProfile = [
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  
  body('skills.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each skill cannot exceed 50 characters'),
  
  body('headline')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Headline cannot exceed 200 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Bio cannot exceed 2000 characters'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  }
];

const validateCompanyProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Name must be between 2 and 200 characters'),
  
  body('tin')
    .optional()
    .trim()
    .isLength({ min: 9, max: 15 })
    .withMessage('TIN must be between 9 and 15 characters')
    .matches(/^[0-9A-Za-z-]+$/)
    .withMessage('TIN can only contain letters, numbers, and hyphens'),
  
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Industry cannot exceed 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),
  
  body('mission')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mission cannot exceed 500 characters'),
  
  body('companySize')
    .optional()
    .isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
    .withMessage('Invalid company size'),
  
  body('foundedYear')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage('Invalid founded year'),
  
  body('companyType')
    .optional()
    .isIn(['startup', 'small-business', 'medium-business', 'large-enterprise', 'multinational', 'non-profit', 'government'])
    .withMessage('Invalid company type'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  }
];

const validateFreelancerProfile = [
  body('headline')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Headline cannot exceed 200 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Bio cannot exceed 2000 characters'),
  
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  
  body('availability')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'as-needed'])
    .withMessage('Invalid availability'),
  
  body('experienceLevel')
    .optional()
    .isIn(['entry', 'intermediate', 'senior', 'expert'])
    .withMessage('Invalid experience level'),
  
  body('englishProficiency')
    .optional()
    .isIn(['basic', 'conversational', 'professional', 'fluent', 'native'])
    .withMessage('Invalid English proficiency level'),
  
  body('specialization')
    .optional()
    .isArray()
    .withMessage('Specialization must be an array'),
  
  body('specialization.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Each specialization cannot exceed 100 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  }
];

const validateOrganizationProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Name must be between 2 and 200 characters'),
  
  body('registrationNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Registration number must be between 5 and 50 characters'),
  
  body('organizationType')
    .optional()
    .isIn(['non-profit', 'charity', 'ngo', 'educational', 'government', 'community'])
    .withMessage('Invalid organization type'),
  
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Industry cannot exceed 100 characters'),
  
  body('mission')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mission cannot exceed 500 characters'),
  
  body('size')
    .optional()
    .isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
    .withMessage('Invalid organization size'),
  
  body('foundedYear')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage('Invalid founded year'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  }
];

const validatePrivacySettings = [
  body('profileVisibility')
    .optional()
    .isIn(['public', 'connections', 'private'])
    .withMessage('Invalid profile visibility setting'),
  
  body('showEmail')
    .optional()
    .isBoolean()
    .withMessage('showEmail must be a boolean'),
  
  body('showPhone')
    .optional()
    .isBoolean()
    .withMessage('showPhone must be a boolean'),
  
  body('showAge')
    .optional()
    .isBoolean()
    .withMessage('showAge must be a boolean'),
  
  body('allowMessages')
    .optional()
    .isBoolean()
    .withMessage('allowMessages must be a boolean'),
  
  body('allowConnections')
    .optional()
    .isBoolean()
    .withMessage('allowConnections must be a boolean'),
  
  body('showOnlineStatus')
    .optional()
    .isBoolean()
    .withMessage('showOnlineStatus must be a boolean'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  }
];

const validateNotificationPreferences = [
  body('email.messages')
    .optional()
    .isBoolean()
    .withMessage('email.messages must be a boolean'),
  
  body('email.connectionRequests')
    .optional()
    .isBoolean()
    .withMessage('email.connectionRequests must be a boolean'),
  
  body('email.postInteractions')
    .optional()
    .isBoolean()
    .withMessage('email.postInteractions must be a boolean'),
  
  body('email.jobMatches')
    .optional()
    .isBoolean()
    .withMessage('email.jobMatches must be a boolean'),
  
  body('email.newFollowers')
    .optional()
    .isBoolean()
    .withMessage('email.newFollowers must be a boolean'),
  
  body('push.messages')
    .optional()
    .isBoolean()
    .withMessage('push.messages must be a boolean'),
  
  body('push.connectionRequests')
    .optional()
    .isBoolean()
    .withMessage('push.connectionRequests must be a boolean'),
  
  body('push.postInteractions')
    .optional()
    .isBoolean()
    .withMessage('push.postInteractions must be a boolean'),
  
  body('push.newFollowers')
    .optional()
    .isBoolean()
    .withMessage('push.newFollowers must be a boolean'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  }
];

// Query parameter validations
const validateSearchParams = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
  
  query('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  query('skills')
    .optional()
    .custom(value => {
      if (typeof value === 'string') {
        const skills = value.split(',');
        return skills.every(skill => skill.trim().length > 0 && skill.trim().length <= 50);
      }
      return true;
    })
    .withMessage('Invalid skills format'),
  
  query('role')
    .optional()
    .isIn(['candidate', 'freelancer', 'company', 'organization'])
    .withMessage('Invalid role'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  }
];

module.exports = {
  validateProfileUpdate,
  validateProfessionalInfo,
  validateSocialLinks,
  validateVerification,
  validateCandidateProfile,
  validateCompanyProfile,
  validateFreelancerProfile,
  validateOrganizationProfile,
  validatePrivacySettings,
  validateNotificationPreferences,
  validateSearchParams
};