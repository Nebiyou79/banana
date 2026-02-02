/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { colorClasses, getTheme, ThemeMode } from '@/utils/color';
import { jobService, JobFilters as JobFiltersType } from '@/services/jobService';
import { Input } from '@/components/ui/Input';
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
  salaryMode: string | null;
  salaryRange?: {
    min?: number;
    max?: number;
  };
  datePosted?: string;
  applicationsOpen?: boolean;
}

// Default filter state
const DEFAULT_FILTERS: JobFilterState = {
  search: '',
  category: null,
  types: [],
  location: null,
  experienceLevel: null,
  salaryMode: null,
  applicationsOpen: false
};

const JobFilter: React.FC<JobFilterProps> = ({
  filters = DEFAULT_FILTERS, // Provide default value
  onChange,
  onApply,
  onClear,
  isLoading = false,
  themeMode = 'light',
  className = ''
}) => {
  const theme = getTheme(themeMode);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter options
  const categories = jobService.getJobCategories();
  const regions = jobService.getEthiopianRegions();

  const jobTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const experienceLevels = [
    { value: 'entry-level', label: 'Entry Level' },
    { value: 'mid-level', label: 'Mid Level' },
    { value: 'senior-level', label: 'Senior Level' },
    { value: 'managerial', label: 'Managerial' }
  ];

  const salaryModes = [
    { value: 'range', label: 'Salary Range', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'negotiable', label: 'Negotiable', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'company-scale', label: 'Company Scale', icon: <Target className="w-4 h-4" /> }
  ];

  const dateOptions = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last week' },
    { value: '30d', label: 'Last month' }
  ];

  // Calculate active filter count - FIXED: Add safe checks
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters?.search) count++;
    if (filters?.category) count++;
    if (filters?.types?.length > 0) count++;
    if (filters?.location) count++;
    if (filters?.experienceLevel) count++;
    if (filters?.salaryMode) count++;
    if (filters?.salaryRange?.min || filters?.salaryRange?.max) count++;
    if (filters?.datePosted) count++;
    if (filters?.applicationsOpen) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Handler functions with safe checks
  const handleSearchChange = (value: string) => {
    onChange({ ...filters, search: value });
  };

  const handleCategoryChange = (value: string) => {
    onChange({ ...filters, category: value === filters.category ? null : value });
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
  };

  const handleExperienceChange = (value: string) => {
    onChange({ ...filters, experienceLevel: value === filters.experienceLevel ? null : value });
  };

  const handleSalaryModeChange = (value: string) => {
    onChange({ ...filters, salaryMode: value === filters.salaryMode ? null : value });
  };

  const handleSalaryRangeChange = (min?: number, max?: number) => {
    onChange({
      ...filters,
      salaryRange: { min, max }
    });
  };

  const handleDatePostedChange = (value: string) => {
    onChange({ ...filters, datePosted: value === filters.datePosted ? undefined : value });
  };

  const handleApplicationsOpenToggle = (checked: boolean) => {
    onChange({ ...filters, applicationsOpen: checked });
  };

  const handleClearAll = () => {
    onClear();
    setIsExpanded(false);
    setIsAdvancedOpen(false);
  };

  const handleApply = () => {
    onApply();
    if (isMobile) {
      setIsExpanded(false);
    }
  };

  // Mobile header component
  const MobileHeader = () => (
    <div className={`p-4 border-b ${colorClasses.bg.white} dark:${colorClasses.bg.darkNavy}`}
      style={{ borderColor: theme.border.primary }}>
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

  // Filter section component
  const FilterSection: React.FC<{
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, icon, children }) => (
    <div className="mb-6">
      <div className="flex items-center mb-3">
        {icon && (
          <span className="mr-2" style={{ color: theme.text.primary }}>
            {icon}
          </span>
        )}
        <h4 className="font-medium text-sm" style={{ color: theme.text.primary }}>
          {title}
        </h4>
      </div>
      {children}
    </div>
  );

  // Filter chips for active filters
  const FilterChips = () => {
    if (activeFilterCount === 0) return null;

    const chips = [];

    if (filters.search) {
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

    if (filters.salaryMode) {
      const modeLabel = salaryModes.find(m => m.value === filters.salaryMode)?.label || filters.salaryMode;
      chips.push({
        label: `Salary: ${modeLabel}`,
        onRemove: () => onChange({ ...filters, salaryMode: null })
      });
    }

    if (filters.applicationsOpen) {
      chips.push({
        label: 'Applications Open',
        onRemove: () => onChange({ ...filters, applicationsOpen: false })
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
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
          style={{ color: theme.text.muted }} />
        <Input
          type="search"
          placeholder="Search jobs, companies..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
          style={{
            backgroundColor: theme.bg.primary,
            borderColor: theme.border.primary,
            color: theme.text.primary
          }}
        />
      </div>

      {/* Active Filter Chips */}
      <FilterChips />

      {/* Category */}
      <FilterSection title="Category" icon={<Briefcase className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-2">
          {categories.slice(0, 10).map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(category.value)}
              className={`p-2 rounded-lg border text-xs text-left transition-colors ${filters.category === category.value ? 'ring-2' : ''}`}
              style={{
                backgroundColor: filters.category === category.value
                  ? theme.bg.primary
                  : theme.bg.secondary,
                borderColor: filters.category === category.value
                  ? theme.border.primary
                  : theme.border.secondary,
                color: theme.text.secondary,
              }}
            >
              {category.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Job Type */}
      <FilterSection title="Job Type" icon={<Briefcase className="w-4 h-4" />}>
        <div className="flex flex-wrap gap-2">
          {jobTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleTypeToggle(type.value)}
              className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${filters.types?.includes(type.value) ? 'ring-1' : ''}`}
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
      </FilterSection>

      {/* Location */}
      <FilterSection title="Location" icon={<MapPin className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-2">
          {regions.slice(0, 8).map((region) => (
            <button
              key={region.slug}
              onClick={() => handleLocationChange(region.slug)}
              className={`p-2 rounded-lg border text-xs text-left ${filters.location === region.slug ? 'ring-2' : ''}`}
              style={{
                backgroundColor: filters.location === region.slug
                  ? theme.bg.primary
                  : theme.bg.secondary,
                borderColor: filters.location === region.slug
                  ? theme.border.primary
                  : theme.border.secondary,
                color: theme.text.secondary,
              }}
            >
              {region.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Experience Level */}
      <FilterSection title="Experience" icon={<Target className="w-4 h-4" />}>
        <div className="flex flex-wrap gap-2">
          {experienceLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => handleExperienceChange(level.value)}
              className={`px-3 py-1.5 rounded-full border text-xs ${filters.experienceLevel === level.value ? 'ring-1' : ''}`}
              style={{
                backgroundColor: filters.experienceLevel === level.value
                  ? theme.bg.primary
                  : theme.bg.secondary,
                borderColor: filters.experienceLevel === level.value
                  ? theme.border.primary
                  : theme.border.secondary,
                color: theme.text.secondary,
              }}
            >
              {level.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Salary Mode */}
      <FilterSection title="Salary Type" icon={<DollarSign className="w-4 h-4" />}>
        <div className="flex flex-wrap gap-2">
          {salaryModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => handleSalaryModeChange(mode.value)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs ${filters.salaryMode === mode.value ? 'ring-1' : ''}`}
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
      </FilterSection>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        className="flex items-center justify-between w-full p-3 rounded-lg border mb-4"
        style={{
          backgroundColor: theme.bg.secondary,
          borderColor: theme.border.secondary
        }}
      >
        <span className="text-sm font-medium" style={{ color: theme.text.primary }}>
          More Options
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}
          style={{ color: theme.text.primary }} />
      </button>

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <div className="space-y-6 p-4 rounded-lg border"
          style={{
            backgroundColor: theme.bg.secondary,
            borderColor: theme.border.secondary
          }}>

          {/* Salary Range (only if range mode selected) */}
          {filters.salaryMode === 'range' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: theme.text.primary }}>
                  Salary Range (ETB)
                </span>
                <span className="text-sm" style={{ color: theme.text.muted }}>
                  {filters.salaryRange?.min || 0} - {filters.salaryRange?.max || 'Any'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs block mb-1" style={{ color: theme.text.muted }}>
                      Min
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.salaryRange?.min || ''}
                      onChange={(e) => handleSalaryRangeChange(
                        e.target.value ? parseInt(e.target.value) : undefined,
                        filters.salaryRange?.max
                      )}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs block mb-1" style={{ color: theme.text.muted }}>
                      Max
                    </label>
                    <Input
                      type="number"
                      placeholder="Any"
                      value={filters.salaryRange?.max || ''}
                      onChange={(e) => handleSalaryRangeChange(
                        filters.salaryRange?.min,
                        e.target.value ? parseInt(e.target.value) : undefined
                      )}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSalaryRangeChange(10000, 30000)}
                    className="text-xs px-2 py-1 rounded border"
                    style={{
                      backgroundColor: filters.salaryRange?.min === 10000 && filters.salaryRange?.max === 30000
                        ? theme.bg.primary
                        : theme.bg.secondary,
                      borderColor: theme.border.secondary,
                      color: theme.text.secondary
                    }}
                  >
                    10K-30K
                  </button>
                  <button
                    onClick={() => handleSalaryRangeChange(30000, 50000)}
                    className="text-xs px-2 py-1 rounded border"
                    style={{
                      backgroundColor: filters.salaryRange?.min === 30000 && filters.salaryRange?.max === 50000
                        ? theme.bg.primary
                        : theme.bg.secondary,
                      borderColor: theme.border.secondary,
                      color: theme.text.secondary
                    }}
                  >
                    30K-50K
                  </button>
                  <button
                    onClick={() => handleSalaryRangeChange(50000, undefined)}
                    className="text-xs px-2 py-1 rounded border"
                    style={{
                      backgroundColor: filters.salaryRange?.min === 50000
                        ? theme.bg.primary
                        : theme.bg.secondary,
                      borderColor: theme.border.secondary,
                      color: theme.text.secondary
                    }}
                  >
                    50K+
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Date Posted */}
          <div className="space-y-2">
            <span className="text-sm font-medium" style={{ color: theme.text.primary }}>
              Date Posted
            </span>
            <div className="flex flex-wrap gap-2">
              {dateOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDatePostedChange(option.value)}
                  className={`px-3 py-1.5 rounded-full border text-xs ${filters.datePosted === option.value ? 'ring-1' : ''}`}
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

          {/* Applications Open */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: theme.text.primary }} />
              <span className="text-sm" style={{ color: theme.text.primary }}>
                Only show jobs accepting applications
              </span>
            </div>
            <Switch
              checked={filters.applicationsOpen || false}
              onCheckedChange={handleApplicationsOpenToggle}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t"
        style={{ borderColor: theme.border.secondary }}>
        <Button
          variant="outline"
          onClick={handleClearAll}
          className="flex-1"
          disabled={isLoading}
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
          <DesktopFilterContent />
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

// Helper function to convert to API filters
export const buildApiFilters = (filters: JobFilterState): Partial<JobFiltersType> => {
  const apiFilters: Partial<JobFiltersType> = {};

  if (filters.search) apiFilters.search = filters.search;
  if (filters.category) apiFilters.category = filters.category;
  if (filters.types?.length > 0) apiFilters.type = filters.types.join(',');
  if (filters.location) apiFilters.region = filters.location;
  if (filters.experienceLevel) apiFilters.experienceLevel = filters.experienceLevel;
  if (filters.salaryMode) apiFilters.salaryMode = filters.salaryMode as any;

  if (filters.datePosted) {
    // Date filtering logic can be added here
  }

  if (filters.applicationsOpen) {
    apiFilters.isApplyEnabled = true;
  }

  return apiFilters;
};

export default JobFilter;