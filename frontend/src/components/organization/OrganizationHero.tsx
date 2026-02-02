// src/components/organization/OrganizationHero.tsx
import { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Globe,
  Calendar,
  Target,
  Pencil,
  CheckCircle2,
  Info,
  RefreshCw,
  Loader2,
  Cloud,
  Check
} from 'lucide-react';
import Button from '../forms/Button';
import { profileService, Profile, CloudinaryImage } from '@/services/profileService';
import { toast } from 'sonner';
import { AvatarUploader } from '@/components/profile/AvatarUploader';

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

  // Get image URLs using profileService
  const getCoverPhoto = (): string | CloudinaryImage | null => {
    if (!profile) return null;
    return profile.cover || null;
  };

  const getAvatar = (): string | CloudinaryImage | null => {
    if (!profile) return null;
    return profile.avatar || null;
  };

  const coverPhoto = getCoverPhoto();
  const avatar = getAvatar();

  const [showBannerGuide, setShowBannerGuide] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const handleRefresh = () => {
    console.log('🔄 Refreshing organization hero');
    if (onRefresh) {
      onRefresh();
    }
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Banner Upload Guide
            </h2>
            <button
              onClick={() => setShowBannerGuide(false)}
              className="p-2 hover:bg-white rounded-xl transition-all duration-200 hover:scale-110"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl overflow-hidden border-2 border-dashed border-blue-300 relative shadow-lg">
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-500 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-yellow-400 border-dashed w-[60%] h-[60%] flex items-center justify-center bg-yellow-400/10 backdrop-blur-sm">
                  <span className="text-yellow-400 font-bold text-lg bg-black/70 px-4 py-3 rounded-xl shadow-lg">
                    Safe Area (1546×423px)
                  </span>
                </div>
              </div>

              <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                📏 2560px
              </div>
              <div className="absolute top-3 right-3 bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                📐 1440px
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <span className="p-2 bg-blue-100 rounded-lg">📐</span>
                Technical Requirements
              </h3>
              <ul className="space-y-3 text-gray-700">
                {[
                  { text: 'Dimensions: 2560 × 1440 pixels', icon: '📏' },
                  { text: 'Format: JPG, PNG, or WebP', icon: '🖼️' },
                  { text: 'Max Size: 10MB', icon: '💾' },
                  { text: 'Safe Area: Keep important content within 1546×423px center', icon: '🎯' }
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <span className="p-2 bg-green-100 rounded-lg">💡</span>
                Best Practices
              </h3>
              <ul className="space-y-3 text-gray-700">
                {[
                  { text: 'Use high-quality, professional images', icon: '⭐' },
                  { text: 'Brand colors that match your logo', icon: '🎨' },
                  { text: 'Avoid important content near edges', icon: '⚠️' },
                  { text: 'Optimize for fast loading', icon: '⚡' }
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
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
    coverPhoto,
    avatar,
    hasCoverPhoto: !!coverPhoto,
    hasAvatar: !!avatar,
    organizationData
  });

  return (
    <div className="relative bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-teal-600 to-teal-800 relative">
        {coverPhoto ? (
          <img
            src={typeof coverPhoto === 'string' ? coverPhoto : coverPhoto.secure_url}
            alt={`${organizationData.name} banner`}
            className="absolute inset-0 w-full h-full object-cover object-center"
            onLoad={() => console.log('✅ Banner loaded successfully')}
            onError={(e) => {
              console.error('❌ Banner failed to load');
              e.currentTarget.style.display = 'none';
              toast.error('Failed to load banner image', {
                description: 'Please try refreshing the page',
              });
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-800 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Building2 className="w-6 h-6 text-white/80" />
            </div>
            <p className="text-white/80 text-sm">No banner image</p>
            {isOwner && (
              <p className="text-white/60 text-xs mt-2">Upload a banner to customize your profile</p>
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
          <div className="absolute top-4 right-16 flex gap-2 z-10">
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
            {avatar ? (
              <img
                src={typeof avatar === 'string' ? avatar : avatar.secure_url}
                alt={`${organizationData.name} logo`}
                className="w-16 h-16 object-cover rounded-lg"
                onLoad={() => console.log('✅ Logo loaded successfully')}
                onError={(e) => {
                  console.error('❌ Logo failed to load');
                  e.currentTarget.style.display = 'none';
                  toast.error('Failed to load logo image', {
                    description: 'Please try refreshing the page',
                  });
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center relative">
                <Building2 className="w-8 h-8 text-teal-600" />
              </div>
            )}
          </div>
        </div>

        {/* Upload Avatar/Cover using AvatarUploader (hidden but accessible)
        {isOwner && (
          <div className="absolute bottom-4 right-4 flex gap-2 z-20">
            <AvatarUploader
              currentAvatar={avatar}
              currentCover={coverPhoto}
              onAvatarComplete={handleAvatarComplete}
              onCoverComplete={handleCoverComplete}
              onError={handleUploadError}
              size="sm"
              type="both"
              showHelperText={false}
              maxFileSize={{
                avatar: 5,
                cover: 10
              }}
              allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              aspectRatio={{
                avatar: '1:1',
                cover: '16:9'
              }}
            />
          </div>
        )} */}
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

      {/* Cloud Storage Status */}
      {(avatarUploading || coverUploading) && (
        <div className="absolute bottom-4 left-4 bg-teal-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg z-20">
          <Cloud className="w-4 h-4 animate-pulse" />
          <span>Uploading to cloud...</span>
        </div>
      )}
    </div>
  );
}