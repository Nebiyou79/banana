/**
 * frontend/src/pages/products/index.tsx  — Public marketplace page
 */
'use client';
import React, { useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useProducts, useFeaturedProducts, useProductCategories, useSaveProduct, useUnsaveProduct } from '@/hooks/useProducts';
import { ProductCard, ProductCardSkeleton } from '@/components/Products/ProductCard';
import { ProductFilter } from '@/components/Products/ProductFilter';
import { ProductFilters, Product } from '@/services/productService';
import { Bookmark, ShoppingBag, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function ProductMarketplacePage() {
  const router   = useRouter();
  const { user } = useAuth();

  const [filters, setFilters] = useState<ProductFilters>({ status: 'active' });
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const { data: productsData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } = useProducts(filters);
  const { data: featured = [] } = useFeaturedProducts(6);
  const { data: categories = [] } = useProductCategories();

  const saveProduct   = useSaveProduct();
  const unsaveProduct = useUnsaveProduct();

  const allProducts: Product[] = useMemo(
    () => productsData?.pages.flatMap(p => p.products) ?? [],
    [productsData]
  );

  const handleToggleSave = useCallback((id: string, isSaved: boolean) => {
    if (!user) { router.push('/auth/login'); return; }
    if (isSaved) { unsaveProduct.mutate(id); setSavedIds(s => { const n=new Set(s); n.delete(id); return n; }); }
    else         { saveProduct.mutate(id);   setSavedIds(s => new Set([...s, id])); }
  }, [user, router, saveProduct, unsaveProduct]);

  return (
    <DashboardLayout>
      <Head><title>Marketplace — Banana</title></Head>
      <div className={cn('min-h-screen', colorClasses.bg.primary, 'dark:bg-gray-950')}>

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0A2540] to-[#1a3f68] py-12 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Marketplace</h1>
            <p className="text-[#FBBF24]/80 text-base sm:text-lg mb-6">Discover products from verified Ethiopian businesses</p>
            {user && (
              <button onClick={() => router.push('/products/saved')} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-[#FBBF24] transition-colors">
                <Bookmark className="h-4 w-4" /> View saved products
              </button>
            )}
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 py-8">
          {/* Filters */}
          <div className={cn('p-4 rounded-xl border mb-6', colorClasses.border.gray200, colorClasses.bg.primary, 'dark:bg-gray-900 dark:border-gray-700')}>
            <ProductFilter
              filters={filters}
              onFiltersChange={f => setFilters({ ...f, status: 'active' })}
              showLayoutToggle
              showFeaturedFilter
              showCategoryFilter
            />
          </div>

          {/* Featured */}
          {featured.length > 0 && !filters.search && !filters.category && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn('text-xl font-bold', colorClasses.text.primary, 'dark:text-white')}>⭐ Featured Products</h2>
                <button onClick={() => setFilters(f => ({ ...f, featured: true }))} className={cn('text-sm font-semibold flex items-center gap-1', colorClasses.text.goldenMustard)}>
                  See all <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {featured.map(p => (
                  <ProductCard key={p._id} variant="public" product={p} isSaved={savedIds.has(p._id)} onToggleSave={handleToggleSave} />
                ))}
              </div>
            </div>
          )}

          {/* Category quick-nav */}
          {categories.length > 0 && !filters.category && !filters.search && (
            <div className="mb-8">
              <h2 className={cn('text-xl font-bold mb-4', colorClasses.text.primary, 'dark:text-white')}>Browse by Category</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {categories.slice(0, 14).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilters(f => ({ ...f, category: cat.id, subcategory: undefined }))}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all hover:-translate-y-0.5 hover:shadow-md',
                      colorClasses.border.gray200, colorClasses.bg.primary,
                      'dark:bg-gray-900 dark:border-gray-700 dark:hover:border-[#F1BB03]/40',
                    )}
                  >
                    <span className="text-2xl">{{'electronics':'💻','fashion':'👕','home_living':'🏠','food_beverage':'🍽️','health_beauty':'❤️','sports':'⚽','construction':'🔧','automotive':'🚗','office_stationery':'💼','art_crafts':'🎨','books_media':'📚','agriculture':'🌿','industrial':'⚙️','other':'📦'}[cat.id]??'📦'}</span>
                    <span className={cn('text-xs font-medium', colorClasses.text.primary, 'dark:text-gray-300')}>{cat.label}</span>
                    {cat.count != null && cat.count > 0 && <span className={cn('text-[10px]', colorClasses.text.secondary)}>{cat.count}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <p className={cn('text-sm', colorClasses.text.secondary, 'dark:text-gray-400')}>
              {isLoading ? 'Loading…' : `${allProducts.length.toLocaleString()} products`}
            </p>
            {Object.keys(filters).filter(k => k !== 'status').length > 0 && (
              <button onClick={() => setFilters({ status: 'active' })} className={cn('text-sm', colorClasses.text.secondary, 'hover:text-red-500 transition-colors')}>
                Clear filters
              </button>
            )}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({length:10}).map((_,i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : allProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <ShoppingBag className={cn('h-16 w-16', colorClasses.text.secondary)} />
              <h3 className={cn('text-xl font-semibold', colorClasses.text.primary, 'dark:text-white')}>No products found</h3>
              <p className={cn('text-sm', colorClasses.text.secondary)}>Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allProducts.map(p => (
                  <ProductCard key={p._id} variant="public" product={p} isSaved={savedIds.has(p._id)} onToggleSave={handleToggleSave} />
                ))}
              </div>
              {hasNextPage && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className={cn('px-8 py-3 rounded-xl border font-semibold text-sm transition-colors',colorClasses.border.goldenMustard,colorClasses.text.goldenMustard,'hover:bg-[#F1BB03]/10 dark:hover:bg-[#F1BB03]/10')}
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