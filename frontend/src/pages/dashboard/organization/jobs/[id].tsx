/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/organization/jobs/[id].tsx
import React from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from '@/hooks/use-toast';
import {  Clock, Heart, Calendar, MapPin, Target, Share2 } from 'lucide-react';
import SocialShare from '@/components/layout/SocialShare';

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
        description: 'Opportunity status has been changed',
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
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError || !job) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Opportunity Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The opportunity you`re looking for doesn`t exist or you don`t have permission to view it.
            </p>
            <Link
              href="/dashboard/organization/jobs"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Opportunities
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
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusActions = () => {
    switch (job.status) {
      case 'draft':
        return (
          <button
            onClick={() => handleStatusChange('active')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Publish Opportunity
          </button>
        );
      case 'active':
        return (
          <button
            onClick={() => handleStatusChange('paused')}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Pause Opportunity
          </button>
        );
      case 'paused':
        return (
          <button
            onClick={() => handleStatusChange('active')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Resume Opportunity
          </button>
        );
      case 'closed':
        return (
          <button
            onClick={() => handleStatusChange('active')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Reopen Opportunity
          </button>
        );
      default:
        return null;
    }
  };

  const isInternational = job.location.region === 'international';
  const opportunityTypeLabel = jobService.getJobTypeDisplayLabel(job);
  const shareUrl = `${window.location.origin}/jobs/${job._id}`;
  const shareTitle = `${job.title} - ${opportunityTypeLabel}`;
  const shareDescription = job.shortDescription || job.description.substring(0, 200) + '...';

  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <Link
                href="/dashboard/organization/jobs"
                className="text-purple-600 hover:text-purple-800 mb-4 inline-flex items-center"
              >
                ← Back to Opportunities
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {opportunityTypeLabel}
                </span>
                <p className="text-gray-600">Posted on {formatDate(job.createdAt)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(job.status)}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
              {getStatusActions()}
              <Link 
                href={`/dashboard/organization/jobs/edit/${job._id}`}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Edit Opportunity
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-200 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{job.viewCount || 0}</div>
              <div className="text-gray-600">Total Views</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-200 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{job.applicationCount || 0}</div>
              <div className="text-gray-600">Applications</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-200 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {job.remote === 'remote' ? 'Remote' : job.remote === 'hybrid' ? 'Hybrid' : 'On-site'}
              </div>
              <div className="text-gray-600">Work Type</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-200 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {job.type.replace('-', ' ')}
              </div>
              <div className="text-gray-600">Engagement Type</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Opportunity Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Opportunity Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Location
                    </label>
                    <p className="text-gray-900">
                      {job.location.city}, {jobService.getEthiopianRegions().find(r => r.slug === job.location.region)?.name}
                      {!isInternational && <span className="text-green-600 ml-2">🇪🇹</span>}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Engagement Type</label>
                    <p className="text-gray-900 capitalize">{job.type.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Experience Level</label>
                    <p className="text-gray-900 capitalize">{job.experienceLevel.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Compensation</label>
                    <p className="text-gray-900">{jobService.formatSalary(job.salary)}</p>
                  </div>
                  {job.category && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Category</label>
                      <p className="text-gray-900">{job.category}</p>
                    </div>
                  )}
                  {job.applicationDeadline && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Application Deadline
                      </label>
                      <p className="text-gray-900">{formatDate(job.applicationDeadline)}</p>
                    </div>
                  )}
                  {job.duration && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Duration
                      </label>
                      <p className="text-gray-900">
                        {job.duration.isOngoing 
                          ? 'Ongoing' 
                          : `${job.duration.value} ${job.duration.unit}`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Opportunity Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>

              {/* Volunteer Information */}
              {job.volunteerInfo && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-green-600" />
                    Volunteer Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {job.volunteerInfo.hoursPerWeek && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Hours Per Week</label>
                        <p className="text-gray-900">{job.volunteerInfo.hoursPerWeek} hours</p>
                      </div>
                    )}
                    {job.volunteerInfo.commitmentLevel && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Commitment Level</label>
                        <p className="text-gray-900 capitalize">{job.volunteerInfo.commitmentLevel}</p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600 mb-2">Support Provided</label>
                      <div className="flex flex-wrap gap-2">
                        {job.volunteerInfo.providesAccommodation && (
                          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            Accommodation
                          </span>
                        )}
                        {job.volunteerInfo.providesStipend && (
                          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            Stipend
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Requirements Card */}
              {job.requirements.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
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
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
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
            </div>

            {/* Right Column - Actions & Info */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href={`/dashboard/organization/jobs/${job._id}/applications`}
                    className="block w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-center"
                  >
                    View Applications ({job.applicationCount || 0})
                  </Link>
                  
                  {/* Social Share Component */}
                  <SocialShare
                    url={shareUrl}
                    title={shareTitle}
                    description={shareDescription}
                    trigger={
                      <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share Opportunity
                      </button>
                    }
                  />
                  
                  {getStatusActions()}
                </div>
              </div>

              {/* Skills Card */}
              {job.skills.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700 border border-purple-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Organization Info Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Organization Info</h2>
                <div className="flex items-center space-x-3 mb-4">
                  {job.organization?.logoUrl && (
                    <img
                      src={job.organization.logoUrl}
                      alt={job.organization.name}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
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
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-3">
                    Verified Organization
                  </span>
                )}
                <Link
                  href="/dashboard/organization/profile"
                  className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center"
                >
                  View Organization Profile
                </Link>
              </div>

              {/* Status History Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Opportunity History</h2>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationJobDetailPage;