/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/organization/profile.tsx - UPDATED FOR PROFILE-SERVICE HERO
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService, OrganizationProfile } from '@/services/organizationService';
import { profileService, Profile, UpdateProfileData } from '@/services/profileService'; // ADDED PROFILE SERVICE
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import OrganizationForm from '@/components/organization/OrganizationForm';
import OrganizationHero from '@/components/organization/OrganizationHero'; // This now uses profileService
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
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const OrganizationProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);

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

  // Update mutation for organization data
  const updateOrgMutation = useMutation({
    mutationFn: (data: Partial<OrganizationProfile>) =>
      organizationService.updateMyOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationProfile'] });
      setEditMode(false);
    },
    onError: (error: any) => {
      console.error('Update mutation error:', error);
    },
  });

  // Update mutation for user profile (for avatar/cover photo)
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => profileService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error: any) => {
      console.error('Profile update mutation error:', error);
    },
  });

  const handleProfileUpdate = async (data: any) => {
    try {
      // Handle file uploads if files are present
      if (data.logoFile || data.bannerFile) {
        const updateData: UpdateProfileData = {};

        // Upload logo if new file is provided (now goes to profile avatar)
        if (data.logoFile) {
          try {
            const logoResponse = await profileService.uploadAvatar(data.logoFile);
            updateData.avatar = logoResponse.avatarUrl;
          } catch (error) {
            console.error('Logo upload error:', error);
            // Continue with the update even if logo upload fails
          }
        }

        // Upload banner if new file is provided (now goes to profile cover photo)
        if (data.bannerFile) {
          try {
            const bannerResponse = await profileService.uploadCoverPhoto(data.bannerFile);
            updateData.coverPhoto = bannerResponse.coverPhotoUrl;
          } catch (error) {
            console.error('Banner upload error:', error);
            // Continue with the update even if banner upload fails
          }
        }

        // Update user profile with new avatar/cover photo
        if (Object.keys(updateData).length > 0) {
          await updateProfileMutation.mutateAsync(updateData);
        }
      }

      // Prepare organization data for update - create a clean object without file properties
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

      console.log('Submitting organization data:', orgUpdateData);

      await updateOrgMutation.mutateAsync(orgUpdateData);
    } catch (error: any) {
      console.error('Profile update error:', error);
    }
  };

  const handleEdit = () => {
    try {
      setEditMode(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to open edit mode',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    try {
      setEditMode(false);
      toast({
        title: 'Edit Cancelled',
        description: 'Your changes were not saved',
        variant: 'info',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to cancel edit',
        variant: 'destructive',
      });
    }
  };

  const handleRetry = () => {
    try {
      refetchOrg();
      refetchProfile();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to retry loading profile',
        variant: 'destructive',
      });
    }
  };

  const handleProfileUpdateFromHero = (updatedProfile: Profile) => {
    // This is called when the Hero component updates the profile (avatar/cover photo)
    // We can refetch the profile to get the latest data
    refetchProfile();
  };

  // Handle query errors with toast
  useEffect(() => {
    if (orgError || profileError) {
      toast({
        title: 'Load Error',
        description: 'Failed to load organization profile',
        variant: 'destructive',
      });
    }
  }, [orgError, profileError]);

  const isLoading = orgLoading || profileLoading;
  const hasError = orgError || profileError;
  const hasData = organization && userProfile;

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Create organization flow
  if (hasError || !hasData) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/dashboard/organization"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Create Organization Profile
                </h1>
                <p className="text-gray-600">
                  Set up your organization profile to start posting opportunities
                </p>
              </div>
            </div>

            <OrganizationForm
              organization={null}
              onSubmit={handleProfileUpdate}
              onCancel={() => window.history.back()}
              loading={updateOrgMutation.isPending || updateProfileMutation.isPending}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Edit mode
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
                Back to Profile
              </button>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Edit Organization Profile
                </h1>
                <p className="text-gray-600">
                  Update your organization information and settings
                </p>
              </div>
            </div>

            <OrganizationForm
              organization={organization}
              onSubmit={handleProfileUpdate}
              onCancel={handleCancelEdit}
              loading={updateOrgMutation.isPending || updateProfileMutation.isPending}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // View mode
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
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hero Section - NOW USING PROFILE-SERVICE BASED HERO */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <OrganizationHero
            profile={userProfile} // Pass userProfile instead of organization
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
                      <Building2 className="w-5 h-5 mr-2 text-blue-600" />
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
                      <Users className="w-5 h-5 mr-2 text-blue-600" />
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
                          <dd className="font-medium text-blue-600">
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
                    <Target className="w-5 h-5 mr-2 text-blue-600" />
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
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
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
                    className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>

                  <button className="w-full py-3 px-4 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export Profile</span>
                  </button>

                  <Link href="/dashboard/organization/jobs/create">
                    <button className="w-full py-3 px-4 rounded-lg font-semibold border border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-200 flex items-center justify-center space-x-2">
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