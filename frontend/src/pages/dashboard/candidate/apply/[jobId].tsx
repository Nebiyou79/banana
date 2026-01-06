/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/candidate/apply/[jobId].tsx - MOBILE OPTIMIZED
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import ApplicationForm from '@/components/applications/ApplicationForm';
import { jobService, type Job } from '@/services/jobService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Briefcase,
  Building,
  MapPin,
  Clock,
  DollarSign,
  Loader2,
  AlertCircle,
  RefreshCw,
  Shield,
  CheckCircle,
  Star,
  Target,
  ChevronLeft,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { colors, colorClasses } from '@/utils/color';

interface ApplyPageProps {
  initialJob: Job | null;
  error?: string;
}

const ApplyPage: React.FC<ApplyPageProps> = ({ initialJob, error: initialError }) => {
  const router = useRouter();
  const { jobId } = router.query;
  const { toast } = useToast();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(initialJob);
  const [isLoading, setIsLoading] = useState(!initialJob && !initialError);
  const [error, setError] = useState<string | null>(initialError || null);

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
      console.error('Failed to load job:', error);
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
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-white border-0 shadow-none">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="h-7 w-7 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Authentication Required</h2>
              <p className="text-gray-600 mb-6 text-base leading-relaxed">
                Please log in as a candidate to apply for jobs.
              </p>
              <Button
                onClick={() => router.push('/auth/login')}
                className={`w-full ${colorClasses.bg.darkNavy} hover:opacity-90 text-white py-3.5 text-base font-medium rounded-lg`}
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
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-white border-0 shadow-none">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-rose-50 rounded-xl flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="h-7 w-7 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Access Denied</h2>
              <p className="text-gray-600 mb-6 text-base leading-relaxed">
                Only candidates can apply for jobs. Please switch to a candidate account.
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className={`w-full ${colorClasses.bg.darkNavy} hover:opacity-90 text-white py-3.5 text-base font-medium rounded-lg`}
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
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className={`h-12 w-12 animate-spin ${colorClasses.text.darkNavy} mx-auto mb-4`} />
            <p className="text-gray-800 text-lg font-medium mb-2">Loading job details...</p>
            <p className="text-gray-500 text-sm">Job ID: {jobId}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-white border-0 shadow-none">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-rose-50 rounded-xl flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="h-7 w-7 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Unable to Load Job</h2>
              <p className="text-gray-600 mb-6 text-base leading-relaxed">
                {error || 'The job you are looking for does not exist or has been removed.'}
              </p>
              <div className="space-y-3">
                <Button onClick={handleRetry} className={`w-full ${colorClasses.bg.darkNavy} hover:opacity-90 text-white py-3.5`}>
                  <RefreshCw className="h-4.5 w-4.5 mr-2.5" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/candidate/jobs')}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3.5"
                >
                  Browse Other Jobs
                </Button>
              </div>
              {jobId && (
                <p className="text-xs text-gray-400 mt-5">Job ID: {jobId}</p>
              )}
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
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-white border-0 shadow-none">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-5">
                <Clock className="h-7 w-7 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                {isDeadlinePassed ? 'Application Closed' : 'Job Not Available'}
              </h2>
              <p className="text-gray-600 mb-6 text-base leading-relaxed">
                {isDeadlinePassed
                  ? 'The application deadline for this job has passed.'
                  : 'This job is no longer accepting applications.'
                }
              </p>
              <Button
                onClick={() => router.push('/dashboard/candidate/jobs')}
                className={`w-full ${colorClasses.bg.darkNavy} hover:opacity-90 text-white py-3.5 text-base font-medium rounded-lg`}
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
      <div className="min-h-screen bg-white">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="p-2 -ml-2"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </Button>
          <div className="ml-2 flex-1">
            <h1 className="text-base font-semibold text-gray-900 truncate">Apply for Position</h1>
            <p className="text-xs text-gray-500 truncate">
              {job.title} • {jobService.getOwnerName(job)}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4">
          {/* Job Summary Card */}
          <Card className="bg-white border border-gray-200 rounded-xl mb-6">
            <CardContent className="p-4">
              <div className="mb-4">
                <div className="flex flex-wrap items-start gap-2 mb-3">
                  <h2 className="text-lg font-bold text-gray-900 flex-1 min-w-0">
                    {job.title}
                  </h2>
                  <div className="flex gap-1.5">
                    {job.featured && (
                      <Badge className={`${colorClasses.bg.goldenMustard} text-white border-0 px-2 py-0.5 text-xs`}>
                        <Star className="h-3 w-3 mr-1 inline" />
                        Featured
                      </Badge>
                    )}
                    {job.urgent && (
                      <Badge className="bg-rose-500 text-white border-0 px-2 py-0.5 text-xs">
                        <Target className="h-3 w-3 mr-1 inline" />
                        Urgent
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Mobile Compact Job Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {jobService.getOwnerName(job)}
                    </span>
                    {(job.company?.verified || job.organization?.verified) && (
                      <Shield className="h-3.5 w-3.5 text-emerald-500 ml-0.5" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {job.location?.city || 'N/A'}, {job.location?.region || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {jobService.getJobTypeLabel(job.type)}
                    </span>
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {jobService.formatSalary(job.salary)}
                      </span>
                    </div>
                  )}
                </div>

                {job.shortDescription && (
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
                    {job.shortDescription}
                  </p>
                )}
              </div>

              {job.applicationDeadline && (
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4.5 w-4.5 text-amber-600" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Apply before</p>
                      <p className="text-sm text-amber-700 font-medium">
                        {new Date(job.applicationDeadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`text-xs px-2.5 py-1 rounded-full ${colorClasses.bg.darkNavy} text-white`}>
                    Active
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Status Banner */}
          <div className="mb-6 p-3.5 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">Ready to Apply</p>
                <p className="text-xs text-blue-700">
                  Complete the form below to submit your application
                </p>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="bg-white rounded-xl border border-gray-200">
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
    console.error('SSR Error fetching job:', error);

    return {
      props: {
        initialJob: null,
        error: error.message || 'Failed to load job details'
      },
    };
  }
};

export default ApplyPage;