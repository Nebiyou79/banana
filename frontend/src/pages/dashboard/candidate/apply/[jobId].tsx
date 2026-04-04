/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/candidate/apply/[jobId].tsx - PROFESSIONALLY REFACTORED FOR MOBILE
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import ApplicationForm from '@/components/applications/ApplicationForm';
import { jobService, type Job } from '@/services/jobService';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, RefreshCw, Clock, ArrowLeft, Menu, Printer, Copy, Star,
  Target, Building, Shield, MapPin, Briefcase, DollarSign, CheckCircle, X
} from 'lucide-react';

interface ApplyPageProps {
  initialJob: Job | null;
  error?: string;
}

// Helper function for touch targets (using existing useResponsive hook)
const getTouchTargetSize = (size: 'sm' | 'md' | 'lg' = 'md'): string => {
  const sizes = {
    sm: 'min-h-[36px] min-w-[36px]',
    md: 'min-h-[44px] min-w-[44px]',
    lg: 'min-h-[52px] min-w-[52px]'
  };
  return sizes[size];
};

export const ApplyPage: React.FC<ApplyPageProps> = ({ initialJob, error: initialError }) => {
  const router = useRouter();
  const { jobId } = router.query;
  const { toast } = useToast();
  const { user } = useAuth();
  const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  const [job, setJob] = useState<Job | null>(initialJob);
  const [isLoading, setIsLoading] = useState(!initialJob && !initialError);
  const [error, setError] = useState<string | null>(initialError || null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if ((!initialJob && !initialError) || initialError) {
      loadJob();
    }
  }, [jobId]);

  const loadJob = async () => {
    if (!jobId || typeof jobId !== 'string') {
      setError('Invalid job ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const jobData = await jobService.getJob(jobId);
      setJob(jobData);
    } catch (error: any) {
      console.error('❌ Failed to load job:', error);
      const errorMessage = error.message || 'Failed to load job details';
      setError(errorMessage);

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplicationSuccess = (application: any) => {
    toast({
      title: 'Application Submitted!',
      description: 'Your application has been sent successfully.',
      variant: 'default'
    });

    setTimeout(() => {
      router.push('/dashboard/candidate/applications');
    }, 2000);
  };

  const handleApplicationError = (error: string) => {
    toast({
      title: 'Application Failed',
      description: error,
      variant: 'destructive'
    });
  };

  const handleCancel = () => {
    router.back();
  };

  const handleRetry = () => {
    loadJob();
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className={cn(
          "min-h-screen flex items-center justify-center p-4",
          colorClasses.bg.primary
        )}>
          <Card className={cn(
            "max-w-md w-full border shadow-sm rounded-xl overflow-hidden",
            colorClasses.bg.primary,
            colorClasses.border.gray100
          )}>
            <CardContent className="p-6 text-center">
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4",
                colorClasses.bg.amberLight
              )}>
                <AlertCircle className={cn("h-8 w-8", colorClasses.text.amber)} />
              </div>
              <h2 className={cn("text-xl font-bold mb-3", colorClasses.text.primary)}>
                Authentication Required
              </h2>
              <p className={cn("mb-6 text-sm", colorClasses.text.muted)}>
                Please log in as a candidate to apply for jobs.
              </p>
              <Button
                onClick={() => router.push('/auth/login')}
                className={cn(
                  "w-full h-12",
                  colorClasses.bg.blue,
                  'hover:opacity-90 text-white',
                  getTouchTargetSize('lg')
                )}
              >
                Log In
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (user.role !== 'candidate') {
    return (
      <DashboardLayout>
        <div className={cn(
          "min-h-screen flex items-center justify-center p-4",
          colorClasses.bg.primary
        )}>
          <Card className={cn(
            "max-w-md w-full border shadow-sm rounded-xl overflow-hidden",
            colorClasses.bg.primary,
            colorClasses.border.gray100
          )}>
            <CardContent className="p-6 text-center">
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4",
                colorClasses.bg.redLight
              )}>
                <AlertCircle className={cn("h-8 w-8", colorClasses.text.red)} />
              </div>
              <h2 className={cn("text-xl font-bold mb-3", colorClasses.text.primary)}>
                Access Denied
              </h2>
              <p className={cn("mb-6 text-sm", colorClasses.text.muted)}>
                Only candidates can apply for jobs.
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className={cn(
                  "w-full h-12",
                  colorClasses.bg.blue,
                  'hover:opacity-90 text-white',
                  getTouchTargetSize('lg')
                )}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className={cn(
          "min-h-screen flex items-center justify-center p-4",
          colorClasses.bg.primary
        )}>
          <div className={cn(
            "text-center rounded-xl p-6 shadow-sm border max-w-sm w-full",
            colorClasses.bg.primary,
            colorClasses.border.gray100
          )}>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className={cn(
                  "w-12 h-12 rounded-full border-4 border-t-transparent animate-spin",
                  colorClasses.border.blue
                )}></div>
              </div>
            </div>
            <p className={cn("text-base font-medium mb-1", colorClasses.text.primary)}>
              Loading job details...
            </p>
            <p className={cn("text-xs", colorClasses.text.muted)}>
              Job ID: {jobId}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout>
        <div className={cn(
          "min-h-screen flex items-center justify-center p-4",
          colorClasses.bg.primary
        )}>
          <Card className={cn(
            "max-w-md w-full border shadow-sm rounded-xl overflow-hidden",
            colorClasses.bg.primary,
            colorClasses.border.gray100
          )}>
            <CardContent className="p-6 text-center">
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4",
                colorClasses.bg.redLight
              )}>
                <AlertCircle className={cn("h-8 w-8", colorClasses.text.red)} />
              </div>
              <h2 className={cn("text-xl font-bold mb-3", colorClasses.text.primary)}>
                Unable to Load Job
              </h2>
              <p className={cn("mb-6 text-sm", colorClasses.text.muted)}>
                {error || 'The job you are looking for does not exist or has been removed.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleRetry}
                  className={cn(
                    "flex-1 h-12",
                    colorClasses.bg.blue,
                    'hover:opacity-90 text-white',
                    getTouchTargetSize('lg')
                  )}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/candidate/jobs')}
                  className={cn(
                    "flex-1 h-12 border",
                    colorClasses.border.gray100,
                    colorClasses.text.primary,
                    'hover:bg-gray-50 dark:hover:bg-gray-800',
                    getTouchTargetSize('lg')
                  )}
                >
                  Browse Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const isDeadlinePassed = job.applicationDeadline && new Date(job.applicationDeadline) < new Date();
  const isJobActive = job.status === 'active' && !isDeadlinePassed;

  if (!isJobActive) {
    return (
      <DashboardLayout>
        <div className={cn(
          "min-h-screen flex items-center justify-center p-4",
          colorClasses.bg.primary
        )}>
          <Card className={cn(
            "max-w-md w-full border shadow-sm rounded-xl overflow-hidden",
            colorClasses.bg.primary,
            colorClasses.border.gray100
          )}>
            <CardContent className="p-6 text-center">
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4",
                colorClasses.bg.amberLight
              )}>
                <Clock className={cn("h-8 w-8", colorClasses.text.amber)} />
              </div>
              <h2 className={cn("text-xl font-bold mb-3", colorClasses.text.primary)}>
                {isDeadlinePassed ? 'Application Closed' : 'Job Not Available'}
              </h2>
              <p className={cn("mb-6 text-sm", colorClasses.text.muted)}>
                {isDeadlinePassed
                  ? 'The application deadline for this job has passed.'
                  : 'This job is no longer accepting applications.'
                }
              </p>
              <Button
                onClick={() => router.push('/dashboard/candidate/jobs')}
                className={cn(
                  "w-full h-12",
                  colorClasses.bg.blue,
                  'hover:opacity-90 text-white',
                  getTouchTargetSize('lg')
                )}
              >
                Browse Active Jobs
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={cn(
        "min-h-screen",
        colorClasses.bg.primary
      )}>
        {/* Main Container with Proper Padding */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Mobile Header */}
          {isMobile && (
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl",
                  colorClasses.bg.secondary,
                  colorClasses.text.primary,
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  getTouchTargetSize('md')
                )}
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Back</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={cn(
                  "p-2 rounded-xl relative",
                  colorClasses.bg.secondary,
                  colorClasses.text.primary,
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  getTouchTargetSize('md')
                )}
              >
                {showMobileMenu ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          )}

          {/* Desktop Back Button */}
          {!isMobile && (
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className={cn(
                  "group -ml-2 flex items-center",
                  colorClasses.text.muted,
                  'hover:' + colorClasses.text.primary,
                  'transition-colors',
                  getTouchTargetSize('md')
                )}
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm">Back to Job Details</span>
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobile && showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "relative z-50 rounded-xl border shadow-lg p-2 mb-4",
                  colorClasses.bg.primary,
                  colorClasses.border.gray100
                )}
              >
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      window.print();
                      setShowMobileMenu(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-colors",
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      colorClasses.text.primary
                    )}
                  >
                    <Printer className={cn("h-4 w-4", colorClasses.text.muted)} />
                    <span className="text-sm">Print Job Details</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: 'Link Copied',
                        description: 'Job link copied to clipboard',
                        variant: 'success'
                      });
                      setShowMobileMenu(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-colors",
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      colorClasses.text.primary
                    )}
                  >
                    <Copy className={cn("h-4 w-4", colorClasses.text.muted)} />
                    <span className="text-sm">Copy Link</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Job Summary Card - Mobile Optimized */}
          <Card className={cn(
            "border shadow-sm rounded-xl overflow-hidden mb-4 sm:mb-6",
            colorClasses.bg.primary,
            colorClasses.border.gray100
          )}>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Title and Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <h1 className={cn(
                    "text-lg sm:text-xl md:text-2xl font-bold flex-1",
                    colorClasses.text.primary
                  )}>
                    {job.title}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    {job.featured && (
                      <Badge className={cn(
                        colorClasses.bg.purpleLight,
                        colorClasses.text.purple,
                        "border-0 px-3 py-1.5 text-xs font-medium"
                      )}>
                        <Star className="h-3.5 w-3.5 mr-1.5" />
                        Featured
                      </Badge>
                    )}
                    {job.urgent && (
                      <Badge className={cn(
                        colorClasses.bg.redLight,
                        colorClasses.text.red,
                        "border-0 px-3 py-1.5 text-xs font-medium"
                      )}>
                        <Target className="h-3.5 w-3.5 mr-1.5" />
                        Urgent
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Company Info */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm flex-1",
                    colorClasses.bg.secondary
                  )}>
                    <Building className={cn("h-4 w-4 shrink-0", colorClasses.text.blue)} />
                    <span className={cn("font-medium truncate", colorClasses.text.primary)}>
                      {jobService.getOwnerName(job)}
                    </span>
                    {(job.company?.verified || job.organization?.verified) && (
                      <Shield className={cn("h-4 w-4 shrink-0", colorClasses.text.emerald)} />
                    )}
                  </div>
                </div>

                {/* Job Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-lg",
                    colorClasses.bg.secondary
                  )}>
                    <MapPin className={cn("h-4 w-4 shrink-0", colorClasses.text.amber)} />
                    <span className={cn("text-sm font-medium truncate", colorClasses.text.primary)}>
                      {job.location?.city || 'Remote'}
                    </span>
                  </div>

                  <div className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-lg",
                    colorClasses.bg.secondary
                  )}>
                    <Briefcase className={cn("h-4 w-4 shrink-0", colorClasses.text.purple)} />
                    <span className={cn("text-sm font-medium", colorClasses.text.primary)}>
                      {jobService.getJobTypeLabel(job.type)}
                    </span>
                  </div>

                  {job.salary && (
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-lg sm:col-span-2 lg:col-span-1",
                      colorClasses.bg.secondary
                    )}>
                      <DollarSign className={cn("h-4 w-4 shrink-0", colorClasses.text.emerald)} />
                      <span className={cn("text-sm font-medium", colorClasses.text.primary)}>
                        {jobService.formatSalary(job.salary)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Short Description */}
                {job.shortDescription && (
                  <div className={cn(
                    "p-4 rounded-lg border",
                    colorClasses.bg.secondary,
                    colorClasses.border.gray100
                  )}>
                    <p className={cn("text-sm leading-relaxed", colorClasses.text.secondary)}>
                      {job.shortDescription}
                    </p>
                  </div>
                )}

                {/* Deadline and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {job.applicationDeadline && (
                    <div className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg border",
                      colorClasses.bg.amberLight,
                      colorClasses.border.amber
                    )}>
                      <Clock className={cn("h-5 w-5 shrink-0", colorClasses.text.amber)} />
                      <div>
                        <p className={cn("text-xs font-semibold", colorClasses.text.amber)}>
                          Apply before
                        </p>
                        <p className={cn("text-sm font-medium", colorClasses.text.amber)}>
                          {new Date(job.applicationDeadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg border",
                    colorClasses.bg.blueLight,
                    colorClasses.border.blue
                  )}>
                    <CheckCircle className={cn("h-5 w-5 shrink-0", colorClasses.text.blue)} />
                    <div>
                      <p className={cn("text-xs font-semibold", colorClasses.text.blue)}>
                        Status
                      </p>
                      <p className={cn("text-sm font-medium", colorClasses.text.blue)}>
                        Accepting Applications
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Form */}
          <ApplicationForm
            jobId={job._id}
            jobTitle={job.title}
            companyName={jobService.getOwnerName(job)}
            onSuccess={handleApplicationSuccess}
            onCancel={handleCancel}
            onError={handleApplicationError}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { jobId } = context.params!;

  try {
    if (!jobId || typeof jobId !== 'string') {
      return {
        props: {
          initialJob: null,
          error: 'Invalid job ID'
        }
      };
    }

    const job = await jobService.getJob(jobId);

    return {
      props: {
        initialJob: job,
      },
    };
  } catch (error: any) {
    console.error('❌ SSR Error fetching job:', error);

    return {
      props: {
        initialJob: null,
        error: error.message || 'Failed to load job details'
      },
    };
  }
};

export default ApplyPage;