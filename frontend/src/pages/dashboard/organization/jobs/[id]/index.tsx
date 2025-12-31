/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/organization/jobs/[id].tsx - COMPLETELY FIXED VERSION
import React from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '@/services/jobService';
import { applicationService } from '@/services/applicationService';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from '@/hooks/use-toast';
import { 
  Clock, 
  Heart, 
  Calendar, 
  MapPin, 
  Target, 
  Share2, 
  Edit3, 
  Eye, 
  Users, 
  FileText,
  ArrowRight,
  Star,
  Users2,
  Building,
  CheckCircle,
  XCircle,
  PauseCircle,
  Archive,
  DollarSign,
  GraduationCap,
  Tag,
  Award,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

const OrganizationJobDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: job, isLoading, error: fetchError } = useQuery({
    queryKey: ['organizationJob', id],
    queryFn: () => jobService.getJob(id as string),
    enabled: !!id && !!user,
  });

  // FIXED: Use correct method name - getJobApplications instead of getApplicationsForJob
  const { data: applicationStats, isLoading: statsLoading } = useQuery({
    queryKey: ['jobApplicationStats', id],
    queryFn: () => applicationService.getJobApplications(id as string, { limit: 5 }),
    enabled: !!id && !!job,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { 
      id: string; 
      status: "draft" | "active" | "paused" | "closed" | "archived"; 
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

  const handleStatusChange = async (
    newStatus: "draft" | "active" | "paused" | "closed" | "archived"
  ) => {
    if (id && job) {
      try {
        await statusMutation.mutateAsync({
          id: id as string,
          status: newStatus,
        });
      } catch (error) {
        console.error('Failed to update opportunity status:', error);
      }
    }
  };

  const handleViewApplications = () => {
    if (id) {
      router.push(`/dashboard/organization/jobs/${id}/applications`);
    }
  };

  // FIXED: Add proper type for applicationId
  const handleViewApplicationDetails = (applicationId: string) => {
    router.push(`/dashboard/organization/applications/${applicationId}`);
  };

  const handleEditOpportunity = () => {
    if (job) {
      router.push(`/dashboard/organization/jobs/edit/${job._id}`);
    }
  };

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

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading opportunity details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError || !job) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Opportunity Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The opportunity you`re looking for doesn`t exist or you don`t have permission to view it.
            </p>
            <div className="space-y-3">
              <Link
                href="/dashboard/organization/jobs"
                className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors w-full"
              >
                Back to Opportunities
              </Link>
              <Link
                href="/dashboard/organization/jobs/create"
                className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors w-full"
              >
                Create New Opportunity
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'draft': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'closed': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'paused': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'draft': return <Edit3 className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      case 'paused': return <PauseCircle className="w-4 h-4" />;
      case 'archived': return <Archive className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusActions = () => {
    switch (job.status) {
      case 'draft':
        return (
          <Button
            onClick={() => handleStatusChange('active')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            // FIXED: Use statusMutation.isPending instead of statusMutation.isLoading
            disabled={statusMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Publish Opportunity
          </Button>
        );
      case 'active':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusChange('paused')}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={statusMutation.isPending}
            >
              <PauseCircle className="w-4 h-4 mr-2" />
              Pause Opportunity
            </Button>
            <Button
              onClick={() => handleStatusChange('closed')}
              className="bg-rose-600 hover:bg-rose-700 text-white"
              disabled={statusMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Close Opportunity
            </Button>
          </div>
        );
      case 'paused':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusChange('active')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={statusMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Resume Opportunity
            </Button>
            <Button
              onClick={() => handleStatusChange('closed')}
              className="bg-rose-600 hover:bg-rose-700 text-white"
              disabled={statusMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Close Opportunity
            </Button>
          </div>
        );
      case 'closed':
        return (
          <Button
            onClick={() => handleStatusChange('active')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={statusMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Reopen Opportunity
          </Button>
        );
      default:
        return null;
    }
  };

  const isInternational = job.location?.region === 'international';
  const opportunityTypeLabel = jobService.getJobTypeDisplayLabel(job);
  
  // FIXED: Access data correctly from applicationStats
  const totalApplications = applicationStats?.data?.length || 0;
  const recentApplications = applicationStats?.data?.slice(0, 3) || [];

  const isOpportunityExpired = job.applicationDeadline && new Date(job.applicationDeadline) < new Date();

  const getOpportunityTypeIcon = (type?: string) => {
    switch (type) {
      case 'volunteer':
        return <Heart className="h-5 w-5 text-rose-500" />;
      case 'internship':
        return <Target className="h-5 w-5 text-cyan-500" />;
      case 'fellowship':
        return <Award className="h-5 w-5 text-amber-500" />;
      case 'training':
        return <GraduationCap className="h-5 w-5 text-purple-500" />;
      case 'grant':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      default:
        return <Users2 className="h-5 w-5 text-emerald-500" />;
    }
  };

  const getCommitmentLevelLabel = (level?: string) => {
    switch (level) {
      case 'casual': return 'Casual (1-10 hours/week)';
      case 'regular': return 'Regular (10-25 hours/week)';
      case 'intensive': return 'Intensive (25+ hours/week)';
      default: return level;
    }
  };

  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div className="space-y-3 flex-1">
              <Link
                href="/dashboard/organization/jobs"
                className="text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-2 transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Opportunities
              </Link>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {getOpportunityTypeIcon(job.opportunityType)}
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {opportunityTypeLabel}
                      </Badge>
                    </div>
                    <Badge variant="outline" className={getStatusColor(job.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(job.status)}
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </Badge>
                    <p className="text-gray-600 text-sm">
                      Posted on {formatDate(job.createdAt)}
                    </p>
                    {isOpportunityExpired && (
                      <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-200">
                        Expired
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {getStatusActions()}
              <Button
                onClick={handleEditOpportunity}
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Opportunity
              </Button>
              <Button
                onClick={handleShareOpportunity}
                variant="outline"
                className="border-teal-600 text-teal-600 hover:bg-teal-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border border-emerald-200 shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600 mb-1">{job.viewCount || 0}</div>
                    <div className="text-gray-600 flex items-center gap-1 text-sm">
                      <Eye className="w-4 h-4" /> Total Views
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-teal-200 shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-teal-600 mb-1">{job.applicationCount || 0}</div>
                    <div className="text-gray-600 flex items-center gap-1 text-sm">
                      <Users className="w-4 h-4" /> Total Applications
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-cyan-200 shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-cyan-600 mb-1 capitalize">
                      {job.remote || 'on-site'}
                    </div>
                    <div className="text-gray-600 flex items-center gap-1 text-sm">
                      <MapPin className="w-4 h-4" /> Work Type
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-cyan-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-amber-200 shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-amber-600 mb-1 capitalize">
                      {job.type.replace('-', ' ')}
                    </div>
                    <div className="text-gray-600 flex items-center gap-1 text-sm">
                      <Target className="w-4 h-4" /> Engagement Type
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Opportunity Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Applications Preview Card */}
              {totalApplications > 0 && (
                <Card className="border border-emerald-200 shadow-sm bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4 border-b border-emerald-200">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      Recent Applications ({totalApplications})
                    </CardTitle>
                    <CardDescription>
                      Latest applications from community members
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {recentApplications.map((application) => (
                        <div 
                          key={application._id as string} 
                          className="flex items-center justify-between p-4 border border-emerald-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer group"
                          onClick={() => handleViewApplicationDetails(application._id as string)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                              <Users2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {application.userInfo?.name || application.candidate?.name || 'Community Member'}
                              </p>
                              <p className="text-sm text-gray-500">
                                Applied {formatDateTime(application.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusColor(application.status)}>
                              {applicationService.getStatusLabel(application.status)}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalApplications > 3 && (
                      <Button 
                        onClick={handleViewApplications}
                        variant="outline" 
                        className="w-full mt-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                      >
                        View All {totalApplications} Applications
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Basic Info Card */}
              <Card className="border border-emerald-200 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-emerald-200">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-emerald-600" />
                    Opportunity Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-600">Location</label>
                          <p className="text-gray-900 font-medium">
                            {job.location?.city || 'Not specified'}, {jobService.getEthiopianRegions().find(r => r.slug === job.location?.region)?.name || job.location?.region}
                            {!isInternational && job.location?.region !== 'international' && (
                              <span className="text-emerald-600 ml-2">🇪🇹</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-emerald-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-600">Engagement Type</label>
                          <p className="text-gray-900 font-medium capitalize">{job.type.replace('-', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-emerald-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-600">Experience Level</label>
                          <p className="text-gray-900 font-medium capitalize">{job.experienceLevel.replace('-', ' ')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-600">Compensation</label>
                          <p className="text-gray-900 font-medium">{jobService.formatSalary(job.salary)}</p>
                        </div>
                      </div>
                      {job.category && (
                        <div className="flex items-center gap-3">
                          <Tag className="w-5 h-5 text-emerald-400" />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Category</label>
                            <p className="text-gray-900 font-medium">
                              {jobService.getJobCategories().find(cat => cat.value === job.category)?.label || job.category}
                            </p>
                          </div>
                        </div>
                      )}
                      {job.educationLevel && (
                        <div className="flex items-center gap-3">
                          <GraduationCap className="w-5 h-5 text-emerald-400" />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Education Level</label>
                            <p className="text-gray-900 font-medium">{jobService.getEducationLabel(job.educationLevel)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Duration Information */}
                  {job.duration && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">Duration:</span>
                        <span className="text-sm font-medium text-amber-600">
                          {job.duration.isOngoing 
                            ? 'Ongoing' 
                            : `${job.duration.value} ${job.duration.unit}`
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Application Deadline */}
                  {job.applicationDeadline && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-800">Application Deadline:</span>
                        <span className={`text-sm font-medium ${isOpportunityExpired ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatDate(job.applicationDeadline)}
                          {isOpportunityExpired && ' (Expired)'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Volunteer Information */}
              {job.volunteerInfo && (
                <Card className="border border-rose-200 shadow-sm bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4 border-b border-rose-200">
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-rose-600" />
                      Volunteer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {job.volunteerInfo.hoursPerWeek && (
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-rose-400" />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Hours Per Week</label>
                            <p className="text-gray-900 font-medium">{job.volunteerInfo.hoursPerWeek} hours</p>
                          </div>
                        </div>
                      )}
                      {job.volunteerInfo.commitmentLevel && (
                        <div className="flex items-center gap-3">
                          <Target className="w-5 h-5 text-rose-400" />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Commitment Level</label>
                            <p className="text-gray-900 font-medium">{getCommitmentLevelLabel(job.volunteerInfo.commitmentLevel)}</p>
                          </div>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-600 mb-2">Support Provided</label>
                        <div className="flex flex-wrap gap-2">
                          {job.volunteerInfo.providesAccommodation && (
                            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                              <Home className="w-3 h-3 mr-1" />
                              Accommodation
                            </Badge>
                          )}
                          {job.volunteerInfo.providesStipend && (
                            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                              <DollarSign className="w-3 h-3 mr-1" />
                              Stipend
                            </Badge>
                          )}
                          {!job.volunteerInfo.providesAccommodation && !job.volunteerInfo.providesStipend && (
                            <span className="text-sm text-gray-500">No additional support provided</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description Card */}
              <Card className="border border-emerald-200 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-emerald-200">
                  <CardTitle>Opportunity Description</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-emerald max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements Card */}
              {job.requirements && job.requirements.length > 0 && (
                <Card className="border border-emerald-200 shadow-sm bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4 border-b border-emerald-200">
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {job.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-emerald-500 mr-3 mt-1">•</span>
                          <span className="text-gray-700 leading-relaxed">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Responsibilities Card */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <Card className="border border-emerald-200 shadow-sm bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4 border-b border-emerald-200">
                    <CardTitle>Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {job.responsibilities.map((responsibility, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-teal-500 mr-3 mt-1">•</span>
                          <span className="text-gray-700 leading-relaxed">{responsibility}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Actions & Info */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <Card className="border border-emerald-200 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-emerald-200">
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button
                      onClick={handleViewApplications}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 flex items-center justify-center gap-2"
                      disabled={totalApplications === 0}
                    >
                      <Users className="w-4 h-4" />
                      View Applications ({job.applicationCount || 0})
                    </Button>
                    
                    <Button
                      onClick={handleShareOpportunity}
                      variant="outline"
                      className="w-full border-teal-600 text-teal-600 hover:bg-teal-50 py-3 flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share Opportunity
                    </Button>
                    
                    <Button
                      onClick={handleEditOpportunity}
                      variant="outline"
                      className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-3 flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Opportunity Details
                    </Button>

                    {getStatusActions() && (
                      <div className="pt-2 border-t border-emerald-200">
                        {getStatusActions()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Skills Card */}
              {job.skills && job.skills.length > 0 && (
                <Card className="border border-emerald-200 shadow-sm bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4 border-b border-emerald-200">
                    <CardTitle>Required Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Organization Info Card */}
              <Card className="border border-emerald-200 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-emerald-200">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-emerald-600" />
                    Organization Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    {job.organization?.logoUrl && (
                      <img
                        src={job.organization.logoUrl}
                        alt={job.organization.name}
                        className="w-12 h-12 rounded-lg object-cover border border-emerald-200"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.organization?.name}</h3>
                      {job.organization?.industry && (
                        <p className="text-sm text-gray-600">{job.organization.industry}</p>
                      )}
                    </div>
                  </div>
                  {job.organization?.verified && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 mb-3">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified Organization
                    </Badge>
                  )}
                  <Link
                    href="/dashboard/organization/profile"
                    className="block w-full bg-emerald-50 text-emerald-700 py-2 px-4 rounded-lg hover:bg-emerald-100 transition-colors text-center text-sm font-medium border border-emerald-200"
                  >
                    View Organization Profile
                  </Link>
                </CardContent>
              </Card>

              {/* Opportunity History Card */}
              <Card className="border border-emerald-200 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-emerald-200">
                  <CardTitle>Opportunity History</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Created</span>
                      <span className="text-gray-900 font-medium">{formatDateTime(job.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="text-gray-900 font-medium">{formatDateTime(job.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status</span>
                      <Badge variant="outline" className={getStatusColor(job.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(job.status)}
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </Badge>
                    </div>
                    {job.tags && job.tags.length > 0 && (
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 pt-1">Tags</span>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                          {job.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                              {tag}
                            </Badge>
                          ))}
                          {job.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                              +{job.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationJobDetailPage;