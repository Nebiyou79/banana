/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, Job } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import JobForm from '@/components/job/JobForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Briefcase, 
  CheckCircle,
  Rocket,
  Target,
  Users,
  TrendingUp
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { colorClasses } from '@/utils/color';

const CreateJobPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdJob, setCreatedJob] = useState<Job | null>(null);

  // Create job mutation - automatically uses company endpoint based on user role
  const createMutation = useMutation({
    // accept any form data and cast to the expected payload so required fields like `title` satisfy jobService
    mutationFn: (data: any) => {
      return jobService.createJob(data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] });
      setCreatedJob(response);
      setShowSuccess(true);
      
      toast({
        title: 'Job created successfully!',
        description: 'Your job posting is now live and visible to candidates.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      console.error('Job creation error:', error);
      toast({
        title: 'Failed to create job',
        description: error.message || 'Please check the form and try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (data: Partial<Job>) => {
    const jobData: Partial<Job> = {
      ...data,
      jobType: 'company' as const,
    };
    await createMutation.mutateAsync(jobData);
  };

  const handleViewJob = () => {
    if (createdJob) {
      router.push(`/dashboard/company/jobs/${createdJob._id}`);
    }
  };

  const handleCreateAnother = () => {
    setShowSuccess(false);
    setCreatedJob(null);
    window.scrollTo(0, 0);
  };

  if (createMutation.isPending) {
    return (
      <DashboardLayout requiredRole="company">
        <div className={`min-h-[calc(100vh-4rem)] ${colorClasses.bg.gray100} flex items-center justify-center`}>
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <h2 className={`text-xl font-semibold ${colorClasses.text.darkNavy}`}>Creating your job posting...</h2>
            <p className={`${colorClasses.text.gray800} mt-2`}>This will just take a moment.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (showSuccess && createdJob) {
    const jobTypeLabel = jobService.getJobTypeDisplayLabel(createdJob);
    
    return (
      <DashboardLayout requiredRole="company">
        <div className={`min-h-[calc(100vh-4rem)] ${colorClasses.bg.gray100} py-4 md:py-8`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Success Header */}
            <div className="mb-8 md:mb-12">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
              </div>
              <h1 className={`text-2xl md:text-4xl font-bold ${colorClasses.text.darkNavy} mb-3 md:mb-4`}>
                {jobTypeLabel} Created Successfully!
              </h1>
              <p className={`text-base md:text-xl ${colorClasses.text.gray800} max-w-2xl mx-auto`}>
                Your {jobTypeLabel.toLowerCase()} for <strong>`{createdJob.title}`</strong> is now {createdJob.status === 'active' ? 'live and visible to candidates' : 'saved as draft'}.
              </p>
            </div>

            {/* Success Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
              <div className={`${colorClasses.bg.white} rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border ${colorClasses.border.gray400} text-center`}>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Target className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
                <div className={`text-lg md:text-2xl font-bold ${colorClasses.text.darkNavy} mb-1 md:mb-2 capitalize`}>
                  {createdJob.status}
                </div>
                <div className={`text-sm ${colorClasses.text.gray800}`}>Job Status</div>
              </div>
              
              <div className={`${colorClasses.bg.white} rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border ${colorClasses.border.gray400} text-center`}>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
                <div className={`text-lg md:text-2xl font-bold ${colorClasses.text.darkNavy} mb-1 md:mb-2`}>0</div>
                <div className={`text-sm ${colorClasses.text.gray800}`}>Applications</div>
              </div>
              
              <div className={`${colorClasses.bg.white} rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border ${colorClasses.border.gray400} text-center`}>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
                <div className={`text-lg md:text-2xl font-bold ${colorClasses.text.darkNavy} mb-1 md:mb-2 capitalize`}>
                  {createdJob.remote}
                </div>
                <div className={`text-sm ${colorClasses.text.gray800}`}>Work Type</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`${colorClasses.bg.white} rounded-xl md:rounded-2xl p-6 md:p-8 shadow-lg border ${colorClasses.border.gray400}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <button
                  onClick={handleViewJob}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-base md:text-lg flex items-center justify-center gap-2 md:gap-3"
                >
                  <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
                  View {jobTypeLabel}
                </button>
                
                <button
                  onClick={handleCreateAnother}
                  className={`w-full ${colorClasses.bg.white} ${colorClasses.text.gray800} border-2 ${colorClasses.border.gray400} py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl hover:${colorClasses.bg.gray100} hover:border-gray-400 transition-all duration-200 font-semibold text-base md:text-lg flex items-center justify-center gap-2 md:gap-3`}
                >
                  <Rocket className="w-4 h-4 md:w-5 md:h-5" />
                  Create Another {jobTypeLabel}
                </button>
              </div>
              
              <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-200">
                <h3 className={`text-base md:text-lg font-semibold ${colorClasses.text.darkNavy} mb-3 md:mb-4`}>Next Steps</h3>
                <ul className="space-y-2 md:space-y-3">
                  <li className={`flex items-start ${colorClasses.text.gray800}`}>
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 mt-0.5 flex-shrink-0" />
                    Monitor applications in your dashboard
                  </li>
                  <li className={`flex items-start ${colorClasses.text.gray800}`}>
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 mt-0.5 flex-shrink-0" />
                    Share the job link with your network
                  </li>
                  <li className={`flex items-start ${colorClasses.text.gray800}`}>
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 mt-0.5 flex-shrink-0" />
                    Review and respond to applicants promptly
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-6 md:mt-8 text-center">
              <Link 
                href="/dashboard/company/jobs"
                className={`${colorClasses.text.blue} hover:text-blue-700 font-semibold inline-flex items-center gap-2`}
              >
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                Back to Job Management
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="company">
      <div className={`min-h-[calc(100vh-4rem)] ${colorClasses.bg.gray100} py-4 md:py-8`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4">
              <div className="flex-1">
                <Link 
                  href="/dashboard/company/jobs"
                  className={`inline-flex items-center ${colorClasses.text.blue} hover:text-blue-700 font-medium mb-3 md:mb-4 transition-colors`}
                >
                  <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Back to Jobs
                </Link>
                <h1 className={`text-2xl md:text-4xl font-bold ${colorClasses.text.darkNavy} mb-2 md:mb-3`}>
                  Create New Job
                </h1>
                <p className={`text-base md:text-xl ${colorClasses.text.gray800} max-w-3xl`}>
                  Fill in the details below to create an attractive job posting that will reach qualified candidates.
                </p>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className={`${colorClasses.bg.white} ${colorClasses.border.gray400} backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border shadow-sm`}>
                <div className={`text-xs md:text-sm font-medium ${colorClasses.text.gray800}`}>Step-by-Step</div>
                <div className={`text-base md:text-lg font-semibold ${colorClasses.text.darkNavy}`}>4 Easy Steps</div>
              </div>
              <div className={`${colorClasses.bg.white} ${colorClasses.border.gray400} backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border shadow-sm`}>
                <div className={`text-xs md:text-sm font-medium ${colorClasses.text.gray800}`}>Save Progress</div>
                <div className={`text-base md:text-lg font-semibold ${colorClasses.text.darkNavy}`}>Draft Available</div>
              </div>
              <div className={`${colorClasses.bg.white} ${colorClasses.border.gray400} backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border shadow-sm`}>
                <div className={`text-xs md:text-sm font-medium ${colorClasses.text.gray800}`}>Preview</div>
                <div className={`text-base md:text-lg font-semibold ${colorClasses.text.darkNavy}`}>Live Preview</div>
              </div>
            </div>
          </div>

          {/* Job Form */}
          <div className={`${colorClasses.bg.white} rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl border ${colorClasses.border.gray400} overflow-hidden`}>
            <JobForm
              onSubmit={handleSubmit}
              loading={createMutation.isPending}
              mode="create"
            />
          </div>

          {/* Help Section */}
          <div className={`mt-8 md:mt-12 ${colorClasses.bg.white} rounded-xl md:rounded-2xl p-4 md:p-8 shadow-lg border ${colorClasses.border.gray400}`}>
            <h2 className={`text-xl md:text-2xl font-bold ${colorClasses.text.darkNavy} mb-4 md:mb-6 text-center`}>
              Tips for Creating Great Job Postings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Target className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
                <h3 className={`font-semibold ${colorClasses.text.darkNavy} mb-1 md:mb-2`}>Be Specific</h3>
                <p className={`text-xs md:text-sm ${colorClasses.text.gray800}`}>
                  Use clear job titles and detailed descriptions to attract the right candidates.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
                <h3 className={`font-semibold ${colorClasses.text.darkNavy} mb-1 md:mb-2`}>Highlight Benefits</h3>
                <p className={`text-xs md:text-sm ${colorClasses.text.gray800}`}>
                  Showcase your company culture, perks, and growth opportunities.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
                <h3 className={`font-semibold ${colorClasses.text.darkNavy} mb-1 md:mb-2`}>Set Realistic Requirements</h3>
                <p className={`text-xs md:text-sm ${colorClasses.text.gray800}`}>
                  Balance must-have skills with nice-to-have qualifications.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Rocket className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                </div>
                <h3 className={`font-semibold ${colorClasses.text.darkNavy} mb-1 md:mb-2`}>Use Keywords</h3>
                <p className={`text-xs md:text-sm ${colorClasses.text.gray800}`}>
                  Include relevant skills and technologies to improve search visibility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateJobPage;