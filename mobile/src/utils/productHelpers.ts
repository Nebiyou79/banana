/**
 * mobile/src/utils/productHelpers.ts  (UPDATED)
 *
 * Pure utility functions for product display logic.
 * No React imports — safe to call from anywhere.
 */
import { Product, ProductImage, ProductPrice, ProductStatus, OwnerSnapshot } from '../services/productService';

// ── Price formatting ──────────────────────────────────────────────────────────

export const formatPrice = (
  price: ProductPrice | number,
  currency = 'USD'
): string => {
  const amount = typeof price === 'number' ? price : price.amount;
  const curr   = typeof price === 'number' ? currency : price.currency;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: curr,
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${curr} ${amount.toFixed(2)}`;
  }
};

// ── Image helpers ─────────────────────────────────────────────────────────────

export const getPrimaryImage = (images: ProductImage[] = []): ProductImage | null => {
  const sorted = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  return sorted[0] ?? null;
};

export const getSortedImages = (images: ProductImage[] = []): ProductImage[] =>
  [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

// ── Stock status ──────────────────────────────────────────────────────────────

export type StockStatusKey = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface StockStatusConfig {
  key: StockStatusKey;
  label: string;
  color: string;
  background: string;
}

export const getStockStatus = (
  inventory?: Product['inventory']
): StockStatusKey => {
  if (!inventory?.trackQuantity)   return 'in_stock';
  if (inventory.quantity === 0)    return 'out_of_stock';
  if (inventory.quantity <= (inventory.lowStockAlert ?? 10)) return 'low_stock';
  return 'in_stock';
};

export const getStockBadgeConfig = (status: StockStatusKey): StockStatusConfig => {
  const configs: Record<StockStatusKey, StockStatusConfig> = {
    in_stock:    { key: 'in_stock',    label: 'In Stock',     color: '#10B981', background: '#D1FAE5' },
    low_stock:   { key: 'low_stock',   label: 'Low Stock',    color: '#F59E0B', background: '#FEF3C7' },
    out_of_stock:{ key: 'out_of_stock',label: 'Out of Stock', color: '#EF4444', background: '#FEE2E2' },
  };
  return configs[status];
};

// ── Product status badge ──────────────────────────────────────────────────────

export interface ProductStatusConfig {
  label: string;
  color: string;
  background: string;
}

export const getProductStatusConfig = (status: ProductStatus): ProductStatusConfig => {
  const configs: Record<ProductStatus, ProductStatusConfig> = {
    active:       { label: 'Active',        color: '#10B981', background: '#D1FAE5' },
    inactive:     { label: 'Inactive',      color: '#6B7280', background: '#F3F4F6' },
    draft:        { label: 'Draft',         color: '#F59E0B', background: '#FEF3C7' },
    out_of_stock: { label: 'Out of Stock',  color: '#EF4444', background: '#FEE2E2' },
    discontinued: { label: 'Discontinued',  color: '#9CA3AF', background: '#F9FAFB' },
  };
  return configs[status] ?? configs.inactive;
};

// ── Owner info helpers ────────────────────────────────────────────────────────

export const getOwnerName = (product: Product): string => {
  if (product.ownerSnapshot?.name) return product.ownerSnapshot.name;
  if (typeof product.companyId === 'object' && product.companyId !== null)
    return (product.companyId as { name: string }).name ?? 'Unknown Company';
  return 'Unknown Company';
};

export const getOwnerAvatarUrl = (product: Product): string | null => {
  const snap = product.ownerSnapshot;
  if (snap?.avatarUrl)  return snap.avatarUrl;
  if (snap?.logoUrl)    return snap.logoUrl;
  if (typeof product.companyId === 'object' && product.companyId !== null)
    return (product.companyId as { logoUrl?: string }).logoUrl ?? null;
  return null;
};

export const getOwnerInitials = (product: Product): string => {
  const name = getOwnerName(product);
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

// ── Category helpers ──────────────────────────────────────────────────────────

/** Truncate long category labels for compact display */
export const truncateCategoryLabel = (label: string, max = 14): string =>
  label.length > max ? `${label.slice(0, max)}…` : label;
