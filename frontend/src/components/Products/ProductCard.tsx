/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Product, productService } from "@/services/productService";
import { ThemeMode, colorClasses } from "@/utils/color";
import { useResponsive } from "@/hooks/useResponsive";
import { Badge } from "@/components/social/ui/Badge";
import { Button } from "@/components/social/ui/Button";
import {
  Star,
  Eye,
  ChevronRight,
  Package,
  TrendingUp,
  Edit,
  Trash2,
  Share2,
  MoreVertical,
  Bookmark,
  Tag,
  DollarSign,
  Shield,
  Sparkles,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CompanyAvatarDisplay } from "./CompanyAvatarDisplay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/social/ui/Dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/social/ui/Alert-Dialog";

// =====================
// TYPES
// =====================

export type ProductCardVariant = 'owner' | 'public';

interface ProductCardProps {
  product: Product;
  variant?: ProductCardVariant;
  theme?: ThemeMode;
  className?: string;
  currentUser?: any;
  context?: 'company' | 'marketplace' | 'public';
  // Owner-specific props
  onProductDeleted?: () => void;
  // Public-specific props
  isSaved?: boolean;
  onToggleSave?: () => void;
}

// =====================
// SHARED HOOK
// =====================

const useProductCardData = (product: Product) => {
  const imageData = useMemo(() => {
    if (!product.images || product.images.length === 0) {
      return {
        primaryImage: null,
        thumbnail: product.thumbnail?.secure_url || '/images/product-placeholder.jpg',
        hasMultipleImages: false,
        images: []
      };
    }

    const sortedImages = [...product.images].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return (a.order || 0) - (b.order || 0);
    });

    const primaryImage = sortedImages.find(img => img.isPrimary) || sortedImages[0];

    return {
      primaryImage,
      thumbnail: primaryImage?.secure_url || product.thumbnail?.secure_url || '/images/product-placeholder.jpg',
      hasMultipleImages: sortedImages.length > 1,
      images: sortedImages
    };
  }, [product.images, product.thumbnail]);

  const companyInfo = useMemo(() => {
    const company = typeof product.companyId === 'object' ? product.companyId : null;
    return {
      name: company?.name || product.ownerName || 'Unknown Company',
      verified: company?.verified || false,
      // Raw URL — CompanyAvatarDisplay will detect Cloudinary vs plain HTTPS
      avatar: (product.ownerAvatarUrl && !product.ownerAvatarUrl.includes('ui-avatars.com'))
        ? product.ownerAvatarUrl
        : (company as any)?.logoUrl || undefined,
      // Cloudinary public_id takes priority over URL when present
      avatarPublicId: (company as any)?.avatarPublicId
        || (company as any)?.avatar?.public_id
        || undefined,
    };
  }, [product.companyId, product.ownerName, product.ownerAvatarUrl]);

  const isNew = useMemo(() => {
    if (!product.createdAt) return false;
    const created = new Date(product.createdAt);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }, [product.createdAt]);

  const price = useMemo(() =>
    product.formattedPrice || productService.formatPrice(product.price),
    [product.formattedPrice, product.price]);

  const stockStatus = useMemo(() =>
    product.stockStatus || productService.getStockStatus(product.inventory),
    [product.stockStatus, product.inventory]);

  const getOptimizedImage = useCallback((imageUrl: string) => {
    return productService.getImageUrl(imageUrl, {
      width: 320,
      height: 240,
      crop: 'fill',
      quality: 'auto:best',
      format: 'auto'
    });
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  return {
    imageData,
    companyInfo,
    isNew,
    price,
    stockStatus,
    getOptimizedImage,
    formatDate,
    isActive: product.status === 'active',
    isFeatured: product.featured,
    isDraft: product.status === 'draft',
    isInactive: product.status === 'inactive'
  };
};

// CompanyAvatar replaced by shared CompanyAvatarDisplay from ./CompanyAvatarDisplay

// =====================
// SKELETON LOADER
// =====================

export const ProductCardSkeleton: React.FC<{ theme?: ThemeMode }> = ({ theme = 'light' }) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl min-h-[280px] sm:min-h-[320px] animate-pulse border",
        colorClasses.bg.primary,
        colorClasses.border.gray100
      )}
    >
      <div className={cn("aspect-[4/3]", colorClasses.bg.gray100)} />
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-full", colorClasses.bg.gray100)} />
          <div className="flex-1">
            <div className={cn("h-3 w-24 rounded", colorClasses.bg.gray100)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className={cn("h-4 w-3/4 rounded", colorClasses.bg.gray100)} />
          <div className={cn("h-3 w-1/2 rounded", colorClasses.bg.gray100)} />
        </div>
        <div className={cn("h-5 w-20 rounded", colorClasses.bg.gray100)} />
      </div>
    </div>
  );
};

