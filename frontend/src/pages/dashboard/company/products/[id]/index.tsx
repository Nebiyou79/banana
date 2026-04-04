/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/products/[id]/index.tsx
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { CompanyAvatarDisplay } from '@/components/Products/CompanyAvatarDisplay';
import { useAuth } from '@/hooks/useAuth';
import { productService, Product } from '@/services/productService';
import { companyService, CompanyProfile } from '@/services/companyService';
import { colors, getTheme, ThemeMode, colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/social/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/social/ui/Alert-Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Building,
  DollarSign,
  Eye,
  Tag,
  Share2,
  Copy,
  Shield,
  MoreVertical,
  Loader2,
  WifiOff,
  RefreshCw,
  Home,
  Grid,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ProductDetail from '@/components/Products/ProductDetail';
import ErrorBoundary from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

// =====================
// QUICK STAT CARD COMPONENT
// =====================
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <Card className={cn("overflow-hidden", colorClasses.border.gray100)}>
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span className={cn("text-xs sm:text-sm font-medium", colorClasses.text.muted)}>
          {label}
        </span>
        <div style={{ color }}>{icon}</div>
      </div>
      <span className={cn("text-base sm:text-lg md:text-xl font-bold block truncate", colorClasses.text.primary)}>
        {value}
      </span>
    </CardContent>
  </Card>
);

