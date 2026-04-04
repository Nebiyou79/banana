/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tenders/FreelanceTenderFilter.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronDown,
  Clock,
  DollarSign,
  Award,
  Briefcase,
  Globe,
  Shield,
  FolderOpen,
  TrendingUp,
  Zap,
  Sparkles,
  Users,
  Tag,
  Loader2,
  Check,
  Filter
} from 'lucide-react';
import { getTheme, ThemeMode } from '@/utils/color';
import { FreelanceTenderFilter, EngagementType, ExperienceLevel, ProjectType, Currency } from '@/services/tenderService';
import FilterDropdown from '@/components/ui/FilterDropdown';

// Custom debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

interface FreelanceTenderFiltersProps {
  filters: FreelanceTenderFilter;
  onFiltersChange: (filters: Partial<FreelanceTenderFilter>) => void;
  totalCount?: number;
  isLoading?: boolean;
  className?: string;
  themeMode?: ThemeMode;
}

// Filter presets
const FILTER_PRESETS = [
  {
    id: 'high-budget',
    name: 'High Budget',
    icon: <TrendingUp className="w-4 h-4" />,
    filters: { minBudget: 5000 },
    description: 'Projects > $5,000',
  },
  {
    id: 'urgent',
    name: 'Urgent',
    icon: <Zap className="w-4 h-4" />,
    filters: { urgency: 'urgent' },
    description: 'Immediate start',
  },
  {
    id: 'entry-level',
    name: 'Entry Level',
    icon: <Users className="w-4 h-4" />,
    filters: { experienceLevel: 'entry' },
    description: 'Great for beginners',
  },
  {
    id: 'hourly',
    name: 'Hourly',
    icon: <Clock className="w-4 h-4" />,
    filters: { engagementType: 'hourly' },
    description: 'Hourly engagements',
  },
  {
    id: 'fixed-price',
    name: 'Fixed Price',
    icon: <DollarSign className="w-4 h-4" />,
    filters: { engagementType: 'fixed_price' },
    description: 'Fixed price projects',
  },
];

const engagementTypes = [
  { value: 'fixed_price', label: 'Fixed Price' },
  { value: 'hourly', label: 'Hourly' },
];

const experienceLevels = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

const projectTypes = [
  { value: 'one_time', label: 'One-time' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'complex', label: 'Complex' },
];

const languages = [
  'English', 'Spanish', 'French', 'German', 'Chinese', 'Arabic', 'Portuguese', 'Russian', 'Japanese'
];

const currencies = ['USD', 'EUR', 'GBP', 'ETB'];

