/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/products/index.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { companyService, CompanyProfile } from '@/services/companyService';
import {
  productService,
  Product,
  ProductsResponse,
  ProductFilters,
  Category
} from '@/services/productService';
import { OwnerProductCard, ProductCardSkeleton } from '@/components/Products/ProductCard';
import { ProductFilterCompact } from '@/components/Products/ProductFilter';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Plus,
  Package,
  AlertCircle,
  Grid3x3,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Upload,
  Sparkles,
  DollarSign,
  Eye,
  Filter,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { colors, getTheme, ThemeMode, colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/Sheet';
import { cn } from '@/lib/utils';
import { CompanyAvatarDisplay } from '@/components/Products/CompanyAvatarDisplay';

// =====================
// COMPANY HEADER AVATAR
// Thin wrapper: delegates all URL resolution and fallback logic
// to CompanyAvatarDisplay / profileService. No manual img/fallback needed here.
// =====================
const CompanyHeaderAvatar: React.FC<{
  company: CompanyProfile | null;
}> = ({ company }) => (
  <CompanyAvatarDisplay
    companyName={company?.name || 'Company'}
    avatarUrl={company?.logoUrl || (company as any)?.logoFullUrl}
    avatarPublicId={(company as any)?.avatarPublicId || (company as any)?.avatar?.public_id}
    verified={(company as any)?.verified}
    size="md"
  />
);

// =====================
// STATUS CARD COMPONENT
// =====================
const StatusCard: React.FC<{
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div
    className={cn(
      "p-2 sm:p-3 rounded-lg border",
      colorClasses.bg.primary,
      colorClasses.border.gray100
    )}
  >
    <div className="flex items-center justify-between mb-0.5 sm:mb-1">
      <span className={cn("text-xs sm:text-sm", colorClasses.text.secondary)}>
        {label}
      </span>
      {icon || (
        <div
          className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
    <p className={cn("text-sm sm:text-base md:text-lg font-bold truncate", colorClasses.text.primary)}>
      {value}
    </p>
  </div>
);

// =====================
// PAGINATION COMPONENT
// =====================
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, totalItems, pageSize, onPageChange }) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const start = ((currentPage - 1) * pageSize) + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  // Mobile pagination (simplified)
  if (breakpoint === 'mobile') {
    return (
      <div className={cn(
        "flex items-center justify-between gap-2 mt-4 pt-4 border-t",
        colorClasses.border.gray100
      )}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn("px-3", getTouchTargetSize('md'), colorClasses.border.gray400, colorClasses.text.primary)}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>

        <span className={cn("text-xs", colorClasses.text.secondary)}>
          {currentPage} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn("px-3", getTouchTargetSize('md'), colorClasses.border.gray400, colorClasses.text.primary)}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Desktop pagination
  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t",
      colorClasses.border.gray100
    )}>
      <div className={cn("text-xs sm:text-sm order-2 sm:order-1", colorClasses.text.secondary)}>
        Showing {start} to {end} of {totalItems} products
      </div>
      <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn("px-2 sm:px-3", getTouchTargetSize('md'), colorClasses.border.gray400, colorClasses.text.primary)}
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 3) {
              pageNum = i + 1;
            } else if (currentPage <= 2) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 1) {
              pageNum = totalPages - 2 + i;
            } else {
              pageNum = currentPage - 1 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={cn("w-7 h-7 sm:w-8 sm:h-8 p-0", getTouchTargetSize('md'))}
                style={
                  pageNum === currentPage
                    ? {
                      backgroundColor: colors.goldenMustard,
                      color: colors.white,
                      borderColor: colors.goldenMustard
                    }
                    : {
                      borderColor: colors.gray300,
                      color: colors.gray700,
                      backgroundColor: 'transparent'
                    }
                }
              >
                {pageNum}
              </Button>
            );
          })}
          {totalPages > 3 && currentPage < totalPages - 1 && (
            <>
              <span className={cn("px-1 text-xs sm:text-sm", colorClasses.text.muted)}>...</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                className={cn("w-7 h-7 sm:w-8 sm:h-8 p-0", getTouchTargetSize('md'), colorClasses.border.gray400)}
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn("px-2 sm:px-3", getTouchTargetSize('md'), colorClasses.border.gray400, colorClasses.text.primary)}
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
};

// =====================
// EMPTY FILTERS STATE COMPONENT
// =====================
const EmptyFiltersState: React.FC<{
  onClear: () => void;
}> = ({ onClear }) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();

  return (
    <div
      className={cn(
        "rounded-xl p-6 sm:p-8 text-center border",
        colorClasses.bg.secondary,
        colorClasses.border.gray100
      )}
    >
      <AlertCircle className={cn("h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3", colorClasses.text.muted)} />
      <h3 className={cn("text-sm sm:text-base font-semibold mb-1", colorClasses.text.primary)}>
        No Products Found
      </h3>
      <p className={cn("text-xs sm:text-sm mb-3 sm:mb-4", colorClasses.text.secondary)}>
        No products match your current filters. Try adjusting your search criteria.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        className={cn("text-xs sm:text-sm", getTouchTargetSize('md'), colorClasses.border.gray400)}
      >
        <RefreshCw className="h-3 w-3 mr-1 sm:mr-2" />
        Clear Filters
      </Button>
    </div>
  );
};

// =====================
// FOOTER TIPS COMPONENT
// =====================
const FooterTips: React.FC = () => {
  const router = useRouter();
  const { breakpoint, getTouchTargetSize } = useResponsive();

  if (breakpoint === 'mobile') {
    return (
      <div
        className={cn(
          "p-3 rounded-lg border mt-4",
          colorClasses.bg.secondary,
          colorClasses.border.gray100
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3x3 className={cn("h-4 w-4", colorClasses.text.muted)} />
            <span className={cn("text-xs font-medium", colorClasses.text.primary)}>Tips</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/company/products/analytics')}
            className={cn("flex items-center gap-1 text-xs", getTouchTargetSize('md'), colorClasses.text.blue)}
          >
            Analytics
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-3 sm:p-4 rounded-lg border",
        colorClasses.bg.secondary,
        colorClasses.border.gray100
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Grid3x3 className={cn("h-4 w-4", colorClasses.text.muted)} />
          <span className={cn("text-xs sm:text-sm font-medium", colorClasses.text.primary)}>
            Product Management Tips:
          </span>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <span className={cn("text-xs", colorClasses.text.secondary)}>• Keep images high quality</span>
          <span className={cn("text-xs", colorClasses.text.secondary)}>• Update inventory regularly</span>
          <span className={cn("text-xs", colorClasses.text.secondary)}>• Use clear titles</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/company/products/analytics')}
          className={cn("flex items-center gap-1 text-xs", getTouchTargetSize('md'), colorClasses.text.blue)}
        >
          View Analytics
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// =====================
// MAIN PAGE COMPONENT
// =====================
export default function CompanyProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { breakpoint, getTouchTargetSize } = useResponsive();

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: breakpoint === 'mobile' ? 6 : 12,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: breakpoint === 'mobile' ? 6 : 12
  });
  const [stats, setStats] = useState({
    totalViews: 0,
    activeProducts: 0,
    draftProducts: 0,
    avgPrice: 0
  });
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  // Update limit based on breakpoint
  useEffect(() => {
    const newLimit = breakpoint === 'mobile' ? 6 : 12;
    setFilters(prev => ({ ...prev, limit: newLimit }));
  }, [breakpoint]);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setThemeMode(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeMode('dark');
    }
  }, []);

  // Keep a stable ref to router so router.push can be called inside useCallback
  // without adding router to the dependency array — router is not stable between
  // renders and including it causes the callback (and its callers) to re-fire
  // on every navigation event, creating an infinite reload loop on mobile.
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);

  // Fetch company profile
  const fetchCompanyProfile = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const companyData = await companyService.getMyCompany();
      if (!companyData) {
        toast({
          title: 'Company Profile Required',
          description: 'Please complete your company profile first',
          variant: 'destructive',
        });
        routerRef.current.push('/dashboard/company/profile');
        return;
      }
      setCompany(companyData);
    } catch (error) {
      console.error('Error fetching company profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load company profile',
        variant: 'destructive',
      });
    }
  // router intentionally excluded — routerRef.current is used instead.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // Fetch company products
  const fetchCompanyProducts = useCallback(async () => {
    if (!company?._id) return;

    setLoading(true);
    try {
      const companyId = company._id;
      const response: ProductsResponse = await productService.getCompanyProducts(
        companyId,
        filters
      );

      setProducts(response.products || []);
      setPagination(response.pagination || {
        current: 1,
        pages: 1,
        total: 0,
        limit: filters.limit || 12
      });
      setStats(response.stats || {
        totalViews: 0,
        activeProducts: 0,
        draftProducts: 0,
        avgPrice: 0
      });
    } catch (error) {
      console.error('Error fetching company products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [company, filters]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await productService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Handle product deletion refresh
  const handleProductDeleted = useCallback(() => {
    fetchCompanyProducts();
    toast({
      title: 'Product Deleted',
      description: 'Product has been deleted successfully',
      variant: 'default',
    });
  }, [fetchCompanyProducts]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters);
    if (breakpoint === 'mobile') setFilterDrawerOpen(false);
  }, [breakpoint]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({ page: 1, limit: breakpoint === 'mobile' ? 6 : 12 });
    if (breakpoint === 'mobile') setFilterDrawerOpen(false);
  }, [breakpoint]);

  // Initial data loading
  useEffect(() => {
    if (isAuthenticated) {
      fetchCompanyProfile();
      fetchCategories();
    }
  }, [isAuthenticated, fetchCompanyProfile, fetchCategories]);

  // Fetch products when company or filters change
  useEffect(() => {
    if (company?._id) {
      fetchCompanyProducts();
    }
  }, [company, filters, fetchCompanyProducts]);

  // Calculate company stats
  const activeCount = products.filter(p => p.status === 'active').length;
  const draftCount = products.filter(p => p.status === 'draft').length;
  const inactiveCount = products.filter(p => p.status === 'inactive').length;
  const featuredCount = products.filter(p => p.featured).length;

  // Get available tags from products
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    products.forEach(product => {
      product.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [products]);

  // Determine grid columns based on breakpoint
  const getGridCols = () => {
    if (breakpoint === 'mobile') return 'grid-cols-1';
    if (breakpoint === 'tablet') return 'grid-cols-2';
    return 'grid-cols-3'; // Desktop - exactly 3 cards
  };

  // Empty state - no products at all
  if (!loading && products.length === 0 && !filters.search && !filters.category && !filters.tags?.length) {
    return (
      <DashboardLayout requiredRole="company">
        <Head>
          <title>Products | Company Dashboard</title>
        </Head>
        <div className={cn("min-h-screen", colorClasses.bg.primary)}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
            {/* Page Header */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className={cn("text-lg sm:text-xl md:text-2xl font-bold", colorClasses.text.primary)}>
                    Products
                  </h1>
                  <p className={cn("text-xs sm:text-sm mt-0.5 sm:mt-1", colorClasses.text.secondary)}>
                    Manage your company products
                  </p>
                </div>

                <Button
                  onClick={() => router.push('/dashboard/company/products/create')}
                  className={cn("flex items-center gap-2 w-full sm:w-auto justify-center", getTouchTargetSize('lg'), colorClasses.bg.goldenMustard, colorClasses.text.white)}
                  size={breakpoint === 'mobile' ? 'default' : 'sm'}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  Create Product
                </Button>
              </div>
            </div>

            {/* Empty State */}
            <div
              className={cn(
                "rounded-2xl border-dashed border-2 p-6 sm:p-8 text-center",
                colorClasses.border.gray400,
                colorClasses.bg.secondary
              )}
            >
              <div className={cn("w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center", colorClasses.bg.goldenMustard)}>
                <Package className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <h3 className={cn("text-base sm:text-lg font-semibold mb-1 sm:mb-2", colorClasses.text.primary)}>
                No Products Yet
              </h3>
              <p className={cn("text-xs sm:text-sm mb-4 sm:mb-6 max-w-md mx-auto", colorClasses.text.secondary)}>
                Start building your product catalog by adding your first product.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <Button
                  onClick={() => router.push('/dashboard/company/products/create')}
                  className={cn("flex items-center gap-2 w-full sm:w-auto justify-center", getTouchTargetSize('lg'), colorClasses.bg.goldenMustard, colorClasses.text.white)}
                  size={breakpoint === 'mobile' ? 'default' : 'sm'}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  Create Your First Product
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/company/products/import')}
                  className={cn("flex items-center gap-2 w-full sm:w-auto justify-center", getTouchTargetSize('lg'), colorClasses.border.gray400)}
                  size={breakpoint === 'mobile' ? 'default' : 'sm'}
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                  Import Products
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="company">
      <Head>
        <title>{company?.name || 'Company'} Products | Dashboard</title>
        <meta name="description" content="Manage your company products" />
      </Head>

      <div className={cn("min-h-screen", colorClasses.bg.primary)}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
          {/* Page Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <CompanyHeaderAvatar company={company} />
                <div>
                  <h1 className={cn("text-base sm:text-lg md:text-xl font-bold", colorClasses.text.primary)}>
                    {company?.name || 'Company'} Products
                  </h1>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                    <Badge
                      variant="outline"
                      className={cn("flex items-center gap-1 text-[10px] sm:text-xs px-1.5 py-0.5", colorClasses.border.gray400, colorClasses.text.secondary)}
                    >
                      <Package className="h-2 w-2 sm:h-3 sm:w-3" />
                      <span>{pagination.total} total</span>
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("flex items-center gap-1 text-[10px] sm:text-xs px-1.5 py-0.5", colorClasses.border.green, colorClasses.text.green)}
                    >
                      <Eye className="h-2 w-2 sm:h-3 sm:w-3" />
                      <span>{stats.totalViews.toLocaleString()} views</span>
                    </Badge>
                    {featuredCount > 0 && (
                      <Badge
                        variant="outline"
                        className={cn("flex items-center gap-1 text-[10px] sm:text-xs px-1.5 py-0.5", colorClasses.border.goldenMustard, colorClasses.text.goldenMustard)}
                      >
                        <Sparkles className="h-2 w-2 sm:h-3 sm:w-3" />
                        <span>{featuredCount} featured</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/company/products/import')}
                  className={cn("flex items-center gap-2 w-full sm:w-auto justify-center text-xs sm:text-sm", getTouchTargetSize('md'), colorClasses.border.gray400)}
                  size={breakpoint === 'mobile' ? 'default' : 'sm'}
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="sm:hidden">Import</span>
                  <span className="hidden sm:inline">Import</span>
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/company/products/create')}
                  className={cn("flex items-center gap-2 w-full sm:w-auto justify-center text-xs sm:text-sm", getTouchTargetSize('md'), colorClasses.bg.goldenMustard, colorClasses.text.white)}
                  size={breakpoint === 'mobile' ? 'default' : 'sm'}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="sm:hidden">New</span>
                  <span className="hidden sm:inline">New Product</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Status Summary Cards - 2 on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <StatusCard
              label="Active"
              value={activeCount}
              color={colors.green}
            />
            <StatusCard
              label="Draft"
              value={draftCount}
              color={colors.goldenMustard}
            />
            <StatusCard
              label="Inactive"
              value={inactiveCount}
              color={colors.gray400}
            />
            <StatusCard
              label="Avg Price"
              value={`$${stats.avgPrice.toFixed(2)}`}
              icon={<DollarSign className="h-3 w-3" style={{ color: colors.blue }} />}
              color={colors.blue}
            />
          </div>

          {/* Filter Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <ProductFilterCompact
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  availableTags={availableTags}
                  theme={themeMode}
                  showStatusFilter={true}
                  showFeaturedFilter={true}
                  layout={layout}
                  onLayoutChange={setLayout}
                  showLayoutToggle={breakpoint !== 'mobile'}
                />
              </div>
              {breakpoint === 'mobile' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterDrawerOpen(true)}
                  className={cn("relative", getTouchTargetSize('md'), colorClasses.border.gray100)}
                >
                  <Filter className="h-3 w-3" />
                  {Object.keys(filters).filter(k =>
                    k !== 'page' && k !== 'limit' && filters[k as keyof ProductFilters]
                  ).length > 0 && (
                      <span className={cn("absolute -top-1 -right-1 w-2 h-2 rounded-full", colorClasses.bg.goldenMustard)} />
                    )}
                </Button>
              )}
            </div>

            {/* Mobile Filter Drawer */}
            {breakpoint === 'mobile' && (
              <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
                <SheetContent side="bottom" className={cn("h-[80vh] rounded-t-xl p-0", colorClasses.bg.primary)}>
                  <SheetHeader className={cn("p-4 border-b", colorClasses.border.gray100)}>
                    <SheetTitle className={cn("text-base", colorClasses.text.primary)}>Filter Products</SheetTitle>
                  </SheetHeader>
                  <div className="p-4 overflow-y-auto h-[calc(80vh-8rem)]">
                    <ProductFilterCompact
                      filters={filters}
                      onFiltersChange={handleFiltersChange}
                      availableTags={availableTags}
                      theme={themeMode}
                      showStatusFilter={true}
                      showFeaturedFilter={true}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>

          {/* Products Grid - RESPONSIVE: 1 on mobile, 2 on tablet, 3 on desktop */}
          <div className="mb-6 sm:mb-8">
            {loading ? (
              <div className={cn("grid gap-3 sm:gap-4", getGridCols())}>
                {Array.from({ length: filters.limit || 12 }).map((_, index) => (
                  <ProductCardSkeleton key={index} theme={themeMode} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={cn(
                  "grid gap-3 sm:gap-4 md:gap-5",
                  layout === 'grid' ? getGridCols() : "flex flex-col space-y-3"
                )}>
                  {products.map((product) => (
                    <OwnerProductCard
                      key={product._id}
                      product={product}
                      currentUser={user}
                      onProductDeleted={handleProductDeleted}
                      className={layout === 'list' ? "w-full" : "h-full"}
                      context="company"
                      theme={themeMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <Pagination
                    currentPage={filters.page || 1}
                    totalPages={pagination.pages}
                    totalItems={pagination.total}
                    pageSize={filters.limit || (breakpoint === 'mobile' ? 6 : 12)}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            ) : (
              <EmptyFiltersState
                onClear={handleClearFilters}
              />
            )}
          </div>

          {/* Quick Stats Footer */}
          <FooterTips />
        </div>
      </div>
    </DashboardLayout>
  );
}