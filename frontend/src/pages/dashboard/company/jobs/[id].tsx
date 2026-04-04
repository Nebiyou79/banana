/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, JobStatus } from '@/services/jobService';
import { applicationService } from '@/services/applicationService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import JobOwnerHeader from '@/components/job/JobOwnerHeader';
import JobOwnerDetails from '@/components/job/JobOwnerDetails';
import { toast } from '@/hooks/use-toast';
import { profileService } from '@/services/profileService';
import {
  AlertCircle,
  ChevronLeft,
  Download,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getTheme } from '@/utils/color';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';

const CompanyJobDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const theme = getTheme('light');

  // State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  // Fetch job details
  const { data: job, isLoading, error: fetchError } = useQuery({
    queryKey: ['companyJob', id],
    queryFn: async () => {
      const jobData = await jobService.getJob(id as string);
      return jobService.processJobResponse(jobData);
    },
    enabled: !!id && !!user,
  });

  // Fetch company profile
  const {
    data: companyProfile,
    isLoading: profileLoading
  } = useQuery({
    queryKey: ['companyProfile'],
    queryFn: () => profileService.getProfile(),
    enabled: !!user && user.role === 'company',
  });

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      if (!id) return;
      setApplicationsLoading(true);
      try {
        const response = await applicationService.getJobApplications(id as string, {
          limit: 50,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
        setApplications(response.data || []);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setApplicationsLoading(false);
      }
    };

    if (id && job) {
      fetchApplications();
    }
  }, [id, job]);

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) =>
      jobService.updateJob(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyJob', id] });
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] });
      toast({ title: 'Status Updated', description: 'Job status has been changed successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Update Failed', description: error.message || 'Please try again', variant: 'destructive' });
    },
  });

  // Toggle applications mutation
  const toggleApplyMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      jobService.updateJob(id, { isApplyEnabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyJob', id] });
      toast({ title: 'Applications Updated', description: 'Application settings have been changed' });
    },
    onError: (error: any) => {
      toast({ title: 'Update Failed', description: error.message || 'Please try again', variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobService.deleteJob(id),
    onSuccess: () => {
      toast({ title: 'Job Deleted', description: 'The job has been permanently deleted' });
      router.push('/dashboard/company/jobs');
    },
    onError: (error: any) => {
      toast({ title: 'Delete Failed', description: error.message || 'Please try again', variant: 'destructive' });
    },
    onSettled: () => setDeleteModalOpen(false),
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => {
      router.push(`/dashboard/company/jobs/create?duplicate=${id}`);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({ title: 'Job Duplicated', description: 'Creating a copy of this job...' });
    },
  });

  // Handlers
  const handleStatusChange = async (status: JobStatus) => {
    if (id && job) await statusMutation.mutateAsync({ id: id as string, status });
  };

  const handleToggleApply = async (enabled: boolean) => {
    if (id && job) await toggleApplyMutation.mutateAsync({ id: id as string, enabled });
  };

  const handleViewApplications = () => {
    if (id) router.push(`/dashboard/company/jobs/${id}/applications`);
  };

  const handleViewApplication = (applicationId: string) => {
    if (applicationId === 'all') handleViewApplications();
    else router.push(`/dashboard/company/applications/${applicationId}`);
  };

  const handleEditJob = () => {
    if (job) router.push(`/dashboard/company/jobs/edit/${job._id}`);
  };

  const handleShareJob = async () => {
    if (job) {
      const jobUrl = `${window.location.origin}/jobs/${job._id}`;
      try {
        await navigator.clipboard.writeText(jobUrl);
        toast({ title: 'Link Copied!', description: 'Job link has been copied to clipboard' });
      } catch (error) {
        toast({ title: 'Copy Failed', description: 'Please copy the URL manually', variant: 'destructive' });
      }
    }
  };

  const handleDuplicateJob = async () => {
    if (job) await duplicateMutation.mutateAsync(job._id);
  };

  const handleDeleteClick = () => setDeleteModalOpen(true);
  const handleConfirmDelete = async () => {
    if (job) await deleteMutation.mutateAsync(job._id);
  };

  const handleExportData = () => {
    if (job && applications) {
      const exportData = { job, applications, exportedAt: new Date().toISOString() };
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', `job-${job._id}-${new Date().toISOString().split('T')[0]}.json`);
      link.click();
      toast({ title: 'Export Complete', description: 'Job data has been exported successfully' });
    }
  };

  const handleViewStats = () => {
    if (job) router.push(`/dashboard/company/jobs/${job._id}/analytics`);
  };

  // Loading state
  if (isLoading || profileLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg.primary }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <LoadingSpinner size="lg" />
            <p className="mt-4" style={{ color: theme.text.secondary }}>Loading job details...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (fetchError || !job) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.bg.primary }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.text.error}15` }}>
              <AlertCircle className="w-10 h-10" style={{ color: theme.text.error }} />
            </div>
            <h2 className="text-2xl font-semibold mb-2" style={{ color: theme.text.primary }}>Job Not Found</h2>
            <p className="mb-6" style={{ color: theme.text.secondary }}>
              The job you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <div className="space-y-3">
              <Link href="/dashboard/company/jobs" className="block w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Back to Jobs</Button>
              </Link>
              <Link href="/dashboard/company/jobs/create" className="block w-full">
                <Button variant="outline" className="w-full">Create New Job</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const accentColor = job.jobType === 'organization' ? '#8B5CF6' : '#10B981';

  return (
    <DashboardLayout requiredRole="company">
      <div style={{ backgroundColor: theme.bg.primary }} className="min-h-screen">
        {/* Back Navigation */}
        <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: theme.bg.primary, borderColor: theme.border.secondary }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <Link href="/dashboard/company/jobs" className="inline-flex items-center gap-2 transition-colors group" style={{ color: theme.text.secondary }}>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Jobs</span>
              </Link>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleShareJob} className="gap-2">
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.open(`/jobs/${job._id}`, '_blank')} className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleExportData} className="gap-2">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Job Owner Header */}
        <JobOwnerHeader
          job={job}
          role="company"
          ownerProfile={companyProfile}
          onEdit={handleEditJob}
          onDelete={handleDeleteClick}
          onStatusChange={handleStatusChange}
          onViewApplications={handleViewApplications}
          onViewStats={handleViewStats}
          onDuplicate={handleDuplicateJob}
          onToggleApply={handleToggleApply}
          onShare={handleShareJob}
          showMetrics={true}
          isDeleting={deleteMutation.isPending}
          isUpdating={statusMutation.isPending || toggleApplyMutation.isPending}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <JobOwnerDetails
            job={job}
            role="company"
            ownerProfile={companyProfile}
            onEdit={handleEditJob}
            onDelete={handleDeleteClick}
            onStatusChange={handleStatusChange}
            onViewApplications={handleViewApplications}
            onViewApplication={handleViewApplication}
            onToggleApply={handleToggleApply}
            onShare={handleShareJob}
            onExportData={handleExportData}
            applications={applications}
            isLoadingApplications={applicationsLoading}
            isDeleting={deleteMutation.isPending}
            isUpdating={statusMutation.isPending || toggleApplyMutation.isPending}
          />
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Job"
          message={`Are you sure you want to delete "${job.title}"? This action cannot be undone and all associated applications will be permanently removed.`}
          confirmText="Delete Job"
          cancelText="Cancel"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />

        {/* Loading Overlay */}
        <AnimatePresence>
          {(deleteMutation.isPending || statusMutation.isPending || toggleApplyMutation.isPending) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="rounded-xl p-6 flex items-center gap-3 shadow-xl"
                style={{ backgroundColor: theme.bg.primary }}
              >
                <LoadingSpinner />
                <p style={{ color: theme.text.secondary }}>
                  {deleteMutation.isPending ? 'Deleting...' : statusMutation.isPending ? 'Updating status...' : 'Updating...'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default CompanyJobDetailPage;