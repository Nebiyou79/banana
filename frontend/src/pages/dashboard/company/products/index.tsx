/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/pages/dashboard/company/products/index.tsx
import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useCompanyProducts, useUpdateProductStatus } from '@/hooks/useProducts';
import { ProductCard, ProductCardSkeleton } from '@/components/Products/ProductCard';
import { ProductFilter } from '@/components/Products/ProductFilter';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function CompanyProductListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const companyId = user?.company ?? user?._id;

  const [filters, setFilters] = useState<Record<string, any>>({});

  const {
    data, isLoading, refetch,
    fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useCompanyProducts(companyId, { ...filters, limit: 20 });

  const updateStatus = useUpdateProductStatus(companyId);

  const products = useMemo(() => data?.pages.flatMap((p: any) => p.products) ?? [], [data]);

  return (
    <DashboardLayout>
      <Head><title>My Products — Company Dashboard</title></Head>
      <div className={cn('min-h-screen', colorClasses.bg.primary, 'dark:bg-gray-950 p-6')}>
        <div className="flex items-center justify-between mb-6">
          <h1 className={cn('text-2xl font-bold', colorClasses.text.primary, 'dark:text-white')}>My Products</h1>
          <button
            onClick={() => router.push('/dashboard/company/products/create')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F1BB03] text-[#0A2540] font-semibold text-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New Product
          </button>
        </div>

        <div className={cn('p-4 rounded-xl border mb-6', colorClasses.border.gray200, colorClasses.bg.primary, 'dark:bg-gray-900 dark:border-gray-700')}>
          <ProductFilter
            filters={filters}
            onFiltersChange={setFilters}
            showStatusFilter
            showFeaturedFilter
            showCategoryFilter
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((p: any) => (
              <ProductCard
                key={p._id}
                variant="owner"
                product={p}
                context="company"
                onProductDeleted={() => refetch()}
                onStatusChange={(id: string, status: string) =>
                  updateStatus.mutate({ id, status: status as any })
                }
              />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className={cn('px-8 py-3 rounded-xl border font-semibold text-sm', colorClasses.border.goldenMustard, colorClasses.text.goldenMustard, 'hover:bg-[#F1BB03]/10')}
            >
              {isFetchingNextPage ? 'Loading…' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}