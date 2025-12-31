// pages/social/organization/profile/index.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { organizationService, OrganizationProfile } from '@/services/organizationService';
import { profileService, Profile } from '@/services/profileService';
import { roleProfileService } from '@/services/roleProfileService';
import { toast } from 'sonner';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileAboutSection } from '@/components/profile/ProfileAboutSection';
import { ProfilePostsSection } from '@/components/profile/ProfilePostsSection';
import { ProfileConnectionsSection } from '@/components/profile/ProfileConnectionsSection';
import { ProfileTabs, ProfileTabContent, TabTransitionWrapper } from '@/components/profile/ProfileTabs';
import { ProfileInfoCard } from '@/components/profile/ProfileInfoCard';
import {
    Users,
    Target,
    Heart,
    Award,
    Globe,
    MapPin,
    Phone,
    Link as LinkIcon,
    FileText,
    Building,
    BarChart3,
    Edit3,
    PlusCircle,
    Eye,
    Sparkles,
    Shield
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Card } from '@/components/social/ui/Card';
import { Badge } from '@/components/social/ui/Badge';

interface OrganizationStats {
    projects: number;
    followers: number;
    following: number;
    posts: number;
    connections: number;
    profileViews: number;
}

interface OrganizationProject {
    _id: string;
    title: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'archived';
    startDate: string;
    endDate?: string;
    impactMetrics?: {
        volunteers?: number;
        beneficiaries?: number;
        fundsRaised?: number;
    };
}

