/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/social/profile/edit.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { companyService, type CompanyProfile } from '@/services/companyService';
import { toast } from 'sonner';
import {
    Building,
    ArrowLeft,
    CheckCircle,
    X,
    BadgeCheck,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import Head from 'next/head';
import CompanyProfileEditForm from '@/components/profile/CompanyProfileEditForm';

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
                    <div className="min-h-screen flex items-center justify-center bg-background">
                        <Card className="max-w-4xl w-full mx-auto p-8">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-muted-foreground">Loading authorization...</p>
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
                <title>
                    {companyProfile ? 'Edit Company Profile' : 'Create Company Profile'} - Banana Social
                </title>
            </Head>
            <SocialDashboardLayout requiredRole="company">
                <RoleThemeProvider>
                    <div className="container mx-auto px-4 py-8 max-w-6xl">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
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
                                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                                            {companyProfile ? 'Edit Company Profile' : 'Create Company Profile'}
                                        </h1>
                                        <p className="text-muted-foreground mt-1">
                                            {companyProfile
                                                ? 'Update your company information, branding, and settings'
                                                : 'Set up your company profile to get started'}
                                        </p>
                                    </div>
                                </div>

                                {companyProfile && (
                                    <div className="flex items-center gap-3">
                                        <span className={`flex items-center gap-2 text-sm ${companyProfile.verified ? 'text-success' : 'text-warning'} bg-muted px-3 py-1.5 rounded-full`}>
                                            <BadgeCheck className="w-4 h-4" />
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
                                )}
                            </div>

                            <Separator />
                        </div>

                        {/* Main Content */}
                        <div className="grid gap-8">
                            <div className="lg:col-span-2">
                                <Card className="p-6 bg-card">
                                    <CompanyProfileEditForm
                                        onSuccess={handleFormSuccess}
                                        onCancel={handleCancel}
                                    />
                                </Card>
                            </div>
                        </div>

                        {/* Bottom Action Bar - Only show in edit mode */}
                        {companyProfile && (
                            <div className="mt-8 pt-6 border-t border-border">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="text-sm text-muted-foreground">
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
                                            onClick={handleCancel}
                                            className="flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </Button>
                                        <Button
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
                </RoleThemeProvider>
            </SocialDashboardLayout>
        </>
    );
}