/* eslint-disable @typescript-eslint/no-explicit-any */
// components/profile/CompanyProductsSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Product, productService } from '@/services/productService';
import { Card } from '@/components/social/ui/Card';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/social/ui/Badge';
import { toast } from 'sonner';
import { CompanyProductDetail } from './CompanyProductDetails';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/social/theme/RoleThemeProvider';
import { getTheme } from '@/utils/color';
import { Package, Star, Tag, Eye, ChevronLeft, RefreshCw, PlusCircle, AlertCircle, Check, Zap, TrendingUp, LayoutGrid, List, ChevronDown, Search, X, ArrowRight, Loader2 } from 'lucide-react';

interface CompanyProductsSectionProps {
  companyId: string;
  companyName: string;
  isOwnCompany?: boolean;
  limit?: number;
  viewMode?: 'grid' | 'list';
  showFilters?: boolean;
  variant?: 'default' | 'marketplace' | 'storefront';
  currentUser?: any;
  themeMode?: 'light' | 'dark';
}

// Product Card Component - Simplified for company view
const CompanyProductCard: React.FC<{
  product: Product;
  onClick: () => void;
  themeMode?: 'light' | 'dark';
}> = ({ product, onClick, themeMode = 'light' }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const theme = getTheme(themeMode);

  const formatPrice = (price: any) => {
    if (!price?.amount) return 'Price on request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(price.amount);
  };

  const getStockStatus = () => {
    if (!product.inventory?.trackQuantity) {
      return { 
        label: 'In Stock', 
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        dot: 'bg-green-500'
      };
    }
    if (product.inventory.quantity > 10) {
      return { 
        label: 'In Stock', 
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        dot: 'bg-green-500'
      };
    }
    if (product.inventory.quantity > 0) {
      return { 
        label: `Low Stock (${product.inventory.quantity})`, 
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        dot: 'bg-amber-500'
      };
    }
    return { 
      label: 'Out of Stock', 
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      dot: 'bg-red-500'
    };
  };

  const stockStatus = getStockStatus();
  const mainImage = product.images?.find(img => img.isPrimary) || product.images?.[0];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer",
        themeMode === 'dark' ? 'border-gray-800 hover:border-blue-500' : 'border-gray-200 hover:border-blue-500',
        isHovered && "shadow-xl transform -translate-y-1"
      )}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
        {mainImage && !imageError ? (
          <img
            src={productService.getImageUrl(mainImage, { width: 400, height: 300, crop: 'fill' })}
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-transform duration-700",
              isHovered && "scale-110"
            )}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Featured Badge */}
        {product.featured && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-linear-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white flex items-center gap-1 shadow-lg">
            <Star className="w-3 h-3 fill-white" />
            Featured
          </div>
        )}

        {/* Status Badge */}
        <div className={cn(
          "absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
          stockStatus.color
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full", stockStatus.dot)} />
          {stockStatus.label}
        </div>

        {/* Price Tag */}
        {product.price?.amount && (
          <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-linear-to-r from-blue-500 to-cyan-500 rounded-lg text-sm font-bold text-white shadow-lg">
            {formatPrice(product.price)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {product.name}
        </h3>

        {product.shortDescription && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* Category & Views */}
        <div className="flex items-center justify-between text-xs">
          {product.category && (
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-500">
              <Tag className="w-3 h-3" />
              <span>{product.category}</span>
              {product.subcategory && <span>· {product.subcategory}</span>}
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-500">
            <Eye className="w-3 h-3" />
            <span>{product.views?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Card Skeleton
const ProductCardSkeleton = ({ themeMode = 'light' }) => (
  <div className={cn(
    "rounded-xl overflow-hidden border animate-pulse",
    themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
  )}>
    <div className="h-48 bg-gray-200 dark:bg-gray-800" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
    </div>
  </div>
);

// Stat Card Component
const StatCard = ({ label, value, icon, color, themeMode = 'light' }: { 
  label: string; 
  value: number | string; 
  icon: React.ReactNode; 
  color: string;
  themeMode?: 'light' | 'dark';
}) => (
  <div className={cn(
    "rounded-xl p-4 border transition-all hover:scale-[1.02]",
    themeMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
    "shadow-sm"
  )}>
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-lg", color)}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
      </div>
    </div>
  </div>
);

export const CompanyProductsSection: React.FC<CompanyProductsSectionProps> = ({
  companyId,
  companyName,
  isOwnCompany = false,
  limit = 12,
  viewMode: initialViewMode = 'grid',
  showFilters = true,
  variant = 'default',
  currentUser,
  themeMode = 'light'
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'featured' | 'active' | 'draft' | 'trending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price_asc' | 'price_desc'>('newest');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stats, setStats] = useState({
    totalViews: 0,
    activeProducts: 0,
    draftProducts: 0,
    totalProducts: 0,
    avgPrice: 0
  });
  const [error, setError] = useState<string | null>(null);

  const theme = getTheme(themeMode);

  const fetchProducts = useCallback(async (pageNum: number = 1, filter: string = activeFilter) => {
    try {
      setLoading(true);
      setError(null);

      if (!companyId || companyId === 'undefined' || companyId === 'null') {
        setError('Invalid company ID');
        setProducts([]);
        setTotalProducts(0);
        return;
      }

      const filters: any = {
        page: pageNum,
        limit,
        sort: sortBy === 'newest' ? 'createdAt:desc' :
          sortBy === 'popular' ? 'views:desc' :
            sortBy === 'price_asc' ? 'price.amount:asc' :
              'price.amount:desc',
      };

      // Add status filter based on active tab
      if (filter === 'featured') {
        filters.featured = true;
        filters.status = 'active';
      } else if (filter === 'draft' && isOwnCompany) {
        filters.status = 'draft';
      } else if (filter === 'active') {
        filters.status = 'active';
      } else if (filter === 'trending') {
        filters.sort = 'views:desc';
        filters.status = 'active';
      } else if (filter === 'all') {
        if (!isOwnCompany) {
          filters.status = 'active';
        }
      }

      if (searchQuery) {
        filters.search = searchQuery;
      }

      console.log('📋 Fetching products for company:', companyId, 'with filters:', filters);

      const response = await productService.getCompanyProducts(companyId, filters);

      if (pageNum === 1) {
        setProducts(response.products || []);
      } else {
        setProducts(prev => [...prev, ...(response.products || [])]);
      }

      setTotalProducts(response.pagination?.total || 0);
      setHasMore(pageNum < (response.pagination?.pages || 0));

      // Calculate stats
      const totalViews = response.products?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;
      const activeProducts = response.products?.filter(p => p.status === 'active').length || 0;
      const draftProducts = response.products?.filter(p => p.status === 'draft').length || 0;
      const totalPrice = response.products?.reduce((sum, p) => sum + Number(p.price?.amount ?? 0), 0) || 0;
      const avgPrice = response.products?.length ? totalPrice / response.products.length : 0;

      setStats({
        totalViews,
        activeProducts,
        draftProducts,
        totalProducts: response.pagination?.total || 0,
        avgPrice
      });

    } catch (error: any) {
      console.error('❌ Failed to fetch products:', error);
      setError(error.message || 'Failed to load products');
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  }, [companyId, limit, sortBy, isOwnCompany, searchQuery, activeFilter]);

  useEffect(() => {
    if (companyId) {
      fetchProducts(1, activeFilter);
    }
  }, [companyId, activeFilter, searchQuery, sortBy, fetchProducts]);

  const handleTabChange = (tab: 'all' | 'featured' | 'active' | 'draft' | 'trending') => {
    setActiveFilter(tab);
    setPage(1);
    setSelectedProduct(null);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  };

  const handleProductDeleted = () => {
    toast.success('Product deleted successfully');
    fetchProducts(1, activeFilter);
    setSelectedProduct(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1, activeFilter);
  };

  const handleRefresh = () => {
    setPage(1);
    setSearchQuery('');
    setActiveFilter('all');
    setSelectedProduct(null);
    setError(null);
    fetchProducts(1, 'all');
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleBackToList = () => {
    setSelectedProduct(null);
  };

  const featuredProducts = products.filter(product => product.featured && product.status === 'active');
  const trendingProducts = products.filter(product => (product.views || 0) > 100 && product.status === 'active');

  // If a product is selected, show the detail view
  if (selectedProduct) {
    return (
      <div className="space-y-4">
        <Button
          onClick={handleBackToList}
          variant="ghost"
          size="sm"
          className="mb-2 group"
        >
          <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </Button>
        <CompanyProductDetail
          product={selectedProduct}
          isOwnCompany={isOwnCompany}
          currentUser={currentUser}
          onProductDeleted={handleProductDeleted}
          onClose={handleBackToList}
          themeMode={themeMode}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {totalProducts > 0 
              ? `Showing ${products.length} of ${totalProducts} products`
              : 'Browse products from this company'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          
          {isOwnCompany && (
            <Button
              onClick={() => window.location.href = '/dashboard/company/products/create'}
              className="bg-linear-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg"
              size="sm"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className={cn(
          "p-4 rounded-lg flex items-center gap-3",
          themeMode === 'dark' ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
        )}>
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      )}

      {/* Stats Overview */}
      {totalProducts > 0 && !error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total Products"
            value={stats.totalProducts}
            icon={<Package className="w-4 h-4 text-white" />}
            color="bg-linear-to-r from-blue-500 to-cyan-500"
            themeMode={themeMode}
          />
          <StatCard
            label="Active"
            value={stats.activeProducts}
            icon={<Check className="w-4 h-4 text-white" />}
            color="bg-linear-to-r from-green-500 to-emerald-500"
            themeMode={themeMode}
          />
          {isOwnCompany && (
            <StatCard
              label="Drafts"
              value={stats.draftProducts}
              icon={<Zap className="w-4 h-4 text-white" />}
              color="bg-linear-to-r from-amber-500 to-orange-500"
              themeMode={themeMode}
            />
          )}
          <StatCard
            label="Total Views"
            value={stats.totalViews.toLocaleString()}
            icon={<Eye className="w-4 h-4 text-white" />}
            color="bg-linear-to-r from-purple-500 to-pink-500"
            themeMode={themeMode}
          />
        </div>
      )}

      {/* Filters */}
      {showFilters && !error && (
        <Card className={cn(
          "border p-4",
          themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
        )}>
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all' as const, label: 'All', count: totalProducts },
                { id: 'featured' as const, label: 'Featured', icon: <Star className="h-4 w-4" />, count: featuredProducts.length },
                { id: 'trending' as const, label: 'Trending', icon: <TrendingUp className="h-4 w-4" />, count: trendingProducts.length },
                { id: 'active' as const, label: 'Active', icon: <Check className="h-4 w-4" />, count: stats.activeProducts },
                ...(isOwnCompany ? [{ id: 'draft' as const, label: 'Drafts', icon: <Zap className="h-4 w-4" />, count: stats.draftProducts }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    activeFilter === tab.id
                      ? "bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                      : themeMode === 'dark'
                        ? "text-gray-400 hover:text-white hover:bg-gray-800"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 text-xs rounded-full",
                      activeFilter === tab.id
                        ? "bg-white/20 text-white"
                        : themeMode === 'dark'
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* View and Sort Controls */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex rounded-lg p-1",
                themeMode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              )}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded transition-all",
                    viewMode === 'grid'
                      ? themeMode === 'dark'
                        ? 'bg-gray-700 text-white shadow-sm'
                        : 'bg-white text-gray-900 shadow-sm'
                      : themeMode === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded transition-all",
                    viewMode === 'list'
                      ? themeMode === 'dark'
                        ? 'bg-gray-700 text-white shadow-sm'
                        : 'bg-white text-gray-900 shadow-sm'
                      : themeMode === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={cn(
                    "appearance-none rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer",
                    themeMode === 'dark'
                      ? 'bg-gray-900 border-gray-700 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  )}
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search products by name, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-10 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                themeMode === 'dark'
                  ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        </Card>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && activeFilter === 'all' && !error && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-linear-to-r from-amber-500 to-orange-500">
              <Star className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Featured Products
            </h3>
            <Badge variant="outline" className="ml-auto">
              {featuredProducts.length}
            </Badge>
          </div>

          <div className={cn(
            viewMode === 'grid'
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          )}>
            {featuredProducts.slice(0, 3).map((product) => (
              <CompanyProductCard
                key={product._id}
                product={product}
                onClick={() => handleProductSelect(product)}
                themeMode={themeMode}
              />
            ))}
          </div>

          {featuredProducts.length > 3 && (
            <button
              onClick={() => handleTabChange('featured')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
            >
              View all {featuredProducts.length} featured products
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Products Grid/List */}
      {!error && (
        <>
          {loading && products.length === 0 ? (
            <div className={cn(
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            )}>
              {[...Array(6)].map((_, i) => (
                <ProductCardSkeleton key={i} themeMode={themeMode} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className={cn(
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"
              )}>
                {products.map((product) => (
                  <CompanyProductCard
                    key={product._id}
                    product={product}
                    onClick={() => handleProductSelect(product)}
                    themeMode={themeMode}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center pt-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading}
                    variant="outline"
                    className="min-w-[200px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More Products
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            // Empty State
            <Card className={cn(
              "p-12 text-center border",
              themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
            )}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? `No results for "${searchQuery}"` : 'No Products Found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? 'Try a different search term or clear your search.'
                  : `${companyName} hasn't listed any products yet.`}
              </p>
              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                >
                  Clear Search
                </Button>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};