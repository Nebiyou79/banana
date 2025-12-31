/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/candidate/apply/[jobId].tsx - PREMIUM FIXED VERSION
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
  Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
          <Card className="max-w-md w-full mx-4 backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-100/50 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-rose-200/30">
                <AlertCircle className="h-8 w-8 text-rose-500/80" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Authentication Required</h2>
              <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                Please log in as a candidate to apply for jobs.
              </p>
              <Button 
                onClick={() => router.push('/auth/login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105 py-3 text-lg"
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
          <Card className="max-w-md w-full mx-4 backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-100/50 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-rose-200/30">
                <AlertCircle className="h-8 w-8 text-rose-500/80" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Access Denied</h2>
              <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                Only candidates can apply for jobs. Please switch to a candidate account.
              </p>
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105 py-3 text-lg"
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
          <div className="text-center backdrop-blur-xl bg-white/60 rounded-3xl p-12 shadow-2xl border border-white/20">
            <Loader2 className="h-16 w-16 animate-spin text-blue-500/80 mx-auto mb-6" />
            <p className="text-slate-700 text-xl font-medium mb-3">Loading job details...</p>
            <p className="text-slate-500 text-lg">Job ID: {jobId}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
          <Card className="max-w-md w-full mx-4 backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-100/50 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-rose-200/30">
                <AlertCircle className="h-8 w-8 text-rose-500/80" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Unable to Load Job</h2>
              <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                {error || 'The job you are looking for does not exist or has been removed.'}
              </p>
              <div className="space-y-4">
                <Button onClick={handleRetry} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105 py-3">
                  <RefreshCw className="h-5 w-5 mr-3" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/dashboard/candidate/jobs')}
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 transition-all duration-300 py-3"
                >
                  Browse Other Jobs
                </Button>
              </div>
              {jobId && (
                <p className="text-sm text-slate-500 mt-6">Job ID: {jobId}</p>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
          <Card className="max-w-md w-full mx-4 backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100/50 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-amber-200/30">
                <Clock className="h-8 w-8 text-amber-500/80" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                {isDeadlinePassed ? 'Application Closed' : 'Job Not Available'}
              </h2>
              <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                {isDeadlinePassed 
                  ? 'The application deadline for this job has passed.'
                  : 'This job is no longer accepting applications.'
                }
              </p>
              <Button 
                onClick={() => router.push('/dashboard/candidate/jobs')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105 py-3 text-lg"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="mb-8 text-slate-600 hover:text-slate-800 transition-all duration-300 hover:scale-105 group"
            >
              <ArrowLeft className="h-5 w-5 mr-3 group-hover:-translate-x-1 transition-transform" />
              Back to Job Details
            </Button>

            {/* Job Summary Card */}
            <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl mb-8 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <h1 className="text-3xl font-bold text-slate-800 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        {job.title}
                      </h1>
                      <div className="flex gap-2">
                        {job.featured && (
                          <Badge className="bg-purple-500/10 text-purple-600 border-purple-200/30 backdrop-blur-sm px-4 py-2">
                            <Star className="h-4 w-4 mr-2" />
                            Featured
                          </Badge>
                        )}
                        {job.urgent && (
                          <Badge className="bg-rose-500/10 text-rose-600 border-rose-200/30 backdrop-blur-sm px-4 py-2">
                            <Target className="h-4 w-4 mr-2" />
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-base text-slate-600 mb-6 flex-wrap">
                      <div className="flex items-center gap-3 bg-slate-500/5 px-4 py-2 rounded-2xl backdrop-blur-sm border border-slate-200/30">
                        <Building className="h-5 w-5" />
                        <span className="font-medium">{jobService.getOwnerName(job)}</span>
                        {(job.company?.verified || job.organization?.verified) && (
                          <Shield className="h-5 w-5 text-emerald-600 ml-2" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 bg-slate-500/5 px-4 py-2 rounded-2xl backdrop-blur-sm border border-slate-200/30">
                        <MapPin className="h-5 w-5" />
                        <span className="font-medium">{job.location?.city || 'N/A'}, {job.location?.region || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-500/5 px-4 py-2 rounded-2xl backdrop-blur-sm border border-slate-200/30">
                        <Briefcase className="h-5 w-5" />
                        <span className="font-medium">{jobService.getJobTypeLabel(job.type)}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-3 bg-slate-500/5 px-4 py-2 rounded-2xl backdrop-blur-sm border border-slate-200/30">
                          <DollarSign className="h-5 w-5" />
                          <span className="font-medium">{jobService.formatSalary(job.salary)}</span>
                        </div>
                      )}
                    </div>
                    
                    {job.shortDescription && (
                      <p className="text-slate-700 text-lg leading-relaxed bg-slate-500/5 p-6 rounded-2xl border border-slate-200/30 backdrop-blur-sm">
                        {job.shortDescription}
                      </p>
                    )}
                  </div>
                  
                  {job.applicationDeadline && (
                    <div className="flex items-center gap-4 px-6 py-4 bg-amber-500/5 rounded-2xl border border-amber-200/30 backdrop-blur-sm">
                      <Clock className="h-6 w-6 text-amber-600" />
                      <div>
                        <p className="text-base font-semibold text-amber-800">Apply before</p>
                        <p className="text-base text-amber-700 font-medium">
                          {new Date(job.applicationDeadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Application Status */}
                <div className="mt-6 p-6 bg-blue-500/5 rounded-2xl border border-blue-200/30 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="h-7 w-7 text-blue-600" />
                    <div>
                      <p className="text-lg font-semibold text-blue-900">Ready to Apply</p>
                      <p className="text-blue-700 text-base">
                        Complete the application form below to apply for this position
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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