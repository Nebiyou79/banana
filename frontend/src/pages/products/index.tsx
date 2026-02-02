// pages/dashboard/products/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  productService, 
  Product, 
  ProductsResponse, 
  ProductFilters,
  Category 
} from '@/services/productService';
import { PublicProductCard } from '@/components/Products/ProductCard';
import { ProductFilter } from '@/components/Products/ProductFilter';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ShoppingBag, 
  Grid3x3,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Package
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { colors, getTheme, colorClasses } from '@/utils/color';

// Skeleton loader component matching ProductCard dimensions
const ProductCardSkeleton = () => {
  const theme = getTheme('light');
  
  return (
    <div 
      className="relative overflow-hidden rounded-xl min-h-[360px] animate-pulse"
      style={{
        backgroundColor: theme.bg.white,
        borderColor: theme.border.gray100,
        borderWidth: '1px'
      }}
    >
      {/* Image skeleton */}
      <div 
        className="h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"
      />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Company info skeleton */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        </div>
        
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
        
        {/* Price skeleton */}
        <div className="h-6 w-20 bg-gray-200 rounded" />
      </div>
    </div>
  );
};

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    status: 'active', // Only active products for public marketplace
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 12
  });
  const [stats, setStats] = useState({
    totalViews: 0,
    activeProducts: 0,
    avgPrice: 0
  });

  // Get current theme
  const theme = getTheme('light');

  // Extract unique tags from all products for filtering
  const availableTags = React.useMemo(() => {
    const allTags = products.flatMap(product => product.tags || []);
    return Array.from(new Set(allTags)).filter(tag => tag.trim() !== '');
  }, [products]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Always enforce status="active" for public marketplace
      const marketplaceFilters = {
        ...filters,
        status: 'active',
      };

      const response: ProductsResponse = await productService.getProducts(marketplaceFilters);
      
      setProducts(response.products || []);
      setPagination(response.pagination || {
        current: 1,
        pages: 1,
        total: 0,
        limit: 12
      });
      setStats(response.stats || {
        totalViews: 0,
        activeProducts: 0,
        avgPrice: 0
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products. Please try again.',
        variant: 'destructive',
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await productService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Info',
        description: 'Categories could not be loaded.',
        variant: 'default',
      });
    }
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Calculate marketplace stats
  const featuredCount = products.filter(p => p.featured).length;
  const inStockCount = products.filter(p => {
    if (!p.inventory.trackQuantity) return true;
    return p.inventory.quantity > 0;
  }).length;

  // Empty state
  if (!loading && products.length === 0 && !filters.search && !filters.category) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-2xl font-bold ${colorClasses.text.darkNavy}`}>
                  Marketplace
                </h1>
                <p className={`${colorClasses.text.gray800} mt-2`}>
                  Browse products from various companies
                </p>
              </div>
              
              <Button
                variant="outline"
                className="flex items-center gap-2"
                style={{
                  borderColor: theme.border.gray400,
                  color: theme.text.gray800
                }}
                onClick={() => fetchProducts()}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Empty State */}
          <div 
            className="rounded-2xl border-dashed border-2 p-12 text-center"
            style={{
              borderColor: theme.border.gray400,
              backgroundColor: theme.bg.gray100
            }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.goldenMustard }}
            >
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${colorClasses.text.darkNavy}`}>
              No Products Available
            </h3>
            <p className={`mb-6 ${colorClasses.text.gray800}`}>
              The marketplace is currently empty. Check back soon for new products!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => fetchProducts()}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: colors.goldenMustard,
                  color: colors.white
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Marketplace
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${colorClasses.text.darkNavy}`}>
                Marketplace
              </h1>
              <p className={`${colorClasses.text.gray800} mt-2`}>
                Browse and discover products from various companies
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className="flex items-center gap-1"
                style={{
                  borderColor: theme.border.gray400,
                  color: theme.text.gray800
                }}
              >
                <Package className="h-3 w-3" />
                {pagination.total} products
              </Badge>
              <Badge 
                variant="outline"
                className="flex items-center gap-1"
                style={{
                  borderColor: colors.green,
                  color: colors.green
                }}
              >
                <TrendingUp className="h-3 w-3" />
                {stats.totalViews.toLocaleString()} views
              </Badge>
            </div>
          </div>
        </div>

        {/* Marketplace Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: theme.bg.white,
              borderColor: theme.border.gray100,
              borderWidth: '1px'
            }}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm ${colorClasses.text.gray800}`}>Total Products</span>
              <Badge 
                style={{
                  backgroundColor: colors.blue,
                  color: colors.white
                }}
              >
                {pagination.total}
              </Badge>
            </div>
            <p className={`text-2xl font-bold mt-2 ${colorClasses.text.darkNavy}`}>
              {pagination.total}
            </p>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: theme.bg.white,
              borderColor: theme.border.gray100,
              borderWidth: '1px'
            }}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm ${colorClasses.text.gray800}`}>Featured</span>
              <Badge 
                style={{
                  backgroundColor: colors.darkNavy,
                  color: colors.white
                }}
              >
                {featuredCount}
              </Badge>
            </div>
            <p className={`text-2xl font-bold mt-2 ${colorClasses.text.darkNavy}`}>
              {featuredCount}
            </p>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: theme.bg.white,
              borderColor: theme.border.gray100,
              borderWidth: '1px'
            }}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm ${colorClasses.text.gray800}`}>In Stock</span>
              <Badge 
                style={{
                  backgroundColor: colors.green,
                  color: colors.white
                }}
              >
                {inStockCount}
              </Badge>
            </div>
            <p className={`text-2xl font-bold mt-2 ${colorClasses.text.darkNavy}`}>
              {inStockCount}
            </p>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: theme.bg.white,
              borderColor: theme.border.gray100,
              borderWidth: '1px'
            }}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm ${colorClasses.text.gray800}`}>Avg Price</span>
              <Badge 
                style={{
                  backgroundColor: colors.goldenMustard,
                  color: colors.white
                }}
              >
                ${stats.avgPrice.toFixed(2)}
              </Badge>
            </div>
            <p className={`text-2xl font-bold mt-2 ${colorClasses.text.darkNavy}`}>
              ${stats.avgPrice.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Product Filter - Note: Categories are passed but filtering by them is disabled in the new ProductFilter */}
        <div className="mb-6">
          <ProductFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableTags={availableTags}
            compact={false}
            layout="grid"
            showLayoutToggle={true}
            onLayoutChange={() => {}} // Layout change can be implemented if needed
            showAdvanced={false}
            onAdvancedToggle={() => {}}
            showStatusFilter={false} // Hide status filter since we only show "active"
            showFeaturedFilter={true}
          />
        </div>

        {/* Products Grid */}
        <div className="mb-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              {/* Featured Products Section */}
              {featuredCount > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5" style={{ color: colors.goldenMustard }} />
                    <h2 className={`text-lg font-semibold ${colorClasses.text.darkNavy}`}>
                      Featured Products
                    </h2>
                    <Badge 
                      style={{
                        backgroundColor: colors.darkNavy,
                        color: colors.white
                      }}
                    >
                      {featuredCount}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products
                      .filter(product => product.featured)
                      .map((product) => (
                        <PublicProductCard
                          key={product._id}
                          product={product}
                          className="h-full"
                        />
                      ))}
                  </div>
                  {featuredCount < products.length && <div className="h-8" />}
                </div>
              )}

              {/* All Products Section */}
              {products.length > featuredCount && (
                <>
                  <h2 className={`text-lg font-semibold mb-4 ${colorClasses.text.darkNavy}`}>
                    All Products
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products
                      .filter(product => !product.featured || featuredCount === 0)
                      .map((product) => (
                        <PublicProductCard
                          key={product._id}
                          product={product}
                          className="h-full"
                        />
                      ))}
                  </div>
                </>
              )}
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t"
                  style={{ borderColor: theme.border.gray100 }}
                >
                  <div className={`text-sm ${colorClasses.text.gray800}`}>
                    Showing {((filters.page || 1) - 1) * (filters.limit || 12) + 1} to{' '}
                    {Math.min((filters.page || 1) * (filters.limit || 12), pagination.total)} of{' '}
                    {pagination.total} products
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange((filters.page || 1) - 1)}
                      disabled={(filters.page || 1) <= 1}
                      style={{
                        borderColor: theme.border.gray400,
                        color: theme.text.gray800
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === (filters.page || 1) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            style={
                              pageNum === (filters.page || 1)
                                ? {
                                    backgroundColor: colors.goldenMustard,
                                    color: colors.white
                                  }
                                : {
                                    borderColor: theme.border.gray400,
                                    color: theme.text.gray800
                                  }
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {pagination.pages > 5 && (
                        <>
                          <span className={`px-2 ${colorClasses.text.gray400}`}>...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.pages)}
                            style={{
                              borderColor: theme.border.gray400,
                              color: theme.text.gray800
                            }}
                          >
                            {pagination.pages}
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange((filters.page || 1) + 1)}
                      disabled={(filters.page || 1) >= pagination.pages}
                      style={{
                        borderColor: theme.border.gray400,
                        color: theme.text.gray800
                      }}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div 
              className="rounded-xl p-8 text-center"
              style={{
                backgroundColor: theme.bg.gray100,
                borderColor: theme.border.gray100,
                borderWidth: '1px'
              }}
            >
              <AlertCircle className="h-12 w-12 mx-auto mb-4"
                style={{ color: theme.text.gray400 }}
              />
              <h3 className={`text-lg font-semibold mb-2 ${colorClasses.text.darkNavy}`}>
                No Products Found
              </h3>
              <p className={`mb-4 ${colorClasses.text.gray800}`}>
                No products match your current filters. Try adjusting your search criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => setFilters({ page: 1, limit: 12, status: 'active' })}
                style={{
                  borderColor: theme.border.gray400,
                  color: theme.text.gray800
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Marketplace Tips Footer */}
        <div 
          className="p-4 rounded-lg"
          style={{
            backgroundColor: theme.bg.gray100,
            borderColor: theme.border.gray100,
            borderWidth: '1px'
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" style={{ color: theme.text.gray400 }} />
              <span className={`text-sm ${colorClasses.text.gray800}`}>
                Marketplace Tips:
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <span className={`text-xs ${colorClasses.text.gray800}`}>
                • Save products for later review
              </span>
              <span className={`text-xs ${colorClasses.text.gray800}`}>
                • Share interesting finds with others
              </span>
              <span className={`text-xs ${colorClasses.text.gray800}`}>
                • Check stock status before contacting
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: colors.green,
                  color: colors.green
                }}
              >
                {inStockCount} in stock
              </Badge>
              <Badge 
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: colors.blue,
                  color: colors.blue
                }}
              >
                {stats.activeProducts} active
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}