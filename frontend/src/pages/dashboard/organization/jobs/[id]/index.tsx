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
  Users,
  FileText,
  ArrowRight,
  Trash2,
  Heart,
  Users2,
  Building,
  AlertCircle,
  ChevronLeft,
  Download,
  Share2,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getTheme } from '@/utils/color';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';

const OrganizationJobDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const theme = getTheme('light');

  // State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  // Fetch opportunity details
  const { data: job, isLoading, error: fetchError } = useQuery({
    queryKey: ['organizationJob', id],
    queryFn: async () => {
      const jobData = await jobService.getJob(id as string);
      return jobService.processJobResponse(jobData);
    },
    enabled: !!id && !!user,
  });

  // Fetch organization profile
  const {
    data: organizationProfile,
    isLoading: profileLoading
  } = useQuery({
    queryKey: ['organizationProfile'],
    queryFn: () => profileService.getProfile(),
    enabled: !!user && user.role === 'organization',
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
      jobService.updateOrganizationJob(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationJob', id] });
      queryClient.invalidateQueries({ queryKey: ['organizationJobs'] });
      toast({ title: 'Status Updated', description: 'Opportunity status has been changed successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Update Failed', description: error.message || 'Please try again', variant: 'destructive' });
    },
  });

  // Toggle applications mutation
  const toggleApplyMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      jobService.updateOrganizationJob(id, { isApplyEnabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationJob', id] });
      toast({ title: 'Applications Updated', description: 'Application settings have been changed' });
    },
    onError: (error: any) => {
      toast({ title: 'Update Failed', description: error.message || 'Please try again', variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobService.deleteOrganizationJob(id),
    onSuccess: () => {
      toast({ title: 'Opportunity Deleted', description: 'The opportunity has been permanently deleted' });
      router.push('/dashboard/organization/jobs');
    },
    onError: (error: any) => {
      toast({ title: 'Delete Failed', description: error.message || 'Please try again', variant: 'destructive' });
    },
    onSettled: () => setDeleteModalOpen(false),
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => {
      router.push(`/dashboard/organization/jobs/create?duplicate=${id}`);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({ title: 'Opportunity Duplicated', description: 'Creating a copy of this opportunity...' });
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
    if (id) router.push(`/dashboard/organization/jobs/${id}/applications`);
  };

  const handleViewApplication = (applicationId: string) => {
    if (applicationId === 'all') handleViewApplications();
    else router.push(`/dashboard/organization/applications/${applicationId}`);
  };

  const handleEditOpportunity = () => {
    if (job) router.push(`/dashboard/organization/jobs/edit/${job._id}`);
  };

  const handleShareOpportunity = async () => {
    if (job) {
      const opportunityUrl = `${window.location.origin}/opportunities/${job._id}`;
      try {
        await navigator.clipboard.writeText(opportunityUrl);
        toast({ title: 'Link Copied!', description: 'Opportunity link has been copied to clipboard' });
      } catch (error) {
        toast({ title: 'Copy Failed', description: 'Please copy the URL manually', variant: 'destructive' });
      }
    }
  };

  const handleDuplicateOpportunity = async () => {
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
      link.setAttribute('download', `opportunity-${job._id}-${new Date().toISOString().split('T')[0]}.json`);
      link.click();
      toast({ title: 'Export Complete', description: 'Opportunity data has been exported successfully' });
    }
  };

  const handleViewStats = () => {
    if (job) router.push(`/dashboard/organization/jobs/${job._id}/analytics`);
  };

  // Check if this is a volunteer opportunity
  const isVolunteerOpportunity = job?.opportunityType === 'volunteer';

  // Get commitment level label
  const getCommitmentLevelLabel = (level?: string) => {
    switch (level) {
      case 'casual': return 'Casual (1-10 hours/week)';
      case 'regular': return 'Regular (10-25 hours/week)';
      case 'intensive': return 'Intensive (25+ hours/week)';
      default: return level;
    }
  };

  // Loading state
  if (isLoading || profileLoading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg.primary }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <LoadingSpinner size="lg" />
            <p className="mt-4" style={{ color: theme.text.secondary }}>Loading opportunity details...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (fetchError || !job) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.bg.primary }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.text.error}15` }}>
              <AlertCircle className="w-10 h-10" style={{ color: theme.text.error }} />
            </div>
            <h2 className="text-2xl font-semibold mb-2" style={{ color: theme.text.primary }}>Opportunity Not Found</h2>
            <p className="mb-6" style={{ color: theme.text.secondary }}>
              The opportunity you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <div className="space-y-3">
              <Link href="/dashboard/organization/jobs" className="block w-full">
                <Button className="w-full" style={{ backgroundColor: '#10B981', color: 'white' }}>Back to Opportunities</Button>
              </Link>
              <Link href="/dashboard/organization/jobs/create" className="block w-full">
                <Button variant="outline" className="w-full">Create New Opportunity</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const accentColor = '#10B981'; // Organization accent color

  return (
    <DashboardLayout requiredRole="organization">
      <div style={{ backgroundColor: theme.bg.primary }} className="min-h-screen">
        {/* Back Navigation */}
        <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: theme.bg.primary, borderColor: theme.border.secondary }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <Link href="/dashboard/organization/jobs" className="inline-flex items-center gap-2 transition-colors group" style={{ color: theme.text.secondary }}>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Opportunities</span>
              </Link>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleShareOpportunity} className="gap-2">
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.open(`/opportunities/${job._id}`, '_blank')} className="gap-2">
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
          role="organization"
          ownerProfile={organizationProfile}
          onEdit={handleEditOpportunity}
          onDelete={handleDeleteClick}
          onStatusChange={handleStatusChange}
          onViewApplications={handleViewApplications}
          onViewStats={handleViewStats}
          onDuplicate={handleDuplicateOpportunity}
          onToggleApply={handleToggleApply}
          onShare={handleShareOpportunity}
          showMetrics={true}
          isDeleting={deleteMutation.isPending}
          isUpdating={statusMutation.isPending || toggleApplyMutation.isPending}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <JobOwnerDetails
            job={job}
            role="organization"
            ownerProfile={organizationProfile}
            onEdit={handleEditOpportunity}
            onDelete={handleDeleteClick}
            onStatusChange={handleStatusChange}
            onViewApplications={handleViewApplications}
            onViewApplication={handleViewApplication}
            onToggleApply={handleToggleApply}
            onShare={handleShareOpportunity}
            onExportData={handleExportData}
            applications={applications}
            isLoadingApplications={applicationsLoading}
            isDeleting={deleteMutation.isPending}
            isUpdating={statusMutation.isPending || toggleApplyMutation.isPending}
          />

          {/* Volunteer Specific Information */}
          {isVolunteerOpportunity && job.volunteerInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="py-4 px-6 border-b" style={{ borderColor: theme.border.secondary }}>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="w-4 h-4" style={{ color: '#10B981' }} />
                    Volunteer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {job.volunteerInfo.hoursPerWeek && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#10B98115' }}>
                          <Clock className="w-4 h-4" style={{ color: '#10B981' }} />
                        </div>
                        <div>
                          <p className="text-xs font-medium" style={{ color: theme.text.muted }}>Hours Per Week</p>
                          <p className="text-sm font-medium" style={{ color: theme.text.primary }}>{job.volunteerInfo.hoursPerWeek} hours</p>
                        </div>
                      </div>
                    )}
                    {job.volunteerInfo.commitmentLevel && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#10B98115' }}>
                          <Briefcase className="w-4 h-4" style={{ color: '#10B981' }} />
                        </div>
                        <div>
                          <p className="text-xs font-medium" style={{ color: theme.text.muted }}>Commitment Level</p>
                          <p className="text-sm font-medium" style={{ color: theme.text.primary }}>{getCommitmentLevelLabel(job.volunteerInfo.commitmentLevel)}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3 md:col-span-2">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: '#10B98115' }}>
                        <Heart className="w-4 h-4" style={{ color: '#10B981' }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: theme.text.muted }}>Support Provided</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {job.volunteerInfo.providesAccommodation && (
                            <Badge className="px-2 py-1 text-xs" style={{ backgroundColor: '#10B98115', color: '#10B981' }}>
                              Accommodation
                            </Badge>
                          )}
                          {job.volunteerInfo.providesStipend && (
                            <Badge className="px-2 py-1 text-xs" style={{ backgroundColor: '#10B98115', color: '#10B981' }}>
                              Stipend
                            </Badge>
                          )}
                          {!job.volunteerInfo.providesAccommodation && !job.volunteerInfo.providesStipend && (
                            <span className="text-xs" style={{ color: theme.text.muted }}>Volunteers provide their own support</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Duration Information */}
          {!isVolunteerOpportunity && job.duration && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="py-4 px-6 border-b" style={{ borderColor: theme.border.secondary }}>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: '#10B981' }} />
                    Duration Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#10B98115' }}>
                      {job.duration.isOngoing ? (
                        <span className="text-lg">∞</span>
                      ) : (
                        <Calendar className="w-4 h-4" style={{ color: '#10B981' }} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                        {job.duration.isOngoing ? 'Ongoing Opportunity' : `Fixed Term: ${job.duration.value} ${job.duration.unit}`}
                      </p>
                      <p className="text-xs mt-1" style={{ color: theme.text.muted }}>
                        {job.duration.isOngoing
                          ? 'This is an ongoing opportunity with no fixed end date'
                          : 'This opportunity has a specific duration'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Organization Profile Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 border-b" style={{ borderColor: theme.border.secondary }}>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="w-4 h-4" style={{ color: '#10B981' }} />
                  Organization Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {job.organization?.logoUrl && (
                    <img
                      src={job.organization.logoUrl}
                      alt={job.organization.name}
                      className="w-12 h-12 rounded-lg object-cover border"
                      style={{ borderColor: theme.border.secondary }}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold" style={{ color: theme.text.primary }}>{job.organization?.name}</h3>
                    {job.organization?.organizationType && (
                      <p className="text-sm mt-1" style={{ color: theme.text.secondary }}>{job.organization.organizationType}</p>
                    )}
                    {job.organization?.verified && (
                      <Badge className="mt-2 px-2 py-1 text-xs" style={{ backgroundColor: '#10B98115', color: '#10B981' }}>
                        ✓ Verified Organization
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Opportunity"
          message={`Are you sure you want to delete "${job.title}"? This action cannot be undone and all associated applications will be permanently removed.`}
          confirmText="Delete Opportunity"
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

export default OrganizationJobDetailPage;