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
  AlertCircle,
  Eye,
  Calendar,
  MapPin,
  Building2,
  Users,
  Clock,
  Heart
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
      jobService.updateOrganizationJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationJob', id] });
      queryClient.invalidateQueries({ queryKey: ['organizationJobs'] });
      
      toast({
        title: 'Opportunity updated successfully!',
        description: 'Your changes have been saved and the opportunity has been updated.',
        variant: 'default',
      });
      
      // Redirect to opportunity details page after successful update
      router.push(`/dashboard/organization/jobs/${id}`);
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
      // Ensure jobType remains as organization
      const jobData: Partial<Job> = {
        ...data,
        jobType: 'organization' as const,
      };
      await updateMutation.mutateAsync({ id: id as string, data: jobData });
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/organization/jobs/${id}`);
  };

  if (jobLoading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
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
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold inline-block"
            >
              Back to Opportunities
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const ownerName = jobService.getOwnerName(job);
  const jobTypeLabel = jobService.getJobTypeDisplayLabel(job);
  const opportunityTypeBadge = job.opportunityType && job.opportunityType !== 'job' ? 
    jobService.getOpportunityTypes().find(opt => opt.value === job.opportunityType)?.label : null;

  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1">
                <Link 
                  href={`/dashboard/organization/jobs/${id}`}
                  className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Opportunity Details
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Edit {jobTypeLabel}
                </h1>
                <p className="text-lg text-gray-600">
                  Update your {jobTypeLabel.toLowerCase()} to keep it current and attractive to candidates.
                </p>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Current Opportunity Overview */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-200 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h2>
                  <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {ownerName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location.city}, {jobService.getEthiopianRegions().find(r => r.slug === job.location.region)?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {jobService.getJobTypeLabel(job.type)}
                    </span>
                    {opportunityTypeBadge && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        {opportunityTypeBadge}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      job.status === 'active' ? 'bg-green-100 text-green-800' :
                      job.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      job.status === 'paused' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mx-auto mb-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-lg font-semibold text-gray-900">{job.viewCount || 0}</div>
                <div className="text-xs text-gray-600">Views</div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mx-auto mb-2">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-lg font-semibold text-gray-900">{job.applicationCount || 0}</div>
                <div className="text-xs text-gray-600">Applications</div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mx-auto mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm font-semibold text-gray-900 capitalize">{job.status}</div>
                <div className="text-xs text-gray-600">Status</div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg mx-auto mb-2">
                  {job.volunteerInfo ? <Heart className="w-5 h-5 text-orange-600" /> : <Clock className="w-5 h-5 text-orange-600" />}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {job.volunteerInfo ? 'Volunteer' : jobService.getJobTypeLabel(job.type)}
                </div>
                <div className="text-xs text-gray-600">Type</div>
              </div>
            </div>
          </div>

          {/* Job Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <JobForm
              initialData={job}
              onSubmit={handleSubmit}
              loading={updateMutation.isPending}
              onCancel={handleCancel}
              mode="edit"
              jobType="organization"
            />
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-purple-50 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-purple-900 mb-1">Editing Tips</h4>
                <p className="text-purple-800 text-sm">
                  Keep your opportunity posting up-to-date with current requirements and details. 
                  Regular updates help maintain visibility and attract the right candidates for your cause.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditOpportunityPage;