// pages/dashboard/company/profile.tsx - UPDATED WITH FILE UPLOAD
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { companyService } from '@/services/companyService';
import { CompanyProfile as Company } from '@/services/companyService';
import CompanyForm from '@/components/company/CompanyForm';
import CompanyHero from '@/components/company/CompanyHero';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Pencil, Building2, MapPin, Phone, Globe, FileText, Users, Calendar, Plus } from 'lucide-react';
import Button from '@/components/forms/Button';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function CompanyProfilePage() {
  const { user, isLoading, refetchUser } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user || user.role !== 'company') {
      router.push('/dashboard');
      return;
    }

    fetchCompanyProfile();
  }, [user, isLoading, router]);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const companyData = await companyService.getMyCompany();
      setCompany(companyData);
    } catch (error: any) {
      console.error('Error fetching company profile:', error);
      if (error.message.includes('not found')) {
        setCompany(null);
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (data: Partial<Company> & { logoFile?: File; bannerFile?: File }) => {
    try {
      setError('');
      
      // Separate file uploads from company data
      const { logoFile, bannerFile, ...companyData } = data;
      
      let updatedCompany: Company;
      
      if (company) {
        // Update company data first
        updatedCompany = await companyService.updateMyCompany(companyData);
        console.log('Company updated:', updatedCompany);
        
        // Handle file uploads sequentially
        if (logoFile) {
          console.log('Uploading logo file...');
          await companyService.uploadLogo(logoFile);
        }
        
        if (bannerFile) {
          console.log('Uploading banner file...');
          await companyService.uploadBanner(bannerFile);
        }
        
        // Refetch company to get updated image URLs
        const refreshedCompany = await companyService.getMyCompany();
        if (refreshedCompany) {
          setCompany(refreshedCompany);
        }
        
      } else {
        // Create new company first
        updatedCompany = await companyService.createCompany(companyData);
        console.log('Company created:', updatedCompany);
        
        // Then upload files
        if (logoFile) {
          console.log('Uploading logo file for new company...');
          await companyService.uploadLogo(logoFile);
        }
        
        if (bannerFile) {
          console.log('Uploading banner file for new company...');
          await companyService.uploadBanner(bannerFile);
        }
        
        // Refetch user and company data
        if (refetchUser) {
          await refetchUser();
          console.log('User refetched after company creation');
        }
        
        // Refetch company to get updated data with images
        const refreshedCompany = await companyService.getMyCompany();
        if (refreshedCompany) {
          setCompany(refreshedCompany);
        }
        
        toast({
          title: 'Success',
          description: 'Company profile created successfully!',
        });
      }
      
      setIsEditing(false);
      toast({
        title: 'Success',
        description: company ? 'Company profile updated successfully!' : 'Company profile created successfully!',
      });
      
    } catch (error: any) {
      console.error('Error updating company profile:', error);
      setError(error.message);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update company profile',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || loading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading company profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Company Profile</h1>
              <p className="text-xl text-gray-600 mt-2">Manage your company information and branding</p>
            </div>
            {company && !isEditing && (
              <Button onClick={() => setIsEditing(true)} size="lg">
                <Pencil className="w-5 h-5 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-1 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isEditing ? (
            <CompanyForm
              company={company}
              onSubmit={handleProfileUpdate}
              onCancel={() => setIsEditing(false)}
            />
          ) : !company ? (
            <Card className="border-l-4 border-l-blue-500 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Building2 className="w-6 h-6" />
                  Create Your Company Profile
                </CardTitle>
                <CardDescription className="text-lg">
                  Set up your company profile to start posting jobs and building your employer brand.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
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
                  <Button onClick={() => setIsEditing(true)} size="lg" className="mt-4">
                    Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Hero Section */}
              <CompanyHero 
                company={company} 
                isOwner={true}
                onEdit={() => setIsEditing(true)}
              />

              {/* Company Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Description Card */}
                  {company.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          About Our Company
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 leading-relaxed text-lg">
                          {company.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {company.address && (
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-gray-900">Address</h4>
                              <p className="text-gray-600 mt-1">{company.address}</p>
                            </div>
                          </div>
                        )}
                        
                        {company.phone && (
                          <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-gray-900">Phone</h4>
                              <p className="text-gray-600 mt-1">{company.phone}</p>
                            </div>
                          </div>
                        )}
                        
                        {company.website && (
                          <div className="flex items-start gap-3">
                            <Globe className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-gray-900">Website</h4>
                              <a 
                                href={company.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 hover:underline mt-1 block"
                              >
                                {company.website}
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {company.tin && (
                          <div className="flex items-start gap-3">
                            <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-gray-900">TIN Number</h4>
                              <p className="text-gray-600 mt-1">{company.tin}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar - Company Stats */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Company Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Verification</span>
                          <Badge variant={company.verified ? "default" : "secondary"}>
                            {company.verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Profile</span>
                          <Badge variant="default">Complete</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Member Since</span>
                          <span className="text-sm text-gray-900">
                            {new Date(company.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
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
                        <Button variant="outline" className="w-full justify-start" onClick={() => setIsEditing(true)}>
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