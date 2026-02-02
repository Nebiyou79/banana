import React, { useState, useEffect } from 'react';
import { OwnerProductCard, PublicProductCard } from '@/components/Products/ProductCard';
import { Product, productService } from '@/services/productService';
import { Card } from '@/components/social/ui/Card';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/social/ui/Badge';
import {
  Grid3X3,
  List,
  Star,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Package,
  Filter,
  Search,
  Zap,
  Crown,
  ShoppingBag,
  BarChart3,
  Tag,
  Clock,
  Award,
  ChevronDown,
  PlusCircle,
  RefreshCw,
  Loader2,
  Globe,
  Eye,
  Grid,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Users,
  Building
} from 'lucide-react';
import { toast } from 'sonner';

interface CompanyProductsSectionProps {
  companyId: string;
  companyName: string;
  isOwnCompany?: boolean;
  limit?: number;
  viewMode?: 'grid' | 'list';
  showFilters?: boolean;
  variant?: 'default' | 'marketplace' | 'storefront';
  currentUser?: any;
}

export const CompanyProductsSection: React.FC<CompanyProductsSectionProps> = ({
  companyId,
  companyName,
  isOwnCompany = false,
  limit = 12,
  viewMode: initialViewMode = 'grid',
  showFilters: initialShowFilters = false,
  variant = 'marketplace',
  currentUser,
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
  const [stats, setStats] = useState({
    totalViews: 0,
    activeProducts: 0,
    draftProducts: 0,
    totalProducts: 0,
  });

  const fetchProducts = async (pageNum: number = 1, filter: string = activeFilter) => {
    try {
      setLoading(true);

      // Validate companyId
      if (!companyId || companyId === 'undefined' || companyId === 'null') {
        console.error('Invalid company ID:', companyId);
        toast.error('Invalid company ID');
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
        // For owners, show all statuses; for public, only active
        if (!isOwnCompany) {
          filters.status = 'active';
        }
        // No status filter for owners - they see all
      }

      if (searchQuery) {
        filters.search = searchQuery;
      }

      console.log('📋 Fetching products for company:', companyId, 'with filters:', filters);

      try {
        const response = await productService.getCompanyProducts(companyId, filters);

        console.log('✅ Products fetched:', response.products?.length || 0);

        if (pageNum === 1) {
          setProducts(response.products || []);
        } else {
          setProducts(prev => [...prev, ...(response.products || [])]);
        }

        setTotalProducts(response.pagination?.total || 0);
        setHasMore(pageNum < (response.pagination?.pages || 0));

        // Calculate stats from products
        const totalViews = response.products?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;
        const activeProducts = response.products?.filter(p => p.status === 'active').length || 0;
        const draftProducts = response.products?.filter(p => p.status === 'draft').length || 0;

        setStats({
          totalViews,
          activeProducts,
          draftProducts,
          totalProducts: response.pagination?.total || 0,
        });

        // Update company stats if available in response
        if (response.stats) {
          setStats(prev => ({
            ...prev,
            ...response.stats
          }));
        }
      } catch (error: any) {
        console.error('❌ API Error:', error);
        setProducts([]);
        setTotalProducts(0);

        if (isOwnCompany) {
          toast.error('Failed to load products');
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast.error('An unexpected error occurred');
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchProducts(1, activeFilter);
    }
  }, [companyId, activeFilter, searchQuery, sortBy]);

  const handleTabChange = (tab: 'all' | 'featured' | 'active' | 'draft' | 'trending') => {
    setActiveFilter(tab);
    setPage(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  };

  const handleProductDeleted = () => {
    toast.success('Product deleted successfully');
    fetchProducts(1, activeFilter);
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
    fetchProducts(1, 'all');
  };

  const featuredProducts = products.filter(product => product.featured && product.status === 'active').slice(0, 4);
  const trendingProducts = products.filter(product => (product.views || 0) > 100 && product.status === 'active').slice(0, 4);

  const getContainerClass = () => {
    switch (variant) {
      case 'storefront':
        return 'bg-white border border-gray-200 rounded-2xl p-6 shadow-sm';
      case 'marketplace':
        return 'bg-white border border-gray-200 rounded-2xl p-6 shadow-sm';
      default:
        return 'bg-white border border-gray-200 rounded-2xl p-6 shadow-sm';
    }
  };

  const renderHeaderSection = () => (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {companyName}'s Products
          </h1>
          <p className="text-gray-600">
            {totalProducts > 0
              ? `Showing ${products.length} of ${totalProducts} products`
              : 'Explore products from this company'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => window.location.href = `/companies/${companyId}`}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {[
        {
          label: 'Total Products',
          value: stats.totalProducts,
          icon: <Package className="h-4 w-4" />,
          color: 'bg-blue-50 text-blue-600 border-blue-100'
        },
        {
          label: 'Active',
          value: stats.activeProducts,
          icon: <Check className="h-4 w-4" />,
          color: 'bg-green-50 text-green-600 border-green-100'
        },
        ...(isOwnCompany ? [
          {
            label: 'Drafts',
            value: stats.draftProducts,
            icon: <Clock className="h-4 w-4" />,
            color: 'bg-amber-50 text-amber-600 border-amber-100'
          }
        ] : []),
        {
          label: 'Total Views',
          value: stats.totalViews.toLocaleString(),
          icon: <Eye className="h-4 w-4" />,
          color: 'bg-purple-50 text-purple-600 border-purple-100'
        },
      ].map((stat, index) => (
        <div
          key={index}
          className={`border rounded-lg p-4 ${stat.color} transition-all hover:scale-[1.02]`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/50">
              {stat.icon}
            </div>
            <div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderFilters = () => (
    <div className="mb-8 bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all' as const, label: 'All', count: totalProducts },
            { id: 'featured' as const, label: 'Featured', icon: <Star className="h-4 w-4" />, count: featuredProducts.length },
            { id: 'trending' as const, label: 'Trending', icon: <TrendingUp className="h-4 w-4" />, count: trendingProducts.length },
            { id: 'active' as const, label: 'Active', icon: <Zap className="h-4 w-4" />, count: stats.activeProducts },
            ...(isOwnCompany ? [{ id: 'draft' as const, label: 'Drafts', icon: <Clock className="h-4 w-4" />, count: stats.draftProducts }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === tab.id
                ? 'bg-white text-gray-900 border border-gray-300 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${activeFilter === tab.id
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-gray-200 text-gray-600'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* View and Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`h-8 w-8 p-0 rounded ${viewMode === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`h-8 w-8 p-0 rounded ${viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer pr-8"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>

          {isOwnCompany && (
            <Button
              onClick={() => window.location.href = '/dashboard/company/products/create'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search products by name, category, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );

  const renderFeaturedSection = () => {
    if (featuredProducts.length === 0 || activeFilter !== 'all') return null;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Featured Products</h2>
              <p className="text-sm text-gray-600">Top picks from {companyName}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="group"
            onClick={() => handleTabChange('featured')}
          >
            View All
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {featuredProducts.map((product) => (
            isOwnCompany ? (
              <OwnerProductCard
                key={product._id}
                product={product}
                theme="light"
                currentUser={currentUser}
                onProductDeleted={handleProductDeleted}
                className="bg-white border border-gray-200 hover:border-amber-300 transition-colors"
              />
            ) : (
              <PublicProductCard
                key={product._id}
                product={product}
                theme="light"
                className="bg-white border border-gray-200 hover:border-amber-300 transition-colors"
              />
            )
          ))}
        </div>
      </div>
    );
  };

  const renderProducts = () => {
    if (loading && products.length === 0) {
      return (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? `No results for "${searchQuery}"` : 'No Products Found'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery
              ? 'Try a different search term or clear your search.'
              : `${companyName} hasn't listed any products yet.`}
          </p>
          <div className="flex gap-3 justify-center">
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery('')}
                variant="outline"
              >
                Clear Search
              </Button>
            )}
            {isOwnCompany && (
              <Button
                onClick={() => window.location.href = '/dashboard/company/products/create'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Your First Product
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className={`gap-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2' : 'flex flex-col'}`}>
          {products.map((product) => (
            isOwnCompany ? (
              <OwnerProductCard
                key={product._id}
                product={product}
                theme="light"
                currentUser={currentUser}
                onProductDeleted={handleProductDeleted}
                className={`bg-white border border-gray-200 hover:border-blue-300 transition-colors`}
              />
            ) : (
              <PublicProductCard
                key={product._id}
                product={product}
                theme="light"
                className={`bg-white border border-gray-200 hover:border-blue-300 transition-colors`}
              />
            )
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-8">
            <Button
              onClick={handleLoadMore}
              disabled={loading}
              variant="outline"
              className="min-w-[200px] group"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
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
    );
  };

  return (
    <div className={getContainerClass()}>
      {renderHeaderSection()}
      {totalProducts > 0 && renderStats()}
      {renderFilters()}

      {renderFeaturedSection()}

      {(activeFilter !== 'all' || (activeFilter === 'all' && featuredProducts.length === 0)) && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {activeFilter === 'featured' ? 'Featured Products' :
                activeFilter === 'trending' ? 'Trending Now' :
                  activeFilter === 'draft' ? 'Draft Products' :
                    activeFilter === 'active' ? 'Active Products' :
                      'All Products'}
            </h2>
            <p className="text-sm text-gray-600">
              {products.length} of {totalProducts} products
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        </div>
      )}

      {renderProducts()}

      <div className="mt-12 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Discover more from {companyName} and explore their complete product catalog.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.location.href = `/companies/${companyId}`}
              variant="outline"
              className="border-gray-300"
            >
              <Globe className="h-4 w-4 mr-2" />
              Company Profile
            </Button>
            <Button
              onClick={() => window.location.href = '/marketplace'}
              variant="outline"
              className="border-gray-300"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Marketplace
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};