const FreelanceTenderFilters: React.FC<FreelanceTenderFiltersProps> = ({
  filters,
  onFiltersChange,
  totalCount,
  isLoading = false,
  className = '',
  themeMode = 'light',
}) => {
  const theme = getTheme(themeMode);

  // Track if we're in the middle of a filter change to prevent loops
  const isUpdatingRef = useRef(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Dropdown state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Mobile state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);

  // Budget state - using temporary values to prevent auto-submit
  const [tempMinBudget, setTempMinBudget] = useState(filters.minBudget?.toString() || '');
  const [tempMaxBudget, setTempMaxBudget] = useState(filters.maxBudget?.toString() || '');
  const [currency, setCurrency] = useState<Currency>((filters.currency as Currency) || 'USD');

  // Skills state
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    Array.isArray(filters.skills) ? filters.skills : []
  );
  const [skillSearch, setSkillSearch] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  // Mock skills data (replace with actual data from API)
  const availableSkills = useMemo(() => [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'UI/UX', 'Graphic Design',
    'Content Writing', 'SEO', 'Digital Marketing', 'Mobile Development', 'AWS',
    'DevOps', 'Data Science', 'Machine Learning', 'Blockchain', 'Smart Contracts',
    'Solidity', 'Rust', 'Go', 'Ruby on Rails', 'PHP', 'Laravel', 'Vue.js', 'Angular'
  ], []);

  const filteredSkills = useMemo(() => {
    if (!skillSearch) return availableSkills.slice(0, 15);
    return availableSkills
      .filter(skill => skill.toLowerCase().includes(skillSearch.toLowerCase()))
      .slice(0, 15);
  }, [availableSkills, skillSearch]);

  // Handle search changes - CRITICAL: Don't set page:1 here, let the hook handle it
  useEffect(() => {
    if (isUpdatingRef.current) return;
    if (debouncedSearch !== filters.search) {
      isUpdatingRef.current = true;
      onFiltersChange({ search: debouncedSearch || undefined });
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [debouncedSearch, filters.search, onFiltersChange]);

  // Handle budget apply - CRITICAL: Don't set page:1 explicitly
  const handleApplyBudget = useCallback(() => {
    const min = tempMinBudget ? Number(tempMinBudget) : undefined;
    const max = tempMaxBudget ? Number(tempMaxBudget) : undefined;
    
    // Validate: min should be less than max if both provided
    if (min && max && min > max) {
      // Swap values
      onFiltersChange({
        minBudget: max,
        maxBudget: min,
        currency,
      });
    } else {
      onFiltersChange({
        minBudget: min,
        maxBudget: max,
        currency,
      });
    }
    setActiveDropdown(null);
  }, [tempMinBudget, tempMaxBudget, currency, onFiltersChange]);

  const handleArrayFilterChange = useCallback((key: keyof FreelanceTenderFilter, value: string) => {
    const current = filters[key];
    let currentArray: string[] = [];

    if (Array.isArray(current)) {
      currentArray = current as string[];
    }

    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];

    // CRITICAL: Don't set page:1 explicitly
    onFiltersChange({
      [key]: newArray.length > 0 ? newArray : undefined,
    });

    if (key === 'skills') {
      setSelectedSkills(newArray);
    }
  }, [filters, onFiltersChange]);

  const handleSkillToggle = useCallback((skill: string) => {
    handleArrayFilterChange('skills', skill);
  }, [handleArrayFilterChange]);

  const clearFilter = useCallback((key: keyof FreelanceTenderFilter) => {
    // CRITICAL: Don't set page:1 explicitly
    onFiltersChange({ [key]: undefined });

    // Update local state
    if (key === 'minBudget' || key === 'maxBudget') {
      setTempMinBudget('');
      setTempMaxBudget('');
    } else if (key === 'skills') {
      setSelectedSkills([]);
    } else if (key === 'search') {
      setSearchQuery('');
    }
  }, [onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setTempMinBudget('');
    setTempMaxBudget('');
    setSelectedSkills([]);
    setCurrency('USD');
    
    // CRITICAL: Don't set page:1 explicitly, let the hook handle it
    onFiltersChange({
      search: undefined,
      engagementType: undefined,
      minBudget: undefined,
      maxBudget: undefined,
      currency: undefined,
      experienceLevel: undefined,
      projectType: undefined,
      skills: undefined,
      urgency: undefined,
      ndaRequired: undefined,
      portfolioRequired: undefined,
      languagePreference: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      procurementCategory: undefined,
    });
  }, [onFiltersChange]);

  const applyPreset = useCallback((presetFilters: Partial<FreelanceTenderFilter>) => {
    // CRITICAL: Don't set page:1 explicitly
    onFiltersChange(presetFilters);
    setShowPresets(false);

    if (presetFilters.minBudget) {
      setTempMinBudget(presetFilters.minBudget.toString());
    }
  }, [onFiltersChange]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.engagementType) count++;
    if (filters.minBudget) count++;
    if (filters.maxBudget) count++;
    if (filters.experienceLevel) count++;
    if (filters.projectType) count++;
    if (filters.skills?.length) count += filters.skills.length;
    if (filters.urgency) count++;
    if (filters.ndaRequired) count++;
    if (filters.portfolioRequired) count++;
    if (filters.languagePreference) count++;
    if (filters.procurementCategory) count++;
    return count;
  }, [filters]);

  const isSelected = useCallback((key: keyof FreelanceTenderFilter, value: string): boolean => {
    const current = filters[key];
    if (!current) return false;
    if (Array.isArray(current)) return (current as string[]).includes(value);
    return (current as any) === value;
  }, [filters]);

  // Render functions for dropdowns (unchanged, but remove page:1 from onClick handlers)
  const renderEngagementDropdown = () => (
    <div className="p-4">
      <div className="space-y-1">
        {engagementTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => {
              // CRITICAL: Don't set page:1 explicitly
              onFiltersChange({ engagementType: type.value as EngagementType });
              setActiveDropdown(null);
            }}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:opacity-80 transition-colors"
            style={{
              backgroundColor: filters.engagementType === type.value
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: filters.engagementType === type.value
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{type.label}</span>
            {filters.engagementType === type.value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderExperienceDropdown = () => (
    <div className="p-4">
      <div className="space-y-1">
        {experienceLevels.map((level) => (
          <button
            key={level.value}
            onClick={() => {
              // CRITICAL: Don't set page:1 explicitly
              onFiltersChange({ experienceLevel: level.value as ExperienceLevel });
              setActiveDropdown(null);
            }}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:opacity-80 transition-colors"
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

  const renderProjectTypeDropdown = () => (
    <div className="p-4">
      <div className="space-y-1">
        {projectTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => {
              // CRITICAL: Don't set page:1 explicitly
              onFiltersChange({ projectType: type.value as ProjectType });
              setActiveDropdown(null);
            }}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:opacity-80 transition-colors"
            style={{
              backgroundColor: filters.projectType === type.value
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: filters.projectType === type.value
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{type.label}</span>
            {filters.projectType === type.value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderBudgetDropdown = () => (
    <>
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Budget Range</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-xs font-medium ${theme.text.secondary} mb-1`}>Minimum ($)</label>
            <input
              type="number"
              value={tempMinBudget}
              onChange={(e) => setTempMinBudget(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
              style={{
                backgroundColor: theme.bg.secondary,
                border: `1px solid ${theme.border.primary}`,
                color: theme.text.primary
              }}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium ${theme.text.secondary} mb-1`}>Maximum ($)</label>
            <input
              type="number"
              value={tempMaxBudget}
              onChange={(e) => setTempMaxBudget(e.target.value)}
              placeholder="Any"
              min="0"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
              style={{
                backgroundColor: theme.bg.secondary,
                border: `1px solid ${theme.border.primary}`,
                color: theme.text.primary
              }}
            />
          </div>
        </div>

        <div>
          <label className={`block text-xs font-medium ${theme.text.secondary} mb-1`}>Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.bg.secondary,
              border: `1px solid ${theme.border.primary}`,
              color: theme.text.primary
            }}
          >
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="p-4 border-t flex justify-between" style={{ borderColor: theme.border.secondary }}>
        <button
          onClick={() => {
            setTempMinBudget('');
            setTempMaxBudget('');
            clearFilter('minBudget');
            clearFilter('maxBudget');
            setActiveDropdown(null);
          }}
          className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors hover:opacity-80"
          style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}
        >
          Clear
        </button>
        <button
          onClick={handleApplyBudget}
          className="px-4 py-1.5 text-sm rounded-lg font-medium text-white"
          style={{ backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB' }}
        >
          Apply
        </button>
      </div>
    </>
  );

  const renderSkillsDropdown = () => (
    <>
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Skills</h3>
        <p className={`text-xs ${theme.text.muted} mt-0.5`}>Select one or more skills</p>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: theme.text.muted }} />
          <input
            type="text"
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            placeholder="Search skills..."
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
        {filteredSkills.length > 0 ? (
          <div className="space-y-1">
            {filteredSkills.map((skill) => (
              <label
                key={skill}
                className="flex items-center gap-3 p-2 rounded-lg hover:cursor-pointer transition-colors"
                style={{
                  backgroundColor: selectedSkills.includes(skill)
                    ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                    : 'transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedSkills.includes(skill)}
                  onChange={() => handleSkillToggle(skill)}
                  className="w-4 h-4 rounded focus:ring-2 focus:ring-offset-2"
                  style={{
                    color: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
                    borderColor: theme.border.primary
                  }}
                />
                <span className={`text-sm flex-1 ${theme.text.primary}`}>{skill}</span>
                {selectedSkills.includes(skill) && (
                  <Check className="w-4 h-4" style={{ color: themeMode === 'dark' ? '#3B82F6' : '#2563EB' }} />
                )}
              </label>
            ))}
          </div>
        ) : (
          <div className={`py-8 text-center text-sm ${theme.text.muted}`}>No skills found</div>
        )}
      </div>

      <div className="p-4 border-t flex justify-between" style={{ borderColor: theme.border.secondary }}>
        <button
          onClick={() => {
            setSelectedSkills([]);
            clearFilter('skills');
            setSkillSearch('');
          }}
          className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors hover:opacity-80"
          style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}
        >
          Clear
        </button>
        <button
          onClick={() => setActiveDropdown(null)}
          className="px-4 py-1.5 text-sm rounded-lg font-medium text-white"
          style={{ backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB' }}
        >
          Apply
        </button>
      </div>
    </>
  );

  const renderLanguageDropdown = () => (
    <div className="p-4">
      <div className="max-h-64 overflow-y-auto space-y-1">
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => {
              // CRITICAL: Don't set page:1 explicitly
              onFiltersChange({ languagePreference: lang === 'any' ? undefined : lang });
              setActiveDropdown(null);
            }}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:opacity-80 transition-colors"
            style={{
              backgroundColor: filters.languagePreference === lang
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: filters.languagePreference === lang
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{lang}</span>
            {filters.languagePreference === lang && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  const FilterChip = ({ label, onRemove, icon }: { label: string; onRemove: () => void; icon?: React.ReactNode }) => (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all hover:opacity-80 cursor-pointer"
      style={{
        backgroundColor: themeMode === 'dark' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
        color: themeMode === 'dark' ? '#93C5FD' : '#2563EB',
        border: `1px solid ${themeMode === 'dark' ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`
      }}
      onClick={onRemove}
    >
      {icon}
      <span className="truncate max-w-[200px]">{label}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="ml-0.5 p-0.5 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );

  const MobileFilterSheet = () => {
    if (!isMobileFilterOpen) return null;

    const mobileSections = [
      { id: 'engagement', icon: <Briefcase className="w-5 h-5" />, label: 'Engagement Type' },
      { id: 'experience', icon: <Award className="w-5 h-5" />, label: 'Experience' },
      { id: 'projectType', icon: <FolderOpen className="w-5 h-5" />, label: 'Project Type' },
      { id: 'budget', icon: <DollarSign className="w-5 h-5" />, label: 'Budget' },
      { id: 'skills', icon: <Tag className="w-5 h-5" />, label: 'Skills' },
      { id: 'language', icon: <Globe className="w-5 h-5" />, label: 'Language' },
    ];

    return (
      <div className="fixed inset-0 z-50 lg:hidden">
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
        
        <div 
          className="absolute bottom-0 left-0 right-0 rounded-t-2xl shadow-2xl max-h-[90vh] overflow-hidden transition-transform duration-300 ease-out"
          style={{ 
            backgroundColor: theme.bg.primary,
            transform: isMobileFilterOpen ? 'translateY(0)' : 'translateY(100%)'
          }}
        >
          <div 
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: theme.border.secondary }}
          >
            <h3 className="text-lg font-semibold" style={{ color: theme.text.primary }}>
              {mobileSection ? 'Back to Filters' : 'Filters'}
            </h3>
            <button
              onClick={() => {
                if (mobileSection) {
                  setMobileSection(null);
                } else {
                  setIsMobileFilterOpen(false);
                }
              }}
              className="p-2 rounded-full transition-colors"
              style={{ 
                backgroundColor: theme.bg.secondary,
                color: theme.text.primary
              }}
            >
              {mobileSection ? (
                <ChevronDown className="w-5 h-5 rotate-180" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </button>
          </div>

          <div 
            className="overflow-y-auto p-4"
            style={{ 
              maxHeight: 'calc(90vh - 120px)',
              backgroundColor: theme.bg.primary
            }}
          >
            {!mobileSection ? (
              <div className="space-y-3">
                {mobileSections.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMobileSection(item.id)}
                    className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                    style={{ 
                      backgroundColor: theme.bg.secondary, 
                      borderColor: theme.border.primary,
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span style={{ color: theme.text.primary }}>
                        {item.icon}
                      </span>
                      <span className="font-medium" style={{ color: theme.text.primary }}>
                        {item.label}
                      </span>
                    </span>
                    <ChevronDown 
                      className="w-5 h-5 transition-transform -rotate-90" 
                      style={{ color: theme.text.muted }}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-semibold text-base" style={{ color: theme.text.primary }}>
                  {mobileSections.find(s => s.id === mobileSection)?.label}
                </h4>
                
                {mobileSection === 'engagement' && (
                  <div className="space-y-2">
                    {engagementTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          onFiltersChange({ engagementType: type.value as EngagementType });
                          setMobileSection(null);
                          setIsMobileFilterOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
                        style={{
                          backgroundColor: filters.engagementType === type.value
                            ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                            : theme.bg.secondary,
                        }}
                      >
                        <span style={{ 
                          color: filters.engagementType === type.value
                            ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                            : theme.text.primary 
                        }}>
                          {type.label}
                        </span>
                        {filters.engagementType === type.value && (
                          <Check className="w-4 h-4" style={{ 
                            color: themeMode === 'dark' ? '#93C5FD' : '#2563EB' 
                          }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {mobileSection === 'experience' && (
                  <div className="space-y-2">
                    {experienceLevels.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => {
                          onFiltersChange({ experienceLevel: level.value as ExperienceLevel });
                          setMobileSection(null);
                          setIsMobileFilterOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
                        style={{
                          backgroundColor: filters.experienceLevel === level.value
                            ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                            : theme.bg.secondary,
                        }}
                      >
                        <span style={{ 
                          color: filters.experienceLevel === level.value
                            ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                            : theme.text.primary 
                        }}>
                          {level.label}
                        </span>
                        {filters.experienceLevel === level.value && (
                          <Check className="w-4 h-4" style={{ 
                            color: themeMode === 'dark' ? '#93C5FD' : '#2563EB' 
                          }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {mobileSection === 'projectType' && (
                  <div className="space-y-2">
                    {projectTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          onFiltersChange({ projectType: type.value as ProjectType });
                          setMobileSection(null);
                          setIsMobileFilterOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
                        style={{
                          backgroundColor: filters.projectType === type.value
                            ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                            : theme.bg.secondary,
                        }}
                      >
                        <span style={{ 
                          color: filters.projectType === type.value
                            ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                            : theme.text.primary 
                        }}>
                          {type.label}
                        </span>
                        {filters.projectType === type.value && (
                          <Check className="w-4 h-4" style={{ 
                            color: themeMode === 'dark' ? '#93C5FD' : '#2563EB' 
                          }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {mobileSection === 'budget' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.text.secondary }}>
                        Minimum Budget ($)
                      </label>
                      <input
                        type="number"
                        value={tempMinBudget}
                        onChange={(e) => setTempMinBudget(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="w-full px-4 py-3 text-base rounded-lg placeholder-gray-400"
                        style={{
                          backgroundColor: theme.bg.secondary,
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.text.secondary }}>
                        Maximum Budget ($)
                      </label>
                      <input
                        type="number"
                        value={tempMaxBudget}
                        onChange={(e) => setTempMaxBudget(e.target.value)}
                        placeholder="Any"
                        min="0"
                        className="w-full px-4 py-3 text-base rounded-lg placeholder-gray-400"
                        style={{
                          backgroundColor: theme.bg.secondary,
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.text.secondary }}>
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as Currency)}
                        className="w-full px-4 py-3 text-base rounded-lg"
                        style={{
                          backgroundColor: theme.bg.secondary,
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary
                        }}
                      >
                        {currencies.map(curr => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        handleApplyBudget();
                        setMobileSection(null);
                        setIsMobileFilterOpen(false);
                      }}
                      className="w-full px-4 py-3 rounded-lg font-medium text-white mt-4"
                      style={{ backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB' }}
                    >
                      Apply Budget
                    </button>
                  </div>
                )}

                {mobileSection === 'skills' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: theme.text.muted }} />
                      <input
                        type="text"
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                        placeholder="Search skills..."
                        className="w-full pl-9 pr-3 py-3 text-base rounded-lg placeholder-gray-400"
                        style={{
                          backgroundColor: theme.bg.secondary,
                          border: `1px solid ${theme.border.primary}`,
                          color: theme.text.primary
                        }}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {filteredSkills.map((skill) => (
                        <label
                          key={skill}
                          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                          style={{
                            backgroundColor: selectedSkills.includes(skill)
                              ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                              : theme.bg.secondary
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSkills.includes(skill)}
                            onChange={() => handleSkillToggle(skill)}
                            className="w-4 h-4 rounded"
                          />
                          <span className="flex-1" style={{ 
                            color: selectedSkills.includes(skill)
                              ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                              : theme.text.primary 
                          }}>
                            {skill}
                          </span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setMobileSection(null);
                        setIsMobileFilterOpen(false);
                      }}
                      className="w-full px-4 py-3 rounded-lg font-medium text-white"
                      style={{ backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB' }}
                    >
                      Apply Skills
                    </button>
                  </div>
                )}

                {mobileSection === 'language' && (
                  <div className="space-y-2">
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          onFiltersChange({ languagePreference: lang });
                          setMobileSection(null);
                          setIsMobileFilterOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
                        style={{
                          backgroundColor: filters.languagePreference === lang
                            ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                            : theme.bg.secondary,
                        }}
                      >
                        <span style={{ 
                          color: filters.languagePreference === lang
                            ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                            : theme.text.primary 
                        }}>
                          {lang}
                        </span>
                        {filters.languagePreference === lang && (
                          <Check className="w-4 h-4" style={{ 
                            color: themeMode === 'dark' ? '#93C5FD' : '#2563EB' 
                          }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

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
                View Results
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
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
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or skills..."
            className="w-full pl-12 pr-12 py-4 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
            style={{
              backgroundColor: theme.bg.primary,
              border: `2px solid ${theme.border.primary}`,
              color: theme.text.primary
            }}
          />

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-70"
            >
              <X className="w-5 h-5" style={{ color: theme.text.muted }} />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden lg:block mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* Presets Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200"
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: showPresets ? (themeMode === 'dark' ? '#3B82F6' : '#2563EB') : theme.border.primary,
                color: showPresets ? (themeMode === 'dark' ? '#93C5FD' : '#2563EB') : theme.text.secondary
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Presets</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
            </button>

            {showPresets && (
              <div
                className="absolute top-full left-0 mt-2 w-64 rounded-xl shadow-2xl border z-50 p-2"
                style={{
                  backgroundColor: theme.bg.primary,
                  borderColor: theme.border.primary
                }}
              >
                {FILTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.filters as Partial<FreelanceTenderFilter>)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition-colors text-left"
                    style={{
                      backgroundColor: theme.bg.secondary,
                    }}
                  >
                    <div className="p-2 rounded-lg" style={{ backgroundColor: themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF' }}>
                      {preset.icon}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${theme.text.primary}`}>{preset.name}</p>
                      <p className={`text-xs ${theme.text.muted}`}>{preset.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Engagement Type Dropdown */}
          <FilterDropdown
            label="Engagement"
            icon={<Briefcase className="w-4 h-4" />}
            isOpen={activeDropdown === 'engagement'}
            onToggle={() => setActiveDropdown(activeDropdown === 'engagement' ? null : 'engagement')}
            onClose={() => setActiveDropdown(null)}
            themeMode={themeMode}
            width="w-56"
            active={!!filters.engagementType}
          >
            {renderEngagementDropdown()}
          </FilterDropdown>

          {/* Experience Dropdown */}
          <FilterDropdown
            label="Experience"
            icon={<Award className="w-4 h-4" />}
            isOpen={activeDropdown === 'experience'}
            onToggle={() => setActiveDropdown(activeDropdown === 'experience' ? null : 'experience')}
            onClose={() => setActiveDropdown(null)}
            themeMode={themeMode}
            width="w-56"
            active={!!filters.experienceLevel}
          >
            {renderExperienceDropdown()}
          </FilterDropdown>

          {/* Project Type Dropdown */}
          <FilterDropdown
            label="Project Type"
            icon={<FolderOpen className="w-4 h-4" />}
            isOpen={activeDropdown === 'projectType'}
            onToggle={() => setActiveDropdown(activeDropdown === 'projectType' ? null : 'projectType')}
            onClose={() => setActiveDropdown(null)}
            themeMode={themeMode}
            width="w-64"
            active={!!filters.projectType}
          >
            {renderProjectTypeDropdown()}
          </FilterDropdown>

          {/* Budget Dropdown */}
          <FilterDropdown
            label="Budget"
            icon={<DollarSign className="w-4 h-4" />}
            isOpen={activeDropdown === 'budget'}
            onToggle={() => setActiveDropdown(activeDropdown === 'budget' ? null : 'budget')}
            onClose={() => setActiveDropdown(null)}
            themeMode={themeMode}
            width="w-80"
            active={!!filters.minBudget || !!filters.maxBudget}
          >
            {renderBudgetDropdown()}
          </FilterDropdown>

          {/* Skills Dropdown */}
          <FilterDropdown
            label="Skills"
            icon={<Tag className="w-4 h-4" />}
            isOpen={activeDropdown === 'skills'}
            onToggle={() => setActiveDropdown(activeDropdown === 'skills' ? null : 'skills')}
            onClose={() => setActiveDropdown(null)}
            themeMode={themeMode}
            width="w-80"
            active={selectedSkills.length > 0}
          >
            {renderSkillsDropdown()}
          </FilterDropdown>

          {/* Language Dropdown */}
          <FilterDropdown
            label="Language"
            icon={<Globe className="w-4 h-4" />}
            isOpen={activeDropdown === 'language'}
            onToggle={() => setActiveDropdown(activeDropdown === 'language' ? null : 'language')}
            onClose={() => setActiveDropdown(null)}
            themeMode={themeMode}
            width="w-64"
            active={!!filters.languagePreference}
          >
            {renderLanguageDropdown()}
          </FilterDropdown>

          {/* Requirements Buttons */}
          <button
            onClick={() => onFiltersChange({ ndaRequired: !filters.ndaRequired })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
              filters.ndaRequired ? 'ring-2 ring-offset-2' : ''
            }`}
            style={{
              backgroundColor: theme.bg.secondary,
              borderColor: filters.ndaRequired
                ? (themeMode === 'dark' ? '#3B82F6' : '#2563EB')
                : theme.border.primary,
              color: filters.ndaRequired
                ? (themeMode === 'dark' ? '#93C5FD' : '#2563EB')
                : theme.text.secondary
            }}
          >
            <Shield className="w-4 h-4" />
            <span className="font-medium">NDA</span>
          </button>

          <button
            onClick={() => onFiltersChange({ urgency: filters.urgency === 'urgent' ? undefined : 'urgent' })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
              filters.urgency === 'urgent' ? 'ring-2 ring-offset-2' : ''
            }`}
            style={{
              backgroundColor: theme.bg.secondary,
              borderColor: filters.urgency === 'urgent'
                ? (themeMode === 'dark' ? '#F59E0B' : '#F59E0B')
                : theme.border.primary,
              color: filters.urgency === 'urgent'
                ? (themeMode === 'dark' ? '#FCD34D' : '#B45309')
                : theme.text.secondary
            }}
          >
            <Zap className="w-4 h-4" />
            <span className="font-medium">Urgent</span>
          </button>

          {/* Clear All Button */}
          {activeFilterCount > 0 && (
            <button
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
                className="px-1.5 py-0.5 text-xs rounded-full text-white"
                style={{ backgroundColor: themeMode === 'dark' ? '#3B82F6' : '#2563EB' }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
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
      {(filters.engagementType || filters.experienceLevel || filters.projectType || 
        filters.minBudget || filters.maxBudget || selectedSkills.length > 0 || 
        filters.languagePreference || filters.ndaRequired || filters.urgency === 'urgent') && (
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {filters.engagementType && (
              <FilterChip
                label={`Engagement: ${engagementTypes.find(t => t.value === filters.engagementType)?.label || filters.engagementType}`}
                onRemove={() => clearFilter('engagementType')}
                icon={<Briefcase className="w-3 h-3" />}
              />
            )}

            {filters.experienceLevel && (
              <FilterChip
                label={`Exp: ${experienceLevels.find(l => l.value === filters.experienceLevel)?.label || filters.experienceLevel}`}
                onRemove={() => clearFilter('experienceLevel')}
                icon={<Award className="w-3 h-3" />}
              />
            )}

            {filters.projectType && (
              <FilterChip
                label={`Project: ${projectTypes.find(t => t.value === filters.projectType)?.label || filters.projectType}`}
                onRemove={() => clearFilter('projectType')}
                icon={<FolderOpen className="w-3 h-3" />}
              />
            )}

            {filters.minBudget && (
              <FilterChip
                label={`Min: $${Number(filters.minBudget).toLocaleString()}`}
                onRemove={() => clearFilter('minBudget')}
                icon={<DollarSign className="w-3 h-3" />}
              />
            )}

            {filters.maxBudget && (
              <FilterChip
                label={`Max: $${Number(filters.maxBudget).toLocaleString()}`}
                onRemove={() => clearFilter('maxBudget')}
                icon={<DollarSign className="w-3 h-3" />}
              />
            )}

            {selectedSkills.map((skill) => (
              <FilterChip
                key={skill}
                label={skill}
                onRemove={() => handleSkillToggle(skill)}
                icon={<Tag className="w-3 h-3" />}
              />
            ))}

            {filters.languagePreference && (
              <FilterChip
                label={`Language: ${filters.languagePreference}`}
                onRemove={() => clearFilter('languagePreference')}
                icon={<Globe className="w-3 h-3" />}
              />
            )}

            {filters.ndaRequired && (
              <FilterChip
                label="NDA Required"
                onRemove={() => clearFilter('ndaRequired')}
                icon={<Shield className="w-3 h-3" />}
              />
            )}

            {filters.urgency === 'urgent' && (
              <FilterChip
                label="Urgent"
                onRemove={() => clearFilter('urgency')}
                icon={<Zap className="w-3 h-3" />}
              />
            )}
          </div>
        </div>
      )}

      {/* Results Count */}
      {totalCount !== undefined && (
        <div className="mb-4">
          <p className={`text-sm ${theme.text.secondary}`}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading projects...
              </span>
            ) : (
              <>
                <span className="font-semibold" style={{ color: theme.text.primary }}>
                  {totalCount.toLocaleString()}
                </span> projects found
                {searchQuery && (
                  <> for "<span className="font-semibold">{searchQuery}</span>"</>
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

export default FreelanceTenderFilters;