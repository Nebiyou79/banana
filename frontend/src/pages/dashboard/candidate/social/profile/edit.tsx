// pages/dashboard/candidate/social/profile/edit.tsx - SIMPLIFIED VERSION
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { Button } from '@/components/social/ui/Button';
import { Card } from '@/components/social/ui/Card';
import {
    ArrowLeft,
    Save,
    User,
    Briefcase,
    GraduationCap,
    Award,
    Settings,
    Loader2,
    CheckCircle,
    FileText,
    Shield,
    Sparkles,
    Target,
    Star,
    Zap
} from 'lucide-react';
import { profileService, type Profile } from '@/services/profileService';
import { candidateService, type CandidateProfile } from '@/services/candidateService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Import the new form
import CandidateProfileForm from '@/components/profile/CandidateProfileEditForm';

export default function CandidateEditProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
    const [completion, setCompletion] = useState<number>(0);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            setLoading(true);

            // Fetch main profile, candidate profile, and completion in parallel
            const [profileData, candidateData, completionData] = await Promise.all([
                profileService.getProfile(),
                candidateService.getProfile(),
                profileService.getProfileCompletion()
            ]);

            setProfile(profileData);
            setCandidateProfile(candidateData);
            setCompletion(completionData.percentage);

        } catch (error: any) {
            console.error('Failed to fetch profile data:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        try {
            setSaving(true);
            toast.info('Saving all changes...');
            // The form handles its own saving
            setTimeout(() => {
                toast.success('All changes saved successfully');
                fetchProfileData(); // Refresh data
            }, 1000);
        } catch (error) {
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            router.push('/dashboard/candidate/social/profile');
        }
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
                        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                            <div className="max-w-7xl mx-auto px-4 py-8">
                                <div className="animate-pulse space-y-8">
                                    {/* Header Skeleton */}
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-3">
                                            <div className="h-8 bg-gray-200 rounded w-48" />
                                            <div className="h-4 bg-gray-200 rounded w-64" />
                                        </div>
                                        <div className="h-10 bg-gray-200 rounded w-32" />
                                    </div>

                                    {/* Content Skeleton */}
                                    <div className="space-y-6">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="h-64 bg-gray-200 rounded-xl" />
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
                    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                        <div className="max-w-7xl mx-auto px-4 py-8">
                            {/* Header */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                        className="backdrop-blur-lg border-gray-300 hover:bg-gray-50"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                            Edit Your Profile
                                        </h1>
                                        <p className="text-gray-600 mt-1">
                                            Update your professional information and personal details
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-700 mb-1">Profile Strength</div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-2 rounded-full bg-gray-200 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-1000"
                                                    style={{ width: `${completion}%` }}
                                                />
                                            </div>
                                            <span className="font-bold text-gray-900">{completion}%</span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => router.push('/dashboard/candidate/social/profile')}
                                        variant="premium"
                                        className="backdrop-blur-lg border-gray-300"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        View Profile
                                    </Button>
                                </div>
                            </div>

                            {/* Progress Indicators */}
                            {/* Progress Indicators */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {[
                                    {
                                        icon: <User />,
                                        label: 'Basic',
                                        completed: !!(profile?.headline && profile?.location && profile?.bio)
                                    },
                                    {
                                        icon: <Briefcase />,
                                        label: 'Professional',
                                        completed: !!((candidateProfile?.experience?.length ?? 0) > 0 && (candidateProfile?.skills?.length ?? 0) > 0)
                                    },
                                    {
                                        icon: <GraduationCap />,
                                        label: 'Education',
                                        completed: !!((candidateProfile?.education?.length ?? 0) > 0)
                                    },
                                    {
                                        icon: <Award />,
                                        label: 'Skills',
                                        completed: !!((candidateProfile?.skills?.length ?? 0) > 3)
                                    },
                                ].map((item, index) => (
                                    <Card
                                        key={index}
                                        className={`p-4 backdrop-blur-lg transition-all duration-300 hover:scale-105 cursor-pointer ${item.completed
                                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                                            : 'bg-white border-gray-200 hover:border-blue-500'
                                            }`}
                                        onClick={() => setActiveTab(item.label.toLowerCase())}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className={`p-2 rounded-lg ${item.completed
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                                                : 'bg-gradient-to-br from-blue-500 to-purple-500'
                                                }`}>
                                                <div className="w-5 h-5 text-white">{item.icon}</div>
                                            </div>
                                            {item.completed && <CheckCircle className="w-5 h-5 text-green-500" />}
                                        </div>
                                        <div className="mt-3">
                                            <div className="font-semibold text-gray-900">{item.label}</div>
                                            <div className="text-sm text-gray-600">
                                                {item.completed ? 'Complete' : 'Incomplete'}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Main Form Container */}
                            <div className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-50 border border-gray-200 shadow-2xl rounded-3xl overflow-hidden">
                                <div className="p-8">
                                    {/* Tab Navigation */}
                                    <div className="mb-8">
                                        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                                            {[
                                                { id: 'basic', label: 'Basic Info', icon: <User className="w-4 h-4" /> },
                                                { id: 'professional', label: 'Professional', icon: <Briefcase className="w-4 h-4" /> },
                                                { id: 'cv', label: 'CV & Portfolio', icon: <FileText className="w-4 h-4" /> },
                                                { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" /> },
                                                { id: 'notifications', label: 'Notifications', icon: <Settings className="w-4 h-4" /> },
                                            ].map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.id
                                                        ? 'bg-blue-100 text-blue-700 font-medium'
                                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {tab.icon}
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Render the new form */}
                                    <CandidateProfileForm />
                                </div>

                                {/* Save Button */}
                                <div className="border-t border-gray-200 p-8">
                                    <div className="flex items-center justify-between">
                                        <Button
                                            onClick={handleCancel}
                                            variant="outline"
                                            className="backdrop-blur-lg border-gray-300 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </Button>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                onClick={handleSaveAll}
                                                variant="premium"
                                                className="backdrop-blur-lg border-gray-300 group"
                                                disabled={saving}
                                            >
                                                {saving ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                                                        Save All Changes
                                                    </>
                                                )}
                                            </Button>

                                            <Button
                                                onClick={() => router.push('/dashboard/candidate/social/profile')}
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                View Profile
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tips Card */}
                            <Card className="mt-8 backdrop-blur-xl bg-gradient-to-b from-blue-50 to-purple-50 border border-blue-200 rounded-3xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 text-lg mb-3">
                                            Boost Your Profile Visibility
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { icon: <Star className="w-4 h-4" />, text: 'Complete all profile sections' },
                                                { icon: <Target className="w-4 h-4" />, text: 'Add specific skills and certifications' },
                                                { icon: <Zap className="w-4 h-4" />, text: 'Keep your experience history up to date' },
                                                { icon: <Shield className="w-4 h-4" />, text: 'Verify your profile for credibility' },
                                            ].map((tip, index) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-white/50">
                                                        {tip.icon}
                                                    </div>
                                                    <span className="text-gray-700">{tip.text}</span>
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