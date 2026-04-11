import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  productService,
  Product,
  ProductFilters,
  CreateProductData,
  UpdateProductData,
  ImageAsset,
} from '../services/productService';
import { useAuthStore } from '../store/authStore';
import { useToast } from './useToast';

// ── Query keys ─────────────────────────────────────────────────────────────────

export const productKeys = {
  all: ['products'] as const,
  list: (filters?: ProductFilters) => [...productKeys.all, 'list', filters] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  company: (companyId: string) => [...productKeys.all, 'company', companyId] as const,
  related: (id: string) => [...productKeys.all, 'related', id] as const,
};

// ── useProducts — infinite scroll public marketplace ──────────────────────────

export const useProducts = (filters?: Omit<ProductFilters, 'page'>) => {
  return useInfiniteQuery({
    queryKey: productKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      productService.getProducts({ ...filters, page: pageParam as number, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { current, pages } = lastPage.pagination;
      return current < pages ? current + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ── useProduct — single product ────────────────────────────────────────────────

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// ── useFeaturedProducts ────────────────────────────────────────────────────────

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: productKeys.featured(),
    queryFn: () => productService.getFeaturedProducts(),
    staleTime: 10 * 60 * 1000,
  });
};

// ── useProductCategories ──────────────────────────────────────────────────────

export const useProductCategories = () => {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () => productService.getCategories(),
    staleTime: 60 * 60 * 1000,
  });
};

// ── useCompanyProducts ────────────────────────────────────────────────────────

export const useCompanyProducts = (companyId?: string, filters?: Omit<ProductFilters, 'page'>) => {
  const { user } = useAuthStore();
  const resolvedId = companyId ?? (user?.company as any)?._id ?? '';

  return useInfiniteQuery({
    queryKey: productKeys.company(resolvedId),
    queryFn: ({ pageParam = 1 }) =>
      productService.getCompanyProducts(resolvedId, { ...filters, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { current, pages } = lastPage.pagination;
      return current < pages ? current + 1 : undefined;
    },
    enabled: !!resolvedId,
    staleTime: 5 * 60 * 1000,
  });
};

// ── useRelatedProducts ────────────────────────────────────────────────────────

export const useRelatedProducts = (id: string) => {
  return useQuery({
    queryKey: productKeys.related(id),
    queryFn: () => productService.getRelatedProducts(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// ── useCreateProduct ──────────────────────────────────────────────────────────

interface CreateProductVars {
  data: CreateProductData;
  imageAssets: ImageAsset[];
}

export const useCreateProduct = () => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: ({ data, imageAssets }: CreateProductVars) =>
      productService.createProduct(data, imageAssets),
    onSuccess: () => {
      const companyId = (user?.company as any)?._id ?? '';
      qc.invalidateQueries({ queryKey: productKeys.company(companyId) });
      qc.invalidateQueries({ queryKey: productKeys.all });
      showSuccess('Product created successfully!');
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message ?? 'Failed to create product.');
    },
  });
};

// ── useUpdateProduct ──────────────────────────────────────────────────────────

interface UpdateProductVars {
  id: string;
  data: UpdateProductData;
  imageAssets?: ImageAsset[];
  existingImages?: string[];
  imagesToDelete?: string[];
  primaryImageIndex?: number;
}

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: ({ id, data, imageAssets, existingImages, imagesToDelete, primaryImageIndex }: UpdateProductVars) =>
      productService.updateProduct(id, data, imageAssets, { existingImages, imagesToDelete, primaryImageIndex }),
    onSuccess: (_, vars) => {
      const companyId = (user?.company as any)?._id ?? '';
      qc.invalidateQueries({ queryKey: productKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: productKeys.company(companyId) });
      showSuccess('Product updated successfully!');
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message ?? 'Failed to update product.');
    },
  });
};

// ── useUpdateProductStatus ────────────────────────────────────────────────────

interface UpdateStatusVars {
  id: string;
  status: 'active' | 'draft' | 'out_of_stock' | 'discontinued';
}

export const useUpdateProductStatus = () => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: UpdateStatusVars) =>
      productService.updateProductStatus(id, status),
    onSuccess: (_, vars) => {
      const companyId = (user?.company as any)?._id ?? '';
      qc.invalidateQueries({ queryKey: productKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: productKeys.company(companyId) });
      showSuccess(`Status updated to ${vars.status}`);
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message ?? 'Failed to update status.');
    },
  });
};

// ── useDeleteProduct ──────────────────────────────────────────────────────────

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: (id: string) =>
      new Promise<void>((resolve, reject) => {
        Alert.alert(
          'Delete Product',
          'Are you sure you want to delete this product? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('cancelled')) },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => productService.deleteProduct(id).then(resolve).catch(reject),
            },
          ]
        );
      }),
    onSuccess: () => {
      const companyId = (user?.company as any)?._id ?? '';
      qc.invalidateQueries({ queryKey: productKeys.company(companyId) });
      qc.invalidateQueries({ queryKey: productKeys.all });
      showSuccess('Product deleted.');
    },
    onError: (err: any) => {
      if (err?.message !== 'cancelled') {
        showError(err?.response?.data?.message ?? 'Failed to delete product.');
      }
    },
  });
};
