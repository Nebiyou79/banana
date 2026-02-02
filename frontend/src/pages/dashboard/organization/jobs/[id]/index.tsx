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
  Users,
  FileText,
  ArrowRight,
  Trash2,
  Heart,
  Users2,
  Building,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const OrganizationJobDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch opportunity details
  const { data: job, isLoading, error: fetchError } = useQuery({
    queryKey: ['organizationJob', id],
    queryFn: () => jobService.getJob(id as string),
    enabled: !!id && !!user,
    select: (data) => jobService.processJobResponse(data),
  });

  // Fetch owner profile
  const {
    data: organizationProfile,
    isLoading: profileLoading
  } = useQuery({
    queryKey: ['organizationProfile'],
    queryFn: () => profileService.getProfile(),
    enabled: !!user && user.role === 'organization',
  });

  // Fetch application stats
  const { data: applicationStats, isLoading: statsLoading } = useQuery({
    queryKey: ['jobApplicationStats', id],
    queryFn: () => applicationService.getJobApplications(id as string, { limit: 5 }),
    enabled: !!id && !!job,
  });

  // Status mutation for opportunities
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: {
      id: string;
      status: JobStatus;
    }) =>
      jobService.updateOrganizationJob(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationJob', id] });
      queryClient.invalidateQueries({ queryKey: ['organizationJobs'] });
      toast({
        title: 'Status updated',
        description: 'Opportunity status has been changed successfully',
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
    mutationFn: (id: string) => jobService.deleteOrganizationJob(id),
    onSuccess: () => {
      toast({
        title: 'Opportunity deleted',
        description: 'The opportunity has been permanently deleted',
      });
      router.push('/dashboard/organization/jobs');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete opportunity',
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
        console.error('Failed to update opportunity status:', error);
      }
    }
  };

  // Handler for viewing applications
  const handleViewApplications = () => {
    if (id) {
      router.push(`/dashboard/organization/jobs/${id}/applications`);
    }
  };

  // Handler for editing opportunity
  const handleEditOpportunity = () => {
    if (job) {
      router.push(`/dashboard/organization/jobs/edit/${job._id}`);
    }
  };

  // Handler for sharing opportunity
  const handleShareOpportunity = async () => {
    if (job) {
      const opportunityUrl = `${window.location.origin}/opportunities/${job._id}`;
      try {
        await navigator.clipboard.writeText(opportunityUrl);
        toast({
          title: 'Link copied!',
          description: 'Opportunity link has been copied to clipboard',
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

  // Handler for deleting opportunity
  const handleDeleteOpportunity = async () => {
    if (job && confirm('Are you sure you want to permanently delete this opportunity? This action cannot be undone.')) {
      try {
        await deleteMutation.mutateAsync(job._id);
      } catch (error) {
        console.error('Failed to delete opportunity:', error);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading opportunity details...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (fetchError || !job) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4 text-red-500 dark:text-red-400">❌</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Opportunity Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The opportunity you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <div className="space-y-3">
              <Link
                href="/dashboard/organization/jobs"
                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors w-full dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                Back to Opportunities
              </Link>
              <Link
                href="/dashboard/organization/jobs/create"
                className="inline-block bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg transition-colors w-full dark:bg-teal-700 dark:hover:bg-teal-800"
              >
                Create New Opportunity
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

  // Check if opportunity is expired
  const isOpportunityExpired = job.applicationDeadline && new Date(job.applicationDeadline) < new Date();

  // Get recent applications
  const totalApplications = applicationStats?.data?.length || 0;
  const recentApplications = applicationStats?.data?.slice(0, 3) || [];

  // Handle viewing application details
  const handleViewApplicationDetails = (applicationId: string) => {
    router.push(`/dashboard/organization/applications/${applicationId}`);
  };

  // Get commitment level label for volunteer opportunities
  const getCommitmentLevelLabel = (level?: string) => {
    switch (level) {
      case 'casual': return 'Casual (1-10 hours/week)';
      case 'regular': return 'Regular (10-25 hours/week)';
      case 'intensive': return 'Intensive (25+ hours/week)';
      default: return level;
    }
  };

  // Check if this is a volunteer opportunity
  const isVolunteerOpportunity = job.opportunityType === 'volunteer';

  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10">
        {/* Back Navigation */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-emerald-200 dark:border-emerald-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/dashboard/organization/jobs"
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 inline-flex items-center gap-2 transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Opportunities
            </Link>
          </div>
        </div>

        {/* Job Header Component - Organization Mode */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-emerald-200 dark:border-emerald-800">
          <div className="max-w-7xl mx-auto">
            <JobHeader
              job={job}
              role="organization"
              ownerProfile={organizationProfile}
              onEdit={handleEditOpportunity}
              onShare={handleShareOpportunity}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteOpportunity}
              compact={false}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Tabbed Job Details Component - Organization Mode */}
            <div className={cn(
              "bg-white dark:bg-gray-800 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm overflow-hidden",
              "lg:rounded-xl backdrop-blur-sm"
            )}>
              <TabbedJobDetails
                job={job}
                role="organization"
                ownerProfile={organizationProfile}
                onEditJob={handleEditOpportunity}
                onStatusChange={handleStatusChange}
                onViewApplications={handleViewApplications}
              />
            </div>

            {/* Recent Applications Section */}
            {totalApplications > 0 && (
              <Card className="border border-emerald-200 dark:border-emerald-800 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-emerald-200 dark:border-emerald-800">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Recent Applications ({totalApplications})
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Latest applications from community members
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {recentApplications.map((application) => (
                      <div
                        key={application._id as string}
                        className={cn(
                          "flex items-center justify-between p-4 border rounded-lg transition-all cursor-pointer group",
                          "border-emerald-200 dark:border-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-600",
                          "hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20"
                        )}
                        onClick={() => handleViewApplicationDetails(application._id as string)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 transition-colors">
                            <Users2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {application.userInfo?.name || application.candidate?.name || 'Community Member'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              Applied {formatDateTime(application.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={
                            application.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' :
                              application.status === 'rejected' ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800' :
                                'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                          }>
                            {applicationService.getStatusLabel(application.status)}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-emerald-400 dark:text-emerald-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalApplications > 3 && (
                    <Button
                      onClick={handleViewApplications}
                      variant="outline"
                      className="w-full mt-4 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    >
                      View All {totalApplications} Applications
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="border border-emerald-200 dark:border-emerald-800 shadow-sm hover:shadow-md transition-shadow bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                        {job.viewCount || 0}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 flex items-center gap-1 text-sm">
                        Total Views
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        👁️
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-teal-200 dark:border-teal-800 shadow-sm hover:shadow-md transition-shadow bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-1">
                        {job.applicationCount || 0}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 flex items-center gap-1 text-sm">
                        Total Applications
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-cyan-200 dark:border-cyan-800 shadow-sm hover:shadow-md transition-shadow bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-1 capitalize">
                        {job.remote || 'on-site'}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 flex items-center gap-1 text-sm">
                        Work Type
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">
                        {job.remote === 'remote' ? '🏠' : job.remote === 'hybrid' ? '⚡' : '🏢'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-amber-200 dark:border-amber-800 shadow-sm hover:shadow-md transition-shadow bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                        {job.candidatesNeeded || 1}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 flex items-center gap-1 text-sm">
                        Positions Available
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                        👥
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Special Features for Volunteer Opportunities */}
            {isVolunteerOpportunity && job.volunteerInfo && (
              <Card className="border border-rose-200 dark:border-rose-800 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-rose-200 dark:border-rose-800">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    Volunteer Information
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Details specific to this volunteer opportunity
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-4">
                      {job.volunteerInfo.hoursPerWeek && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-semibold text-rose-600 dark:text-rose-400">⏱️</span>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Hours Per Week</label>
                            <p className="text-gray-900 dark:text-white font-medium">{job.volunteerInfo.hoursPerWeek} hours</p>
                          </div>
                        </div>
                      )}
                      {job.volunteerInfo.commitmentLevel && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-semibold text-rose-600 dark:text-rose-400">🎯</span>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Commitment Level</label>
                            <p className="text-gray-900 dark:text-white font-medium">{getCommitmentLevelLabel(job.volunteerInfo.commitmentLevel)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Support Provided</label>
                      <div className="flex flex-wrap gap-2">
                        {job.volunteerInfo.providesAccommodation && (
                          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">
                            <div className="w-6 h-6 bg-rose-100 dark:bg-rose-800 rounded-full flex items-center justify-center">
                              <span className="text-xs text-rose-600 dark:text-rose-400">🏠</span>
                            </div>
                            <span className="text-sm text-rose-700 dark:text-rose-300">Accommodation</span>
                          </div>
                        )}
                        {job.volunteerInfo.providesStipend && (
                          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                            <div className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                              <span className="text-xs text-green-600 dark:text-green-400">💰</span>
                            </div>
                            <span className="text-sm text-green-700 dark:text-green-300">Stipend</span>
                          </div>
                        )}
                        {!job.volunteerInfo.providesAccommodation && !job.volunteerInfo.providesStipend && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                            Volunteers provide their own support
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Duration Information for Non-Volunteer Opportunities */}
            {!isVolunteerOpportunity && job.duration && (
              <Card className="border border-amber-200 dark:border-amber-800 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-amber-200 dark:border-amber-800">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-lg text-amber-600 dark:text-amber-400">⏳</span>
                    Duration Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl text-amber-600 dark:text-amber-400">
                        {job.duration.isOngoing ? '∞' : '📅'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {job.duration.isOngoing
                          ? 'Ongoing Opportunity'
                          : `Fixed Term: ${job.duration.value} ${job.duration.unit}`
                        }
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {job.duration.isOngoing
                          ? 'This is an ongoing opportunity with no fixed end date'
                          : 'This opportunity has a specific duration'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warning for expired opportunities */}
            {isOpportunityExpired && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-rose-800 dark:text-rose-300">Application Deadline Passed</h3>
                    <p className="text-sm text-rose-700 dark:text-rose-400 mt-1">
                      This opportunity's application deadline has expired. Consider updating the deadline or closing the position.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Organization Profile Link */}
            <Card className="border border-emerald-200 dark:border-emerald-800 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-emerald-200 dark:border-emerald-800">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Organization Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-start sm:items-center space-x-4 mb-6">
                  {job.organization?.logoUrl && (
                    <img
                      src={job.organization.logoUrl}
                      alt={job.organization.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-200 dark:border-emerald-700 flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">{job.organization?.name}</h3>
                    {job.organization?.organizationType && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{job.organization.organizationType}</p>
                    )}
                    {job.organization?.verified && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 mt-2">
                        <span className="flex items-center gap-1">
                          <span className="text-xs">✓</span>
                          Verified Organization
                        </span>
                      </Badge>
                    )}
                  </div>
                </div>
                <Link
                  href="/dashboard/organization/profile"
                  className="block w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white py-3 px-4 rounded-lg transition-colors text-center font-medium"
                >
                  View & Manage Organization Profile
                </Link>
              </CardContent>
            </Card>

            {/* Danger Zone - Delete Opportunity */}
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
                    <h4 className="font-medium text-red-800 dark:text-red-300 mb-1">Delete This Opportunity</h4>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Once deleted, this opportunity and all associated applications will be permanently removed.
                    </p>
                  </div>
                  <Button
                    onClick={handleDeleteOpportunity}
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
                        <span>Delete Opportunity</span>
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

export default OrganizationJobDetailPage;