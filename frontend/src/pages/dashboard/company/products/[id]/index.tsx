/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { productService, Product, Company } from '@/services/productService';
import { ProductDetails } from '@/components/Products/ProductDetail';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  ArrowLeft, 
  Edit3, 
  Eye, 
  BarChart3, 
  Settings,
  Copy,
  Trash2,
  MoreVertical,
  Share2,
  Heart,
  Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { productToast } from '@/services/productService';

interface CompanyProductDetailsPageProps {
  product: Product;
  company?: Company;
  categories: any[];
}

export default function CompanyProductDetailsPage({ product, company }: CompanyProductDetailsPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLiked, setIsLiked] = useState(false);

  if (!product) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 backdrop-blur-xl flex items-center justify-center p-6">
          <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl">
            <CardContent className="text-center py-12">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Product Not Found</h2>
              <p className="text-slate-600 mb-6 font-medium">The product you`re looking for doesn`t exist.</p>
              <Button 
                onClick={() => router.push('/dashboard/company/products')}
                className="bg-gradient-to-r from-amber-500/90 to-amber-600/90 text-white font-semibold border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              >
                Back to Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleBack = () => {
    router.push('/dashboard/company/products');
  };

  const handleEdit = () => {
    router.push(`/dashboard/company/products/${product._id}/edit`);
  };

  const handleStatusChange = async (status: Product['status']) => {
    try {
      await productService.updateProductStatus(product._id, status);
      productToast.success(`Product status updated to ${status}`);
      router.replace(router.asPath);
    } catch (error) {
      productToast.error('Failed to update product status');
    }
  };

  const handleDuplicate = async () => {
    try {
      const { ...productData } = product;
      const duplicateData = {
        ...productData,
        name: `${product.name} (Copy)`,
        sku: product.sku ? `${product.sku}-COPY` : undefined,
      };

      await productService.createProduct(duplicateData as any, []);
      productToast.success('Product duplicated successfully');
      router.push('/dashboard/company/products');
    } catch (error) {
      productToast.error('Failed to duplicate product');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await productService.deleteProduct(product._id);
        productToast.success('Product deleted successfully');
        router.push('/dashboard/company/products');
      } catch (error) {
        productToast.error('Failed to delete product');
      }
    }
  };

  const stockStatus = productService.getStockStatus(product.inventory);

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 backdrop-blur-xl p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center gap-2 bg-white/60 backdrop-blur-sm hover:bg-white/80 text-slate-700 border border-white/40 font-medium rounded-xl transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    className={
                      product.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white border border-white/40 font-semibold backdrop-blur-sm' :
                      product.status === 'inactive' ? 'bg-gradient-to-r from-slate-400 to-slate-500 text-white border border-white/40 font-semibold backdrop-blur-sm' :
                      'bg-gradient-to-r from-amber-400 to-amber-500 text-white border border-white/40 font-semibold backdrop-blur-sm'
                    }
                  >
                    {product.status}
                  </Badge>
                  {product.featured && (
                    <Badge className="bg-gradient-to-r from-amber-400/90 to-amber-500/90 text-white border border-white/40 font-semibold backdrop-blur-sm">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  <Badge className={`${stockStatus.className} border border-white/40 font-semibold backdrop-blur-sm`}>
                    {stockStatus.text}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsLiked(!isLiked)}
                className="bg-white/60 backdrop-blur-sm hover:bg-white/80 text-slate-700 border border-white/40 rounded-xl"
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                Like
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="bg-white/60 backdrop-blur-sm hover:bg-white/80 text-slate-700 border border-white/40 rounded-xl"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              <Button 
                onClick={handleEdit}
                className="bg-gradient-to-r from-amber-500/90 to-amber-600/90 hover:from-amber-600 hover:to-amber-700 text-white font-semibold border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="bg-white/60 backdrop-blur-sm hover:bg-white/80 text-slate-700 border border-white/40 rounded-xl"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-xl shadow-xl">
                  <DropdownMenuItem onClick={handleDuplicate} className="font-medium rounded-lg">
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  
                  {product.status !== 'active' && (
                    <DropdownMenuItem onClick={() => handleStatusChange('active')} className="font-medium rounded-lg">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full mr-2" />
                      Set Active
                    </DropdownMenuItem>
                  )}
                  {product.status !== 'inactive' && (
                    <DropdownMenuItem onClick={() => handleStatusChange('inactive')} className="font-medium rounded-lg">
                      <div className="h-2 w-2 bg-slate-500 rounded-full mr-2" />
                      Set Inactive
                    </DropdownMenuItem>
                  )}
                  {product.status !== 'draft' && (
                    <DropdownMenuItem onClick={() => handleStatusChange('draft')} className="font-medium rounded-lg">
                      <div className="h-2 w-2 bg-amber-500 rounded-full mr-2" />
                      Set Draft
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600 font-semibold focus:text-red-600 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-1">
                <TabsTrigger 
                  value="overview"
                  className="font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/90 data-[state=active]:to-amber-600/90 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/30 rounded-lg transition-all duration-300"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics"
                  className="font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/90 data-[state=active]:to-emerald-600/90 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/30 rounded-lg transition-all duration-300"
                >
                  Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="seo"
                  className="font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/90 data-[state=active]:to-blue-600/90 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/30 rounded-lg transition-all duration-300"
                >
                  SEO
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/90 data-[state=active]:to-purple-600/90 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/30 rounded-lg transition-all duration-300"
                >
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <ProductDetails
                  product={product}
                  company={company}
                  onEdit={handleEdit}
                  onBack={handleBack}
                  currentUser={{ role: 'company' }}
                  className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg"
                />
              </TabsContent>

              <TabsContent value="analytics">
                <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl">
                  <CardHeader className="border-b border-white/30">
                    <CardTitle className="flex items-center text-slate-900 font-semibold">
                      <BarChart3 className="h-5 w-5 mr-2 text-emerald-500/80" />
                      Product Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 border border-white/40 rounded-xl bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 backdrop-blur-sm">
                        <div className="text-2xl font-bold text-slate-900">{product.views}</div>
                        <div className="text-slate-600 font-medium">Total Views</div>
                      </div>
                      <div className="text-center p-6 border border-white/40 rounded-xl bg-gradient-to-br from-blue-50/50 to-blue-100/30 backdrop-blur-sm">
                        <div className="text-2xl font-bold text-slate-900">0</div>
                        <div className="text-slate-600 font-medium">Orders</div>
                      </div>
                      <div className="text-center p-6 border border-white/40 rounded-xl bg-gradient-to-br from-purple-50/50 to-purple-100/30 backdrop-blur-sm">
                        <div className="text-2xl font-bold text-slate-900">0%</div>
                        <div className="text-slate-600 font-medium">Conversion Rate</div>
                      </div>
                    </div>
                    <div className="mt-6 text-center text-slate-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">Advanced analytics coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seo">
                <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl">
                  <CardHeader className="border-b border-white/30">
                    <CardTitle className="text-slate-900 font-semibold">SEO Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="p-4 border border-white/40 rounded-xl bg-blue-50/50 backdrop-blur-sm">
                      <h4 className="font-semibold text-slate-900 mb-2">Meta Title</h4>
                      <p className="text-slate-600 font-medium">{product.metaTitle || 'Not set'}</p>
                    </div>
                    <div className="p-4 border border-white/40 rounded-xl bg-blue-50/50 backdrop-blur-sm">
                      <h4 className="font-semibold text-slate-900 mb-2">Meta Description</h4>
                      <p className="text-slate-600 font-medium">{product.metaDescription || 'Not set'}</p>
                    </div>
                    <div className="p-4 border border-white/40 rounded-xl bg-blue-50/50 backdrop-blur-sm">
                      <h4 className="font-semibold text-slate-900 mb-2">URL Slug</h4>
                      <p className="text-slate-600 font-medium">/product/{product._id}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl">
                  <CardHeader className="border-b border-white/30">
                    <CardTitle className="flex items-center text-slate-900 font-semibold">
                      <Settings className="h-5 w-5 mr-2 text-purple-500/80" />
                      Product Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex justify-between items-center p-4 border border-white/40 rounded-xl bg-amber-50/50 backdrop-blur-sm">
                      <div>
                        <h4 className="font-semibold text-slate-900">Product Status</h4>
                        <p className="text-slate-600 font-medium">Current status: {product.status}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="border border-white/40 bg-white/50 backdrop-blur-sm font-medium rounded-xl">
                            Change Status
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-xl shadow-xl">
                          <DropdownMenuItem onClick={() => handleStatusChange('active')} className="font-medium rounded-lg">
                            Set Active
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange('inactive')} className="font-medium rounded-lg">
                            Set Inactive
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange('draft')} className="font-medium rounded-lg">
                            Set Draft
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex justify-between items-center p-4 border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm">
                      <div>
                        <h4 className="font-semibold text-slate-900">Featured Product</h4>
                        <p className="text-slate-600 font-medium">
                          {product.featured ? 'This product is featured' : 'This product is not featured'}
                        </p>
                      </div>
                      <Badge className={product.featured ? 'bg-gradient-to-r from-amber-400/90 to-amber-500/90 text-white border border-white/40 font-semibold backdrop-blur-sm' : 'border border-white/40 font-semibold backdrop-blur-sm'}>
                        {product.featured ? 'Featured' : 'Not Featured'}
                      </Badge>
                    </div>

                    <div className="p-4 border border-white/40 rounded-xl bg-red-50/50 backdrop-blur-sm">
                      <h4 className="font-semibold text-red-900 mb-2">Danger Zone</h4>
                      <p className="text-red-700 font-medium mb-4">
                        Once you delete a product, there is no going back. Please be certain.
                      </p>
                      <Button 
                        variant="destructive" 
                        onClick={handleDelete}
                        className="bg-gradient-to-r from-red-500/90 to-rose-500/90 text-white font-semibold border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete this product
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl">
              <CardHeader className="border-b border-white/30">
                <CardTitle className="text-slate-900 text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Button 
                  onClick={handleEdit}
                  className="w-full bg-gradient-to-r from-amber-500/90 to-amber-600/90 text-white font-semibold border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Product
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDuplicate}
                  className="w-full border border-white/40 bg-white/50 backdrop-blur-sm font-medium hover:bg-white/70 rounded-xl"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border border-white/40 bg-white/50 backdrop-blur-sm font-medium hover:bg-white/70 rounded-xl"
                  onClick={() => window.open(`/product/${product._id}`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Live
                </Button>
              </CardContent>
            </Card>

            {/* Product Info */}
            <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl">
              <CardHeader className="border-b border-white/30">
                <CardTitle className="text-slate-900 text-lg font-semibold">Product Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-3 border border-white/40 rounded-xl bg-blue-50/50 backdrop-blur-sm">
                  <p className="text-sm font-medium text-slate-600">SKU</p>
                  <p className="font-mono font-semibold">{product.sku || 'Not set'}</p>
                </div>
                <div className="p-3 border border-white/40 rounded-xl bg-blue-50/50 backdrop-blur-sm">
                  <p className="text-sm font-medium text-slate-600">Category</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge className="bg-gradient-to-r from-blue-400/90 to-blue-500/90 text-white border border-white/40 font-semibold backdrop-blur-sm">
                      {product.category}
                    </Badge>
                    {product.subcategory && (
                      <Badge variant="outline" className="border border-white/40 font-semibold backdrop-blur-sm">
                        {product.subcategory}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-3 border border-white/40 rounded-xl bg-blue-50/50 backdrop-blur-sm">
                  <p className="text-sm font-medium text-slate-600">Created</p>
                  <p className="font-semibold">{new Date(product.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="p-3 border border-white/40 rounded-xl bg-blue-50/50 backdrop-blur-sm">
                  <p className="text-sm font-medium text-slate-600">Last Updated</p>
                  <p className="font-semibold">{new Date(product.updatedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;

  try {
    const [product, categories] = await Promise.all([
      productService.getProduct(id as string),
      productService.getCategories()
    ]);

    let company: Company | undefined;
    if (typeof product.companyId === 'object') {
      company = product.companyId as Company;
    }

    return {
      props: {
        product,
        company: company || null,
        categories
      }
    };
  } catch (error) {
    return {
      notFound: true
    };
  }
};