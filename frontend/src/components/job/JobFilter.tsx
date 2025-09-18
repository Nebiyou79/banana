// components/JobFilter.tsx
import React, { useState } from 'react';
import { SearchParams } from '@/services/searchService';

interface JobFilterProps {
  onFilter: (filters: SearchParams) => void;
  loading: boolean;
}

const JobFilter: React.FC<JobFilterProps> = ({ onFilter, loading }) => {
  const [filters, setFilters] = useState<SearchParams>({
    query: '',
    location: '',
    type: '',
    category: '',
    experienceLevel: '',
    minSalary: undefined,
    maxSalary: undefined,
    remote: undefined
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFilters(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name === 'minSalary' || name === 'maxSalary') {
      setFilters(prev => ({
        ...prev,
        [name]: value ? Number(value) : undefined
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(filters);
  };

  const clearFilters = () => {
    const resetFilters: SearchParams = {
      query: '',
      location: '',
      type: '',
      category: '',
      experienceLevel: '',
      minSalary: undefined,
      maxSalary: undefined,
      remote: undefined
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Filter Jobs</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Keywords</label>
            <input
              type="text"
              name="query"
              value={filters.query || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="Job title, skills, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              name="location"
              value={filters.location || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="City, state, or remote"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Type</label>
            <select
              name="type"
              value={filters.type || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            >
              <option value="">All Types</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="remote">Remote</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Experience Level</label>
            <select
              name="experienceLevel"
              value={filters.experienceLevel || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            >
              <option value="">All Levels</option>
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="lead">Lead</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Salary ($)</label>
            <input
              type="number"
              name="minSalary"
              value={filters.minSalary || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="Minimum salary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Salary ($)</label>
            <input
              type="number"
              name="maxSalary"
              value={filters.maxSalary || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="Maximum salary"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="remote"
              checked={filters.remote || false}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Remote Only</label>
          </div>
        </div>
        
        <div className="mt-4 flex space-x-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
          >
            Clear Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobFilter;