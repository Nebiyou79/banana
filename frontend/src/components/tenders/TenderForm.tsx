/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { CreateTenderData, UpdateTenderData, Tender } from '@/services/tenderService';
import { colorClasses } from '@/utils/color';

interface TenderFormProps {
  tender?: Tender;
  onSubmit: (data: CreateTenderData | UpdateTenderData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  tenderType?: 'company' | 'organization';
}

// Comprehensive categories based on 2merkato.com
const categories = [
  // Construction & Engineering
  { value: 'construction', label: 'Construction' },
  { value: 'civil_engineering', label: 'Civil Engineering' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'electrical_works', label: 'Electrical Works' },
  { value: 'mechanical_works', label: 'Mechanical Works' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'road_construction', label: 'Road Construction' },
  { value: 'building_construction', label: 'Building Construction' },
  { value: 'renovation', label: 'Renovation' },
  
  // IT & Technology
  { value: 'software_development', label: 'Software Development' },
  { value: 'web_development', label: 'Web Development' },
  { value: 'mobile_development', label: 'Mobile Development' },
  { value: 'it_consulting', label: 'IT Consulting' },
  { value: 'network_security', label: 'Network & Security' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'ai_ml', label: 'AI & Machine Learning' },
  { value: 'cloud_computing', label: 'Cloud Computing' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  
  // Goods & Supplies
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'medical_supplies', label: 'Medical Supplies' },
  { value: 'educational_materials', label: 'Educational Materials' },
  { value: 'agricultural_supplies', label: 'Agricultural Supplies' },
  { value: 'construction_materials', label: 'Construction Materials' },
  { value: 'electrical_equipment', label: 'Electrical Equipment' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'vehicles', label: 'Vehicles' },
  
  // Services
  { value: 'consulting', label: 'Consulting' },
  { value: 'cleaning_services', label: 'Cleaning Services' },
  { value: 'security_services', label: 'Security Services' },
  { value: 'transport_services', label: 'Transport Services' },
  { value: 'catering_services', label: 'Catering Services' },
  { value: 'maintenance_services', label: 'Maintenance Services' },
  { value: 'training_services', label: 'Training Services' },
  { value: 'marketing_services', label: 'Marketing Services' },
  
  // Other Categories
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'mining', label: 'Mining' },
  { value: 'telecommunications', label: 'Telecommunications' },
  { value: 'energy', label: 'Energy' },
  { value: 'water_sanitation', label: 'Water & Sanitation' },
  { value: 'environmental_services', label: 'Environmental Services' },
  { value: 'research_development', label: 'Research & Development' },
  { value: 'other', label: 'Other' }
];

const experienceLevels = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' }
];

const locations = [
  { value: 'anywhere', label: 'Anywhere (Remote)' },
  { value: 'specific_country', label: 'Specific Country' },
  { value: 'specific_city', label: 'Specific City' }
];

// Ethiopian Cities
const ethiopianCities = [
  'Addis Ababa', 'Adama (Nazret)', 'Gondar', 'Mekele', 'Hawassa', 'Bahir Dar',
  'Dire Dawa', 'Jimma', 'Dessie', 'Jijiga', 'Shashamane', 'Bishoftu (Debre Zeit)',
  'Arba Minch', 'Hosaena', 'Harar', 'Dila', 'Nekemte', 'Debre Birhan',
  'Asella', 'Adigrat', 'Woldia', 'Debre Markos', 'Assosa', 'Gambela',
  'Semera', 'Mizan Aman', 'Sodo', 'Ambo', 'Bale Robe', 'Yirgalem'
];

const languages = [
  'English', 'Amharic', 'Afan Oromo', 'Tigrinya', 'Somali', 'Sidama',
  'Wolaytta', 'Gurage', 'Afar', 'Hadiyya'
];

const proficiencies = [
  'basic', 'conversational', 'fluent', 'native'
];

const TenderForm: React.FC<TenderFormProps> = ({ 
  tender, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode = 'create',
  tenderType = 'company'
}) => {
  const [formData, setFormData] = useState<CreateTenderData>({
    title: '',
    description: '',
    category: 'software_development',
    skillsRequired: [],
    budget: {
      min: 0,
      max: 0,
      currency: 'ETB',
      isNegotiable: false
    },
    deadline: '',
    duration: 30,
    visibility: 'public',
    invitedFreelancers: [],
    requirements: {
      experienceLevel: 'intermediate',
      location: 'anywhere',
      languageRequirements: []
    },
    status: 'draft',
    tenderType: tenderType
  });

  const [skillInput, setSkillInput] = useState('');
  const [languageRequirement, setLanguageRequirement] = useState({
    language: '',
    proficiency: 'conversational'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('basic');
  const [selectedStatus, setSelectedStatus] = useState<'draft' | 'published'>('draft');
  const [showBudget, setShowBudget] = useState(false);
  const [customDuration, setCustomDuration] = useState(false);

  useEffect(() => {
    if (tender) {
      const deadlineDate = new Date(tender.deadline);
      const formattedDeadline = deadlineDate.toISOString().slice(0, 16);
      
      setFormData({
        title: tender.title || '',
        description: tender.description || '',
        category: tender.category || 'software_development',
        skillsRequired: tender.skillsRequired || [],
        budget: tender.budget || { min: 0, max: 0, currency: 'ETB', isNegotiable: false },
        deadline: formattedDeadline,
        duration: tender.duration || 30,
        visibility: tender.visibility || 'public',
        invitedFreelancers: tender.invitedFreelancers || [],
        requirements: {
          experienceLevel: tender.requirements?.experienceLevel || 'intermediate',
          location: tender.requirements?.location || 'anywhere',
          specificLocation: tender.requirements?.specificLocation || '',
          languageRequirements: tender.requirements?.languageRequirements || []
        },
        status: (tender.status as 'draft' | 'published') || 'draft',
        tenderType: tender.tenderType || tenderType
      });
      setSelectedStatus((tender.status as 'draft' | 'published') || 'draft');
      setShowBudget(!!tender.budget && (tender.budget.min > 0 || tender.budget.max > 0));
      setCustomDuration(!!tender.duration && tender.duration !== 30);
    } else {
      // Set tender type for new tenders
      setFormData(prev => ({
        ...prev,
        tenderType: tenderType
      }));
    }
  }, [tender, tenderType]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters long';
    } else if (formData.description.length > 10000) {
      newErrors.description = 'Description must be less than 10000 characters';
    }

    // Budget validation (only if shown)
    if (showBudget) {
      if (formData.budget.min < 0) {
        newErrors.minBudget = 'Minimum budget cannot be negative';
      } else if (formData.budget.min > formData.budget.max) {
        newErrors.budget = 'Minimum budget cannot be greater than maximum budget';
      }

      if (formData.budget.max < 0) {
        newErrors.maxBudget = 'Maximum budget cannot be negative';
      }
    }

    // Deadline validation
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate <= now) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    // Duration validation (only if custom duration is enabled)
    if (customDuration) {
      if (formData.duration <= 0) {
        newErrors.duration = 'Duration must be greater than 0 days';
      } else if (formData.duration > 365) {
        newErrors.duration = 'Duration cannot exceed 365 days';
      }
    }

    // Skills validation
    if (formData.skillsRequired.length === 0) {
      newErrors.skills = 'At least one skill is required';
    } else if (formData.skillsRequired.length > 10) {
      newErrors.skills = 'Maximum 10 skills allowed';
    }

    // Location validation
    const requirements = getRequirements();
    if (requirements.location !== 'anywhere' && !requirements.specificLocation?.trim()) {
      newErrors.specificLocation = 'Specific location is required when not "Anywhere"';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with status:', selectedStatus);
    
    if (activeSection !== 'settings') {
      return;
    }
    
    // Prepare the data for submission - create a new object without using delete
    const submitData: CreateTenderData | UpdateTenderData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      skillsRequired: formData.skillsRequired.filter(skill => skill.trim() !== ''),
      deadline: formData.deadline,
      visibility: formData.visibility,
      invitedFreelancers: formData.invitedFreelancers,
      requirements: {
        ...formData.requirements,
        specificLocation: getRequirements().location === 'anywhere' 
          ? undefined 
          : getRequirements().specificLocation
      },
      status: selectedStatus,
      tenderType: formData.tenderType
    };

    // Conditionally add budget if shown
    if (showBudget) {
      submitData.budget = {
        min: Number(formData.budget.min) || 0,
        max: Number(formData.budget.max) || 0,
        currency: formData.budget.currency || 'ETB',
        isNegotiable: formData.budget.isNegotiable || false
      };
    }

    // Conditionally add duration if custom duration is enabled
    if (customDuration) {
      submitData.duration = Number(formData.duration) || 30;
    }
    
    console.log('Submitting data:', submitData);
    
    if (validateForm()) {
      console.log('Validation passed, calling onSubmit');
      onSubmit(submitData);
    } else {
      console.log('Validation failed', errors);
    }
  };

  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
    }
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !formData.skillsRequired.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, skill]
      }));
      setSkillInput('');
      if (errors.skills) {
        setErrors(prev => ({ ...prev, skills: '' }));
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter(skill => skill !== skillToRemove)
    }));
  };

  const addLanguageRequirement = () => {
    if (languageRequirement.language && languageRequirement.proficiency) {
      setFormData(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements!,
          languageRequirements: [
            ...(prev.requirements?.languageRequirements || []),
            languageRequirement
          ]
        }
      }));
      setLanguageRequirement({ language: '', proficiency: 'conversational' });
    }
  };

  const removeLanguageRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements!,
        languageRequirements: (prev.requirements?.languageRequirements || []).filter((_, i) => i !== index)
      }
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBudgetChange = (field: 'min' | 'max' | 'currency' | 'isNegotiable', value: any) => {
    setFormData(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [field]: field === 'min' || field === 'max' ? Number(value) : 
                 field === 'isNegotiable' ? Boolean(value) : value
      }
    }));
    if (errors.minBudget || errors.maxBudget || errors.budget) {
      setErrors(prev => ({ ...prev, minBudget: '', maxBudget: '', budget: '' }));
    }
  };

  const handleRequirementsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements!,
        [field]: value
      }
    }));
    if (field === 'location' && errors.specificLocation) {
      setErrors(prev => ({ ...prev, specificLocation: '' }));
    }
  };

  const handleStatusChange = (status: 'draft' | 'published') => {
    setSelectedStatus(status);
  };

  const getRequirements = () => {
    return formData.requirements || {
      experienceLevel: 'intermediate',
      location: 'anywhere',
      languageRequirements: []
    };
  };

  const getLanguageRequirements = () => {
    return getRequirements().languageRequirements || [];
  };

  const getFormTitle = () => {
    const typeLabel = tenderType === 'organization' ? 'Organization' : 'Company';
    if (mode === 'edit') {
      return `Edit ${typeLabel} Tender`;
    }
    return `Create New ${typeLabel} Tender`;
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: '📝' },
    { id: 'skills', label: 'Skills & Requirements', icon: '🔧' },
    { id: 'budget', label: 'Budget & Timeline', icon: '💰' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const requirements = getRequirements();
  const languageRequirements = getLanguageRequirements();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === section.id
                  ? `${colorClasses.bg.goldenMustard} ${colorClasses.text.darkNavy}`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tender Type Badge */}
      <div className="mb-6 flex justify-center">
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
          tenderType === 'organization' 
            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {tenderType === 'organization' ? 'Organization Tender' : 'Company Tender'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        {activeSection === 'basic' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., E-commerce Website Development with React and Node.js"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                <p className="mt-1 text-sm text-gray-500">
                  Be specific about what you need. Good titles get more quality proposals.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe your project in detail. Include goals, specific requirements, deliverables, and any other relevant information..."
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                <p className="mt-1 text-sm text-gray-500">
                  Detailed descriptions help freelancers understand your needs better. {formData.description.length}/20 characters minimum.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Visibility *
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => handleInputChange('visibility', e.target.value as 'public' | 'invite_only')}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard"
                  >
                    <option value="public">Public - Anyone can apply</option>
                    <option value="invite_only">Invite Only - Only invited freelancers can apply</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skills & Requirements */}
        {activeSection === 'skills' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Skills & Requirements</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skills *
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`flex-1 px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard ${
                      errors.skills ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter a skill (e.g., React, Python, UI/UX Design)"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className={`px-6 py-3 ${colorClasses.bg.darkNavy} text-white rounded-lg hover:bg-gray-800 transition-colors font-medium`}
                  >
                    Add
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.skillsRequired.map((skill, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${colorClasses.bg.goldenMustard} ${colorClasses.text.darkNavy}`}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-gray-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {errors.skills && <p className="mt-1 text-sm text-red-600">{errors.skills}</p>}
                <p className="mt-2 text-sm text-gray-500">
                  Add relevant skills to help the right freelancers find your project. Maximum 10 skills.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={requirements.experienceLevel}
                    onChange={(e) => handleRequirementsChange('experienceLevel', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard"
                  >
                    {experienceLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Preference
                  </label>
                  <select
                    value={requirements.location}
                    onChange={(e) => handleRequirementsChange('location', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard"
                  >
                    {locations.map(location => (
                      <option key={location.value} value={location.value}>
                        {location.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {requirements.location !== 'anywhere' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Location *
                  </label>
                  {requirements.location === 'specific_city' ? (
                    <select
                      value={requirements.specificLocation || ''}
                      onChange={(e) => handleRequirementsChange('specificLocation', e.target.value)}
                      className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard ${
                        errors.specificLocation ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Ethiopian City</option>
                      {ethiopianCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={requirements.specificLocation || ''}
                      onChange={(e) => handleRequirementsChange('specificLocation', e.target.value)}
                      className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard ${
                        errors.specificLocation ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter country name..."
                    />
                  )}
                  {errors.specificLocation && <p className="mt-1 text-sm text-red-600">{errors.specificLocation}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language Requirements
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <select
                    value={languageRequirement.language}
                    onChange={(e) => setLanguageRequirement(prev => ({ ...prev, language: e.target.value }))}
                    className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard"
                  >
                    <option value="">Select Language</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  
                  <select
                    value={languageRequirement.proficiency}
                    onChange={(e) => setLanguageRequirement(prev => ({ ...prev, proficiency: e.target.value }))}
                    className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard"
                  >
                    {proficiencies.map(prof => (
                      <option key={prof} value={prof}>
                        {prof.charAt(0).toUpperCase() + prof.slice(1)}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    type="button"
                    onClick={addLanguageRequirement}
                    className={`px-4 py-3 ${colorClasses.bg.darkNavy} text-white rounded-lg hover:bg-gray-800 transition-colors font-medium`}
                  >
                    Add Language
                  </button>
                </div>
                
                {languageRequirements.length > 0 && (
                  <div className="space-y-2">
                    {languageRequirements.map((req, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{req.language}</span>
                        <span className="text-sm text-gray-600 capitalize">{req.proficiency}</span>
                        <button
                          type="button"
                          onClick={() => removeLanguageRequirement(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Budget & Timeline */}
        {activeSection === 'budget' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Budget & Timeline</h3>
            
            <div className="space-y-6">
              {/* Budget Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Budget Range (Optional)</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showBudget"
                      checked={showBudget}
                      onChange={(e) => setShowBudget(e.target.checked)}
                      className="rounded border-gray-300 text-goldenMustard focus:ring-goldenMustard"
                    />
                    <label htmlFor="showBudget" className="text-sm text-gray-700">
                      Add budget information
                    </label>
                  </div>
                </div>

                {showBudget && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Budget
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.budget.min || ''}
                        onChange={(e) => handleBudgetChange('min', e.target.value)}
                        className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard ${
                          errors.minBudget ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="1000"
                      />
                      {errors.minBudget && <p className="mt-1 text-sm text-red-600">{errors.minBudget}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Budget
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.budget.max || ''}
                        onChange={(e) => handleBudgetChange('max', e.target.value)}
                        className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard ${
                          errors.maxBudget ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="5000"
                      />
                      {errors.maxBudget && <p className="mt-1 text-sm text-red-600">{errors.maxBudget}</p>}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency
                        </label>
                        <select
                          value={formData.budget.currency}
                          onChange={(e) => handleBudgetChange('currency', e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard"
                        >
                          <option value="ETB">ETB (Birr)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isNegotiable"
                          checked={formData.budget.isNegotiable}
                          onChange={(e) => handleBudgetChange('isNegotiable', e.target.checked)}
                          className="rounded border-gray-300 text-goldenMustard focus:ring-goldenMustard"
                        />
                        <label htmlFor="isNegotiable" className="text-sm text-gray-700">
                          Budget is negotiable
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
              </div>

              {/* Timeline Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposal Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard ${
                      errors.deadline ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
                  <p className="mt-1 text-sm text-gray-500">
                    Freelancers can submit proposals until this date.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Project Duration (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="customDuration"
                        checked={customDuration}
                        onChange={(e) => setCustomDuration(e.target.checked)}
                        className="rounded border-gray-300 text-goldenMustard focus:ring-goldenMustard"
                      />
                      <label htmlFor="customDuration" className="text-sm text-gray-700">
                        Custom duration
                      </label>
                    </div>
                  </div>
                  
                  {customDuration ? (
                    <>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        step="1"
                        value={formData.duration || ''}
                        onChange={(e) => handleInputChange('duration', Number(e.target.value))}
                        className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-goldenMustard ${
                          errors.duration ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="30"
                      />
                      {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 py-3">
                      Default duration of 30 days will be used
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Estimated time to complete the project (1-365 days).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {activeSection === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Final Settings</h3>
            
            <div className="space-y-6">
              <div className={`p-4 rounded-lg ${
                tenderType === 'organization' ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'
              }`}>
                <h4 className={`text-lg font-medium mb-2 ${
                  tenderType === 'organization' ? 'text-purple-900' : 'text-blue-900'
                }`}>
                  {getFormTitle()}
                </h4>
                <p className={tenderType === 'organization' ? 'text-purple-800' : 'text-blue-800'}>
                  {tenderType === 'organization' 
                    ? 'This tender will be published under your organization profile and visible to qualified freelancers.'
                    : 'This tender will be published under your company profile and visible to qualified freelancers.'
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Title:</span>
                      <span className="font-medium">{formData.title || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium capitalize">{formData.category.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Skills:</span>
                      <span className="font-medium">{formData.skillsRequired.length} skills</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium">
                        {showBudget ? (
                          `${formData.budget.currency} ${formData.budget.min} - ${formData.budget.max} ${formData.budget.isNegotiable ? '(Negotiable)' : ''}`
                        ) : (
                          'Not specified'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {customDuration ? `${formData.duration} days` : '30 days (Default)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tender Type:</span>
                      <span className={`font-medium ${
                        tenderType === 'organization' ? 'text-purple-600' : 'text-blue-600'
                      }`}>
                        {tenderType === 'organization' ? 'Organization' : 'Company'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Publishing Options</h4>
                  <div className="space-y-3">
                    <div 
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedStatus === 'draft' 
                          ? 'border-goldenMustard bg-yellow-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleStatusChange('draft')}
                    >
                      <input
                        type="radio"
                        id="draft"
                        name="publishOption"
                        checked={selectedStatus === 'draft'}
                        onChange={() => handleStatusChange('draft')}
                        className="text-goldenMustard focus:ring-goldenMustard"
                      />
                      <label htmlFor="draft" className="flex-1 cursor-pointer">
                        <div className="font-medium text-gray-900">Save as Draft</div>
                        <div className="text-sm text-gray-500">Save for later editing. Not visible to freelancers.</div>
                      </label>
                    </div>
                    
                    <div 
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedStatus === 'published' 
                          ? 'border-goldenMustard bg-yellow-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleStatusChange('published')}
                    >
                      <input
                        type="radio"
                        id="publish"
                        name="publishOption"
                        checked={selectedStatus === 'published'}
                        onChange={() => handleStatusChange('published')}
                        className="text-goldenMustard focus:ring-goldenMustard"
                      />
                      <label htmlFor="publish" className="flex-1 cursor-pointer">
                        <div className="font-medium text-gray-900">Publish Now</div>
                        <div className="text-sm text-gray-500">Make visible to freelancers immediately.</div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation & Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="flex gap-3">
            {sections.map((section, index) => (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  const currentIndex = sections.findIndex(s => s.id === activeSection);
                  if (index < currentIndex) {
                    setActiveSection(section.id);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                  sections.findIndex(s => s.id === activeSection) > index
                    ? 'text-goldenMustard hover:text-yellow-500'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                disabled={sections.findIndex(s => s.id === activeSection) <= index}
              >
                {section.icon}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            
            {activeSection !== 'settings' ? (
              <button
                type="button"
                onClick={handleContinue}
                className={`px-6 py-3 ${colorClasses.bg.goldenMustard} text-white rounded-lg hover:bg-yellow-500 transition-colors font-medium`}
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 ${colorClasses.bg.darkNavy} text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50`}
              >
                {isLoading 
                  ? (selectedStatus === 'published' ? 'Publishing...' : 'Saving...') 
                  : (selectedStatus === 'published' ? 'Publish Tender' : 'Save as Draft')
                }
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default TenderForm;