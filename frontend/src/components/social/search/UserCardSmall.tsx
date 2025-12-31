'use client';

import React, { useState, useEffect } from 'react';
import { SearchProfile } from '@/services/socialSearchService';
import {
    MapPin,
    Briefcase,
    Users,
    Star,
    ExternalLink,
    Building2,
    User,
    Shield,
    Calendar,
    Globe,
    Mail,
    Phone,
    TrendingUp,
    Sparkles,
    CheckCircle
} from 'lucide-react';
import FollowButton from '@/components/social/network/FollowButton';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import followService from '@/services/followService';

interface UserCardSmallProps {
    profile: SearchProfile;
    compact?: boolean;
    showFollowButton?: boolean;
    showMetrics?: boolean;
    className?: string;
    onClick?: (profile: SearchProfile) => void;
    featured?: boolean;
    currentUserId?: string;
}

const UserCardSmall: React.FC<UserCardSmallProps> = ({
    profile,
    compact = false,
    showFollowButton = true,
    showMetrics = true,
    className = '',
    onClick,
    featured = false,
    currentUserId
}) => {
    const router = useRouter();
    const [isFollowing, setIsFollowing] = useState(false);
    const [followStatus, setFollowStatus] = useState<string>('none');

    useEffect(() => {
        const checkFollowStatus = async () => {
            if (showFollowButton && profile._id && currentUserId) {
                try {
                    const status = await followService.getFollowStatus(profile._id, getTargetType());
                    setIsFollowing(status.following || false);
                    setFollowStatus(status.status || 'none');
                } catch (error) {
                    console.error('Error checking follow status:', error);
                }
            }
        };

        checkFollowStatus();
    }, [profile._id, currentUserId, showFollowButton]);

    const getProfileTypeIcon = () => {
        switch (profile.type) {
            case 'company':
                return <Building2 className="w-4 h-4 text-blue-600" />;
            case 'organization':
                return <Building2 className="w-4 h-4 text-purple-600" />;
            case 'freelancer':
                return <User className="w-4 h-4 text-green-600" />;
            case 'candidate':
                return <Briefcase className="w-4 h-4 text-orange-600" />;
            default:
                return <User className="w-4 h-4 text-gray-600" />;
        }
    };

    const getProfileTypeColor = () => {
        switch (profile.type) {
            case 'company': return 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200';
            case 'organization': return 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200';
            case 'freelancer': return 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200';
            case 'candidate': return 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border border-orange-200';
            default: return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200';
        }
    };

    const getProfileTypeLabel = () => {
        switch (profile.type) {
            case 'company': return 'Company';
            case 'organization': return 'Organization';
            case 'freelancer': return 'Freelancer';
            case 'candidate': return 'Candidate';
            case 'user': return 'User';
            default: return profile.type;
        }
    };

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }

        onClick?.(profile);

        const profilePath = profile.type === 'company' || profile.type === 'organization'
            ? `/dashboard/company/${profile._id}`
            : `/dashboard/social/profile/${profile._id}`;

        router.push(profilePath);
    };

    const formatFollowerCount = (count: number) => {
        return followService.formatFollowerCount(count);
    };

    const getTargetType = () => {
        switch (profile.type) {
            case 'company': return 'Company';
            case 'organization': return 'Organization';
            default: return 'User';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const isVerified = profile.verified || profile.verificationStatus === 'verified';
    const isOwnProfile = currentUserId === profile._id;

    const handleFollowChange = (following: boolean) => {
        setIsFollowing(following);
        setFollowStatus(following ? 'accepted' : 'none');
    };

    return (
        <div
            onClick={handleCardClick}
            className={cn(
                'group relative bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden',
                featured && 'border-2 border-blue-300 shadow-lg',
                className
            )}
        >
            {featured && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            )}

            <div className="flex items-start gap-5">
                <div className="flex-shrink-0 relative">
                    <div className={cn(
                        "relative rounded-xl overflow-hidden",
                        compact ? "w-16 h-16" : "w-20 h-20"
                    )}>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
                        {profile.avatar ? (
                            <img
                                src={profile.avatar}
                                alt={profile.name}
                                className="w-full h-full object-cover relative z-10"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white relative z-10 bg-gradient-to-br from-blue-600 to-purple-600">
                                {profile.name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {featured && (
                            <div className="absolute -top-2 -right-2 z-20">
                                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Featured
                                </div>
                            </div>
                        )}
                    </div>

                    {isVerified && (
                        <div className="absolute -bottom-2 -right-2 z-20">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                    {profile.name}
                                </h3>
                                <span className={cn(
                                    'px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1',
                                    getProfileTypeColor()
                                )}>
                                    {getProfileTypeIcon()}
                                    {getProfileTypeLabel()}
                                </span>
                            </div>

                            {profile.headline && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                    {profile.headline}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                {profile.location && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="font-medium">{profile.location}</span>
                                    </div>
                                )}

                                {profile.industry && (
                                    <div className="flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span className="font-medium">{profile.industry}</span>
                                    </div>
                                )}

                                {profile.position && !compact && (
                                    <div className="flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        <span className="font-medium">{profile.position}</span>
                                    </div>
                                )}

                                {showMetrics && profile.followerCount > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" />
                                        <span className="font-medium">{formatFollowerCount(profile.followerCount)} followers</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {showFollowButton && !isOwnProfile && (
                            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                                <FollowButton
                                    targetUserId={profile._id}
                                    targetType={getTargetType()}
                                    initialFollowing={isFollowing}
                                    size={compact ? "sm" : "md"}
                                    variant={isFollowing ? "outline" : "default"}
                                    onFollowChange={handleFollowChange}
                                    className="shadow-sm hover:shadow-md transition-all"
                                />
                            </div>
                        )}
                    </div>

                    {profile.description && !compact && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                            {profile.description}
                        </p>
                    )}

                    {profile.skills && profile.skills.length > 0 && !compact && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {profile.skills.slice(0, 4).map((skill) => (
                                <span
                                    key={skill}
                                    className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200"
                                >
                                    {skill}
                                </span>
                            ))}
                            {profile.skills.length > 4 && (
                                <span className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-500 text-xs font-medium rounded-lg border border-gray-200">
                                    +{profile.skills.length - 4} more
                                </span>
                            )}
                        </div>
                    )}

                    {!compact && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                {profile.joinedDate && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Joined {formatDate(profile.joinedDate)}</span>
                                    </div>
                                )}

                                {profile.website && (
                                    <div className="flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[150px]">{profile.website.replace(/^https?:\/\//, '')}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCardClick(e);
                                }}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2 hover:gap-3 transition-all"
                            >
                                View Profile
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {compact && (
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-3">
                            {profile.joinedDate && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(profile.joinedDate)}</span>
                                </div>
                            )}
                            {profile.followerCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>{formatFollowerCount(profile.followerCount)} followers</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500 pointer-events-none"></div>
        </div>
    );
};

export default UserCardSmall;