/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ProductDetail } from '@/components/Products/ProductDetail';
import { CompanyAvatarDisplay } from '@/components/Products/CompanyAvatarDisplay';
import { useAuth } from '@/hooks/useAuth';
import { productService, Product } from '@/services/productService';
import { colors, getTheme, ThemeMode, colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/social/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Share2,
  Building,
  Package,
  Star,
  Eye,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  MapPin,
  Phone,
  Mail,
  Shield,
  Sparkles,
  TrendingUp,
  WifiOff,
  Home,
  Grid,
  Award,
  Tag,
} from 'lucide-react';
import { companyService } from '@/services/companyService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// =====================
// TRUST BADGE COMPONENT
// =====================
const TrustBadge: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className={cn(
    "flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg transition-all hover:shadow-md",
    colorClasses.bg.secondary
  )}>
    <div className={cn(
      "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0",
      colorClasses.bg.goldenMustard
    )}>
      <div className={cn("h-4 w-4 sm:h-5 sm:w-5", colorClasses.text.goldenMustard)}>
        {icon}
      </div>
    </div>
    <div>
      <h4 className={cn("font-medium text-xs sm:text-sm mb-0.5 sm:mb-1", colorClasses.text.primary)}>
        {title}
      </h4>
      <p className={cn("text-xs", colorClasses.text.secondary)}>{description}</p>
    </div>
  </div>
);

