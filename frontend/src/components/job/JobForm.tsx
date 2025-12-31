/* eslint-disable @typescript-eslint/no-explicit-any */
// components/JobForm.tsx - COMPLETE VERSION WITH RICH TEXT EDITOR
import React, { useState, useEffect } from 'react';
import { Job, EthiopianLocation, JobSalary, Duration, VolunteerInfo, jobService } from '@/services/jobService';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  BookOpen,
  Calendar,
  CheckCircle,
  X,
  Save,
  Send,
  Eye,
  EyeOff,
  AlertCircle,
  Tag,
  Star,
  Clock,
  Users,
  Heart,
  Home,
  Building,
  Search,
  Target,
  GraduationCap,
  Award,
  Shield
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import RichTextEditor from '../ui/RichTextEditor';

// Use the Job interface from jobService with proper company job type
type JobFormData = Omit<Job, '_id' | 'company' | 'organization' | 'createdBy' | 'applicationCount' | 'viewCount' | 'saveCount' | 'createdAt' | 'updatedAt' | 'isActive' | 'applications' | 'views' | 'jobType' | 'opportunityType' | 'duration' | 'volunteerInfo'> & {
  salary?: JobSalary;
  applicationDeadline: string;
  shortDescription: string;
  status: 'draft' | 'active' | 'paused' | 'closed' | 'archived';
  jobType: 'company' | 'organization';
  demographicRequirements?: {
    sex: 'male' | 'female' | 'any';
    age?: {
      min?: number;
      max?: number;
    };
  };
  jobNumber?: string;
  // Organization specific fields
  opportunityType?: 'job' | 'volunteer' | 'internship' | 'fellowship' | 'training' | 'grant' | 'other';
  duration?: Duration;
  volunteerInfo?: VolunteerInfo;
};

interface JobFormProps {
  initialData?: Job;
  onSubmit: (data: Partial<Job>) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
  companyVerified?: boolean;
  organizationVerified?: boolean;
  mode?: 'create' | 'edit';
  jobType?: 'company' | 'organization';
}

// Define a comprehensive category type
interface JobCategory {
  value: string;
  label: string;
  description?: string;
}

