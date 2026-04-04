/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { jobService, Job, ApplicationInfo } from '@/services/jobService';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import JobHeader from '@/components/job/JobHeader';
import TabbedJobDetails from '@/components/job/JobDetails';
import { profileService } from '@/services/profileService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowRight, Bookmark, Send, Share2, Briefcase, MapPin, Calendar, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { candidateService } from '@/services/candidateService';
import { applicationService } from '@/services/applicationService';
import { getTheme } from '@/utils/color';

const CandidateJobDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  const [job, setJob] = useState<Job | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [userApplications, setUserApplications] = useState<any[]>([]);

  useEffect(() => {
    // Detect theme from document
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setThemeMode(isDark ? 'dark' : 'light');
    };

    checkTheme();

    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (router.isReady && id && typeof id === 'string') {
      fetchJobDetails();
    }
  }, [router.isReady, id]);

  useEffect(() => {
    if (job && user) {
      checkIfJobIsSaved();
      checkIfApplied();
    }
  }, [job, user]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (typeof id === 'string') {
        const jobData = await jobService.getJob(id);
        console.log('📊 Raw job data received:', {
          jobId: jobData._id,
          jobTitle: jobData.title,
          ownerAvatarUrl: jobData.ownerAvatarUrl,
          ownerName: jobData.ownerName
        });

        const processedJob = jobService.processJobResponse(jobData);
        console.log('✅ Processed job:', {
          ownerAvatarUrl: processedJob.ownerAvatarUrl,
          ownerName: processedJob.ownerName
        });

        setJob(processedJob);

        try {
          await fetchOwnerProfile(processedJob);
        } catch (profileError) {
          console.log('⚠️ Could not fetch owner profile, using job data:', profileError);
        }
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load job details. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerProfile = async (jobData: Job) => {
    try {
      if (jobData.ownerName && jobData.ownerAvatarUrl) {
        console.log('✅ Owner info already in job data, skipping profile fetch');
        setOwnerProfile({
          _id: jobData.createdBy || 'unknown',
          user: {
            _id: jobData.createdBy || 'unknown',
            name: jobData.ownerName,
            avatar: jobData.ownerAvatarUrl,
            role: jobData.jobType === 'company' ? 'company' : 'organization'
          },
          verificationStatus: jobData.ownerVerified ? 'verified' : 'pending'
        });
        return;
      }

      let ownerId: string | null = null;

      if (typeof jobData.createdBy === 'string') {
        ownerId = jobData.createdBy;
      } else if (jobData.createdBy && typeof jobData.createdBy === 'object') {
        ownerId = (jobData.createdBy as any)._id;
      } else if (jobData.company?.ownerId) {
        ownerId = jobData.company.ownerId;
      } else if (jobData.organization?._id) {
        ownerId = jobData.organization._id;
      }

      if (!ownerId) {
        console.log('No owner ID found, using job data for avatar');
        setOwnerProfile(null);
        return;
      }

      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(ownerId)) {
        console.warn(`Invalid owner ID format: ${ownerId}`);
        setOwnerProfile(null);
        return;
      }

      try {
        const profileData = await profileService.getPublicProfile(ownerId);
        console.log('✅ Owner profile fetched:', {
          name: profileData.user?.name,
          hasAvatar: !!profileData.user?.avatar
        });
        setOwnerProfile(profileData);
      } catch (profileError) {
        console.log(`Could not fetch profile for owner ${ownerId}:`, profileError);
        setOwnerProfile(null);
      }
    } catch (error) {
      console.error('Error fetching owner profile:', error);
      setOwnerProfile(null);
    }
  };

  const checkIfApplied = async () => {
    if (!user || !id || typeof id !== 'string') return;

    try {
      const response = await applicationService.getMyApplications();
      const applications = response.data || [];
      setUserApplications(applications);

      const isApplied = applications.some((app: any) =>
        app.job?._id === id || app.jobId === id
      );
      setHasApplied(isApplied);
    } catch (error) {
      console.error('Error checking applied status:', error);
    }
  };

  const checkIfJobIsSaved = async () => {
    if (!user || !id || typeof id !== 'string') return;

    try {
      const savedJobs = await candidateService.getSavedJobs();
      const isJobSaved = savedJobs.some((savedJob: any) =>
        savedJob._id === id ||
        savedJob.job?._id === id ||
        savedJob.jobId === id
      );
      setIsSaved(isJobSaved);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleSaveJob = async () => {
    if (!job || !isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save jobs',
        variant: 'destructive',
      });
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    try {
      setIsSaving(true);

      if (isSaved) {
        await jobService.unsaveJob(job._id);
        setIsSaved(false);
        toast({
          title: 'Job Unsaved',
          description: 'Job has been removed from your saved list',
          variant: 'default',
        });
      } else {
        await jobService.saveJob(job._id);
        setIsSaved(true);
        toast({
          title: 'Job Saved',
          description: 'Job has been added to your saved list',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('Error saving job:', error);
      const errorMessage = error?.message || 'Failed to save job. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyNow = () => {
    if (!job) return;

    const canApply = jobService.canJobAcceptApplications(job);

    if (!canApply) {
      const status = jobService.getApplicationStatus(job);
      toast({
        title: 'Cannot Apply',
        description: status.message || 'Applications for this job are not being accepted.',
        variant: 'warning',
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to apply for this job',
        variant: 'destructive',
      });
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    if (hasApplied) {
      const userApplication = userApplications.find(app => app.job?._id === job._id);
      if (userApplication) {
        router.push(`/dashboard/candidate/applications/${userApplication._id}`);
      }
      return;
    }

    setIsApplying(true);
    router.push(`/dashboard/candidate/apply/${job._id}`);
  };

  const handleShareJob = () => {
    if (!job) return;

    const jobUrl = `${window.location.origin}/dashboard/candidate/jobs/${job._id}`;

    if (navigator.share) {
      navigator.share({
        title: `${job.title} at ${job.ownerName || 'Company'}`,
        text: `Check out this job opportunity: ${job.title}`,
        url: jobUrl,
      }).then(() => {
        toast({
          title: 'Shared',
          description: 'Job shared successfully',
          variant: 'default',
        });
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          copyToClipboard(jobUrl);
        }
      });
    } else {
      copyToClipboard(jobUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Link Copied',
        description: 'Job link has been copied to clipboard',
        variant: 'default',
      });
    }).catch(() => {
      toast({
        title: 'Error',
        description: 'Failed to copy link. Please try again.',
        variant: 'destructive',
      });
    });
  };

  const handleRetry = () => {
    fetchJobDetails();
  };

  const getApplicationInfo = (): ApplicationInfo | undefined => {
    if (!job) return undefined;
    return job.applicationInfo || jobService.getApplicationStatusInfo(job);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center px-4">
            <LoadingSpinner size="lg" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-2">Loading Opportunity</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Fetching job details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
              <div className="h-8 w-8 sm:h-10 sm:w-10 text-red-600 dark:text-red-400">⚠️</div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
              {error ? 'Error Loading Job' : 'Job Not Found'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">
              {error ? error : 'The job you\'re looking for might have been removed or is no longer available.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base"
              >
                Try Again
              </Button>
              <Link href="/dashboard/candidate/jobs">
                <Button variant="outline" className="font-semibold px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base">
                  Browse Opportunities
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        {/* Job Header Component */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <JobHeader
              job={job}
              role="candidate"
              ownerProfile={ownerProfile}
              onApply={handleApplyNow}
              onSave={handleSaveJob}
              onShare={handleShareJob}
              isSaved={isSaved}
              isApplying={isApplying}
              isSaving={isSaving}
              hasApplied={hasApplied}
              userApplication={userApplications}
              compact={false}
              showApplicationStatus={true}
              themeMode={themeMode}
            />
          </div>
        </div>

        {/* Quick Stats Bar - Responsive */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  Posted: {formatDate(job.createdAt)}
                </span>
              </div>
              {job.applicationDeadline && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 dark:text-red-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Deadline: {formatDate(job.applicationDeadline)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300 truncate max-w-[150px] sm:max-w-none">
                  {job.location?.region === 'international' ? '🌍 Remote' :
                    `${job.location?.city || job.location?.region}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300 hidden sm:inline">
                  {jobService.getJobTypeLabel(job.type)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  {job.applicationCount || 0} applied
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Tabbed Job Details Component */}
          <TabbedJobDetails
            job={job}
            role="candidate"
            ownerProfile={ownerProfile}
            onApply={handleApplyNow}
            onSaveJob={handleSaveJob}
            isSaved={isSaved}
            isApplying={isApplying}
            applicationInfo={getApplicationInfo()}
            hasApplied={hasApplied}
            userApplication={userApplications}
            themeMode={themeMode}
          />

          {/* Similar Jobs Section */}
          <div className="mt-8 sm:mt-12">
            <div className={cn(
              "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6",
              "hover:shadow-md transition-shadow duration-300"
            )}>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
                Explore More Opportunities
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
                Looking for similar roles? Browse our extensive job listings to find your perfect match.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/dashboard/candidate/jobs" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base">
                    Browse All Jobs
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                </Link>
                {job.category && (
                  <Link href={`/dashboard/candidate/jobs?category=${job.category}`} className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base">
                      Similar {jobService.getJobTypeLabel(job.category)} Jobs
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Bar (Mobile Only) */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 sm:hidden shadow-lg z-20">
            <div className="flex justify-between items-center gap-2">
              <Button
                onClick={handleApplyNow}
                disabled={!jobService.canJobAcceptApplications(job) || isApplying}
                className={cn(
                  "flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2",
                  "disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed",
                  hasApplied && "bg-green-600 hover:bg-green-700"
                )}
              >
                {isApplying ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" themeMode="light" />
                    <span>Applying...</span>
                  </div>
                ) : hasApplied ? (
                  <div className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>View</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>Apply</span>
                  </div>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveJob}
                disabled={isSaving}
                className="p-2 border-gray-300 dark:border-gray-600"
                title={isSaved ? "Remove from saved" : "Save job"}
              >
                {isSaving ? (
                  <LoadingSpinner size="sm" themeMode={themeMode} />
                ) : (
                  <Bookmark className={cn(
                    "w-5 h-5",
                    isSaved && "fill-blue-600 dark:fill-blue-400 text-blue-600 dark:text-blue-400"
                  )} />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleShareJob}
                className="p-2 border-gray-300 dark:border-gray-600"
                title="Share job"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateJobDetailsPage;