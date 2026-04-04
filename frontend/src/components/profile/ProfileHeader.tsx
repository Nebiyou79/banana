/* eslint-disable @typescript-eslint/no-explicit-any */
// components/profile/ProfileHeader.tsx - FIXED with AvatarUploader approach
import React, { useState, useEffect, useRef } from 'react';
import FollowButton from '@/components/social/network/FollowButton';
import { profileService, Profile } from '@/services/profileService';
import { useAuth } from '@/hooks/useAuth';
import { followService } from '@/services/followService';
import {
  MapPin,
  Briefcase,
  Shield,
  Users,
  RefreshCw,
  Cloud,
  Edit,
  Camera,
  MessageSquare,
  Share2,
  Calendar,
  Link as LinkIcon,
  ExternalLink,
  CheckCircle,
  Crown,
  Heart,
  Eye,
  FileText,
  Sparkles,
  ChevronRight,
  Loader2,
  User,
  Image as ImageIcon,
  X,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/social/theme/RoleThemeProvider';
import { toast } from 'sonner';

// Color tokens based on design system
const COLORS = {
  background: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    tertiary: 'bg-gray-100 dark:bg-gray-700',
    overlay: 'bg-white/80 dark:bg-gray-900/80',
    muted: 'bg-gray-50/50 dark:bg-gray-800/50',
  },
  text: {
    primary: 'text-gray-900 dark:text-white',
    secondary: 'text-gray-700 dark:text-gray-300',
    tertiary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
    inverse: 'text-white dark:text-gray-900',
    brand: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
  },
  border: {
    light: 'border-gray-200 dark:border-gray-700',
    medium: 'border-gray-300 dark:border-gray-600',
    strong: 'border-gray-400 dark:border-gray-500',
    brand: 'border-blue-200 dark:border-blue-700',
  },
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    inner: 'shadow-inner',
    none: 'shadow-none',
  },
  gradient: {
    subtle: 'from-gray-50 to-white dark:from-gray-800 dark:to-gray-900',
    brand: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    premium: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
    success: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
  },
} as const;

// Role-based color configuration
const ROLE_COLORS = {
  candidate: {
    gradient: 'from-blue-500 to-cyan-500',
    lightBg: 'bg-blue-50',
    darkBg: 'dark:bg-blue-900/20',
    lightText: 'text-blue-700',
    darkText: 'dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    shadow: 'shadow-blue-500/20',
    icon: Briefcase
  },
  freelancer: {
    gradient: 'from-amber-500 to-orange-500',
    lightBg: 'bg-amber-50',
    darkBg: 'dark:bg-amber-900/20',
    lightText: 'text-amber-700',
    darkText: 'dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    shadow: 'shadow-amber-500/20',
    icon: Sparkles
  },
  company: {
    gradient: 'from-teal-500 to-emerald-500',
    lightBg: 'bg-teal-50',
    darkBg: 'dark:bg-teal-900/20',
    lightText: 'text-teal-700',
    darkText: 'dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    shadow: 'shadow-teal-500/20',
    icon: (props: any) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M12 6h.01" />
        <path d="M12 10h.01" />
        <path d="M12 14h.01" />
        <path d="M16 10h.01" />
        <path d="M16 14h.01" />
        <path d="M8 10h.01" />
        <path d="M8 14h.01" />
      </svg>
    )
  },
  organization: {
    gradient: 'from-indigo-500 to-purple-500',
    lightBg: 'bg-indigo-50',
    darkBg: 'dark:bg-indigo-900/20',
    lightText: 'text-indigo-700',
    darkText: 'dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    shadow: 'shadow-indigo-500/20',
    icon: Users
  },
  admin: {
    gradient: 'from-purple-500 to-pink-500',
    lightBg: 'bg-purple-50',
    darkBg: 'dark:bg-purple-900/20',
    lightText: 'text-purple-700',
    darkText: 'dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    shadow: 'shadow-purple-500/20',
    icon: Shield
  }
};

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile?: boolean;
  onFollow?: (isFollowing: boolean) => void;
  onRefresh?: () => void;
  onEditProfile?: () => void;
  onAvatarUpload?: (file: File) => Promise<void>;
  onCoverUpload?: (file: File) => Promise<void>;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isOwnProfile = false,
  onFollow,
  onRefresh,
  onEditProfile,
  onAvatarUpload,
  onCoverUpload,
}) => {
  const { user } = useAuth();
  const { mode } = useTheme();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingCount, setFollowingCount] = useState(profile.socialStats?.followingCount || 0);
  const [followerCount, setFollowerCount] = useState(profile.socialStats?.followerCount || 0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Image states - like AvatarUploader
  const [imageLoaded, setImageLoaded] = useState({
    avatar: false,
    cover: false
  });
  const [imageError, setImageError] = useState({
    avatar: false,
    cover: false
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState({
    avatar: false,
    cover: false
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState({ avatar: 0, cover: 0 });

  // Get role-specific colors
  const roleColors = ROLE_COLORS[profile.user.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.candidate;
  const RoleIcon = roleColors.icon;

  // Check if current user follows this profile
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!isOwnProfile && user?.id && profile.user?._id) {
        try {
          // Map user role to target type
          const targetTypeMap: Record<string, 'User' | 'Company' | 'Organization'> = {
            candidate: 'User',
            freelancer: 'User',
            company: 'Company',
            organization: 'Organization',
            admin: 'User'
          };
          const targetType = targetTypeMap[profile.user.role] || 'User';
          
          const status = await followService.getFollowStatus(profile.user._id, targetType);
          setIsFollowing(status.following || false);
        } catch (error) {
          console.error('Error checking follow status:', error);
        }
      }
    };

    checkFollowStatus();
  }, [profile.user?._id, user?.id, isOwnProfile, profile.user.role]);

  // Helper function to extract image URL - like AvatarUploader
  const getDisplayUrl = (image: any): string => {
    if (!image) return '';
    if (typeof image === 'string') return image;
    if (image && 'secure_url' in image) return image.secure_url;
    if (image && 'url' in image) return image.url;
    return '';
  };

  // Get cover photo URL - like AvatarUploader
  const getCoverPhotoUrl = (): string => {
    // Check profile.cover (CloudinaryImage object)
    if (profile.cover) {
      const coverUrl = getDisplayUrl(profile.cover);
      if (coverUrl) return coverUrl;
    }
    
    // Check profile.user.coverPhoto
    if (profile.user?.coverPhoto) {
      return profile.user.coverPhoto;
    }
    
    // Check profile.coverPhoto (direct field)
    if ((profile as any).coverPhoto) {
      return (profile as any).coverPhoto;
    }
    
    return '';
  };

  // Get avatar URL - like AvatarUploader
  const getAvatarUrl = (): string => {
    // Check profile.avatar (CloudinaryImage object)
    if (profile.avatar) {
      const avatarUrl = getDisplayUrl(profile.avatar);
      if (avatarUrl) return avatarUrl;
    }
    
    // Check profile.user.avatar
    if (profile.user?.avatar) {
      return profile.user.avatar;
    }
    
    // Fallback to placeholder
    return profileService.getPlaceholderAvatar(profile.user.name);
  };

  const coverPhotoUrl = getCoverPhotoUrl();
  const avatarUrl = getAvatarUrl();

  // Get display URL with preview priority - like AvatarUploader
  const getDisplayImageUrl = (type: 'avatar' | 'cover'): string => {
    if (type === 'avatar') {
      return avatarPreview || getAvatarUrl();
    }
    return coverPreview || getCoverPhotoUrl();
  };

  const hasAvatar = !!getDisplayImageUrl('avatar');
  const hasCover = !!getDisplayImageUrl('cover');

  // Add cache busting and Cloudinary optimization
  const getOptimizedImageUrl = (url: string, type: 'avatar' | 'cover') => {
    if (!url) return '';
    
    // If it's a preview URL (blob), return as is
    if (url.startsWith('blob:')) return url;
    
    // If it's a Cloudinary URL, add transformations
    if (url.includes('cloudinary.com')) {
      if (type === 'avatar') {
        return url.replace('/upload/', '/upload/w_300,h_300,c_fill,q_auto,f_auto/');
      } else {
        return url.replace('/upload/', '/upload/c_fill,w_1200,h_400,q_auto,f_auto/');
      }
    }
    
    // Add cache busting for non-Cloudinary URLs
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${refreshKey}`;
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    // Reset error states on refresh
    setImageError({ avatar: false, cover: false });
    setImageLoaded({ avatar: false, cover: false });
    setRetryCount({ avatar: 0, cover: 0 });
    setRefreshKey(prev => prev + 1);
  };

  const handleImageRetry = (type: 'avatar' | 'cover') => {
    if (retryCount[type] < 3) {
      setRetryCount(prev => ({ ...prev, [type]: prev[type] + 1 }));
      setImageError(prev => ({ ...prev, [type]: false }));
      setImageLoaded(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleFollowChange = async (following: boolean) => {
    setIsFollowing(following);
    if (following) {
      setFollowerCount(prev => prev + 1);
    } else {
      setFollowerCount(prev => Math.max(0, prev - 1));
    }
    onFollow?.(following);
  };

  // File validation - like AvatarUploader
  const validateFile = (file: File, type: 'avatar' | 'cover'): { valid: boolean; error?: string } => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = type === 'avatar' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    const maxSizeMB = type === 'avatar' ? '5MB' : '10MB';

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: `Invalid file type. Please use ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File is too large. Maximum size is ${maxSizeMB}`
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty'
      };
    }

    return { valid: true };
  };

  // Handle file selection - like AvatarUploader
  const handleFileSelect = async (file: File, type: 'avatar' | 'cover') => {
    if (!file) return;

    console.log(`📁 File selected for ${type}:`, {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Create preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'avatar') {
        setAvatarPreview(e.target?.result as string);
      } else {
        setCoverPreview(e.target?.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Validate file
    const validation = validateFile(file, type);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      if (type === 'avatar') {
        setAvatarPreview(null);
      } else {
        setCoverPreview(null);
      }
      return;
    }

    // Start upload
    await uploadFile(file, type);
  };

  // Upload file - like AvatarUploader
  const uploadFile = async (file: File, type: 'avatar' | 'cover') => {
    setUploadError(null);
    setUploadSuccess(false);
    setIsUploading(prev => ({ ...prev, [type]: true }));
    setUploadProgress(0);

    try {
      let result;
      const progressHandler = (progressEvent: any) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      };

      if (type === 'avatar' && onAvatarUpload) {
        await onAvatarUpload(file);
      } else if (type === 'cover' && onCoverUpload) {
        await onCoverUpload(file);
      }

      setUploadProgress(100);
      setUploadSuccess(true);

      toast.success(`${type === 'avatar' ? 'Profile picture' : 'Cover photo'} updated successfully!`, {
        icon: <Cloud className="w-5 h-5 text-blue-500" />
      });

      // Clear states after success
      setTimeout(() => {
        if (type === 'avatar') {
          setAvatarPreview(null);
        } else {
          setCoverPreview(null);
        }
        setIsUploading(prev => ({ ...prev, [type]: false }));
        setUploadProgress(0);
        setUploadSuccess(false);

        // Clear file input
        const fileInput = type === 'avatar' ? avatarInputRef.current : coverInputRef.current;
        if (fileInput) {
          fileInput.value = '';
        }
      }, 2000);

    } catch (error: any) {
      console.error(`❌ ${type} upload failed:`, error);

      const errorMessage = error.message || "Upload failed. Please try again.";
      setUploadError(errorMessage);

      toast.error(errorMessage);

      // Clear preview on error
      if (type === 'avatar') {
        setAvatarPreview(null);
      } else {
        setCoverPreview(null);
      }
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleAvatarClick = () => {
    if (isOwnProfile && onAvatarUpload) {
      avatarInputRef.current?.click();
    }
  };

  const handleCoverClick = () => {
    if (isOwnProfile && onCoverUpload) {
      coverInputRef.current?.click();
    }
  };

  const cancelUpload = (type: 'avatar' | 'cover') => {
    if (type === 'avatar') {
      setAvatarPreview(null);
    } else {
      setCoverPreview(null);
    }
    setIsUploading(prev => ({ ...prev, [type]: false }));
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadError(null);

    const fileInput = type === 'avatar' ? avatarInputRef.current : coverInputRef.current;
    if (fileInput) {
      fileInput.value = '';
    }

    toast.info(`${type === 'avatar' ? 'Profile picture' : 'Cover photo'} upload cancelled`);
  };

  const getCurrentPosition = () => {
    if (profile.roleSpecific?.experience?.length > 0) {
      const currentExp = profile.roleSpecific.experience.find(exp => exp.current);
      return currentExp || profile.roleSpecific.experience[0];
    }
    return null;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatJoinDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const currentPosition = getCurrentPosition();

  // Render upload status overlay - like AvatarUploader
  const renderUploadStatus = (type: 'avatar' | 'cover') => {
    if (isUploading[type]) {
      return (
        <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {uploadProgress}% - Uploading...
          </p>
          <button
            onClick={() => cancelUpload(type)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mt-2 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        </div>
      );
    }

    if (uploadSuccess && type === (isUploading.avatar ? 'avatar' : 'cover')) {
      return (
        <div className="absolute inset-0 bg-green-50/95 dark:bg-green-900/30 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20 rounded-lg">
          <CheckCircle className="w-8 h-8 text-green-600 mb-1" />
          <p className="text-xs font-medium text-green-700 dark:text-green-300">Upload Complete!</p>
        </div>
      );
    }

    return null;
  };

  return (
    <header className="relative rounded-3xl overflow-hidden backdrop-blur-xl bg-linear-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-800 shadow-2xl">
      {/* Hidden file inputs - like AvatarUploader */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileSelect(e.target.files[0], 'avatar');
          }
        }}
        className="hidden"
        disabled={isUploading.avatar}
        aria-label="Upload profile picture"
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileSelect(e.target.files[0], 'cover');
          }
        }}
        className="hidden"
        disabled={isUploading.cover}
        aria-label="Upload cover photo"
      />

      {/* Upload Error Toast */}
      {uploadError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-red-500 text-white rounded-lg text-sm shadow-lg animate-in slide-in-from-top">
          {uploadError}
        </div>
      )}

      {/* Cover Image */}
      <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden bg-linear-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700">
        {getDisplayImageUrl('cover') && !imageError.cover ? (
          <>
            <img
              src={getOptimizedImageUrl(getDisplayImageUrl('cover'), 'cover')}
              alt={`${profile.user.name}'s cover`}
              className={cn(
                "w-full h-full object-cover transition-all duration-700 transform hover:scale-105",
                imageLoaded.cover ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => {
                setImageLoaded(prev => ({ ...prev, cover: true }));
                setImageError(prev => ({ ...prev, cover: false }));
              }}
              onError={() => {
                setImageLoaded(prev => ({ ...prev, cover: false }));
                setImageError(prev => ({ ...prev, cover: true }));
              }}
            />
            {!imageLoaded.cover && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Cloud Storage Badge */}
            {imageLoaded.cover && getDisplayImageUrl('cover').includes('cloudinary.com') && (
              <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-white text-xs flex items-center gap-1.5 border border-white/20">
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloud Storage</span>
              </div>
            )}
          </>
        ) : (
          <div className={cn(
            "absolute inset-0 bg-linear-to-br",
            roleColors.gradient
          )}>
            <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
            
            {/* Empty state - like AvatarUploader */}
            {!hasCover && !isUploading.cover && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <ImageIcon className="w-12 h-12 text-white/50 mb-2" />
                <p className="text-white/70 text-sm">No cover photo</p>
              </div>
            )}
          </div>
        )}

        {/* Upload Progress Overlay */}
        {renderUploadStatus('cover')}

        {/* Edit Cover Button */}
        {isOwnProfile && (
          <button
            onClick={handleCoverClick}
            disabled={isUploading.cover}
            className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/40 backdrop-blur-md rounded-lg sm:rounded-xl text-white text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 hover:bg-black/60 transition-all border border-white/20 shadow-lg z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading.cover ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
            <span className="hidden sm:inline">Change Cover</span>
          </button>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={handleRefresh}
            className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-lg sm:rounded-xl text-white hover:bg-black/60 transition-all border border-white/20 shadow-lg z-10"
            disabled={isUploading.cover || isUploading.avatar}
          >
            <RefreshCw className={cn(
              "w-4 h-4",
              (isUploading.cover || isUploading.avatar) && "animate-spin"
            )} />
          </button>
        )}
      </div>

      {/* Avatar */}
      <div className="px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28">
          <div className="absolute inset-0 rounded-full border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden bg-linear-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700">
            {getDisplayImageUrl('avatar') && !imageError.avatar ? (
              <img
                src={getOptimizedImageUrl(getDisplayImageUrl('avatar'), 'avatar')}
                alt={profile.user.name}
                className={cn(
                  "w-full h-full object-cover transition-all duration-500",
                  imageLoaded.avatar ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => {
                  setImageLoaded(prev => ({ ...prev, avatar: true }));
                  setImageError(prev => ({ ...prev, avatar: false }));
                }}
                onError={() => {
                  setImageLoaded(prev => ({ ...prev, avatar: false }));
                  setImageError(prev => ({ ...prev, avatar: true }));
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-500">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            )}

            {/* Upload Progress Overlay */}
            {renderUploadStatus('avatar')}
          </div>

          {/* Verification Badge */}
          {profile.verificationStatus === 'verified' && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 shadow-lg border-2 border-white dark:border-gray-900">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}

          {/* Premium Badge */}
          {profile.premium?.isPremium && (
            <div className="absolute -top-1 -right-1 bg-linear-to-r from-amber-400 to-yellow-500 rounded-full p-1 shadow-lg border-2 border-white dark:border-gray-900">
              <Crown className="w-3 h-3 text-white" />
            </div>
          )}

          {/* Cloud Storage Indicator */}
          {imageLoaded.avatar && getDisplayImageUrl('avatar').includes('cloudinary.com') && (
            <div className="absolute -bottom-1 -left-1 bg-blue-500 rounded-full p-1 shadow-lg border-2 border-white dark:border-gray-900">
              <Cloud className="w-3 h-3 text-white" />
            </div>
          )}

          {/* Edit Avatar Button - like AvatarUploader */}
          {isOwnProfile && (
            <button
              onClick={handleAvatarClick}
              disabled={isUploading.avatar}
              className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 sm:p-2.5 rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
              title="Change profile picture"
            >
              {isUploading.avatar ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6">
          {/* Left Section - Basic Info */}
          <div className="space-y-3 sm:space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className={cn(
                "text-xl sm:text-2xl lg:text-3xl font-bold",
                mode === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {profile.user.name}
              </h1>
              <span className={cn(
                "px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border flex items-center gap-1",
                roleColors.lightBg,
                roleColors.darkBg,
                roleColors.lightText,
                roleColors.darkText,
                roleColors.border
              )}>
                <RoleIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {profileService.getDisplayRole(profile.user.role)}
              </span>
              {profile.isActive && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full border border-green-200 dark:border-green-800">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="hidden sm:inline">Active now</span>
                </span>
              )}
            </div>

            {profile.headline && (
              <p className={cn(
                "text-sm sm:text-base",
                mode === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                {profile.headline}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {profile.location && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{profile.location}</span>
                </div>
              )}

              {profile.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 sm:gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="truncate max-w-[120px] sm:max-w-[150px]">
                    {profile.website.replace(/^https?:\/\//, '')}
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </a>
              )}

              <div className="flex items-center gap-1 sm:gap-1.5">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Joined {formatJoinDate(profile.createdAt)}</span>
              </div>

              {currentPosition && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="truncate max-w-[200px]">
                    {currentPosition.position} at {currentPosition.company}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: profile.user.name,
                    text: profile.headline || `Check out ${profile.user.name}'s profile`,
                    url: window.location.href,
                  }).catch(() => {
                    navigator.clipboard.writeText(window.location.href);
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            {!isOwnProfile ? (
              <>
                <Button
                  onClick={() => {
                    // This will be handled by FollowButton internally
                  }}
                  size="sm"
                  disabled={followLoading}
                  className={cn(
                    "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm",
                    isFollowing
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      : `bg-linear-to-r ${roleColors.gradient} text-white hover:shadow-lg hover:scale-105 transition-all ${roleColors.shadow}`
                  )}
                >
                  <FollowButton
                    targetUserId={profile.user._id}
                    targetType={profile.user.role === 'company' ? 'Company' : profile.user.role === 'organization' ? 'Organization' : 'User'}
                    initialFollowing={isFollowing}
                    onFollowChange={handleFollowChange}
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    className="!p-0 !bg-transparent !border-0 !shadow-none hover:!scale-100"
                  />
                </Button>

                <Button
                  onClick={() => window.location.href = `/dashboard/messages?user=${profile.user._id}`}
                  variant="premium"
                  size="sm"
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Message</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={onEditProfile}
                variant="premium"
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Edit Profile</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-800">
          {[
            {
              label: 'Posts',
              value: profile.socialStats?.postCount || 0,
              icon: FileText,
              color: 'from-blue-500 to-cyan-500'
            },
            {
              label: 'Followers',
              value: followerCount,
              icon: Heart,
              color: 'from-amber-500 to-orange-500'
            },
            {
              label: 'Following',
              value: followingCount,
              icon: Users,
              color: 'from-purple-500 to-pink-500'
            },
            {
              label: 'Views',
              value: profile.socialStats?.profileViews || 0,
              icon: Eye,
              color: 'from-green-500 to-emerald-500'
            }
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center group hover:scale-105 transition-transform cursor-default"
            >
              <div className={cn(
                "inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-linear-to-r",
                stat.color,
                "mb-1.5 sm:mb-2 shadow-lg group-hover:shadow-xl transition-all"
              )}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className={cn(
                "text-base sm:text-xl font-bold",
                mode === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {formatNumber(stat.value)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Bio Preview */}
        {profile.bio && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-800">
            <p className={cn(
              "text-sm sm:text-base line-clamp-2",
              mode === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              {profile.bio}
            </p>
            {profile.bio.length > 150 && (
              <button className="mt-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1">
                Read more
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        )}

        {/* Profile Completion Bar (Own Profile Only) */}
        {isOwnProfile && profile.profileCompletion && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs sm:text-sm font-medium",
                  mode === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Profile Strength
                </span>
                <span className={cn(
                  "px-1.5 sm:px-2 py-0.5 text-xs rounded-full font-medium",
                  profile.profileCompletion.percentage >= 80
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : profile.profileCompletion.percentage >= 50
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                )}>
                  {profile.profileCompletion.percentage}%
                </span>
              </div>
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1">
                Complete Profile
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="h-1.5 sm:h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-1000",
                  profile.profileCompletion.percentage >= 80
                    ? 'bg-linear-to-r from-green-500 to-emerald-500'
                    : profile.profileCompletion.percentage >= 50
                      ? 'bg-linear-to-r from-blue-500 to-cyan-500'
                      : 'bg-linear-to-r from-amber-500 to-orange-500'
                )}
                style={{ width: `${profile.profileCompletion.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};