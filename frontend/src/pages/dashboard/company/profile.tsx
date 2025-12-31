/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/profile.tsx - UPDATED FOR PROFILE-SERVICE HERO
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { companyService } from '@/services/companyService';
import { CompanyProfile as Company } from '@/services/companyService';
import { profileService, Profile } from '@/services/profileService'; // ADDED PROFILE SERVICE
import CompanyForm from '@/components/company/CompanyForm';
import CompanyHero from '@/components/company/CompanyHero';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Pencil, Building2, MapPin, Phone, Globe, FileText, Users, Calendar, Plus } from 'lucide-react';
import Button from '@/components/forms/Button';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function CompanyProfilePage() {
  const { user, isLoading: authLoading, refetchUser } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null); // ADDED USER PROFILE
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true); // ADDED SEPARATE LOADING
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'company') {
      toast({
        title: 'Access Denied',
        description: 'You need to be a company user to access this page.',
        variant: 'destructive',
      });
      router.push('/dashboard');
      return;
    }

    fetchCompanyProfile();
    fetchUserProfile(); // ADDED: Fetch user profile
  }, [user, authLoading, router]);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      const companyData = await companyService.getMyCompany();
      setCompany(companyData);

      if (!companyData) {
        toast({
          title: 'Profile Not Found',
          description: 'Please create your company profile to get started.',
          variant: 'info',
        });
      }
    } catch (error: any) {
      console.error('Error fetching company profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // ADDED: Fetch user profile for avatar and cover photo
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

  const handleProfileUpdate = async (data: Partial<Company> & { logoFile?: File; bannerFile?: File }) => {
    try {
      const { logoFile, bannerFile, ...companyData } = data;

      console.log('[ProfilePage] Submitting company data:', companyData);
      console.log('[ProfilePage] Logo file:', logoFile);
      console.log('[ProfilePage] Banner file:', bannerFile);

      let updatedCompany: Company;

      if (company) {
        // Update company data first
        updatedCompany = await companyService.updateMyCompany(companyData);
        console.log('[ProfilePage] Company update response:', updatedCompany);

        // Handle file uploads through profile service
        if (logoFile) {
          console.log('[ProfilePage] Uploading logo to profile service...');
          try {
            await profileService.uploadAvatar(logoFile);
            // Refresh user profile to get updated avatar
            await fetchUserProfile();
          } catch (error) {
            console.error('[ProfilePage] Logo upload error:', error);
            // Continue even if logo upload fails
          }
        }

        if (bannerFile) {
          console.log('[ProfilePage] Uploading banner to profile service...');
          try {
            await profileService.uploadCoverPhoto(bannerFile);
            // Refresh user profile to get updated cover photo
            await fetchUserProfile();
          } catch (error) {
            console.error('[ProfilePage] Banner upload error:', error);
            // Continue even if banner upload fails
          }
        }

        // Refetch company to get updated data
        const refreshedCompany = await companyService.getMyCompany();
        if (refreshedCompany) {
          setCompany(refreshedCompany);
        }

      } else {
        // Create new company first
        updatedCompany = await companyService.createCompany(companyData);
        console.log('[ProfilePage] Company creation response:', updatedCompany);

        // Handle file uploads through profile service
        if (logoFile) {
          console.log('[ProfilePage] Uploading logo to profile service for new company...');
          try {
            await profileService.uploadAvatar(logoFile);
            await fetchUserProfile();
          } catch (error) {
            console.error('[ProfilePage] Logo upload error:', error);
          }
        }

        if (bannerFile) {
          console.log('[ProfilePage] Uploading banner to profile service for new company...');
          try {
            await profileService.uploadCoverPhoto(bannerFile);
            await fetchUserProfile();
          } catch (error) {
            console.error('[ProfilePage] Banner upload error:', error);
          }
        }

        // Refetch user and company data
        if (refetchUser) {
          await refetchUser();
        }

        // Refetch company to get updated data
        const refreshedCompany = await companyService.getMyCompany();
        if (refreshedCompany) {
          setCompany(refreshedCompany);
        }
      }

      setIsEditing(false);

    } catch (error: any) {
      console.error('[ProfilePage] Profile update error:', error);
    }
  };

  const handleEditClick = () => {
    try {
      setIsEditing(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to open edit form',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    try {
      setIsEditing(false);
      toast({
        title: 'Edit Cancelled',
        description: 'Your changes were not saved',
        variant: 'info',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to cancel edit',
        variant: 'destructive',
      });
    }
  };

  // ADDED: Handle profile updates from CompanyHero component
  const handleProfileUpdateFromHero = (updatedProfile: Profile) => {
    // This is called when the Hero component updates the profile
    // Update the local userProfile state
    setUserProfile(updatedProfile);
  };

  // ADDED: Handle refresh from CompanyHero component
  const handleRefresh = () => {
    fetchCompanyProfile();
    fetchUserProfile();
  };

  // Combine loading states
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

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Company Profile</h1>
              <p className="text-xl text-muted-foreground mt-2">Manage your company information and branding</p>
            </div>
            {company && !isEditing && (
              <Button onClick={handleEditClick} size="lg">
                <Pencil className="w-5 h-5 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {isEditing ? (
            <CompanyForm
              company={company}
              onSubmit={handleProfileUpdate}
              onCancel={handleCancelEdit}
            />
          ) : !company ? (
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Attract top talent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-green-600" />
                      <span>Build employer brand</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span>Post unlimited jobs</span>
                    </div>
                  </div>
                  <Button onClick={handleEditClick} size="lg" className="mt-4">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Company Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Hero Section - UPDATED TO USE PROFILE-SERVICE BASED HERO */}
              <CompanyHero
                profile={userProfile} // Pass userProfile instead of company
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
                            <Building2 className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}