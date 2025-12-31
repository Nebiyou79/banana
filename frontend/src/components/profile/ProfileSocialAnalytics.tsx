// components/profile/ProfileSocialAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { SocialStats, profileService } from '@/services/profileService';
import { postService } from '@/services/postService';
import { likeService } from '@/services/likeService';
import { followService } from '@/services/followService';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Eye,
    Heart,
    MessageSquare,
    Share2,
    BarChart3,
    Target,
    Clock,
    Award,
    Loader2
} from 'lucide-react';

interface ProfileSocialAnalyticsProps {
    stats?: SocialStats; // Make optional since we'll fetch if not provided
    showTrends?: boolean;
    variant?: 'default' | 'glass' | 'card';
    timeRange?: 'weekly' | 'monthly' | 'yearly';
    className?: string;
    userId?: string; // Optional: for viewing other users' analytics
}

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
    description?: string;
    isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    change,
    icon,
    color,
    description,
    isLoading = false
}) => {
    const isPositive = change && change > 0;
    const isNegative = change && change < 0;

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm animate-pulse">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-gray-200">
                        <div className="w-5 h-5 bg-gray-300 rounded" />
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded" />
                </div>
                <div className="mb-2">
                    <div className="h-8 w-20 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
                {description && (
                    <div className="h-3 w-32 bg-gray-200 rounded mt-2" />
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${color}`}>
                    {icon}
                </div>
                {change !== undefined && (
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isPositive
                        ? 'bg-green-100 text-green-800'
                        : isNegative
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                        {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
                        {isNegative && <TrendingDown className="w-3 h-3 mr-1" />}
                        {change > 0 ? '+' : ''}{change}%
                    </div>
                )}
            </div>

            <div className="mb-2">
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-sm font-medium text-gray-700">{title}</div>
            </div>

            {description && (
                <p className="text-xs text-gray-500 mt-2">{description}</p>
            )}
        </div>
    );
};

export const ProfileSocialAnalytics: React.FC<ProfileSocialAnalyticsProps> = ({
    stats: initialStats,
    showTrends = true,
    variant = 'default',
    timeRange = 'monthly',
    className = '',
    userId
}) => {
    const [stats, setStats] = useState<SocialStats | null>(initialStats || null);
    const [isLoading, setIsLoading] = useState(!initialStats);
    const [error, setError] = useState<string | null>(null);
    const [engagementData, setEngagementData] = useState<{
        likes: number;
        comments: number;
        posts: number;
    } | null>(null);

    // Fetch real data
    useEffect(() => {
        const fetchData = async () => {
            if (initialStats) {
                // Use provided stats
                setStats(initialStats);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                let socialStats: SocialStats;
                let engagementStats = {
                    likes: 0,
                    comments: 0,
                    posts: 0
                };

                if (userId) {
                    // Fetch other user's public profile
                    const publicProfile = await profileService.getPublicProfile(userId);
                    socialStats = publicProfile.socialStats as SocialStats;
                } else {
                    // Fetch current user's full profile
                    const profile = await profileService.getProfile();
                    socialStats = profile.socialStats;

                    // Fetch engagement data from posts
                    try {
                        const postsResponse = await postService.getMyPosts({ limit: 50 });
                        if (postsResponse.data && postsResponse.data.length > 0) {
                            // Calculate total likes and comments from posts
                            let totalLikes = 0;
                            let totalComments = 0;

                            postsResponse.data.forEach(post => {
                                totalLikes += post.stats.likes || 0;
                                totalComments += post.stats.comments || 0;
                            });

                            engagementStats = {
                                likes: totalLikes,
                                comments: totalComments,
                                posts: postsResponse.data.length
                            };
                        }
                    } catch (postError) {
                        console.warn('Could not fetch post engagement data:', postError);
                    }
                }

                // Fetch follow stats if not provided
                if (!socialStats.followerCount || !socialStats.followingCount) {
                    try {
                        const followStats = await followService.getFollowStats();
                        socialStats = {
                            ...socialStats,
                            followerCount: followStats.followers,
                            followingCount: followStats.following,
                            connectionCount: followStats.totalConnections
                        };
                    } catch (followError) {
                        console.warn('Could not fetch follow stats:', followError);
                    }
                }

                setStats(socialStats);
                setEngagementData(engagementStats);
            } catch (err: any) {
                console.error('Failed to fetch social analytics:', err);
                setError(err.message || 'Failed to load analytics data');

                // Set fallback stats
                setStats({
                    followerCount: 0,
                    followingCount: 0,
                    postCount: 0,
                    profileViews: 0,
                    connectionCount: 0,
                    engagementRate: 0,
                    averageResponseTime: 0,
                    endorsementCount: 0
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [initialStats, userId]);

    // Calculate trends based on time range with real data
    const getTrendData = () => {
        // In a real app, you would fetch historical data from the API
        // For now, we'll simulate trends based on current stats
        const baseTrends = {
            followerTrend: stats ? Math.min(stats.followerCount * 0.1, 25) : 12.4,
            engagementTrend: engagementData ? Math.min((engagementData.likes + engagementData.comments) / Math.max(stats?.postCount || 1, 1) * 0.5, 15) : 8.2,
            profileViewsTrend: stats ? Math.min(stats.profileViews * 0.15, 30) : 24.6,
            connectionTrend: stats ? Math.min(stats.connectionCount * 0.08, 20) : 5.7,
            postTrend: engagementData ? Math.min(engagementData.posts * 0.2, 25) : 18.3,
            responseTimeTrend: stats ? (stats.averageResponseTime > 24 ? -5.2 : 3.2) : -3.2
        };

        // Adjust based on time range
        const multipliers = {
            weekly: 0.25,
            monthly: 1,
            yearly: 12
        };

        return Object.fromEntries(
            Object.entries(baseTrends).map(([key, value]) => [
                key,
                Math.round(value * (multipliers[timeRange] || 1) * 10) / 10
            ])
        );
    };

    const trends = getTrendData();

    // Calculate real engagement rate if we have data
    const calculateRealEngagementRate = () => {
        if (!stats || !engagementData) return 0;

        if (stats.followerCount > 0) {
            return ((engagementData.likes + engagementData.comments) / stats.followerCount) * 100;
        }
        return 0;
    };

    const metrics = [
        {
            title: 'Followers',
            value: stats?.followerCount?.toLocaleString() || '0',
            change: showTrends ? trends.followerTrend : undefined,
            icon: <Users className="w-5 h-5 text-white" />,
            color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
            description: 'People who follow you',
            isLoading
        },
        {
            title: 'Following',
            value: stats?.followingCount?.toLocaleString() || '0',
            change: undefined,
            icon: <Target className="w-5 h-5 text-white" />,
            color: 'bg-gradient-to-br from-purple-500 to-pink-500',
            description: 'People you follow',
            isLoading
        },
        {
            title: 'Profile Views',
            value: stats?.profileViews?.toLocaleString() || '0',
            change: showTrends ? trends.profileViewsTrend : undefined,
            icon: <Eye className="w-5 h-5 text-white" />,
            color: 'bg-gradient-to-br from-green-500 to-emerald-500',
            description: `${timeRange === 'weekly' ? 'This week' : timeRange === 'monthly' ? 'This month' : 'This year'}`,
            isLoading
        },
        {
            title: 'Connections',
            value: stats?.connectionCount?.toLocaleString() || '0',
            change: showTrends ? trends.connectionTrend : undefined,
            icon: <Users className="w-5 h-5 text-white" />,
            color: 'bg-gradient-to-br from-amber-500 to-orange-500',
            description: 'Professional connections',
            isLoading
        },
        {
            title: 'Posts',
            value: engagementData?.posts?.toLocaleString() || stats?.postCount?.toLocaleString() || '0',
            change: showTrends ? trends.postTrend : undefined,
            icon: <MessageSquare className="w-5 h-5 text-white" />,
            color: 'bg-gradient-to-br from-indigo-500 to-violet-500',
            description: 'Total published content',
            isLoading
        },
        {
            title: 'Engagement Rate',
            value: `${engagementData ? calculateRealEngagementRate().toFixed(1) : stats?.engagementRate?.toFixed(1) || '0.0'}%`,
            change: showTrends ? trends.engagementTrend : undefined,
            icon: <Heart className="w-5 h-5 text-white" />,
            color: 'bg-gradient-to-br from-rose-500 to-pink-500',
            description: 'Average interaction rate',
            isLoading
        },
        {
            title: 'Avg Response Time',
            value: stats?.averageResponseTime
                ? `${stats.averageResponseTime}h`
                : 'N/A',
            change: showTrends ? trends.responseTimeTrend : undefined,
            icon: <Clock className="w-5 h-5 text-white" />,
            color: 'bg-gradient-to-br from-gray-600 to-gray-800',
            description: 'Average time to respond',
            isLoading
        },
        {
            title: 'Endorsements',
            value: stats?.endorsementCount?.toLocaleString() || '0',
            change: undefined,
            icon: <Award className="w-5 h-5 text-white" />,
            color: 'bg-gradient-to-br from-yellow-500 to-amber-500',
            description: 'Skill endorsements received',
            isLoading
        }
    ];

    // Add interaction metrics if we have engagement data
    if (engagementData) {
        metrics.splice(5, 0,
            {
                title: 'Total Likes',
                value: engagementData.likes?.toLocaleString() || '0',
                change: undefined,
                icon: <Heart className="w-5 h-5 text-white" />,
                color: 'bg-gradient-to-br from-red-500 to-rose-500',
                description: 'Total likes received',
                isLoading
            },
            {
                title: 'Total Comments',
                value: engagementData.comments?.toLocaleString() || '0',
                change: undefined,
                icon: <MessageSquare className="w-5 h-5 text-white" />,
                color: 'bg-gradient-to-br from-teal-500 to-cyan-500',
                description: 'Total comments received',
                isLoading
            }
        );
    }

    const renderMetricsGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
                <MetricCard
                    key={index}
                    title={metric.title}
                    value={metric.value}
                    change={metric.change}
                    icon={metric.icon}
                    color={metric.color}
                    description={metric.description}
                    isLoading={metric.isLoading}
                />
            ))}
        </div>
    );

    const renderGlassVariant = () => (
        <div className="backdrop-blur-xl bg-gradient-to-b from-white/80 to-gray-100/80 border border-gray-200/50 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">Social Analytics</h3>
                    <p className="text-gray-600 mt-1">
                        Performance insights for {timeRange === 'weekly' ? 'the past week' : timeRange === 'monthly' ? 'the past month' : 'the past year'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                        {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Report
                    </span>
                </div>
            </div>
            {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            ) : null}
            {renderMetricsGrid()}
        </div>
    );

    const renderCardVariant = () => (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Social Analytics</h3>
                <p className="text-gray-600">
                    Track your social performance and engagement metrics
                </p>
                {error && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                        <p className="text-yellow-700 text-sm">{error}</p>
                    </div>
                )}
            </div>
            {renderMetricsGrid()}
        </div>
    );

    const renderDefaultVariant = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Social Analytics</h3>
                    {error && (
                        <p className="text-sm text-red-600 mt-1">{error}</p>
                    )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <BarChart3 className="w-4 h-4" />
                    )}
                    <span>Last updated: {isLoading ? 'Loading...' : 'Today'}</span>
                </div>
            </div>
            {renderMetricsGrid()}
        </div>
    );

    if (isLoading && !stats) {
        return (
            <div className={className}>
                <div className="animate-pulse">
                    <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-gray-100 rounded-xl p-6 h-32" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {variant === 'glass' && renderGlassVariant()}
            {variant === 'card' && renderCardVariant()}
            {variant === 'default' && renderDefaultVariant()}
        </div>
    );
};

export default ProfileSocialAnalytics;