// pages/dashboard/organization/profile.tsx - UPDATED FOR CREATE/UPDATE LOGIC
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService, OrganizationProfile } from '@/services/organizationService';
import { profileService, Profile, CloudinaryImage } from '@/services/profileService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import OrganizationForm from '@/components/organization/OrganizationForm';
import OrganizationHero from '@/components/organization/OrganizationHero';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Download,
  Shield,
  Users,
  Target,
  Phone,
  Plus,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

const OrganizationProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);

  // Fetch organization profile (for organization-specific data)
  const {
    data: organization,
    isLoading: orgLoading,
    error: orgError,
    refetch: refetchOrg
  } = useQuery({
    queryKey: ['organizationProfile'],
    queryFn: () => organizationService.getMyOrganization(),
    enabled: !!user && user.role === 'organization',
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user profile (for avatar and cover photo)
  const {
    data: userProfile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => profileService.getProfile(),
    enabled: !!user,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: (data: Partial<OrganizationProfile>) =>
      organizationService.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationProfile'] });
      setEditMode(false);
      setIsCreateMode(false);
      toast.success('Organization profile created successfully!');
    },
    onError: (error: any) => {
      console.error('Create mutation error:', error);
      toast.error('Failed to create organization profile', {
        description: error.message || 'Please try again',
      });
    },
  });

  // Update organization mutation
  const updateOrgMutation = useMutation({
    mutationFn: (data: Partial<OrganizationProfile>) =>
      organizationService.updateMyOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationProfile'] });
      setEditMode(false);
      toast.success('Organization profile updated successfully!');
    },
    onError: (error: any) => {
      console.error('Update mutation error:', error);
      toast.error('Failed to update organization profile', {
        description: error.message || 'Please try again',
      });
    },
  });

  const handleProfileUpdate = async (data: any, isCreate: boolean) => {
    try {
      console.log('Submitting organization data:', data);
      console.log('Mode:', isCreate ? 'CREATE' : 'UPDATE');

      // Prepare organization data for update - create a clean object
      const orgUpdateData: Partial<OrganizationProfile> = {
        name: data.name,
        registrationNumber: data.registrationNumber,
        organizationType: data.organizationType,
        industry: data.industry,
        description: data.description,
        mission: data.mission,
        address: data.address,
        phone: data.phone,
        secondaryPhone: data.secondaryPhone,
        website: data.website,
      };

      // Clean up empty strings by converting to undefined
      Object.keys(orgUpdateData).forEach(key => {
        const value = (orgUpdateData as any)[key];
        if (value === '' || value === null) {
          (orgUpdateData as any)[key] = undefined;
        }
      });

      console.log('Final organization data:', orgUpdateData);

      if (isCreate) {
        await createOrgMutation.mutateAsync(orgUpdateData);
      } else {
        await updateOrgMutation.mutateAsync(orgUpdateData);
      }

      // Refresh profile data
      await refetchProfile();

    } catch (error: any) {
      console.error('Profile update error:', error);
      throw error; // Re-throw to be handled by the form
    }
  };

  const handleEdit = () => {
    try {
      setEditMode(true);
      setIsCreateMode(false);
    } catch (error) {
      toast.error('Unable to open edit mode');
    }
  };

  const handleCreate = () => {
    try {
      setEditMode(true);
      setIsCreateMode(true);
    } catch (error) {
      toast.error('Unable to open create mode');
    }
  };

  const handleCancelEdit = () => {
    try {
      setEditMode(false);
      setIsCreateMode(false);
      toast.info('Edit cancelled', {
        description: 'Your changes were not saved',
      });
    } catch (error) {
      toast.error('Unable to cancel edit');
    }
  };

  const handleRetry = () => {
    try {
      refetchOrg();
      refetchProfile();
    } catch (error) {
      toast.error('Unable to retry loading profile');
    }
  };

  const handleProfileUpdateFromHero = (updatedProfile: Profile) => {
    // This is called when the Hero component updates the profile (avatar/cover photo)
    refetchProfile();
  };

  // Handle query errors
  useEffect(() => {
    if (orgError || profileError) {
      toast.error('Failed to load organization profile');
    }
  }, [orgError, profileError]);

  const isLoading = orgLoading || profileLoading;
  const hasError = orgError || profileError;
  const hasOrganization = !!organization;
  const hasUserProfile = !!userProfile;

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Edit/Create mode
  if (editMode) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {hasOrganization ? 'Profile' : 'Dashboard'}
              </button>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {isCreateMode ? 'Create Organization Profile' : 'Edit Organization Profile'}
                </h1>
                <p className="text-gray-600">
                  {isCreateMode
                    ? 'Fill in your organization details to get started'
                    : 'Update your organization information and settings'}
                </p>
              </div>
            </div>

            <OrganizationForm
              organization={isCreateMode ? null : organization}
              onSubmit={(data) => handleProfileUpdate(data, isCreateMode)}
              onCancel={handleCancelEdit}
              loading={isCreateMode ? createOrgMutation.isPending : updateOrgMutation.isPending}
              currentAvatar={userProfile?.avatar as CloudinaryImage | null | undefined}
              currentCover={userProfile?.cover as CloudinaryImage | null | undefined}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // No organization profile exists - show create prompt
  if (!hasOrganization) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <Link
                    href="/dashboard/organization"
                    className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium mb-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Link>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Organization Profile
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Set up your organization profile to start posting opportunities
                  </p>
                </div>
                <button
                  onClick={handleCreate}
                  className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-semibold flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Profile</span>
                </button>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-12 h-12 text-teal-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No Organization Profile Yet
              </h2>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                Create your organization profile to showcase your mission, post opportunities,
                and connect with volunteers and supporters.
              </p>
              <button
                onClick={handleCreate}
                className="bg-teal-600 text-white px-8 py-3 rounded-lg hover:bg-teal-700 transition-colors font-semibold flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Create Organization Profile</span>
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // View mode - Organization exists
  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <Link
                  href="/dashboard/organization"
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium mb-2 transition-colors"
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

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <OrganizationHero
            profile={userProfile}
            isOwner={true}
            onEdit={handleEdit}
            onProfileUpdate={handleProfileUpdateFromHero}
            onRefresh={() => {
              refetchProfile();
              refetchOrg();
            }}
            isLoading={profileLoading}
          />
        </div>

        {/* Additional Profile Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Organization Details Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Organization Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Building2 className="w-5 h-5 mr-2 text-teal-600" />
                      Basic Information
                    </h3>
                    <dl className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <dt className="text-sm text-gray-600">Organization Type</dt>
                        <dd className="font-medium text-gray-900">
                          {organization.organizationType ?
                            organizationService.getOrganizationTypeLabel(organization.organizationType)
                            : 'Not specified'
                          }
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <dt className="text-sm text-gray-600">Industry</dt>
                        <dd className="font-medium text-gray-900">
                          {organization.industry || 'Not specified'}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
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
                      {organization.phone && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <dt className="text-sm text-gray-600 flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            Primary Phone
                          </dt>
                          <dd className="font-medium text-gray-900">
                            {organization.phone}
                          </dd>
                        </div>
                      )}
                      {organization.secondaryPhone && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <dt className="text-sm text-gray-600 flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            Secondary Phone
                          </dt>
                          <dd className="font-medium text-gray-900">
                            {organization.secondaryPhone}
                          </dd>
                        </div>
                      )}
                      {organization.website && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <dt className="text-sm text-gray-600">Website</dt>
                          <dd className="font-medium text-teal-600">
                            <a
                              href={organization.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {organization.website}
                            </a>
                          </dd>
                        </div>
                      )}
                      {organization.address && (
                        <div className="flex justify-between items-start py-2 border-b border-gray-100">
                          <dt className="text-sm text-gray-600">Address</dt>
                          <dd className="font-medium text-gray-900 text-right">
                            {organization.address}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>

              {/* Mission & Description Card */}
              {(organization.description || organization.mission) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-teal-600" />
                    About Our Organization
                  </h2>

                  {organization.description && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {organization.description}
                      </p>
                    </div>
                  )}

                  {organization.mission && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Mission</h3>
                      <p className="text-gray-700 leading-relaxed italic">
                        {organization.mission}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Verification Status Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-teal-600" />
                  Verification Status
                </h3>
                <div className={`p-4 rounded-lg border ${organization.verified
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
                  }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${organization.verified ? 'bg-green-500' : 'bg-yellow-500'
                      }`}>
                      {organization.verified ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className={`font-semibold ${organization.verified ? 'text-green-700' : 'text-yellow-700'
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleEdit}
                    className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 bg-teal-600 hover:bg-teal-700 flex items-center justify-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>

                  <button className="w-full py-3 px-4 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export Profile</span>
                  </button>

                  <Link href="/dashboard/organization/opportunities/create">
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