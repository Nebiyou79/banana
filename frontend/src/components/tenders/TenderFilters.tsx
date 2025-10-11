/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tenders/TenderFilters.tsx
import React, { useState } from 'react';
import { TenderFilters as TenderFiltersType } from '@/services/tenderService';

interface TenderFiltersProps {
  filters: TenderFiltersType;
  onFiltersChange: (filters: TenderFiltersType) => void;
  onReset: () => void;
}

const categories = [
  'all',
  'web_development',
  'mobile_development',
  'data_science',
  'design',
  'marketing',
  'writing',
  'consulting'
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
  onReset 
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
    sortOrder: 'desc' // ✅ matches 'asc' | 'desc'
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search tenders..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={localFilters.category || 'all'}
            onChange={(e) => handleFilterChange('category', e.target.value === 'all' ? undefined : e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            value={localFilters.sortBy || 'createdAt'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order
          </label>
          <select
            value={localFilters.sortOrder || 'desc'}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Budget Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Budget ($)
            </label>
            <input
              type="number"
              value={localFilters.minBudget || ''}
              onChange={(e) => handleFilterChange('minBudget', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Budget ($)
            </label>
            <input
              type="number"
              value={localFilters.maxBudget || ''}
              onChange={(e) => handleFilterChange('maxBudget', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="100000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Skills
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add skills..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={addSkill}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Add
            </button>
          </div>
          
          {/* Selected Skills */}
          <div className="flex flex-wrap gap-1 mt-2">
            {Array.isArray(localFilters.skills) && localFilters.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleApplyFilters}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default TenderFilters;