export default function OrganizationProfilePage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile | null>(null);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [roleSpecificData, setRoleSpecificData] = useState<any>(null);
    const [projects, setProjects] = useState<OrganizationProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<OrganizationStats>({
        projects: 0,
        followers: 0,
        following: 0,
        posts: 0,
        connections: 0,
        profileViews: 0
    });

    useEffect(() => {
        if (user) {
            fetchOrganizationData();
        }
    }, [user]);

    const fetchOrganizationData = async () => {
        try {
            setLoading(true);

            // Fetch organization profile
            const organizationData = await organizationService.getMyOrganization();
            setOrganizationProfile(organizationData);

            if (organizationData) {
                // Fetch user profile
                const profileData = await profileService.getProfile();
                setUserProfile(profileData);

                // Fetch role-specific organization data
                try {
                    const roleData = await roleProfileService.getOrganizationProfile();
                    setRoleSpecificData(roleData);

                    // Simulate projects from portfolio data
                    const simulatedProjects: OrganizationProject[] = (roleData.portfolio || []).map((project: any, index: number) => ({
                        _id: project._id || `project-${index}`,
                        title: project.title,
                        description: project.description || 'No description available',
                        status: ['planning', 'active', 'completed', 'archived'][index % 4] as any,
                        startDate: project.completionDate || new Date().toISOString(),
                        impactMetrics: {
                            volunteers: Math.floor(Math.random() * 100) + 10,
                            beneficiaries: Math.floor(Math.random() * 1000) + 100,
                            fundsRaised: Math.floor(Math.random() * 50000) + 5000
                        }
                    }));
                    setProjects(simulatedProjects);

                    // Update stats with actual data
                    setStats(prev => ({
                        ...prev,
                        projects: roleData.portfolio?.length || 0
                    }));
                } catch (error) {
                    console.warn('Failed to fetch role-specific data:', error);
                    setRoleSpecificData({
                        companyInfo: {},
                        portfolio: [],
                        profileCompletion: { percentage: 0, completedSections: [] }
                    });
                    setProjects([]);
                }

                // Calculate stats
                setStats(prev => ({
                    ...prev,
                    followers: profileData?.socialStats?.followerCount || 0,
                    following: profileData?.socialStats?.followingCount || 0,
                    posts: profileData?.socialStats?.postCount || 0,
                    connections: profileData?.socialStats?.connectionCount || 0,
                    profileViews: profileData?.socialStats?.profileViews || 0
                }));
            }
        } catch (error: any) {
            console.error('Failed to fetch organization data:', error);
            toast.error(error.message || 'Failed to load organization profile');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = (isFollowing: boolean) => {
        toast.success(isFollowing ? 'Unfollowed organization' : 'Following organization');
    };

    const handleEdit = () => {
        window.location.href = '/social/organization/profile/edit';
    };

    const handleAction = (action: string, data?: any) => {
        switch (action) {
            case 'edit_profile':
                handleEdit();
                break;
            case 'share':
                if (navigator.share) {
                    navigator.share({
                        title: organizationProfile?.name || 'Organization Profile',
                        text: `Check out ${organizationProfile?.name} on Banana Social`,
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

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            planning: { label: 'Planning', color: 'bg-blue-100 text-blue-800 border-blue-200' },
            active: { label: 'Active', color: 'bg-green-100 text-green-800 border-green-200' },
            completed: { label: 'Completed', color: 'bg-purple-100 text-purple-800 border-purple-200' },
            archived: { label: 'Archived', color: 'bg-gray-100 text-gray-800 border-gray-200' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planning;
        return <Badge className={`px-3 py-1 ${config.color} border`}>{config.label}</Badge>;
    };

    const renderQuickStats = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
                { label: 'Projects', value: stats.projects, icon: <Target className="w-4 h-4" />, color: 'from-green-500 to-emerald-500' },
                { label: 'Followers', value: stats.followers, icon: <Users className="w-4 h-4" />, color: 'from-blue-500 to-cyan-500' },
                { label: 'Following', value: stats.following, icon: <Users className="w-4 h-4" />, color: 'from-purple-500 to-pink-500' },
                { label: 'Posts', value: stats.posts, icon: <FileText className="w-4 h-4" />, color: 'from-amber-500 to-orange-500' },
                { label: 'Connections', value: stats.connections, icon: <Heart className="w-4 h-4" />, color: 'from-red-500 to-rose-500' },
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

    const renderOrganizationDetails = () => (
        <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Organization Details</h3>
                </div>
                <Button
                    variant="premium"
                    onClick={handleEdit}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Details
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Organization Info */}
                <div className="space-y-6">
                    <h4 className="font-bold text-gray-900 text-lg">Basic Information</h4>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-200">
                            <div className="p-2 rounded-lg bg-green-100">
                                <Users className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Organization Name</div>
                                <div className="font-semibold text-gray-900">{organizationProfile?.name}</div>
                            </div>
                        </div>

                        {organizationProfile?.organizationType && (
                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-200">
                                <div className="p-2 rounded-lg bg-blue-100">
                                    <Building className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Organization Type</div>
                                    <div className="font-semibold text-gray-900">
                                        {organizationProfile.organizationType}
                                    </div>
                                </div>
                            </div>
                        )}

                        {organizationProfile?.industry && (
                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-200">
                                <div className="p-2 rounded-lg bg-purple-100">
                                    <Target className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Focus Area</div>
                                    <div className="font-semibold text-gray-900">{organizationProfile.industry}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-6">
                    <h4 className="font-bold text-gray-900 text-lg">Contact Information</h4>
                    <div className="space-y-4">
                        {organizationProfile?.address && (
                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-200">
                                <div className="p-2 rounded-lg bg-amber-100">
                                    <MapPin className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Address</div>
                                    <div className="font-semibold text-gray-900">{organizationProfile.address}</div>
                                </div>
                            </div>
                        )}

                        {organizationProfile?.phone && (
                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-200">
                                <div className="p-2 rounded-lg bg-green-100">
                                    <Phone className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Phone</div>
                                    <div className="font-semibold text-gray-900">{organizationProfile.phone}</div>
                                </div>
                            </div>
                        )}

                        {organizationProfile?.website && (
                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-200">
                                <div className="p-2 rounded-lg bg-blue-100">
                                    <LinkIcon className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Website</div>
                                    <a
                                        href={organizationProfile.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-green-600 hover:text-green-800 hover:underline"
                                    >
                                        {organizationProfile.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mission & Description */}
            <div className="mt-8 space-y-8">
                {organizationProfile?.mission && (
                    <div className="pt-8 border-t border-gray-200">
                        <h4 className="font-bold text-gray-900 text-lg mb-4">Our Mission</h4>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-gray-700 leading-relaxed text-lg italic">
                                    "{organizationProfile.mission}"
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {organizationProfile?.description && (
                    <div className="pt-8 border-t border-gray-200">
                        <h4 className="font-bold text-gray-900 text-lg mb-4">About Us</h4>
                        <div className="bg-white/50 rounded-xl p-6 border border-gray-200">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                {organizationProfile.description}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );

    const renderProjectsPreview = () => {
        if (projects.length === 0) return null;

        return (
            <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-3xl p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">Recent Projects</h3>
                            <p className="text-gray-600">Our latest initiatives and impact</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setActiveTab('projects')}
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                        View All
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.slice(0, 4).map((project) => (
                        <div
                            key={project._id}
                            className="group bg-white/50 rounded-xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <h4 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors">
                                    {project.title}
                                </h4>
                                {getStatusBadge(project.status)}
                            </div>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {project.description}
                            </p>

                            {project.impactMetrics && (
                                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-gray-900">
                                            {project.impactMetrics.volunteers?.toLocaleString() || '0'}
                                        </div>
                                        <div className="text-xs text-gray-600">Volunteers</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-gray-900">
                                            {project.impactMetrics.beneficiaries?.toLocaleString() || '0'}
                                        </div>
                                        <div className="text-xs text-gray-600">Beneficiaries</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-gray-900">
                                            ${project.impactMetrics.fundsRaised?.toLocaleString() || '0'}
                                        </div>
                                        <div className="text-xs text-gray-600">Raised</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        );
    };

    const renderTabContent = () => {
        if (!organizationProfile || !userProfile) return null;

        switch (activeTab) {
            case 'overview':
                return (
                    <TabTransitionWrapper activeTab={activeTab}>
                        <div className="space-y-8">
                            {renderQuickStats()}
                            {renderOrganizationDetails()}
                            {renderProjectsPreview()}
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

            case 'projects':
                return (
                    <TabTransitionWrapper activeTab={activeTab}>
                        <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-3xl p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                                        <Target className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">All Projects</h3>
                                        <p className="text-gray-600">{projects.length} initiatives making an impact</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => window.location.href = '/social/organization/projects/create'}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                >
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    New Project
                                </Button>
                            </div>

                            {projects.length > 0 ? (
                                <div className="space-y-6">
                                    {projects.map((project) => (
                                        <div
                                            key={project._id}
                                            className="bg-white/50 rounded-xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-bold text-xl text-gray-900">{project.title}</h4>
                                                        {getStatusBadge(project.status)}
                                                    </div>
                                                    <p className="text-gray-600 mb-4">{project.description}</p>

                                                    {project.impactMetrics && (
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                                                <Users className="w-5 h-5 text-green-600" />
                                                                <div>
                                                                    <div className="font-bold text-gray-900">{project.impactMetrics.volunteers}</div>
                                                                    <div className="text-sm text-gray-600">Volunteers</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                                                <Heart className="w-5 h-5 text-blue-600" />
                                                                <div>
                                                                    <div className="font-bold text-gray-900">{project.impactMetrics.beneficiaries}</div>
                                                                    <div className="text-sm text-gray-600">Beneficiaries</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                                                <Award className="w-5 h-5 text-purple-600" />
                                                                <div>
                                                                    <div className="font-bold text-gray-900">${project.impactMetrics.fundsRaised?.toLocaleString()}</div>
                                                                    <div className="text-sm text-gray-600">Funds Raised</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
                                        <Target className="w-10 h-10 text-white" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-3">No Projects Yet</h4>
                                    <p className="text-gray-600 max-w-md mx-auto mb-8">
                                        Start your first project to showcase your organization's impact and attract supporters.
                                    </p>
                                    <Button
                                        onClick={() => window.location.href = '/social/organization/projects/create'}
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                    >
                                        <PlusCircle className="w-4 h-4 mr-2" />
                                        Create Your First Project
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </TabTransitionWrapper>
                );

            case 'analytics':
                return (
                    <TabTransitionWrapper activeTab={activeTab}>
                        <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-3xl p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                                    <BarChart3 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Impact Analytics</h3>
                                    <p className="text-gray-600 mt-1">Track your organization's performance and social impact</p>
                                </div>
                            </div>

                            {/* ProfileTabContent will handle rendering ProfileSocialAnalytics */}
                            <ProfileTabContent
                                activeTab={activeTab}
                                userRole="organization"
                                profileType="organization"
                                isPremium={userProfile?.premium?.isPremium || false}
                                isOwnProfile={true}
                                profileData={userProfile}
                                socialStats={userProfile?.socialStats}
                            />

                            {/* Additional Impact Metrics */}
                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <h4 className="font-bold text-gray-900 text-lg mb-6">Impact Summary</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white/50 rounded-xl p-6 text-center border border-gray-200">
                                        <div className="text-3xl font-bold text-green-600 mb-2">
                                            {projects.reduce((sum, p) => sum + (p.impactMetrics?.volunteers || 0), 0).toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-600">Total Volunteers</div>
                                    </div>
                                    <div className="bg-white/50 rounded-xl p-6 text-center border border-gray-200">
                                        <div className="text-3xl font-bold text-blue-600 mb-2">
                                            {projects.reduce((sum, p) => sum + (p.impactMetrics?.beneficiaries || 0), 0).toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-600">Total Beneficiaries</div>
                                    </div>
                                    <div className="bg-white/50 rounded-xl p-6 text-center border border-gray-200">
                                        <div className="text-3xl font-bold text-purple-600 mb-2">
                                            ${projects.reduce((sum, p) => sum + (p.impactMetrics?.fundsRaised || 0), 0).toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-600">Total Funds Raised</div>
                                    </div>
                                    <div className="bg-white/50 rounded-xl p-6 text-center border border-gray-200">
                                        <div className="text-3xl font-bold text-amber-600 mb-2">{projects.length}</div>
                                        <div className="text-sm text-gray-600">Active Projects</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </TabTransitionWrapper>
                );

            default:
                return (
                    <TabTransitionWrapper activeTab={activeTab}>
                        <ProfileTabContent
                            activeTab={activeTab}
                            userRole="organization"
                            profileType="organization"
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
            <SocialDashboardLayout requiredRole="organization">
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

    if (!organizationProfile) {
        return (
            <SocialDashboardLayout requiredRole="organization">
                <RoleThemeProvider>
                    <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-3xl p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
                            <Users className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Organization Profile Found</h3>
                        <p className="text-gray-600 max-w-md mx-auto mb-8">
                            Create your organization profile to showcase your mission, projects, and connect with supporters.
                        </p>
                        <Button
                            onClick={() => window.location.href = '/social/organization/profile/edit'}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white backdrop-blur-lg border-gray-300"
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Create Organization Profile
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
            name: organizationProfile.name,
            avatar: organizationProfile.logoFullUrl || userProfile!.user.avatar,
        },
        coverPhoto: organizationProfile.bannerFullUrl || userProfile!.coverPhoto,
        headline: userProfile!.headline || organizationProfile.mission?.substring(0, 100) || 'Organization Profile',
        location: organizationProfile.address,
        website: organizationProfile.website,
        phone: organizationProfile.phone,
        roleSpecific: {
            ...userProfile!.roleSpecific,
            companyInfo: roleSpecificData?.companyInfo,
            portfolio: roleSpecificData?.portfolio || [],
        }
    };

    return (
        <SocialDashboardLayout requiredRole="organization">
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
                        userRole="organization"
                        profileType="organization"
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
                            onClick={() => window.location.href = '/social/organization/projects/create'}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group"
                            size="lg"
                        >
                            <PlusCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            New Project
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