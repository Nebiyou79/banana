// pages/dashboard/company/profile.tsx - UPDATED FOR CREATE/UPDATE LOGIC
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { companyService } from '@/services/companyService';
import { CompanyProfile as Company } from '@/services/companyService';
import { profileService, Profile, CloudinaryImage } from '@/services/profileService';
import CompanyForm from '@/components/company/CompanyForm';
import CompanyHero from '@/components/company/CompanyHero';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Pencil, Building2, MapPin, Phone, Globe, FileText, Users, Calendar, Plus, Save, ArrowLeft } from 'lucide-react';
import Button from '@/components/forms/Button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CompanyProfilePage() {
  const { user, isLoading: authLoading, refetchUser } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'company') {
      toast.error('You need to be a company user to access this page.');
      router.push('/dashboard');
      return;
    }

    fetchCompanyProfile();
    fetchUserProfile();
  }, [user, authLoading, router]);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      const companyData = await companyService.getMyCompany();
      setCompany(companyData);
      setIsCreateMode(!companyData); // Set create mode if no company exists

      if (!companyData) {
        toast.info('Please create your company profile to get started.');
      }
    } catch (error: any) {
      console.error('Error fetching company profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const profileData = await profileService.getProfile();
      setUserProfile(profileData);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileUpdate = async (data: any, isCreate: boolean) => {
    try {
      console.log('[ProfilePage] Submitting company data:', data);
      console.log('[ProfilePage] Mode:', isCreate ? 'CREATE' : 'UPDATE');

      // Prepare clean company data
      const companyData: Partial<Company> = {
        name: data.name,
        tin: data.tin,
        industry: data.industry,
        description: data.description,
        address: data.address,
        phone: data.phone,
        website: data.website,
      };

      // Clean up empty strings
      Object.keys(companyData).forEach(key => {
        const value = (companyData as any)[key];
        if (value === '' || value === null) {
          (companyData as any)[key] = undefined;
        }
      });

      let updatedCompany: Company;

      if (isCreate) {
        // Create new company
        updatedCompany = await companyService.createCompany(companyData);
        toast.success('Company profile created successfully!');
      } else {
        // Update existing company
        updatedCompany = await companyService.updateMyCompany(companyData);
        toast.success('Company profile updated successfully!');
      }

      console.log('[ProfilePage] Company operation successful:', updatedCompany);

      // Update local state
      setCompany(updatedCompany);
      setIsCreateMode(false);
      setIsEditing(false);

      // Refresh user and company data
      if (refetchUser) {
        await refetchUser();
      }
      await fetchUserProfile();

    } catch (error: any) {
      console.error('[ProfilePage] Profile update error:', error);
      throw error; // Re-throw to be handled by the form
    }
  };

  const handleEditClick = () => {
    try {
      setIsEditing(true);
      setIsCreateMode(false);
    } catch (error) {
      toast.error('Unable to open edit form');
    }
  };

  const handleCreateClick = () => {
    try {
      setIsEditing(true);
      setIsCreateMode(true);
    } catch (error) {
      toast.error('Unable to open create form');
    }
  };

  const handleCancelEdit = () => {
    try {
      setIsEditing(false);
      setIsCreateMode(false);
      toast.info('Edit cancelled', {
        description: 'Your changes were not saved',
      });
    } catch (error) {
      toast.error('Unable to cancel edit');
    }
  };

  const handleProfileUpdateFromHero = (updatedProfile: Profile) => {
    setUserProfile(updatedProfile);
  };

  const handleRefresh = () => {
    fetchCompanyProfile();
    fetchUserProfile();
  };

  const isLoading = authLoading || loading || profileLoading;

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading company profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Edit/Create mode
  if (isEditing) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {company ? 'Profile' : 'Dashboard'}
              </button>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {isCreateMode ? 'Create Company Profile' : 'Edit Company Profile'}
                </h1>
                <p className="text-gray-600">
                  {isCreateMode
                    ? 'Fill in your company details to get started'
                    : 'Update your company information and settings'}
                </p>
              </div>
            </div>

            <CompanyForm
              company={isCreateMode ? null : company}
              onSubmit={(data) => handleProfileUpdate(data, isCreateMode)}
              onCancel={handleCancelEdit}
              loading={false} // We'll handle loading in the form button
              currentAvatar={userProfile?.avatar as CloudinaryImage | null | undefined}
              currentCover={userProfile?.cover as CloudinaryImage | null | undefined}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // No company profile exists - show create prompt
  if (!company) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-foreground">Company Profile</h1>
                <p className="text-xl text-muted-foreground mt-2">Set up your company profile to get started</p>
              </div>
              <Button onClick={handleCreateClick} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Profile
              </Button>
            </div>

            {/* Empty State */}
            <Card className="border-l-4 border-l-blue-500 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
                  <Building2 className="w-6 h-6" />
                  Create Your Company Profile
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Set up your company profile to start posting jobs and building your employer brand.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
                    <div className="flex flex-col items-center text-center gap-2 p-4 bg-blue-50 rounded-lg">
                      <Users className="w-8 h-8 text-blue-600" />
                      <span className="font-semibold">Attract Top Talent</span>
                      <p>Showcase your company culture and values</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2 p-4 bg-green-50 rounded-lg">
                      <Building2 className="w-8 h-8 text-green-600" />
                      <span className="font-semibold">Build Employer Brand</span>
                      <p>Establish your company as an employer of choice</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2 p-4 bg-purple-50 rounded-lg">
                      <Calendar className="w-8 h-8 text-purple-600" />
                      <span className="font-semibold">Post Unlimited Jobs</span>
                      <p>Find the perfect candidates for your openings</p>
                    </div>
                  </div>
                  <div className="text-center pt-4">
                    <Button onClick={handleCreateClick} size="lg" className="px-8">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Company Profile
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      It only takes a few minutes to set up your profile
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // View mode - Company exists
  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Company Profile</h1>
              <p className="text-xl text-muted-foreground mt-2">Manage your company information and branding</p>
            </div>
            <Button onClick={handleEditClick} size="lg">
              <Pencil className="w-5 h-5 mr-2" />
              Edit Profile
            </Button>
          </div>

          <div className="space-y-8">
            {/* Hero Section */}
            <CompanyHero
              profile={userProfile}
              isOwner={true}
              onEdit={handleEditClick}
              onProfileUpdate={handleProfileUpdateFromHero}
              onRefresh={handleRefresh}
              isLoading={profileLoading}
            />

            {/* Company Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Description Card */}
                {company.description && (
                  <Card className="bg-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <FileText className="w-5 h-5" />
                        About Our Company
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground/90 leading-relaxed text-lg">
                        {company.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Contact Information */}
                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle className="text-foreground">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {company.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-foreground">Address</h4>
                            <p className="text-muted-foreground mt-1">{company.address}</p>
                          </div>
                        </div>
                      )}

                      {company.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-foreground">Phone</h4>
                            <p className="text-muted-foreground mt-1">{company.phone}</p>
                          </div>
                        </div>
                      )}

                      {company.website && (
                        <div className="flex items-start gap-3">
                          <Globe className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-foreground">Website</h4>
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 hover:underline mt-1 block"
                            >
                              {company.website}
                            </a>
                          </div>
                        </div>
                      )}

                      {company.tin && (
                        <div className="flex items-start gap-3">
                          <Building2 className="w-5 h-5 text-muted-foreground mt=0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-foreground">TIN Number</h4>
                            <p className="text-muted-foreground mt-1">{company.tin}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Company Stats */}
              <div className="space-y-6">
                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle className="text-foreground">Company Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Verification</span>
                        <Badge variant={company.verified ? "default" : "secondary"}>
                          {company.verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Profile</span>
                        <Badge variant="default">Complete</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Member Since</span>
                        <span className="text-sm text-foreground">
                          {new Date(company.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle className="text-foreground">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-3">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/dashboard/company/jobs/new">
                          <Plus className="w-4 h-4 mr-2" />
                          Post New Job
                        </Link>
                      </Button>

                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/dashboard/company/jobs">
                          <FileText className="w-4 h-4 mr-2" />
                          View All Jobs
                        </Link>
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleEditClick}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}