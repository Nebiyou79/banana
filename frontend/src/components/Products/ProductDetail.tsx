/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { Product, productService, productToast } from '@/services/productService';
import { colors, getTheme, ThemeMode, colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { Badge } from '@/components/social/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/social/ui/Button';
import { CompanyAvatarDisplay } from './CompanyAvatarDisplay';
import {
  Eye,
  Calendar,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Maximize,
  X,
  Edit3,
  MoreVertical,
  Trash2,
  Copy,
  Tag,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Bookmark,
  Shield,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  ZoomIn,
  Star,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
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
import { Separator } from '@/components/ui/Separator';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/Tooltip';
import { Sheet, SheetContent } from '@/components/ui/Sheet';

// =====================
// PROPS
// =====================

interface ProductDetailProps {
  productId: string;
  currentUser?: any;
  className?: string;
  theme?: ThemeMode;
  loading?: boolean;
  onBack?: () => void;
}

// =====================
// PRODUCT GALLERY
// =====================

const ProductGallery: React.FC<{
  product: Product;
  currentIndex: number;
  onIndexChange: (i: number) => void;
  loading?: boolean;
  theme?: ThemeMode;
}> = ({ product, currentIndex, onIndexChange, loading }) => {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const { breakpoint } = useResponsive();

  const items = product.images || [];
  const current = items[currentIndex];

  const swipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchStart === null) return;
      const dx = e.changedTouches[0].clientX - touchStart;
      if (Math.abs(dx) > 50 && items.length > 1) {
        onIndexChange(dx < 0
          ? (currentIndex + 1) % items.length
          : (currentIndex - 1 + items.length) % items.length);
      }
      setTouchStart(null);
    },
  };

  const getOptimizedImageUrl = (image: any, size: 'large' | 'thumbnail' | 'fullscreen' = 'large') => {
    if (!image?.secure_url && !image?.url) return '/images/product-placeholder.jpg';
    const imageUrl = image.secure_url || image.url;
    const options = {
      large: { width: breakpoint === 'mobile' ? 400 : 800, height: breakpoint === 'mobile' ? 300 : 600, crop: 'fill', quality: 'auto:best' },
      thumbnail: { width: breakpoint === 'mobile' ? 100 : 150, height: breakpoint === 'mobile' ? 80 : 150, crop: 'fill', quality: 'auto:good' },
      fullscreen: { width: 1920, height: 1080, crop: 'fit', quality: 'auto:best' },
    }[size];
    return productService.getImageUrl(imageUrl, options);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fullscreenOpen) return;
      if (e.key === 'ArrowRight') onIndexChange((currentIndex + 1) % Math.max(items.length, 1));
      if (e.key === 'ArrowLeft') onIndexChange((currentIndex - 1 + items.length) % Math.max(items.length, 1));
      if (e.key === 'Escape') setFullscreenOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenOpen, currentIndex, items.length, onIndexChange]);

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className={cn('relative w-full aspect-[4/3] rounded-xl animate-pulse', colorClasses.bg.gray100, 'dark:bg-gray-800')} />
        <div className="flex gap-2 overflow-x-auto py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn('w-20 h-16 sm:w-24 sm:h-20 rounded-lg shrink-0 animate-pulse', colorClasses.bg.gray100, 'dark:bg-gray-800')} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 sm:space-y-4" {...swipeHandlers}>
        {/* Main image */}
        <div className={cn('relative w-full aspect-[4/3] rounded-xl overflow-hidden border shadow-sm', colorClasses.bg.gray100, colorClasses.border.gray200, 'dark:bg-gray-800 dark:border-gray-700')}>
          <AnimatePresence mode="wait">
            {items.length > 0 ? (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative w-full h-full cursor-zoom-in group"
                onClick={() => setFullscreenOpen(true)}
              >
                <img
                  src={getOptimizedImageUrl(current, 'large')}
                  alt={current?.altText || `${product.name} - Image ${currentIndex + 1}`}
                  className="w-full h-full object-contain"
                  loading={currentIndex === 0 ? 'eager' : 'lazy'}
                />
                <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/60 text-white rounded-full p-1.5">
                    <ZoomIn className="h-3.5 w-3.5" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className={cn('w-16 h-16 rounded-full flex items-center justify-center', colorClasses.bg.gray100, 'dark:bg-gray-700')}>
                  <Package className={cn('h-8 w-8', colorClasses.text.gray400)} />
                </div>
                <p className={cn('text-sm font-medium', colorClasses.text.gray400)}>No Image Available</p>
              </div>
            )}
          </AnimatePresence>

          {/* Fullscreen button */}
          {items.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2.5 right-2.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow hover:bg-white dark:hover:bg-gray-800 transition-all"
                    onClick={(e) => { e.stopPropagation(); setFullscreenOpen(true); }}
                  >
                    <Maximize className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View fullscreen</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Image counter */}
          {items.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
              {currentIndex + 1} / {items.length}
            </div>
          )}

          {/* Mobile swipe arrows */}
          {items.length > 1 && breakpoint === 'mobile' && (
            <>
              <div className="absolute top-1/2 left-2 -translate-y-1/2">
                <ChevronLeft className="h-5 w-5 text-white drop-shadow-lg" />
              </div>
              <div className="absolute top-1/2 right-2 -translate-y-1/2">
                <ChevronRight className="h-5 w-5 text-white drop-shadow-lg" />
              </div>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {items.length > 1 && (
          <div className="flex gap-2 overflow-x-auto snap-x py-1 -mx-1 px-1 scrollbar-hide">
            {items.map((item, index) => (
              <button
                key={item.public_id || index}
                onClick={() => onIndexChange(index)}
                className={cn(
                  'snap-start shrink-0 w-20 h-16 sm:w-24 sm:h-20 rounded-lg overflow-hidden border-2 transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-[#F1BB03] focus:ring-offset-1',
                  index === currentIndex
                    ? 'border-[#F1BB03] shadow-sm'
                    : cn(colorClasses.border.gray200, 'hover:border-[#F1BB03]/50 dark:border-gray-700'),
                )}
              >
                <img
                  src={getOptimizedImageUrl(item, 'thumbnail')}
                  alt={item.altText || `${product.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen lightbox */}
      <AnimatePresence>
        {fullscreenOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/96 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
            aria-modal="true"
            role="dialog"
            onClick={() => setFullscreenOpen(false)}
          >
            {/* Controls */}
            <div className="absolute top-3 right-3 z-10 flex gap-2">
              <Button
                variant="ghost" size="icon"
                onClick={(e) => { e.stopPropagation(); const url = current?.secure_url || current?.url; if (url) { const a = document.createElement('a'); a.href = url; a.download = `${product.name}-${currentIndex + 1}.jpg`; a.click(); } }}
                className="bg-white/15 hover:bg-white/30 border border-white/20 text-white"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                onClick={() => window.print()}
                className="bg-white/15 hover:bg-white/30 border border-white/20 text-white"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                onClick={() => setFullscreenOpen(false)}
                className="bg-white/15 hover:bg-white/30 border border-white/20 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative w-full max-w-7xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              {items.length > 1 && (
                <>
                  <Button
                    variant="ghost" size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/15 hover:bg-white/30 border border-white/20 text-white"
                    onClick={() => onIndexChange((currentIndex - 1 + items.length) % items.length)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/15 hover:bg-white/30 border border-white/20 text-white"
                    onClick={() => onIndexChange((currentIndex + 1) % items.length)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
              <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
                {current && (
                  <img
                    src={getOptimizedImageUrl(current, 'fullscreen')}
                    alt={current.altText || product.name}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  />
                )}
              </div>
              {/* Caption */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-xs sm:text-sm">
                {current?.altText || `${currentIndex + 1} / ${items.length}`}
              </div>
              {/* Thumbnails in fullscreen */}
              {items.length > 1 && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto p-2 bg-black/50 backdrop-blur-sm rounded-xl">
                  {items.map((item, index) => (
                    <button
                      key={item.public_id || index}
                      onClick={() => onIndexChange(index)}
                      className={cn('w-12 h-10 rounded overflow-hidden border-2 transition-all', index === currentIndex ? 'border-[#F1BB03]' : 'border-transparent hover:border-white/50')}
                    >
                      <img src={getOptimizedImageUrl(item, 'thumbnail')} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// =====================
// SHARE BOTTOM SHEET
// =====================

const ShareBottomSheet: React.FC<{
  product: Product;
  theme?: ThemeMode;
  onClose: () => void;
  open: boolean;
}> = ({ product, onClose, open }) => {
  const handleShare = async (method: 'copy' | 'native' | 'whatsapp' | 'email') => {
    const url = window.location.href;
    switch (method) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        productToast.success('Link copied to clipboard!');
        break;
      case 'native':
        if (navigator.share) await navigator.share({ title: product.name, text: product.shortDescription || product.description, url });
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${product.name} - ${url}`)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(`${product.description}\n\n${url}`)}`);
        break;
    }
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className={cn('p-4 sm:p-6 rounded-t-xl', colorClasses.bg.primary, 'dark:bg-gray-900')}>
        <div className="space-y-4">
          <h3 className={cn('text-lg font-semibold', colorClasses.text.primary, 'dark:text-white')}>Share Product</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { method: 'copy' as const, icon: <Copy className="h-5 w-5" />, label: 'Copy Link', bg: 'bg-gray-100 dark:bg-gray-800', iconColor: colorClasses.text.primary },
              ...(typeof window !== 'undefined' && typeof navigator.share === 'function'
                ? [{ method: 'native' as const, icon: <Share2 className="h-5 w-5" />, label: 'Share', bg: 'bg-gray-100 dark:bg-gray-800', iconColor: colorClasses.text.primary }]
                : []),
              { method: 'whatsapp' as const, icon: <span className="text-xl">📱</span>, label: 'WhatsApp', bg: 'bg-green-100 dark:bg-green-900/50', iconColor: '' },
              { method: 'email' as const, icon: <span className="text-xl">✉️</span>, label: 'Email', bg: 'bg-blue-100 dark:bg-blue-900/50', iconColor: '' },
            ].map(({ method, icon, label, bg, iconColor }) => (
              <button
                key={method}
                onClick={() => handleShare(method)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', bg, iconColor)}>{icon}</div>
                <span className={cn('text-xs', colorClasses.text.secondary, 'dark:text-gray-400')}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// =====================
// RELATED PRODUCTS
// =====================

const RelatedProductsSection: React.FC<{
  products: Product[];
  theme?: ThemeMode;
  loading?: boolean;
}> = ({ products, loading }) => {
  const router = useRouter();
  const { breakpoint } = useResponsive();
  const isCompanyView = router.pathname.includes('/dashboard/company/');

  const getGridCols = () => {
    if (breakpoint === 'mobile') return 'grid-cols-2';
    if (breakpoint === 'tablet') return 'grid-cols-3';
    return 'grid-cols-4';
  };

  if (loading) {
    return (
      <div className={cn('grid gap-3 sm:gap-4', getGridCols())}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn('rounded-xl border animate-pulse overflow-hidden', colorClasses.border.gray200, 'dark:border-gray-700')}>
            <div className={cn('aspect-square', colorClasses.bg.gray100, 'dark:bg-gray-800')} />
            <div className="p-3 space-y-2">
              <div className={cn('h-3.5 w-3/4 rounded', colorClasses.bg.gray100, 'dark:bg-gray-800')} />
              <div className={cn('h-3 w-1/2 rounded', colorClasses.bg.gray100, 'dark:bg-gray-800')} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className={cn('grid gap-3 sm:gap-4', getGridCols())}>
      {products.map((product) => {
        const relatedCompany = typeof product.companyId === 'object' ? product.companyId : null;
        const relatedCompanyName = relatedCompany?.name || product.ownerName || 'Company';
        const relatedAvatarUrl = product.ownerAvatarUrl || relatedCompany?.logoUrl;
        const relatedAvatarPublicId = (relatedCompany as any)?.avatarPublicId;

        return (
          <Link
            key={product._id}
            href={isCompanyView
              ? `/dashboard/company/products/${product._id}`
              : `/products/${product._id}`}
            className="group"
          >
            <Card className={cn('h-full hover:shadow-lg transition-all duration-300 overflow-hidden border', colorClasses.border.gray200, 'dark:border-gray-700 dark:bg-gray-900 hover:-translate-y-0.5')}>
              <CardContent className="p-0">
                <div className="aspect-square overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={productService.getImageUrl(product.images[0].secure_url, {
                        width: breakpoint === 'mobile' ? 200 : 280,
                        height: breakpoint === 'mobile' ? 200 : 280,
                        crop: 'fill',
                      })}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className={cn('w-full h-full flex items-center justify-center', colorClasses.bg.gray100, 'dark:bg-gray-800')}>
                      <Package className={cn('h-8 w-8', colorClasses.text.gray400)} />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <CompanyAvatarDisplay
                      companyName={relatedCompanyName}
                      avatarUrl={relatedAvatarUrl}
                      avatarPublicId={relatedAvatarPublicId}
                      verified={(relatedCompany as any)?.verified}
                      size="sm"
                      className="w-5 h-5"
                    />
                    <span className={cn('text-[10px] truncate', colorClasses.text.secondary, 'dark:text-gray-400')}>
                      {relatedCompanyName}
                    </span>
                  </div>
                  <h3 className={cn('font-semibold text-xs sm:text-sm line-clamp-2', colorClasses.text.primary, 'dark:text-white')}>
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className={cn('font-bold text-xs sm:text-sm', colorClasses.text.goldenMustard)}>
                      {product.formattedPrice || productService.formatPrice(product.price)}
                    </span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', colorClasses.border.goldenMustard, colorClasses.text.goldenMustard)}>
                      View
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

// =====================
// MAIN PRODUCT DETAIL
// =====================

export const ProductDetail: React.FC<ProductDetailProps> = ({
  productId,
  currentUser,
  className,
  theme = 'light',
  loading: externalLoading = false,
  onBack,
}) => {
  const router = useRouter();
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const currentTheme = getTheme(theme);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [specsExpanded, setSpecsExpanded] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);

  const canManage = product && currentUser && productService.canManageProduct(product, currentUser);
  const isCompanyView = router.pathname.includes('/dashboard/company/');

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const productData = await productService.getProduct(productId);
        setProduct(productData);
        if (productData) fetchRelatedProducts(productData._id);
      } catch (error) {
        productToast.error('Failed to load product');
        console.error('Product fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const fetchRelatedProducts = async (id: string) => {
    setLoadingRelated(true);
    try {
      const related = await productService.getRelatedProducts(id, 4);
      setRelatedProducts(related);
    } catch (error) {
      console.error('Failed to fetch related products:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !canManage) return;
    setIsDeleting(true);
    try {
      await productService.deleteProduct(product._id);
      productToast.success('Product deleted successfully');
      router.push(isCompanyView ? '/dashboard/company/products' : '/products');
    } catch (error) {
      productToast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleShare = async () => {
    if (breakpoint === 'mobile' && navigator.share) {
      try {
        await navigator.share({ title: product?.name, text: product?.shortDescription || product?.description, url: window.location.href });
      } catch { /* user cancelled */ }
    } else {
      setShareSheetOpen(true);
    }
  };

  const handleDuplicate = () => {
    if (!product) return;
    router.push({ pathname: '/dashboard/company/products/create', query: { duplicateFrom: product._id } });
  };

  const handleStatusChange = async (status: Product['status']) => {
    if (!product) return;
    try {
      const updatedProduct = await productService.updateProductStatus(product._id, status);
      setProduct(updatedProduct);
      productToast.success(`Product status updated to ${status}`);
    } catch {
      productToast.error('Failed to update status');
    }
  };

  // Company info derived from product
  const company = product?.companyId && typeof product.companyId === 'object' ? product.companyId : null;
  const companyName = company?.name || product?.ownerName || 'Unknown Company';
  const isCompanyVerified = company?.verified || false;

  // Avatar resolution via profileService (via CompanyAvatarDisplay)
  const companyAvatarUrl = product?.ownerAvatarUrl || (company as any)?.logoUrl;
  const companyAvatarPublicId = (company as any)?.avatarPublicId || (company as any)?.avatar?.public_id;

  const stockStatus = product ? (product.stockStatus || productService.getStockStatus(product.inventory)) : null;
  const formattedPrice = product ? (product.formattedPrice || productService.formatPrice(product.price)) : '';
  const isLoading = loading || externalLoading;

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className={cn('min-h-screen', className)} style={{ backgroundColor: currentTheme.bg.primary }}>
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="mb-6 flex items-center gap-4">
            <Skeleton className={cn('h-9 w-9 rounded-full', 'dark:bg-gray-800')} />
            <Skeleton className={cn('h-6 w-48', 'dark:bg-gray-800')} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <Skeleton className={cn('aspect-[4/3] rounded-xl', 'dark:bg-gray-800')} />
            <div className="space-y-4">
              <Skeleton className={cn('h-8 w-3/4', 'dark:bg-gray-800')} />
              <Skeleton className={cn('h-6 w-1/2', 'dark:bg-gray-800')} />
              <Skeleton className={cn('h-24 w-full', 'dark:bg-gray-800')} />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className={cn('h-20 w-full', 'dark:bg-gray-800')} />
                <Skeleton className={cn('h-20 w-full', 'dark:bg-gray-800')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── NOT FOUND ──
  if (!product) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', className)} style={{ backgroundColor: currentTheme.bg.primary }}>
        <div className="text-center px-4">
          <div className={cn('w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center', colorClasses.bg.gray100, 'dark:bg-gray-800')}>
            <Package className={cn('h-10 w-10', colorClasses.text.gray400)} />
          </div>
          <h2 className={cn('text-2xl font-bold mb-3', colorClasses.text.primary, 'dark:text-white')}>Product Not Found</h2>
          <p className={cn('text-sm sm:text-base mb-6 max-w-sm mx-auto', colorClasses.text.secondary, 'dark:text-gray-400')}>
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={onBack || (() => router.back())} variant="outline" className="gap-2 dark:border-gray-600 dark:text-gray-300">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  // ── MAIN RENDER ──
  return (
    <div className={cn('min-h-screen', className, 'dark:bg-gray-950')} style={{ backgroundColor: currentTheme.bg.primary }}>

      {/* Delete dialog */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="w-[90vw] max-w-md p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl dark:text-white">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base dark:text-gray-400">
              Are you sure you want to delete &quot;{product.name}&quot;? This action cannot be undone and all product data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={isDeleting} className={cn('w-full sm:w-auto', getTouchTargetSize('md'), 'dark:border-gray-600 dark:text-gray-300')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn('w-full sm:w-auto bg-red-600 hover:bg-red-700', getTouchTargetSize('md'))}
            >
              {isDeleting ? 'Deleting...' : 'Delete Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share sheet */}
      <ShareBottomSheet product={product} theme={theme} open={shareSheetOpen} onClose={() => setShareSheetOpen(false)} />

      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">

        {/* ── TOP BAR ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onBack || (() => router.back())}
              className={cn('gap-1.5 text-xs sm:text-sm', getTouchTargetSize('md'), colorClasses.border.gray200, 'dark:border-gray-700 dark:text-gray-300')}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back to Products</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <span className="flex items-center gap-1" style={{ color: currentTheme.text.gray400 }}>
                <Eye className="h-3.5 w-3.5" /> {product.views.toLocaleString()}
              </span>
              <Separator orientation="vertical" className={cn('h-3.5', colorClasses.bg.gray100, 'dark:bg-gray-700')} />
              <span className="flex items-center gap-1" style={{ color: currentTheme.text.gray400 }}>
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">{formatDate(product.createdAt)}</span>
                <span className="xs:hidden">{new Date(product.createdAt).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {canManage ? (
              <>
                <Button
                  onClick={() => router.push(`/dashboard/company/products/${product._id}/edit`)}
                  className={cn('gap-1.5 text-xs sm:text-sm flex-1 sm:flex-none', getTouchTargetSize('md'), colorClasses.bg.goldenMustard, colorClasses.text.white)}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className={cn(getTouchTargetSize('md'), colorClasses.border.gray200, 'dark:border-gray-700 dark:text-gray-300')}>
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 sm:w-56 dark:bg-gray-900 dark:border-gray-700">
                    <DropdownMenuItem onClick={handleDuplicate} className="gap-2 cursor-pointer text-xs sm:text-sm dark:text-gray-300 dark:hover:bg-gray-800">
                      <Copy className="h-3.5 w-3.5" /> Duplicate Product
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="dark:bg-gray-700" />
                    <div className="px-2 py-1.5 text-xs font-medium text-gray-400">Change Status</div>
                    {product.status !== 'active' && (
                      <DropdownMenuItem onClick={() => handleStatusChange('active')} className="gap-2 cursor-pointer text-xs sm:text-sm dark:text-gray-300 dark:hover:bg-gray-800">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Set Active
                      </DropdownMenuItem>
                    )}
                    {product.status !== 'inactive' && (
                      <DropdownMenuItem onClick={() => handleStatusChange('inactive')} className="gap-2 cursor-pointer text-xs sm:text-sm dark:text-gray-300 dark:hover:bg-gray-800">
                        <Clock className="h-3.5 w-3.5 text-gray-400" /> Set Inactive
                      </DropdownMenuItem>
                    )}
                    {product.status !== 'draft' && (
                      <DropdownMenuItem onClick={() => handleStatusChange('draft')} className="gap-2 cursor-pointer text-xs sm:text-sm dark:text-gray-300 dark:hover:bg-gray-800">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Set Draft
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="dark:bg-gray-700" />
                    <DropdownMenuItem onClick={() => setDeleteModalOpen(true)} className="gap-2 cursor-pointer text-xs sm:text-sm text-red-600 focus:text-red-600 dark:hover:bg-gray-800">
                      <Trash2 className="h-3.5 w-3.5" /> Delete Product
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline" size="icon"
                        onClick={() => setIsSaved(!isSaved)}
                        className={cn(getTouchTargetSize('md'), colorClasses.border.gray200, 'dark:border-gray-700', isSaved ? 'border-red-400 dark:border-red-500' : '')}
                      >
                        {isSaved ? <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" /> : <Bookmark className="h-3.5 w-3.5 dark:text-gray-300" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isSaved ? 'Remove from saved' : 'Save for later'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline" size="icon"
                        onClick={handleShare}
                        className={cn(getTouchTargetSize('md'), colorClasses.border.gray200, 'dark:border-gray-700 dark:text-gray-300')}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Share product</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </div>

        {/* ── MAIN TWO-COLUMN ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">

          {/* Gallery */}
          <div>
            <ProductGallery
              product={product}
              currentIndex={currentImageIndex}
              onIndexChange={setCurrentImageIndex}
              loading={isLoading}
            />
          </div>

          {/* Product info */}
          <div className="space-y-5 sm:space-y-6">

            {/* ── COMPANY INFO CARD ── */}
            <div className={cn(
              'group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-200',
              'hover:shadow-md dark:hover:shadow-[0_4px_20px_rgba(241,187,3,0.08)]',
              colorClasses.border.gray200,
              'bg-white dark:bg-gray-800/50',
              'dark:border-gray-700/60',
            )}>
              {/* Avatar — CompanyAvatarDisplay handles Cloudinary, plain URLs, and initials fallback */}
              <CompanyAvatarDisplay
                companyName={companyName}
                avatarUrl={companyAvatarUrl}
                avatarPublicId={companyAvatarPublicId}
                verified={isCompanyVerified}
                size={breakpoint === 'mobile' ? 'md' : 'lg'}
              />

              {/* Company text info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className={cn(
                    'font-bold leading-tight truncate',
                    'text-sm sm:text-base md:text-lg',
                    colorClasses.text.primary,
                    'dark:text-white',
                  )}>
                    {companyName}
                  </h2>
                  {isCompanyVerified && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-blue-300 text-blue-600 dark:border-blue-500/40 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 shrink-0 font-medium">
                      <Shield className="h-2.5 w-2.5" />
                      Verified
                    </span>
                  )}
                </div>

                {(company as any)?.industry && (
                  <p className={cn(
                    'text-xs sm:text-sm mt-0.5 truncate',
                    colorClasses.text.secondary,
                    'dark:text-gray-400',
                  )}>
                    {(company as any).industry}
                  </p>
                )}

                {(company as any)?.website && (
                  <a
                    href={(company as any).website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#F1BB03] hover:text-[#D99E00] hover:underline mt-1 transition-colors max-w-full"
                  >
                    <Globe className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {(company as any).website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </span>
                    <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                  </a>
                )}
              </div>

              {/* View company chevron hint on desktop */}
              {breakpoint !== 'mobile' && (
                <ChevronRight className={cn(
                  'h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                  colorClasses.text.gray400,
                  'dark:text-gray-600',
                )} />
              )}
            </div>

            {/* ── STATUS BADGES ── */}
            <div className="flex flex-wrap gap-2">
              {product.featured && (
                <Badge className={cn('gap-1 text-xs', colorClasses.bg.goldenMustard, colorClasses.text.white)}>
                  <Star className="h-2.5 w-2.5 fill-current" /> Featured
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn('text-xs',
                  product.status === 'active' ? 'border-emerald-400 text-emerald-600 dark:text-emerald-400' :
                    product.status === 'inactive' ? 'border-gray-400 text-gray-500 dark:text-gray-400' :
                      'border-amber-400 text-amber-600 dark:text-amber-400',
                )}
              >
                {product.status}
              </Badge>
              {stockStatus && (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs"
                  style={{ borderColor: stockStatus.color, color: stockStatus.color }}
                >
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stockStatus.color }} />
                  {stockStatus.text}
                </Badge>
              )}
            </div>

            {/* ── TITLE ── */}
            <h1 className={cn('text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight', colorClasses.text.primary, 'dark:text-white')}>
              {product.name}
            </h1>

            {/* ── PRICE ── */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <DollarSign className={cn('h-5 w-5 sm:h-6 sm:w-6', colorClasses.text.goldenMustard)} />
                <span className={cn('text-3xl sm:text-4xl font-bold', colorClasses.text.goldenMustard)}>
                  {formattedPrice}
                </span>
                {product.price.unit && product.price.unit !== 'unit' && (
                  <span className={cn('text-sm sm:text-base font-normal', colorClasses.text.gray400, 'dark:text-gray-500')}>
                    / {product.price.unit}
                  </span>
                )}
              </div>
              {product.inventory.trackQuantity && (
                <p className={cn('text-xs sm:text-sm', colorClasses.text.gray400, 'dark:text-gray-500')}>
                  {product.inventory.quantity.toLocaleString()} units available
                  {product.inventory.quantity <= product.inventory.lowStockAlert && (
                    <span className={cn('font-medium ml-1', colorClasses.text.warning)}>(Low stock)</span>
                  )}
                </p>
              )}
            </div>

            {/* ── OVERVIEW ── */}
            {product.shortDescription && (
              <Card className={cn('border', colorClasses.border.gray200, 'dark:bg-gray-800/50 dark:border-gray-700')}>
                <CardContent className="p-4">
                  <h3 className={cn('font-semibold text-sm sm:text-base mb-2', colorClasses.text.primary, 'dark:text-white')}>Overview</h3>
                  <p className={cn('text-sm leading-relaxed', colorClasses.text.secondary, 'dark:text-gray-400')}>
                    {product.shortDescription}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ── TAGS ── */}
            {product.tags.length > 0 && (
              <div className="space-y-2">
                <div className={cn('flex items-center gap-1.5 text-xs font-medium', colorClasses.text.primary, 'dark:text-gray-300')}>
                  <Tag className="h-3.5 w-3.5" /> Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={cn('font-normal text-[11px] px-2 py-0.5', colorClasses.bg.secondary, colorClasses.text.secondary, 'dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700')}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* ── SKU & CATEGORY CARDS ── */}
            <div className="grid grid-cols-2 gap-3">
              <Card className={cn('border', colorClasses.border.gray200, 'dark:bg-gray-800/50 dark:border-gray-700')}>
                <CardContent className="p-3 sm:p-4">
                  <div className={cn('flex items-center gap-1.5 text-[11px] font-medium mb-1.5', colorClasses.text.gray400, 'dark:text-gray-500')}>
                    <Package className="h-3 w-3" /> SKU
                  </div>
                  <p className={cn('text-sm font-semibold font-mono', colorClasses.text.primary, 'dark:text-white')}>
                    {product.sku || 'N/A'}
                  </p>
                </CardContent>
              </Card>
              <Card className={cn('border', colorClasses.border.gray200, 'dark:bg-gray-800/50 dark:border-gray-700')}>
                <CardContent className="p-3 sm:p-4">
                  <div className={cn('flex items-center gap-1.5 text-[11px] font-medium mb-1.5', colorClasses.text.gray400, 'dark:text-gray-500')}>
                    <Tag className="h-3 w-3" /> Category
                  </div>
                  <p className={cn('text-sm font-semibold', colorClasses.text.primary, 'dark:text-white')}>
                    {product.category}
                    {product.subcategory && <span className="text-gray-400 dark:text-gray-500"> › {product.subcategory}</span>}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* ── DESCRIPTION & SPECS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-8">

          {/* Description */}
          <Card className={cn('border', colorClasses.border.gray200, 'dark:bg-gray-900 dark:border-gray-700')}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn('text-lg sm:text-xl font-bold', colorClasses.text.primary, 'dark:text-white')}>
                  Product Description
                </h3>
                {breakpoint === 'mobile' && (
                  <Button variant="ghost" size="sm" onClick={() => setDescriptionExpanded(!descriptionExpanded)} className={getTouchTargetSize('md')}>
                    {descriptionExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              <div className={cn(
                'prose prose-sm dark:prose-invert max-w-none',
                breakpoint === 'mobile' && !descriptionExpanded && 'max-h-32 overflow-hidden relative',
              )}>
                <p className={cn('whitespace-pre-line leading-relaxed text-sm sm:text-base', colorClasses.text.secondary, 'dark:text-gray-400')}>
                  {product.description}
                </p>
                {breakpoint === 'mobile' && !descriptionExpanded && product.description.length > 300 && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-900 to-transparent" />
                )}
              </div>
              {breakpoint === 'mobile' && !descriptionExpanded && product.description.length > 300 && (
                <Button variant="link" onClick={() => setDescriptionExpanded(true)} className={cn('mt-2 p-0 h-auto', colorClasses.text.goldenMustard)}>
                  Read More
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Specifications */}
          {product.specifications?.length > 0 && (
            <Card className={cn('border', colorClasses.border.gray200, 'dark:bg-gray-900 dark:border-gray-700')}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={cn('text-lg sm:text-xl font-bold', colorClasses.text.primary, 'dark:text-white')}>
                    Specifications
                  </h3>
                  {breakpoint === 'mobile' && (
                    <Button variant="ghost" size="sm" onClick={() => setSpecsExpanded(!specsExpanded)} className={getTouchTargetSize('md')}>
                      {specsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
                <div className={cn('space-y-0', breakpoint === 'mobile' && !specsExpanded && 'max-h-36 overflow-hidden')}>
                  {product.specifications.map((spec, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center justify-between py-2.5 border-b last:border-0',
                        colorClasses.border.gray200,
                        'dark:border-gray-700/60',
                        index % 2 === 0 ? 'dark:bg-transparent' : 'dark:bg-gray-800/20',
                      )}
                    >
                      <span className={cn('font-medium text-xs sm:text-sm', colorClasses.text.primary, 'dark:text-gray-300')}>{spec.key}</span>
                      <span className={cn('text-xs sm:text-sm text-right', colorClasses.text.secondary, 'dark:text-gray-400')}>{spec.value}</span>
                    </div>
                  ))}
                </div>
                {breakpoint === 'mobile' && !specsExpanded && product.specifications.length > 3 && (
                  <Button variant="link" onClick={() => setSpecsExpanded(true)} className={cn('mt-2 p-0 h-auto', colorClasses.text.goldenMustard)}>
                    View All Specifications
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── RELATED PRODUCTS ── */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 sm:mt-12">
            <h2 className={cn('text-xl sm:text-2xl font-bold mb-5 sm:mb-6', colorClasses.text.primary, 'dark:text-white')}>
              Related Products
            </h2>
            <RelatedProductsSection products={relatedProducts} loading={loadingRelated} />
          </div>
        )}

        {/* Mobile sticky bottom bar for public visitors */}
        {breakpoint === 'mobile' && !canManage && (
          <div className={cn(
            'fixed bottom-0 left-0 right-0 p-3 border-t shadow-2xl z-40 backdrop-blur-md',
            colorClasses.bg.primary,
            'dark:bg-gray-900/95 dark:border-gray-800',
            colorClasses.border.gray200,
          )}>
            <div className="flex gap-2 max-w-lg mx-auto">
              <Button
                variant="outline"
                onClick={() => setIsSaved(!isSaved)}
                className={cn('flex-1 gap-2', getTouchTargetSize('lg'), colorClasses.border.gray200, 'dark:border-gray-700 dark:text-gray-300')}
              >
                {isSaved ? <Heart className="h-4 w-4 fill-red-500" /> : <Bookmark className="h-4 w-4" />}
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className={cn('flex-1 gap-2', getTouchTargetSize('lg'), colorClasses.border.gray200, 'dark:border-gray-700 dark:text-gray-300')}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        )}

        {/* Bottom padding for mobile sticky bar */}
        {breakpoint === 'mobile' && !canManage && <div className="pb-24" />}
      </div>
    </div>
  );
};

export default ProductDetail;