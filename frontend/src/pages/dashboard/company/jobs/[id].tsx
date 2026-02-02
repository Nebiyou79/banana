/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, JobStatus } from '@/services/jobService';
import { applicationService } from '@/services/applicationService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import JobHeader from '@/components/job/JobHeader';
import TabbedJobDetails from '@/components/job/JobDetails';
import { toast } from '@/hooks/use-toast';
import { profileService } from '@/services/profileService';
import {
  Eye,
  Users,
  FileText,
  ArrowRight,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const CompanyJobDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch job details
  const { data: job, isLoading, error: fetchError } = useQuery({
    queryKey: ['companyJob', id],
    queryFn: () => jobService.getJob(id as string),
    enabled: !!id && !!user,
    select: (data) => jobService.processJobResponse(data),
  });

  // Fetch owner profile
  const {
    data: companyProfile,
    isLoading: profileLoading
  } = useQuery({
    queryKey: ['companyProfile'],
    queryFn: () => profileService.getProfile(),
    enabled: !!user && user.role === 'company',
  });

  // Fetch application stats
  const { data: applicationStats, isLoading: statsLoading } = useQuery({
    queryKey: ['jobApplicationStats', id],
    queryFn: () => applicationService.getJobApplications(id as string, { limit: 5 }),
    enabled: !!id && !!job,
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: {
      id: string;
      status: JobStatus;
    }) =>
      jobService.updateJob(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyJob', id] });
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] });
      toast({
        title: 'Status updated',
        description: 'Job status has been changed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update status',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobService.deleteJob(id),
    onSuccess: () => {
      toast({
        title: 'Job deleted',
        description: 'The job has been permanently deleted',
      });
      router.push('/dashboard/company/jobs');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete job',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Handler for status changes
  const handleStatusChange = async (status: JobStatus) => {
    if (id && job) {
      try {
        await statusMutation.mutateAsync({
          id: id as string,
          status,
        });
      } catch (error) {
        console.error('Failed to update job status:', error);
      }
    }
  };

  // Handler for viewing applications
  const handleViewApplications = () => {
    if (id) {
      router.push(`/dashboard/company/jobs/${id}/applications`);
    }
  };

  // Handler for editing job
  const handleEditJob = () => {
    if (job) {
      router.push(`/dashboard/company/jobs/edit/${job._id}`);
    }
  };

  // Handler for sharing job
  const handleShareJob = async () => {
    if (job) {
      const jobUrl = `${window.location.origin}/jobs/${job._id}`;
      try {
        await navigator.clipboard.writeText(jobUrl);
        toast({
          title: 'Link copied!',
          description: 'Job link has been copied to clipboard',
        });
      } catch (error) {
        console.error('Failed to copy link:', error);
        toast({
          title: 'Failed to copy link',
          description: 'Please copy the URL manually',
          variant: 'destructive',
        });
      }
    }
  };

  // Handler for deleting job
  const handleDeleteJob = async () => {
    if (job && confirm('Are you sure you want to permanently delete this job? This action cannot be undone.')) {
      try {
        await deleteMutation.mutateAsync(job._id);
      } catch (error) {
        console.error('Failed to delete job:', error);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading job details...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (fetchError || !job) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4 text-red-500 dark:text-red-400">❌</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Job Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The job you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <div className="space-y-3">
              <Link
                href="/dashboard/company/jobs"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors w-full dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                Back to Jobs
              </Link>
              <Link
                href="/dashboard/company/jobs/create"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors w-full dark:bg-green-700 dark:hover:bg-green-800"
              >
                Create New Job
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Format date helper
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if job is expired
  const isJobExpired = job.applicationDeadline && new Date(job.applicationDeadline) < new Date();

  // Get recent applications
  const totalApplications = applicationStats?.data?.length || 0;
  const recentApplications = applicationStats?.data?.slice(0, 3) || [];

  // Handle viewing application details
  const handleViewApplicationDetails = (applicationId: string) => {
    router.push(`/dashboard/company/applications/${applicationId}`);
  };

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Back Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/dashboard/company/jobs"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center gap-2 transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Jobs
            </Link>
          </div>
        </div>

        {/* Job Header Component */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto">
            <JobHeader
              job={job}
              role="company"
              ownerProfile={companyProfile}
              onEdit={handleEditJob}
              onShare={handleShareJob}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteJob}
              compact={false}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Tabbed Job Details Component */}
            <div className={cn(
              "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden",
              "lg:rounded-xl"
            )}>
              <TabbedJobDetails
                job={job}
                role="company"
                ownerProfile={companyProfile}
                onEditJob={handleEditJob}
                onStatusChange={handleStatusChange}
                onViewApplications={handleViewApplications}
              />
            </div>

            {/* Recent Applications Section */}
            {totalApplications > 0 && (
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Recent Applications ({totalApplications})
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Latest applications for this position
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {recentApplications.map((application) => (
                      <div
                        key={application._id as string}
                        className={cn(
                          "flex items-center justify-between p-4 border rounded-lg transition-all cursor-pointer group",
                          "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600",
                          "hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                        )}
                        onClick={() => handleViewApplicationDetails(application._id as string)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {application.userInfo?.name || application.candidate?.name || 'Applicant'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              Applied {formatDateTime(application.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={
                            application.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
                              application.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                                'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                          }>
                            {applicationService.getStatusLabel(application.status)}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalApplications > 3 && (
                    <Button
                      onClick={handleViewApplications}
                      variant="outline"
                      className="w-full mt-4 border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      View All {totalApplications} Applications
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {job.viewCount || 0}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 flex items-center gap-1 text-sm">
                        <Eye className="w-4 h-4" /> Total Views
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {job.applicationCount || 0}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 flex items-center gap-1 text-sm">
                        <Users className="w-4 h-4" /> Total Applications
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1 capitalize">
                        {job.remote || 'on-site'}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 flex items-center gap-1 text-sm">
                        Remote Work
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                        {job.remote === 'remote' ? '🏠' : job.remote === 'hybrid' ? '⚡' : '🏢'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                        {job.candidatesNeeded || 1}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 flex items-center gap-1 text-sm">
                        Candidates Needed
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                        👥
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Warning for expired jobs */}
            {isJobExpired && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Application Deadline Passed</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      This job's application deadline has expired. Consider updating the deadline or closing the position.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone - Delete Job */}
            <Card className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
              <CardHeader className="pb-4 border-b border-red-200 dark:border-red-800">
                <CardTitle className="text-red-800 dark:text-red-300">Danger Zone</CardTitle>
                <CardDescription className="text-red-700 dark:text-red-400">
                  Permanent actions cannot be undone
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-300 mb-1">Delete This Job</h4>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Once deleted, this job and all associated applications will be permanently removed.
                    </p>
                  </div>
                  <Button
                    onClick={handleDeleteJob}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Deleting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Job</span>
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyJobDetailPage;