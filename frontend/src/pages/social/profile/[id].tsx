/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/social/user/[id].tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { profileService, DetailedProfile } from '@/services/profileService';
import { followService } from '@/services/followService';
import { companyService } from '@/services/companyService';
import { organizationService } from '@/services/organizationService';
import { roleProfileService } from '@/services/roleProfileService';
import { useAuth } from '@/contexts/AuthContext';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { ProfileTabs, ProfileTabContent, TabTransitionWrapper } from '@/components/profile/ProfileTabs';
import { Card } from '@/components/social/ui/Card';
import { Button } from '@/components/social/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/social/ui/Badge';
import {
    ArrowLeft,
    Globe,
    Users,
    Briefcase,
    Building2,
    Sparkles,
    ExternalLink,
    Shield,
    MapPin,
    Link as LinkIcon,
    MessageCircle,
    Award,
    Mail as MailIcon,
    Loader2,
    AlertCircle,
    Eye,
    Heart,
    Share2,
    Moon,
    Sun,
    Target,
    FileText,
    BarChart3,
    Star,
    TrendingUp,
    Zap,
    BookOpen,
    Layers,
    Phone,
    Map,
    UserCheck,
    Users as UsersIcon,
    Edit3,
    CheckCircle,
    Calendar,
    GraduationCap,
    Code,
    Palette,
    ShoppingCart,
    FolderOpen
} from 'lucide-react';
import { colors } from '@/utils/color';
import { candidateService } from '@/services/candidateService';
import { freelancerService } from '@/services/freelancerService';
import Link from 'next/link';

// Role-specific configuration
const ROLE_CONFIG = {
    candidate: {
        icon: Briefcase,
        label: 'Job Seeker',
        primaryColor: 'from-blue-500 to-blue-600',
        lightColor: 'bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-700 dark:text-blue-300'
    },
    freelancer: {
        icon: Sparkles,
        label: 'Freelancer',
        primaryColor: 'from-purple-500 to-purple-600',
        lightColor: 'bg-purple-50 dark:bg-purple-900/20',
        textColor: 'text-purple-700 dark:text-purple-300'
    },
    company: {
        icon: Building2,
        label: 'Company',
        primaryColor: 'from-green-500 to-green-600',
        lightColor: 'bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-700 dark:text-green-300'
    },
    organization: {
        icon: Users,
        label: 'Organization',
        primaryColor: 'from-teal-500 to-teal-600',
        lightColor: 'bg-teal-50 dark:bg-teal-900/20',
        textColor: 'text-teal-700 dark:text-teal-300'
    }
};

