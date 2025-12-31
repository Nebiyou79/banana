// pages/social/company/profile/edit.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { companyService, CompanyProfile } from '@/services/companyService';
import { profileService, Profile } from '@/services/profileService';
import { roleProfileService } from '@/services/roleProfileService';
import { CompanyProfileForm } from '@/components/profile/CompanyProfileEditForm';
import { toast } from 'sonner';
import {
    Building,
    ArrowLeft,
    CheckCircle,
    X,
    Sparkles,
    BadgeCheck,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import Head from 'next/head';

export default function CompanyEditProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [roleSpecificData, setRoleSpecificData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Check if user is authorized (company role)
        if (user) {
            if (user.role !== 'company') {
                toast.error('Only company accounts can access this page');
                router.push('/social/dashboard');
                return;
            }
            setIsAuthorized(true);
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

                // Fetch role-specific data
                try {
                    const roleData = await roleProfileService.getCompanyProfile();
                    setRoleSpecificData(roleData);
                } catch (error) {
                    console.warn('Role-specific data not available:', error);
                    setRoleSpecificData({});
                }
            }
        } catch (error) {
            console.error('Failed to fetch company data:', error);
            toast.error('Failed to load company data');
        } finally {
            setLoading(false);
        }
    };

    const handleFormSuccess = () => {
        toast.success('Profile updated successfully');
        fetchCompanyData(); // Refresh data
    };

    const handleCancel = () => {
        router.back();
    };

    const handleBackToProfile = () => {
        router.push('/social/company/profile');
    };

    // Show loading while checking authorization
    if (!isAuthorized && loading) {
        return (
            <SocialDashboardLayout requiredRole="company">
                <RoleThemeProvider>
                    <div className="min-h-screen flex items-center justify-center">
                        <Card className="max-w-4xl w-full mx-auto p-8">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
            <SocialDashboardLayout requiredRole="company">
                <RoleThemeProvider>
                    <div className="min-h-screen flex items-center justify-center">
                        <Card className="max-w-4xl w-full mx-auto p-8">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                <p className="text-gray-600">Loading company profile...</p>
                            </div>
                        </Card>
                    </div>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    if (!companyProfile) {
        return (
            <>
                <Head>
                    <title>Create Company Profile - Banana Social</title>
                </Head>
                <SocialDashboardLayout requiredRole="company">
                    <RoleThemeProvider>
                        <div className="container mx-auto px-4 py-8 max-w-6xl">
                            <Card className="p-8">
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
                                        <Building className="w-12 h-12 text-white" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                                        Create Your Company Profile
                                    </h1>
                                    <p className="text-gray-600 max-w-lg mx-auto mb-8">
                                        You need to create a company profile to access all features.
                                        Complete your company registration to get started.
                                    </p>
                                    <div className="max-w-2xl mx-auto">
                                        <CompanyProfileForm
                                            onSuccess={() => {
                                                toast.success('Company profile created successfully');
                                                router.push('/social/company/profile');
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
        companyProfile: companyProfile || undefined,
        roleSpecific: roleSpecificData
    };

    return (
        <>
            <Head>
                <title>Edit Company Profile - Banana Social</title>
            </Head>
            <SocialDashboardLayout requiredRole="company">
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
                                        <h1 className="text-3xl font-bold text-gray-900">
                                            Edit Company Profile
                                        </h1>
                                        <p className="text-gray-600 mt-1">
                                            Update your company information, branding, and settings
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                                        <BadgeCheck className="w-4 h-4 text-green-500" />
                                        {companyProfile.verified ? 'Verified Company' : 'Pending Verification'}
                                    </span>
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
                                    <CompanyProfileForm
                                        initialData={initialData}
                                        onSuccess={handleFormSuccess}
                                        onCancel={handleCancel}
                                        mode="edit"
                                    />
                                </Card>
                            </div>

                            {/* Sidebar - Takes 1/3 width on large screens */}
                            <div className="space-y-6">
                                {/* Profile Completion Tips */}
                                <Card className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg mb-3">
                                                Profile Completion Tips
                                            </h3>
                                            <ul className="space-y-3">
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-600">
                                                        Complete all required fields marked with *
                                                    </span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-600">
                                                        Add a professional logo and cover photo
                                                    </span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-600">
                                                        Connect social media accounts
                                                    </span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-600">
                                                        Keep company information up to date
                                                    </span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-600">
                                                        Verify your company for trust badge
                                                    </span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </Card>

                                {/* Current Company Info */}
                                <Card className="p-6">
                                    <h3 className="font-bold text-gray-900 text-lg mb-4">
                                        Current Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Company Name</p>
                                            <p className="text-gray-900">{companyProfile.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Industry</p>
                                            <p className="text-gray-900">{companyProfile.industry || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Location</p>
                                            <p className="text-gray-900">{companyProfile.address || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Registration Status</p>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${companyProfile.verified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                <span className="text-gray-900">
                                                    {companyProfile.verified ? 'Verified' : 'Pending'}
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
                                                router.push('/social/company/verification');
                                            }}
                                        >
                                            <BadgeCheck className="w-4 h-4 mr-2" />
                                            Get Verified
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => {
                                                router.push('/social/company/settings');
                                            }}
                                        >
                                            <Building className="w-4 h-4 mr-2" />
                                            Company Settings
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => {
                                                router.push('/social/company/analytics');
                                            }}
                                        >
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            View Analytics
                                        </Button>
                                    </div>
                                </Card>

                                {/* Need Help? */}
                                <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200">
                                    <h3 className="font-bold text-gray-900 text-lg mb-3">
                                        Need Help?
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Contact our support team for assistance with your company profile.
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
                                    Last updated: {companyProfile.updatedAt ? new Date(companyProfile.updatedAt).toLocaleDateString() : 'Never'}
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
                                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
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