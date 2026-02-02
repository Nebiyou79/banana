/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/organization/jobs/index.tsx - REFACTORED WITH FIXED PAGINATION
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, Job, JobStatus } from '@/services/jobService';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import JobCard from '@/components/job/JobCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from '@/hooks/use-toast';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Pagination configuration (same as company page for consistency)
const PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

const OrganizationJobsPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // State management
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  // Get page from URL query params on initial load
  useEffect(() => {
    if (router.query.page) {
      const page = parseInt(router.query.page as string, 10);
      if (!isNaN(page) && page > 0) {
        setCurrentPage(page);
      }
    }
  }, [router.query.page]);

  // Update URL when page changes
  const updatePageInURL = useCallback((page: number) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page }
    }, undefined, { shallow: true });
  }, [router]);

  // Fetch current organization's profile
  const {
    data: organizationProfile,
    isLoading: profileLoading
  } = useQuery({
    queryKey: ['organizationProfile'],
    queryFn: () => profileService.getProfile(),
    enabled: !!user && user.role === 'organization',
  });

  // Fetch organization opportunities with pagination
  const {
    data: jobsResponse,
    isLoading: jobsLoading,
    error: fetchError,
    refetch: refetchJobs
  } = useQuery({
    queryKey: ['organizationJobs', currentPage],
    queryFn: () => jobService.getOrganizationJobs({
      page: currentPage,
      limit: PAGE_SIZE
    }),
    enabled: !!user && user.role === 'organization',
  });

  // Update total pages when data changes
  useEffect(() => {
    if (jobsResponse?.pagination?.totalPages) {
      setTotalPages(jobsResponse.pagination.totalPages);

      // If current page exceeds total pages, reset to last page
      if (currentPage > jobsResponse.pagination.totalPages && jobsResponse.pagination.totalPages > 0) {
        const newPage = jobsResponse.pagination.totalPages;
        setCurrentPage(newPage);
        updatePageInURL(newPage);
      }
    }
  }, [jobsResponse, currentPage, updatePageInURL]);

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

      // After deletion, if we're on a page that might now be empty, go back one page
      if (jobsResponse?.data && jobsResponse.data.length === 1 && currentPage > 1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        updatePageInURL(newPage);
      }
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
      status: JobStatus;
    }) => jobService.updateOrganizationJob(id, { status }),
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

  // Toggle application enable/disable mutation
  const toggleApplyMutation = useMutation({
    mutationFn: ({ id, enabled }: {
      id: string;
      enabled: boolean;
    }) => jobService.updateOrganizationJob(id, { isApplyEnabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationJobs'] });
      toast({
        title: 'Applications updated',
        description: 'Application status has been changed',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update applications',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Handler functions
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

  const handleToggleStatus = async (jobId: string, newStatus: JobStatus) => {
    await statusMutation.mutateAsync({ id: jobId, status: newStatus });
  };

  const handleToggleApply = async (jobId: string, enabled: boolean) => {
    await toggleApplyMutation.mutateAsync({ id: jobId, enabled });
  };

  const handleViewStats = (jobId: string) => {
    router.push(`/dashboard/organization/jobs/${jobId}`);
  };

  const handleViewApplications = (jobId: string) => {
    router.push(`/dashboard/organization/jobs/${jobId}/applications`);
  };

  const handleEditJob = (jobId: string) => {
    router.push(`/dashboard/organization/jobs/edit/${jobId}`);
  };

  // Pagination handlers (same logic as company page)
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    setCurrentPage(page);
    updatePageInURL(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  // Generate page numbers for pagination display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      pages.push(1);

      if (startPage > 2) {
        pages.push('...');
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const isLoading = jobsLoading || profileLoading;
  const jobs = jobsResponse?.data || [];
  const pagination = jobsResponse?.pagination || {
    current: currentPage,
    totalPages: totalPages,
    totalResults: 0,
    resultsPerPage: PAGE_SIZE
  };

  // Calculate stats from opportunities data
  const stats = {
    totalOpportunities: pagination.totalResults || jobs.length,
    activeOpportunities: jobs.filter((job: Job) => job.status === JobStatus.ACTIVE).length,
    draftOpportunities: jobs.filter((job: Job) => job.status === JobStatus.DRAFT).length,
    pausedOpportunities: jobs.filter((job: Job) => job.status === JobStatus.PAUSED).length,
    closedOpportunities: jobs.filter((job: Job) => job.status === JobStatus.CLOSED).length,
    totalApplications: jobs.reduce((sum: number, job: Job) => sum + (job.applicationCount || 0), 0),
    totalViews: jobs.reduce((sum: number, job: Job) => sum + (job.viewCount || 0), 0),
    volunteerOpportunities: jobs.filter((job: Job) => job.opportunityType === 'volunteer').length,
    internshipOpportunities: jobs.filter((job: Job) => job.opportunityType === 'internship').length,
    fellowshipOpportunities: jobs.filter((job: Job) => job.opportunityType === 'fellowship').length,
    trainingOpportunities: jobs.filter((job: Job) => job.opportunityType === 'training').length,
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

  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Opportunity Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create and manage your volunteer positions, internships, and job opportunities
                {pagination.totalResults > 0 && (
                  <span className="ml-2 text-sm font-medium">
                    ({pagination.totalResults} total opportunities)
                  </span>
                )}
              </p>
            </div>
            <Link
              href="/dashboard/organization/jobs/create"
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Opportunity
            </Link>
          </div>

          {/* Stats Overview - Main Row */}
          {stats.totalOpportunities > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-purple-200 dark:border-purple-800 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {stats.totalOpportunities || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Opportunities</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-green-200 dark:border-green-800 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {stats.activeOpportunities || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-yellow-200 dark:border-yellow-800 text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                    {stats.volunteerOpportunities || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Volunteer</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-blue-200 dark:border-blue-800 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {stats.totalApplications || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Applications</div>
                </div>
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-orange-200 dark:border-orange-800 text-center">
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                    {stats.internshipOpportunities || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Internships</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-cyan-200 dark:border-cyan-800 text-center">
                  <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mb-1">
                    {stats.draftOpportunities || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Drafts</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-pink-200 dark:border-pink-800 text-center">
                  <div className="text-xl font-bold text-pink-600 dark:text-pink-400 mb-1">
                    {stats.fellowshipOpportunities || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Fellowships</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-teal-200 dark:border-teal-800 text-center">
                  <div className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-1">
                    {stats.trainingOpportunities || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Training</div>
                </div>
              </div>
            </>
          )}

          {/* Opportunities Grid */}
          <div className="grid gap-6">
            {jobs.length > 0 ? (
              jobs.map((job: Job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  ownerProfile={organizationProfile}
                  showActions={true}
                  onEdit={handleEditJob}
                  onDelete={handleDeleteClick}
                  onViewStats={handleViewStats}
                  onViewApplications={handleViewApplications}
                  onToggleStatus={handleToggleStatus}
                  isOrganizationView={true}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-6xl mb-4">🌟</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No opportunities yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
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

          {/* Pagination - Fixed Implementation */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {jobs.length} of {pagination.totalResults} opportunities
                {pagination.resultsPerPage && (
                  <span className="ml-2">
                    (Page {pagination.current} of {pagination.totalPages})
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* Previous Page Button */}
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || statusMutation.isPending}
                  className={`p-2 rounded-lg border ${currentPage === 1
                      ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-3 py-1 text-gray-500 dark:text-gray-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-${page}`}
                        onClick={() => handlePageChange(page as number)}
                        className={`px-3 py-1 rounded-lg border text-sm font-medium transition-colors ${currentPage === page
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        disabled={currentPage === page}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                {/* Next Page Button */}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || statusMutation.isPending}
                  className={`p-2 rounded-lg border ${currentPage === totalPages
                      ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <ChevronRight className="w-5 h-5" />
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

          {/* Loading Overlay */}
          {(deleteMutation.isPending || statusMutation.isPending || toggleApplyMutation.isPending) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center space-x-3">
                <LoadingSpinner />
                <p className="text-gray-600 dark:text-gray-400">Processing...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationJobsPage;