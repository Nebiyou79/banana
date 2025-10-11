// pages/dashboard/organization/profile.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService, OrganizationProfile } from '@/services/organizationService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OrganizationForm } from '@/components/organization/OrganizationForm';
import { OrganizationHero } from '@/components/organization/OrganizationHero';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Building, 
  CheckCircle,
  AlertCircle,
  Edit3,
  Download,
  Shield,
  Users,
  Target
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const OrganizationProfilePage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);

  // ✅ UPDATED: Enhanced organization profile fetching with better error handling
  const { 
    data: organization, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['organizationProfile'],
    queryFn: async () => {
      const org = await organizationService.getMyOrganization();
      console.log('[OrganizationProfile] Fetched organization:', org);
      return org;
    },
    enabled: !!user && user.role === 'organization',
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ✅ UPDATED: Enhanced update mutation with better error handling
  const updateMutation = useMutation({
    mutationFn: (data: Partial<OrganizationProfile>) =>
      organizationService.updateMyOrganization(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['organizationProfile'] });
      setEditMode(false);
      toast({
        title: 'Profile updated successfully!',
        description: 'Your organization profile has been updated.',
        variant: 'default',
      });
      console.log('[OrganizationProfile] Profile updated successfully:', response);
    },
    onError: (error: any) => {
      console.error('[OrganizationProfile] Profile update error:', error);
      toast({
        title: 'Failed to update profile',
        description: error.message || 'Please check the form and try again.',
        variant: 'destructive',
      });
    },
  });

  const handleProfileUpdate = (updatedOrganization: OrganizationProfile) => {
    console.log('[OrganizationProfile] Updating profile:', updatedOrganization);
    updateMutation.mutate(updatedOrganization);
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // ✅ UPDATED: Better error handling and create flow
  if (error || !organization) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <Link 
                href="/dashboard/organization"
                className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create Organization Profile
              </h1>
              <p className="text-gray-600">
                Set up your organization profile to start posting opportunities
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700">
                    {error instanceof Error ? error.message : 'Failed to load organization profile'}
                  </p>
                </div>
                <button
                  onClick={handleRetry}
                  className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            )}

            <OrganizationForm 
              mode="create"
              onSubmit={handleProfileUpdate}
              // isLoading={updateMutation.isPending}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (editMode) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Edit Organization Profile
              </h1>
              <p className="text-gray-600">
                Update your organization information and settings
              </p>
            </div>

            <OrganizationForm
              organization={organization}
              mode="edit"
              onSubmit={handleProfileUpdate}
              // onCancel={handleCancelEdit}
              // isLoading={updateMutation.isPending}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <Link 
                  href="/dashboard/organization"
                  className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                  Organization Profile
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage your organization information and settings
                </p>
              </div>
              <button
                onClick={handleEdit}
                className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-semibold flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        <OrganizationHero
          organization={organization}
          onEdit={handleEdit}
          showEditButton={false}
        />
        
        {/* Additional Profile Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Organization Details Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Organization Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-teal-600" />
                      Basic Information
                    </h3>
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm text-gray-600">Organization Type</dt>
                        <dd className="font-medium text-gray-900">
                          {organization.organizationType ? 
                            organizationService.getOrganizationTypeLabel(organization.organizationType)
                            : 'Not specified'
                          }
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Industry</dt>
                        <dd className="font-medium text-gray-900">
                          {organization.industry || 'Not specified'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Registration Number</dt>
                        <dd className="font-medium text-gray-900">
                          {organization.registrationNumber || 'Not specified'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-teal-600" />
                      Contact Information
                    </h3>
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm text-gray-600">Phone</dt>
                        <dd className="font-medium text-gray-900">
                          {organization.phone || 'Not specified'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Website</dt>
                        <dd className="font-medium text-gray-900">
                          {organization.website ? (
                            <a 
                              href={organization.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-teal-600 hover:text-teal-700 hover:underline"
                            >
                              {organization.website}
                            </a>
                          ) : 'Not specified'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Address</dt>
                        <dd className="font-medium text-gray-900">
                          {organization.address || 'Not specified'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Mission & Description Card */}
              {(organization.description || organization.mission) && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-teal-600" />
                    About Our Organization
                  </h2>
                  
                  {organization.description && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {organization.description}
                      </p>
                    </div>
                  )}
                  
                  {organization.mission && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Mission</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {organization.mission}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Verification Status Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-teal-600" />
                  Verification Status
                </h3>
                <div className={`p-4 rounded-lg border ${
                  organization.verified 
                    ? 'bg-teal-50 border-teal-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      organization.verified ? 'bg-teal-500' : 'bg-orange-500'
                    }`}>
                      {organization.verified ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${
                        organization.verified ? 'text-teal-700' : 'text-orange-700'
                      }`}>
                        {organization.verified ? 'Verified Organization' : 'Pending Verification'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {organization.verified 
                          ? 'Your organization has been verified' 
                          : 'Your verification is under review'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleEdit}
                    className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 bg-teal-600 hover:bg-teal-700 transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                  
                  <button className="w-full py-3 px-4 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export Profile</span>
                  </button>

                  <Link href="/dashboard/organization/jobs/create">
                    <button className="w-full py-3 px-4 rounded-lg font-semibold border border-teal-300 text-teal-600 bg-teal-50 hover:bg-teal-100 transition-all duration-200 flex items-center justify-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>Create Opportunity</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationProfilePage;