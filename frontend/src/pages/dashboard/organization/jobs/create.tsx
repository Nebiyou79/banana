// pages/dashboard/organization/jobs/create.tsx
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
  Target, 
  CheckCircle,
  Rocket,
  Users,
  TrendingUp,
  Lightbulb
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const CreateOpportunityPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOpportunity, setCreatedOpportunity] = useState<Job | null>(null);

  // Create job mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Job>) => jobService.createJob(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['organizationJobs'] });
      setCreatedOpportunity(response);
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

  const handleSubmit = async (data: Partial<Job>) => {
    await createMutation.mutateAsync(data);
  };

  const handleViewOpportunity = () => {
    if (createdOpportunity) {
      router.push(`/dashboard/organization/jobs/${createdOpportunity._id}`);
    }
  };

  const handleCreateAnother = () => {
    setShowSuccess(false);
    setCreatedOpportunity(null);
    window.scrollTo(0, 0);
  };

  if (createMutation.isPending) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Creating your opportunity...</h2>
            <p className="text-gray-600 mt-2">This will just take a moment.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (showSuccess && createdOpportunity) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Success Header */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Opportunity Created Successfully!
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Your opportunity for <strong>`{createdOpportunity.title}`</strong> is now live and visible to qualified candidates.
              </p>
            </div>

            {/* Success Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-200 text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-teal-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">Active</div>
                <div className="text-gray-600">Opportunity Status</div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-200 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">0</div>
                <div className="text-gray-600">Applications</div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-200 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">Live</div>
                <div className="text-gray-600">Visible to Candidates</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={handleViewOpportunity}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-4 px-6 rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg flex items-center justify-center gap-3"
                >
                  <Target className="w-5 h-5" />
                  View Opportunity
                </button>
                
                <button
                  onClick={handleCreateAnother}
                  className="w-full bg-white text-gray-700 border-2 border-gray-300 py-4 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold text-lg flex items-center justify-center gap-3"
                >
                  <Rocket className="w-5 h-5" />
                  Create Another Opportunity
                </button>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    Monitor applications in your dashboard
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    Share the opportunity link with your network
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    Review and respond to applicants promptly
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 text-center">
              <Link 
                href="/dashboard/organization/jobs"
                className="text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Opportunities Management
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Link 
                  href="/dashboard/organization/jobs"
                  className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Opportunities
                </Link>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  Create New Opportunity
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl">
                  Fill in the details below to create an attractive opportunity that will reach qualified candidates.
                </p>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="text-sm font-medium text-gray-600">Step-by-Step</div>
                <div className="text-lg font-semibold text-gray-900">4 Easy Steps</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="text-sm font-medium text-gray-600">Save Progress</div>
                <div className="text-lg font-semibold text-gray-900">Draft Available</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="text-sm font-medium text-gray-600">Preview</div>
                <div className="text-lg font-semibold text-gray-900">Live Preview</div>
              </div>
            </div>
          </div>

          {/* Verification Notice
          {!user?.organizationVerified && (
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Organization Verification Required
                  </h3>
                  <p className="text-yellow-700">
                    Your organization profile is not yet verified. This opportunity will be published immediately but may require 
                    additional verification for premium features. 
                    <Link href="/dashboard/organization/profile" className="font-semibold underline ml-1">
                      Complete verification
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )} */}

          {/* Job Form */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <JobForm
              onSubmit={handleSubmit}
              loading={createMutation.isPending}
            //   organizationVerified={user?.organizationVerified || false}
              mode="create"
            />
          </div>

          {/* Help Section */}
          <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Tips for Creating Great Opportunities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Be Specific</h3>
                <p className="text-sm text-gray-600">
                  Use clear opportunity titles and detailed descriptions to attract the right candidates.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Highlight Impact</h3>
                <p className="text-sm text-gray-600">
                  Showcase your organization`s mission and the impact of this opportunity.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Set Realistic Requirements</h3>
                <p className="text-sm text-gray-600">
                  Balance must-have skills with nice-to-have qualifications.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Use Keywords</h3>
                <p className="text-sm text-gray-600">
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

export default CreateOpportunityPage;