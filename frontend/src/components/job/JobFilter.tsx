/* eslint-disable @typescript-eslint/no-explicit-any */
// components/JobFilter/JobFilter.tsx - FIXED with all missing filters
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  JobFilters as JobFiltersType,
  jobService,
  SalaryMode,
} from '@/services/jobService';
import {
  X,
  ChevronDown,
  MapPin,
  Briefcase,
  DollarSign,
  Target,
  Users,
  GraduationCap,
  Building2,
  SlidersHorizontal,
  Check,
  Filter,
  Clock,
  Star,
  Loader2,
  EyeOff,
  Handshake,
  TrendingUp,
  Search,
  Wrench,
  UserCog,
  Award,
  Tag,
} from 'lucide-react';
import { getTheme, ThemeMode } from '@/utils/color';

interface JobFilterProps {
  onFilterChange: (filters: JobFiltersType) => void;
  initialFilters?: JobFiltersType;
  themeMode?: ThemeMode;
  totalResults?: number;
  isLoading?: boolean;
}

type FilterType =
  | 'category'
  | 'location'
  | 'jobType'
  | 'experience'
  | 'salary'
  | 'workMode'
  | 'workArrangement'    // ADDED
  | 'education'
  | 'company'
  | 'opportunityType'     // ADDED
  | 'demographicSex'      // ADDED
  | 'skills'              // ADDED
  | 'featured'            // ADDED
  | 'urgent'              // ADDED
  | 'sort';

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

