/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { companyService } from '@/services/companyService';
import { CompanyProfile as Company } from '@/services/companyService';
import CompanyForm from '@/components/company/CompanyForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Pencil, Building2, MapPin, Phone, Globe, FileText } from 'lucide-react';
import Button from '@/components/forms/Button';
import { toast } from '@/hooks/use-toast';

export default function CompanyProfilePage() {
  const { user, isLoading } = useAuth();
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

const handleProfileUpdate = async (data: Partial<Company>) => {
  try {
    let updatedCompany: Company;
    if (company) {
      updatedCompany = await companyService.updateMyCompany(data);
    } else {
      updatedCompany = await companyService.createCompany(data);
      
      // Show success message and redirect to dashboard
      toast({
        title: 'Success',
        description: 'Company profile created successfully!',
      });
      
      // Refresh the page to load the new company data
      router.reload();
      return;
    }
    setCompany(updatedCompany);
    setIsEditing(false);
    
    toast({
      title: 'Success',
      description: 'Company profile updated successfully!',
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
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="company">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Company Profile</h1>
            <p className="text-muted-foreground">Manage your company information</p>
          </div>
          {company && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {isEditing || !company ? (
          <CompanyForm
            company={company}
            onSubmit={handleProfileUpdate}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Building2 className="w-6 h-6" />
                      {company.name}
                    </CardTitle>
                    <CardDescription>{company.industry}</CardDescription>
                  </div>
                  <Badge variant={company.verified ? "default" : "secondary"}>
                    {company.verified ? 'Verified' : 'Pending Verification'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {company.description && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Description
                      </h3>
                      <p className="text-muted-foreground">{company.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {company.address && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Address
                        </h3>
                        <p className="text-muted-foreground">{company.address}</p>
                      </div>
                    )}
                    
                    {company.phone && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone
                        </h3>
                        <p className="text-muted-foreground">{company.phone}</p>
                      </div>
                    )}
                    
                    {company.website && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Website
                        </h3>
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                    
                    {company.tin && (
                      <div>
                        <h3 className="font-semibold mb-2">TIN Number</h3>
                        <p className="text-muted-foreground">{company.tin}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}