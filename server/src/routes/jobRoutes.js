// routes/jobRoutes.js - UPDATED WITH NEW VALIDATIONS
const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJob,
  getCompanyJobs,
  createJob,
  updateJob,
  deleteJob,
  getCategories,
  // Organization methods
  getOrganizationJobs,
  createOrganizationJob,
  updateOrganizationJob,
  deleteOrganizationJob,
  // Candidate Methods
  getJobsForCandidate,
  saveJob,
  unsaveJob,
  getSavedJobs
} = require('../controllers/jobController');
const { verifyToken } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { body, custom } = require('express-validator');

// Helper function to count text characters (without HTML tags)
const countTextCharacters = (html) => {
  if (!html) return 0;
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, '');
  // Remove multiple spaces and newlines
  const cleanText = text.replace(/\s+/g, ' ').trim();
  return cleanText.length;
};

// Custom validation for description text length (not HTML length)
const validateTextLength = (fieldName, min, max) => {
  return body(fieldName)
    .custom((value) => {
      if (!value) return true; // Let required validation handle empty values

      const textLength = countTextCharacters(value);

      if (min && textLength < min) {
        throw new Error(`${fieldName} must be at least ${min} characters long (text only)`);
      }

      if (max && textLength > max) {
        throw new Error(`${fieldName} cannot exceed ${max} characters (text only)`);
      }

      return true;
    });
};

// NEW: Custom validation for salary mode consistency
const validateSalaryMode = (fieldName) => {
  return body(fieldName)
    .custom((value, { req }) => {
      const salaryMode = value || req.body.salaryMode;
      
      if (salaryMode === 'range') {
        // For range mode, salary.min and salary.max are required
        if (!req.body.salary?.min && !req.body.salary?.max) {
          throw new Error('Salary range (min or max) is required when salary mode is "range"');
        }
        
        if (req.body.salary?.min && req.body.salary?.max && req.body.salary.min > req.body.salary.max) {
          throw new Error('Minimum salary cannot be greater than maximum salary');
        }
        
        if (!req.body.salary?.currency) {
          throw new Error('Currency is required when salary mode is "range"');
        }
      } else if (['hidden', 'negotiable', 'company-scale'].includes(salaryMode)) {
        // For non-range modes, salary min/max should be ignored
        if (req.body.salary?.min || req.body.salary?.max) {
          // We'll just warn, not error, as controllers will handle clearing these
          console.log(`Salary min/max ignored for salary mode: ${salaryMode}`);
        }
      }
      
      return true;
    });
};

