/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/organization/jobs/[id]/applications.tsx
import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '@/services/jobService';
import { applicationService } from '@/services/applicationService';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton'; // Added Skeleton
import {
  ArrowLeft,
  Users,
  FileText,
  Building,
  MapPin,
  Target,
  Heart,
  Star,
  Users2,
  Eye,
  Download,
  Share2,
  RefreshCw,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast'; // Added useToast

const OrganizationJobApplicationsPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast(); // Added toast
  const { id: jobId } = router.query;

  const {
    data: job,
    isLoading: jobLoading,
    error: jobError,
    isFetching: jobFetching
  } = useQuery({
    queryKey: ['organizationJob', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('Job ID is required');
      return await jobService.getJob(jobId as string);
    },
    enabled: !!jobId,
    retry: 2,
  });

  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    refetch: refetchApplications
  } = useQuery({
    queryKey: ['jobApplications', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('Job ID is required');
      const response = await applicationService.getJobApplications(jobId as string);
      // Changed this line to match company page pattern
      return response.data || response || [];
    },
    enabled: !!jobId,
  });

  const handleApplicationSelect = (application: any) => {
    router.push(`/dashboard/organization/applications/${application._id}`);
  };

  const handleBackToJob = () => {
    if (jobId) {
      router.push(`/dashboard/organization/jobs/${jobId}`);
    }
  };

  const handleRefresh = () => { // Added refresh handler
    refetchApplications();
    toast({
      title: 'Refreshing...',
      description: 'Updating application data',
    });
  };

  const handleStatusUpdate = (updatedApplication: any) => { // Added status update handler
    refetchApplications();
    toast({
      title: 'Status Updated',
      description: `Application status updated to ${applicationService.getStatusLabel(updatedApplication.status)}`,
      variant: 'default',
    });
  };

  const getOpportunityTypeIcon = (type?: string) => {
    switch (type) {
      case 'volunteer':
        return <Heart className="h-5 w-5 text-rose-500" />;
      case 'internship':
        return <Target className="h-5 w-5 text-cyan-500" />;
      case 'fellowship':
        return <Star className="h-5 w-5 text-amber-500" />;
      default:
        return <Users2 className="h-5 w-5 text-emerald-500" />;
    }
  };

  // Updated loading state to match company page
  if (jobLoading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Skeleton */}
            <div className="flex items-center gap-4 mb-8">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-10 w-40 rounded-lg" />
            </div>

            {/* Job Card Skeleton */}
            <Skeleton className="h-32 rounded-xl mb-8" />

            {/* Applications Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-12 rounded-xl" />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (jobError || !job) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border border-red-200 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                  <Briefcase className="h-10 w-10 text-red-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">
                  Opportunity Not Found
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 mb-2">
                  {jobError instanceof Error
                    ? jobError.message
                    : 'The opportunity you\'re looking for doesn\'t exist or you don\'t have permission to view it.'
                  }
                </CardDescription>
                <p className="text-gray-500 text-sm mb-8">
                  Please check the opportunity ID and try again.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard/organization/jobs')}
                    className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Opportunities
                  </Button>
                  <Button
                    onClick={() => router.reload()}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // FIXED: Use applicationsData directly (now it's an array)
  const totalApplications = applicationsData?.length || 0;
  const opportunityTypeLabel = jobService.getJobTypeDisplayLabel(job);

  // Added job status badge function
  const getJobStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { color: 'bg-green-100 text-green-800', label: 'Active' },
      'draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'paused': { color: 'bg-yellow-100 text-yellow-800', label: 'Paused' },
      'closed': { color: 'bg-red-100 text-red-800', label: 'Closed' },
      'archived': { color: 'bg-gray-100 text-gray-800', label: 'Archived' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <Badge variant="outline" className={`border-0 ${config.color} font-semibold`}>
        {config.label}
      </Badge>
    );
  };

  // Added application stats function
  const getApplicationStats = () => {
    const stats = {
      underReview: applicationsData?.filter((app: any) => app.status === 'under-review').length || 0,
      shortlisted: applicationsData?.filter((app: any) => app.status === 'shortlisted').length || 0,
      interviewScheduled: applicationsData?.filter((app: any) => app.status === 'interview-scheduled').length || 0,
      hired: applicationsData?.filter((app: any) => app.status === 'offer-accepted').length || 0
    };
    return stats;
  };

  const applicationStats = getApplicationStats();

  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div className="space-y-3 flex-1">
              <Button
                variant="outline"
                onClick={handleBackToJob}
                className="flex items-center gap-2 border-emerald-200 hover:bg-white bg-white/80 backdrop-blur-sm text-emerald-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Opportunity Details
              </Button>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Applications for {job.title}
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    Manage and review all community applications for this {opportunityTypeLabel.toLowerCase()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-lg py-1.5 px-3 font-semibold">
                    <Users className="h-4 w-4 mr-1" />
                    {totalApplications} Application{totalApplications !== 1 ? 's' : ''}
                  </Badge>

                  <Link
                    href="/dashboard/organization/applications"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View All Applications
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Opportunity Summary Card */}
          <Card className="mb-8 border border-emerald-200 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl shadow-sm">
                        {getOpportunityTypeIcon(job.opportunityType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                          {getJobStatusBadge(job.status)}
                        </div>
                        <p className="text-gray-600 mb-3 font-medium">
                          {jobService.getOwnerName(job)}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{jobService.getOwnerName(job)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>
                              {job.location.city}, {jobService.getEthiopianRegions().find(r => r.slug === job.location.region)?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-gray-400" />
                            <span className="capitalize">{job.type.replace('-', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users2 className="h-4 w-4 text-gray-400" />
                            <span>{opportunityTypeLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {job.description && (
                    <div className="pt-4 border-t border-emerald-200">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 min-w-[140px] shadow-sm">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">{totalApplications}</div>
                  <div className="text-sm font-medium text-emerald-700 text-center">Community Applications</div>
                  <div className="text-xs text-emerald-600 mt-1 text-center flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {job.applicationCount || 0} views
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {totalApplications > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{applicationStats.underReview}</div>
                  <div className="text-sm text-emerald-700 font-medium">Under Review</div>
                </CardContent>
              </Card>
              <Card className="border border-green-200 bg-green-50/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{applicationStats.shortlisted}</div>
                  <div className="text-sm text-green-700 font-medium">Shortlisted</div>
                </CardContent>
              </Card>
              <Card className="border border-cyan-200 bg-cyan-50/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-600">{applicationStats.interviewScheduled}</div>
                  <div className="text-sm text-cyan-700 font-medium">Interviews</div>
                </CardContent>
              </Card>
              <Card className="border border-amber-200 bg-amber-50/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600">{applicationStats.hired}</div>
                  <div className="text-sm text-amber-700 font-medium">Accepted</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Applications Management Section */}
          <Card className="border border-emerald-200 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl text-gray-900">
                    <div className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-sm">
                      <Users2 className="h-6 w-6 text-white" />
                    </div>
                    Community Applications
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 mt-2">
                    Review, shortlist, and manage community members for this opportunity
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={applicationsLoading}
                    className="flex items-center gap-2 border-emerald-200 hover:bg-white text-emerald-700"
                  >
                    <RefreshCw className={`h-4 w-4 ${applicationsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-emerald-200 hover:bg-white text-emerald-700"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-emerald-200 hover:bg-white text-emerald-700"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <ApplicationList
                viewType="organization"
                jobId={jobId as string}
                onApplicationUpdate={handleStatusUpdate} // Added onApplicationUpdate
                onApplicationSelect={handleApplicationSelect}
                showFilters={true}
                title={`Applications for ${job.title}`}
                description={`${totalApplications} community members have applied for this opportunity`}
              />
            </CardContent>
          </Card>

          {/* Community Impact Footer */}
          <Card className="mt-8 border border-emerald-200 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Community Impact Progress
                  </h3>
                  <p className="text-gray-600">
                    You're making a difference by creating opportunities. {applicationStats.shortlisted > 0 ? `${applicationStats.shortlisted} community members are shortlisted for further review.` : 'Continue reviewing applications to find the best community members.'}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">
                      {totalApplications > 0 ? Math.round((applicationStats.hired / totalApplications) * 100) : 0}%
                    </div>
                    <div className="text-gray-600">Acceptance Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-600">{applicationStats.interviewScheduled}</div>
                    <div className="text-gray-600">Active Interviews</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationJobApplicationsPage;