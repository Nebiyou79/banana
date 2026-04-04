/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Cloud,
  Shield,
  Image as ImageIcon,
  History,
  RefreshCw,
  Trash2,
  Lock,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { getTheme, ThemeMode, colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/Breadcrumb';
import { Badge } from '@/components/social/ui/Badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EntityAvatar } from '@/components/layout/EntityAvatar';
import ErrorBoundary from '@/components/ErrorBoundary';

// Dynamically import ProductForm
const ProductForm = dynamic(
  () => import('@/components/Products/ProductForm'),
  {
    ssr: false,
    loading: () => <ProductFormSkeleton />
  }
);

// =====================
// PRODUCT PREVIEW COMPONENT
// =====================

const ProductPreview: React.FC<{ product: any; theme: ThemeMode }> = ({ product, theme }) => {
  const { breakpoint } = useResponsive();
  const currentTheme = getTheme(theme);

  return (
    <Card className={colorClasses.border.gray100}>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="text-center py-6 sm:py-8 md:py-12">
          <div className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 rounded-full flex items-center justify-center",
            colorClasses.bg.goldenMustard
          )}>
            <Eye className={cn("h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7", colorClasses.text.goldenMustard)} />
          </div>
          <h3 className={cn("text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2", colorClasses.text.primary)}>
            Preview Mode
          </h3>
          <p className={cn("text-xs sm:text-sm mb-4 sm:mb-6 max-w-md mx-auto", colorClasses.text.secondary)}>
            This is how your product will appear to customers.
            {breakpoint !== 'mobile' && ' You can scroll to see all sections.'}
          </p>

          {/* Product Preview Card */}
          <div className={cn(
            "max-w-xs sm:max-w-sm mx-auto border rounded-lg overflow-hidden",
            colorClasses.border.gray100
          )}>
            {/* Image Preview */}
            <div className={cn("aspect-video flex items-center justify-center", colorClasses.bg.secondary)}>
              {product.images?.[0]?.secure_url ? (
                <img
                  src={product.images[0].secure_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className={cn("h-8 w-8 sm:h-10 sm:w-10", colorClasses.text.gray400)} />
              )}
            </div>

            {/* Content Preview */}
            <div className="p-3 sm:p-4 text-left">
              <h4 className={cn("font-semibold text-sm sm:text-base mb-0.5 sm:mb-1", colorClasses.text.primary)}>
                {product.name || 'Product Name'}
              </h4>
              <p className={cn("text-xs sm:text-sm mb-2 line-clamp-2", colorClasses.text.secondary)}>
                {product.shortDescription || product.description || 'Product description will appear here'}
              </p>
              <div className="flex items-center justify-between">
                <span className={cn("font-bold text-sm sm:text-base", colorClasses.text.goldenMustard)}>
                  ${typeof product.price?.amount === 'number' ? product.price.amount.toFixed(2) : '0.00'}
                </span>
                <Badge variant="outline" className={cn("text-xs", colorClasses.border.gray100)}>
                  View Details
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => window.open(`/products/${product._id}`, '_blank')}
            className={cn("mt-4 sm:mt-6 gap-1 sm:gap-2", colorClasses.border.gray100, colorClasses.text.primary)}
            size={breakpoint === 'mobile' ? 'sm' : 'default'}
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            Open Live Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

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
            {error.message || 'Failed to load the edit page'}
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
// DELETE CONFIRMATION MODAL
// =====================

const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  isDeleting: boolean;
}> = ({ isOpen, onClose, onConfirm, productName, isDeleting }) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={cn("max-w-md w-full", colorClasses.border.gray100)}>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <h3 className={cn("text-base sm:text-lg font-semibold mb-2", colorClasses.text.primary)}>
            Delete Product
          </h3>
          <p className={cn("text-xs sm:text-sm mb-4", colorClasses.text.secondary)}>
            Are you sure you want to delete "{productName}"? This action cannot be undone.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              size={breakpoint === 'mobile' ? 'default' : 'sm'}
              className={cn("w-full sm:w-auto", getTouchTargetSize('md'), colorClasses.border.gray100)}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
              size={breakpoint === 'mobile' ? 'default' : 'sm'}
              className={cn("w-full sm:w-auto", getTouchTargetSize('md'), colorClasses.bg.red, colorClasses.text.white)}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Product'
              )}
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

interface EditProductPageProps {
  initialProduct?: any;
  theme?: ThemeMode;
  productId: string;
}