// Enhanced Validation for CREATE (with new fields)
const createJobValidation = [
  body('title')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  // NEW: Validate candidatesNeeded
  body('candidatesNeeded')
    .isInt({ min: 1 })
    .withMessage('At least 1 candidate is required')
    .toInt(),
  
  // Use custom validation for description text length
  validateTextLength('description', 50, 5000),
  
  body('shortDescription')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),
  
  // UPDATED: Validate salary mode
  body('salaryMode')
    .optional()
    .isIn(['range', 'hidden', 'negotiable', 'company-scale'])
    .withMessage('Invalid salary mode'),
  
  // Validate salary fields conditionally based on salaryMode
  validateSalaryMode('salaryMode'),
  
  body('salary.currency')
    .optional()
    .custom((value, { req }) => {
      const salaryMode = req.body.salaryMode || 'range';
      if (salaryMode === 'range' && !value) {
        throw new Error('Currency is required when salary mode is "range"');
      }
      if (value && !['ETB', 'USD', 'EUR', 'GBP'].includes(value)) {
        throw new Error('Invalid currency');
      }
      return true;
    }),
  
  body('salary.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number')
    .toFloat(),
  
  body('salary.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number')
    .toFloat()
    .custom((value, { req }) => {
      if (req.body.salary?.min && value < req.body.salary.min) {
        throw new Error('Maximum salary cannot be less than minimum salary');
      }
      return true;
    }),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      /* =========================
         TECHNOLOGY & ICT
      ========================== */
      'software-developer','frontend-developer','backend-developer','fullstack-developer',
      'web-developer','mobile-app-developer','android-developer','ios-developer',
      'ai-engineer','machine-learning-engineer','data-scientist','data-analyst',
      'business-intelligence-analyst','database-administrator','system-administrator',
      'network-engineer','network-administrator','cloud-engineer','devops-engineer',
      'site-reliability-engineer','cybersecurity-analyst','soc-analyst','penetration-tester',
      'it-support-officer','it-support-technician','helpdesk-officer',
      'ui-designer','ux-designer','product-designer','product-manager',
      'scrum-master','it-project-manager','qa-engineer','software-tester',
      'automation-tester','erp-consultant','sap-consultant','odoo-developer',
      'crm-administrator','digital-transformation-specialist','fintech-specialist',
      'blockchain-developer','web3-developer','it-policy-advisor',
      'ict-trainer','computer-lab-technician',

      /* NGO / UN / DEVELOPMENT */
      'project-officer','project-manager','program-officer','program-manager',
      'me-officer','me-manager','wash-officer','wash-specialist',
      'livelihood-officer','food-security-officer','nutrition-officer',
      'protection-officer','child-protection-officer','gender-officer',
      'gbv-officer','peacebuilding-officer','resilience-officer',
      'community-mobilizer','community-development-officer',
      'social-development-officer','humanitarian-officer',
      'emergency-response-officer','disaster-risk-reduction-officer',
      'refugee-program-officer','migration-officer','durable-solutions-officer',
      'case-management-officer','psychosocial-support-officer',
      'grant-officer','grant-manager','proposal-writer','resource-mobilization-officer',
      'partnership-officer','advocacy-officer','policy-officer',
      'enumerator','field-officer','monitoring-assistant',

      /* FINANCE */
      'accountant','junior-accountant','senior-accountant',
      'auditor','internal-auditor','external-auditor',
      'bank-teller','customer-service-officer-banking',
      'relationship-manager','branch-manager','operations-manager-banking',
      'credit-officer','loan-officer','credit-analyst',
      'risk-officer','compliance-officer-banking',
      'forex-officer','trade-finance-officer',
      'interest-free-banking-officer','sharia-compliance-officer',
      'treasury-officer','cashier','microfinance-officer',
      'insurance-officer','insurance-underwriter',
      'claims-officer','actuarial-analyst',
      'financial-analyst','investment-officer',
      'tax-officer','tax-consultant','revenue-officer',

      /* ENGINEERING */
      'civil-engineer','site-engineer','office-engineer',
      'resident-engineer','structural-engineer','geotechnical-engineer',
      'transport-engineer','highway-engineer',
      'water-engineer','hydraulic-engineer','sanitary-engineer',
      'electrical-engineer','power-engineer','mechanical-engineer',
      'electromechanical-engineer','industrial-engineer',
      'architect','landscape-architect','urban-planner',
      'quantity-surveyor','cost-engineer',
      'construction-manager','project-engineer',
      'site-supervisor','foreman',
      'draftsman','autocad-operator',
      'survey-engineer','land-surveyor',
      'building-inspector','material-engineer',

      /* AGRICULTURE */
      'agronomist','assistant-agronomist','crop-production-officer',
      'soil-scientist','irrigation-engineer','irrigation-technician',
      'horticulturist','plant-protection-officer',
      'livestock-production-officer','animal-health-officer',
      'veterinarian','assistant-veterinarian',
      'fisheries-officer','aquaculture-specialist',
      'beekeeper','apiculture-officer',
      'forestry-officer','natural-resource-management-officer',
      'environmental-officer','environmental-scientist',
      'climate-change-officer','climate-adaptation-specialist',
      'agricultural-economist','rural-development-officer',
      'extension-agent','agricultural-extension-worker',
      'seed-production-officer','fertilizer-marketing-officer',
      'agro-processing-officer','cooperative-officer',

      /* HEALTH */
      'general-practitioner','medical-doctor','specialist-physician',
      'surgeon','pediatrician','gynecologist',
      'nurse','staff-nurse','clinical-nurse',
      'midwife','anesthetist','pharmacist','druggist',
      'medical-laboratory-technologist','lab-technician',
      'radiographer','radiologist',
      'public-health-officer','epidemiologist',
      'health-extension-worker','health-education-officer',
      'hospital-administrator','health-information-officer',
      'biomedical-engineer','biomedical-technician',
      'physiotherapist','occupational-therapist',
      'nutritionist','dietitian',
      'mental-health-officer','psychologist',
      'psychiatric-nurse','emergency-medical-technician',

      /* EDUCATION */
      'kindergarten-teacher','primary-teacher','secondary-teacher',
      'high-school-teacher','university-lecturer','assistant-lecturer',
      'professor','academic-researcher',
      'tvet-trainer','technical-instructor',
      'language-teacher','english-instructor',
      'math-teacher','physics-teacher','chemistry-teacher',
      'school-director','school-principal',
      'academic-coordinator','education-officer',
      'curriculum-developer','education-planner',
      'school-supervisor','exam-officer',
      'guidance-counselor','special-needs-teacher',
      'librarian','e-learning-specialist',

      /* ADMIN */
      'administrative-assistant','office-assistant',
      'executive-secretary','secretary',
      'hr-officer','hr-manager','recruitment-officer',
      'training-officer','performance-management-officer',
      'personnel-officer','organizational-development-officer',
      'general-manager','operations-manager',
      'business-development-officer','strategy-officer',
      'customer-service-representative','call-center-agent',
      'sales-representative','sales-manager',
      'marketing-officer','brand-manager',
      'procurement-officer','procurement-manager',
      'supply-chain-officer','storekeeper',
      'inventory-controller','logistics-officer',

      /* DRIVERS */
      'driver','personal-driver','truck-driver',
      'bus-driver','heavy-truck-driver',
      'forklift-operator','machine-operator',
      'auto-mechanic','diesel-mechanic',
      'vehicle-electrician','garage-supervisor',
      'fleet-manager','transport-coordinator',
      'dispatch-officer','customs-clearing-officer',
      'port-officer','cargo-handler',
      'aviation-technician','aircraft-mechanic',

      /* HOSPITALITY */
      'hotel-manager','assistant-hotel-manager',
      'front-desk-officer','receptionist',
      'waiter','waitress','chef','assistant-chef',
      'cook','baker','pastry-chef',
      'housekeeping-supervisor','housekeeper',
      'barista','bartender',
      'tour-guide','travel-consultant',
      'event-coordinator','catering-supervisor',
      'restaurant-manager',

      /* SECURITY */
      'security-guard','chief-security-officer',
      'safety-officer','fire-safety-officer',
      'occupational-health-officer',
      'cleaner','janitor',
      'messenger','office-runner',
      'groundskeeper','maintenance-worker',
      'caretaker','store-assistant',
      'night-guard','loss-prevention-officer',

      /* GRADUATE */
      'graduate-trainee','intern','internship',
      'apprentice','volunteer','national-service',

      'other'
    ])
    .withMessage('Invalid category'),
  
  body('type')
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary', 'volunteer', 'remote', 'hybrid'])
    .withMessage('Invalid job type'),
  
  body('experienceLevel')
    .isIn(['fresh-graduate', 'entry-level', 'mid-level', 'senior-level', 'managerial', 'director', 'executive'])
    .withMessage('Invalid experience level'),
  
  body('educationLevel')
    .optional()
    .isIn([
      'primary-education',
      'secondary-education',
      'tvet-level-i',
      'tvet-level-ii',
      'tvet-level-iii',
      'tvet-level-iv',
      'tvet-level-v',
      'undergraduate-bachelors',
      'postgraduate-masters',
      'doctoral-phd',
      'lecturer',
      'professor',
      'none-required',
      // Backward compatibility
      'high-school',
      'diploma',
      'bachelors',
      'masters',
      'phd'
    ])
    .withMessage('Invalid education level'),
  
  body('location.region')
    .isIn([
      'addis-ababa', 'afar', 'amhara', 'benishangul-gumuz', 'dire-dawa',
      'gambela', 'harari', 'oromia', 'sidama', 'snnpr', 'somali',
      'south-west-ethiopia', 'tigray', 'international'
    ])
    .withMessage('Invalid region'),
  
  body('applicationDeadline')
    .isISO8601()
    .withMessage('Invalid application deadline date'),
  
  body('isApplyEnabled')
    .optional()
    .isBoolean()
    .withMessage('isApplyEnabled must be a boolean value'),
];

