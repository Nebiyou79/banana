/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/social/profile/edit.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider, useTheme } from '@/components/social/theme/RoleThemeProvider';
import { companyService, type CompanyProfile } from '@/services/companyService';
import { toast } from 'sonner';
import {
    Building,
    ArrowLeft,
    CheckCircle,
    X,
    BadgeCheck,
    Loader2,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import Head from 'next/head';
import CompanyProfileEditForm from '@/components/profile/CompanyProfileEditForm';
import { colorClasses } from '@/utils/color';

// Theme-aware header component
const ThemeAwareHeader = ({ companyProfile }: { companyProfile: CompanyProfile | null }) => {
    const theme = useTheme();

    return (
        <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className={`text-2xl lg:text-3xl font-bold ${theme.getTextClasses('primary')}`}>
                            {companyProfile ? 'Edit Company Profile' : 'Create Company Profile'}
                        </h1>
                        <p className={`mt-1 ${theme.getTextClasses('muted')}`}>
                            {companyProfile
                                ? 'Update your company information, branding, and settings'
                                : 'Set up your company profile to get started'}
                        </p>
                    </div>
                </div>

                {companyProfile && (
                    <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-2 text-sm ${companyProfile.verified ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'} ${colorClasses.bg.gray100} dark:bg-gray-800 px-3 py-1.5 rounded-full`}>
                            <Shield className="w-4 h-4" />
                            {companyProfile.verified ? 'Verified Company' : 'Pending Verification'}
                        </span>
                    </div>
                )}
            </div>

            <Separator />
        </div>
    );
};

// Loading state component
const LoadingState = () => {
    const theme = useTheme();

    return (
        <div className="min-h-screen flex items-center justify-center" style={theme.getPageBgStyle()}>
            <div className={`max-w-4xl w-full p-8 rounded-xl border ${theme.getBorderClasses('primary')} ${theme.getBgClasses('card')}`}>
                <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.getRoleColor('primary') }} />
                    <p className={theme.getTextClasses('muted')}>Loading authorization...</p>
                </div>
            </div>
        </div>
    );
};

export default function CompanyEditProfilePage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Check authorization and load data - RUNS ONLY ONCE
    useEffect(() => {
        if (authLoading || dataLoaded) return;

        // Check if user is authorized (company role only)
        if (user) {
            if (user.role !== 'company') {
                toast.error('Only company accounts can access this page');
                router.push('/social/dashboard');
                return;
            }
            setIsAuthorized(true);
            fetchCompanyData();
        } else if (!authLoading) {
            // Not authenticated
            router.push('/login');
        }
    }, [user, authLoading, dataLoaded]);

    const fetchCompanyData = async () => {
        try {
            setLoading(true);

            // Fetch legal company registration data - JUST ONCE
            const companyData = await companyService.getMyCompany();
            setCompanyProfile(companyData);
            setDataLoaded(true);

        } catch (error) {
            console.error('Failed to fetch company data:', error);
            // companyService already shows toast for errors
        } finally {
            setLoading(false);
        }
    };

    const handleFormSuccess = () => {
        toast.success('Profile updated successfully');
        // Optionally refresh data
        fetchCompanyData();
    };

    const handleCancel = () => {
        router.back();
    };

    const handleBackToProfile = () => {
        router.push('/dashboard/company/social/profile');
    };

    // Show loading while checking authorization
    if (authLoading || (!isAuthorized && loading)) {
        return (
            <SocialDashboardLayout requiredRole="company">
                <RoleThemeProvider>
                    <LoadingState />
                </RoleThemeProvider>
            </SocialDashboardLayout>
        );
    }

    return (
        <>
            <Head>
                <title>
                    {companyProfile ? 'Edit Company Profile' : 'Create Company Profile'} - Banana Social
                </title>
            </Head>
            <SocialDashboardLayout requiredRole="company">
                <RoleThemeProvider>
                    {/* Add custom CSS for animations */}
                    <style jsx global>{`
                        @keyframes fadeIn {
                            from {
                                opacity: 0;
                                transform: translateY(10px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                        .animate-fadeIn {
                            animation: fadeIn 0.3s ease-out;
                        }
                    `}</style>

                    <div className="min-h-screen w-full">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                            {/* Back Navigation */}
                            <div className="mb-6">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 hover:bg-transparent px-0"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="text-sm">Back to Dashboard</span>
                                </Button>
                            </div>

                            {/* Header */}
                            <ThemeAwareHeader companyProfile={companyProfile} />

                            {/* Main Content - Full width, no cards */}
                            <div className="w-full">
                                <CompanyProfileEditForm
                                    onSuccess={handleFormSuccess}
                                    onCancel={handleCancel}
                                />
                            </div>

                            {/* Bottom Action Bar - Only show in edit mode */}
                            {companyProfile && (
                                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {companyProfile.updatedAt ? (
                                                <>Last updated: {new Date(companyProfile.updatedAt).toLocaleDateString()}</>
                                            ) : companyProfile.createdAt ? (
                                                <>Created: {new Date(companyProfile.createdAt).toLocaleDateString()}</>
                                            ) : (
                                                <>No update history</>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={handleBackToProfile}
                                                className="flex items-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                View Profile
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        </>
    );
}