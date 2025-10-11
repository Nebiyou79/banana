/* eslint-disable @typescript-eslint/no-explicit-any */
// components/JobFilters.tsx
import React, { useState } from 'react';
import { JobFilters as JobFiltersType } from '@/services/jobService';
import { 
  Search, 
  Filter, 
  X, 
  MapPin, 
  Briefcase,
  GraduationCap,
  DollarSign,
  Globe
} from 'lucide-react';

interface JobFiltersProps {
  filters: JobFiltersType;
  onFilterChange: (filters: Partial<JobFiltersType>) => void;
  marketData?: {
    regions: Array<{ name: string; slug: string; cities: string[] }>;
    categories: Array<{ _id: string; count: number }>;
  };
}

const JobFilters: React.FC<JobFiltersProps> = ({ 
  filters, 
  onFilterChange,
  marketData 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof JobFiltersType, value: any) => {
    onFilterChange({ [key]: value, page: 1 });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      region: '',
      city: '',
      type: '',
      category: '',
      remote: undefined,
      experienceLevel: '',
      educationLevel: '',
      minSalary: undefined,
      maxSalary: undefined,
      currency: 'ETB',
      page: 1
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.region || 
    filters.city || 
    filters.type || 
    filters.category || 
    filters.remote || 
    filters.experienceLevel ||
    filters.educationLevel ||
    filters.minSalary ||
    filters.maxSalary;

  // Ethiopian regions and categories
  const ethiopianRegions = marketData?.regions || [];
  const popularCategories = marketData?.categories || [];

  const jobTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const experienceLevels = [
    { value: 'fresh-graduate', label: 'Fresh Graduate' },
    { value: 'entry-level', label: 'Entry Level' },
    { value: 'mid-level', label: 'Mid Level' },
    { value: 'senior-level', label: 'Senior Level' },
    { value: 'managerial', label: 'Managerial' },
    { value: 'director', label: 'Director' },
    { value: 'executive', label: 'Executive' }
  ];

  const educationLevels = [
    { value: 'high-school', label: 'High School' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'bachelors', label: "Bachelor's" },
    { value: 'masters', label: "Master's" },
    { value: 'phd', label: 'PhD' }
  ];

  const currencies = [
    { value: 'ETB', label: 'ETB' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' }
  ];

  const salaryRanges = {
    ETB: [
      { label: 'Under 2,000 ETB', min: 0, max: 2000 },
      { label: '2,000 - 5,000 ETB', min: 2000, max: 5000 },
      { label: '5,000 - 10,000 ETB', min: 5000, max: 10000 },
      { label: '10,000 - 20,000 ETB', min: 10000, max: 20000 },
      { label: '20,000 - 50,000 ETB', min: 20000, max: 50000 },
      { label: '50,000+ ETB', min: 50000, max: undefined }
    ],
    USD: [
      { label: 'Under $500', min: 0, max: 500 },
      { label: '$500 - $1,000', min: 500, max: 1000 },
      { label: '$1,000 - $2,000', min: 1000, max: 2000 },
      { label: '$2,000 - $5,000', min: 2000, max: 5000 },
      { label: '$5,000+', min: 5000, max: undefined }
    ]
  };

  const currentSalaryRanges = salaryRanges[filters.currency as keyof typeof salaryRanges] || salaryRanges.ETB;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Filter className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Filter Jobs</h3>
            <p className="text-sm text-gray-600">Find your perfect opportunity</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4 mr-1" />
            {isExpanded ? 'Show Less' : 'More Filters'}
          </button>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search job titles, skills, or companies..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>
      </div>

      {/* Filters Grid */}
      <div className={`grid gap-4 ${isExpanded ? 'grid-cols-1' : 'hidden lg:grid'} lg:grid-cols-2 xl:grid-cols-4`}>
        {/* Location Filters */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 mr-2" />
              Location
            </label>
            <select
              value={filters.region || ''}
              onChange={(e) => handleFilterChange('region', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Regions</option>
              {ethiopianRegions.map(region => (
                <option key={region.slug} value={region.slug}>
                  {region.name}
                </option>
              ))}
              <option value="international">🌍 International</option>
            </select>
          </div>

          {filters.region && filters.region !== 'international' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="Enter city..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Job Details */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 mr-2" />
              Job Type
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {jobTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {popularCategories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat._id} ({cat.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Experience & Education */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <select
              value={filters.experienceLevel || ''}
              onChange={(e) => handleFilterChange('experienceLevel', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Levels</option>
              {experienceLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <GraduationCap className="w-4 h-4 mr-2" />
              Education
            </label>
            <select
              value={filters.educationLevel || ''}
              onChange={(e) => handleFilterChange('educationLevel', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Any Education</option>
              {educationLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Salary & Remote */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 mr-2" />
              Salary Range ({filters.currency})
            </label>
            <div className="flex space-x-2 mb-2">
              <select
                value={filters.currency || 'ETB'}
                onChange={(e) => handleFilterChange('currency', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {currencies.map(currency => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={filters.minSalary ? `${filters.minSalary}-${filters.maxSalary}` : ''}
              onChange={(e) => {
                const [min, max] = e.target.value.split('-').map(Number);
                handleFilterChange('minSalary', min);
                handleFilterChange('maxSalary', max || undefined);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Any Salary</option>
              {currentSalaryRanges.map((range, index) => (
                <option key={index} value={`${range.min}-${range.max || ''}`}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 mr-2" />
              Work Arrangement
            </label>
            <select
              value={filters.remote || ''}
              onChange={(e) => handleFilterChange('remote', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Any Arrangement</option>
              <option value="remote">🌍 Remote Only</option>
              <option value="hybrid">🏢 Hybrid</option>
              <option value="on-site">📍 On-Site Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Active Filters:</h4>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {Object.values(filters).filter(val => 
                val && val !== '' && val !== 12 && val !== 'ETB'
              ).length} active
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || value === '' || value === 12 || value === 'ETB') return null;
              
              let displayValue = value;
              let displayKey = key;
              
              // Format display values
              if (key === 'remote') {
                displayValue = value === 'remote' ? 'Remote' : value === 'hybrid' ? 'Hybrid' : 'On-Site';
                displayKey = 'Work Type';
              } else if (key === 'experienceLevel') {
                displayValue = experienceLevels.find(l => l.value === value)?.label || value;
                displayKey = 'Experience';
              } else if (key === 'educationLevel') {
                displayValue = educationLevels.find(l => l.value === value)?.label || value;
                displayKey = 'Education';
              } else if (key === 'type') {
                displayValue = jobTypes.find(t => t.value === value)?.label || value;
                displayKey = 'Job Type';
              } else if (key === 'region') {
                displayValue = ethiopianRegions.find(r => r.slug === value)?.name || value;
                displayKey = 'Region';
              } else if (key === 'currency') {
                displayKey = 'Currency';
              } else if (key === 'minSalary' || key === 'maxSalary') {
                return null; // Handled separately
              }
              
              return (
                <span 
                  key={key}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                >
                  {displayKey}: {displayValue}
                  <button
                    onClick={() => handleFilterChange(key as keyof JobFiltersType, 
                      key === 'minSalary' || key === 'maxSalary' ? undefined : ''
                    )}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            
            {/* Salary range display */}
            {(filters.minSalary || filters.maxSalary) && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200">
                Salary: {filters.minSalary || 0} - {filters.maxSalary || '∞'} {filters.currency}
                <button
                  onClick={() => {
                    handleFilterChange('minSalary', undefined);
                    handleFilterChange('maxSalary', undefined);
                  }}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobFilters;