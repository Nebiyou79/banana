/* eslint-disable @typescript-eslint/no-explicit-any */
// components/profile/PublicProfileActions.tsx
import React, { useState } from 'react';
import { followService } from '@/services/followService';
import { candidateService } from '@/services/candidateService';
import { profileService } from '@/services/profileService';
import { colors, colorClasses, getTheme } from '@/utils/color';
import { cn } from '@/lib/utils';
import {
  UserPlus,
  UserMinus,
  MessageCircle,
  Users,
  FileText,
  Package,
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
  Check,
  X,
  ChevronRight
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
  className?: string;
}

// Role-based gradient mapping
const ROLE_GRADIENTS = {
  User: 'from-blue-500 to-cyan-500',
  Candidate: 'from-blue-500 to-cyan-500',
  Freelancer: 'from-amber-500 to-orange-500',
  Company: 'from-teal-500 to-emerald-500',
  Organization: 'from-indigo-500 to-purple-500'
};

// Button Component with proper color theming
const ActionButton: React.FC<{
  children?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  themeMode?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
   title?: string;
}> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  themeMode = 'light',
  size = 'md',
  fullWidth = false,
  className = '',
  title,
}) => {
  const baseClasses = cn(
    "rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2",
    "hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
    fullWidth && "w-full"
  );

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg"
  };

  const variantClasses = {
    primary: cn(
      "text-white shadow-lg hover:shadow-xl",
      themeMode === 'dark' 
        ? 'bg-linear-to-r from-blue-600 to-cyan-600' 
        : 'bg-linear-to-r from-blue-500 to-cyan-500'
    ),
    secondary: cn(
      "text-white shadow-lg hover:shadow-xl",
      themeMode === 'dark'
        ? 'bg-linear-to-r from-purple-600 to-pink-600'
        : 'bg-linear-to-r from-purple-500 to-pink-500'
    ),
    success: cn(
      "text-white shadow-lg hover:shadow-xl",
      themeMode === 'dark'
        ? 'bg-linear-to-r from-green-600 to-emerald-600'
        : 'bg-linear-to-r from-green-500 to-emerald-500'
    ),
    danger: cn(
      "text-white shadow-lg hover:shadow-xl",
      themeMode === 'dark'
        ? 'bg-linear-to-r from-red-600 to-pink-600'
        : 'bg-linear-to-r from-red-500 to-pink-500'
    ),
    outline: cn(
      "border shadow-sm hover:shadow",
      themeMode === 'dark'
        ? 'border-gray-700 bg-gray-900/50 text-gray-300 hover:bg-gray-800/80'
        : 'border-gray-300 bg-white/80 text-gray-700 hover:bg-gray-50'
    ),
    ghost: cn(
      themeMode === 'dark'
        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    )
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      title={title}
    >
      {loading ? (
        <Loader2 className={cn(
          "animate-spin",
          size === 'sm' ? "w-3.5 h-3.5" : size === 'md' ? "w-4 h-4" : "w-5 h-5"
        )} />
      ) : (
        <>
          {icon}
          {children !== undefined && <span>{children}</span>}
        </>
      )}
    </button>
  );
};