const JobForm: React.FC<JobFormProps> = ({ 
  initialData, 
  onSubmit, 
  loading = false, 
  onCancel,
  companyVerified = false,
  organizationVerified = false,
  mode = 'create',
  jobType = 'company'
}) => {
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    shortDescription: '',
    requirements: [''],
    responsibilities: [''],
    benefits: [''],
    skills: [''],
    type: 'full-time',
    location: {
      region: 'addis-ababa',
      city: '',
      country: 'Ethiopia',
      subCity: '',
      woreda: '',
      specificLocation: ''
    },
    salary: {
      min: undefined,
      max: undefined,
      currency: 'ETB',
      period: 'monthly',
      isPublic: true,
      isNegotiable: false
    },
    category: '',
    experienceLevel: 'mid-level',
    educationLevel: 'secondary-education',
    status: 'draft',
    applicationDeadline: '',
    remote: 'on-site',
    workArrangement: 'office',
    tags: [],
    featured: false,
    urgent: false,
    premium: false,
    jobType: jobType,
    demographicRequirements: {
      sex: 'any',
      age: {
        min: undefined,
        max: undefined
      }
    },
    jobNumber: '',
    // Organization specific initial values
    opportunityType: 'job',
    duration: {
      value: undefined,
      unit: 'months',
      isOngoing: false
    },
    volunteerInfo: {
      hoursPerWeek: undefined,
      commitmentLevel: 'regular',
      providesAccommodation: false,
      providesStipend: false
    }
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [allCategories, setAllCategories] = useState<JobCategory[]>([]);
  const [descriptionError, setDescriptionError] = useState<string>('');

  // Get data from service
  const ethiopianRegions = jobService.getEthiopianRegions();
  const educationLevels = jobService.getEducationLevels();
  const opportunityTypes = jobService.getOpportunityTypes();
  const commitmentLevels = jobService.getCommitmentLevels();
  const durationUnits = jobService.getDurationUnits();
  
  // Load ALL categories for both company and organization
  useEffect(() => {
    const loadAllCategories = () => {
      try {
        // Get all categories from the service
        const categories = jobService.getJobCategories();
        
        if (categories && categories.length > 0) {
          console.log(`📊 Loaded ${categories.length} categories for ${jobType} form`);
          setAllCategories(categories);
        } else {
          // Fallback categories if service returns empty
          console.warn('No categories found from service, using fallback categories');
          const fallbackCategories: JobCategory[] = [
            // Technology & IT
            { value: 'software-developer', label: 'Software Developer' },
            { value: 'web-developer', label: 'Web Developer' },
            { value: 'mobile-developer', label: 'Mobile App Developer' },
            { value: 'frontend-developer', label: 'Frontend Developer' },
            { value: 'backend-developer', label: 'Backend Developer' },
            { value: 'fullstack-developer', label: 'Full Stack Developer' },
            { value: 'devops-engineer', label: 'DevOps Engineer' },
            { value: 'data-scientist', label: 'Data Scientist' },
            { value: 'data-analyst', label: 'Data Analyst' },
            { value: 'database-admin', label: 'Database Administrator' },
            { value: 'it-support', label: 'IT Support Specialist' },
            { value: 'network-engineer', label: 'Network Engineer' },
            { value: 'cybersecurity-analyst', label: 'Cybersecurity Analyst' },
            { value: 'ui-ux-designer', label: 'UI/UX Designer' },
            { value: 'qa-engineer', label: 'QA Engineer' },
            
            // Business & Management
            { value: 'project-manager', label: 'Project Manager' },
            { value: 'product-manager', label: 'Product Manager' },
            { value: 'business-analyst', label: 'Business Analyst' },
            { value: 'operations-manager', label: 'Operations Manager' },
            { value: 'hr-manager', label: 'HR Manager' },
            { value: 'recruiter', label: 'Recruiter' },
            { value: 'office-manager', label: 'Office Manager' },
            
            // Marketing & Sales
            { value: 'digital-marketing', label: 'Digital Marketing Specialist' },
            { value: 'social-media-manager', label: 'Social Media Manager' },
            { value: 'content-writer', label: 'Content Writer' },
            { value: 'seo-specialist', label: 'SEO Specialist' },
            { value: 'sales-representative', label: 'Sales Representative' },
            { value: 'account-manager', label: 'Account Manager' },
            { value: 'business-development', label: 'Business Development Manager' },
            
            // Finance & Accounting
            { value: 'accountant', label: 'Accountant' },
            { value: 'financial-analyst', label: 'Financial Analyst' },
            { value: 'auditor', label: 'Auditor' },
            { value: 'bookkeeper', label: 'Bookkeeper' },
            { value: 'tax-consultant', label: 'Tax Consultant' },
            
            // Healthcare
            { value: 'doctor', label: 'Doctor' },
            { value: 'nurse', label: 'Nurse' },
            { value: 'pharmacist', label: 'Pharmacist' },
            { value: 'medical-lab', label: 'Medical Lab Technician' },
            { value: 'healthcare-assistant', label: 'Healthcare Assistant' },
            
            // Education
            { value: 'teacher', label: 'Teacher' },
            { value: 'professor', label: 'Professor' },
            { value: 'tutor', label: 'Tutor' },
            { value: 'education-coordinator', label: 'Education Coordinator' },
            
            // Engineering
            { value: 'civil-engineer', label: 'Civil Engineer' },
            { value: 'mechanical-engineer', label: 'Mechanical Engineer' },
            { value: 'electrical-engineer', label: 'Electrical Engineer' },
            { value: 'chemical-engineer', label: 'Chemical Engineer' },
            
            // Creative & Design
            { value: 'graphic-designer', label: 'Graphic Designer' },
            { value: 'video-editor', label: 'Video Editor' },
            { value: 'photographer', label: 'Photographer' },
            { value: 'animator', label: 'Animator' },
            
            // Customer Service
            { value: 'customer-service', label: 'Customer Service Representative' },
            { value: 'call-center', label: 'Call Center Agent' },
            { value: 'technical-support', label: 'Technical Support' },
            
            // Logistics & Supply Chain
            { value: 'logistics-coordinator', label: 'Logistics Coordinator' },
            { value: 'supply-chain-manager', label: 'Supply Chain Manager' },
            { value: 'procurement-officer', label: 'Procurement Officer' },
            
            // Legal
            { value: 'lawyer', label: 'Lawyer' },
            { value: 'legal-advisor', label: 'Legal Advisor' },
            { value: 'paralegal', label: 'Paralegal' },
            
            // Non-profit & Social Work (Organization focused)
            { value: 'social-worker', label: 'Social Worker' },
            { value: 'community-development', label: 'Community Development Specialist' },
            { value: 'nonprofit-manager', label: 'Nonprofit Manager' },
            { value: 'environmental-scientist', label: 'Environmental Scientist' },
            { value: 'environmental-engineer', label: 'Environmental Engineer' },
            { value: 'volunteer-coordinator', label: 'Volunteer Coordinator' },
            { value: 'grant-writer', label: 'Grant Writer' },
            { value: 'fundraising-manager', label: 'Fundraising Manager' },
            
            // Other
            { value: 'research-assistant', label: 'Research Assistant' },
            { value: 'administrative-assistant', label: 'Administrative Assistant' },
            { value: 'receptionist', label: 'Receptionist' },
            { value: 'driver', label: 'Driver' },
            { value: 'security-guard', label: 'Security Guard' },
            { value: 'other', label: 'Other' }
          ];
          
          setAllCategories(fallbackCategories);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        // Emergency fallback
        setAllCategories([
          { value: 'software-developer', label: 'Software Developer' },
          { value: 'project-manager', label: 'Project Manager' },
          { value: 'social-worker', label: 'Social Worker' },
          { value: 'teacher', label: 'Teacher' },
          { value: 'accountant', label: 'Accountant' },
          { value: 'other', label: 'Other' }
        ]);
      }
    };

    loadAllCategories();
  }, [jobType]);

  // Filter categories based on search
  const filteredCategories = allCategories.filter(category =>
    category.label.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Safe education level normalization function
  const normalizeEducationLevel = (level: string): Job['educationLevel'] => {
    const mapping: Record<string, Job['educationLevel']> = {
      'high-school': 'secondary-education',
      'diploma': 'tvet-level-iii',
      'bachelors': 'undergraduate-bachelors',
      'masters': 'postgraduate-masters',
      'phd': 'doctoral-phd'
    };
    return mapping[level] || (level as Job['educationLevel']);
  };

  useEffect(() => {
    if (initialData) {
      // Transform the initial data to match form structure
      const transformedData: JobFormData = {
        title: initialData.title,
        description: initialData.description,
        shortDescription: initialData.shortDescription || '',
        requirements: initialData.requirements.length > 0 ? initialData.requirements : [''],
        responsibilities: initialData.responsibilities.length > 0 ? initialData.responsibilities : [''],
        benefits: initialData.benefits?.length > 0 ? initialData.benefits : [''],
        skills: initialData.skills.length > 0 ? initialData.skills : [''],
        type: initialData.type,
        location: initialData.location,
        salary: initialData.salary || {
          min: undefined,
          max: undefined,
          currency: 'ETB',
          period: 'monthly',
          isPublic: true,
          isNegotiable: false
        },
        category: initialData.category,
        subCategory: initialData.subCategory,
        experienceLevel: initialData.experienceLevel,
        educationLevel: initialData.educationLevel,
        status: initialData.status,
        applicationDeadline: initialData.applicationDeadline ? 
          new Date(initialData.applicationDeadline).toISOString().split('T')[0] : '',
        remote: initialData.remote,
        workArrangement: initialData.workArrangement || 'office',
        tags: initialData.tags || [],
        featured: initialData.featured || false,
        urgent: initialData.urgent || false,
        premium: initialData.premium || false,
        jobType: initialData.jobType || jobType,
        demographicRequirements: initialData.demographicRequirements || {
          sex: 'any',
          age: {
            min: undefined,
            max: undefined
          }
        },
        jobNumber: initialData.jobNumber || '',
        // Organization specific fields
        opportunityType: initialData.opportunityType || 'job',
        duration: initialData.duration || {
          value: undefined,
          unit: 'months',
          isOngoing: false
        },
        volunteerInfo: initialData.volunteerInfo || {
          hoursPerWeek: undefined,
          commitmentLevel: 'regular',
          providesAccommodation: false,
          providesStipend: false
        }
      };
      
      setFormData(transformedData);
      // Set category search to display the current category label
      if (initialData.category) {
        const currentCategory = allCategories.find(cat => cat.value === initialData.category);
        if (currentCategory) {
          setCategorySearch(currentCategory.label);
        }
      }
    }
  }, [initialData, jobType, allCategories]);

  // Update formData when jobType prop changes
  useEffect(() => {
    if (mode === 'create') {
      setFormData(prev => ({
        ...prev,
        jobType: jobType
      }));
    }
  }, [jobType, mode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
      isValid = false;
    } else if (formData.title.length < 5) {
      newErrors.title = 'Job title must be at least 5 characters long';
      isValid = false;
    }

    // Validate description (strip HTML tags for character count)
    const plainTextDescription = formData.description.replace(/<[^>]*>/g, '').trim();
    if (!plainTextDescription) {
      setDescriptionError('Job description is required');
      isValid = false;
    } else if (plainTextDescription.length < 50) {
      setDescriptionError('Job description must be at least 50 characters long');
      isValid = false;
    } else {
      setDescriptionError('');
    }

    if (!formData.category) {
      newErrors.category = 'Job category is required';
      isValid = false;
    }

    if (!formData.location.region) {
      newErrors.region = 'Region is required';
      isValid = false;
    }

    if (formData.location.region !== 'international' && !formData.location.city) {
      newErrors.city = 'City is required for Ethiopian job postings';
      isValid = false;
    }

    if (formData.salary?.min && formData.salary?.max && formData.salary.min > formData.salary.max) {
      newErrors.salary = 'Minimum salary cannot be greater than maximum salary';
      isValid = false;
    }

    if (!formData.applicationDeadline) {
      newErrors.applicationDeadline = 'Application deadline is required';
      isValid = false;
    } else if (new Date(formData.applicationDeadline) <= new Date()) {
      newErrors.applicationDeadline = 'Application deadline must be in the future';
      isValid = false;
    }

    // Validate age requirements
    if (formData.demographicRequirements?.age) {
      const { min, max } = formData.demographicRequirements.age;
      if (min && max && min > max) {
        newErrors.age = 'Minimum age cannot be greater than maximum age';
        isValid = false;
      }
      if (min && (min < 18 || min > 100)) {
        newErrors.age = 'Minimum age must be between 18 and 100';
        isValid = false;
      }
      if (max && (max < 18 || max > 100)) {
        newErrors.age = 'Maximum age must be between 18 and 100';
        isValid = false;
      }
    }

    // Organization specific validations
    if (formData.jobType === 'organization') {
      if (formData.opportunityType === 'volunteer' && formData.volunteerInfo?.hoursPerWeek) {
        if (formData.volunteerInfo.hoursPerWeek < 1 || formData.volunteerInfo.hoursPerWeek > 40) {
          newErrors.hoursPerWeek = 'Hours per week must be between 1 and 40';
          isValid = false;
        }
      }

      if (formData.duration?.value && formData.duration.value < 1) {
        newErrors.duration = 'Duration value must be at least 1';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      description: value
    }));
    
    // Clear description error when user starts typing
    if (descriptionError) {
      setDescriptionError('');
    }
  };

  const handleLocationChange = (field: keyof EthiopianLocation, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));

    if (field === 'region' && value === 'international') {
      // Auto-set city for international jobs
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          city: 'Remote Worldwide',
          country: 'International'
        },
        remote: 'remote'
      }));
    }
  };

  const handleSalaryChange = (field: keyof NonNullable<JobFormData['salary']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      salary: {
        ...prev.salary!,
        [field]: field === 'min' || field === 'max' ? (value === '' ? undefined : Number(value)) : value
      }
    }));

    if (errors.salary) {
      setErrors(prev => ({ ...prev, salary: '' }));
    }
  };

  const handleDemographicChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      demographicRequirements: {
        ...prev.demographicRequirements!,
        [field]: field === 'sex' ? value : {
          ...prev.demographicRequirements?.age,
          ...value
        }
      }
    }));

    if (errors.age) {
      setErrors(prev => ({ ...prev, age: '' }));
    }
  };

  // Organization specific handlers
  const handleOpportunityTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      opportunityType: value as any
    }));
  };

  const handleDurationChange = (field: keyof Duration, value: any) => {
    setFormData(prev => ({
      ...prev,
      duration: {
        ...prev.duration!,
        [field]: field === 'value' ? (value === '' ? undefined : Number(value)) : value
      }
    }));
  };

  const handleVolunteerInfoChange = (field: keyof VolunteerInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      volunteerInfo: {
        ...prev.volunteerInfo!,
        [field]: field === 'hoursPerWeek' ? (value === '' ? undefined : Number(value)) : value
      }
    }));
  };

  const handleArrayChange = (
    field: 'requirements' | 'responsibilities' | 'benefits' | 'skills', 
    index: number, 
    value: string
  ) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field: 'requirements' | 'responsibilities' | 'benefits' | 'skills') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (
    field: 'requirements' | 'responsibilities' | 'benefits' | 'skills', 
    index: number
  ) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const handleTagAdd = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleCategorySelect = (categoryValue: string, categoryLabel: string) => {
    setFormData(prev => ({
      ...prev,
      category: categoryValue
    }));
    setCategorySearch(categoryLabel);
    setShowCategoryDropdown(false);
  };

  // Enhanced category search with better UX
  const handleCategorySearchChange = (value: string) => {
    setCategorySearch(value);
    setShowCategoryDropdown(true);
  };

  const handleSubmit = async (e: React.FormEvent, status?: 'draft' | 'active' | 'paused' | 'closed' | 'archived') => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form before submitting.',
        variant: 'destructive',
      });
      return;
    }

    // Prepare data for submission - ensure all fields are properly formatted
    const submitData: Partial<Job> = {
      title: formData.title.trim(),
      description: formData.description,
      shortDescription: formData.shortDescription?.trim() || '',
      requirements: formData.requirements.filter(req => req.trim() !== ''),
      responsibilities: formData.responsibilities.filter(resp => resp.trim() !== ''),
      benefits: formData.benefits.filter(benefit => benefit.trim() !== ''),
      skills: formData.skills.filter(skill => skill.trim() !== ''),
      type: formData.type,
      location: formData.location,
      category: formData.category,
      experienceLevel: formData.experienceLevel,
      educationLevel: formData.educationLevel ? normalizeEducationLevel(formData.educationLevel) : undefined,
      status: status || formData.status,
      remote: formData.remote,
      workArrangement: formData.workArrangement,
      jobType: formData.jobType,
      featured: formData.featured,
      urgent: formData.urgent,
      premium: formData.premium,
      tags: formData.tags,
      demographicRequirements: formData.demographicRequirements,
      jobNumber: formData.jobNumber?.trim() || undefined
    };

    // Only include salary if it has values
    if (formData.salary?.min || formData.salary?.max) {
      submitData.salary = formData.salary;
    }

    // Format application deadline properly
    if (formData.applicationDeadline) {
      submitData.applicationDeadline = new Date(formData.applicationDeadline).toISOString();
    }

    // Include subCategory if it exists
    if (formData.subCategory) {
      submitData.subCategory = formData.subCategory;
    }

    // Organization specific fields
    if (formData.jobType === 'organization') {
      submitData.opportunityType = formData.opportunityType;
      
      // Only include duration if it has values
      if (formData.duration?.value || formData.duration?.isOngoing) {
        submitData.duration = formData.duration;
      }

      // Only include volunteerInfo for volunteer opportunities
      if (formData.opportunityType === 'volunteer' && formData.volunteerInfo) {
        submitData.volunteerInfo = formData.volunteerInfo;
      }
    }
    
    console.log('📤 Submitting job data:', submitData);
    console.log('📊 Available categories count:', allCategories.length);
    
    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting job:', error);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && (!formData.title || !formData.category || !formData.location.region)) {
      setErrors({
        title: !formData.title ? 'Job title is required' : '',
        category: !formData.category ? 'Category is required' : '',
        region: !formData.location.region ? 'Region is required' : ''
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const selectedRegion = ethiopianRegions.find(region => region.slug === formData.location.region);
  const isInternational = formData.location.region === 'international';
  const isOrganization = formData.jobType === 'organization';
  const isVolunteer = isOrganization && formData.opportunityType === 'volunteer';

  // Preview data for summary
  const previewData = {
    ...formData,
    salary: formData.salary?.isPublic ? formData.salary : undefined
  };

  // Get the current category label for display
  const currentCategoryLabel = allCategories.find(cat => cat.value === formData.category)?.label || formData.category;

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {mode === 'edit' ? `Edit ${isOrganization ? 'Opportunity' : 'Job'} Posting` : `Create New ${isOrganization ? 'Opportunity' : 'Job'}`}
            </h2>
            <p className="text-gray-600">
              {mode === 'edit' 
                ? `Update your ${isOrganization ? 'opportunity' : 'job'} posting details below.` 
                : `Fill in the details to create a new ${isOrganization ? 'opportunity' : 'job'} posting.`
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
              {isOrganization ? <Heart className="w-4 h-4" /> : <Building className="w-4 h-4" />}
              {isOrganization ? 'Organization Opportunity' : 'Company Job'}
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        {/* Step Labels */}
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>Basic Info</span>
          <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>Location & Salary</span>
          <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>Details</span>
          <span className={currentStep >= 4 ? 'text-blue-600 font-medium' : ''}>Review</span>
        </div>

        {!companyVerified && !organizationVerified && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">
                Your {isOrganization ? 'organization' : 'company'} profile is not verified. This {isOrganization ? 'opportunity' : 'job'} will require admin approval before being published.
              </span>
            </div>
          </div>
        )}
      </div>

      {showPreview ? (
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{isOrganization ? 'Opportunity' : 'Job'} Preview</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{previewData.title}</h4>
              <p className="text-gray-600">{previewData.shortDescription}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {jobService.getJobTypeLabel(previewData.type)}
              </span>
              {isOrganization && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {opportunityTypes.find(opt => opt.value === previewData.opportunityType)?.label}
                </span>
              )}
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {jobService.getExperienceLabel(previewData.experienceLevel)}
              </span>
              {previewData.remote !== 'on-site' && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {previewData.remote}
                </span>
              )}
            </div>
            {previewData.salary && (
              <div className="text-lg font-semibold text-green-600">
                {jobService.formatSalary(previewData.salary)}
              </div>
            )}
            <div>
              <h5 className="font-semibold text-gray-900 mb-2">Description</h5>
              <div 
                className="text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewData.description }}
              />
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Job Title */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isOrganization ? 'Opportunity Title' : 'Job Title'} *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={isOrganization ? "e.g. Community Volunteer, Education Fellow..." : "e.g. Senior Frontend Developer, Marketing Manager..."}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Job Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isOrganization ? 'Opportunity Number' : 'Job Number'} (Optional)
                  </label>
                  <input
                    type="text"
                    name="jobNumber"
                    value={formData.jobNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={isOrganization ? "e.g. VOL-2024-001" : "e.g. HR-2024-001"}
                  />
                </div>

                {/* Opportunity Type (Organization Only) */}
                {isOrganization && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opportunity Type *
                    </label>
                    <select
                      value={formData.opportunityType}
                      onChange={(e) => handleOpportunityTypeChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {opportunityTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Short Description */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description
                  </label>
                  <textarea
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Brief summary of the ${isOrganization ? 'opportunity' : 'job'} (appears in search results)...`}
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {formData.shortDescription.length}/200 characters
                  </div>
                </div>

                {/* Job Type and Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isOrganization ? 'Engagement Type' : 'Job Type'} *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="temporary">Temporary</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                {/* Job Category with Search - FIXED VERSION */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isOrganization ? 'Opportunity Category' : 'Job Category'} *
                    <span className="text-xs text-gray-500 ml-1">
                      ({allCategories.length} categories available)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => handleCategorySearchChange(e.target.value)}
                      onFocus={() => setShowCategoryDropdown(true)}
                      placeholder={`Search from ${allCategories.length} categories...`}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.category ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <Search className="absolute right-3 top-3.5 h-4 w-4 text-gray-400" />
                  </div>
                  
                  {/* Show current selection when dropdown is closed */}
                  {!showCategoryDropdown && formData.category && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        <Target className="w-3 h-3 mr-1" />
                        Selected: {currentCategoryLabel}
                      </span>
                    </div>
                  )}

                  {showCategoryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map(category => (
                          <div
                            key={category.value}
                            onClick={() => handleCategorySelect(category.value, category.label)}
                            className={`px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              formData.category === category.value ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                          >
                            <div className="font-medium">{category.label}</div>
                            {category.description && (
                              <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">No categories found</div>
                      )}
                    </div>
                  )}
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                {/* Experience and Education */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level *
                  </label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="fresh-graduate">Fresh Graduate</option>
                    <option value="entry-level">Entry Level</option>
                    <option value="mid-level">Mid Level</option>
                    <option value="senior-level">Senior Level</option>
                    <option value="managerial">Managerial</option>
                    <option value="director">Director</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <GraduationCap className="w-4 h-4 inline mr-1" />
                    Education Level
                  </label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {educationLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Organization Specific Fields */}
                {isOrganization && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Award className="w-4 h-4 inline mr-1" />
                        Duration
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={formData.duration?.value || ''}
                          onChange={(e) => handleDurationChange('value', e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Duration"
                          min="1"
                        />
                        <select
                          value={formData.duration?.unit || 'months'}
                          onChange={(e) => handleDurationChange('unit', e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {durationUnits.map(unit => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center mt-6">
                        <input
                          type="checkbox"
                          checked={formData.duration?.isOngoing || false}
                          onChange={(e) => handleDurationChange('isOngoing', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Ongoing opportunity</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Demographic Requirements */}
                <div className="lg:col-span-2 border-t pt-4 mt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Demographic Requirements
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender Preference
                      </label>
                      <select
                        value={formData.demographicRequirements?.sex || 'any'}
                        onChange={(e) => handleDemographicChange('sex', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="any">Any Gender</option>
                        <option value="male">Male Only</option>
                        <option value="female">Female Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Age
                      </label>
                      <input
                        type="number"
                        value={formData.demographicRequirements?.age?.min || ''}
                        onChange={(e) => handleDemographicChange('age', { min: e.target.value ? Number(e.target.value) : undefined })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.age ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="18"
                        min="18"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Age
                      </label>
                      <input
                        type="number"
                        value={formData.demographicRequirements?.age?.max || ''}
                        onChange={(e) => handleDemographicChange('age', { max: e.target.value ? Number(e.target.value) : undefined })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.age ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="65"
                        min="18"
                        max="100"
                      />
                    </div>
                  </div>
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location & Compensation */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Location Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Location Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Region */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Region *
                    </label>
                    <select
                      value={formData.location.region}
                      onChange={(e) => handleLocationChange('region', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.region ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      {ethiopianRegions.map(region => (
                        <option key={region.slug} value={region.slug}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                    {errors.region && (
                      <p className="mt-1 text-sm text-red-600">{errors.region}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isInternational ? 'Location' : 'City *'}
                    </label>
                    {isInternational ? (
                      <input
                        type="text"
                        value={formData.location.city}
                        onChange={(e) => handleLocationChange('city', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. Remote Worldwide"
                      />
                    ) : (
                      <select
                        value={formData.location.city}
                        onChange={(e) => handleLocationChange('city', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.city ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select a city</option>
                        {selectedRegion?.cities.map(city => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                    )}
                  </div>

                  {/* Work Arrangement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Arrangement *
                    </label>
                    <select
                      name="remote"
                      value={formData.remote}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="on-site">On-Site</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workplace Type
                    </label>
                    <select
                      name="workArrangement"
                      value={formData.workArrangement}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="office">Office</option>
                      <option value="field-work">Field Work</option>
                      <option value="both">Both</option>
                    </select>
                  </div>

                  {/* Specific Location Details */}
                  {!isInternational && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sub-City
                        </label>
                        <input
                          type="text"
                          value={formData.location.subCity}
                          onChange={(e) => handleLocationChange('subCity', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g. Bole, Kirkos..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Woreda
                        </label>
                        <input
                          type="text"
                          value={formData.location.woreda}
                          onChange={(e) => handleLocationChange('woreda', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g. Woreda 03..."
                        />
                      </div>
                    </>
                  )}

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specific Location
                    </label>
                    <input
                      type="text"
                      value={formData.location.specificLocation}
                      onChange={(e) => handleLocationChange('specificLocation', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. Bole Road, near Friendship City Center..."
                    />
                  </div>
                </div>
              </div>

              {/* Compensation Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                  {isVolunteer ? 'Compensation Information' : 'Salary Information'}
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <div className="flex items-center space-x-4 mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.salary?.isPublic || false}
                          onChange={(e) => handleSalaryChange('isPublic', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {isVolunteer ? 'Show compensation details' : 'Show salary in posting'}
                        </span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.salary?.isNegotiable || false}
                          onChange={(e) => handleSalaryChange('isNegotiable', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {isVolunteer ? 'Compensation is negotiable' : 'Salary is negotiable'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isVolunteer ? 'Minimum Stipend' : 'Minimum Salary'}
                    </label>
                    <input
                      type="number"
                      value={formData.salary?.min || ''}
                      onChange={(e) => handleSalaryChange('min', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isVolunteer ? 'Maximum Stipend' : 'Maximum Salary'}
                    </label>
                    <input
                      type="number"
                      value={formData.salary?.max || ''}
                      onChange={(e) => handleSalaryChange('max', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  {errors.salary && (
                    <div className="lg:col-span-2">
                      <p className="text-sm text-red-600">{errors.salary}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency *
                    </label>
                    <select
                      value={formData.salary?.currency || 'ETB'}
                      onChange={(e) => handleSalaryChange('currency', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ETB">ETB - Ethiopian Birr</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pay Period *
                    </label>
                    <select
                      value={formData.salary?.period || 'monthly'}
                      onChange={(e) => handleSalaryChange('period', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="hourly">Per Hour</option>
                      <option value="daily">Per Day</option>
                      <option value="weekly">Per Week</option>
                      <option value="monthly">Per Month</option>
                      <option value="yearly">Per Year</option>
                    </select>
                  </div>
                </div>

                {/* Volunteer Specific Information */}
                {isVolunteer && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Heart className="w-5 h-5 mr-2 text-green-600" />
                      Volunteer Specific Information
                    </h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hours Per Week
                        </label>
                        <input
                          type="number"
                          value={formData.volunteerInfo?.hoursPerWeek || ''}
                          onChange={(e) => handleVolunteerInfoChange('hoursPerWeek', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.hoursPerWeek ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="e.g., 20"
                          min="1"
                          max="40"
                        />
                        {errors.hoursPerWeek && (
                          <p className="mt-1 text-sm text-red-600">{errors.hoursPerWeek}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Commitment Level
                        </label>
                        <select
                          value={formData.volunteerInfo?.commitmentLevel || 'regular'}
                          onChange={(e) => handleVolunteerInfoChange('commitmentLevel', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {commitmentLevels.map(level => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="lg:col-span-2">
                        <div className="flex items-center space-x-6">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.volunteerInfo?.providesAccommodation || false}
                              onChange={(e) => handleVolunteerInfoChange('providesAccommodation', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                              <Home className="w-4 h-4" />
                              Provides accommodation
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.volunteerInfo?.providesStipend || false}
                              onChange={(e) => handleVolunteerInfoChange('providesStipend', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                              <Shield className="w-4 h-4" />
                              Provides stipend
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Job Details & Requirements */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Job Description */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  {isOrganization ? 'Opportunity Description & Requirements' : 'Job Description & Requirements'}
                </h3>
                
                <div className="space-y-6">
                  {/* Job Description with Rich Text Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isOrganization ? 'Opportunity Description' : 'Job Description'} *
                    </label>
                    <RichTextEditor
                      value={formData.description}
                      onChange={handleDescriptionChange}
                      placeholder={`Describe the ${isOrganization ? 'opportunity responsibilities, organization mission, and impact' : 'job responsibilities, company culture, and what makes this opportunity special'}...`}
                      minHeight={300}
                      maxHeight={500}
                      error={!!descriptionError}
                      label=""
                      helperText={descriptionError || "Write a detailed description of the position. You can format text, add lists, links, images, and more."}
                      required
                    />
                  </div>

                  {/* Array Fields */}
                  {(['requirements', 'responsibilities', 'benefits', 'skills'] as const).map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.charAt(0).toUpperCase() + field.slice(1)} *
                      </label>
                      <div className="space-y-2">
                        {formData[field].map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => handleArrayChange(field, index, e.target.value)}
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={`Add ${field.slice(0, -1)}...`}
                            />
                            {formData[field].length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayItem(field, index)}
                                className="px-4 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addArrayItem(field)}
                          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          + Add {field.slice(0, -1)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Settings */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-blue-600" />
                  Additional Settings
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Application Deadline */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Application Deadline *
                    </label>
                    <input
                      type="date"
                      name="applicationDeadline"
                      value={formData.applicationDeadline}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.applicationDeadline ? 'border-red-300' : 'border-gray-300'
                      }`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.applicationDeadline && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicationDeadline}</p>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add tags..."
                      />
                      <button
                        type="button"
                        onClick={handleTagAdd}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleTagRemove(tag)}
                            className="ml-1 hover:text-blue-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Special Options */}
                  <div className="lg:col-span-2 space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        Feature this {isOrganization ? 'opportunity' : 'job'} (increases visibility)
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="urgent"
                        checked={formData.urgent}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Mark as urgent hiring
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="premium"
                        checked={formData.premium}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        Premium listing (enhanced visibility)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                Review & Submit
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {isOrganization ? 'Opportunity Details' : 'Job Details'}
                    </h4>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          {isOrganization ? 'Opportunity Title' : 'Job Title'}
                        </dt>
                        <dd className="text-sm text-gray-900">{formData.title}</dd>
                      </div>
                      {formData.jobNumber && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            {isOrganization ? 'Opportunity Number' : 'Job Number'}
                          </dt>
                          <dd className="text-sm text-gray-900">{formData.jobNumber}</dd>
                        </div>
                      )}
                      {isOrganization && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Opportunity Type</dt>
                          <dd className="text-sm text-gray-900">
                            {opportunityTypes.find(opt => opt.value === formData.opportunityType)?.label}
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          {isOrganization ? 'Engagement Type' : 'Job Type'}
                        </dt>
                        <dd className="text-sm text-gray-900">{jobService.getJobTypeLabel(formData.type)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Category</dt>
                        <dd className="text-sm text-gray-900">
                          {currentCategoryLabel}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Experience Level</dt>
                        <dd className="text-sm text-gray-900">{jobService.getExperienceLabel(formData.experienceLevel)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Education Level</dt>
                        <dd className="text-sm text-gray-900">
                          {educationLevels.find(ed => ed.value === formData.educationLevel)?.label || formData.educationLevel}
                        </dd>
                      </div>
                      {isOrganization && formData.duration && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Duration</dt>
                          <dd className="text-sm text-gray-900">
                            {formData.duration.isOngoing 
                              ? 'Ongoing' 
                              : `${formData.duration.value} ${formData.duration.unit}`
                            }
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Gender Preference</dt>
                        <dd className="text-sm text-gray-900">
                          {jobService.getSexRequirementLabel(formData.demographicRequirements?.sex || 'any')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Age Requirements</dt>
                        <dd className="text-sm text-gray-900">
                          {jobService.formatAgeRequirement(formData.demographicRequirements)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Location & Compensation</h4>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Location</dt>
                        <dd className="text-sm text-gray-900">
                          {formData.location.city}, {ethiopianRegions.find(r => r.slug === formData.location.region)?.name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Work Arrangement</dt>
                        <dd className="text-sm text-gray-900">{formData.remote}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          {isVolunteer ? 'Compensation' : 'Salary'}
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {formData.salary?.isPublic ? jobService.formatSalary(formData.salary) : 'Not specified'}
                        </dd>
                      </div>
                      {isVolunteer && formData.volunteerInfo && (
                        <>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Hours Per Week</dt>
                            <dd className="text-sm text-gray-900">
                              {formData.volunteerInfo.hoursPerWeek || 'Not specified'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Commitment Level</dt>
                            <dd className="text-sm text-gray-900">
                              {commitmentLevels.find(level => level.value === formData.volunteerInfo?.commitmentLevel)?.label}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Benefits</dt>
                            <dd className="text-sm text-gray-900">
                              {formData.volunteerInfo.providesAccommodation && 'Accommodation '}
                              {formData.volunteerInfo.providesStipend && 'Stipend'}
                              {!formData.volunteerInfo.providesAccommodation && !formData.volunteerInfo.providesStipend && 'None'}
                            </dd>
                          </div>
                        </>
                      )}
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Application Deadline</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(formData.applicationDeadline).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    {isOrganization ? 'Opportunity Description Preview' : 'Job Description Preview'}
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                    <div 
                      className="text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formData.description }}
                    />
                  </div>
                </div>

                {(!companyVerified && !organizationVerified) && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-yellow-800 text-sm">
                        Your {isOrganization ? 'organization' : 'company'} profile is not verified. This {isOrganization ? 'opportunity' : 'job'} will require admin approval before being published.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  Next Step
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, 'draft')}
                    disabled={loading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save as Draft'}
                  </button>
                  
                  <button
                    type="submit"
                    onClick={(e) => handleSubmit(e, 'active')}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? 'Publishing...' : `Publish ${isOrganization ? 'Opportunity' : 'Job'}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default JobForm;