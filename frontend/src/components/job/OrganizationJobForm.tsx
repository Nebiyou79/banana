/* eslint-disable @typescript-eslint/no-explicit-any */
// components/OrganizationJobForm.tsx - FIXED DARK MODE & MOBILE OPTIMIZED
import React, { useState, useEffect } from 'react';
import {
  Job,
  EthiopianLocation,
  JobSalary,
  Duration,
  VolunteerInfo,
  jobService,
  SalaryMode,
  JobStatus,
  OpportunityType,
} from '@/services/jobService';
import {
  MapPin,
  BookOpen,
  Calendar,
  CheckCircle,
  X,
  Save,
  Send,
  Eye,
  EyeOff,
  AlertCircle,
  Users,
  Clock,
  Home,
  GraduationCap,
  Star,
  Search,
  Target,
  Building2,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Users as UsersIcon,
  EyeOff as EyeOffIcon,
  Handshake,
  Building,
  Hash,
  ToggleLeft,
  ToggleRight,
  Compass,
  Target as TargetIcon,
  Heart as HeartIcon,
  Award as AwardIcon,
  Book,
  CalendarDays,
  Clock as ClockIcon,
  BriefcaseBusiness,
  GraduationCap as GraduationCapIcon,
  ChevronRight,
  Check,
  Settings,
  ClipboardList,
  Type,
  FileText,
  AlignLeft,
  List,
  DollarSign as DollarSignIcon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getTheme, ThemeMode, colors } from '@/utils/color';
import LoadingSpinner from '../LoadingSpinner';

// Define the organization-specific form data type
type OrganizationJobFormData = Omit<Job,
  '_id' |
  'company' |
  'organization' |
  'createdBy' |
  'applicationCount' |
  'viewCount' |
  'saveCount' |
  'createdAt' |
  'updatedAt' |
  'isActive' |
  'applications' |
  'views' |
  'salaryDisplay' |
  'canAcceptApplications' |
  'displayType' |
  'ownerType' |
  'applicationInfo' |
  'salaryInfo' |
  'isExpired'
> & {
  salary?: JobSalary;
  duration?: Duration;
  volunteerInfo?: VolunteerInfo;
  applicationDeadline: string;
  shortDescription: string;
  status: JobStatus;
  jobType: 'organization';
  demographicRequirements?: {
    sex: 'male' | 'female' | 'any';
    age?: {
      min?: number;
      max?: number;
    };
  };
  jobNumber?: string;
  candidatesNeeded: number;
  salaryMode: SalaryMode;
  isApplyEnabled: boolean;
  opportunityType: OpportunityType;
  // Organization context fields
  organizationContext?: {
    missionAlignment?: string;
    impactStatement?: string;
    teamDescription?: string;
  };
  applicationProcess?: {
    requirements?: string[];
    timeline?: string;
    selectionCriteria?: string[];
    contactInfo?: string;
  };
};

// Opportunity Type Configuration
interface OpportunityTypeConfig {
  value: OpportunityType;
  label: string;
  icon: React.ReactNode;
  description: string;
  defaultSalaryMode: SalaryMode;
  showDuration: boolean;
  showVolunteerFields: boolean;
  color: string;
  recommendations: string[];
}

interface OrganizationJobFormProps {
  initialData?: Job;
  onSubmit: (data: Partial<Job>) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
  organizationVerified?: boolean;
  mode?: 'create' | 'edit';
  themeMode?: ThemeMode;
}

// Category interface
interface JobCategory {
  value: string;
  label: string;
  group?: string;
}

