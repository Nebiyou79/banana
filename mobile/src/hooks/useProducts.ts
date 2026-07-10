/**
 * mobile/src/hooks/useProducts.ts  (FIXED v3)
 *
 * Critical fixes:
 *
 * 1. useCompanyProducts — enabled condition:
 *    Old: enabled: !!resolvedId  (fires too early, resolvedId='' on first render)
 *    New: enabled: isReady && !!resolvedId
 *    This prevents the query from transitioning disabled→enabled mid-render.
 *
 * 2. useCompanyProducts — data extraction:
 *    The backend returns: { success, data: { products, pagination, company } }
 *    But productService.getCompanyProducts must unwrap to { products, pagination }.
 *    Added debugValidateResponseShape() to catch mismatches instantly.
 *
 * 3. resolveCurrentCompanyId — mirrors useCompanyId logic exactly so
 *    mutation cache invalidation uses the same key the query used.
 *
 * 4. Full debug logging via productDebug utilities (DEV only).
 */

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from '@tanstack/react-query';
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
import { useCompanyId, resolveCompanyId } from './useCompanyId';
import {
  debugLog,
  debugQueryState,
  debugValidateResponseShape,
} from '../utils/productDebug';

// ── resolveCurrentCompanyId — for mutation callbacks (no hooks) ───────────────

const resolveCurrentCompanyId = (user: any): string => resolveCompanyId(user) ?? '';

// ── Query keys ────────────────────────────────────────────────────────────────

export const productKeys = {
  all:        ['products']                                        as const,
  list:       (f?: ProductFilters)     => [...productKeys.all, 'list', f]        as const,
  featured:   ()                       => [...productKeys.all, 'featured']       as const,
  categories: ()                       => [...productKeys.all, 'categories']     as const,
  detail:     (id: string)             => [...productKeys.all, 'detail', id]     as const,
  company:    (id: string, f?: object) => [...productKeys.all, 'company', id, f] as const,
  related:    (id: string)             => [...productKeys.all, 'related', id]    as const,
  saved:      ()                       => [...productKeys.all, 'saved']          as const,
};

// ── Optimistic save/unsave cache helper ───────────────────────────────────────

const toggleProductInCaches = (qc: QueryClient, id: string, nextSaved: boolean) => {
  const updater = (p: Product): Product =>
    p._id === id
      ? { ...p, isSaved: nextSaved, savedCount: Math.max(0, (p.savedCount ?? 0) + (nextSaved ? 1 : -1)) }
      : p;

  qc.setQueryData<Product | undefined>(productKeys.detail(id), (old) =>
    old && old._id === id ? updater(old) : old,
  );

  const rootKeys = [productKeys.all, productKeys.featured(), productKeys.saved()];
  rootKeys.forEach((rk) => {
    qc.getQueriesData({ queryKey: rk }).forEach(([k, v]: [unknown, any]) => {
      if (!v) return;
      if (v.pages) {
        qc.setQueryData(k as any, {
          ...v,
          pages: v.pages.map((pg: any) => ({
            ...pg,
            products: Array.isArray(pg?.products) ? pg.products.map(updater) : pg?.products,
          })),
        });
      } else if (Array.isArray(v)) {
        qc.setQueryData(k as any, v.map(updater));
      }
    });
  });
};

// ── Public marketplace ────────────────────────────────────────────────────────

