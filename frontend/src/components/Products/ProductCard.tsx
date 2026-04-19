/**
 * frontend/src/components/Products/ProductCard.tsx  (UPDATED)
 *
 * Changes:
 *  - owner/public split is now strictly enforced via `variant` prop
 *  - Save / unsave button on public cards
 *  - Category + subcategory badge (uses CategoryBadge from CategorySelector)
 *  - Avatar resolved from ownerSnapshot first, then companyId
 *  - No add-to-cart — contact CTA only
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Product, productService } from '@/services/productService';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { Badge } from '@/components/social/ui/Badge';
import { Button } from '@/components/social/ui/Button';
import { CompanyAvatarDisplay } from './CompanyAvatarDisplay';
import { CategoryBadge } from './CategorySelector';
import { useProductCategories } from '@/hooks/useProducts';
import {
  Star, Eye, ChevronRight, Package, Edit,
  Trash2, MoreVertical, Bookmark, BookmarkCheck,
  DollarSign, Shield, AlertCircle, Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/social/ui/Dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/social/ui/Alert-Dialog';

// ── Types ──────────────────────────────────────────────────────────────────────

type CardVariant = 'owner' | 'public';

interface BaseProps {
  product: Product;
  className?: string;
  context?: 'company' | 'marketplace';
}

interface PublicCardProps extends BaseProps {
  variant?: 'public';
  isSaved?: boolean;
  onToggleSave?: (productId: string, isSaved: boolean) => void;
}

interface OwnerCardProps extends BaseProps {
  variant: 'owner';
  currentUser?: any;
  onProductDeleted?: () => void;
  onStatusChange?: (productId: string, status: string) => void;
}

type ProductCardProps = PublicCardProps | OwnerCardProps;

// ── Shared data hook ───────────────────────────────────────────────────────────

const useProductCardData = (product: Product) => {
  const { data: categories = [] } = useProductCategories();

  const imageData = useMemo(() => {
    if (!product.images?.length) return { primaryUrl: null, count: 0 };
    const sorted = [...product.images].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return (a.order || 0) - (b.order || 0);
    });
    return {
      primaryUrl: sorted[0]?.secure_url ?? null,
      count: sorted.length,
    };
  }, [product.images]);

  const ownerInfo = useMemo(() => {
    const snap    = product.ownerSnapshot;
    const company = typeof product.companyId === 'object' ? product.companyId as any : null;
    return {
      name:           snap?.name            || company?.name    || 'Company',
      verified:       snap?.verified        ?? company?.verified ?? false,
      avatarUrl:      snap?.avatarUrl       || snap?.logoUrl     || company?.avatar   || company?.logoUrl || null,
      avatarPublicId: snap?.avatarPublicId  || company?.avatarPublicId || null,
      industry:       snap?.industry        || company?.industry || null,
    };
  }, [product.ownerSnapshot, product.companyId]);

  const price      = product.formattedPrice || productService.formatPrice(product.price);
  const stockStatus = product.stockStatus || productService.getStockStatus(product.inventory);

  return { imageData, ownerInfo, price, stockStatus, categories };
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

export const ProductCardSkeleton: React.FC = () => (
  <div className={cn(
    'rounded-xl border overflow-hidden animate-pulse',
    colorClasses.bg.primary, colorClasses.border.gray100, 'dark:bg-gray-900 dark:border-gray-800',
  )}>
    <div className={cn('aspect-[4/3]', colorClasses.bg.secondary, 'dark:bg-gray-800')} />
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn('w-8 h-8 rounded-full', colorClasses.bg.secondary, 'dark:bg-gray-800')} />
        <div className={cn('h-3 w-24 rounded', colorClasses.bg.secondary, 'dark:bg-gray-800')} />
      </div>
      <div className={cn('h-4 w-3/4 rounded', colorClasses.bg.secondary, 'dark:bg-gray-800')} />
      <div className={cn('h-5 w-1/3 rounded', colorClasses.bg.secondary, 'dark:bg-gray-800')} />
    </div>
  </div>
);

// ── Public card ────────────────────────────────────────────────────────────────

const InternalPublicProductCard: React.FC<PublicCardProps> = ({
  product, className, context = 'marketplace',
  isSaved = false, onToggleSave,
}) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const { imageData, ownerInfo, price, stockStatus, categories } = useProductCardData(product);
  const [isHovered, setIsHovered] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const detailUrl = context === 'company'
    ? `/dashboard/company/products/${product._id}`
    : `/products/${product._id}`;

  const handleSave = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onToggleSave || saveLoading) return;
    setSaveLoading(true);
    try { await onToggleSave(product._id, isSaved); }
    finally { setSaveLoading(false); }
  }, [onToggleSave, product._id, isSaved, saveLoading]);

  const thumbUrl = imageData.primaryUrl
    ? productService.getImageUrl(imageData.primaryUrl, { width: 400, height: 300, crop: 'fill', quality: 'auto:best' })
    : null;

  return (
    <Link href={detailUrl} className="block group">
      <div
        className={cn(
          'rounded-xl border overflow-hidden transition-all duration-300',
          'hover:shadow-xl hover:-translate-y-1',
          'dark:hover:shadow-[0_4px_24px_rgba(241,187,3,0.1)]',
          colorClasses.bg.primary, colorClasses.border.gray100,
          'dark:bg-gray-900 dark:border-gray-800',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className={cn('w-full h-full flex items-center justify-center', colorClasses.bg.secondary, 'dark:bg-gray-800')}>
              <Package className={cn('h-10 w-10', colorClasses.text.secondary)} />
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {product.featured && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#FBBF24] text-[#0A2540] text-[10px] font-bold px-2 py-1 rounded-full">
              <Star className="h-2.5 w-2.5 fill-current" />
              Featured
            </div>
          )}

          {/* Save button */}
          {onToggleSave && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              className={cn(
                'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center',
                'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm',
                'hover:scale-110 transition-transform duration-200',
                saveLoading && 'opacity-50',
              )}
              aria-label={isSaved ? 'Remove from saved' : 'Save product'}
            >
              {isSaved
                ? <BookmarkCheck className="h-4 w-4 text-[#F1BB03]" />
                : <Bookmark className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              }
            </button>
          )}

          {/* Image count */}
          {imageData.count > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              +{imageData.count - 1}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-2.5">
          {/* Owner row */}
          <div className="flex items-center gap-2">
            <CompanyAvatarDisplay
              companyName={ownerInfo.name}
              avatarUrl={ownerInfo.avatarUrl}
              avatarPublicId={ownerInfo.avatarPublicId}
              verified={ownerInfo.verified}
              size="xs"
              showVerifiedBadge={false}
            />
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <span className={cn('text-xs font-semibold truncate', colorClasses.text.primary, 'dark:text-white')}>
                {ownerInfo.name}
              </span>
              {ownerInfo.verified && (
                <Shield className="h-3 w-3 shrink-0 text-blue-500" />
              )}
            </div>
          </div>

          {/* Name */}
          <h3 className={cn('font-semibold text-sm sm:text-base line-clamp-2', colorClasses.text.primary, 'dark:text-white')}>
            {product.name}
          </h3>

          {/* Category badge */}
          {product.category && (
            <CategoryBadge
              category={product.category}
              subcategory={product.subcategory}
              categories={categories}
              size="sm"
            />
          )}

          {/* Price + stock row */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-baseline gap-0.5">
              <span className={cn('font-bold text-sm sm:text-base', colorClasses.text.goldenMustard)}>
                {price}
              </span>
              {product.price.unit && product.price.unit !== 'unit' && (
                <span className={cn('text-[10px]', colorClasses.text.secondary)}>/{product.price.unit}</span>
              )}
            </div>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: stockStatus.color, backgroundColor: `${stockStatus.color}18` }}
            >
              {stockStatus.text}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ── Owner card ─────────────────────────────────────────────────────────────────

const OwnerProductCard: React.FC<OwnerCardProps> = ({
  product, className, currentUser, onProductDeleted, onStatusChange,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting]             = useState(false);
  const { toast } = useToast();
  const { imageData, ownerInfo, price, stockStatus, categories } = useProductCardData(product);

  const thumbUrl = imageData.primaryUrl
    ? productService.getImageUrl(imageData.primaryUrl, { width: 400, height: 300, crop: 'fill', quality: 'auto:best' })
    : null;

  const statusMap: Record<string, { label: string; color: string }> = {
    active:       { label: 'Active',        color: '#10B981' },
    draft:        { label: 'Draft',         color: '#F59E0B' },
    inactive:     { label: 'Inactive',      color: '#6B7280' },
    out_of_stock: { label: 'Out of Stock',  color: '#EF4444' },
    discontinued: { label: 'Discontinued',  color: '#9CA3AF' },
  };
  const statusCfg = statusMap[product.status] || statusMap.inactive;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await productService.deleteProduct(product._id);
      toast({ title: 'Product deleted', variant: 'default' });
      onProductDeleted?.();
    } catch {
      toast({ title: 'Failed to delete product', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className={cn(
        'rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-md',
        colorClasses.bg.primary, colorClasses.border.gray100,
        'dark:bg-gray-900 dark:border-gray-800',
        className,
      )}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {thumbUrl ? (
            <img src={thumbUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className={cn('w-full h-full flex items-center justify-center', colorClasses.bg.secondary, 'dark:bg-gray-800')}>
              <Package className={cn('h-10 w-10', colorClasses.text.secondary)} />
            </div>
          )}

          {/* Status badge */}
          <div
            className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ color: statusCfg.color, backgroundColor: `${statusCfg.color}20` }}
          >
            {statusCfg.label}
          </div>

          {/* Actions */}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform"
                  onClick={e => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 dark:bg-gray-900 dark:border-gray-700">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/company/products/${product._id}/edit`} className="gap-2 cursor-pointer text-sm dark:text-gray-300">
                    <Edit className="h-4 w-4" /> Edit Product
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="dark:bg-gray-700" />
                {product.status !== 'active' && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange?.(product._id, 'active')}
                    className="gap-2 cursor-pointer text-sm text-green-600 dark:text-green-400"
                  >
                    Set Active
                  </DropdownMenuItem>
                )}
                {product.status === 'active' && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange?.(product._id, 'draft')}
                    className="gap-2 cursor-pointer text-sm text-amber-600 dark:text-amber-400"
                  >
                    Set as Draft
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="dark:bg-gray-700" />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2 cursor-pointer text-sm text-red-600 focus:text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <h3 className={cn('font-semibold text-sm sm:text-base line-clamp-2', colorClasses.text.primary, 'dark:text-white')}>
            {product.name}
          </h3>

          {product.category && (
            <CategoryBadge
              category={product.category}
              subcategory={product.subcategory}
              categories={categories}
              size="sm"
            />
          )}

          <div className="flex items-center justify-between">
            <span className={cn('font-bold text-sm', colorClasses.text.goldenMustard)}>{price}</span>
            <span className={cn('text-xs flex items-center gap-1', colorClasses.text.secondary)}>
              <Eye className="h-3 w-3" /> {product.views?.toLocaleString() ?? 0}
            </span>
          </div>

          <Link
            href={`/dashboard/company/products/${product._id}/edit`}
            className={cn(
              'flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold',
              'border transition-colors duration-200',
              colorClasses.border.goldenMustard, colorClasses.text.goldenMustard,
              'hover:bg-[#F1BB03]/10 dark:hover:bg-[#F1BB03]/10',
            )}
          >
            <Edit className="h-3.5 w-3.5" /> Edit Product
          </Link>
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Are you sure you want to delete &ldquo;{product.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="dark:border-gray-600 dark:text-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ── Unified export ─────────────────────────────────────────────────────────────

export const ProductCard: React.FC<ProductCardProps> = (props) => {
  if (props.variant === 'owner') return <OwnerProductCard {...(props as OwnerCardProps)} />;
  return <InternalPublicProductCard {...(props as PublicCardProps)} />;
};

// Backward-compat aliases
export const PublicProductCard = (props: Omit<PublicCardProps, 'variant'>) =>
  <ProductCard variant="public" {...props} />;
export const OwnerProductCardAlias = (props: Omit<OwnerCardProps, 'variant'>) =>
  <ProductCard variant="owner" {...props} />;

export default ProductCard;
