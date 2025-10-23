/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/organization/jobs/index.tsx - UPDATED WITH MODAL
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, Job } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import JobCard from '@/components/job/JobCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from '@/hooks/use-toast';
import {  Plus } from 'lucide-react';
import Link from 'next/link';

const OrganizationJobsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  // Fetch organization opportunities
  const { 
    data: jobsData, 
    isLoading, 
    error: fetchError 
  } = useQuery({
    queryKey: ['organizationJobs'],
    queryFn: () => jobService.getOrganizationJobs(),
    enabled: !!user && user.role === 'organization',
  });

  // Delete opportunity mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobService.deleteOrganizationJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationJobs'] });
      toast({
        title: 'Opportunity deleted successfully',
        description: 'The opportunity has been permanently removed',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete opportunity',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setDeleteModalOpen(false);
      setJobToDelete(null);
    },
  });

  // Status toggle mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { 
      id: string; 
      status: "draft" | "active" | "paused" | "closed" | "archived"; 
    }) =>
      jobService.updateOrganizationJob(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationJobs'] });
      toast({
        title: 'Status updated',
        description: 'Opportunity status has been changed',
        variant: 'success',
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

  const handleDeleteClick = (jobId: string) => {
    setJobToDelete(jobId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (jobToDelete) {
      await deleteMutation.mutateAsync(jobToDelete);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setJobToDelete(null);
  };

  const handleToggleStatus = async (
    jobId: string,
    newStatus: "draft" | "active" | "paused" | "closed" | "archived"
  ) => {
    await statusMutation.mutateAsync({ id: jobId, status: newStatus });
  };

  const handleViewStats = (jobId: string) => {
    // Navigate to opportunity stats page or open stats modal
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

  // Calculate stats from opportunities data
  const stats = {
    totalOpportunities: jobs.length,
    activeOpportunities: jobs.filter((job: Job) => job.status === 'active').length,
    draftOpportunities: jobs.filter((job: Job) => job.status === 'draft').length,
    totalApplications: jobs.reduce((sum: number, job: Job) => sum + (job.applicationCount || 0), 0),
    totalViews: jobs.reduce((sum: number, job: Job) => sum + (job.viewCount || 0), 0),
    volunteerOpportunities: jobs.filter((job: Job) => job.opportunityType === 'volunteer').length,
    internshipOpportunities: jobs.filter((job: Job) => job.opportunityType === 'internship').length,
  };

  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Opportunity Management</h1>
              <p className="text-gray-600 mt-2">Create and manage your volunteer positions, internships, and job opportunities</p>
            </div>
            <Link
              href="/dashboard/organization/jobs/create"
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Opportunity
            </Link>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-200 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{stats.totalOpportunities || 0}</div>
                <div className="text-gray-600">Total Opportunities</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-200 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.activeOpportunities || 0}</div>
                <div className="text-gray-600">Active Opportunities</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-yellow-200 text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.volunteerOpportunities || 0}</div>
                <div className="text-gray-600">Volunteer Positions</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-200 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalApplications || 0}</div>
                <div className="text-gray-600">Total Applications</div>
              </div>
            </div>
          )}

          {/* Additional Stats Row */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-200 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">{stats.internshipOpportunities || 0}</div>
                <div className="text-gray-600">Internships</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-cyan-200 text-center">
                <div className="text-2xl font-bold text-cyan-600 mb-2">{stats.draftOpportunities || 0}</div>
                <div className="text-gray-600">Draft Opportunities</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 text-center">
                <div className="text-2xl font-bold text-gray-600 mb-2">{stats.totalViews || 0}</div>
                <div className="text-gray-600">Total Views</div>
              </div>
            </div>
          )}

          {/* Opportunities Grid */}
          <div className="grid gap-6">
            {jobs && jobs.length > 0 ? (
              jobs.map((job: Job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  showActions={true}
                  onDelete={handleDeleteClick}
                  onViewStats={handleViewStats}
                  onToggleStatus={handleToggleStatus}
                  isOrganizationView={true}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-200">
                  <div className="text-6xl mb-4">🌟</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No opportunities yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first opportunity to attract volunteers, interns, or staff
                  </p>
                  <Link
                    href="/dashboard/organization/jobs/create"
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center gap-2 mx-auto w-fit"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Opportunity
                  </Link>
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

          {/* Delete Confirmation Modal */}
          <ConfirmationModal
            isOpen={deleteModalOpen}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            title="Delete Opportunity"
            message="Are you sure you want to delete this opportunity? This action cannot be undone and all associated data will be permanently removed."
            confirmText="Delete Opportunity"
            cancelText="Keep Opportunity"
            variant="danger"
            isLoading={deleteMutation.isPending}
          />

          {/* Loading States */}
          {(statusMutation.isPending) && (
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