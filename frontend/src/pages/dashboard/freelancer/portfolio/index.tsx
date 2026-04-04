/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/portfolio.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';
import { PortfolioItem, PortfolioFormData, freelancerService } from '@/services/freelancerService';
import PortfolioList from '@/components/freelancer/PortfolioList';
import PortfolioForm from '@/components/freelancer/PortfolioForm';
import { colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';
import {
  PlusIcon,
  PhotoIcon,
  CloudIcon,
  SparklesIcon,
  HeartIcon,
  CalendarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

// Helper function for touch targets
const getTouchTargetSize = (size: 'sm' | 'md' | 'lg' = 'md'): string => {
  const sizes = {
    sm: 'min-h-[36px] min-w-[36px]',
    md: 'min-h-[44px] min-w-[44px]',
    lg: 'min-h-[52px] min-w-[52px]'
  };
  return sizes[size];
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, sublabel, trend, color = 'goldenMustard' }: any) => {
  const { isTouch } = useResponsive();

  return (
    <div
      className={cn(
        "relative group cursor-pointer rounded-xl sm:rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
        colorClasses.bg.primary,
        colorClasses.border.gray200,
        getTouchTargetSize('lg')
      )}
    >
      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${colorClasses.bg.goldenMustard.replace('bg-', '')}10, ${colorClasses.bg.goldenMustard.replace('bg-', '')}20)`
        }}
      />

      <div className="relative p-3 sm:p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className={cn("text-xs sm:text-sm font-medium mb-1 truncate", colorClasses.text.muted)}>
              {label}
            </p>
            <p className={cn("text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold", colorClasses.text.primary)}>
              {value}
            </p>
            {sublabel && (
              <p className={cn("text-xs mt-1 truncate", colorClasses.text.muted)}>
                {sublabel}
              </p>
            )}
            {trend && (
              <p className={cn("text-xs mt-2 flex items-center", colorClasses.text.muted)}>
                <span className={cn(
                  "inline-block w-2 h-2 rounded-full mr-1",
                  trend.up ? 'bg-emerald-500' : 'bg-red-500'
                )} />
                <span className="truncate">{trend.value}% from last month</span>
              </p>
            )}
          </div>
          <div
            className={cn(
              "p-1.5 sm:p-2 md:p-3 rounded-xl transition-all duration-200 group-hover:scale-110 shrink-0 ml-2",
              colorClasses.bg.goldenMustard + ' bg-opacity-10',
              colorClasses.text.goldenMustard
            )}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
        </div>

        {/* Decorative Line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
          style={{
            background: `linear-gradient(90deg, ${colorClasses.bg.goldenMustard.replace('bg-', '')}, ${colorClasses.bg.goldenMustard.replace('bg-', '')})`
          }}
        />
      </div>
    </div>
  );
};

// Loading Skeleton for Stats
const StatsSkeleton = () => {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-xl sm:rounded-2xl border p-3 sm:p-4 md:p-5 animate-pulse",
            colorClasses.bg.primary,
            colorClasses.border.gray200
          )}
        >
          <div className="flex justify-between">
            <div className="space-y-2 flex-1">
              <div className={cn("h-3 sm:h-4 w-16 sm:w-20 rounded", colorClasses.bg.muted)} />
              <div className={cn("h-5 sm:h-6 md:h-8 w-12 sm:w-16 rounded", colorClasses.bg.muted)} />
            </div>
            <div className={cn("h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-xl shrink-0", colorClasses.bg.muted)} />
          </div>
        </div>
      ))}
    </>
  );
};

// Search and Filter Bar Component
const SearchFilterBar = ({ onSearch, onFilter }: { onSearch: (query: string) => void; onFilter: (filter: string) => void }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { breakpoint, isTouch } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
      <div className="flex-1 relative">
        <MagnifyingGlassIcon className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5",
          colorClasses.text.muted
        )} />
        <input
          type="text"
          placeholder="Search projects..."
          onChange={(e) => onSearch(e.target.value)}
          className={cn(
            "w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 rounded-xl border text-sm sm:text-base",
            colorClasses.bg.primary,
            colorClasses.border.gray200,
            colorClasses.text.primary,
            'focus:outline-none focus:ring-2 focus:ring-goldenMustard focus:border-transparent',
            getTouchTargetSize('lg')
          )}
        />
      </div>

      {isMobile ? (
        <>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "flex items-center justify-center px-4 py-2 sm:py-3 rounded-xl border",
              colorClasses.bg.primary,
              colorClasses.border.gray200,
              colorClasses.text.primary,
              getTouchTargetSize('lg')
            )}
          >
            <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Filter
          </button>

          {isFilterOpen && (
            <div className={cn(
              "absolute top-20 left-4 right-4 z-50 p-4 rounded-xl border shadow-lg",
              colorClasses.bg.primary,
              colorClasses.border.gray200
            )}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={cn("text-sm font-semibold", colorClasses.text.primary)}>Filter Projects</h3>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className={cn("p-1 rounded-lg", colorClasses.bg.surface)}
                >
                  <XMarkIcon className={cn("w-4 h-4", colorClasses.text.muted)} />
                </button>
              </div>
              <div className="space-y-2">
                {['All', 'Featured', 'Recent', 'Popular'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      onFilter(filter);
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm",
                      'hover:' + colorClasses.bg.surface
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <select
          onChange={(e) => onFilter(e.target.value)}
          className={cn(
            "px-4 py-2 sm:py-3 rounded-xl border text-sm sm:text-base",
            colorClasses.bg.primary,
            colorClasses.border.gray200,
            colorClasses.text.primary,
            'focus:outline-none focus:ring-2 focus:ring-goldenMustard focus:border-transparent',
            getTouchTargetSize('lg')
          )}
        >
          <option value="all">All Projects</option>
          <option value="featured">Featured</option>
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
        </select>
      )}
    </div>
  );
};

const FreelancerPortfolio = () => {
  // State management
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const { breakpoint, isTouch } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop';

  const [stats, setStats] = useState({
    total: 0,
    featured: 0,
    totalImages: 0,
    lastUpdated: '',
    totalLikes: 0,
    totalViews: 0
  });

  // Load portfolio data
  useEffect(() => {
    loadPortfolio();
  }, []);

  // Filter items based on search and filter
  useEffect(() => {
    let filtered = [...portfolioItems];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.technologies?.some(tech => tech.toLowerCase().includes(query))
      );
    }

    // Apply filter
    switch (activeFilter) {
      case 'featured':
        filtered = filtered.filter(item => item.featured);
        break;
      case 'recent':
        filtered = filtered.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'popular':
        filtered = filtered.sort((a, b) =>
          ((b as any).views || 0) - ((a as any).views || 0)
        );
        break;
      default:
        // 'all' - no filter
        break;
    }

    setFilteredItems(filtered);
  }, [portfolioItems, searchQuery, activeFilter]);

  const loadPortfolio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('📂 Loading portfolio...');
      const response = await freelancerService.getPortfolio({ limit: 100 });

      // Only show items with Cloudinary URLs
      const cloudinaryItems = response.items.filter(item =>
        item.mediaUrls?.some(url => url?.includes('cloudinary.com'))
      );

      console.log(`✅ Loaded ${cloudinaryItems.length} portfolio items with Cloudinary images`);
      setPortfolioItems(cloudinaryItems);
      setFilteredItems(cloudinaryItems);

      // Calculate stats
      const totalImages = cloudinaryItems.reduce((acc, item) =>
        acc + (item.mediaUrls?.filter(url => url?.includes('cloudinary.com')).length || 0), 0
      );

      const lastUpdated = cloudinaryItems.length > 0
        ? new Date(Math.max(...cloudinaryItems.map(item => new Date(item.updatedAt).getTime()))).toISOString()
        : new Date().toISOString();

      const totalLikes = cloudinaryItems.reduce((acc, item) => acc + ((item as any).likes || 0), 0);
      const totalViews = cloudinaryItems.reduce((acc, item) => acc + ((item as any).views || 0), 0);

      setStats({
        total: cloudinaryItems.length,
        featured: cloudinaryItems.filter(item => item.featured).length,
        totalImages,
        lastUpdated,
        totalLikes,
        totalViews
      });

    } catch (error: any) {
      console.error('❌ Failed to load portfolio:', error);
      setError(error.message || 'Failed to load portfolio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (data: PortfolioFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('➕ Adding portfolio item:', data.title);

      // Validate Cloudinary URLs
      const cloudinaryUrls = data.mediaUrls.filter(url => url.includes('cloudinary.com'));
      if (cloudinaryUrls.length === 0) {
        throw new Error('Please upload images to Cloudinary first');
      }

      await freelancerService.addPortfolioItem({
        ...data,
        mediaUrls: cloudinaryUrls
      });

      console.log('✅ Portfolio item added successfully');
      await loadPortfolio();
      setShowForm(false);
    } catch (error: any) {
      console.error('❌ Failed to add portfolio item:', error);
      setError(error.message || 'Failed to add portfolio item');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = async (data: PortfolioFormData) => {
    if (!editingItem) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('✏️ Updating portfolio item:', editingItem._id);

      // Validate Cloudinary URLs
      const cloudinaryUrls = data.mediaUrls.filter(url => url.includes('cloudinary.com'));
      if (cloudinaryUrls.length === 0) {
        throw new Error('Please upload images to Cloudinary first');
      }

      await freelancerService.updatePortfolioItem(editingItem._id, {
        ...data,
        mediaUrls: cloudinaryUrls
      });

      console.log('✅ Portfolio item updated successfully');
      await loadPortfolio();
      setEditingItem(null);
      setShowForm(false);
    } catch (error: any) {
      console.error('❌ Failed to update portfolio item:', error);
      setError(error.message || 'Failed to update portfolio item');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      console.log('🗑️ Deleting portfolio item:', id);
      await freelancerService.deletePortfolioItem(id);
      console.log('✅ Portfolio item deleted successfully');
      await loadPortfolio();
    } catch (error: any) {
      console.error('❌ Failed to delete portfolio item:', error);
      setError(error.message || 'Failed to delete portfolio item');
    }
  };

  const handleEditClick = (item: PortfolioItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
    setError(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilter = (filter: string) => {
    setActiveFilter(filter.toLowerCase());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Touch target size for buttons
  const touchTargetSize = isTouch ? getTouchTargetSize('lg') : getTouchTargetSize('md');

  return (
    <FreelancerLayout>
      <div className={cn(
        "min-h-screen transition-colors duration-200",
        colorClasses.bg.secondary
      )}>
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className={cn(
              "rounded-xl sm:rounded-2xl border relative overflow-hidden",
              colorClasses.bg.primary,
              colorClasses.border.gray200
            )}>
              {/* Background Pattern */}
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, ${colorClasses.bg.goldenMustard.replace('bg-', '')} 1px, transparent 0)`,
                  backgroundSize: isMobile ? '30px 30px' : '40px 40px'
                }}
              />

              <div className="relative p-4 sm:p-6 md:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
                  <div>
                    <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <h1 className={cn(
                        "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold",
                        colorClasses.text.primary
                      )}>
                        My Portfolio
                      </h1>
                      <div className={cn(
                        "px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex items-center border whitespace-nowrap",
                        colorClasses.bg.goldenMustard + ' bg-opacity-10',
                        colorClasses.text.goldenMustard,
                        colorClasses.border.goldenMustard + ' border-opacity-30'
                      )}>
                        <CloudIcon className="w-3 h-3 mr-1" />
                        Cloudinary CDN
                      </div>
                    </div>
                    <p className={cn(
                      "text-xs sm:text-sm md:text-base max-w-2xl",
                      colorClasses.text.muted
                    )}>
                      Showcase your best work to attract potential clients. All images are optimized and delivered via Cloudinary for fast loading worldwide.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowForm(true)}
                    className={cn(
                      "flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl whitespace-nowrap text-sm sm:text-base",
                      colorClasses.bg.goldenMustard,
                      'hover:opacity-90 text-white',
                      touchTargetSize
                    )}
                  >
                    <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    {isMobile ? 'Add' : 'Add New Project'}
                  </button>
                </div>

                {/* Quick Stats Row - Responsive grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6">
                  <div className="text-center">
                    <p className={cn("text-lg sm:text-xl md:text-2xl font-bold", colorClasses.text.primary)}>
                      {stats.total}
                    </p>
                    <p className={cn("text-xs", colorClasses.text.muted)}>Projects</p>
                  </div>
                  <div className="text-center">
                    <p className={cn("text-lg sm:text-xl md:text-2xl font-bold", colorClasses.text.primary)}>
                      {stats.featured}
                    </p>
                    <p className={cn("text-xs", colorClasses.text.muted)}>Featured</p>
                  </div>
                  <div className="text-center">
                    <p className={cn("text-lg sm:text-xl md:text-2xl font-bold", colorClasses.text.primary)}>
                      {stats.totalImages}
                    </p>
                    <p className={cn("text-xs", colorClasses.text.muted)}>Images</p>
                  </div>
                  <div className="text-center">
                    <p className={cn("text-lg sm:text-xl md:text-2xl font-bold", colorClasses.text.primary)}>
                      {stats.totalLikes}
                    </p>
                    <p className={cn("text-xs", colorClasses.text.muted)}>Likes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar - Only show when there are items */}
          {!isLoading && portfolioItems.length > 0 && (
            <SearchFilterBar onSearch={handleSearch} onFilter={handleFilter} />
          )}

          {/* Error Display */}
          {error && (
            <div className={cn(
              "mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border flex items-start gap-3",
              colorClasses.bg.redLight,
              colorClasses.border.red
            )}>
              <ExclamationTriangleIcon className={cn("w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5", colorClasses.text.error)} />
              <div className="flex-1">
                <p className={cn("text-xs sm:text-sm font-medium", colorClasses.text.error)}>{error}</p>
                <button
                  onClick={loadPortfolio}
                  className={cn(
                    "text-xs sm:text-sm mt-2 flex items-center",
                    colorClasses.text.error,
                    'hover:underline'
                  )}
                >
                  <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Stats Dashboard */}
          {!isLoading && portfolioItems.length > 0 && (
            <div className="mb-4 sm:mb-6 md:mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <StatCard
                  icon={PhotoIcon}
                  label="Total Projects"
                  value={stats.total}
                  sublabel={`${stats.totalImages} images`}
                  trend={{ up: true, value: 12 }}
                />
                <StatCard
                  icon={StarIcon}
                  label="Featured Projects"
                  value={stats.featured}
                  sublabel={`${((stats.featured / stats.total) * 100).toFixed(0)}% of total`}
                  trend={{ up: stats.featured > 0, value: 8 }}
                />
                <StatCard
                  icon={CloudIcon}
                  label="Cloudinary Images"
                  value={stats.totalImages}
                  sublabel={`Avg ${(stats.totalImages / stats.total).toFixed(1)} per project`}
                  trend={{ up: true, value: 24 }}
                />
                <StatCard
                  icon={HeartIcon}
                  label="Total Engagement"
                  value={stats.totalLikes + stats.totalViews}
                  sublabel={`${stats.totalLikes} likes · ${stats.totalViews} views`}
                  trend={{ up: true, value: 15 }}
                />
              </div>

              {/* Last Updated */}
              <div className="mt-2 sm:mt-3 md:mt-4 flex items-center justify-end">
                <CalendarIcon className={cn("w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2", colorClasses.text.muted)} />
                <span className={cn("text-xs", colorClasses.text.muted)}>
                  Updated {formatDate(stats.lastUpdated)}
                </span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Stats Skeletons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <StatsSkeleton />
              </div>

              {/* Portfolio List Skeleton */}
              <div className={cn(
                "rounded-xl border p-3 sm:p-4",
                colorClasses.bg.primary,
                colorClasses.border.gray200
              )}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                  <div className={cn("h-5 sm:h-6 md:h-8 w-32 sm:w-40 md:w-48 rounded-lg", colorClasses.bg.muted)} />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className={cn("h-8 sm:h-10 flex-1 sm:flex-none w-20 rounded-lg", colorClasses.bg.muted)} />
                    <div className={cn("h-8 sm:h-10 flex-1 sm:flex-none w-20 rounded-lg", colorClasses.bg.muted)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl overflow-hidden animate-pulse",
                        colorClasses.bg.surface
                      )}
                    >
                      <div className={cn(
                        "w-full",
                        isMobile ? 'h-40' : 'h-48 sm:h-56',
                        colorClasses.bg.muted
                      )} />
                      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                        <div className={cn("h-4 sm:h-5 w-3/4 rounded", colorClasses.bg.muted)} />
                        <div className={cn("h-3 sm:h-4 w-1/2 rounded", colorClasses.bg.muted)} />
                        <div className="space-y-1 sm:space-y-2">
                          <div className={cn("h-2 sm:h-3 w-full rounded", colorClasses.bg.muted)} />
                          <div className={cn("h-2 sm:h-3 w-5/6 rounded", colorClasses.bg.muted)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Portfolio List */}
              <PortfolioList
                items={filteredItems}
                onEdit={handleEditClick}
                onDelete={handleDeleteItem}
                isOwnProfile={true}
                onAddNew={() => setShowForm(true)}
                isLoading={isLoading}
              />

              {/* Empty State with Add Button */}
              {filteredItems.length === 0 && !isLoading && (
                <div
                  className={cn(
                    "text-center py-8 sm:py-12 md:py-16 rounded-xl sm:rounded-2xl border-2 border-dashed",
                    colorClasses.bg.primary,
                    colorClasses.border.goldenMustard + ' border-opacity-30'
                  )}
                >
                  <div className="max-w-md mx-auto px-4">
                    <div
                      className={cn(
                        "w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center",
                        colorClasses.bg.goldenMustard + ' bg-opacity-10',
                        colorClasses.text.goldenMustard
                      )}
                    >
                      <CloudIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <h3 className={cn("text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3", colorClasses.text.primary)}>
                      {searchQuery || activeFilter !== 'all' ? 'No Matching Projects' : 'Start Your Portfolio'}
                    </h3>
                    <p className={cn("text-xs sm:text-sm md:text-base mb-4 sm:mb-6", colorClasses.text.muted)}>
                      {searchQuery || activeFilter !== 'all'
                        ? 'Try adjusting your search or filter to find what you\'re looking for.'
                        : 'Upload your work to Cloudinary and showcase your skills to attract potential clients.'
                      }
                    </p>
                    {searchQuery || activeFilter !== 'all' ? (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setActiveFilter('all');
                        }}
                        className={cn(
                          "inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200",
                          colorClasses.bg.goldenMustard,
                          'hover:opacity-90 text-white',
                          touchTargetSize
                        )}
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowForm(true)}
                        className={cn(
                          "inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200",
                          colorClasses.bg.goldenMustard,
                          'hover:opacity-90 text-white',
                          touchTargetSize
                        )}
                      >
                        <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Add Your First Project
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Portfolio Form Modal */}
          {showForm && (
            <PortfolioForm
              item={editingItem}
              onSubmit={editingItem ? handleEditItem : handleAddItem}
              onCancel={handleFormClose}
              isLoading={isLoading}
            />
          )}

          {/* Floating Action Button for Mobile */}
          {!isLoading && portfolioItems.length > 0 && isMobile && (
            <button
              onClick={() => setShowForm(true)}
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-50"
              style={{
                background: `linear-gradient(135deg, ${colorClasses.bg.goldenMustard.replace('bg-', '')}, ${colorClasses.bg.goldenMustard.replace('bg-', '')})`,
                color: 'white',
                boxShadow: `0 4px 15px -3px ${colorClasses.bg.goldenMustard.replace('bg-', '')}60`
              }}
              aria-label="Add new project"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </FreelancerLayout>
  );
};

export default FreelancerPortfolio;