/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/candidate/jobs/index.tsx - FIXED
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Job, JobFilters as JobFiltersType, jobService, SalaryMode } from '@/services/jobService';
import { profileService } from '@/services/profileService';
import { candidateService } from '@/services/candidateService';
import { applicationService } from '@/services/applicationService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import CandidateJobCard from '@/components/job/CandidateJobCard';
import JobFilter from '@/components/job/JobFilter';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  MapPin,
  Building2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Sparkles,
  BookmarkCheck,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/use-toast';
import { getTheme, ThemeMode } from '@/utils/color';

const JobsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [themeMode] = useState<ThemeMode>('light');
  const theme = getTheme(themeMode);

  // ===== FILTER STATE - SINGLE SOURCE OF TRUTH =====
  const [filters, setFilters] = useState<JobFiltersType>({
    page: 1,
    limit: 12,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    demographicSex: undefined,
    opportunityType: undefined,
  });

  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);

  // Store job owner profiles
  const [jobOwnerProfiles, setJobOwnerProfiles] = useState<Map<string, any>>(new Map());

  // ===== HELPER FUNCTION TO PARSE URL QUERY PARAMS =====
  const parseQueryParams = useCallback((query: Record<string, any>): JobFiltersType => {
    const parsed: JobFiltersType = {
      page: 1,
      limit: 12,
      demographicSex: undefined,
      opportunityType: undefined,
    };

    Object.keys(query).forEach(key => {
      const value = query[key];
      if (!value) return;

      // Handle array fields - they can be either single or multiple
      if (key === 'category' || key === 'type') {
        const splitValues = (value as string).split(',');
        if (splitValues.length === 1) {
          // Single value - store as string
          (parsed as any)[key] = splitValues[0];
        } else {
          // Multiple values - store as array
          (parsed as any)[key] = splitValues;
        }
      }
      // Handle skills array
      else if (key === 'skills') {
        parsed.skills = Array.isArray(value) ? value : (value as string).split(',');
      }
      // Handle number fields
      else if (key === 'minSalary' || key === 'maxSalary' || key === 'page' || key === 'limit') {
        parsed[key] = Number(value);
      }
      // Handle boolean fields
      else if (key === 'featured' || key === 'urgent') {
        parsed[key] = value === 'true';
      }
      // Handle salary mode (enum)
      else if (key === 'salaryMode') {
        (parsed as any)[key] = value as SalaryMode;
      }
      // Handle string fields
      else if (key === 'search' || key === 'location' || key === 'experienceLevel' ||
        key === 'remote' || key === 'educationLevel' || key === 'jobType' ||
        key === 'status' || key === 'company' || key === 'sortBy' || key === 'sortOrder' ||
        key === 'workArrangement' || key === 'opportunityType' || key === 'demographicSex') { // ADDED
        (parsed as any)[key] = value as string;
      }
    });

    return parsed;
  }, []);

  // ===== SYNC FILTERS WITH URL (ON INITIAL LOAD) =====
  useEffect(() => {
    if (Object.keys(router.query).length > 0) {
      const parsedFilters = parseQueryParams(router.query);
      setFilters(prev => ({ ...prev, ...parsedFilters }));
    }
  }, []); // Only run on mount

  // ===== UPDATE URL WHEN FILTERS CHANGE =====
  useEffect(() => {
    const query: Record<string, any> = {};

    // Add only active filters to URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        // Skip default values
        if (key === 'page' && value === 1) return;
        if (key === 'limit' && value === 12) return;
        if (key === 'sortBy' && value === 'createdAt') return;
        if (key === 'sortOrder' && value === 'desc') return;

        // Handle array values - join with comma
        if (Array.isArray(value) && value.length > 0) {
          query[key] = value.join(',');
        }
        // Handle single values
        else if (!Array.isArray(value)) {
          query[key] = value;
        }
      }
    });

    // Add page if greater than 1
    if (filters.page && filters.page > 1) {
      query.page = filters.page;
    }

    // Only update URL if there are actual changes to prevent infinite loops
    const currentQuery = JSON.stringify(router.query);
    const newQuery = JSON.stringify(query);

    if (currentQuery !== newQuery) {
      // Use replace instead of push to avoid adding to history stack
      router.replace({
        pathname: router.pathname,
        query
      }, undefined, { shallow: true });
    }
  }, [filters, router]);

  // ===== FETCH CURRENT USER PROFILE =====
  const {
    data: currentUserProfile,
    isLoading: profileLoading
  } = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: () => profileService.getProfile(),
    enabled: isAuthenticated,
  });

  // ===== FETCH JOBS USING JOBFILTER - PASS FILTERS DIRECTLY =====
  // FIXED: Removed manual isFiltering state, using isFetching from useQuery
  const {
    data: jobsData,
    isLoading: jobsLoading,
    isFetching: isFiltering, // FIXED: Use React Query's built-in fetching state
    error,
    refetch
  } = useQuery({
    queryKey: ['candidateJobs', filters],
    queryFn: async () => {
      try {
        // Use the candidate-specific endpoint
        const response = await jobService.getJobsForCandidate(filters);
        return response;
      } catch (error) {
        console.error('Error fetching jobs:', error);
        throw error;
      }
    },
    retry: 2,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // ===== FETCH USER APPLICATIONS =====
  const {
    data: userApplicationsData,
    refetch: refetchApplications
  } = useQuery({
    queryKey: ['candidateApplications'],
    queryFn: async () => {
      try {
        const response = await applicationService.getMyApplications();
        return response.data || [];
      } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
      }
    },
    enabled: isAuthenticated,
  });

  // ===== FETCH SAVED JOBS =====
  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (isAuthenticated) {
        try {
          const saved = await candidateService.getSavedJobs();
          const savedJobIds = saved.map((job: any) => job._id || job.job?._id);
          setSavedJobs(new Set(savedJobIds.filter(Boolean)));
        } catch (error) {
          console.error('Error fetching saved jobs:', error);
        }
      }
    };

    fetchSavedJobs();
  }, [isAuthenticated]);

  // ===== FETCH JOB OWNER PROFILES =====
  useEffect(() => {
    const fetchJobOwnerProfiles = async () => {
      if (!jobsData?.data?.length) return;

      const newProfiles = new Map(jobOwnerProfiles);
      let hasNewProfiles = false;

      for (const job of jobsData.data) {
        const ownerId = job.createdBy;
        if (!ownerId || newProfiles.has(ownerId)) continue;

        try {
          const ownerProfile = await profileService.getPublicProfile(ownerId);
          newProfiles.set(ownerId, ownerProfile);
          hasNewProfiles = true;
        } catch (error) {
          console.error(`Error fetching profile for owner ${ownerId}:`, error);
          newProfiles.set(ownerId, null);
        }
      }

      if (hasNewProfiles) {
        setJobOwnerProfiles(newProfiles);
      }
    };

    fetchJobOwnerProfiles();
  }, [jobsData?.data]);

  // ===== FILTER HANDLER - RECEIVES UPDATED FILTERS FROM JOBFILTER =====
  const handleFilterChange = useCallback((newFilters: JobFiltersType) => {
    setFilters(newFilters);
  }, []);

  // ===== CLEAR ALL FILTERS =====
  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 12,
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      demographicSex: undefined,
      opportunityType: undefined,
    });

    toast({
      title: 'Filters Cleared',
      description: 'All filters have been reset',
      variant: 'default'
    });
  }, [toast]);

  // ===== JOB ACTIONS =====
  const handleSaveJob = async (jobId: string, saved: boolean) => {
    try {
      if (saved) {
        await jobService.saveJob(jobId);
        setSavedJobs(prev => new Set([...prev, jobId]));
        toast({
          title: 'Job Saved',
          description: 'Job has been saved to your favorites',
          variant: 'default'
        });
      } else {
        await jobService.unsaveJob(jobId);
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

  const handleShareJob = async (jobId: string, platform: string) => {
    toast({
      title: 'Shared',
      description: `Job shared via ${platform}`,
      variant: 'default'
    });
  };

  const handleApplyJob = async (jobId: string) => {
    refetchApplications();
  };

  const handleRetry = () => {
    refetch();
  };

  // ===== PAGINATION =====
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ===== HELPER FUNCTIONS =====
  const getJobOwnerProfile = (job: Job) => {
    if (!job.createdBy) return null;
    return jobOwnerProfiles.get(job.createdBy) || null;
  };

  // ===== MEMOIZED VALUES =====
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

  const activeFilterCount = useMemo(() => {
    if (!filters) return 0;

    return Object.keys(filters).filter(key =>
      !['page', 'limit', 'sortBy', 'sortOrder', 'search'].includes(key) &&
      filters[key as keyof JobFiltersType] !== undefined &&
      filters[key as keyof JobFiltersType] !== '' &&
      filters[key as keyof JobFiltersType] !== null &&
      (!Array.isArray(filters[key as keyof JobFiltersType]) ||
        (filters[key as keyof JobFiltersType] as any[]).length > 0)
    ).length;
  }, [filters]);

  const pagination = jobsData?.pagination;
  const currentPage = pagination?.current ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.totalResults ?? 0;

  // Generate pagination numbers
  const generatePagination = useCallback(() => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        end = 4;
      }
      if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  // ===== LOADING STATES =====
  const isLoadingPage = jobsLoading || profileLoading || isFiltering; // FIXED: Use isFiltering from useQuery

  if (error) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className="min-h-screen py-4 sm:py-8" style={{ backgroundColor: theme.bg.primary }}>
          <div className="max-w-4xl mx-auto px-3 sm:px-4">
            <div
              className="text-center p-8 rounded-2xl shadow-lg border"
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: theme.border.primary
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: themeMode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }}
              >
                <div className="text-2xl">😕</div>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.text.primary }}>
                Unable to Load Jobs
              </h2>
              <p className="mb-6" style={{ color: theme.text.secondary }}>
                We`re having trouble loading job listings. Please check your connection and try again.
              </p>
              <button
                onClick={handleRetry}
                className="px-6 py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB',
                  color: '#FFFFFF'
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="min-h-screen py-4 sm:py-8" style={{ backgroundColor: theme.bg.primary }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">

          {/* ===== HERO SECTION ===== */}
          <div className="mb-8 sm:mb-12">
            <div className="text-center">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
                style={{ color: theme.text.primary }}
              >
                Find Your <span style={{ color: themeMode === 'dark' ? '#60A5FA' : '#2563EB' }}>Dream Job</span>
              </h1>
              <p
                className="text-lg sm:text-xl max-w-3xl mx-auto mb-8"
                style={{ color: theme.text.secondary }}
              >
                Discover thousands of opportunities from top companies in Ethiopia and beyond
              </p>

              {/* Quick Stats */}
              {!isLoadingPage && jobsData?.data && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
                  <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg.secondary, borderColor: theme.border.primary }}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg mx-auto mb-2" style={{ backgroundColor: themeMode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }}>
                      <Briefcase className="w-5 h-5" style={{ color: themeMode === 'dark' ? '#93C5FD' : '#2563EB' }} />
                    </div>
                    <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>{marketData.totalJobs}+</div>
                    <div className="text-sm" style={{ color: theme.text.muted }}>Active Jobs</div>
                  </div>

                  <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg.secondary, borderColor: theme.border.primary }}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg mx-auto mb-2" style={{ backgroundColor: themeMode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }}>
                      <Building2 className="w-5 h-5" style={{ color: themeMode === 'dark' ? '#34D399' : '#059669' }} />
                    </div>
                    <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>100+</div>
                    <div className="text-sm" style={{ color: theme.text.muted }}>Companies</div>
                  </div>

                  <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg.secondary, borderColor: theme.border.primary }}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg mx-auto mb-2" style={{ backgroundColor: themeMode === 'dark' ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE' }}>
                      <MapPin className="w-5 h-5" style={{ color: themeMode === 'dark' ? '#C4B5FD' : '#7C3AED' }} />
                    </div>
                    <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>{marketData.remoteJobs}+</div>
                    <div className="text-sm" style={{ color: theme.text.muted }}>Remote Jobs</div>
                  </div>

                  <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg.secondary, borderColor: theme.border.primary }}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg mx-auto mb-2" style={{ backgroundColor: themeMode === 'dark' ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }}>
                      <Bookmark className="w-5 h-5" style={{ color: themeMode === 'dark' ? '#FCD34D' : '#D97706' }} />
                    </div>
                    <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>{savedJobs.size}</div>
                    <div className="text-sm" style={{ color: theme.text.muted }}>Saved Jobs</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===== FILTER SECTION ===== */}
          <div className="mb-8">
            {/* Filter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold" style={{ color: theme.text.primary }}>
                  Browse Jobs
                </h2>
                {jobsData?.data && (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF',
                      color: themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                    }}
                  >
                    {totalItems} jobs
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: themeMode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                      color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626',
                      border: `1px solid ${themeMode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}
                  >
                    <X className="w-4 h-4" />
                    Clear All ({activeFilterCount})
                  </button>
                )}
                <Link
                  href="/dashboard/candidate/saved-jobs"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: theme.bg.primary,
                    borderColor: theme.border.primary,
                    color: theme.text.primary
                  }}
                >
                  <BookmarkCheck className="w-4 h-4" style={{ color: themeMode === 'dark' ? '#FCD34D' : '#D97706' }} />
                  <span className="hidden sm:inline">Saved Jobs</span>
                  <span className="sm:hidden">Saved</span>
                  {savedJobs.size > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-500 text-white">
                      {savedJobs.size}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border lg:hidden"
                  style={{
                    backgroundColor: theme.bg.primary,
                    borderColor: theme.border.primary,
                    color: theme.text.primary
                  }}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-500 text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* JobFilter Component - Always visible on desktop, toggle on mobile */}
            <div className={`
              transition-all duration-300 ease-in-out
              ${showFilters ? 'block' : 'hidden lg:block'}
            `}>
              <JobFilter
                onFilterChange={handleFilterChange}
                initialFilters={filters}
                totalResults={totalItems}
                isLoading={isFiltering} // FIXED: Pass isFiltering from React Query
                themeMode={themeMode}
              />
            </div>
          </div>

          {/* ===== RESULTS SECTION ===== */}
          <div className="mb-12">
            {isLoadingPage ? (
              <div className="flex flex-col items-center justify-center py-20">
                <LoadingSpinner size="lg" themeMode={themeMode} />
                <p className="mt-4" style={{ color: theme.text.secondary }}>
                  Finding the best jobs for you...
                </p>
              </div>
            ) : !jobsData?.data || jobsData.data.length === 0 ? (
              // Empty State
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: theme.bg.secondary }}
                  >
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: theme.text.primary }}>
                    No Jobs Found
                  </h3>
                  <p className="mb-6" style={{ color: theme.text.secondary }}>
                    We couldn`t find any jobs matching your criteria. Try adjusting your filters.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="px-6 py-3 rounded-lg font-medium"
                    style={{
                      backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB',
                      color: '#FFFFFF'
                    }}
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Results Summary */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm" style={{ color: theme.text.secondary }}>
                    Showing <span className="font-semibold" style={{ color: theme.text.primary }}>{jobsData.data.length}</span> of{' '}
                    <span className="font-semibold" style={{ color: theme.text.primary }}>{totalItems}</span> jobs
                    {filters.search && (
                      <> for `<span className="font-semibold">{filters.search}</span>`</>
                    )}
                  </p>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }))}
                    className="px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: theme.bg.primary,
                      borderColor: theme.border.primary,
                      color: theme.text.primary
                    }}
                  >
                    <option value="createdAt">Most Recent</option>
                    <option value="applicationDeadline">Deadline</option>
                    <option value="title">Title</option>
                  </select>
                </div>

                {/* Jobs Grid */}
                <div className="grid grid-cols-1 gap-6">
                  {jobsData.data.map((job: Job) => (
                    <CandidateJobCard
                      key={job._id}
                      job={job}
                      ownerProfile={getJobOwnerProfile(job)}
                      onSave={handleSaveJob}
                      onShare={handleShareJob}
                      onApply={handleApplyJob}
                      isSaved={savedJobs.has(job._id)}
                      userApplications={userApplicationsData || []}
                      showSaveButton={true}
                      themeMode={themeMode}
                      variant="default"
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12">
                    <p className="text-sm" style={{ color: theme.text.secondary }}>
                      Page {currentPage} of {totalPages} • {totalItems} total jobs
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg border flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: theme.bg.primary,
                          borderColor: theme.border.primary,
                          color: theme.text.primary
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

                      <div className="hidden sm:flex items-center gap-1">
                        {generatePagination().map((page, index) => (
                          page === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-4 py-2" style={{ color: theme.text.muted }}>
                              ...
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => handlePageChange(Number(page))}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === page ? 'text-white' : ''
                                }`}
                              style={
                                currentPage === page
                                  ? {
                                    backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB',
                                    color: '#FFFFFF'
                                  }
                                  : {
                                    backgroundColor: theme.bg.primary,
                                    border: `1px solid ${theme.border.primary}`,
                                    color: theme.text.primary
                                  }
                              }
                            >
                              {page}
                            </button>
                          )
                        ))}
                      </div>

                      <div className="sm:hidden">
                        <span className="px-4 py-2" style={{ color: theme.text.primary }}>
                          {currentPage} / {totalPages}
                        </span>
                      </div>

                      <button
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg border flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: theme.bg.primary,
                          borderColor: theme.border.primary,
                          color: theme.text.primary
                        }}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ===== FEATURED CALLOUT ===== */}
          {!isLoadingPage && jobsData?.data && jobsData.data.length > 0 && (
            <div className="mt-12">
              <div
                className="rounded-2xl p-8 text-white text-center"
                style={{
                  background: themeMode === 'dark'
                    ? 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)'
                    : 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6" />
                  <h3 className="text-2xl font-bold">
                    Ready to Accelerate Your Career?
                  </h3>
                </div>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                  Complete your profile to get personalized job recommendations and let recruiters find you!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/dashboard/candidate/profile"
                  >
                    <button className="px-8 py-3 bg-white rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                      style={{ color: themeMode === 'dark' ? '#1E40AF' : '#2563EB' }}>
                      Complete Profile
                    </button>
                  </Link>
                  <Link
                    href="/dashboard/candidate/saved-jobs"
                  >
                    <button className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
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