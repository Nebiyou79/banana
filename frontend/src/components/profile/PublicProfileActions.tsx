import React, { useState } from 'react';
import { followService } from '@/services/followService';
import { candidateService } from '@/services/candidateService';
import {
  UserPlus,
  UserMinus,
  MessageCircle,
  Users,
  FileText,
  Package,
  Send,
  Check,
  Loader2,
  Globe,
  Briefcase,
  Building,
  Phone,
  Mail,
  ExternalLink,
  Heart,
  Star,
  Download,
  Eye,
  Target,
  Award,
  Calendar,
  MapPin,
  Shield
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
}

// Glass button component with enhanced styling
const GlassButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
}> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  icon
}) => {
    const baseStyles = "px-4 py-3 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-2 hover:scale-105 active:scale-95";

    const variants = {
      primary: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl border border-blue-400",
      secondary: "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl border border-purple-400",
      success: "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl border border-green-400",
      warning: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl border border-amber-400",
      danger: "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl border border-red-400",
      ghost: "bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-300 hover:border-blue-500 hover:text-blue-600"
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[variant]} ${disabled || loading ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''} ${className}`}
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
}) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

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

  const handleMessage = async () => {
    try {
      setMessageLoading(true);
      // TODO: Implement message functionality with your messaging service
      // For now, we'll trigger an action
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

  // Check if this profile can have specific features
  const canHaveProducts = targetType === 'Company' || targetType === 'Organization';
  const canHaveResume = targetType === 'Candidate' && targetData?.cvs?.length > 0;
  const canHavePortfolio = targetType === 'Freelancer' && targetData?.portfolio?.length > 0;
  const hasContactInfo = targetData?.phone || targetData?.email;
  const isVerified = targetData?.verified || targetData?.isVerified;

  return (
    <div className="flex flex-col gap-4 p-6 backdrop-blur-xl bg-gradient-to-b from-white/90 to-gray-50/90 rounded-3xl border border-gray-200/50 shadow-2xl">
      {/* Primary Actions Row */}
      <div className="flex flex-wrap gap-3">
        {/* Follow/Unfollow Button */}
        <div className="relative group flex-1 min-w-[180px]">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

          <GlassButton
            onClick={handleFollowToggle}
            loading={loading}
            variant={isFollowing ? 'secondary' : 'primary'}
            icon={isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            className="relative w-full"
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
            className="flex-1 min-w-[140px]"
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
            className="flex-1 min-w-[140px]"
          >
            Connect
          </GlassButton>
        )}

        {/* Share Button */}
        <GlassButton
          onClick={handleShare}
          variant="warning"
          icon={<Send className="w-4 h-4" />}
          className="flex-1 min-w-[120px]"
        >
          Share
        </GlassButton>

        {/* Contact Buttons */}
        {hasContactInfo && (
          <div className="flex gap-2">
            {targetData?.phone && (
              <button
                onClick={handleCall}
                className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white hover:scale-105 transition-transform"
                title="Call"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
            {targetData?.email && (
              <button
                onClick={handleEmail}
                className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white hover:scale-105 transition-transform"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Secondary Actions Row */}
      <div className="flex flex-wrap gap-3">
        {/* Role-Specific Actions */}
        {canHaveResume && showResume && (
          <GlassButton
            onClick={handleDownloadResume}
            loading={downloadLoading}
            variant="success"
            icon={<Download className="w-4 h-4" />}
            className="flex-1 min-w-[160px]"
          >
            Download Resume
          </GlassButton>
        )}

        {canHavePortfolio && showPortfolio && (
          <GlassButton
            onClick={handleViewPortfolio}
            variant="warning"
            icon={<Target className="w-4 h-4" />}
            className="flex-1 min-w-[160px]"
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
            className="flex-1 min-w-[140px]"
          >
            Network
          </GlassButton>
        )}

        {showViewPosts && (
          <GlassButton
            onClick={handleViewPosts}
            variant="ghost"
            icon={<FileText className="w-4 h-4" />}
            className="flex-1 min-w-[140px]"
          >
            Posts
          </GlassButton>
        )}

        {showProducts && canHaveProducts && (
          <GlassButton
            onClick={handleViewProducts}
            variant="ghost"
            icon={<Package className="w-4 h-4" />}
            className="flex-1 min-w-[140px]"
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
          className="flex-1 min-w-[160px]"
        >
          View Profile
        </GlassButton>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200/50">
        {targetData?.location && (
          <div className="flex items-center gap-2 p-3 backdrop-blur-sm bg-white/50 rounded-lg border border-gray-200/50">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 truncate">{targetData.location}</span>
          </div>
        )}

        {targetData?.followerCount !== undefined && (
          <div className="flex items-center gap-2 p-3 backdrop-blur-sm bg-white/50 rounded-lg border border-gray-200/50">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-700">{targetData.followerCount} followers</span>
          </div>
        )}

        {targetData?.postCount !== undefined && (
          <div className="flex items-center gap-2 p-3 backdrop-blur-sm bg-white/50 rounded-lg border border-gray-200/50">
            <FileText className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-700">{targetData.postCount} posts</span>
          </div>
        )}

        {isVerified && (
          <div className="flex items-center gap-2 p-3 backdrop-blur-sm bg-white/50 rounded-lg border border-gray-200/50">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-700">Verified</span>
          </div>
        )}
      </div>

      {/* Mobile View Actions */}
      <div className="lg:hidden pt-4 border-t border-gray-200/50">
        <div className="grid grid-cols-3 gap-3">
          {showViewNetwork && (
            <button
              onClick={handleViewNetwork}
              className="flex flex-col items-center p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <Users className="w-5 h-5 mb-2" />
              <span className="text-xs font-medium">Network</span>
            </button>
          )}

          {showViewPosts && (
            <button
              onClick={handleViewPosts}
              className="flex flex-col items-center p-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
            >
              <FileText className="w-5 h-5 mb-2" />
              <span className="text-xs font-medium">Posts</span>
            </button>
          )}

          {showProducts && canHaveProducts && (
            <button
              onClick={handleViewProducts}
              className="flex flex-col items-center p-3 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
            >
              <Package className="w-5 h-5 mb-2" />
              <span className="text-xs font-medium">Products</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-pink-500/10 rounded-full blur-3xl" />
    </div>
  );
};

// Quick Action Buttons Component
export const QuickActions: React.FC<{
  targetId: string;
  targetType: string;
  onAction: (action: string) => void;
  className?: string;
}> = ({ targetId, targetType, onAction, className = '' }) => {
  const actions = [
    { id: 'save', label: 'Save', icon: <Heart className="w-4 h-4" />, variant: 'ghost' as const },
    { id: 'share', label: 'Share', icon: <Send className="w-4 h-4" />, variant: 'ghost' as const },
    { id: 'report', label: 'Report', icon: <FileText className="w-4 h-4" />, variant: 'ghost' as const },
  ];

  return (
    <div className={`flex gap-2 ${className}`}>
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          className="p-2.5 rounded-xl bg-white/60 hover:bg-white border border-gray-200/50 hover:border-blue-500 transition-all"
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
};