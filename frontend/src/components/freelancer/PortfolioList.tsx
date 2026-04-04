// components/freelancer/PortfolioList.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PortfolioItem } from '@/services/freelancerService';
import PortfolioCard from './PortfolioCard';
import { colorClasses, getTheme } from '@/utils/color';
import {
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  CloudIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
  PhotoIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface PortfolioListProps {
  items: PortfolioItem[];
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (id: string) => void;
  isOwnProfile?: boolean;
  onAddNew?: () => void;
  isLoading?: boolean;
    gridCols?: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'budget_high' | 'budget_low' | 'title';

const PortfolioList: React.FC<PortfolioListProps> = ({
  items,
  onEdit,
  onDelete,
  isOwnProfile = false,
  onAddNew,
  isLoading = false,
  gridCols = "grid-cols-1 md:grid-cols-2" // Default value
}) => {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filteredItems, setFilteredItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Load saved preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('portfolioViewMode') as ViewMode;
    if (savedViewMode && (savedViewMode === 'grid' || savedViewMode === 'list')) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode preference
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('portfolioViewMode', mode);
  };

  // Theme detection
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Extract unique categories from items
  useEffect(() => {
    const uniqueCategories = Array.from(
      new Set(
        items
          .map(item => item.category)
          .filter((category): category is string => !!category)
      )
    ).sort();
    setCategories(uniqueCategories);
  }, [items]);

  // Filter and sort items
  useEffect(() => {
    // Filter valid Cloudinary items
    const cloudinaryItems = items.filter(item => 
      item.mediaUrls?.some(url => url?.includes('cloudinary.com')) ||
      item.isCloudinary === true
    );

    let filtered = [...cloudinaryItems];

    // Apply featured filter
    if (filterFeatured) {
      filtered = filtered.filter(item => item.featured);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.client?.toLowerCase().includes(query) ||
        item.technologies?.some(tech => tech.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'budget_high':
          return (b.budget || 0) - (a.budget || 0);
        case 'budget_low':
          return (a.budget || 0) - (b.budget || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredItems(filtered);
  }, [items, filterFeatured, selectedCategory, searchQuery, sortBy]);

  const theme = getTheme(isDarkMode ? 'dark' : 'light');

  // Calculate statistics
  const stats = useMemo(() => {
    const cloudinaryItems = items.filter(item => 
      item.mediaUrls?.some(url => url?.includes('cloudinary.com'))
    );
    
    return {
      total: cloudinaryItems.length,
      featured: cloudinaryItems.filter(item => item.featured).length,
      images: cloudinaryItems.reduce((acc, item) => 
        acc + (item.mediaUrls?.filter(url => url?.includes('cloudinary.com')).length || 0), 0
      )
    };
  }, [items]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilterFeatured(false);
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('newest');
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filterFeatured || selectedCategory !== 'all' || searchQuery.trim() !== '' || sortBy !== 'newest';
  }, [filterFeatured, selectedCategory, searchQuery, sortBy]);

  // Loading skeletons
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Controls */}
        <div className={`rounded-xl border p-4 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-amber-100'}`}>
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className={`h-8 w-24 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <div className={`h-8 w-32 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            </div>
            <div className="flex space-x-2">
              <div className={`h-10 w-20 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <div className={`h-10 w-20 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            </div>
          </div>
        </div>

        {/* Skeleton Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={`rounded-xl overflow-hidden shadow-lg h-[420px] ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              {/* Image skeleton */}
              <div className={`h-56 w-full animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              
              {/* Content skeleton */}
              <div className="p-4 space-y-3">
                <div className={`h-6 w-3/4 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className={`h-4 w-1/2 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className={`h-4 w-full rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className={`h-4 w-5/6 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className="flex gap-2 pt-2">
                  <div className={`h-6 w-16 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <div className={`h-6 w-16 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <div className={`h-6 w-16 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className={`p-8 rounded-2xl border-2 border-dashed max-w-2xl mx-auto ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white border-amber-200'
        }`}>
          <CloudIcon className={`w-20 h-20 mx-auto mb-4 ${
            isDarkMode ? 'text-amber-500' : 'text-amber-400'
          }`} />
          
          <h3 className={`text-2xl font-bold mb-3 ${colorClasses.text.darkNavy}`}>
            {hasActiveFilters ? 'No Matching Projects' : 'No Portfolio Items Yet'}
          </h3>
          
          <p className={`text-base mb-6 max-w-md mx-auto ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {hasActiveFilters 
              ? 'Try adjusting your filters or search query to find what you\'re looking for.'
              : isOwnProfile 
                ? 'Showcase your best work by adding projects to your portfolio. Upload images to Cloudinary and share your achievements.'
                : 'This freelancer hasn\'t added any portfolio items to showcase their work yet.'}
          </p>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                isDarkMode
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Clear All Filters
            </button>
          )}

          {isOwnProfile && !hasActiveFilters && onAddNew && (
            <button
              onClick={onAddNew}
              className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                isDarkMode
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              <PhotoIcon className="w-5 h-5 mr-2" />
              Add Your First Project
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Bar */}
      <div className={`grid grid-cols-3 gap-3 p-4 rounded-xl border ${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white border-amber-100'
      }`}>
        <div className="text-center">
          <p className={`text-2xl font-bold ${colorClasses.text.darkNavy}`}>{stats.total}</p>
          <p className={`text-xs flex items-center justify-center ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <PhotoIcon className="w-3 h-3 mr-1" />
            Total Projects
          </p>
        </div>
        <div className="text-center border-x" style={{ borderColor: theme.border.secondary }}>
          <p className={`text-2xl font-bold ${colorClasses.text.darkNavy}`}>{stats.featured}</p>
          <p className={`text-xs flex items-center justify-center ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <StarIconSolid className="w-3 h-3 mr-1 text-amber-500" />
            Featured
          </p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${colorClasses.text.darkNavy}`}>{stats.images}</p>
          <p className={`text-xs flex items-center justify-center ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <CloudIcon className="w-3 h-3 mr-1" />
            Cloudinary Images
          </p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className={`rounded-xl border overflow-hidden ${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white border-amber-100'
      }`}>
        {/* Main Controls Bar */}
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            {/* Search */}
            <div className="w-full lg:w-96 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                    : 'border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Desktop Controls */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Category Filter */}
              {categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer min-w-[150px] ${
                    isDarkMode
                      ? 'bg-gray-900 border-gray-700 text-white'
                      : 'border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              )}

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer min-w-[150px] ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="budget_high">Budget: High to Low</option>
                <option value="budget_low">Budget: Low to High</option>
                <option value="title">Title A-Z</option>
              </select>

              {/* Featured Filter Button */}
              <button
                onClick={() => setFilterFeatured(!filterFeatured)}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center ${
                  filterFeatured
                    ? isDarkMode
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-500 text-white'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <StarIconSolid className={`w-4 h-4 mr-2 ${filterFeatured ? 'text-white' : 'text-amber-500'}`} />
                Featured
              </button>

              {/* View Toggle */}
              <div className={`flex rounded-xl border ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-2.5 rounded-l-xl transition-all duration-200 ${
                    viewMode === 'grid'
                      ? isDarkMode
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-500 text-white'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Grid view"
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2.5 rounded-r-xl transition-all duration-200 ${
                    viewMode === 'list'
                      ? isDarkMode
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-500 text-white'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List view"
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-full px-4 py-2.5 rounded-xl border flex items-center justify-center space-x-2"
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: theme.border.secondary,
                color: theme.text.primary
              }}
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              <span>Filters & Sorting</span>
              {hasActiveFilters && (
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                  isDarkMode ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {Object.entries({ filterFeatured, selectedCategory, searchQuery, sortBy })
                    .filter(([key, value]) => {
                      if (key === 'selectedCategory') return value !== 'all';
                      if (key === 'sortBy') return value !== 'newest';
                      if (key === 'searchQuery') return value !== '';
                      return value;
                    }).length}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="lg:hidden mt-4 pt-4 border-t" style={{ borderColor: theme.border.secondary }}>
              <div className="space-y-3">
                {/* Category Filter */}
                {categories.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDarkMode
                        ? 'bg-gray-900 border-gray-700 text-white'
                        : 'border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                )}

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDarkMode
                      ? 'bg-gray-900 border-gray-700 text-white'
                      : 'border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="budget_high">Budget: High to Low</option>
                  <option value="budget_low">Budget: Low to High</option>
                  <option value="title">Title A-Z</option>
                </select>

                {/* Featured Filter Button */}
                <button
                  onClick={() => setFilterFeatured(!filterFeatured)}
                  className={`w-full px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
                    filterFeatured
                      ? isDarkMode
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <StarIconSolid className={`w-4 h-4 mr-2 ${filterFeatured ? 'text-white' : 'text-amber-500'}`} />
                  {filterFeatured ? 'Showing Featured' : 'Show Featured'}
                </button>

                {/* View Toggle */}
                <div className={`flex rounded-xl border overflow-hidden ${
                  isDarkMode 
                    ? 'bg-gray-900 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <button
                    onClick={() => handleViewModeChange('grid')}
                    className={`flex-1 py-2.5 transition-all duration-200 flex items-center justify-center ${
                      viewMode === 'grid'
                        ? isDarkMode
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-500 text-white'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Squares2X2Icon className="w-5 h-5 mr-2" />
                    Grid
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`flex-1 py-2.5 transition-all duration-200 flex items-center justify-center ${
                      viewMode === 'list'
                        ? isDarkMode
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-500 text-white'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <ListBulletIcon className="w-5 h-5 mr-2" />
                    List
                  </button>
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full mt-3 px-4 py-2.5 rounded-xl border font-medium transition-all duration-200 flex items-center justify-center"
                  style={{
                    borderColor: theme.border.secondary,
                    color: theme.text.secondary
                  }}
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className={`px-4 py-3 border-t flex flex-wrap items-center gap-2 ${
            isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
          }`}>
            <span className={`text-sm font-medium mr-2 ${colorClasses.text.gray600}`}>
              Active Filters:
            </span>
            
            {filterFeatured && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                isDarkMode
                  ? 'bg-amber-900/30 text-amber-300 border border-amber-700'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <StarIconSolid className="w-3 h-3 mr-1" />
                Featured
                <button
                  onClick={() => setFilterFeatured(false)}
                  className="ml-2 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {selectedCategory !== 'all' && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                isDarkMode
                  ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <FunnelIcon className="w-3 h-3 mr-1" />
                {selectedCategory.replace('-', ' ')}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="ml-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {searchQuery && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                isDarkMode
                  ? 'bg-purple-900/30 text-purple-300 border border-purple-700'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}>
                <MagnifyingGlassIcon className="w-3 h-3 mr-1" />
                `{searchQuery}``
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-2 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {sortBy !== 'newest' && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                isDarkMode
                  ? 'bg-green-900/30 text-green-300 border border-green-700'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                <ChevronDownIcon className="w-3 h-3 mr-1" />
                Sort: {sortBy.replace('_', ' ')}
                <button
                  onClick={() => setSortBy('newest')}
                  className="ml-2 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={clearFilters}
              className={`ml-auto text-sm font-medium hover:underline ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className={`text-sm ${colorClasses.text.gray600}`}>
        Showing <span className="font-bold">{filteredItems.length}</span> {filteredItems.length === 1 ? 'project' : 'projects'}
      </div>

      {/* Portfolio Grid/List */}
{viewMode === 'grid' ? (
  <div className="grid grid-cols-1 gap-4 md:gap-6">
    {filteredItems.map((item) => (
      <PortfolioCard
        key={item._id}
        item={item}
        onEdit={onEdit}
        onDelete={onDelete}
        isOwnProfile={isOwnProfile}
      />
    ))}
  </div>
) : (
  <div className="space-y-4">
    {filteredItems.map((item) => (
      <div key={item._id} className="relative">
        <PortfolioCard
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          isOwnProfile={isOwnProfile}
        />
      </div>
    ))}
  </div>
)}

      {/* Add New Button (Mobile) */}
      {isOwnProfile && onAddNew && filteredItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-30 md:hidden">
          <button
            onClick={onAddNew}
            className="w-14 h-14 rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition-all duration-200 flex items-center justify-center"
            aria-label="Add new project"
          >
            <PhotoIcon className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PortfolioList;