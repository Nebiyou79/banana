/* eslint-disable @typescript-eslint/no-explicit-any */
// components/JobForm.tsx - COMPANY-SPECIFIC VERSION
import React, { useState, useEffect } from 'react';
import { 
  Job, 
  EthiopianLocation, 
  JobSalary, 
  jobService,
  SalaryMode,
  JobStatus
} from '@/services/jobService';
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
  Search,
  Target,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Building2,
  Users as UsersIcon,
  DollarSign as DollarSignIcon,
  EyeOff as EyeOffIcon,
  Handshake,
  Building,
  TrendingUp,
  Hash,
  ToggleLeft,
  ToggleRight,
  Layers
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import RichTextEditor from '../ui/RichTextEditor';
import { getTheme, ThemeMode } from '@/utils/color';
import LoadingSpinner from '../LoadingSpinner';

// Company-specific JobFormData (no organization fields)
type JobFormData = Omit<Job, '_id' | 'company' | 'organization' | 'createdBy' | 'applicationCount' | 'viewCount' | 'saveCount' | 'createdAt' | 'updatedAt' | 'isActive' | 'applications' | 'views' | 'jobType' | 'opportunityType' | 'duration' | 'volunteerInfo'> & {
  salary?: JobSalary;
  applicationDeadline: string;
  shortDescription: string;
  status: JobStatus;
  jobType: 'company';
  demographicRequirements?: {
    sex: 'male' | 'female' | 'any';
    age?: {
      min?: number;
      max?: number;
    };
  };
  jobNumber?: string;
  // NEW FIELDS
  candidatesNeeded: number;
  salaryMode: SalaryMode;
  isApplyEnabled: boolean;
};

interface JobFormProps {
  initialData?: Job;
  onSubmit: (data: Partial<Job>) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
  companyVerified?: boolean;
  mode?: 'create' | 'edit';
  themeMode?: ThemeMode;
}

// Define a comprehensive category type
interface JobCategory {
  value: string;
  label: string;
  group?: string;
}

// Salary Mode Option Type
interface SalaryModeOption {
  value: SalaryMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const JobForm: React.FC<JobFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  onCancel,
  companyVerified = false,
  mode = 'create',
  themeMode = 'light'
}) => {
  const theme = getTheme(themeMode);
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
    status: JobStatus.DRAFT,
    applicationDeadline: '',
    remote: 'on-site',
    workArrangement: 'office',
    tags: [],
    featured: false,
    urgent: false,
    premium: false,
    jobType: 'company',
    demographicRequirements: {
      sex: 'any',
      age: {
        min: undefined,
        max: undefined
      }
    },
    jobNumber: '',
    // NEW FIELDS WITH DEFAULTS
    candidatesNeeded: 1,
    salaryMode: SalaryMode.RANGE,
    isApplyEnabled: true,
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [allCategories, setAllCategories] = useState<JobCategory[]>([]);
  const [descriptionError, setDescriptionError] = useState<string>('');
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [categoryGroups, setCategoryGroups] = useState<Record<string, JobCategory[]>>({});

  // Get data from service
  const ethiopianRegions = jobService.getEthiopianRegions();
  const educationLevels = jobService.getEducationLevels();

  // Salary Mode Options
  const salaryModeOptions: SalaryModeOption[] = [
    {
      value: SalaryMode.RANGE,
      label: 'Salary Range',
      description: 'Show minimum and maximum salary to candidates',
      icon: <TrendingUp className="w-5 h-5" />,
      color: themeMode === 'dark' ? '#059669' : '#10B981' // Green
    },
    {
      value: SalaryMode.HIDDEN,
      label: 'Salary Hidden',
      description: 'Salary details not shown to candidates',
      icon: <EyeOffIcon className="w-5 h-5" />,
      color: themeMode === 'dark' ? '#6B7280' : '#6B7280' // Gray
    },
    {
      value: SalaryMode.NEGOTIABLE,
      label: 'Negotiable',
      description: 'Show "Negotiable" to candidates',
      icon: <Handshake className="w-5 h-5" />,
      color: themeMode === 'dark' ? '#D97706' : '#F59E0B' // Orange
    },
    {
      value: SalaryMode.COMPANY_SCALE,
      label: 'Company Scale',
      description: 'Show "As per company scale" to candidates',
      icon: <Building className="w-5 h-5" />,
      color: themeMode === 'dark' ? '#2563EB' : '#3B82F6' // Blue
    }
  ];

  // Load ALL categories
  useEffect(() => {
    const loadAllCategories = () => {
      try {
        // Get all categories from the service
        const categories = jobService.getAllJobCategories();
        
        if (categories && categories.length > 0) {
          console.log(`📊 Loaded ${categories.length} categories for company form`);
          
          // Group categories intelligently
          const grouped: Record<string, JobCategory[]> = {};
          categories.forEach(category => {
            const value = category.value.toLowerCase();
            let group = 'Other';
            
            // Technology & ICT
            if (value.includes('developer') || value.includes('engineer') || value.includes('software') || 
                value.includes('it') || value.includes('data') || value.includes('network') || 
                value.includes('cyber') || value.includes('cloud') || value.includes('system') ||
                value.includes('designer') || value.includes('analyst') || value.includes('support')) {
              group = 'Technology & ICT';
            }
            // NGO / Development
            else if (value.includes('officer') && (value.includes('project') || value.includes('program') ||
                     value.includes('community') || value.includes('development') || value.includes('humanitarian') ||
                     value.includes('protection') || value.includes('grant') || value.includes('field'))) {
              group = 'NGO / Development';
            }
            // Finance
            else if (value.includes('account') || value.includes('audit') || value.includes('bank') ||
                     value.includes('finance') || value.includes('credit') || value.includes('tax') ||
                     value.includes('insurance') || value.includes('cashier') || value.includes('teller')) {
              group = 'Finance';
            }
            // Engineering
            else if (value.includes('engineer') && !value.includes('software')) {
              group = 'Engineering';
            }
            // Agriculture
            else if (value.includes('agri') || value.includes('crop') || value.includes('livestock') ||
                     value.includes('veterin') || value.includes('forest') || value.includes('environment')) {
              group = 'Agriculture';
            }
            // Health
            else if (value.includes('health') || value.includes('medical') || value.includes('doctor') ||
                     value.includes('nurse') || value.includes('pharmac') || value.includes('hospital')) {
              group = 'Health';
            }
            // Education
            else if (value.includes('teacher') || value.includes('professor') || value.includes('lecturer') ||
                     value.includes('educat') || value.includes('school') || value.includes('academic')) {
              group = 'Education';
            }
            // Administration
            else if (value.includes('admin') || value.includes('manager') || value.includes('officer') ||
                     value.includes('assistant') || value.includes('secretary') || value.includes('hr') ||
                     value.includes('sales') || value.includes('marketing') || value.includes('customer')) {
              group = 'Administration';
            }
            // Drivers & Logistics
            else if (value.includes('driver') || value.includes('transport') || value.includes('logistics') ||
                     value.includes('mechanic') || value.includes('fleet') || value.includes('dispatch')) {
              group = 'Drivers & Logistics';
            }
            // Hospitality
            else if (value.includes('hotel') || value.includes('restaurant') || value.includes('chef') ||
                     value.includes('waiter') || value.includes('reception') || value.includes('tour')) {
              group = 'Hospitality';
            }
            // Security
            else if (value.includes('security') || value.includes('guard') || value.includes('safety') ||
                     value.includes('cleaner') || value.includes('maintenance')) {
              group = 'Security & Maintenance';
            }
            // Graduate
            else if (value.includes('graduate') || value.includes('intern') || value.includes('trainee') ||
                     value.includes('apprentice') || value.includes('volunteer')) {
              group = 'Graduate & Entry Level';
            }
            
            if (!grouped[group]) {
              grouped[group] = [];
            }
            grouped[group].push({ ...category, group });
          });
          
          setAllCategories(categories);
          setCategoryGroups(grouped);
        } else {
          console.error('No categories found from service');
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadAllCategories();
  }, []);

  // Filter categories based on search
  const filteredCategories = allCategories.filter(category =>
    category.label.toLowerCase().includes(categorySearch.toLowerCase()) ||
    category.value.toLowerCase().includes(categorySearch.toLowerCase()) ||
    category.group?.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Group filtered categories
  const filteredCategoryGroups: Record<string, JobCategory[]> = {};
  filteredCategories.forEach(category => {
    const group = category.group || 'Other';
    if (!filteredCategoryGroups[group]) {
      filteredCategoryGroups[group] = [];
    }
    filteredCategoryGroups[group].push(category);
  });

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
        // NEW FIELDS from initialData or defaults
        candidatesNeeded: initialData.candidatesNeeded || 1,
        salaryMode: initialData.salaryMode || SalaryMode.RANGE,
        isApplyEnabled: initialData.isApplyEnabled !== undefined ? initialData.isApplyEnabled : true,
        
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
        jobType: 'company',
        demographicRequirements: initialData.demographicRequirements || {
          sex: 'any',
          age: {
            min: undefined,
            max: undefined
          }
        },
        jobNumber: initialData.jobNumber || '',
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
  }, [initialData, allCategories]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
      isValid = false;
    } else if (formData.title.length < 5) {
      newErrors.title = 'Job title must be at least 5 characters long';
      isValid = false;
    } else if (formData.title.length > 100) {
      newErrors.title = 'Job title cannot exceed 100 characters';
      isValid = false;
    }

    // Description validation
    const plainTextDescription = formData.description.replace(/<[^>]*>/g, '').trim();
    if (!plainTextDescription) {
      setDescriptionError('Job description is required');
      isValid = false;
    } else if (plainTextDescription.length < 50) {
      setDescriptionError('Job description must be at least 50 characters long');
      isValid = false;
    } else if (plainTextDescription.length > 5000) {
      setDescriptionError('Description cannot exceed 5000 characters');
      isValid = false;
    } else {
      setDescriptionError('');
    }

    // NEW: Candidates Needed validation
    if (formData.candidatesNeeded === undefined || formData.candidatesNeeded < 1) {
      newErrors.candidatesNeeded = 'At least 1 candidate is required';
      isValid = false;
    } else if (!Number.isInteger(formData.candidatesNeeded)) {
      newErrors.candidatesNeeded = 'Number of candidates must be a whole number';
      isValid = false;
    }

    // NEW: Salary Mode validation
    if (!formData.salaryMode || !Object.values(SalaryMode).includes(formData.salaryMode)) {
      newErrors.salaryMode = 'Salary mode is required';
      isValid = false;
    }

    // NEW: Salary validation when mode is RANGE
    if (formData.salaryMode === SalaryMode.RANGE) {
      if (formData.salary?.min === undefined && formData.salary?.max === undefined) {
        newErrors.salaryRange = 'Salary range is required when salary mode is "Range"';
        isValid = false;
      } else {
        if (formData.salary?.min && formData.salary?.max && formData.salary.min > formData.salary.max) {
          newErrors.salaryRange = 'Minimum salary cannot be greater than maximum salary';
          isValid = false;
        }
        if (!formData.salary?.currency) {
          newErrors.salaryCurrency = 'Currency is required';
          isValid = false;
        }
      }
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Job category is required';
      isValid = false;
    }

    // Location validation
    if (!formData.location.region) {
      newErrors.region = 'Region is required';
      isValid = false;
    }

    if (formData.location.region !== 'international' && !formData.location.city) {
      newErrors.city = 'City is required for Ethiopian job postings';
      isValid = false;
    }

    // Application deadline validation
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

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    if (type === 'number') {
      processedValue = value === '' ? undefined : Number(value);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // NEW: Handle candidates needed with validation
  const handleCandidatesNeededChange = (value: string) => {
    const numValue = value === '' ? 1 : Math.max(1, parseInt(value, 10) || 1);
    
    setFormData(prev => ({
      ...prev,
      candidatesNeeded: numValue
    }));

    if (errors.candidatesNeeded) {
      setErrors(prev => ({ ...prev, candidatesNeeded: '' }));
    }
  };

  // NEW: Handle salary mode change
  const handleSalaryModeChange = (mode: SalaryMode) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        salaryMode: mode
      };
      
      // Clear salary range fields if not in RANGE mode
      if (mode !== SalaryMode.RANGE && prev.salary) {
        newData.salary = {
          ...prev.salary,
          min: undefined,
          max: undefined,
          isPublic: mode !== SalaryMode.HIDDEN,
          isNegotiable: mode === SalaryMode.NEGOTIABLE
        };
      }
      
      return newData;
    });

    if (errors.salaryMode || errors.salaryRange) {
      setErrors(prev => ({ ...prev, salaryMode: '', salaryRange: '' }));
    }
  };

  // NEW: Handle application toggle
  const handleApplicationToggle = (enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      isApplyEnabled: enabled
    }));
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

    if (errors.salaryRange || errors.salaryCurrency) {
      setErrors(prev => ({ ...prev, salaryRange: '', salaryCurrency: '' }));
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

  const handleSubmit = async (e: React.FormEvent, status?: JobStatus) => {
    e.preventDefault();

    // Check if disabling applications but trying to publish
    if (status === JobStatus.ACTIVE && formData.isApplyEnabled === false) {
      const confirmPublish = window.confirm(
        `You are publishing this job with applications disabled. ` +
        `This means candidates will be able to view but not apply. Continue?`
      );
      
      if (!confirmPublish) {
        return;
      }
    }

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
      jobType: 'company',
      featured: formData.featured,
      urgent: formData.urgent,
      premium: formData.premium,
      tags: formData.tags,
      demographicRequirements: formData.demographicRequirements,
      jobNumber: formData.jobNumber?.trim() || undefined,
      
      // NEW FIELDS
      candidatesNeeded: formData.candidatesNeeded,
      salaryMode: formData.salaryMode,
      isApplyEnabled: formData.isApplyEnabled
    };

    // Only include salary if it has values and mode is RANGE
    if (formData.salaryMode === SalaryMode.RANGE && (formData.salary?.min || formData.salary?.max)) {
      submitData.salary = formData.salary;
    } else {
      // For non-range modes, send appropriate salary structure
      submitData.salary = {
        currency: 'ETB',
        period: 'monthly',
        isPublic: formData.salaryMode !== SalaryMode.HIDDEN,
        isNegotiable: formData.salaryMode === SalaryMode.NEGOTIABLE
      };
    }

    // Format application deadline properly
    if (formData.applicationDeadline) {
      submitData.applicationDeadline = new Date(formData.applicationDeadline).toISOString();
    }

    // Include subCategory if it exists
    if (formData.subCategory) {
      submitData.subCategory = formData.subCategory;
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
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const selectedRegion = ethiopianRegions.find(region => region.slug === formData.location.region);
  const isInternational = formData.location.region === 'international';
  const showSalaryRangeFields = formData.salaryMode === SalaryMode.RANGE;

  // Preview data for summary
  const previewData = {
    ...formData,
    salary: formData.salary?.isPublic ? formData.salary : undefined
  };

  // Get the current category label for display
  const currentCategoryLabel = allCategories.find(cat => cat.value === formData.category)?.label || formData.category;

  const stepColors = {
    stepBg: themeMode === 'dark' ? '#374151' : '#F3F4F6',
    stepActiveBg: themeMode === 'dark' ? '#2563EB' : '#2563EB',
    stepText: themeMode === 'dark' ? '#D1D5DB' : '#6B7280',
    stepActiveText: themeMode === 'dark' ? '#FFFFFF' : '#FFFFFF',
    progressBar: themeMode === 'dark' ? '#4B5563' : '#E5E7EB',
    progressBarActive: themeMode === 'dark' ? '#2563EB' : '#2563EB'
  };

  // Format salary display for preview
  const formatSalaryDisplay = () => {
    switch (formData.salaryMode) {
      case SalaryMode.RANGE:
        if (formData.salary?.min && formData.salary?.max) {
          return `${formData.salary.min.toLocaleString()} - ${formData.salary.max.toLocaleString()} ${formData.salary.currency} / ${formData.salary.period}`;
        } else if (formData.salary?.min) {
          return `From ${formData.salary.min.toLocaleString()} ${formData.salary.currency} / ${formData.salary.period}`;
        } else if (formData.salary?.max) {
          return `Up to ${formData.salary.max.toLocaleString()} ${formData.salary.currency} / ${formData.salary.period}`;
        }
        return 'Salary not specified';
      case SalaryMode.HIDDEN:
        return 'Salary hidden';
      case SalaryMode.NEGOTIABLE:
        return 'Negotiable';
      case SalaryMode.COMPANY_SCALE:
        return 'As per company scale';
      default:
        return 'Salary not specified';
    }
  };

  // Helper function to render salary mode selector
  const renderSalaryModeSelector = () => (
    <div className="space-y-3">
      <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>
        Salary Display Mode *
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {salaryModeOptions.map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => handleSalaryModeChange(option.value)}
            className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col items-center text-center ${
              formData.salaryMode === option.value
                ? 'ring-2 ring-offset-2'
                : 'hover:border-opacity-70'
            }`}
            style={{
              backgroundColor: theme.bg.primary,
              borderColor: formData.salaryMode === option.value 
                ? option.color 
                : theme.border.primary,
              borderWidth: formData.salaryMode === option.value ? '2px' : '1px',
              color: theme.text.primary,
              ...(formData.salaryMode === option.value ? {
                borderColor: option.color,
                boxShadow: `0 0 0 2px ${option.color}20`
              } : {})
            }}
          >
            <div className="mb-2" style={{ color: option.color }}>
              {option.icon}
            </div>
            <h4 className={`font-semibold text-sm ${theme.text.primary}`}>
              {option.label}
            </h4>
            <p className={`text-xs ${theme.text.muted} mt-1 line-clamp-2`}>
              {option.description}
            </p>
            {formData.salaryMode === option.value && (
              <div className="mt-2">
                <CheckCircle className="w-4 h-4" style={{ color: option.color }} />
              </div>
            )}
          </button>
        ))}
      </div>
      {errors.salaryMode && (
        <p className="mt-1 text-xs sm:text-sm" style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}>
          {errors.salaryMode}
        </p>
      )}
    </div>
  );

  // Helper function to render salary range fields
  const renderSalaryRangeFields = () => (
    showSalaryRangeFields && (
      <div className="space-y-4 p-4 rounded-xl border transition-all duration-300" 
        style={{ 
          backgroundColor: themeMode === 'dark' ? '#1E293B' : '#F8FAFC',
          borderColor: theme.border.secondary 
        }}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5" style={{ color: themeMode === 'dark' ? '#059669' : '#10B981' }} />
          <h4 className={`font-semibold ${theme.text.primary}`}>Salary Range Details</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5`}>
              Minimum Salary
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.salary?.min || ''}
                onChange={(e) => handleSalaryChange('min', e.target.value)}
                className={`w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                style={{
                  border: `1px solid ${theme.border.primary}`,
                  color: theme.text.primary
                }}
                placeholder="0"
                min="0"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <span className={`text-sm ${theme.text.muted}`}>Min</span>
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5`}>
              Maximum Salary
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.salary?.max || ''}
                onChange={(e) => handleSalaryChange('max', e.target.value)}
                className={`w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                style={{
                  border: `1px solid ${theme.border.primary}`,
                  color: theme.text.primary
                }}
                placeholder="0"
                min="0"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <span className={`text-sm ${theme.text.muted}`}>Max</span>
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5`}>
              Currency *
            </label>
            <select
              value={formData.salary?.currency || 'ETB'}
              onChange={(e) => handleSalaryChange('currency', e.target.value)}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
              style={{
                border: `1px solid ${errors.salaryCurrency ? (themeMode === 'dark' ? '#DC2626' : '#EF4444') : theme.border.primary}`,
                color: theme.text.primary
              }}
            >
              <option value="ETB">ETB - Ethiopian Birr</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
            {errors.salaryCurrency && (
              <p className="mt-1 text-xs sm:text-sm" style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}>
                {errors.salaryCurrency}
              </p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5`}>
              Pay Period
            </label>
            <select
              value={formData.salary?.period || 'monthly'}
              onChange={(e) => handleSalaryChange('period', e.target.value)}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
              style={{
                border: `1px solid ${theme.border.primary}`,
                color: theme.text.primary
              }}
            >
              <option value="hourly">Per Hour</option>
              <option value="daily">Per Day</option>
              <option value="weekly">Per Week</option>
              <option value="monthly">Per Month</option>
              <option value="yearly">Per Year</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.salary?.isNegotiable || false}
              onChange={(e) => handleSalaryChange('isNegotiable', e.target.checked)}
              className="h-4 w-4"
              style={{
                color: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
                borderColor: theme.border.primary
              }}
            />
            <span className={`ml-2 text-sm ${theme.text.secondary}`}>
              Salary is negotiable
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.salary?.isPublic !== false}
              onChange={(e) => handleSalaryChange('isPublic', e.target.checked)}
              className="h-4 w-4"
              style={{
                color: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
                borderColor: theme.border.primary
              }}
            />
            <span className={`ml-2 text-sm ${theme.text.secondary}`}>
              Show salary in job posting
            </span>
          </label>
        </div>

        {errors.salaryRange && (
          <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: themeMode === 'dark' ? '#7F1D1D' : '#FEE2E2' }}>
            <p className="text-xs sm:text-sm" style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}>
              {errors.salaryRange}
            </p>
          </div>
        )}
      </div>
    )
  );

  // Helper function to render candidates needed input
  const renderCandidatesNeededInput = () => (
    <div>
      <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2 flex items-center gap-2`}>
        <UsersIcon className="w-4 h-4" />
        Candidates Needed *
      </label>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="number"
            value={formData.candidatesNeeded}
            onChange={(e) => handleCandidatesNeededChange(e.target.value)}
            className={`w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
            style={{
              border: `1px solid ${errors.candidatesNeeded ? (themeMode === 'dark' ? '#DC2626' : '#EF4444') : theme.border.primary}`,
              color: theme.text.primary
            }}
            placeholder="1"
            min="1"
            step="1"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Hash className="w-4 h-4" style={{ color: theme.text.muted }} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleCandidatesNeededChange(String(Math.max(1, formData.candidatesNeeded - 1)))}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: theme.bg.secondary,
              border: `1px solid ${theme.border.primary}`,
              color: theme.text.secondary
            }}
          >
            -
          </button>
          <button
            type="button"
            onClick={() => handleCandidatesNeededChange(String(formData.candidatesNeeded + 1))}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: theme.bg.secondary,
              border: `1px solid ${theme.border.primary}`,
              color: theme.text.secondary
            }}
          >
            +
          </button>
        </div>
      </div>
      <div className={`flex items-center justify-between mt-1.5`}>
        <p className={`text-xs ${theme.text.muted}`}>
          Number of candidates you want to hire
        </p>
        <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          formData.candidatesNeeded === 1
            ? themeMode === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
            : formData.candidatesNeeded <= 5
            ? themeMode === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
            : themeMode === 'dark' ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800'
        }`}>
          {formData.candidatesNeeded} candidate{formData.candidatesNeeded !== 1 ? 's' : ''}
        </div>
      </div>
      {errors.candidatesNeeded && (
        <p className="mt-1 text-xs sm:text-sm" style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}>
          {errors.candidatesNeeded}
        </p>
      )}
    </div>
  );

  // Helper function to render application control
  const renderApplicationControl = () => (
    <div className="p-4 rounded-xl border" 
      style={{ 
        backgroundColor: themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF',
        borderColor: themeMode === 'dark' ? '#3B82F6' : '#3B82F6'
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {formData.isApplyEnabled ? (
            <ToggleRight className="w-6 h-6" style={{ color: themeMode === 'dark' ? '#10B981' : '#059669' }} />
          ) : (
            <ToggleLeft className="w-6 h-6" style={{ color: themeMode === 'dark' ? '#6B7280' : '#6B7280' }} />
          )}
          <div>
            <h4 className={`font-semibold ${theme.text.primary} flex items-center gap-2`}>
              Accept Applications
            </h4>
            <p className={`text-sm ${theme.text.secondary} mt-0.5`}>
              {formData.isApplyEnabled
                ? 'Candidates can apply for this position'
                : 'Applications are closed - position is view-only'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleApplicationToggle(!formData.isApplyEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            formData.isApplyEnabled
              ? themeMode === 'dark' ? 'bg-green-600' : 'bg-green-500'
              : themeMode === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              formData.isApplyEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={`max-w-6xl mx-auto rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border ${theme.bg.primary}`}
      style={{ borderColor: theme.border.primary }}
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-4">
          <div>
            <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme.text.primary} mb-1 sm:mb-2`}>
              {mode === 'edit' ? 'Edit Job Posting' : 'Create New Job'}
            </h2>
            <p className={`text-sm sm:text-base ${theme.text.secondary}`}>
              {mode === 'edit'
                ? 'Update your job posting details below.'
                : 'Fill in the details to create a new job posting.'
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 ${theme.bg.secondary}`}
              style={{ color: theme.text.secondary }}
            >
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Company Job
            </div>
            {/* Add application status badge */}
            <div
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 ${
                formData.isApplyEnabled !== false ? 
                  themeMode === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800' :
                  themeMode === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {formData.isApplyEnabled !== false ? 
                <>
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  Accepting Applications
                </> : 
                <>
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  View Only
                </>
              }
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 ${theme.bg.secondary}`}
              style={{
                border: `1px solid ${theme.border.primary}`,
                color: theme.text.secondary
              }}
            >
              {showPreview ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>

        {/* Progress Steps - 3 Steps for Company */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full ${step <= currentStep
                    ? stepColors.stepActiveBg
                    : stepColors.stepBg
                    }`}
                  style={{
                    backgroundColor: step <= currentStep ? stepColors.stepActiveBg : stepColors.stepBg,
                    color: step <= currentStep ? stepColors.stepActiveText : stepColors.stepText
                  }}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-1 sm:mx-2`}
                    style={{
                      backgroundColor: step < currentStep ? stepColors.progressBarActive : stepColors.progressBar
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between text-xs sm:text-sm">
            <span
              className={`${currentStep >= 1 ? 'font-medium' : ''}`}
              style={{ color: currentStep >= 1 ? stepColors.stepActiveBg : stepColors.stepText }}
            >
              Basic Info
            </span>
            <span
              className={`${currentStep >= 2 ? 'font-medium' : ''}`}
              style={{ color: currentStep >= 2 ? stepColors.stepActiveBg : stepColors.stepText }}
            >
              Details & Salary
            </span>
            <span
              className={`${currentStep >= 3 ? 'font-medium' : ''}`}
              style={{ color: currentStep >= 3 ? stepColors.stepActiveBg : stepColors.stepText }}
            >
              Review & Submit
            </span>
          </div>
        </div>

        {!companyVerified && (
          <div
            className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg"
            style={{
              backgroundColor: themeMode === 'dark' ? '#78350F' : '#FEF3C7',
              border: `1px solid ${themeMode === 'dark' ? '#92400E' : '#FBBF24'}`,
              color: themeMode === 'dark' ? '#FBBF24' : '#92400E'
            }}
          >
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 mr-2" />
              <span className="text-xs sm:text-sm">
                Your company profile is not verified. This job will require admin approval before being published.
              </span>
            </div>
          </div>
        )}
      </div>

      {showPreview ? (
        <div
          className="rounded-xl p-4 sm:p-6"
          style={{
            backgroundColor: theme.bg.secondary,
            border: `1px solid ${theme.border.primary}`
          }}
        >
          <h3 className={`text-lg sm:text-xl font-semibold ${theme.text.primary} mb-3 sm:mb-4`}>
            Job Preview
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h4 className={`text-base sm:text-lg font-semibold ${theme.text.primary}`}>{previewData.title}</h4>
              <p className={`text-sm sm:text-base ${theme.text.secondary}`}>{previewData.shortDescription}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <span
                className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
                style={{
                  backgroundColor: themeMode === 'dark' ? '#1E40AF' : '#DBEAFE',
                  color: themeMode === 'dark' ? '#93C5FD' : '#1E40AF'
                }}
              >
                {jobService.getJobTypeLabel(previewData.type)}
              </span>
              <span
                className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
                style={{
                  backgroundColor: themeMode === 'dark' ? '#7C2D12' : '#FFEDD5',
                  color: themeMode === 'dark' ? '#FDBA74' : '#7C2D12'
                }}
              >
                {jobService.getExperienceLabel(previewData.experienceLevel)}
              </span>
              {/* NEW: Candidates Needed Badge */}
              <span
                className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1"
                style={{
                  backgroundColor: themeMode === 'dark' ? '#374151' : '#F3F4F6',
                  color: themeMode === 'dark' ? '#D1D5DB' : '#4B5563'
                }}
              >
                <UsersIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                {previewData.candidatesNeeded} position{previewData.candidatesNeeded !== 1 ? 's' : ''}
              </span>
              {/* NEW: Salary Mode Badge */}
              <span
                className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
                style={{
                  backgroundColor: themeMode === 'dark' ? '#065F46' : '#D1FAE5',
                  color: themeMode === 'dark' ? '#34D399' : '#065F46'
                }}
              >
                {salaryModeOptions.find(opt => opt.value === previewData.salaryMode)?.label}
              </span>
              {previewData.remote !== 'on-site' && (
                <span
                  className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
                  style={{
                    backgroundColor: themeMode === 'dark' ? '#065F46' : '#D1FAE5',
                    color: themeMode === 'dark' ? '#34D399' : '#065F46'
                  }}
                >
                  {previewData.remote}
                </span>
              )}
              {/* Application status badge in preview */}
              <span
                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 ${
                  previewData.isApplyEnabled ? 
                    themeMode === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800' :
                    themeMode === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {previewData.isApplyEnabled ? 
                  <>
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    Accepting Applications
                  </> : 
                  <>
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    View Only
                  </>
                }
              </span>
            </div>
            {/* NEW: Salary Display in Preview */}
            <div className={`text-base sm:text-lg font-semibold`}
              style={{ color: themeMode === 'dark' ? '#10B981' : '#059669' }}>
              {formatSalaryDisplay()}
            </div>
            <div>
              <h5 className={`font-semibold ${theme.text.primary} mb-1 sm:mb-2`}>Description</h5>
              <div
                className={`text-sm sm:text-base ${theme.text.secondary} prose prose-sm max-w-none`}
                dangerouslySetInnerHTML={{ __html: previewData.description }}
              />
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-6 sm:space-y-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div
              className="rounded-xl p-4 sm:p-6"
              style={{
                backgroundColor: theme.bg.secondary,
                border: `1px solid ${theme.border.primary}`
              }}
            >
              <h3 className={`text-lg sm:text-xl font-semibold ${theme.text.primary} mb-4 sm:mb-6 flex items-center`}>
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Job Title */}
                <div className="lg:col-span-2">
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                    style={{
                      border: `1px solid ${errors.title ? (themeMode === 'dark' ? '#DC2626' : '#EF4444') : theme.border.primary}`,
                      color: theme.text.primary
                    }}
                    placeholder="e.g. Senior Frontend Developer, Marketing Manager..."
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs sm:text-sm" style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}>
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Job Number */}
                <div>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                    Job Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="jobNumber"
                    value={formData.jobNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                    style={{
                      border: `1px solid ${theme.border.primary}`,
                      color: theme.text.primary
                    }}
                    placeholder="e.g. HR-2024-001"
                  />
                </div>

                {/* Job Type */}
                <div>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                    Job Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                    style={{
                      border: `1px solid ${theme.border.primary}`,
                      color: theme.text.primary
                    }}
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="temporary">Temporary</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                {/* Short Description */}
                <div className="lg:col-span-2">
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                    Short Description
                  </label>
                  <textarea
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    rows={2}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                    style={{
                      border: `1px solid ${theme.border.primary}`,
                      color: theme.text.primary
                    }}
                    placeholder="Brief summary of the job (appears in search results)..."
                    maxLength={200}
                  />
                  <div className={`text-xs ${theme.text.muted} mt-1 text-right`}>
                    {formData.shortDescription.length}/200 characters
                  </div>
                </div>

                {/* Job Category with Search */}
                <div className="lg:col-span-2">
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                    Job Category *
                    <span className={`text-xs ${theme.text.muted} ml-1`}>
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
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary} ${errors.category ? 'border-red-300' : ''
                        }`}
                      style={{
                        border: `1px solid ${errors.category ? (themeMode === 'dark' ? '#DC2626' : '#EF4444') : theme.border.primary}`,
                        color: theme.text.primary
                      }}
                    />
                    <Search className="absolute right-3 top-2.5 sm:top-3.5 h-4 w-4" style={{ color: theme.text.muted }} />
                  </div>

                  {/* Show current selection when dropdown is closed */}
                  {!showCategoryDropdown && formData.category && (
                    <div className="mt-1.5 sm:mt-2">
                      <span
                        className="inline-flex items-center px-2 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs"
                        style={{
                          backgroundColor: themeMode === 'dark' ? '#065F46' : '#D1FAE5',
                          color: themeMode === 'dark' ? '#34D399' : '#065F46'
                        }}
                      >
                        <Target className="w-3 h-3 mr-1" />
                        Selected: {currentCategoryLabel}
                      </span>
                    </div>
                  )}

                  {showCategoryDropdown && (
                    <div
                      className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-80 overflow-y-auto"
                      style={{
                        backgroundColor: theme.bg.primary,
                        borderColor: theme.border.primary
                      }}
                    >
                      {Object.keys(filteredCategoryGroups).length > 0 ? (
                        <div className="max-h-80 overflow-y-auto">
                          {Object.entries(filteredCategoryGroups).map(([group, categories]) => (
                            <div key={group}>
                              <div
                                className="px-3 sm:px-4 py-2 text-xs font-semibold border-b sticky top-0"
                                style={{
                                  backgroundColor: theme.bg.secondary,
                                  borderColor: theme.border.primary,
                                  color: theme.text.primary
                                }}
                              >
                                {group} ({categories.length})
                              </div>
                              {categories.slice(0, isCategoryExpanded ? undefined : 15).map(category => (
                                <div
                                  key={category.value}
                                  onClick={() => handleCategorySelect(category.value, category.label)}
                                  className={`px-3 sm:px-4 py-2 hover:cursor-pointer border-b ${theme.border.secondary} last:border-b-0 ${formData.category === category.value ? theme.bg.secondary : ''
                                    }`}
                                  style={{ color: theme.text.primary }}
                                >
                                  <div className="font-medium">{category.label}</div>
                                </div>
                              ))}
                            </div>
                          ))}
                          {filteredCategories.length > 15 && !isCategoryExpanded && (
                            <button
                              type="button"
                              onClick={() => setIsCategoryExpanded(true)}
                              className={`w-full px-3 sm:px-4 py-2 text-sm border-t ${theme.border.secondary} flex items-center justify-center hover:${theme.bg.secondary}`}
                              style={{ color: theme.text.secondary }}
                            >
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Show more categories
                            </button>
                          )}
                          {isCategoryExpanded && filteredCategories.length > 15 && (
                            <button
                              type="button"
                              onClick={() => setIsCategoryExpanded(false)}
                              className={`w-full px-3 sm:px-4 py-2 text-sm border-t ${theme.border.secondary} flex items-center justify-center hover:${theme.bg.secondary}`}
                              style={{ color: theme.text.secondary }}
                            >
                              <ChevronUp className="w-4 h-4 mr-1" />
                              Show less
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className={`px-3 sm:px-4 py-2 ${theme.text.muted}`}>No categories found</div>
                      )}
                    </div>
                  )}
                  {errors.category && (
                    <p className="mt-1 text-xs sm:text-sm" style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}>
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Location - Region */}
                <div>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                    Region *
                  </label>
                  <select
                    value={formData.location.region}
                    onChange={(e) => handleLocationChange('region', e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                    style={{
                      border: `1px solid ${errors.region ? (themeMode === 'dark' ? '#DC2626' : '#EF4444') : theme.border.primary}`,
                      color: theme.text.primary
                    }}
                  >
                    {ethiopianRegions.map(region => (
                      <option key={region.slug} value={region.slug}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                  {errors.region && (
                    <p className="mt-1 text-xs sm:text-sm" style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}>
                      {errors.region}
                    </p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                    {isInternational ? 'Location' : 'City *'}
                  </label>
                  {isInternational ? (
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) => handleLocationChange('city', e.target.value)}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                      style={{
                        border: `1px solid ${theme.border.primary}`,
                        color: theme.text.primary
                      }}
                      placeholder="e.g. Remote Worldwide"
                    />
                  ) : (
                    <select
                      value={formData.location.city}
                      onChange={(e) => handleLocationChange('city', e.target.value)}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                      style={{
                        border: `1px solid ${errors.city ? (themeMode === 'dark' ? '#DC2626' : '#EF4444') : theme.border.primary}`,
                        color: theme.text.primary
                      }}
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
                    <p className="mt-1 text-xs sm:text-sm" style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}>
                      {errors.city}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details & Salary (NEW FIELDS) */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              {/* NEW: Candidates Needed & Application Control */}
              <div
                className="rounded-xl p-4 sm:p-6"
                style={{
                  backgroundColor: theme.bg.secondary,
                  border: `1px solid ${theme.border.primary}`
                }}
              >
                <h3 className={`text-lg sm:text-xl font-semibold ${theme.text.primary} mb-4 sm:mb-6 flex items-center`}>
                  <Layers className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Position Details
                </h3>

                <div className="space-y-4 sm:space-y-6">
                  {/* NEW: Candidates Needed */}
                  {renderCandidatesNeededInput()}

                  {/* NEW: Application Control */}
                  {renderApplicationControl()}

                  {/* Experience and Education */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                        Experience Level *
                      </label>
                      <select
                        name="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                        style={{
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary
                        }}
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
                      <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2 flex items-center`}>
                        <GraduationCap className="w-4 h-4 mr-1" />
                        Education Level
                      </label>
                      <select
                        name="educationLevel"
                        value={formData.educationLevel}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                        style={{
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary
                        }}
                      >
                        {educationLevels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Work Arrangement */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                        Work Arrangement *
                      </label>
                      <select
                        name="remote"
                        value={formData.remote}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                        style={{
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary
                        }}
                      >
                        <option value="on-site">On-Site</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="remote">Remote</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                        Workplace Type
                      </label>
                      <select
                        name="workArrangement"
                        value={formData.workArrangement}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                        style={{
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary
                        }}
                      >
                        <option value="office">Office</option>
                        <option value="field-work">Field Work</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  </div>

                  {/* Demographic Requirements */}
                  <div className="pt-4 border-t" style={{ borderColor: theme.border.secondary }}>
                    <h4 className={`text-base sm:text-lg font-semibold ${theme.text.primary} mb-3 sm:mb-4 flex items-center`}>
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Demographic Requirements
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                      <div>
                        <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                          Gender Preference
                        </label>
                        <select
                          value={formData.demographicRequirements?.sex || 'any'}
                          onChange={(e) => handleDemographicChange('sex', e.target.value)}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                          style={{
                            border: `1px solid ${theme.border.primary}`,
                            color: theme.text.primary
                          }}
                        >
                          <option value="any">Any Gender</option>
                          <option value="male">Male Only</option>
                          <option value="female">Female Only</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                          Minimum Age
                        </label>
                        <input
                          type="number"
                          value={formData.demographicRequirements?.age?.min || ''}
                          onChange={(e) => handleDemographicChange('age', { min: e.target.value ? Number(e.target.value) : undefined })}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                          style={{
                            border: `1px solid ${errors.age ? (themeMode === 'dark' ? '#DC2626' : '#EF4444') : theme.border.primary}`,
                            color: theme.text.primary
                          }}
                          placeholder="18"
                          min="18"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                          Maximum Age
                        </label>
                        <input
                          type="number"
                          value={formData.demographicRequirements?.age?.max || ''}
                          onChange={(e) => handleDemographicChange('age', { max: e.target.value ? Number(e.target.value) : undefined })}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                          style={{
                            border: `1px solid ${errors.age ? (themeMode === 'dark' ? '#DC2626' : '#EF4444') : theme.border.primary}`,
                            color: theme.text.primary
                          }}
                          placeholder="65"
                          min="18"
                          max="100"
                        />
                      </div>
                    </div>
                    {errors.age && (
                      <p className="mt-1 text-xs sm:text-sm" style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}>
                        {errors.age}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* NEW: Salary Information with Salary Mode */}
              <div
                className="rounded-xl p-4 sm:p-6"
                style={{
                  backgroundColor: theme.bg.secondary,
                  border: `1px solid ${theme.border.primary}`
                }}
              >
                <h3 className={`text-lg sm:text-xl font-semibold ${theme.text.primary} mb-4 sm:mb-6 flex items-center`}>
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Salary Information
                </h3>

                <div className="space-y-4 sm:space-y-6">
                  {/* NEW: Salary Mode Selector */}
                  {renderSalaryModeSelector()}

                  {/* NEW: Salary Range Fields (Conditional) */}
                  {renderSalaryRangeFields()}
                </div>
              </div>

              {/* Location Details */}
              {!isInternational && (
                <div
                  className="rounded-xl p-4 sm:p-6"
                  style={{
                    backgroundColor: theme.bg.secondary,
                    border: `1px solid ${theme.border.primary}`
                  }}
                >
                  <h3 className={`text-lg sm:text-xl font-semibold ${theme.text.primary} mb-4 sm:mb-6 flex items-center`}>
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Location Details
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                        Sub-City
                      </label>
                      <input
                        type="text"
                        value={formData.location.subCity}
                        onChange={(e) => handleLocationChange('subCity', e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                        style={{
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary
                        }}
                        placeholder="e.g. Bole, Kirkos..."
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                        Woreda
                      </label>
                      <input
                        type="text"
                        value={formData.location.woreda}
                        onChange={(e) => handleLocationChange('woreda', e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                        style={{
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary
                        }}
                        placeholder="e.g. Woreda 03..."
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                        Specific Location
                      </label>
                      <input
                        type="text"
                        value={formData.location.specificLocation}
                        onChange={(e) => handleLocationChange('specificLocation', e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                        style={{
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary
                        }}
                        placeholder="e.g. Bole Road, near Friendship City Center..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Job Details & Review */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              {/* Job Description */}
              <div
                className="rounded-xl p-4 sm:p-6"
                style={{
                  backgroundColor: theme.bg.secondary,
                  border: `1px solid ${theme.border.primary}`
                }}
              >
                <h3 className={`text-lg sm:text-xl font-semibold ${theme.text.primary} mb-4 sm:mb-6 flex items-center`}>
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Job Description & Requirements
                </h3>

                <div className="space-y-4 sm:space-y-6">
                  {/* Job Description with Rich Text Editor */}
                  <div>
                    <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                      Job Description *
                    </label>
                    <div className="relative">
                      <RichTextEditor
                        value={formData.description}
                        onChange={handleDescriptionChange}
                        placeholder="Describe the job responsibilities, company culture, and what makes this opportunity special..."
                        minHeight={200}
                        maxHeight={400}
                        error={!!descriptionError}
                        label=""
                        helperText={descriptionError || "Write a detailed description of the position. You can format text, add lists, links, images, and more."}
                        required
                      />
                    </div>
                  </div>

                  {/* Array Fields */}
                  {(['requirements', 'responsibilities', 'benefits', 'skills'] as const).map((field) => (
                    <div key={field}>
                      <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                        {field.charAt(0).toUpperCase() + field.slice(1)} *
                      </label>
                      <div className="space-y-1.5 sm:space-y-2">
                        {formData[field].map((item, index) => (
                          <div key={index} className="flex gap-1.5 sm:gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => handleArrayChange(field, index, e.target.value)}
                              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                              style={{
                                border: `1px solid ${theme.border.primary}`,
                                color: theme.text.primary
                              }}
                              placeholder={`Add ${field.slice(0, -1)}...`}
                            />
                            {formData[field].length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayItem(field, index)}
                                className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                                style={{
                                  backgroundColor: themeMode === 'dark' ? '#7F1D1D' : '#FEE2E2',
                                  color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626'
                                }}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addArrayItem(field)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: themeMode === 'dark' ? '#1E40AF' : '#DBEAFE',
                            color: themeMode === 'dark' ? '#93C5FD' : '#1E40AF'
                          }}
                        >
                          + Add {field.slice(0, -1)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Settings */}
              <div
                className="rounded-xl p-4 sm:p-6"
                style={{
                  backgroundColor: theme.bg.secondary,
                  border: `1px solid ${theme.border.primary}`
                }}
              >
                <h3 className={`text-lg sm:text-xl font-semibold ${theme.text.primary} mb-4 sm:mb-6 flex items-center`}>
                  <Tag className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Additional Settings
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Application Deadline */}
                  <div>
                    <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2 flex items-center`}>
                      <Calendar className="w-4 h-4 mr-1" />
                      Application Deadline *
                    </label>
                    <input
                      type="date"
                      name="applicationDeadline"
                      value={formData.applicationDeadline}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                      style={{
                        border: `1px solid ${errors.applicationDeadline ? (themeMode === 'dark' ? '#DC2626' : '#EF4444') : theme.border.primary}`,
                        color: theme.text.primary
                      }}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.applicationDeadline && (
                      <p className="mt-1 text-xs sm:text-sm" style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}>
                        {errors.applicationDeadline}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <label className={`block text-sm font-medium ${theme.text.secondary} mb-1.5 sm:mb-2`}>
                      Tags
                    </label>
                    <div className="flex gap-1.5 sm:gap-2">
                      <input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                        className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 ${theme.bg.primary}`}
                        style={{
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary
                        }}
                        placeholder="Add tags..."
                      />
                      <button
                        type="button"
                        onClick={handleTagAdd}
                        className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB',
                          color: '#FFFFFF'
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm"
                          style={{
                            backgroundColor: themeMode === 'dark' ? '#1E40AF' : '#DBEAFE',
                            color: themeMode === 'dark' ? '#93C5FD' : '#1E40AF'
                          }}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleTagRemove(tag)}
                            className="ml-1 hover:opacity-70"
                            style={{ color: 'inherit' }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Special Options */}
                  <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                        className="h-4 w-4"
                        style={{
                          color: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
                          borderColor: theme.border.primary
                        }}
                      />
                      <span className={`ml-2 text-sm ${theme.text.secondary} flex items-center gap-1`}>
                        <Star className="w-4 h-4" />
                        Feature this job (increases visibility)
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="urgent"
                        checked={formData.urgent}
                        onChange={handleInputChange}
                        className="h-4 w-4"
                        style={{
                          color: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
                          borderColor: theme.border.primary
                        }}
                      />
                      <span className={`ml-2 text-sm ${theme.text.secondary} flex items-center gap-1`}>
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
                        className="h-4 w-4"
                        style={{
                          color: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
                          borderColor: theme.border.primary
                        }}
                      />
                      <span className={`ml-2 text-sm ${theme.text.secondary} flex items-center gap-1`}>
                        <Star className="w-4 h-4" />
                        Premium listing (enhanced visibility)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Review Section */}
              <div
                className="rounded-xl p-4 sm:p-6"
                style={{
                  backgroundColor: theme.bg.secondary,
                  border: `1px solid ${theme.border.primary}`
                }}
              >
                <h3 className={`text-lg sm:text-xl font-semibold ${theme.text.primary} mb-4 sm:mb-6 flex items-center`}>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Review & Submit
                </h3>

                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h4 className={`text-base sm:text-lg font-semibold ${theme.text.primary} mb-3 sm:mb-4`}>
                        Job Details
                      </h4>
                      <dl className="space-y-2 sm:space-y-3">
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>
                            Job Title
                          </dt>
                          <dd className={`text-sm ${theme.text.primary}`}>{formData.title}</dd>
                        </div>
                        {formData.jobNumber && (
                          <div>
                            <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>
                              Job Number
                            </dt>
                            <dd className={`text-sm ${theme.text.primary}`}>{formData.jobNumber}</dd>
                          </div>
                        )}
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>
                            Job Type
                          </dt>
                          <dd className={`text-sm ${theme.text.primary}`}>{jobService.getJobTypeLabel(formData.type)}</dd>
                        </div>
                        {/* NEW: Candidates Needed */}
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>
                            Candidates Needed
                          </dt>
                          <dd className={`text-sm ${theme.text.primary}`}>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              formData.candidatesNeeded === 1
                                ? themeMode === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                                : formData.candidatesNeeded <= 5
                                ? themeMode === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                : themeMode === 'dark' ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800'
                            }`}>
                              <UsersIcon className="w-3 h-3 mr-1" />
                              {formData.candidatesNeeded} position{formData.candidatesNeeded !== 1 ? 's' : ''}
                            </span>
                          </dd>
                        </div>
                        {/* NEW: Accept Applications */}
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>
                            Accepting Applications
                          </dt>
                          <dd className={`text-sm ${theme.text.primary}`}>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              formData.isApplyEnabled ? 
                                themeMode === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800' :
                                themeMode === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {formData.isApplyEnabled ? 
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Yes - Accepting Applications
                                </> : 
                                <>
                                  <X className="w-3 h-3 mr-1" />
                                  No - View Only
                                </>
                              }
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>Category</dt>
                          <dd className={`text-sm ${theme.text.primary}`}>
                            {currentCategoryLabel}
                          </dd>
                        </div>
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>Experience Level</dt>
                          <dd className={`text-sm ${theme.text.primary}`}>{jobService.getExperienceLabel(formData.experienceLevel)}</dd>
                        </div>
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>Education Level</dt>
                          <dd className={`text-sm ${theme.text.primary}`}>
                            {educationLevels.find(ed => ed.value === formData.educationLevel)?.label || formData.educationLevel}
                          </dd>
                        </div>
                        {/* NEW: Salary Mode */}
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>Salary Display</dt>
                          <dd className={`text-sm ${theme.text.primary}`}>
                            {salaryModeOptions.find(opt => opt.value === formData.salaryMode)?.label}
                          </dd>
                        </div>
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>Gender Preference</dt>
                          <dd className={`text-sm ${theme.text.primary}`}>
                            {jobService.getSexRequirementLabel(formData.demographicRequirements?.sex || 'any')}
                          </dd>
                        </div>
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>Age Requirements</dt>
                          <dd className={`text-sm ${theme.text.primary}`}>
                            {jobService.formatAgeRequirement(formData.demographicRequirements)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h4 className={`text-base sm:text-lg font-semibold ${theme.text.primary} mb-3 sm:mb-4`}>
                        Location & Compensation
                      </h4>
                      <dl className="space-y-2 sm:space-y-3">
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>Location</dt>
                          <dd className={`text-sm ${theme.text.primary}`}>
                            {formData.location.city}, {ethiopianRegions.find(r => r.slug === formData.location.region)?.name}
                          </dd>
                        </div>
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>Work Arrangement</dt>
                          <dd className={`text-sm ${theme.text.primary}`}>{formData.remote}</dd>
                        </div>
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>
                            Salary
                          </dt>
                          <dd className={`text-sm ${theme.text.primary}`}>
                            {formatSalaryDisplay()}
                          </dd>
                        </div>
                        <div>
                          <dt className={`text-xs sm:text-sm font-medium ${theme.text.muted}`}>Application Deadline</dt>
                          <dd className={`text-sm ${theme.text.primary}`}>
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
                    <h4 className={`text-base sm:text-lg font-semibold ${theme.text.primary} mb-3 sm:mb-4`}>
                      Job Description Preview
                    </h4>
                    <div
                      className="p-3 sm:p-4 rounded-lg border max-h-40 sm:max-h-60 overflow-y-auto"
                      style={{
                        backgroundColor: theme.bg.primary,
                        borderColor: theme.border.primary
                      }}
                    >
                      <div
                        className={`text-sm sm:text-base ${theme.text.secondary} prose prose-sm max-w-none`}
                        dangerouslySetInnerHTML={{ __html: formData.description }}
                      />
                    </div>
                  </div>

                  {!companyVerified && (
                    <div
                      className="p-3 sm:p-4 rounded-lg"
                      style={{
                        backgroundColor: themeMode === 'dark' ? '#78350F' : '#FEF3C7',
                        border: `1px solid ${themeMode === 'dark' ? '#92400E' : '#FBBF24'}`,
                        color: themeMode === 'dark' ? '#FBBF24' : '#92400E'
                      }}
                    >
                      <div className="flex items-start">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 mr-2" />
                        <span className="text-xs sm:text-sm">
                          Your company profile is not verified. This job will require admin approval before being published.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t"
            style={{ borderColor: theme.border.secondary }}>
            <div className="flex justify-center sm:justify-start">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors"
                  style={{
                    border: `1px solid ${theme.border.primary}`,
                    backgroundColor: theme.bg.primary,
                    color: theme.text.secondary
                  }}
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors"
                  style={{
                    border: `1px solid ${theme.border.primary}`,
                    backgroundColor: theme.bg.primary,
                    color: theme.text.secondary
                  }}
                >
                  Cancel
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                  style={{
                    backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB',
                    color: '#FFFFFF'
                  }}
                >
                  Next Step
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, JobStatus.DRAFT)}
                    disabled={loading}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50"
                    style={{
                      border: `1px solid ${theme.border.primary}`,
                      backgroundColor: theme.bg.primary,
                      color: theme.text.secondary
                    }}
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" themeMode={themeMode} />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save as Draft
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    onClick={(e) => handleSubmit(e, JobStatus.ACTIVE)}
                    disabled={loading}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50"
                    style={{
                      backgroundColor: themeMode === 'dark' ? '#059669' : '#059669',
                      color: '#FFFFFF'
                    }}
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" themeMode={themeMode} />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Publish Job
                      </>
                    )}
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