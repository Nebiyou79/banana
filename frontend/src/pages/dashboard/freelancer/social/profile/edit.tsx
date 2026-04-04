// pages/dashboard/freelancer/social/profile/edit.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { profileService } from '@/services/profileService';
import {
  ArrowLeft,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';

// Import the new form
import FreelancerProfileEditForm from '@/components/profile/FreelancerProfileEditForm';

export default function FreelancerEditProfilePage() {
  const router = useRouter();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileCompletion();
  }, []);

  const fetchProfileCompletion = async () => {
    try {
      setLoading(true);
      const completion = await profileService.getProfileCompletion();
      setProfileCompletion(completion.percentage);
    } catch (error) {
      console.error('Failed to fetch profile completion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.back();
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Edit Profile | Banana Social</title>
          <meta name="description" content="Edit your freelancer profile" />
        </Head>
        <SocialDashboardLayout requiredRole="freelancer">
          <RoleThemeProvider>
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
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
        <meta name="description" content="Edit your freelancer profile" />
      </Head>
      <SocialDashboardLayout requiredRole="freelancer">
        <RoleThemeProvider>
          <div className="space-y-6">
            {/* Simple Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Edit Freelancer Profile
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Complete your profile to attract more clients
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-emerald-500 dark:bg-emerald-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {profileCompletion}% Complete
                  </span>
                </div>
                <Button
                  onClick={() => router.push('/dashboard/freelancer/social/profile')}
                  variant="outline"
                  className="border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  View Profile
                </Button>
              </div>
            </div>

            {/* Main Form - No extra containers, just the form */}
            <FreelancerProfileEditForm />
          </div>
        </RoleThemeProvider>
      </SocialDashboardLayout>
    </>
  );
}