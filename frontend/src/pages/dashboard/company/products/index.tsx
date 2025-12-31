/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { companyService } from '@/services/companyService';
import { productService, Product, ProductFilters, ProductsResponse } from '@/services/productService';
import { ProductCard } from '@/components/Products/ProductCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Plus, 
  Grid3X3, 
  List,
  BarChart3,
  Eye,
  ShoppingCart,
  TrendingUp,
  Filter,
  Search,
  Building,
  Crown,
  Sparkles
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { productToast } from '@/services/productService';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function CompanyProductsDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [productsData, setProductsData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    search: '',
  });

  // Get company data
  useEffect(() => {
    const fetchCompany = async () => {
      if (user?.role === 'company') {
        try {
          const companyData = await companyService.getMyCompany();
          setCompany(companyData);
        } catch (error) {
          console.error('Failed to fetch company:', error);
          productToast.error('Failed to load company profile');
        } finally {
          setCompanyLoading(false);
        }
      } else {
        setCompanyLoading(false);
      }
    };
    
    fetchCompany();
  }, [user]);

  const companyId = company?._id;

  useEffect(() => {
    const fetchProducts = async () => {
      if (!companyId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching products for company:', companyId);
        const data = await productService.getCompanyProducts(companyId, filters);
        setProductsData(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        productToast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    if (!companyLoading) {
      fetchProducts();
    }
  }, [companyId, companyLoading, filters]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await productService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchQuery, page: 1 }));
  };

  const handleViewProduct = (product: Product) => {
    router.push(`/dashboard/company/products/${product._id}`);
  };

  const handleEditProduct = (product: Product) => {
    router.push(`/dashboard/company/products/${product._id}/edit`);
  };

  const handleCreateProduct = () => {
    router.push('/dashboard/company/products/create');
  };

  const handleStatusChange = async (product: Product, status: Product['status']) => {
    try {
      await productService.updateProductStatus(product._id, status);
      // Refresh products
      const data = await productService.getCompanyProducts(companyId, filters);
      setProductsData(data);
      productToast.success(`Product status updated to ${status}`);
    } catch (error) {
      productToast.error('Failed to update product status');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      try {
        await productService.deleteProduct(product._id);
        productToast.success('Product deleted successfully');
        // Refresh products
        const data = await productService.getCompanyProducts(companyId, filters);
        setProductsData(data);
      } catch (error) {
        productToast.error('Failed to delete product');
      }
    }
  };

  // Calculate stats
  const stats = {
    total: productsData?.pagination.total || 0,
    active: productsData?.products.filter(p => p.status === 'active').length || 0,
    draft: productsData?.products.filter(p => p.status === 'draft').length || 0,
    featured: productsData?.products.filter(p => p.featured).length || 0,
  };

  // Show loading while fetching company
  if (companyLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 backdrop-blur-xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-white/30 border-t-amber-500/80 rounded-full animate-spin mx-auto mb-4 backdrop-blur-sm"></div>
            <p className="text-slate-600 font-medium">Loading your company profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error if no company found
  if (!companyId) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 backdrop-blur-xl flex items-center justify-center p-6">
          <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl max-w-md w-full">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-red-100/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/40">
                <Building className="h-8 w-8 text-red-500/80" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Company Profile Required</h3>
              <p className="text-slate-600 mb-6 font-medium">
                You need to complete your company profile before managing products.
              </p>
              <Button 
                onClick={() => router.push('/dashboard/company/profile')}
                className="bg-gradient-to-r from-amber-500/90 to-amber-600/90 hover:from-amber-600 hover:to-amber-700 text-white font-semibold backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Complete Company Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 backdrop-blur-xl p-6">
        {/* Company Info Banner */}
        {company && (
          <div className="mb-8 p-6 bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {company.logoUrl && (
                  <img 
                    src={productService.getImageUrl(company.logoUrl)} 
                    alt={company.name}
                    className="w-12 h-12 rounded-xl border border-white/40 object-cover shadow-sm"
                  />
                )}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{company.name}</h2>
                  <p className="text-slate-600 font-medium">{company.industry}</p>
                </div>
              </div>
              {company.verified && (
                <Badge className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-white border border-white/40 font-semibold backdrop-blur-sm">
                  <Crown className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Product Management</h1>
              <p className="text-slate-600 mt-1 font-medium">Manage your company`s products and inventory</p>
            </div>
            <Button 
              onClick={handleCreateProduct} 
              size="lg"
              className="bg-gradient-to-r from-amber-500/90 to-amber-600/90 hover:from-amber-600 hover:to-amber-700 text-white font-semibold backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Products</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl border border-white/40 backdrop-blur-sm">
                  <ShoppingCart className="h-6 w-6 text-blue-600/80" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Products</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-xl border border-white/40 backdrop-blur-sm">
                  <Eye className="h-6 w-6 text-emerald-600/80" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Draft Products</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.draft}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-xl border border-white/40 backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6 text-amber-600/80" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Featured</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.featured}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-xl border border-white/40 backdrop-blur-sm">
                  <TrendingUp className="h-6 w-6 text-purple-600/80" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl">
              <CardHeader className="border-b border-white/30">
                <CardTitle className="flex items-center text-slate-900 text-lg font-semibold">
                  <Filter className="h-5 w-5 mr-2" />
                  Quick Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Search Products
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name..."
                        className="bg-white/50 backdrop-blur-sm border border-white/40 focus:ring-2 focus:ring-amber-500/30 font-medium rounded-xl"
                      />
                      <Button 
                        type="submit"
                        className="bg-gradient-to-r from-amber-500/90 to-amber-600/90 text-white border border-white/30 shadow-sm backdrop-blur-sm"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </form>

                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border border-white/40 bg-white/50 backdrop-blur-sm font-medium hover:bg-white/70 rounded-xl"
                    onClick={() => setFilters(prev => ({ ...prev, status: 'active' }))}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Active ({stats.active})
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border border-white/40 bg-white/50 backdrop-blur-sm font-medium hover:bg-white/70 rounded-xl"
                    onClick={() => setFilters(prev => ({ ...prev, status: 'draft' }))}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Draft ({stats.draft})
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border border-white/40 bg-white/50 backdrop-blur-sm font-medium hover:bg-white/70 rounded-xl"
                    onClick={() => setFilters(prev => ({ ...prev, featured: true }))}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Featured ({stats.featured})
                  </Button>
                </div>

                <div className="pt-4 border-t border-white/30">
                  <Button 
                    onClick={handleCreateProduct}
                    className="w-full bg-gradient-to-r from-amber-500/90 to-amber-600/90 hover:from-amber-600 hover:to-amber-700 text-white font-semibold border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Your Products</h2>
                <p className="text-slate-600 font-medium">
                  {productsData ? `Showing ${productsData.products.length} of ${productsData.pagination.total} products` : 'Loading...'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex border border-white/40 rounded-xl p-1 bg-white/50 backdrop-blur-sm">
                  <Button
                    variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`h-9 w-9 p-0 rounded-lg ${
                      viewMode === 'grid' 
                        ? 'bg-gradient-to-r from-amber-500/90 to-amber-600/90 text-white border border-white/30 shadow-sm' 
                        : 'border-transparent'
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`h-9 w-9 p-0 rounded-lg ${
                      viewMode === 'list' 
                        ? 'bg-gradient-to-r from-amber-500/90 to-amber-600/90 text-white border border-white/30 shadow-sm' 
                        : 'border-transparent'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading && !productsData ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse bg-white/50 backdrop-blur-xl border border-white/40 rounded-2xl">
                    <CardContent className="p-4">
                      <Skeleton className="h-48 w-full mb-4 bg-slate-200/50 rounded-xl" />
                      <Skeleton className="h-4 w-3/4 mb-2 bg-slate-200/50 rounded" />
                      <Skeleton className="h-3 w-1/2 mb-4 bg-slate-200/50 rounded" />
                      <Skeleton className="h-4 w-full mb-2 bg-slate-200/50 rounded" />
                      <Skeleton className="h-4 w-2/3 bg-slate-200/50 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : productsData && productsData.products.length > 0 ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {productsData.products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onView={handleViewProduct}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    onStatusChange={handleStatusChange}
                    currentUser={{ role: 'company' }}
                    showActions={true}
                    className={cn(
                      viewMode === 'list' ? 'flex flex-row' : '',
                      "bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
                    )}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl">
                <CardContent className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No products yet</h3>
                  <p className="text-slate-600 mb-4 font-medium">
                    Start by creating your first product to showcase your offerings
                  </p>
                  <Button 
                    onClick={handleCreateProduct}
                    className="bg-gradient-to-r from-amber-500/90 to-amber-600/90 hover:from-amber-600 hover:to-amber-700 text-white font-semibold border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Product
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}