function EditProductPage({ initialProduct, theme = 'light', productId }: EditProductPageProps) {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { breakpoint, getTouchTargetSize } = useResponsive();

  const [activeTheme, setActiveTheme] = useState<ThemeMode>(theme);
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<any>(initialProduct);
  const [company, setCompany] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Check permissions and load data
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !user || !productId) return;

      setIsLoading(true);
      setError(null);

      try {
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
            if (error.response?.status === 404) {
              setError('Product not found');
            } else {
              setError('Failed to load product. Please try again.');
            }
            toast({
              title: 'Error',
              description: error.message || 'Failed to load product',
              variant: 'destructive',
            });
            return;
          }
        }

        // ── STEP 1: Load company FIRST so canManageProduct has the real ID ──
        // The User type from useAuth() does not carry companyId on the top level;
        // it lives as user.company._id (nested), but may not be hydrated yet when
        // this effect fires. Fetching it explicitly guarantees we have it.
        let companyData: any = null;
        if (user.role === 'company') {
          try {
            companyData = await companyService.getMyCompany();
            setCompany(companyData);
          } catch (error: any) {
            console.error('Failed to load company:', error);
          }
        } else if (user.role === 'admin') {
          companyData = {
            _id: 'admin',
            name: 'Admin Account',
            logoUrl: null,
            verified: true,
            industry: 'Administration',
          };
          setCompany(companyData);
        }

        // ── STEP 2: Build enriched user that canManageProduct can resolve ──
        // Cast as `any` so we can attach company fields without fighting the User
        // interface (which intentionally omits company fields — they live in the
        // auth context's extended shape, not the base User type).
        const enrichedUser: any = {
          ...user,
          // Provide the ID in both shapes that canManageProduct checks:
          //   currentUser.companyId     (flat string fallback)
          //   currentUser.company?._id  (nested object shape)
          company: { _id: companyData?._id?.toString() },
          companyId: companyData?._id?.toString(),
        };

        // ── STEP 3: Permission check with the now-populated enrichedUser ──
        if (productData) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Permission Check]', {
              productCompanyId:
                typeof productData.companyId === 'object'
                  ? (productData.companyId as any)?._id
                  : productData.companyId,
              userCompanyId: enrichedUser.companyId,
              role: enrichedUser.role,
            });
          }

          const canEdit = productService.canManageProduct(productData, enrichedUser);
          setHasPermission(canEdit);

          if (!canEdit) {
            setError('You do not have permission to edit this product.');
            toast({
              title: 'Access Denied',
              description: 'You do not have permission to edit this product.',
              variant: 'destructive',
            });
            router.replace('/dashboard/company/products');
            return;
          }
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
  // router intentionally omitted from deps — router.replace/push are stable and
  // including router causes an infinite re-render loop on navigation events.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user, productId, product]);

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

  // Handle unsaved changes detection
  const handleUnsavedChanges = (hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!product || !hasPermission) return;

    setIsDeleting(true);
    try {
      const { productService } = await import('@/services/productService');
      await productService.deleteProduct(product._id);

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
        variant: 'default',
      });

      router.push('/dashboard/company/products');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Toggle preview mode
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  // Loading state
  if (authLoading || isLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className={cn("min-h-screen", colorClasses.bg.primary)}>
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Loader2 className={cn("h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 animate-spin mb-3 sm:mb-4", colorClasses.text.goldenMustard)} />
              <p className={cn("text-sm sm:text-base md:text-lg", colorClasses.text.secondary)}>
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
    return null;
  }

  if (!hasPermission && !isLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className={cn("min-h-screen", colorClasses.bg.primary)}>
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
            <Card className={cn("max-w-2xl mx-auto", colorClasses.border.gray100)}>
              <CardContent className="py-8 sm:py-12 text-center px-4">
                <Lock className={cn("h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto mb-3 sm:mb-4", colorClasses.text.error)} />
                <h2 className={cn("text-lg sm:text-xl md:text-2xl font-bold mb-2", colorClasses.text.primary)}>
                  Access Denied
                </h2>
                <p className={cn("mb-4 sm:mb-6 text-sm sm:text-base", colorClasses.text.secondary)}>
                  You don't have permission to edit this product.
                </p>
                <Button
                  onClick={() => router.push(`/dashboard/company/products/${productId}`)}
                  size={breakpoint === 'mobile' ? 'default' : 'sm'}
                  className={cn(colorClasses.bg.goldenMustard, colorClasses.text.white)}
                >
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
        <div className={cn("min-h-screen", colorClasses.bg.primary)}>
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
            <Card className={cn("max-w-2xl mx-auto", colorClasses.border.gray100)}>
              <CardContent className="py-8 sm:py-12 text-center px-4">
                <AlertTriangle className={cn("h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto mb-3 sm:mb-4", colorClasses.text.goldenMustard)} />
                <h2 className={cn("text-lg sm:text-xl md:text-2xl font-bold mb-2", colorClasses.text.primary)}>
                  Product Not Found
                </h2>
                <p className={cn("mb-4 sm:mb-6 text-sm sm:text-base", colorClasses.text.secondary)}>
                  The product you're trying to edit doesn't exist or has been removed.
                </p>
                <Button
                  onClick={() => router.push('/dashboard/company/products')}
                  size={breakpoint === 'mobile' ? 'default' : 'sm'}
                  className={cn(colorClasses.bg.goldenMustard, colorClasses.text.white)}
                >
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
    <ErrorBoundary fallback={<ErrorFallback error={new Error(error || 'Unknown error')} resetErrorBoundary={() => setError(null)} />}>
      <DashboardLayout requiredRole="company">
        <Head>
          <title>Edit {product.name} | Dashboard</title>
          <meta name="description" content={`Edit ${product.name} - Update product details and images`} />
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

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
              isOpen={showDeleteConfirm}
              onClose={() => setShowDeleteConfirm(false)}
              onConfirm={handleDeleteProduct}
              productName={product.name}
              isDeleting={isDeleting}
            />

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
                        href={`/dashboard/company/products/${productId}`}
                        className={cn("flex items-center gap-1 hover:underline", colorClasses.text.secondary)}
                      >
                        <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline max-w-[80px] sm:max-w-[100px] truncate">
                          {product.name}
                        </span>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href="#"
                        className={cn("flex items-center gap-1", colorClasses.text.primary)}
                        style={{ fontWeight: '500' }}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        Edit
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
                      onClick={() => router.push(`/dashboard/company/products/${productId}`)}
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
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <h1 className={cn("text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight", colorClasses.text.primary)}>
                          Edit Product
                        </h1>
                        <Badge
                          variant={product.status === 'active' ? 'default' : product.status === 'draft' ? 'secondary' : 'outline'}
                          className={cn(
                            "capitalize text-xs",
                            product.status === 'active' && colorClasses.bg.green,
                            product.status === 'active' && colorClasses.text.white,
                            product.status === 'draft' && colorClasses.bg.amber,
                            product.status === 'draft' && colorClasses.text.white,
                            product.status === 'inactive' && colorClasses.border.gray400,
                            product.status === 'inactive' && colorClasses.text.secondary
                          )}
                        >
                          {product.status}
                        </Badge>
                      </div>
                      <p className={cn("mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base truncate max-w-xs sm:max-w-md", colorClasses.text.secondary)}>
                        {product.name}
                      </p>
                    </div>
                  </div>

                  {/* Product Info Cards - Stack on mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
                    {/* Product Summary Card */}
                    <div className={cn(
                      "p-2 sm:p-3 rounded-lg border",
                      colorClasses.bg.secondary,
                      colorClasses.border.primary
                    )}>
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        {product.images?.[0]?.secure_url ? (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden shrink-0">
                            <img
                              src={product.images[0].secure_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={cn(
                            "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0",
                            colorClasses.bg.goldenMustard
                          )}>
                            <Package className={cn("h-4 w-4 sm:h-5 sm:w-5", colorClasses.text.goldenMustard)} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className={cn("font-semibold text-xs sm:text-sm truncate", colorClasses.text.primary)}>
                            {product.name}
                          </h3>
                          <p className={cn("text-xs truncate", colorClasses.text.secondary)}>
                            SKU: {product.sku || 'Not set'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs">
                        <div>
                          <span className={colorClasses.text.muted}>Category:</span>
                          <p className={cn("font-medium truncate", colorClasses.text.primary)}>{product.category}</p>
                        </div>
                        <div>
                          <span className={colorClasses.text.muted}>Price:</span>
                          <p className={cn("font-medium", colorClasses.text.primary)}>
                            ${typeof product.price?.amount === 'number' ? product.price.amount.toFixed(2) : '0.00'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className={colorClasses.text.muted}>Last Updated:</span>
                          <p className={cn("font-medium text-xs", colorClasses.text.secondary)}>
                            {formatRelativeTime(product.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Company Info Card */}
                    {company && (
                      <div className={cn(
                        "p-2 sm:p-3 rounded-lg border",
                        colorClasses.bg.secondary,
                        colorClasses.border.primary
                      )}>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <EntityAvatar
                            name={company.name}
                            avatar={company.logoUrl || company.logoFullUrl}
                            size={breakpoint === 'mobile' ? 'sm' : 'md'}
                            className="border-2 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <h3 className={cn("font-semibold text-xs sm:text-sm truncate", colorClasses.text.primary)}>
                                {company.name}
                              </h3>
                              {company.verified && (
                                <Shield className={cn("h-2 w-2 sm:h-3 sm:w-3 shrink-0", colorClasses.text.green)} />
                              )}
                            </div>
                            {company.industry && (
                              <p className={cn("text-xs truncate", colorClasses.text.secondary)}>
                                {company.industry}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 mt-2 text-xs">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Cloud className={cn("h-3 w-3", colorClasses.text.blue)} />
                            <span className={cn("text-xs", colorClasses.text.secondary)}>
                              Cloudinary
                            </span>
                          </div>
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", colorClasses.bg.green)} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Stack on mobile */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
                  <Button
                    onClick={togglePreviewMode}
                    variant={isPreviewMode ? "default" : "outline"}
                    className={cn(
                      "gap-1 sm:gap-2 w-full sm:w-auto",
                      getTouchTargetSize('md'),
                      isPreviewMode
                        ? cn(colorClasses.bg.goldenMustard, colorClasses.text.white)
                        : cn(colorClasses.border.gray400, colorClasses.text.primary)
                    )}
                    size={breakpoint === 'mobile' ? 'default' : 'sm'}
                  >
                    {isPreviewMode ? (
                      <>
                        <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Exit Preview</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Preview</span>
                      </>
                    )}
                  </Button>

                  {lastSaved && (
                    <div className={cn(
                      "text-xs sm:text-sm text-center flex items-center gap-1 justify-center",
                      colorClasses.text.green
                    )}>
                      <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3" />
                      <span className="hidden xs:inline">Saved</span>
                      <span className="xs:hidden">✓</span>
                      <span className="hidden sm:inline">{formatRelativeTime(lastSaved)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Bar */}
              <div className={cn(
                "mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg border",
                hasUnsavedChanges
                  ? cn(colorClasses.bg.goldenMustard, colorClasses.border.gold)
                  : cn(colorClasses.bg.secondary, colorClasses.border.primary)
              )}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
                      hasUnsavedChanges ? colorClasses.bg.gold : colorClasses.bg.green
                    )} />
                    <div>
                      <h4 className={cn("font-medium text-xs sm:text-sm", colorClasses.text.primary)}>
                        {hasUnsavedChanges ? 'You have unsaved changes' : 'All changes saved'}
                      </h4>
                      {breakpoint !== 'mobile' && (
                        <p className={cn("text-xs", colorClasses.text.secondary)}>
                          {hasUnsavedChanges
                            ? 'Save your changes before leaving this page'
                            : 'Your changes have been saved'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 text-xs">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <ImageIcon className={cn("h-3 w-3", colorClasses.text.blue)} />
                      <span className={colorClasses.text.secondary}>
                        {product.images?.length || 0} images
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <History className={cn("h-3 w-3", colorClasses.text.orange)} />
                      <span className={cn("hidden sm:inline", colorClasses.text.secondary)}>
                        Last edited {formatRelativeTime(product.updatedAt)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDeleteConfirm(true)}
                      className={cn("h-6 w-6 sm:h-7 sm:w-7", colorClasses.text.error)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
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

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8">
              {isPreviewMode ? (
                <ProductPreview product={product} theme={activeTheme} />
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

            {/* Submission Status */}
            {updatingProduct && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className={cn("max-w-md w-full", colorClasses.border.gray100)}>
                  <CardContent className="p-4 sm:p-6 text-center">
                    <Loader2 className={cn("h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 animate-spin mx-auto mb-2 sm:mb-3", colorClasses.text.goldenMustard)} />
                    <h3 className={cn("text-sm sm:text-base font-semibold mb-1", colorClasses.text.primary)}>
                      Updating Product
                    </h3>
                    <p className={cn("text-xs sm:text-sm", colorClasses.text.secondary)}>
                      Please wait while we save your changes...
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

// Server-side props for product data
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  const theme = context.req.cookies.theme === 'dark' ? 'dark' : 'light';

  try {
    return {
      props: {
        initialProduct: null,
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