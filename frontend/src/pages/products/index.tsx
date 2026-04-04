/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/products/index.tsx — Public product browse / marketplace page
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { productService, Product, ProductFilters, Category } from '@/services/productService';
import { PublicProductCard, ProductCardSkeleton } from '@/components/Products/ProductCard';
import { ProductFilter } from '@/components/Products/ProductFilter';
import { CompanyAvatarDisplay } from '@/components/Products/CompanyAvatarDisplay';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/social/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/hooks/use-toast';
import { colors, colorClasses, ThemeMode } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  ChevronLeft,
  ChevronRight,
  X,
  Grid2x2,
  LayoutList,
  TrendingUp,
  Sparkles,
  WifiOff,
  RefreshCw,
  Home,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';

// =====================
// FEATURED BANNER
// =====================
const FeaturedBanner: React.FC<{ product: Product }> = ({ product }) => {
  const company = typeof product.companyId === 'object' ? (product.companyId as any) : null;
  const imageUrl = product.images?.[0]?.secure_url || '';

  return (
    <Link href={`/products/${product._id}`}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative rounded-2xl overflow-hidden border cursor-pointer group',
          colorClasses.border.gray200,
          'dark:border-gray-700',
        )}
        style={{ minHeight: 180 }}
      >
        {imageUrl ? (
          <img
            src={productService.getImageUrl(imageUrl, { width: 800, height: 220, crop: 'fill' })}
            alt={product.name}
            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={cn('w-full h-44 flex items-center justify-center', colorClasses.bg.secondary, 'dark:bg-gray-800')}>
            <Package className={cn('h-12 w-12', colorClasses.text.muted)} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CompanyAvatarDisplay
              companyName={company?.name || product.ownerName || 'Company'}
              avatarUrl={company?.logoUrl || product.ownerAvatarUrl}
              avatarPublicId={company?.avatarPublicId || company?.avatar?.public_id}
              verified={company?.verified}
              size="sm"
            />
            <span className="text-white/80 text-xs truncate">
              {company?.name || product.ownerName || 'Company'}
            </span>
            <Badge className="text-[10px] bg-[#F1BB03] text-[#0A2540] px-1.5 py-0.5 gap-1">
              <Sparkles className="h-2 w-2" />
              Featured
            </Badge>
          </div>
          <h3 className="text-white font-bold text-base sm:text-lg leading-tight line-clamp-1">
            {product.name}
          </h3>
          <p className="text-[#F1BB03] font-semibold text-sm mt-0.5">
            {productService.formatPrice(product.price)}
          </p>
        </div>
      </motion.div>
    </Link>
  );
};

// =====================
// PAGINATION
// =====================
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, totalItems, pageSize, onPageChange }) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const start = (currentPage - 1) * pageSize + 1;
  const end   = Math.min(currentPage * pageSize, totalItems);

  if (breakpoint === 'mobile') {
    return (
      <div className={cn('flex items-center justify-between gap-2 mt-6 pt-4 border-t', colorClasses.border.gray200, 'dark:border-gray-700')}>
        <Button
          variant="outline" size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn('px-3', getTouchTargetSize('md'), colorClasses.border.gray300, colorClasses.text.primary, 'dark:border-gray-600 dark:text-gray-300')}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <span className={cn('text-xs', colorClasses.text.secondary, 'dark:text-gray-400')}>
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline" size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn('px-3', getTouchTargetSize('md'), colorClasses.border.gray300, colorClasses.text.primary, 'dark:border-gray-600 dark:text-gray-300')}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-4 border-t', colorClasses.border.gray200, 'dark:border-gray-700')}>
      <span className={cn('text-xs sm:text-sm order-2 sm:order-1', colorClasses.text.secondary, 'dark:text-gray-400')}>
        Showing {start}–{end} of {totalItems} products
      </span>
      <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
        <Button
          variant="outline" size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn('px-2 sm:px-3', getTouchTargetSize('md'), colorClasses.border.gray300, colorClasses.text.primary, 'dark:border-gray-600 dark:text-gray-300')}
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline ml-1 text-xs">Prev</span>
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p: number;
            if (totalPages <= 5) p = i + 1;
            else if (currentPage <= 3) p = i + 1;
            else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
            else p = currentPage - 2 + i;
            return (
              <Button
                key={p}
                variant={p === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(p)}
                className={cn('w-8 h-8 p-0 text-xs', getTouchTargetSize('md'))}
                style={
                  p === currentPage
                    ? { backgroundColor: colors.goldenMustard, color: '#0A2540', borderColor: colors.goldenMustard }
                    : { borderColor: colors.gray300, color: colors.gray700, backgroundColor: 'transparent' }
                }
              >
                {p}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline" size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn('px-2 sm:px-3', getTouchTargetSize('md'), colorClasses.border.gray300, colorClasses.text.primary, 'dark:border-gray-600 dark:text-gray-300')}
        >
          <span className="hidden sm:inline mr-1 text-xs">Next</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
};

