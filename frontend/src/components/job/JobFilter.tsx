/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  MapPin,
  Briefcase,
  Target,
  DollarSign,
  Calendar,
  CheckCircle,
  RefreshCw,
  Layers,
  TrendingUp,
  Handshake,
  Building,
  EyeOff,
  Clock,
  User,
  Hash
} from 'lucide-react';
import { colorClasses, getTheme, ThemeMode } from '@/utils/color';
import {
  jobService,
  JobFilters as JobFiltersType,
  SalaryMode,
  JobStatus
} from '@/services/jobService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';

interface JobFilterProps {
  filters?: JobFilterState;
  onChange: (filters: JobFilterState) => void;
  onApply: () => void;
  onClear: () => void;
  isLoading?: boolean;
  themeMode?: ThemeMode;
  className?: string;
}

export interface JobFilterState {
  search: string;
  category: string | null;
  types: string[];
  location: string | null;
  experienceLevel: string | null;
  salaryMode: SalaryMode | null;
  salaryRange?: {
    min?: number;
    max?: number;
  };
  datePosted: string | null;
  workArrangement: string | null;
  remote: string | null;
  featured?: boolean;
  urgent?: boolean;
  educationLevel?: string | null;
  candidatesNeededMin?: number;
  candidatesNeededMax?: number;
}

// Default filter state
const DEFAULT_FILTERS: JobFilterState = {
  search: '',
  category: null,
  types: [],
  location: null,
  experienceLevel: null,
  salaryMode: null,
  datePosted: null,
  workArrangement: null,
  remote: null
};

// Filter dropdown component (aligned with JobForm)
interface FilterDropdownProps {
  label: string;
  value: string | null;
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  onSelect: (value: string) => void;
  onClear?: () => void;
  searchable?: boolean;
  placeholder?: string;
  theme: any;
  themeMode: ThemeMode;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  value,
  options,
  onSelect,
  onClear,
  searchable = false,
  placeholder = 'Select...',
  theme,
  themeMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens and searchable
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, searchable]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLabel = value ? options.find(opt => opt.value === value)?.label : placeholder;
  const showClearButton = value && onClear;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 text-sm rounded-lg border flex items-center justify-between transition-colors ${isOpen ? 'ring-2 ring-offset-1' : ''
          }`}
        style={{
          backgroundColor: theme.bg.primary,
          borderColor: theme.border.primary,
          color: theme.text.primary,
          ...(isOpen ? { ringColor: themeMode === 'dark' ? '#3B82F6' : '#2563EB' } : {})
        }}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedLabel}
        </div>
        <div className="flex items-center gap-1">
          {showClearButton && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear?.();
              }}
              className="p-0.5 hover:opacity-70"
              style={{ color: theme.text.muted }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: theme.text.muted }} />
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 border rounded-lg shadow-lg"
          style={{
            backgroundColor: theme.bg.primary,
            borderColor: theme.border.primary,
            maxHeight: '300px',
            overflow: 'hidden'
          }}
        >
          {searchable && (
            <div className="p-2 border-b" style={{ borderColor: theme.border.secondary }}>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: theme.text.muted }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-sm rounded border focus:outline-none"
                  style={{
                    backgroundColor: theme.bg.secondary,
                    borderColor: theme.border.secondary,
                    color: theme.text.primary
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-3 py-2.5 text-sm text-left hover:bg-opacity-50 transition-colors flex items-center gap-2 ${value === option.value ? 'font-semibold' : ''
                    }`}
                  style={{
                    backgroundColor: value === option.value ? theme.bg.secondary : 'transparent',
                    color: theme.text.primary,
                    borderBottom: `1px solid ${theme.border.secondary}`
                  }}
                >
                  {option.icon && <span className="flex-shrink-0" style={{ color: theme.text.primary }}>{option.icon}</span>}
                  <span className="truncate">{option.label}</span>
                  {value === option.value && (
                    <CheckCircle className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: themeMode === 'dark' ? '#3B82F6' : '#2563EB' }} />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm" style={{ color: theme.text.muted }}>
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const JobFilter: React.FC<JobFilterProps> = ({
  filters = DEFAULT_FILTERS,
  onChange,
  onApply,
  onClear,
  isLoading = false,
  themeMode = 'light',
  className = ''
}) => {
  const theme = getTheme(themeMode);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options from jobService - MATCHING JobForm
  const categories = jobService.getJobCategories();
  const regions = jobService.getEthiopianRegions();
  const educationLevels = jobService.getEducationLevels();

  // Job Types - MATCHING JobForm
  const jobTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  // Experience Levels - MATCHING JobForm
  const experienceLevels = [
    { value: 'fresh-graduate', label: 'Fresh Graduate' },
    { value: 'entry-level', label: 'Entry Level' },
    { value: 'mid-level', label: 'Mid Level' },
    { value: 'senior-level', label: 'Senior Level' },
    { value: 'managerial', label: 'Managerial' },
    { value: 'director', label: 'Director' },
    { value: 'executive', label: 'Executive' }
  ];

  // Salary Mode Options - MATCHING JobForm
  const salaryModeOptions = [
    { value: SalaryMode.RANGE, label: 'Salary Range', icon: <TrendingUp className="w-4 h-4" /> },
    { value: SalaryMode.HIDDEN, label: 'Salary Hidden', icon: <EyeOff className="w-4 h-4" /> },
    { value: SalaryMode.NEGOTIABLE, label: 'Negotiable', icon: <Handshake className="w-4 h-4" /> },
    { value: SalaryMode.COMPANY_SCALE, label: 'Company Scale', icon: <Building className="w-4 h-4" /> }
  ];

  // Work Arrangement - MATCHING JobForm
  const workArrangementOptions = [
    { value: 'office', label: 'Office' },
    { value: 'field-work', label: 'Field Work' },
    { value: 'both', label: 'Both' }
  ];

  // Remote Options - MATCHING JobForm
  const remoteOptions = [
    { value: 'on-site', label: 'On-Site' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'remote', label: 'Remote' }
  ];

  // Date Options
  const dateOptions = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'all', label: 'All time' }
  ];

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters?.search && filters.search.trim() !== '') count++;
    if (filters?.category) count++;
    if (filters?.types?.length > 0) count++;
    if (filters?.location) count++;
    if (filters?.experienceLevel) count++;
    if (filters?.salaryMode) count++;
    if (filters?.salaryRange?.min !== undefined || filters?.salaryRange?.max !== undefined) count++;
    if (filters?.datePosted && filters.datePosted !== 'all') count++;
    if (filters?.workArrangement) count++;
    if (filters?.remote) count++;
    if (filters?.educationLevel) count++;
    if (filters?.candidatesNeededMin !== undefined) count++;
    if (filters?.candidatesNeededMax !== undefined) count++;
    if (filters?.featured) count++;
    if (filters?.urgent) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Handler functions - ALL FILTERS WORK TOGETHER
  const handleSearchChange = (value: string) => {
    onChange({ ...filters, search: value });
  };

  const handleSearchClear = () => {
    onChange({ ...filters, search: '' });
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleCategoryChange = (value: string) => {
    onChange({ ...filters, category: value === filters.category ? null : value });
    setActiveDropdown(null);
  };

  const handleTypeToggle = (type: string) => {
    const currentTypes = filters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    onChange({ ...filters, types: newTypes });
  };

  const handleLocationChange = (value: string) => {
    onChange({ ...filters, location: value === filters.location ? null : value });
    setActiveDropdown(null);
  };

  const handleExperienceChange = (value: string) => {
    onChange({ ...filters, experienceLevel: value === filters.experienceLevel ? null : value });
    setActiveDropdown(null);
  };

  const handleSalaryModeChange = (value: string) => {
    const salaryMode = value as SalaryMode;
    onChange({
      ...filters,
      salaryMode: salaryMode === filters.salaryMode ? null : salaryMode,
      // Clear salary range when changing from range mode
      ...(salaryMode !== SalaryMode.RANGE ? { salaryRange: undefined } : {})
    });
    setActiveDropdown(null);
  };

  const handleSalaryRangeChange = (min?: number, max?: number) => {
    onChange({
      ...filters,
      salaryRange: { min, max }
    });
  };

  const handleDatePostedChange = (value: string) => {
    onChange({ ...filters, datePosted: value === filters.datePosted ? null : value });
    setActiveDropdown(null);
  };

  const handleWorkArrangementChange = (value: string) => {
    onChange({ ...filters, workArrangement: value === filters.workArrangement ? null : value });
    setActiveDropdown(null);
  };

  const handleRemoteChange = (value: string) => {
    onChange({ ...filters, remote: value === filters.remote ? null : value });
    setActiveDropdown(null);
  };

  const handleEducationLevelChange = (value: string) => {
    onChange({ ...filters, educationLevel: value === filters.educationLevel ? null : value });
    setActiveDropdown(null);
  };

  const handleCandidatesNeededMinChange = (value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    onChange({ ...filters, candidatesNeededMin: numValue });
  };

  const handleCandidatesNeededMaxChange = (value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    onChange({ ...filters, candidatesNeededMax: numValue });
  };

  const handleFeaturedToggle = (checked: boolean) => {
    onChange({ ...filters, featured: checked });
  };

  const handleUrgentToggle = (checked: boolean) => {
    onChange({ ...filters, urgent: checked });
  };

  const handleClearAll = () => {
    onClear();
    setIsExpanded(false);
    setActiveDropdown(null);
  };

  const handleApply = () => {
    onApply();
    if (isMobile) {
      setIsExpanded(false);
    }
    setActiveDropdown(null);
  };

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Mobile header component
  const MobileHeader = () => (
    <div className={`p-4 border-b`}
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Filter className="w-5 h-5 mr-2" style={{ color: theme.text.primary }} />
          <h3 className="font-semibold" style={{ color: theme.text.primary }}>
            Filters
          </h3>
          {activeFilterCount > 0 && (
            <Badge className="ml-2" variant="secondary">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 hover:opacity-70"
          style={{ color: theme.text.primary }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // Desktop filter section component
  const DesktopFilterSection: React.FC<{
    title: string;
    dropdownId: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    hasValue?: boolean;
    onClear?: () => void;
  }> = ({ title, dropdownId, icon, children, hasValue = false, onClear }) => (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => toggleDropdown(dropdownId)}
        className="w-full p-3 rounded-lg border flex items-center justify-between hover:bg-opacity-50 transition-colors"
        style={{
          backgroundColor: theme.bg.secondary,
          borderColor: theme.border.secondary,
          color: theme.text.primary
        }}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span style={{ color: theme.text.primary }}>
              {icon}
            </span>
          )}
          <span className="font-medium text-sm">{title}</span>
          {hasValue && (
            <div className="w-2 h-2 rounded-full ml-2"
              style={{ backgroundColor: themeMode === 'dark' ? '#3B82F6' : '#2563EB' }} />
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasValue && onClear && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-1 hover:opacity-70"
              style={{ color: theme.text.muted }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === dropdownId ? 'rotate-180' : ''}`}
            style={{ color: theme.text.muted }} />
        </div>
      </button>

      {activeDropdown === dropdownId && (
        <div className="mt-2 p-4 rounded-lg border"
          style={{
            backgroundColor: theme.bg.secondary,
            borderColor: theme.border.secondary
          }}>
          {children}
        </div>
      )}
    </div>
  );

  // Filter chips for active filters
  const FilterChips = () => {
    if (activeFilterCount === 0) return null;

    const chips: Array<{ label: string; onRemove: () => void }> = [];

    if (filters.search && filters.search.trim() !== '') {
      chips.push({
        label: `Search: ${filters.search}`,
        onRemove: () => onChange({ ...filters, search: '' })
      });
    }

    if (filters.category) {
      const categoryLabel = categories.find(c => c.value === filters.category)?.label || filters.category;
      chips.push({
        label: `Category: ${categoryLabel}`,
        onRemove: () => onChange({ ...filters, category: null })
      });
    }

    if (filters.location) {
      const region = regions.find(r => r.slug === filters.location);
      chips.push({
        label: `Location: ${region?.name || filters.location}`,
        onRemove: () => onChange({ ...filters, location: null })
      });
    }

    if (filters.types?.length > 0) {
      chips.push({
        label: `Type: ${filters.types.length} selected`,
        onRemove: () => onChange({ ...filters, types: [] })
      });
    }

    if (filters.experienceLevel) {
      const expLabel = experienceLevels.find(e => e.value === filters.experienceLevel)?.label;
      chips.push({
        label: `Experience: ${expLabel}`,
        onRemove: () => onChange({ ...filters, experienceLevel: null })
      });
    }

    if (filters.salaryMode) {
      const modeLabel = salaryModeOptions.find(m => m.value === filters.salaryMode)?.label || filters.salaryMode;
      chips.push({
        label: `Salary: ${modeLabel}`,
        onRemove: () => onChange({ ...filters, salaryMode: null })
      });
    }

    if (filters.workArrangement) {
      chips.push({
        label: `Work: ${filters.workArrangement}`,
        onRemove: () => onChange({ ...filters, workArrangement: null })
      });
    }

    if (filters.datePosted && filters.datePosted !== 'all') {
      const dateLabel = dateOptions.find(d => d.value === filters.datePosted)?.label;
      chips.push({
        label: `Date: ${dateLabel}`,
        onRemove: () => onChange({ ...filters, datePosted: null })
      });
    }

    if (filters.educationLevel) {
      const eduLabel = educationLevels.find(e => e.value === filters.educationLevel)?.label;
      chips.push({
        label: `Education: ${eduLabel}`,
        onRemove: () => onChange({ ...filters, educationLevel: null })
      });
    }

    if (filters.candidatesNeededMin !== undefined || filters.candidatesNeededMax !== undefined) {
      chips.push({
        label: `Candidates: ${filters.candidatesNeededMin || 1}+`,
        onRemove: () => onChange({ ...filters, candidatesNeededMin: undefined, candidatesNeededMax: undefined })
      });
    }

    return (
      <div className="flex flex-wrap gap-2 mb-6">
        {chips.slice(0, 3).map((chip, index) => (
          <Badge
            key={index}
            variant="outline"
            className="flex items-center gap-1 pl-2 pr-1 py-1"
            style={{
              backgroundColor: theme.bg.primary,
              borderColor: theme.border.primary,
              color: theme.text.primary
            }}
          >
            {chip.label}
            <button
              onClick={chip.onRemove}
              className="ml-1 hover:opacity-70"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        {chips.length > 3 && (
          <Badge
            variant="outline"
            className="pl-2 pr-2 py-1"
            style={{
              backgroundColor: theme.bg.primary,
              borderColor: theme.border.primary,
              color: theme.text.primary
            }}
          >
            +{chips.length - 3} more
          </Badge>
        )}
      </div>
    );
  };

  // Desktop filter content
  const DesktopFilterContent = () => (
    <div className="space-y-4">
      {/* Search - FIXED: Can type full sentences without interruption */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: theme.text.muted }} />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search jobs, companies, skills..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{
            backgroundColor: theme.bg.primary,
            borderColor: theme.border.primary,
            color: theme.text.primary,
            outline: 'none'
          }}
          onKeyDown={(e) => {
            // Allow normal typing, prevent form submission
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
        />
        {filters.search && filters.search.trim() !== '' && (
          <button
            type="button"
            onClick={handleSearchClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 hover:opacity-70"
            style={{ color: theme.text.muted }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      <FilterChips />

      {/* Category Dropdown */}
      <DesktopFilterSection
        title="Category"
        dropdownId="category"
        icon={<Briefcase className="w-4 h-4" />}
        hasValue={!!filters.category}
        onClear={() => onChange({ ...filters, category: null })}
      >
        <FilterDropdown
          label="Category"
          value={filters.category}
          options={categories}
          onSelect={handleCategoryChange}
          onClear={() => onChange({ ...filters, category: null })}
          searchable={true}
          placeholder="Select category..."
          theme={theme}
          themeMode={themeMode}
        />
      </DesktopFilterSection>

      {/* Job Type Dropdown */}
      <DesktopFilterSection
        title="Job Type"
        dropdownId="jobType"
        icon={<Briefcase className="w-4 h-4" />}
        hasValue={!!filters.types?.length}
        onClear={() => onChange({ ...filters, types: [] })}
      >
        <div className="space-y-2">
          {jobTypes.map((type) => (
            <label key={type.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.types?.includes(type.value) || false}
                onChange={() => handleTypeToggle(type.value)}
                className="h-4 w-4"
                style={{
                  color: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
                  borderColor: theme.border.primary
                }}
              />
              <span className="text-sm" style={{ color: theme.text.primary }}>
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </DesktopFilterSection>

      {/* Location Dropdown */}
      <DesktopFilterSection
        title="Location"
        dropdownId="location"
        icon={<MapPin className="w-4 h-4" />}
        hasValue={!!filters.location}
        onClear={() => onChange({ ...filters, location: null })}
      >
        <FilterDropdown
          label="Location"
          value={filters.location}
          options={regions.map(r => ({ value: r.slug, label: r.name }))}
          onSelect={handleLocationChange}
          onClear={() => onChange({ ...filters, location: null })}
          searchable={true}
          placeholder="Select location..."
          theme={theme}
          themeMode={themeMode}
        />
      </DesktopFilterSection>

      {/* Experience Level Dropdown - FIXED */}
      <DesktopFilterSection
        title="Experience Level"
        dropdownId="experience"
        icon={<Target className="w-4 h-4" />}
        hasValue={!!filters.experienceLevel}
        onClear={() => onChange({ ...filters, experienceLevel: null })}
      >
        <FilterDropdown
          label="Experience Level"
          value={filters.experienceLevel}
          options={experienceLevels}
          onSelect={handleExperienceChange}
          onClear={() => onChange({ ...filters, experienceLevel: null })}
          placeholder="Select experience level..."
          theme={theme}
          themeMode={themeMode}
        />
      </DesktopFilterSection>

      {/* Salary Mode Dropdown - FIXED */}
      <DesktopFilterSection
        title="Salary Type"
        dropdownId="salaryMode"
        icon={<DollarSign className="w-4 h-4" />}
        hasValue={!!filters.salaryMode}
        onClear={() => onChange({ ...filters, salaryMode: null })}
      >
        <div className="space-y-2">
          {salaryModeOptions.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => handleSalaryModeChange(mode.value)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm flex items-center gap-2 ${filters.salaryMode === mode.value ? 'font-medium' : ''}`}
              style={{
                backgroundColor: filters.salaryMode === mode.value
                  ? theme.bg.primary
                  : 'transparent',
                borderColor: filters.salaryMode === mode.value
                  ? theme.border.primary
                  : theme.border.secondary,
                color: theme.text.primary,
              }}
            >
              <span className="flex-shrink-0" style={{ color: theme.text.primary }}>{mode.icon}</span>
              {mode.label}
              {filters.salaryMode === mode.value && (
                <CheckCircle className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: themeMode === 'dark' ? '#3B82F6' : '#2563EB' }} />
              )}
            </button>
          ))}
        </div>
      </DesktopFilterSection>

      {/* Salary Range (only if range mode selected) */}
      {filters.salaryMode === SalaryMode.RANGE && (
        <DesktopFilterSection
          title="Salary Range (ETB)"
          dropdownId="salaryRange"
          icon={<DollarSign className="w-4 h-4" />}
          hasValue={!!filters.salaryRange?.min || !!filters.salaryRange?.max}
          onClear={() => onChange({ ...filters, salaryRange: undefined })}
        >
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs block mb-1" style={{ color: theme.text.muted }}>
                    Min
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.salaryRange?.min || ''}
                    onChange={(e) => handleSalaryRangeChange(
                      e.target.value ? parseInt(e.target.value) : undefined,
                      filters.salaryRange?.max
                    )}
                    className="w-full px-3 py-2 text-sm rounded border"
                    style={{
                      backgroundColor: theme.bg.primary,
                      borderColor: theme.border.primary,
                      color: theme.text.primary
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs block mb-1" style={{ color: theme.text.muted }}>
                    Max
                  </label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={filters.salaryRange?.max || ''}
                    onChange={(e) => handleSalaryRangeChange(
                      filters.salaryRange?.min,
                      e.target.value ? parseInt(e.target.value) : undefined
                    )}
                    className="w-full px-3 py-2 text-sm rounded border"
                    style={{
                      backgroundColor: theme.bg.primary,
                      borderColor: theme.border.primary,
                      color: theme.text.primary
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </DesktopFilterSection>
      )}

      {/* Date Posted Dropdown - FIXED */}
      <DesktopFilterSection
        title="Date Posted"
        dropdownId="datePosted"
        icon={<Calendar className="w-4 h-4" />}
        hasValue={!!filters.datePosted && filters.datePosted !== 'all'}
        onClear={() => onChange({ ...filters, datePosted: null })}
      >
        <div className="space-y-2">
          {dateOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleDatePostedChange(option.value)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm flex items-center justify-between ${filters.datePosted === option.value ? 'font-medium' : ''}`}
              style={{
                backgroundColor: filters.datePosted === option.value
                  ? theme.bg.primary
                  : 'transparent',
                borderColor: filters.datePosted === option.value
                  ? theme.border.primary
                  : theme.border.secondary,
                color: theme.text.primary,
              }}
            >
              {option.label}
              {filters.datePosted === option.value && (
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: themeMode === 'dark' ? '#3B82F6' : '#2563EB' }} />
              )}
            </button>
          ))}
        </div>
      </DesktopFilterSection>

      {/* Work Arrangement Dropdown */}
      <DesktopFilterSection
        title="Work Arrangement"
        dropdownId="workArrangement"
        icon={<Layers className="w-4 h-4" />}
        hasValue={!!filters.workArrangement}
        onClear={() => onChange({ ...filters, workArrangement: null })}
      >
        <FilterDropdown
          label="Work Arrangement"
          value={filters.workArrangement}
          options={workArrangementOptions}
          onSelect={handleWorkArrangementChange}
          onClear={() => onChange({ ...filters, workArrangement: null })}
          placeholder="Select work arrangement..."
          theme={theme}
          themeMode={themeMode}
        />
      </DesktopFilterSection>

      {/* Remote Option Dropdown */}
      <DesktopFilterSection
        title="Remote Option"
        dropdownId="remote"
        icon={<MapPin className="w-4 h-4" />}
        hasValue={!!filters.remote}
        onClear={() => onChange({ ...filters, remote: null })}
      >
        <FilterDropdown
          label="Remote Option"
          value={filters.remote}
          options={remoteOptions}
          onSelect={handleRemoteChange}
          onClear={() => onChange({ ...filters, remote: null })}
          placeholder="Select remote option..."
          theme={theme}
          themeMode={themeMode}
        />
      </DesktopFilterSection>

      {/* Education Level Dropdown */}
      <DesktopFilterSection
        title="Education Level"
        dropdownId="educationLevel"
        icon={<Target className="w-4 h-4" />}
        hasValue={!!filters.educationLevel}
        onClear={() => onChange({ ...filters, educationLevel: null })}
      >
        <FilterDropdown
          label="Education Level"
          value={filters.educationLevel ?? null}
          options={educationLevels}
          onSelect={handleEducationLevelChange}
          onClear={() => onChange({ ...filters, educationLevel: null })}
          placeholder="Select education level..."
          theme={theme}
          themeMode={themeMode}
        />
      </DesktopFilterSection>

      {/* Candidates Needed */}
      <DesktopFilterSection
        title="Candidates Needed"
        dropdownId="candidates"
        icon={<Hash className="w-4 h-4" />}
        hasValue={filters.candidatesNeededMin !== undefined || filters.candidatesNeededMax !== undefined}
        onClear={() => onChange({ ...filters, candidatesNeededMin: undefined, candidatesNeededMax: undefined })}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs block mb-1" style={{ color: theme.text.muted }}>
                  Minimum
                </label>
                <input
                  type="number"
                  placeholder="1"
                  value={filters.candidatesNeededMin || ''}
                  onChange={(e) => handleCandidatesNeededMinChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded border"
                  style={{
                    backgroundColor: theme.bg.primary,
                    borderColor: theme.border.primary,
                    color: theme.text.primary
                  }}
                  min="1"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs block mb-1" style={{ color: theme.text.muted }}>
                  Maximum
                </label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.candidatesNeededMax || ''}
                  onChange={(e) => handleCandidatesNeededMaxChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded border"
                  style={{
                    backgroundColor: theme.bg.primary,
                    borderColor: theme.border.primary,
                    color: theme.text.primary
                  }}
                  min="1"
                />
              </div>
            </div>
          </div>
        </div>
      </DesktopFilterSection>

      {/* Featured & Urgent Toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg border"
          style={{
            backgroundColor: theme.bg.secondary,
            borderColor: theme.border.secondary
          }}>
          <span className="text-sm" style={{ color: theme.text.primary }}>
            Featured Jobs Only
          </span>
          <Switch
            checked={filters.featured || false}
            onCheckedChange={handleFeaturedToggle}
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border"
          style={{
            backgroundColor: theme.bg.secondary,
            borderColor: theme.border.secondary
          }}>
          <span className="text-sm" style={{ color: theme.text.primary }}>
            Urgent Jobs Only
          </span>
          <Switch
            checked={filters.urgent || false}
            onCheckedChange={handleUrgentToggle}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t"
        style={{ borderColor: theme.border.secondary }}>
        <Button
          variant="outline"
          onClick={handleClearAll}
          className="flex-1"
          disabled={isLoading || activeFilterCount === 0}
        >
          Clear All
        </Button>
        <Button
          onClick={handleApply}
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Applying...
            </>
          ) : (
            'Apply Filters'
          )}
        </Button>
      </div>
    </div>
  );

  // Mobile collapsed view
  const MobileCollapsedView = () => (
    <div className="flex items-center gap-2 p-4 border rounded-lg"
      style={{
        backgroundColor: theme.bg.primary,
        borderColor: theme.border.primary
      }}>
      <Filter className="w-5 h-5" style={{ color: theme.text.primary }} />
      <button
        onClick={() => setIsExpanded(true)}
        className="flex-1 text-left"
      >
        <div className="text-sm font-medium" style={{ color: theme.text.primary }}>
          Filter Jobs
        </div>
        <div className="text-xs" style={{ color: theme.text.muted }}>
          {activeFilterCount > 0
            ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
            : 'Tap to filter'
          }
        </div>
      </button>
      {activeFilterCount > 0 && (
        <button
          onClick={handleClearAll}
          className="text-xs px-2 py-1 rounded border"
          style={{
            backgroundColor: theme.bg.secondary,
            borderColor: theme.border.secondary,
            color: theme.text.secondary
          }}
        >
          Clear
        </button>
      )}
    </div>
  );

  // Mobile expanded view
  const MobileExpandedView = () => (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-xl max-h-[85vh] overflow-hidden">
        <MobileHeader />
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-64px)]">
          <div className="space-y-4">
            {/* Search - FIXED */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: theme.text.muted }} />
              <input
                type="text"
                placeholder="Search jobs, companies, skills..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{
                  backgroundColor: theme.bg.primary,
                  borderColor: theme.border.primary,
                  color: theme.text.primary,
                  outline: 'none'
                }}
              />
              {filters.search && filters.search.trim() !== '' && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 hover:opacity-70"
                  style={{ color: theme.text.muted }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category */}
            <div>
              <label className={`block text-sm font-medium mb-2`} style={{ color: theme.text.primary }}>
                Category
              </label>
              <FilterDropdown
                label="Category"
                value={filters.category}
                options={categories}
                onSelect={handleCategoryChange}
                onClear={() => onChange({ ...filters, category: null })}
                searchable={true}
                placeholder="Select category..."
                theme={theme}
                themeMode={themeMode}
              />
            </div>

            {/* Job Type */}
            <div>
              <label className={`block text-sm font-medium mb-2`} style={{ color: theme.text.primary }}>
                Job Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {jobTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleTypeToggle(type.value)}
                    className={`px-3 py-2 rounded-lg border text-xs ${filters.types?.includes(type.value) ? 'font-medium' : ''}`}
                    style={{
                      backgroundColor: filters.types?.includes(type.value)
                        ? theme.bg.primary
                        : theme.bg.secondary,
                      borderColor: filters.types?.includes(type.value)
                        ? theme.border.primary
                        : theme.border.secondary,
                      color: theme.text.secondary,
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className={`block text-sm font-medium mb-2`} style={{ color: theme.text.primary }}>
                Location
              </label>
              <FilterDropdown
                label="Location"
                value={filters.location}
                options={regions.map(r => ({ value: r.slug, label: r.name }))}
                onSelect={handleLocationChange}
                onClear={() => onChange({ ...filters, location: null })}
                searchable={true}
                placeholder="Select location..."
                theme={theme}
                themeMode={themeMode}
              />
            </div>

            {/* Experience Level - FIXED */}
            <div>
              <label className={`block text-sm font-medium mb-2`} style={{ color: theme.text.primary }}>
                Experience Level
              </label>
              <FilterDropdown
                label="Experience Level"
                value={filters.experienceLevel}
                options={experienceLevels}
                onSelect={handleExperienceChange}
                onClear={() => onChange({ ...filters, experienceLevel: null })}
                placeholder="Select experience level..."
                theme={theme}
                themeMode={themeMode}
              />
            </div>

            {/* Salary Mode - FIXED */}
            <div>
              <label className={`block text-sm font-medium mb-2`} style={{ color: theme.text.primary }}>
                Salary Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {salaryModeOptions.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => handleSalaryModeChange(mode.value)}
                    className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-center gap-1 ${filters.salaryMode === mode.value ? 'font-medium' : ''}`}
                    style={{
                      backgroundColor: filters.salaryMode === mode.value
                        ? theme.bg.primary
                        : theme.bg.secondary,
                      borderColor: filters.salaryMode === mode.value
                        ? theme.border.primary
                        : theme.border.secondary,
                      color: theme.text.secondary,
                    }}
                  >
                    {mode.icon}
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Posted - FIXED */}
            <div>
              <label className={`block text-sm font-medium mb-2`} style={{ color: theme.text.primary }}>
                Date Posted
              </label>
              <div className="grid grid-cols-2 gap-2">
                {dateOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDatePostedChange(option.value)}
                    className={`px-3 py-2 rounded-lg border text-xs ${filters.datePosted === option.value ? 'font-medium' : ''}`}
                    style={{
                      backgroundColor: filters.datePosted === option.value
                        ? theme.bg.primary
                        : theme.bg.secondary,
                      borderColor: filters.datePosted === option.value
                        ? theme.border.primary
                        : theme.border.secondary,
                      color: theme.text.secondary,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t"
              style={{ borderColor: theme.border.secondary }}>
              <Button
                variant="outline"
                onClick={handleClearAll}
                className="flex-1"
                disabled={isLoading || activeFilterCount === 0}
              >
                Clear All
              </Button>
              <Button
                onClick={handleApply}
                className="flex-1"
                disabled={isLoading}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render based on screen size
  if (!isMobile) {
    return (
      <div className={`rounded-lg border p-4 ${className}`}
        style={{
          borderColor: theme.border.primary,
          backgroundColor: theme.bg.primary
        }}>
        <DesktopFilterContent />
      </div>
    );
  }

  // Mobile view
  return (
    <div className={className}>
      {!isExpanded && <MobileCollapsedView />}
      {isExpanded && <MobileExpandedView />}
    </div>
  );
};

// Helper function to convert to API filters - MATCHING jobService types
export const buildApiFilters = (filters: JobFilterState): Partial<JobFiltersType> => {
  const apiFilters: Partial<JobFiltersType> = {};

  if (filters.search && filters.search.trim() !== '') apiFilters.search = filters.search;
  if (filters.category) apiFilters.category = filters.category;
  if (filters.types?.length > 0) apiFilters.type = filters.types.join(',');
  if (filters.location) apiFilters.region = filters.location;
  if (filters.experienceLevel) apiFilters.experienceLevel = filters.experienceLevel;
  if (filters.salaryMode) apiFilters.salaryMode = filters.salaryMode;
  if (filters.salaryRange?.min !== undefined) apiFilters.minSalary = filters.salaryRange.min;
  if (filters.salaryRange?.max !== undefined) apiFilters.maxSalary = filters.salaryRange.max;
  if (filters.workArrangement) apiFilters.workArrangement = filters.workArrangement;
  if (filters.remote) apiFilters.remote = filters.remote;
  if (filters.educationLevel) apiFilters.educationLevel = filters.educationLevel;
  if (filters.featured) apiFilters.featured = true;
  if (filters.urgent) apiFilters.urgent = true;
  if (filters.candidatesNeededMin !== undefined) apiFilters.candidatesNeededMin = filters.candidatesNeededMin;
  if (filters.candidatesNeededMax !== undefined) apiFilters.candidatesNeededMax = filters.candidatesNeededMax;

  // Date posted filter
  if (filters.datePosted && filters.datePosted !== 'all') {
    // You would add date filtering logic here based on your API
    // Example: apiFilters.createdAfter = getDateFromOption(filters.datePosted);
  }

  return apiFilters;
};

export default JobFilter;