// =====================
// ERROR FALLBACK COMPONENT
// =====================
const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className={cn("max-w-md w-full", colorClasses.border.gray100)}>
        <CardContent className="p-4 sm:p-6 text-center">
          <AlertCircle className={cn("h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4", colorClasses.text.error)} />
          <h2 className={cn("text-lg sm:text-xl font-bold mb-2", colorClasses.text.primary)}>
            Something went wrong
          </h2>
          <p className={cn("text-xs sm:text-sm mb-4", colorClasses.text.secondary)}>
            {error.message || 'Failed to load product details'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <Button
              onClick={resetErrorBoundary}
              variant="outline"
              size={breakpoint === 'mobile' ? 'default' : 'sm'}
              className={cn(getTouchTargetSize('md'), colorClasses.border.gray100, colorClasses.text.primary)}
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard/company/products'}
              size={breakpoint === 'mobile' ? 'default' : 'sm'}
              className={cn(getTouchTargetSize('md'), colorClasses.bg.goldenMustard, colorClasses.text.white)}
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
// COMPANY INFO CARD COMPONENT
// Uses CompanyAvatarDisplay for consistent avatar resolution across all product pages.
// =====================
const CompanyInfoCard: React.FC<{
  company: CompanyProfile | null;
  onEdit: () => void;
  onViewAll: () => void;
}> = ({ company, onEdit, onViewAll }) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();

  if (!company) return null;

  const avatarUrl = (company as any).logoUrl || (company as any).logoFullUrl;
  const avatarPublicId = (company as any).avatarPublicId || (company as any).avatar?.public_id;

  return (
    <Card className={cn(
      "mt-4 sm:mt-6",
      colorClasses.border.gray100,
      "dark:bg-gray-900 dark:border-gray-700"
    )}>
      <CardContent className="p-3 sm:p-4 md:p-6">

        {/* ── Avatar + name header ── */}
        <div className={cn(
          "flex items-center gap-3 sm:gap-4 pb-3 sm:pb-4 mb-3 sm:mb-4 border-b",
          colorClasses.border.gray100,
          "dark:border-gray-700"
        )}>
          <CompanyAvatarDisplay
            companyName={company.name}
            avatarUrl={avatarUrl}
            avatarPublicId={avatarPublicId}
            verified={company.verified}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn(
                "text-sm sm:text-base md:text-lg font-semibold truncate",
                colorClasses.text.primary,
                "dark:text-white"
              )}>
                {company.name}
              </h3>
              {company.verified && (
                <Badge
                  variant="outline"
                  className="text-[10px] sm:text-xs gap-1 px-1.5 py-0.5 border-blue-400 text-blue-600 dark:text-blue-400"
                >
                  <Shield className="h-2.5 w-2.5" />
                  Verified
                </Badge>
              )}
            </div>
            {company.industry && (
              <p className={cn("text-xs sm:text-sm mt-0.5 truncate", colorClasses.text.secondary, "dark:text-gray-400")}>
                {company.industry}
              </p>
            )}
          </div>
        </div>

        {/* ── Detail fields + actions ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2 sm:space-y-3">
            {company.industry && (
              <div>
                <span className={cn("text-xs sm:text-sm font-medium block mb-0.5", colorClasses.text.muted)}>
                  Industry
                </span>
                <span className={cn("text-sm sm:text-base block", colorClasses.text.secondary, "dark:text-gray-300")}>
                  {company.industry}
                </span>
              </div>
            )}
            {company.website && (
              <div>
                <span className={cn("text-xs sm:text-sm font-medium block mb-0.5", colorClasses.text.muted)}>
                  Website
                </span>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("text-sm sm:text-base hover:underline inline-flex items-center gap-1 truncate max-w-full", colorClasses.text.blue)}
                >
                  {company.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>

          <div className="space-y-2 sm:space-y-3">
            {company.description && (
              <div>
                <span className={cn("text-xs sm:text-sm font-medium block mb-0.5", colorClasses.text.muted)}>
                  About
                </span>
                <p className={cn("text-sm sm:text-base leading-relaxed line-clamp-3", colorClasses.text.secondary, "dark:text-gray-400")}>
                  {company.description}
                </p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className={cn(getTouchTargetSize('md'), colorClasses.border.gray100, colorClasses.text.primary, "dark:border-gray-600 dark:text-gray-300")}
              >
                Edit Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAll}
                className={cn(getTouchTargetSize('md'), colorClasses.border.gray100, colorClasses.text.primary, "dark:border-gray-600 dark:text-gray-300")}
              >
                All Products
              </Button>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

// =====================
// MAIN PAGE COMPONENT
// =====================
export default function CompanyProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const { breakpoint, getTouchTargetSize } = useResponsive();

  const [product, setProduct] = useState<Product | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

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

  // Load theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setThemeMode(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeMode('dark');
    }
  }, []);

  // Stable ref to router — avoids router being in useEffect deps.
  // Next.js recreates the router object on navigation; including it in deps
  // causes the fetch to re-fire infinitely on mobile.
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);

  useEffect(() => {
    const fetchProductAndCompany = async () => {
      if (!id || typeof id !== 'string' || authLoading) return;

      setLoading(true);
      try {
        const productData = await productService.getProduct(id);
        setProduct(productData);

        const companyId = typeof productData.companyId === 'string'
          ? productData.companyId
          : productData.companyId?._id;

        if (companyId) {
          if (typeof productData.companyId === 'object' && productData.companyId) {
            setCompany({
              _id: productData.companyId._id,
              name: productData.companyId.name,
              logoUrl: productData.companyId.logoUrl,
              verified: productData.companyId.verified,
              industry: productData.companyId.industry,
              description: productData.companyId.description,
              website: productData.companyId.website,
              user: { _id: '', name: '', email: '' },
              createdAt: '',
              updatedAt: '',
              tin: '',
              address: '',
              phone: '',
              bannerUrl: ''
            });
          } else {
            const companyData = await companyService.getCompany(companyId);
            setCompany(companyData);
          }
        }
      } catch (error: any) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load product',
          variant: 'destructive',
        });

        if (error.response?.status === 404) {
          routerRef.current.push('/dashboard/company/products');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndCompany();
  // router intentionally excluded — routerRef.current is used inside instead.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, authLoading]);

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    try {
      await productService.deleteProduct(product._id);
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
        variant: 'default',
      });
      router.push('/dashboard/company/products');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async (status: 'active' | 'inactive' | 'draft') => {
    if (!product) return;

    try {
      const updatedProduct = await productService.updateProductStatus(product._id, status);
      setProduct(updatedProduct);
      toast({
        title: 'Success',
        description: `Product status updated to ${status}`,
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link copied',
      description: 'Product link copied to clipboard',
      variant: 'default',
    });
  };

  const canManage = product && user && productService.canManageProduct(product, user);

  if (authLoading || loading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className={cn("min-h-screen", colorClasses.bg.primary)}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
            {/* Breadcrumb Skeleton */}
            <div className="mb-3 sm:mb-4 md:mb-6">
              <div className="flex items-center gap-1 sm:gap-2">
                <Skeleton className={cn("h-3 w-16 sm:h-4 sm:w-20", colorClasses.bg.secondary)} />
                <ChevronRight className={cn("h-3 w-3 sm:h-4 sm:w-4", colorClasses.text.muted)} />
                <Skeleton className={cn("h-3 w-20 sm:h-4 sm:w-24", colorClasses.bg.secondary)} />
              </div>
            </div>

            {/* Header Skeleton */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                  <Skeleton className={cn("h-8 w-8 sm:h-10 sm:w-10 rounded-full shrink-0", colorClasses.bg.secondary)} />
                  <div className="flex-1">
                    <Skeleton className={cn("h-4 w-32 sm:h-5 sm:w-40 mb-1 sm:mb-2", colorClasses.bg.secondary)} />
                    <Skeleton className={cn("h-3 w-20 sm:h-4 sm:w-24", colorClasses.bg.secondary)} />
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Skeleton className={cn("h-8 w-16 sm:h-9 sm:w-20 flex-1 sm:flex-none", colorClasses.bg.secondary)} />
                  <Skeleton className={cn("h-8 w-8 sm:h-9 sm:w-9 flex-1 sm:flex-none", colorClasses.bg.secondary)} />
                </div>
              </div>
            </div>

            {/* Stats Skeleton - 2 on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className={cn("h-16 sm:h-20 w-full rounded-lg", colorClasses.bg.secondary)} />
              ))}
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <Skeleton className={cn("aspect-[4/3] rounded-xl", colorClasses.bg.secondary)} />
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className={cn("h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-lg shrink-0", colorClasses.bg.secondary)} />
                  ))}
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <Skeleton className={cn("h-5 w-3/4 sm:h-6", colorClasses.bg.secondary)} />
                <Skeleton className={cn("h-4 w-1/2 sm:h-5", colorClasses.bg.secondary)} />
                <Skeleton className={cn("h-12 sm:h-16 w-full", colorClasses.bg.secondary)} />
                <Skeleton className={cn("h-12 sm:h-16 w-full", colorClasses.bg.secondary)} />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout requiredRole="company">
        <div className={cn("min-h-screen", colorClasses.bg.primary)}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
            <div className="text-center py-8 sm:py-12">
              <div className={cn("mx-auto w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-3 sm:mb-4", colorClasses.bg.secondary)}>
                <Package className={cn("h-5 w-5 sm:h-6 sm:w-6", colorClasses.text.muted)} />
              </div>
              <h2 className={cn("text-lg sm:text-xl md:text-2xl font-bold mb-2", colorClasses.text.primary)}>
                Product Not Found
              </h2>
              <p className={cn("text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto", colorClasses.text.secondary)}>
                The product you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button
                onClick={() => router.push('/dashboard/company/products')}
                size={breakpoint === 'mobile' ? 'default' : 'sm'}
                className={cn(getTouchTargetSize('md'), colorClasses.bg.goldenMustard, colorClasses.text.white)}
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Back to Products
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stockStatus = productService.getStockStatus(product.inventory);
  const formattedPrice = productService.formatPrice(product.price);

  return (
    <ErrorBoundary>
      <DashboardLayout requiredRole="company">
        <Head>
          <title>{product.name} | Company Dashboard</title>
          <meta name="description" content={product.shortDescription || product.description} />
        </Head>

        {/* Offline Warning */}
        {!isOnline && (
          <div className={cn(
            "sticky top-0 z-50 p-2 text-center text-xs sm:text-sm",
            colorClasses.bg.orangeLight,
            colorClasses.text.orange,
            colorClasses.border.orange
          )}>
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <WifiOff className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>You are offline. Some features may be unavailable.</span>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="w-[90vw] max-w-md p-4 sm:p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className={cn("text-lg sm:text-xl", colorClasses.text.primary)}>
                Delete Product
              </AlertDialogTitle>
              <AlertDialogDescription className={cn("text-sm sm:text-base", colorClasses.text.secondary)}>
                Are you sure you want to delete "{product.name}"? This action cannot be undone and all product data will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel
                disabled={isDeleting}
                className={cn("w-full sm:w-auto", getTouchTargetSize('md'))}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
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
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className={cn("min-h-screen", colorClasses.bg.primary)}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
            {/* Breadcrumb Navigation */}
            <nav className="mb-3 sm:mb-4 md:mb-6">
              <ol className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap">
                <li>
                  <Link
                    href="/dashboard"
                    className={cn("flex items-center gap-1 hover:underline", colorClasses.text.muted)}
                  >
                    <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                </li>
                <li>
                  <ChevronRight className={cn("h-3 w-3 sm:h-4 sm:w-4", colorClasses.text.muted)} />
                </li>
                <li>
                  <Link
                    href="/dashboard/company/products"
                    className={cn("flex items-center gap-1 hover:underline", colorClasses.text.muted)}
                  >
                    <Grid className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Products</span>
                  </Link>
                </li>
                <li>
                  <ChevronRight className={cn("h-3 w-3 sm:h-4 sm:w-4", colorClasses.text.muted)} />
                </li>
                <li className={cn("font-medium truncate max-w-[120px] sm:max-w-[200px]", colorClasses.text.primary)}>
                  {product.name}
                </li>
              </ol>
            </nav>

            {/* Header with Company Info and Actions */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-2 sm:gap-3 w-full">
                  <CompanyAvatarDisplay
                    companyName={company?.name || 'Company'}
                    avatarUrl={(company as any)?.logoUrl || (company as any)?.logoFullUrl}
                    avatarPublicId={(company as any)?.avatarPublicId || (company as any)?.avatar?.public_id}
                    verified={company?.verified}
                    size={breakpoint === 'mobile' ? 'md' : 'lg'}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                      <h1 className={cn("text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate", colorClasses.text.primary)}>
                        {product.name}
                      </h1>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] sm:text-xs px-1.5 py-0.5",
                          product.status === 'active' ? cn(colorClasses.border.green, colorClasses.text.green) :
                            product.status === 'inactive' ? cn(colorClasses.border.gray400, colorClasses.text.secondary) :
                              cn(colorClasses.border.amber, colorClasses.text.amber)
                        )}
                      >
                        {product.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs">
                      <div className={cn("flex items-center gap-1", colorClasses.text.muted)}>
                        <Building className="h-3 w-3" />
                        <span className={cn("truncate max-w-[100px] sm:max-w-[150px]", colorClasses.text.primary)}>
                          {company?.name || 'Your Company'}
                        </span>
                        {company?.verified && (
                          <Badge variant="outline" size="sm" className={cn("ml-1 text-[8px] sm:text-[10px] px-1 py-0", colorClasses.border.blue, colorClasses.text.blue)}>
                            Verified
                          </Badge>
                        )}
                      </div>
                      <Separator orientation="vertical" className={cn("h-3", colorClasses.bg.secondary)} />
                      <div className={cn("flex items-center gap-1", colorClasses.text.muted)}>
                        <Package className="h-3 w-3" />
                        <span className={cn("truncate max-w-[80px] sm:max-w-[120px]")}>
                          SKU: {product.sku || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => router.push(`/dashboard/company/products/${product._id}/edit`)}
                    className={cn(
                      "gap-1 flex-1 sm:flex-none",
                      getTouchTargetSize('md'),
                      colorClasses.bg.goldenMustard,
                      colorClasses.text.white
                    )}
                    size={breakpoint === 'mobile' ? 'default' : 'sm'}
                  >
                    <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="sm:hidden">Edit</span>
                    <span className="hidden sm:inline">Edit</span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size={breakpoint === 'mobile' ? 'default' : 'icon'}
                        className={cn(
                          breakpoint === 'mobile' ? "px-3 flex-1" : "",
                          getTouchTargetSize('md'),
                          colorClasses.border.gray100
                        )}
                      >
                        <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                        {breakpoint === 'mobile' && <span className="ml-1">Actions</span>}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 sm:w-56">
                      <DropdownMenuItem
                        onClick={handleCopyLink}
                        className={cn("gap-2 cursor-pointer text-xs sm:text-sm", colorClasses.text.primary)}
                      >
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                        Copy Link
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <div className={cn("px-2 py-1.5 text-xs font-medium", colorClasses.text.muted)}>
                        Change Status
                      </div>
                      {product.status !== 'active' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange('active')}
                          className={cn("gap-2 cursor-pointer text-xs sm:text-sm", colorClasses.text.green)}
                        >
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          Set Active
                        </DropdownMenuItem>
                      )}
                      {product.status !== 'inactive' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange('inactive')}
                          className={cn("gap-2 cursor-pointer text-xs sm:text-sm", colorClasses.text.muted)}
                        >
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          Set Inactive
                        </DropdownMenuItem>
                      )}
                      {product.status !== 'draft' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange('draft')}
                          className={cn("gap-2 cursor-pointer text-xs sm:text-sm", colorClasses.text.amber)}
                        >
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          Set Draft
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => setDeleteDialogOpen(true)}
                        className={cn("gap-2 cursor-pointer text-xs sm:text-sm", colorClasses.text.error)}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        Delete Product
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Quick Stats - 2 on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
              <StatCard
                label="Price"
                value={formattedPrice}
                icon={<DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />}
                color={colors.goldenMustard}
              />
              <StatCard
                label="Stock"
                value={product.inventory.trackQuantity ? product.inventory.quantity : '∞'}
                icon={<Package className="h-3 w-3 sm:h-4 sm:w-4" />}
                color={stockStatus?.color || colors.gray400}
              />
              <StatCard
                label="Views"
                value={product.views.toLocaleString()}
                icon={<Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                color={colors.blue}
              />
              <StatCard
                label="Category"
                value={product.category}
                icon={<Tag className="h-3 w-3 sm:h-4 sm:w-4" />}
                color={colors.purple}
              />
            </div>

            {/* Main Product Detail Component */}
            <div className={cn(
              "rounded-xl sm:rounded-2xl border overflow-hidden",
              colorClasses.border.gray100,
              colorClasses.bg.primary
            )}>
              <ProductDetail
                productId={product._id}
                currentUser={user}
                theme={themeMode}
                onBack={() => router.push('/dashboard/company/products')}
              />
            </div>

            {/* Company Info Card */}
            <CompanyInfoCard
              company={company}
              onEdit={() => router.push('/dashboard/company/profile')}
              onViewAll={() => router.push('/dashboard/company/products')}
            />
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  );
}