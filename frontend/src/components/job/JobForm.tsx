/* eslint-disable @typescript-eslint/no-explicit-any */
// components/JobForm.tsx
import React, { useState, useEffect } from 'react';
import { Job, EthiopianLocation, JobSalary, jobService } from '@/services/jobService';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  BookOpen,
  Globe,
  Calendar,
  CheckCircle,
  X,
  Save,
  Send,
  Eye,
  EyeOff,
  AlertCircle,
  Languages,
  Car,
  FileCheck,
  Tag,
  Star,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Use the Job interface from jobService instead of redefining
type JobFormData = Omit<Job, '_id' | 'company' | 'createdBy' | 'applicationCount' | 'viewCount' | 'saveCount' | 'createdAt' | 'updatedAt' | 'isActive' | 'applications' | 'views'> & {
  salary?: JobSalary;
  applicationDeadline: string; // Make it required in the form
  shortDescription: string; // Make it required in the form
  status: 'draft' | 'active' | 'paused' | 'closed' | 'archived'; // Make it required with proper type
};

interface JobFormProps {
  initialData?: Job;
  onSubmit: (data: Partial<Job>) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
  companyVerified?: boolean;
  mode?: 'create' | 'edit';
}

const JobForm: React.FC<JobFormProps> = ({ 
  initialData, 
  onSubmit, 
  loading = false, 
  onCancel,
  companyVerified = false,
  mode = 'create'
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
    educationLevel: 'bachelors',
    status: 'draft',
    applicationDeadline: '',
    remote: 'on-site',
    workArrangement: 'office',
    ethiopianRequirements: {
      workPermitRequired: false,
      knowledgeOfLocalLanguages: [],
      drivingLicense: false,
      governmentClearance: false
    },
    tags: [],
    featured: false,
    urgent: false,
    premium: false
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get data from service
  const ethiopianRegions = jobService.getEthiopianRegions();
const jobCategories = jobService.getJobCategories();

  const localLanguages = ['Amharic', 'Oromo', 'Tigrigna', 'Somali', 'Sidama', 'Wolayta', 'Gurage', 'Afar', 'Other'];

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
        ethiopianRequirements: initialData.ethiopianRequirements || {
          workPermitRequired: false,
          knowledgeOfLocalLanguages: [],
          drivingLicense: false,
          governmentClearance: false
        },
        tags: initialData.tags || [],
        featured: initialData.featured || false,
        urgent: initialData.urgent || false,
        premium: initialData.premium || false
      };
      
      setFormData(transformedData);
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Job title must be at least 5 characters long';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Job description must be at least 50 characters long';
    }

    if (!formData.category) {
      newErrors.category = 'Job category is required';
    }

    if (!formData.location.region) {
      newErrors.region = 'Region is required';
    }

    if (formData.location.region !== 'international' && !formData.location.city) {
      newErrors.city = 'City is required for Ethiopian job postings';
    }

    if (formData.salary?.min && formData.salary?.max && formData.salary.min > formData.salary.max) {
      newErrors.salary = 'Minimum salary cannot be greater than maximum salary';
    }

    if (!formData.applicationDeadline) {
      newErrors.applicationDeadline = 'Application deadline is required';
    } else if (new Date(formData.applicationDeadline) <= new Date()) {
      newErrors.applicationDeadline = 'Application deadline must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleEthiopianRequirementChange = (field: keyof JobFormData['ethiopianRequirements'], value: any) => {
    setFormData(prev => ({
      ...prev,
      ethiopianRequirements: {
        ...prev.ethiopianRequirements,
        [field]: value
      }
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => {
      const currentLanguages = prev.ethiopianRequirements.knowledgeOfLocalLanguages;
      const newLanguages = currentLanguages.includes(language)
        ? currentLanguages.filter(l => l !== language)
        : [...currentLanguages, language];
      
      return {
        ...prev,
        ethiopianRequirements: {
          ...prev.ethiopianRequirements,
          knowledgeOfLocalLanguages: newLanguages
        }
      };
    });
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

  // Prepare data for submission
  const submitData: Partial<Job> = {
    ...formData,
    status: status || formData.status, // Use provided status or current form status
    requirements: formData.requirements.filter(req => req.trim() !== ''),
    responsibilities: formData.responsibilities.filter(resp => resp.trim() !== ''),
    benefits: formData.benefits.filter(benefit => benefit.trim() !== ''),
    skills: formData.skills.filter(skill => skill.trim() !== ''),
    salary: formData.salary?.min || formData.salary?.max ? formData.salary : undefined,
    // Fix the date conversion with proper null check
    applicationDeadline: formData.applicationDeadline ? new Date(formData.applicationDeadline).toISOString() : undefined,
    // Ensure shortDescription is included
    shortDescription: formData.shortDescription || '',
    // Ensure educationLevel is properly passed
    educationLevel: formData.educationLevel,
    // Ensure subCategory is properly passed
    subCategory: formData.subCategory
  };
  
  try {
    await onSubmit(submitData);
  } catch (error) {
    console.error('Error submitting job:', error);
    // Error handling is done in the parent component via the service
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

  // Preview data for summary
  const previewData = {
    ...formData,
    salary: formData.salary?.isPublic ? formData.salary : undefined
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {mode === 'edit' ? 'Edit Job Posting' : 'Create New Job'}
            </h2>
            <p className="text-gray-600">
              {mode === 'edit' 
                ? 'Update your job posting details below.' 
                : 'Fill in the details to create a new job posting and reach qualified candidates.'
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
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

        {!companyVerified && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">
                Your company profile is not verified. This job will require admin approval before being published.
              </span>
            </div>
          </div>
        )}
      </div>

      {showPreview ? (
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Job Preview</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{previewData.title}</h4>
              <p className="text-gray-600">{previewData.shortDescription}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {jobService.getJobTypeLabel(previewData.type)}
              </span>
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
              <p className="text-gray-700 whitespace-pre-wrap">{previewData.description}</p>
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
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g. Senior Frontend Developer, Marketing Manager..."
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

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
                    placeholder="Brief summary of the job (appears in search results)..."
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {formData.shortDescription.length}/200 characters
                  </div>
                </div>

                {/* Job Type and Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type *
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

                {/* Job Category */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Job Category *
  </label>
  <select
    name="category"
    value={formData.category}
    onChange={handleInputChange}
    required
    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors.category ? 'border-red-300' : 'border-gray-300'
    }`}
  >
    <option value="">Select a category</option>
    {jobService.getJobCategories().map(category => (
      <option key={category.value} value={category.value}>
        {category.label}
      </option>
    ))}
  </select>
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
                    Education Level
                  </label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="high-school">High School</option>
                    <option value="diploma">Diploma</option>
                    <option value="bachelors">Bachelor`s Degree</option>
                    <option value="masters">Master`s Degree</option>
                    <option value="phd">PhD</option>
                    <option value="none-required">Not Required</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location & Salary */}
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

              {/* Salary Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                  Salary Information
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
                        <span className="ml-2 text-sm text-gray-700">Show salary in job posting</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.salary?.isNegotiable || false}
                          onChange={(e) => handleSalaryChange('isNegotiable', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Salary is negotiable</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Salary
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
                      Maximum Salary
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
                  Job Description & Requirements
                </h3>
                
                <div className="space-y-6">
                  {/* Job Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Describe the job responsibilities, company culture, and what makes this opportunity special..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
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

              {/* Ethiopian Specific Requirements */}
              {!isInternational && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-blue-600" />
                    Ethiopian Specific Requirements
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Languages className="w-4 h-4 inline mr-1" />
                        Knowledge of Local Languages
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {localLanguages.map(language => (
                          <button
                            key={language}
                            type="button"
                            onClick={() => handleLanguageToggle(language)}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              formData.ethiopianRequirements.knowledgeOfLocalLanguages.includes(language)
                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {language}
                            {formData.ethiopianRequirements.knowledgeOfLocalLanguages.includes(language) && (
                              <CheckCircle className="w-4 h-4 ml-1 inline" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.ethiopianRequirements.workPermitRequired}
                          onChange={(e) => handleEthiopianRequirementChange('workPermitRequired', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Work Permit Required</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.ethiopianRequirements.drivingLicense}
                          onChange={(e) => handleEthiopianRequirementChange('drivingLicense', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                          <Car className="w-4 h-4" />
                          Driving License Required
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.ethiopianRequirements.governmentClearance}
                          onChange={(e) => handleEthiopianRequirementChange('governmentClearance', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                          <FileCheck className="w-4 h-4" />
                          Government Clearance Required
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

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
                        Feature this job (increases visibility)
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
                        <Star className="w-4 h-4" />
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
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h4>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Job Title</dt>
                        <dd className="text-sm text-gray-900">{formData.title}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Job Type</dt>
                        <dd className="text-sm text-gray-900">{jobService.getJobTypeLabel(formData.type)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Category</dt>
                        <dd className="text-sm text-gray-900">{formData.category}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Experience Level</dt>
                        <dd className="text-sm text-gray-900">{jobService.getExperienceLabel(formData.experienceLevel)}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Location & Salary</h4>
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
                        <dt className="text-sm font-medium text-gray-500">Salary</dt>
                        <dd className="text-sm text-gray-900">
                          {formData.salary?.isPublic ? jobService.formatSalary(formData.salary) : 'Not specified'}
                        </dd>
                      </div>
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
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Job Description Preview</h4>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap line-clamp-4">
                      {formData.description}
                    </p>
                  </div>
                </div>

                {!companyVerified && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-yellow-800 text-sm">
                        Your company profile is not verified. This job will require admin approval before being published.
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
                    {loading ? 'Publishing...' : 'Publish Job'}
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