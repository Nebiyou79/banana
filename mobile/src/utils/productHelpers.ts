import { ProductImage, ProductInventory } from '../services/productService';

// ── formatPrice ────────────────────────────────────────────────────────────────

export const formatPrice = (price: number, currency = 'USD'): string => {
  if (currency === 'ETB') {
    return `ETB ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const symbols: Record<string, string> = {
    USD: '$',
    GBP: '£',
    EUR: '€',
    CAD: 'CA$',
    AUD: 'A$',
  };
  const symbol = symbols[currency] ?? currency + ' ';
  return `${symbol}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

// ── getStockStatus ─────────────────────────────────────────────────────────────

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export const getStockStatus = (inventory: ProductInventory): StockStatus => {
  if (!inventory.trackQuantity) return 'in_stock';
  if (inventory.quantity === 0) return 'out_of_stock';
  if (inventory.lowStockAlert && inventory.quantity <= inventory.lowStockAlert) return 'low_stock';
  return 'in_stock';
};

// ── getStockBadgeConfig ────────────────────────────────────────────────────────

export interface BadgeConfig {
  label: string;
  color: string;
  background: string;
}

export const getStockBadgeConfig = (status: StockStatus): BadgeConfig => {
  const configs: Record<StockStatus, BadgeConfig> = {
    in_stock: { label: 'In Stock', color: '#059669', background: '#D1FAE5' },
    low_stock: { label: 'Low Stock', color: '#D97706', background: '#FEF3C7' },
    out_of_stock: { label: 'Out of Stock', color: '#DC2626', background: '#FEE2E2' },
  };
  return configs[status];
};

// ── getProductStatusConfig ────────────────────────────────────────────────────

export type ProductStatus = 'active' | 'draft' | 'out_of_stock' | 'discontinued';

export const getProductStatusConfig = (status: string): BadgeConfig => {
  const configs: Record<string, BadgeConfig> = {
    active: { label: 'Active', color: '#059669', background: '#D1FAE5' },
    draft: { label: 'Draft', color: '#64748B', background: '#F1F5F9' },
    out_of_stock: { label: 'Out of Stock', color: '#DC2626', background: '#FEE2E2' },
    discontinued: { label: 'Discontinued', color: '#475569', background: '#E2E8F0' },
  };
  return configs[status] ?? { label: status, color: '#64748B', background: '#F1F5F9' };
};

// ── getPrimaryImage ────────────────────────────────────────────────────────────

export const getPrimaryImage = (images: ProductImage[]): ProductImage | undefined => {
  if (!images?.length) return undefined;
  return images.find((img) => img.isPrimary) ?? images[0];
};

// ── getNextStatus — toggle helper for company management ─────────────────────

export const getNextStatus = (
  current: ProductStatus
): 'active' | 'draft' => {
  return current === 'active' ? 'draft' : 'active';
};

// ── truncate ──────────────────────────────────────────────────────────────────

export const truncate = (str: string, maxLen: number): string => {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
};
