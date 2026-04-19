/**
 * frontend/src/hooks/useProducts.ts  (NEW)
 *
 * TanStack Query hooks for the web frontend.
 * Mirrors mobile/src/hooks/useProducts.ts but uses React Query v5 API.
 */
import {
  useInfiniteQuery, useQuery, useMutation, useQueryClient
} from '@tanstack/react-query';
import {
  productService,
  ProductFilters,
  ProductStatus,
  CreateProductData,
  UpdateProductData,
  CategoryItem,
} from '@/services/productService';

// ── Query keys ─────────────────────────────────────────────────────────────────

export const productKeys = {
  all:        ['products']                                   as const,
  list:       (f?: ProductFilters) => [...productKeys.all, 'list', f]     as const,
  featured:   ()                   => [...productKeys.all, 'featured']    as const,
  categories: ()                   => [...productKeys.all, 'categories']  as const,
  detail:     (id: string)         => [...productKeys.all, 'detail', id]  as const,
  company:    (id: string, f?: object) => [...productKeys.all, 'company', id, f] as const,
  related:    (id: string)         => [...productKeys.all, 'related', id] as const,
  saved:      ()                   => [...productKeys.all, 'saved']       as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

export const useProducts = (filters?: Omit<ProductFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey: productKeys.list(filters),
    queryFn:  ({ pageParam = 1 }) =>
      productService.getProducts({ ...filters, page: pageParam as number, limit: filters?.limit ?? 12 }),
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
    queryFn:  () => productService.getProduct(id),
    enabled:  Boolean(id),
    staleTime: 5 * 60 * 1000,
  });

export const useFeaturedProducts = (limit = 8) =>
  useQuery({
    queryKey: productKeys.featured(),
    queryFn:  () => productService.getFeaturedProducts(limit),
    staleTime: 10 * 60 * 1000,
  });

/** Full category hierarchy with live counts from the server */
export const useProductCategories = () =>
  useQuery<CategoryItem[]>({
    queryKey: productKeys.categories(),
    queryFn:  productService.getCategories,
    staleTime: 60 * 60 * 1000,
  });

export const useRelatedProducts = (id: string, limit = 4) =>
  useQuery({
    queryKey: productKeys.related(id),
    queryFn:  () => productService.getRelatedProducts(id, limit),
    enabled:  Boolean(id),
    staleTime: 5 * 60 * 1000,
  });

export const useCompanyProducts = (
  companyId?: string,
  filters?: Partial<ProductFilters>
) =>
  useInfiniteQuery({
    queryKey: productKeys.company(companyId ?? '', filters),
    queryFn:  ({ pageParam = 1 }) =>
      productService.getCompanyProducts(companyId!, { ...filters, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { current, pages } = last.pagination;
      return current < pages ? current + 1 : undefined;
    },
    enabled:   Boolean(companyId),
    staleTime: 5 * 60 * 1000,
  });

export const useSavedProducts = (filters?: { page?: number; limit?: number }) =>
  useInfiniteQuery({
    queryKey: productKeys.saved(),
    queryFn:  ({ pageParam = 1 }) =>
      productService.getSavedProducts({ page: pageParam as number, limit: filters?.limit ?? 12 }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { current, pages } = last.pagination;
      return current < pages ? current + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });

// ── Mutations ──────────────────────────────────────────────────────────────────

export const useSaveProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productService.saveProduct(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(id) });
      qc.invalidateQueries({ queryKey: productKeys.saved() });
    },
  });
};

export const useUnsaveProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productService.unsaveProduct(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(id) });
      qc.invalidateQueries({ queryKey: productKeys.saved() });
    },
  });
};

interface CreateVars { data: CreateProductData; images: File[] }

export const useCreateProduct = (companyId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, images }: CreateVars) =>
      productService.createProduct(data, images),
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: productKeys.company(companyId) });
      qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

interface UpdateVars {
  id: string;
  data: UpdateProductData;
  newImages?: File[];
  existingImages?: string[];
  imagesToDelete?: string[];
  primaryImageIndex?: number;
}

export const useUpdateProduct = (companyId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, newImages, existingImages, imagesToDelete, primaryImageIndex }: UpdateVars) =>
      productService.updateProduct(id, data, newImages, { existingImages, imagesToDelete, primaryImageIndex }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(vars.id) });
      if (companyId) qc.invalidateQueries({ queryKey: productKeys.company(companyId) });
    },
  });
};

export const useUpdateProductStatus = (companyId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) =>
      productService.updateProductStatus(id, status),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(vars.id) });
      if (companyId) qc.invalidateQueries({ queryKey: productKeys.company(companyId) });
    },
  });
};

export const useDeleteProduct = (companyId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: productKeys.company(companyId) });
      qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};