// Stats Badge Component
const StatsBadge: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string | number;
  themeMode?: 'light' | 'dark';
}> = ({ icon, label, value, themeMode = 'light' }) => (
  <div className={cn(
    "flex items-center gap-2 px-3 py-2 rounded-lg border",
    themeMode === 'dark'
      ? 'bg-gray-800/50 border-gray-700'
      : 'bg-white/50 border-gray-200'
  )}>
    <div className={cn(
      "p-1.5 rounded-lg",
      themeMode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
    )}>
      {icon}
    </div>
    <div>
      <div className={cn(
        "text-xs",
        themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
      )}>
        {label}
      </div>
      {value !== undefined && (
        <div className={cn(
          "text-sm font-semibold",
          themeMode === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {value}
        </div>
      )}
    </div>
  </div>
);

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
  variant = 'default',
  className = ''
}) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const theme = getTheme(themeMode);
  const roleGradient = ROLE_GRADIENTS[targetType] || ROLE_GRADIENTS.User;

  const handleFollowToggle = async () => {
    try {
      setLoading(true);
      
      // Map UI targetType to backend expected values
      const backendTargetTypeMap: Record<string, 'User' | 'Company' | 'Organization'> = {
        'Candidate': 'User',
        'Freelancer': 'User',
        'User': 'User',
        'Company': 'Company',
        'Organization': 'Organization'
      };
      
      const backendTargetType = backendTargetTypeMap[targetType] || 'User';
      
      // Optimistic update
      setIsFollowing(!isFollowing);
      
      const result = await followService.toggleFollow(targetId, {
        targetType: backendTargetType,
      });
      
      // Update with actual result
      setIsFollowing(result.following);
      onAction?.(result.following ? 'follow' : 'unfollow', { targetId, targetType });
    } catch (error) {
      // Revert optimistic update
      setIsFollowing(isFollowing);
      console.error('Failed to toggle follow:', error);
      onAction?.('follow_error', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      setMessageLoading(true);
      onAction?.('message', { targetId, targetName });
      // Navigate to messages
      window.location.href = `/dashboard/messages?user=${targetId}`;
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

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: targetName,
        text: `Check out ${targetName}'s profile on Banana Social`,
        url: shareUrl,
      }).catch(() => {
        navigator.clipboard.writeText(shareUrl);
        onAction?.('share', { url: shareUrl });
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      onAction?.('share', { url: shareUrl });
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onAction?.(isSaved ? 'unsave' : 'save', { targetId, targetType });
  };

  const handleReport = () => {
    if (showConfirm) {
      onAction?.('report', { targetId, targetType });
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 5000);
    }
  };

  // Check if this profile can have specific features
  const canHaveProducts = targetType === 'Company' || targetType === 'Organization';
  const canHaveResume = targetType === 'Candidate' && targetData?.cvs?.length > 0;
  const canHavePortfolio = targetType === 'Freelancer' && targetData?.portfolio?.length > 0;
  const hasContactInfo = targetData?.phone || targetData?.email;
  const isVerified = targetData?.verified || targetData?.isVerified;

  // Container classes based on variant and theme
  const containerClasses = cn(
    "flex flex-col gap-3 md:gap-4 rounded-2xl md:rounded-3xl shadow-xl",
    variant === 'default' && "p-4 md:p-6",
    variant === 'compact' && "p-3 md:p-4",
    variant === 'expanded' && "p-5 md:p-8",
    themeMode === 'dark'
      ? 'bg-gray-900/90 border border-gray-800'
      : 'bg-white/90 border border-gray-200',
    className
  );

  const sectionTitleClasses = cn(
    "text-sm font-medium mb-3",
    themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
  );

  const dividerClasses = cn(
    "my-3 md:my-4",
    themeMode === 'dark' ? 'border-gray-800' : 'border-gray-200'
  );

  return (
    <div className={containerClasses}>
      {/* Header with Role-based Gradient */}
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          "p-2.5 rounded-lg bg-linear-to-r",
          roleGradient,
          "shadow-md"
        )}>
          {targetType === 'Company' ? (
            <Building className="w-4 h-4 text-white" />
          ) : targetType === 'Organization' ? (
            <Users className="w-4 h-4 text-white" />
          ) : targetType === 'Freelancer' ? (
            <Briefcase className="w-4 h-4 text-white" />
          ) : (
            <UserPlus className="w-4 h-4 text-white" />
          )}
        </div>
        <div>
          <h4 className={cn(
            "font-semibold",
            themeMode === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {targetName}
          </h4>
          <p className={cn(
            "text-xs",
            themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            {targetType === 'Candidate' ? 'Job Seeker' : targetType}
          </p>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-2">
        {targetData?.followerCount !== undefined && (
          <StatsBadge
            icon={<Users className={cn(
              "w-3.5 h-3.5",
              themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )} />}
            label="Followers"
            value={targetData.followerCount.toLocaleString()}
            themeMode={themeMode}
          />
        )}
        {targetData?.postCount !== undefined && (
          <StatsBadge
            icon={<FileText className={cn(
              "w-3.5 h-3.5",
              themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )} />}
            label="Posts"
            value={targetData.postCount.toLocaleString()}
            themeMode={themeMode}
          />
        )}
      </div>

      <hr className={dividerClasses} />

      {/* Primary Actions */}
      <div className="space-y-2">
        <h5 className={sectionTitleClasses}>Quick Actions</h5>
        <div className="flex flex-wrap gap-2">
          {/* Follow/Unfollow Button */}
          <ActionButton
            onClick={handleFollowToggle}
            loading={loading}
            variant={isFollowing ? "outline" : "primary"}
            icon={isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            size="sm"
            themeMode={themeMode}
            className="flex-1"
          >
            {isFollowing ? 'Following' : 'Follow'}
          </ActionButton>

          {/* Message Button */}
          {showMessage && (
            <ActionButton
              onClick={handleMessage}
              loading={messageLoading}
              variant="secondary"
              icon={<MessageCircle className="w-4 h-4" />}
              size="sm"
              themeMode={themeMode}
              className="flex-1"
            >
              Message
            </ActionButton>
          )}

          {/* Share Button */}
          <ActionButton
            onClick={handleShare}
            variant="outline"
            icon={<Share2 className="w-4 h-4" />}
            size="sm"
            themeMode={themeMode}
            className="flex-1"
          >
            Share
          </ActionButton>
        </div>
      </div>

      {/* Secondary Actions */}
      {(canHaveResume || canHavePortfolio || canHaveProducts || showViewNetwork || showViewPosts) && (
        <>
          <hr className={dividerClasses} />
          <div className="space-y-2">
            <h5 className={sectionTitleClasses}>Explore</h5>
            <div className="grid grid-cols-2 gap-2">
              {showViewNetwork && (
                <ActionButton
                  onClick={() => {
                    window.location.href = `/profile/${targetId}/network`;
                    onAction?.('view_network', { targetId });
                  }}
                  variant="ghost"
                  icon={<Users className="w-4 h-4" />}
                  size="sm"
                  themeMode={themeMode}
                  className="justify-start"
                >
                  Network
                </ActionButton>
              )}

              {showViewPosts && (
                <ActionButton
                  onClick={() => {
                    window.location.href = `/profile/${targetId}/posts`;
                    onAction?.('view_posts', { targetId });
                  }}
                  variant="ghost"
                  icon={<FileText className="w-4 h-4" />}
                  size="sm"
                  themeMode={themeMode}
                  className="justify-start"
                >
                  Posts
                </ActionButton>
              )}

              {canHaveProducts && showProducts && (
                <ActionButton
                  onClick={() => {
                    window.location.href = `/company/${targetId}/products`;
                    onAction?.('view_products', { targetId });
                  }}
                  variant="ghost"
                  icon={<Package className="w-4 h-4" />}
                  size="sm"
                  themeMode={themeMode}
                  className="justify-start"
                >
                  Products
                </ActionButton>
              )}

              {canHavePortfolio && showPortfolio && (
                <ActionButton
                  onClick={() => {
                    window.location.href = `/freelancer/${targetId}/portfolio`;
                    onAction?.('view_portfolio', { targetId });
                  }}
                  variant="ghost"
                  icon={<Briefcase className="w-4 h-4" />}
                  size="sm"
                  themeMode={themeMode}
                  className="justify-start"
                >
                  Portfolio
                </ActionButton>
              )}

              {canHaveResume && showResume && (
                <ActionButton
                  onClick={handleDownloadResume}
                  loading={downloadLoading}
                  variant="ghost"
                  icon={<Download className="w-4 h-4" />}
                  size="sm"
                  themeMode={themeMode}
                  className="justify-start"
                >
                  Resume
                </ActionButton>
              )}
            </div>
          </div>
        </>
      )}

      {/* Contact Info (Mobile) */}
      {hasContactInfo && (
        <>
          <hr className={dividerClasses} />
          <div className="space-y-2">
            <h5 className={sectionTitleClasses}>Contact</h5>
            <div className="flex flex-wrap gap-2">
              {targetData?.phone && (
                <ActionButton
                  onClick={() => window.location.href = `tel:${targetData.phone}`}
                  variant="outline"
                  icon={<Phone className="w-4 h-4" />}
                  size="sm"
                  themeMode={themeMode}
                >
                  Call
                </ActionButton>
              )}
              {targetData?.email && (
                <ActionButton
                  onClick={() => window.location.href = `mailto:${targetData.email}`}
                  variant="outline"
                  icon={<Mail className="w-4 h-4" />}
                  size="sm"
                  themeMode={themeMode}
                >
                  Email
                </ActionButton>
              )}
            </div>
          </div>
        </>
      )}

      {/* Location & Verification */}
      {(targetData?.location || isVerified) && (
        <>
          <hr className={dividerClasses} />
          <div className="space-y-2">
            {targetData?.location && (
              <div className={cn(
                "flex items-center gap-2 text-sm",
                themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                <MapPin className="w-4 h-4" />
                <span>{targetData.location}</span>
              </div>
            )}
            {isVerified && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Shield className="w-4 h-4" />
                <span>Verified Account</span>
                <Check className="w-3 h-3" />
              </div>
            )}
          </div>
        </>
      )}

      {/* Utility Actions */}
      <hr className={dividerClasses} />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <ActionButton
            onClick={handleSave}
            variant="ghost"
            icon={<Heart className={cn("w-4 h-4", isSaved && "fill-current text-red-500")} />}
            size="sm"
            themeMode={themeMode}
            title={isSaved ? 'Unsave' : 'Save'}
          ></ActionButton>
          <ActionButton
            onClick={handleReport}
            variant="ghost"
            icon={showConfirm ? <Check className="w-4 h-4 text-red-500" /> : <Flag className="w-4 h-4" />}
            size="sm"
            themeMode={themeMode}
            title={showConfirm ? 'Confirm Report' : 'Report'}
          ></ActionButton>
        </div>
        <ActionButton
          onClick={() => {
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
          }}
          variant="ghost"
          icon={<Eye className="w-4 h-4" />}
          size="sm"
          themeMode={themeMode}
        >
          View Full
        </ActionButton>
      </div>
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
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const backendTargetTypeMap: Record<string, 'User' | 'Company' | 'Organization'> = {
        'Candidate': 'User',
        'Freelancer': 'User',
        'User': 'User',
        'Company': 'Company',
        'Organization': 'Organization'
      };
      const backendTargetType = backendTargetTypeMap[targetType] || 'User';
      
      const result = await followService.toggleFollow(targetId, {
        targetType: backendTargetType,
      });
      setIsFollowing(result.following);
      onAction(result.following ? 'follow' : 'unfollow', { targetId, targetType });
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActionClasses = cn(
    "p-2.5 rounded-xl transition-all border",
    themeMode === 'dark'
      ? 'bg-gray-800/60 hover:bg-gray-700 border-gray-700 hover:border-blue-500 text-gray-300 hover:text-blue-300'
      : 'bg-white/60 hover:bg-white border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600'
  );

  return (
    <div className={cn("flex gap-2", className)}>
      <button
        onClick={handleFollow}
        disabled={loading}
        className={cn(
          "p-2.5 rounded-xl transition-all",
          isFollowing
            ? themeMode === 'dark'
              ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-linear-to-r from-purple-500 to-pink-500 text-white'
            : quickActionClasses
        )}
        title={isFollowing ? 'Following' : 'Follow'}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <UserMinus className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
      </button>
      <button
        onClick={() => {
          setIsSaved(!isSaved);
          onAction(isSaved ? 'unsave' : 'save', { targetId, targetType });
        }}
        className={cn(
          "p-2.5 rounded-xl transition-all",
          isSaved
            ? themeMode === 'dark'
              ? 'text-red-400 bg-red-900/20'
              : 'text-red-500 bg-red-50'
            : quickActionClasses
        )}
        title={isSaved ? 'Unsave' : 'Save'}
      >
        <Heart className={cn("w-4 h-4", isSaved && "fill-current")} />
      </button>
      <button
        onClick={() => {
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
        }}
        className={quickActionClasses}
        title="Share"
      >
        <Share2 className="w-4 h-4" />
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
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const backendTargetTypeMap: Record<string, 'User' | 'Company' | 'Organization'> = {
        'Candidate': 'User',
        'Freelancer': 'User',
        'User': 'User',
        'Company': 'Company',
        'Organization': 'Organization'
      };
      const backendTargetType = backendTargetTypeMap[targetType] || 'User';
      
      const result = await followService.toggleFollow(targetId, {
        targetType: backendTargetType,
      });
      setIsFollowing(result.following);
      onAction(result.following ? 'follow' : 'unfollow', { targetId, targetType });
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 md:hidden">
      <div className="relative">
        {isExpanded && (
          <div className="absolute bottom-full right-0 mb-2 animate-in slide-in-from-bottom-2 duration-200">
            <div className={cn(
              "flex flex-col gap-2 p-3 rounded-xl shadow-2xl border",
              themeMode === 'dark'
                ? 'bg-gray-900 border-gray-800'
                : 'bg-white border-gray-200'
            )}>
              <button
                onClick={handleFollow}
                disabled={loading}
                className={cn(
                  "p-3 rounded-lg transition-all flex items-center gap-2 min-w-[140px]",
                  isFollowing
                    ? themeMode === 'dark'
                      ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-linear-to-r from-purple-500 to-pink-500 text-white'
                    : themeMode === 'dark'
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    <span className="text-sm">Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span className="text-sm">Follow</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  window.location.href = `/dashboard/messages?user=${targetId}`;
                  onAction('message', { targetId, targetType });
                  setIsExpanded(false);
                }}
                className={cn(
                  "p-3 rounded-lg transition-all flex items-center gap-2",
                  themeMode === 'dark'
                    ? 'bg-linear-to-r from-blue-600 to-cyan-600 text-white'
                    : 'bg-linear-to-r from-blue-500 to-cyan-500 text-white'
                )}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Message</span>
              </button>
              
              <button
                onClick={() => {
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
                  setIsExpanded(false);
                }}
                className={cn(
                  "p-3 rounded-lg transition-all flex items-center gap-2",
                  themeMode === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Share</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-14 h-14 rounded-full shadow-2xl transition-all flex items-center justify-center",
            "bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          )}
        >
          {isExpanded ? (
            <X className="w-6 h-6" />
          ) : (
            <UserPlus className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
};