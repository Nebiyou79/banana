import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService';
import { Button } from '@/components/social/ui/Button';
import { Package, Eye, ChevronRight, Loader2, ShoppingBag, Star, Check } from 'lucide-react';

interface CompanyProductsPreviewProps {
  companyId: string;
  companyName: string;
  showViewAll?: boolean;
  limit?: number;
}

export const CompanyProductsPreview: React.FC<CompanyProductsPreviewProps> = ({
  companyId,
  companyName,
  showViewAll = true,
  limit = 2, // Changed to 2 for side-by-side display
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      fetchProducts();
    }
  }, [companyId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!companyId || companyId === 'undefined' || companyId === 'null') {
        console.log('⚠️ Invalid company ID for preview:', companyId);
        setProducts([]);
        return;
      }

      try {
        const response = await productService.getCompanyProducts(companyId, {
          limit,
          status: 'active',
          sortBy: 'popular',
        });

        console.log('✅ Preview products fetched:', response.products?.length || 0);
        setProducts(response.products || []);
      } catch (error: any) {
        console.error('❌ Failed to fetch company products preview:', error);
        setProducts([]);
        setError('Unable to load products');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Products</h3>
          </div>
          {showViewAll && (
            <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-3" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Products</h3>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600 text-sm">
            Unable to load products
          </p>
        </div>
      </div>
    );
  }

  // Empty State
  if (products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Products</h3>
          </div>
          {showViewAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = `/company/${companyId}/products`}
              className="text-sm"
            >
              View All
            </Button>
          )}
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-200">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">No Products Yet</h4>
          <p className="text-gray-600 text-xs max-w-sm mx-auto">
            {companyName} hasn't listed any products yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Products</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-blue-600 font-medium text-sm">{products.length}</span>
              <span className="text-gray-600 text-xs">available products</span>
            </div>
          </div>
        </div>

        {showViewAll && (
          <Button
            onClick={() => window.location.href = `/company/${companyId}/products`}
            variant="outline"
            size="sm"
            className="group"
          >
            View All
            <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => (
          <div key={product._id} className="group">
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors hover:shadow-sm">
              {/* Product image */}
              <div className="relative h-40 mb-3 overflow-hidden rounded-lg bg-gray-50">
                {product.images && product.images[0] && product.images[0].url ? (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/product-placeholder.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-10 h-10 text-gray-300" />
                  </div>
                )}

                {/* Status badge */}
                <div className="absolute top-2 left-2">
                  {product.status === 'active' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>

                {/* Price tag */}
                {product.price?.amount && (
                  <div className="absolute bottom-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md font-semibold text-sm">
                    ${product.price.amount.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {product.name}
                  </h4>
                  {product.featured && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                      Featured
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-xs line-clamp-2">
                  {product.shortDescription || product.description?.substring(0, 80) || 'No description available'}
                </p>

                {/* Rating and stock */}
                <div className="flex items-center justify-between text-xs pt-2">
                  <div className="flex items-center gap-1 text-amber-600">
                    <Star className="w-3 h-3 fill-current" />
                    <span>4.5</span>
                    <span className="text-gray-500">(12)</span>
                  </div>

                  <div className="flex items-center gap-1 text-gray-600">
                    <Package className="w-3 h-3" />
                    <span>{product.inventory?.quantity || 0} in stock</span>
                  </div>
                </div>

                {/* View button */}
                <Button
                  onClick={() => window.location.href = `/products/${product._id}`}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 text-sm"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Products Button (Mobile) */}
      {showViewAll && products.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 md:hidden">
          <Button
            onClick={() => window.location.href = `/company/${companyId}/products`}
            variant="outline"
            className="w-full"
          >
            View All Products
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};