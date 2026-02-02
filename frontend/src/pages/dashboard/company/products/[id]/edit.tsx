// pages/dashboard/company/products/[id]/edit.tsx
import { useState, useEffect, useCallback } from 'react';
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
  Package,
  Home,
  Box,
  Edit,
  Save,
  Eye,
  EyeOff,
  Clock,
  User,
  Building,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Cloud,
  Shield,
  Image as ImageIcon,
  Calendar,
  History,
  RefreshCw,
  Trash2,
  ChevronRight,
  Lock,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { colors, getTheme, ThemeMode } from '@/utils/color';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/Breadcrumb';
import { Badge } from '@/components/social/ui/Badge';
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

interface EditProductPageProps {
  initialProduct: any;
  theme?: ThemeMode;
  productId: string;
}

function EditProductPage({ initialProduct, theme = 'light', productId }: EditProductPageProps) {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [activeTheme, setActiveTheme] = useState<ThemeMode>(theme);
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<any>(initialProduct);
  const [company, setCompany] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const currentTheme = getTheme(activeTheme);

  // Check permissions and load data
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !user || !productId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Dynamically import services
        const { companyService } = await import('@/services/companyService');
        const { productService } = await import('@/services/productService');

        // Load product if not provided
        let productData = product;
        if (!productData) {
          try {
            productData = await productService.getProduct(productId as string);
            setProduct(productData);
          } catch (error: any) {
            console.error('Failed to load product:', error);
            setError('Product not found or you don\'t have permission to edit it.');
            toast({
              title: 'Error',
              description: 'Failed to load product',
              variant: 'destructive',
            });
            return;
          }
        }

        // Check permission to edit product
        if (productData) {
          const canEdit = productService.canManageProduct(productData, user);
          setHasPermission(canEdit);

          if (!canEdit) {
            setError('You do not have permission to edit this product.');
            toast({
              title: 'Access Denied',
              description: 'You do not have permission to edit this product.',
              variant: 'destructive',
            });
            router.push(`/products/${productId}`);
            return;
          }
        }

        // Load company data
        if (user.role === 'company') {
          try {
            const companyData = await companyService.getMyCompany();
            setCompany(companyData);
          } catch (error: any) {
            console.error('Failed to load company:', error);
          }
        } else if (user.role === 'admin') {
          setCompany({
            _id: 'admin',
            name: 'Admin Account',
            logoUrl: null,
            verified: true,
            industry: 'Administration'
          });
        }

      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load product data');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      loadData();
    }
  }, [authLoading, isAuthenticated, user, productId, product, router]);

  // Handle theme based on localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setActiveTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setActiveTheme('dark');
    }
  }, []);

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    const handleRouteChange = (url: string) => {
      if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.events.emit('routeChangeError');
        throw 'Route change aborted';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [hasUnsavedChanges, router]);

  // Handle successful product update
  const handleProductUpdated = useCallback(async (updatedProduct: any) => {
    setUpdatingProduct(false);
    setHasUnsavedChanges(false);
    setLastSaved(new Date().toISOString());

    toast({
      title: 'Success!',
      description: `Product "${updatedProduct.name}" updated successfully!`,
      variant: 'default',
    });

    // Update local state
    setProduct(updatedProduct);
  }, []);

  // Handle form cancellation
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        router.push(`/dashboard/company/products/${productId}`);
      }
    } else {
      router.push(`/dashboard/company/products/${productId}`);
    }
  };

  // Handle form submission start
  const handleFormSubmitStart = () => {
    setUpdatingProduct(true);
  };

  // Handle form submission error
  const handleFormError = (error: any) => {
    setUpdatingProduct(false);
    console.error('Product update error:', error);
  };

  // Handle unsaved changes detection
  const handleUnsavedChanges = (hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  };

  // Toggle preview mode
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
    setViewMode(isPreviewMode ? 'edit' : 'preview');
  };

  // Check permissions on mount
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/dashboard/company/products/${productId}/edit`);
      return;
    }

    if (!authLoading && user && (user.role !== 'company' && user.role !== 'admin')) {
      toast({
        title: 'Access Denied',
        description: 'Only company accounts can edit products',
        variant: 'destructive',
      });
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router, productId]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen" style={{ backgroundColor: currentTheme.bg.primary }}>
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Loader2 className="h-12 w-12 animate-spin mb-4" style={{ color: colors.goldenMustard }} />
              <p className="text-lg" style={{ color: currentTheme.text.secondary }}>
                Loading product editor...
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

  if (!hasPermission && !isLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen" style={{ backgroundColor: currentTheme.bg.primary }}>
          <div className="container mx-auto px-4 py-8">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-12 text-center">
                <Lock className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  You don't have permission to edit this product.
                </p>
                <Button onClick={() => router.push(`/dashboard/company/products/${productId}`)}>
                  View Product
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen" style={{ backgroundColor: currentTheme.bg.primary }}>
          <div className="container mx-auto px-4 py-8">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4" style={{ color: colors.goldenMustard }} />
                <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  The product you're trying to edit doesn't exist or has been removed.
                </p>
                <Button onClick={() => router.push('/dashboard/company/products')}>
                  Back to Products
                </Button>
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
        <title>Edit {product.name} | Dashboard</title>
        <meta name="description" content={`Edit ${product.name} - Update product details and images`} />
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
                      href={`/dashboard/company/products/${productId}`}
                      className="flex items-center gap-2 hover:underline"
                      style={{ color: currentTheme.text.secondary }}
                    >
                      <Package className="h-4 w-4" />
                      {product.name.length > 20 ? `${product.name.substring(0, 20)}...` : product.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="#"
                      className="flex items-center gap-2"
                      style={{ color: currentTheme.text.primary, fontWeight: '500' }}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
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
                    onClick={() => router.push(`/dashboard/company/products/${productId}`)}
                    style={{
                      color: currentTheme.text.primary,
                      backgroundColor: currentTheme.bg.secondary
                    }}
                    className="rounded-full p-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold tracking-tight" style={{ color: currentTheme.text.primary }}>
                        Edit Product
                      </h1>
                      <Badge
                        variant={product.status === 'active' ? 'default' : product.status === 'draft' ? 'secondary' : 'outline'}
                        className="capitalize"
                      >
                        {product.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-lg" style={{ color: currentTheme.text.secondary }}>
                      Update "{product.name}" details and images
                    </p>
                  </div>
                </div>

                {/* Product & Company Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Product Info */}
                  <div className="p-4 rounded-lg" style={{
                    backgroundColor: currentTheme.bg.secondary,
                    border: `1px solid ${currentTheme.border.primary}`
                  }}>
                    <div className="flex items-center gap-3 mb-3">
                      {product.images?.[0]?.secure_url ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden">
                          <img
                            src={product.images[0].secure_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
                          backgroundColor: colors.goldenMustard + '20',
                        }}>
                          <Package className="h-6 w-6" style={{ color: colors.goldenMustard }} />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold" style={{ color: currentTheme.text.primary }}>
                          {product.name}
                        </h3>
                        <p className="text-sm" style={{ color: currentTheme.text.secondary }}>
                          SKU: {product.sku || 'Not set'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span style={{ color: currentTheme.text.muted }}>Category:</span>
                        <p style={{ color: currentTheme.text.primary }}>{product.category}</p>
                      </div>
                      <div>
                        <span style={{ color: currentTheme.text.muted }}>Price:</span>
                        <p style={{ color: currentTheme.text.primary }}>
                          ${typeof product.price?.amount === 'number' ? product.price.amount.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <div>
                        <span style={{ color: currentTheme.text.muted }}>Created:</span>
                        <p style={{ color: currentTheme.text.primary }}>{formatDate(product.createdAt)}</p>
                      </div>
                      <div>
                        <span style={{ color: currentTheme.text.muted }}>Last Updated:</span>
                        <p style={{ color: currentTheme.text.primary }}>{formatDate(product.updatedAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Company Info */}
                  {company && (
                    <div className="p-4 rounded-lg" style={{
                      backgroundColor: currentTheme.bg.secondary,
                      border: `1px solid ${currentTheme.border.primary}`
                    }}>
                      <div className="flex items-center gap-3 mb-3">
                        <EntityAvatar
                          name={company.name}
                          avatar={company.logoUrl || company.logoFullUrl}
                          size="md"
                          className="border-2"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold" style={{ color: currentTheme.text.primary }}>
                              {company.name}
                            </h3>
                            {company.verified && (
                              <div className="flex items-center gap-1">
                                <Shield className="h-3 w-3" style={{ color: colors.green }} />
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
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4" style={{ color: currentTheme.text.blue }} />
                          <span style={{ color: currentTheme.text.secondary }}>
                            Cloudinary enabled
                          </span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <Button
                  onClick={togglePreviewMode}
                  variant={isPreviewMode ? "default" : "outline"}
                  className="gap-2"
                  style={{
                    backgroundColor: isPreviewMode ? colors.goldenMustard : 'transparent',
                    color: isPreviewMode ? colors.white : currentTheme.text.primary,
                    borderColor: currentTheme.border.gray400
                  }}
                >
                  {isPreviewMode ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Exit Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Preview
                    </>
                  )}
                </Button>

                {lastSaved && (
                  <div className="text-sm text-center" style={{ color: currentTheme.text.success }}>
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Saved {formatDate(lastSaved)}
                  </div>
                )}
              </div>
            </div>

            {/* Status Bar */}
            <div className="mt-6 p-4 rounded-lg" style={{
              backgroundColor: hasUnsavedChanges ? `${colors.gold}20` : currentTheme.bg.gray100,
              border: `1px solid ${hasUnsavedChanges ? colors.gold : currentTheme.border.primary}`
            }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${hasUnsavedChanges ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                  <div>
                    <h4 className="font-medium" style={{ color: currentTheme.text.primary }}>
                      {hasUnsavedChanges ? 'You have unsaved changes' : 'All changes saved'}
                    </h4>
                    <p className="text-sm" style={{ color: currentTheme.text.secondary }}>
                      {hasUnsavedChanges
                        ? 'Save your changes before leaving this page'
                        : 'Your changes have been saved'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" style={{ color: currentTheme.text.blue }} />
                    <span style={{ color: currentTheme.text.secondary }}>
                      {product.images?.length || 0} images
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" style={{ color: currentTheme.text.orange }} />
                    <span style={{ color: currentTheme.text.secondary }}>
                      Last edited {formatDate(product.updatedAt)}
                    </span>
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
              {isPreviewMode ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <Eye className="h-16 w-16 mx-auto mb-4" style={{ color: colors.goldenMustard }} />
                      <h3 className="text-xl font-semibold mb-2">Preview Mode</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Preview your changes before saving. Click "Exit Preview" to continue editing.
                      </p>
                      <Button
                        onClick={togglePreviewMode}
                        style={{
                          backgroundColor: colors.goldenMustard,
                          color: colors.white,
                        }}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Exit Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <ProductForm
                  mode="edit"
                  product={product}
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
                  onSuccess={handleProductUpdated}
                  onCancel={handleCancel}
                  theme={activeTheme}
                  loading={updatingProduct}
                />
              )}
            </div>
          </div>

          {/* Submission Status */}
          {updatingProduct && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="max-w-md">
                <CardContent className="p-6 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: colors.goldenMustard }} />
                  <h3 className="text-lg font-semibold mb-2">Updating Product</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Please wait while we save your changes...
                  </p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-goldenMustard h-2 rounded-full transition-all duration-300"
                      style={{ width: '75%' }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Server-side props for product data
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  const theme = context.req.cookies.theme === 'dark' ? 'dark' : 'light';

  try {
    // You would typically fetch the product here
    // For now, we'll return null and fetch on client
    // This avoids SSR issues with dynamic imports

    return {
      props: {
        initialProduct: null, // Will be fetched on client
        productId: id,
        theme,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);

    return {
      props: {
        initialProduct: null,
        productId: id,
        theme: 'light',
      },
    };
  }
};

export default EditProductPage;