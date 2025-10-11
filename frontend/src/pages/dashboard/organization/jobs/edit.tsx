// pages/dashboard/organization/jobs/edit.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  AlertCircle,
  Eye,
  BarChart3,
  Calendar,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const EditOpportunityPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch job data
  const { 
    data: job, 
    isLoading: jobLoading, 
    error: jobError 
  } = useQuery({
    queryKey: ['organizationJob', id],
    queryFn: () => jobService.getJob(id as string),
    enabled: !!id && !!user,
  });

  // Update job mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Job> }) =>
      jobService.updateJob(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['organizationJob', id] });
      queryClient.invalidateQueries({ queryKey: ['organizationJobs'] });
      
      toast({
        title: 'Opportunity updated successfully!',
        description: 'Your changes have been saved and the opportunity has been updated.',
        variant: 'default',
      });
      
      // Redirect to opportunity details page after successful update
      setTimeout(() => {
        router.push(`/dashboard/organization/jobs/${id}`);
      }, 1500);
    },
    onError: (error: any) => {
      console.error('Opportunity update error:', error);
      toast({
        title: 'Failed to update opportunity',
        description: error.message || 'Please check the form and try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (data: Partial<Job>) => {
    if (id) {
      await updateMutation.mutateAsync({ id: id as string, data });
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/organization/jobs/${id}`);
  };

  if (jobLoading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Loading opportunity details...</h2>
            <p className="text-gray-600 mt-2">Preparing the editing form.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (jobError || !job) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md border border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Opportunity Not Found</h1>
            <p className="text-gray-600 mb-6">
              The opportunity you`re trying to edit doesn`t exist or you don`t have permission to access it.
            </p>
            <Link
              href="/dashboard/organization/jobs"
              className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-semibold inline-block"
            >
              Back to Opportunities
            </Link>
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
                  href={`/dashboard/organization/jobs/${id}`}
                  className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Opportunity Details
                </Link>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  Edit Opportunity
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl">
                  Update your opportunity to keep it current and attractive to candidates.
                </p>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Opportunity Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Views</div>
                    <div className="text-lg font-semibold text-gray-900">{job.viewCount || 0}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Applications</div>
                    <div className="text-lg font-semibold text-gray-900">{job.applicationCount || 0}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Status</div>
                    <div className="text-lg font-semibold text-gray-900 capitalize">{job.status}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Location</div>
                    <div className="text-lg font-semibold text-gray-900">{job.location.city}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Opportunity Info */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Opportunity Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Opportunity Title</h3>
                <p className="text-gray-600">{job.title}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Organization</h3>
                <p className="text-gray-600">{job.company.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Opportunity Type</h3>
                <p className="text-gray-600 capitalize">{job.type.replace('-', ' ')}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Experience Level</h3>
                <p className="text-gray-600 capitalize">{job.experienceLevel.replace('-', ' ')}</p>
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
                    Organization Verification Recommended
                  </h3>
                  <p className="text-yellow-700">
                    Verify your organization to unlock premium features and increase candidate trust. 
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
              initialData={job}
              onSubmit={handleSubmit}
              loading={updateMutation.isPending}
              onCancel={handleCancel}
            //   organizationVerified={user?.organizationVerified || false}
              mode="edit"
            />
          </div>

          {/* Update Tips */}
          <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Best Practices for Opportunity Updates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Keep Information Current</h3>
                <p className="text-sm text-gray-600">
                  Regularly update requirements, responsibilities, and application deadlines.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Monitor Performance</h3>
                <p className="text-sm text-gray-600">
                  Track views and applications to optimize your opportunity strategy.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Refresh Regularly</h3>
                <p className="text-sm text-gray-600">
                  Update postings every 2-4 weeks to maintain visibility in search results.
                </p>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-teal-50 rounded-xl border border-teal-200">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-teal-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-teal-900 mb-1">Pro Tip</h4>
                  <p className="text-teal-800 text-sm">
                    Consider creating a new opportunity instead of editing if you`re making significant changes 
                    to the role or requirements. This can help attract fresh candidates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditOpportunityPage;