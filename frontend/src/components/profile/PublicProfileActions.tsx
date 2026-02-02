/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { followService } from '@/services/followService';
import { candidateService } from '@/services/candidateService';
import { profileService } from '@/services/profileService';
import { colorClasses } from '@/utils/color';
import {
  UserPlus,
  UserMinus,
  MessageCircle,
  Users,
  FileText,
  Package,
  Send,
  Loader2,
  Building,
  Phone,
  Mail,
  Heart,
  Download,
  Eye,
  Target,
  Award,
  MapPin,
  Shield,
  Cloud,
  Trash2,
  Share2,
  Flag,
  Save,
  Briefcase,
} from 'lucide-react';

interface PublicProfileActionsProps {
  targetId: string;
  targetType: 'User' | 'Candidate' | 'Freelancer' | 'Company' | 'Organization';
  targetName: string;
  targetData?: any;
  initialIsFollowing?: boolean;
  showMessage?: boolean;
  showViewNetwork?: boolean;
  showViewPosts?: boolean;
  showProducts?: boolean;
  showResume?: boolean;
  showPortfolio?: boolean;
  onAction?: (action: string, data?: any) => void;
  themeMode?: 'light' | 'dark';
  variant?: 'default' | 'compact' | 'expanded';
}

// Glass button component with enhanced styling
const GlassButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'danger' | 'premium';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
  themeMode?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  icon,
  themeMode = 'light',
  size = 'md'
}) => {
    const baseStyles = "rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-2 hover:scale-105 active:scale-95";

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg'
    };

    // Variant classes with dark mode support
    const variants = {
      primary: themeMode === 'dark'
        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg hover:shadow-xl border border-blue-500'
        : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl border border-blue-400',
      secondary: themeMode === 'dark'
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl border border-purple-500'
        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl border border-purple-400',
      success: themeMode === 'dark'
        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:shadow-xl border border-green-500'
        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl border border-green-400',
      warning: themeMode === 'dark'
        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg hover:shadow-xl border border-amber-500'
        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl border border-amber-400',
      danger: themeMode === 'dark'
        ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg hover:shadow-xl border border-red-500'
        : 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl border border-red-400',
      premium: themeMode === 'dark'
        ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg hover:shadow-xl border border-amber-500'
        : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg hover:shadow-xl border border-amber-400',
      ghost: themeMode === 'dark'
        ? 'bg-gray-800/60 text-gray-200 hover:bg-gray-700/80 border border-gray-700 hover:border-blue-500 hover:text-blue-300'
        : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-300 hover:border-blue-500 hover:text-blue-600'
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeClasses[size]} ${variants[variant]} ${disabled || loading ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''} ${className}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {icon}
            <span className="whitespace-nowrap">{children}</span>
          </>
        )}
      </button>
    );
  };

export const PublicProfileActions: React.FC<PublicProfileActionsProps> = ({
  targetId,
  targetType,
  targetName,
  targetData,
  initialIsFollowing = false,
  showMessage = true,
  showViewNetwork = true,
  showViewPosts = true,
  showProducts = false,
  showResume = false,
  showPortfolio = false,
  onAction,
  themeMode = 'light',
  variant = 'default'
}) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleFollowToggle = async () => {
    try {
      setLoading(true);
      const result = await followService.toggleFollow(targetId, {
        targetType: targetType === 'Candidate' || targetType === 'Freelancer' ? 'User' : targetType,
      });
      setIsFollowing(result.following);

      onAction?.(isFollowing ? 'unfollow' : 'follow', { targetId, targetType });
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      onAction?.('follow_error', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!targetData?.avatar) return;

    try {
      setDeleteLoading(true);
      const result = await profileService.deleteAvatar();

      if (result.success) {
        onAction?.('delete_avatar', {
          success: true,
          cloudinaryDeleted: result.cloudinaryDeleted
        });
      } else {
        onAction?.('delete_avatar_error', { error: 'Failed to delete avatar' });
      }
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      onAction?.('delete_avatar_error', { error });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCover = async () => {
    if (!targetData?.coverPhoto) return;

    try {
      setDeleteLoading(true);
      const result = await profileService.deleteCoverPhoto();

      if (result.success) {
        onAction?.('delete_cover', {
          success: true,
          cloudinaryDeleted: result.cloudinaryDeleted
        });
      } else {
        onAction?.('delete_cover_error', { error: 'Failed to delete cover photo' });
      }
    } catch (error) {
      console.error('Failed to delete cover photo:', error);
      onAction?.('delete_cover_error', { error });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      setMessageLoading(true);
      onAction?.('message', { targetId, targetName });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to start conversation:', error);
      onAction?.('message_error', { error });
    } finally {
      setMessageLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!targetData?.cvs?.length) return;

    try {
      setDownloadLoading(true);
      const primaryCV = targetData.cvs.find((cv: any) => cv.isPrimary) || targetData.cvs[0];
      const downloadUrl = candidateService.getCVDownloadUrl(primaryCV);

      window.open(downloadUrl, '_blank');
      onAction?.('download_resume', { cv: primaryCV });
    } catch (error) {
      console.error('Failed to download resume:', error);
      onAction?.('download_error', { error });
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleViewNetwork = () => {
    window.location.href = `/profile/${targetId}/network`;
    onAction?.('view_network', { targetId });
  };

  const handleViewPosts = () => {
    window.location.href = `/profile/${targetId}/posts`;
    onAction?.('view_posts', { targetId });
  };

  const handleViewProducts = () => {
    window.location.href = `/company/${targetId}/products`;
    onAction?.('view_products', { targetId });
  };

  const handleViewPortfolio = () => {
    window.location.href = `/freelancer/${targetId}/portfolio`;
    onAction?.('view_portfolio', { targetId });
  };

  const handleConnect = () => {
    onAction?.('connect', { targetId, targetName });
  };

  const handleViewProfile = () => {
    let profileUrl = '';
    switch (targetType) {
      case 'Candidate':
        profileUrl = `/candidate/${targetId}`;
        break;
      case 'Freelancer':
        profileUrl = `/freelancer/${targetId}`;
        break;
      case 'Company':
        profileUrl = `/company/${targetId}`;
        break;
      case 'Organization':
        profileUrl = `/organization/${targetId}`;
        break;
      default:
        profileUrl = `/profile/${targetId}`;
    }
    window.location.href = profileUrl;
    onAction?.('view_profile', { targetId, targetType });
  };

  const handleCall = () => {
    if (targetData?.phone) {
      window.location.href = `tel:${targetData.phone}`;
      onAction?.('call', { phone: targetData.phone });
    }
  };

  const handleEmail = () => {
    if (targetData?.email) {
      window.location.href = `mailto:${targetData.email}`;
      onAction?.('email', { email: targetData.email });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: targetName,
        text: `Check out ${targetName}'s profile`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      onAction?.('share', { url: window.location.href });
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onAction?.(isSaved ? 'unsave' : 'save', { targetId, targetType });
  };

  const handleReport = () => {
    onAction?.('report', { targetId, targetType });
  };

  // Check if this profile can have specific features
  const canHaveProducts = targetType === 'Company' || targetType === 'Organization';
  const canHaveResume = targetType === 'Candidate' && targetData?.cvs?.length > 0;
  const canHavePortfolio = targetType === 'Freelancer' && targetData?.portfolio?.length > 0;
  const hasContactInfo = targetData?.phone || targetData?.email;
  const isVerified = targetData?.verified || targetData?.isVerified;
  const hasCloudinaryAvatar = targetData?.avatar && profileService.isCloudinaryUrl(targetData.avatar);
  const hasCloudinaryCover = targetData?.coverPhoto && profileService.isCloudinaryUrl(targetData.coverPhoto);

  // Determine button size based on variant
  const buttonSize = variant === 'compact' ? 'sm' : 'md';

  // Container classes based on variant and theme
  const containerClasses = () => {
    const baseClasses = "flex flex-col gap-3 md:gap-4 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-xl";

    const variantClasses = {
      default: "p-4 md:p-6",
      compact: "p-3 md:p-4",
      expanded: "p-5 md:p-8"
    }[variant];

    const themeClasses = themeMode === 'dark'
      ? `bg-gradient-to-b ${variant === 'compact' ? 'from-gray-900/90 to-gray-800/90' : 'from-gray-900/80 to-gray-800/80'} border border-gray-700/50`
      : `bg-gradient-to-b ${variant === 'compact' ? 'from-white/90 to-gray-50/90' : 'from-white/80 to-gray-50/80'} border border-gray-200/50`;

    return `${baseClasses} ${variantClasses} ${themeClasses}`;
  };

  // Cloud storage indicator classes
  const cloudIndicatorClasses = themeMode === 'dark'
    ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30 text-blue-300'
    : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-700';

  // Stats item classes
  const statsItemClasses = themeMode === 'dark'
    ? 'bg-gray-800/50 border border-gray-700/50 text-gray-300'
    : 'bg-white/50 border border-gray-200/50 text-gray-700';

  // Quick action button classes
  const quickActionClasses = themeMode === 'dark'
    ? 'bg-gray-800/60 hover:bg-gray-700 border-gray-700 hover:border-blue-500 text-gray-300 hover:text-blue-300'
    : 'bg-white/60 hover:bg-white border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600';

  // Mobile action button classes
  const mobileActionClasses = themeMode === 'dark'
    ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/20'
    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50';

  return (
    <div className={containerClasses()}>
      {/* Cloud Storage Indicators */}
      {(hasCloudinaryAvatar || hasCloudinaryCover) && (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl ${cloudIndicatorClasses}`}>
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-sm font-medium">Cloud Storage Enabled</span>
          </div>
          <div className="flex gap-2">
            {hasCloudinaryAvatar && (
              <button
                onClick={handleDeleteAvatar}
                disabled={deleteLoading}
                className={`text-xs px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${themeMode === 'dark'
                  ? 'text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30'
                  : 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100'
                  }`}
              >
                {deleteLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Delete Avatar
              </button>
            )}
            {hasCloudinaryCover && (
              <button
                onClick={handleDeleteCover}
                disabled={deleteLoading}
                className={`text-xs px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${themeMode === 'dark'
                  ? 'text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30'
                  : 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100'
                  }`}
              >
                {deleteLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Delete Cover
              </button>
            )}
          </div>
        </div>
      )}

      {/* Primary Actions Row */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        {/* Follow/Unfollow Button */}
        <div className="relative group flex-1 min-w-[calc(50%-0.5rem)] md:min-w-[180px]">
          {/* Glow effect */}
          <div className={`absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${themeMode === 'dark'
            ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            }`} />

          <GlassButton
            onClick={handleFollowToggle}
            loading={loading}
            variant={isFollowing ? 'secondary' : 'primary'}
            icon={isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            className="relative w-full"
            themeMode={themeMode}
            size={buttonSize}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </GlassButton>
        </div>

        {/* Message Button - Only shows if following */}
        {showMessage && isFollowing && (
          <GlassButton
            onClick={handleMessage}
            loading={messageLoading}
            variant="success"
            icon={<MessageCircle className="w-4 h-4" />}
            className="flex-1 min-w-[calc(50%-0.5rem)] md:min-w-[140px]"
            themeMode={themeMode}
            size={buttonSize}
          >
            Message
          </GlassButton>
        )}

        {/* Connect Button */}
        {showMessage && !isFollowing && (
          <GlassButton
            onClick={handleConnect}
            variant="ghost"
            icon={<Users className="w-4 h-4" />}
            className="flex-1 min-w-[calc(50%-0.5rem)] md:min-w-[140px]"
            themeMode={themeMode}
            size={buttonSize}
          >
            Connect
          </GlassButton>
        )}

        {/* Share Button */}
        <GlassButton
          onClick={handleShare}
          variant="warning"
          icon={<Share2 className="w-4 h-4" />}
          className="flex-1 min-w-[calc(50%-0.5rem)] md:min-w-[120px]"
          themeMode={themeMode}
          size={buttonSize}
        >
          Share
        </GlassButton>

        {/* Quick Actions for larger screens */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={handleSave}
            className={`p-3 rounded-xl transition-transform hover:scale-105 ${isSaved
              ? themeMode === 'dark'
                ? 'text-red-400 bg-red-900/20'
                : 'text-red-500 bg-red-50'
              : quickActionClasses
              }`}
            title={isSaved ? 'Unsave' : 'Save'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleReport}
            className={`p-3 rounded-xl transition-transform hover:scale-105 ${quickActionClasses}`}
            title="Report"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Secondary Actions Row */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        {/* Role-Specific Actions */}
        {canHaveResume && showResume && (
          <GlassButton
            onClick={handleDownloadResume}
            loading={downloadLoading}
            variant="success"
            icon={<Download className="w-4 h-4" />}
            className="flex-1 min-w-[calc(50%-0.5rem)] md:min-w-[160px]"
            themeMode={themeMode}
            size={buttonSize}
          >
            Download Resume
          </GlassButton>
        )}

        {canHavePortfolio && showPortfolio && (
          <GlassButton
            onClick={handleViewPortfolio}
            variant="warning"
            icon={<Target className="w-4 h-4" />}
            className="flex-1 min-w-[calc(50%-0.5rem)] md:min-w-[160px]"
            themeMode={themeMode}
            size={buttonSize}
          >
            View Portfolio
          </GlassButton>
        )}

        {/* General Actions */}
        {showViewNetwork && (
          <GlassButton
            onClick={handleViewNetwork}
            variant="ghost"
            icon={<Users className="w-4 h-4" />}
            className="flex-1 min-w-[calc(50%-0.5rem)] md:min-w-[140px]"
            themeMode={themeMode}
            size={buttonSize}
          >
            Network
          </GlassButton>
        )}

        {showViewPosts && (
          <GlassButton
            onClick={handleViewPosts}
            variant="ghost"
            icon={<FileText className="w-4 h-4" />}
            className="flex-1 min-w-[calc(50%-0.5rem)] md:min-w-[140px]"
            themeMode={themeMode}
            size={buttonSize}
          >
            Posts
          </GlassButton>
        )}

        {showProducts && canHaveProducts && (
          <GlassButton
            onClick={handleViewProducts}
            variant="ghost"
            icon={<Package className="w-4 h-4" />}
            className="flex-1 min-w-[calc(50%-0.5rem)] md:min-w-[140px]"
            themeMode={themeMode}
            size={buttonSize}
          >
            Products
          </GlassButton>
        )}

        {/* View Full Profile */}
        <GlassButton
          onClick={handleViewProfile}
          variant="ghost"
          icon={
            targetType === 'Candidate' ? <Award className="w-4 h-4" /> :
              targetType === 'Freelancer' ? <Target className="w-4 h-4" /> :
                targetType === 'Company' ? <Building className="w-4 h-4" /> :
                  targetType === 'Organization' ? <Users className="w-4 h-4" /> :
                    <Eye className="w-4 h-4" />
          }
          className="flex-1 min-w-[calc(50%-0.5rem)] md:min-w-[160px]"
          themeMode={themeMode}
          size={buttonSize}
        >
          View Profile
        </GlassButton>
      </div>

      {/* Contact Buttons for smaller screens */}
      {hasContactInfo && (
        <div className="flex gap-2 md:hidden">
          {targetData?.phone && (
            <button
              onClick={handleCall}
              className={`flex-1 p-3 rounded-xl hover:scale-105 transition-transform flex flex-col items-center ${themeMode === 'dark'
                ? 'bg-gradient-to-br from-green-600 to-emerald-600'
                : 'bg-gradient-to-br from-green-500 to-emerald-500'
                } text-white`}
            >
              <Phone className="w-4 h-4 mb-1" />
              <span className="text-xs">Call</span>
            </button>
          )}
          {targetData?.email && (
            <button
              onClick={handleEmail}
              className={`flex-1 p-3 rounded-xl hover:scale-105 transition-transform flex flex-col items-center ${themeMode === 'dark'
                ? 'bg-gradient-to-br from-blue-600 to-cyan-600'
                : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                } text-white`}
            >
              <Mail className="w-4 h-4 mb-1" />
              <span className="text-xs">Email</span>
            </button>
          )}
        </div>
      )}

      {/* Cloud Storage Information for larger screens */}
      {(hasCloudinaryAvatar || hasCloudinaryCover) && (
        <div className="hidden md:block pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className={`flex items-center gap-2 p-3 rounded-lg ${cloudIndicatorClasses}`}>
            <Cloud className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Cloud Storage</p>
              <p className="text-xs opacity-90">
                Images are securely stored and optimized for fast loading
              </p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-lg font-medium ${themeMode === 'dark'
              ? 'bg-blue-900/40 text-blue-300'
              : 'bg-blue-100 text-blue-700'
              }`}>
              ✓ Active
            </span>
          </div>
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 pt-3 md:pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        {targetData?.location && (
          <div className={`flex items-center gap-2 p-2 md:p-3 rounded-lg ${statsItemClasses}`}>
            <MapPin className={`w-3 h-3 md:w-4 md:h-4 ${themeMode === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
            <span className="text-xs md:text-sm truncate">{targetData.location}</span>
          </div>
        )}

        {targetData?.followerCount !== undefined && (
          <div className={`flex items-center gap-2 p-2 md:p-3 rounded-lg ${statsItemClasses}`}>
            <Users className={`w-3 h-3 md:w-4 md:h-4 ${themeMode === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} />
            <span className="text-xs md:text-sm">{targetData.followerCount.toLocaleString()} followers</span>
          </div>
        )}

        {targetData?.postCount !== undefined && (
          <div className={`flex items-center gap-2 p-2 md:p-3 rounded-lg ${statsItemClasses}`}>
            <FileText className={`w-3 h-3 md:w-4 md:h-4 ${themeMode === 'dark' ? 'text-green-400' : 'text-green-500'}`} />
            <span className="text-xs md:text-sm">{targetData.postCount.toLocaleString()} posts</span>
          </div>
        )}

        {isVerified && (
          <div className={`flex items-center gap-2 p-2 md:p-3 rounded-lg ${statsItemClasses}`}>
            <Shield className={`w-3 h-3 md:w-4 md:h-4 ${themeMode === 'dark' ? 'text-amber-400' : 'text-amber-500'}`} />
            <span className="text-xs md:text-sm">Verified</span>
          </div>
        )}
      </div>

      {/* Mobile Quick Actions */}
      <div className="md:hidden pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className={`flex-1 flex flex-col items-center p-3 rounded-xl transition-all ${mobileActionClasses}`}
          >
            <Heart className={`w-5 h-5 mb-2 ${isSaved ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
          <button
            onClick={handleReport}
            className={`flex-1 flex flex-col items-center p-3 rounded-xl transition-all ${mobileActionClasses}`}
          >
            <Flag className="w-5 h-5 mb-2" />
            <span className="text-xs font-medium">Report</span>
          </button>
          {hasContactInfo && targetData?.phone && (
            <button
              onClick={handleCall}
              className={`flex-1 flex flex-col items-center p-3 rounded-xl transition-all ${mobileActionClasses}`}
            >
              <Phone className="w-5 h-5 mb-2" />
              <span className="text-xs font-medium">Call</span>
            </button>
          )}
          {hasContactInfo && targetData?.email && (
            <button
              onClick={handleEmail}
              className={`flex-1 flex flex-col items-center p-3 rounded-xl transition-all ${mobileActionClasses}`}
            >
              <Mail className="w-5 h-5 mb-2" />
              <span className="text-xs font-medium">Email</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Elements */}
      {variant !== 'compact' && (
        <>
          <div className={`absolute -top-4 -right-4 w-16 h-16 md:w-20 md:h-20 rounded-full blur-3xl ${themeMode === 'dark'
            ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10'
            : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10'
            }`} />
          <div className={`absolute -bottom-4 -left-4 w-20 h-20 md:w-24 md:h-24 rounded-full blur-3xl ${themeMode === 'dark'
            ? 'bg-gradient-to-br from-amber-500/10 to-pink-500/10'
            : 'bg-gradient-to-br from-amber-500/10 to-pink-500/10'
            }`} />
        </>
      )}
    </div>
  );
};

// Compact Quick Actions Component
export const QuickActions: React.FC<{
  targetId: string;
  targetType: string;
  onAction: (action: string, data?: any) => void;
  className?: string;
  themeMode?: 'light' | 'dark';
}> = ({ targetId, targetType, onAction, className = '', themeMode = 'light' }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleSave = () => {
    setIsSaved(!isSaved);
    onAction(isSaved ? 'unsave' : 'save', { targetId, targetType });
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    onAction(isFollowing ? 'unfollow' : 'follow', { targetId, targetType });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Profile',
        text: 'Check out this profile',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      onAction('share', { url: window.location.href });
    }
  };

  const handleReport = () => {
    onAction('report', { targetId, targetType });
  };

  const quickActionClasses = themeMode === 'dark'
    ? 'bg-gray-800/60 hover:bg-gray-700 border-gray-700 hover:border-blue-500 text-gray-300 hover:text-blue-300'
    : 'bg-white/60 hover:bg-white border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600';

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={handleFollow}
        className={`p-2.5 rounded-xl transition-all ${isFollowing
          ? themeMode === 'dark'
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
          : quickActionClasses
          }`}
        title={isFollowing ? 'Following' : 'Follow'}
      >
        {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      </button>
      <button
        onClick={handleSave}
        className={`p-2.5 rounded-xl transition-all ${isSaved
          ? themeMode === 'dark'
            ? 'text-red-400 bg-red-900/20'
            : 'text-red-500 bg-red-50'
          : quickActionClasses
          }`}
        title={isSaved ? 'Unsave' : 'Save'}
      >
        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
      </button>
      <button
        onClick={handleShare}
        className={`p-2.5 rounded-xl transition-all ${quickActionClasses}`}
        title="Share"
      >
        <Share2 className="w-4 h-4" />
      </button>
      <button
        onClick={handleReport}
        className={`p-2.5 rounded-xl transition-all ${quickActionClasses}`}
        title="Report"
      >
        <Flag className="w-4 h-4" />
      </button>
    </div>
  );
};

// Mobile Floating Actions Component
export const MobileFloatingActions: React.FC<{
  targetId: string;
  targetType: string;
  onAction: (action: string, data?: any) => void;
  themeMode?: 'light' | 'dark';
}> = ({ targetId, targetType, onAction, themeMode = 'light' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    onAction(isFollowing ? 'unfollow' : 'follow', { targetId, targetType });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Profile',
        text: 'Check out this profile',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      onAction('share', { url: window.location.href });
    }
  };

  const handleMessage = () => {
    onAction('message', { targetId, targetType });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 md:hidden">
      <div className="relative">
        {isExpanded && (
          <div className="absolute bottom-full right-0 mb-2">
            <div className={`flex flex-col gap-2 p-3 rounded-xl shadow-2xl ${themeMode === 'dark'
              ? 'bg-gray-900 border border-gray-700'
              : 'bg-white border border-gray-200'
              }`}>
              <button
                onClick={handleFollow}
                className={`p-3 rounded-lg transition-all flex items-center gap-2 ${isFollowing
                  ? themeMode === 'dark'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : themeMode === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span className="text-sm">{isFollowing ? 'Unfollow' : 'Follow'}</span>
              </button>
              {isFollowing && (
                <button
                  onClick={handleMessage}
                  className={`p-3 rounded-lg transition-all flex items-center gap-2 ${themeMode === 'dark'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Message</span>
                </button>
              )}
              <button
                onClick={handleShare}
                className={`p-3 rounded-lg transition-all flex items-center gap-2 ${themeMode === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Share</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-14 h-14 rounded-full shadow-2xl transition-all ${themeMode === 'dark'
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
            } text-white`}
        >
          {isExpanded ? '×' : '+'}
        </button>
      </div>
    </div>
  );
};