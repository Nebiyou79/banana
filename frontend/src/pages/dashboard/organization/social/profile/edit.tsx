// pages/social/organization/profile/edit.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { organizationService, OrganizationProfile } from '@/services/organizationService';
import { profileService, Profile } from '@/services/profileService';
import { roleProfileService } from '@/services/roleProfileService';
import { OrganizationProfileForm } from '@/components/profile/OrganizationProfileEditForm';
import { toast } from 'sonner';
import {
    Users,
    ArrowLeft,
    CheckCircle,
    X,
    Sparkles,
    BadgeCheck,
    Loader2,
    Heart,
    Target
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import Head from 'next/head';

export default function OrganizationEditProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile | null>(null);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [roleSpecificData, setRoleSpecificData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profileCompletion, setProfileCompletion] = useState(0);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Check if user is authorized (organization role)
        if (user) {
            if (user.role !== 'organization') {
                toast.error('Only organization accounts can access this page');
                router.push('/social/dashboard');
                return;
            }
            setIsAuthorized(true);
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

                // Fetch role-specific data
                try {
                    const roleData = await roleProfileService.getOrganizationProfile();
                    setRoleSpecificData(roleData);
                } catch (error) {
                    console.warn('Role-specific data not available:', error);
                    setRoleSpecificData({});
                }

                // Calculate profile completion
                try {
                    const completion = await profileService.getProfileCompletion();
                    setProfileCompletion(completion.percentage);
                } catch (error) {
                    console.warn('Profile completion not available:', error);
                    setProfileCompletion(0);
                }
            }
        } catch (error) {
            console.error('Failed to fetch organization data:', error);
            toast.error('Failed to load organization data');
        } finally {
            setLoading(false);
        }
    };

    const handleFormSuccess = () => {
        toast.success('Profile updated successfully');
        fetchOrganizationData(); // Refresh data
    };

    const handleCancel = () => {
        router.back();
    };

    const handleBackToProfile = () => {
        router.push('/social/organization/profile');
    };

    // Show loading while checking authorization
    if (!isAuthorized && loading) {
        return (
            <SocialDashboardLayout requiredRole="organization">
                <RoleThemeProvider>
                    <div className="min-h-screen flex items-center justify-center">
                        <Card className="max-w-4xl w-full mx-auto p-8">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                <p className="text-gray-600">Loading...</p>
                            </div>
                        </Card>
                    </div>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    if (loading) {
        return (
            <SocialDashboardLayout requiredRole="organization">
                <RoleThemeProvider>
                    <div className="min-h-screen flex items-center justify-center">
                        <Card className="max-w-4xl w-full mx-auto p-8">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                <p className="text-gray-600">Loading organization profile...</p>
                            </div>
                        </Card>
                    </div>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    if (!organizationProfile) {
        return (
            <>
                <Head>
                    <title>Create Organization Profile - Banana Social</title>
                </Head>
                <SocialDashboardLayout requiredRole="organization">
                    <RoleThemeProvider>
                        <div className="container mx-auto px-4 py-8 max-w-6xl">
                            <Card className="p-8">
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
                                        <Users className="w-12 h-12 text-white" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                                        Create Your Organization Profile
                                    </h1>
                                    <p className="text-gray-600 max-w-lg mx-auto mb-8">
                                        Create your organization profile to showcase your mission and connect with volunteers and donors.
                                    </p>
                                    <div className="max-w-2xl mx-auto">
                                        <OrganizationProfileForm
                                            onSuccess={() => {
                                                toast.success('Organization profile created successfully');
                                                router.push('/social/organization/profile');
                                            }}
                                            onCancel={handleCancel}
                                            mode="create"
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </RoleThemeProvider>
                </SocialDashboardLayout>
            </>
        );
    }

    // Prepare initial data for the form
    const initialData = {
        profile: userProfile || undefined,
        organizationProfile: organizationProfile,
        roleSpecific: roleSpecificData
    };

    return (
        <>
            <Head>
                <title>Edit Organization Profile - Banana Social</title>
            </Head>
            <SocialDashboardLayout requiredRole="organization">
                <RoleThemeProvider>
                    <div className="container mx-auto px-4 py-8 max-w-6xl">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                        className="flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back
                                    </Button>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                            Edit Organization Profile
                                        </h1>
                                        <p className="text-gray-600 mt-1">
                                            Showcase your mission, impact, and organizational values
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 bg-indigo-100 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${profileCompletion}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-indigo-700">
                                            {profileCompletion}% Complete
                                        </span>
                                    </div>
                                    <Button
                                        onClick={handleBackToProfile}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        View Profile
                                    </Button>
                                </div>
                            </div>

                            <Separator />
                        </div>

                        {/* Main Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Form - Takes 2/3 width on large screens */}
                            <div className="lg:col-span-2">
                                <Card className="p-6">
                                    <OrganizationProfileForm
                                        initialData={initialData}
                                        onSuccess={handleFormSuccess}
                                        onCancel={handleCancel}
                                        mode="edit"
                                    />
                                </Card>
                            </div>

                            {/* Sidebar - Takes 1/3 width on large screens */}
                            <div className="space-y-6">
                                {/* Profile Completion */}
                                <Card className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                                            <Target className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg mb-3">
                                                Profile Progress
                                            </h3>
                                            <div className="mb-4">
                                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                                    <div
                                                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${profileCompletion}%` }}
                                                    />
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Complete your profile to increase visibility and trust
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Impact Tips */}
                                <Card className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                                            <Heart className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg mb-3">
                                                Maximize Your Impact
                                            </h3>
                                            <ul className="space-y-3">
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-600">
                                                        Clearly articulate your mission and values
                                                    </span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-600">
                                                        Showcase impact through numbers and stories
                                                    </span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-600">
                                                        Highlight volunteer opportunities
                                                    </span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-600">
                                                        Connect social media to increase engagement
                                                    </span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </Card>

                                {/* Current Organization Info */}
                                <Card className="p-6">
                                    <h3 className="font-bold text-gray-900 text-lg mb-4">
                                        Current Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Organization Name</p>
                                            <p className="text-gray-900">{organizationProfile.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Organization Type</p>
                                            <p className="text-gray-900">
                                                {organizationService.getOrganizationTypeLabel(organizationProfile.organizationType || '')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Location</p>
                                            <p className="text-gray-900">{organizationProfile.address || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Verification Status</p>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${organizationProfile.verified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                <span className="text-gray-900">
                                                    {organizationProfile.verified ? 'Verified' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Quick Actions */}
                                <Card className="p-6">
                                    <h3 className="font-bold text-gray-900 text-lg mb-4">
                                        Quick Actions
                                    </h3>
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => {
                                                router.push('/social/organization/verification');
                                            }}
                                        >
                                            <BadgeCheck className="w-4 h-4 mr-2" />
                                            Get Verified
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => {
                                                router.push('/social/organization/volunteers');
                                            }}
                                        >
                                            <Users className="w-4 h-4 mr-2" />
                                            Manage Volunteers
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => {
                                                router.push('/social/organization/impact');
                                            }}
                                        >
                                            <Target className="w-4 h-4 mr-2" />
                                            Track Impact
                                        </Button>
                                    </div>
                                </Card>

                                {/* Support Card */}
                                <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
                                    <h3 className="font-bold text-gray-900 text-lg mb-3">
                                        Need Assistance?
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Our support team is here to help you maximize your organization's impact.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            router.push('/help/support');
                                        }}
                                    >
                                        Contact Support
                                    </Button>
                                </Card>
                            </div>
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="mt-8 pt-6 border-t">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Last updated: {organizationProfile.updatedAt ? new Date(organizationProfile.updatedAt).toLocaleDateString() : 'Never'}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleCancel}
                                        className="flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleBackToProfile}
                                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        View Profile
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        </>
    );
}