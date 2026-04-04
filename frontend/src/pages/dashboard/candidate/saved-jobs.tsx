// pages/dashboard/candidate/saved-jobs.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Job, jobService } from '@/services/jobService';
import { profileService } from '@/services/profileService';
import { candidateService } from '@/services/candidateService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import CandidateJobCard from '@/components/job/CandidateJobCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  MapPin,
  Building2,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Clock,
  Filter,
  X,
  Sparkles,
  Heart,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { getTheme, ThemeMode } from '@/utils/color';

const SavedJobsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [themeMode] = useState<ThemeMode>('light');
  const theme = getTheme(themeMode);

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [savedJobsSet, setSavedJobsSet] = useState<Set<string>>(new Set());
  const [jobOwnerProfiles, setJobOwnerProfiles] = useState<Map<string, any>>(new Map());

  // ===== FETCH SAVED JOBS =====
  const {
    data: savedJobs,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: async () => {
      try {
        // Try jobService first
        const jobs = await jobService.getSavedJobs();
        return jobs;
      } catch (error) {
        console.error('Error fetching saved jobs from jobService:', error);
        // Fallback to candidateService
        try {
          const jobs = await candidateService.getSavedJobs();
          return jobs;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          return [];
        }
      }
    },
    enabled: isAuthenticated,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // ===== FETCH JOB OWNER PROFILES =====
  useEffect(() => {
    const fetchJobOwnerProfiles = async () => {
      if (!savedJobs?.length) return;

      const newProfiles = new Map(jobOwnerProfiles);
      let hasNewProfiles = false;

      for (const job of savedJobs) {
        // Get owner ID from various possible sources
        let ownerId = null;

        if (job.createdBy && typeof job.createdBy === 'string') {
          ownerId = job.createdBy;
        } else if (job.company?._id) {
          ownerId = job.company._id;
        } else if (job.organization?._id) {
          ownerId = job.organization._id;
        }

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
  }, [savedJobs]);

  // ===== UPDATE SAVED JOBS SET WHEN DATA LOADS =====
  useEffect(() => {
    if (savedJobs && Array.isArray(savedJobs)) {
      const ids = savedJobs.map((job: Job) => job._id).filter(Boolean);
      setSavedJobsSet(new Set(ids));
    }
  }, [savedJobs]);

  // ===== FILTER ACTIVE JOBS (EXCLUDE EXPIRED) =====
  const activeSavedJobs = useMemo(() => {
    if (!savedJobs || !Array.isArray(savedJobs)) return [];

    const now = new Date();

    return savedJobs.filter((job: Job) => {
      // Check if job is active (not expired)
      const isActive = job.status === 'active' &&
        (!job.applicationDeadline || new Date(job.applicationDeadline) > now);

      return isActive;
    });
  }, [savedJobs]);

  // ===== FILTER EXPIRED JOBS =====
  const expiredSavedJobs = useMemo(() => {
    if (!savedJobs || !Array.isArray(savedJobs)) return [];

    const now = new Date();

    return savedJobs.filter((job: Job) => {
      // Check if job is expired
      const isExpired = job.status !== 'active' ||
        (job.applicationDeadline && new Date(job.applicationDeadline) <= now);

      return isExpired;
    });
  }, [savedJobs]);

  // ===== FILTER JOBS BASED ON SEARCH TERM (only from active jobs) =====
  const filteredJobs = useMemo(() => {
    if (!activeSavedJobs.length) return [];
    if (!searchTerm.trim()) return activeSavedJobs;

    const searchLower = searchTerm.toLowerCase();

    return activeSavedJobs.filter((job: Job) => {
      const ownerName = job.ownerName ||
        (job.jobType === 'organization' ? job.organization?.name : job.company?.name) ||
        '';

      return (
        job.title.toLowerCase().includes(searchLower) ||
        ownerName.toLowerCase().includes(searchLower) ||
        job.skills?.some((skill: string) => skill.toLowerCase().includes(searchLower)) ||
        job.location?.city?.toLowerCase().includes(searchLower) ||
        job.location?.region?.toLowerCase().includes(searchLower)
      );
    });
  }, [activeSavedJobs, searchTerm]);

  // ===== JOB ACTIONS =====
  const handleSaveJob = useCallback(async (jobId: string, saved: boolean) => {
    try {
      if (saved) {
        // This shouldn't happen on saved jobs page, but handle it
        await jobService.saveJob(jobId);
        setSavedJobsSet(prev => new Set([...prev, jobId]));
        toast({
          title: 'Job Saved',
          description: 'Job has been saved to your favorites',
          variant: 'default'
        });
      } else {
        // Unsave the job
        await jobService.unsaveJob(jobId);
        setSavedJobsSet(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });

        // Refetch saved jobs to update the list
        refetch();

        toast({
          title: 'Job Removed',
          description: 'Job has been removed from your saved jobs',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Error toggling save:', error);

      // Handle specific error cases
      const errorMessage = error.response?.data?.message || error.message || '';

      if (!saved && (errorMessage.toLowerCase().includes('not saved') ||
        errorMessage.toLowerCase().includes('not found'))) {
        // Job is not saved - this is actually a success case for unsave
        setSavedJobsSet(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        refetch();
        toast({
          title: 'Job Removed',
          description: 'Job has been removed from your saved jobs',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage || 'Failed to update saved jobs',
          variant: 'destructive'
        });
      }
    }
  }, [toast, refetch]);

  const handleShareJob = useCallback(async (jobId: string, platform: string) => {
    toast({
      title: 'Shared',
      description: `Job shared via ${platform}`,
      variant: 'default'
    });
  }, [toast]);

  const handleApplyJob = useCallback(async (jobId: string) => {
    // This will navigate to the apply page
    // No need to do anything else here
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleRemoveExpired = useCallback(async () => {
    // Optional: Add functionality to remove all expired jobs at once
    if (expiredSavedJobs.length === 0) return;

    // You could add a confirmation dialog here
    const confirmed = window.confirm(`Remove ${expiredSavedJobs.length} expired job(s) from your saved list?`);

    if (confirmed) {
      try {
        // Remove each expired job
        for (const job of expiredSavedJobs) {
          await jobService.unsaveJob(job._id);
        }

        // Refetch to update the list
        refetch();

        toast({
          title: 'Expired Jobs Removed',
          description: `${expiredSavedJobs.length} expired job(s) have been removed from your saved list.`,
          variant: 'default'
        });
      } catch (error) {
        console.error('Error removing expired jobs:', error);
        toast({
          title: 'Error',
          description: 'Failed to remove some expired jobs. Please try again.',
          variant: 'destructive'
        });
      }
    }
  }, [expiredSavedJobs, refetch, toast]);

  // ===== HELPER FUNCTIONS =====
  const getJobOwnerProfile = useCallback((job: Job) => {
    if (!job) return null;

    // Get the owner ID from various possible sources
    let ownerId = null;
    if (job.createdBy && typeof job.createdBy === 'string') {
      ownerId = job.createdBy;
    } else if (job.company?._id) {
      ownerId = job.company._id;
    } else if (job.organization?._id) {
      ownerId = job.organization._id;
    }

    if (ownerId && jobOwnerProfiles.has(ownerId)) {
      return jobOwnerProfiles.get(ownerId);
    }

    return null;
  }, [jobOwnerProfiles]);

  // ===== STATS CALCULATIONS (using active jobs) =====
  const stats = useMemo(() => {
    if (!activeSavedJobs.length) {
      return {
        totalSaved: 0,
        activeJobs: 0,
        remoteJobs: 0,
        upcomingDeadlines: 0
      };
    }

    const now = new Date();
    return {
      totalSaved: activeSavedJobs.length,
      activeJobs: activeSavedJobs.filter((job: Job) =>
        job.status === 'active' &&
        (!job.applicationDeadline || new Date(job.applicationDeadline) > now)
      ).length,
      remoteJobs: activeSavedJobs.filter((job: Job) =>
        job.remote === 'remote' || job.location?.region === 'international'
      ).length,
      upcomingDeadlines: activeSavedJobs.filter((job: Job) =>
        job.applicationDeadline && new Date(job.applicationDeadline) > now
      ).length
    };
  }, [activeSavedJobs]);

  // ===== LOADING STATES =====
  const isLoadingPage = isLoading || isFetching;

  // ===== ERROR STATE =====
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
                Unable to Load Saved Jobs
              </h2>
              <p className="mb-6" style={{ color: theme.text.secondary }}>
                We're having trouble loading your saved jobs. Please check your connection and try again.
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
              <div className="flex items-center justify-center mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    background: themeMode === 'dark'
                      ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)'
                      : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                  }}
                >
                  <Bookmark className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
                style={{ color: theme.text.primary }}
              >
                Your <span style={{ color: themeMode === 'dark' ? '#F87171' : '#DC2626' }}>Saved Jobs</span>
              </h1>
              <p
                className="text-lg sm:text-xl max-w-3xl mx-auto mb-8"
                style={{ color: theme.text.secondary }}
              >
                Keep track of opportunities that caught your eye
              </p>

              {/* Quick Stats */}
              {!isLoadingPage && activeSavedJobs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
                  <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg.secondary, borderColor: theme.border.primary }}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg mx-auto mb-2" style={{ backgroundColor: themeMode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }}>
                      <BookmarkCheck className="w-5 h-5" style={{ color: themeMode === 'dark' ? '#93C5FD' : '#2563EB' }} />
                    </div>
                    <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>{stats.totalSaved}</div>
                    <div className="text-sm" style={{ color: theme.text.muted }}>Active Saved</div>
                  </div>

                  <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg.secondary, borderColor: theme.border.primary }}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg mx-auto mb-2" style={{ backgroundColor: themeMode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }}>
                      <Briefcase className="w-5 h-5" style={{ color: themeMode === 'dark' ? '#34D399' : '#059669' }} />
                    </div>
                    <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>{stats.activeJobs}</div>
                    <div className="text-sm" style={{ color: theme.text.muted }}>Active</div>
                  </div>

                  <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg.secondary, borderColor: theme.border.primary }}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg mx-auto mb-2" style={{ backgroundColor: themeMode === 'dark' ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE' }}>
                      <MapPin className="w-5 h-5" style={{ color: themeMode === 'dark' ? '#C4B5FD' : '#7C3AED' }} />
                    </div>
                    <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>{stats.remoteJobs}</div>
                    <div className="text-sm" style={{ color: theme.text.muted }}>Remote</div>
                  </div>

                  <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg.secondary, borderColor: theme.border.primary }}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg mx-auto mb-2" style={{ backgroundColor: themeMode === 'dark' ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }}>
                      <Clock className="w-5 h-5" style={{ color: themeMode === 'dark' ? '#FCD34D' : '#D97706' }} />
                    </div>
                    <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>{stats.upcomingDeadlines}</div>
                    <div className="text-sm" style={{ color: theme.text.muted }}>Deadlines</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===== SEARCH SECTION ===== */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold" style={{ color: theme.text.primary }}>
                  Saved Jobs
                </h2>
                {activeSavedJobs.length > 0 && (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: themeMode === 'dark' ? '#1E3A8A' : '#EFF6FF',
                      color: themeMode === 'dark' ? '#93C5FD' : '#2563EB'
                    }}
                  >
                    {activeSavedJobs.length} active
                  </span>
                )}
                {expiredSavedJobs.length > 0 && (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: themeMode === 'dark' ? '#991B1B' : '#FEE2E2',
                      color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626'
                    }}
                  >
                    {expiredSavedJobs.length} expired
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {expiredSavedJobs.length > 0 && (
                  <button
                    onClick={handleRemoveExpired}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: theme.bg.primary,
                      borderColor: theme.border.primary,
                      color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626'
                    }}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Remove Expired</span>
                    <span className="sm:hidden">Clear</span>
                  </button>
                )}
                <Link
                  href="/dashboard/candidate/jobs"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: theme.bg.primary,
                    borderColor: theme.border.primary,
                    color: theme.text.primary
                  }}
                >
                  <Building2 className="w-4 h-4" style={{ color: themeMode === 'dark' ? '#93C5FD' : '#2563EB' }} />
                  <span className="hidden sm:inline">Browse Jobs</span>
                  <span className="sm:hidden">Browse</span>
                </Link>
              </div>
            </div>

            {/* Search Bar */}
            <div
              className="rounded-2xl shadow-lg border p-4"
              style={{
                backgroundColor: theme.bg.secondary,
                borderColor: theme.border.primary
              }}
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search saved jobs by title, company, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{
                    backgroundColor: theme.bg.primary,
                    borderColor: theme.border.primary,
                    color: theme.text.primary
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="w-4 h-4" style={{ color: theme.text.muted }} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ===== RESULTS SECTION ===== */}
          <div className="mb-12">
            {isLoadingPage ? (
              <div className="flex flex-col items-center justify-center py-20">
                <LoadingSpinner size="lg" themeMode={themeMode} />
                <p className="mt-4" style={{ color: theme.text.secondary }}>
                  Loading your saved jobs...
                </p>
              </div>
            ) : activeSavedJobs.length === 0 && expiredSavedJobs.length === 0 ? (
              // Empty State
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: theme.bg.secondary }}
                  >
                    <Heart className="w-10 h-10" style={{ color: theme.text.muted }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: theme.text.primary }}>
                    No saved jobs yet
                  </h3>
                  <p className="mb-6" style={{ color: theme.text.secondary }}>
                    Start exploring job opportunities and save the ones you like to come back to later.
                  </p>
                  <Link href="/dashboard/candidate/jobs">
                    <button
                      className="px-6 py-3 rounded-lg font-medium"
                      style={{
                        backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB',
                        color: '#FFFFFF'
                      }}
                    >
                      Browse Jobs
                    </button>
                  </Link>
                </div>
              </div>
            ) : activeSavedJobs.length === 0 && expiredSavedJobs.length > 0 ? (
              // All Jobs Expired
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: theme.bg.secondary }}
                  >
                    <Clock className="w-10 h-10" style={{ color: theme.text.muted }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: theme.text.primary }}>
                    All saved jobs have expired
                  </h3>
                  <p className="mb-6" style={{ color: theme.text.secondary }}>
                    {expiredSavedJobs.length} job(s) in your saved list are no longer accepting applications.
                    You can remove them or browse for new opportunities.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={handleRemoveExpired}
                      className="px-6 py-3 rounded-lg font-medium"
                      style={{
                        backgroundColor: themeMode === 'dark' ? '#DC2626' : '#DC2626',
                        color: '#FFFFFF'
                      }}
                    >
                      Remove Expired Jobs
                    </button>
                    <Link href="/dashboard/candidate/jobs">
                      <button
                        className="px-6 py-3 rounded-lg font-medium border"
                        style={{
                          backgroundColor: theme.bg.primary,
                          borderColor: theme.border.primary,
                          color: theme.text.primary
                        }}
                      >
                        Browse New Jobs
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : filteredJobs.length === 0 ? (
              // No Search Results
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: theme.bg.secondary }}
                  >
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: theme.text.primary }}>
                    No matching jobs
                  </h3>
                  <p className="mb-6" style={{ color: theme.text.secondary }}>
                    No saved jobs match your search criteria. Try adjusting your search terms.
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="px-6 py-3 rounded-lg font-medium"
                    style={{
                      backgroundColor: themeMode === 'dark' ? '#2563EB' : '#2563EB',
                      color: '#FFFFFF'
                    }}
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Results Summary */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm" style={{ color: theme.text.secondary }}>
                    Showing <span className="font-semibold" style={{ color: theme.text.primary }}>{filteredJobs.length}</span> active saved job{filteredJobs.length !== 1 ? 's' : ''}
                    {searchTerm && (
                      <> matching "<span className="font-semibold">{searchTerm}</span>"</>
                    )}
                  </p>

                  {expiredSavedJobs.length > 0 && (
                    <p className="text-sm" style={{ color: theme.text.muted }}>
                      <span className="font-medium" style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}>
                        {expiredSavedJobs.length}
                      </span> expired job{expiredSavedJobs.length !== 1 ? 's' : ''} hidden
                    </p>
                  )}
                </div>

                {/* Jobs Grid */}
                <div className="grid grid-cols-1 gap-6">
                  {filteredJobs.map((job: Job) => (
                    <CandidateJobCard
                      key={job._id}
                      job={job}
                      ownerProfile={getJobOwnerProfile(job)}
                      onSave={handleSaveJob}
                      onShare={handleShareJob}
                      onApply={handleApplyJob}
                      isSaved={savedJobsSet.has(job._id)}
                      userApplications={[]}
                      showSaveButton={true}
                      themeMode={themeMode}
                      variant="default"
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ===== EXPIRED JOBS SECTION (Optional - if you want to show expired jobs separately) ===== */}
          {!isLoadingPage && expiredSavedJobs.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold" style={{ color: theme.text.primary }}>
                  Expired Jobs ({expiredSavedJobs.length})
                </h3>
                <button
                  onClick={handleRemoveExpired}
                  className="text-sm underline"
                  style={{ color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626' }}
                >
                  Remove All
                </button>
              </div>
              <p className="text-sm mb-4" style={{ color: theme.text.muted }}>
                These jobs are no longer accepting applications. Remove them to keep your list clean.
              </p>
              {/* Optional: You can add a mini card view for expired jobs if you want */}
            </div>
          )}

          {/* ===== FEATURED CALLOUT ===== */}
          {!isLoadingPage && activeSavedJobs.length > 0 && (
            <div className="mt-12">
              <div
                className="rounded-2xl p-8 text-white text-center"
                style={{
                  background: themeMode === 'dark'
                    ? 'linear-gradient(135deg, #7E22CE 0%, #6B21A8 100%)'
                    : 'linear-gradient(135deg, #9333EA 0%, #7E22CE 100%)'
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6" />
                  <h3 className="text-2xl font-bold">
                    Ready to Apply?
                  </h3>
                </div>
                <p className="opacity-90 mb-6 max-w-2xl mx-auto">
                  Don't let great opportunities slip away! Review your saved jobs and start applying to positions that match your skills and interests.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/dashboard/candidate/jobs">
                    <button className="px-8 py-3 bg-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors shadow-lg"
                      style={{ color: themeMode === 'dark' ? '#6B21A8' : '#7E22CE' }}>
                      Browse More Jobs
                    </button>
                  </Link>
                  <Link href="/dashboard/candidate/profile">
                    <button className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-colors">
                      Update Profile
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

export default SavedJobsPage;