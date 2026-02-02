/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ProductDetail } from '@/components/Products/ProductDetail';
import { EntityAvatar } from '@/components/layout/EntityAvatar';
import { useAuth } from '@/hooks/useAuth';
import { productService, Product } from '@/services/productService';
import { colors, getTheme } from '@/utils/color';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/social/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Share2,
  Building,
  Package,
  Star,
  Eye,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { companyService } from '@/services/companyService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function PublicProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const theme = getTheme('light');

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id || typeof id !== 'string') return;

      setLoading(true);
      try {
        // Fetch product
        const productData = await productService.getProduct(id);
        setProduct(productData);

        // Extract company info
        let companyData = null;
        if (typeof productData.companyId === 'object' && productData.companyId) {
          companyData = productData.companyId;
          setCompany(companyData);
        } else if (typeof productData.companyId === 'string') {
          try {
            companyData = await companyService.getCompany(productData.companyId);
            setCompany(companyData);
          } catch (error) {
            console.error('Error fetching company:', error);
          }
        }

        // Fetch related products
        fetchRelatedProducts(productData._id);
      } catch (error: any) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load product',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  const fetchRelatedProducts = async (productId: string) => {
    setLoadingRelated(true);
    try {
      const related = await productService.getRelatedProducts(productId, 4);
      setRelatedProducts(related);
    } catch (error) {
      console.error('Failed to fetch related products:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? 'Removed from saved' : 'Saved to favorites',
      description: isSaved 
        ? 'Product removed from your saved items' 
        : 'Product added to your favorites',
      variant: 'default',
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Product link copied to clipboard',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleContactCompany = () => {
    if (company) {
      router.push(`/dashboard/messages/new?company=${company._id}&product=${product?._id}`);
    } else {
      toast({
        title: 'Error',
        description: 'Company information not available',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <ChevronRight className="h-4 w-4 text-gray-300" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <div className="flex gap-2">
                <Skeleton className="h-20 w-20 rounded-lg" />
                <Skeleton className="h-20 w-20 rounded-lg" />
                <Skeleton className="h-20 w-20 rounded-lg" />
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-6">The product you`re looking for doesn`t exist or has been removed.</p>
            <Button onClick={() => router.push('/dashboard/products')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Get product details
  const stockStatus = productService.getStockStatus(product.inventory);
  const formattedPrice = productService.formatPrice(product.price);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link 
                href="/dashboard/products" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                style={{ color: theme.text.gray400 }}
              >
                Marketplace
              </Link>
            </li>
            <li>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </li>
            {product.category && (
              <>
                <li>
                  <Link 
                    href={`/dashboard/products?category=${encodeURIComponent(product.category)}`}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    style={{ color: theme.text.gray400 }}
                  >
                    {product.category}
                  </Link>
                </li>
                <li>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </li>
              </>
            )}
            <li className="font-medium truncate max-w-xs" style={{ color: theme.text.gray800 }}>
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Header with Company Info */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <Link href={`/dashboard/companies/${company?._id || ''}`}>
                <EntityAvatar
                  name={company?.name || 'Company'}
                  avatar={company?.logoUrl}
                  size="lg"
                  className="hover:ring-2 hover:ring-goldenMustard/50 transition-all cursor-pointer"
                />
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Link 
                    href={`/dashboard/companies/${company?._id || ''}`}
                    className="hover:underline"
                  >
                    <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.text.gray800 }}>
                      {company?.name || 'Company'}
                      {company?.verified && (
                        <Badge variant="outline" size="sm" className="border-blue-500 text-blue-700">
                          Verified
                        </Badge>
                      )}
                    </h2>
                  </Link>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {company?.industry && (
                    <div className="flex items-center gap-1" style={{ color: theme.text.gray400 }}>
                      <Building className="h-4 w-4" />
                      <span>{company.industry}</span>
                    </div>
                  )}
                  {company?.website && (
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                      style={{ color: theme.text.blue }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  <div className="flex items-center gap-1" style={{ color: theme.text.gray400 }}>
                    <Star className="h-4 w-4" />
                    <span>4.8 • 124 reviews</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Public View */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleSaveToggle}
                variant="outline"
                className="gap-2"
                style={{ borderColor: theme.border.gray100 }}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" style={{ color: colors.goldenMustard }} />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleShare}
                variant="outline"
                size="icon"
                style={{ borderColor: theme.border.gray100 }}
                title="Share product"
              >
                <Share2 className="h-4 w-4" />
              </Button>

              <Button
                onClick={handleContactCompany}
                className="gap-2"
                style={{
                  backgroundColor: colors.goldenMustard,
                  color: colors.white
                }}
              >
                <MessageSquare className="h-4 w-4" />
                Contact Company
              </Button>
            </div>
          </div>
        </div>

        {/* Product Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card style={{ borderColor: theme.border.gray100 }}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="text-2xl font-bold" style={{ color: colors.goldenMustard }}>
                  {formattedPrice}
                </div>
                <div className="text-sm" style={{ color: theme.text.gray400 }}>
                  {product.price.unit && product.price.unit !== 'unit' ? `Per ${product.price.unit}` : 'Price'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: theme.border.gray100 }}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold ${stockStatus?.className}`}>
                    {stockStatus?.text}
                  </div>
                  {stockStatus && (
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stockStatus.color }} />
                  )}
                </div>
                <div className="text-sm" style={{ color: theme.text.gray400 }}>
                  {product.inventory.trackQuantity 
                    ? `${product.inventory.quantity} units available`
                    : 'Unlimited stock'
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: theme.border.gray100 }}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.text.blue }}>
                  <Eye className="h-5 w-5" />
                  {product.views}
                </div>
                <div className="text-sm" style={{ color: theme.text.gray400 }}>
                  Product views
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: theme.border.gray100 }}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold" style={{ color: theme.text.gray800 }}>
                    {product.category}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {product.subcategory || 'General'}
                  </Badge>
                </div>
                <div className="text-sm" style={{ color: theme.text.gray400 }}>
                  Category
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Product Detail Component */}
        <div
          className="bg-white rounded-2xl shadow-sm border overflow-hidden"
          style={{ borderColor: theme.border.gray100 }}
        >
          <ProductDetail
            productId={product._id}
            currentUser={user}
            theme="light"
            onBack={() => router.push('/dashboard/products')}
          />
        </div>

        {/* Company Contact Card */}
        {company && (
          <Card className="mt-8" style={{ borderColor: theme.border.gray100 }}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: theme.text.gray800 }}>
                    About the Company
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {company.description || `${company.name} is a trusted supplier on our marketplace.`}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {company.industry && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm" style={{ color: theme.text.gray800 }}>
                          {company.industry}
                        </span>
                      </div>
                    )}
                    {company.website && (
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                        style={{ color: theme.text.blue }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-sm">Visit Website</span>
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <Button
                    onClick={handleContactCompany}
                    className="w-full gap-2"
                    style={{
                      backgroundColor: colors.goldenMustard,
                      color: colors.white
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Contact Seller
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    style={{ borderColor: theme.border.gray100 }}
                    onClick={() => router.push(`/dashboard/companies/${company._id}`)}
                  >
                    <Building className="h-4 w-4" />
                    View Company Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    style={{ borderColor: theme.border.gray100 }}
                    onClick={() => router.push(`/dashboard/products?company=${company._id}`)}
                  >
                    <Package className="h-4 w-4" />
                    View All Products
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Products Section */}
        {(relatedProducts.length > 0 || loadingRelated) && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: theme.text.gray800 }}>
                Similar Products
              </h2>
              <Link 
                href={`/dashboard/products?category=${encodeURIComponent(product.category)}`}
                className="text-sm font-medium flex items-center gap-1 hover:underline"
                style={{ color: theme.text.blue }}
              >
                View all in {product.category}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {loadingRelated ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} style={{ borderColor: theme.border.gray100 }}>
                    <CardContent className="p-4">
                      <Skeleton className="aspect-square rounded-lg mb-3" />
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <Link 
                    key={relatedProduct._id} 
                    href={`/dashboard/products/${relatedProduct._id}`}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow" style={{ borderColor: theme.border.gray100 }}>
                      <CardContent className="p-4">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                          {relatedProduct.images?.[0] && (
                            <img
                              src={productService.getImageUrl(relatedProduct.images[0].secure_url, {
                                width: 300,
                                height: 300,
                                crop: 'fill'
                              })}
                              alt={relatedProduct.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                        </div>
                        <h3 className="font-semibold mb-1 line-clamp-2 group-hover:text-goldenMustard transition-colors"
                          style={{ color: theme.text.gray800 }}>
                          {relatedProduct.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="font-bold" style={{ color: colors.goldenMustard }}>
                            {productService.formatPrice(relatedProduct.price)}
                          </span>
                          <div className="flex items-center gap-1 text-sm" style={{ color: theme.text.gray400 }}>
                            <Eye className="h-3 w-3" />
                            {relatedProduct.views}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trust & Safety Section */}
        <Card className="mt-8" style={{ borderColor: theme.border.gray100 }}>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.text.gray800 }}>
              Trust & Safety
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium mb-1" style={{ color: theme.text.gray800 }}>Verified Company</h4>
                  <p className="text-sm" style={{ color: theme.text.gray400 }}>
                    All companies undergo verification process
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium mb-1" style={{ color: theme.text.gray800 }}>Secure Messaging</h4>
                  <p className="text-sm" style={{ color: theme.text.gray400 }}>
                    Communicate safely through our platform
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium mb-1" style={{ color: theme.text.gray800 }}>Customer Reviews</h4>
                  <p className="text-sm" style={{ color: theme.text.gray400 }}>
                    Read feedback from other buyers
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}