// =====================
// EMPTY STATE
// =====================
const EmptyState: React.FC<{ hasFilters: boolean; onClear: () => void }> = ({ hasFilters, onClear }) => {
  const { getTouchTargetSize } = useResponsive();
  return (
    <div className={cn(
      'rounded-2xl border-dashed border-2 p-10 text-center',
      colorClasses.border.gray300, colorClasses.bg.secondary,
      'dark:border-gray-700 dark:bg-gray-800/30',
    )}>
      <div className={cn('w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center', colorClasses.bg.secondary, 'dark:bg-gray-800')}>
        <Package className={cn('h-8 w-8', colorClasses.text.muted)} />
      </div>
      <h3 className={cn('text-base sm:text-lg font-semibold mb-2', colorClasses.text.primary, 'dark:text-white')}>
        {hasFilters ? 'No Products Match Your Filters' : 'No Products Available'}
      </h3>
      <p className={cn('text-xs sm:text-sm mb-6 max-w-md mx-auto', colorClasses.text.secondary, 'dark:text-gray-400')}>
        {hasFilters ? 'Try adjusting or clearing your search filters.' : 'Check back soon — new products are added regularly.'}
      </p>
      {hasFilters && (
        <Button
          variant="outline" size="sm"
          onClick={onClear}
          className={cn('gap-2', getTouchTargetSize('md'), colorClasses.border.gray300, 'dark:border-gray-600 dark:text-gray-300')}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Clear Filters
        </Button>
      )}
    </div>
  );
};

