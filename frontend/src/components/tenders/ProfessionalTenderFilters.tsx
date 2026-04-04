/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tenders/professional/ProfessionalTenderFilters.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronDown,
  Banknote,
  Building2,
  Calendar,
  Award,
  Shield,
  Users,
  FileText,
  Hash,
  Tag,
  DollarSign,
  Briefcase,
  TrendingUp,
  Zap,
  Filter,
  Loader2,
  Check
} from 'lucide-react';
import { getTheme, ThemeMode } from '@/utils/color';
import { TenderFilter, PROCUREMENT_METHODS, EVALUATION_METHODS, VISIBILITY_TYPES } from '@/services/tenderService';
import FilterDropdown from '@/components/ui/FilterDropdown';

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

interface ProfessionalTenderFiltersProps {
  filters: TenderFilter;
  onFiltersChange: (filters: Partial<TenderFilter>) => void;
  totalCount?: number;
  isLoading?: boolean;
  className?: string;
  themeMode?: ThemeMode;
}

const FILTER_PRESETS: Array<{ id: string; name: string; icon: React.ReactNode; filters: Partial<TenderFilter>; description?: string }> = [
  {
    id: 'high-value',
    name: 'High Value',
    icon: <TrendingUp className="w-4 h-4" />,
    filters: { minBudget: 500000 },
    description: 'Over $500,000',
  },
  {
    id: 'cpo-required',
    name: 'CPO Required',
    icon: <Banknote className="w-4 h-4" />,
    filters: { cpoRequired: true },
    description: 'Requires CPO',
  },
  {
    id: 'sealed-bid',
    name: 'Sealed Bid',
    icon: <Shield className="w-4 h-4" />,
    filters: { workflowType: 'closed' },
    description: 'Closed workflow',
  },
  {
    id: 'ending-soon',
    name: 'Ending Soon',
    icon: <Zap className="w-4 h-4" />,
    filters: {
      dateTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    description: 'Deadline within 7 days',
  },
  {
    id: 'experienced',
    name: 'Experienced',
    icon: <Award className="w-4 h-4" />,
    filters: { minExperience: 5 },
    description: '5+ years experience',
  },
];

const procurementMethods = PROCUREMENT_METHODS || [
  { value: 'open', label: 'Open Tender' },
  { value: 'selective', label: 'Selective Tender' },
  { value: 'limited', label: 'Limited Tender' },
  { value: 'single_source', label: 'Single Source' },
];

const evaluationMethods = EVALUATION_METHODS || [
  { value: 'lowest_price', label: 'Lowest Price' },
  { value: 'meat', label: 'MEAT' },
  { value: 'quality_cost', label: 'Quality/Cost' },
];

const visibilityTypes = VISIBILITY_TYPES || [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'invite_only', label: 'Invite Only' },
];

const currencies = ['USD', 'EUR', 'GBP', 'ETB'];

