/**
 * frontend/src/services/productService.ts  (UPDATED — core types & save/unsave)
 *
 * Changes from previous version:
 *  - OwnerSnapshot type added (matches backend ownerSnapshot field)
 *  - Product.savedCount / isSaved
 *  - saveProduct / unsaveProduct / getSavedProducts
 *  - CategoryItem aligned with shared taxonomy (id + subcategories)
 *  - ProductStatus extended with 'out_of_stock' | 'discontinued'
 *  - price.unit is now a free-form string (not strict enum)
 *  - processProductResponse uses ownerSnapshot first for avatar resolution
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';
import { toast } from '@/hooks/use-toast';

// ── OwnerSnapshot (denormalised company info on every product) ─────────────────

export interface OwnerSnapshot {
  name: string;
  logoUrl?: string;
  avatarUrl?: string;       // from Profile.avatar.secure_url
  avatarPublicId?: string;
  verified: boolean;
  industry?: string;
  website?: string;
}

// ── Images ────────────────────────────────────────────────────────────────────

export interface ProductImage {
  public_id: string;
  secure_url: string;
  url?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  uploaded_at?: string | Date;
  altText?: string;
  isPrimary: boolean;
  order: number;
  _id?: string;
  id?: string;
  original_filename?: string;
  resource_type?: string;
}

// ── Price ─────────────────────────────────────────────────────────────────────

export interface Price {
  amount: number | string;
  currency: string;
  unit: string;             // free-form string, not strict enum
  displayPrice?: string;
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export interface Inventory {
  quantity: number;
  trackQuantity: boolean;
  lowStockAlert: number;
}

export interface Specification {
  key: string;
  value: string;
  _id?: string;
  id?: string;
}

// ── Category hierarchy ────────────────────────────────────────────────────────

export interface SubcategoryItem {
  id: string;
  label: string;
}

export interface CategoryItem {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  subcategories: SubcategoryItem[];
}

// ── Product ───────────────────────────────────────────────────────────────────

export type ProductStatus = 'active' | 'inactive' | 'draft' | 'out_of_stock' | 'discontinued';

export interface Company {
  _id: string;
  name: string;
  logoUrl?: string;
  verified: boolean;
  industry?: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  avatarPublicId?: string;
  socialLinks?: Record<string, string>;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: Price;
  images: ProductImage[];
  thumbnail?: { public_id: string; secure_url: string };
  category: string;
  subcategory?: string;
  tags: string[];
  specifications: Specification[];
  featured: boolean;
  status: ProductStatus;
  companyId: Company | string;
  ownerSnapshot?: OwnerSnapshot;   // fast-access company info (no population needed)
  views: number;
  sku: string;
  inventory: Inventory;
  metaTitle?: string;
  metaDescription?: string;
  savedCount?: number;
  createdAt: string;
  updatedAt: string;
  // processed by processProductResponse
  formattedPrice?: string;
  url?: string;
  id?: string;
  // legacy compat
  ownerAvatarUrl?: string;
  ownerAvatarPublicId?: string;
  ownerName?: string;
  ownerVerified?: boolean;
  isSaved?: boolean;
  stockStatus?: { text: string; color: string; className: string };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subcategory?: string;
  companyId?: string;
  featured?: boolean;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  sort?: string;
}

export interface ProductsResponse {
  products: Product[];
  pagination: { current: number; pages: number; total: number; limit: number };
  filters?: { categories: string[]; companies: number };
  stats?: { totalViews: number; activeProducts: number; draftProducts: number; avgPrice: number };
  company?: Company;
  isOwnerView?: boolean;
}

export interface CreateProductData {
  name: string;
  description: string;
  shortDescription?: string;
  price: Price;
  category: string;
  subcategory?: string;
  tags?: string[];
  specifications?: Specification[];
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  sku?: string;
  inventory?: Partial<Inventory>;
  companyId?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  existingImages?: string[];
  imagesToDelete?: string[];
  primaryImageIndex?: number;
  status?: ProductStatus;
}

export interface UploadImagesResponse {
  images: ProductImage[];
  uploadStats: { totalUploaded: number; successful: number; failed: number };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  code?: string;
}

// ── Error helpers (unchanged from original) ───────────────────────────────────

class ProductServiceError extends Error {
  constructor(
    message: string,
    public type: 'NETWORK' | 'VALIDATION' | 'AUTH' | 'SERVER' | 'CLIENT' | 'UNKNOWN' = 'UNKNOWN',
    public originalError?: any,
    public userFriendly?: boolean
  ) { super(message); this.name = 'ProductServiceError'; }
}

const showToastError = (error: ProductServiceError | string) => {
  const desc = typeof error === 'string' ? error : error.message;
  toast({ title: 'Error', description: desc, variant: 'destructive' });
};

const showSuccess = (message: string) => toast({ title: 'Success', description: message, variant: 'default' });
const showInfo    = (message: string) => toast({ title: 'Info',    description: message, variant: 'info' });
const showWarning = (message: string) => toast({ title: 'Warning', description: message, variant: 'destructive' });

const extractErrorMessage = (error: any): string => {
  const code = error.response?.data?.code;
  const msgMap: Record<string, string> = {
    NO_IMAGES:          'At least one product image is required.',
    NO_VALID_IMAGES:    'No valid images uploaded.',
    INVALID_PRICE:      'Valid price is required.',
    DUPLICATE_SKU:      'SKU already exists.',
    ACCESS_DENIED:      'You do not have permission to perform this action.',
    PRODUCT_NOT_FOUND:  'Product not found.',
    COMPANY_NOT_FOUND:  'Company profile not found.',
    IMAGE_UPLOAD_ERROR: 'Failed to upload images.',
    ALREADY_SAVED:      'Product already saved.',
  };
  if (code && msgMap[code]) return msgMap[code];
  return error.response?.data?.message || error.message || 'An unexpected error occurred.';
};

const safeApiCall = async <T>(fn: () => Promise<T>, defaultMsg: string): Promise<T> => {
  try { return await fn(); }
  catch (error: any) {
    const msg = extractErrorMessage(error);
    const svcErr = new ProductServiceError(msg, 'UNKNOWN', error);
    showToastError(svcErr);
    throw svcErr;
  }
};

// ── FormData builder ──────────────────────────────────────────────────────────

const createProductFormData = (
  data: Partial<CreateProductData> | Partial<UpdateProductData>,
  images: File[] = [],
  options?: { existingImages?: string[]; imagesToDelete?: string[]; primaryImageIndex?: number }
): FormData => {
  const form = new FormData();
  const clean = (s: any) => (typeof s === 'string' ? s.trim() : String(s ?? ''));

  if (data.name)        form.append('name',        clean(data.name));
  if (data.description) form.append('description', clean(data.description));
  if (data.shortDescription) form.append('shortDescription', clean(data.shortDescription));
  if (data.category)    form.append('category',    clean(data.category));
  if (data.subcategory) form.append('subcategory', clean(data.subcategory));
  if (data.companyId)   form.append('companyId',   clean(data.companyId));
  if (data.sku)         form.append('sku',         clean(data.sku));
  if (data.metaTitle)        form.append('metaTitle',        clean(data.metaTitle));
  if (data.metaDescription)  form.append('metaDescription',  clean(data.metaDescription));
  if (data.featured !== undefined) form.append('featured', data.featured.toString());

  if (data.price) {
    const amount = typeof data.price.amount === 'string'
      ? parseFloat(data.price.amount) || 0
      : data.price.amount;
    form.append('price', JSON.stringify({
      amount,
      currency: data.price.currency || 'USD',
      unit:     data.price.unit     || 'unit',
    }));
  }
  if (data.inventory) form.append('inventory', JSON.stringify({
    quantity:      data.inventory.quantity      || 0,
    trackQuantity: data.inventory.trackQuantity || false,
    lowStockAlert: data.inventory.lowStockAlert || 10,
  }));
  if (data.tags?.length)           form.append('tags',           JSON.stringify(data.tags.map(t => t.trim().toLowerCase())));
  if (data.specifications?.length) form.append('specifications', JSON.stringify(data.specifications.filter(s => s.key && s.value)));

  if (options?.existingImages?.length)    form.append('existingImages',    JSON.stringify(options.existingImages));
  if (options?.imagesToDelete?.length)    form.append('imagesToDelete',    JSON.stringify(options.imagesToDelete));
  if (options?.primaryImageIndex !== undefined) form.append('primaryImageIndex', options.primaryImageIndex.toString());
  if ('status' in data && (data as UpdateProductData).status) form.append('status', (data as UpdateProductData).status!);

  images.forEach(f => form.append('productImages', f));
  return form;
};

// ── Product normalisation ─────────────────────────────────────────────────────

const parseProductFromServer = (raw: any): Product => {
  if (!raw) return raw;
  const images = (raw.images || []).map((img: any) => ({
    public_id:         img.public_id || img.publicId,
    secure_url:        img.secure_url || img.url,
    url:               img.url || img.secure_url,
    format:            img.format,
    width:             img.width,
    height:            img.height,
    bytes:             img.bytes,
    uploaded_at:       img.uploaded_at || img.created_at,
    altText:           img.altText || 'Product image',
    isPrimary:         img.isPrimary || false,
    order:             img.order || 0,
    _id:               img._id,
    original_filename: img.original_filename || img.originalName,
    resource_type:     img.resource_type || 'image',
  }));

  return {
    ...raw,
    images,
    thumbnail:      raw.thumbnail,
    specifications: raw.specifications || [],
    tags:           raw.tags || [],
    inventory:      raw.inventory || { quantity: 0, trackQuantity: false, lowStockAlert: 10 },
    price:          raw.price || { amount: 0, currency: 'USD', unit: 'unit' },
  };
};

// ── Product service ───────────────────────────────────────────────────────────

export const productService = {
  getProducts: async (filters: ProductFilters = {}): Promise<ProductsResponse> =>
    safeApiCall(async () => {
      const response = await api.get<ApiResponse<ProductsResponse>>('/products', {
        params: { ...filters, status: filters.status || 'active', page: filters.page || 1, limit: filters.limit || 12 },
      });
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      const data = response.data.data;
      return { ...data, products: productService.processProductsResponse(data.products) };
    }, 'Failed to load products'),

  getProduct: async (id: string): Promise<Product> =>
    safeApiCall(async () => {
      const response = await api.get<ApiResponse<{ product: Product }>>(`/products/${id}`);
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      return productService.processProductResponse(response.data.data.product);
    }, 'Failed to load product'),

  /** Full category hierarchy from server */
  getCategories: async (): Promise<CategoryItem[]> =>
    safeApiCall(async () => {
      const response = await api.get<ApiResponse<{ categories: CategoryItem[] }>>('/products/categories');
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      return response.data.data.categories;
    }, 'Failed to load categories'),

  getFeaturedProducts: async (limit = 8): Promise<Product[]> =>
    safeApiCall(async () => {
      const response = await api.get<ApiResponse<{ products: Product[] }>>('/products/featured', { params: { limit } });
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      return productService.processProductsResponse(response.data.data.products);
    }, 'Failed to load featured products'),

  getRelatedProducts: async (productId: string, limit = 4): Promise<Product[]> =>
    safeApiCall(async () => {
      const response = await api.get<ApiResponse<{ products: Product[] }>>(`/products/${productId}/related`, { params: { limit } });
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      return productService.processProductsResponse(response.data.data.products);
    }, 'Failed to load related products'),

  getCompanyProducts: async (companyId: string, filters: Partial<ProductFilters> = {}): Promise<ProductsResponse> =>
    safeApiCall(async () => {
      if (!companyId || companyId === 'undefined') throw new ProductServiceError('Invalid company ID', 'VALIDATION');
      const response = await api.get<ApiResponse<ProductsResponse>>(`/products/company/${companyId}`, { params: filters });
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      const data = response.data.data;
      return { ...data, products: productService.processProductsResponse(data.products) };
    }, 'Failed to load company products'),

  createProduct: async (productData: CreateProductData, images: File[]): Promise<Product> =>
    safeApiCall(async () => {
      if (!images.length) throw new ProductServiceError('At least one product image is required.', 'VALIDATION');
      const formData = createProductFormData(productData, images);
      const response = await api.post<ApiResponse<{ product: Product }>>('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
      });
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      showSuccess('Product created successfully');
      return parseProductFromServer(response.data.data.product);
    }, 'Failed to create product'),

  updateProduct: async (
    productId: string,
    updateData: UpdateProductData,
    newImages: File[] = [],
    options?: { existingImages?: string[]; imagesToDelete?: string[]; primaryImageIndex?: number }
  ): Promise<Product> =>
    safeApiCall(async () => {
      const formData = createProductFormData(updateData, newImages, options);
      const response = await api.put<ApiResponse<{ product: Product }>>(`/products/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
      });
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      showSuccess('Product updated successfully');
      return parseProductFromServer(response.data.data.product);
    }, 'Failed to update product'),

  deleteProduct: async (productId: string): Promise<void> =>
    safeApiCall(async () => {
      const response = await api.delete<ApiResponse>(`/products/${productId}`);
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      showSuccess('Product deleted successfully');
    }, 'Failed to delete product'),

  updateProductStatus: async (productId: string, status: ProductStatus): Promise<Product> =>
    safeApiCall(async () => {
      const response = await api.patch<ApiResponse<{ product: Product }>>(`/products/${productId}/status`, { status });
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      showSuccess(`Product status updated to ${status}`);
      return parseProductFromServer(response.data.data.product);
    }, 'Failed to update product status'),

  // ── Save / Unsave ────────────────────────────────────────────────────────────

  saveProduct: async (productId: string): Promise<{ savedCount: number }> =>
    safeApiCall(async () => {
      const response = await api.post<ApiResponse<{ savedCount: number }>>(`/products/${productId}/save`);
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      return response.data.data;
    }, 'Failed to save product'),

  unsaveProduct: async (productId: string): Promise<{ savedCount: number }> =>
    safeApiCall(async () => {
      const response = await api.delete<ApiResponse<{ savedCount: number }>>(`/products/${productId}/save`);
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      return response.data.data;
    }, 'Failed to unsave product'),

  getSavedProducts: async (filters?: { page?: number; limit?: number }): Promise<ProductsResponse> =>
    safeApiCall(async () => {
      const response = await api.get<ApiResponse<ProductsResponse>>('/products/saved', { params: filters });
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      return { ...response.data.data, products: productService.processProductsResponse(response.data.data.products) };
    }, 'Failed to load saved products'),

  uploadImages: async (images: File[]): Promise<UploadImagesResponse> =>
    safeApiCall(async () => {
      if (!images.length) throw new ProductServiceError('No images selected', 'VALIDATION');
      const formData = new FormData();
      images.forEach(f => formData.append('productImages', f));
      const response = await api.post<ApiResponse<UploadImagesResponse>>('/products/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000,
      });
      if (!response.data.success) throw new ProductServiceError(response.data.message);
      showSuccess(`Uploaded ${images.length} image(s)`);
      return response.data.data;
    }, 'Failed to upload images'),

  // ── Response processing ───────────────────────────────────────────────────────

  /**
   * Enrich a single product with resolved owner avatar, formattedPrice, stockStatus.
   *
   * Priority for avatar:
   *   1. ownerSnapshot.avatarUrl  (Cloudinary from Profile)
   *   2. ownerSnapshot.logoUrl    (legacy Company.logoUrl)
   *   3. populated companyId.avatar
   *   4. populated companyId.logoUrl
   *   5. null (component renders initials)
   */
  processProductResponse: (product: any): Product => {
    if (!product) return product;

    const snap    = product.ownerSnapshot as OwnerSnapshot | undefined;
    const company = typeof product.companyId === 'object' ? product.companyId as Company : null;

    // Owner name
    product.ownerName = snap?.name || company?.name || 'Company';

    // Avatar URL resolution
    product.ownerAvatarUrl =
      snap?.avatarUrl      ||
      snap?.logoUrl        ||
      company?.avatar      ||
      company?.logoUrl     ||
      null;
    product.ownerAvatarPublicId = snap?.avatarPublicId || company?.avatarPublicId || null;
    product.ownerVerified = snap?.verified ?? company?.verified ?? false;

    // Price
    if (product.price && !product.formattedPrice) {
      product.formattedPrice = productService.formatPrice(product.price);
    }

    // Stock status
    if (product.inventory) {
      product.stockStatus = productService.getStockStatus(product.inventory);
    }

    return product as Product;
  },

  processProductsResponse: (products: any[]): Product[] =>
    (products || []).map(p => productService.processProductResponse(p)),

  // ── Utilities ─────────────────────────────────────────────────────────────────

  getStockStatus: (inventory: Inventory): { text: string; color: string; className: string } => {
    if (!inventory.trackQuantity)
      return { text: 'In Stock', color: '#10B981', className: 'text-green-600 dark:text-green-400' };
    if (inventory.quantity === 0)
      return { text: 'Out of Stock', color: '#EF4444', className: 'text-red-600 dark:text-red-400' };
    if (inventory.quantity <= inventory.lowStockAlert)
      return { text: 'Low Stock', color: '#F59E0B', className: 'text-orange-600 dark:text-orange-400' };
    return { text: 'In Stock', color: '#10B981', className: 'text-green-600 dark:text-green-400' };
  },

  formatPrice: (price: Price): string => {
    if (price.displayPrice) return price.displayPrice;
    const amount = typeof price.amount === 'string' ? parseFloat(price.amount) : price.amount;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: price.currency || 'USD',
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      }).format(amount || 0);
    } catch {
      return `${price.currency || 'USD'} ${(amount || 0).toFixed(2)}`;
    }
  },

  getImageUrl: (
    image: ProductImage | string | undefined,
    options?: { width?: number; height?: number; crop?: string; quality?: string; format?: string }
  ): string => {
    const placeholder = '/images/product-placeholder.jpg';
    if (!image) return placeholder;
    const url = typeof image === 'string' ? image : (image.secure_url || image.url);
    if (!url) return placeholder;
    if (url.includes('cloudinary.com') && options) {
      const transforms: string[] = [];
      if (options.width && options.height && options.crop) transforms.push(`w_${options.width},h_${options.height},c_${options.crop}`);
      else if (options.width)  transforms.push(`w_${options.width}`);
      else if (options.height) transforms.push(`h_${options.height}`);
      if (options.quality) transforms.push(`q_${options.quality}`);
      if (options.format)  transforms.push(`f_${options.format}`);
      if (transforms.length) return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
    }
    return url;
  },

  canManageProduct: (product: Product, currentUser: any): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role !== 'company') return false;
    const productCompanyId = typeof product.companyId === 'string'
      ? product.companyId
      : (product.companyId as any)?._id?.toString();
    const userCompanyId = (currentUser.companyId || currentUser.company?._id || currentUser.company?.id)?.toString();
    return !!(productCompanyId && userCompanyId && productCompanyId === userCompanyId);
  },

  extractPublicIds: (images: ProductImage[]): string[] =>
    images.filter(img => img.public_id).map(img => img.public_id),

  formatFileSize: (bytes: number): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },

  getDefaultProductData: (): CreateProductData => ({
    name: '', description: '', shortDescription: '',
    price: { amount: '', currency: 'USD', unit: 'unit' },
    category: '', subcategory: '', tags: [],
    specifications: [{ key: '', value: '' }],
    featured: false, metaTitle: '', metaDescription: '', sku: '',
    inventory: { quantity: 0, trackQuantity: false, lowStockAlert: 10 },
  }),

  createProductFormData,

  showToastError,
  showSuccess,
  showInfo,
  showWarning,
};

export const productToast = {
  error:   showToastError,
  success: showSuccess,
  info:    showInfo,
  warning: showWarning,
};
