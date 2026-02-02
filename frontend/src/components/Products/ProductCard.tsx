/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Product, productService } from "@/services/productService";
import { profileService, CloudinaryImage } from "@/services/profileService";
import { colors, colorClasses, getTheme } from "@/utils/color";
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
  Heart,
  Share2,
  MoreVertical,
  Bookmark,
  Tag,
  DollarSign,
  Shield,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { EntityAvatar } from "../layout/EntityAvatar";

// =====================
// COMMON INTERFACES & HELPERS
// =====================

interface CommonProductCardProps {
  product: Product;
  theme?: 'light' | 'dark';
  className?: string;
  currentUser?: any;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Today';
  if (diffDays <= 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Helper to get optimized avatar URL
const getOptimizedAvatarUrl = (avatar: string | CloudinaryImage | undefined, company?: any): string => {
  if (!avatar && company?.logoUrl) {
    return profileService.getOptimizedAvatarUrl(company.logoUrl, 'small');
  }

  if (typeof avatar === 'string') {
    return profileService.getOptimizedAvatarUrl(avatar, 'small');
  }

  if (avatar && typeof avatar === 'object' && 'secure_url' in avatar) {
    return profileService.getOptimizedAvatarUrl(avatar, 'small');
  }

  return profileService.getPlaceholderAvatar(company?.name || 'Company');
};

// =====================
// OWNER PRODUCT CARD
// =====================

interface OwnerProductCardProps extends CommonProductCardProps {
  onProductDeleted?: () => void;
}

export const OwnerProductCard: React.FC<OwnerProductCardProps> = ({
  product,
  theme = 'light',
  className,
  currentUser,
  onProductDeleted,
}) => {
  const currentTheme = getTheme(theme);
  const { toast } = useToast();

  const [isHovered, setIsHovered] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [imageScrollTop, setImageScrollTop] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user can manage this product
  const canManage = useMemo(() => {
    return productService.canManageProduct(product, currentUser);
  }, [product, currentUser]);

  // Image data
  const imageData = useMemo(() => {
    if (!product.images || product.images.length === 0) {
      return {
        primaryImage: null,
        thumbnail: product.thumbnail?.secure_url || '/images/product-placeholder.jpg',
        hasMultipleImages: false,
        images: []
      };
    }

    // Sort images: primary first, then by order
    const sortedImages = [...product.images].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return (a.order || 0) - (b.order || 0);
    });

    const primaryImage = sortedImages.find(img => img.isPrimary) || sortedImages[0];
    const hasMultipleImages = sortedImages.length > 1;

    return {
      primaryImage,
      thumbnail: primaryImage?.secure_url || product.thumbnail?.secure_url || '/images/product-placeholder.jpg',
      hasMultipleImages,
      images: sortedImages
    };
  }, [product.images, product.thumbnail]);

  // Optimize image URL
  const getOptimizedImage = (imageUrl: string) => {
    return productService.getImageUrl(imageUrl, {
      width: 320,
      height: 240,
      crop: 'fill',
      quality: 'auto:best',
      format: 'auto'
    });
  };

  // Format price and stock status
  const price = productService.formatPrice(product.price);
  const stockStatus = productService.getStockStatus(product.inventory);

  // Company info
  const company = typeof product.companyId === 'object' ? product.companyId : null;
  const companyName = company?.name || 'Unknown Company';
  const companyLogo = company?.logoUrl;
  const isCompanyVerified = company?.verified || false;
  const companyAvatarUrl = getOptimizedAvatarUrl(companyLogo, company);

  // Product status
  const isFeatured = product.featured;
  const isActive = product.status === 'active';
  const isDraft = product.status === 'draft';
  const isInactive = product.status === 'inactive';
  const isNew = useMemo(() => {
    if (!product.createdAt) return false;
    const created = new Date(product.createdAt);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }, [product.createdAt]);

  // Handle image container scroll
  const handleImageContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setImageScrollTop(e.currentTarget.scrollTop);
  };

  // Handle delete product
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

  // Container classes
  const containerClasses = cn(
    "group relative overflow-hidden rounded-xl transition-all duration-300",
    "hover:shadow-xl hover:-translate-y-1",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "min-h-[360px]",
    {
      'opacity-60': isInactive,
    },
    className
  );

  const imageContainerClasses = cn(
    "relative overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100",
    "h-64",
    "scrollbar-hide" // Hide scrollbar visually but keep functionality
  );

  const titleClasses = cn(
    "font-semibold line-clamp-2 leading-tight text-base md:text-lg"
  );

  // Navigate to dashboard product detail
  const handleCardClick = () => {
    if (canManage) {
      window.location.href = `/dashboard/company/products/${product._id}`;
    }
  };

  return (
    <>
      <div
        className={containerClasses}
        style={{
          backgroundColor: currentTheme.bg.white,
          borderColor: currentTheme.border.gray100,
          borderWidth: '1px',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
        role="article"
        aria-label={`Product: ${product.name} - ${isDraft ? 'Draft' : isActive ? 'Active' : 'Inactive'}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && canManage) {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        {/* Status Badges - Top Left */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {isNew && (
            <Badge
              className="flex items-center gap-1 px-2 py-1 text-xs animate-pulse"
              style={{
                backgroundColor: colors.green,
                color: colors.white
              }}
            >
              <Sparkles className="h-3 w-3" /> NEW
            </Badge>
          )}

          {isFeatured && (
            <Badge
              className="flex items-center gap-1 px-2 py-1 text-xs"
              style={{
                backgroundColor: colors.darkNavy,
                color: colors.white
              }}
            >
              <Star className="h-3 w-3 fill-current" /> Featured
            </Badge>
          )}

          {isDraft && (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                borderColor: colors.goldenMustard,
                color: colors.goldenMustard
              }}
            >
              Draft
            </Badge>
          )}
          {isInactive && (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                borderColor: currentTheme.text.secondary,
                color: currentTheme.text.secondary
              }}
            >
              Inactive
            </Badge>
          )}
        </div>

        {/* Admin Dropdown Menu - Top Right */}
        {canManage && (
          <div className="absolute top-3 right-3 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Product actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e: { stopPropagation: () => void; }) => {
                    e.stopPropagation();
                    window.location.href = `/dashboard/company/products/${product._id}/edit`;
                  }}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Product
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e: { stopPropagation: () => void; }) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Product
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Stock Status - Top Right (below dropdown) */}
        <div className="absolute top-14 right-3 z-10">
          <Badge
            variant="outline"
            className={`text-xs ${stockStatus.className}`}
          >
            {stockStatus.text}
          </Badge>
        </div>

        {/* Image Container */}
        <div
          className={imageContainerClasses}
          onScroll={handleImageContainerScroll}
        >
          {/* Image Skeleton */}
          {isLoadingImage && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
          )}

          {/* Product Images Stack */}
          <div className="flex flex-col">
            {imageData.images.map((image, index) => (
              <div key={image.public_id || index} className="flex-shrink-0">
                <img
                  src={getOptimizedImage(image.secure_url)}
                  alt={image.altText || `${product.name} - Image ${index + 1}`}
                  className={cn(
                    "object-cover w-full h-64",
                    isLoadingImage ? "opacity-0" : "opacity-100"
                  )}
                  loading={index === 0 ? "eager" : "lazy"}
                  onLoad={() => index === 0 && setIsLoadingImage(false)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/product-placeholder.jpg';
                    if (index === 0) setIsLoadingImage(false);
                  }}
                />
              </div>
            ))}
          </div>

          {/* Category Badge */}
          <div className="absolute bottom-3 left-3 z-10">
            <Badge
              variant="outline"
              size="sm"
              className="text-xs backdrop-blur-sm flex items-center gap-1"
              style={{
                borderColor: currentTheme.border.goldenMustard,
                color: currentTheme.text.goldenMustard
              }}
            >
              <Tag className="h-3 w-3" />
              {product.category}
            </Badge>
          </div>

          {/* View Count */}
          {product.views > 0 && (
            <div className="absolute top-3 left-12 z-10 flex items-center gap-1 text-xs px-2 py-1 rounded-full backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: colors.white
              }}>
              <Eye className="h-3 w-3" /> {product.views.toLocaleString()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Company Info */}
          <div className="flex items-center gap-2">
            <EntityAvatar
              name={companyName}
              avatar={companyAvatarUrl}
              size="sm"
              bordered
              themeMode={theme}
              showVerificationTooltip={true}
            />
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <span className="text-xs font-medium truncate" style={{ color: currentTheme.text.blue }}>
                {companyName}
              </span>
              {isCompanyVerified && (
                <Shield className="h-3 w-3" style={{ color: colors.blue }} />
              )}
            </div>
          </div>

          {/* Product Name */}
          <h3 className={titleClasses} style={{ color: currentTheme.text.primary }}>
            {product.name}
          </h3>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm line-clamp-2" style={{ color: currentTheme.text.secondary }}>
              {product.shortDescription}
            </p>
          )}

          {/* Price and Meta Row */}
          <div className="flex items-center justify-between pt-2">
            {/* Price */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline gap-1">
                <DollarSign className="h-4 w-4" style={{ color: currentTheme.text.goldenMustard }} />
                <span className={cn(
                  "font-bold truncate text-lg"
                )} style={{ color: currentTheme.text.goldenMustard }}>
                  {price}
                </span>
                <span className="text-xs whitespace-nowrap" style={{ color: currentTheme.text.secondary }}>
                  /{product.price.unit}
                </span>
              </div>

              {/* Creation Date */}
              {product.createdAt && (
                <span className="text-xs mt-1 flex items-center gap-1"
                  style={{ color: currentTheme.text.secondary }}>
                  <Clock className="h-3 w-3" />
                  {formatDate(product.createdAt)}
                </span>
              )}
            </div>

            {/* View Details Button */}
            <Link href={`/dashboard/company/products/${product._id}`} className="flex-shrink-0">
              <Button
                size="default"
                variant="outline"
                className="flex items-center gap-1 whitespace-nowrap"
                style={{
                  borderColor: colors.goldenMustard,
                  color: colors.goldenMustard
                }}
                onClick={(e) => e.stopPropagation()}
              >
                Details
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          {/* Inventory Info */}
          {product.inventory.trackQuantity && (
            <div className="pt-3 border-t" style={{ borderColor: currentTheme.border.gray100 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" style={{ color: currentTheme.text.secondary }} />
                  <span className="text-sm" style={{ color: currentTheme.text.secondary }}>
                    {product.inventory.quantity.toLocaleString()} in stock
                  </span>
                  {product.inventory.quantity <= product.inventory.lowStockAlert && product.inventory.quantity > 0 && (
                    <AlertCircle className="h-3 w-3" style={{ color: colors.orange }} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
              All product images and data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={(e: { stopPropagation: () => any; }) => e.stopPropagation()}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: { stopPropagation: () => void; }) => {
                e.stopPropagation();
                handleDeleteProduct();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
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
// PUBLIC PRODUCT CARD
// =====================

export const PublicProductCard: React.FC<CommonProductCardProps> = ({
  product,
  theme = 'light',
  className,
}) => {
  const currentTheme = getTheme(theme);
  const { toast } = useToast();

  const [isHovered, setIsHovered] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [imageScrollTop, setImageScrollTop] = useState(0);

  // Image data
  const imageData = useMemo(() => {
    if (!product.images || product.images.length === 0) {
      return {
        primaryImage: null,
        thumbnail: product.thumbnail?.secure_url || '/images/product-placeholder.jpg',
        hasMultipleImages: false,
        images: []
      };
    }

    // Sort images: primary first, then by order
    const sortedImages = [...product.images].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return (a.order || 0) - (b.order || 0);
    });

    const primaryImage = sortedImages.find(img => img.isPrimary) || sortedImages[0];
    const hasMultipleImages = sortedImages.length > 1;

    return {
      primaryImage,
      thumbnail: primaryImage?.secure_url || product.thumbnail?.secure_url || '/images/product-placeholder.jpg',
      hasMultipleImages,
      images: sortedImages
    };
  }, [product.images, product.thumbnail]);

  // Optimize image URL
  const getOptimizedImage = (imageUrl: string) => {
    return productService.getImageUrl(imageUrl, {
      width: 320,
      height: 240,
      crop: 'fill',
      quality: 'auto:best',
      format: 'auto'
    });
  };

  // Format price and stock status
  const price = productService.formatPrice(product.price);
  const stockStatus = productService.getStockStatus(product.inventory);

  // Company info
  const company = typeof product.companyId === 'object' ? product.companyId : null;
  const companyName = company?.name || 'Unknown Company';
  const companyLogo = company?.logoUrl;
  const isCompanyVerified = company?.verified || false;
  const companyAvatarUrl = getOptimizedAvatarUrl(companyLogo, company);

  // Product status
  const isFeatured = product.featured;
  const isActive = product.status === 'active';
  const isNew = useMemo(() => {
    if (!product.createdAt) return false;
    const created = new Date(product.createdAt);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }, [product.createdAt]);

  // Handle image container scroll
  const handleImageContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setImageScrollTop(e.currentTarget.scrollTop);
  };

  // Handle save/wishlist
  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removed from saved" : "Saved",
      description: `${product.name} has been ${isSaved ? 'removed from' : 'added to'} your saved items.`,
      variant: "default",
    });
  };

  // Handle share
  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.shortDescription || product.description,
        url: `${window.location.origin}/dashboard/products/${product._id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/dashboard/products/${product._id}`);
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard.",
        variant: "default",
      });
    }
  };

  // Navigate to public product detail
  const handleCardClick = () => {
    if (isActive) {
      window.location.href = `/dashboard/products/${product._id}`;
    }
  };

  // Container classes
  const containerClasses = cn(
    "group relative overflow-hidden rounded-xl transition-all duration-300",
    "hover:shadow-xl hover:-translate-y-1",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "min-h-[360px]",
    {
      'opacity-60 cursor-not-allowed': !isActive,
    },
    className
  );

  const imageContainerClasses = cn(
    "relative overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100",
    "h-64",
    "scrollbar-hide" // Hide scrollbar visually but keep functionality
  );

  const titleClasses = cn(
    "font-semibold line-clamp-2 leading-tight text-base md:text-lg"
  );

  return (
    <div
      className={containerClasses}
      style={{
        backgroundColor: currentTheme.bg.white,
        borderColor: currentTheme.border.gray100,
        borderWidth: '1px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      role="article"
      aria-label={`Product: ${product.name} - ${price}`}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isActive) {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Status Badges - Top Left */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {isNew && (
          <Badge
            className="flex items-center gap-1 px-2 py-1 text-xs animate-pulse"
            style={{
              backgroundColor: colors.green,
              color: colors.white
            }}
          >
            <Sparkles className="h-3 w-3" /> NEW
          </Badge>
        )}

        {isFeatured && (
          <Badge
            className="flex items-center gap-1 px-2 py-1 text-xs"
            style={{
              backgroundColor: colors.darkNavy,
              color: colors.white
            }}
          >
            <Star className="h-3 w-3 fill-current" /> Featured
          </Badge>
        )}
      </div>

      {/* Save Button - Top Right */}
      <div className="absolute top-3 right-3 z-10">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full bg-white/80 hover:bg-white backdrop-blur-sm"
          onClick={handleSaveClick}
          aria-label={isSaved ? "Remove from saved" : "Save for later"}
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current text-yellow-500' : ''}`} />
        </Button>
      </div>

      {/* Share Button - Below Save */}
      <div className="absolute top-12 right-3 z-10">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full bg-white/80 hover:bg-white backdrop-blur-sm"
          onClick={handleShareClick}
          aria-label="Share product"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Stock Status - Top Right (below buttons) */}
      <div className="absolute top-20 right-3 z-10">
        <Badge
          variant="outline"
          className={`text-xs ${stockStatus.className}`}
        >
          {stockStatus.text}
        </Badge>
      </div>

      {/* Image Container */}
      <div
        className={imageContainerClasses}
        onScroll={handleImageContainerScroll}
      >
        {/* Image Skeleton */}
        {isLoadingImage && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
        )}

        {/* Product Images Stack */}
        <div className="flex flex-col">
          {imageData.images.map((image, index) => (
            <div key={image.public_id || index} className="flex-shrink-0">
              <img
                src={getOptimizedImage(image.secure_url)}
                alt={image.altText || `${product.name} - Image ${index + 1}`}
                className={cn(
                  "object-cover w-full h-64",
                  isLoadingImage ? "opacity-0" : "opacity-100"
                )}
                loading={index === 0 ? "eager" : "lazy"}
                onLoad={() => index === 0 && setIsLoadingImage(false)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/product-placeholder.jpg';
                  if (index === 0) setIsLoadingImage(false);
                }}
              />
            </div>
          ))}
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <Badge
            variant="outline"
            size="sm"
            className="text-xs backdrop-blur-sm flex items-center gap-1"
            style={{
              borderColor: currentTheme.border.goldenMustard,
              color: currentTheme.text.goldenMustard
            }}
          >
            <Tag className="h-3 w-3" />
            {product.category}
          </Badge>
        </div>

        {/* View Count */}
        {product.views > 0 && (
          <div className="absolute top-3 left-12 z-10 flex items-center gap-1 text-xs px-2 py-1 rounded-full backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: colors.white
            }}>
            <Eye className="h-3 w-3" /> {product.views.toLocaleString()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Company Info */}
        <div className="flex items-center gap-2">
          <EntityAvatar
            name={companyName}
            avatar={companyAvatarUrl}
            size="sm"
            themeMode={theme}
          />
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className="text-xs font-medium truncate" style={{ color: currentTheme.text.blue }}>
              {companyName}
            </span>
          </div>
        </div>

        {/* Product Name */}
        <h3 className={titleClasses} style={{ color: currentTheme.text.primary }}>
          {product.name}
        </h3>

        {/* Short Description */}
        {product.shortDescription && (
          <p className="text-sm line-clamp-2" style={{ color: currentTheme.text.secondary }}>
            {product.shortDescription}
          </p>
        )}

        {/* Tags (for large cards) */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: currentTheme.bg.gray100,
                  color: currentTheme.text.secondary
                }}
              >
                {tag}
              </span>
            ))}
            {product.tags.length > 2 && (
              <span className="text-xs px-2 py-1 text-gray-500">
                +{product.tags.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Price and Details Row */}
        <div className="flex items-center justify-between pt-2">
          {/* Price */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1">
              <DollarSign className="h-4 w-4" style={{ color: currentTheme.text.goldenMustard }} />
              <span className={cn(
                "font-bold truncate text-lg"
              )} style={{ color: currentTheme.text.goldenMustard }}>
                {price}
              </span>
              <span className="text-xs whitespace-nowrap" style={{ color: currentTheme.text.secondary }}>
                /{product.price.unit}
              </span>
            </div>

            {/* Creation Date */}
            {product.createdAt && (
              <span className="text-xs mt-1 flex items-center gap-1"
                style={{ color: currentTheme.text.secondary }}>
                <Clock className="h-3 w-3" />
                {formatDate(product.createdAt)}
              </span>
            )}
          </div>

          {/* View Details Button */}
          <Link href={`/dashboard/products/${product._id}`} className="flex-shrink-0">
            <Button
              size="default"
              variant="outline"
              className="flex items-center gap-1 whitespace-nowrap"
              style={{
                borderColor: colors.goldenMustard,
                color: colors.goldenMustard
              }}
              onClick={(e) => e.stopPropagation()}
              disabled={!isActive}
            >
              Details
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {/* Inventory Info */}
        {product.inventory.trackQuantity && (
          <div className="pt-3 border-t" style={{ borderColor: currentTheme.border.gray100 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" style={{ color: currentTheme.text.secondary }} />
                <span className="text-sm" style={{ color: currentTheme.text.secondary }}>
                  {product.inventory.quantity.toLocaleString()} in stock
                </span>
                {product.inventory.quantity <= product.inventory.lowStockAlert && product.inventory.quantity > 0 && (
                  <AlertCircle className="h-3 w-3" style={{ color: colors.orange }} />
                )}
              </div>
              {product.views > 1000 && (
                <div className="flex items-center gap-1 text-xs" style={{ color: colors.blue }}>
                  <TrendingUp className="h-3 w-3" />
                  <span>Trending</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper CSS for hiding scrollbars while keeping functionality
const scrollbarHideCSS = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Add the CSS to document head (only once)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = scrollbarHideCSS;
  document.head.appendChild(style);
}