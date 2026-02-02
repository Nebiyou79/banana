// pages/dashboard/organization/social/profile/edit.tsx - UPDATED
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { organizationService, OrganizationProfile } from '@/services/organizationService';
import { toast } from 'sonner';
import { Users, ArrowLeft, CheckCircle, X, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import Head from 'next/head';
import { OrganizationProfileEditForm } from '@/components/profile/OrganizationProfileEditForm';

export default function OrganizationEditProfilePage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileCompletion, setProfileCompletion] = useState(0);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');

    // Check authorization first
    useEffect(() => {
        if (!authLoading && user) {
            if (user.role !== 'organization') {
                toast.error('Only organization accounts can access this page');
                router.push('/social/dashboard');
                setIsAuthorized(false);
                return;
            }
            setIsAuthorized(true);
        }
    }, [user, authLoading, router]);

    // Fetch organization data
    const fetchOrganizationData = useCallback(async () => {
        if (!isAuthorized) return;

        try {
            setLoading(true);

            // Fetch organization registration data (organizationService)
            const orgData = await organizationService.getMyOrganization();
            setOrganizationProfile(orgData);

            if (orgData) {
                setMode('edit');
                // Calculate basic profile completion based on available data
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
            console.error('Failed to fetch organization data:', error);

            // Handle specific error cases
            if (error.response?.status === 404) {
                // No organization exists yet - this is expected for create mode
                setOrganizationProfile(null);
                setMode('create');
                setProfileCompletion(0);
            } else if (error.message?.includes('Network error') || error.code === 'ECONNABORTED') {
                toast.error('Network error. Please check your connection and try again.', {
                    duration: 5000,
                });
            } else {
                toast.error('Failed to load organization data');
            }
        } finally {
            setLoading(false);
        }
    }, [isAuthorized]);

    // Fetch data when authorized
    useEffect(() => {
        if (isAuthorized === true) {
            fetchOrganizationData();
        }
    }, [isAuthorized, fetchOrganizationData]);

    const handleFormSuccess = () => {
        toast.success('Profile saved successfully!');
        // Refresh data
        fetchOrganizationData();

        // If we were in create mode and now have an organization, redirect to view profile
        if (mode === 'create') {
            setTimeout(() => {
                router.push('/social/organization/profile');
            }, 1500);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    const handleBackToProfile = () => {
        router.push('/social/organization/profile');
    };

    // Show authorization check loading
    if (authLoading || isAuthorized === null) {
        return (
            <SocialDashboardLayout requiredRole="organization">
                <RoleThemeProvider>
                    <div className="min-h-screen flex items-center justify-center">
                        <Card className="max-w-4xl w-full mx-auto p-8">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                <p className="text-gray-600">Checking authorization...</p>
                            </div>
                        </Card>
                    </div>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    // Show loading while fetching data
    if (loading && isAuthorized) {
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

    // If not authorized (should redirect, but show fallback)
    if (!isAuthorized) {
        return (
            <SocialDashboardLayout requiredRole="organization">
                <RoleThemeProvider>
                    <div className="min-h-screen flex items-center justify-center">
                        <Card className="max-w-4xl w-full mx-auto p-8">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                                <p className="text-gray-600 mb-6">
                                    You don't have permission to access this page.
                                </p>
                                <Button onClick={() => router.push('/social/dashboard')}>
                                    Go to Dashboard
                                </Button>
                            </div>
                        </Card>
                    </div>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    return (
        <>
            <Head>
                <title>{mode === 'create' ? 'Create Organization Profile' : 'Edit Organization Profile'} - Banana Social</title>
            </Head>
            <SocialDashboardLayout requiredRole="organization">
                <RoleThemeProvider>
                    <div className="container mx-auto px-4 py-8 max-w-6xl">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
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
                                            {mode === 'create' ? 'Create Organization Profile' : 'Edit Organization Profile'}
                                        </h1>
                                        <p className="text-gray-600 mt-1">
                                            {mode === 'create'
                                                ? 'Get started by registering your organization'
                                                : 'Showcase your mission, impact, and organizational values'}
                                        </p>
                                    </div>
                                </div>

                                {mode === 'edit' && (
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
                                )}
                            </div>

                            <Separator />
                        </div>

                        {/* Main Form - Full width */}
                        <div className="max-w-6xl mx-auto">
                            {/* CREATE MODE: Full width with call to action */}
                            {mode === 'create' && (
                                <div className="mb-8">
                                    <Card className="p-8 mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                <Building2 className="w-10 h-10 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                                    Welcome to Organization Registration
                                                </h2>
                                                <p className="text-gray-700 mb-4">
                                                    Create your organization profile to unlock powerful features for connecting with volunteers,
                                                    showcasing your impact, and growing your community support.
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <span className="text-xs font-bold text-indigo-600">1</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">Basic Information</h4>
                                                            <p className="text-sm text-gray-600">Register your organization details</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <span className="text-xs font-bold text-indigo-600">2</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">Branding & Media</h4>
                                                            <p className="text-sm text-gray-600">Add logo and banner images</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <span className="text-xs font-bold text-indigo-600">3</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">Complete Profile</h4>
                                                            <p className="text-sm text-gray-600">Add details and social links</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* Form Component */}
                            <Card className="p-6">
                                <OrganizationProfileEditForm
                                    onSuccess={handleFormSuccess}
                                    onCancel={handleCancel}
                                />
                            </Card>

                            {/* EDIT MODE: Additional Information */}
                            {mode === 'edit' && organizationProfile && (
                                <div className="mt-8 space-y-6">
                                    {/* Quick Actions */}
                                    <Card className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            Quick Actions
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start"
                                                onClick={() => {
                                                    router.push('/social/organization/verification');
                                                }}
                                            >
                                                Get Verified
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start"
                                                onClick={() => {
                                                    router.push('/social/organization/volunteers');
                                                }}
                                            >
                                                Manage Volunteers
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start"
                                                onClick={() => {
                                                    router.push('/social/organization/impact');
                                                }}
                                            >
                                                Track Impact
                                            </Button>
                                        </div>
                                    </Card>

                                    {/* Current Organization Info */}
                                    <Card className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            Current Registration Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Organization Name</p>
                                                <p className="text-gray-900 font-medium">{organizationProfile.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Organization Type</p>
                                                <p className="text-gray-900">
                                                    {organizationService.getOrganizationTypeLabel(organizationProfile.organizationType || '')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Registration Number</p>
                                                <p className="text-gray-900">{organizationProfile.registrationNumber || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Verification Status</p>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${organizationProfile.verified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                    <span className={`font-medium ${organizationProfile.verified ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {organizationProfile.verified ? '✓ Verified' : 'Pending Verification'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Address</p>
                                                <p className="text-gray-900">{organizationProfile.address || 'Not specified'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Website</p>
                                                <p className="text-gray-900">{organizationProfile.website || 'Not specified'}</p>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Support Card */}
                                    <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg mb-2">
                                                    Need Assistance?
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Our support team is here to help you maximize your organization's impact.
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    router.push('/help/support');
                                                }}
                                            >
                                                Contact Support
                                            </Button>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* CREATE MODE: Benefits */}
                            {mode === 'create' && (
                                <div className="mt-8 space-y-6">
                                    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                                                <Users className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg mb-2">
                                                    Benefits of Registration
                                                </h3>
                                                <ul className="space-y-2 text-sm text-gray-700">
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                        <span>Recruit volunteers and manage applications</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                        <span>Showcase your projects and impact metrics</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                        <span>Connect with donors and sponsors</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                        <span>Access analytics and insights</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                        <span>Get verified badge for credibility</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="mt-8 pt-6 border-t">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-500">
                                    {mode === 'edit' && organizationProfile && (
                                        <>
                                            Last updated: {organizationProfile.updatedAt ? new Date(organizationProfile.updatedAt).toLocaleDateString() : 'Never'}
                                        </>
                                    )}
                                    {mode === 'create' && (
                                        <>Start building your organization's presence</>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleCancel}
                                        className="flex items-center gap-2"
                                        disabled={isSubmitting}
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </Button>
                                    {mode === 'edit' && (
                                        <Button
                                            onClick={handleBackToProfile}
                                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                                            disabled={isSubmitting}
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            View Profile
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        </>
    );
}