// =====================
// MAIN PRODUCT CARD COMPONENT
// =====================

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'public',
  theme = 'light',
  className,
  currentUser,
  context = 'marketplace',
  onProductDeleted,
  isSaved = false,
  onToggleSave,
}) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const { toast } = useToast();

  const [isHovered, setIsHovered] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    imageData,
    companyInfo,
    isNew,
    price,
    stockStatus,
    getOptimizedImage,
    formatDate,
    isActive,
    isFeatured,
    isDraft,
    isInactive
  } = useProductCardData(product);

  const canManage = useMemo(() => {
    return variant === 'owner' && productService.canManageProduct(product, currentUser);
  }, [variant, product, currentUser]);

  const getDetailUrl = useCallback(() => {
    switch (context) {
      case 'company':
        return `/dashboard/company/products/${product._id}`;
      case 'marketplace':
        return `/products/${product._id}`;
      case 'public':
        return `/products/${product._id}`;
      default:
        return variant === 'owner'
          ? `/dashboard/company/products/${product._id}`
          : `/products/${product._id}`;
    }
  }, [context, variant, product._id]);

  const handleCardClick = useCallback(() => {
    if ((variant === 'owner' && canManage) || (variant === 'public' && isActive)) {
      window.location.href = getDetailUrl();
    }
  }, [variant, canManage, isActive, getDetailUrl]);

  const handleDeleteProduct = async () => {
    if (!canManage) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete this product.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await productService.deleteProduct(product._id);
      toast({
        title: "Success",
        description: "Product deleted successfully.",
        variant: "default",
      });
      onProductDeleted?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave?.();
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${getDetailUrl()}`;

    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.shortDescription || product.description,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard.",
        variant: "default",
      });
    }
  };

  const stockStatusClasses = stockStatus?.color || stockStatus?.className || colorClasses.text.gray400;

  const renderBadges = () => (
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 max-w-[70%]">
      {isFeatured && (
        <Badge
          className={cn(
            "flex items-center gap-1 text-[10px] sm:text-xs px-1.5 py-0.5",
            colorClasses.bg.darkNavy,
            colorClasses.text.white
          )}
        >
          <Star className="h-2 w-2 sm:h-3 sm:w-3 fill-current" />
          Featured
        </Badge>
      )}

      {variant === 'owner' && isDraft && (
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] sm:text-xs px-1.5 py-0.5",
            colorClasses.border.goldenMustard,
            colorClasses.text.goldenMustard
          )}
        >
          Draft
        </Badge>
      )}

      {variant === 'owner' && isInactive && (
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] sm:text-xs px-1.5 py-0.5",
            colorClasses.border.gray400,
            colorClasses.text.secondary
          )}
        >
          Inactive
        </Badge>
      )}
    </div>
  );

  const renderActions = () => {
    if (variant === 'public') {
      return (
        <>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "rounded-full bg-white/80 backdrop-blur-sm",
              getTouchTargetSize('md'),
              "hover:bg-white"
            )}
            onClick={handleSaveClick}
            aria-label={isSaved ? "Remove from saved" : "Save for later"}
          >
            <Bookmark className={cn(
              "h-3 w-3 sm:h-4 sm:w-4",
              isSaved && "fill-current text-yellow-500"
            )} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "rounded-full bg-white/80 backdrop-blur-sm",
              getTouchTargetSize('md'),
              "hover:bg-white"
            )}
            onClick={handleShareClick}
            aria-label="Share product"
          >
            <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </>
      );
    }

    if (variant === 'owner' && canManage) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "rounded-full bg-white/80 backdrop-blur-sm",
                getTouchTargetSize('md'),
                "hover:bg-white"
              )}
              onClick={(e) => e.stopPropagation()}
              aria-label="Product actions"
            >
              <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 sm:w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/dashboard/company/products/${product._id}/edit`;
              }}
              className={cn("cursor-pointer text-xs sm:text-sm", colorClasses.text.primary)}
            >
              <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Edit Product
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 text-xs sm:text-sm"
            >
              <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Delete Product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return null;
  };

  return (
    <>
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl border transition-all duration-300",
          "hover:shadow-xl hover:-translate-y-1",
          "dark:hover:shadow-[0_4px_24px_rgba(241,187,3,0.12)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          variant === 'public' && !isActive && "opacity-60 cursor-not-allowed",
          colorClasses.bg.primary,
          colorClasses.border.gray100,
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
        role="article"
        aria-label={`Product: ${product.name}`}
        tabIndex={(variant === 'public' && isActive) || (variant === 'owner' && canManage) ? 0 : -1}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') &&
            ((variant === 'public' && isActive) || (variant === 'owner' && canManage))) {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        {/* Image Container - using aspect ratio */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* Image Skeleton */}
          {isLoadingImage && (
            <div className={cn("absolute inset-0 animate-pulse", colorClasses.bg.secondary)} />
          )}

          {/* Product Image */}
          {imageData.images.length > 0 ? (
            <img
              src={getOptimizedImage(imageData.images[0].secure_url)}
              alt={imageData.images[0].altText || product.name}
              className={cn(
                "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
                isLoadingImage ? "opacity-0" : "opacity-100"
              )}
              loading="lazy"
              onLoad={() => setIsLoadingImage(false)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/product-placeholder.jpg';
                setIsLoadingImage(false);
              }}
            />
          ) : (
            <div className={cn("w-full h-full flex items-center justify-center", colorClasses.bg.gray100)}>
              <Package className={cn("h-8 w-8 sm:h-10 sm:w-10", colorClasses.text.gray400)} />
            </div>
          )}

          {/* Multiple images indicator */}
          {imageData.images.length > 1 && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              {imageData.images.slice(0, 3).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    i === 0 ? "bg-white" : "bg-white/60"
                  )}
                />
              ))}
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute bottom-2 left-2 z-10">
            <Badge
              variant="outline"
              size="sm"
              className={cn(
                "text-[10px] sm:text-xs backdrop-blur-sm flex items-center gap-1 px-1.5 py-0.5",
                colorClasses.border.goldenMustard,
                colorClasses.text.goldenMustard
              )}
            >
              <Tag className="h-2 w-2 sm:h-3 sm:w-3" />
              {product.category}
            </Badge>
          </div>

          {/* View Count */}
          {product.views > 0 && (
            <div
              className="absolute top-2 left-2 z-10 flex items-center gap-1 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            >
              <Eye className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
              <span className="text-white">{product.views.toLocaleString()}</span>
            </div>
          )}

          {/* Badges */}
          {renderBadges()}

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 z-20 flex gap-1">
            {renderActions()}
          </div>

          {/* Stock status moved to content area below */}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {/* Stock Status — inline badge, not image overlay */}
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] sm:text-xs px-2 py-0.5 font-medium",
                stockStatusClasses
              )}
            >
              {stockStatus.text}
            </Badge>
            {isNew && (
              <span className={cn(
                "text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium",
                colorClasses.bg.emeraldLight,
                colorClasses.text.emerald
              )}>
                New
              </span>
            )}
          </div>

          {/* Company Info */}
          <div className="flex items-center gap-2">
            <CompanyAvatarDisplay
              companyName={companyInfo.name}
              avatarUrl={companyInfo.avatar}
              avatarPublicId={companyInfo.avatarPublicId}
              verified={companyInfo.verified}
              size="sm"
            />
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className={cn(
                "text-xs sm:text-sm font-semibold truncate",
                colorClasses.text.primary
              )}>
                {companyInfo.name}
              </span>
              {companyInfo.verified && (
                <Shield className={cn("h-3 w-3 shrink-0", colorClasses.text.blue)} />
              )}
            </div>
          </div>

          {/* Product Name */}
          <h3 className={cn(
            "font-semibold line-clamp-2",
            "text-sm sm:text-base md:text-lg",
            colorClasses.text.primary
          )}>
            {product.name}
          </h3>

          {/* Short Description - Hidden on smallest screens */}
          {product.shortDescription && breakpoint !== 'mobile' && (
            <p className={cn(
              "text-xs sm:text-sm line-clamp-2",
              colorClasses.text.secondary
            )}>
              {product.shortDescription}
            </p>
          )}

          {/* Tags - Show on larger screens */}
          {product.tags && product.tags.length > 0 && breakpoint === 'desktop' && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    colorClasses.bg.gray100,
                    colorClasses.text.secondary
                  )}
                >
                  {tag}
                </span>
              ))}
              {product.tags.length > 2 && (
                <span className={cn("text-[10px]", colorClasses.text.secondary)}>
                  +{product.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Price and Details Row */}
          <div className="flex items-center justify-between pt-1">
            {/* Price */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-0.5 sm:gap-1">
                <DollarSign className={cn("h-3 w-3 sm:h-4 sm:w-4", colorClasses.text.goldenMustard)} />
                <span className={cn(
                  "font-bold truncate",
                  "text-sm sm:text-base md:text-lg",
                  colorClasses.text.goldenMustard
                )}>
                  {price}
                </span>
                <span className={cn("text-[10px] sm:text-xs whitespace-nowrap", colorClasses.text.secondary)}>
                  /{product.price.unit}
                </span>
              </div>

              {/* Creation Date */}
              {product.createdAt && (
                <span className={cn(
                  "text-[10px] sm:text-xs mt-0.5 flex items-center gap-0.5",
                  colorClasses.text.secondary
                )}>
                  <Clock className="h-2 w-2 sm:h-3 sm:w-3" />
                  {formatDate(product.createdAt)}
                </span>
              )}
            </div>

            {/* View Details Button */}
            <Link
              href={getDetailUrl()}
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
              aria-disabled={variant === 'public' && !isActive}
            >
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "flex items-center gap-0.5 sm:gap-1 whitespace-nowrap px-2 sm:px-3 py-1",
                  "text-[10px] sm:text-xs",
                  getTouchTargetSize('md'),
                  colorClasses.border.goldenMustard,
                  colorClasses.text.goldenMustard
                )}
                disabled={variant === 'public' && !isActive}
              >
                Details
                <ChevronRight className="h-2 w-2 sm:h-3 sm:w-3" />
              </Button>
            </Link>
          </div>

          {/* Inventory Info - Only for owner variant on larger screens */}
          {variant === 'owner' && product.inventory.trackQuantity && breakpoint !== 'mobile' && (
            <div className={cn("pt-2 border-t", colorClasses.border.gray100)}>
              <div className="flex items-center gap-1 sm:gap-2">
                <Package className={cn("h-3 w-3 sm:h-4 sm:w-4", colorClasses.text.secondary)} />
                <span className={cn("text-xs", colorClasses.text.secondary)}>
                  {product.inventory.quantity.toLocaleString()} in stock
                </span>
                {product.inventory.quantity <= product.inventory.lowStockAlert && product.inventory.quantity > 0 && (
                  <AlertCircle className={cn("h-3 w-3", colorClasses.text.orange)} />
                )}
              </div>
            </div>
          )}

          {/* Trending Indicator - For public variant */}
          {variant === 'public' && product.views > 1000 && breakpoint !== 'mobile' && (
            <div className={cn("flex items-center gap-1 pt-1", colorClasses.text.blue)}>
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Trending</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[90vw] max-w-md p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete `{product.name}`? This action cannot be undone.
              All product images and data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={(e) => e.stopPropagation()}
              className={cn("w-full sm:w-auto", getTouchTargetSize('md'))}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteProduct();
              }}
              disabled={isDeleting}
              className={cn(
                "w-full sm:w-auto",
                getTouchTargetSize('md'),
                "bg-red-600 hover:bg-red-700 focus:ring-red-600"
              )}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// =====================
// BACKWARD COMPATIBLE EXPORTS
// =====================

// For backward compatibility with existing imports
export const OwnerProductCard = (props: Omit<ProductCardProps, 'variant'>) => (
  <ProductCard {...props} variant="owner" />
);

export const PublicProductCard = (props: Omit<ProductCardProps, 'variant'>) => (
  <ProductCard {...props} variant="public" />
);

export default ProductCard;