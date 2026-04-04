/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/organization/jobs/create.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, Job } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import OrganizationJobForm from '@/components/job/OrganizationJobForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Users, 
  CheckCircle,
  Rocket,
  Target,
  Heart,
  TrendingUp,
  Globe
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getTheme, colors } from '@/utils/color';

const CreateOrganizationJobPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [themeMode] = useState<'light' | 'dark'>('light'); // Default to light, or get from localStorage/system preference
  const theme = getTheme(themeMode);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdJob, setCreatedJob] = useState<Job | null>(null);

  // Create organization opportunity mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      return jobService.createOrganizationJob(data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['organizationJobs'] });
      setCreatedJob(response);
      setShowSuccess(true);
      
      toast({
        title: 'Opportunity created successfully!',
        description: 'Your opportunity is now live and visible to candidates.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      console.error('Opportunity creation error:', error);
      toast({
        title: 'Failed to create opportunity',
        description: error.message || 'Please check the form and try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (data: any) => {
    await createMutation.mutateAsync(data);
  };

  const handleViewJob = () => {
    if (createdJob) {
      router.push(`/dashboard/organization/jobs/${createdJob._id}`);
    }
  };

  const handleCreateAnother = () => {
    setShowSuccess(false);
    setCreatedJob(null);
    window.scrollTo(0, 0);
  };

  if (createMutation.isPending) {
    return (
      <DashboardLayout requiredRole="organization">
        <div 
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: theme.bg.secondary }}
        >
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" themeMode={themeMode} />
            <h2 className={`text-xl font-semibold`} style={{ color: theme.text.primary }}>Creating your opportunity...</h2>
            <p className={`mt-2`} style={{ color: theme.text.secondary }}>This will just take a moment.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (showSuccess && createdJob) {
    return (
      <DashboardLayout requiredRole="organization">
        <div 
          className="min-h-screen py-4 md:py-8"
          style={{ backgroundColor: theme.bg.secondary }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Success Header */}
            <div className="text-center mb-8 md:mb-12">
              <div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6"
                style={{ backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.emerald100 }}
              >
                <CheckCircle className="w-8 h-8 md:w-10 md:h-10" style={{ color: themeMode === 'dark' ? colors.emerald : colors.emerald600 }} />
              </div>
              <h1 className={`text-2xl md:text-4xl font-bold mb-3 md:mb-4`} style={{ color: theme.text.primary }}>
                Opportunity Created!
              </h1>
              <p className={`text-base md:text-xl max-w-2xl mx-auto`} style={{ color: theme.text.secondary }}>
                Your opportunity for <strong style={{ color: theme.text.primary }}>"{createdJob.title}"</strong> is now live.
              </p>
            </div>

            {/* Success Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
              <div 
                className="rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border text-center"
                style={{
                  backgroundColor: theme.bg.primary,
                  borderColor: theme.border.primary
                }}
              >
                <div 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4"
                  style={{ backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.purple100 }}
                >
                  <Target className="w-5 h-5 md:w-6 md:h-6" style={{ color: themeMode === 'dark' ? colors.purple : colors.purple }} />
                </div>
                <div className={`text-lg md:text-2xl font-bold mb-1`} style={{ color: theme.text.primary }}>
                  {createdJob.status}
                </div>
                <div className={`text-sm`} style={{ color: theme.text.secondary }}>Status</div>
              </div>
              
              <div 
                className="rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border text-center"
                style={{
                  backgroundColor: theme.bg.primary,
                  borderColor: theme.border.primary
                }}
              >
                <div 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4"
                  style={{ backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.emerald100 }}
                >
                  <Users className="w-5 h-5 md:w-6 md:h-6" style={{ color: themeMode === 'dark' ? colors.emerald : colors.emerald600 }} />
                </div>
                <div className={`text-lg md:text-2xl font-bold mb-1`} style={{ color: theme.text.primary }}>0</div>
                <div className={`text-sm`} style={{ color: theme.text.secondary }}>Applications</div>
              </div>
              
              <div 
                className="rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border text-center"
                style={{
                  backgroundColor: theme.bg.primary,
                  borderColor: theme.border.primary
                }}
              >
                <div 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4"
                  style={{ backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.amber100 }}
                >
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6" style={{ color: themeMode === 'dark' ? colors.amber : colors.amber }} />
                </div>
                <div className={`text-lg md:text-2xl font-bold mb-1 capitalize`} style={{ color: theme.text.primary }}>
                  Live
                </div>
                <div className={`text-sm`} style={{ color: theme.text.secondary }}>Visibility</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div 
              className="rounded-xl md:rounded-2xl p-6 md:p-8 shadow-lg border"
              style={{
                backgroundColor: theme.bg.primary,
                borderColor: theme.border.primary
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <button
                  onClick={handleViewJob}
                  className="w-full text-white py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl hover:opacity-90 transition-all font-semibold text-base md:text-lg flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(to right, ${themeMode === 'dark' ? colors.purple : colors.purple}, ${themeMode === 'dark' ? colors.purple : colors.purple})`
                  }}
                >
                  <Users className="w-4 h-4 md:w-5 md:h-5" />
                  View Opportunity
                </button>
                
                <button
                  onClick={handleCreateAnother}
                  className="w-full py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl border-2 hover:opacity-80 transition-all font-semibold text-base md:text-lg flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: theme.bg.primary,
                    color: theme.text.secondary,
                    borderColor: theme.border.primary
                  }}
                >
                  <Rocket className="w-4 h-4 md:w-5 md:h-5" />
                  Create Another
                </button>
              </div>
              
              <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t" style={{ borderColor: theme.border.secondary }}>
                <h3 className={`text-base md:text-lg font-semibold mb-3 md:mb-4`} style={{ color: theme.text.primary }}>Next Steps</h3>
                <ul className="space-y-2">
                  <li className={`flex items-start text-sm`} style={{ color: theme.text.secondary }}>
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" style={{ color: themeMode === 'dark' ? colors.emerald : colors.emerald600 }} />
                    Monitor applications in your dashboard
                  </li>
                  <li className={`flex items-start text-sm`} style={{ color: theme.text.secondary }}>
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" style={{ color: themeMode === 'dark' ? colors.emerald : colors.emerald600 }} />
                    Share the opportunity link with your network
                  </li>
                  <li className={`flex items-start text-sm`} style={{ color: theme.text.secondary }}>
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" style={{ color: themeMode === 'dark' ? colors.emerald : colors.emerald600 }} />
                    Review and respond to applicants promptly
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-6 md:mt-8 text-center">
              <Link 
                href="/dashboard/organization/jobs"
                className={`inline-flex items-center gap-2 font-semibold hover:opacity-80 transition-colors text-sm md:text-base`}
                style={{ color: themeMode === 'dark' ? colors.purple : colors.purple }}
              >
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                Back to Opportunities
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="organization">
      <div 
        className="min-h-screen py-4 md:py-8"
        style={{ backgroundColor: theme.bg.secondary }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4">
              <div className="flex-1">
                <Link 
                  href="/dashboard/organization/jobs"
                  className={`inline-flex items-center font-medium mb-3 md:mb-4 transition-colors hover:opacity-80 text-sm md:text-base`}
                  style={{ color: themeMode === 'dark' ? colors.purple : colors.purple }}
                >
                  <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Back to Opportunities
                </Link>
                <h1 className={`text-xl md:text-3xl lg:text-4xl font-bold mb-2`} style={{ color: theme.text.primary }}>
                  Create New Opportunity
                </h1>
                <p className={`text-sm md:text-base lg:text-xl max-w-3xl`} style={{ color: theme.text.secondary }}>
                  Fill in the details below to create an engaging opportunity for volunteers, interns, or staff members.
                </p>
              </div>
              
              <div className="hidden lg:block">
                <div 
                  className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(to bottom right, ${themeMode === 'dark' ? colors.purple : colors.purple}, ${themeMode === 'dark' ? colors.purple : colors.purple})`
                  }}
                >
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div 
                className="rounded-lg md:rounded-xl p-3 md:p-4 border shadow-sm"
                style={{
                  backgroundColor: theme.bg.primary,
                  borderColor: theme.border.primary
                }}
              >
                <div className={`text-xs md:text-sm font-medium`} style={{ color: theme.text.secondary }}>Step-by-Step</div>
                <div className={`text-sm md:text-base font-semibold`} style={{ color: theme.text.primary }}>4 Easy Steps</div>
              </div>
              <div 
                className="rounded-lg md:rounded-xl p-3 md:p-4 border shadow-sm"
                style={{
                  backgroundColor: theme.bg.primary,
                  borderColor: theme.border.primary
                }}
              >
                <div className={`text-xs md:text-sm font-medium`} style={{ color: theme.text.secondary }}>Save Progress</div>
                <div className={`text-sm md:text-base font-semibold`} style={{ color: theme.text.primary }}>Draft Available</div>
              </div>
              <div 
                className="rounded-lg md:rounded-xl p-3 md:p-4 border shadow-sm"
                style={{
                  backgroundColor: theme.bg.primary,
                  borderColor: theme.border.primary
                }}
              >
                <div className={`text-xs md:text-sm font-medium`} style={{ color: theme.text.secondary }}>Preview</div>
                <div className={`text-sm md:text-base font-semibold`} style={{ color: theme.text.primary }}>Live Preview</div>
              </div>
            </div>
          </div>

          {/* Organization Job Form */}
          <div 
            className="rounded-xl md:rounded-2xl shadow-lg border overflow-hidden"
            style={{
              backgroundColor: theme.bg.primary,
              borderColor: theme.border.primary
            }}
          >
            <OrganizationJobForm
              onSubmit={handleSubmit}
              loading={createMutation.isPending}
              mode="create"
              themeMode={themeMode}
            />
          </div>

          {/* Help Section */}
          <div 
            className="mt-8 md:mt-12 rounded-xl md:rounded-2xl p-4 md:p-8 shadow-lg border"
            style={{
              backgroundColor: theme.bg.primary,
              borderColor: theme.border.primary
            }}
          >
            <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-4 md:mb-6 text-center`} style={{ color: theme.text.primary }}>
              Tips for Creating Great Opportunities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="text-center">
                <div 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4"
                  style={{ backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.purple100 }}
                >
                  <Target className="w-5 h-5 md:w-6 md:h-6" style={{ color: themeMode === 'dark' ? colors.purple : colors.purple }} />
                </div>
                <h3 className={`font-semibold text-sm md:text-base mb-1 md:mb-2`} style={{ color: theme.text.primary }}>Be Specific</h3>
                <p className={`text-xs md:text-sm`} style={{ color: theme.text.secondary }}>
                  Use clear titles and detailed descriptions.
                </p>
              </div>
              
              <div className="text-center">
                <div 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4"
                  style={{ backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.emerald100 }}
                >
                  <Heart className="w-5 h-5 md:w-6 md:h-6" style={{ color: themeMode === 'dark' ? colors.emerald : colors.emerald600 }} />
                </div>
                <h3 className={`font-semibold text-sm md:text-base mb-1 md:mb-2`} style={{ color: theme.text.primary }}>Highlight Impact</h3>
                <p className={`text-xs md:text-sm`} style={{ color: theme.text.secondary }}>
                  Showcase your mission and the difference.
                </p>
              </div>
              
              <div className="text-center">
                <div 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4"
                  style={{ backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.amber100 }}
                >
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6" style={{ color: themeMode === 'dark' ? colors.amber : colors.amber }} />
                </div>
                <h3 className={`font-semibold text-sm md:text-base mb-1 md:mb-2`} style={{ color: theme.text.primary }}>Set Expectations</h3>
                <p className={`text-xs md:text-sm`} style={{ color: theme.text.secondary }}>
                  Define time commitments and requirements.
                </p>
              </div>
              
              <div className="text-center">
                <div 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4"
                  style={{ backgroundColor: themeMode === 'dark' ? colors.gray800 : colors.indigo100 }}
                >
                  <Globe className="w-5 h-5 md:w-6 md:h-6" style={{ color: themeMode === 'dark' ? colors.orange : colors.orange }} />
                </div>
                <h3 className={`font-semibold text-sm md:text-base mb-1 md:mb-2`} style={{ color: theme.text.primary }}>Be Inclusive</h3>
                <p className={`text-xs md:text-sm`} style={{ color: theme.text.secondary }}>
                  Welcome diverse backgrounds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateOrganizationJobPage;