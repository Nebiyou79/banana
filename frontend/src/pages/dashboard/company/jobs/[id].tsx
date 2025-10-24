/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from '@/hooks/use-toast';
import { Edit3, Share2, Eye, Users, MapPin, Briefcase } from 'lucide-react';
import SocialShare from '@/components/layout/SocialShare'; // Fixed import path
import { Button } from '@/components/ui/Button';

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
        description: 'Job status has been changed',
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
      await statusMutation.mutateAsync({
        id: id as string,
        status: newStatus,
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError || !job) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Job Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The job you`re looking for doesn`t exist or you don`t have permission to view it.
            </p>
            <Link
              href="/dashboard/company/jobs"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Jobs
            </Link>
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

  const getStatusActions = () => {
    switch (job.status) {
      case 'draft':
        return (
          <Button
            onClick={() => handleStatusChange('active')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Publish Job
          </Button>
        );
      case 'active':
        return (
          <Button
            onClick={() => handleStatusChange('paused')}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Pause Job
          </Button>
        );
      case 'paused':
        return (
          <Button
            onClick={() => handleStatusChange('active')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Resume Job
          </Button>
        );
      case 'closed':
        return (
          <Button
            onClick={() => handleStatusChange('active')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Reopen Job
          </Button>
        );
      default:
        return null;
    }
  };

  const isInternational = job.location.region === 'international';
  const jobTypeLabel = jobService.getJobTypeDisplayLabel(job);
  const ownerName = jobService.getOwnerName(job);
  const ownerType = jobService.getOwnerType(job);
  
  // Get share URL safely for SSR
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/jobs/${job._id}`
    : `https://yourapp.com/jobs/${job._id}`;
    
  const shareTitle = `${job.title} - ${jobTypeLabel}`;
  const shareDescription = job.shortDescription || job.description.substring(0, 200) + '...';

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <Link
                href="/dashboard/company/jobs"
                className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
              >
                ← Back to Jobs
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600 mt-2">
                {jobTypeLabel} • Posted on {formatDate(job.createdAt)}
              </p>
            </div>
            <div className="flex gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(job.status)}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
              {getStatusActions()}
              <Link 
                href={`/dashboard/company/jobs/edit/${job._id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit {jobTypeLabel}
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{job.viewCount || 0}</div>
              <div className="text-gray-600 flex items-center justify-center gap-1">
                <Eye className="w-4 h-4" /> Total Views
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{job.applicationCount || 0}</div>
              <div className="text-gray-600 flex items-center justify-center gap-1">
                <Users className="w-4 h-4" /> Applications
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {jobService.getJobTypeLabel(job.remote)}
              </div>
              <div className="text-gray-600 flex items-center justify-center gap-1">
                <MapPin className="w-4 h-4" /> Work Type
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {jobService.getJobTypeLabel(job.type)}
              </div>
              <div className="text-gray-600 flex items-center justify-center gap-1">
                <Briefcase className="w-4 h-4" /> Job Type
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Job Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{jobTypeLabel} Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-gray-900">
                      {job.location.city}, {jobService.getEthiopianRegions().find(r => r.slug === job.location.region)?.name}
                      {!isInternational && <span className="text-green-600 ml-2">🇪🇹</span>}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Job Type</label>
                    <p className="text-gray-900">{jobService.getJobTypeLabel(job.type)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Experience Level</label>
                    <p className="text-gray-900">{jobService.getExperienceLabel(job.experienceLevel)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Salary Range</label>
                    <p className="text-gray-900">{jobService.formatSalary(job.salary)}</p>
                  </div>
                  {job.category && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Category</label>
                      <p className="text-gray-900">
                        {jobService.getJobCategories().find(cat => cat.value === job.category)?.label || job.category}
                      </p>
                    </div>
                  )}
                  {job.educationLevel && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Education Level</label>
                      <p className="text-gray-900">{jobService.getEducationLabel(job.educationLevel)}</p>
                    </div>
                  )}
                  {job.applicationDeadline && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Application Deadline</label>
                      <p className="text-gray-900">{formatDate(job.applicationDeadline)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Short Description */}
              {job.shortDescription && (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
                  <p className="text-gray-700">{job.shortDescription}</p>
                </div>
              )}

              {/* Description Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {jobTypeLabel} Description
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>

              {/* Requirements Card */}
              {job.requirements.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Responsibilities Card */}
              {job.responsibilities.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsibilities</h2>
                  <ul className="space-y-2">
                    {job.responsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span className="text-gray-700">{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits Card */}
              {job.benefits.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits</h2>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-500 mr-2">•</span>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column - Actions & Info */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href={`/dashboard/company/jobs/${job._id}/applications`}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    View Applications ({job.applicationCount || 0})
                  </Link>
                  
                  {/* Enhanced Social Share Component */}
                  <SocialShare
                    url={shareUrl}
                    title={shareTitle}
                    description={shareDescription}
                    jobData={job} // Pass job data for image sharing
                    trigger={
                      <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share {jobTypeLabel}
                      </button>
                    }
                  />
                  
                  {getStatusActions()}
                </div>
              </div>

              {/* Skills Card */}
              {job.skills.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 border border-blue-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Company/Organization Info Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{ownerType} Info</h2>
                <div className="flex items-center space-x-3 mb-4">
                  {(job.company?.logoUrl || job.organization?.logoFullUrl) && (
                    <img
                      src={job.company?.logoUrl || job.organization?.logoFullUrl}
                      alt={ownerName}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{ownerName}</h3>
                    {(job.company?.industry || job.organization?.industry) && (
                      <p className="text-sm text-gray-600">{job.company?.industry || job.organization?.industry}</p>
                    )}
                  </div>
                </div>
                {(job.company?.verified || job.organization?.verified) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-3">
                    Verified {ownerType}
                  </span>
                )}
                <Link
                  href="/dashboard/company/profile"
                  className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center"
                >
                  View {ownerType} Profile
                </Link>
              </div>

              {/* Status History Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{jobTypeLabel} History</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="text-gray-900">{formatDate(job.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="text-gray-900">{formatDate(job.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(job.status)}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  {job.tags.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tags</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {job.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {job.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{job.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyJobDetailPage;