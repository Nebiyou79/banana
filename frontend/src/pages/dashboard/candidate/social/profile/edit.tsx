// pages/dashboard/candidate/social/profile/edit.tsx - FIXED VERSION
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { Button } from '@/components/social/ui/Button';
import { Card } from '@/components/social/ui/Card';
import {
    ArrowLeft,
    User,
    CheckCircle,
    Sparkles,
    Target,
    Star,
    Zap,
    Cloud
} from 'lucide-react';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Import the new form
import CandidateProfileForm from '@/components/profile/CandidateProfileEditForm';
import { Badge } from '@/components/social/ui/Badge';

export default function CandidateEditProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [cloudStorageActive, setCloudStorageActive] = useState(false);
    const [profileCompletion, setProfileCompletion] = useState(0);

    useEffect(() => {
        // Only fetch data needed for page display (not form data)
        fetchPageData();
    }, []);

    const fetchPageData = async () => {
        try {
            setLoading(true);

            // Fetch only what the page needs for display
            const [profileData, completionData] = await Promise.all([
                profileService.getProfile(),
                profileService.getProfileCompletion()
            ]);

            setProfileCompletion(completionData.percentage);

            // Check if Cloudinary is being used for display purposes
            const isAvatarCloudinary = profileService.isCloudinaryUrl(
                profileService.getAvatarUrl(profileData)
            );
            const isCoverCloudinary = profileService.isCloudinaryUrl(
                profileService.getCoverUrl(profileData)
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

    // Handler for form completion - form doesn't support callback yet
    // This will be called when user manually refreshes or navigates away
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
                                        {[...Array(4)].map((_, i) => (
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
                        <div className="max-w-7xl mx-auto px-4 py-8">
                            {/* Header */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                                <div className="flex items-center gap-4">
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
                                        <h1 className="text-3xl font-bold text-foreground">
                                            Edit Your Profile
                                        </h1>
                                        <p className="text-muted-foreground mt-1">
                                            Update your professional information and personal details
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-muted-foreground mb-1">
                                            Profile Strength
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000"
                                                    style={{ width: `${profileCompletion}%` }}
                                                />
                                            </div>
                                            <span className="font-bold text-foreground">{profileCompletion}%</span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleViewProfile}
                                        variant="default"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        View Profile
                                    </Button>
                                </div>
                            </div>

                            {/* Cloud Storage Indicator */}
                            {cloudStorageActive && (
                                <div className="mb-6">
                                    <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
                                                    <Cloud className="w-5 h-5 text-primary-foreground" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-foreground">Cloud Storage Active</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Your images are securely stored and optimized in the cloud
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Secure
                                            </Badge>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* Main Form Container */}
                            <div className="bg-card border border-border shadow-lg rounded-3xl overflow-hidden">
                                <div className="p-8">
                                    {/* Render the form - it manages its own tabs and data */}
                                    <CandidateProfileForm />
                                </div>

                                {/* Form Actions */}
                                <div className="border-t border-border p-8">
                                    <div className="flex items-center justify-between">
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
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                View Profile
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tips Card */}
                            <Card className="mt-8 bg-gradient-to-b from-primary/10 to-secondary/10 border border-primary/20 rounded-3xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
                                        <Sparkles className="w-6 h-6 text-primary-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground text-lg mb-3">
                                            Boost Your Profile Visibility
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { icon: <Star className="w-4 h-4" />, text: 'Complete all profile sections' },
                                                { icon: <Target className="w-4 h-4" />, text: 'Add specific skills and certifications' },
                                                { icon: <Zap className="w-4 h-4" />, text: 'Keep your experience history up to date' },
                                                { icon: <Cloud className="w-4 h-4" />, text: 'Use high-quality images with cloud storage' },
                                            ].map((tip, index) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-card/50">
                                                        {tip.icon}
                                                    </div>
                                                    <span className="text-foreground/80">{tip.text}</span>
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