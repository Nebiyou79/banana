/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/jobs/[id].tsx - COMPLETELY FIXED VERSION
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
  Edit3, 
  Share2, 
  Eye, 
  Users, 
  MapPin, 
  Briefcase, 
  FileText, 
  ArrowRight, 
  Calendar,
  Clock,
  DollarSign,
  GraduationCap,
  Tag,
  Building,
  CheckCircle,
  XCircle,
  PauseCircle,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

const CompanyJobDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: job, isLoading, error: fetchError } = useQuery({
    queryKey: ['companyJob', id],
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
        console.error('Failed to update job status:', error);
      }
    }
  };

  const handleViewApplications = () => {
    if (id) {
      router.push(`/dashboard/company/jobs/${id}/applications`);
    }
  };

  // FIXED: Add proper type for applicationId
  const handleViewApplicationDetails = (applicationId: string) => {
    router.push(`/dashboard/company/applications/${applicationId}`);
  };

  const handleEditJob = () => {
    if (job) {
      router.push(`/dashboard/company/jobs/edit/${job._id}`);
    }
  };

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

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading job details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError || !job) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Job Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The job you`re looking for doesn`t exist or you don`t have permission to view it.
            </p>
            <div className="space-y-3">
              <Link
                href="/dashboard/company/jobs"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full"
              >
                Back to Jobs
              </Link>
              <Link
                href="/dashboard/company/jobs/create"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors w-full"
              >
                Create New Job
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
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-red-100 text-red-800 border-red-200';
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
            className="bg-green-600 hover:bg-green-700 text-white"
            // FIXED: Use statusMutation.isPending instead of statusMutation.isLoading
            disabled={statusMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Publish Job
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
              Pause Job
            </Button>
            <Button
              onClick={() => handleStatusChange('closed')}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={statusMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Close Job
            </Button>
          </div>
        );
      case 'paused':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusChange('active')}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={statusMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Resume Job
            </Button>
            <Button
              onClick={() => handleStatusChange('closed')}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={statusMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Close Job
            </Button>
          </div>
        );
      case 'closed':
        return (
          <Button
            onClick={() => handleStatusChange('active')}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={statusMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Reopen Job
          </Button>
        );
      default:
        return null;
    }
  };

  const isInternational = job.location?.region === 'international';
  const jobTypeLabel = jobService.getJobTypeDisplayLabel(job);
  const ownerName = jobService.getOwnerName(job);
  const ownerType = jobService.getOwnerType(job);
  
  // FIXED: Access data correctly from applicationStats
  const totalApplications = applicationStats?.data?.length || 0;
  const recentApplications = applicationStats?.data?.slice(0, 3) || [];

  const isJobExpired = job.applicationDeadline && new Date(job.applicationDeadline) < new Date();

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div className="space-y-3 flex-1">
              <Link
                href="/dashboard/company/jobs"
                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2 transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Jobs
              </Link>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Badge variant="outline" className={getStatusColor(job.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(job.status)}
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </Badge>
                    <p className="text-gray-600 text-sm">
                      {jobTypeLabel} • Posted on {formatDate(job.createdAt)}
                    </p>
                    {isJobExpired && (
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
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
                onClick={handleEditJob}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Job
              </Button>
              <Button
                onClick={handleShareJob}
                variant="outline"
                className="border-gray-600 text-gray-600 hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">{job.viewCount || 0}</div>
                    <div className="text-gray-600 flex items-center gap-1 text-sm">
                      <Eye className="w-4 h-4" /> Total Views
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600 mb-1">{job.applicationCount || 0}</div>
                    <div className="text-gray-600 flex items-center gap-1 text-sm">
                      <Users className="w-4 h-4" /> Total Applications
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-600 mb-1 capitalize">
                      {job.remote || 'on-site'}
                    </div>
                    <div className="text-gray-600 flex items-center gap-1 text-sm">
                      <MapPin className="w-4 h-4" /> Work Type
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-orange-600 mb-1 capitalize">
                      {job.type.replace('-', ' ')}
                    </div>
                    <div className="text-gray-600 flex items-center gap-1 text-sm">
                      <Briefcase className="w-4 h-4" /> Job Type
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Job Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Applications Preview Card */}
              {totalApplications > 0 && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4 border-b border-gray-200">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Recent Applications ({totalApplications})
                    </CardTitle>
                    <CardDescription>
                      Latest applications for this position
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {recentApplications.map((application) => (
                        <div 
                          key={application._id as string} 
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group"
                          onClick={() => handleViewApplicationDetails(application._id as string)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {application.userInfo?.name || application.candidate?.name || 'Applicant'}
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
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalApplications > 3 && (
                      <Button 
                        onClick={handleViewApplications}
                        variant="outline" 
                        className="w-full mt-4 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                      >
                        View All {totalApplications} Applications
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Basic Info Card */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-600">Location</label>
                          <p className="text-gray-900 font-medium">
                            {job.location?.city || 'Not specified'}, {jobService.getEthiopianRegions().find(r => r.slug === job.location?.region)?.name || job.location?.region}
                            {!isInternational && job.location?.region !== 'international' && (
                              <span className="text-green-600 ml-2">🇪🇹</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-600">Job Type</label>
                          <p className="text-gray-900 font-medium">{jobService.getJobTypeLabel(job.type)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-600">Experience Level</label>
                          <p className="text-gray-900 font-medium">{jobService.getExperienceLabel(job.experienceLevel)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-600">Salary Range</label>
                          <p className="text-gray-900 font-medium">{jobService.formatSalary(job.salary)}</p>
                        </div>
                      </div>
                      {job.category && (
                        <div className="flex items-center gap-3">
                          <Tag className="w-5 h-5 text-gray-400" />
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
                          <GraduationCap className="w-5 h-5 text-gray-400" />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Education Level</label>
                            <p className="text-gray-900 font-medium">{jobService.getEducationLabel(job.educationLevel)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {job.applicationDeadline && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Application Deadline:</span>
                        <span className={`text-sm font-medium ${isJobExpired ? 'text-red-600' : 'text-blue-600'}`}>
                          {formatDate(job.applicationDeadline)}
                          {isJobExpired && ' (Expired)'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Description Card */}
              {job.shortDescription && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4 border-b border-gray-200">
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-gray-700 leading-relaxed">{job.shortDescription}</p>
                  </CardContent>
                </Card>
              )}

              {/* Full Description Card */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements Card */}
              {job.requirements && job.requirements.length > 0 && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4 border-b border-gray-200">
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {job.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-3 mt-1">•</span>
                          <span className="text-gray-700 leading-relaxed">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Responsibilities Card */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4 border-b border-gray-200">
                    <CardTitle>Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {job.responsibilities.map((responsibility, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-3 mt-1">•</span>
                          <span className="text-gray-700 leading-relaxed">{responsibility}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Benefits Card */}
              {job.benefits && job.benefits.length > 0 && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4 border-b border-gray-200">
                    <CardTitle>Benefits</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {job.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-purple-500 mr-3 mt-1">•</span>
                          <span className="text-gray-700 leading-relaxed">{benefit}</span>
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
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button
                      onClick={handleViewApplications}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 flex items-center justify-center gap-2"
                      disabled={totalApplications === 0}
                    >
                      <Users className="w-4 h-4" />
                      View Applications ({job.applicationCount || 0})
                    </Button>
                    
                    <Button
                      onClick={handleShareJob}
                      variant="outline"
                      className="w-full border-gray-600 text-gray-600 hover:bg-gray-50 py-3 flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share Job
                    </Button>
                    
                    <Button
                      onClick={handleEditJob}
                      variant="outline"
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 py-3 flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Job Details
                    </Button>

                    {getStatusActions() && (
                      <div className="pt-2 border-t border-gray-200">
                        {getStatusActions()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Skills Card */}
              {job.skills && job.skills.length > 0 && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4 border-b border-gray-200">
                    <CardTitle>Required Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Company Info Card */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    Company Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    {job.company?.logoUrl && (
                      <img
                        src={job.company.logoUrl}
                        alt={ownerName}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{ownerName}</h3>
                      {job.company?.industry && (
                        <p className="text-sm text-gray-600">{job.company.industry}</p>
                      )}
                    </div>
                  </div>
                  {job.company?.verified && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mb-3">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified Company
                    </Badge>
                  )}
                  <Link
                    href="/dashboard/company/profile"
                    className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm font-medium"
                  >
                    View Company Profile
                  </Link>
                </CardContent>
              </Card>

              {/* Job History Card */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <CardTitle>Job History</CardTitle>
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
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {job.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
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

export default CompanyJobDetailPage;