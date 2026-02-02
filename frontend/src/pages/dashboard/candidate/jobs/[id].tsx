/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { jobService, Job, ApplicationInfo } from '@/services/jobService';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import JobHeader from '@/components/job/JobHeader';
import TabbedJobDetails from '@/components/job/JobDetails';
import { profileService, Profile } from '@/services/profileService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowRight, Bookmark, Send, Share2, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const CandidateJobDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady && id && typeof id === 'string') {
      fetchJobDetails();
      checkIfJobIsSaved();
    }
  }, [router.isReady, id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (typeof id === 'string') {
        const jobData = await jobService.getJob(id);
        // Process the job response to ensure all computed fields are set
        const processedJob = jobService.processJobResponse(jobData);
        setJob(processedJob);

        // Fetch owner profile
        await fetchOwnerProfile(processedJob);
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
      let profileData = null;
      if (jobData.jobType === 'company' && jobData.company?.ownerId) {
        profileData = await profileService.getProfile(jobData.company.ownerId);
      } else if (jobData.jobType === 'organization' && jobData.organization?.ownerId) {
        profileData = await profileService.getProfile(jobData.organization.ownerId);
      }
      setOwnerProfile(profileData);
    } catch (error) {
      console.error('Error fetching owner profile:', error);
      // Silent fail - ownerProfile will remain null
    }
  };

  const checkIfJobIsSaved = async () => {
    if (!user || !id) return;

    try {
      const savedJobs = await jobService.getSavedJobs();
      const isJobSaved = savedJobs.some((savedJob: any) => savedJob.jobId === id || savedJob._id === id);
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
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: 'Error',
        description: 'Failed to save job. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyNow = () => {
    if (!job) return;

    // Check if job can accept applications using jobService
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

    setIsApplying(true);
    router.push(`/dashboard/candidate/apply/${job._id}`);
  };

  const handleShareJob = () => {
    if (!job) return;

    const jobUrl = `${window.location.origin}/jobs/${job._id}`;
    navigator.clipboard.writeText(jobUrl).then(() => {
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

  // Get application info for TabbedJobDetails
  const getApplicationInfo = (): ApplicationInfo | undefined => {
    if (!job) return undefined;

    return {
      isApplyEnabled: job.isApplyEnabled ?? true,
      canApply: jobService.canJobAcceptApplications(job),
      candidatesNeeded: job.candidatesNeeded || 0,
      candidatesRemaining: jobService.calculateCandidatesRemaining(job),
      applicationCount: job.applicationCount || 0,
      status: jobService.getApplicationStatus(job)
    };
  };

  // Loading State
  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-2">Loading Opportunity</h3>
            <p className="text-gray-600 dark:text-gray-300">Fetching job details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error State
  if (error || !job) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <div className="h-10 w-10 text-red-600 dark:text-red-400">⚠️</div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {error ? 'Error Loading Job' : 'Job Not Found'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
              {error ? error : 'The job you\'re looking for might have been removed or is no longer available.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Try Again
              </Button>
              <Link href="/dashboard/candidate/jobs">
                <Button variant="outline" className="font-semibold px-6 py-3">
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
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        {/* Job Header Component */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
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
              compact={false}
              showApplicationStatus={true}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          />

          {/* Similar Jobs Section */}
          <div className="mt-12">
            <div className={cn(
              "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6",
              "hover:shadow-md transition-shadow duration-300"
            )}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Explore More Opportunities</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Looking for similar roles? Browse our extensive job listings to find your perfect match.
              </p>
              <Link href="/dashboard/candidate/jobs">
                <Button className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                  Browse All Jobs
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Actions Bar (Mobile) */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 sm:hidden shadow-lg">
            <div className="flex justify-between items-center gap-4">
              <Button
                onClick={handleApplyNow}
                disabled={!jobService.canJobAcceptApplications(job) || isApplying}
                className={cn(
                  "flex-1 bg-blue-600 hover:bg-blue-700 text-white",
                  "disabled:bg-gray-300 dark:disabled:bg-gray-700"
                )}
              >
                {isApplying ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Applying...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>Apply Now</span>
                  </div>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveJob}
                className="border-gray-300 dark:border-gray-600"
                title={isSaved ? "Remove from saved" : "Save job"}
              >
                <Bookmark className={cn(
                  "w-4 h-4",
                  isSaved && "fill-blue-600 dark:fill-blue-400 text-blue-600 dark:text-blue-400"
                )} />
              </Button>
              <Button
                variant="outline"
                onClick={handleShareJob}
                className="border-gray-300 dark:border-gray-600"
                title="Share job"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateJobDetailsPage;