// components/company/CompanyHero.tsx
import { useState } from 'react';
import {
  Building2,
  MapPin,
  Globe,
  Calendar,
  Pencil,
  Info,
  Star,
  Award,
  RefreshCw,
  Loader2,
  Cloud,
  Upload,
  Check
} from 'lucide-react';
import Button from '../forms/Button';
import { profileService, Profile, CloudinaryImage } from '@/services/profileService';
import { toast } from 'sonner';
import { AvatarUploader } from '@/components/profile/AvatarUploader';

interface CompanyHeroProps {
  profile?: Profile | null;
  isOwner: boolean;
  onEdit: () => void;
  onProfileUpdate?: (updatedProfile: Profile) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function CompanyHero({
  profile,
  isOwner,
  onEdit,
  onProfileUpdate,
  onRefresh,
  isLoading = false
}: CompanyHeroProps) {
  const safeProfile = profile === null ? undefined : profile;
  const companyInfo = safeProfile?.roleSpecific?.companyInfo;
  const [showBannerGuide, setShowBannerGuide] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // Get image URLs using profileService helpers
  const getCoverPhoto = (): string | CloudinaryImage | null => {
    if (!safeProfile) return null;
    return safeProfile.cover || null;
  };

  const getAvatar = (): string | CloudinaryImage | null => {
    if (!safeProfile) return null;
    return safeProfile.avatar || null;
  };

  const coverPhoto = getCoverPhoto();
  const avatar = getAvatar();

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  // Extract company data from profile with fallbacks
  const companyData = {
    name: safeProfile?.user?.name || 'Company Name',
    verified: safeProfile?.verificationStatus === 'verified',
    industry: companyInfo?.industry || '',
    address: safeProfile?.location || '',
    website: safeProfile?.website || '',
    description: safeProfile?.bio || '',
    createdAt: safeProfile?.createdAt || new Date().toISOString(),
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
  if (isLoading || !safeProfile) {
    return (
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden backdrop-blur-sm">
        <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin mb-3" />
            <p className="text-white/80 text-sm">Loading company profile...</p>
          </div>
        </div>
        <div className="pt-10 pb-8 px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden backdrop-blur-sm">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        {coverPhoto ? (
          <img
            src={typeof coverPhoto === 'string' ? coverPhoto : coverPhoto.secure_url}
            alt={`${companyData.name} banner`}
            className="absolute inset-0 w-full h-full object-cover object-center"
            onLoad={() => console.log('✅ Banner loaded successfully')}
            onError={(e) => {
              console.error('❌ Banner failed to load');
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 flex flex-col items-center justify-center">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

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

        {/* Action Buttons */}
        {isOwner && (
          <div className="absolute top-4 right-16 flex gap-3 z-10">
            <Button
              onClick={() => setShowBannerGuide(true)}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm hover:bg-white border-blue-200 text-blue-700 hover:text-blue-800 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              disabled={isUploading}
            >
              <Info className="w-4 h-4" />
              Banner Guide
            </Button>
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm hover:bg-white border-purple-200 text-purple-700 hover:text-purple-800 hover:border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isUploading}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        )}

        {/* Logo */}
        <div className="absolute -bottom-6 left-8">
          <div className="bg-white rounded-2xl p-2 shadow-2xl border border-gray-200/60 backdrop-blur-sm relative group">
            {avatar ? (
              <>
                <img
                  src={typeof avatar === 'string' ? avatar : avatar.secure_url}
                  alt={`${companyData.name} logo`}
                  className="w-20 h-20 object-cover rounded-xl shadow-lg"
                  onLoad={() => console.log('✅ Logo loaded successfully')}
                  onError={(e) => {
                    console.error('❌ Logo failed to load');
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 pointer-events-none" />
              </>
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-inner relative">
                <Building2 className="w-8 h-8 text-gray-400" />
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

      {/* Company Info */}
      <div className="pt-10 pb-8 px-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {companyData.name}
              </h1>
              {companyData.verified && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-semibold shadow-lg">
                  <Award className="w-4 h-4" />
                  <span>Verified</span>
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
              {companyData.industry && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-700">{companyData.industry}</span>
                </div>
              )}

              {companyData.address && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-700">{companyData.address}</span>
                </div>
              )}

              {companyData.website && (
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <a
                    href={companyData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-purple-700 hover:text-purple-800 hover:underline transition-colors"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>

            {companyData.description && (
              <p className="text-gray-700 leading-relaxed text-lg max-w-4xl border-l-4 border-blue-500 pl-4 bg-blue-50/50 py-3 rounded-r-lg">
                {companyData.description}
              </p>
            )}
          </div>

          {/* Side Info */}
          <div className="lg:text-right space-y-3">
            <div className="flex lg:flex-col items-center gap-4 lg:gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Joined {new Date(companyData.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>

              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border shadow-sm ${companyData.verified
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
                : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
                }`}>
                <Star className="w-4 h-4 mr-2" />
                {companyData.verified ? 'Verified Company' : 'Verification Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Guide Modal */}
      {showBannerGuide && <BannerGuideModal />}

      {/* Cloud Storage Status */}
      {(avatarUploading || coverUploading) && (
        <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg z-20">
          <Cloud className="w-4 h-4 animate-pulse" />
          <span>Uploading to cloud...</span>
        </div>
      )}
    </div>
  );
}