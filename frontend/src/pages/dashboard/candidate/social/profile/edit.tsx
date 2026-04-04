// pages/dashboard/candidate/social/profile/edit.tsx - SIMPLIFIED VERSION
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { Button } from '@/components/social/ui/Button';
import { Card } from '@/components/ui/Card';
import {
    ArrowLeft,
    CheckCircle,
    Sparkles,
    Target,
    Star,
    Zap,
    Cloud,
    Loader2
} from 'lucide-react';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Import the form
import CandidateProfileEditForm from '@/components/profile/CandidateProfileEditForm';
import { Badge } from '@/components/ui/Badge';

export default function CandidateEditProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [cloudStorageActive, setCloudStorageActive] = useState(false);
    const [profileCompletion, setProfileCompletion] = useState(0);
    const [profileData, setProfileData] = useState<any>(null);

    useEffect(() => {
        fetchPageData();
    }, []);

    const fetchPageData = async () => {
        try {
            setLoading(true);

            // Fetch only what the page needs for display
            const [profileResponse, completionData] = await Promise.all([
                profileService.getProfile(),
                profileService.getProfileCompletion()
            ]);

            setProfileData(profileResponse);
            setProfileCompletion(completionData.percentage);

            // Check if Cloudinary is being used for display purposes
            const isAvatarCloudinary = profileService.isCloudinaryUrl(
                profileService.getAvatarUrl(profileResponse)
            );
            const isCoverCloudinary = profileService.isCloudinaryUrl(
                profileService.getCoverUrl(profileResponse)
            );
            setCloudStorageActive(isAvatarCloudinary || isCoverCloudinary);

        } catch (error: any) {
            console.error('Failed to fetch page data:', error);
            toast.error('Failed to load page data');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            router.push('/dashboard/candidate/social/profile');
        }
    };

    const handleViewProfile = () => {
        router.push('/dashboard/candidate/social/profile');
    };

    if (loading) {
        return (
            <>
                <Head>
                    <title>Edit Profile | Banana Social</title>
                    <meta name="description" content="Edit your candidate profile" />
                </Head>
                <SocialDashboardLayout requiredRole="candidate">
                    <RoleThemeProvider>
                        <div className="min-h-screen bg-background">
                            <div className="max-w-7xl mx-auto px-4 py-8">
                                <div className="animate-pulse space-y-8">
                                    {/* Header Skeleton */}
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-3">
                                            <div className="h-8 bg-muted rounded w-48" />
                                            <div className="h-4 bg-muted rounded w-64" />
                                        </div>
                                        <div className="h-10 bg-muted rounded w-32" />
                                    </div>

                                    {/* Content Skeleton */}
                                    <div className="space-y-6">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-64 bg-muted rounded-xl" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RoleThemeProvider>
                </SocialDashboardLayout>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Edit Profile | Banana Social</title>
                <meta name="description" content="Edit your candidate profile" />
            </Head>
            <SocialDashboardLayout requiredRole="candidate">
                <RoleThemeProvider>
                    <div className="min-h-screen bg-background">
                        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
                            {/* Header */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                        className="border-border hover:bg-accent"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                                            Edit Your Profile
                                        </h1>
                                        <p className="text-sm sm:text-base text-muted-foreground mt-1">
                                            Update your professional information and personal details
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                    <div className="text-right sm:text-left">
                                        <div className="text-sm font-medium text-muted-foreground mb-1">
                                            Profile Strength
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 sm:w-32 h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full bg-linear-to-r from-primary to-secondary transition-all duration-1000"
                                                    style={{ width: `${profileCompletion}%` }}
                                                />
                                            </div>
                                            <span className="font-bold text-foreground text-sm sm:text-base">{profileCompletion}%</span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleViewProfile}
                                        variant="default"
                                        size="sm"
                                        className="w-full sm:w-auto"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        View Profile
                                    </Button>
                                </div>
                            </div>

                            {/* Cloud Storage Indicator */}
                            {cloudStorageActive && (
                                <div className="mb-6">
                                    <Card className="bg-linear-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-linear-to-br from-primary to-secondary">
                                                    <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-foreground text-sm sm:text-base">Cloud Storage Active</h3>
                                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                                        Your images are securely stored and optimized in the cloud
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 mt-2 sm:mt-0">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Secure
                                            </Badge>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* Main Form Container */}
                            <div className="bg-card border border-border shadow-lg rounded-2xl sm:rounded-3xl overflow-hidden">
                                <div className="p-4 sm:p-6 md:p-8">
                                    {/* Render the form - it manages its own tabs and data */}
                                    <CandidateProfileEditForm />
                                </div>

                                {/* Form Actions - Simple Save Button */}
                                <div className="border-t border-border p-4 sm:p-6 md:p-8">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                        <Button
                                            onClick={handleCancel}
                                            variant="outline"
                                            className="border-border hover:bg-accent"
                                        >
                                            Cancel
                                        </Button>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                onClick={handleViewProfile}
                                                variant="default"
                                                className="w-full sm:w-auto"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Save & View Profile
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tips Card */}
                            <Card className="mt-6 sm:mt-8 bg-linear-to-b from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                    <div className="p-2 sm:p-3 rounded-xl bg-linear-to-br from-primary to-secondary">
                                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground text-base sm:text-lg mb-3">
                                            Boost Your Profile Visibility
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            {[
                                                { icon: <Star className="w-3 h-3 sm:w-4 sm:h-4" />, text: 'Complete all profile sections' },
                                                { icon: <Target className="w-3 h-3 sm:w-4 sm:h-4" />, text: 'Add specific skills and certifications' },
                                                { icon: <Zap className="w-3 h-3 sm:w-4 sm:h-4" />, text: 'Keep your experience history up to date' },
                                                { icon: <Cloud className="w-3 h-3 sm:w-4 sm:h-4" />, text: 'Use high-quality images with cloud storage' },
                                            ].map((tip, index) => (
                                                <div key={index} className="flex items-center gap-2 sm:gap-3">
                                                    <div className="p-1.5 sm:p-2 rounded-lg bg-card/50">
                                                        {tip.icon}
                                                    </div>
                                                    <span className="text-foreground/80 text-sm sm:text-base">{tip.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </RoleThemeProvider>
            </SocialDashboardLayout>
        </>
    );
}