// =====================
// COMPANY INFO CARD COMPONENT
// =====================
const CompanyInfoCard: React.FC<{
  company: any;
  product: Product;
  onContact: () => void;
}> = ({ company, product, onContact }) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();

  if (!company) return null;

  return (
    <Card className={cn("overflow-hidden", colorClasses.border.gray100)}>
      <CardContent className="p-0">
        {/* Banner (optional) */}
        {company.bannerUrl && (
          <div className="h-16 sm:h-20 md:h-24 w-full overflow-hidden">
            <img
              src={company.bannerUrl}
              alt={`${company.name} banner`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <Link href={`/companies/${company._id}`} className="shrink-0">
              <CompanyAvatarDisplay
                companyName={company.name}
                avatarUrl={company.logoUrl || company.ownerAvatarUrl}
                avatarPublicId={company.avatarPublicId || company.avatar?.public_id}
                verified={company.verified}
                size="lg"
              />
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <Link
                  href={`/companies/${company._id}`}
                  className="hover:underline"
                >
                  <h3 className={cn("text-base sm:text-lg md:text-xl font-bold", colorClasses.text.primary)}>
                    {company.name}
                  </h3>
                </Link>
                {company.verified && (
                  <Badge variant="outline" className={cn("text-[10px] sm:text-xs gap-1 px-1.5 py-0.5", colorClasses.border.blue, colorClasses.text.blue)}>
                    <Shield className="h-2 w-2 sm:h-3 sm:w-3" />
                    Verified
                  </Badge>
                )}
                {company.featured && (
                  <Badge variant="outline" className={cn("text-[10px] sm:text-xs gap-1 px-1.5 py-0.5", colorClasses.border.goldenMustard, colorClasses.text.goldenMustard)}>
                    <Sparkles className="h-2 w-2 sm:h-3 sm:w-3" />
                    Featured
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 mt-2">
                {company.industry && (
                  <div className="flex items-center gap-1 sm:gap-2 text-xs">
                    <Building className={cn("h-3 w-3", colorClasses.text.muted)} />
                    <span className={colorClasses.text.secondary}>{company.industry}</span>
                  </div>
                )}
                {company.location && (
                  <div className="flex items-center gap-1 sm:gap-2 text-xs">
                    <MapPin className={cn("h-3 w-3", colorClasses.text.muted)} />
                    <span className={cn("truncate", colorClasses.text.secondary)}>{company.location}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-1 sm:gap-2 text-xs">
                    <Phone className={cn("h-3 w-3", colorClasses.text.muted)} />
                    <span className={colorClasses.text.secondary}>{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-1 sm:gap-2 text-xs">
                    <Mail className={cn("h-3 w-3", colorClasses.text.muted)} />
                    <span className={cn("truncate", colorClasses.text.secondary)}>{company.email}</span>
                  </div>
                )}
              </div>

              {company.description && (
                <p className={cn("mt-3 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3", colorClasses.text.secondary)}>
                  {company.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button
              onClick={onContact}
              className={cn("flex-1 gap-1 sm:gap-2", getTouchTargetSize('md'), colorClasses.bg.goldenMustard, colorClasses.text.white)}
              size={breakpoint === 'mobile' ? 'default' : 'sm'}
            >
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              Contact Seller
            </Button>
            <Button
              variant="outline"
              className={cn("flex-1 gap-1 sm:gap-2", getTouchTargetSize('md'), colorClasses.border.gray100)}
              size={breakpoint === 'mobile' ? 'default' : 'sm'}
              onClick={() => window.open(`/companies/${company._id}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              View Profile
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// =====================
// RELATED PRODUCT CARD
// =====================
const RelatedProductCard: React.FC<{
  product: Product;
}> = ({ product }) => {
  const { breakpoint } = useResponsive();
  const company = typeof product.companyId === 'object' ? product.companyId : null;
  const [imgError, setImgError] = useState(false);

  const imageUrl = product.images?.[0]?.secure_url
    ? productService.getImageUrl(product.images[0].secure_url, {
      width: breakpoint === 'mobile' ? 200 : 300,
      height: breakpoint === 'mobile' ? 200 : 300,
      crop: 'fill'
    })
    : '/images/product-placeholder.jpg';

  return (
    <Link href={`/products/${product._id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="group cursor-pointer"
      >
        <Card className={cn("overflow-hidden h-full", colorClasses.border.gray100)}>
          <CardContent className="p-2 sm:p-3">
            <div className={cn("aspect-square rounded-lg overflow-hidden mb-2", colorClasses.bg.secondary)}>
              {!imgError ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={() => setImgError(true)}
                  loading="lazy"
                />
              ) : (
                <div className={cn("w-full h-full flex items-center justify-center", colorClasses.bg.secondary)}>
                  <Package className={cn("h-6 w-6 sm:h-8 sm:w-8", colorClasses.text.muted)} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <CompanyAvatarDisplay
                companyName={company?.name || 'Company'}
                avatarUrl={company?.logoUrl}
                avatarPublicId={(company as any)?.avatarPublicId}
                size="sm"
              />
              <span className={cn("text-xs truncate", colorClasses.text.secondary)}>
                {company?.name || 'Company'}
              </span>
            </div>

            <h4 className={cn(
              "font-semibold text-xs sm:text-sm mb-1 line-clamp-2 group-hover:text-goldenMustard transition-colors",
              colorClasses.text.primary
            )}>
              {product.name}
            </h4>

            <div className="flex items-center justify-between">
              <span className={cn("font-bold text-xs sm:text-sm", colorClasses.text.goldenMustard)}>
                {productService.formatPrice(product.price)}
              </span>
              <div className={cn("flex items-center gap-0.5 sm:gap-1 text-xs", colorClasses.text.muted)}>
                <Eye className="h-2 w-2 sm:h-3 sm:w-3" />
                {product.views.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
};

// =====================
// STAT CARD COMPONENT
// =====================
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
}> = ({ label, value, icon, color, subtext }) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2 }}
    className={cn("rounded-lg border p-2 sm:p-3", colorClasses.border.gray100, colorClasses.bg.primary)}
  >
    <div className="flex items-center justify-between mb-1 sm:mb-2">
      <span className={cn("text-xs", colorClasses.text.secondary)}>{label}</span>
      <div style={{ color }}>{icon}</div>
    </div>
    <p className={cn("text-sm sm:text-base md:text-lg font-bold", colorClasses.text.primary)}>
      {value}
    </p>
    {subtext && (
      <p className={cn("text-xs mt-0.5", colorClasses.text.muted)}>{subtext}</p>
    )}
  </motion.div>
);

// =====================
// MAIN PAGE COMPONENT
// =====================
export default function PublicProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { breakpoint, getTouchTargetSize } = useResponsive();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
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

  // Keep a stable ref to router so we can call router.push inside effects
  // without adding router to the dependency array (which causes infinite re-renders
  // because Next.js recreates the router object on every navigation event).
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id || typeof id !== 'string') return;

      setLoading(true);
      try {
        const productData = await productService.getProduct(id);
        setProduct(productData);

        let companyData = null;
        if (typeof productData.companyId === 'object' && productData.companyId) {
          companyData = productData.companyId;
          setCompany(companyData);
        } else if (typeof productData.companyId === 'string') {
          try {
            companyData = await companyService.getCompany(productData.companyId);
            setCompany(companyData);
          } catch (error) {
            console.error('Error fetching company:', error);
          }
        }

        fetchRelatedProducts(productData._id);
      } catch (error: any) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load product',
          variant: 'destructive',
        });

        if (error.response?.status === 404) {
          routerRef.current.push('/products');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  // router intentionally excluded — it is not stable between renders.
  // routerRef.current is used inside the effect instead.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRelatedProducts = async (productId: string) => {
    setLoadingRelated(true);
    try {
      const related = await productService.getRelatedProducts(productId, 4);
      setRelatedProducts(related);
    } catch (error) {
      console.error('Failed to fetch related products:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleSaveToggle = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save products',
        variant: 'default',
      });
      router.push(`/auth/login?redirect=/products/${id}`);
      return;
    }

    setIsSaved(!isSaved);
    toast({
      title: isSaved ? 'Removed from saved' : 'Saved to favorites',
      description: isSaved
        ? 'Product removed from your saved items'
        : 'Product added to your favorites',
      variant: 'default',
    });
  };

  const handleShare = async () => {
    if (navigator.share && breakpoint === 'mobile') {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.shortDescription || product?.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copied!',
          description: 'Product link copied to clipboard',
          variant: 'default',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to copy link',
          variant: 'destructive',
        });
      }
    }
  };

  const handleContactCompany = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to contact the seller',
        variant: 'default',
      });
      router.push(`/auth/login?redirect=/products/${id}`);
      return;
    }

    if (company) {
      router.push(`/messages/new?company=${company._id}&product=${product?._id}`);
    } else {
      toast({
        title: 'Error',
        description: 'Company information not available',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Head>
          <title>Loading Product... | Marketplace</title>
        </Head>
        <div className={cn("min-h-screen", colorClasses.bg.primary)}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
            {/* Breadcrumb Skeleton */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-1 sm:gap-2">
                <Skeleton className={cn("h-3 w-16 sm:h-4 sm:w-20", colorClasses.bg.secondary)} />
                <ChevronRight className={cn("h-3 w-3 sm:h-4 sm:w-4", colorClasses.text.muted)} />
                <Skeleton className={cn("h-3 w-20 sm:h-4 sm:w-24", colorClasses.bg.secondary)} />
              </div>
            </div>

            {/* Header Skeleton */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Skeleton className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-full", colorClasses.bg.secondary)} />
                  <div>
                    <Skeleton className={cn("h-4 w-32 sm:h-5 sm:w-40 mb-1", colorClasses.bg.secondary)} />
                    <Skeleton className={cn("h-3 w-20 sm:h-4 sm:w-24", colorClasses.bg.secondary)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className={cn("h-8 w-16 sm:h-9 sm:w-20", colorClasses.bg.secondary)} />
                  <Skeleton className={cn("h-8 w-8 sm:h-9 sm:w-9", colorClasses.bg.secondary)} />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <Skeleton className={cn("aspect-[4/3] rounded-xl", colorClasses.bg.secondary)} />
                <div className="flex gap-2">
                  <Skeleton className={cn("h-12 w-12 sm:h-14 sm:w-14 rounded-lg", colorClasses.bg.secondary)} />
                  <Skeleton className={cn("h-12 w-12 sm:h-14 sm:w-14 rounded-lg", colorClasses.bg.secondary)} />
                  <Skeleton className={cn("h-12 w-12 sm:h-14 sm:w-14 rounded-lg", colorClasses.bg.secondary)} />
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <Skeleton className={cn("h-5 w-3/4 sm:h-6", colorClasses.bg.secondary)} />
                <Skeleton className={cn("h-4 w-1/2 sm:h-5", colorClasses.bg.secondary)} />
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
      <DashboardLayout>
        <Head>
          <title>Product Not Found | Marketplace</title>
        </Head>
        <div className={cn("min-h-screen flex items-center justify-center p-4", colorClasses.bg.primary)}>
          <div className="text-center max-w-md">
            <div className={cn("w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center", colorClasses.bg.secondary)}>
              <Package className={cn("h-6 w-6 sm:h-7 sm:w-7", colorClasses.text.muted)} />
            </div>
            <h2 className={cn("text-lg sm:text-xl md:text-2xl font-bold mb-2", colorClasses.text.primary)}>
              Product Not Found
            </h2>
            <p className={cn("text-sm sm:text-base mb-4 sm:mb-6", colorClasses.text.secondary)}>
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button
              onClick={() => router.push('/products')}
              className={cn(colorClasses.bg.goldenMustard, colorClasses.text.white)}
              size={breakpoint === 'mobile' ? 'default' : 'sm'}
            >
              <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Back to Marketplace
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stockStatus = productService.getStockStatus(product.inventory);
  const formattedPrice = productService.formatPrice(product.price);
  const isNew = product.createdAt &&
    (new Date().getTime() - new Date(product.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

  // Get grid columns for related products
  const getRelatedGridCols = () => {
    if (breakpoint === 'mobile') return 'grid-cols-1';
    if (breakpoint === 'tablet') return 'grid-cols-2';
    return 'grid-cols-4';
  };

  return (
    <DashboardLayout>
      <Head>
        <title>{product.name} | Marketplace</title>
        <meta name="description" content={product.shortDescription || product.description} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.shortDescription || product.description} />
        {product.images?.[0] && (
          <meta property="og:image" content={product.images[0].secure_url} />
        )}
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

      <div className={cn("min-h-screen", colorClasses.bg.primary)}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
          {/* Breadcrumb Navigation */}
          <nav className="mb-4 sm:mb-6">
            <ol className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap">
              <li>
                <Link
                  href="/"
                  className={cn("flex items-center gap-1 hover:underline transition-colors", colorClasses.text.secondary)}
                >
                  <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              </li>
              <li>
                <ChevronRight className={cn("h-3 w-3 sm:h-4 sm:w-4", colorClasses.text.muted)} />
              </li>
              <li>
                <Link
                  href="/products"
                  className={cn("flex items-center gap-1 hover:underline transition-colors", colorClasses.text.secondary)}
                >
                  <Grid className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Marketplace</span>
                </Link>
              </li>
              <li>
                <ChevronRight className={cn("h-3 w-3 sm:h-4 sm:w-4", colorClasses.text.muted)} />
              </li>
              {product.category && (
                <>
                  <li>
                    <Link
                      href={`/products?category=${encodeURIComponent(product.category)}`}
                      className={cn("hover:underline transition-colors", colorClasses.text.secondary)}
                    >
                      {product.category}
                    </Link>
                  </li>
                  <li>
                    <ChevronRight className={cn("h-3 w-3 sm:h-4 sm:w-4", colorClasses.text.muted)} />
                  </li>
                </>
              )}
              <li className={cn("font-medium truncate max-w-[120px] sm:max-w-[200px]", colorClasses.text.primary)}>
                {product.name}
              </li>
            </ol>
          </nav>

          {/* Header with Company Info */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <Link href={`/companies/${company?._id || '#'}`} className="shrink-0">
                  <CompanyAvatarDisplay
                    companyName={company?.name || 'Company'}
                    avatarUrl={company?.logoUrl || company?.ownerAvatarUrl}
                    avatarPublicId={company?.avatarPublicId || company?.avatar?.public_id}
                    verified={company?.verified}
                    size={breakpoint === 'mobile' ? 'md' : 'lg'}
                  />
                </Link>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                    <Link
                      href={`/companies/${company?._id || '#'}`}
                      className="hover:underline"
                    >
                      <h2 className={cn("text-base sm:text-lg md:text-xl font-bold", colorClasses.text.primary)}>
                        {company?.name || 'Company'}
                      </h2>
                    </Link>
                    {company?.verified && (
                      <Badge variant="outline" className={cn("text-[10px] sm:text-xs gap-1 px-1.5 py-0.5", colorClasses.border.blue, colorClasses.text.blue)}>
                        <Shield className="h-2 w-2 sm:h-3 sm:w-3" />
                        Verified
                      </Badge>
                    )}
                    {isNew && (
                      <Badge className={cn("text-[10px] sm:text-xs gap-1 px-1.5 py-0.5", colorClasses.bg.green, colorClasses.text.white)}>
                        <Sparkles className="h-2 w-2 sm:h-3 sm:w-3" />
                        New
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                    {company?.industry && (
                      <div className="flex items-center gap-1">
                        <Building className={cn("h-3 w-3", colorClasses.text.muted)} />
                        <span className={colorClasses.text.secondary}>{company.industry}</span>
                      </div>
                    )}
                    {company?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className={cn("h-3 w-3", colorClasses.text.muted)} />
                        <span className={cn("truncate max-w-[80px] sm:max-w-[120px]", colorClasses.text.secondary)}>
                          {company.location}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className={cn("h-3 w-3 fill-current", colorClasses.text.goldenMustard)} />
                      <span className={colorClasses.text.secondary}>4.8 (124)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveToggle}
                  variant="outline"
                  size={breakpoint === 'mobile' ? 'sm' : 'default'}
                  className={cn("gap-1 sm:gap-2", getTouchTargetSize('md'), colorClasses.border.gray100)}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className={cn("h-3 w-3 sm:h-4 sm:w-4", colorClasses.text.goldenMustard)} />
                      <span className="hidden sm:inline">Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Save</span>
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleShare}
                  variant="outline"
                  size={breakpoint === 'mobile' ? 'sm' : 'icon'}
                  className={cn(breakpoint === 'mobile' ? "px-3" : "", getTouchTargetSize('md'), colorClasses.border.gray100)}
                  title="Share"
                >
                  <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  {breakpoint === 'mobile' && <span className="ml-1">Share</span>}
                </Button>

                <Button
                  onClick={handleContactCompany}
                  size={breakpoint === 'mobile' ? 'sm' : 'default'}
                  className={cn("gap-1 sm:gap-2", getTouchTargetSize('md'), colorClasses.bg.goldenMustard, colorClasses.text.white)}
                >
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Contact</span>
                  <span className="sm:hidden">Chat</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats Cards - 2 on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <StatCard
              label="Price"
              value={formattedPrice}
              icon={<span className="text-sm sm:text-base">💰</span>}
              color={colors.goldenMustard}
              subtext={product.price.unit !== 'unit' ? `Per ${product.price.unit}` : 'Price'}
            />
            <StatCard
              label="Stock"
              value={stockStatus.text}
              icon={<div className={cn("w-2 h-2 rounded-full")} style={{ backgroundColor: stockStatus.color }} />}
              color={stockStatus.color}
              subtext={product.inventory.trackQuantity ? `${product.inventory.quantity} units` : 'Unlimited'}
            />
            <StatCard
              label="Views"
              value={product.views.toLocaleString()}
              icon={<Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
              color={colors.blue}
              subtext="Total views"
            />
            <StatCard
              label="Category"
              value={product.category}
              icon={<Tag className="h-3 w-3 sm:h-4 sm:w-4" />}
              color={colors.purple}
              subtext={product.subcategory || 'General'}
            />
          </div>

          {/* Main Product Detail */}
          <div className="mb-6 sm:mb-8 lg:mb-10">
            <ProductDetail
              productId={product._id}
              currentUser={user}
              theme={themeMode}
              onBack={() => router.push('/products')}
            />
          </div>

          {/* Company Information Card */}
          {company && (
            <div className="mb-6 sm:mb-8 lg:mb-10">
              <CompanyInfoCard
                company={company}
                product={product}
                onContact={handleContactCompany}
              />
            </div>
          )}

          {/* Related Products Section */}
          {(relatedProducts.length > 0 || loadingRelated) && (
            <div className="mb-6 sm:mb-8 lg:mb-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <TrendingUp className={cn("h-4 w-4 sm:h-5 sm:w-5", colorClasses.text.goldenMustard)} />
                  <h2 className={cn("text-base sm:text-lg md:text-xl font-bold", colorClasses.text.primary)}>
                    You Might Also Like
                  </h2>
                </div>
                {product.category && (
                  <Link
                    href={`/products?category=${encodeURIComponent(product.category)}`}
                    className={cn("text-xs sm:text-sm font-medium flex items-center gap-1 hover:underline transition-colors", colorClasses.text.blue)}
                  >
                    View all
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Link>
                )}
              </div>

              {loadingRelated ? (
                <div className={cn("grid gap-2 sm:gap-3", getRelatedGridCols())}>
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className={colorClasses.border.gray100}>
                      <CardContent className="p-2 sm:p-3">
                        <Skeleton className={cn("aspect-square rounded-lg mb-2", colorClasses.bg.secondary)} />
                        <Skeleton className={cn("h-3 w-3/4 mb-1", colorClasses.bg.secondary)} />
                        <Skeleton className={cn("h-2 w-1/2", colorClasses.bg.secondary)} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className={cn("grid gap-2 sm:gap-3", getRelatedGridCols())}>
                  {relatedProducts.map((relatedProduct) => (
                    <RelatedProductCard
                      key={relatedProduct._id}
                      product={relatedProduct}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Trust & Safety Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <TrustBadge
              icon={<Shield />}
              title="Verified Seller"
              description="All companies undergo strict verification"
            />
            <TrustBadge
              icon={<MessageSquare />}
              title="Secure Messaging"
              description="Communicate safely through our platform"
            />
            <TrustBadge
              icon={<Award />}
              title="Quality Guarantee"
              description="Satisfaction guaranteed or your money back"
            />
          </div>

          {/* Mobile Sticky Action Bar */}
          {breakpoint === 'mobile' && (
            <div className={cn(
              "fixed bottom-0 left-0 right-0 p-3 border-t shadow-lg z-40",
              colorClasses.bg.primary,
              colorClasses.border.gray100
            )}>
              <div className="flex gap-2 max-w-md mx-auto">
                <Button
                  variant="outline"
                  onClick={handleSaveToggle}
                  className={cn("flex-1 gap-2", getTouchTargetSize('lg'), colorClasses.border.gray100)}
                >
                  {isSaved ? (
                    <BookmarkCheck className={cn("h-4 w-4", colorClasses.text.goldenMustard)} />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
                <Button
                  onClick={handleContactCompany}
                  className={cn("flex-1 gap-2", getTouchTargetSize('lg'), colorClasses.bg.goldenMustard, colorClasses.text.white)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Contact
                </Button>
              </div>
            </div>
          )}

          {/* Bottom padding for mobile sticky bar */}
          {breakpoint === 'mobile' && <div className="pb-16" />}
        </div>
      </div>
    </DashboardLayout>
  );
}