const OrganizationJobForm: React.FC<OrganizationJobFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  onCancel,
  organizationVerified = false,
  mode = 'create',
  themeMode = 'light'
}) => {
  const theme = getTheme(themeMode);

  // Default form state
  const defaultFormData: OrganizationJobFormData = {
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
    educationLevel: 'undergraduate-bachelors',
    status: JobStatus.DRAFT,
    applicationDeadline: '',
    remote: 'on-site',
    workArrangement: 'office',
    jobType: 'organization',
    opportunityType: 'job' as OpportunityType,
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
    },
    tags: [],
    featured: false,
    urgent: false,
    premium: false,
    isApplyEnabled: true,
    demographicRequirements: {
      sex: 'any',
      age: {
        min: undefined,
        max: undefined
      }
    },
    jobNumber: '',
    candidatesNeeded: 1,
    salaryMode: SalaryMode.RANGE,
    // Organization context
    organizationContext: {
      missionAlignment: '',
      impactStatement: '',
      teamDescription: ''
    },
    applicationProcess: {
      requirements: [''],
      timeline: '',
      selectionCriteria: [''],
      contactInfo: ''
    }
  };

  const [formData, setFormData] = useState<OrganizationJobFormData>(defaultFormData);
  const [currentTag, setCurrentTag] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [descriptionError, setDescriptionError] = useState<string>('');
  const [allCategories, setAllCategories] = useState<JobCategory[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<Record<string, JobCategory[]>>({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Get data from service
  const ethiopianRegions = jobService.getEthiopianRegions();
  const educationLevels = jobService.getEducationLevels();
  const opportunityTypesList = jobService.getOpportunityTypes();
  const commitmentLevels = jobService.getCommitmentLevels();
  const durationUnits = jobService.getDurationUnits();

  // Opportunity Type Configuration
  const opportunityTypeConfigs: OpportunityTypeConfig[] = [
    {
      value: 'job' as OpportunityType,
      label: 'Job Opportunity',
      icon: <BriefcaseBusiness className="w-5 h-5" />,
      description: 'Traditional employment position with salary/benefits',
      defaultSalaryMode: SalaryMode.RANGE,
      showDuration: false,
      showVolunteerFields: false,
      color: themeMode === 'dark' ? colors.blue : colors.blue600,
      recommendations: ['Competitive salary', 'Benefits package', 'Career growth']
    },
    {
      value: 'volunteer' as OpportunityType,
      label: 'Volunteer Position',
      icon: <HeartIcon className="w-5 h-5" />,
      description: 'Unpaid position for social impact and experience',
      defaultSalaryMode: SalaryMode.HIDDEN,
      showDuration: true,
      showVolunteerFields: true,
      color: themeMode === 'dark' ? colors.red : colors.red,
      recommendations: ['Stipend optional', 'Accommodation possible', 'Flexible hours']
    },
    {
      value: 'internship' as OpportunityType,
      label: 'Internship',
      icon: <GraduationCapIcon className="w-5 h-5" />,
      description: 'Learning opportunity for students/graduates',
      defaultSalaryMode: SalaryMode.RANGE,
      showDuration: true,
      showVolunteerFields: false,
      color: themeMode === 'dark' ? colors.emerald : colors.emerald600,
      recommendations: ['Mentorship', 'Training', 'Potential job offer']
    },
    {
      value: 'fellowship' as OpportunityType,
      label: 'Fellowship',
      icon: <AwardIcon className="w-5 h-5" />,
      description: 'Prestigious program for advanced professionals',
      defaultSalaryMode: SalaryMode.COMPANY_SCALE,
      showDuration: true,
      showVolunteerFields: false,
      color: themeMode === 'dark' ? colors.purple : colors.purple,
      recommendations: ['Advanced training', 'Research opportunities', 'Networking']
    },
    {
      value: 'training' as OpportunityType,
      label: 'Training Program',
      icon: <Book className="w-5 h-5" />,
      description: 'Skill development and certification program',
      defaultSalaryMode: SalaryMode.HIDDEN,
      showDuration: true,
      showVolunteerFields: false,
      color: themeMode === 'dark' ? colors.amber : colors.amber600,
      recommendations: ['Certification', 'Hands-on experience', 'Job placement assistance']
    },
    {
      value: 'grant' as OpportunityType,
      label: 'Grant Opportunity',
      icon: <DollarSignIcon className="w-5 h-5" />,
      description: 'Funding opportunity for projects/research',
      defaultSalaryMode: SalaryMode.COMPANY_SCALE,
      showDuration: true,
      showVolunteerFields: false,
      color: themeMode === 'dark' ? colors.rose : colors.rose,
      recommendations: ['Research funding', 'Project support', 'Mentorship']
    },
    {
      value: 'other' as OpportunityType,
      label: 'Other Opportunity',
      icon: <Compass className="w-5 h-5" />,
      description: 'Custom opportunity type',
      defaultSalaryMode: SalaryMode.RANGE,
      showDuration: true,
      showVolunteerFields: false,
      color: themeMode === 'dark' ? colors.gray400 : colors.gray600,
      recommendations: ['Flexible terms', 'Custom arrangement', 'Unique experience']
    }
  ];

  // Get current opportunity type config
  const currentOpportunityConfig = opportunityTypeConfigs.find(
    config => config.value === formData.opportunityType
  ) || opportunityTypeConfigs[0];

  // Salary Mode Options
  const salaryModeOptions = [
    {
      value: SalaryMode.RANGE,
      label: 'Compensation Range',
      description: 'Show minimum and maximum compensation',
      icon: <TrendingUp className="w-5 h-5" />,
      color: themeMode === 'dark' ? colors.emerald : colors.emerald600
    },
    {
      value: SalaryMode.HIDDEN,
      label: 'Compensation Hidden',
      description: 'Compensation details not shown publicly',
      icon: <EyeOffIcon className="w-5 h-5" />,
      color: themeMode === 'dark' ? colors.gray400 : colors.gray600
    },
    {
      value: SalaryMode.NEGOTIABLE,
      label: 'Negotiable',
      description: 'Compensation can be discussed',
      icon: <Handshake className="w-5 h-5" />,
      color: themeMode === 'dark' ? colors.amber : colors.amber600
    },
    {
      value: SalaryMode.COMPANY_SCALE,
      label: 'Organization Scale',
      description: 'Based on organizational pay structure',
      icon: <Building className="w-5 h-5" />,
      color: themeMode === 'dark' ? colors.blue : colors.blue600
    }
  ];

  // Load all categories
  useEffect(() => {
    const loadAllCategories = async () => {
      try {
        setIsLoadingCategories(true);
        // Get categories from jobService
        const categories = jobService.getAllJobCategories();

        if (categories && categories.length > 0) {
          // Group categories
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
              value.includes('protection') || value.includes('grant') || value.includes('field') ||
              value.includes('ngo') || value.includes('volunteer') || value.includes('social'))) {
              group = 'NGO / Development';
            }
            // Education & Training
            else if (value.includes('teacher') || value.includes('professor') || value.includes('lecturer') ||
              value.includes('educat') || value.includes('school') || value.includes('academic') ||
              value.includes('trainer') || value.includes('tutor') || value.includes('instructor')) {
              group = 'Education & Training';
            }
            // Health & Social Services
            else if (value.includes('health') || value.includes('medical') || value.includes('doctor') ||
              value.includes('nurse') || value.includes('pharmac') || value.includes('hospital') ||
              value.includes('social') || value.includes('counsel') || value.includes('therapy')) {
              group = 'Health & Social Services';
            }
            // Environment & Agriculture
            else if (value.includes('environ') || value.includes('agricult') || value.includes('forest') ||
              value.includes('conserv') || value.includes('animal') || value.includes('wildlife')) {
              group = 'Environment & Agriculture';
            }
            // Arts & Culture
            else if (value.includes('art') || value.includes('culture') || value.includes('music') ||
              value.includes('design') || value.includes('creative') || value.includes('media')) {
              group = 'Arts & Culture';
            }
            // Business & Administration
            else if (value.includes('admin') || value.includes('manager') || value.includes('officer') ||
              value.includes('assistant') || value.includes('secretary') || value.includes('hr') ||
              value.includes('sales') || value.includes('marketing') || value.includes('customer') ||
              value.includes('finance') || value.includes('account')) {
              group = 'Business & Administration';
            }
            // Drivers & Hospitality
            else if (value.includes('driver') || value.includes('mechanic') || value.includes('fleet') ||
              value.includes('transport') || value.includes('hotel') || value.includes('chef') ||
              value.includes('waiter') || value.includes('receptionist')) {
              group = 'Drivers & Hospitality';
            }
            // Security & Support
            else if (value.includes('security') || value.includes('guard') || value.includes('safety') ||
              value.includes('cleaner') || value.includes('maintenance') || value.includes('caretaker')) {
              group = 'Security & Support';
            }
            // Graduate & Entry Level
            else if (value.includes('graduate') || value.includes('trainee') || value.includes('intern') ||
              value.includes('apprentice') || value.includes('volunteer') || value.includes('entry')) {
              group = 'Graduate & Entry Level';
            }

            if (!grouped[group]) {
              grouped[group] = [];
            }
            grouped[group].push({ ...category, group });
          });

          setAllCategories(categories);
          setCategoryGroups(grouped);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to default categories if loading fails
        const defaultCategories = jobService.getAllJobCategories();
        setAllCategories(defaultCategories);
      } finally {
        setIsLoadingCategories(false);
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

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      // Transform initial data
      const transformedData: OrganizationJobFormData = {
        title: initialData.title,
        description: initialData.description,
        shortDescription: initialData.shortDescription || '',
        requirements: initialData.requirements.length > 0 ? initialData.requirements : [''],
        responsibilities: initialData.responsibilities.length > 0 ? initialData.responsibilities : [''],
        benefits: initialData.benefits?.length > 0 ? initialData.benefits : [''],
        skills: initialData.skills.length > 0 ? initialData.skills : [''],
        type: initialData.type,
        location: initialData.location,
        salary: initialData.salary || defaultFormData.salary,
        category: initialData.category,
        subCategory: initialData.subCategory,
        experienceLevel: initialData.experienceLevel,
        educationLevel: initialData.educationLevel,
        status: initialData.status,
        applicationDeadline: initialData.applicationDeadline ?
          new Date(initialData.applicationDeadline).toISOString().split('T')[0] : '',
        remote: initialData.remote,
        workArrangement: initialData.workArrangement || 'office',
        jobType: 'organization',
        opportunityType: (initialData.opportunityType ?? 'job') as OpportunityType,
        duration: initialData.duration || defaultFormData.duration,
        volunteerInfo: initialData.volunteerInfo || defaultFormData.volunteerInfo,
        tags: initialData.tags || [],
        featured: initialData.featured || false,
        urgent: initialData.urgent || false,
        premium: initialData.premium || false,
        isApplyEnabled: initialData.isApplyEnabled !== undefined ? initialData.isApplyEnabled : true,
        demographicRequirements: initialData.demographicRequirements || defaultFormData.demographicRequirements,
        jobNumber: initialData.jobNumber || '',
        candidatesNeeded: initialData.candidatesNeeded || 1,
        salaryMode: initialData.salaryMode || SalaryMode.RANGE,
        organizationContext: defaultFormData.organizationContext,
        applicationProcess: defaultFormData.applicationProcess
      };

      setFormData(transformedData);

      // Set category search
      if (initialData.category) {
        const currentCategory = allCategories.find(cat => cat.value === initialData.category);
        if (currentCategory) {
          setCategorySearch(currentCategory.label);
        }
      }
    }
  }, [initialData, allCategories]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Opportunity title is required';
      isValid = false;
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
      isValid = false;
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
      isValid = false;
    }

    // Description validation - plain text length check
    const plainTextDescription = formData.description.trim();
    if (!plainTextDescription) {
      setDescriptionError('Description is required');
      isValid = false;
    } else if (plainTextDescription.length < 50) {
      setDescriptionError('Description must be at least 50 characters long');
      isValid = false;
    } else if (plainTextDescription.length > 5000) {
      setDescriptionError('Description cannot exceed 5000 characters');
      isValid = false;
    } else {
      setDescriptionError('');
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Category is required';
      isValid = false;
    }

    // Location validation
    if (!formData.location.region) {
      newErrors.region = 'Region is required';
      isValid = false;
    }

    if (formData.location.region !== 'international' && !formData.location.city) {
      newErrors.city = 'City is required for opportunities in Ethiopia';
      isValid = false;
    }

    // Candidates needed validation
    if (formData.candidatesNeeded === undefined || formData.candidatesNeeded < 1) {
      newErrors.candidatesNeeded = 'At least 1 candidate is required';
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

    // Salary validation
    if (formData.salaryMode === SalaryMode.RANGE) {
      if (formData.salary?.min && formData.salary?.max && formData.salary.min > formData.salary.max) {
        newErrors.salary = 'Minimum compensation cannot be greater than maximum';
        isValid = false;
      }
    }

    // Volunteer-specific validation
    if (formData.opportunityType === 'volunteer' && formData.volunteerInfo) {
      if (formData.volunteerInfo.hoursPerWeek && formData.volunteerInfo.hoursPerWeek > 168) {
        newErrors.hoursPerWeek = 'Hours per week cannot exceed 168';
        isValid = false;
      }
    }

    // Age validation
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

  // Handle input changes
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

    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle opportunity type change
  const handleOpportunityTypeChange = (type: OpportunityType) => {
    const config = opportunityTypeConfigs.find(c => c.value === type);
    if (!config) return;

    setFormData(prev => {
      const newData = {
        ...prev,
        opportunityType: type,
        salaryMode: config.defaultSalaryMode
      };

      // Reset volunteer info if not volunteer
      if (type !== 'volunteer') {
        newData.volunteerInfo = defaultFormData.volunteerInfo;
      }

      // Reset salary if not range
      if (config.defaultSalaryMode !== SalaryMode.RANGE && prev.salary) {
        newData.salary = {
          ...prev.salary,
          min: undefined,
          max: undefined,
          isPublic: config.defaultSalaryMode !== SalaryMode.HIDDEN,
          isNegotiable: config.defaultSalaryMode === SalaryMode.NEGOTIABLE
        };
      }

      // Set default experience level for internships
      if (type === 'internship') {
        newData.experienceLevel = 'fresh-graduate';
      }

      return newData;
    });
  };

  // Handle location change
  const handleLocationChange = (field: keyof EthiopianLocation, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));

    if (field === 'region' && value === 'international') {
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

  // Handle salary change
  const handleSalaryChange = (field: keyof NonNullable<OrganizationJobFormData['salary']>, value: any) => {
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

  // Handle salary mode change
  const handleSalaryModeChange = (mode: SalaryMode) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        salaryMode: mode
      };

      // Clear salary range if not in RANGE mode
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
  };

  // Handle duration change
  const handleDurationChange = (field: keyof NonNullable<OrganizationJobFormData['duration']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      duration: {
        ...prev.duration!,
        [field]: field === 'value' ? (value === '' ? undefined : Number(value)) : value
      }
    }));
  };

  // Handle volunteer info change
  const handleVolunteerInfoChange = (field: keyof NonNullable<OrganizationJobFormData['volunteerInfo']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      volunteerInfo: {
        ...prev.volunteerInfo!,
        [field]: field === 'hoursPerWeek' ? (value === '' ? undefined : Number(value)) : value
      }
    }));

    if (field === 'hoursPerWeek' && errors.hoursPerWeek) {
      setErrors(prev => ({ ...prev, hoursPerWeek: '' }));
    }
  };

  // Handle organization context change
  const handleOrganizationContextChange = (field: keyof NonNullable<OrganizationJobFormData['organizationContext']>, value: string) => {
    setFormData(prev => ({
      ...prev,
      organizationContext: {
        ...prev.organizationContext!,
        [field]: value
      }
    }));
  };

  // Handle application process change
  const handleApplicationProcessChange = (field: keyof NonNullable<OrganizationJobFormData['applicationProcess']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      applicationProcess: {
        ...prev.applicationProcess!,
        [field]: value
      }
    }));
  };

  // Handle array item changes
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

  // Add array item
  const addArrayItem = (field: 'requirements' | 'responsibilities' | 'benefits' | 'skills') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  // Remove array item
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

  // Handle tag management
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

  // Handle category selection
  const handleCategorySelect = (categoryValue: string, categoryLabel: string) => {
    setFormData(prev => ({
      ...prev,
      category: categoryValue
    }));
    setCategorySearch(categoryLabel);
    setShowCategoryDropdown(false);
  };

  // Handle category search
  const handleCategorySearchChange = (value: string) => {
    setCategorySearch(value);
    setShowCategoryDropdown(true);
  };

  // Handle candidates needed change
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

  // Handle application toggle
  const handleApplicationToggle = (enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      isApplyEnabled: enabled
    }));
  };

  // Handle description change
  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      description: value
    }));

    if (descriptionError) {
      setDescriptionError('');
    }
  };

  // Handle demographic change
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, status?: JobStatus) => {
    e.preventDefault();

    // Check if disabling applications but trying to publish
    if (status === JobStatus.ACTIVE && formData.isApplyEnabled === false) {
      const confirmPublish = window.confirm(
        `You are publishing this opportunity with applications disabled. ` +
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

    // Prepare submission data - plain text only
    const submitData: Partial<Job> = {
      title: formData.title.trim(),
      description: formData.description.trim(), // Plain text only
      shortDescription: formData.shortDescription?.trim() || '',
      requirements: formData.requirements.filter(req => req.trim() !== ''),
      responsibilities: formData.responsibilities.filter(resp => resp.trim() !== ''),
      benefits: formData.benefits.filter(benefit => benefit.trim() !== ''),
      skills: formData.skills.filter(skill => skill.trim() !== ''),
      type: formData.type,
      location: formData.location,
      category: formData.category,
      experienceLevel: formData.experienceLevel,
      educationLevel: formData.educationLevel,
      status: status || formData.status,
      remote: formData.remote,
      workArrangement: formData.workArrangement,
      jobType: 'organization',
      opportunityType: formData.opportunityType,
      featured: formData.featured,
      urgent: formData.urgent,
      premium: formData.premium,
      tags: formData.tags,
      demographicRequirements: formData.demographicRequirements,
      jobNumber: formData.jobNumber?.trim() || undefined,
      candidatesNeeded: formData.candidatesNeeded,
      salaryMode: formData.salaryMode,
      isApplyEnabled: formData.isApplyEnabled
    };

    // Include duration for non-permanent opportunities
    if (formData.duration && (formData.duration.value || formData.duration.isOngoing)) {
      submitData.duration = formData.duration;
    }

    // Include volunteer info for volunteer opportunities
    if (formData.opportunityType === 'volunteer' && formData.volunteerInfo) {
      submitData.volunteerInfo = formData.volunteerInfo;
    }

    // Include salary if it has values
    if (formData.salaryMode === SalaryMode.RANGE && (formData.salary?.min || formData.salary?.max)) {
      submitData.salary = formData.salary;
    } else {
      // For non-range modes
      submitData.salary = {
        currency: 'ETB',
        period: 'monthly',
        isPublic: formData.salaryMode !== SalaryMode.HIDDEN,
        isNegotiable: formData.salaryMode === SalaryMode.NEGOTIABLE
      };
    }

    // Format application deadline
    if (formData.applicationDeadline) {
      submitData.applicationDeadline = new Date(formData.applicationDeadline).toISOString();
    }

    // Include subCategory
    if (formData.subCategory) {
      submitData.subCategory = formData.subCategory;
    }

    console.log('📤 Submitting organization opportunity:', submitData);

    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting opportunity:', error);
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep === 1) {
      // Validate Step 1 fields
      const step1Errors: Record<string, string> = {};
      if (!formData.title.trim()) {
        step1Errors.title = 'Opportunity title is required';
      }
      if (!formData.category) {
        step1Errors.category = 'Category is required';
      }
      if (!formData.location.region) {
        step1Errors.region = 'Region is required';
      }
      if (Object.keys(step1Errors).length > 0) {
        setErrors(prev => ({ ...prev, ...step1Errors }));
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields before proceeding.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (currentStep === 2) {
      // Validate Step 2 fields
      const step2Errors: Record<string, string> = {};
      if (!formData.description.trim()) {
        setDescriptionError('Description is required');
        step2Errors.description = 'Description is required';
      }
      if (Object.keys(step2Errors).length > 0) {
        setErrors(prev => ({ ...prev, ...step2Errors }));
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields before proceeding.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (currentStep === 3) {
      // Validate Step 3 fields
      const step3Errors: Record<string, string> = {};
      if (!formData.applicationDeadline) {
        step3Errors.applicationDeadline = 'Application deadline is required';
      }
      if (formData.salaryMode === SalaryMode.RANGE) {
        if (formData.salary?.min && formData.salary?.max && formData.salary.min > formData.salary.max) {
          step3Errors.salary = 'Minimum compensation cannot be greater than maximum';
        }
      }
      if (Object.keys(step3Errors).length > 0) {
        setErrors(prev => ({ ...prev, ...step3Errors }));
        toast({
          title: 'Validation Error',
          description: 'Please fix the errors in the form before proceeding.',
          variant: 'destructive',
        });
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Get selected region
  const selectedRegion = ethiopianRegions.find(region => region.slug === formData.location.region);
  const isInternational = formData.location.region === 'international';
  const showSalaryRangeFields = formData.salaryMode === SalaryMode.RANGE;

  // Get current category label
  const currentCategoryLabel = allCategories.find(cat => cat.value === formData.category)?.label || formData.category;

  // Step colors
  const stepColors = {
    stepBg: themeMode === 'dark' ? colors.gray800 : colors.gray100,
    stepActiveBg: themeMode === 'dark' ? colors.purple : colors.purple,
    stepText: themeMode === 'dark' ? colors.gray400 : colors.gray600,
    stepActiveText: themeMode === 'dark' ? colors.white : colors.white,
    progressBar: themeMode === 'dark' ? colors.gray700 : colors.gray300,
    progressBarActive: themeMode === 'dark' ? colors.purple : colors.purple
  };

  // Format salary display
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
        return 'Compensation not specified';
      case SalaryMode.HIDDEN:
        return 'Compensation details hidden';
      case SalaryMode.NEGOTIABLE:
        return 'Negotiable';
      case SalaryMode.COMPANY_SCALE:
        return 'As per organizational scale';
      default:
        return 'Compensation not specified';
    }
  };

  // Render salary mode selector - MOBILE OPTIMIZED
  const renderSalaryModeSelector = () => (
    <div className="space-y-3">
      <label className={`block text-xs sm:text-sm font-medium mb-2`} style={{ color: theme.text.secondary }}>
        Compensation Display Mode *
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {salaryModeOptions.map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => handleSalaryModeChange(option.value)}
            className={`p-2 sm:p-4 rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col items-center text-center ${
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
            <div className="mb-1 sm:mb-2" style={{ color: option.color }}>
              {option.icon}
            </div>
            <h4 className={`font-semibold text-xs sm:text-sm`} style={{ color: theme.text.primary }}>
              {option.label}
            </h4>
            <p className={`text-xs hidden sm:block mt-1 line-clamp-2`} style={{ color: theme.text.muted }}>
              {option.description}
            </p>
            {formData.salaryMode === option.value && (
              <div className="mt-1 sm:mt-2">
                <Check className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: option.color }} />
              </div>
            )}
          </button>
        ))}
      </div>
      {errors.salaryMode && (
        <p className="mt-1 text-xs" style={{ color: themeMode === 'dark' ? colors.red : colors.red }}>
          {errors.salaryMode}
        </p>
      )}
    </div>
  );

  // Render salary range fields - MOBILE OPTIMIZED
  const renderSalaryRangeFields = () => (
    showSalaryRangeFields && (
      <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-xl border transition-all duration-300"
        style={{
          backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.gray100,
          borderColor: theme.border.secondary
        }}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: themeMode === 'dark' ? colors.emerald : colors.emerald600 }} />
          <h4 className={`font-semibold text-sm sm:text-base`} style={{ color: theme.text.primary }}>Compensation Details</h4>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
              Min
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.salary?.min || ''}
                onChange={(e) => handleSalaryChange('min', e.target.value)}
                className={`w-full pl-6 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                style={{
                  border: `1px solid ${theme.border.primary}`,
                  color: theme.text.primary,
                  backgroundColor: theme.bg.primary
                }}
                placeholder="0"
                min="0"
              />
              <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2">
                <span className={`text-xs sm:text-sm`} style={{ color: theme.text.muted }}>Min</span>
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
              Max
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.salary?.max || ''}
                onChange={(e) => handleSalaryChange('max', e.target.value)}
                className={`w-full pl-6 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                style={{
                  border: `1px solid ${theme.border.primary}`,
                  color: theme.text.primary,
                  backgroundColor: theme.bg.primary
                }}
                placeholder="0"
                min="0"
              />
              <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2">
                <span className={`text-xs sm:text-sm`} style={{ color: theme.text.muted }}>Max</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
              Currency *
            </label>
            <select
              value={formData.salary?.currency || 'ETB'}
              onChange={(e) => handleSalaryChange('currency', e.target.value)}
              className={`w-full px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
              style={{
                border: `1px solid ${theme.border.primary}`,
                color: theme.text.primary,
                backgroundColor: theme.bg.primary
              }}
            >
              <option value="ETB">ETB</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
              Period
            </label>
            <select
              value={formData.salary?.period || 'monthly'}
              onChange={(e) => handleSalaryChange('period', e.target.value)}
              className={`w-full px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
              style={{
                border: `1px solid ${theme.border.primary}`,
                color: theme.text.primary,
                backgroundColor: theme.bg.primary
              }}
            >
              <option value="hourly">Hour</option>
              <option value="daily">Day</option>
              <option value="weekly">Week</option>
              <option value="monthly">Month</option>
              <option value="yearly">Year</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.salary?.isNegotiable || false}
              onChange={(e) => handleSalaryChange('isNegotiable', e.target.checked)}
              className="h-3 w-3 sm:h-4 sm:w-4 rounded"
              style={{
                accentColor: themeMode === 'dark' ? colors.purple : colors.purple,
                borderColor: theme.border.primary
              }}
            />
            <span className={`ml-1 sm:ml-2 text-xs sm:text-sm`} style={{ color: theme.text.secondary }}>
              Negotiable
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.salary?.isPublic !== false}
              onChange={(e) => handleSalaryChange('isPublic', e.target.checked)}
              className="h-3 w-3 sm:h-4 sm:w-4 rounded"
              style={{
                accentColor: themeMode === 'dark' ? colors.purple : colors.purple,
                borderColor: theme.border.primary
              }}
            />
            <span className={`ml-1 sm:ml-2 text-xs sm:text-sm`} style={{ color: theme.text.secondary }}>
              Show publicly
            </span>
          </label>
        </div>

        {errors.salary && (
          <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.red100 }}>
            <p className="text-xs sm:text-sm" style={{ color: themeMode === 'dark' ? colors.red : colors.red }}>
              {errors.salary}
            </p>
          </div>
        )}
      </div>
    )
  );

  // Render candidates needed input - MOBILE OPTIMIZED
  const renderCandidatesNeededInput = () => (
    <div>
      <label className={`block text-xs sm:text-sm font-medium mb-1 flex items-center gap-2`} style={{ color: theme.text.secondary }}>
        <UsersIcon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: theme.text.secondary }} />
        Candidates Needed *
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            value={formData.candidatesNeeded}
            onChange={(e) => handleCandidatesNeededChange(e.target.value)}
            className={`w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
            style={{
              border: `1px solid ${errors.candidatesNeeded ? (themeMode === 'dark' ? colors.red : colors.red) : theme.border.primary}`,
              color: theme.text.primary,
              backgroundColor: theme.bg.primary
            }}
            placeholder="1"
            min="1"
            step="1"
          />
          <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2">
            <Hash className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: theme.text.muted }} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleCandidatesNeededChange(String(Math.max(1, formData.candidatesNeeded - 1)))}
            className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
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
            className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
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
      <div className={`flex items-center justify-between mt-1`}>
        <p className={`text-xs`} style={{ color: theme.text.muted }}>
          Number of candidates
        </p>
        <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          formData.candidatesNeeded === 1
            ? themeMode === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
            : formData.candidatesNeeded <= 5
              ? themeMode === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
              : themeMode === 'dark' ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800'
          }`}>
          {formData.candidatesNeeded} position{formData.candidatesNeeded !== 1 ? 's' : ''}
        </div>
      </div>
      {errors.candidatesNeeded && (
        <p className="mt-1 text-xs" style={{ color: themeMode === 'dark' ? colors.red : colors.red }}>
          {errors.candidatesNeeded}
        </p>
      )}
    </div>
  );

  // Render application control
  const renderApplicationControl = () => (
    <div className="p-3 sm:p-4 rounded-xl border"
      style={{
        backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.purple100,
        borderColor: themeMode === 'dark' ? colors.purple : colors.purple
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {formData.isApplyEnabled ? (
            <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: themeMode === 'dark' ? colors.emerald : colors.emerald600 }} />
          ) : (
            <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.text.muted }} />
          )}
          <div>
            <h4 className={`font-semibold text-xs sm:text-sm`} style={{ color: theme.text.primary }}>
              Accept Applications
            </h4>
            <p className={`text-xs mt-0.5`} style={{ color: theme.text.secondary }}>
              {formData.isApplyEnabled
                ? 'Candidates can apply'
                : 'View only'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleApplicationToggle(!formData.isApplyEnabled)}
          className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            formData.isApplyEnabled
              ? themeMode === 'dark' ? 'bg-green-600' : 'bg-green-500'
              : themeMode === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
              formData.isApplyEnabled ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );

  // Render duration fields - MOBILE OPTIMIZED
  const renderDurationFields = () => (
    currentOpportunityConfig.showDuration && (
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: currentOpportunityConfig.color }} />
          <h4 className={`font-semibold text-sm sm:text-base`} style={{ color: theme.text.primary }}>Duration</h4>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.duration?.isOngoing || false}
              onChange={(e) => handleDurationChange('isOngoing', e.target.checked)}
              className="h-3 w-3 sm:h-4 sm:w-4 rounded"
              style={{
                accentColor: currentOpportunityConfig.color,
                borderColor: theme.border.primary
              }}
            />
            <span className={`ml-1 sm:ml-2 text-xs sm:text-sm`} style={{ color: theme.text.secondary }}>
              Ongoing opportunity
            </span>
          </label>

          {!formData.duration?.isOngoing && (
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                  Duration
                </label>
                <input
                  type="number"
                  value={formData.duration?.value || ''}
                  onChange={(e) => handleDurationChange('value', e.target.value)}
                  className={`w-full px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                  style={{
                    border: `1px solid ${theme.border.primary}`,
                    color: theme.text.primary,
                    backgroundColor: theme.bg.primary
                  }}
                  placeholder="e.g., 6"
                  min="1"
                />
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                  Unit
                </label>
                <select
                  value={formData.duration?.unit || 'months'}
                  onChange={(e) => handleDurationChange('unit', e.target.value)}
                  className={`w-full px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                  style={{
                    border: `1px solid ${theme.border.primary}`,
                    color: theme.text.primary,
                    backgroundColor: theme.bg.primary
                  }}
                >
                  {durationUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className={`text-xs italic`} style={{ color: theme.text.muted }}>
            {formData.duration?.isOngoing
              ? 'No fixed end date'
              : `Typical: ${formData.opportunityType === 'internship' ? '3-6 months' : '6-12 months'}`
            }
          </div>
        </div>
      </div>
    )
  );

  // Render volunteer fields - MOBILE OPTIMIZED
  const renderVolunteerFields = () => (
    currentOpportunityConfig.showVolunteerFields && (
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: currentOpportunityConfig.color }} />
          <h4 className={`font-semibold text-sm sm:text-base`} style={{ color: theme.text.primary }}>Volunteer Details</h4>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
              Hours/Week
            </label>
            <input
              type="number"
              value={formData.volunteerInfo?.hoursPerWeek || ''}
              onChange={(e) => handleVolunteerInfoChange('hoursPerWeek', e.target.value)}
              className={`w-full px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
              style={{
                border: `1px solid ${errors.hoursPerWeek ? (themeMode === 'dark' ? colors.red : colors.red) : theme.border.primary}`,
                color: theme.text.primary,
                backgroundColor: theme.bg.primary
              }}
              placeholder="20"
              min="1"
              max="40"
            />
            {errors.hoursPerWeek && (
              <p className="mt-1 text-xs" style={{ color: themeMode === 'dark' ? colors.red : colors.red }}>
                {errors.hoursPerWeek}
              </p>
            )}
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
              Commitment
            </label>
            <select
              value={formData.volunteerInfo?.commitmentLevel || 'regular'}
              onChange={(e) => handleVolunteerInfoChange('commitmentLevel', e.target.value)}
              className={`w-full px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
              style={{
                border: `1px solid ${theme.border.primary}`,
                color: theme.text.primary,
                backgroundColor: theme.bg.primary
              }}
            >
              {commitmentLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.volunteerInfo?.providesAccommodation || false}
              onChange={(e) => handleVolunteerInfoChange('providesAccommodation', e.target.checked)}
              className="h-3 w-3 sm:h-4 sm:w-4 rounded"
              style={{
                accentColor: currentOpportunityConfig.color,
                borderColor: theme.border.primary
              }}
            />
            <span className={`ml-1 sm:ml-2 text-xs sm:text-sm flex items-center gap-1`} style={{ color: theme.text.secondary }}>
              <Home className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: theme.text.secondary }} />
              Accommodation
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.volunteerInfo?.providesStipend || false}
              onChange={(e) => handleVolunteerInfoChange('providesStipend', e.target.checked)}
              className="h-3 w-3 sm:h-4 sm:w-4 rounded"
              style={{
                accentColor: currentOpportunityConfig.color,
                borderColor: theme.border.primary
              }}
            />
            <span className={`ml-1 sm:ml-2 text-xs sm:text-sm flex items-center gap-1`} style={{ color: theme.text.secondary }}>
              <DollarSignIcon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: theme.text.secondary }} />
              Stipend
            </span>
          </label>
        </div>
      </div>
    )
  );

  // Render organization context fields - MOBILE OPTIMIZED
  const renderOrganizationContextFields = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <TargetIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: currentOpportunityConfig.color }} />
        <h4 className={`font-semibold text-sm sm:text-base`} style={{ color: theme.text.primary }}>Organization Context</h4>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
            Mission Alignment
          </label>
          <textarea
            value={formData.organizationContext?.missionAlignment || ''}
            onChange={(e) => handleOrganizationContextChange('missionAlignment', e.target.value)}
            rows={2}
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
            style={{
              border: `1px solid ${theme.border.primary}`,
              color: theme.text.primary,
              backgroundColor: theme.bg.primary
            }}
            placeholder="How does this align with our mission?"
          />
        </div>

        <div>
          <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
            Impact Statement
          </label>
          <textarea
            value={formData.organizationContext?.impactStatement || ''}
            onChange={(e) => handleOrganizationContextChange('impactStatement', e.target.value)}
            rows={2}
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
            style={{
              border: `1px solid ${theme.border.primary}`,
              color: theme.text.primary,
              backgroundColor: theme.bg.primary
            }}
            placeholder="What impact will this create?"
          />
        </div>

        <div>
          <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
            Team Description
          </label>
          <textarea
            value={formData.organizationContext?.teamDescription || ''}
            onChange={(e) => handleOrganizationContextChange('teamDescription', e.target.value)}
            rows={2}
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
            style={{
              border: `1px solid ${theme.border.primary}`,
              color: theme.text.primary,
              backgroundColor: theme.bg.primary
            }}
            placeholder="Describe the team..."
          />
        </div>
      </div>
    </div>
  );

  // Render application process fields - MOBILE OPTIMIZED
  const renderApplicationProcessFields = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: currentOpportunityConfig.color }} />
        <h4 className={`font-semibold text-sm sm:text-base`} style={{ color: theme.text.primary }}>Application Process</h4>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
            Requirements
          </label>
          <div className="space-y-1">
            {formData.applicationProcess?.requirements?.map((req, index) => (
              <div key={index} className="flex gap-1">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => {
                    const newReqs = [...(formData.applicationProcess?.requirements || [])];
                    newReqs[index] = e.target.value;
                    handleApplicationProcessChange('requirements', newReqs);
                  }}
                  className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                  style={{
                    border: `1px solid ${theme.border.primary}`,
                    color: theme.text.primary,
                    backgroundColor: theme.bg.primary
                  }}
                  placeholder="Add requirement..."
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newReqs = [...(formData.applicationProcess?.requirements || [])];
                      newReqs.splice(index, 1);
                      handleApplicationProcessChange('requirements', newReqs);
                    }}
                    className="px-2 sm:px-3 py-1.5 sm:py-3 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.red100,
                      color: themeMode === 'dark' ? colors.red : colors.red
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newReqs = [...(formData.applicationProcess?.requirements || []), ''];
                handleApplicationProcessChange('requirements', newReqs);
              }}
              className="px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              style={{
                backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.purple100,
                color: themeMode === 'dark' ? colors.purple : colors.purple
              }}
            >
              + Add Requirement
            </button>
          </div>
        </div>

        <div>
          <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
            Timeline
          </label>
          <input
            type="text"
            value={formData.applicationProcess?.timeline || ''}
            onChange={(e) => handleApplicationProcessChange('timeline', e.target.value)}
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
            style={{
              border: `1px solid ${theme.border.primary}`,
              color: theme.text.primary,
              backgroundColor: theme.bg.primary
            }}
            placeholder="Application timeline"
          />
        </div>

        <div>
          <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
            Selection Criteria
          </label>
          <div className="space-y-1">
            {formData.applicationProcess?.selectionCriteria?.map((crit, index) => (
              <div key={index} className="flex gap-1">
                <input
                  type="text"
                  value={crit}
                  onChange={(e) => {
                    const newCriteria = [...(formData.applicationProcess?.selectionCriteria || [])];
                    newCriteria[index] = e.target.value;
                    handleApplicationProcessChange('selectionCriteria', newCriteria);
                  }}
                  className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                  style={{
                    border: `1px solid ${theme.border.primary}`,
                    color: theme.text.primary,
                    backgroundColor: theme.bg.primary
                  }}
                  placeholder="Add criteria..."
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newCriteria = [...(formData.applicationProcess?.selectionCriteria || [])];
                      newCriteria.splice(index, 1);
                      handleApplicationProcessChange('selectionCriteria', newCriteria);
                    }}
                    className="px-2 sm:px-3 py-1.5 sm:py-3 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.red100,
                      color: themeMode === 'dark' ? colors.red : colors.red
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newCriteria = [...(formData.applicationProcess?.selectionCriteria || []), ''];
                handleApplicationProcessChange('selectionCriteria', newCriteria);
              }}
              className="px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              style={{
                backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.purple100,
                color: themeMode === 'dark' ? colors.purple : colors.purple
              }}
            >
              + Add Criteria
            </button>
          </div>
        </div>

        <div>
          <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
            Contact Information
          </label>
          <input
            type="text"
            value={formData.applicationProcess?.contactInfo || ''}
            onChange={(e) => handleApplicationProcessChange('contactInfo', e.target.value)}
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
            style={{
              border: `1px solid ${theme.border.primary}`,
              color: theme.text.primary,
              backgroundColor: theme.bg.primary
            }}
            placeholder="Email or phone for inquiries"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`max-w-6xl mx-auto rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border`}
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-4">
          <div>
            <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2`} style={{ color: theme.text.primary }}>
              {mode === 'edit' ? 'Edit Organization Opportunity' : 'Create New Opportunity'}
            </h2>
            <p className={`text-sm sm:text-base`} style={{ color: theme.text.secondary }}>
              {mode === 'edit'
                ? 'Update your opportunity details below.'
                : 'Fill in the details to create a new opportunity for volunteers, interns, fellows, or staff.'
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1`}
              style={{
                backgroundColor: theme.bg.secondary,
                color: theme.text.secondary,
                border: `1px solid ${theme.border.primary}`
              }}
            >
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Organization
            </div>

            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5`}
              style={{
                backgroundColor: theme.bg.secondary,
                border: `1px solid ${theme.border.primary}`,
                color: theme.text.secondary
              }}
            >
              {showPreview ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm`}
                  style={{
                    backgroundColor: step <= currentStep ? stepColors.stepActiveBg : stepColors.stepBg,
                    color: step <= currentStep ? stepColors.stepActiveText : stepColors.stepText
                  }}
                >
                  {step}
                </div>
                {step < 4 && (
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
            <span style={{ color: currentStep >= 1 ? stepColors.stepActiveBg : stepColors.stepText }}>Basic</span>
            <span style={{ color: currentStep >= 2 ? stepColors.stepActiveBg : stepColors.stepText }}>Description</span>
            <span style={{ color: currentStep >= 3 ? stepColors.stepActiveBg : stepColors.stepText }}>Details</span>
            <span style={{ color: currentStep >= 4 ? stepColors.stepActiveBg : stepColors.stepText }}>Review</span>
          </div>
        </div>

        {!organizationVerified && (
          <div
            className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg"
            style={{
              backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.amber100,
              border: `1px solid ${themeMode === 'dark' ? colors.amber : colors.amber600}`,
              color: themeMode === 'dark' ? colors.amber : colors.amber600
            }}
          >
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 mr-2" />
              <span className="text-xs sm:text-sm">
                Not verified - requires admin approval
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
          <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4`} style={{ color: theme.text.primary }}>
            Opportunity Preview
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h4 className={`text-sm sm:text-base font-semibold`} style={{ color: theme.text.primary }}>{formData.title}</h4>
              <p className={`text-xs sm:text-sm`} style={{ color: theme.text.secondary }}>{formData.shortDescription}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <span
                className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: currentOpportunityConfig.color + '20', color: currentOpportunityConfig.color }}
              >
                {currentOpportunityConfig.label}
              </span>
              <span
                className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium flex items-center gap-1"
                style={{
                  backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.gray100,
                  color: themeMode === 'dark' ? colors.gray300 : colors.gray600
                }}
              >
                <UsersIcon className="w-3 h-3" />
                {formData.candidatesNeeded}
              </span>
            </div>
            <div className={`text-xs sm:text-sm font-semibold`} style={{ color: themeMode === 'dark' ? colors.emerald : colors.emerald600 }}>
              {formatSalaryDisplay()}
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
              <h3 className={`text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center`} style={{ color: theme.text.primary }}>
                <TargetIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: theme.text.primary }} />
                Basic Information
              </h3>

              <div className="space-y-4 sm:space-y-6">
                {/* Opportunity Type Selector - MOBILE OPTIMIZED */}
                <div>
                  <label className={`block text-xs sm:text-sm font-medium mb-2 sm:mb-3`} style={{ color: theme.text.secondary }}>
                    Opportunity Type *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {opportunityTypeConfigs.map((config) => (
                      <button
                        type="button"
                        key={config.value}
                        onClick={() => handleOpportunityTypeChange(config.value)}
                        className={`p-2 sm:p-4 rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col items-start text-left ${
                          formData.opportunityType === config.value
                            ? 'ring-2 ring-offset-2'
                            : 'hover:border-opacity-70'
                        }`}
                        style={{
                          backgroundColor: theme.bg.primary,
                          borderColor: formData.opportunityType === config.value
                            ? config.color
                            : theme.border.primary,
                          borderWidth: formData.opportunityType === config.value ? '2px' : '1px',
                          color: theme.text.primary,
                          ...(formData.opportunityType === config.value ? {
                            borderColor: config.color,
                            boxShadow: `0 0 0 2px ${config.color}20`
                          } : {})
                        }}
                      >
                        <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                          <div style={{ color: config.color }}>
                            {config.icon}
                          </div>
                          <h4 className={`font-semibold text-xs sm:text-sm`} style={{ color: theme.text.primary }}>
                            {config.label}
                          </h4>
                        </div>
                        <div className="mt-auto">
                          <div className="text-xs font-medium px-1 sm:px-2 py-0.5 sm:py-1 rounded-full mb-1"
                            style={{ backgroundColor: config.color + '20', color: config.color }}>
                            {salaryModeOptions.find(opt => opt.value === config.defaultSalaryMode)?.label}
                          </div>
                          {formData.opportunityType === config.value && (
                            <div className="flex items-center text-xs" style={{ color: config.color }}>
                              <Check className="w-3 h-3 mr-1" />
                              Selected
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Basic Information Fields - MOBILE OPTIMIZED */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                  {/* Opportunity Title */}
                  <div className="lg:col-span-2">
                    <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                      Opportunity Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                      style={{
                        border: `1px solid ${errors.title ? (themeMode === 'dark' ? colors.red : colors.red) : theme.border.primary}`,
                        color: theme.text.primary,
                        backgroundColor: theme.bg.primary
                      }}
                      placeholder="e.g. Program Officer"
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs" style={{ color: themeMode === 'dark' ? colors.red : colors.red }}>
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Opportunity Number */}
                  <div>
                    <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                      Opportunity Number
                    </label>
                    <input
                      type="text"
                      name="jobNumber"
                      value={formData.jobNumber}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                      style={{
                        border: `1px solid ${theme.border.primary}`,
                        color: theme.text.primary,
                        backgroundColor: theme.bg.primary
                      }}
                      placeholder="e.g. ORG-2024-001"
                    />
                  </div>

                  {/* Engagement Type */}
                  <div>
                    <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                      Engagement Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                      style={{
                        border: `1px solid ${theme.border.primary}`,
                        color: theme.text.primary,
                        backgroundColor: theme.bg.primary
                      }}
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

                  {/* Short Description */}
                  <div className="lg:col-span-2">
                    <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                      Short Description
                    </label>
                    <textarea
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleInputChange}
                      rows={2}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                      style={{
                        border: `1px solid ${theme.border.primary}`,
                        color: theme.text.primary,
                        backgroundColor: theme.bg.primary
                      }}
                      placeholder="Brief summary of the opportunity..."
                      maxLength={200}
                    />
                    <div className={`text-right text-xs mt-1`} style={{ color: theme.text.muted }}>
                      {formData.shortDescription.length}/200
                    </div>
                  </div>

                  {/* Category with Search */}
                  <div className="lg:col-span-2 relative">
                    <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                      Category *
                      <span className={`text-xs ml-1`} style={{ color: theme.text.muted }}>
                        ({allCategories.length})
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => handleCategorySearchChange(e.target.value)}
                        onFocus={() => setShowCategoryDropdown(true)}
                        placeholder="Search categories..."
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                        style={{
                          border: `1px solid ${errors.category ? (themeMode === 'dark' ? colors.red : colors.red) : theme.border.primary}`,
                          color: theme.text.primary,
                          backgroundColor: theme.bg.primary
                        }}
                      />
                      <Search className="absolute right-3 top-2.5 h-3 w-3 sm:h-4 sm:w-4" style={{ color: theme.text.muted }} />
                    </div>

                    {/* Show current selection */}
                    {!showCategoryDropdown && formData.category && (
                      <div className="mt-1">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                          style={{
                            backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.emerald100,
                            color: themeMode === 'dark' ? colors.emerald : colors.emerald600
                          }}
                        >
                          <Target className="w-3 h-3 mr-1" />
                          {currentCategoryLabel}
                        </span>
                      </div>
                    )}

                    {showCategoryDropdown && (
                      <div
                        className="absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        style={{
                          backgroundColor: theme.bg.primary,
                          borderColor: theme.border.primary
                        }}
                      >
                        {isLoadingCategories ? (
                          <div className="px-4 py-2 text-center">
                            <LoadingSpinner size="sm" themeMode={themeMode} />
                            <p className={`text-xs mt-2`} style={{ color: theme.text.muted }}>Loading...</p>
                          </div>
                        ) : Object.keys(filteredCategoryGroups).length > 0 ? (
                          <div className="max-h-60 overflow-y-auto">
                            {Object.entries(filteredCategoryGroups).map(([group, categories]) => (
                              <div key={group}>
                                <div
                                  className="px-3 py-2 text-xs font-semibold border-b sticky top-0"
                                  style={{
                                    backgroundColor: theme.bg.secondary,
                                    borderColor: theme.border.primary,
                                    color: theme.text.primary
                                  }}
                                >
                                  {group} ({categories.length})
                                </div>
                                {categories.slice(0, isCategoryExpanded ? undefined : 10).map(category => (
                                  <div
                                    key={category.value}
                                    onClick={() => handleCategorySelect(category.value, category.label)}
                                    className={`px-3 py-2 hover:cursor-pointer border-b last:border-b-0 text-xs sm:text-sm ${
                                      formData.category === category.value ? 'font-medium' : ''
                                    }`}
                                    style={{
                                      borderColor: theme.border.secondary,
                                      color: theme.text.primary,
                                      backgroundColor: formData.category === category.value ? theme.bg.secondary : 'transparent'
                                    }}
                                  >
                                    {category.label}
                                  </div>
                                ))}
                              </div>
                            ))}
                            {filteredCategories.length > 10 && !isCategoryExpanded && (
                              <button
                                type="button"
                                onClick={() => setIsCategoryExpanded(true)}
                                className={`w-full px-3 py-2 text-xs border-t flex items-center justify-center hover:opacity-80`}
                                style={{
                                  borderColor: theme.border.secondary,
                                  color: theme.text.secondary,
                                  backgroundColor: theme.bg.primary
                                }}
                              >
                                <ChevronDown className="w-3 h-3 mr-1" />
                                Show more
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className={`px-3 py-2 text-xs`} style={{ color: theme.text.muted }}>No categories found</div>
                        )}
                      </div>
                    )}
                    {errors.category && (
                      <p className="mt-1 text-xs" style={{ color: themeMode === 'dark' ? colors.red : colors.red }}>
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Candidates Needed */}
                  <div className="lg:col-span-2">
                    {renderCandidatesNeededInput()}
                  </div>

                  {/* Location Information */}
                  <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: currentOpportunityConfig.color }} />
                      <h4 className={`font-semibold text-sm sm:text-base`} style={{ color: theme.text.primary }}>Location</h4>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                      <div>
                        <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                          Region *
                        </label>
                        <select
                          value={formData.location.region}
                          onChange={(e) => handleLocationChange('region', e.target.value)}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                          style={{
                            border: `1px solid ${errors.region ? (themeMode === 'dark' ? colors.red : colors.red) : theme.border.primary}`,
                            color: theme.text.primary,
                            backgroundColor: theme.bg.primary
                          }}
                        >
                          {ethiopianRegions.map(region => (
                            <option key={region.slug} value={region.slug}>
                              {region.name}
                            </option>
                          ))}
                        </select>
                        {errors.region && (
                          <p className="mt-1 text-xs" style={{ color: themeMode === 'dark' ? colors.red : colors.red }}>
                            {errors.region}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                          {isInternational ? 'Location' : 'City *'}
                        </label>
                        {isInternational ? (
                          <input
                            type="text"
                            value={formData.location.city}
                            onChange={(e) => handleLocationChange('city', e.target.value)}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                            style={{
                              border: `1px solid ${theme.border.primary}`,
                              color: theme.text.primary,
                              backgroundColor: theme.bg.primary
                            }}
                            placeholder="e.g. Remote Worldwide"
                          />
                        ) : (
                          <select
                            value={formData.location.city}
                            onChange={(e) => handleLocationChange('city', e.target.value)}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                            style={{
                              border: `1px solid ${errors.city ? (themeMode === 'dark' ? colors.red : colors.red) : theme.border.primary}`,
                              color: theme.text.primary,
                              backgroundColor: theme.bg.primary
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
                          <p className="mt-1 text-xs" style={{ color: themeMode === 'dark' ? colors.red : colors.red }}>
                            {errors.city}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                          Work Arrangement *
                        </label>
                        <select
                          name="remote"
                          value={formData.remote}
                          onChange={handleInputChange}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                          style={{
                            border: `1px solid ${theme.border.primary}`,
                            color: theme.text.primary,
                            backgroundColor: theme.bg.primary
                          }}
                        >
                          <option value="on-site">On-Site</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="remote">Remote</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                          Workplace Type
                        </label>
                        <select
                          name="workArrangement"
                          value={formData.workArrangement}
                          onChange={handleInputChange}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                          style={{
                            border: `1px solid ${theme.border.primary}`,
                            color: theme.text.primary,
                            backgroundColor: theme.bg.primary
                          }}
                        >
                          <option value="office">Office</option>
                          <option value="field-work">Field Work</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Description & Requirements - MOBILE OPTIMIZED */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              {/* Opportunity Description */}
              <div
                className="rounded-xl p-4 sm:p-6"
                style={{
                  backgroundColor: theme.bg.secondary,
                  border: `1px solid ${theme.border.primary}`
                }}
              >
                <h3 className={`text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center`} style={{ color: theme.text.primary }}>
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: theme.text.primary }} />
                  Description & Requirements
                </h3>

                <div className="space-y-4 sm:space-y-6">
                  {/* Opportunity Description */}
                  <div>
                    <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                      Opportunity Description *
                    </label>
                    <div className="space-y-2">
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        rows={8}
                        className={`w-full px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 resize-y`}
                        style={{
                          border: `2px solid ${descriptionError ? (themeMode === 'dark' ? colors.red : colors.red) : theme.border.primary}`,
                          color: theme.text.primary,
                          backgroundColor: theme.bg.primary,
                          minHeight: '200px',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          lineHeight: '1.5'
                        }}
                        placeholder="Write a detailed description..."
                      />

                      <div className="flex justify-between items-center">
                        <p className={`text-xs`} style={{ color: theme.text.muted }}>
                          Min 50, Max 5000 chars
                        </p>
                        <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          formData.description.length < 50
                            ? themeMode === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                            : formData.description.length > 4500
                              ? themeMode === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                              : themeMode === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                        }`}>
                          {formData.description.length}/5000
                        </div>
                      </div>

                      {descriptionError && (
                        <div className="p-2 rounded-lg" style={{
                          backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.red100,
                          border: `1px solid ${themeMode === 'dark' ? colors.red : colors.red}`
                        }}>
                          <p className="text-xs flex items-center gap-1" style={{ color: themeMode === 'dark' ? colors.red : colors.red }}>
                            <AlertCircle className="w-3 h-3" />
                            {descriptionError}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Array Fields */}
                  {(['requirements', 'responsibilities', 'benefits', 'skills'] as const).map((field) => (
                    <div key={field}>
                      <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <div className="space-y-1">
                        {formData[field].map((item, index) => (
                          <div key={index} className="flex gap-1">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => handleArrayChange(field, index, e.target.value)}
                              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                              style={{
                                border: `1px solid ${theme.border.primary}`,
                                color: theme.text.primary,
                                backgroundColor: theme.bg.primary
                              }}
                              placeholder={`Add ${field.slice(0, -1)}...`}
                            />
                            {formData[field].length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayItem(field, index)}
                                className="px-2 sm:px-4 py-2 sm:py-3 rounded-lg text-xs font-medium transition-colors"
                                style={{
                                  backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.red100,
                                  color: themeMode === 'dark' ? colors.red : colors.red
                                }}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addArrayItem(field)}
                          className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.purple100,
                            color: themeMode === 'dark' ? colors.purple : colors.purple
                          }}
                        >
                          + Add {field.slice(0, -1)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Demographic Requirements */}
              <div
                className="rounded-xl p-4 sm:p-6"
                style={{
                  backgroundColor: theme.bg.secondary,
                  border: `1px solid ${theme.border.primary}`
                }}
              >
                <h3 className={`text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center`} style={{ color: theme.text.primary }}>
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: theme.text.primary }} />
                  Demographic Requirements
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
                  <div>
                    <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                      Gender
                    </label>
                    <select
                      value={formData.demographicRequirements?.sex || 'any'}
                      onChange={(e) => handleDemographicChange('sex', e.target.value)}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                      style={{
                        border: `1px solid ${theme.border.primary}`,
                        color: theme.text.primary,
                        backgroundColor: theme.bg.primary
                      }}
                    >
                      <option value="any">Any</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                      Min Age
                    </label>
                    <input
                      type="number"
                      value={formData.demographicRequirements?.age?.min || ''}
                      onChange={(e) => handleDemographicChange('age', { min: e.target.value ? Number(e.target.value) : undefined })}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                      style={{
                        border: `1px solid ${errors.age ? (themeMode === 'dark' ? colors.red : colors.red) : theme.border.primary}`,
                        color: theme.text.primary,
                        backgroundColor: theme.bg.primary
                      }}
                      placeholder="18"
                      min="18"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                      Max Age
                    </label>
                    <input
                      type="number"
                      value={formData.demographicRequirements?.age?.max || ''}
                      onChange={(e) => handleDemographicChange('age', { max: e.target.value ? Number(e.target.value) : undefined })}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                      style={{
                        border: `1px solid ${errors.age ? (themeMode === 'dark' ? colors.red : colors.red) : theme.border.primary}`,
                        color: theme.text.primary,
                        backgroundColor: theme.bg.primary
                      }}
                      placeholder="65"
                      min="18"
                      max="100"
                    />
                  </div>
                </div>
                {errors.age && (
                  <p className="mt-1 text-xs" style={{ color: themeMode === 'dark' ? colors.red : colors.red }}>
                    {errors.age}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Organization & Compensation - MOBILE OPTIMIZED */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              {/* Opportunity Details */}
              <div
                className="rounded-xl p-4 sm:p-6"
                style={{
                  backgroundColor: theme.bg.secondary,
                  border: `1px solid ${theme.border.primary}`
                }}
              >
                <h3 className={`text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center`} style={{ color: theme.text.primary }}>
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: theme.text.primary }} />
                  Opportunity Details
                </h3>

                <div className="space-y-4 sm:space-y-6">
                  {/* Application Control */}
                  {renderApplicationControl()}

                  {/* Duration Fields */}
                  {renderDurationFields()}

                  {/* Volunteer Fields */}
                  {renderVolunteerFields()}

                  {/* Compensation Information */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <DollarSignIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: currentOpportunityConfig.color }} />
                      <h4 className={`font-semibold text-sm sm:text-base`} style={{ color: theme.text.primary }}>
                        {currentOpportunityConfig.value === 'volunteer' ? 'Support' : 'Compensation'}
                      </h4>
                    </div>

                    {/* Salary Mode Selector */}
                    {renderSalaryModeSelector()}

                    {/* Salary Range Fields */}
                    {renderSalaryRangeFields()}
                  </div>

                  {/* Experience & Education */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                    <div>
                      <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                        Experience Level *
                      </label>
                      <select
                        name="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                        style={{
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary,
                          backgroundColor: theme.bg.primary
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
                      <label className={`block text-xs sm:text-sm font-medium mb-1 flex items-center`} style={{ color: theme.text.secondary }}>
                        <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" style={{ color: theme.text.secondary }} />
                        Education
                      </label>
                      <select
                        name="educationLevel"
                        value={formData.educationLevel}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                        style={{
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary,
                          backgroundColor: theme.bg.primary
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
                </div>
              </div>

              {/* Organization Context & Application Process */}
              <div
                className="rounded-xl p-4 sm:p-6"
                style={{
                  backgroundColor: theme.bg.secondary,
                  border: `1px solid ${theme.border.primary}`
                }}
              >
                <h3 className={`text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center`} style={{ color: theme.text.primary }}>
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: theme.text.primary }} />
                  Context & Process
                </h3>

                <div className="space-y-4 sm:space-y-6">
                  {/* Organization Context Fields */}
                  {renderOrganizationContextFields()}

                  {/* Application Process Fields */}
                  {renderApplicationProcessFields()}

                  {/* Additional Settings */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: currentOpportunityConfig.color }} />
                      <h4 className={`font-semibold text-sm sm:text-base`} style={{ color: theme.text.primary }}>Additional Settings</h4>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                      {/* Application Deadline */}
                      <div>
                        <label className={`block text-xs sm:text-sm font-medium mb-1 flex items-center`} style={{ color: theme.text.secondary }}>
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" style={{ color: theme.text.secondary }} />
                          Deadline *
                        </label>
                        <input
                          type="date"
                          name="applicationDeadline"
                          value={formData.applicationDeadline}
                          onChange={handleInputChange}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                          style={{
                            border: `1px solid ${errors.applicationDeadline ? (themeMode === 'dark' ? colors.red : colors.red) : theme.border.primary}`,
                            color: theme.text.primary,
                            backgroundColor: theme.bg.primary,
                            colorScheme: themeMode === 'dark' ? 'dark' : 'light'
                          }}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        {errors.applicationDeadline && (
                          <p className="mt-1 text-xs" style={{ color: themeMode === 'dark' ? colors.red : colors.red }}>
                            {errors.applicationDeadline}
                          </p>
                        )}
                      </div>

                      {/* Tags */}
                      <div>
                        <label className={`block text-xs sm:text-sm font-medium mb-1`} style={{ color: theme.text.secondary }}>
                          Tags
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                            className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1`}
                            style={{
                              border: `1px solid ${theme.border.primary}`,
                              color: theme.text.primary,
                              backgroundColor: theme.bg.primary
                            }}
                            placeholder="Add tags..."
                          />
                          <button
                            type="button"
                            onClick={handleTagAdd}
                            className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                            style={{
                              backgroundColor: themeMode === 'dark' ? colors.purple : colors.purple,
                              color: colors.white
                            }}
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                              style={{
                                backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.purple100,
                                color: themeMode === 'dark' ? colors.purple : colors.purple
                              }}
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleTagRemove(tag)}
                                className="ml-1 hover:opacity-70"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Special Options */}
                      <div className="lg:col-span-2 space-y-2 sm:space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="featured"
                            checked={formData.featured}
                            onChange={handleInputChange}
                            className="h-3 w-3 sm:h-4 sm:w-4 rounded"
                            style={{
                              accentColor: currentOpportunityConfig.color,
                              borderColor: theme.border.primary
                            }}
                          />
                          <span className={`ml-1 sm:ml-2 text-xs sm:text-sm flex items-center gap-1`} style={{ color: theme.text.secondary }}>
                            <Star className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: theme.text.secondary }} />
                            Featured
                          </span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="urgent"
                            checked={formData.urgent}
                            onChange={handleInputChange}
                            className="h-3 w-3 sm:h-4 sm:w-4 rounded"
                            style={{
                              accentColor: currentOpportunityConfig.color,
                              borderColor: theme.border.primary
                            }}
                          />
                          <span className={`ml-1 sm:ml-2 text-xs sm:text-sm flex items-center gap-1`} style={{ color: theme.text.secondary }}>
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: theme.text.secondary }} />
                            Urgent
                          </span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="premium"
                            checked={formData.premium}
                            onChange={handleInputChange}
                            className="h-3 w-3 sm:h-4 sm:w-4 rounded"
                            style={{
                              accentColor: currentOpportunityConfig.color,
                              borderColor: theme.border.primary
                            }}
                          />
                          <span className={`ml-1 sm:ml-2 text-xs sm:text-sm flex items-center gap-1`} style={{ color: theme.text.secondary }}>
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: theme.text.secondary }} />
                            Premium
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit - MOBILE OPTIMIZED */}
          {currentStep === 4 && (
            <div
              className="rounded-xl p-4 sm:p-6"
              style={{
                backgroundColor: theme.bg.secondary,
                border: `1px solid ${theme.border.primary}`
              }}
            >
              <h3 className={`text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center`} style={{ color: theme.text.primary }}>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: theme.text.primary }} />
                Review & Submit
              </h3>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className={`text-sm sm:text-base font-semibold mb-3 sm:mb-4`} style={{ color: theme.text.primary }}>
                      Details
                    </h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className={`text-xs font-medium`} style={{ color: theme.text.muted }}>Title</dt>
                        <dd className={`text-sm`} style={{ color: theme.text.primary }}>{formData.title}</dd>
                      </div>
                      <div>
                        <dt className={`text-xs font-medium`} style={{ color: theme.text.muted }}>Type</dt>
                        <dd className={`text-sm`} style={{ color: theme.text.primary }}>
                          {currentOpportunityConfig.label}
                        </dd>
                      </div>
                      <div>
                        <dt className={`text-xs font-medium`} style={{ color: theme.text.muted }}>Candidates</dt>
                        <dd className={`text-sm`} style={{ color: theme.text.primary }}>{formData.candidatesNeeded}</dd>
                      </div>
                      <div>
                        <dt className={`text-xs font-medium`} style={{ color: theme.text.muted }}>Applications</dt>
                        <dd className={`text-sm`} style={{ color: formData.isApplyEnabled ? colors.emerald : theme.text.muted }}>
                          {formData.isApplyEnabled ? 'Open' : 'Closed'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className={`text-sm sm:text-base font-semibold mb-3 sm:mb-4`} style={{ color: theme.text.primary }}>
                      Location & Compensation
                    </h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className={`text-xs font-medium`} style={{ color: theme.text.muted }}>Location</dt>
                        <dd className={`text-sm`} style={{ color: theme.text.primary }}>
                          {formData.location.city || 'TBD'}
                        </dd>
                      </div>
                      <div>
                        <dt className={`text-xs font-medium`} style={{ color: theme.text.muted }}>Compensation</dt>
                        <dd className={`text-sm`} style={{ color: theme.text.primary }}>
                          {formatSalaryDisplay()}
                        </dd>
                      </div>
                      <div>
                        <dt className={`text-xs font-medium`} style={{ color: theme.text.muted }}>Deadline</dt>
                        <dd className={`text-sm`} style={{ color: theme.text.primary }}>
                          {new Date(formData.applicationDeadline).toLocaleDateString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div>
                  <h4 className={`text-sm sm:text-base font-semibold mb-2 sm:mb-3`} style={{ color: theme.text.primary }}>
                    Description Preview
                  </h4>
                  <div
                    className="p-3 rounded-lg border max-h-32 overflow-y-auto"
                    style={{
                      backgroundColor: theme.bg.primary,
                      borderColor: theme.border.primary
                    }}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-wrap" style={{ color: theme.text.secondary }}>
                      {formData.description.substring(0, 200)}
                      {formData.description.length > 200 ? '...' : ''}
                    </p>
                  </div>
                </div>

                {!organizationVerified && (
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.amber100,
                      border: `1px solid ${themeMode === 'dark' ? colors.amber : colors.amber600}`,
                      color: themeMode === 'dark' ? colors.amber : colors.amber600
                    }}
                  >
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 mr-2" />
                      <span className="text-xs">Not verified - requires admin approval</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons - MOBILE OPTIMIZED */}
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

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-1.5"
                  style={{
                    backgroundColor: themeMode === 'dark' ? colors.purple : colors.purple,
                    color: colors.white
                  }}
                >
                  {currentStep === 3 ? 'Review' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, JobStatus.DRAFT)}
                    disabled={loading}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
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
                        Draft
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    onClick={(e) => handleSubmit(e, JobStatus.ACTIVE)}
                    disabled={loading}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{
                      backgroundColor: themeMode === 'dark' ? colors.emerald : colors.emerald600,
                      color: colors.white
                    }}
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" themeMode={themeMode} />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Publish
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

export default OrganizationJobForm;