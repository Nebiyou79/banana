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

export interface ProductCompany {
  _id: string;
  name: string;
  logoUrl?: string;
  verified?: boolean;
  industry?: string;
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

export interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  currency: string;
  category: string;
  subcategory?: string;
  tags: string[];
  images: ProductImage[];
  thumbnail?: { public_id: string; secure_url: string };
  companyId: ProductCompany | string;
  featured: boolean;
  status: 'active' | 'draft' | 'out_of_stock' | 'discontinued';
  inventory: ProductInventory;
  sku?: string;
  specifications?: ProductSpecification[];
  metaTitle?: string;
  metaDescription?: string;
  views?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
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
  status?: 'active' | 'draft' | 'out_of_stock' | 'discontinued';
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

export interface ProductCategoryItem {
  name: string;
  count: number;
  subcategories?: string[];
}

// ── FormData builder ───────────────────────────────────────────────────────────
// CRITICAL: field name MUST be 'productImages' — middleware is hardcoded to this

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

  form.append('name', data.name ?? '');
  form.append('description', data.description ?? '');
  if (data.shortDescription) form.append('shortDescription', data.shortDescription);
  if (data.price !== undefined) form.append('price', JSON.stringify({ amount: data.price, currency: data.currency ?? 'USD', unit: 'unit' }));
  if (data.currency) form.append('currency', data.currency);
  if (data.category) form.append('category', data.category);
  if (data.subcategory) form.append('subcategory', data.subcategory);
  if (data.tags?.length) form.append('tags', JSON.stringify(data.tags));
  if (data.specifications?.length) form.append('specifications', JSON.stringify(data.specifications));
  form.append('featured', String(data.featured ?? false));
  if (data.inventory) form.append('inventory', JSON.stringify(data.inventory));
  if (data.sku) form.append('sku', data.sku);

  // status only on update
  if ('status' in data && data.status) form.append('status', data.status);

  // existing image management (for updates)
  if (options?.existingImages?.length) {
    form.append('existingImages', JSON.stringify(options.existingImages));
  }
  if (options?.imagesToDelete?.length) {
    form.append('imagesToDelete', JSON.stringify(options.imagesToDelete));
  }
  if (options?.primaryImageIndex !== undefined) {
    form.append('primaryImageIndex', String(options.primaryImageIndex));
  }

  // Append image files — field name MUST be 'productImages'
  imageAssets?.forEach((asset) => {
    form.append('productImages', {
      uri: asset.uri,
      name: asset.name,
      type: asset.type,
    } as any);
  });

  return form;
};

// ── Normalise API response shape ───────────────────────────────────────────────

const normaliseProductList = (data: any): ProductListResponse => {
  // Backend returns { success, data: { products, pagination } }
  const inner = data?.data ?? data;
  return {
    products: inner?.products ?? inner ?? [],
    pagination: inner?.pagination ?? { current: 1, pages: 1, total: 0, limit: 12 },
  };
};

const normaliseProduct = (data: any): Product => {
  const inner = data?.data ?? data;
  return inner?.product ?? inner;
};

const normaliseCategories = (data: any): string[] => {
  const inner = data?.data ?? data;
  const cats: any[] = inner?.categories ?? inner ?? [];
  return cats.map((c: any) => (typeof c === 'string' ? c : c?.name ?? String(c)));
};

// ── Service functions ──────────────────────────────────────────────────────────

export const productService = {
  /** GET /products — public, paginated list */
  async getProducts(filters?: ProductFilters): Promise<ProductListResponse> {
    const res = await apiGet<any>(PRODUCTS.LIST, { params: filters });
    return normaliseProductList(res.data);
  },

  /** GET /products/:id — public single product */
  async getProduct(id: string): Promise<Product> {
    const res = await apiGet<any>(PRODUCTS.DETAIL(id));
    return normaliseProduct(res.data);
  },

  /** GET /products/categories — public category list */
  async getCategories(): Promise<string[]> {
    const res = await apiGet<any>(PRODUCTS.CATEGORIES);
    return normaliseCategories(res.data);
  },

  /** GET /products/featured — public featured products */
  async getFeaturedProducts(): Promise<Product[]> {
    const res = await apiGet<any>(PRODUCTS.FEATURED);
    const inner = res.data?.data ?? res.data;
    return inner?.products ?? inner ?? [];
  },

  /** GET /products/company/:companyId — public company product list */
  async getCompanyProducts(companyId: string, filters?: ProductFilters): Promise<ProductListResponse> {
    const res = await apiGet<any>(PRODUCTS.COMPANY(companyId), { params: filters });
    return normaliseProductList(res.data);
  },

  /** GET /products/:id/related — public related products */
  async getRelatedProducts(id: string): Promise<Product[]> {
    const res = await apiGet<any>(PRODUCTS.RELATED(id));
    const inner = res.data?.data ?? res.data;
    return inner?.products ?? inner ?? [];
  },

  /** POST /products — company auth, multipart */
  async createProduct(data: CreateProductData, imageAssets: ImageAsset[]): Promise<Product> {
    const form = buildProductFormData(data, imageAssets);
    const res = await apiPost<any>(PRODUCTS.CREATE, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    });
    return normaliseProduct(res.data);
  },

  /** PUT /products/:id — company auth, multipart */
  async updateProduct(
    id: string,
    data: UpdateProductData,
    imageAssets?: ImageAsset[],
    options?: {
      existingImages?: string[];
      imagesToDelete?: string[];
      primaryImageIndex?: number;
    }
  ): Promise<Product> {
    const form = buildProductFormData(data, imageAssets, options);
    const res = await apiPut<any>(PRODUCTS.UPDATE(id), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    });
    return normaliseProduct(res.data);
  },

  /** PATCH /products/:id/status — company auth */
  async updateProductStatus(
    id: string,
    status: 'active' | 'draft' | 'out_of_stock' | 'discontinued'
  ): Promise<Product> {
    const res = await apiPatch<any>(PRODUCTS.UPDATE_STATUS(id), { status });
    return normaliseProduct(res.data);
  },

  /** DELETE /products/:id — company auth */
  async deleteProduct(id: string): Promise<void> {
    await apiDelete(PRODUCTS.DELETE(id));
  },
};
