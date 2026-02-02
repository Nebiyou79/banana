// pages/dashboard/company/products/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
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
import { OwnerProductCard } from '@/components/Products/ProductCard';
import { EntityAvatar } from '@/components/layout/EntityAvatar';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Plus, 
  Package, 
  TrendingUp, 
  AlertCircle, 
  Grid3x3,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Upload
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

export default function CompanyProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    status: undefined, // Show all statuses for company view
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
    draftProducts: 0,
    avgPrice: 0
  });

  // Get current theme
  const theme = getTheme('light');

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
        router.push('/dashboard/company/profile');
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
  }, [isAuthenticated, user, router]);

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
        limit: 12
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
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

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

  // Empty state
  if (!loading && products.length === 0 && !filters.search && !filters.category) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-2xl font-bold ${colorClasses.text.darkNavy} capitalize`}>
                  Products
                </h1>
                <p className={`${colorClasses.text.gray800} mt-2 flex items-center`}>
                  <span>Manage your company products</span>
                </p>
              </div>
              
              <Button
                onClick={() => router.push('/dashboard/company/products/create')}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: colors.goldenMustard,
                  color: colors.white
                }}
              >
                <Plus className="h-4 w-4" />
                Create Product
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
              <Package className="h-8 w-8 text-white" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${colorClasses.text.darkNavy}`}>
              No Products Yet
            </h3>
            <p className={`mb-6 ${colorClasses.text.gray800}`}>
              Start building your product catalog by adding your first product.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push('/dashboard/company/products/create')}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: colors.goldenMustard,
                  color: colors.white
                }}
              >
                <Plus className="h-4 w-4" />
                Create Your First Product
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/company/products/import')}
                className="flex items-center gap-2"
                style={{
                  borderColor: theme.border.gray400,
                  color: theme.text.gray800
                }}
              >
                <Upload className="h-4 w-4" />
                Import Products
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="company">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <EntityAvatar
                name={company?.name || 'Company'}
                avatar={company?.logoUrl}
                size="lg"
              />
              <div>
                <h1 className={`text-2xl font-bold ${colorClasses.text.darkNavy}`}>
                  {company?.name || 'Company'} Products
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-1"
                    style={{
                      borderColor: theme.border.gray400,
                      color: theme.text.gray800
                    }}
                  >
                    <Package className="h-3 w-3" />
                    {pagination.total} total products
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
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/company/products/import')}
                className="flex items-center gap-2"
                style={{
                  borderColor: theme.border.gray400,
                  color: theme.text.gray800
                }}
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button
                onClick={() => router.push('/dashboard/company/products/create')}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: colors.goldenMustard,
                  color: colors.white
                }}
              >
                <Plus className="h-4 w-4" />
                New Product
              </Button>
            </div>
          </div>
        </div>

        {/* Status Summary */}
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
              <span className={`text-sm ${colorClasses.text.gray800}`}>Active</span>
              <Badge 
                style={{
                  backgroundColor: colors.green,
                  color: colors.white
                }}
              >
                {activeCount}
              </Badge>
            </div>
            <p className={`text-2xl font-bold mt-2 ${colorClasses.text.darkNavy}`}>
              {activeCount}
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
              <span className={`text-sm ${colorClasses.text.gray800}`}>Draft</span>
              <Badge 
                variant="outline"
                style={{
                  borderColor: colors.goldenMustard,
                  color: colors.goldenMustard
                }}
              >
                {draftCount}
              </Badge>
            </div>
            <p className={`text-2xl font-bold mt-2 ${colorClasses.text.darkNavy}`}>
              {draftCount}
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
              <span className={`text-sm ${colorClasses.text.gray800}`}>Inactive</span>
              <Badge 
                variant="outline"
                style={{
                  borderColor: theme.border.gray400,
                  color: theme.text.gray400
                }}
              >
                {inactiveCount}
              </Badge>
            </div>
            <p className={`text-2xl font-bold mt-2 ${colorClasses.text.darkNavy}`}>
              {inactiveCount}
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
                  backgroundColor: colors.blue,
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <OwnerProductCard
                    key={product._id}
                    product={product}
                    currentUser={user}
                    onProductDeleted={handleProductDeleted}
                    className="h-full"
                  />
                ))}
              </div>
              
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
                onClick={() => setFilters({ page: 1, limit: 12 })}
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

        {/* Quick Stats Footer */}
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
                Product Management Tips:
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <span className={`text-xs ${colorClasses.text.gray800}`}>
                • Keep product images high quality
              </span>
              <span className={`text-xs ${colorClasses.text.gray800}`}>
                • Update inventory regularly
              </span>
              <span className={`text-xs ${colorClasses.text.gray800}`}>
                • Use clear, descriptive titles
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/company/products/analytics')}
              className="flex items-center gap-1"
              style={{ color: theme.text.blue }}
            >
              View Analytics
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}