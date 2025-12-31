/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { productService, Product, ProductFilters, ProductsResponse, Company } from '@/services/productService';
import { ProductCard } from '@/components/Products/ProductCard';
import { ProductFilter } from '@/components/Products/ProductFilter';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Grid3X3, 
  List, 
  Building,
  Star,
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { productToast } from '@/services/productService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface PublicProductsPageProps {
  initialProducts: ProductsResponse;
  companies: Company[];
  categories: any[];
}

export default function PublicProductsPage({ initialProducts, companies, categories }: PublicProductsPageProps) {
  const router = useRouter();
  const [productsData, setProductsData] = useState<ProductsResponse>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    status: 'active',
    ...router.query
  });

  // Fetch products whenever filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await productService.getProducts(filters);
        setProductsData(data);

        // Update URL without page reload
        const query = { ...filters };
        Object.keys(query).forEach(key => {
          if (!query[key as keyof ProductFilters] || 
              (Array.isArray(query[key as keyof ProductFilters]) && 
               (query[key as keyof ProductFilters] as any[]).length === 0)) {
            delete query[key as keyof ProductFilters];
          }
        });

        router.push({ pathname: '/products', query }, undefined, { shallow: true });
      } catch (error) {
        productToast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  const handleViewProduct = (product: Product) => {
    router.push(`/products/${product._id}`);
  };

  const loadMore = () => {
    setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchQuery, page: 1 }));
  };

  const featuredProducts = productsData.products.filter(product => product.featured);
  const popularProducts = productsData.products.filter(product => product.views > 100).slice(0, 4);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20">
        {/* Hero Section */}
{/* Hero Section */}
<section className="relative bg-gradient-to-br from-blue-900 via-slate-900/95 to-slate-900/90 text-white overflow-hidden">
  {/* Background pattern image */}
  <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] bg-[length:60px_60px] opacity-10" />

  {/* Decorative shapes */}
  <div className="absolute top-0 left-0 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
  <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

  <div className="container mx-auto px-4 py-20 relative z-10">
    <div className="text-center max-w-3xl mx-auto">
      {/* Badge */}
      <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30 backdrop-blur-sm mb-4 px-4 py-2 text-sm inline-flex items-center gap-2">
        <Sparkles className="h-4 w-4" /> Discover Amazing Products
      </Badge>

      {/* Title */}
      <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 bg-clip-text text-transparent">
        Marketplace
      </h1>

      {/* Subtitle */}
      <p className="text-lg md:text-xl text-gray-300 mb-6">
        Explore innovative products from trusted companies around the world. Find exactly what you need with our curated collection.
      </p>
    </div>

    {/* Top Filters */}
    <div className="mt-10">
      <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-md">
        <CardContent className="p-6">
          <ProductFilter
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
            companies={companies}
            showAdvanced={showFilters}
            onAdvancedToggle={setShowFilters}
          />
        </CardContent>
      </Card>
    </div>
  </div>
</section>


        <div className="container mx-auto px-4 py-12 -mt-8 relative z-20">
          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-gold to-goldenMustard rounded-xl">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-darkNavy">Featured Products</h2>
                    <p className="text-gray-600">Handpicked excellence from our collection</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-goldenMustard hover:text-goldenMustard/80 hover:bg-goldenMustard/10"
                  onClick={() => setFilters(prev => ({ ...prev, featured: true }))}
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.slice(0, 4).map((product) => (
                  <div key={product._id} className="transform hover:scale-105 transition-all duration-500">
                    <ProductCard product={product} onView={handleViewProduct} showActions={false} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Popular Products */}
          {popularProducts.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-teal to-blue rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-darkNavy">Trending Now</h2>
                    <p className="text-gray-600">Most viewed products this week</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {popularProducts.map((product) => (
                  <div key={product._id} className="transform hover:scale-105 transition-all duration-500">
                    <ProductCard product={product} onView={handleViewProduct} showActions={false} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Main Products */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Products Grid/List */}
            <div className="lg:col-span-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
                <div>
                  <h2 className="text-3xl font-bold text-darkNavy mb-2">All Products</h2>
                  <p className="text-gray-600 flex items-center">
                    Showing {productsData.products.length} of {productsData.pagination.total} products
                    {filters.search && (
                      <Badge className="ml-3 bg-goldenMustard text-white border-0">
                        Search: `{filters.search}`
                      </Badge>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex border border-gray-300 rounded-2xl p-1 bg-gray-100">
                    <Button
                      variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`h-10 w-10 p-0 rounded-xl ${viewMode === 'grid' ? 'bg-goldenMustard text-white shadow-lg' : 'text-gray-600 hover:text-goldenMustard'}`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`h-10 w-10 p-0 rounded-xl ${viewMode === 'list' ? 'bg-goldenMustard text-white shadow-lg' : 'text-gray-600 hover:text-goldenMustard'}`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Products */}
              {loading && productsData.products.length === 0 ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse border-0 shadow-lg">
                      <CardContent className="p-4">
                        <Skeleton className="h-48 w-full mb-4 rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300" />
                        <Skeleton className="h-4 w-3/4 mb-2 bg-gradient-to-r from-gray-200 to-gray-300" />
                        <Skeleton className="h-3 w-1/2 mb-4 bg-gradient-to-r from-gray-200 to-gray-300" />
                        <Skeleton className="h-4 w-full mb-2 bg-gradient-to-r from-gray-200 to-gray-300" />
                        <Skeleton className="h-4 w-2/3 bg-gradient-to-r from-gray-200 to-gray-300" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : productsData.products.length > 0 ? (
                <>
                  <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {productsData.products.map((product) => (
                      <div key={product._id} className="transform hover:scale-105 transition-all duration-300">
                        <ProductCard product={product} onView={handleViewProduct} showActions={false} className={viewMode === 'list' ? 'flex flex-row' : ''} />
                      </div>
                    ))}
                  </div>

                  {productsData.pagination.pages > productsData.pagination.current && (
                    <div className="text-center mt-12">
                      <Button
                        onClick={loadMore}
                        disabled={loading}
                        className="bg-gradient-to-r from-goldenMustard to-gold text-white hover:from-goldenMustard/90 hover:to-gold/90 border-0 px-8 py-3 text-lg rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Loading...
                          </div>
                        ) : (
                          <>
                            Load More Products
                            <ArrowRight className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50/50">
                  <CardContent className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Building className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-darkNavy mb-3">No products found</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Try adjusting your filters or search terms. We might not have what you`re looking for yet.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button onClick={() => setFilters({ page: 1, limit: 12, status: 'active' })} className="bg-goldenMustard text-white hover:bg-goldenMustard/90 border-0">
                        Clear Filters
                      </Button>
                      <Button variant="outline" onClick={() => setSearchQuery('')} className="border-gray-300 text-gray-600 hover:bg-gray-50">
                        Clear Search
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps() {
  try {
    const [productsData, categories] = await Promise.all([
      productService.getProducts({ page: 1, limit: 12, status: 'active', sortBy: 'createdAt', sortOrder: 'desc' }),
      productService.getCategories()
    ]);

    const companies: Company[] = []; // Replace with real API fetch if available

    return {
      props: {
        initialProducts: productsData,
        companies,
        categories
      }
    };
  } catch (error) {
    return {
      props: {
        initialProducts: {
          products: [],
          pagination: { current: 1, pages: 0, total: 0, limit: 12 },
          filters: { categories: [], companies: 0 }
        },
        companies: [],
        categories: []
      }
    };
  }
}
