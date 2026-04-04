// src/components/freelancer-marketplace/FreelancerFilters.tsx
'use client';

import React, { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import { mp } from '@/utils/marketplaceTheme';

interface FreelancerFilters {
  search?: string;
  skills?: string[];
  minRate?: number;
  maxRate?: number;
  minRating?: number;
  availability?: 'available' | 'not-available' | 'part-time';
  experienceLevel?: 'entry' | 'intermediate' | 'expert';
  location?: string;
  featured?: boolean;
  sortBy?: 'rating' | 'rate_asc' | 'rate_desc' | 'newest' | 'most_active';
  page?: number;
  limit?: number;
}

interface FreelancerFiltersProps {
  filters: FreelancerFilters;
  onChange: (updated: FreelancerFilters) => void;
  onReset: () => void;
}

const FreelancerFilters: React.FC<FreelancerFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const touchTargetClass = getTouchTargetSize('md');

  const updateFilter = <K extends keyof FreelancerFilters>(key: K, value: FreelancerFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const addSkill = () => {
    if (skillInput.trim() && !filters.skills?.includes(skillInput.trim())) {
      const newSkills = [...(filters.skills || []), skillInput.trim()];
      updateFilter('skills', newSkills);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    const newSkills = (filters.skills || []).filter(s => s !== skill);
    updateFilter('skills', newSkills);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleRatingSelect = (rating: number) => {
    updateFilter('minRating', rating === filters.minRating ? undefined : rating);
  };

  const handleAvailabilitySelect = (value: 'available' | 'part-time' | undefined) => {
    updateFilter('availability', value === filters.availability ? undefined : value);
  };

  const handleExperienceSelect = (level: 'entry' | 'intermediate' | 'expert' | undefined) => {
    updateFilter('experienceLevel', level === filters.experienceLevel ? undefined : level);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-[#475569] dark:text-[#CBD5E1] mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value || undefined)}
            placeholder="Search by name, skill, or specialty…"
            className={`w-full rounded-lg border border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937] pl-9 pr-4 py-2 text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]`}
          />
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-[#475569] dark:text-[#CBD5E1] mb-2">
          Skills
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {filters.skills?.map(skill => (
            <span
              key={skill}
              className={`inline-flex items-center gap-1 ${mp.skillTag}`}
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a skill..."
            className={`flex-1 rounded-lg border border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937] px-3 py-1.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]`}
          />
          <button
            type="button"
            onClick={addSkill}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mp.btnSecondary}`}
          >
            Add
          </button>
        </div>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Max 8 skills</p>
      </div>

      {/* Hourly Rate */}
      <div>
        <label className="block text-sm font-medium text-[#475569] dark:text-[#CBD5E1] mb-2">
          Hourly Rate ($/hr)
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="number"
              value={filters.minRate || ''}
              onChange={(e) => updateFilter('minRate', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Min"
              min={0}
              max={500}
              className="w-full rounded-lg border border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937] px-3 py-1.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              value={filters.maxRate || ''}
              onChange={(e) => updateFilter('maxRate', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Max"
              min={0}
              max={500}
              className="w-full rounded-lg border border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937] px-3 py-1.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-[#475569] dark:text-[#CBD5E1] mb-2">
          Minimum Rating
        </label>
        <div className="flex flex-wrap gap-2">
          {[3, 4, 4.5].map(rating => (
            <button
              key={rating}
              type="button"
              onClick={() => handleRatingSelect(rating)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 ${filters.minRating === rating
                  ? 'bg-[#3B82F6] text-white'
                  : mp.btnSecondary
                }`}
            >
              {rating}+ ★
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <label className="block text-sm font-medium text-[#475569] dark:text-[#CBD5E1] mb-2">
          Availability
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleAvailabilitySelect(undefined)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 ${!filters.availability
                ? 'bg-[#3B82F6] text-white'
                : mp.btnSecondary
              }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleAvailabilitySelect('available')}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 ${filters.availability === 'available'
                ? 'bg-[#3B82F6] text-white'
                : mp.btnSecondary
              }`}
          >
            Available Now
          </button>
          <button
            type="button"
            onClick={() => handleAvailabilitySelect('part-time')}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 ${filters.availability === 'part-time'
                ? 'bg-[#3B82F6] text-white'
                : mp.btnSecondary
              }`}
          >
            Part-time
          </button>
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="block text-sm font-medium text-[#475569] dark:text-[#CBD5E1] mb-2">
          Experience Level
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleExperienceSelect(undefined)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 ${!filters.experienceLevel
                ? 'bg-[#3B82F6] text-white'
                : mp.btnSecondary
              }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleExperienceSelect('entry')}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 ${filters.experienceLevel === 'entry'
                ? 'bg-[#3B82F6] text-white'
                : mp.btnSecondary
              }`}
          >
            Junior
          </button>
          <button
            type="button"
            onClick={() => handleExperienceSelect('intermediate')}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 ${filters.experienceLevel === 'intermediate'
                ? 'bg-[#3B82F6] text-white'
                : mp.btnSecondary
              }`}
          >
            Mid-Level
          </button>
          <button
            type="button"
            onClick={() => handleExperienceSelect('expert')}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 ${filters.experienceLevel === 'expert'
                ? 'bg-[#3B82F6] text-white'
                : mp.btnSecondary
              }`}
          >
            Expert
          </button>
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-[#475569] dark:text-[#CBD5E1] mb-2">
          Location
        </label>
        <input
          type="text"
          value={filters.location || ''}
          onChange={(e) => updateFilter('location', e.target.value || undefined)}
          placeholder="e.g., Addis Ababa"
          className="w-full rounded-lg border border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937] px-3 py-1.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
        />
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium text-[#475569] dark:text-[#CBD5E1] mb-2">
          Sort By
        </label>
        <select
          value={filters.sortBy || ''}
          onChange={(e) => updateFilter('sortBy', e.target.value as any || undefined)}
          className="w-full rounded-lg border border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937] px-3 py-1.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
        >
          <option value="">Best Match</option>
          <option value="rating">Highest Rated</option>
          <option value="rate_asc">Lowest Rate</option>
          <option value="rate_desc">Highest Rate</option>
          <option value="most_active">Most Experienced</option>
          <option value="newest">Newly Joined</option>
        </select>
      </div>

      {/* Reset Button */}
      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-lg px-4 py-2 text-sm font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );

  // Desktop: Vertical sidebar
  if (!isMobile && !isTablet) {
    return (
      <div className="w-64 shrink-0 sticky top-4">
        <div className={`${mp.bgCard} rounded-xl border ${mp.border} p-4`}>
          <FilterContent />
        </div>
      </div>
    );
  }

  // Mobile/Tablet: Collapsible panel
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={`${touchTargetClass} flex items-center gap-2 rounded-lg px-4 py-2 font-medium ${mp.btnSecondary}`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
        {Object.keys(filters).some(k => filters[k as keyof FreelancerFilters] && k !== 'page' && k !== 'limit') && (
          <span className="ml-1 text-xs bg-[#3B82F6] text-white rounded-full px-1.5 py-0.5">
            {Object.entries(filters).filter(([k, v]) => v && k !== 'page' && k !== 'limit' && k !== 'sortBy' && k !== 'skills' ? (Array.isArray(v) ? v.length > 0 : true) : false).length}
          </span>
        )}
      </button>

      {isPanelOpen && (
        <div className={`mt-3 ${mp.bgCard} rounded-xl border ${mp.border} p-4`}>
          <FilterContent />
        </div>
      )}
    </div>
  );
};

export default FreelancerFilters;