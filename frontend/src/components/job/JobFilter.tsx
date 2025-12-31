/* eslint-disable @typescript-eslint/no-explicit-any */
// components/JobFilter.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { JobFilters } from '@/services/jobService';
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign,
  X,
  Star,
  Clock,
  Globe,
  Building2,
  Users,
  GraduationCap
} from 'lucide-react';

interface JobFilterProps {
  onFilter: (filters: JobFilters) => void;
  loading?: boolean;
  initialFilters?: JobFilters;
  showAdvanced?: boolean;
  onToggleAdvanced?: () => void;
  showJobTypeFilter?: boolean;
}

const JobFilter: React.FC<JobFilterProps> = ({ 
  onFilter, 
  loading = false,
  initialFilters = {},
  showAdvanced = false,
  onToggleAdvanced,
  showJobTypeFilter = true
}) => {
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    region: '',
    city: '',
    type: '',
    category: '',
    remote: '',
    experienceLevel: '',
    educationLevel: '',
    minSalary: undefined,
    maxSalary: undefined,
    currency: 'ETB',
    workArrangement: '',
    featured: undefined,
    urgent: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    jobType: undefined,
    opportunityType: '',
    ...initialFilters
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Ethiopian market data
  const ethiopianRegions = [
    { name: 'Addis Ababa', slug: 'addis-ababa', cities: ['Addis Ababa', 'Akaki Kaliti', 'Arada', 'Bole', 'Gulele', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk Lafto', 'Yeka'] },
    { name: 'Amhara', slug: 'amhara', cities: ['Bahir Dar', 'Gondar', 'Dessie', 'Debre Markos', 'Debre Birhan'] },
    { name: 'Oromia', slug: 'oromia', cities: ['Adama', 'Nazret', 'Jimma', 'Bishoftu', 'Ambo'] },
    { name: 'Tigray', slug: 'tigray', cities: ['Mekele', 'Adigrat', 'Axum', 'Adwa', 'Shire'] },
    { name: 'SNNPR', slug: 'snnpr', cities: ['Hawassa', 'Arba Minch', 'Dila', 'Wolaita Sodo', 'Hosaena'] },
    { name: 'Somali', slug: 'somali', cities: ['Jijiga', 'Degehabur', 'Gode', 'Kebri Dahar'] },
    { name: 'Afar', slug: 'afar', cities: ['Semera', 'Asayita', 'Awash', 'Logiya'] },
    { name: 'Benishangul-Gumuz', slug: 'benishangul-gumuz', cities: ['Assosa', 'Metekel'] },
    { name: 'Gambela', slug: 'gambela', cities: ['Gambela'] },
    { name: 'Harari', slug: 'harari', cities: ['Harar'] },
    { name: 'Sidama', slug: 'sidama', cities: ['Hawassa', 'Yirgalem', 'Leku'] },
    { name: 'South West Ethiopia', slug: 'south-west-ethiopia', cities: ['Bonga', 'Mizan Teferi'] },
    { name: 'Dire Dawa', slug: 'dire-dawa', cities: ['Dire Dawa'] },
    { name: 'International', slug: 'international', cities: ['Remote Worldwide'] }
  ];

  const jobTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'volunteer', label: 'Volunteer' },
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
    // Ethiopian Education System
    { value: 'primary-education', label: 'Primary Education' },
    { value: 'secondary-education', label: 'Secondary Education' },
    { value: 'tvet-level-i', label: 'TVET Level I - Basic Skills' },
    { value: 'tvet-level-ii', label: 'TVET Level II - Skilled Worker' },
    { value: 'tvet-level-iii', label: 'TVET Level III - Technician' },
    { value: 'tvet-level-iv', label: 'TVET Level IV - Senior Technician' },
    { value: 'tvet-level-v', label: 'TVET Level V - Expert/Trainer' },
    { value: 'undergraduate-bachelors', label: 'Undergraduate (Bachelor\'s)' },
    { value: 'postgraduate-masters', label: 'Postgraduate (Master\'s)' },
    { value: 'doctoral-phd', label: 'Doctoral (Ph.D.)' },
    { value: 'lecturer', label: 'Lecturer' },
    { value: 'professor', label: 'Professor' },
    // Backward compatibility
    { value: 'high-school', label: 'High School' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'bachelors', label: "Bachelor's" },
    { value: 'masters', label: "Master's" },
    { value: 'phd', label: 'PhD' },
    { value: 'none-required', label: 'Not Required' }
  ];

  const workArrangements = [
    { value: 'office', label: 'Office' },
    { value: 'field-work', label: 'Field Work' },
    { value: 'both', label: 'Both' }
  ];

  const jobTypeOptions = [
    { value: 'company', label: 'Company Jobs' },
    { value: 'organization', label: 'Organization Opportunities' }
  ];

  const opportunityTypes = [
    { value: 'job', label: 'Job Opportunity' },
    { value: 'volunteer', label: 'Volunteer Position' },
    { value: 'internship', label: 'Internship' },
    { value: 'fellowship', label: 'Fellowship' },
    { value: 'training', label: 'Training Program' },
    { value: 'grant', label: 'Grant Opportunity' },
    { value: 'other', label: 'Other Opportunity' }
  ];

  const salaryRanges = [
    { label: 'Under 2,000 ETB', min: 0, max: 2000 },
    { label: '2,000 - 5,000 ETB', min: 2000, max: 5000 },
    { label: '5,000 - 10,000 ETB', min: 5000, max: 10000 },
    { label: '10,000 - 20,000 ETB', min: 10000, max: 20000 },
    { label: '20,000 - 50,000 ETB', min: 20000, max: 50000 },
    { label: '50,000+ ETB', min: 50000, max: null }
  ];

  const selectedRegion = ethiopianRegions.find(region => region.slug === filters.region);

  useEffect(() => {
    onFilter(filters);
  }, [filters]);

  const handleChange = (key: keyof JobFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSalaryRangeSelect = (min: number, max: number | null) => {
    setFilters(prev => ({
      ...prev,
      minSalary: min,
      maxSalary: max || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      region: '',
      city: '',
      type: '',
      category: '',
      remote: '',
      experienceLevel: '',
      educationLevel: '',
      minSalary: undefined,
      maxSalary: undefined,
      currency: 'ETB',
      workArrangement: '',
      featured: undefined,
      urgent: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      jobType: undefined,
      opportunityType: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== 'ETB' && value !== 'createdAt' && value !== 'desc'
  );

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
      {/* Main Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search jobs by title, skills, or company..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          {onToggleAdvanced && (
            <button
              onClick={onToggleAdvanced}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Filter className="w-4 h-4" />
              {showAdvanced ? 'Simple Filters' : 'Advanced Filters'}
            </button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {showJobTypeFilter && (
          <select
            value={filters.jobType || ''}
            onChange={(e) => handleChange('jobType', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All Types</option>
            {jobTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        <select
          value={filters.region || ''}
          onChange={(e) => handleChange('region', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="">All Regions</option>
          {ethiopianRegions.map(region => (
            <option key={region.slug} value={region.slug}>
              {region.name}
            </option>
          ))}
        </select>

        <select
          value={filters.type || ''}
          onChange={(e) => handleChange('type', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="">All Job Types</option>
          {jobTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select
          value={filters.experienceLevel || ''}
          onChange={(e) => handleChange('experienceLevel', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="">All Experience Levels</option>
          {experienceLevels.map(level => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>

        <select
          value={filters.remote || ''}
          onChange={(e) => handleChange('remote', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="">All Work Locations</option>
          <option value="on-site">On-Site</option>
          <option value="hybrid">Hybrid</option>
          <option value="remote">Remote</option>
        </select>

        <select
          value={filters.sortBy || 'createdAt'}
          onChange={(e) => handleChange('sortBy', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="createdAt">Newest First</option>
          <option value="applicationDeadline">Deadline</option>
          <option value="salary">Salary</option>
          <option value="relevance">Relevance</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {(showAdvanced || showMobileFilters) && (
        <div className="border-t border-gray-200 pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Job Type */}
            {showJobTypeFilter && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Job Type
                </label>
                <select
                  value={filters.jobType || ''}
                  onChange={(e) => handleChange('jobType', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All Types</option>
                  {jobTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Opportunity Type */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Opportunity Type
              </label>
              <select
                value={filters.opportunityType || ''}
                onChange={(e) => handleChange('opportunityType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Opportunities</option>
                {opportunityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                City
              </label>
              <select
                value={filters.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Cities</option>
                {selectedRegion?.cities.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Education Level */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Education Level
              </label>
              <select
                value={filters.educationLevel || ''}
                onChange={(e) => handleChange('educationLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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

          {/* Salary Range */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Salary Range ({filters.currency})
            </label>
            <div className="flex flex-wrap gap-2">
              {salaryRanges.map((range, index) => (
                <button
                  key={index}
                  onClick={() => handleSalaryRangeSelect(range.min, range.max)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    filters.minSalary === range.min && filters.maxSalary === range.max
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <input
                type="number"
                placeholder="Min"
                value={filters.minSalary || ''}
                onChange={(e) => handleChange('minSalary', e.target.value ? Number(e.target.value) : undefined)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxSalary || ''}
                onChange={(e) => handleChange('maxSalary', e.target.value ? Number(e.target.value) : undefined)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Special Filters */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.featured || false}
                onChange={(e) => handleChange('featured', e.target.checked ? true : undefined)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Featured Jobs
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.urgent || false}
                onChange={(e) => handleChange('urgent', e.target.checked ? true : undefined)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Urgent Hiring
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.remote === 'remote'}
                onChange={(e) => handleChange('remote', e.target.checked ? 'remote' : '')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Remote Only
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 font-medium">Active filters:</span>
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Search: {filters.search}
                <button
                  onClick={() => handleChange('search', '')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.jobType && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                Type: {jobTypeOptions.find(t => t.value === filters.jobType)?.label}
                <button
                  onClick={() => handleChange('jobType', undefined)}
                  className="ml-1 hover:text-purple-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.region && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Region: {ethiopianRegions.find(r => r.slug === filters.region)?.name}
                <button
                  onClick={() => handleChange('region', '')}
                  className="ml-1 hover:text-green-600"
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

export default JobFilter;