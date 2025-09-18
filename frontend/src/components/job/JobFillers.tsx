/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';

export interface JobFilters {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  type?: string;
  category?: string;
  remote?: boolean;
  experienceLevel?: string;
}

interface JobFiltersProps {
  filters: JobFilters;
  onFilterChange: (filters: Partial<JobFilters>) => void;
}

const JobFilters: React.FC<JobFiltersProps> = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof JobFilters, value: any) => {
    onFilterChange({ [key]: value, page: 1 });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      location: '',
      type: '',
      category: '',
      remote: undefined,
      experienceLevel: '',
      page: 1
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.location || 
    filters.type || 
    filters.category || 
    filters.remote || 
    filters.experienceLevel;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filter Jobs</h3>
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden text-gray-600 hover:text-gray-800"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Filters Grid */}
      <div className={`grid gap-6 ${isExpanded ? 'block' : 'hidden lg:grid'} lg:grid-cols-2 xl:grid-cols-4`}>
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Jobs
          </label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Job title, skills..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={filters.location || ''}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            placeholder="City, country..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Job Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Type
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="remote">Remote</option>
          </select>
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience
          </label>
          <select
            value={filters.experienceLevel || ''}
            onChange={(e) => handleFilterChange('experienceLevel', e.target.value || undefined)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Levels</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="lead">Lead</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <input
            type="text"
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            placeholder="Industry, field..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Remote Work */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remote Options
          </label>
          <select
            value={filters.remote === undefined ? '' : String(filters.remote)}
            onChange={(e) => handleFilterChange('remote', e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Work Types</option>
            <option value="true">Remote Only</option>
            <option value="false">On-Site Only</option>
          </select>
        </div>

        {/* Results per page */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Results per page
          </label>
          <select
            value={filters.limit || 12}
            onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
        </div>

        {/* Active Filters Badge */}
        {hasActiveFilters && (
          <div className="flex items-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {Object.values(filters).filter(val => val && val !== '' && val !== 12).length} active filters
            </span>
          </div>
        )}
      </div>

      {/* Quick Filter Chips */}
      {hasActiveFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Active Filters:</h4>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Search: `{filters.search}``
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.location && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                Location: {filters.location}
                <button
                  onClick={() => handleFilterChange('location', '')}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.type && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                Type: {filters.type}
                <button
                  onClick={() => handleFilterChange('type', '')}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.remote !== undefined && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                Remote: {filters.remote ? 'Yes' : 'No'}
                <button
                  onClick={() => handleFilterChange('remote', undefined)}
                  className="ml-2 text-orange-600 hover:text-orange-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.experienceLevel && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                Experience: {filters.experienceLevel}
                <button
                  onClick={() => handleFilterChange('experienceLevel', '')}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  ×
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