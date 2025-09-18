/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, Job } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import JobForm from '@/components/job/JobForm';

const CompanyJobDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  const { data: job, isLoading, error: fetchError } = useQuery({
    queryKey: ['companyJob', id],
    queryFn: () => jobService.getJob(id as string),
    enabled: !!id && !!user,
  });

  // Update job mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Job> }) =>
      jobService.updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyJob', id] });
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] });
      setIsEditing(false);
      setError('');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update job');
    },
  });

  // Status change mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      jobService.updateJob(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyJob', id] });
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] });
      setError('');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update job status');
    },
  });

  const handleUpdateJob = (data: any) => {
    if (id) {
      updateMutation.mutate({ id: id as string, data });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (id && job) {
      statusMutation.mutate({ id: id as string, status: newStatus });
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setError('');
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

  const formatSalary = (salary: Job['salary']) => {
    if (!salary || !salary.min || !salary.max) return 'Not specified';
    
    const formatNumber = (num: number) => 
      new Intl.NumberFormat('en-US').format(num);
    
    return `$${formatNumber(salary.min)} - $${formatNumber(salary.max)} ${salary.currency}/${salary.period}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-red-100 text-red-800 border-red-200';
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
            Publish Job
          </button>
        );
      case 'active':
        return (
          <button
            onClick={() => handleStatusChange('closed')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Close Job
          </button>
        );
      case 'closed':
        return (
          <button
            onClick={() => handleStatusChange('active')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Reopen Job
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

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
              <p className="text-gray-600 mt-2">Posted on {formatDate(job.createdAt)}</p>
            </div>
            <div className="flex gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(job.status)}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
              {getStatusActions()}
              <button 
                onClick={handleEditToggle}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Job'}
              </button>
            </div>
          </div>

          {/* Edit Form Modal */}
          {isEditing && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl w-full max-w-4xl max-h-screen overflow-y-auto">
                <JobForm
                  initialData={job}
                  onSubmit={handleUpdateJob}
                  loading={updateMutation.isPending}
                  onCancel={handleEditToggle}
                />
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{job.views}</div>
              <div className="text-gray-600">Total Views</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{job.applicationCount}</div>
              <div className="text-gray-600">Applications</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {job.remote ? 'Remote' : 'On-site'}
              </div>
              <div className="text-gray-600">Work Type</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {job.type.replace('-', ' ')}
              </div>
              <div className="text-gray-600">Job Type</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Job Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-gray-900">{job.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Job Type</label>
                    <p className="text-gray-900 capitalize">{job.type.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Experience Level</label>
                    <p className="text-gray-900 capitalize">{job.experienceLevel}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Salary Range</label>
                    <p className="text-gray-900">{formatSalary(job.salary)}</p>
                  </div>
                  {job.category && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Category</label>
                      <p className="text-gray-900">{job.category}</p>
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

              {/* Description Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
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
            </div>

            {/* Right Column - Actions & Info */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href={`/dashboard/company/jobs/${job._id}/applications`}
                    className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
                  >
                    View Applications ({job.applicationCount})
                  </Link>
                  <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                    Share Job
                  </button>
                  <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                    Copy Link
                  </button>
                  {job.status === 'active' && (
                    <button 
                      onClick={() => handleStatusChange('draft')}
                      className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Pause Job
                    </button>
                  )}
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

              {/* Company Info Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Info</h2>
                <div className="flex items-center space-x-3 mb-4">
                  {job.company.logoUrl && (
                    <img
                      src={job.company.logoUrl}
                      alt={job.company.name}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.company.name}</h3>
                    {job.company.industry && (
                      <p className="text-sm text-gray-600">{job.company.industry}</p>
                    )}
                  </div>
                </div>
                {job.company.verified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-3">
                    Verified Company
                  </span>
                )}
                <Link
                  href="/dashboard/company/profile"
                  className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center"
                >
                  View Company Profile
                </Link>
              </div>

              {/* Status History Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Job History</h2>
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

export default CompanyJobDetailPage;