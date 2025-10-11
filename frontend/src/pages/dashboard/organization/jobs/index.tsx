// pages/dashboard/organization/jobs/index.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, Job } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import JobForm from '@/components/job/JobForm';
import JobCard from '@/components/job/JobCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from '@/hooks/use-toast';

const OrganizationJobsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Fetch organization jobs
  const { 
    data: jobsData, 
    isLoading, 
    error: fetchError 
  } = useQuery({
    queryKey: ['companyJobs'],
    queryFn: () => jobService.getCompanyJobs(),
    enabled: !!user && user.role === 'company',
  });

  // Create job mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Job>) => jobService.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationJobs'] });
      setShowForm(false);
      toast({
        title: 'Opportunity created successfully',
        description: 'Your opportunity is now live and visible to candidates',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create opportunity',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Update job mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Job> }) =>
      jobService.updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationJobs'] });
      setEditingJob(null);
      toast({
        title: 'Opportunity updated successfully',
        description: 'Your opportunity changes have been saved',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update opportunity',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Delete job mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobService.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationJobs'] });
      toast({
        title: 'Opportunity deleted successfully',
        description: 'The opportunity has been permanently removed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete opportunity',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Status toggle mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { 
      id: string; 
      status: "draft" | "active" | "paused" | "closed" | "archived"; 
    }) =>
      jobService.updateJob(id, { status }),
    onSuccess: () => {
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

  const handleCreateJob = async (data: Partial<Job>) => {
    await createMutation.mutateAsync(data);
  };

  const handleUpdateJob = async (data: Partial<Job>) => {
    if (editingJob) {
      await updateMutation.mutateAsync({ id: editingJob._id, data });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (confirm('Are you sure you want to delete this opportunity? This action cannot be undone.')) {
      await deleteMutation.mutateAsync(jobId);
    }
  };

  const handleToggleStatus = async (
    jobId: string,
    newStatus: "draft" | "active" | "paused" | "closed" | "archived"
  ) => {
    await statusMutation.mutateAsync({ id: jobId, status: newStatus });
  };

  const handleViewStats = (jobId: string) => {
    // Navigate to job stats page or open stats modal
    console.log('View stats for opportunity:', jobId);
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

  const jobs = jobsData?.data || [];
  const pagination = jobsData?.pagination;

  // Calculate stats from jobs data
  const stats = {
    totalOpportunities: jobs.length,
    activeOpportunities: jobs.filter((job: Job) => job.status === 'active').length,
    draftOpportunities: jobs.filter((job: Job) => job.status === 'draft').length,
    totalApplications: jobs.reduce((sum: number, job: Job) => sum + (job.applicationCount || 0), 0),
    totalViews: jobs.reduce((sum: number, job: Job) => sum + (job.viewCount || 0), 0),
    avgSalary: 0 // You can calculate this if needed
  };

  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Opportunities Management</h1>
              <p className="text-gray-600 mt-2">Create and manage your opportunities and projects</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Create New Opportunity
            </button>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 text-center">
                <div className="text-3xl font-bold text-teal-600 mb-2">{stats.totalOpportunities || 0}</div>
                <div className="text-gray-600">Total Opportunities</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.activeOpportunities || 0}</div>
                <div className="text-gray-600">Active Opportunities</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.draftOpportunities || 0}</div>
                <div className="text-gray-600">Draft Opportunities</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{stats.totalApplications || 0}</div>
                <div className="text-gray-600">Total Applications</div>
              </div>
            </div>
          )}

          {/* Job Form Modals */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl w-full max-w-4xl max-h-screen overflow-y-auto">
                <JobForm
                  onSubmit={handleCreateJob}
                  loading={createMutation.isPending}
                  onCancel={() => setShowForm(false)}
                  // organizationVerified={user?.organizationVerified || false}
                />
              </div>
            </div>
          )}

          {editingJob && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl w-full max-w-4xl max-h-screen overflow-y-auto">
                <JobForm
                  initialData={editingJob}
                  onSubmit={handleUpdateJob}
                  loading={updateMutation.isPending}
                  onCancel={() => setEditingJob(null)}
                  mode="edit"
                  // organizationVerified={user?.organizationVerified || false}
                />
              </div>
            </div>
          )}

          {/* Jobs Grid */}
          <div className="grid gap-6">
            {jobs && jobs.length > 0 ? (
              jobs.map((job: Job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  showActions={true}
                  onEdit={setEditingJob}
                  onDelete={handleDeleteJob}
                  onViewStats={handleViewStats}
                  onToggleStatus={handleToggleStatus}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No opportunities yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first opportunity to get started with your projects
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition-all duration-200"
                  >
                    Create First Opportunity
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {/* Handle previous page */}}
                  disabled={pagination.current === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {pagination.current} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => {/* Handle next page */}}
                  disabled={pagination.current === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Loading States */}
          {(createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || statusMutation.isPending) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 flex items-center space-x-3">
                <LoadingSpinner />
                <p className="text-gray-600">Processing...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationJobsPage;