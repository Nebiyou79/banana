/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/candidate/jobs/index.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Job, JobFilters, jobService } from '@/services/jobService';
import { profileService } from '@/services/profileService';
import { candidateService } from '@/services/candidateService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import CandidateJobCard from '@/components/job/CandidateJobCard';
import JobFilter, { JobFilterState, buildApiFilters } from '@/components/job/JobFilter';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Search,
  MapPin,
  TrendingUp,
  Building2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Sparkles,
  BookmarkCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { colorClasses } from '@/utils/color';

const JobsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const themeMode = 'light'; // Default theme

  // Local filter state for the JobFilter component - UPDATED STRUCTURE
  const [filterState, setFilterState] = useState<JobFilterState>({
    search: '',
    category: null,
    types: [],
    location: null,
    experienceLevel: null,
    salaryMode: null,
    datePosted: null,
    workArrangement: null,
    remote: null,
    featured: false,
    urgent: false
  });

  // API filter state for job queries
  const [apiFilters, setApiFilters] = useState<JobFilters>({
    page: 1,
    limit: 12,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [isFiltering, setIsFiltering] = useState(false);
  const [showFilters, setShowFilters] = useState(true); // Default to showing filters on desktop

  // Fetch current user's profile
  const {
    data: currentUserProfile,
    isLoading: profileLoading
  } = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: () => profileService.getProfile(),
    enabled: isAuthenticated,
  });

  // Fetch jobs using candidate service
  const {
    data: jobsData,
    isLoading: jobsLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['candidateJobs', apiFilters],
    queryFn: () => jobService.getJobsForCandidate(apiFilters),
    retry: 2,
    enabled: !!user,
  });

  // Fetch saved jobs
  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (isAuthenticated) {
        try {
          const saved = await candidateService.getSavedJobs();
          const savedJobIds = saved.map((job: any) => job._id || job.job?._id);
          setSavedJobs(new Set(savedJobIds));
        } catch (error) {
          console.error('Error fetching saved jobs:', error);
          // Don't show error toast for saved jobs - it's optional
        }
      }
    };

    fetchSavedJobs();
  }, [isAuthenticated]);

  // Handle filter state changes
  const handleFilterChange = useCallback((newFilters: JobFilterState) => {
    setFilterState(newFilters);
  }, []);

  // Apply filters to API
  const handleApplyFilters = useCallback(() => {
    setIsFiltering(true);
    try {
      const apiFilterParams = buildApiFilters(filterState);
      setApiFilters(prev => ({
        ...prev,
        ...apiFilterParams,
        page: 1 // Reset to first page on filter change
      }));
      toast({
        title: 'Filters Applied',
        description: 'Your filters have been applied successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Filter error',
        description: 'Failed to apply filters',
        variant: 'destructive'
      });
    } finally {
      setIsFiltering(false);
    }
  }, [filterState, toast]);

  // Clear all filters - UPDATED TO MATCH NEW STRUCTURE
  const handleClearFilters = useCallback(() => {
    setFilterState({
      search: '',
      category: null,
      types: [],
      location: null,
      experienceLevel: null,
      salaryMode: null,
      datePosted: null,
      workArrangement: null,
      remote: null,
      featured: false,
      urgent: false
    });
    setApiFilters({
      page: 1,
      limit: 12,
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    toast({
      title: 'Filters Cleared',
      description: 'All filters have been cleared',
      variant: 'default'
    });
  }, [toast]);

  // Handle save/unsave job
  const handleSaveJob = async (jobId: string, saved: boolean) => {
    try {
      if (saved) {
        await candidateService.saveJob(jobId);
        setSavedJobs(prev => new Set(prev.add(jobId)));
        toast({
          title: 'Job Saved',
          description: 'Job has been saved to your favorites',
          variant: 'default'
        });
      } else {
        await candidateService.unsaveJob(jobId);
        setSavedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        toast({
          title: 'Job Removed',
          description: 'Job has been removed from your favorites',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Error toggling save:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update saved jobs',
        variant: 'destructive'
      });
    }
  };

  // Handle share job
  const handleShareJob = async (jobId: string, platform: string) => {
    toast({
      title: 'Shared',
      description: `Job shared via ${platform}`,
      variant: 'default'
    });
  };

  // Handle apply job - navigation is handled in CandidateJobCard
  const handleApplyJob = async (jobId: string) => {
    // Navigation handled in CandidateJobCard component
  };

  // Handle retry on error
  const handleRetry = () => {
    refetch();
  };

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setApiFilters(prev => ({ ...prev, page }));
  }, []);

  // Calculate market data from available data
  const marketData = useMemo(() => {
    if (!jobsData?.data) {
      return {
        jobsByRegion: [],
        totalJobs: 0,
        activeJobs: 0,
        remoteJobs: 0,
      };
    }

    const jobs = jobsData.data;
    const pagination = jobsData.pagination;

    return {
      jobsByRegion: [
        {
          _id: 'addis-ababa',
          count: jobs.filter((job: Job) => job.location?.region === 'addis-ababa').length
        },
        {
          _id: 'oromia',
          count: jobs.filter((job: Job) => job.location?.region === 'oromia').length
        },
        {
          _id: 'amhara',
          count: jobs.filter((job: Job) => job.location?.region === 'amhara').length
        },
      ],
      totalJobs: pagination?.totalResults || jobs.length,
      activeJobs: jobs.filter((job: Job) => job.status === 'active').length,
      remoteJobs: jobs.filter((job: Job) => job.remote === 'remote').length,
    };
  }, [jobsData]);

  // Pagination data - using correct pagination structure
  const pagination = jobsData?.pagination;
  const currentPage = pagination?.current ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.totalResults ?? 0;
  const itemsPerPage = pagination?.resultsPerPage ?? 12;

  // Generate pagination array with ellipsis
  const generatePagination = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're at the beginning
      if (currentPage <= 2) {
        end = 4;
      }

      // Adjust if we're at the end
      if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add visible pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Get filter label for display
  const getFilterLabel = (type: keyof JobFilterState, value: any): string => {
    switch (type) {
      case 'category':
        const category = jobService.getJobCategories().find(c => c.value === value);
        return category ? `Category: ${category.label}` : `Category: ${value}`;
      case 'location':
        const region = jobService.getEthiopianRegions().find(r => r.slug === value);
        return region ? `Location: ${region.name}` : `Location: ${value}`;
      case 'experienceLevel':
        const experienceLevels = [
          { value: 'fresh-graduate', label: 'Fresh Graduate' },
          { value: 'entry-level', label: 'Entry Level' },
          { value: 'mid-level', label: 'Mid Level' },
          { value: 'senior-level', label: 'Senior Level' },
          { value: 'managerial', label: 'Managerial' },
          { value: 'director', label: 'Director' },
          { value: 'executive', label: 'Executive' }
        ];
        const exp = experienceLevels.find(e => e.value === value);
        return exp ? `Experience: ${exp.label}` : `Experience: ${value}`;
      case 'salaryMode':
        const salaryModes = [
          { value: 'range', label: 'Salary Range' },
          { value: 'hidden', label: 'Salary Hidden' },
          { value: 'negotiable', label: 'Negotiable' },
          { value: 'company-scale', label: 'Company Scale' }
        ];
        const mode = salaryModes.find(m => m.value === value);
        return mode ? `Salary: ${mode.label}` : `Salary: ${value}`;
      case 'datePosted':
        const dateOptions = [
          { value: '24h', label: 'Last 24 hours' },
          { value: '7d', label: 'Last 7 days' },
          { value: '30d', label: 'Last 30 days' },
          { value: 'all', label: 'All time' }
        ];
        const date = dateOptions.find(d => d.value === value);
        return date ? `Date: ${date.label}` : `Date: ${value}`;
      case 'workArrangement':
        return `Work: ${value}`;
      case 'remote':
        return `Remote: ${value}`;
      case 'search':
        return `Search: ${value}`;
      default:
        return `${type}: ${value}`;
    }
  };

  // Loading and error states
  if (error) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className={`min-h-screen p-4 ${colorClasses.bg.white} dark:${colorClasses.bg.darkNavy}`}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-2xl">😕</div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Unable to Load Jobs
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We`re having trouble loading job listings. Please check your connection and try again.
              </p>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isLoadingPage = jobsLoading || profileLoading;

  return (
    <DashboardLayout requiredRole="candidate">
      <div className={`min-h-screen py-4 sm:py-8 ${colorClasses.bg.white} dark:${colorClasses.bg.darkNavy}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">

          {/* =============================================
                HEADER SECTION
          ============================================= */}
          <div className="text-center mb-6 sm:mb-10">
            <h1 className={`text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 px-2 ${colorClasses.text.gray800} dark:${colorClasses.text.white}`}>
              Find Your <span className="text-blue-600 dark:text-blue-400">Dream Job</span>
            </h1>
            <p className={`text-base sm:text-xl max-w-3xl mx-auto mb-4 sm:mb-6 px-2 ${colorClasses.text.gray800} dark:${colorClasses.text.gray400}`}>
              Discover amazing opportunities from top companies in Ethiopia and worldwide
            </p>

            {/* Quick Stats */}
            {!isLoadingPage && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto px-2">
                <div className={`p-2 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border ${colorClasses.bg.white} dark:${colorClasses.bg.darkNavy} ${colorClasses.border.gray400} dark:${colorClasses.border.gray800}`}>
                  <div className="flex items-center justify-center w-6 h-6 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-lg mb-1 sm:mb-2 mx-auto">
                    <Building2 className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className={`text-sm sm:text-2xl font-bold ${colorClasses.text.gray800} dark:${colorClasses.text.white}`}>
                    {marketData.totalJobs || 0}+
                  </div>
                  <div className={`text-xs ${colorClasses.text.gray800} dark:${colorClasses.text.gray400}`}>
                    Active Jobs
                  </div>
                </div>

                <div className={`p-2 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border ${colorClasses.bg.white} dark:${colorClasses.bg.darkNavy} ${colorClasses.border.gray400} dark:${colorClasses.border.gray800}`}>
                  <div className="flex items-center justify-center w-6 h-6 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg sm:rounded-lg mb-1 sm:mb-2 mx-auto">
                    <MapPin className="w-3 h-3 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className={`text-sm sm:text-2xl font-bold ${colorClasses.text.gray800} dark:${colorClasses.text.white}`}>
                    {marketData.jobsByRegion.length || 3}+
                  </div>
                  <div className={`text-xs ${colorClasses.text.gray800} dark:${colorClasses.text.gray400}`}>
                    Regions
                  </div>
                </div>

                <div className={`p-2 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border ${colorClasses.bg.white} dark:${colorClasses.bg.darkNavy} ${colorClasses.border.gray400} dark:${colorClasses.border.gray800}`}>
                  <div className="flex items-center justify-center w-6 h-6 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg sm:rounded-lg mb-1 sm:mb-2 mx-auto">
                    <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className={`text-sm sm:text-2xl font-bold ${colorClasses.text.gray800} dark:${colorClasses.text.white}`}>
                    {marketData.remoteJobs || 0}+
                  </div>
                  <div className={`text-xs ${colorClasses.text.gray800} dark:${colorClasses.text.gray400}`}>
                    Remote Jobs
                  </div>
                </div>

                <div className={`p-2 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border ${colorClasses.bg.white} dark:${colorClasses.bg.darkNavy} ${colorClasses.border.gray400} dark:${colorClasses.border.gray800}`}>
                  <div className="flex items-center justify-center w-6 h-6 sm:w-10 sm:h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg sm:rounded-lg mb-1 sm:mb-2 mx-auto">
                    <Bookmark className="w-3 h-3 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className={`text-sm sm:text-2xl font-bold ${colorClasses.text.gray800} dark:${colorClasses.text.white}`}>
                    {savedJobs.size}
                  </div>
                  <div className={`text-xs ${colorClasses.text.gray800} dark:${colorClasses.text.gray400}`}>
                    Saved Jobs
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =============================================
                FILTER SECTION
          ============================================= */}
          <div className="mb-6">
            {/* Filter Header/Toggle */}
            <div className={`mb-4 p-3 sm:p-4 rounded-xl ${colorClasses.bg.white} dark:${colorClasses.bg.darkNavy} border ${colorClasses.border.gray400} dark:${colorClasses.border.gray800}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <h2 className={`text-lg sm:text-xl font-bold ${colorClasses.text.gray800} dark:${colorClasses.text.white} sm:mr-4`}>
                      Job Opportunities
                    </h2>

                    {/* Results count - desktop */}
                    {jobsData && (
                      <p className={`text-sm hidden sm:block ${colorClasses.text.gray800} dark:${colorClasses.text.gray400}`}>
                        • Showing {jobsData.data?.length || 0} of {totalItems} jobs
                        {apiFilters.search && ` for "${apiFilters.search}"`}
                      </p>
                    )}
                  </div>

                  {/* Filter Toggle Button - Both Mobile & Desktop */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center px-3 sm:px-4 py-2 rounded-lg border ${colorClasses.border.gray400} dark:${colorClasses.border.gray800} ${colorClasses.text.gray800} dark:${colorClasses.text.white} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                    {showFilters ? (
                      <ChevronUp className="w-4 h-4 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-2" />
                    )}
                  </button>
                </div>

                {/* Results count - mobile */}
                {jobsData && (
                  <p className={`text-sm w-full sm:hidden ${colorClasses.text.gray800} dark:${colorClasses.text.gray400}`}>
                    Showing {jobsData.data?.length || 0} of {totalItems} jobs
                    {apiFilters.search && ` for "${apiFilters.search}"`}
                  </p>
                )}

                {jobsData && jobsData.data && jobsData.data.length > 0 && (
                  <Link
                    href="/dashboard/candidate/saved-jobs"
                    className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border font-medium text-sm ${colorClasses.bg.white} dark:${colorClasses.bg.darkNavy} ${colorClasses.border.gray400} dark:${colorClasses.border.gray800} ${colorClasses.text.gray800} dark:${colorClasses.text.white} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                  >
                    <BookmarkCheck className="w-4 h-4 mr-2 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
                    Saved ({savedJobs.size})
                  </Link>
                )}
              </div>

              {/* Active Filters Badges - Show even when filters are collapsed */}
              {(filterState.search ||
                filterState.category ||
                filterState.location ||
                filterState.experienceLevel ||
                filterState.salaryMode ||
                filterState.datePosted ||
                filterState.workArrangement ||
                filterState.remote ||
                filterState.types?.length > 0 ||
                filterState.featured ||
                filterState.urgent) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(filterState).map(([key, value]) => {
                      if (!value || (Array.isArray(value) && value.length === 0)) return null;

                      if (key === 'search' && value) {
                        return (
                          <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {getFilterLabel('search', value)}
                            <button
                              onClick={() => {
                                const newFilters = { ...filterState, search: '' };
                                setFilterState(newFilters);
                                handleApplyFilters();
                              }}
                              className="ml-2 hover:text-blue-900 dark:hover:text-blue-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      }

                      if (key === 'types' && Array.isArray(value) && value.length > 0) {
                        return (
                          <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                            Types: {value.length} selected
                            <button
                              onClick={() => {
                                const newFilters = { ...filterState, types: [] };
                                setFilterState(newFilters);
                                handleApplyFilters();
                              }}
                              className="ml-2 hover:text-orange-900 dark:hover:text-orange-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      }

                      if (key === 'featured' && value === true) {
                        return (
                          <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                            Featured Only
                            <button
                              onClick={() => {
                                const newFilters = { ...filterState, featured: false };
                                setFilterState(newFilters);
                                handleApplyFilters();
                              }}
                              className="ml-2 hover:text-purple-900 dark:hover:text-purple-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      }

                      if (key === 'urgent' && value === true) {
                        return (
                          <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            Urgent Only
                            <button
                              onClick={() => {
                                const newFilters = { ...filterState, urgent: false };
                                setFilterState(newFilters);
                                handleApplyFilters();
                              }}
                              className="ml-2 hover:text-red-900 dark:hover:text-red-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      }

                      if (typeof value === 'string' && key !== 'search') {
                        return (
                          <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            {getFilterLabel(key as keyof JobFilterState, value)}
                            <button
                              onClick={() => {
                                const newFilters = { ...filterState, [key]: null };
                                setFilterState(newFilters);
                                handleApplyFilters();
                              }}
                              className="ml-2 hover:text-green-900 dark:hover:text-green-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      }

                      return null;
                    })}

                    {Object.values(filterState).some(val =>
                      val !== null && val !== '' && val !== false &&
                      (!Array.isArray(val) || val.length > 0)
                    ) && (
                        <button
                          onClick={handleClearFilters}
                          className={`text-xs underline ${colorClasses.text.gray800} dark:${colorClasses.text.gray400} hover:text-gray-900 dark:hover:text-gray-200`}
                        >
                          Clear all
                        </button>
                      )}
                  </div>
                )}
            </div>

            {/* Filter Component - Collapsible on Both Mobile & Desktop */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[2000px] opacity-100 mb-6' : 'max-h-0 opacity-0'
              }`}>
              <div className={`p-4 sm:p-6 rounded-xl border ${colorClasses.bg.white} dark:${colorClasses.bg.darkNavy} ${colorClasses.border.gray400} dark:${colorClasses.border.gray800}`}>
                <JobFilter
                  filters={filterState}
                  onChange={handleFilterChange}
                  onApply={handleApplyFilters}
                  onClear={handleClearFilters}
                  isLoading={isFiltering}
                  themeMode={themeMode}
                />
              </div>
            </div>
          </div>

          {/* =============================================
                MAIN CONTENT - JOBS LISTING
          ============================================= */}
          <div className="mb-8">
            {/* Jobs Grid */}
            {isLoadingPage ? (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className={`mt-4 ${colorClasses.text.gray800} dark:${colorClasses.text.gray400}`}>
                    Loading job opportunities...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Empty State */}
                {(!jobsData?.data || jobsData.data.length === 0) ? (
                  <div className="text-center py-12 sm:py-16">
                    <div className={`rounded-xl sm:rounded-2xl p-6 sm:p-12 shadow-lg border max-w-2xl mx-auto ${colorClasses.bg.white} dark:${colorClasses.bg.darkNavy} ${colorClasses.border.gray400} dark:${colorClasses.border.gray800}`}>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className={`text-xl sm:text-2xl font-bold mb-3 ${colorClasses.text.gray800} dark:${colorClasses.text.white}`}>
                        No jobs found
                      </h3>
                      <p className={`mb-8 max-w-md mx-auto text-sm sm:text-base ${colorClasses.text.gray800} dark:${colorClasses.text.gray400}`}>
                        We couldn`t find any jobs matching your criteria. Try adjusting your filters or search terms.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={handleClearFilters}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                        >
                          Clear All Filters
                        </button>
                        <button
                          onClick={() => setShowFilters(true)}
                          className="px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors text-sm sm:text-base"
                        >
                          Show Filters
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Jobs List */}
                    <div className="grid gap-3 sm:gap-6 px-1 sm:px-0">
                      {jobsData.data.map((job: Job) => (
                        <div key={job._id} className="overflow-hidden">
                          <CandidateJobCard
                            job={job}
                            ownerProfile={currentUserProfile}
                            onSave={handleSaveJob}
                            onShare={handleShareJob}
                            onApply={handleApplyJob}
                            isSaved={savedJobs.has(job._id)}
                            userApplications={[]}
                            showSaveButton={true}
                            themeMode={themeMode}
                            variant="default"
                          />
                        </div>
                      ))}
                    </div>

                    {/* =============================================
                          PAGINATION SECTION
                    ============================================= */}
                    {totalPages > 1 && (
                      <div className="mt-8 sm:mt-12">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                          <p className={`text-sm ${colorClasses.text.gray800} dark:${colorClasses.text.gray400}`}>
                            Page {currentPage} of {totalPages} • {totalItems} total jobs
                          </p>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className={`px-3 sm:px-4 py-2 rounded-lg border flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${colorClasses.border.gray400} dark:${colorClasses.border.gray800} ${colorClasses.text.gray800} dark:${colorClasses.text.white} hover:bg-gray-50 dark:hover:bg-gray-700`}
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span className="hidden sm:inline">Previous</span>
                              <span className="sm:hidden">Prev</span>
                            </button>

                            {/* Desktop Pagination Numbers */}
                            <div className="hidden sm:flex items-center space-x-1">
                              {generatePagination().map((page, index) => (
                                page === '...' ? (
                                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400 dark:text-gray-500">
                                    ...
                                  </span>
                                ) : (
                                  <button
                                    key={page}
                                    onClick={() => handlePageChange(Number(page))}
                                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm min-w-[40px] ${currentPage === page
                                        ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-lg'
                                        : `${colorClasses.text.gray800} dark:${colorClasses.text.white} hover:bg-gray-100 dark:hover:bg-gray-700 border ${colorClasses.border.gray400} dark:${colorClasses.border.gray800}`
                                      }`}
                                  >
                                    {page}
                                  </button>
                                )
                              ))}
                            </div>

                            {/* Mobile pagination info */}
                            <div className="sm:hidden flex items-center space-x-2">
                              <span className={`text-sm ${colorClasses.text.gray800} dark:${colorClasses.text.gray400}`}>
                                {currentPage} / {totalPages}
                              </span>
                            </div>

                            <button
                              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className={`px-3 sm:px-4 py-2 rounded-lg border flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${colorClasses.border.gray400} dark:${colorClasses.border.gray800} ${colorClasses.text.gray800} dark:${colorClasses.text.white} hover:bg-gray-50 dark:hover:bg-gray-700`}
                            >
                              <span className="hidden sm:inline">Next</span>
                              <span className="sm:hidden">Next</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* =============================================
                FEATURED CALLOUT
          ============================================= */}
          {!isLoadingPage && jobsData?.data && jobsData.data.length > 0 && (
            <div className="mt-8 sm:mt-12 mx-3 sm:mx-0">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white text-center">
                <div className="flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 mr-2" />
                  <h3 className="text-lg sm:text-2xl font-bold">
                    Ready to take the next step in your career?
                  </h3>
                </div>
                <p className="text-blue-100 dark:text-blue-200 mb-6 max-w-2xl mx-auto text-xs sm:text-base">
                  Join thousands of professionals who found their dream jobs through our platform.
                  Create your profile and let employers find you!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Link href="/dashboard/candidate/profile">
                    <button className="px-4 sm:px-8 py-3 bg-white text-blue-600 dark:text-blue-700 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-100 transition-colors shadow-lg text-sm sm:text-base w-full sm:w-auto">
                      Complete Your Profile
                    </button>
                  </Link>
                  <Link href="/dashboard/candidate/saved-jobs">
                    <button className="px-4 sm:px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 dark:hover:text-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto">
                      View Saved Jobs
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobsPage;