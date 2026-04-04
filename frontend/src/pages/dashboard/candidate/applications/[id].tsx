/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { applicationService, Application } from '@/services/applicationService';
import { colorClasses } from '@/utils/color';
import { useMediaQuery } from '@/hooks/use-media-query';
import { CandidateApplicationDetails } from '@/components/applications/CandidateApplicationDetails';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Printer,
  Briefcase,
  Building,
  Calendar,
  Clock,
  AlertCircle,
  Trash2,
  Loader2,
  FileText,
  Users,
} from 'lucide-react';

// ==================== Status Color Mapping ====================

const statusColors: Record<string, { bg: string; text: string; lightBg: string }> = {
  applied: {
    bg: colorClasses.bg.blue,
    text: 'text-white',
    lightBg: colorClasses.bg.blueLight
  },
  'under-review': {
    bg: colorClasses.bg.amber,
    text: 'text-white',
    lightBg: colorClasses.bg.amberLight
  },
  shortlisted: {
    bg: colorClasses.bg.green,
    text: 'text-white',
    lightBg: colorClasses.bg.greenLight
  },
  'interview-scheduled': {
    bg: colorClasses.bg.purple,
    text: 'text-white',
    lightBg: colorClasses.bg.purpleLight
  },
  interviewed: {
    bg: colorClasses.bg.indigo,
    text: 'text-white',
    lightBg: colorClasses.bg.indigoLight
  },
  'offer-made': {
    bg: colorClasses.bg.emerald,
    text: 'text-white',
    lightBg: colorClasses.bg.emeraldLight
  },
  'offer-accepted': {
    bg: colorClasses.bg.green,
    text: 'text-white',
    lightBg: colorClasses.bg.greenLight
  },
  rejected: {
    bg: colorClasses.bg.red,
    text: 'text-white',
    lightBg: colorClasses.bg.redLight
  },
  withdrawn: {
    bg: colorClasses.bg.gray600,
    text: 'text-white',
    lightBg: colorClasses.bg.gray100
  }
};

// ==================== Mini Stat Card ====================

const MiniStatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ElementType;
  color: keyof typeof colorClasses.bg;
}> = ({ label, value, icon: Icon, color }) => {
  const bgClass = colorClasses.bg[color];

  return (
    <div className={`
      p-3 rounded-lg ${colorClasses.bg.primary} 
      border ${colorClasses.border.gray400} shadow-sm
    `}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs ${colorClasses.text.muted} mb-1`}>{label}</p>
          <p className={`text-xl font-bold ${colorClasses.text.primary}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${bgClass} bg-opacity-10`}>
          <Icon className={`h-4 w-4 ${colorClasses.text[color as keyof typeof colorClasses.text]}`} />
        </div>
      </div>
    </div>
  );
};

// ==================== Application Header ====================

const ApplicationHeader: React.FC<{
  application: Application;
  onBack: () => void;
  onShare: () => void;
  onPrint: () => void;
  onWithdraw?: () => void;
  canWithdraw: boolean;
  isWithdrawing?: boolean;
  isOffline?: boolean;
}> = ({
  application,
  onBack,
  onShare,
  onPrint,
  onWithdraw,
  canWithdraw,
  isWithdrawing,
  isOffline
}) => {
    const isMobile = useMediaQuery('(max-width: 640px)');
    const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1023px)');

    const ownerInfo = application.job?.jobType === 'organization'
      ? application.job?.organization
      : application.job?.company;
    const companyName = ownerInfo?.name || 'Unknown Company';

    const statusColor = statusColors[application.status] || statusColors.applied;

    const daysSinceApplied = Math.floor(
      (new Date().getTime() - new Date(application.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const cvCount = application.selectedCVs?.length || 0;
    const refCount = application.references?.length || 0;

    return (
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={`
        ${colorClasses.bg.primary} border ${colorClasses.border.gray400} 
        rounded-xl overflow-hidden mb-8
      `}
      >
        {/* Status Bar */}
        <div className={`h-1 w-full ${statusColor.bg}`} />

        {/* Mobile Layout */}
        {isMobile ? (
          <div className="p-4 space-y-4">
            {/* Top Row: Back + Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className={`h-9 px-3 ${colorClasses.border.gray400}`}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onShare}
                      className={`h-9 w-9 ${colorClasses.border.gray400}`}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onPrint}
                      className={`h-9 w-9 ${colorClasses.border.gray400}`}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Job Info */}
            <div>
              <h1 className={`text-lg font-bold ${colorClasses.text.primary} mb-2`}>
                {application.job?.title || 'Application Details'}
              </h1>
              <div className="flex items-center gap-2">
                <Building className={`h-4 w-4 ${colorClasses.text.muted}`} />
                <span className={`text-sm ${colorClasses.text.secondary}`}>
                  {companyName}
                </span>
              </div>
            </div>

            {/* Status + Date */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={`${statusColor.lightBg} ${statusColor.text} border-0 px-3 py-1.5 text-xs font-medium`}>
                {applicationService.getStatusLabel(application.status)}
              </Badge>
              <div className="flex items-center gap-1">
                <Calendar className={`h-3.5 w-3.5 ${colorClasses.text.muted}`} />
                <span className={`text-xs ${colorClasses.text.muted}`}>
                  {daysSinceApplied === 0 ? 'Today' : `${daysSinceApplied}d ago`}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <MiniStatCard
                label="CVs"
                value={cvCount}
                icon={FileText}
                color="blue"
              />
              <MiniStatCard
                label="References"
                value={refCount}
                icon={Users}
                color="purple"
              />
            </div>

            {/* Withdraw Button */}
            {canWithdraw && onWithdraw && (
              <Button
                variant="outline"
                onClick={onWithdraw}
                disabled={isWithdrawing}
                className={`
                w-full h-11
                ${colorClasses.border.red} ${colorClasses.text.red} 
                ${colorClasses.bg.redLight} hover:${colorClasses.bg.red}
                hover:text-white transition-colors
              `}
              >
                {isWithdrawing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Withdraw Application
              </Button>
            )}
          </div>
        ) : (
          /* Desktop/Tablet Layout */
          <div className="p-6">
            {/* Top Row: Back + Actions */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className={`h-9 px-3 ${colorClasses.border.gray400}`}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Applications
              </Button>

              <div className="flex items-center gap-2">
                {canWithdraw && onWithdraw && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onWithdraw}
                    disabled={isWithdrawing}
                    className={`
                    h-9 px-4
                    ${colorClasses.border.red} ${colorClasses.text.red} 
                    ${colorClasses.bg.redLight} hover:${colorClasses.bg.red}
                    hover:text-white transition-colors
                  `}
                  >
                    {isWithdrawing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {!isTablet && 'Withdraw'}
                  </Button>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onShare}
                      className={`h-9 w-9 ${colorClasses.border.gray400}`}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onPrint}
                      className={`h-9 w-9 ${colorClasses.border.gray400}`}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Main Header Content */}
            <div className="flex items-start gap-6">
              <div className={`p-3 rounded-xl ${colorClasses.bg.blueLight}`}>
                <Briefcase className={`h-6 w-6 ${colorClasses.text.blue}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className={`text-2xl font-bold ${colorClasses.text.primary} truncate`}>
                    {application.job?.title || 'Application Details'}
                  </h1>
                  <Badge className={`${statusColor.lightBg} ${statusColor.text} border-0 px-3 py-1 text-xs font-medium`}>
                    {applicationService.getStatusLabel(application.status)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Building className={`h-4 w-4 ${colorClasses.text.muted}`} />
                  <span className={`text-sm ${colorClasses.text.secondary}`}>
                    {companyName}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className={`h-4 w-4 ${colorClasses.text.muted}`} />
                    <span className={`text-sm ${colorClasses.text.muted}`}>
                      Applied {daysSinceApplied === 0 ? 'today' : `${daysSinceApplied}d ago`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className={`h-4 w-4 ${colorClasses.text.muted}`} />
                    <span className={`text-sm ${colorClasses.text.muted}`}>
                      Updated {new Date(application.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop Quick Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className={`text-2xl font-bold ${colorClasses.text.primary}`}>{cvCount}</p>
                  <p className={`text-xs ${colorClasses.text.muted}`}>CVs</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${colorClasses.text.primary}`}>{refCount}</p>
                  <p className={`text-xs ${colorClasses.text.muted}`}>References</p>
                </div>
              </div>
            </div>

            {/* Offline Banner */}
            {isOffline && (
              <div className={`mt-4 p-3 ${colorClasses.bg.amberLight} rounded-lg flex items-center gap-2`}>
                <AlertCircle className={`h-4 w-4 ${colorClasses.text.amber}`} />
                <span className={`text-sm ${colorClasses.text.amber}`}>
                  You're offline. Showing cached data.
                </span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

// ==================== Loading State ====================

const LoadingState: React.FC = () => (
  <div className={`min-h-screen ${colorClasses.bg.secondary} py-8`}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header Skeleton */}
      <div className={`${colorClasses.bg.primary} border ${colorClasses.border.gray400} rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className={`h-9 w-24 rounded-lg ${colorClasses.bg.gray100}`} />
          <Skeleton className={`h-9 w-24 rounded-lg ${colorClasses.bg.gray100}`} />
        </div>
        <div className="flex items-start gap-4">
          <Skeleton className={`h-12 w-12 rounded-xl ${colorClasses.bg.gray100}`} />
          <div className="flex-1">
            <Skeleton className={`h-8 w-64 mb-2 ${colorClasses.bg.gray100}`} />
            <Skeleton className={`h-4 w-48 ${colorClasses.bg.gray100}`} />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className={`h-64 rounded-xl ${colorClasses.bg.gray100}`} />
        <Skeleton className={`h-64 rounded-xl ${colorClasses.bg.gray100}`} />
        <Skeleton className={`h-48 rounded-xl ${colorClasses.bg.gray100}`} />
        <Skeleton className={`h-48 rounded-xl ${colorClasses.bg.gray100}`} />
      </div>
    </div>
  </div>
);

// ==================== Error State ====================

const ErrorState: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className={`min-h-screen ${colorClasses.bg.secondary} flex items-center justify-center p-4`}>
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-md"
    >
      <Card className={`${colorClasses.bg.primary} border ${colorClasses.border.gray400} rounded-xl overflow-hidden`}>
        <CardContent className="p-8 text-center">
          <div className={`w-16 h-16 ${colorClasses.bg.redLight} rounded-xl flex items-center justify-center mx-auto mb-4`}>
            <AlertCircle className={`h-8 w-8 ${colorClasses.text.red}`} />
          </div>
          <h2 className={`text-xl font-bold ${colorClasses.text.primary} mb-2`}>Application Not Found</h2>
          <p className={`text-sm ${colorClasses.text.muted} mb-6`}>
            The application you're looking for doesn't exist or may have been removed.
          </p>
          <Button
            onClick={onBack}
            className={`${colorClasses.bg.blue} text-white hover:bg-blue-600 px-6 h-11 rounded-lg`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  </div>
);

// ==================== Main Page Component ====================

const CandidateApplicationDetailPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = router.query;
  const isMobile = useMediaQuery('(max-width: 640px)');

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load application
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadApplicationDetails(id);
    }
  }, [id]);

  const loadApplicationDetails = async (applicationId: string) => {
    try {
      setIsLoading(true);

      // Try cache first if offline
      if (isOffline) {
        const cached = localStorage.getItem(`application_${applicationId}`);
        if (cached) {
          const { data } = JSON.parse(cached);
          setApplication(data);
          setIsLoading(false);
          return;
        }
      }

      const response = await applicationService.getApplicationDetails(applicationId);
      const appData = response.data.application;
      setApplication(appData);

      // Cache for offline
      localStorage.setItem(`application_${applicationId}`, JSON.stringify({
        data: appData,
        timestamp: Date.now()
      }));

    } catch (error: any) {
      console.error('Failed to load application:', error);

      // Try cache as fallback
      const cached = localStorage.getItem(`application_${applicationId}`);
      if (cached) {
        const { data } = JSON.parse(cached);
        setApplication(data);
        toast({
          title: 'Offline Mode',
          description: 'Showing cached version',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load application details',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/candidate/applications');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Application for ${application?.job?.title}`,
        text: `Check out my application for ${application?.job?.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied',
        description: 'Application link copied to clipboard',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWithdraw = async () => {
    if (!application) return;

    try {
      setIsWithdrawing(true);
      await applicationService.withdrawApplication(application._id);

      toast({
        title: 'Application Withdrawn',
        description: 'Your application has been successfully withdrawn',
      });

      router.push('/dashboard/candidate/applications');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to withdraw application',
        variant: 'destructive',
      });
    } finally {
      setIsWithdrawing(false);
      setShowWithdrawDialog(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (!application) return <ErrorState onBack={handleBack} />;

  const canWithdraw = applicationService.canWithdraw(application.status);

  return (
    <TooltipProvider>
      <DashboardLayout>
        <Head>
          <title>{application.job?.title || 'Application'} | JobStack</title>
        </Head>

        {/* Single container - no nested wrappers */}
        <div className={`min-h-screen ${colorClasses.bg.secondary} py-8`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

            {/* Application Header */}
            <ApplicationHeader
              application={application}
              onBack={handleBack}
              onShare={handleShare}
              onPrint={handlePrint}
              onWithdraw={() => setShowWithdrawDialog(true)}
              canWithdraw={canWithdraw}
              isWithdrawing={isWithdrawing}
              isOffline={isOffline}
            />

            {/* Main Content - Using CandidateApplicationDetails */}
            <CandidateApplicationDetails
              applicationId={application._id}
              onBack={handleBack}
              enableOffline={true}
            />

            {/* Withdraw Dialog */}
            <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
              <DialogContent className={`${colorClasses.bg.primary} border ${colorClasses.border.gray400} rounded-xl p-6 max-w-md`}>
                <DialogHeader>
                  <DialogTitle className={`text-lg font-bold ${colorClasses.text.primary} mb-2`}>
                    Withdraw Application
                  </DialogTitle>
                  <DialogDescription className={`${colorClasses.text.muted} text-sm`}>
                    Are you sure you want to withdraw your application for {application.job?.title}?
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowWithdrawDialog(false)}
                    className={`${colorClasses.border.gray400} flex-1 h-11`}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                    className="flex-1 h-11"
                  >
                    {isWithdrawing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Withdrawing...
                      </>
                    ) : (
                      'Withdraw'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
};

export default CandidateApplicationDetailPage;