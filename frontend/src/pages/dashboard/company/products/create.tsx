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
  Building,
  Package,
  RefreshCw,
  Wifi,
  WifiOff,
  Eye,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { colors, getTheme, ThemeMode, colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/Breadcrumb';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EntityAvatar } from '@/components/layout/EntityAvatar';
import ErrorBoundary from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

// Dynamically import ProductForm with loading skeleton
const ProductForm = dynamic(
  () => import('@/components/Products/ProductForm'),
  {
    ssr: false,
    loading: () => <ProductFormSkeleton />
  }
);

// =====================
// SKELETON LOADER
// =====================

const ProductFormSkeleton = () => {
  const { breakpoint } = useResponsive();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-3">
          <Card className={colorClasses.border.gray100}>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <Skeleton key={i} className={cn("h-8 sm:h-10 w-full", colorClasses.bg.secondary)} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-9">
          <Card className={colorClasses.border.gray100}>
            <CardContent className="p-3 sm:p-6">
              <Skeleton className={cn("h-6 sm:h-8 w-32 sm:w-48 mb-3 sm:mb-4", colorClasses.bg.secondary)} />
              <div className="space-y-3 sm:space-y-4">
                <Skeleton className={cn("h-10 sm:h-12 w-full", colorClasses.bg.secondary)} />
                <Skeleton className={cn("h-16 sm:h-20 w-full", colorClasses.bg.secondary)} />
                <Skeleton className={cn("h-24 sm:h-28 w-full", colorClasses.bg.secondary)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// =====================
// ERROR FALLBACK
// =====================

const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  const { breakpoint } = useResponsive();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className={cn("max-w-md w-full", colorClasses.border.gray100)}>
        <CardContent className="p-4 sm:p-6 text-center">
          <AlertTriangle className={cn("h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4", colorClasses.text.error)} />
          <h2 className={cn("text-lg sm:text-xl font-bold mb-2", colorClasses.text.primary)}>
            Something went wrong
          </h2>
          <p className={cn("text-xs sm:text-sm mb-4", colorClasses.text.secondary)}>
            {error.message || 'Failed to load product creation form'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <Button
              onClick={resetErrorBoundary}
              variant="outline"
              size={breakpoint === 'mobile' ? 'default' : 'sm'}
              className={cn(colorClasses.border.gray100, colorClasses.text.primary)}
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard/company/products'}
              size={breakpoint === 'mobile' ? 'default' : 'sm'}
              className={cn(colorClasses.bg.goldenMustard, colorClasses.text.white)}
            >
              Back to Products
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// =====================
// MAIN PAGE COMPONENT
// =====================

interface CreateProductPageProps {
  theme?: ThemeMode;
}

function CreateProductPage({ theme = 'light' }: CreateProductPageProps) {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { breakpoint, getTouchTargetSize } = useResponsive();

  const [activeTheme, setActiveTheme] = useState<ThemeMode>(theme);
  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const currentTheme = getTheme(activeTheme);

  // Check online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load company profile
  useEffect(() => {
    const loadCompanyProfile = async () => {
      if (!isAuthenticated || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        const { companyService } = await import('@/services/companyService');

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
        <div className={cn("min-h-screen", colorClasses.bg.primary)}>
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Loader2 className={cn("h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 animate-spin mb-3 sm:mb-4", colorClasses.text.goldenMustard)} />
              <p className={cn("text-sm sm:text-base md:text-lg", colorClasses.text.secondary)}>
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
        <div className={cn("min-h-screen", colorClasses.bg.primary)}>
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
            <Card className={cn("max-w-2xl mx-auto", colorClasses.border.gray100)}>
              <CardContent className="py-8 sm:py-12 text-center px-4">
                <AlertTriangle className={cn("h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto mb-3 sm:mb-4", colorClasses.text.error)} />
                <h2 className={cn("text-lg sm:text-xl md:text-2xl font-bold mb-2", colorClasses.text.primary)}>
                  Access Denied
                </h2>
                <p className={cn("mb-4 sm:mb-6 text-sm sm:text-base", colorClasses.text.secondary)}>
                  Only company accounts can create products.
                </p>
                <Button
                  onClick={() => router.push('/dashboard')}
                  size={breakpoint === 'mobile' ? 'default' : 'sm'}
                  className={cn(colorClasses.bg.goldenMustard, colorClasses.text.white)}
                >
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
        <div className={cn("min-h-screen", colorClasses.bg.primary)}>
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
            <Card className={cn("max-w-2xl mx-auto", colorClasses.border.gray100)}>
              <CardContent className="py-8 sm:py-12 text-center px-4">
                <AlertTriangle className={cn("h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto mb-3 sm:mb-4", colorClasses.text.goldenMustard)} />
                <h2 className={cn("text-lg sm:text-xl md:text-2xl font-bold mb-2", colorClasses.text.primary)}>
                  Company Profile Required
                </h2>
                <p className={cn("mb-4 sm:mb-6 text-sm sm:text-base", colorClasses.text.secondary)}>
                  {error || 'You need to complete your company profile before creating products'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center px-4">
                  <Button
                    onClick={() => router.push('/company/onboarding')}
                    className={cn("w-full sm:w-auto", colorClasses.bg.goldenMustard, colorClasses.text.white)}
                    size={breakpoint === 'mobile' ? 'default' : 'sm'}
                  >
                    Complete Company Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    className={cn("w-full sm:w-auto", colorClasses.border.gray400, colorClasses.text.primary)}
                    size={breakpoint === 'mobile' ? 'default' : 'sm'}
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
    <ErrorBoundary fallback={<ErrorFallback error={new Error(error || 'Unknown error')} resetErrorBoundary={() => setError(null)} />}>
      <DashboardLayout requiredRole="company">
        <Head>
          <title>Create New Product | Dashboard</title>
          <meta name="description" content="Add a new product to your company catalog" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>

        <div className={cn("min-h-screen", colorClasses.bg.primary)}>
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
            {/* Offline Warning */}
            {!isOnline && (
              <div className={cn(
                "mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg border flex items-center gap-2 sm:gap-3",
                colorClasses.bg.orangeLight,
                colorClasses.border.orange
              )}>
                <WifiOff className={cn("h-3 w-3 sm:h-4 sm:w-4", colorClasses.text.orange)} />
                <p className={cn("text-xs sm:text-sm", colorClasses.text.orange)}>
                  You are currently offline. Changes may not be saved properly.
                </p>
              </div>
            )}

            {/* Header Section */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              {/* Breadcrumbs */}
              <div className="mb-3 sm:mb-4 md:mb-6">
                <Breadcrumb>
                  <BreadcrumbList className="text-xs sm:text-sm">
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href="/dashboard"
                        className={cn("flex items-center gap-1 hover:underline", colorClasses.text.secondary)}
                      >
                        <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Dashboard</span>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href="/dashboard/company/products"
                        className={cn("flex items-center gap-1 hover:underline", colorClasses.text.secondary)}
                      >
                        <Box className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Products</span>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href="#"
                        className={cn("flex items-center gap-1", colorClasses.text.primary)}
                        style={{ fontWeight: '500' }}
                      >
                        <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Create New</span>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              {/* Main Header */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 md:gap-6">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/dashboard/company/products')}
                      className={cn(
                        "rounded-full p-1.5 sm:p-2",
                        colorClasses.bg.secondary,
                        colorClasses.text.primary
                      )}
                      size={breakpoint === 'mobile' ? 'sm' : 'default'}
                    >
                      <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <div>
                      <h1 className={cn("text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight", colorClasses.text.primary)}>
                        Create New Product
                      </h1>
                      <p className={cn("mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base", colorClasses.text.secondary)}>
                        Add a new product to your company catalog
                      </p>
                    </div>
                  </div>

                  {/* Company Info */}
                  {company && (
                    <div className={cn(
                      "flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 p-2 sm:p-3 md:p-4 rounded-lg border",
                      colorClasses.bg.secondary,
                      colorClasses.border.primary
                    )}>
                      <EntityAvatar
                        name={company.name}
                        avatar={company.logoUrl || company.logoFullUrl}
                        size={breakpoint === 'mobile' ? 'sm' : 'md'}
                        className="border-2 shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <h3 className={cn("font-semibold text-xs sm:text-sm md:text-base truncate", colorClasses.text.primary)}>
                            {company.name}
                          </h3>
                          {company.verified && (
                            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                              <Shield className={cn("h-2 w-2 sm:h-3 sm:w-3", colorClasses.text.green)} />
                              <span className={cn("text-xs", colorClasses.text.green, "hidden xs:inline")}>Verified</span>
                            </div>
                          )}
                        </div>
                        {company.industry && (
                          <p className={cn("text-xs sm:text-sm truncate", colorClasses.text.secondary)}>
                            {company.industry}
                          </p>
                        )}
                      </div>

                      {/* Desktop only: Cloudinary status */}
                      {breakpoint !== 'mobile' && (
                        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Cloud className={cn("h-3 w-3 sm:h-4 sm:w-4", colorClasses.text.blue)} />
                            <span className={cn("text-xs sm:text-sm", colorClasses.text.secondary)}>
                              Cloudinary enabled
                            </span>
                          </div>
                          <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse", colorClasses.bg.green)} />
                        </div>
                      )}

                      {/* Mobile: Quick status dot */}
                      {breakpoint === 'mobile' && (
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", colorClasses.bg.green)} />
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Stats - Desktop only */}
                {breakpoint !== 'mobile' && breakpoint !== 'tablet' && (
                  <div className="hidden lg:block">
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <CheckCircle className={cn("h-3 w-3 sm:h-4 sm:w-4", colorClasses.text.green)} />
                        <span className={cn("text-xs sm:text-sm font-medium", colorClasses.text.green)}>
                          Ready to create
                        </span>
                      </div>
                      <div className={cn("text-xs", colorClasses.text.secondary)}>
                        All systems operational
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-3 sm:my-4 md:my-6" style={{ backgroundColor: currentTheme.border.primary }} />
            </div>

            {/* Error Display */}
            {error && (
              <div className={cn(
                "mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg border",
                colorClasses.bg.orangeLight,
                colorClasses.border.orange
              )}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={cn("h-3 w-3 sm:h-4 sm:w-4 mt-0.5 shrink-0", colorClasses.text.orange)} />
                  <div>
                    <h4 className={cn("font-medium text-xs sm:text-sm", colorClasses.text.orange)}>
                      Attention Required
                    </h4>
                    <p className={cn("text-xs mt-0.5", colorClasses.text.orange)}>
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Form Area */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8">
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

            {/* Submission Status Overlay */}
            {creatingProduct && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className={cn("max-w-md w-full", colorClasses.border.gray100)}>
                  <CardContent className="p-4 sm:p-6 text-center">
                    <Loader2 className={cn("h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 animate-spin mx-auto mb-2 sm:mb-3", colorClasses.text.goldenMustard)} />
                    <h3 className={cn("text-sm sm:text-base font-semibold mb-1", colorClasses.text.primary)}>
                      Creating Product
                    </h3>
                    <p className={cn("text-xs sm:text-sm", colorClasses.text.secondary)}>
                      Please wait while we save your product...
                    </p>
                    <div className={cn("mt-3 sm:mt-4 w-full rounded-full h-1 sm:h-1.5", colorClasses.bg.secondary)}>
                      <div
                        className={cn("h-1 sm:h-1.5 rounded-full transition-all duration-300", colorClasses.bg.goldenMustard)}
                        style={{ width: '75%' }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  );
}

// Server-side props for theme
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
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