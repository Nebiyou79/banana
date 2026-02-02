/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { Product, productService, productToast } from '@/services/productService';
import { profileService, CloudinaryImage } from '@/services/profileService';
import { colors, getTheme } from '@/utils/color';
import { Badge } from '@/components/social/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/social/ui/Button';
import {
  Star,
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
import { EntityAvatar } from '@/components/layout/EntityAvatar';

interface ProductDetailProps {
  productId: string;
  currentUser?: any;
  className?: string;
  theme?: 'light' | 'dark';
  loading?: boolean;
  onBack?: () => void;
}

// Helper to get optimized avatar URL
const getOptimizedAvatarUrl = (avatar: string | CloudinaryImage | undefined, company?: any): string => {
  if (!avatar && company?.logoUrl) {
    return profileService.getOptimizedAvatarUrl(company.logoUrl, 'medium');
  }

  if (typeof avatar === 'string') {
    return profileService.getOptimizedAvatarUrl(avatar, 'medium');
  }

  if (avatar && typeof avatar === 'object' && 'secure_url' in avatar) {
    return profileService.getOptimizedAvatarUrl(avatar, 'medium');
  }

  return profileService.getPlaceholderAvatar(company?.name || 'Company');
};

// Enhanced Gallery Component (Shared)
const ProductGallery: React.FC<{
  product: Product;
  currentIndex: number;
  onIndexChange: (i: number) => void;
  loading?: boolean;
  theme?: 'light' | 'dark';
}> = ({ product, currentIndex, onIndexChange, loading, theme = 'light' }) => {
  const currentTheme = getTheme(theme);
  const [isZoomed, setIsZoomed] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Product images
  const items = product.images || [];
  const current = items[currentIndex];

  // Get optimized Cloudinary image URL
  const getOptimizedImageUrl = (image: any, size: 'large' | 'thumbnail' | 'fullscreen' = 'large') => {
    if (!image?.secure_url && !image?.url) return '/images/product-placeholder.jpg';

    const imageUrl = image.secure_url || image.url;
    const options = {
      large: { width: 800, height: 600, crop: 'fill', quality: 'auto:best' },
      thumbnail: { width: 100, height: 75, crop: 'fill', quality: 'auto:good' },
      fullscreen: { width: 1200, height: 900, crop: 'fill', quality: 'auto:best' }
    }[size];

    return productService.getImageUrl(imageUrl, options);
  };

  // Handle vertical scroll
  const scrollToImage = (index: number) => {
    if (imageContainerRef.current) {
      const imageElement = imageContainerRef.current.children[index] as HTMLElement;
      if (imageElement) {
        imageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // Keyboard navigation for fullscreen
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

  const handleThumbnailClick = (index: number) => {
    onIndexChange(index);
    scrollToImage(index);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] animate-pulse"
              style={{ backgroundColor: currentTheme.bg.gray100 }} />
          </CardContent>
        </Card>
        <div className="flex gap-2 overflow-x-auto px-2 py-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-24 h-20 sm:w-32 sm:h-24 rounded-lg flex-shrink-0 animate-pulse"
              style={{ backgroundColor: currentTheme.bg.gray100 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image Container */}
        <Card className="overflow-hidden"
          style={{ borderColor: currentTheme.border.gray100 }}>
          <CardContent className="p-0">
            <div
              ref={imageContainerRef}
              className={cn(
                "relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-y-auto",
                "scrollbar-hide"
              )}
              style={{ backgroundColor: currentTheme.bg.gray100 }}
            >
              {/* Vertical Image Stack */}
              <div className="flex flex-col">
                {items.length > 0 ? (
                  items.map((image, index) => (
                    <div
                      key={image.public_id || index}
                      className={cn(
                        "flex-shrink-0 w-full h-full",
                        index === currentIndex ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
                      )}
                    >
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={currentIndex}
                          src={getOptimizedImageUrl(image, 'large')}
                          alt={image.altText || `${product.name} - Image ${index + 1}`}
                          className="w-full h-full object-contain"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          loading={index === 0 ? "eager" : "lazy"}
                        />
                      </AnimatePresence>
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-opacity-20 flex items-center justify-center mb-4"
                      style={{ backgroundColor: currentTheme.bg.gray400 }}>
                      <Package className={cn("h-10 w-10")} style={{ color: currentTheme.text.gray400 }} />
                    </div>
                    <p className={cn("font-medium")} style={{ color: currentTheme.text.gray400 }}>
                      No Image Available
                    </p>
                  </div>
                )}
              </div>

              {/* Fullscreen Toggle */}
              {items.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "absolute top-3 right-3",
                          "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow",
                          "hover:bg-white dark:hover:bg-gray-800 hover:scale-105 transition-transform"
                        )}
                        style={{ borderColor: currentTheme.border.gray100 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFullscreenOpen(true);
                        }}
                        aria-label="Open fullscreen"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Fullscreen
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Image Counter */}
              {items.length > 1 && (
                <div className={cn(
                  "absolute bottom-3 left-1/2 -translate-x-1/2",
                  "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-sm px-4 py-2 rounded-full shadow-lg"
                )}
                  style={{ color: currentTheme.text.gray800 }}>
                  {currentIndex + 1} / {items.length}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Thumbnail Strip */}
        {items.length > 1 && (
          <div
            className="flex gap-2 overflow-x-auto snap-x snap-mandatory px-2 py-3 -mx-2 scrollbar-hide"
            role="tablist"
            aria-label="Product thumbnails"
          >
            {items.map((item, index) => (
              <button
                key={item.public_id || index}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  'snap-start flex-shrink-0 w-20 h-16 sm:w-24 sm:h-20 rounded-lg overflow-hidden border-2 transition-all',
                  'hover:border-goldenMustard/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  index === currentIndex
                    ? 'border-goldenMustard ring-2 ring-goldenMustard/20 shadow-lg'
                    : 'hover:shadow'
                )}
                style={{
                  backgroundColor: currentTheme.bg.white,
                  borderColor: index === currentIndex ? colors.goldenMustard : currentTheme.border.gray100
                }}
                aria-current={index === currentIndex}
                title={`View image ${index + 1}`}
                role="tab"
              >
                <img
                  src={getOptimizedImageUrl(item, 'thumbnail')}
                  alt={item.altText || `${product.name} ${index + 1}`}
                  className="w-full h-full object-cover object-center"
                  draggable={false}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {fullscreenOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
            aria-label="Image viewer"
            onClick={() => setFullscreenOpen(false)}
          >
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFullscreenOpen(false)}
                className="bg-white/20 hover:bg-white/40 border border-white/30"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-white" />
              </Button>
            </div>

            <div className="relative w-full max-w-6xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              {/* Navigation Arrows */}
              {items.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 border border-white/30"
                    onClick={() => onIndexChange((currentIndex - 1 + items.length) % items.length)}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 border border-white/30"
                    onClick={() => onIndexChange((currentIndex + 1) % items.length)}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </Button>
                </>
              )}

              {/* Main Image */}
              <div className="w-full h-full flex items-center justify-center p-8">
                {current && (
                  <img
                    src={getOptimizedImageUrl(current, 'fullscreen')}
                    alt={current.altText || product.name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                )}
              </div>

              {/* Caption */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full">
                <span className="text-sm font-medium">
                  {current?.altText || `${currentIndex + 1} / ${items.length}`}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const ProductDetail: React.FC<ProductDetailProps> = ({
  productId,
  currentUser,
  className,
  theme = 'light',
  loading: externalLoading = false,
  onBack,
}) => {
  const router = useRouter();
  const currentTheme = getTheme(theme);

  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Check if user can manage this product
  const canManage = product && currentUser && productService.canManageProduct(product, currentUser);

  // Format helpers
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;

      setLoading(true);
      try {
        const productData = await productService.getProduct(productId);
        setProduct(productData);

        // Fetch related products if product exists
        if (productData) {
          fetchRelatedProducts(productData._id);
        }
      } catch (error) {
        productToast.error('Failed to load product');
        console.error('Product fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Fetch related products
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

  // Handlers
  const handleDelete = async () => {
    if (!product || !canManage) return;

    setIsDeleting(true);
    try {
      await productService.deleteProduct(product._id);
      productToast.success('Product deleted successfully');

      // Navigate back or to products list
      if (canManage) {
        router.push('/dashboard/company/products');
      } else {
        router.push('/dashboard/products');
      }
    } catch (error) {
      productToast.error('Failed to delete product');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      productToast.success('Link copied to clipboard!');
    } catch (error) {
      productToast.error('Failed to copy link');
    }
  };

  const handleDuplicate = () => {
    if (!product) return;
    // Navigate to create product with pre-filled data
    router.push({
      pathname: '/dashboard/company/products/create',
      query: { duplicateFrom: product._id }
    });
  };

  const handleStatusChange = async (status: Product['status']) => {
    if (!product) return;

    try {
      const updatedProduct = await productService.updateProductStatus(product._id, status);
      setProduct(updatedProduct);
      productToast.success(`Product status updated to ${status}`);
    } catch (error) {
      productToast.error('Failed to update status');
    }
  };

  // Get company info
  const company = product?.companyId && typeof product.companyId === 'object'
    ? product.companyId
    : null;

  // Get company avatar URL
  const companyAvatarUrl = getOptimizedAvatarUrl(company?.logoUrl, company);

  // Stock status and formatted price
  const stockStatus = product ? productService.getStockStatus(product.inventory) : null;
  const formattedPrice = product ? productService.formatPrice(product.price) : '';

  // Show loading state
  const isLoading = loading || externalLoading;

  if (isLoading) {
    return (
      <div className={cn("min-h-screen", className)} style={{ backgroundColor: currentTheme.bg.white }}>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="h-10 w-48 animate-pulse" style={{ backgroundColor: currentTheme.bg.gray100 }} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-[4/3] rounded-xl animate-pulse" style={{ backgroundColor: currentTheme.bg.gray100 }} />
            <div className="space-y-6">
              <div className="h-8 w-3/4 animate-pulse" style={{ backgroundColor: currentTheme.bg.gray100 }} />
              <div className="h-6 w-1/2 animate-pulse" style={{ backgroundColor: currentTheme.bg.gray100 }} />
              <div className="h-24 w-full animate-pulse" style={{ backgroundColor: currentTheme.bg.gray100 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", className)}
        style={{ backgroundColor: currentTheme.bg.white }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: currentTheme.text.primary }}>
            Product Not Found
          </h2>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", className)} style={{ backgroundColor: currentTheme.bg.white }}>
      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone and all product data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onBack || (() => router.back())}
              className="gap-2"
              style={{
                borderColor: currentTheme.border.gray100,
                color: currentTheme.text.gray800
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1" style={{ color: currentTheme.text.gray400 }}>
                <Eye className="h-4 w-4" /> {product.views} views
              </span>
              <Separator orientation="vertical" className="h-4" style={{ backgroundColor: currentTheme.bg.gray100 }} />
              <span className="flex items-center gap-1" style={{ color: currentTheme.text.gray400 }}>
                <Calendar className="h-4 w-4" />
                {formatDate(product.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Conditional Action Buttons */}
            {canManage ? (
              // OWNER VIEW ACTIONS
              <>
                <Button
                  onClick={() => router.push(`/dashboard/company/products/${product._id}/edit`)}
                  className="gap-2"
                  style={{
                    backgroundColor: colors.goldenMustard,
                    color: colors.white
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" style={{ borderColor: currentTheme.border.gray100 }}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleDuplicate} className="gap-2 cursor-pointer">
                      <Copy className="h-4 w-4" />
                      Duplicate Product
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs font-medium" style={{ color: currentTheme.text.gray400 }}>
                      Change Status
                    </div>
                    {product.status !== 'active' && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange('active')}
                        className="gap-2 cursor-pointer"
                      >
                        <CheckCircle className="h-4 w-4" style={{ color: currentTheme.text.success }} />
                        Set Active
                      </DropdownMenuItem>
                    )}
                    {product.status !== 'inactive' && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange('inactive')}
                        className="gap-2 cursor-pointer"
                      >
                        <Clock className="h-4 w-4" style={{ color: currentTheme.text.gray400 }} />
                        Set Inactive
                      </DropdownMenuItem>
                    )}
                    {product.status !== 'draft' && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange('draft')}
                        className="gap-2 cursor-pointer"
                      >
                        <AlertCircle className="h-4 w-4" style={{ color: currentTheme.text.warning }} />
                        Set Draft
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteModalOpen(true)}
                      className="gap-2 cursor-pointer"
                      style={{ color: currentTheme.text.error }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Product
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // PUBLIC VIEW ACTIONS
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsSaved(!isSaved)}
                        className={isSaved ? "border-red-500 text-red-500 hover:text-red-600" : ""}
                        style={{ borderColor: currentTheme.border.gray100 }}
                      >
                        {isSaved ? (
                          <Heart className="h-4 w-4 fill-red-500" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isSaved ? 'Remove from saved' : 'Save for later'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleShare}
                        style={{ borderColor: currentTheme.border.gray100 }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Share product
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gallery Section */}
          <div>
            <ProductGallery
              product={product}
              currentIndex={currentImageIndex}
              onIndexChange={setCurrentImageIndex}
              theme={theme}
            />
          </div>

          {/* Product Info Section */}
          <div className="space-y-6">
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              {product.featured && (
                <Badge variant="default" className="gap-1"
                  style={{
                    backgroundColor: colors.goldenMustard,
                    color: colors.white
                  }}>
                  <Star className="h-3 w-3 fill-current" />
                  Featured
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  product.status === 'active' && 'border-green-500',
                  product.status === 'inactive' && 'border-gray-500',
                  product.status === 'draft' && 'border-amber-500'
                )}
                style={{
                  color: product.status === 'active' ? currentTheme.text.success :
                    product.status === 'inactive' ? currentTheme.text.gray400 :
                      currentTheme.text.warning
                }}
              >
                {product.status}
              </Badge>
              {stockStatus && (
                <Badge
                  variant="outline"
                  className="gap-1"
                  style={{
                    borderColor: stockStatus.color,
                    color: stockStatus.color
                  }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: stockStatus.color }}
                  />
                  {stockStatus.text}
                </Badge>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: currentTheme.text.gray800 }}>
              {product.name}
            </h1>

            {/* Company Info */}
            {company && (
              <div className="flex items-center gap-3">
                <EntityAvatar
                  name={company.name}
                  avatar={companyAvatarUrl}
                  size="md"
                  themeMode={theme}
                />
                <div>
                  <div className="flex items-center gap-2">
                    {canManage ? (
                      <span className="font-medium" style={{ color: currentTheme.text.gray800 }}>
                        {company.name}
                      </span>
                    ) : (
                      <Link href={`/companies/${company._id}`} className="font-medium hover:underline"
                        style={{ color: currentTheme.text.blue }}>
                        {company.name}
                      </Link>
                    )}
                    {company.verified && (
                      <Badge variant="outline" size="sm"
                        style={{
                          borderColor: colors.blue,
                          color: currentTheme.text.blue
                        }}>
                        Verified
                      </Badge>
                    )}
                  </div>
                  {company.industry && (
                    <p className="text-sm" style={{ color: currentTheme.text.gray400 }}>
                      {company.industry}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold" style={{ color: currentTheme.text.gray800 }}>
                {formattedPrice}
                {product.price.unit && product.price.unit !== 'unit' && (
                  <span className="text-lg font-normal" style={{ color: currentTheme.text.gray400 }}>
                    / {product.price.unit}
                  </span>
                )}
              </div>
              {product.inventory.trackQuantity && (
                <p className="text-sm" style={{ color: currentTheme.text.gray400 }}>
                  {product.inventory.quantity} units available
                  {product.inventory.quantity <= product.inventory.lowStockAlert && (
                    <span className="font-medium ml-1" style={{ color: currentTheme.text.warning }}>
                      (Low stock)
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <Card style={{ borderColor: currentTheme.border.gray100 }}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2" style={{ color: currentTheme.text.gray800 }}>
                    Overview
                  </h3>
                  <p className="leading-relaxed" style={{ color: currentTheme.text.gray400 }}>
                    {product.shortDescription}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: currentTheme.text.gray800 }}>
                  <Tag className="h-4 w-4" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="font-normal transition-colors"
                      style={{
                        backgroundColor: currentTheme.bg.gray100,
                        color: currentTheme.text.gray400
                      }}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* SKU & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card style={{ borderColor: currentTheme.border.gray100 }}>
                <CardContent className="pt-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: currentTheme.text.gray400 }}>
                      <Package className="h-4 w-4" />
                      SKU
                    </div>
                    <p className="font-medium" style={{ color: currentTheme.text.gray800 }}>
                      {product.sku || 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card style={{ borderColor: currentTheme.border.gray100 }}>
                <CardContent className="pt-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: currentTheme.text.gray400 }}>
                      <Tag className="h-4 w-4" />
                      Category
                    </div>
                    <p className="font-medium" style={{ color: currentTheme.text.gray800 }}>
                      {product.category}
                      {product.subcategory && ` › ${product.subcategory}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Description & Specifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Description */}
          <Card style={{ borderColor: currentTheme.border.gray100 }}>
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: currentTheme.text.gray800 }}>
                Product Description
              </h3>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="whitespace-pre-line leading-relaxed" style={{ color: currentTheme.text.gray400 }}>
                  {product.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          {product.specifications?.length > 0 && (
            <Card style={{ borderColor: currentTheme.border.gray100 }}>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: currentTheme.text.gray800 }}>
                  Specifications
                </h3>
                <div className="space-y-3">
                  {product.specifications.map((spec, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b last:border-0"
                      style={{ borderColor: currentTheme.border.gray100 }}>
                      <span className="font-medium text-sm sm:text-base" style={{ color: currentTheme.text.gray800 }}>
                        {spec.key}
                      </span>
                      <span className="text-sm sm:text-base text-right" style={{ color: currentTheme.text.gray400 }}>
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6" style={{ color: currentTheme.text.gray800 }}>
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => {
                const relatedCompany = typeof relatedProduct.companyId === 'object' ? relatedProduct.companyId : null;
                const relatedCompanyAvatarUrl = getOptimizedAvatarUrl(relatedCompany?.logoUrl, relatedCompany);

                return (
                  <div key={relatedProduct._id} className="bg-white rounded-xl border p-4 hover:shadow-lg transition-shadow"
                    style={{ borderColor: currentTheme.border.gray100 }}>
                    <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                      {relatedProduct.images?.[0] && (
                        <img
                          src={productService.getImageUrl(relatedProduct.images[0].secure_url, {
                            width: 200,
                            height: 200,
                            crop: 'fill'
                          })}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <EntityAvatar
                        name={relatedCompany?.name || 'Company'}
                        avatar={relatedCompanyAvatarUrl}
                        size="xs"
                        themeMode={theme}
                      />
                      <span className="text-xs font-medium truncate" style={{ color: currentTheme.text.gray400 }}>
                        {relatedCompany?.name || 'Company'}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1 line-clamp-1" style={{ color: currentTheme.text.gray800 }}>
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold" style={{ color: colors.goldenMustard }}>
                        {productService.formatPrice(relatedProduct.price)}
                      </span>
                      <Link href={`/dashboard/products/${relatedProduct._id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper CSS for hiding scrollbars
const scrollbarHideCSS = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Add the CSS to document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = scrollbarHideCSS;
  document.head.appendChild(style);
}

export default ProductDetail;