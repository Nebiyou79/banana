// app/social/freelancer/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileAboutSection } from '@/components/profile/ProfileAboutSection';
import { ProfilePostsSection } from '@/components/profile/ProfilePostsSection';
import { ProfileConnectionsSection } from '@/components/profile/ProfileConnectionsSection';
import { ProfileSocialAnalytics } from '@/components/profile/ProfileSocialAnalytics';
import { ProfileTabs, ProfileTabContent, TabTransitionWrapper } from '@/components/profile/ProfileTabs';
import { FreelancerPortfolioDisplay } from '@/components/profile/FreelancePortfolioSection';
import { Button } from '@/components/social/ui/Button';
import { Card } from '@/components/social/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    Briefcase,
    DollarSign,
    Target,
    Award,
    Globe,
    MapPin,
    Phone,
    Calendar,
    FileText,
    Users,
    BarChart3,
    Mail,
    Settings,
    Star,
    TrendingUp,
    Eye,
    Sparkles,
    Zap,
    Shield,
    Edit3,
    PlusCircle,
    Clock,
    Heart,
    MessageSquare,
    Download,
    Loader2,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import profileService, { Profile } from '@/services/profileService';
import { roleProfileService } from '@/services/roleProfileService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ProfileInfoCard from '@/components/profile/ProfileInfoCard';
import { PortfolioItem } from '@/services/freelancerService';

interface FreelancerStats {
    profileStrength: number;
    jobSuccessScore: number;
    onTimeDelivery: number;
    responseRate: number;
    totalEarnings: number;
    totalJobs: number;
    activeProposals: number;
    profileViews: number;
    clientReviews: number;
    averageRating: number;
}

export default function FreelancerProfilePage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [roleSpecificData, setRoleSpecificData] = useState<any>(null);
    const [freelancerStats, setFreelancerStats] = useState<FreelancerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFreelancerData();
    }, []);

    const fetchFreelancerData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch user profile and role-specific data in parallel
            const [profileResponse, freelancerResponse] = await Promise.all([
                profileService.getProfile(),
                roleProfileService.getFreelancerProfile()
            ]);

            setProfile(profileResponse as Profile);
            setRoleSpecificData(freelancerResponse);

            // Mock freelancer stats (replace with actual API call)
            const mockStats: FreelancerStats = {
                profileStrength: 85,
                jobSuccessScore: 94,
                onTimeDelivery: 96,
                responseRate: 98,
                totalEarnings: 125000,
                totalJobs: 47,
                activeProposals: 3,
                profileViews: 1248,
                clientReviews: 32,
                averageRating: 4.8
            };
            setFreelancerStats(mockStats);

        } catch (err: any) {
            console.error('Failed to fetch freelancer data:', err);
            setError(err.message || 'Failed to load profile data');
            toast.error('Failed to load freelancer profile');
        } finally {
            setLoading(false);
        }
    };

    const handleEditProfile = () => {
        window.location.href = '/social/freelancer/profile/edit';
    };

    const handleFollow = (isFollowing: boolean) => {
        console.log('Follow status changed:', isFollowing);
    };

    const handleAction = (action: string, data?: any) => {
        switch (action) {
            case 'edit_profile':
                handleEditProfile();
                break;
            case 'share_profile':
                // Handle share logic
                console.log('Sharing profile:', profile);
                break;
            case 'add_portfolio':
                window.location.href = '/social/freelancer/portfolio/create';
                break;
            default:
                console.log('Action:', action, data);
        }
    };

    const getEnhancedProfile = (): Profile => {
        if (!profile) return profileService.createSafeProfile();

        return {
            ...profile,
            headline: roleSpecificData?.headline || profile.headline,
            bio: roleSpecificData?.bio || profile.bio,
            roleSpecific: {
                ...profile.roleSpecific,
                skills: roleSpecificData?.skills || profile.roleSpecific.skills || [],
                education: roleSpecificData?.education || profile.roleSpecific.education || [],
                experience: roleSpecificData?.experience || profile.roleSpecific.experience || [],
                certifications: roleSpecificData?.certifications || profile.roleSpecific.certifications || [],
                portfolio: roleSpecificData?.portfolio || profile.roleSpecific.portfolio || [],
                // languages: roleSpecificData?.languages || [],
                // interests: roleSpecificData?.interests || [],
                // awards: roleSpecificData?.awards || [],
                // volunteerExperience: roleSpecificData?.volunteerExperience || []
            }
        };
    };

    const getFreelancerSpecificData = () => {
        return {
            hourlyRate: roleSpecificData?.hourlyRate || 'Not specified',
            availability: roleSpecificData?.availability?.replace('-', ' ') || 'Not specified',
            experienceLevel: roleSpecificData?.experienceLevel ?
                roleSpecificData.experienceLevel.charAt(0).toUpperCase() +
                roleSpecificData.experienceLevel.slice(1) : 'Not specified'
        };
    };

    const calculateAge = (dateOfBirth?: string): number | null => {
        if (!dateOfBirth) return null;
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const getGenderLabel = (gender?: string): string => {
        const labels: Record<string, string> = {
            'male': 'Male',
            'female': 'Female',
            'other': 'Other',
            'prefer-not-to-say': 'Prefer not to say'
        };
        return gender ? labels[gender] || gender : 'Not specified';
    };

    const renderTabContent = () => {
        const enhancedProfile = getEnhancedProfile();
        const freelancerData = getFreelancerSpecificData();
        const age = calculateAge(enhancedProfile.user.dateOfBirth);
        const isOwnProfile = true;

        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-8">
                        {/* Profile Info Section */}
                        <ProfileInfoCard
                            profile={enhancedProfile}
                            variant="glass"
                            showActions={true}
                            showStats={true}
                            showAnalytics={false}
                            isOwnProfile={isOwnProfile}
                            onFollowChange={handleFollow}
                        />

                        {/* Freelancer Stats */}
                        {freelancerStats && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {[
                                    { label: 'Job Success', value: `${freelancerStats.jobSuccessScore}%`, icon: <TrendingUp className="w-4 h-4" />, color: 'from-green-500 to-emerald-500' },
                                    { label: 'On Time', value: `${freelancerStats.onTimeDelivery}%`, icon: <Clock className="w-4 h-4" />, color: 'from-blue-500 to-cyan-500' },
                                    { label: 'Response Rate', value: `${freelancerStats.responseRate}%`, icon: <MessageSquare className="w-4 h-4" />, color: 'from-purple-500 to-pink-500' },
                                    { label: 'Total Earnings', value: `$${freelancerStats.totalEarnings.toLocaleString()}`, icon: <DollarSign className="w-4 h-4" />, color: 'from-amber-500 to-orange-500' },
                                    { label: 'Rating', value: freelancerStats.averageRating.toFixed(1), icon: <Star className="w-4 h-4" />, color: 'from-red-500 to-rose-500' },
                                ].map((stat, index) => (
                                    <Card key={index} className="backdrop-blur-lg bg-white p-4 text-center border border-gray-200 hover:scale-105 transition-transform duration-300">
                                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 bg-gradient-to-br ${stat.color}`}>
                                            {stat.icon}
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                        <div className="text-xs text-gray-600">{stat.label}</div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Freelancer Details */}
                        <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-3xl p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                                        <Briefcase className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        Freelancer Details
                                    </h3>
                                </div>
                                <Button variant="premium" onClick={handleEditProfile}>
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </Button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Professional Info */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 text-lg mb-4">Professional Information</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-gray-100">
                                                <Briefcase className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600">Headline</div>
                                                <div className="font-medium text-gray-900">
                                                    {enhancedProfile.headline || 'No headline set'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-gray-100">
                                                <DollarSign className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600">Hourly Rate</div>
                                                <div className="font-medium text-gray-900">
                                                    ${freelancerData.hourlyRate}/hr
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-gray-100">
                                                <Clock className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600">Availability</div>
                                                <div className="font-medium text-gray-900">
                                                    {freelancerData.availability}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-gray-100">
                                                <Award className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600">Experience Level</div>
                                                <div className="font-medium text-gray-900">
                                                    {freelancerData.experienceLevel}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Info */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 text-lg mb-4">Personal Information</h4>
                                    <div className="space-y-3">
                                        {enhancedProfile.location && (
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gray-100">
                                                    <MapPin className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Location</div>
                                                    <div className="font-medium text-gray-900">{enhancedProfile.location}</div>
                                                </div>
                                            </div>
                                        )}

                                        {age !== null && (
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gray-100">
                                                    <Calendar className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Age</div>
                                                    <div className="font-medium text-gray-900">{age} years</div>
                                                </div>
                                            </div>
                                        )}

                                        {enhancedProfile.user.gender && (
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gray-100">
                                                    <Users className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Gender</div>
                                                    <div className="font-medium text-gray-900">{getGenderLabel(enhancedProfile.user.gender)}</div>
                                                </div>
                                            </div>
                                        )}

                                        {enhancedProfile.phone && (
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gray-100">
                                                    <Phone className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Phone</div>
                                                    <div className="font-medium text-gray-900">{enhancedProfile.phone}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Skills */}
                            {enhancedProfile.roleSpecific.skills.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-gray-200">
                                    <h4 className="font-bold text-gray-900 text-lg mb-4">Skills & Expertise</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {enhancedProfile.roleSpecific.skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-4 py-2 backdrop-blur-md bg-amber-100 text-amber-800 rounded-xl text-sm border border-amber-200 hover:border-amber-500 hover:scale-105 transition-all duration-300"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Portfolio Preview */}
                        {enhancedProfile.roleSpecific.portfolio.length > 0 && (
                            <div className="mt-8">
                                <FreelancerPortfolioDisplay
                                    portfolioItems={enhancedProfile.roleSpecific.portfolio.slice(0, 6).map(item => ({
                                        ...item,
                                        _id: item._id || '',
                                        description: item.description || '',
                                        mediaUrls: item.mediaUrls || (item.mediaUrl ? [item.mediaUrl] : []),
                                        createdAt: item.createdAt || new Date().toISOString(),
                                        updatedAt: item.updatedAt || new Date().toISOString()
                                    } as PortfolioItem))}
                                    freelancerName={enhancedProfile.user.name}
                                    showFullList={false}
                                    showStats={true}
                                />
                            </div>
                        )}

                        {/* Posts Preview */}
                        {profile?.user?._id && (
                            <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-3xl p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                                            <FileText className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">Recent Posts</h3>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => setActiveTab('posts')}
                                        className="group"
                                    >
                                        View All
                                        <TrendingUp className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>

                                <ProfilePostsSection
                                    userId={profile.user._id}
                                    isOwnProfile={isOwnProfile}
                                    currentUserId={user?.id}
                                    limit={3}
                                    showLoadMore={false}
                                    variant="compact"
                                />
                            </Card>
                        )}
                    </div>
                );

            case 'about':
                return <ProfileAboutSection profile={enhancedProfile} />;

            case 'posts':
                return profile?.user?._id ? (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Your Posts</h2>
                            </div>
                            <Button
                                onClick={() => window.location.href = '/create-post'}
                                variant="premium"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Create Post
                            </Button>
                        </div>

                        <ProfilePostsSection
                            userId={profile.user._id}
                            isOwnProfile={isOwnProfile}
                            currentUserId={user?.id}
                            limit={10}
                            showLoadMore={true}
                        />
                    </div>
                ) : null;

            case 'network':
                return profile?.user?._id ? (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Your Network</h2>
                            </div>
                        </div>

                        <ProfileConnectionsSection
                            userId={profile.user._id}
                            isOwnProfile={isOwnProfile}
                        />
                    </div>
                ) : null;

            case 'portfolio':
                return (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                                    <Briefcase className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Portfolio</h2>
                            </div>
                            <Button
                                onClick={() => window.location.href = '/social/freelancer/portfolio/create'}
                                variant="premium"
                                className="bg-gradient-to-r from-amber-500 to-orange-500"
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Add Project
                            </Button>
                        </div>

                        <FreelancerPortfolioDisplay
                            portfolioItems={enhancedProfile.roleSpecific.portfolio.map(item => ({
                                ...item,
                                _id: item._id || '',
                                description: item.description || '',
                                mediaUrls: item.mediaUrls || (item.mediaUrl ? [item.mediaUrl] : []),
                                createdAt: item.createdAt || new Date().toISOString(),
                                updatedAt: item.updatedAt || new Date().toISOString()
                            } as PortfolioItem))}
                            freelancerName={enhancedProfile.user.name}
                            showFullList={true}
                            showStats={true}
                        />
                    </div>
                );

            case 'analytics':
                return (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                                    <BarChart3 className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
                            </div>
                        </div>

                        <ProfileSocialAnalytics
                            stats={profile?.socialStats}
                            variant="glass"
                            showTrends={true}
                            timeRange="monthly"
                        />

                        {freelancerStats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="backdrop-blur-lg bg-white rounded-2xl p-6 border border-gray-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                                            <TrendingUp className="w-5 h-5 text-white" />
                                        </div>
                                        <h4 className="font-bold text-gray-900">Job Success Rate</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="text-3xl font-bold text-gray-900">{freelancerStats.jobSuccessScore}%</div>
                                        <div className="text-sm text-gray-600">Completed successfully</div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: `${freelancerStats.jobSuccessScore}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="backdrop-blur-lg bg-white rounded-2xl p-6 border border-gray-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                                            <Clock className="w-5 h-5 text-white" />
                                        </div>
                                        <h4 className="font-bold text-gray-900">On-Time Delivery</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="text-3xl font-bold text-gray-900">{freelancerStats.onTimeDelivery}%</div>
                                        <div className="text-sm text-gray-600">Projects delivered on time</div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${freelancerStats.onTimeDelivery}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="backdrop-blur-lg bg-white rounded-2xl p-6 border border-gray-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                                            <DollarSign className="w-5 h-5 text-white" />
                                        </div>
                                        <h4 className="font-bold text-gray-900">Total Earnings</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="text-3xl font-bold text-gray-900">${freelancerStats.totalEarnings.toLocaleString()}</div>
                                        <div className="text-sm text-gray-600">Total revenue earned</div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 w-3/4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <ProfileTabContent
                        activeTab={activeTab}
                        userRole="freelancer"
                        profileType="freelancer"
                        isOwnProfile={isOwnProfile}
                        isPremium={profile?.premium?.isPremium || false}
                        profileData={enhancedProfile}
                        socialStats={profile?.socialStats}
                    />
                );
        }
    };

    if (loading) {
        return (
            <SocialDashboardLayout requiredRole="freelancer">
                <RoleThemeProvider>
                    <div className="space-y-8">
                        {/* Header Skeleton */}
                        <div className="relative rounded-3xl overflow-hidden backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 shadow-2xl">
                            <Skeleton className="h-72 bg-gray-200 animate-pulse" />
                            <div className="relative px-8 pb-8 -mt-12">
                                <div className="relative -top-12 left-8">
                                    <Skeleton className="w-36 h-36 rounded-full bg-gray-300 animate-pulse" />
                                </div>
                                <div className="mt-12 backdrop-blur-xl bg-white rounded-2xl p-6">
                                    <Skeleton className="h-8 bg-gray-200 rounded animate-pulse w-1/4 mb-4" />
                                    <Skeleton className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                                </div>
                            </div>
                        </div>

                        {/* Content Skeleton */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-64 backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 rounded-3xl p-8 border border-gray-200 animate-pulse" />
                                ))}
                            </div>
                        </div>
                    </div>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    if (error) {
        return (
            <SocialDashboardLayout requiredRole="freelancer">
                <RoleThemeProvider>
                    <div className="text-center py-12">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Failed to Load Profile</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Button
                            onClick={fetchFreelancerData}
                            variant="premium"
                            className="backdrop-blur-lg border-gray-300"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    if (!profile) {
        return (
            <SocialDashboardLayout requiredRole="freelancer">
                <RoleThemeProvider>
                    <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-3xl p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Complete Your Freelancer Profile</h3>
                        <p className="text-gray-600 max-w-md mx-auto mb-8">
                            Set up your freelancer profile to showcase your skills, portfolio, and start attracting clients.
                        </p>
                        <Button
                            onClick={handleEditProfile}
                            variant="premium"
                            className="bg-gradient-to-r from-amber-500 to-orange-500"
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Complete Profile
                        </Button>
                    </Card>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    const isOwnProfile = true;
    const enhancedProfile = getEnhancedProfile();

    return (
        <SocialDashboardLayout requiredRole="freelancer">
            <RoleThemeProvider>
                <div className="space-y-8">
                    {/* Profile Header */}
                    <ProfileHeader
                        profile={enhancedProfile}
                        isOwnProfile={isOwnProfile}
                        onFollow={handleFollow}
                    />

                    {/* Profile Tabs */}
                    <ProfileTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        userRole="freelancer"
                        profileType="freelancer"
                        variant="glass"
                        showIcons={true}
                        isOwnProfile={isOwnProfile}
                        isPremium={profile?.premium?.isPremium || false}
                        stats={{
                            posts: profile?.socialStats?.postCount || 0,
                            connections: profile?.socialStats?.connectionCount || 0,
                            followers: profile?.socialStats?.followerCount || 0,
                            following: profile?.socialStats?.followingCount || 0,
                            portfolio: enhancedProfile.roleSpecific.portfolio.length,
                            profileViews: profile?.socialStats?.profileViews || 0,
                            applications: 0,
                            messages: 0,
                            achievements: 0,
                            products: 0
                        }}
                    />

                    {/* Tab Content with Transition */}
                    <TabTransitionWrapper activeTab={activeTab}>
                        {renderTabContent()}
                    </TabTransitionWrapper>

                    {/* Action Buttons */}
                    {isOwnProfile && (
                        <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
                            <Button
                                onClick={() => window.location.href = '/social/freelancer/portfolio/create'}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-xl hover:shadow-2xl transition-all duration-300 group"
                                size="lg"
                            >
                                <PlusCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                Add Portfolio
                            </Button>
                            <Button
                                onClick={handleEditProfile}
                                variant="premium"
                                className="backdrop-blur-lg border-white shadow-xl hover:shadow-2xl transition-all duration-300 group"
                                size="lg"
                            >
                                <Edit3 className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                                Edit Profile
                            </Button>
                        </div>
                    )}
                </div>
            </RoleThemeProvider>
        </SocialDashboardLayout>
    );
}