const JobFilter: React.FC<JobFilterProps> = ({
  onFilterChange,
  initialFilters = {},
  themeMode = 'light',
  totalResults,
  isLoading = false
}) => {
  const theme = getTheme(themeMode);

  // ============ REF TO TRACK PREVIOUS FILTERS ============ // FIXED
  const prevFiltersRef = useRef<JobFiltersType>(initialFilters);

  // ============ CONSTANTS ============
  const categories = useMemo(() => jobService.getAllJobCategories(), []);
  const regions = useMemo(() => jobService.getEthiopianRegions(), []);
  const educationLevels = useMemo(() => jobService.getEducationLevels(), []);

  const jobTypes = useMemo(() => [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ], []);

  const workArrangements = useMemo(() => [
    { value: 'office', label: 'Office Based' },
    { value: 'field-work', label: 'Field Work' },
    { value: 'both', label: 'Both Office & Field' }
  ], []);

  const experienceLevels = useMemo(() => [
    { value: 'fresh-graduate', label: 'Fresh Graduate' },
    { value: 'entry-level', label: 'Entry Level' },
    { value: 'mid-level', label: 'Mid Level' },
    { value: 'senior-level', label: 'Senior Level' },
    { value: 'managerial', label: 'Managerial' },
    { value: 'director', label: 'Director' },
    { value: 'executive', label: 'Executive' }
  ], []);

  const workModes = useMemo(() => [
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'on-site', label: 'On-Site' }
  ], []);

  const opportunityTypes = useMemo(() => [
    { value: 'job', label: 'Job Opportunity' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'internship', label: 'Internship' },
    { value: 'fellowship', label: 'Fellowship' },
    { value: 'training', label: 'Training' },
    { value: 'grant', label: 'Grant' },
    { value: 'other', label: 'Other' }
  ], []);

  const demographicSexOptions = useMemo(() => [
    { value: 'any', label: 'Any Gender' },
    { value: 'male', label: 'Male Only' },
    { value: 'female', label: 'Female Only' }
  ], []);

  const sortOptions = useMemo(() => [
    { value: 'createdAt', label: 'Most Recent' },
    { value: 'applicationDeadline', label: 'Deadline' },
    { value: 'title', label: 'Title' },
    { value: 'salary.min', label: 'Salary (Low to High)' },
    { value: '-salary.max', label: 'Salary (High to Low)' }
  ], []);

  const salaryModes = useMemo(() => [
    { value: SalaryMode.RANGE, label: 'Salary Range', icon: <TrendingUp className="w-4 h-4" /> },
    { value: SalaryMode.HIDDEN, label: 'Salary Hidden', icon: <EyeOff className="w-4 h-4" /> },
    { value: SalaryMode.NEGOTIABLE, label: 'Negotiable', icon: <Handshake className="w-4 h-4" /> },
    { value: SalaryMode.COMPANY_SCALE, label: 'Company Scale', icon: <Building2 className="w-4 h-4" /> }
  ], []);

  const currencyOptions = useMemo(() => [
    { value: 'ETB', label: '🇪🇹 ETB' },
    { value: 'USD', label: '🇺🇸 USD' },
    { value: 'EUR', label: '🇪🇺 EUR' },
    { value: 'GBP', label: '🇬🇧 GBP' }
  ], []);

  // ============ FILTER STATE ============
  const [filters, setFilters] = useState<JobFiltersType>(() => ({
    page: 1,
    limit: 12,
    demographicSex: undefined,
    opportunityType: undefined,
    ...initialFilters,
  }));

  // Search state
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Dropdown state
  const [activeDropdown, setActiveDropdown] = useState<FilterType | null>(null);
  const dropdownRefs = useRef<Record<FilterType, HTMLDivElement | null>>({
    category: null,
    location: null,
    jobType: null,
    experience: null,
    salary: null,
    workMode: null,
    workArrangement: null,    // ADDED
    education: null,
    company: null,
    opportunityType: null,    // ADDED
    demographicSex: null,     // ADDED
    skills: null,             // ADDED
    featured: null,           // ADDED
    urgent: null,             // ADDED
    sort: null
  });

  // Dropdown search states
  const [categorySearch, setCategorySearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [companyInput, setCompanyInput] = useState(initialFilters.company || '');

  // Skills state (ADDED)
  const [skillInput, setSkillInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialFilters.skills || []);

  // Salary state
  const [minSalary, setMinSalary] = useState(initialFilters.minSalary?.toString() || '');
  const [maxSalary, setMaxSalary] = useState(initialFilters.maxSalary?.toString() || '');
  const [salaryCurrency, setSalaryCurrency] = useState<'ETB' | 'USD' | 'EUR' | 'GBP'>(initialFilters.currency || 'ETB');
  const [selectedSalaryMode, setSelectedSalaryMode] = useState<SalaryMode | undefined>(initialFilters.salaryMode);

  // Sort state
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialFilters.sortOrder || 'desc');

  // Mobile state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);

  // ============ UNIFIED FILTER NOTIFICATION ============ // FIXED
  useEffect(() => {
    // Check if filters actually changed
    if (prevFiltersRef.current !== filters) {
      prevFiltersRef.current = filters;
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  // ============ FILTER UPDATES - ONLY SETFILTERS, NO ONFILTERCHANGE ============ // FIXED

  // Handle search changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: debouncedSearch || undefined,
      page: 1
    }));
  }, [debouncedSearch]);

  // Handle salary mode change
  useEffect(() => {
    setFilters(prev => {
      const next = { ...prev, salaryMode: selectedSalaryMode, page: 1 };

      // Clear range values if not in range mode
      if (selectedSalaryMode !== SalaryMode.RANGE) {
        delete next.minSalary;
        delete next.maxSalary;
      }

      return next;
    });
  }, [selectedSalaryMode]);

  // Handle salary range changes
  useEffect(() => {
    if (selectedSalaryMode === SalaryMode.RANGE) {
      const timer = setTimeout(() => {
        setFilters(prev => ({
          ...prev,
          minSalary: minSalary ? Number(minSalary) : undefined,
          maxSalary: maxSalary ? Number(maxSalary) : undefined,
          currency: salaryCurrency,
          page: 1
        }));
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [minSalary, maxSalary, salaryCurrency, selectedSalaryMode]);

  // Handle sort changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  }, [sortBy, sortOrder]);

  // Handle skills changes (ADDED)
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      skills: selectedSkills.length > 0 ? selectedSkills : undefined,
      page: 1
    }));
  }, [selectedSkills]);

  // ============ FILTER HANDLERS ============
  const handleFilterChange = useCallback((key: keyof JobFiltersType, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value, page: 1 };

      // Clean up undefined/empty values
      Object.keys(newFilters).forEach(k => {
        const key = k as keyof JobFiltersType;
        if (newFilters[key] === undefined ||
          newFilters[key] === '' ||
          newFilters[key] === null ||
          (Array.isArray(newFilters[key]) && (newFilters[key] as any[]).length === 0)) {
          delete newFilters[key];
        }
      });

      return newFilters; // FIXED: No onFilterChange call here
    });

    // Close dropdown after selection for single-select filters
    if (key !== 'category' && key !== 'type' && key !== 'skills') {
      setActiveDropdown(null);
    }
  }, []);

  const handleArrayFilterChange = useCallback((key: keyof JobFiltersType, value: string) => {
    setFilters(prev => {
      const current = prev[key];
      let currentArray: string[] = [];

      if (Array.isArray(current)) {
        currentArray = current;
      } else if (typeof current === 'string') {
        currentArray = [current];
      }

      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];

      return {
        ...prev,
        [key]: newArray.length > 0 ? newArray : undefined,
        page: 1
      }; // FIXED: No onFilterChange call here
    });
  }, []);

  // ADDED: Handle skill input
  const handleAddSkill = useCallback(() => {
    if (skillInput.trim() && !selectedSkills.includes(skillInput.trim())) {
      setSelectedSkills(prev => [...prev, skillInput.trim()]);
      setSkillInput('');
    }
  }, [skillInput, selectedSkills]);

  const handleRemoveSkill = useCallback((skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill();
    }
  }, [handleAddSkill]);

  const clearFilter = useCallback((key: keyof JobFiltersType) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      newFilters.page = 1;
      return newFilters; // FIXED: No onFilterChange call here
    });

    // Also clear local state for specific filters
    if (key === 'company') {
      setCompanyInput('');
    } else if (key === 'salaryMode') {
      setSelectedSalaryMode(undefined);
      setMinSalary('');
      setMaxSalary('');
    } else if (key === 'minSalary' || key === 'maxSalary' || key === 'currency') {
      setMinSalary('');
      setMaxSalary('');
    } else if (key === 'skills') {
      setSelectedSkills([]);
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    const newFilters: JobFiltersType = {
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      demographicSex: undefined,
      opportunityType: undefined,
    };
    setFilters(newFilters);
    setSearchQuery('');
    setMinSalary('');
    setMaxSalary('');
    setSalaryCurrency('ETB');
    setSelectedSalaryMode(undefined);
    setSortBy('createdAt');
    setSortOrder('desc');
    setCategorySearch('');
    setLocationSearch('');
    setCompanyInput('');
    setSelectedSkills([]);
  }, []);

  // ============ CLICK OUTSIDE HANDLER ============
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        const isOutside = Object.values(dropdownRefs.current).every(ref =>
          !ref?.contains(event.target as Node)
        );

        if (isOutside) {
          setActiveDropdown(null);
          setCategorySearch('');
          setLocationSearch('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // ============ FILTERED OPTIONS ============
  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categories;
    return categories.filter(cat =>
      cat.label.toLowerCase().includes(categorySearch.toLowerCase()) ||
      cat.value.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const filteredLocations = useMemo(() => {
    if (!locationSearch) return regions;
    return regions.filter(region =>
      region.name.toLowerCase().includes(locationSearch.toLowerCase())
    );
  }, [regions, locationSearch]);

  // ============ ACTIVE FILTER COUNTS ============
  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).filter(key =>
      !['page', 'limit', 'search', 'sortBy', 'sortOrder'].includes(key)
    ).length;
  }, [filters]);

  // ============ SELECTED ITEMS FOR DISPLAY ============
  const getSelectedLabels = {
    categories: useMemo(() => {
      const categoryValue = filters.category;
      if (!categoryValue) return [];
      const categoryArray = Array.isArray(categoryValue) ? categoryValue : [categoryValue];
      return categories
        .filter(cat => categoryArray.includes(cat.value))
        .map(cat => cat.label);
    }, [filters.category, categories]),

    jobTypes: useMemo(() => {
      const typeValue = filters.type;
      if (!typeValue) return [];
      const typeArray = Array.isArray(typeValue) ? typeValue : [typeValue];
      return jobTypes
        .filter(type => typeArray.includes(type.value))
        .map(type => type.label);
    }, [filters.type, jobTypes]),

    location: useMemo(() => {
      if (!filters.location) return null;
      const region = regions.find(r => r.slug === filters.location);
      return region?.name || filters.location;
    }, [filters.location, regions]),

    experience: useMemo(() => {
      if (!filters.experienceLevel) return null;
      const exp = experienceLevels.find(e => e.value === filters.experienceLevel);
      return exp?.label || filters.experienceLevel;
    }, [filters.experienceLevel, experienceLevels]),

    workMode: useMemo(() => {
      if (!filters.remote) return null;
      const mode = workModes.find(m => m.value === filters.remote);
      return mode?.label || filters.remote;
    }, [filters.remote, workModes]),

    // ADDED
    workArrangement: useMemo(() => {
      if (!filters.workArrangement) return null;
      const arrangement = workArrangements.find(a => a.value === filters.workArrangement);
      return arrangement?.label || filters.workArrangement;
    }, [filters.workArrangement, workArrangements]),

    education: useMemo(() => {
      if (!filters.educationLevel) return null;
      const edu = educationLevels.find(e => e.value === filters.educationLevel);
      return edu?.label || filters.educationLevel;
    }, [filters.educationLevel, educationLevels]),

    company: filters.company,

    // ADDED
    opportunityType: useMemo(() => {
      if (!filters.opportunityType) return null;
      const type = opportunityTypes.find(t => t.value === filters.opportunityType);
      return type?.label || filters.opportunityType;
    }, [filters.opportunityType, opportunityTypes]),

    // ADDED
    demographicSex: useMemo(() => {
      if (!filters.demographicSex) return null;
      const sex = demographicSexOptions.find(s => s.value === filters.demographicSex);
      return sex?.label || filters.demographicSex;
    }, [filters.demographicSex, demographicSexOptions]),

    skills: selectedSkills,

    salaryMode: useMemo(() => {
      if (!filters.salaryMode) return null;
      const mode = salaryModes.find(m => m.value === filters.salaryMode);
      return mode?.label || null;
    }, [filters.salaryMode]),

    salary: (minSalary || maxSalary) && selectedSalaryMode === SalaryMode.RANGE ?
      `${minSalary ? `${parseInt(minSalary).toLocaleString()} ${salaryCurrency}` : ''}${minSalary && maxSalary ? ' - ' : ''}${maxSalary ? `${parseInt(maxSalary).toLocaleString()} ${salaryCurrency}` : ''}` : null,

    featured: filters.featured,
    urgent: filters.urgent,
    sort: sortOptions.find(s => s.value === sortBy)?.label
  };

  function isSelected(key: keyof JobFiltersType, value: string): boolean {
    const current = filters[key];
    if (current === undefined || current === null) return false;
    if (Array.isArray(current)) return current.includes(value);
    return current === value;
  }

  // ============ MOBILE FILTER CONTENT RENDERERS ============

  // ADDED: Skills mobile renderer
  const renderMobileSkillsContent = () => (
    <div className="space-y-4">
      <div className="relative">
        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: theme.text.muted }} />
        <input
          type="text"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a skill and press Enter..."
          className="w-full pl-10 pr-3 py-3 text-base rounded-lg focus:outline-none focus:ring-2"
          style={{
            backgroundColor: theme.bg.secondary,
            border: `1px solid ${theme.border.primary}`,
            color: theme.text.primary
          }}
        />
      </div>

      <button
        onClick={handleAddSkill}
        className="w-full px-4 py-3 rounded-lg font-medium text-white"
        style={{ backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB' }}
      >
        Add Skill
      </button>

      {selectedSkills.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium" style={{ color: theme.text.secondary }}>Selected Skills:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map(skill => (
              <div
                key={skill}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm"
                style={{
                  backgroundColor: themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF',
                  color: themeMode === 'dark' ? '#93C5FD' : '#2563EB',
                  border: `1px solid ${themeMode === 'dark' ? '#2563EB' : '#93C5FD'}`
                }}
              >
                <span>{skill}</span>
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-1 p-0.5 rounded-full hover:bg-black hover:bg-opacity-10"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ADDED: Work Arrangement mobile renderer
  const renderMobileWorkArrangementContent = () => (
    <div className="space-y-2">
      {workArrangements.map((arrangement) => (
        <button
          key={arrangement.value}
          onClick={() => {
            handleFilterChange('workArrangement', arrangement.value);
            setMobileSection(null);
          }}
          className={`w-full flex items-center justify-between p-4 rounded-lg text-left ${
            filters.workArrangement === arrangement.value ? 'font-medium' : ''
          }`}
          style={{
            backgroundColor: filters.workArrangement === arrangement.value
              ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
              : theme.bg.secondary,
            color: filters.workArrangement === arrangement.value
              ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
              : theme.text.primary
          }}
        >
          <span className="text-base">{arrangement.label}</span>
          {filters.workArrangement === arrangement.value && <Check className="w-5 h-5" />}
        </button>
      ))}
    </div>
  );

  // ADDED: Opportunity Type mobile renderer
  const renderMobileOpportunityTypeContent = () => (
    <div className="space-y-2">
      {opportunityTypes.map((type) => (
        <button
          key={type.value}
          onClick={() => {
            handleFilterChange('opportunityType', type.value);
            setMobileSection(null);
          }}
          className={`w-full flex items-center justify-between p-4 rounded-lg text-left ${
            filters.opportunityType === type.value ? 'font-medium' : ''
          }`}
          style={{
            backgroundColor: filters.opportunityType === type.value
              ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
              : theme.bg.secondary,
            color: filters.opportunityType === type.value
              ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
              : theme.text.primary
          }}
        >
          <span className="text-base">{type.label}</span>
          {filters.opportunityType === type.value && <Check className="w-5 h-5" />}
        </button>
      ))}
    </div>
  );

  // ADDED: Demographic Sex mobile renderer
  const renderMobileDemographicSexContent = () => (
    <div className="space-y-2">
      {demographicSexOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => {
            handleFilterChange('demographicSex', option.value);
            setMobileSection(null);
          }}
          className={`w-full flex items-center justify-between p-4 rounded-lg text-left ${
            filters.demographicSex === option.value ? 'font-medium' : ''
          }`}
          style={{
            backgroundColor: filters.demographicSex === option.value
              ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
              : theme.bg.secondary,
            color: filters.demographicSex === option.value
              ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
              : theme.text.primary
          }}
        >
          <span className="text-base">{option.label}</span>
          {filters.demographicSex === option.value && <Check className="w-5 h-5" />}
        </button>
      ))}
    </div>
  );

  // ADDED: Featured toggle mobile renderer
  const renderMobileFeaturedContent = () => (
    <div className="space-y-4">
      <button
        onClick={() => {
          handleFilterChange('featured', !filters.featured);
          setMobileSection(null);
        }}
        className={`w-full flex items-center justify-between p-4 rounded-lg text-left ${
          filters.featured ? 'font-medium' : ''
        }`}
        style={{
          backgroundColor: filters.featured
            ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
            : theme.bg.secondary,
          color: filters.featured
            ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
            : theme.text.primary
        }}
      >
        <span className="flex items-center gap-3 text-base">
          <Star className="w-5 h-5" />
          Featured Jobs Only
        </span>
        {filters.featured && <Check className="w-5 h-5" />}
      </button>
    </div>
  );

  // ADDED: Urgent toggle mobile renderer
  const renderMobileUrgentContent = () => (
    <div className="space-y-4">
      <button
        onClick={() => {
          handleFilterChange('urgent', !filters.urgent);
          setMobileSection(null);
        }}
        className={`w-full flex items-center justify-between p-4 rounded-lg text-left ${
          filters.urgent ? 'font-medium' : ''
        }`}
        style={{
          backgroundColor: filters.urgent
            ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
            : theme.bg.secondary,
          color: filters.urgent
            ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
            : theme.text.primary
        }}
      >
        <span className="flex items-center gap-3 text-base">
          <Clock className="w-5 h-5" />
          Urgent Jobs Only
        </span>
        {filters.urgent && <Check className="w-5 h-5" />}
      </button>
    </div>
  );

  const renderMobileCategoryContent = () => (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-9 pr-3 py-3 text-base rounded-lg focus:outline-none focus:ring-2"
          style={{
            backgroundColor: theme.bg.secondary,
            border: `1px solid ${theme.border.primary}`,
            color: theme.text.primary
          }}
        />
      </div>

      <div className="max-h-[50vh] overflow-y-auto space-y-2">
        {filteredCategories.map((category) => (
          <label
            key={category.value}
            className="flex items-center gap-3 p-3 rounded-lg hover:cursor-pointer"
            style={{
              backgroundColor: isSelected('category', category.value)
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : theme.bg.secondary
            }}
          >
            <input
              type="checkbox"
              checked={isSelected('category', category.value)}
              onChange={() => handleArrayFilterChange('category', category.value)}
              className="w-5 h-5 rounded focus:ring-2"
              style={{
                color: themeMode === 'dark' ? '#3B82F6' : '#2563EB'
              }}
            />
            <span className="text-base flex-1" style={{ color: theme.text.primary }}>
              {category.label}
            </span>
          </label>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={() => {
            handleFilterChange('category', undefined);
            setCategorySearch('');
          }}
          className="flex-1 px-4 py-3 rounded-lg font-medium border"
          style={{
            borderColor: theme.border.primary,
            color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626'
          }}
        >
          Clear
        </button>
        <button
          onClick={() => setMobileSection(null)}
          className="flex-1 px-4 py-3 rounded-lg font-medium text-white"
          style={{ backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB' }}
        >
          Apply
        </button>
      </div>
    </div>
  );

  const renderMobileLocationContent = () => (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={locationSearch}
          onChange={(e) => setLocationSearch(e.target.value)}
          placeholder="Search regions..."
          className="w-full pl-9 pr-3 py-3 text-base rounded-lg focus:outline-none focus:ring-2"
          style={{
            backgroundColor: theme.bg.secondary,
            border: `1px solid ${theme.border.primary}`,
            color: theme.text.primary
          }}
        />
      </div>

      <div className="max-h-[50vh] overflow-y-auto space-y-2">
        {filteredLocations.map((region) => (
          <button
            key={region.slug}
            onClick={() => {
              handleFilterChange('location', region.slug);
              setMobileSection(null);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-lg text-left ${
              filters.location === region.slug ? 'font-medium' : ''
            }`}
            style={{
              backgroundColor: filters.location === region.slug
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : theme.bg.secondary,
              color: filters.location === region.slug
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-base">{region.name}</span>
            {filters.location === region.slug && <Check className="w-5 h-5" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderMobileJobTypeContent = () => (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
      {jobTypes.map((type) => (
        <label
          key={type.value}
          className="flex items-center gap-3 p-3 rounded-lg"
          style={{
            backgroundColor: isSelected('type', type.value)
              ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
              : theme.bg.secondary
          }}
        >
          <input
            type="checkbox"
            checked={isSelected('type', type.value)}
            onChange={() => handleArrayFilterChange('type', type.value)}
            className="w-5 h-5 rounded focus:ring-2"
            style={{
              color: themeMode === 'dark' ? '#3B82F6' : '#2563EB'
            }}
          />
          <span className="text-base" style={{ color: theme.text.primary }}>
            {type.label}
          </span>
        </label>
      ))}
    </div>
  );

  const renderMobileExperienceContent = () => (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
      {experienceLevels.map((level) => (
        <button
          key={level.value}
          onClick={() => {
            handleFilterChange('experienceLevel', level.value);
            setMobileSection(null);
          }}
          className={`w-full flex items-center justify-between p-4 rounded-lg text-left ${
            filters.experienceLevel === level.value ? 'font-medium' : ''
          }`}
          style={{
            backgroundColor: filters.experienceLevel === level.value
              ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
              : theme.bg.secondary,
            color: filters.experienceLevel === level.value
              ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
              : theme.text.primary
          }}
        >
          <span className="text-base">{level.label}</span>
          {filters.experienceLevel === level.value && <Check className="w-5 h-5" />}
        </button>
      ))}
    </div>
  );

  const renderMobileSalaryContent = () => (
    <div className="space-y-6">
      {/* Salary Mode Selection */}
      <div>
        <h4 className="text-sm font-medium mb-3" style={{ color: theme.text.secondary }}>
          Salary Display Mode
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {salaryModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => {
                setSelectedSalaryMode(mode.value);
                const newFilters = { ...filters, salaryMode: mode.value, page: 1 };
                if (mode.value !== SalaryMode.RANGE) {
                  delete newFilters.minSalary;
                  delete newFilters.maxSalary;
                }
                setFilters(newFilters);
              }}
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                selectedSalaryMode === mode.value ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{
                backgroundColor: selectedSalaryMode === mode.value
                  ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                  : theme.bg.secondary,
                borderColor: selectedSalaryMode === mode.value
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                borderWidth: '1px',
                color: theme.text.primary
              }}
            >
              <span style={{ color: themeMode === 'dark' ? '#93C5FD' : '#2563EB' }}>
                {mode.icon}
              </span>
              <span className="truncate">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Currency Switcher - ADDED */}
      <div>
        <h4 className="text-sm font-medium mb-3" style={{ color: theme.text.secondary }}>
          Currency
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {currencyOptions.map((currency) => (
            <button
              key={currency.value}
              onClick={() => {
                setSalaryCurrency(currency.value as any);
                setFilters(prev => ({ ...prev, currency: currency.value as any, page: 1 }));
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                salaryCurrency === currency.value ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{
                backgroundColor: salaryCurrency === currency.value
                  ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                  : theme.bg.secondary,
                borderColor: salaryCurrency === currency.value
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                borderWidth: '1px',
                color: theme.text.primary
              }}
            >
              {currency.label}
            </button>
          ))}
        </div>
      </div>

      {/* Range Inputs - Only show if Range mode is selected */}
      {selectedSalaryMode === SalaryMode.RANGE && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.text.secondary }}>
                Minimum
              </label>
              <input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 text-base rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: theme.bg.secondary,
                  border: `1px solid ${theme.border.primary}`,
                  color: theme.text.primary
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.text.secondary }}>
                Maximum
              </label>
              <input
                type="number"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                placeholder="Any"
                className="w-full px-4 py-3 text-base rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: theme.bg.secondary,
                  border: `1px solid ${theme.border.primary}`,
                  color: theme.text.primary
                }}
              />
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={() => {
            setSelectedSalaryMode(undefined);
            setMinSalary('');
            setMaxSalary('');
            clearFilter('salaryMode');
            clearFilter('minSalary');
            clearFilter('maxSalary');
            clearFilter('currency');
            setMobileSection(null);
          }}
          className="flex-1 px-4 py-3 rounded-lg font-medium border"
          style={{
            borderColor: theme.border.primary,
            color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626'
          }}
        >
          Clear
        </button>
        <button
          onClick={() => setMobileSection(null)}
          className="flex-1 px-4 py-3 rounded-lg font-medium text-white"
          style={{ backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB' }}
        >
          Done
        </button>
      </div>
    </div>
  );

  const renderMobileWorkModeContent = () => (
    <div className="space-y-2">
      {workModes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => {
            handleFilterChange('remote', mode.value);
            setMobileSection(null);
          }}
          className={`w-full flex items-center justify-between p-4 rounded-lg text-left ${
            filters.remote === mode.value ? 'font-medium' : ''
          }`}
          style={{
            backgroundColor: filters.remote === mode.value
              ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
              : theme.bg.secondary,
            color: filters.remote === mode.value
              ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
              : theme.text.primary
          }}
        >
          <span className="text-base">{mode.label}</span>
          {filters.remote === mode.value && <Check className="w-5 h-5" />}
        </button>
      ))}
    </div>
  );

  const renderMobileEducationContent = () => (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
      {educationLevels.map((level) => (
        <button
          key={level.value}
          onClick={() => {
            handleFilterChange('educationLevel', level.value);
            setMobileSection(null);
          }}
          className={`w-full flex items-center justify-between p-4 rounded-lg text-left ${
            filters.educationLevel === level.value ? 'font-medium' : ''
          }`}
          style={{
            backgroundColor: filters.educationLevel === level.value
              ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
              : theme.bg.secondary,
            color: filters.educationLevel === level.value
              ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
              : theme.text.primary
          }}
        >
          <span className="text-base">{level.label}</span>
          {filters.educationLevel === level.value && <Check className="w-5 h-5" />}
        </button>
      ))}
    </div>
  );

  const renderMobileCompanyContent = () => (
    <div className="space-y-4">
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: theme.text.muted }} />
        <input
          type="text"
          value={companyInput}
          onChange={(e) => setCompanyInput(e.target.value)}
          placeholder="Enter company name..."
          className="w-full pl-10 pr-3 py-3 text-base rounded-lg focus:outline-none focus:ring-2"
          style={{
            backgroundColor: theme.bg.secondary,
            border: `1px solid ${theme.border.primary}`,
            color: theme.text.primary
          }}
        />
      </div>

      {filters.company && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: theme.bg.secondary }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" style={{ color: theme.text.muted }} />
              <span className="font-medium" style={{ color: theme.text.primary }}>
                {filters.company as string}
              </span>
            </div>
            <button
              onClick={() => {
                clearFilter('company');
                setCompanyInput('');
              }}
              className="p-1 rounded-full hover:opacity-70"
            >
              <X className="w-4 h-4" style={{ color: theme.text.muted }} />
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={() => {
            setCompanyInput('');
            setMobileSection(null);
          }}
          className="flex-1 px-4 py-3 rounded-lg font-medium border"
          style={{
            borderColor: theme.border.primary,
            color: theme.text.muted
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (companyInput.trim()) {
              handleFilterChange('company', companyInput.trim());
            }
            setMobileSection(null);
          }}
          className="flex-1 px-4 py-3 rounded-lg font-medium text-white"
          style={{ backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB' }}
        >
          Apply
        </button>
      </div>
    </div>
  );

  const renderMobileSortContent = () => (
    <div className="space-y-2">
      {sortOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => {
            setSortBy(option.value);
            if (option.value === 'title' || option.value === 'createdAt') {
              setSortOrder('desc');
            } else if (option.value === 'salary.min') {
              setSortOrder('asc');
            } else if (option.value === '-salary.max') {
              setSortOrder('desc');
            }
            setMobileSection(null);
          }}
          className={`w-full flex items-center justify-between p-4 rounded-lg text-left ${
            sortBy === option.value ? 'font-medium' : ''
          }`}
          style={{
            backgroundColor: sortBy === option.value
              ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
              : theme.bg.secondary,
            color: sortBy === option.value
              ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
              : theme.text.primary
          }}
        >
          <span className="text-base">{option.label}</span>
          {sortBy === option.value && <Check className="w-5 h-5" />}
        </button>
      ))}
    </div>
  );

  // ============ MOBILE FILTER SHEET ============
  const MobileFilterSheet = () => {
    if (!isMobileFilterOpen) return null;

    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ 
            backgroundColor: themeMode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'
          }}
          onClick={() => {
            setIsMobileFilterOpen(false);
            setMobileSection(null);
          }}
        />

        {/* Sheet */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-t-2xl shadow-2xl max-h-[90vh] overflow-hidden transition-transform duration-300 ease-out"
          style={{ 
            backgroundColor: theme.bg.primary,
            transform: isMobileFilterOpen ? 'translateY(0)' : 'translateY(100%)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.border.secondary }}>
            <h3 className="text-lg font-semibold" style={{ color: theme.text.primary }}>
              {mobileSection ? (
                <button
                  onClick={() => setMobileSection(null)}
                  className="flex items-center gap-2"
                  style={{ color: theme.text.primary }}
                >
                  <ChevronDown className="w-5 h-5 rotate-90" />
                  Back
                </button>
              ) : (
                'Filters'
              )}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsMobileFilterOpen(false);
                setMobileSection(null);
              }}
              className="p-2 rounded-full transition-colors"
              style={{ 
                backgroundColor: theme.bg.secondary,
                color: theme.text.primary
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div 
            className="overflow-y-auto p-4" 
            style={{ 
              maxHeight: 'calc(90vh - 120px)',
              backgroundColor: theme.bg.primary
            }}
          >
            {!mobileSection ? (
              <div className="space-y-3">
                <button
                  onClick={() => setMobileSection('category')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Target className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Category</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                <button
                  onClick={() => setMobileSection('location')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <MapPin className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Location</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                <button
                  onClick={() => setMobileSection('jobType')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Job Type</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                <button
                  onClick={() => setMobileSection('experience')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Users className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Experience</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                <button
                  onClick={() => setMobileSection('salary')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Salary</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                <button
                  onClick={() => setMobileSection('workMode')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Work Mode</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                {/* ADDED: Work Arrangement */}
                <button
                  onClick={() => setMobileSection('workArrangement')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Wrench className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Work Arrangement</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                <button
                  onClick={() => setMobileSection('education')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Education</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                {/* ADDED: Opportunity Type */}
                <button
                  onClick={() => setMobileSection('opportunityType')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Award className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Opportunity Type</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                <button
                  onClick={() => setMobileSection('company')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Building2 className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Company</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                {/* ADDED: Demographic Sex */}
                <button
                  onClick={() => setMobileSection('demographicSex')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <UserCog className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Gender</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                {/* ADDED: Skills */}
                <button
                  onClick={() => setMobileSection('skills')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Tag className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Skills</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                {/* ADDED: Featured */}
                <button
                  onClick={() => setMobileSection('featured')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Star className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Featured</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                {/* ADDED: Urgent */}
                <button
                  onClick={() => setMobileSection('urgent')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Clock className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Urgent</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>

                <button
                  onClick={() => setMobileSection('sort')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary 
                  }}
                >
                  <span className="flex items-center gap-3">
                    <SlidersHorizontal className="w-5 h-5" style={{ color: theme.text.primary }} />
                    <span className="font-medium" style={{ color: theme.text.primary }}>Sort By</span>
                  </span>
                  <ChevronDown className="w-5 h-5 rotate-270" style={{ color: theme.text.muted }} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-semibold text-base" style={{ color: theme.text.primary }}>
                  {mobileSection === 'category' && 'Select Categories'}
                  {mobileSection === 'location' && 'Select Location'}
                  {mobileSection === 'jobType' && 'Select Job Types'}
                  {mobileSection === 'experience' && 'Select Experience Level'}
                  {mobileSection === 'salary' && 'Select Salary'}
                  {mobileSection === 'workMode' && 'Select Work Mode'}
                  {mobileSection === 'workArrangement' && 'Select Work Arrangement'} {/* ADDED */}
                  {mobileSection === 'education' && 'Select Education Level'}
                  {mobileSection === 'opportunityType' && 'Select Opportunity Type'} {/* ADDED */}
                  {mobileSection === 'company' && 'Filter by Company'}
                  {mobileSection === 'demographicSex' && 'Select Gender'} {/* ADDED */}
                  {mobileSection === 'skills' && 'Add Skills'} {/* ADDED */}
                  {mobileSection === 'featured' && 'Featured Jobs'} {/* ADDED */}
                  {mobileSection === 'urgent' && 'Urgent Jobs'} {/* ADDED */}
                  {mobileSection === 'sort' && 'Sort By'}
                </h4>

                {mobileSection === 'category' && renderMobileCategoryContent()}
                {mobileSection === 'location' && renderMobileLocationContent()}
                {mobileSection === 'jobType' && renderMobileJobTypeContent()}
                {mobileSection === 'experience' && renderMobileExperienceContent()}
                {mobileSection === 'salary' && renderMobileSalaryContent()}
                {mobileSection === 'workMode' && renderMobileWorkModeContent()}
                {mobileSection === 'workArrangement' && renderMobileWorkArrangementContent()} {/* ADDED */}
                {mobileSection === 'education' && renderMobileEducationContent()}
                {mobileSection === 'opportunityType' && renderMobileOpportunityTypeContent()} {/* ADDED */}
                {mobileSection === 'company' && renderMobileCompanyContent()}
                {mobileSection === 'demographicSex' && renderMobileDemographicSexContent()} {/* ADDED */}
                {mobileSection === 'skills' && renderMobileSkillsContent()} {/* ADDED */}
                {mobileSection === 'featured' && renderMobileFeaturedContent()} {/* ADDED */}
                {mobileSection === 'urgent' && renderMobileUrgentContent()} {/* ADDED */}
                {mobileSection === 'sort' && renderMobileSortContent()}
              </div>
            )}
          </div>

          {/* Footer for main filters view */}
          {!mobileSection && (
            <div 
              className="p-4 border-t"
              style={{ borderColor: theme.border.secondary }}
            >
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full px-4 py-3 rounded-lg font-medium text-white transition-all active:scale-[0.98]"
                style={{ backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB' }}
              >
                View {totalResults ? `${totalResults} Results` : 'Results'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============ FILTER CHIP COMPONENT ============
  const FilterChip = ({ label, onRemove, icon }: { label: string; onRemove: () => void; icon?: React.ReactNode }) => (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all hover:opacity-80 cursor-pointer"
      style={{
        backgroundColor: themeMode === 'dark' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
        color: themeMode === 'dark' ? '#93C5FD' : '#2563EB',
        border: `1px solid ${themeMode === 'dark' ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`
      }}
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
    >
      {icon}
      <span className="truncate max-w-[200px]">{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 p-0.5 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );

  // ============ DESKTOP DROPDOWN RENDER FUNCTIONS ============

  // ADDED: Work Arrangement Dropdown
  const renderWorkArrangementDropdown = () => (
    <div
      ref={(el) => { dropdownRefs.current.workArrangement = el; }}
      className="absolute top-full left-0 mt-2 w-64 rounded-xl shadow-2xl border z-50"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Work Arrangement</h3>
      </div>

      <div className="p-4 space-y-1">
        {workArrangements.map((arrangement) => (
          <button
            key={arrangement.value}
            type="button"
            onClick={() => {
              handleFilterChange('workArrangement', arrangement.value);
              setActiveDropdown(null);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left hover:opacity-80 transition-colors ${
              filters.workArrangement === arrangement.value ? 'font-medium' : ''
            }`}
            style={{
              backgroundColor: filters.workArrangement === arrangement.value
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: filters.workArrangement === arrangement.value
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{arrangement.label}</span>
            {filters.workArrangement === arrangement.value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  // ADDED: Opportunity Type Dropdown
  const renderOpportunityTypeDropdown = () => (
    <div
      ref={(el) => { dropdownRefs.current.opportunityType = el; }}
      className="absolute top-full left-0 mt-2 w-64 rounded-xl shadow-2xl border z-50"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Opportunity Type</h3>
      </div>

      <div className="p-4 space-y-1">
        {opportunityTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => {
              handleFilterChange('opportunityType', type.value);
              setActiveDropdown(null);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left hover:opacity-80 transition-colors ${
              filters.opportunityType === type.value ? 'font-medium' : ''
            }`}
            style={{
              backgroundColor: filters.opportunityType === type.value
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: filters.opportunityType === type.value
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{type.label}</span>
            {filters.opportunityType === type.value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  // ADDED: Demographic Sex Dropdown
  const renderDemographicSexDropdown = () => (
    <div
      ref={(el) => { dropdownRefs.current.demographicSex = el; }}
      className="absolute top-full left-0 mt-2 w-56 rounded-xl shadow-2xl border z-50"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Gender</h3>
      </div>

      <div className="p-4 space-y-1">
        {demographicSexOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              handleFilterChange('demographicSex', option.value);
              setActiveDropdown(null);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left hover:opacity-80 transition-colors ${
              filters.demographicSex === option.value ? 'font-medium' : ''
            }`}
            style={{
              backgroundColor: filters.demographicSex === option.value
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: filters.demographicSex === option.value
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{option.label}</span>
            {filters.demographicSex === option.value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  // ADDED: Skills Dropdown
  const renderSkillsDropdown = () => (
    <div
      ref={(el) => { dropdownRefs.current.skills = el; }}
      className="absolute top-full left-0 mt-2 w-80 rounded-xl shadow-2xl border z-50"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Skills</h3>
        <p className={`text-xs ${theme.text.muted} mt-0.5`}>Type a skill and press Enter</p>
      </div>

      <div className="p-4">
        <div className="relative mb-3">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: theme.text.muted }} />
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. React, TypeScript, Python..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.bg.secondary,
              border: `1px solid ${theme.border.primary}`,
              color: theme.text.primary
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleAddSkill}
          className="w-full px-3 py-2 text-sm rounded-lg font-medium mb-3"
          style={{
            backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB',
            color: '#FFFFFF'
          }}
        >
          Add Skill
        </button>

        {selectedSkills.length > 0 && (
          <div className="space-y-2">
            <h4 className={`text-xs font-medium ${theme.text.secondary}`}>Selected Skills:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map(skill => (
                <div
                  key={skill}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF',
                    color: themeMode === 'dark' ? '#93C5FD' : '#2563EB',
                    border: `1px solid ${themeMode === 'dark' ? '#2563EB' : '#93C5FD'}`
                  }}
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 p-0.5 rounded-full hover:bg-black hover:bg-opacity-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t flex justify-end" style={{ borderColor: theme.border.secondary }}>
        <button
          type="button"
          onClick={() => setActiveDropdown(null)}
          className="px-4 py-1.5 text-sm rounded-lg font-medium"
          style={{
            backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB',
            color: '#FFFFFF'
          }}
        >
          Done
        </button>
      </div>
    </div>
  );

  // ADDED: Featured Toggle (Desktop)
  const renderFeaturedToggle = () => (
    <button
      type="button"
      onClick={() => handleFilterChange('featured', !filters.featured)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
        filters.featured ? 'ring-2 ring-offset-2' : ''
      }`}
      style={{
        backgroundColor: filters.featured
          ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
          : theme.bg.secondary,
        borderColor: filters.featured
          ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
          : theme.border.primary,
        color: filters.featured
          ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
          : theme.text.secondary
      }}
    >
      <Star className={`w-4 h-4 ${filters.featured ? 'fill-current' : ''}`} />
      <span className="font-medium">Featured</span>
    </button>
  );

  // ADDED: Urgent Toggle (Desktop)
  const renderUrgentToggle = () => (
    <button
      type="button"
      onClick={() => handleFilterChange('urgent', !filters.urgent)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
        filters.urgent ? 'ring-2 ring-offset-2' : ''
      }`}
      style={{
        backgroundColor: filters.urgent
          ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
          : theme.bg.secondary,
        borderColor: filters.urgent
          ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
          : theme.border.primary,
        color: filters.urgent
          ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
          : theme.text.secondary
      }}
    >
      <Clock className="w-4 h-4" />
      <span className="font-medium">Urgent</span>
    </button>
  );

  const renderCategoryDropdown = () => (
    <div
      ref={(el) => { dropdownRefs.current.category = el; }}
      className="absolute top-full left-0 mt-2 w-80 rounded-xl shadow-2xl border z-50"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Job Category</h3>
        <p className={`text-xs ${theme.text.muted} mt-0.5`}>Select one or more categories</p>
      </div>

      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.bg.secondary,
              border: `1px solid ${theme.border.primary}`,
              color: theme.text.primary
            }}
          />
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto px-4 pb-4">
        {filteredCategories.length > 0 ? (
          <div className="space-y-1">
            {filteredCategories.map((category) => (
              <label
                key={category.value}
                className="flex items-center gap-3 p-2 rounded-lg hover:cursor-pointer transition-colors"
                style={{
                  backgroundColor: isSelected('category', category.value)
                    ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                    : 'transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected('category', category.value)}
                  onChange={() => handleArrayFilterChange('category', category.value)}
                  className="w-4 h-4 rounded focus:ring-2 focus:ring-offset-2"
                  style={{
                    color: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
                    borderColor: theme.border.primary
                  }}
                />
                <span className={`text-sm flex-1 ${theme.text.primary}`}>{category.label}</span>
                {isSelected('category', category.value) && (
                  <Check className="w-4 h-4" style={{ color: themeMode === 'dark' ? '#3B82F6' : '#2563EB' }} />
                )}
              </label>
            ))}
          </div>
        ) : (
          <div className={`py-8 text-center text-sm ${theme.text.muted}`}>No categories found</div>
        )}
      </div>

      <div className="p-4 border-t flex justify-between" style={{ borderColor: theme.border.secondary }}>
        <button
          type="button"
          onClick={() => {
            handleFilterChange('category', undefined);
            setCategorySearch('');
          }}
          className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors hover:opacity-80"
          style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => setActiveDropdown(null)}
          className="px-4 py-1.5 text-sm rounded-lg font-medium"
          style={{
            backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB',
            color: '#FFFFFF'
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );

  const renderLocationDropdown = () => (
    <div
      ref={(el) => { dropdownRefs.current.location = el; }}
      className="absolute top-full left-0 mt-2 w-72 rounded-xl shadow-2xl border z-50"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Location</h3>
      </div>

      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            placeholder="Search regions..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.bg.secondary,
              border: `1px solid ${theme.border.primary}`,
              color: theme.text.primary
            }}
          />
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto px-4 pb-4">
        {filteredLocations.map((region) => (
          <button
            key={region.slug}
            type="button"
            onClick={() => {
              handleFilterChange('location', region.slug);
              setActiveDropdown(null);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left hover:opacity-80 transition-colors ${filters.location === region.slug ? 'font-medium' : ''
              }`}
            style={{
              backgroundColor: filters.location === region.slug
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: filters.location === region.slug
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{region.name}</span>
            {filters.location === region.slug && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderJobTypeDropdown = () => (
    <div
      ref={(el) => { dropdownRefs.current.jobType = el; }}
      className="absolute top-full left-0 mt-2 w-64 rounded-xl shadow-2xl border z-50"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Job Type</h3>
      </div>

      <div className="p-4 space-y-2">
        {jobTypes.map((type) => (
          <label
            key={type.value}
            className="flex items-center gap-3 p-2 rounded-lg hover:cursor-pointer transition-colors"
            style={{
              backgroundColor: isSelected('type', type.value)
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent'
            }}
          >
            <input
              type="checkbox"
              checked={isSelected('type', type.value)}
              onChange={() => handleArrayFilterChange('type', type.value)}
              className="w-4 h-4 rounded focus:ring-2 focus:ring-offset-2"
              style={{
                color: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
                borderColor: theme.border.primary
              }}
            />
            <span className={`text-sm flex-1 ${theme.text.primary}`}>{type.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderExperienceDropdown = () => (
    <div
      ref={(el) => { dropdownRefs.current.experience = el; }}
      className="absolute top-full left-0 mt-2 w-64 rounded-xl shadow-2xl border z-50"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Experience Level</h3>
      </div>

      <div className="p-4 space-y-1">
        {experienceLevels.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => {
              handleFilterChange('experienceLevel', level.value);
              setActiveDropdown(null);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left hover:opacity-80 transition-colors ${filters.experienceLevel === level.value ? 'font-medium' : ''
              }`}
            style={{
              backgroundColor: filters.experienceLevel === level.value
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: filters.experienceLevel === level.value
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{level.label}</span>
            {filters.experienceLevel === level.value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSalaryDropdown = () => (
    <div
      ref={(el) => { dropdownRefs.current.salary = el; }}
      className="absolute top-full left-0 mt-2 w-80 rounded-xl shadow-2xl border z-50"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Salary</h3>
        <p className={`text-xs ${theme.text.muted} mt-0.5`}>Select salary type and range</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Salary Mode Selection */}
        <div>
          <h4 className={`text-xs font-medium ${theme.text.secondary} mb-2`}>Salary Display Mode</h4>
          <div className="grid grid-cols-2 gap-2">
            {salaryModes.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => {
                  setSelectedSalaryMode(mode.value);
                  const newFilters = { ...filters, salaryMode: mode.value, page: 1 };
                  if (mode.value !== SalaryMode.RANGE) {
                    delete newFilters.minSalary;
                    delete newFilters.maxSalary;
                  }
                  setFilters(newFilters);
                }}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${selectedSalaryMode === mode.value ? 'ring-2 ring-offset-1' : ''
                  }`}
                style={{
                  backgroundColor: selectedSalaryMode === mode.value
                    ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                    : theme.bg.secondary,
                  borderColor: selectedSalaryMode === mode.value
                    ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                    : theme.border.primary,
                  borderWidth: '1px',
                  color: theme.text.primary
                }}
              >
                <span style={{ color: themeMode === 'dark' ? '#93C5FD' : '#2563EB' }}>
                  {mode.icon}
                </span>
                <span className="truncate">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Currency Switcher - ADDED */}
        <div>
          <h4 className={`text-xs font-medium ${theme.text.secondary} mb-2`}>Currency</h4>
          <div className="grid grid-cols-4 gap-1">
            {currencyOptions.map((currency) => (
              <button
                key={currency.value}
                type="button"
                onClick={() => {
                  setSalaryCurrency(currency.value as any);
                  setFilters(prev => ({ ...prev, currency: currency.value as any, page: 1 }));
                }}
                className={`px-2 py-1 text-xs rounded-lg font-medium ${
                  salaryCurrency === currency.value ? 'ring-2 ring-offset-1' : ''
                }`}
                style={{
                  backgroundColor: salaryCurrency === currency.value
                    ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                    : theme.bg.secondary,
                  borderColor: salaryCurrency === currency.value
                    ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                    : theme.border.primary,
                  borderWidth: '1px',
                  color: theme.text.primary
                }}
              >
                {currency.label}
              </button>
            ))}
          </div>
        </div>

        {/* Range Inputs - Only show if Range mode is selected */}
        {selectedSalaryMode === SalaryMode.RANGE && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium ${theme.text.secondary} mb-1`}>Minimum</label>
                <input
                  type="number"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: theme.bg.secondary,
                    border: `1px solid ${theme.border.primary}`,
                    color: theme.text.primary
                  }}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium ${theme.text.secondary} mb-1`}>Maximum</label>
                <input
                  type="number"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                  placeholder="Any"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: theme.bg.secondary,
                    border: `1px solid ${theme.border.primary}`,
                    color: theme.text.primary
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t flex justify-between" style={{ borderColor: theme.border.secondary }}>
        <button
          type="button"
          onClick={() => {
            setSelectedSalaryMode(undefined);
            setMinSalary('');
            setMaxSalary('');
            clearFilter('salaryMode');
            clearFilter('minSalary');
            clearFilter('maxSalary');
            clearFilter('currency');
            setActiveDropdown(null);
          }}
          className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors hover:opacity-80"
          style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => setActiveDropdown(null)}
          className="px-4 py-1.5 text-sm rounded-lg font-medium"
          style={{
            backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB',
            color: '#FFFFFF'
          }}
        >
          Done
        </button>
      </div>
    </div>
  );

  const renderWorkModeDropdown = () => (
    <div
      ref={(el) => { dropdownRefs.current.workMode = el; }}
      className="absolute top-full left-0 mt-2 w-56 rounded-xl shadow-2xl border z-50"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Work Mode</h3>
      </div>

      <div className="p-4 space-y-1">
        {workModes.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => {
              handleFilterChange('remote', mode.value);
              setActiveDropdown(null);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left hover:opacity-80 transition-colors ${filters.remote === mode.value ? 'font-medium' : ''
              }`}
            style={{
              backgroundColor: filters.remote === mode.value
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: filters.remote === mode.value
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{mode.label}</span>
            {filters.remote === mode.value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderEducationDropdown = () => (
    <div
      ref={(el) => { dropdownRefs.current.education = el; }}
      className="absolute top-full left-0 mt-2 w-72 rounded-xl shadow-2xl border z-50"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Education Level</h3>
      </div>

      <div className="max-h-64 overflow-y-auto p-4">
        {educationLevels.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => {
              handleFilterChange('educationLevel', level.value);
              setActiveDropdown(null);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left hover:opacity-80 transition-colors ${filters.educationLevel === level.value ? 'font-medium' : ''
              }`}
            style={{
              backgroundColor: filters.educationLevel === level.value
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: filters.educationLevel === level.value
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{level.label}</span>
            {filters.educationLevel === level.value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderCompanyDropdown = () => (
    <div
      ref={(el) => { dropdownRefs.current.company = el; }}
      className="absolute top-full left-0 mt-2 w-80 rounded-xl shadow-2xl border z-50"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Filter by Company</h3>
        <p className={`text-xs ${theme.text.muted} mt-0.5`}>Enter company name to filter jobs</p>
      </div>

      <div className="p-4">
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: theme.text.muted }} />
          <input
            type="text"
            value={companyInput}
            onChange={(e) => setCompanyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && companyInput.trim()) {
                handleFilterChange('company', companyInput.trim());
                setActiveDropdown(null);
              }
            }}
            placeholder="e.g. Google, Microsoft..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.bg.secondary,
              border: `1px solid ${theme.border.primary}`,
              color: theme.text.primary
            }}
          />
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (companyInput.trim()) {
                handleFilterChange('company', companyInput.trim());
                setActiveDropdown(null);
              }
            }}
            className="px-4 py-2 text-sm rounded-lg font-medium"
            style={{
              backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB',
              color: '#FFFFFF'
            }}
          >
            Apply Filter
          </button>
        </div>

        {filters.company && (
          <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: theme.bg.secondary }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" style={{ color: theme.text.muted }} />
                <span className={`text-sm font-medium ${theme.text.primary}`}>
                  {filters.company as string}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearFilter('company');
                  setCompanyInput('');
                }}
                className="p-1 rounded-full hover:opacity-70"
              >
                <X className="w-4 h-4" style={{ color: theme.text.muted }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSortDropdown = () => (
    <div
      ref={(el) => { dropdownRefs.current.sort = el; }}
      className="absolute top-full left-0 mt-2 w-64 rounded-xl shadow-2xl border z-50"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Sort By</h3>
      </div>

      <div className="p-4 space-y-1">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setSortBy(option.value);
              if (option.value === 'title' || option.value === 'createdAt') {
                setSortOrder('desc');
              } else if (option.value === 'salary.min') {
                setSortOrder('asc');
              } else if (option.value === '-salary.max') {
                setSortOrder('desc');
              }
              setActiveDropdown(null);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left hover:opacity-80 transition-colors ${sortBy === option.value ? 'font-medium' : ''
              }`}
            style={{
              backgroundColor: sortBy === option.value
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: sortBy === option.value
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{option.label}</span>
            {sortBy === option.value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  // ============ MAIN RENDER ============
  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: theme.text.muted }} />
            ) : (
              <Search className="w-5 h-5" style={{ color: theme.text.muted }} />
            )}
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job title, company, skills, or category..."
            className="w-full pl-12 pr-12 py-4 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
            style={{
              backgroundColor: theme.bg.primary,
              border: `2px solid ${theme.border.primary}`,
              color: theme.text.primary
            }}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-70 transition-opacity"
            >
              <X className="w-5 h-5" style={{ color: theme.text.muted }} />
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: theme.text.muted }}>
          <span>💡 Try: `Software Engineer`, `Google`, `Remote`, `Marketing`</span>
        </div>
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden lg:block mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${activeDropdown === 'category' ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: activeDropdown === 'category'
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                color: activeDropdown === 'category'
                  ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                  : theme.text.secondary
              }}
            >
              <Target className="w-4 h-4" />
              <span className="font-medium">Category</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'category' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'category' && renderCategoryDropdown()}
          </div>

          {/* Location Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'location' ? null : 'location')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${activeDropdown === 'location' ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: activeDropdown === 'location'
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                color: activeDropdown === 'location'
                  ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                  : theme.text.secondary
              }}
            >
              <MapPin className="w-4 h-4" />
              <span className="font-medium">Location</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'location' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'location' && renderLocationDropdown()}
          </div>

          {/* Job Type Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'jobType' ? null : 'jobType')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${activeDropdown === 'jobType' ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: activeDropdown === 'jobType'
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                color: activeDropdown === 'jobType'
                  ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                  : theme.text.secondary
              }}
            >
              <Briefcase className="w-4 h-4" />
              <span className="font-medium">Job Type</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'jobType' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'jobType' && renderJobTypeDropdown()}
          </div>

          {/* Experience Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'experience' ? null : 'experience')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${activeDropdown === 'experience' ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: activeDropdown === 'experience'
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                color: activeDropdown === 'experience'
                  ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                  : theme.text.secondary
              }}
            >
              <Users className="w-4 h-4" />
              <span className="font-medium">Experience</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'experience' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'experience' && renderExperienceDropdown()}
          </div>

          {/* Salary Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'salary' ? null : 'salary')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${activeDropdown === 'salary' ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: activeDropdown === 'salary'
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                color: activeDropdown === 'salary'
                  ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                  : theme.text.secondary
              }}
            >
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">Salary</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'salary' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'salary' && renderSalaryDropdown()}
          </div>

          {/* Work Mode Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'workMode' ? null : 'workMode')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${activeDropdown === 'workMode' ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: activeDropdown === 'workMode'
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                color: activeDropdown === 'workMode'
                  ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                  : theme.text.secondary
              }}
            >
              <Briefcase className="w-4 h-4" />
              <span className="font-medium">Work Mode</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'workMode' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'workMode' && renderWorkModeDropdown()}
          </div>

          {/* ADDED: Work Arrangement Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'workArrangement' ? null : 'workArrangement')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${activeDropdown === 'workArrangement' ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: activeDropdown === 'workArrangement'
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                color: activeDropdown === 'workArrangement'
                  ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                  : theme.text.secondary
              }}
            >
              <Wrench className="w-4 h-4" />
              <span className="font-medium">Arrangement</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'workArrangement' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'workArrangement' && renderWorkArrangementDropdown()}
          </div>

          {/* Education Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'education' ? null : 'education')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${activeDropdown === 'education' ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: activeDropdown === 'education'
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                color: activeDropdown === 'education'
                  ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                  : theme.text.secondary
              }}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="font-medium">Education</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'education' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'education' && renderEducationDropdown()}
          </div>

          {/* ADDED: Opportunity Type Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'opportunityType' ? null : 'opportunityType')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${activeDropdown === 'opportunityType' ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: activeDropdown === 'opportunityType'
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                color: activeDropdown === 'opportunityType'
                  ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                  : theme.text.secondary
              }}
            >
              <Award className="w-4 h-4" />
              <span className="font-medium">Opportunity</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'opportunityType' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'opportunityType' && renderOpportunityTypeDropdown()}
          </div>

          {/* Company Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'company' ? null : 'company')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${activeDropdown === 'company' ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: activeDropdown === 'company'
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                color: activeDropdown === 'company'
                  ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                  : theme.text.secondary
              }}
            >
              <Building2 className="w-4 h-4" />
              <span className="font-medium">Company</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'company' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'company' && renderCompanyDropdown()}
          </div>

          {/* ADDED: Demographic Sex Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'demographicSex' ? null : 'demographicSex')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${activeDropdown === 'demographicSex' ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: activeDropdown === 'demographicSex'
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                color: activeDropdown === 'demographicSex'
                  ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                  : theme.text.secondary
              }}
            >
              <UserCog className="w-4 h-4" />
              <span className="font-medium">Gender</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'demographicSex' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'demographicSex' && renderDemographicSexDropdown()}
          </div>

          {/* ADDED: Skills Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'skills' ? null : 'skills')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${activeDropdown === 'skills' ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: activeDropdown === 'skills'
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                color: activeDropdown === 'skills'
                  ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                  : theme.text.secondary
              }}
            >
              <Tag className="w-4 h-4" />
              <span className="font-medium">Skills</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'skills' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'skills' && renderSkillsDropdown()}
          </div>

          {/* ADDED: Featured Toggle */}
          {renderFeaturedToggle()}

          {/* ADDED: Urgent Toggle */}
          {renderUrgentToggle()}

          {/* Sort Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${activeDropdown === 'sort' ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: activeDropdown === 'sort'
                  ? themeMode === 'dark' ? '#3B82F6' : '#2563EB'
                  : theme.border.primary,
                color: activeDropdown === 'sort'
                  ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                  : theme.text.secondary
              }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="font-medium">Sort</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'sort' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'sort' && renderSortDropdown()}
          </div>

          {/* Clear all button */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80 ml-auto"
              style={{
                backgroundColor: themeMode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`
              }}
            >
              Clear All ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all"
            style={{
              backgroundColor: theme.bg.secondary,
              borderColor: theme.border.primary,
              color: theme.text.secondary
            }}
          >
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span
                className="px-1.5 py-0.5 text-xs rounded-full"
                style={{
                  backgroundColor: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
                  color: '#FFFFFF'
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-3 rounded-lg text-sm font-medium transition-all"
              style={{
                color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {(getSelectedLabels.categories.length > 0 ||
        getSelectedLabels.jobTypes.length > 0 ||
        getSelectedLabels.location ||
        getSelectedLabels.experience ||
        getSelectedLabels.workMode ||
        getSelectedLabels.workArrangement ||   // ADDED
        getSelectedLabels.education ||
        getSelectedLabels.company ||
        getSelectedLabels.opportunityType ||   // ADDED
        getSelectedLabels.demographicSex ||    // ADDED
        getSelectedLabels.skills.length > 0 || // ADDED
        getSelectedLabels.salaryMode ||
        getSelectedLabels.salary ||
        getSelectedLabels.featured ||
        getSelectedLabels.urgent) && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {getSelectedLabels.categories.map((category, idx) => (
                <FilterChip
                  key={`cat-${idx}`}
                  label={category}
                  onRemove={() => {
                    const current = filters.category;
                    let currentArray: string[] = [];
                    if (Array.isArray(current)) currentArray = current;
                    else if (typeof current === 'string') currentArray = [current];
                    const newCategories = currentArray.filter((_, i) => i !== idx);
                    handleFilterChange('category', newCategories.length > 0 ? newCategories : undefined);
                  }}
                  icon={<Target className="w-3 h-3" />}
                />
              ))}

              {getSelectedLabels.jobTypes.map((type, idx) => (
                <FilterChip
                  key={`type-${idx}`}
                  label={type}
                  onRemove={() => {
                    const current = filters.type;
                    let currentArray: string[] = [];
                    if (Array.isArray(current)) currentArray = current;
                    else if (typeof current === 'string') currentArray = [current];
                    const newTypes = currentArray.filter((_, i) => i !== idx);
                    handleFilterChange('type', newTypes.length > 0 ? newTypes : undefined);
                  }}
                  icon={<Briefcase className="w-3 h-3" />}
                />
              ))}

              {getSelectedLabels.location && (
                <FilterChip
                  label={getSelectedLabels.location}
                  onRemove={() => clearFilter('location')}
                  icon={<MapPin className="w-3 h-3" />}
                />
              )}

              {getSelectedLabels.experience && (
                <FilterChip
                  label={getSelectedLabels.experience}
                  onRemove={() => clearFilter('experienceLevel')}
                  icon={<Users className="w-3 h-3" />}
                />
              )}

              {getSelectedLabels.workMode && (
                <FilterChip
                  label={getSelectedLabels.workMode}
                  onRemove={() => clearFilter('remote')}
                  icon={<Briefcase className="w-3 h-3" />}
                />
              )}

              {/* ADDED */}
              {getSelectedLabels.workArrangement && (
                <FilterChip
                  label={getSelectedLabels.workArrangement}
                  onRemove={() => clearFilter('workArrangement')}
                  icon={<Wrench className="w-3 h-3" />}
                />
              )}

              {getSelectedLabels.education && (
                <FilterChip
                  label={getSelectedLabels.education}
                  onRemove={() => clearFilter('educationLevel')}
                  icon={<GraduationCap className="w-3 h-3" />}
                />
              )}

              {/* ADDED */}
              {getSelectedLabels.opportunityType && (
                <FilterChip
                  label={getSelectedLabels.opportunityType}
                  onRemove={() => clearFilter('opportunityType')}
                  icon={<Award className="w-3 h-3" />}
                />
              )}

              {getSelectedLabels.company && (
                <FilterChip
                  label={`Company: ${getSelectedLabels.company}`}
                  onRemove={() => {
                    clearFilter('company');
                    setCompanyInput('');
                  }}
                  icon={<Building2 className="w-3 h-3" />}
                />
              )}

              {/* ADDED */}
              {getSelectedLabels.demographicSex && (
                <FilterChip
                  label={getSelectedLabels.demographicSex}
                  onRemove={() => clearFilter('demographicSex')}
                  icon={<UserCog className="w-3 h-3" />}
                />
              )}

              {/* ADDED */}
              {getSelectedLabels.skills.map((skill, idx) => (
                <FilterChip
                  key={`skill-${idx}`}
                  label={skill}
                  onRemove={() => handleRemoveSkill(skill)}
                  icon={<Tag className="w-3 h-3" />}
                />
              ))}

              {getSelectedLabels.salaryMode && (
                <FilterChip
                  label={`Salary: ${getSelectedLabels.salaryMode}`}
                  onRemove={() => {
                    setSelectedSalaryMode(undefined);
                    clearFilter('salaryMode');
                  }}
                  icon={<DollarSign className="w-3 h-3" />}
                />
              )}

              {getSelectedLabels.salary && (
                <FilterChip
                  label={`Salary: ${getSelectedLabels.salary}`}
                  onRemove={() => {
                    setMinSalary('');
                    setMaxSalary('');
                    clearFilter('minSalary');
                    clearFilter('maxSalary');
                    clearFilter('currency');
                  }}
                  icon={<DollarSign className="w-3 h-3" />}
                />
              )}

              {getSelectedLabels.featured && (
                <FilterChip
                  label="Featured Jobs"
                  onRemove={() => clearFilter('featured')}
                  icon={<Star className="w-3 h-3" />}
                />
              )}

              {getSelectedLabels.urgent && (
                <FilterChip
                  label="Urgent Hiring"
                  onRemove={() => clearFilter('urgent')}
                  icon={<Clock className="w-3 h-3" />}
                />
              )}
            </div>
          </div>
        )}

      {/* Results Count */}
      {totalResults !== undefined && (
        <div className="mb-4">
          <p className={`text-sm ${theme.text.secondary}`}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading jobs...
              </span>
            ) : (
              <>
                <span className="font-semibold" style={{ color: theme.text.primary }}>
                  {totalResults.toLocaleString()}
                </span> jobs found
                {searchQuery && (
                  <> for `<span className="font-semibold">{searchQuery}</span>`</>
                )}
              </>
            )}
          </p>
        </div>
      )}

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet />
    </div>
  );
};

export default JobFilter;