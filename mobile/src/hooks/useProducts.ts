/**
 * mobile/src/hooks/useProducts.ts  (UPDATED)
 *
 * New hooks:
 *  - useProductCategories       → full category hierarchy from server
 *  - useSaveProduct / useUnsaveProduct
 *  - useSavedProducts
 *
 * Updated hooks:
 *  - useCompanyProducts         → accepts isOwner flag for status filtering
 *  - useUpdateProductStatus     → extended status enum
 */
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  productService,
  Product,
  ProductFilters,
  ProductStatus,
  CreateProductData,
  UpdateProductData,
  ImageAsset,
  CategoryItem,
} from '../services/productService';
import { useAuthStore } from '../store/authStore';
import { useToast } from './useToast';

// ── Query keys ─────────────────────────────────────────────────────────────────

export const productKeys = {
  all:        ['products']                              as const,
  list:       (f?: ProductFilters) => [...productKeys.all, 'list', f]    as const,
  featured:   ()                   => [...productKeys.all, 'featured']   as const,
  categories: ()                   => [...productKeys.all, 'categories'] as const,
  detail:     (id: string)         => [...productKeys.all, 'detail', id] as const,
  company:    (id: string, f?: object) => [...productKeys.all, 'company', id, f] as const,
  related:    (id: string)         => [...productKeys.all, 'related', id] as const,
  saved:      ()                   => [...productKeys.all, 'saved']      as const,
};

// ── Public marketplace ─────────────────────────────────────────────────────────

export const useProducts = (filters?: Omit<ProductFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey: productKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      productService.getProducts({ ...filters, page: pageParam as number, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: last => {
      const { current, pages } = last.pagination;
      return current < pages ? current + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useProduct = (id: string) =>
  useQuery({
    queryKey: productKeys.detail(id),
    queryFn:  () => productService.getProduct(id),
    enabled:  !!id,
    staleTime: 5 * 60 * 1000,
  });

export const useFeaturedProducts = () =>
  useQuery({
    queryKey: productKeys.featured(),
    queryFn:  productService.getFeaturedProducts,
    staleTime: 10 * 60 * 1000,
  });

/** Full category hierarchy with live counts */
export const useProductCategories = () =>
  useQuery<CategoryItem[]>({
    queryKey: productKeys.categories(),
    queryFn:  productService.getCategories,
    staleTime: 60 * 60 * 1000, // categories don't change often
  });

export const useRelatedProducts = (id: string) =>
  useQuery({
    queryKey: productKeys.related(id),
    queryFn:  () => productService.getRelatedProducts(id),
    enabled:  !!id,
    staleTime: 5 * 60 * 1000,
  });

// ── Company products (owner aware) ────────────────────────────────────────────

export const useCompanyProducts = (
  companyId?: string,
  filters?: Omit<ProductFilters, 'page'> & { sort?: string; status?: string }
) => {
  const { user } = useAuthStore();
  const resolvedId = companyId ?? (user?.company as Record<string, string>)?._id ?? '';

  return useInfiniteQuery({
    queryKey: productKeys.company(resolvedId, filters),
    queryFn: ({ pageParam = 1 }) =>
      productService.getCompanyProducts(resolvedId, { ...filters, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: last => {
      const { current, pages } = last.pagination;
      return current < pages ? current + 1 : undefined;
    },
    enabled:   !!resolvedId,
    staleTime: 5 * 60 * 1000,
  });
};

// ── Saved products ─────────────────────────────────────────────────────────────

export const useSavedProducts = (filters?: { page?: number; limit?: number }) =>
  useInfiniteQuery({
    queryKey: productKeys.saved(),
    queryFn:  ({ pageParam = 1 }) =>
      productService.getSavedProducts({ page: pageParam as number, limit: filters?.limit ?? 12 }),
    initialPageParam: 1,
    getNextPageParam: last => {
      const { current, pages } = last.pagination;
      return current < pages ? current + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });

// ── Mutations ──────────────────────────────────────────────────────────────────

export const useSaveProduct = () => {
  const qc = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (id: string) => productService.saveProduct(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(id) });
      qc.invalidateQueries({ queryKey: productKeys.saved() });
      showSuccess('Product saved!');
    },
    onError: (err: Error) => showError(err.message || 'Failed to save product'),
  });
};

export const useUnsaveProduct = () => {
  const qc = useQueryClient();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: (id: string) => productService.unsaveProduct(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(id) });
      qc.invalidateQueries({ queryKey: productKeys.saved() });
      showSuccess('Product removed from saved');
    },
    onError: (err: Error) => showError(err.message || 'Failed to unsave product'),
  });
};

// ── Create / Update / Delete ───────────────────────────────────────────────────

interface CreateVars { data: CreateProductData; imageAssets: ImageAsset[] }

export const useCreateProduct = () => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: ({ data, imageAssets }: CreateVars) =>
      productService.createProduct(data, imageAssets),
    onSuccess: () => {
      const companyId = (user?.company as Record<string, string>)?._id ?? '';
      qc.invalidateQueries({ queryKey: productKeys.company(companyId) });
      qc.invalidateQueries({ queryKey: productKeys.all });
      showSuccess('Product created successfully!');
    },
    onError: (err: Error) => showError(err?.message ?? 'Failed to create product.'),
  });
};

interface UpdateVars {
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
    mutationFn: ({ id, data, imageAssets, existingImages, imagesToDelete, primaryImageIndex }: UpdateVars) =>
      productService.updateProduct(id, data, imageAssets, { existingImages, imagesToDelete, primaryImageIndex }),
    onSuccess: (_, vars) => {
      const companyId = (user?.company as Record<string, string>)?._id ?? '';
      qc.invalidateQueries({ queryKey: productKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: productKeys.company(companyId) });
      showSuccess('Product updated successfully!');
    },
    onError: (err: Error) => showError(err?.message ?? 'Failed to update product.'),
  });
};

interface UpdateStatusVars { id: string; status: ProductStatus }

export const useUpdateProductStatus = () => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: ({ id, status }: UpdateStatusVars) =>
      productService.updateProductStatus(id, status),
    onSuccess: (_, vars) => {
      const companyId = (user?.company as Record<string, string>)?._id ?? '';
      qc.invalidateQueries({ queryKey: productKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: productKeys.company(companyId) });
      showSuccess(`Status updated to ${vars.status}`);
    },
    onError: (err: Error) => showError(err?.message ?? 'Failed to update status.'),
  });
};

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
            { text: 'Delete', style: 'destructive', onPress: () => productService.deleteProduct(id).then(resolve).catch(reject) },
          ]
        );
      }),
    onSuccess: () => {
      const companyId = (user?.company as Record<string, string>)?._id ?? '';
      qc.invalidateQueries({ queryKey: productKeys.company(companyId) });
      qc.invalidateQueries({ queryKey: productKeys.all });
      showSuccess('Product deleted.');
    },
    onError: (err: Error) => {
      if (err?.message !== 'cancelled')
        showError(err?.message ?? 'Failed to delete product.');
    },
  });
};