// Enhanced Validation for UPDATE (with new fields)
const updateJobValidation = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  // NEW: Validate candidatesNeeded for updates
  body('candidatesNeeded')
    .optional()
    .isInt({ min: 1 })
    .withMessage('At least 1 candidate is required')
    .toInt(),
  
  // Use custom validation for description text length
  validateTextLength('description', 50, 5000).optional(),
  
  body('shortDescription')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),
  
  // UPDATED: Validate salary mode for updates
  body('salaryMode')
    .optional()
    .isIn(['range', 'hidden', 'negotiable', 'company-scale'])
    .withMessage('Invalid salary mode'),
  
  // Validate salary fields conditionally based on salaryMode for updates
  validateSalaryMode('salaryMode').optional(),
  
  body('salary.currency')
    .optional()
    .custom((value, { req }) => {
      const salaryMode = req.body.salaryMode || req.body.salary?.mode || 'range';
      if (salaryMode === 'range' && !value && !req.body.salary?.currency) {
        throw new Error('Currency is required when salary mode is "range"');
      }
      if (value && !['ETB', 'USD', 'EUR', 'GBP'].includes(value)) {
        throw new Error('Invalid currency');
      }
      return true;
    }),
  
  body('salary.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number')
    .toFloat(),
  
  body('salary.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number')
    .toFloat()
    .custom((value, { req }) => {
      if (req.body.salary?.min && value && value < req.body.salary.min) {
        throw new Error('Maximum salary cannot be less than minimum salary');
      }
      return true;
    }),
  
  body('category')
    .optional()
    .isIn([
      /* =========================
         TECHNOLOGY & ICT
      ========================== */
      'software-developer','frontend-developer','backend-developer','fullstack-developer',
      'web-developer','mobile-app-developer','android-developer','ios-developer',
      'ai-engineer','machine-learning-engineer','data-scientist','data-analyst',
      'business-intelligence-analyst','database-administrator','system-administrator',
      'network-engineer','network-administrator','cloud-engineer','devops-engineer',
      'site-reliability-engineer','cybersecurity-analyst','soc-analyst','penetration-tester',
      'it-support-officer','it-support-technician','helpdesk-officer',
      'ui-designer','ux-designer','product-designer','product-manager',
      'scrum-master','it-project-manager','qa-engineer','software-tester',
      'automation-tester','erp-consultant','sap-consultant','odoo-developer',
      'crm-administrator','digital-transformation-specialist','fintech-specialist',
      'blockchain-developer','web3-developer','it-policy-advisor',
      'ict-trainer','computer-lab-technician',

      /* NGO / UN / DEVELOPMENT */
      'project-officer','project-manager','program-officer','program-manager',
      'me-officer','me-manager','wash-officer','wash-specialist',
      'livelihood-officer','food-security-officer','nutrition-officer',
      'protection-officer','child-protection-officer','gender-officer',
      'gbv-officer','peacebuilding-officer','resilience-officer',
      'community-mobilizer','community-development-officer',
      'social-development-officer','humanitarian-officer',
      'emergency-response-officer','disaster-risk-reduction-officer',
      'refugee-program-officer','migration-officer','durable-solutions-officer',
      'case-management-officer','psychosocial-support-officer',
      'grant-officer','grant-manager','proposal-writer','resource-mobilization-officer',
      'partnership-officer','advocacy-officer','policy-officer',
      'enumerator','field-officer','monitoring-assistant',

      /* FINANCE */
      'accountant','junior-accountant','senior-accountant',
      'auditor','internal-auditor','external-auditor',
      'bank-teller','customer-service-officer-banking',
      'relationship-manager','branch-manager','operations-manager-banking',
      'credit-officer','loan-officer','credit-analyst',
      'risk-officer','compliance-officer-banking',
      'forex-officer','trade-finance-officer',
      'interest-free-banking-officer','sharia-compliance-officer',
      'treasury-officer','cashier','microfinance-officer',
      'insurance-officer','insurance-underwriter',
      'claims-officer','actuarial-analyst',
      'financial-analyst','investment-officer',
      'tax-officer','tax-consultant','revenue-officer',

      /* ENGINEERING */
      'civil-engineer','site-engineer','office-engineer',
      'resident-engineer','structural-engineer','geotechnical-engineer',
      'transport-engineer','highway-engineer',
      'water-engineer','hydraulic-engineer','sanitary-engineer',
      'electrical-engineer','power-engineer','mechanical-engineer',
      'electromechanical-engineer','industrial-engineer',
      'architect','landscape-architect','urban-planner',
      'quantity-surveyor','cost-engineer',
      'construction-manager','project-engineer',
      'site-supervisor','foreman',
      'draftsman','autocad-operator',
      'survey-engineer','land-surveyor',
      'building-inspector','material-engineer',

      /* AGRICULTURE */
      'agronomist','assistant-agronomist','crop-production-officer',
      'soil-scientist','irrigation-engineer','irrigation-technician',
      'horticulturist','plant-protection-officer',
      'livestock-production-officer','animal-health-officer',
      'veterinarian','assistant-veterinarian',
      'fisheries-officer','aquaculture-specialist',
      'beekeeper','apiculture-officer',
      'forestry-officer','natural-resource-management-officer',
      'environmental-officer','environmental-scientist',
      'climate-change-officer','climate-adaptation-specialist',
      'agricultural-economist','rural-development-officer',
      'extension-agent','agricultural-extension-worker',
      'seed-production-officer','fertilizer-marketing-officer',
      'agro-processing-officer','cooperative-officer',

      /* HEALTH */
      'general-practitioner','medical-doctor','specialist-physician',
      'surgeon','pediatrician','gynecologist',
      'nurse','staff-nurse','clinical-nurse',
      'midwife','anesthetist','pharmacist','druggist',
      'medical-laboratory-technologist','lab-technician',
      'radiographer','radiologist',
      'public-health-officer','epidemiologist',
      'health-extension-worker','health-education-officer',
      'hospital-administrator','health-information-officer',
      'biomedical-engineer','biomedical-technician',
      'physiotherapist','occupational-therapist',
      'nutritionist','dietitian',
      'mental-health-officer','psychologist',
      'psychiatric-nurse','emergency-medical-technician',

      /* EDUCATION */
      'kindergarten-teacher','primary-teacher','secondary-teacher',
      'high-school-teacher','university-lecturer','assistant-lecturer',
      'professor','academic-researcher',
      'tvet-trainer','technical-instructor',
      'language-teacher','english-instructor',
      'math-teacher','physics-teacher','chemistry-teacher',
      'school-director','school-principal',
      'academic-coordinator','education-officer',
      'curriculum-developer','education-planner',
      'school-supervisor','exam-officer',
      'guidance-counselor','special-needs-teacher',
      'librarian','e-learning-specialist',

      /* ADMIN */
      'administrative-assistant','office-assistant',
      'executive-secretary','secretary',
      'hr-officer','hr-manager','recruitment-officer',
      'training-officer','performance-management-officer',
      'personnel-officer','organizational-development-officer',
      'general-manager','operations-manager',
      'business-development-officer','strategy-officer',
      'customer-service-representative','call-center-agent',
      'sales-representative','sales-manager',
      'marketing-officer','brand-manager',
      'procurement-officer','procurement-manager',
      'supply-chain-officer','storekeeper',
      'inventory-controller','logistics-officer',

      /* DRIVERS */
      'driver','personal-driver','truck-driver',
      'bus-driver','heavy-truck-driver',
      'forklift-operator','machine-operator',
      'auto-mechanic','diesel-mechanic',
      'vehicle-electrician','garage-supervisor',
      'fleet-manager','transport-coordinator',
      'dispatch-officer','customs-clearing-officer',
      'port-officer','cargo-handler',
      'aviation-technician','aircraft-mechanic',

      /* HOSPITALITY */
      'hotel-manager','assistant-hotel-manager',
      'front-desk-officer','receptionist',
      'waiter','waitress','chef','assistant-chef',
      'cook','baker','pastry-chef',
      'housekeeping-supervisor','housekeeper',
      'barista','bartender',
      'tour-guide','travel-consultant',
      'event-coordinator','catering-supervisor',
      'restaurant-manager',

      /* SECURITY */
      'security-guard','chief-security-officer',
      'safety-officer','fire-safety-officer',
      'occupational-health-officer',
      'cleaner','janitor',
      'messenger','office-runner',
      'groundskeeper','maintenance-worker',
      'caretaker','store-assistant',
      'night-guard','loss-prevention-officer',

      /* GRADUATE */
      'graduate-trainee','intern','internship',
      'apprentice','volunteer','national-service',

      'other'
    ])
    .withMessage('Invalid category'),
  
  body('type')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary', 'volunteer', 'remote', 'hybrid'])
    .withMessage('Invalid job type'),
  
  body('experienceLevel')
    .optional()
    .isIn(['fresh-graduate', 'entry-level', 'mid-level', 'senior-level', 'managerial', 'director', 'executive'])
    .withMessage('Invalid experience level'),
  
  body('educationLevel')
    .optional()
    .isIn([
      'primary-education',
      'secondary-education',
      'tvet-level-i',
      'tvet-level-ii',
      'tvet-level-iii',
      'tvet-level-iv',
      'tvet-level-v',
      'undergraduate-bachelors',
      'postgraduate-masters',
      'doctoral-phd',
      'lecturer',
      'professor',
      'none-required',
      // Backward compatibility
      'high-school',
      'diploma',
      'bachelors',
      'masters',
      'phd'
    ])
    .withMessage('Invalid education level'),
  
  body('location.region')
    .optional()
    .isIn([
      'addis-ababa', 'afar', 'amhara', 'benishangul-gumuz', 'dire-dawa',
      'gambela', 'harari', 'oromia', 'sidama', 'snnpr', 'somali',
      'south-west-ethiopia', 'tigray', 'international'
    ])
    .withMessage('Invalid region'),
  
  body('applicationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid application deadline date'),
  
  body('isApplyEnabled')
    .optional()
    .isBoolean()
    .withMessage('isApplyEnabled must be a boolean value'),
];

// ========== PUBLIC ROUTES ==========
router.get('/', getJobs);
router.get('/categories', getCategories);

// ========== PROTECTED ROUTES ==========
router.use(verifyToken);

// ========== SPECIFIC ROUTES (MUST COME BEFORE PARAMETERIZED ROUTES) ==========

// Company specific routes
router.get('/company/my-jobs', restrictTo('company', 'admin'), getCompanyJobs);

// Organization specific routes
router.get('/organization/my-jobs', restrictTo('organization', 'admin'), getOrganizationJobs);

// Candidate specific routes
router.get('/candidate/jobs', restrictTo('candidate'), getJobsForCandidate);
router.get('/saved/jobs', restrictTo('candidate'), getSavedJobs);

// ========== CREATE ROUTES ==========
router.post('/', restrictTo('company', 'admin'), createJobValidation, createJob);
router.post('/organization', restrictTo('organization', 'admin'), createJobValidation, createOrganizationJob);

// ========== SAVE/UNSAVE ROUTES ==========
router.post('/:jobId/save', restrictTo('candidate'), saveJob);
router.post('/:jobId/unsave', restrictTo('candidate'), unsaveJob);

// ========== ORGANIZATION PARAMETERIZED ROUTES ==========
router.put('/organization/:id', restrictTo('organization', 'admin'), updateJobValidation, updateOrganizationJob);
router.delete('/organization/:id', restrictTo('organization', 'admin'), deleteOrganizationJob);

// ========== GENERAL PARAMETERIZED ROUTES (MUST BE LAST) ==========
router.get('/:id', getJob);
router.put('/:id', restrictTo('company', 'admin'), updateJobValidation, updateJob);
router.delete('/:id', restrictTo('company', 'admin'), deleteJob);

module.exports = router;