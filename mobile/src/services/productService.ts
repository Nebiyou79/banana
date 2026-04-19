/**
 * mobile/src/services/productService.ts  (UPDATED)
 *
 * Changes:
 *  - OwnerSnapshot type (embedded company info for fast list rendering)
 *  - Product.savedBy / savedCount
 *  - saveProduct / unsaveProduct / getSavedProducts
 *  - Category hierarchy support (CategoryItem from shared taxonomy)
 *  - status enum extended: 'out_of_stock' | 'discontinued'
 *  - price.unit no longer restricted enum
 */
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../lib/api';
import { PRODUCTS } from '../constants/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProductImage {
  public_id: string;
  secure_url: string;
  isPrimary: boolean;
  order: number;
  altText?: string;
  format?: string;
  width?: number;
  height?: number;
}

/** Embedded company snapshot — present on every product without extra population */
export interface OwnerSnapshot {
  name: string;
  logoUrl?: string;
  avatarUrl?: string;      // from Profile.avatar (Cloudinary)
  avatarPublicId?: string;
  verified: boolean;
  industry?: string;
  website?: string;
}

/** Populated companyId field (returned on single-product fetch) */
export interface ProductCompany {
  _id: string;
  name: string;
  logoUrl?: string;
  verified: boolean;
  industry?: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  socialLinks?: Record<string, string>;
}

export interface ProductInventory {
  quantity: number;
  trackQuantity?: boolean;
  lowStockAlert?: number;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface ProductPrice {
  amount: number;
  currency: string;
  unit: string;
  displayPrice?: string;
}

export type ProductStatus = 'active' | 'draft' | 'inactive' | 'out_of_stock' | 'discontinued';

export interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: ProductPrice;
  currency?: string;   // legacy flat field
  category: string;
  subcategory?: string;
  tags: string[];
  images: ProductImage[];
  thumbnail?: { public_id: string; secure_url: string };
  companyId: ProductCompany | string;
  ownerSnapshot?: OwnerSnapshot;  // fast-access company info
  featured: boolean;
  status: ProductStatus;
  inventory: ProductInventory;
  sku?: string;
  specifications?: ProductSpecification[];
  metaTitle?: string;
  metaDescription?: string;
  views?: number;
  savedCount?: number;
  createdAt: string;
  updatedAt: string;
  // processed fields added by normaliseProduct
  formattedPrice?: string;
  isSaved?: boolean;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductData {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  currency?: string;
  unit?: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  featured?: boolean;
  inventory?: {
    quantity?: number;
    trackQuantity?: boolean;
    lowStockAlert?: number;
  };
  sku?: string;
  specifications?: ProductSpecification[];
}

export interface UpdateProductData extends Partial<CreateProductData> {
  status?: ProductStatus;
  existingImages?: string[];
  imagesToDelete?: string[];
  primaryImageIndex?: number;
}

export interface ImageAsset {
  uri: string;
  name: string;
  type: string;
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

/** Category item from server (includes live count) */
export interface CategoryItem {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  subcategories: { id: string; label: string }[];
}

// ── FormData builder ───────────────────────────────────────────────────────────

const buildProductFormData = (
  data: CreateProductData | UpdateProductData,
  imageAssets?: ImageAsset[],
  options?: {
    existingImages?: string[];
    imagesToDelete?: string[];
    primaryImageIndex?: number;
  }
): FormData => {
  const form = new FormData();

  form.append('name',        data.name        ?? '');
  form.append('description', data.description ?? '');
  if (data.shortDescription) form.append('shortDescription', data.shortDescription);
  if (data.price !== undefined)
    form.append('price', JSON.stringify({
      amount:   data.price,
      currency: data.currency ?? 'USD',
      unit:     data.unit     ?? 'unit',
    }));
  if (data.category)   form.append('category',   data.category);
  if (data.subcategory) form.append('subcategory', data.subcategory);
  if (data.tags?.length)           form.append('tags',           JSON.stringify(data.tags));
  if (data.specifications?.length) form.append('specifications', JSON.stringify(data.specifications));
  form.append('featured', String(data.featured ?? false));
  if (data.inventory)  form.append('inventory', JSON.stringify(data.inventory));
  if (data.sku)        form.append('sku', data.sku);
  if ('status' in data && data.status) form.append('status', data.status);

  if (options?.existingImages?.length)
    form.append('existingImages', JSON.stringify(options.existingImages));
  if (options?.imagesToDelete?.length)
    form.append('imagesToDelete', JSON.stringify(options.imagesToDelete));
  if (options?.primaryImageIndex !== undefined)
    form.append('primaryImageIndex', String(options.primaryImageIndex));

  imageAssets?.forEach(asset => {
    form.append('productImages', { uri: asset.uri, name: asset.name, type: asset.type } as unknown as Blob);
  });

  return form;
};

// ── Response normalisers ───────────────────────────────────────────────────────

const normaliseProductList = (data: unknown): ProductListResponse => {
  const inner = (data as Record<string, unknown>)?.data ?? data ?? {};
  return {
    products:   (inner as Record<string, unknown>)?.products   as Product[] ?? [],
    pagination: (inner as Record<string, unknown>)?.pagination as ProductListResponse['pagination'] ??
                { current: 1, pages: 1, total: 0, limit: 12 },
  };
};

const normaliseProduct = (data: unknown): Product => {
  const inner = (data as Record<string, unknown>)?.data ?? data;
  return ((inner as Record<string, unknown>)?.product ?? inner) as Product;
};

const normaliseCategories = (data: unknown): CategoryItem[] => {
  const inner = (data as Record<string, unknown>)?.data ?? data;
  return ((inner as Record<string, unknown>)?.categories ?? inner ?? []) as CategoryItem[];
};

// ── Service ────────────────────────────────────────────────────────────────────

export const productService = {
  async getProducts(filters?: ProductFilters): Promise<ProductListResponse> {
    const res = await apiGet<unknown>(PRODUCTS.LIST, { params: filters });
    return normaliseProductList(res.data);
  },

  async getProduct(id: string): Promise<Product> {
    const res = await apiGet<unknown>(PRODUCTS.DETAIL(id));
    return normaliseProduct(res.data);
  },

  async getCategories(): Promise<CategoryItem[]> {
    const res = await apiGet<unknown>(PRODUCTS.CATEGORIES);
    return normaliseCategories(res.data);
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const res = await apiGet<unknown>(PRODUCTS.FEATURED);
    const inner = (res.data as Record<string, unknown>)?.data ?? res.data;
    return ((inner as Record<string, unknown>)?.products ?? inner ?? []) as Product[];
  },

  async getCompanyProducts(
    companyId: string,
    filters?: ProductFilters & { sort?: string; status?: string }
  ): Promise<ProductListResponse & { isOwnerView?: boolean }> {
    const res = await apiGet<unknown>(PRODUCTS.COMPANY(companyId), { params: filters });
    const list = normaliseProductList(res.data);
    const isOwnerView = ((res.data as Record<string, unknown>)?.data as Record<string, unknown>)?.isOwnerView as boolean;
    return { ...list, isOwnerView };
  },

  async getRelatedProducts(id: string): Promise<Product[]> {
    const res = await apiGet<unknown>(PRODUCTS.RELATED(id));
    const inner = (res.data as Record<string, unknown>)?.data ?? res.data;
    return ((inner as Record<string, unknown>)?.products ?? inner ?? []) as Product[];
  },

  async createProduct(data: CreateProductData, imageAssets: ImageAsset[]): Promise<Product> {
    const form = buildProductFormData(data, imageAssets);
    const res = await apiPost<unknown>(PRODUCTS.CREATE, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    });
    return normaliseProduct(res.data);
  },

  async updateProduct(
    id: string,
    data: UpdateProductData,
    imageAssets?: ImageAsset[],
    options?: { existingImages?: string[]; imagesToDelete?: string[]; primaryImageIndex?: number }
  ): Promise<Product> {
    const form = buildProductFormData(data, imageAssets, options);
    const res = await apiPut<unknown>(PRODUCTS.UPDATE(id), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    });
    return normaliseProduct(res.data);
  },

  async updateProductStatus(id: string, status: ProductStatus): Promise<Product> {
    const res = await apiPatch<unknown>(PRODUCTS.UPDATE_STATUS(id), { status });
    return normaliseProduct(res.data);
  },

  async deleteProduct(id: string): Promise<void> {
    await apiDelete(PRODUCTS.DELETE(id));
  },

  // ── Save / Unsave ────────────────────────────────────────────────────────────

  async saveProduct(id: string): Promise<{ savedCount: number }> {
    const res = await apiPost<{ success: boolean; data: { savedCount: number } }>(
      PRODUCTS.SAVE(id)
    );
    return res.data.data;
  },

  async unsaveProduct(id: string): Promise<{ savedCount: number }> {
    const res = await apiDelete<{ success: boolean; data: { savedCount: number } }>(
      PRODUCTS.SAVE(id)
    );
    return res.data.data;
  },

  async getSavedProducts(filters?: Pick<ProductFilters, 'page' | 'limit'>): Promise<ProductListResponse> {
    const res = await apiGet<unknown>(PRODUCTS.SAVED, { params: filters });
    return normaliseProductList(res.data);
  },

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /**
   * Resolve the best avatar URL from a product.
   * Priority: ownerSnapshot.avatarUrl → ownerSnapshot.logoUrl → populated company
   */
  getOwnerAvatarUrl(product: Product): string | null {
    const snap = product.ownerSnapshot;
    if (snap?.avatarUrl)  return snap.avatarUrl;
    if (snap?.logoUrl)    return snap.logoUrl;
    const company = typeof product.companyId === 'object' ? product.companyId as ProductCompany : null;
    return company?.logoUrl ?? null;
  },

  /**
   * Resolve owner name from ownerSnapshot or populated companyId.
   */
  getOwnerName(product: Product): string {
    if (product.ownerSnapshot?.name) return product.ownerSnapshot.name;
    const company = typeof product.companyId === 'object' ? product.companyId as ProductCompany : null;
    return company?.name ?? 'Unknown Company';
  },

  formatPrice(price: ProductPrice | number, currency = 'USD'): string {
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
  },
};

// Re-export for convenience
export type { CategoryItem as ProductCategoryItem };
