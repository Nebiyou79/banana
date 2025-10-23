/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tenders/TenderFilters.tsx - MOBILE RESPONSIVE VERSION
import React, { useState } from 'react';
import { TenderFilters as TenderFiltersType } from '@/services/tenderService';
import { BuildingOfficeIcon, BuildingLibraryIcon, PlusIcon } from '@heroicons/react/24/outline';

interface TenderFiltersProps {
  filters: TenderFiltersType;
  onFiltersChange: (filters: TenderFiltersType) => void;
  onReset: () => void;
  showTenderTypeFilter?: boolean;
}

// Categories remain the same...
const categories = [
  { value: 'all', label: 'All Categories' },
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

const tenderTypes = [
  { value: 'all', label: 'All Tender Types', icon: null },
  { value: 'company', label: 'Company Tenders', icon: BuildingOfficeIcon },
  { value: 'organization', label: 'Organization Tenders', icon: BuildingLibraryIcon }
];

const sortOptions = [
  { value: 'createdAt', label: 'Newest First' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'budget.max', label: 'Highest Budget' },
  { value: 'title', label: 'Title A-Z' }
];

const TenderFilters: React.FC<TenderFiltersProps> = ({ 
  filters, 
  onFiltersChange, 
  onReset,
  showTenderTypeFilter = true
}) => {
  const [localFilters, setLocalFilters] = useState<TenderFiltersType>(filters);
  const [skillsInput, setSkillsInput] = useState('');

  const handleFilterChange = (key: keyof TenderFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters: TenderFiltersType = {
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    setSkillsInput('');
    onReset();
  };

  const addSkill = () => {
    if (skillsInput.trim()) {
      const currentSkills = Array.isArray(localFilters.skills) 
        ? localFilters.skills 
        : localFilters.skills ? [localFilters.skills] : [];
      
      const newSkills = [...currentSkills, skillsInput.trim()];
      setLocalFilters(prev => ({ ...prev, skills: newSkills }));
      setSkillsInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = Array.isArray(localFilters.skills) 
      ? localFilters.skills 
      : localFilters.skills ? [localFilters.skills] : [];
    
    const newSkills = currentSkills.filter(skill => skill !== skillToRemove);
    setLocalFilters(prev => ({ 
      ...prev, 
      skills: newSkills.length > 0 ? newSkills : undefined 
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filter Projects</h3>
        <button
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium self-start sm:self-auto"
        >
          Reset All
        </button>
      </div>

      {/* Main Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Search */}
        <div className="md:col-span-2 lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Projects
          </label>
          <input
            type="text"
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by title or description..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={localFilters.category || 'all'}
            onChange={(e) => handleFilterChange('category', e.target.value === 'all' ? undefined : e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tender Type */}
        {showTenderTypeFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Type
            </label>
            <select
              value={localFilters.tenderType || 'all'}
              onChange={(e) => handleFilterChange('tenderType', e.target.value === 'all' ? undefined : e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            >
              {tenderTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={localFilters.sortBy || 'createdAt'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Budget Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Budget Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                value={localFilters.minBudget || ''}
                onChange={(e) => handleFilterChange('minBudget', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Min"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div>
              <input
                type="number"
                value={localFilters.maxBudget || ''}
                onChange={(e) => handleFilterChange('maxBudget', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Max"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Skills & Sort Order */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <select
              value={localFilters.sortOrder || 'desc'}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          {/* Skills - Improved Mobile Layout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add skills..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <button
                onClick={addSkill}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium whitespace-nowrap min-w-[80px]"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Skills */}
      {Array.isArray(localFilters.skills) && localFilters.skills.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Skills
          </label>
          <div className="flex flex-wrap gap-2">
            {localFilters.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-1.5 text-blue-600 hover:text-blue-800 font-bold text-sm leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Apply Filters Button */}
      <div className="flex justify-end">
        <button
          onClick={handleApplyFilters}
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default TenderFilters;