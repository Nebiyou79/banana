// src/components/organization/OrganizationHero.tsx
import { useState, useEffect } from 'react';
import { Building2, MapPin, Globe, Calendar, Target, Pencil, CheckCircle2, Info, RefreshCw, Loader2 } from 'lucide-react';
import Button from '../forms/Button';
import { getFullImageUrl, getCacheBustUrl, handleImageUpload, getProfileImages } from '@/utils/image-utils';
import { profileService, Profile } from '@/services/profileService';
import { toast } from '@/hooks/use-toast';

interface OrganizationHeroProps {
  profile?: Profile;
  isOwner: boolean;
  onEdit: () => void;
  onProfileUpdate?: (updatedProfile: Profile) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function OrganizationHero({
  profile,
  isOwner,
  onEdit,
  onProfileUpdate,
  onRefresh,
  isLoading = false
}: OrganizationHeroProps) {
  // Debug logging
  useEffect(() => {
    console.log('🔍 OrganizationHero Debug:', {
      hasProfile: !!profile,
      profileUser: profile?.user,
      roleSpecific: profile?.roleSpecific,
      companyInfo: profile?.roleSpecific?.companyInfo,
      userRole: profile?.user?.role,
      isLoading
    });
  }, [profile, isLoading]);

  // Get the organization-specific data from profile's roleSpecific.companyInfo
  const companyInfo = profile?.roleSpecific?.companyInfo || {};

  // Get image URLs from profile
  const { coverPhoto, avatar } = getProfileImages(profile);
  const coverPhotoUrl = getFullImageUrl(coverPhoto);
  const avatarUrl = getFullImageUrl(avatar);

  const [showBannerGuide, setShowBannerGuide] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const getCoverPhotoWithCacheBust = () => {
    return getCacheBustUrl(coverPhotoUrl, refreshKey);
  };

  const getAvatarWithCacheBust = () => {
    return getCacheBustUrl(avatarUrl, refreshKey);
  };

  const handleRefresh = () => {
    console.log('🔄 Refreshing organization hero');
    if (onRefresh) {
      onRefresh();
    }
    setRefreshKey(prev => prev + 1);
  };

  const handleImageUpdate = async (file: File, type: 'avatar' | 'coverPhoto') => {
    if (!file || !isOwner || !profile) {
      console.log('❌ Image update blocked:', { hasFile: !!file, isOwner, hasProfile: !!profile });
      return;
    }

    try {
      setIsUploading(true);
      console.log(`📤 Starting ${type} upload for organization`);

      const result = await handleImageUpload(file, type);

      // Update profile data
      const updateData = type === 'avatar'
        ? { avatar: result.url }
        : { coverPhoto: result.url };

      console.log('📝 Updating profile with:', updateData);

      // Call profileService to update the profile
      const updatedProfile = await profileService.updateProfile(updateData);

      // Notify parent component
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      toast({
        title: 'Success!',
        description: `${type === 'avatar' ? 'Avatar' : 'Banner'} updated successfully`,
      });

      // Refresh images
      setRefreshKey(prev => prev + 1);

      console.log('✅ Image update successful');

    } catch (error: any) {
      console.error('❌ Image update failed:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || `Failed to upload ${type}`,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    console.log('📁 Banner file selected:', file.name, file.type, file.size);
    await handleImageUpdate(file, 'coverPhoto');
    event.target.value = '';
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    console.log('📁 Avatar file selected:', file.name, file.type, file.size);
    await handleImageUpdate(file, 'avatar');
    event.target.value = '';
  };

  // Extract organization data from profile with fallbacks
  const organizationData = {
    name: profile?.user?.name || 'Organization Name',
    verified: profile?.verificationStatus === 'verified',
    organizationType: companyInfo?.companyType || 'Organization',
    industry: companyInfo?.industry || '',
    address: profile?.location || '',
    website: profile?.website || '',
    mission: companyInfo?.mission || '',
    description: profile?.bio || '',
    registrationNumber: '', // This would need to be stored in profile data
    createdAt: profile?.createdAt || new Date().toISOString(),
  };

  const BannerGuideModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ... BannerGuideModal content ... */}
      </div>
    </div>
  );

  // Show loading state
  if (isLoading) {
    console.log('⏳ Showing loading state for OrganizationHero');
    return (
      <div className="relative bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-teal-600 to-teal-800 relative animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
        <div className="pt-12 pb-6 px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no profile
  if (!profile) {
    console.log('📭 Showing empty state for OrganizationHero - no profile');
    return (
      <div className="relative bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-teal-600 to-teal-800 relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Building2 className="w-12 h-12 text-white/80 mb-3" />
            <p className="text-white/80 text-sm">No organization profile found</p>
            <p className="text-white/60 text-xs mt-2">Create or load an organization profile</p>
          </div>
        </div>
        <div className="pt-12 pb-6 px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Not Found</h1>
          <p className="text-gray-600">Please create or load an organization profile.</p>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering OrganizationHero with:', {
    coverPhotoUrl,
    avatarUrl,
    hasCoverPhoto: !!coverPhotoUrl,
    hasAvatar: !!avatarUrl,
    organizationData
  });

  return (
    <div className="relative bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-teal-600 to-teal-800 relative">
        {coverPhotoUrl ? (
          <>
            <img
              src={getCoverPhotoWithCacheBust()}
              alt={`${organizationData.name} banner`}
              className="absolute inset-0 w-full h-full object-cover object-center"
              key={`banner-${refreshKey}`}
              onLoad={() => console.log('✅ Banner loaded successfully:', coverPhotoUrl)}
              onError={(e) => {
                console.error('❌ Banner failed to load:', coverPhotoUrl);
                e.currentTarget.style.display = 'none';
                toast({
                  title: 'Image Load Error',
                  description: 'Failed to load banner image',
                  variant: 'destructive',
                });
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-800 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Building2 className="w-6 h-6 text-white/80" />
            </div>
            <p className="text-white/80 text-sm">No banner image</p>
            {isOwner && (
              <p className="text-white/60 text-xs mt-2">Click "Change Banner" to upload one</p>
            )}
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />

        {/* Refresh button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={handleRefresh}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
            title="Refresh profile"
            disabled={isUploading}
          >
            <RefreshCw className={`w-4 h-4 ${isUploading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Edit Button & Banner Guide */}
        {isOwner && (
          <div className="absolute top-4 right-16 flex gap-2">
            <Button
              onClick={() => setShowBannerGuide(true)}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm hover:bg-white flex items-center gap-2"
              disabled={isUploading}
            >
              <Info className="w-4 h-4" />
              Banner Guide
            </Button>
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm hover:bg-white"
              disabled={isUploading}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        )}

        {/* Avatar/Logo */}
        <div className="absolute -bottom-8 left-8">
          <div className="bg-white rounded-xl p-2 shadow-lg border relative group">
            {avatarUrl ? (
              <>
                <img
                  src={getAvatarWithCacheBust()}
                  alt={`${organizationData.name} logo`}
                  className="w-16 h-16 object-cover rounded-lg"
                  key={`avatar-${refreshKey}`}
                  onLoad={() => console.log('✅ Avatar loaded successfully:', avatarUrl)}
                  onError={(e) => {
                    console.error('❌ Avatar failed to load:', avatarUrl);
                    e.currentTarget.style.display = 'none';
                    toast({
                      title: 'Image Load Error',
                      description: 'Failed to load logo image',
                      variant: 'destructive',
                    });
                  }}
                />
                {isOwner && (
                  <>
                    <label
                      htmlFor="organization-avatar-upload"
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <div className="text-white text-xs font-medium bg-black/70 px-3 py-1.5 rounded backdrop-blur-sm">
                        Change Logo
                      </div>
                    </label>
                    <input
                      id="organization-avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </>
                )}
              </>
            ) : (
              <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center relative">
                <Building2 className="w-8 h-8 text-teal-600" />
                {isOwner && (
                  <>
                    <label
                      htmlFor="organization-avatar-upload"
                      className="absolute inset-0 bg-teal-50 hover:bg-teal-100 rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center"
                    >
                      <div className="text-teal-700 text-xs font-medium bg-white/90 px-3 py-1.5 rounded backdrop-blur-sm">
                        Upload Logo
                      </div>
                    </label>
                    <input
                      id="organization-avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Banner Upload Button */}
        {isOwner && (
          <>
            <label
              htmlFor="organization-banner-upload"
              className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-white text-teal-700 hover:text-teal-800 border border-teal-200 hover:border-teal-300 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all duration-300 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pencil className="w-4 h-4" />
              {isUploading ? 'Uploading...' : 'Change Banner'}
            </label>
            <input
              id="organization-banner-upload"
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="hidden"
              disabled={isUploading}
            />
          </>
        )}
      </div>

      {/* Organization Info */}
      <div className="pt-12 pb-6 px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{organizationData.name}</h1>
              {organizationData.verified && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
              {organizationData.organizationType && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span>{organizationData.organizationType}</span>
                </div>
              )}

              {organizationData.industry && (
                <div className="flex items-center gap-1">
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                    {organizationData.industry}
                  </span>
                </div>
              )}

              {organizationData.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{organizationData.address}</span>
                </div>
              )}

              {organizationData.website && (
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <a
                    href={organizationData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    Website
                  </a>
                </div>
              )}
            </div>

            {/* Mission Statement */}
            {organizationData.mission && (
              <div className="mb-4 p-4 bg-teal-50 rounded-lg border border-teal-100">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-900">Our Mission</span>
                </div>
                <p className="text-gray-700 leading-relaxed italic">
                  {organizationData.mission}
                </p>
              </div>
            )}

            {organizationData.description && (
              <p className="text-gray-700 leading-relaxed max-w-3xl">
                {organizationData.description}
              </p>
            )}
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(organizationData.createdAt).toLocaleDateString()}</span>
              </div>
              {organizationData.registrationNumber && (
                <div className="text-sm text-gray-500 mt-1">
                  Reg: {organizationData.registrationNumber}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Banner Guide Modal */}
      {showBannerGuide && <BannerGuideModal />}
    </div>
  );
}