// =====================
// MAIN PAGE
// =====================
export default function PublicProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { breakpoint, getTouchTargetSize } = useResponsive();

  const [products, setProducts]                 = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories]             = useState<Category[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [loadingFeatured, setLoadingFeatured]   = useState(true);
  const [layout, setLayout]                     = useState<'grid' | 'list'>('grid');
  const [themeMode, setThemeMode]               = useState<ThemeMode>('light');
  const [isOnline, setIsOnline]                 = useState(true);
  const [searchInput, setSearchInput]           = useState('');
  const [filters, setFilters]                   = useState<ProductFilters>({
    page: 1,
    limit: breakpoint === 'mobile' ? 6 : 12,
    status: 'active',
  });
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0, limit: 12 });

  // Stable router ref — prevents router from entering effect deps
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);

  // Online
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem('theme') as ThemeMode;
    if (saved === 'light' || saved === 'dark') setThemeMode(saved);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setThemeMode('dark');
  }, []);

  // Limit on breakpoint change
  useEffect(() => {
    setFilters(prev => ({ ...prev, limit: breakpoint === 'mobile' ? 6 : 12 }));
  }, [breakpoint]);

  // Sync URL query → filters
  const { query } = router;
  useEffect(() => {
    const f: ProductFilters = { page: 1, limit: breakpoint === 'mobile' ? 6 : 12, status: 'active' };
    if (query.search)   { f.search = query.search as string; setSearchInput(query.search as string); }
    if (query.category) f.category = query.category as string;
    if (query.page)     f.page = Number(query.page);
    setFilters(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.search, query.category, query.page]);

  // Fetch products
  const fetchProducts = useCallback(async (activeFilters: ProductFilters) => {
    setLoading(true);
    try {
      const response = await productService.getProducts(activeFilters);
      setProducts(response.products || []);
      setPagination(response.pagination || { current: 1, pages: 1, total: 0, limit: activeFilters.limit || 12 });
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(filters); }, [filters, fetchProducts]);

  // Featured (once)
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    (async () => {
      setLoadingFeatured(true);
      try {
        const r = await productService.getProducts({ featured: true, limit: 3, status: 'active' });
        setFeaturedProducts(r.products || []);
      } catch { /* non-critical */ }
      finally { setLoadingFeatured(false); }
    })();
  }, []);

  // Categories (once)
  useEffect(() => { productService.getCategories().then(setCategories).catch(() => {}); }, []);

  // ── Handlers ──
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setFilters(prev => { const f = { ...prev }; delete f.search; f.page = 1; return f; });
  }, []);

  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    setFilters({ ...newFilters, status: 'active' });
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    setFilters({ page: 1, limit: breakpoint === 'mobile' ? 6 : 12, status: 'active' });
  }, [breakpoint]);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const hasActiveFilters = !!(
    filters.search || filters.category || filters.minPrice ||
    filters.maxPrice || filters.tags?.length || filters.featured !== undefined
  );

  // ── Grid columns — fixed breakpoints as requested ──
  // desktop (≥1106px) = 3 cols, tablet (<1106px) = 2 cols, mobile = 1 col
  // We use Tailwind's lg (1024px) as the closest proxy; for the exact 1106 breakpoint
  // we rely on a custom responsive class (xl starts at 1280) — so:
  // cols-1 → sm:cols-2 → xl:cols-3  (xl is 1280; for 1106 exact, add a custom breakpoint)
  // Using min-[1106px] which Tailwind JIT supports:
  const gridColsClass = layout === 'list'
    ? ''
    : 'grid-cols-1 sm:grid-cols-2 min-[1106px]:grid-cols-3';

  const categoryNames = categories.map(c => (typeof c === 'string' ? c : c.name));

  return (
    <DashboardLayout>
      <Head>
        <title>Marketplace | Browse Products</title>
        <meta name="description" content="Discover and browse products from verified companies on our marketplace." />
      </Head>

      {/* Offline banner */}
      {!isOnline && (
        <div className={cn(
          'sticky top-0 z-50 p-2 text-center text-xs sm:text-sm border-b',
          colorClasses.bg.orangeLight, colorClasses.text.orange, colorClasses.border.orange,
        )}>
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-3 w-3 sm:h-4 sm:w-4" />
            You are offline. Some features may be unavailable.
          </div>
        </div>
      )}

      <div className={cn('min-h-screen', colorClasses.bg.primary, 'dark:bg-gray-950')}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">

          {/* ── BREADCRUMB ── */}
          <nav className="mb-4 sm:mb-5">
            <ol className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap">
              <li>
                <Link href="/" className={cn('flex items-center gap-1 hover:underline', colorClasses.text.secondary, 'dark:text-gray-400')}>
                  <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              </li>
              <li><ChevronRightIcon className={cn('h-3 w-3', colorClasses.text.muted)} /></li>
              <li className={cn('font-medium', colorClasses.text.primary, 'dark:text-white')}>Marketplace</li>
            </ol>
          </nav>

          {/* ── PAGE HEADER ── */}
          <div className="mb-5 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-4">
              <div>
                <h1 className={cn('text-xl sm:text-2xl md:text-3xl font-bold', colorClasses.text.primary, 'dark:text-white')}>
                  Marketplace
                </h1>
                <p className={cn('text-xs sm:text-sm mt-0.5', colorClasses.text.secondary, 'dark:text-gray-400')}>
                  {loading
                    ? 'Loading…'
                    : `${pagination.total.toLocaleString()} product${pagination.total !== 1 ? 's' : ''} available`
                  }
                </p>
              </div>
            </div>

            {/* ── SEARCH BAR ── */}
            <div className="flex items-center gap-2 mb-3">
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <Input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search products…"
                  className={cn(
                    'pl-9 pr-8 text-sm h-9 sm:h-10',
                    colorClasses.border.gray300,
                    'dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder-gray-500',
                  )}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className={cn('h-3.5 w-3.5', colorClasses.text.muted)} />
                  </button>
                )}
              </form>

              {/* Layout toggle */}
              {breakpoint !== 'mobile' && (
                <div className={cn('flex rounded-lg border overflow-hidden', colorClasses.border.gray300, 'dark:border-gray-600')}>
                  <button
                    onClick={() => setLayout('grid')}
                    title="Grid view"
                    className={cn(
                      'p-2 transition-colors',
                      layout === 'grid'
                        ? 'bg-[#F1BB03] text-[#0A2540]'
                        : cn(colorClasses.bg.primary, colorClasses.text.muted, 'dark:bg-gray-800 dark:text-gray-400'),
                    )}
                  >
                    <Grid2x2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setLayout('list')}
                    title="List view"
                    className={cn(
                      'p-2 transition-colors',
                      layout === 'list'
                        ? 'bg-[#F1BB03] text-[#0A2540]'
                        : cn(colorClasses.bg.primary, colorClasses.text.muted, 'dark:bg-gray-800 dark:text-gray-400'),
                    )}
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* ── FILTER BAR (top, horizontal) ── */}
            <div className={cn(
              'rounded-xl border p-3',
              colorClasses.border.gray200,
              colorClasses.bg.primary,
              'dark:bg-gray-900 dark:border-gray-700',
            )}>
              <ProductFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                categories={categories}
                theme={themeMode}
                showFeaturedFilter={true}
                showCategoryFilter={true}
                showStatusFilter={false}
                showLayoutToggle={false}
              />
            </div>
          </div>

          {/* ── FEATURED STRIP ── */}
          {!hasActiveFilters && featuredProducts.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className={cn('h-4 w-4', colorClasses.text.goldenMustard)} />
                <h2 className={cn('text-sm sm:text-base font-semibold', colorClasses.text.primary, 'dark:text-white')}>
                  Featured
                </h2>
              </div>
              <div className={cn('grid gap-3', breakpoint === 'mobile' ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3')}>
                {loadingFeatured
                  ? [1, 2, 3].map(i => (
                      <Skeleton key={i} className={cn('h-44 rounded-2xl', colorClasses.bg.secondary, 'dark:bg-gray-800')} />
                    ))
                  : featuredProducts.map(p => <FeaturedBanner key={p._id} product={p} />)
                }
              </div>
            </div>
          )}

          {/* ── RESULTS HEADER ── */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={cn('h-4 w-4', colorClasses.text.goldenMustard)} />
              <span className={cn('text-xs sm:text-sm font-medium', colorClasses.text.secondary, 'dark:text-gray-400')}>
                {loading
                  ? 'Loading…'
                  : `${pagination.total.toLocaleString()} result${pagination.total !== 1 ? 's' : ''}`
                }
              </span>
            </div>

            {/* Active filter pill count */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={cn(
                  'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border',
                  'border-red-300 text-red-500 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30',
                  'transition-colors',
                )}
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>

          {/* ── PRODUCT GRID ── */}
          {loading ? (
            <div className={cn('grid gap-3 sm:gap-4', gridColsClass)}>
              {Array.from({ length: filters.limit || 12 }).map((_, i) => (
                <ProductCardSkeleton key={i} theme={themeMode} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClear={handleClearFilters} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${filters.page}-${filters.search}-${filters.category}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={
                  layout === 'list'
                    ? 'flex flex-col gap-3'
                    : cn('grid gap-3 sm:gap-4', gridColsClass)
                }
              >
                {products.map(product => (
                  <PublicProductCard
                    key={product._id}
                    product={product}
                    currentUser={user}
                    theme={themeMode}
                    context="public"
                    className={layout === 'list' ? 'w-full' : 'h-full'}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── PAGINATION ── */}
          {!loading && pagination.pages > 1 && (
            <Pagination
              currentPage={filters.page || 1}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              pageSize={filters.limit || 12}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}