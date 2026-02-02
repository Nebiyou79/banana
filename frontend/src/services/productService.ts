/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';
import { toast } from '@/hooks/use-toast';

// =====================
// INTERFACES
// =====================
export interface ExistingImage {
  secure_url: string;
  public_id?: string;
  altText?: string;
  isPrimary?: boolean;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  uploaded_at?: string | Date;
}

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

export interface Price {
  amount: number | string;
  currency: string;
  unit: string;
  displayPrice?: string;
}

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

export interface Company {
  _id: string;
  name: string;
  logoUrl?: string;
  verified: boolean;
  industry: string;
  description?: string;
  website?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: Price;
  images: ProductImage[];
  thumbnail?: {
    public_id: string;
    secure_url: string;
  };
  category: string;
  subcategory?: string;
  tags: string[];
  specifications: Specification[];
  featured: boolean;
  status: 'active' | 'inactive' | 'draft';
  companyId: Company | string;
  views: number;
  sku: string;
  inventory: Inventory;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
  formattedPrice?: string;
  url?: string;
  id?: string;
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
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
  filters?: {
    categories: string[];
    companies: number;
  };
  stats?: {
    totalViews: number;
    activeProducts: number;
    draftProducts: number;
    avgPrice: number;
  };
  company?: Company;
}

export interface Category {
  name: string;
  count: number;
  subcategories: string[];
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
  existingImages?: string[]; // Array of Cloudinary public_ids to keep
  imagesToDelete?: string[]; // Array of Cloudinary public_ids to delete
  primaryImageIndex?: number;
  status?: 'active' | 'inactive' | 'draft';
}

export interface UploadImagesResponse {
  images: ProductImage[];
  uploadStats: {
    totalUploaded: number;
    successful: number;
    failed: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  code?: string;
}

// =====================
// ERROR HANDLING
// =====================

type ErrorType = 'NETWORK' | 'VALIDATION' | 'AUTH' | 'SERVER' | 'CLIENT' | 'UNKNOWN';

class ProductServiceError extends Error {
  constructor(
    message: string,
    public type: ErrorType = 'UNKNOWN',
    public originalError?: any,
    public userFriendly?: boolean
  ) {
    super(message);
    this.name = 'ProductServiceError';
  }
}

// =====================
// UTILITY FUNCTIONS
// =====================

const showToastError = (error: ProductServiceError | string) => {
  if (typeof error === 'string') {
    toast({
      title: 'Error',
      description: error,
      variant: 'destructive',
    });
    return;
  }

  let title = 'Error';
  let description = error.message;

  switch (error.type) {
    case 'NETWORK':
      title = 'Connection Error';
      description = 'Please check your internet connection and try again.';
      break;
    case 'AUTH':
      title = 'Authentication Error';
      description = 'Please log in again to continue.';
      break;
    case 'VALIDATION':
      title = 'Validation Error';
      break;
    case 'SERVER':
      title = 'Server Error';
      description = 'Something went wrong on our end. Please try again later.';
      break;
    case 'CLIENT':
      title = 'Error';
      break;
    default:
      title = 'Unexpected Error';
      description = 'An unexpected error occurred. Please try again.';
  }

  toast({
    title,
    description,
    variant: 'destructive',
  });

  if (error.originalError && process.env.NODE_ENV === 'development') {
    console.error('Product Service Error Details:', {
      message: error.message,
      type: error.type,
      originalError: error.originalError
    });
  }
};

const showSuccess = (message: string) => {
  toast({
    title: 'Success',
    description: message,
    variant: 'default',
  });
};

const showInfo = (message: string) => {
  toast({
    title: 'Info',
    description: message,
    variant: 'info',
  });
};

const showWarning = (message: string) => {
  toast({
    title: 'Warning',
    description: message,
    variant: 'destructive',
  });
};

// Error detection helpers
const isNetworkError = (error: any): boolean => {
  return (!error.response && error.request) || 
         error.code === 'NETWORK_ERROR' || 
         error.message?.includes('Network Error');
};

const isTimeoutError = (error: any): boolean => {
  return error.code === 'ECONNABORTED' || 
         error.message?.includes('timeout');
};

const isAuthError = (error: any): boolean => {
  return error.response?.status === 401 || 
         error.response?.status === 403;
};

const isValidationError = (error: any): boolean => {
  return error.response?.status === 400 || 
         error.name === 'ValidationError';
};

const extractErrorMessage = (error: any): string => {
  if (error instanceof ProductServiceError) {
    return error.message;
  }

  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  if (isTimeoutError(error)) {
    return 'Request timed out. Please try again.';
  }

  if (error.response?.data) {
    const data = error.response.data;

    if (data.code) {
      switch (data.code) {
        case 'NO_IMAGES':
          return 'At least one product image is required.';
        case 'NO_VALID_IMAGES':
          return 'No valid images were uploaded. Please check file formats.';
        case 'INVALID_PRICE':
          return 'Valid price is required.';
        case 'DUPLICATE_SKU':
          return 'SKU already exists. Please use a different SKU.';
        case 'ACCESS_DENIED':
          return 'Access denied. You do not have permission to perform this action.';
        case 'PRODUCT_NOT_FOUND':
          return 'Product not found.';
        case 'COMPANY_NOT_FOUND':
          return 'Company profile not found. Please complete your company profile first.';
        case 'IMAGE_UPLOAD_ERROR':
          return 'Failed to upload images. Please try again.';
        case 'COMPANY_ID_REQUIRED':
          return 'Company ID is required for admin product creation.';
        case 'INVALID_STATUS':
          return 'Invalid status. Must be one of: active, inactive, draft';
        default:
          return data.message || 'An error occurred.';
      }
    }

    if (data.message) {
      return data.message;
    }
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

const extractErrorType = (error: any): ErrorType => {
  if (isNetworkError(error) || isTimeoutError(error)) return 'NETWORK';
  if (isAuthError(error)) return 'AUTH';
  if (isValidationError(error)) return 'VALIDATION';
  if (error.response?.status >= 500) return 'SERVER';
  if (error.response?.status >= 400) return 'CLIENT';
  return 'UNKNOWN';
};

const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  defaultErrorMessage: string
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    const message = extractErrorMessage(error);
    const type = extractErrorType(error);
    const serviceError = new ProductServiceError(message, type, error);
    showToastError(serviceError);
    throw serviceError;
  }
};

// =====================
// VALIDATION FUNCTIONS
// =====================

const validateProductImages = (files: File[]): string[] => {
  const errors: string[] = [];

  if (!files || files.length === 0) {
    return errors;
  }

  if (files.length > 5) {
    errors.push('Maximum 5 images allowed per upload');
  }

  const maxSize = 20 * 1024 * 1024; // 20MB
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  files.forEach(file => {
    if (!allowedTypes.includes(file.type)) {
      errors.push(`"${file.name}" must be JPEG, PNG, WEBP, or GIF`);
    }

    if (file.size > maxSize) {
      errors.push(`"${file.name}" must be less than 20MB`);
    }

    if (file.size === 0) {
      errors.push(`"${file.name}" is empty`);
    }
  });

  return errors;
};

const validateProductData = (data: Partial<CreateProductData>): string[] => {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('Product name is required');
  }

  if (!data.description?.trim()) {
    errors.push('Product description is required');
  }

  if (!data.category?.trim()) {
    errors.push('Product category is required');
  }

  const priceAmount = typeof data.price?.amount === 'string' 
    ? parseFloat(data.price.amount) 
    : data.price?.amount;
    
  if (!priceAmount || priceAmount < 0) {
    errors.push('Valid product price is required');
  }

  return errors;
};

// =====================
// FORM DATA CREATION - UPDATED FOR BACKEND COMPATIBILITY
// =====================

/**
 * Creates FormData for product creation/update with Cloudinary image upload support
 * CRITICAL: Field names MUST match backend expectations exactly
 */
const createProductFormData = (
  productData: Partial<CreateProductData> | Partial<UpdateProductData>,
  images: File[] = [],
  options?: {
    existingImages?: string[];
    imagesToDelete?: string[];
    primaryImageIndex?: number;
  }
): FormData => {
  const formData = new FormData();

  // Helper to clean string values
  const cleanString = (str: any): string => {
    if (str === null || str === undefined) return '';
    if (typeof str === 'string') return str.trim();
    return String(str);
  };

  // Helper to safely append fields
  const appendField = (fieldName: string, value: any, required = false) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(fieldName, cleanString(value));
    } else if (required) {
      formData.append(fieldName, '');
    }
  };

  // Append basic text fields - MATCHING BACKEND EXPECTATIONS
  appendField('name', productData.name, true);
  appendField('description', productData.description, true);
  appendField('shortDescription', productData.shortDescription);
  appendField('category', productData.category, true);
  appendField('subcategory', productData.subcategory);
  appendField('companyId', productData.companyId);
  appendField('metaTitle', productData.metaTitle);
  appendField('metaDescription', productData.metaDescription);
  appendField('sku', productData.sku);

  // Append boolean fields
  if (productData.featured !== undefined) {
    formData.append('featured', productData.featured.toString());
  }

  // CRITICAL: Append complex fields as JSON strings - BACKEND EXPECTS JSON
  if (productData.price) {
    const priceAmount = typeof productData.price.amount === 'string' 
      ? parseFloat(productData.price.amount) || 0
      : productData.price.amount;
      
    formData.append('price', JSON.stringify({
      amount: priceAmount,
      currency: productData.price.currency || 'USD',
      unit: productData.price.unit || 'unit'
    }));
  }

  if (productData.inventory) {
    formData.append('inventory', JSON.stringify({
      quantity: productData.inventory.quantity || 0,
      trackQuantity: productData.inventory.trackQuantity || false,
      lowStockAlert: productData.inventory.lowStockAlert || 10
    }));
  }

  if (productData.tags && productData.tags.length > 0) {
    formData.append('tags', JSON.stringify(
      productData.tags.filter(tag => tag.trim()).map(tag => tag.trim().toLowerCase())
    ));
  }

  if (productData.specifications && productData.specifications.length > 0) {
    const validSpecs = productData.specifications
      .filter(spec => spec.key.trim() && spec.value.trim())
      .map(spec => ({
        key: cleanString(spec.key),
        value: cleanString(spec.value)
      }));
    
    if (validSpecs.length > 0) {
      formData.append('specifications', JSON.stringify(validSpecs));
    }
  }

  // Append image management fields for updates
  if (options?.existingImages && options.existingImages.length > 0) {
    formData.append('existingImages', JSON.stringify(options.existingImages));
  }

  if (options?.imagesToDelete && options.imagesToDelete.length > 0) {
    formData.append('imagesToDelete', JSON.stringify(options.imagesToDelete));
  }

  if (options?.primaryImageIndex !== undefined) {
    formData.append('primaryImageIndex', options.primaryImageIndex.toString());
  }

  if ('status' in productData && productData.status) {
    formData.append('status', productData.status);
  }

  // CRITICAL: Append new images - field name MUST be "productImages" (plural)
  // Backend expects each file as separate field with same name
  images.forEach(file => {
    formData.append('productImages', file); // Field name MUST be plural
  });

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Created FormData with fields:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  📁 ${key}: File - ${value.name} (${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  📄 ${key}: ${value}`);
      }
    }
  }

  return formData;
};

// =====================
// RESPONSE PARSING
// =====================

const parseProductImage = (img: any): ProductImage => ({
  public_id: img.public_id || img.publicId,
  secure_url: img.secure_url || img.url,
  url: img.url || img.secure_url,
  format: img.format,
  width: img.width,
  height: img.height,
  bytes: img.bytes,
  uploaded_at: img.uploaded_at || img.created_at || new Date().toISOString(),
  altText: img.altText || `Product Image`,
  isPrimary: img.isPrimary || false,
  order: img.order || 0,
  _id: img._id,
  original_filename: img.original_filename || img.originalName,
  resource_type: img.resource_type || 'image'
});

const parseProductFromServer = (data: any): Product => {
  const images = (data.images || []).map(parseProductImage);
  
  return {
    ...data,
    companyId: data.companyId && typeof data.companyId === 'object' ? data.companyId : data.companyId,
    images,
    thumbnail: data.thumbnail || (images.length > 0 ? {
      public_id: images.find((img: any) => img.isPrimary)?.public_id || images[0].public_id,
      secure_url: images.find((img: any) => img.isPrimary)?.secure_url || images[0].secure_url
    } : undefined),
    specifications: data.specifications || [],
    tags: data.tags || [],
    inventory: data.inventory || {
      quantity: 0,
      trackQuantity: false,
      lowStockAlert: 10
    },
    price: data.price || {
      amount: 0,
      currency: 'USD',
      unit: 'unit'
    }
  };
};

// =====================
// PRODUCT SERVICE - UPDATED FOR BACKEND COMPATIBILITY
// =====================

export const productService = {
  // ========== GET PRODUCTS ==========
  getProducts: async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
    return safeApiCall(async () => {
      const params = {
        ...filters,
        status: filters.status || 'active',
        page: filters.page || 1,
        limit: filters.limit || 12
      };

      const response = await api.get<ApiResponse<ProductsResponse>>('/products', { params });

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to fetch products');
      }

      const data = response.data.data;
      return {
        ...data,
        products: data.products.map(parseProductFromServer)
      };
    }, 'Failed to load products');
  },

  // ========== GET SINGLE PRODUCT ==========
  getProduct: async (id: string): Promise<Product> => {
    return safeApiCall(async () => {
      const response = await api.get<ApiResponse<{ product: Product }>>(`/products/${id}`);

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Product not found');
      }

      return parseProductFromServer(response.data.data.product);
    }, 'Failed to load product');
  },

  // ========== CREATE PRODUCT (UPDATED FOR BACKEND COMPATIBILITY) ==========
  createProduct: async (
    productData: CreateProductData, 
    images: File[]
  ): Promise<Product> => {
    return safeApiCall(async () => {
      // Validate
      if (images.length === 0) {
        throw new ProductServiceError('At least one product image is required', 'VALIDATION');
      }

      const imageErrors = validateProductImages(images);
      if (imageErrors.length > 0) {
        throw new ProductServiceError(imageErrors.join(', '), 'VALIDATION');
      }

      const dataErrors = validateProductData(productData);
      if (dataErrors.length > 0) {
        throw new ProductServiceError(dataErrors.join(', '), 'VALIDATION');
      }

      // Create FormData - CRITICAL: Uses createProductFormData which matches backend
      const formData = createProductFormData(productData, images);

      console.log('🔄 Sending create product request with:', {
        name: productData.name,
        imageCount: images.length,
        price: productData.price,
        hasCompanyId: !!productData.companyId
      });

      const response = await api.post<ApiResponse<{ product: Product }>>(
        '/products',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minutes
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            console.log(`Upload progress: ${percent}%`);
          }
        }
      );

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to create product');
      }

      showSuccess('Product created successfully');
      return parseProductFromServer(response.data.data.product);
    }, 'Failed to create product');
  },

  // ========== UPDATE PRODUCT (UPDATED FOR BACKEND COMPATIBILITY) ==========
  updateProduct: async (
    productId: string,
    updateData: UpdateProductData,
    newImages: File[] = [],
    options?: {
      existingImages?: string[];
      imagesToDelete?: string[];
      primaryImageIndex?: number;
    }
  ): Promise<Product> => {
    return safeApiCall(async () => {
      // Validate new images if provided
      if (newImages.length > 0) {
        const imageErrors = validateProductImages(newImages);
        if (imageErrors.length > 0) {
          throw new ProductServiceError(imageErrors.join(', '), 'VALIDATION');
        }
      }

      // Validate product data
      const dataErrors = validateProductData(updateData);
      if (dataErrors.length > 0) {
        throw new ProductServiceError(dataErrors.join(', '), 'VALIDATION');
      }

      // Check if we have any images (existing + new - deletions)
      const existingImagesCount = options?.existingImages?.length || 0;
      const imagesToDeleteCount = options?.imagesToDelete?.length || 0;
      const totalImagesAfterUpdate = existingImagesCount - imagesToDeleteCount + newImages.length;
      
      if (totalImagesAfterUpdate === 0) {
        throw new ProductServiceError('Product must have at least one image', 'VALIDATION');
      }

      // Create FormData with image management options
      const formData = createProductFormData(updateData, newImages, options);

      console.log('🔄 Sending update product request with:', {
        productId,
        newImageCount: newImages.length,
        existingImagesCount,
        imagesToDeleteCount,
        price: updateData.price
      });

      const response = await api.put<ApiResponse<{ product: Product }>>(
        `/products/${productId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000,
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            console.log(`Update upload progress: ${percent}%`);
          }
        }
      );

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to update product');
      }

      showSuccess('Product updated successfully');
      return parseProductFromServer(response.data.data.product);
    }, 'Failed to update product');
  },

  // ========== DELETE PRODUCT ==========
  deleteProduct: async (productId: string): Promise<void> => {
    return safeApiCall(async () => {
      const response = await api.delete<ApiResponse>(`/products/${productId}`);

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to delete product');
      }

      showSuccess('Product deleted successfully');
    }, 'Failed to delete product');
  },

  // ========== UPLOAD STANDALONE IMAGES ==========
  uploadImages: async (images: File[]): Promise<UploadImagesResponse> => {
    return safeApiCall(async () => {
      if (images.length === 0) {
        throw new ProductServiceError('No images selected', 'VALIDATION');
      }

      const imageErrors = validateProductImages(images);
      if (imageErrors.length > 0) {
        throw new ProductServiceError(imageErrors.join(', '), 'VALIDATION');
      }

      const formData = new FormData();
      images.forEach(file => {
        formData.append('productImages', file); // Field name MUST be plural
      });

      console.log('🔄 Uploading standalone images:', images.length);

      const response = await api.post<ApiResponse<UploadImagesResponse>>(
        '/products/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000
        }
      );

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to upload images');
      }

      showSuccess(`Successfully uploaded ${images.length} image(s)`);
      return response.data.data;
    }, 'Failed to upload images');
  },

  // ========== UPDATE PRODUCT STATUS ==========
  updateProductStatus: async (
    productId: string, 
    status: 'active' | 'inactive' | 'draft'
  ): Promise<Product> => {
    return safeApiCall(async () => {
      const response = await api.patch<ApiResponse<{ product: Product }>>(
        `/products/${productId}/status`,
        { status }
      );

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to update product status');
      }

      showSuccess(`Product status updated to ${status}`);
      return parseProductFromServer(response.data.data.product);
    }, 'Failed to update product status');
  },

  // ========== GET STOCK STATUS ==========
  getStockStatus: (inventory: Inventory): { text: string; color: string; className: string } => {
    if (!inventory.trackQuantity) {
      return {
        text: 'In Stock',
        color: '#10B981', // green
        className: 'text-green-600 dark:text-green-400'
      };
    }

    if (inventory.quantity === 0) {
      return {
        text: 'Out of Stock',
        color: '#EF4444', // red
        className: 'text-red-600 dark:text-red-400'
      };
    }

    if (inventory.quantity <= inventory.lowStockAlert) {
      return {
        text: 'Low Stock',
        color: '#F59E0B', // orange
        className: 'text-orange-600 dark:text-orange-400'
      };
    }

    return {
      text: 'In Stock',
      color: '#10B981', // green
      className: 'text-green-600 dark:text-green-400'
    };
  },

  // ========== GET CATEGORIES ==========
  getCategories: async (): Promise<Category[]> => {
    return safeApiCall(async () => {
      const response = await api.get<ApiResponse<{ categories: Category[] }>>('/products/categories');

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to fetch categories');
      }

      return response.data.data.categories;
    }, 'Failed to load categories');
  },

  // ========== GET FEATURED PRODUCTS ==========
  getFeaturedProducts: async (limit: number = 8): Promise<Product[]> => {
    return safeApiCall(async () => {
      const response = await api.get<ApiResponse<{ products: Product[] }>>(
        '/products/featured',
        { params: { limit } }
      );

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to fetch featured products');
      }

      return response.data.data.products.map(parseProductFromServer);
    }, 'Failed to load featured products');
  },

  // ========== GET RELATED PRODUCTS ==========
  getRelatedProducts: async (productId: string, limit: number = 4): Promise<Product[]> => {
    return safeApiCall(async () => {
      const response = await api.get<ApiResponse<{ products: Product[] }>>(
        `/products/${productId}/related`,
        { params: { limit } }
      );

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to fetch related products');
      }

      return response.data.data.products.map(parseProductFromServer);
    }, 'Failed to load related products');
  },

  // ========== GET COMPANY PRODUCTS ==========
  getCompanyProducts: async (
    companyId: string, 
    filters: Partial<ProductFilters> = {}
  ): Promise<ProductsResponse> => {
    return safeApiCall(async () => {
      if (!companyId || companyId === 'undefined' || companyId === 'null') {
        throw new ProductServiceError('Invalid company ID', 'VALIDATION');
      }

      const params = {
        page: filters.page || 1,
        limit: filters.limit || 12,
        status: filters.status || 'active',
        category: filters.category,
        featured: filters.featured,
        search: filters.search,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sort: filters.sort || 'newest'
      };

      const response = await api.get<ApiResponse<ProductsResponse>>(
        `/products/company/${companyId}`,
        { params }
      );

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to fetch company products');
      }

      const data = response.data.data;
      return {
        ...data,
        products: data.products.map(parseProductFromServer),
        company: data.company,
        stats: data.stats
      };
    }, 'Failed to load company products');
  },

  // ========== GET UPLOAD STATS ==========
  getUploadStats: async () => {
    return safeApiCall(async () => {
      const response = await api.get<ApiResponse>('/products/stats/uploads');
      return response.data;
    }, 'Failed to fetch upload statistics');
  },

  // ========== UTILITY METHODS ==========
  
  // Generate Cloudinary image URL with transformations
  getImageUrl: (
    image: ProductImage | string | undefined,
    options?: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: 'auto' | 'webp' | 'jpg' | 'png';
    }
  ): string => {
    const defaultImage = '/images/product-placeholder.jpg';

    if (!image) return defaultImage;

    if (typeof image === 'string') {
      if (!image) return defaultImage;
      
      if (image.includes('cloudinary.com') && options) {
        return productService.applyCloudinaryTransformations(image, options);
      }
      
      return image;
    }

    const imageUrl = image.secure_url || image.url;
    if (!imageUrl) return defaultImage;

    if (imageUrl.includes('cloudinary.com') && options) {
      return productService.applyCloudinaryTransformations(imageUrl, options);
    }

    return imageUrl;
  },

  // Apply Cloudinary transformations to URL
  applyCloudinaryTransformations: (
    url: string, 
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    }
  ): string => {
    const transformations: string[] = [];

    if (options.width && options.height && options.crop) {
      transformations.push(`w_${options.width},h_${options.height},c_${options.crop}`);
    } else if (options.width) {
      transformations.push(`w_${options.width}`);
    } else if (options.height) {
      transformations.push(`h_${options.height}`);
    }

    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }

    if (options.format) {
      transformations.push(`f_${options.format}`);
    }

    if (transformations.length > 0) {
      return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
    }

    return url;
  },

  // Format price for display
  formatPrice: (price: Price): string => {
    if (price.displayPrice) {
      return price.displayPrice;
    }

    const amount = typeof price.amount === 'string' ? parseFloat(price.amount) : price.amount;
    
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: price.currency || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return formatter.format(amount || 0);
    } catch {
      return `${price.currency || 'USD'} ${(amount || 0).toFixed(2)}`;
    }
  },

  // Extract Cloudinary public_ids from product images
  extractPublicIds: (images: ProductImage[]): string[] => {
    return images
      .filter(img => img.public_id)
      .map(img => img.public_id);
  },

  // Check if user can manage product
  canManageProduct: (product: Product, currentUser: any): boolean => {
    if (!currentUser) return false;

    if (currentUser.role === 'admin') return true;

    if (currentUser.role === 'company') {
      const companyId = typeof product.companyId === 'string'
        ? product.companyId
        : product.companyId?._id;

      const userCompanyId = currentUser.companyId || currentUser.company?._id;
      return userCompanyId === companyId;
    }

    return false;
  },

  // Get default product data for forms
  getDefaultProductData: (): CreateProductData => ({
    name: '',
    description: '',
    shortDescription: '',
    price: {
      amount: '', // Empty string instead of 0
      currency: 'USD',
      unit: 'unit'
    },
    category: '',
    subcategory: '',
    tags: [],
    specifications: [{ key: '', value: '' }],
    featured: false,
    metaTitle: '',
    metaDescription: '',
    sku: '',
    inventory: {
      quantity: 0,
      trackQuantity: false,
      lowStockAlert: 10
    }
  }),

  // Validate product before submission
  validateProduct: (productData: Partial<CreateProductData>): { isValid: boolean; errors: string[] } => {
    const errors = validateProductData(productData);
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate product images before upload
  validateProductImages: (files: File[]): string[] => {
    return validateProductImages(files);
  },

  // Prepare update data with existing images
  prepareUpdateData: (
    currentProduct: Product,
    updatedData: UpdateProductData,
    newImages: File[] = []
  ): {
    productData: UpdateProductData;
    existingImages: string[];
    imagesToDelete: string[];
    newImages: File[];
    primaryImageIndex?: number;
  } => {
    const currentImageIds = productService.extractPublicIds(currentProduct.images);

    let existingImages = currentImageIds;
    let imagesToDelete: string[] = [];

    if (updatedData.existingImages) {
      existingImages = updatedData.existingImages;
      imagesToDelete = currentImageIds.filter(id => !existingImages.includes(id));
    }

    const currentPrimaryIndex = currentProduct.images.findIndex(img => img.isPrimary);
    const primaryImageIndex = updatedData.primaryImageIndex !== undefined
      ? updatedData.primaryImageIndex
      : (currentPrimaryIndex >= 0 ? currentPrimaryIndex : 0);

    const { existingImages: _, imagesToDelete: __, primaryImageIndex: ___, ...productData } = updatedData;

    return {
      productData,
      existingImages,
      imagesToDelete,
      newImages,
      primaryImageIndex
    };
  },

  // Create image preview URLs
  createImagePreviews: (files: File[]): string[] => {
    return files.map(file => URL.createObjectURL(file));
  },

  // Clean up image preview URLs
  cleanupImagePreviews: (previewUrls: string[]): void => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
  },

  // Format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Toast helpers
  showToastError,
  showSuccess,
  showInfo,
  showWarning,

  // FormData helper - export for testing
  createProductFormData
};

// Export toast helpers separately for convenience
export const productToast = {
  error: showToastError,
  success: showSuccess,
  info: showInfo,
  warning: showWarning,
};

// Export Cloudinary transformation helper
export const applyCloudinaryTransformations = productService.applyCloudinaryTransformations;