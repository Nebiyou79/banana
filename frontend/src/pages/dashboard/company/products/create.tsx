/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/products/create.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/Separator';
import { Button } from '@/components/social/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardContent } from '@/components/social/ui/Card';
import { 
  ArrowLeft,
  Home,
  Box,
  PlusCircle,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Cloud,
  Shield,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { colors, getTheme, ThemeMode } from '@/utils/color';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/Breadcrumb';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EntityAvatar } from '@/components/layout/EntityAvatar';

// Dynamically import ProductForm
const ProductForm = dynamic(
  () => import('@/components/Products/ProductForm'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }
);

interface CreateProductPageProps {
  theme?: ThemeMode;
}

function CreateProductPage({ theme = 'light' }: CreateProductPageProps) {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTheme, setActiveTheme] = useState<ThemeMode>(theme);
  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTheme = getTheme(activeTheme);

  // Load company profile
  useEffect(() => {
    const loadCompanyProfile = async () => {
      if (!isAuthenticated || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        // Dynamically import companyService to avoid SSR issues
        const { companyService } = await import('@/services/companyService');
        
        // For company users, verify they have a company profile
        if (user.role === 'company') {
          try {
            const companyData = await companyService.getMyCompany();
            if (companyData) {
              setCompany(companyData);
              setHasCompanyProfile(true);
            } else {
              setHasCompanyProfile(false);
              setError('Company profile not found. Please complete your company profile first.');
              toast({
                title: 'Company Profile Required',
                description: 'Please complete your company profile before creating products',
                variant: 'destructive',
              });
            }
          } catch (error: any) {
            console.error('Failed to load company profile:', error);
            setHasCompanyProfile(false);
            setError(error.message || 'Failed to load company profile');
          }
        } else if (user.role === 'admin') {
          // Admins can create products for any company
          setHasCompanyProfile(true);
          setCompany({
            _id: 'admin',
            name: 'Admin Account',
            logoUrl: null,
            verified: true,
            industry: 'Administration'
          });
        }
      } catch (err: any) {
        console.error('Error loading company profile:', err);
        setError(err.message || 'Failed to load company information');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      loadCompanyProfile();
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Handle theme based on localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setActiveTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setActiveTheme('dark');
    }
  }, []);

  // Handle successful product creation
  const handleProductCreated = async (product: any) => {
    setCreatingProduct(false);
    toast({
      title: 'Success!',
      description: `Product "${product.name}" created successfully!`,
      variant: 'default',
    });
    
    // Redirect to the product detail page
    router.push(`/dashboard/company/products/${product._id}`);
  };

  // Handle form cancellation
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/dashboard/company/products');
    }
  };

  // Check permissions on mount
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/company/products/create');
      return;
    }

    if (!authLoading && user && (user.role !== 'company' && user.role !== 'admin')) {
      toast({
        title: 'Access Denied',
        description: 'Only company accounts can create products',
        variant: 'destructive',
      });
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen" style={{ backgroundColor: currentTheme.bg.primary }}>
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Loader2 className="h-12 w-12 animate-spin mb-4" style={{ color: colors.goldenMustard }} />
              <p className="text-lg" style={{ color: currentTheme.text.secondary }}>
                Loading product creation...
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Check authentication and permissions
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (user?.role !== 'company' && user?.role !== 'admin') {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen" style={{ backgroundColor: currentTheme.bg.primary }}>
          <div className="container mx-auto px-4 py-8">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  Only company accounts can create products.
                </p>
                <Button onClick={() => router.push('/dashboard')}>
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state - no company profile for company users
  if (user?.role === 'company' && !hasCompanyProfile) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen" style={{ backgroundColor: currentTheme.bg.primary }}>
          <div className="container mx-auto px-4 py-8">
            <Card style={{
              backgroundColor: currentTheme.bg.secondary,
              borderColor: currentTheme.border.primary
            }}>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4" style={{ color: colors.goldenMustard }} />
                <h2 className="text-2xl font-bold mb-2" style={{ color: currentTheme.text.primary }}>
                  Company Profile Required
                </h2>
                <p className="mb-6" style={{ color: currentTheme.text.secondary }}>
                  {error || 'You need to complete your company profile before creating products'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => router.push('/company/onboarding')}
                    style={{
                      backgroundColor: colors.goldenMustard,
                      color: colors.white,
                    }}
                  >
                    Complete Company Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    style={{
                      borderColor: currentTheme.border.gray400,
                      color: currentTheme.text.primary
                    }}
                  >
                    Return to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="company">
      <Head>
        <title>Create New Product | Dashboard</title>
        <meta name="description" content="Add a new product to your company catalog" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: currentTheme.bg.primary }}>
        <div className="container mx-auto px-4 py-6">
          {/* Header Section */}
          <div className="mb-8">
            {/* Breadcrumbs */}
            <div className="mb-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      href="/dashboard"
                      className="flex items-center gap-2 hover:underline"
                      style={{ color: currentTheme.text.secondary }}
                    >
                      <Home className="h-4 w-4" />
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      href="/dashboard/company/products"
                      className="flex items-center gap-2 hover:underline"
                      style={{ color: currentTheme.text.secondary }}
                    >
                      <Box className="h-4 w-4" />
                      Products
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      href="#"
                      className="flex items-center gap-2"
                      style={{ color: currentTheme.text.primary, fontWeight: '500' }}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Create New
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Main Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard/company/products')}
                    style={{
                      color: currentTheme.text.primary,
                      backgroundColor: currentTheme.bg.secondary
                    }}
                    className="rounded-full p-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: currentTheme.text.primary }}>
                      Create New Product
                    </h1>
                    <p className="mt-2 text-lg" style={{ color: currentTheme.text.secondary }}>
                      Add a new product to your company catalog
                    </p>
                  </div>
                </div>

                {/* Company Info */}
                {company && (
                  <div className="flex items-center gap-3 mt-4 p-4 rounded-lg" style={{
                    backgroundColor: currentTheme.bg.secondary,
                    border: `1px solid ${currentTheme.border.primary}`
                  }}>
                    <EntityAvatar
                      name={company.name}
                      avatar={company.logoUrl || company.logoFullUrl}
                      size="md"
                      className="border-2"
                      // style={{ borderColor: colors.goldenMustard }}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold" style={{ color: currentTheme.text.primary }}>
                          {company.name}
                        </h3>
                        {company.verified && (
                          <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4" style={{ color: colors.green }} />
                            <span className="text-xs text-green-600 dark:text-green-400">Verified</span>
                          </div>
                        )}
                      </div>
                      {company.industry && (
                        <p className="text-sm" style={{ color: currentTheme.text.secondary }}>
                          {company.industry}
                        </p>
                      )}
                    </div>

                    <div className="hidden sm:flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" style={{ color: currentTheme.text.blue }} />
                        <span className="text-sm" style={{ color: currentTheme.text.secondary }}>
                          Cloudinary enabled
                        </span>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="hidden lg:block">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" style={{ color: colors.green }} />
                    <span className="text-sm font-medium" style={{ color: currentTheme.text.success }}>
                      Ready to create
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: currentTheme.text.secondary }}>
                    All systems operational
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" style={{ backgroundColor: currentTheme.border.primary }} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 rounded-lg border" style={{
              backgroundColor: `${currentTheme.bg.orange}20`,
              borderColor: currentTheme.border.orange,
            }}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 mt-0.5" style={{ color: currentTheme.text.orange }} />
                <div>
                  <h4 className="font-medium" style={{ color: currentTheme.text.orange }}>
                    Attention Required
                  </h4>
                  <p className="text-sm mt-1" style={{ color: currentTheme.text.orange }}>
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Form Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Content */}
            <div className="lg:col-span-12">
              <ProductForm
                mode="create"
                company={company ? {
                  _id: company._id,
                  name: company.name,
                  logoUrl: company.logoUrl || company.logoFullUrl,
                  verified: company.verified,
                  industry: company.industry || '',
                  description: company.description,
                  website: company.website
                } : undefined}
                companyId={company?._id}
                onSuccess={handleProductCreated}
                onCancel={handleCancel}
                theme={activeTheme}
                loading={creatingProduct}
              />
            </div>
          </div>

          {/* Submission Status */}
          {creatingProduct && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="max-w-md">
                <CardContent className="p-6 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: colors.goldenMustard }} />
                  <h3 className="text-lg font-semibold mb-2">Creating Product</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Please wait while we save your product...</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Server-side props for theme
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get theme from cookies or default to light
    const theme = context.req.cookies.theme === 'dark' ? 'dark' : 'light';

    return {
      props: {
        theme,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        theme: 'light',
      },
    };
  }
};

export default CreateProductPage;