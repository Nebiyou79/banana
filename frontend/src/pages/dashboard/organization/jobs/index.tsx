/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/organization/jobs/index.tsx
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
import { colorClasses, colors } from '@/utils/color';
import { cn } from '@/lib/utils';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE   = 10;
const DEFAULT_PAGE = 1;

// ── Stat chip (replaces the raw inline divs) ─────────────────────────────────
interface ChipProps { value: number; label: string; colorHex: string; borderHex: string }
const StatChip: React.FC<ChipProps> = ({ value, label, colorHex, borderHex }) => (
  <div
    className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border text-center"
    style={{ borderColor: borderHex }}
  >
    <div className="text-xl sm:text-2xl font-bold mb-0.5" style={{ color: colorHex }}>{value}</div>
    <div className={`text-xs sm:text-sm ${colorClasses.text.muted}`}>{label}</div>
  </div>
);

const OrganizationJobsPage: React.FC = () => {
  const { user }       = useAuth();
  const router         = useRouter();
  const queryClient    = useQueryClient();

  const [currentPage,    setCurrentPage]    = useState(DEFAULT_PAGE);
  const [deleteModalOpen,setDeleteModalOpen] = useState(false);
  const [jobToDelete,    setJobToDelete]     = useState<string | null>(null);
  const [totalPages,     setTotalPages]      = useState(1);

  useEffect(() => {
    if (router.query.page) {
      const p = parseInt(router.query.page as string, 10);
      if (!isNaN(p) && p > 0) setCurrentPage(p);
    }
  }, [router.query.page]);

  const updatePageInURL = useCallback((page: number) => {
    router.push({ pathname: router.pathname, query: { ...router.query, page } }, undefined, { shallow: true });
  }, [router]);

  const { data: organizationProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['organizationProfile'],
    queryFn: () => profileService.getProfile(),
    enabled: !!user && user.role === 'organization',
  });

  const { data: jobsResponse, isLoading: jobsLoading } = useQuery({
    queryKey: ['organizationJobs', currentPage],
    queryFn: () => jobService.getOrganizationJobs({ page: currentPage, limit: PAGE_SIZE }),
    enabled: !!user && user.role === 'organization',
  });

  useEffect(() => {
    if (jobsResponse?.pagination?.totalPages) {
      setTotalPages(jobsResponse.pagination.totalPages);
      if (currentPage > jobsResponse.pagination.totalPages && jobsResponse.pagination.totalPages > 0) {
        const np = jobsResponse.pagination.totalPages;
        setCurrentPage(np);
        updatePageInURL(np);
      }
    }
  }, [jobsResponse, currentPage, updatePageInURL]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobService.deleteOrganizationJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationJobs'] });
      toast({ title: 'Opportunity deleted', description: 'Permanently removed.', variant: 'success' });
      if (jobsResponse?.data?.length === 1 && currentPage > 1) {
        const np = currentPage - 1;
        setCurrentPage(np);
        updatePageInURL(np);
      }
    },
    onError: (err: any) => toast({ title: 'Failed to delete', description: err.message || 'Please try again', variant: 'destructive' }),
    onSettled: () => { setDeleteModalOpen(false); setJobToDelete(null); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) => jobService.updateOrganizationJob(id, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['organizationJobs'] }); toast({ title: 'Status updated', variant: 'success' }); },
    onError: (err: any) => toast({ title: 'Failed to update status', description: err.message, variant: 'destructive' }),
  });

  const toggleApplyMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => jobService.updateOrganizationJob(id, { isApplyEnabled: enabled }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['organizationJobs'] }); toast({ title: 'Applications updated', variant: 'success' }); },
    onError: (err: any) => toast({ title: 'Failed to update applications', description: err.message, variant: 'destructive' }),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleDeleteClick     = (id: string) => { setJobToDelete(id); setDeleteModalOpen(true); };
  const handleConfirmDelete   = async () => { if (jobToDelete) await deleteMutation.mutateAsync(jobToDelete); };
  const handleCancelDelete    = () => { setDeleteModalOpen(false); setJobToDelete(null); };
  const handleToggleStatus    = async (id: string, s: JobStatus) => statusMutation.mutateAsync({ id, status: s });
  const handleToggleApply     = async (id: string, enabled: boolean) => toggleApplyMutation.mutateAsync({ id, enabled });
  const handleViewStats       = (id: string) => router.push(`/dashboard/organization/jobs/${id}`);
  const handleViewApplications= (id: string) => router.push(`/dashboard/organization/jobs/${id}/applications`);
  const handleEditJob         = (id: string) => router.push(`/dashboard/organization/jobs/edit/${id}`);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    updatePageInURL(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(2, currentPage - 1);
      const end   = Math.min(totalPages - 1, currentPage + 1);
      pages.push(1);
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const isLoading  = jobsLoading || profileLoading;
  const jobs       = jobsResponse?.data || [];
  const pagination = jobsResponse?.pagination || { current: currentPage, totalPages, totalResults: 0, resultsPerPage: PAGE_SIZE };

  const stats = {
    totalOpportunities:    pagination.totalResults || jobs.length,
    activeOpportunities:   jobs.filter((j: Job) => j.status === JobStatus.ACTIVE).length,
    draftOpportunities:    jobs.filter((j: Job) => j.status === JobStatus.DRAFT).length,
    pausedOpportunities:   jobs.filter((j: Job) => j.status === JobStatus.PAUSED).length,
    closedOpportunities:   jobs.filter((j: Job) => j.status === JobStatus.CLOSED).length,
    totalApplications:     jobs.reduce((s: number, j: Job) => s + (j.applicationCount || 0), 0),
    totalViews:            jobs.reduce((s: number, j: Job) => s + (j.viewCount          || 0), 0),
    volunteerOpportunities:  jobs.filter((j: Job) => j.opportunityType === 'volunteer').length,
    internshipOpportunities: jobs.filter((j: Job) => j.opportunityType === 'internship').length,
    fellowshipOpportunities: jobs.filter((j: Job) => j.opportunityType === 'fellowship').length,
    trainingOpportunities:   jobs.filter((j: Job) => j.opportunityType === 'training').length,
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
      <div className={cn('min-h-screen', colorClasses.bg.secondary)}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

          {/* ── HEADER ──────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
            <div className="min-w-0">
              <h1 className={`text-2xl sm:text-3xl font-bold ${colorClasses.text.primary}`}>
                Opportunity Management
              </h1>
              <p className={`text-sm sm:text-base ${colorClasses.text.muted} mt-1`}>
                Create and manage your volunteer positions, internships, and opportunities
                {pagination.totalResults > 0 && (
                  <span className="ml-2 font-medium">({pagination.totalResults} total)</span>
                )}
              </p>
            </div>
            <Link
              href="/dashboard/organization/jobs/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-sm font-semibold text-white whitespace-nowrap self-start sm:self-auto shrink-0"
              style={{ background: 'linear-gradient(135deg, #0F766E 0%, #059669 100%)' }}
            >
              <Plus className="w-4 h-4" />
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">Create New Opportunity</span>
            </Link>
          </div>

          {/* ── STATS ───────────────────────────────────────────────────── */}
          {stats.totalOpportunities > 0 && (
            <>
              {/* Main row — 2 cols on mobile, 4 on md */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <StatChip value={stats.totalOpportunities}    label="Total"        colorHex={colors.purple}  borderHex="#e9d5ff" />
                <StatChip value={stats.activeOpportunities}   label="Active"       colorHex={colors.green}   borderHex="#bbf7d0" />
                <StatChip value={stats.volunteerOpportunities}label="Volunteer"    colorHex={colors.amber}   borderHex="#fde68a" />
                <StatChip value={stats.totalApplications}     label="Applications" colorHex={colors.blue}    borderHex="#bfdbfe" />
              </div>

              {/* Secondary row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
                <StatChip value={stats.internshipOpportunities} label="Internships" colorHex={colors.orange}  borderHex="#fed7aa" />
                <StatChip value={stats.draftOpportunities}      label="Drafts"      colorHex={colors.teal}    borderHex="#99f6e4" />
                <StatChip value={stats.fellowshipOpportunities} label="Fellowships" colorHex={colors.rose}    borderHex="#fecdd3" />
                <StatChip value={stats.trainingOpportunities}   label="Training"    colorHex={colors.teal700} borderHex="#ccfbf1" />
              </div>
            </>
          )}

          {/* ── JOB CARDS ───────────────────────────────────────────────── */}
          <div className="grid gap-4">
            {jobs.length > 0 ? (
              jobs.map((job: Job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  ownerProfile={organizationProfile}
                  showActions
                  onEdit={handleEditJob}
                  onDelete={handleDeleteClick}
                  onViewStats={handleViewStats}
                  onViewApplications={handleViewApplications}
                  onToggleStatus={handleToggleStatus}
                  isOrganizationView
                />
              ))
            ) : (
              <div className={cn('rounded-2xl p-6 sm:p-10 text-center border shadow-sm', colorClasses.bg.primary, colorClasses.border.secondary)}>
                <div className="text-5xl sm:text-6xl mb-4">🌟</div>
                <h3 className={`text-lg sm:text-xl font-semibold ${colorClasses.text.primary} mb-2`}>
                  No opportunities yet
                </h3>
                <p className={`text-sm ${colorClasses.text.muted} mb-5`}>
                  Create your first opportunity to attract volunteers, interns, or staff
                </p>
                <Link
                  href="/dashboard/organization/jobs/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #0F766E 0%, #059669 100%)' }}
                >
                  <Plus className="w-4 h-4" /> Create First Opportunity
                </Link>
              </div>
            )}
          </div>

          {/* ── PAGINATION ──────────────────────────────────────────────── */}
          {pagination.totalPages > 1 && (
            <div className={cn(
              'flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 sm:mt-8 pt-5',
              'border-t', colorClasses.border.secondary,
            )}>
              <p className={`text-sm ${colorClasses.text.muted}`}>
                Showing {jobs.length} of {pagination.totalResults} · Page {pagination.current} of {pagination.totalPages}
              </p>

              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || statusMutation.isPending}
                  className={cn(
                    'p-2 rounded-lg border transition-colors',
                    currentPage === 1
                      ? `${colorClasses.border.secondary} ${colorClasses.text.muted} cursor-not-allowed opacity-50`
                      : `${colorClasses.border.primary} ${colorClasses.text.secondary} hover:${colorClasses.bg.secondary}`,
                  )}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, idx) =>
                    page === '...' ? (
                      <span key={`el-${idx}`} className={`px-2 py-1 text-sm ${colorClasses.text.muted}`}>…</span>
                    ) : (
                      <button
                        key={`pg-${page}`}
                        onClick={() => handlePageChange(page as number)}
                        disabled={currentPage === page}
                        className={cn(
                          'min-w-[32px] px-2 sm:px-3 py-1 rounded-lg border text-sm font-medium transition-colors',
                          currentPage === page
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : `${colorClasses.border.primary} ${colorClasses.text.secondary} hover:${colorClasses.bg.secondary}`,
                        )}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                {/* Next */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || statusMutation.isPending}
                  className={cn(
                    'p-2 rounded-lg border transition-colors',
                    currentPage === totalPages
                      ? `${colorClasses.border.secondary} ${colorClasses.text.muted} cursor-not-allowed opacity-50`
                      : `${colorClasses.border.primary} ${colorClasses.text.secondary} hover:${colorClasses.bg.secondary}`,
                  )}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete modal ──────────────────────────────────────────────────── */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Opportunity"
        message="This action cannot be undone and all associated data will be permanently removed."
        confirmText="Delete Opportunity"
        cancelText="Keep Opportunity"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* ── Global loading overlay ────────────────────────────────────────── */}
      {(deleteMutation.isPending || statusMutation.isPending || toggleApplyMutation.isPending) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={cn('rounded-xl p-5 flex items-center gap-3 shadow-xl', colorClasses.bg.primary)}>
            <LoadingSpinner />
            <p className={colorClasses.text.secondary}>Processing…</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default OrganizationJobsPage;