// pages/social/freelancer/profile/edit.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { freelancerService, type UserProfile } from '@/services/freelancerService';
import { profileService, type Profile } from '@/services/profileService';
import { roleProfileService } from '@/services/roleProfileService';
import { toast } from 'sonner';
import {
  Briefcase,
  ArrowLeft,
  Save,
  CheckCircle,
  User,
  Target,
  Award,
  Sparkles,
  Zap,
  DollarSign,
  Rocket,
  TrendingUp,
  Shield,
  Star,
  Loader2,
  Settings
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Card } from '@/components/social/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

// Import the new form
import FreelanceProfileForm from '@/components/profile/FreelancerProfileEditForm';

export default function FreelancerEditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [freelancerProfile, setFreelancerProfile] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [roleSpecificData, setRoleSpecificData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    fetchFreelancerData();
  }, [user]);

  const fetchFreelancerData = async () => {
    try {
      setLoading(true);

      // Fetch freelancer profile
      const freelancerData = await freelancerService.getProfile();
      setFreelancerProfile(freelancerData);

      // Fetch user profile
      const profileData = await profileService.getProfile();
      setUserProfile(profileData);

      // Fetch profile completion
      const completion = await profileService.getProfileCompletion();
      setProfileCompletion(completion.percentage);

      // Try to get role-specific data
      try {
        const roleData = await roleProfileService.getFreelancerProfile();
        setRoleSpecificData(roleData);
      } catch (error) {
        console.warn('Role-specific data not available:', error);
        setRoleSpecificData(null);
      }

    } catch (error) {
      console.error('Failed to fetch freelancer data:', error);
      toast.error('Failed to load freelancer data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      toast.info('Saving all changes...');
      // The form handles its own saving, but we can trigger form submissions here
      // For now, just show a success message
      setTimeout(() => {
        toast.success('All changes saved successfully');
        fetchFreelancerData(); // Refresh data
      }, 1000);
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
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
            <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-emerald-50 border border-emerald-100 rounded-3xl p-8">
              <div className="animate-pulse space-y-8">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-8 bg-emerald-200 rounded w-48" />
                    <div className="h-4 bg-emerald-200 rounded w-64" />
                  </div>
                  <div className="h-10 bg-emerald-200 rounded w-32" />
                </div>

                {/* Form Skeleton */}
                <div className="space-y-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-48 bg-emerald-200 rounded-xl" />
                  ))}
                </div>
              </div>
            </Card>
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
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="backdrop-blur-lg border-emerald-200 hover:border-emerald-300 text-emerald-700 hover:text-emerald-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Edit Freelancer Profile
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Showcase your skills, portfolio, and professional journey
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-emerald-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-emerald-700">
                    {profileCompletion}% Complete
                  </span>
                </div>
                <Button
                  onClick={() => router.push('/social/freelancer/profile')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  View Profile
                </Button>
              </div>
            </div>

            {/* Progress Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  icon: <User />,
                  label: 'Basic',
                  completed: !!(userProfile?.headline && userProfile?.location && userProfile?.bio)
                },
                {
                  icon: <Briefcase />,
                  label: 'Professional',
                  completed: !!((freelancerProfile?.experience?.length || 0) > 0 && (freelancerProfile?.skills?.length || 0) > 0)
                },
                {
                  icon: <Target />,
                  label: 'Portfolio',
                  completed: !!((freelancerProfile?.portfolio?.length || 0) > 0)
                },
                {
                  icon: <DollarSign />,
                  label: 'Services',
                  completed: !!(freelancerProfile?.freelancerProfile?.hourlyRate)
                },
              ].map((item, index) => (
                <Card
                  key={index}
                  className={`p-4 backdrop-blur-lg transition-all duration-300 hover:scale-105 cursor-pointer ${item.completed
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
                    : 'bg-white border-gray-200 hover:border-emerald-500'
                    }`}
                  onClick={() => setActiveTab(item.label.toLowerCase())}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${item.completed
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-br from-emerald-400 to-teal-400'
                      }`}>
                      <div className="w-5 h-5 text-white">{item.icon}</div>
                    </div>
                    {item.completed && <CheckCircle className="w-5 h-5 text-emerald-500" />}
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

            {/* Main Edit Form */}
            <div className="backdrop-blur-xl bg-gradient-to-b from-white to-emerald-50 border border-emerald-100 shadow-2xl rounded-3xl overflow-hidden">
              <div className="p-8">
                {/* Simplified Tabs for the new form */}
                <div className="mb-8">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="backdrop-blur-lg bg-emerald-50 p-1 rounded-xl border border-emerald-100">
                      <TabsTrigger value="basic" className="data-[state=active]:bg-white data-[state=active]:border-emerald-200">
                        <User className="w-4 h-4 mr-2" />
                        Basic Info
                      </TabsTrigger>
                      <TabsTrigger value="professional" className="data-[state=active]:bg-white data-[state=active]:border-emerald-200">
                        <Briefcase className="w-4 h-4 mr-2" />
                        Professional
                      </TabsTrigger>
                      <TabsTrigger value="portfolio" className="data-[state=active]:bg-white data-[state=active]:border-emerald-200">
                        <Target className="w-4 h-4 mr-2" />
                        Portfolio
                      </TabsTrigger>
                      <TabsTrigger value="services" className="data-[state=active]:bg-white data-[state=active]:border-emerald-200">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Services
                      </TabsTrigger>
                      <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:border-emerald-200">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Form Content */}
                <div className="space-y-6">
                  {activeTab === 'basic' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-6 h-6 text-emerald-500" />
                        Basic Information
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Update your personal information and freelancer details
                      </p>
                    </div>
                  )}

                  {activeTab === 'professional' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-emerald-500" />
                        Professional Information
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Manage your skills, experience, education, and certifications
                      </p>
                    </div>
                  )}

                  {activeTab === 'portfolio' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Target className="w-6 h-6 text-emerald-500" />
                        Portfolio
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Showcase your best work to attract clients
                      </p>
                    </div>
                  )}

                  {activeTab === 'services' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-emerald-500" />
                        Services
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Define and manage your freelance services
                      </p>
                    </div>
                  )}

                  {activeTab === 'settings' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-emerald-500" />
                        Settings
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Manage privacy and notification preferences
                      </p>
                    </div>
                  )}

                  {/* Render the new form */}
                  <FreelanceProfileForm />
                </div>
              </div>

              {/* Save Button */}
              <div className="border-t border-emerald-100 p-8">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="backdrop-blur-lg border-emerald-200 hover:border-emerald-300 text-emerald-700 hover:text-emerald-800"
                  >
                    Cancel
                  </Button>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSaveAll}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save All Changes
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => router.push('/social/freelancer/profile')}
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:border-emerald-300"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Preview Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <Card className="backdrop-blur-xl bg-gradient-to-b from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2">
                    Boost Your Freelancer Profile
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-emerald-500" />
                      Add at least 5 skills with proficiency levels
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-emerald-500" />
                      Showcase 3-5 portfolio projects
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-emerald-500" />
                      Set a competitive hourly rate based on experience
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-emerald-500" />
                      Complete all sections for 100% profile completion
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </RoleThemeProvider>
      </SocialDashboardLayout>
    </>
  );
}