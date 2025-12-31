/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';
import { toast } from '@/hooks/use-toast';

export interface ProductImage {
  url: string;
  altText: string;
  isPrimary: boolean;
  order: number;
  _id?: string;
  id?: string;
}

export interface Price {
  amount: number;
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
}

export interface Category {
  _id: string;
  name: string;
  count: number;
  subcategories: string[];
}

export interface CreateProductData {
  name: string;
  description: string;
  shortDescription?: string;
  price: Price;
  companyId?: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  specifications?: Specification[];
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  sku?: string;
  inventory?: Partial<Inventory>;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  existingImages?: string[];
  primaryImageIndex?: number;
}

export interface UploadImagesResponse {
  images: ProductImage[];
}

// Enhanced error types for better categorization
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

// Enhanced toast helper with error categorization
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

  // Log detailed error for debugging (but don't show to user)
  if (error.originalError && process.env.NODE_ENV === 'development') {
    console.error('Product Service Error Details:', {
      message: error.message,
      type: error.type,
      originalError: error.originalError
    });
  }
};

// Success toast helper
const showSuccess = (message: string) => {
  toast({
    title: 'Success',
    description: message,
    variant: 'success',
  });
};

// Info toast helper
const showInfo = (message: string) => {
  toast({
    title: 'Info',
    description: message,
    variant: 'info',
  });
};

// Warning toast helper
const showWarning = (message: string) => {
  toast({
    title: 'Warning',
    description: message,
    variant: 'warning',
  });
};

// Enhanced error detection and extraction
const isNetworkError = (error: any): boolean => {
  return (!error.response && error.request) || error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error');
};

const isTimeoutError = (error: any): boolean => {
  return error.code === 'ECONNABORTED' || error.message?.includes('timeout');
};

const isAuthError = (error: any): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

const isValidationError = (error: any): boolean => {
  return error.response?.status === 400 || error.name === 'ValidationError';
};

const extractErrorMessage = (error: any): string => {
  // Handle ProductServiceError instances
  if (error instanceof ProductServiceError) {
    return error.message;
  }

  // Handle network errors
  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Handle timeout errors
  if (isTimeoutError(error)) {
    return 'Request timed out. Please try again.';
  }

  // Handle axios response errors
  if (error.response?.data) {
    const data = error.response.data;

    // Handle array of errors from server
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.join(', ');
    }

    // Handle single error message from server
    if (data.message) {
      return data.message;
    }

    // Handle error string directly
    if (typeof data === 'string') {
      return data;
    }
  }

  // Handle generic Error instances
  if (error.message) {
    return error.message;
  }

  // Fallback message
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

// Safe API call wrapper with error handling
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

// File validation helper for product images
const validateProductImages = (files: File[]): string[] => {
  const errors: string[] = [];

  if (!files || files.length === 0) {
    return errors; // Images are optional for updates
  }

  // Check maximum files per upload
  if (files.length > 12) {
    errors.push('Maximum 12 images allowed per upload');
  }

  files.forEach(file => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml'
    ];
    const maxSize = 15 * 1024 * 1024; // 15MB

    if (!allowedTypes.includes(file.type)) {
      errors.push(`"${file.name}" must be JPEG, PNG, WEBP, GIF, or SVG`);
    }

    if (file.size > maxSize) {
      errors.push(`"${file.name}" must be less than 15MB`);
    }

    if (file.size === 0) {
      errors.push(`"${file.name}" is empty`);
    }
  });

  return errors;
};

// Product data validation helper
const validateProductData = (data: Partial<CreateProductData>): string[] => {
  const errors: string[] = [];

  // Required fields validation
  if (!data.name?.trim()) {
    errors.push('Product name is required');
  }

  if (!data.description?.trim()) {
    errors.push('Product description is required');
  }

  if (!data.category?.trim()) {
    errors.push('Product category is required');
  }

  if (!data.price?.amount || data.price.amount < 0) {
    errors.push('Valid product price is required');
  }

  // Length validations
  if (data.name && data.name.length > 120) {
    errors.push('Product name cannot exceed 120 characters');
  }

  if (data.description && data.description.length > 2000) {
    errors.push('Product description cannot exceed 2000 characters');
  }

  if (data.shortDescription && data.shortDescription.length > 250) {
    errors.push('Short description cannot exceed 250 characters');
  }

  if (data.metaTitle && data.metaTitle.length > 60) {
    errors.push('Meta title cannot exceed 60 characters');
  }

  if (data.metaDescription && data.metaDescription.length > 160) {
    errors.push('Meta description cannot exceed 160 characters');
  }

  // Array limits
  if (data.tags && data.tags.length > 20) {
    errors.push('Maximum 20 tags allowed');
  }

  if (data.specifications && data.specifications.length > 50) {
    errors.push('Maximum 50 specifications allowed');
  }

  return errors;
};

// Optimized payload helper to reduce data size
const optimizeProductPayload = (data: Partial<CreateProductData>): Partial<CreateProductData> => {
  try {
    const optimized: any = { ...data };

    // Remove undefined and empty array fields
    Object.keys(optimized).forEach(key => {
      if (optimized[key] === undefined ||
        (Array.isArray(optimized[key]) && optimized[key].length === 0)) {
        delete optimized[key];
      }
    });

    // Trim strings
    if (optimized.name) optimized.name = optimized.name.trim();
    if (optimized.description) optimized.description = optimized.description.trim();
    if (optimized.shortDescription) optimized.shortDescription = optimized.shortDescription.trim();
    if (optimized.category) optimized.category = optimized.category.trim();
    if (optimized.subcategory) optimized.subcategory = optimized.subcategory.trim();
    if (optimized.metaTitle) optimized.metaTitle = optimized.metaTitle.trim();
    if (optimized.metaDescription) optimized.metaDescription = optimized.metaDescription.trim();
    if (optimized.sku) optimized.sku = optimized.sku.trim();

    // Ensure arrays are properly formatted
    if (optimized.tags) {
      optimized.tags = optimized.tags.map((tag: string) => tag.trim().toLowerCase());
    }

    if (optimized.specifications) {
      optimized.specifications = optimized.specifications.map((spec: Specification) => ({
        key: spec.key.trim(),
        value: spec.value.trim()
      }));
    }

    return optimized;
  } catch (error) {
    throw new ProductServiceError('Failed to optimize product data', 'CLIENT', error);
  }
};

// Helper to create FormData for product with images
const createProductFormData = (productData: Partial<CreateProductData>, images: File[] = []): FormData => {
  const formData = new FormData();

  // Append product data
  Object.entries(productData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    }
  });

  // Append images
  images.forEach(file => {
    formData.append('images', file);
  });

  return formData;
};
export const productToast = {
  error: showToastError,
  success: showSuccess,
  info: showInfo,
  warning: showWarning,
};

export const productService = {
  // Get all products with filters
  getProducts: async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
    return safeApiCall(async () => {
      const response = await api.get<{
        success: boolean;
        message: string;
        data: ProductsResponse;
      }>('/products', { params: filters });

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to fetch products');
      }

      return response.data.data;
    }, 'Failed to load products');
  },

  // Get single product by ID
  getProduct: async (id: string): Promise<Product> => {
    return safeApiCall(async () => {
      const response = await api.get<{
        success: boolean;
        message: string;
        data: { product: Product };
      }>(`/products/${id}`);

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Product not found');
      }

      return response.data.data.product;
    }, 'Failed to load product');
  },

  // Create new product
  createProduct: async (productData: CreateProductData, images: File[] = []): Promise<Product> => {
    return safeApiCall(async () => {
      // Validate images for new product
      if (images.length === 0) {
        throw new ProductServiceError('At least one product image is required', 'VALIDATION');
      }

      const imageErrors = validateProductImages(images);
      if (imageErrors.length > 0) {
        throw new ProductServiceError(imageErrors.join(', '), 'VALIDATION');
      }

      // Validate product data
      const dataErrors = validateProductData(productData);
      if (dataErrors.length > 0) {
        throw new ProductServiceError(dataErrors.join(', '), 'VALIDATION');
      }

      // Optimize payload
      const optimizedData = optimizeProductPayload(productData);
      const formData = createProductFormData(optimizedData, images);

      const response = await api.post<{
        success: boolean;
        message: string;
        data: { product: Product };
      }>('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to create product');
      }

      showSuccess('Product created successfully');
      return response.data.data.product;
    }, 'Failed to create product');
  },

  // Update product
  updateProduct: async (id: string, productData: UpdateProductData, newImages: File[] = []): Promise<Product> => {
    return safeApiCall(async () => {
      const imageErrors = validateProductImages(newImages);
      if (imageErrors.length > 0) {
        throw new ProductServiceError(imageErrors.join(', '), 'VALIDATION');
      }

      // Validate product data
      const dataErrors = validateProductData(productData);
      if (dataErrors.length > 0) {
        throw new ProductServiceError(dataErrors.join(', '), 'VALIDATION');
      }

      // Optimize payload
      const optimizedData = optimizeProductPayload(productData);
      const formData = createProductFormData(optimizedData, newImages);

      const response = await api.put<{
        success: boolean;
        message: string;
        data: { product: Product };
      }>(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to update product');
      }

      showSuccess('Product updated successfully');
      return response.data.data.product;
    }, 'Failed to update product');
  },

  // Delete product
  deleteProduct: async (id: string): Promise<void> => {
    return safeApiCall(async () => {
      const response = await api.delete<{
        success: boolean;
        message: string;
      }>(`/products/${id}`);

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to delete product');
      }

      showSuccess('Product deleted successfully');
    }, 'Failed to delete product');
  },

  // Update product status
  updateProductStatus: async (id: string, status: 'active' | 'inactive' | 'draft'): Promise<Product> => {
    return safeApiCall(async () => {
      const response = await api.patch<{
        success: boolean;
        message: string;
        data: { product: Product };
      }>(`/products/${id}/status`, { status });

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to update product status');
      }

      showSuccess(`Product status updated to ${status}`);
      return response.data.data.product;
    }, 'Failed to update product status');
  },

  // Get product categories
  getCategories: async (): Promise<Category[]> => {
    return safeApiCall(async () => {
      const response = await api.get<{
        success: boolean;
        message: string;
        data: { categories: Category[] };
      }>('/products/categories');

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to fetch categories');
      }

      return response.data.data.categories;
    }, 'Failed to load categories');
  },

  // Get featured products
  getFeaturedProducts: async (limit: number = 8): Promise<Product[]> => {
    return safeApiCall(async () => {
      const response = await api.get<{
        success: boolean;
        message: string;
        data: { products: Product[] };
      }>('/products/featured', { params: { limit } });

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to fetch featured products');
      }

      return response.data.data.products;
    }, 'Failed to load featured products');
  },

  // Get related products
  getRelatedProducts: async (productId: string, limit: number = 4): Promise<Product[]> => {
    return safeApiCall(async () => {
      const response = await api.get<{
        success: boolean;
        message: string;
        data: { products: Product[] };
      }>(`/products/${productId}/related`, { params: { limit } });

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to fetch related products');
      }

      return response.data.data.products;
    }, 'Failed to load related products');
  },

  // Get company products
  // Get company products with better error handling
  getCompanyProducts: async (companyId: string, filters: Partial<ProductFilters> = {}): Promise<ProductsResponse> => {
    return safeApiCall(async () => {
      console.log('📦 Fetching company products for:', companyId, 'with filters:', filters);

      // Clean and validate companyId
      if (!companyId || companyId === 'undefined' || companyId === 'null') {
        throw new ProductServiceError('Invalid company ID', 'VALIDATION');
      }

      // Remove companyId from filters to avoid duplication
      const cleanFilters = { ...filters };
      delete cleanFilters.companyId;

      // Map frontend sort to backend sort
      const sortMap: Record<string, string> = {
        'newest': 'newest',
        'popular': 'popular',
        'price_asc': 'price_asc',
        'price_desc': 'price_desc'
      };

      const sort = sortMap[filters.sortBy || 'newest'] || 'newest';

      // Prepare query params
      const params = {
        ...cleanFilters,
        sort,
        // Ensure page and limit are numbers
        page: filters.page || 1,
        limit: filters.limit || 12
      };

      console.log('📤 API Request:', `/products/company/${companyId}`, params);

      const response = await api.get<{
        success: boolean;
        message: string;
        data: ProductsResponse;
      }>(`/products/company/${companyId}`, {
        params,
        // Add timeout and retry for better reliability
        timeout: 15000,
        validateStatus: (status) => status < 500
      });

      console.log('📥 API Response:', response.status, response.data.success ? 'Success' : 'Error');

      if (!response.data.success) {
        // Handle specific error messages
        const message = response.data.message || 'Failed to fetch company products';

        if (message.includes('Company not found')) {
          throw new ProductServiceError(
            'Company profile not found or has no products',
            'CLIENT',
            response.data,
            true
          );
        }

        throw new ProductServiceError(message, 'CLIENT', response.data);
      }

      // Ensure products array exists
      const data = response.data.data;
      return {
        ...data,
        products: data.products || [],
        pagination: data.pagination || {
          current: 1,
          pages: 1,
          total: 0,
          limit: 12
        }
      };
    }, 'Failed to load company products');
  },

  // Upload product images only
  uploadImages: async (images: File[]): Promise<ProductImage[]> => {
    return safeApiCall(async () => {
      const imageErrors = validateProductImages(images);
      if (imageErrors.length > 0) {
        throw new ProductServiceError(imageErrors.join(', '), 'VALIDATION');
      }

      const formData = new FormData();
      images.forEach(file => {
        formData.append('images', file);
      });

      const response = await api.post<{
        success: boolean;
        message: string;
        data: UploadImagesResponse;
      }>('/products/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new ProductServiceError(response.data.message || 'Failed to upload images');
      }

      showSuccess(`Successfully uploaded ${images.length} image(s)`);
      return response.data.data.images;
    }, 'Failed to upload images');
  },

  // Utility function to generate image URL
  getImageUrl: (imagePath: string): string => {
    if (!imagePath) return '/images/product-placeholder.jpg';

    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // If it starts with /uploads, it's already a proper path
    if (imagePath.startsWith('/uploads/')) {
      return imagePath;
    }

    // If it's just a filename, prepend the uploads path
    if (!imagePath.includes('/')) {
      return `/uploads/products/${imagePath}`;
    }

    // Default case - return as is
    return imagePath;
  },

  // Format price for display
  formatPrice: (price: Price): string => {
    if (price.displayPrice) {
      return price.displayPrice;
    }

    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: price.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return formatter.format(price.amount);
    } catch (error) {
      return `${price.currency} ${price.amount.toFixed(2)}`;
    }
  },

  // Get stock status
  getStockStatus: (inventory: Inventory): { text: string; color: string; className: string } => {
    if (!inventory.trackQuantity) {
      return {
        text: 'In Stock',
        color: '#10B981',
        className: 'text-green-600'
      };
    }

    if (inventory.quantity === 0) {
      return {
        text: 'Out of Stock',
        color: '#EF4444',
        className: 'text-red-600'
      };
    }

    if (inventory.quantity <= inventory.lowStockAlert) {
      return {
        text: 'Low Stock',
        color: '#F59E0B',
        className: 'text-orange-600'
      };
    }

    return {
      text: 'In Stock',
      color: '#10B981',
      className: 'text-green-600'
    };
  },

  // Helper to check if user can manage product (for UI logic)
  canManageProduct: (product: Product, currentUser: any): boolean => {
    if (!currentUser) return false;

    if (currentUser.role === 'admin') return true;

    if (currentUser.role === 'company') {
      // For companies, check if they own the product
      const companyId = typeof product.companyId === 'string'
        ? product.companyId
        : product.companyId?._id;

      // This would need to be implemented based on your auth structure
      // For now, return true for companies (you'll need to implement proper ownership check)
      return true;
    }

    return false;
  },

  // Generate default product data for forms
  getDefaultProductData: (): CreateProductData => ({
    name: '',
    description: '',
    shortDescription: '',
    price: {
      amount: 0,
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
  showToastError,
  showSuccess,
  showInfo,
  showWarning,
};