// Profile Header Component
const ProfileHeader = ({ profile, isOwnProfile, onFollow, roleConfig, followLoading }: {
    profile: DetailedProfile;
    isOwnProfile: boolean;
    onFollow: () => void;
    roleConfig: typeof ROLE_CONFIG[keyof typeof ROLE_CONFIG];
    followLoading: boolean;
}) => {
    const [isFollowing, setIsFollowing] = useState(false);

    const handleFollowToggle = async () => {
        await onFollow();
        setIsFollowing(!isFollowing);
    };

    const getCoverPhoto = () => {
        if (profile.coverPhoto) return profile.coverPhoto;
        if (profile.user.coverPhoto) return profile.user.coverPhoto;
        return `linear-gradient(135deg, ${colors.goldenMustard} 0%, ${colors.darkNavy} 100%)`;
    };

    const getAvatar = () => {
        if (profile.user.avatar) return profile.user.avatar;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user.name)}&background=${colors.goldenMustard.slice(1)}&color=fff`;
    };

    return (
        <div className="relative mb-8">
            {/* Cover Photo */}
            <div
                className="h-48 md:h-56 rounded-t-2xl mb-16 relative overflow-hidden"
                style={{
                    background: getCoverPhoto().startsWith('linear-gradient')
                        ? getCoverPhoto()
                        : `url('${getCoverPhoto()}') center/cover no-repeat`
                }}
            >
                {/* Overlay gradient */}
                <div className='absolute inset-0 bg-gray' />
            </div>

            {/* Profile Info Card */}
            <div className="relative px-4 md:px-8">
                {/* Avatar */}
                <div className="absolute -top-16 left-4 md:left-8">
                    <div className="relative">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden">
                            <img
                                src={getAvatar()}
                                alt={profile.user.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user.name)}&background=6366f1&color=fff`;
                                }}
                            />
                        </div>
                        {profile.verificationStatus === 'verified' && (
                            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-lg">
                                <Shield className={`h-5 w-5 md:h-6 md:w-6 ${colors.gray400}`} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Info */}
                <Card className="backdrop-blur-lg bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 md:p-6 pt-20 md:pt-24">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    {profile.user.name}
                                </h1>

                                {/* Role Badge */}
                                <Badge
                                    className={`${roleConfig.lightColor} ${roleConfig.textColor} border-transparent px-3 py-1`}
                                >
                                    <span className="flex items-center gap-1">
                                        <roleConfig.icon className="h-3.5 w-3.5" />
                                        <span className="capitalize">{roleConfig.label}</span>
                                    </span>
                                </Badge>
                            </div>

                            {profile.headline && (
                                <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">{profile.headline}</p>
                            )}

                            {/* Quick Info */}
                            <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400 mb-4">
                                {profile.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{profile.location}</span>
                                    </div>
                                )}

                                {profile.website && (
                                    <a
                                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        <span className="truncate max-w-[200px]">{profile.website.replace(/^https?:\/\//, '')}</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <span className="font-medium text-gray-900 dark:text-white">{profile.socialStats.profileViews}</span>
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">views</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <span className="font-medium text-gray-900 dark:text-white">{profile.socialStats.followerCount}</span>
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">followers</span>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Joined {new Date(profile.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long'
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">

                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: profile.user.name,
                                            text: `Check out ${profile.user.name}'s profile on Banana Social`,
                                            url: window.location.href,
                                        });
                                    } else {
                                        navigator.clipboard.writeText(window.location.href);
                                        // Show toast notification
                                    }
                                }}
                            >
                                <Share2 className="h-4 w-4" />
                                Share
                            </Button>

                            {!isOwnProfile && (
                                <Button
                                    onClick={handleFollowToggle}
                                    size="sm"
                                    disabled={followLoading}
                                    className={`flex items-center gap-2 ${isFollowing ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 'bg-gradient-to-r ' + roleConfig.primaryColor + ' text-white'}`}
                                >
                                    {followLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            {isFollowing ? (
                                                <>
                                                    <UserCheck className="h-4 w-4" />
                                                    Following
                                                </>
                                            ) : (
                                                <>
                                                    <UsersIcon className="h-4 w-4" />
                                                    Follow
                                                </>
                                            )}
                                        </>
                                    )}
                                </Button>
                            )}

                            {!isOwnProfile && (
                                <Button
                                    onClick={() => window.location.href = `/dashboard/messages?user=${profile.user._id}`}
                                    variant="premium"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    Message
                                </Button>
                            )}

                            {isOwnProfile && (
                                <Button
                                    onClick={() => window.location.href = `/social/${profile.user.role}/profile/edit`}
                                    variant="premium"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Quick Stats Section
const QuickStatsSection = ({ profile }: { profile: DetailedProfile }) => {

    const stats = [
        { label: 'Posts', value: profile.socialStats.postCount, icon: FileText, color: colors.blue },
        { label: 'Connections', value: profile.socialStats.connectionCount, icon: Users, color: colors.darkNavy },
        { label: 'Followers', value: profile.socialStats.followerCount, icon: Heart, color: colors.gold },
        { label: 'Following', value: profile.socialStats.followingCount, icon: UsersIcon, color: colors.teal },
    ];

    return (
        <Card className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="h-5 w-5" style={{ color: colors.gold }} />
                Quick Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="text-center p-3 rounded-lg border dark:border-gray-600"
                        style={{
                            backgroundColor: 'AccentColor',
                            borderColor: 'ButtonBorder'
                        }}
                    >
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

// Bio Section
const BioSection = ({ profile, showFullBio, setShowFullBio }: {
    profile: DetailedProfile;
    showFullBio: boolean;
    setShowFullBio: (show: boolean) => void;
}) => {

    if (!profile.bio) return null;

    return (
        <Card className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5" style={{ color: colors.gold }} />
                Bio
            </h3>
            <div className="space-y-3">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {showFullBio || profile.bio.length < 300
                        ? profile.bio
                        : `${profile.bio.substring(0, 300)}...`
                    }
                </p>
                {profile.bio.length > 300 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFullBio(!showFullBio)}
                        className="px-0"
                        style={{ color: colors.blue }}
                    >
                        {showFullBio ? 'Show less' : 'Read more'}
                    </Button>
                )}
            </div>
        </Card>
    );
};

// Skills Section
const SkillsSection = ({ profile }: { profile: DetailedProfile }) => {

    if (!profile.roleSpecific?.skills || profile.roleSpecific.skills.length === 0) return null;

    return (
        <Card className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="h-5 w-5" style={{ color: colors.gold }} />
                Skills & Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
                {profile.roleSpecific.skills.slice(0, 12).map((skill, index) => (
                    <span
                        key={index}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium"
                        style={{
                            backgroundColor: 'whitesmoke',
                            color: 'burlywood',
                            border: 'blue'
                        }}
                    >
                        {skill}
                    </span>
                ))}
            </div>
        </Card>
    );
};

// Social Links Section
const SocialLinksSection = ({ profile }: { profile: DetailedProfile }) => {

    if (!profile.socialLinks || Object.values(profile.socialLinks).every(link => !link)) return null;

    const platformConfig = {
        linkedin: { icon: '👔', color: '#0A66C2' },
        twitter: { icon: '🐦', color: '#1DA1F2' },
        github: { icon: '💻', color: '#181717' },
        facebook: { icon: '📘', color: '#1877F2' },
        instagram: { icon: '📸', color: '#E4405F' },
        tiktok: { icon: '🎵', color: '#000000' },
        telegram: { icon: '📨', color: '#26A5E4' },
        youtube: { icon: '🎥', color: '#FF0000' }
    };

    return (
        <Card className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 p-6 mb-6 md:mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" style={{ color: colors.blue }} />
                Connect Elsewhere
            </h3>
            <div className="flex flex-wrap gap-3">
                {Object.entries(profile.socialLinks).map(([platform, url]) => {
                    if (!url) return null;

                    const config = platformConfig[platform as keyof typeof platformConfig];
                    if (!config) return null;

                    return (
                        <a
                            key={platform}
                            href={profileService.formatSocialLink(platform, url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className='flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border'
                            style={{
                                backgroundColor: 'Menu',
                                borderColor: 'AccentColor'
                            }}
                        >
                            <span className="text-lg">{config.icon || '🔗'}</span>
                            <span className="capitalize font-medium" style={{ color: config.color }}>
                                {platform}
                            </span>
                            <ExternalLink className="h-3 w-3" style={{ color: config.color }} />
                        </a>
                    );
                })}
            </div>
        </Card>
    );
};

// Main Profile Content Component
const ProfileContent = () => {
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const { id: userId } = router.query;
    const profileUserId = Array.isArray(userId) ? userId[0] : userId;

    const [profile, setProfile] = useState<DetailedProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [showFullBio, setShowFullBio] = useState(false);
    const [roleSpecificData, setRoleSpecificData] = useState<any>(null);
    const [previousTab, setPreviousTab] = useState<string>('');

    const isOwnProfile = useMemo(() => {
        return currentUser?._id === profileUserId;
    }, [currentUser, profileUserId]);

    const roleConfig = useMemo(() => {
        return ROLE_CONFIG[profile?.user.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.candidate;
    }, [profile]);

    // Track previous tab for animations
    useEffect(() => {
        if (activeTab !== previousTab) {
            setPreviousTab(activeTab);
        }
    }, [activeTab]);

    // Fetch profile data
    useEffect(() => {
        if (!profileUserId) return;

        fetchProfile();
    }, [profileUserId]);

    // Check follow status
    useEffect(() => {
        if (!profile || !currentUser || isOwnProfile || !profileUserId) return;

        checkFollowStatus();
    }, [profile, currentUser, isOwnProfile, profileUserId]);

    const fetchProfile = async () => {
        if (!profileUserId) return;

        try {
            setLoading(true);
            setError(null);

            const profileData = await profileService.getPublicProfile(profileUserId) as DetailedProfile;
            setProfile(profileData);

            // Fetch role-specific data
            if (profileData?.user?._id) {
                try {
                    let roleData = null;
                    switch (profileData.user.role) {
                        case 'company':
                            roleData = await companyService.getCompany(profileData.user._id);
                            break;
                        case 'organization':
                            roleData = await organizationService.getOrganization(profileData.user._id);
                            break;
                        case 'candidate':
                            roleData = await candidateService.getProfile();
                            break;
                        case 'freelancer':
                            roleData = await freelancerService.getProfile();
                            break;
                    }
                    setRoleSpecificData(roleData);
                } catch (roleErr) {
                    console.warn('Failed to fetch role-specific data:', roleErr);
                }
            }

        } catch (err: any) {
            console.error('Failed to fetch profile:', err);
            setError(err.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const checkFollowStatus = async () => {
        if (!profile || !profileUserId) return;

        try {
            const status = await followService.getFollowStatus(
                profile.user._id,
                profile.user.role as 'User' | 'Company' | 'Organization'
            );
            setIsFollowing(status.following);
        } catch (err) {
            console.error('Failed to check follow status:', err);
        }
    };

    const handleFollowToggle = async () => {
        if (!profile || !profileUserId) {
            router.push('/login?redirect=' + encodeURIComponent(router.asPath));
            return;
        }

        if (!currentUser) {
            router.push('/login?redirect=' + encodeURIComponent(router.asPath));
            return;
        }

        if (isOwnProfile) return;

        try {
            setFollowLoading(true);
            const result = await followService.toggleFollow(profile.user._id, {
                targetType: profile.user.role as 'User' | 'Company' | 'Organization',
            });
            setIsFollowing(result.following);

            // Update local stats
            if (profile) {
                setProfile({
                    ...profile,
                    socialStats: {
                        ...profile.socialStats,
                        followerCount: result.following
                            ? profile.socialStats.followerCount + 1
                            : Math.max(0, profile.socialStats.followerCount - 1)
                    }
                });
            }
        } catch (err) {
            console.error('Failed to toggle follow:', err);
        } finally {
            setFollowLoading(false);
        }
    };

    const getRoleLabel = () => {
        if (!profile) return '';

        switch (profile.user.role) {
            case 'candidate': return 'Job Seeker';
            case 'freelancer': return 'Freelancer';
            case 'company': return 'Company';
            case 'organization': return 'Organization';
            default: return profile.user.role;
        }
    };

    const getStats = () => {
        if (!profile) return {};

        return {
            posts: profile.socialStats.postCount,
            connections: profile.socialStats.connectionCount,
            followers: profile.socialStats.followerCount,
            following: profile.socialStats.followingCount,
            profileViews: profile.socialStats.profileViews,
            products: roleSpecificData?.products?.length || 0,
            portfolio: roleSpecificData?.portfolio?.length || 0,
            applications: roleSpecificData?.applications?.length || 0
        };
    };

    const renderOverview = () => {
        if (!profile) return null;

        return (
            <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                    <BioSection
                        profile={profile}
                        showFullBio={showFullBio}
                        setShowFullBio={setShowFullBio}
                    />
                    <QuickStatsSection profile={profile} />
                </div>

                <SkillsSection profile={profile} />
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-4 md:p-8">
                <div className="mb-8">
                    <Skeleton className="h-8 w-48 mb-2 dark:bg-gray-700" />
                    <Skeleton className="h-4 w-64 dark:bg-gray-700" />
                </div>

                <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="lg:col-span-2 space-y-6 md:space-y-8">
                        <Skeleton className="h-64 rounded-xl dark:bg-gray-700" />
                        <Skeleton className="h-96 rounded-xl dark:bg-gray-700" />
                    </div>
                    <div className="space-y-6 md:space-y-8">
                        <Skeleton className="h-48 rounded-xl dark:bg-gray-700" />
                        <Skeleton className="h-64 rounded-xl dark:bg-gray-700" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex items-center justify-center p-4 md:p-8">
                <Card className="max-w-md w-full backdrop-blur-lg bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 p-6 md:p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {error || 'The profile you are looking for does not exist or is not accessible.'}
                    </p>
                    <div className="space-y-3">
                        <Button
                            onClick={() => router.back()}
                            variant="premium"
                            className="w-full"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                        <Button
                            onClick={() => router.push('/')}
                            variant="outline"
                            className="w-full"
                        >
                            Go Home
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const componentProps = {
        profileData: profile,
        socialStats: profile.socialStats,
        userId: profile.user._id,
        isOwnProfile,
        currentUserId: currentUser?._id,
        companyId: profile.user._id,
        companyName: profile.user.name,
        candidateData: roleSpecificData,
        freelancerData: roleSpecificData,
        companyData: roleSpecificData,
        portfolioItems: roleSpecificData?.portfolio || [],
        freelancerName: profile.user.name
    };

    return (
        <>
            <Head>
                <title>{profile.user.name} - {getRoleLabel()} Profile | Banana Social</title>
                <meta name="description" content={profile.bio || `${profile.user.name}'s profile on Banana Social`} />
                {profile.user.avatar && (
                    <meta property="og:image" content={profile.user.avatar} />
                )}
            </Head>

            {/* Profile Header */}
            <ProfileHeader
                profile={profile}
                isOwnProfile={isOwnProfile}
                onFollow={handleFollowToggle}
                roleConfig={roleConfig}
                followLoading={followLoading}
            />

            {/* Profile Tabs */}
            <ProfileTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                userRole={profile.user.role}
                profileType={
                    profile.user.role === 'company' ? 'company' :
                        profile.user.role === 'organization' ? 'organization' :
                            profile.user.role === 'freelancer' ? 'freelancer' :
                                profile.user.role === 'candidate' ? 'candidate' : 'user'
                }
                variant="glass"
                showIcons={true}
                isOwnProfile={isOwnProfile}
                stats={getStats()}
                componentProps={componentProps}
            />

            {/* Tab Content */}
            <TabTransitionWrapper activeTab={activeTab} previousTab={previousTab} className="mt-8">
                {activeTab === 'overview' ? (
                    renderOverview()
                ) : (
                    <ProfileTabContent
                        activeTab={activeTab}
                        userRole={profile.user.role}
                        profileType={
                            profile.user.role === 'company' ? 'company' :
                                profile.user.role === 'organization' ? 'organization' :
                                    profile.user.role === 'freelancer' ? 'freelancer' :
                                        profile.user.role === 'candidate' ? 'candidate' : 'user'
                        }
                        isOwnProfile={isOwnProfile}
                        profileData={profile}
                        socialStats={profile.socialStats}
                        componentProps={componentProps}
                    />
                )}
            </TabTransitionWrapper>

            {/* Social Links */}
            <SocialLinksSection profile={profile} />
        </>
    );
};

// Main Page Component
const PublicProfilePage = () => {
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const { id: userId } = router.query;
    const profileUserId = Array.isArray(userId) ? userId[0] : userId;

    const [profileRole, setProfileRole] = useState<string>('candidate');

    useEffect(() => {
        if (profileUserId) {
            // Fetch profile role for theme
            const fetchProfileRole = async () => {
                try {
                    const profileData = await profileService.getPublicProfile(profileUserId) as DetailedProfile;
                    setProfileRole(profileData.user.role);
                } catch (err) {
                    console.error('Failed to fetch profile role:', err);
                }
            };
            fetchProfileRole();
        }
    }, [profileUserId]);

    // For logged-in users, wrap in dashboard layout
    if (currentUser) {
        return (
            <SocialDashboardLayout>
                <RoleThemeProvider overrideRole={profileRole as any}>
                    <div className="space-y-8 pb-20">
                        <ProfileContent />
                    </div>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    // For public/guest users, show standalone page
    return (
        <RoleThemeProvider overrideRole={profileRole as any}>
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                {/* Public Navigation */}
                <nav className="sticky top-0 z-40 backdrop-blur-lg bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/')}
                                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Home
                            </Button>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push('/login')}
                                >
                                    Sign In
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => router.push('/register')}
                                >
                                    Join Free
                                </Button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <ProfileContent />
                </main>

                {/* Public Footer */}
                <footer className="border-t border-gray-200 dark:border-gray-800 py-6 bg-white/50 dark:bg-gray-900/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                            <div className="mb-2 md:mb-0">
                                <p>© {new Date().getFullYear()} Banana Social • All rights reserved</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Link href="/about" className="hover:text-gray-900 dark:hover:text-white transition-colors">About</Link>
                                <span>•</span>
                                <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
                                <span>•</span>
                                <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </RoleThemeProvider>
    );
};

export default PublicProfilePage;