const ProfessionalTenderFilters: React.FC<ProfessionalTenderFiltersProps> = ({
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
  const initialMountRef = useRef(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [entitySearch, setEntitySearch] = useState(filters.procuringEntity || '');
  const [refSearch, setRefSearch] = useState(filters.referenceNumber || '');
  
  const debouncedSearch = useDebounce(searchQuery, 500);
  const debouncedEntity = useDebounce(entitySearch, 500);
  const debouncedRef = useDebounce(refSearch, 500);

  // Dropdown state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  // Mobile state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);

  // Budget state - using temporary values to prevent auto-submit
  const [tempMinBudget, setTempMinBudget] = useState(filters.minBudget?.toString() || '');
  const [tempMaxBudget, setTempMaxBudget] = useState(filters.maxBudget?.toString() || '');
  const [currency, setCurrency] = useState('USD');

  // Experience state - using temporary value
  const [tempMinExperience, setTempMinExperience] = useState(filters.minExperience?.toString() || '');

  // Certifications state
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>(
    Array.isArray(filters.requiredCertifications) ? filters.requiredCertifications : []
  );
  const [certSearch, setCertSearch] = useState('');

  // Mock certifications data
  const availableCertifications = useMemo(() => [
    'ISO 9001', 'ISO 14001', 'ISO 45001', 'CE Marking', 'FDA Approval',
    'GMP Certified', 'HACCP', 'Organic Certified', 'Fair Trade', 'B Corp'
  ], []);

  const filteredCertifications = useMemo(() => {
    if (!certSearch) return availableCertifications;
    return availableCertifications.filter(cert => 
      cert.toLowerCase().includes(certSearch.toLowerCase())
    );
  }, [availableCertifications, certSearch]);

  // Handle search changes - CRITICAL: Don't send undefined if there's no search
  useEffect(() => {
    // Skip initial mount to prevent unnecessary updates
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }

    if (isUpdatingRef.current) return;

    const timeoutId = setTimeout(() => {
      // Only update if the debounced value is different from the current filter
      const currentSearch = filters.search || '';
      const newSearch = debouncedSearch || '';
      
      if (newSearch !== currentSearch) {
        isUpdatingRef.current = true;
        
        // Only send update if there's actually a search term, otherwise don't send anything
        if (newSearch) {
          onFiltersChange({ search: newSearch });
        } else if (currentSearch) {
          // Only clear if we had a search before
          onFiltersChange({ search: undefined });
        }
        
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [debouncedSearch, filters.search, onFiltersChange]);

  useEffect(() => {
    if (initialMountRef.current) return;
    if (isUpdatingRef.current) return;

    const timeoutId = setTimeout(() => {
      const currentEntity = filters.procuringEntity || '';
      const newEntity = debouncedEntity || '';
      
      if (newEntity !== currentEntity) {
        isUpdatingRef.current = true;
        
        if (newEntity) {
          onFiltersChange({ procuringEntity: newEntity });
        } else if (currentEntity) {
          onFiltersChange({ procuringEntity: undefined });
        }
        
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [debouncedEntity, filters.procuringEntity, onFiltersChange]);

  useEffect(() => {
    if (initialMountRef.current) return;
    if (isUpdatingRef.current) return;

    const timeoutId = setTimeout(() => {
      const currentRef = filters.referenceNumber || '';
      const newRef = debouncedRef || '';
      
      if (newRef !== currentRef) {
        isUpdatingRef.current = true;
        
        if (newRef) {
          onFiltersChange({ referenceNumber: newRef });
        } else if (currentRef) {
          onFiltersChange({ referenceNumber: undefined });
        }
        
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [debouncedRef, filters.referenceNumber, onFiltersChange]);

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
      });
    } else {
      onFiltersChange({
        minBudget: min,
        maxBudget: max,
      });
    }
    setActiveDropdown(null);
  }, [tempMinBudget, tempMaxBudget, onFiltersChange]);

  // Handle experience apply - CRITICAL: Don't set page:1 explicitly
  const handleApplyExperience = useCallback(() => {
    onFiltersChange({
      minExperience: tempMinExperience ? Number(tempMinExperience) : undefined,
    });
    setActiveDropdown(null);
  }, [tempMinExperience, onFiltersChange]);

  const handleCertificationToggle = useCallback((cert: string) => {
    const newCerts = selectedCertifications.includes(cert)
      ? selectedCertifications.filter(c => c !== cert)
      : [...selectedCertifications, cert];
    
    setSelectedCertifications(newCerts);
    // CRITICAL: Don't set page:1 explicitly
    onFiltersChange({
      requiredCertifications: newCerts.length > 0 ? newCerts : undefined,
    });
  }, [selectedCertifications, onFiltersChange]);

  const clearFilter = useCallback((key: keyof TenderFilter) => {
    // CRITICAL: Don't set page:1 explicitly
    onFiltersChange({ [key]: undefined });

    // Update local state
    if (key === 'minBudget' || key === 'maxBudget') {
      setTempMinBudget('');
      setTempMaxBudget('');
    } else if (key === 'minExperience') {
      setTempMinExperience('');
    } else if (key === 'requiredCertifications') {
      setSelectedCertifications([]);
    } else if (key === 'search') {
      setSearchQuery('');
    } else if (key === 'procuringEntity') {
      setEntitySearch('');
    } else if (key === 'referenceNumber') {
      setRefSearch('');
    }
  }, [onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setEntitySearch('');
    setRefSearch('');
    setTempMinBudget('');
    setTempMaxBudget('');
    setTempMinExperience('');
    setSelectedCertifications([]);
    setCurrency('USD');
    
    // CRITICAL: Don't set page:1 explicitly, let the hook handle it
    onFiltersChange({
      search: undefined,
      procuringEntity: undefined,
      referenceNumber: undefined,
      procurementMethod: undefined,
      cpoRequired: undefined,
      workflowType: undefined,
      visibilityType: undefined,
      minBudget: undefined,
      maxBudget: undefined,
      minExperience: undefined,
      requiredCertifications: undefined,
      evaluationMethod: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  }, [onFiltersChange]);

  const applyPreset = useCallback((presetFilters: Partial<TenderFilter>) => {
    // CRITICAL: Don't set page:1 explicitly
    onFiltersChange(presetFilters);
    setShowPresets(false);

    if (presetFilters.minBudget) {
      setTempMinBudget(presetFilters.minBudget.toString());
    }
    if (presetFilters.minExperience) {
      setTempMinExperience(presetFilters.minExperience.toString());
    }
  }, [onFiltersChange]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.procuringEntity) count++;
    if (filters.referenceNumber) count++;
    if (filters.procurementMethod) count++;
    if (filters.cpoRequired !== undefined) count++;
    if (filters.workflowType) count++;
    if (filters.visibilityType) count++;
    if (filters.minBudget) count++;
    if (filters.maxBudget) count++;
    if (filters.minExperience) count++;
    if (filters.requiredCertifications?.length) count += filters.requiredCertifications.length;
    if (filters.evaluationMethod) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  }, [filters]);

  const isSelected = useCallback((key: keyof TenderFilter, value: string): boolean => {
    const current = filters[key];
    if (!current) return false;
    if (Array.isArray(current)) return (current as string[]).includes(value);
    return current === value;
  }, [filters]);

  // Render functions for dropdowns (unchanged, but remove page:1 from onClick handlers)
  const renderProcurementMethodDropdown = () => (
    <div className="p-4">
      <div className="space-y-1">
        {procurementMethods.map((method) => (
          <button
            key={method.value}
            onClick={() => {
              // CRITICAL: Don't set page:1 explicitly
              onFiltersChange({ procurementMethod: method.value });
              setActiveDropdown(null);
            }}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:opacity-80 transition-colors"
            style={{
              backgroundColor: filters.procurementMethod === method.value
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: filters.procurementMethod === method.value
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{method.label}</span>
            {filters.procurementMethod === method.value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderEvaluationMethodDropdown = () => (
    <div className="p-4">
      <div className="space-y-1">
        {evaluationMethods.map((method) => (
          <button
            key={method.value}
            onClick={() => {
              // CRITICAL: Don't set page:1 explicitly
              onFiltersChange({ evaluationMethod: method.value });
              setActiveDropdown(null);
            }}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:opacity-80 transition-colors"
            style={{
              backgroundColor: filters.evaluationMethod === method.value
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: filters.evaluationMethod === method.value
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{method.label}</span>
            {filters.evaluationMethod === method.value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderVisibilityDropdown = () => (
    <div className="p-4">
      <div className="space-y-1">
        {visibilityTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => {
              // CRITICAL: Don't set page:1 explicitly
              onFiltersChange({ visibilityType: type.value });
              setActiveDropdown(null);
            }}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:opacity-80 transition-colors"
            style={{
              backgroundColor: filters.visibilityType === type.value
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent',
              color: filters.visibilityType === type.value
                ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                : theme.text.primary
            }}
          >
            <span className="text-sm">{type.label}</span>
            {filters.visibilityType === type.value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderBudgetDropdown = () => (
    <>
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Budget Range</h3>
        <p className={`text-xs ${theme.text.muted} mt-0.5`}>Annual turnover / project value</p>
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
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.bg.secondary,
              border: `1px solid ${theme.border.primary}`,
              color: theme.text.primary
            }}
          >
            {currencies.map(curr => <option key={curr} value={curr}>{curr}</option>)}
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

  const renderExperienceDropdown = () => (
    <>
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Minimum Experience</h3>
      </div>
      <div className="p-4">
        <input
          type="number"
          min="0"
          max="50"
          value={tempMinExperience}
          onChange={(e) => setTempMinExperience(e.target.value)}
          placeholder="Years of experience"
          className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
          style={{
            backgroundColor: theme.bg.secondary,
            border: `1px solid ${theme.border.primary}`,
            color: theme.text.primary
          }}
        />
      </div>
      <div className="p-4 border-t flex justify-between" style={{ borderColor: theme.border.secondary }}>
        <button
          onClick={() => {
            setTempMinExperience('');
            clearFilter('minExperience');
            setActiveDropdown(null);
          }}
          className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors hover:opacity-80"
          style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}
        >
          Clear
        </button>
        <button
          onClick={handleApplyExperience}
          className="px-4 py-1.5 text-sm rounded-lg font-medium text-white"
          style={{ backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB' }}
        >
          Apply
        </button>
      </div>
    </>
  );

  const renderCertificationsDropdown = () => (
    <>
      <div className="p-4 border-b" style={{ borderColor: theme.border.secondary }}>
        <h3 className={`font-semibold ${theme.text.primary}`}>Required Certifications</h3>
        <p className={`text-xs ${theme.text.muted} mt-0.5`}>Select one or more certifications</p>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: theme.text.muted }} />
          <input
            type="text"
            value={certSearch}
            onChange={(e) => setCertSearch(e.target.value)}
            placeholder="Search certifications..."
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
        {filteredCertifications.map((cert) => (
          <label
            key={cert}
            className="flex items-center gap-3 p-2 rounded-lg hover:cursor-pointer transition-colors"
            style={{
              backgroundColor: selectedCertifications.includes(cert)
                ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                : 'transparent'
            }}
          >
            <input
              type="checkbox"
              checked={selectedCertifications.includes(cert)}
              onChange={() => handleCertificationToggle(cert)}
              className="w-4 h-4 rounded focus:ring-2 focus:ring-offset-2"
              style={{
                color: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
                borderColor: theme.border.primary
              }}
            />
            <span className={`text-sm flex-1 ${theme.text.primary}`}>{cert}</span>
            {selectedCertifications.includes(cert) && (
              <Check className="w-4 h-4" style={{ color: themeMode === 'dark' ? '#3B82F6' : '#2563EB' }} />
            )}
          </label>
        ))}
      </div>

      <div className="p-4 border-t flex justify-between" style={{ borderColor: theme.border.secondary }}>
        <button
          onClick={() => {
            setSelectedCertifications([]);
            clearFilter('requiredCertifications');
            setCertSearch('');
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
    { id: 'procurement', icon: <FileText className="w-5 h-5" />, label: 'Procurement Method' },
    { id: 'evaluation', icon: <Tag className="w-5 h-5" />, label: 'Evaluation Method' },
    { id: 'visibility', icon: <Users className="w-5 h-5" />, label: 'Visibility' },
    { id: 'budget', icon: <DollarSign className="w-5 h-5" />, label: 'Budget' },
    { id: 'experience', icon: <Award className="w-5 h-5" />, label: 'Experience' },
    { id: 'certifications', icon: <Shield className="w-5 h-5" />, label: 'Certifications' },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop with proper opacity based on theme */}
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
              {mobileSections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMobileSection(item.id)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.bg.secondary, 
                    borderColor: theme.border.primary
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
              
              {/* Render section content */}
              {mobileSection === 'procurement' && (
                <div className="space-y-2">
                  {procurementMethods.map((method) => (
                    <button
                      key={method.value}
                      onClick={() => {
                        onFiltersChange({ procurementMethod: method.value });
                        setMobileSection(null);
                        setIsMobileFilterOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
                      style={{
                        backgroundColor: filters.procurementMethod === method.value
                          ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                          : theme.bg.secondary,
                      }}
                    >
                      <span style={{ 
                        color: filters.procurementMethod === method.value
                          ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                          : theme.text.primary 
                      }}>
                        {method.label}
                      </span>
                      {filters.procurementMethod === method.value && (
                        <Check className="w-4 h-4" style={{ 
                          color: themeMode === 'dark' ? '#93C5FD' : '#2563EB' 
                        }} />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {mobileSection === 'evaluation' && (
                <div className="space-y-2">
                  {evaluationMethods.map((method) => (
                    <button
                      key={method.value}
                      onClick={() => {
                        onFiltersChange({ evaluationMethod: method.value });
                        setMobileSection(null);
                        setIsMobileFilterOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
                      style={{
                        backgroundColor: filters.evaluationMethod === method.value
                          ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                          : theme.bg.secondary,
                      }}
                    >
                      <span style={{ 
                        color: filters.evaluationMethod === method.value
                          ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                          : theme.text.primary 
                      }}>
                        {method.label}
                      </span>
                      {filters.evaluationMethod === method.value && (
                        <Check className="w-4 h-4" style={{ 
                          color: themeMode === 'dark' ? '#93C5FD' : '#2563EB' 
                        }} />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {mobileSection === 'visibility' && (
                <div className="space-y-2">
                  {visibilityTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        onFiltersChange({ visibilityType: type.value });
                        setMobileSection(null);
                        setIsMobileFilterOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
                      style={{
                        backgroundColor: filters.visibilityType === type.value
                          ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                          : theme.bg.secondary,
                      }}
                    >
                      <span style={{ 
                        color: filters.visibilityType === type.value
                          ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                          : theme.text.primary 
                      }}>
                        {type.label}
                      </span>
                      {filters.visibilityType === type.value && (
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
                      onChange={(e) => setCurrency(e.target.value)}
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

              {mobileSection === 'experience' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.text.secondary }}>
                      Minimum Experience (years)
                    </label>
                    <input
                      type="number"
                      value={tempMinExperience}
                      onChange={(e) => setTempMinExperience(e.target.value)}
                      placeholder="Years of experience"
                      min="0"
                      className="w-full px-4 py-3 text-base rounded-lg placeholder-gray-400"
                      style={{
                        backgroundColor: theme.bg.secondary,
                        border: `1px solid ${theme.border.primary}`,
                        color: theme.text.primary
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      handleApplyExperience();
                      setMobileSection(null);
                      setIsMobileFilterOpen(false);
                    }}
                    className="w-full px-4 py-3 rounded-lg font-medium text-white mt-4"
                    style={{ backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB' }}
                  >
                    Apply Experience
                  </button>
                </div>
              )}

              {mobileSection === 'certifications' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: theme.text.muted }} />
                    <input
                      type="text"
                      value={certSearch}
                      onChange={(e) => setCertSearch(e.target.value)}
                      placeholder="Search certifications..."
                      className="w-full pl-9 pr-3 py-3 text-base rounded-lg placeholder-gray-400"
                      style={{
                        backgroundColor: theme.bg.secondary,
                        border: `1px solid ${theme.border.primary}`,
                        color: theme.text.primary
                      }}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredCertifications.map((cert) => (
                      <label
                        key={cert}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                        style={{
                          backgroundColor: selectedCertifications.includes(cert)
                            ? themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF'
                            : theme.bg.secondary
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCertifications.includes(cert)}
                          onChange={() => handleCertificationToggle(cert)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="flex-1" style={{ 
                          color: selectedCertifications.includes(cert)
                            ? themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                            : theme.text.primary 
                        }}>
                          {cert}
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
                    Apply Certifications
                  </button>
                </div>
              )}
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
            placeholder="Search by title, reference, or procuring entity..."
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
              <TrendingUp className="w-4 h-4" />
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
                    onClick={() => applyPreset(preset.filters as Partial<TenderFilter>)}
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

          {/* Procurement Method Dropdown */}
          <FilterDropdown
            label="Procurement"
            icon={<FileText className="w-4 h-4" />}
            isOpen={activeDropdown === 'procurement'}
            onToggle={() => setActiveDropdown(activeDropdown === 'procurement' ? null : 'procurement')}
            onClose={() => setActiveDropdown(null)}
            themeMode={themeMode}
            width="w-64"
            active={!!filters.procurementMethod}
          >
            {renderProcurementMethodDropdown()}
          </FilterDropdown>

          {/* Evaluation Method Dropdown */}
          <FilterDropdown
            label="Evaluation"
            icon={<Tag className="w-4 h-4" />}
            isOpen={activeDropdown === 'evaluation'}
            onToggle={() => setActiveDropdown(activeDropdown === 'evaluation' ? null : 'evaluation')}
            onClose={() => setActiveDropdown(null)}
            themeMode={themeMode}
            width="w-64"
            active={!!filters.evaluationMethod}
          >
            {renderEvaluationMethodDropdown()}
          </FilterDropdown>

          {/* Visibility Dropdown */}
          <FilterDropdown
            label="Visibility"
            icon={<Users className="w-4 h-4" />}
            isOpen={activeDropdown === 'visibility'}
            onToggle={() => setActiveDropdown(activeDropdown === 'visibility' ? null : 'visibility')}
            onClose={() => setActiveDropdown(null)}
            themeMode={themeMode}
            width="w-56"
            active={!!filters.visibilityType}
          >
            {renderVisibilityDropdown()}
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

          {/* Experience Dropdown */}
          <FilterDropdown
            label="Experience"
            icon={<Award className="w-4 h-4" />}
            isOpen={activeDropdown === 'experience'}
            onToggle={() => setActiveDropdown(activeDropdown === 'experience' ? null : 'experience')}
            onClose={() => setActiveDropdown(null)}
            themeMode={themeMode}
            width="w-64"
            active={!!filters.minExperience}
          >
            {renderExperienceDropdown()}
          </FilterDropdown>

          {/* Certifications Dropdown */}
          <FilterDropdown
            label="Certifications"
            icon={<Shield className="w-4 h-4" />}
            isOpen={activeDropdown === 'certifications'}
            onToggle={() => setActiveDropdown(activeDropdown === 'certifications' ? null : 'certifications')}
            onClose={() => setActiveDropdown(null)}
            themeMode={themeMode}
            width="w-80"
            active={selectedCertifications.length > 0}
          >
            {renderCertificationsDropdown()}
          </FilterDropdown>

          {/* CPO Required Button */}
          <button
            onClick={() => onFiltersChange({ cpoRequired: !filters.cpoRequired })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
              filters.cpoRequired ? 'ring-2 ring-offset-2' : ''
            }`}
            style={{
              backgroundColor: theme.bg.secondary,
              borderColor: filters.cpoRequired
                ? (themeMode === 'dark' ? '#F43F5E' : '#F43F5E')
                : theme.border.primary,
              color: filters.cpoRequired
                ? (themeMode === 'dark' ? '#FDA4AF' : '#BE123C')
                : theme.text.secondary
            }}
          >
            <Banknote className="w-4 h-4" />
            <span className="font-medium">CPO</span>
          </button>

          {/* Workflow Type Buttons */}
          <button
            onClick={() => onFiltersChange({ workflowType: filters.workflowType === 'open' ? undefined : 'open' })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
              filters.workflowType === 'open' ? 'ring-2 ring-offset-2' : ''
            }`}
            style={{
              backgroundColor: theme.bg.secondary,
              borderColor: filters.workflowType === 'open'
                ? (themeMode === 'dark' ? '#10B981' : '#10B981')
                : theme.border.primary,
              color: filters.workflowType === 'open'
                ? (themeMode === 'dark' ? '#6EE7B7' : '#047857')
                : theme.text.secondary
            }}
          >
            <Briefcase className="w-4 h-4" />
            <span className="font-medium">Open</span>
          </button>

          <button
            onClick={() => onFiltersChange({ workflowType: filters.workflowType === 'closed' ? undefined : 'closed' })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
              filters.workflowType === 'closed' ? 'ring-2 ring-offset-2' : ''
            }`}
            style={{
              backgroundColor: theme.bg.secondary,
              borderColor: filters.workflowType === 'closed'
                ? (themeMode === 'dark' ? '#8B5CF6' : '#8B5CF6')
                : theme.border.primary,
              color: filters.workflowType === 'closed'
                ? (themeMode === 'dark' ? '#C4B5FD' : '#6D28D9')
                : theme.text.secondary
            }}
          >
            <Shield className="w-4 h-4" />
            <span className="font-medium">Sealed</span>
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
      {activeFilterCount > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {filters.search && (
              <FilterChip
                label={`Search: ${filters.search.length > 20 ? filters.search.substring(0, 20) + '...' : filters.search}`}
                onRemove={() => clearFilter('search')}
                icon={<Search className="w-3 h-3" />}
              />
            )}

            {filters.procuringEntity && (
              <FilterChip
                label={`Entity: ${filters.procuringEntity}`}
                onRemove={() => clearFilter('procuringEntity')}
                icon={<Building2 className="w-3 h-3" />}
              />
            )}

            {filters.referenceNumber && (
              <FilterChip
                label={`Ref: ${filters.referenceNumber}`}
                onRemove={() => clearFilter('referenceNumber')}
                icon={<Hash className="w-3 h-3" />}
              />
            )}

            {filters.procurementMethod && (
              <FilterChip
                label={`Procurement: ${procurementMethods.find(m => m.value === filters.procurementMethod)?.label || filters.procurementMethod}`}
                onRemove={() => clearFilter('procurementMethod')}
                icon={<FileText className="w-3 h-3" />}
              />
            )}

            {filters.evaluationMethod && (
              <FilterChip
                label={`Evaluation: ${evaluationMethods.find(m => m.value === filters.evaluationMethod)?.label || filters.evaluationMethod}`}
                onRemove={() => clearFilter('evaluationMethod')}
                icon={<Tag className="w-3 h-3" />}
              />
            )}

            {filters.visibilityType && (
              <FilterChip
                label={`Visibility: ${visibilityTypes.find(v => v.value === filters.visibilityType)?.label || filters.visibilityType}`}
                onRemove={() => clearFilter('visibilityType')}
                icon={<Users className="w-3 h-3" />}
              />
            )}

            {filters.cpoRequired && (
              <FilterChip
                label="CPO Required"
                onRemove={() => clearFilter('cpoRequired')}
                icon={<Banknote className="w-3 h-3" />}
              />
            )}

            {filters.workflowType && (
              <FilterChip
                label={filters.workflowType === 'open' ? 'Open Bid' : 'Sealed Bid'}
                onRemove={() => clearFilter('workflowType')}
                icon={filters.workflowType === 'open' ? <Briefcase className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
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

            {filters.minExperience && (
              <FilterChip
                label={`${filters.minExperience}+ years`}
                onRemove={() => clearFilter('minExperience')}
                icon={<Award className="w-3 h-3" />}
              />
            )}

            {selectedCertifications.map((cert) => (
              <FilterChip
                key={cert}
                label={cert}
                onRemove={() => handleCertificationToggle(cert)}
                icon={<Shield className="w-3 h-3" />}
              />
            ))}

            {filters.dateFrom && (
              <FilterChip
                label={`From: ${new Date(filters.dateFrom).toLocaleDateString()}`}
                onRemove={() => onFiltersChange({ dateFrom: undefined })}
                icon={<Calendar className="w-3 h-3" />}
              />
            )}

            {filters.dateTo && (
              <FilterChip
                label={`To: ${new Date(filters.dateTo).toLocaleDateString()}`}
                onRemove={() => onFiltersChange({ dateTo: undefined })}
                icon={<Calendar className="w-3 h-3" />}
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
                Loading tenders...
              </span>
            ) : (
              <>
                <span className="font-semibold" style={{ color: theme.text.primary }}>
                  {totalCount.toLocaleString()}
                </span> tenders found
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

export default ProfessionalTenderFilters;