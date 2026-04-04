// pages/dashboard/organization/social/profile/edit.tsx - REFACTORED
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider, useTheme } from '@/components/social/theme/RoleThemeProvider';
import { organizationService, OrganizationProfile } from '@/services/organizationService';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, CheckCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import Head from 'next/head';
import { OrganizationProfileEditForm } from '@/components/profile/OrganizationProfileEditForm';

// Loading component
const LoadingState = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading organization profile...</p>
        </div>
    </div>
);

// Access denied component
const AccessDenied = ({ router }: { router: any }) => (
    <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
                You need an organization account to access this page.
            </p>
            <Button onClick={() => router.push('/social/dashboard')}>
                Go to Dashboard
            </Button>
        </div>
    </div>
);

// Main content component
const OrganizationEditContent = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { getTextClasses, getRoleColor } = useTheme();
    const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileCompletion, setProfileCompletion] = useState(0);
    const [mode, setMode] = useState<'create' | 'edit'>('create');

    const fetchOrganizationData = useCallback(async () => {
        try {
            setLoading(true);
            const orgData = await organizationService.getMyOrganization();
            setOrganizationProfile(orgData);

            if (orgData) {
                setMode('edit');
                // Calculate basic profile completion
                let completion = 0;
                if (orgData.name) completion += 20;
                if (orgData.description) completion += 15;
                if (orgData.mission) completion += 15;
                if (orgData.address) completion += 10;
                if (orgData.phone || orgData.secondaryPhone) completion += 10;
                if (orgData.website) completion += 10;
                if (orgData.logoUrl || orgData.bannerUrl) completion += 20;
                setProfileCompletion(Math.min(completion, 100));
            } else {
                setMode('create');
                setProfileCompletion(0);
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setOrganizationProfile(null);
                setMode('create');
                setProfileCompletion(0);
            } else {
                toast.error('Failed to load organization data');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrganizationData();
    }, [fetchOrganizationData]);

    const handleFormSuccess = () => {
        toast.success('Profile saved successfully!');
        fetchOrganizationData();

        if (mode === 'create') {
            setTimeout(() => {
                router.push('/dashboard/organization/social/profile/edit');
            }, 1500);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    if (loading) {
        return <LoadingState />;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="flex items-center gap-2 -ml-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className={`text-3xl font-bold ${getTextClasses('primary')}`}>
                                {mode === 'create' ? 'Register Your Organization' : 'Edit Organization Profile'}
                            </h1>
                            <p className={`mt-1 ${getTextClasses('muted')}`}>
                                {mode === 'create'
                                    ? 'Set up your organization profile to start connecting with volunteers and supporters'
                                    : 'Update your organization information, mission, and social presence'}
                            </p>
                        </div>
                    </div>

                    {mode === 'edit' && (
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-3">
                                <div className="text-sm font-medium text-gray-600">
                                    Profile: {profileCompletion}% complete
                                </div>
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${profileCompletion}%`,
                                            backgroundColor: getRoleColor('primary')
                                        }}
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={() => router.push('/dashboard/organization/social/profile')}
                                variant="outline"
                                className="hidden md:flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                View Profile
                            </Button>
                        </div>
                    )}
                </div>

                <Separator className="mb-8" />
            </div>

            {/* Main Form Area */}
            <div className="space-y-8">
                {/* Create mode welcome - only show in create mode */}
                {mode === 'create' && (
                    <div
                        className="p-6 rounded-xl border backdrop-blur-sm"
                        style={{
                            background: 'linear-gradient(135deg, rgba(58, 134, 255, 0.05) 0%, rgba(131, 56, 236, 0.05) 100%)',
                            borderColor: 'rgba(58, 134, 255, 0.2)'
                        }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    Welcome to Organization Setup
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    Complete your organization registration to unlock volunteer management,
                                    impact tracking, and community connection features.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900">✓ Professional Profile</div>
                                        <div className="text-gray-600">Showcase your mission</div>
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900">✓ Volunteer Management</div>
                                        <div className="text-gray-600">Recruit and manage supporters</div>
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900">✓ Community Impact</div>
                                        <div className="text-gray-600">Track and share results</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Component */}
                <OrganizationProfileEditForm
                    onSuccess={handleFormSuccess}
                    onCancel={handleCancel}
                />

                {/* Mobile Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden z-10">
                    <div className="flex justify-between items-center">
                        <Button
                            variant="ghost"
                            onClick={handleCancel}
                            className="text-gray-600"
                        >
                            Cancel
                        </Button>
                        <div className="flex items-center gap-2">
                            {mode === 'edit' && (
                                <Button
                                    onClick={() => router.push('/dashboard/organization/social/profile')}
                                    variant="outline"
                                    size="sm"
                                >
                                    View
                                </Button>
                            )}
                            <div className="text-xs text-gray-500">
                                {profileCompletion}% complete
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main page component
export default function OrganizationEditProfilePage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    // Check authorization
    useEffect(() => {
        if (!authLoading && user && user.role !== 'organization') {
            toast.error('Only organization accounts can access this page');
            router.push('/social/dashboard');
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return (
            <SocialDashboardLayout requiredRole="organization">
                <RoleThemeProvider>
                    <LoadingState />
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    if (!authLoading && user?.role !== 'organization') {
        return (
            <SocialDashboardLayout requiredRole="organization">
                <RoleThemeProvider>
                    <AccessDenied router={router} />
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    return (
        <>
            <Head>
                <title>Organization Profile - Edit</title>
            </Head>
            <SocialDashboardLayout requiredRole="organization">
                <RoleThemeProvider>
                    <OrganizationEditContent />
                </RoleThemeProvider>
            </SocialDashboardLayout>
        </>
    );
}