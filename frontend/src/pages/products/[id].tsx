/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { motion } from 'framer-motion';
import { productService, Product, Company } from '@/services/productService';
import { ProductDetails } from '@/components/Products/ProductDetail';
import { ProductCard } from '@/components/Products/ProductCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  ArrowLeft,
  Share2,
  Heart,
  Star,
  Truck,
  Shield,
  ArrowRight,
  Clock,
  CheckCircle,
  Users,
  Eye,
  Package,
} from 'lucide-react';
import { productToast } from '@/services/productService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface ProductDetailsPageProps {
  product: Product | null;
  relatedProducts: Product[];
  company?: Company | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

export default function ProductDetailsPage({ product, relatedProducts, company }: ProductDetailsPageProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);

  if (!product) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <Card className="border border-gray-200 shadow-lg max-w-md mx-4">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Product Not Found</h2>
                <p className="text-gray-600 mb-6">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                <Button onClick={() => router.push('/products')} className="bg-blue-600 hover:bg-blue-700 text-white">Browse Products</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const handleBack = () => router.back();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
      productToast.success('Link copied to clipboard!');
    }
  };

  const formattedPrice = productService.formatPrice(product.price);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-6">
        {/* Header */}
        <motion.div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                Back to Products
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleShare} className="text-gray-600 hover:text-blue-600">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>

                <Button variant="ghost" size="sm" onClick={() => setIsLiked(!isLiked)} className="text-gray-600 hover:text-red-600">
                  <Heart className={`h-4 w-4 mr-2 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  {isLiked ? 'Saved' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Breadcrumb */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-600 flex items-center gap-2">
          <button onClick={() => router.push('/products')} className="hover:text-blue-600 transition">Products</button>
          <ArrowRight className="h-3 w-3" />
          <button onClick={() => router.push(`/products?category=${product.category}`)} className="hover:text-blue-600 transition">
            {product.category}
          </button>
          {product.subcategory && (
            <>
              <ArrowRight className="h-3 w-3" />
              <span className="text-blue-600 font-medium">{product.subcategory}</span>
            </>
          )}
        </nav>

        {/* Page grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
              <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                <ProductDetails product={product} company={company ?? undefined} onBack={handleBack} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6" />
              </motion.div>
            </div>

            {/* Sidebar - no price/stock duplication here; contains company & stats */}
            <div className="space-y-6">
              {/* Seller / Info Card */}
              {company && (
                <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        {company.logoUrl && (
                          <div className="relative">
                            <img src={productService.getImageUrl(company.logoUrl)} alt={company.name} className="h-12 w-12 rounded-lg object-cover border border-gray-200" />
                            {company.verified && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <h4 className="font-semibold text-gray-900">{company.name}</h4>
                          <p className="text-sm text-gray-600">{company.industry}</p>
                        </div>
                      </div>

                      {company.description && <p className="text-sm text-gray-600 mb-4 line-clamp-3">{company.description}</p>}

                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Trusted Partner</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>Active Seller</span>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">View All Products</Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Info / Guarantees */}
              <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" /> Product Highlights
                    </h4>

                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center gap-3">
                        <Truck className="h-4 w-4 text-gray-500" />
                        <span>Free shipping on orders over $50</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span>30-day money-back guarantee</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-gray-500" />
                        <span>Verified quality assurance</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>Usually ships within 24 hours</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Product Stats (no duplication of price/stock) */}
              <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.24 }}>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Star className="h-4 w-4 mr-2 text-amber-500" />
                      Product Stats
                    </h4>

                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span>Total Views</span>
                        <div className="flex items-center font-medium text-gray-900">
                          <Eye className="h-4 w-4 mr-1" />
                          {product.views}
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span>Created</span>
                        <div className="text-sm text-gray-700">{formatDate(product.createdAt)}</div>
                      </div>

                      <div className="flex justify-between items-center py-2">
                        <span>Last Updated</span>
                        <div className="text-sm text-gray-700">{formatDate(product.updatedAt)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 0 && (
            <section className="mt-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Related Products</h2>
                  <p className="text-gray-600">Similar products you might like</p>
                </div>
                <Button variant="ghost" onClick={() => router.push(`/products?category=${product.category}`)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <motion.div key={relatedProduct._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
                    <ProductCard product={relatedProduct} onView={(p: { _id: any; }) => router.push(`/products/${p._id}`)} showActions={false} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;

  try {
    const [product, relatedProducts] = await Promise.all([
      productService.getProduct(id as string),
      productService.getRelatedProducts(id as string, 4),
    ]);

    let company: Company | undefined;
    if (typeof product?.companyId === 'object') {
      company = product.companyId as Company;
    }

    return {
      props: {
        product: product ?? null,
        relatedProducts: relatedProducts ?? [],
        company: company ?? null,
      },
    };
  } catch (error) {
    return {
      props: {
        product: null,
        relatedProducts: [],
        company: null,
      },
    };
  }
};
