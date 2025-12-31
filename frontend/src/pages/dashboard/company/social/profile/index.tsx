// pages/social/company/profile/index.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { companyService, CompanyProfile } from '@/services/companyService';
import { profileService, Profile } from '@/services/profileService';
import { roleProfileService } from '@/services/roleProfileService';
import { toast } from 'sonner';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileAboutSection } from '@/components/profile/ProfileAboutSection';
import { ProfilePostsSection } from '@/components/profile/ProfilePostsSection';
import { ProfileConnectionsSection } from '@/components/profile/ProfileConnectionsSection';
import { ProfileTabs, ProfileTabContent, TabTransitionWrapper } from '@/components/profile/ProfileTabs';
import { CompanyProductsSection } from '@/components/profile/CompanyProductsSection';
import { ProfileInfoCard } from '@/components/profile/ProfileInfoCard';
import {
    Building,
    Package,
    Users,
    Globe,
    Award,
    Briefcase,
    BarChart3,
    Edit3,
    PlusCircle,
    MapPin,
    Phone,
    Link as LinkIcon,
    Eye,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Card } from '@/components/social/ui/Card';

interface CompanyStats {
    products: number;
    followers: number;
    following: number;
    posts: number;
    connections: number;
    profileViews: number;
}

export default function CompanyProfilePage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [roleSpecificData, setRoleSpecificData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<CompanyStats>({
        products: 0,
        followers: 0,
        following: 0,
        posts: 0,
        connections: 0,
        profileViews: 0
    });

    useEffect(() => {
        if (user) {
            fetchCompanyData();
        }
    }, [user]);

    const fetchCompanyData = async () => {
        try {
            setLoading(true);

            // Fetch company profile
            const companyData = await companyService.getMyCompany();
            setCompanyProfile(companyData);

            if (companyData) {
                // Fetch user profile
                const profileData = await profileService.getProfile();
                setUserProfile(profileData);

                // Fetch role-specific company data
                try {
                    const roleData = await roleProfileService.getCompanyProfile();
                    setRoleSpecificData(roleData);
                } catch (error) {
                    console.warn('Failed to fetch role-specific data:', error);
                    setRoleSpecificData({
                        companyInfo: {},
                        portfolio: [],
                        profileCompletion: { percentage: 0, completedSections: [] }
                    });
                }

                // Calculate stats
                const portfolioLength = roleSpecificData?.portfolio?.length || 0;
                setStats({
                    products: portfolioLength,
                    followers: profileData?.socialStats?.followerCount || 0,
                    following: profileData?.socialStats?.followingCount || 0,
                    posts: profileData?.socialStats?.postCount || 0,
                    connections: profileData?.socialStats?.connectionCount || 0,
                    profileViews: profileData?.socialStats?.profileViews || 0
                });
            }
        } catch (error: any) {
            console.error('Failed to fetch company data:', error);
            toast.error(error.message || 'Failed to load company profile');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = (isFollowing: boolean) => {
        toast.success(isFollowing ? 'Unfollowed company' : 'Following company');
    };

    const handleEdit = () => {
        window.location.href = '/social/company/profile/edit';
    };

    const handleAction = (action: string, data?: any) => {
        switch (action) {
            case 'edit_profile':
                handleEdit();
                break;
            case 'view_products':
                window.location.href = `/company/${data?.targetId}/products`;
                break;
            case 'share':
                if (navigator.share) {
                    navigator.share({
                        title: companyProfile?.name || 'Company Profile',
                        text: `Check out ${companyProfile?.name} on Banana Social`,
                        url: window.location.href,
                    });
                } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard');
                }
                break;
            default:
                console.log('Action:', action, data);
        }
    };

    const renderQuickStats = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
                { label: 'Products', value: stats.products, icon: <Package className="w-4 h-4" />, color: 'from-blue-500 to-cyan-500' },
                { label: 'Followers', value: stats.followers, icon: <Users className="w-4 h-4" />, color: 'from-purple-500 to-pink-500' },
                { label: 'Following', value: stats.following, icon: <Users className="w-4 h-4" />, color: 'from-green-500 to-emerald-500' },
                { label: 'Posts', value: stats.posts, icon: <Globe className="w-4 h-4" />, color: 'from-amber-500 to-orange-500' },
                { label: 'Connections', value: stats.connections, icon: <Briefcase className="w-4 h-4" />, color: 'from-red-500 to-rose-500' },
                { label: 'Profile Views', value: stats.profileViews, icon: <Eye className="w-4 h-4" />, color: 'from-indigo-500 to-blue-500' },
            ].map((stat, index) => (
                <Card key={index} className="backdrop-blur-lg bg-white p-4 text-center border border-gray-200 hover:scale-105 transition-transform duration-300">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 bg-gradient-to-br ${stat.color}`}>
                        {stat.icon}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">{stat.label}</div>
                </Card>
            ))}
        </div>
    );

    const renderCompanyDetails = () => (
        <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                        <Building className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Company Details</h3>
                </div>
                <Button variant="premium" onClick={handleEdit}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Details
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Company Info */}
                <div className="space-y-6">
                    <h4 className="font-bold text-gray-900 text-lg">Basic Information</h4>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-200">
                            <div className="p-2 rounded-lg bg-blue-100">
                                <Building className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Company Name</div>
                                <div className="font-semibold text-gray-900">{companyProfile?.name}</div>
                            </div>
                        </div>

                        {companyProfile?.industry && (
                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-200">
                                <div className="p-2 rounded-lg bg-green-100">
                                    <Briefcase className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Industry</div>
                                    <div className="font-semibold text-gray-900">{companyProfile.industry}</div>
                                </div>
                            </div>
                        )}

                        {companyProfile?.tin && (
                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-200">
                                <div className="p-2 rounded-lg bg-purple-100">
                                    <span className="text-purple-600 font-medium">#</span>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Tax ID</div>
                                    <div className="font-semibold text-gray-900">{companyProfile.tin}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-6">
                    <h4 className="font-bold text-gray-900 text-lg">Contact Information</h4>
                    <div className="space-y-4">
                        {companyProfile?.address && (
                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-200">
                                <div className="p-2 rounded-lg bg-amber-100">
                                    <MapPin className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Address</div>
                                    <div className="font-semibold text-gray-900">{companyProfile.address}</div>
                                </div>
                            </div>
                        )}

                        {companyProfile?.phone && (
                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-200">
                                <div className="p-2 rounded-lg bg-green-100">
                                    <Phone className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Phone</div>
                                    <div className="font-semibold text-gray-900">{companyProfile.phone}</div>
                                </div>
                            </div>
                        )}

                        {companyProfile?.website && (
                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-200">
                                <div className="p-2 rounded-lg bg-blue-100">
                                    <LinkIcon className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Website</div>
                                    <a
                                        href={companyProfile.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {companyProfile.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Description */}
            {companyProfile?.description && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <h4 className="font-bold text-gray-900 text-lg mb-4">About Us</h4>
                    <div className="bg-white/50 rounded-xl p-6 border border-gray-200">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {companyProfile.description}
                        </p>
                    </div>
                </div>
            )}
        </Card>
    );

    const renderTabContent = () => {
        if (!companyProfile || !userProfile) return null;

        switch (activeTab) {
            case 'overview':
                return (
                    <TabTransitionWrapper activeTab={activeTab}>
                        <div className="space-y-8">
                            {renderQuickStats()}
                            {renderCompanyDetails()}

                            {companyProfile?._id && (
                                <div className="mb-8">
                                    <CompanyProductsSection
                                        companyId={companyProfile._id}
                                        companyName={companyProfile.name}
                                        isOwnCompany={true}
                                        limit={4}
                                        variant="marketplace"
                                    />
                                </div>
                            )}
                        </div>
                    </TabTransitionWrapper>
                );

            case 'about':
                return (
                    <TabTransitionWrapper activeTab={activeTab}>
                        <ProfileAboutSection profile={userProfile} />
                    </TabTransitionWrapper>
                );

            case 'posts':
                return (
                    <TabTransitionWrapper activeTab={activeTab}>
                        <ProfilePostsSection
                            userId={userProfile._id}
                            isOwnProfile={true}
                            currentUserId={userProfile._id}
                        />
                    </TabTransitionWrapper>
                );

            case 'network':
                return (
                    <TabTransitionWrapper activeTab={activeTab}>
                        <ProfileConnectionsSection
                            userId={userProfile._id}
                            isOwnProfile={true}
                        />
                    </TabTransitionWrapper>
                );

            case 'products':
                return companyProfile && (
                    <TabTransitionWrapper activeTab={activeTab}>
                        <CompanyProductsSection
                            companyId={companyProfile._id}
                            companyName={companyProfile.name}
                            isOwnCompany={true}
                            viewMode="grid"
                            showFilters={true}
                            variant="marketplace"
                        />
                    </TabTransitionWrapper>
                );

            case 'analytics':
                return (
                    <TabTransitionWrapper activeTab={activeTab}>
                        <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-3xl p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                                    <BarChart3 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h3>
                                    <p className="text-gray-600 mt-1">Track your company's performance and growth</p>
                                </div>
                            </div>

                            {/* ProfileTabContent will handle rendering ProfileSocialAnalytics */}
                            <ProfileTabContent
                                activeTab={activeTab}
                                userRole="company"
                                profileType="company"
                                isPremium={userProfile?.premium?.isPremium || false}
                                isOwnProfile={true}
                                profileData={userProfile}
                                socialStats={userProfile?.socialStats}
                            />
                        </Card>
                    </TabTransitionWrapper>
                );

            default:
                return (
                    <TabTransitionWrapper activeTab={activeTab}>
                        <ProfileTabContent
                            activeTab={activeTab}
                            userRole="company"
                            profileType="company"
                            isPremium={userProfile?.premium?.isPremium || false}
                            isOwnProfile={true}
                            profileData={userProfile}
                            socialStats={userProfile?.socialStats}
                        />
                    </TabTransitionWrapper>
                );
        }
    };

    if (loading) {
        return (
            <SocialDashboardLayout requiredRole="company">
                <RoleThemeProvider>
                    <div className="space-y-8">
                        {/* Header Skeleton */}
                        <div className="relative rounded-3xl overflow-hidden backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 shadow-2xl">
                            <div className="h-72 bg-gray-200 animate-pulse" />
                            <div className="relative px-8 pb-8 -mt-12">
                                <div className="relative -top-12 left-8">
                                    <div className="w-36 h-36 rounded-full bg-gray-300 animate-pulse" />
                                </div>
                                <div className="mt-12 backdrop-blur-xl bg-white rounded-2xl p-6">
                                    <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4 mb-4" />
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                                </div>
                            </div>
                        </div>

                        {/* Content Skeleton */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 rounded-3xl p-8 border border-gray-200 animate-pulse">
                                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
                                        <div className="space-y-4">
                                            <div className="h-4 bg-gray-200 rounded w-full" />
                                            <div className="h-4 bg-gray-200 rounded w-5/6" />
                                            <div className="h-4 bg-gray-200 rounded w-4/6" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    if (!companyProfile) {
        return (
            <SocialDashboardLayout requiredRole="company">
                <RoleThemeProvider>
                    <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-3xl p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
                            <Building className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Company Profile Found</h3>
                        <p className="text-gray-600 max-w-md mx-auto mb-8">
                            Create your company profile to showcase your business, products, and connect with customers.
                        </p>
                        <Button
                            onClick={() => window.location.href = '/social/company/profile/edit'}
                            variant="premium"
                            className="backdrop-blur-lg border-gray-300"
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Create Company Profile
                        </Button>
                    </Card>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    const isOwnProfile = true;
    const profileData = {
        ...userProfile!,
        user: {
            ...userProfile!.user,
            name: companyProfile.name,
            avatar: companyProfile.logoFullUrl || userProfile!.user.avatar,
        },
        coverPhoto: companyProfile.bannerFullUrl || userProfile!.coverPhoto,
        headline: userProfile!.headline || companyProfile.description?.substring(0, 100) || 'Company Profile',
        location: companyProfile.address,
        website: companyProfile.website,
        phone: companyProfile.phone,
        roleSpecific: {
            ...userProfile!.roleSpecific,
            companyInfo: roleSpecificData?.companyInfo,
            portfolio: roleSpecificData?.portfolio || [],
        }
    };

    return (
        <SocialDashboardLayout requiredRole="company">
            <RoleThemeProvider>
                <div className="space-y-8 pb-20">
                    {/* Profile Header */}
                    {userProfile && (
                        <ProfileHeader
                            profile={profileData}
                            isOwnProfile={isOwnProfile}
                            onFollow={handleFollow}
                        />
                    )}

                    {/* Profile Info Card */}
                    <ProfileInfoCard
                        profile={profileData}
                        variant="glass"
                        showActions={true}
                        showStats={true}
                        showAnalytics={true}
                        showContactInfo={true}
                        showSocialLinks={true}
                        isOwnProfile={isOwnProfile}
                        onAction={handleAction}
                    />

                    {/* Profile Tabs */}
                    <ProfileTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        userRole="company"
                        profileType="company"
                        variant="glass"
                        showIcons={true}
                        isOwnProfile={isOwnProfile}
                        isPremium={userProfile?.premium?.isPremium || false}
                        stats={stats}
                    />

                    {/* Tab Content */}
                    {renderTabContent()}

                    {/* Floating Action Buttons */}
                    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
                        <Button
                            onClick={() => window.location.href = '/dashboard/products/create'}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group"
                            size="lg"
                        >
                            <PlusCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            Add Product
                        </Button>
                        <Button
                            onClick={handleEdit}
                            variant="premium"
                            className="backdrop-blur-lg border-white shadow-xl hover:shadow-2xl transition-all duration-300 group"
                            size="lg"
                        >
                            <Edit3 className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                            Edit Profile
                        </Button>
                    </div>
                </div>
            </RoleThemeProvider>
        </SocialDashboardLayout>
    );
}