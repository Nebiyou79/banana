/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/applications/[id].tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '@/services/applicationService';
import { CompanyApplicationDetails } from '@/components/applications/CompanyApplicationDetails';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Dialog } from '@/components/ui/Dialog';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useToast } from '@/hooks/use-toast';
import { colorClasses } from '@/utils/color';
import { motion, Variants } from 'framer-motion';
import {
  ArrowLeft,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Briefcase,
  Share2,
  Printer,
  MoreVertical,
  AlertCircle,
  Award,
  Clock,
  Sparkles,
  Shield,
  Download,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const CompanyApplicationDetailPage: React.FC = () => {
  const router = useRouter();
  const { id: applicationId } = router.query;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const {
    data: applicationData,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['company-application', applicationId],
    queryFn: async () => {
      if (!applicationId) throw new Error('Application ID is required');
      const response = await applicationService.getCompanyApplicationDetails(applicationId as string);
      return response.data.application;
    },
    enabled: !!applicationId,
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  const handleBack = () => {
    router.push('/dashboard/company/applications');
  };

  const handleRefresh = () => {
    refetch();
    toast({ title: 'Refreshed', description: 'Application data has been updated' });
  };

  const handleStatusUpdate = (updatedApplication: any) => {
    queryClient.setQueryData(['company-application', applicationId], updatedApplication);
    toast({ title: 'Status Updated', description: 'Application status has been updated successfully' });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Application for ${applicationData?.job?.title}`,
        text: `View application details for ${applicationData?.candidate?.name || applicationData?.userInfo?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link Copied', description: 'Application link copied to clipboard' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getJobTypeIcon = (job: any) => {
    const jobType = job?.jobType || 'full-time';
    switch (jobType) {
      case 'full-time': return <Briefcase className="h-5 w-5 text-violet-400" />;
      case 'part-time': return <Clock className="h-5 w-5 text-amber-400" />;
      case 'contract': return <Briefcase className="h-5 w-5 text-fuchsia-400" />;
      default: return <Briefcase className="h-5 w-5 text-violet-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'applied': { bg: colorClasses.bg.blueLight, text: colorClasses.text.blue },
      'under-review': { bg: colorClasses.bg.amberLight, text: colorClasses.text.amber },
      'shortlisted': { bg: colorClasses.bg.greenLight, text: colorClasses.text.green },
      'interview-scheduled': { bg: colorClasses.bg.purpleLight, text: colorClasses.text.purple },
      'offer-made': { bg: colorClasses.bg.tealLight, text: colorClasses.text.teal },
      'offer-accepted': { bg: colorClasses.bg.emeraldLight, text: colorClasses.text.emerald },
      'rejected': { bg: colorClasses.bg.roseLight, text: colorClasses.text.rose },
      'withdrawn': { bg: colorClasses.bg.gray100, text: colorClasses.text.gray600 }
    };
    return colors[status] || colors['applied'];
  };

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
          <div className="mx-auto w-full max-w-7xl px-4 py-8">
            <Skeleton className="h-[300px] rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl mt-6" />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (error || !applicationData) {
    return (
      <DashboardLayout requiredRole="company">
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
          <div className="mx-auto w-full max-w-4xl px-4 py-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-2xl text-center bg-white dark:bg-darkNavy border border-gray-200 dark:border-gray-700 shadow-xl"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center border border-rose-200 dark:border-rose-800">
                <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-darkNavy dark:text-white mb-2">Application Not Found</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {error instanceof Error ? error.message : 'The application does not exist or you don\'t have permission to view it.'}
              </p>
              <Button onClick={handleBack} variant="outline" className="h-11 px-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Button>
            </motion.div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  const job = applicationData.job;
  const candidate = applicationData.candidate || applicationData.userInfo;
  const candidateName = candidate?.name || 'Candidate';
  const statusColors = getStatusColor(applicationData.status);

  return (
    <TooltipProvider>
      <DashboardLayout requiredRole="company">
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">

            {/* Single Animated Header */}
            <motion.div
              variants={headerVariants}
              initial="hidden"
              animate="visible"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-fuchsia-700 dark:from-purple-800 dark:via-purple-900 dark:to-fuchsia-900 text-white shadow-xl mb-6"
            >
              {/* Animated Background */}
              <div className="absolute inset-0">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.1) 2px, transparent 0)',
                  backgroundSize: '40px 40px'
                }} />
              </div>

              {/* Content */}
              <div className="relative z-10 p-6">
                {/* Top Bar */}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30 h-10"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    {!isMobile && (
                      <>
                        <Button variant="outline" size="sm" onClick={handleShare} className="bg-white/20 text-white border-white/30 hover:bg-white/30 h-10">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePrint} className="bg-white/20 text-white border-white/30 hover:bg-white/30 h-10">
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching} className="bg-white/20 text-white border-white/30 hover:bg-white/30 h-10 w-10 p-0">
                      <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                    {isMobile && (
                      <Button variant="outline" size="sm" onClick={() => setShowMobileMenu(true)} className="bg-white/20 text-white border-white/30 hover:bg-white/30 h-10 w-10 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Main Info */}
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/30 rounded-2xl blur-lg" />
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-3xl sm:text-4xl font-bold text-purple-900">
                      {candidateName.charAt(0)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h1 className="text-2xl sm:text-3xl font-bold">{candidateName}</h1>
                      <Badge className={`px-3 py-1.5 text-sm font-medium border-0 ${statusColors.bg} ${statusColors.text}`}>
                        {applicationData.status.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                      </Badge>
                    </div>

                    <p className="text-lg text-white/90 mb-4">
                      Applied for <span className="font-semibold">{job?.title || 'Position'}</span>
                    </p>

                    {/* Stats Pills */}
                    <div className="flex flex-wrap gap-3">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {new Date(applicationData.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                        {getJobTypeIcon(job)}
                        <span className="text-sm font-medium">{job?.jobType || 'Full-time'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
                  {applicationData.contactInfo?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-white/70" />
                      <span className="text-sm truncate">{applicationData.contactInfo.email}</span>
                    </div>
                  )}
                  {applicationData.contactInfo?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-white/70" />
                      <span className="text-sm">{applicationData.contactInfo.phone}</span>
                    </div>
                  )}
                  {candidate?.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-white/70" />
                      <span className="text-sm truncate">{candidate.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Application Details Component */}
            <CompanyApplicationDetails
              applicationId={applicationId as string}
              viewType="company"
              onBack={handleBack}
              onStatusUpdate={handleStatusUpdate}
              enableCollaboration={true}
              enableAI={true}
              application={applicationData}
            />

            {/* Footer */}
            <div className="mt-6 p-4 rounded-xl bg-white/70 dark:bg-darkNavy/70 backdrop-blur-lg border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Professional hiring platform</p>
                {job?._id && (
                  <Link href={`/dashboard/company/jobs/${job._id}/applications`} className="inline-flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:underline">
                    View all applications for this job
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Mobile Menu */}
        <Dialog open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <BottomSheet isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} title="Actions">
            <div className="space-y-2">
              <Button className="w-full justify-start h-12" variant="ghost" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-3" /> Share Application
              </Button>
              <Button className="w-full justify-start h-12" variant="ghost" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-3" /> Print Details
              </Button>
              <Button className="w-full justify-start h-12" variant="ghost" onClick={() => toast({ title: 'Download Started' })}>
                <Download className="h-4 w-4 mr-3" /> Download All Documents
              </Button>
            </div>
          </BottomSheet>
        </Dialog>
      </DashboardLayout>
    </TooltipProvider>
  );
};

export default CompanyApplicationDetailPage;