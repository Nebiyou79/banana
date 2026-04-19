// frontend/src/pages/products/saved.tsx
import React, { useMemo, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useSavedProducts, useUnsaveProduct } from '@/hooks/useProducts';
import { ProductCard, ProductCardSkeleton } from '@/components/Products/ProductCard';
import { Bookmark } from 'lucide-react';
import { Product } from '@/services/productService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function SavedProductsPage() {
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useSavedProducts();
  const unsave = useUnsaveProduct();

  const products: Product[] = useMemo(() => data?.pages.flatMap(p => p.products) ?? [], [data]);

  const handleUnsave = useCallback((id: string) => unsave.mutate(id), [unsave]);

  return (
    <DashboardLayout>
      <Head><title>Saved Products — Banana</title></Head>
      <div className={cn('min-h-screen', colorClasses.bg.primary, 'dark:bg-gray-950')}>
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Bookmark className={cn('h-6 w-6', colorClasses.text.goldenMustard)} />
            <h1 className={cn('text-2xl font-bold', colorClasses.text.primary, 'dark:text-white')}>Saved Products</h1>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Bookmark className={cn('h-16 w-16', colorClasses.text.secondary)} />
              <h3 className={cn('text-xl font-semibold', colorClasses.text.primary, 'dark:text-white')}>No saved products</h3>
              <p className={cn('text-sm', colorClasses.text.secondary)}>Products you bookmark will appear here</p>
              <button
                onClick={() => router.push('/products')}
                className="px-6 py-2.5 rounded-xl bg-[#F1BB03] text-[#0A2540] font-semibold text-sm"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map(p => (
                  <ProductCard key={p._id} variant="public" product={p} isSaved onToggleSave={handleUnsave} />
                ))}
              </div>
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
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}