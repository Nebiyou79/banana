/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, Job } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import JobForm from '@/components/job/JobForm';
import JobCard from '@/components/job/JobCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const CompanyJobsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [error, setError] = useState('');

  // Fetch company jobs
  const { data: jobs, isLoading, error: fetchError } = useQuery({
    queryKey: ['companyJobs'],
    queryFn: jobService.getCompanyJobs,
    enabled: !!user && user.role === 'company',
  });

  // Create job mutation
  const createMutation = useMutation({
    mutationFn: jobService.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] });
      setShowForm(false);
      setError('');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create job');
    },
  });

  // Update job mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Job> }) =>
      jobService.updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] });
      setEditingJob(null);
      setError('');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update job');
    },
  });

  // Delete job mutation
  const deleteMutation = useMutation({
    mutationFn: jobService.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] });
      setError('');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to delete job');
    },
  });

  const handleCreateJob = (data: any) => {
    createMutation.mutate(data);
  };

  const handleUpdateJob = (data: any) => {
    if (editingJob) {
      updateMutation.mutate({ id: editingJob._id, data });
    }
  };

  const handleDeleteJob = (jobId: string) => {
    if (confirm('Are you sure you want to delete this job?')) {
      deleteMutation.mutate(jobId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <DashboardLayout requiredRole="company">
            <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
            <p className="text-gray-600 mt-2">Create and manage your job postings</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Create New Job
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {fetchError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl mb-6">
            Error loading jobs. Please try again.
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
              />
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        <div className="grid gap-6">
          {jobs && jobs.length > 0 ? (
            jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                showActions={true}
                onEdit={setEditingJob}
                onDelete={handleDeleteJob}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No jobs yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first job posting to get started
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                >
                  Create First Job
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading States */}
        {(createMutation.isPending || updateMutation.isPending || deleteMutation.isPending) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6">
              <LoadingSpinner />
              <p className="text-gray-600 mt-2">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>

  );
};

export default CompanyJobsPage;