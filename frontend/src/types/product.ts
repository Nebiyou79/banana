export interface ProductImage {
  url: string;
  altText: string;
  isPrimary: boolean;
}

export interface CompanyInfo {
  _id: string;
  name: string;
  logoUrl?: string;
  verified: boolean;
  industry?: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  phoneNumber?: string;
  address?: string;
}

export interface Product {
  _id: string;
  companyId: CompanyInfo;
  name: string;
  description: string;
  shortDescription: string;
  images: ProductImage[];
  category: string;
  subcategory?: string;
  tags: string[];
  specifications: Record<string, string>;
  featured: boolean;
  status: 'active' | 'inactive' | 'draft';
  views: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  shortDescription?: string;
  images: ProductImage[];
  category: string;
  subcategory?: string;
  tags: string[];
  specifications?: Record<string, string>;
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export type UpdateProductData = Partial<CreateProductData>;

export interface ProductsResponse {
  products: Product[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface CompanyProductsResponse {
  products: Product[];
  company: {
    _id: string;
    name: string;
    logoUrl?: string;
    verified: boolean;
    industry?: string;
  };
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface ProductFilters {
  search?: string;
  category?: string;
  subcategory?: string;
  companyId?: string;
  featured?: boolean;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Category {
  name: string;
  count: number;
}

export interface UploadResponse {
  images: ProductImage[];
}