export const useProducts = (filters?: Omit<ProductFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey: productKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      productService.getProducts({ ...filters, page: pageParam as number, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { current, pages } = last.pagination;
      return current < pages ? current + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useProduct = (id: string) =>
  useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

export const useFeaturedProducts = () =>
  useQuery({
    queryKey: productKeys.featured(),
    queryFn: productService.getFeaturedProducts,
    staleTime: 10 * 60 * 1000,
  });

export const useProductCategories = () =>
  useQuery<CategoryItem[]>({
    queryKey: productKeys.categories(),
    queryFn: productService.getCategories,
    staleTime: 60 * 60 * 1000,
  });

export const useRelatedProducts = (id: string) =>
  useQuery({
    queryKey: productKeys.related(id),
    queryFn: () => productService.getRelatedProducts(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

// ── Company products (FULLY FIXED) ───────────────────────────────────────────

export const useCompanyProducts = (
  companyId?: string,
  filters?: Omit<ProductFilters, 'page'> & { sort?: string; status?: string },
) => {
  const { companyId: fallbackId, isReady } = useCompanyId(true);
  const resolvedId = (companyId?.trim() || fallbackId || '').trim();

  // DEV: log the resolved id and whether the query will fire
  if (__DEV__) {
    debugLog('[QUERY]', 'useCompanyProducts config', {
      passedCompanyId: companyId ?? 'none',
      fallbackId,
      resolvedId: resolvedId || 'EMPTY — query disabled',
      isReady,
      enabled: isReady && !!resolvedId,
      filters,
    });
  }

  return useInfiniteQuery({
    queryKey: productKeys.company(resolvedId, filters),
    queryFn: async ({ pageParam = 1 }) => {
      debugLog('[SERVICE]', `getCompanyProducts(${resolvedId}, page=${pageParam})`);

      const result = await productService.getCompanyProducts(resolvedId, {
        ...filters,
        page: pageParam as number,
      });

      // Validate and log the response shape in DEV
      if (__DEV__) {
        debugValidateResponseShape(`getCompanyProducts page=${pageParam}`, result);
      }

      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { current, pages } = last.pagination;
      return current < pages ? current + 1 : undefined;
    },
    // KEY FIX: only enable when auth has hydrated AND we have a real ID.
    // Without isReady the query would briefly fire with resolvedId=''
    // (disabled), then re-enable when auth hydrates — causing React Query
    // to show isPending=true indefinitely in some timing windows.
    enabled: isReady && !!resolvedId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
};

// ── Saved products ────────────────────────────────────────────────────────────

export const useSavedProducts = (filters?: { page?: number; limit?: number }) =>
  useInfiniteQuery({
    queryKey: productKeys.saved(),
    queryFn: ({ pageParam = 1 }) =>
      productService.getSavedProducts({ page: pageParam as number, limit: filters?.limit ?? 12 }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { current, pages } = last.pagination;
      return current < pages ? current + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });

// ── Save / Unsave ─────────────────────────────────────────────────────────────

export const useSaveProduct = () => {
  const qc = useQueryClient();
  const { showError } = useToast();
  return useMutation({
    mutationFn: (id: string) => productService.saveProduct(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: productKeys.all });
      const prev = qc.getQueriesData({ queryKey: productKeys.all });
      toggleProductInCaches(qc, id, true);
      return { prev };
    },
    onError: (err: Error, _id, ctx) => {
      ctx?.prev?.forEach(([k, v]: any) => qc.setQueryData(k, v));
      showError(err?.message || 'Failed to save product');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.saved() }),
  });
};

export const useUnsaveProduct = () => {
  const qc = useQueryClient();
  const { showError } = useToast();
  return useMutation({
    mutationFn: (id: string) => productService.unsaveProduct(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: productKeys.all });
      const prev = qc.getQueriesData({ queryKey: productKeys.all });
      toggleProductInCaches(qc, id, false);
      qc.setQueriesData({ queryKey: productKeys.saved() }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((pg: any) => ({
            ...pg,
            products: (pg.products ?? []).filter((p: Product) => p._id !== id),
          })),
        };
      });
      return { prev };
    },
    onError: (err: Error, _id, ctx) => {
      ctx?.prev?.forEach(([k, v]: any) => qc.setQueryData(k, v));
      showError(err?.message || 'Failed to unsave product');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.saved() }),
  });
};

// ── Create / Update / Delete ──────────────────────────────────────────────────

interface CreateVars { data: CreateProductData; imageAssets: ImageAsset[] }

export const useCreateProduct = () => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();
  return useMutation({
    mutationFn: ({ data, imageAssets }: CreateVars) =>
      productService.createProduct(data, imageAssets),
    onSuccess: () => {
      const companyId = resolveCurrentCompanyId(user);
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
      productService.updateProduct(id, data, imageAssets, {
        existingImages,
        imagesToDelete,
        primaryImageIndex,
      }),
    onSuccess: (_, vars) => {
      const companyId = resolveCurrentCompanyId(user);
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
      const companyId = resolveCurrentCompanyId(user);
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
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => productService.deleteProduct(id).then(resolve).catch(reject),
            },
          ],
        );
      }),
    onSuccess: () => {
      const companyId = resolveCurrentCompanyId(user);
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