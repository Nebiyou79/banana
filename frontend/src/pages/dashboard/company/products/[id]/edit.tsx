/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { productService, Product, UpdateProductData } from '@/services/productService';
import { ProductForm } from '@/components/Products/ProductForm';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeft, 
  Zap
} from 'lucide-react';
import { productToast } from '@/services/productService';

interface EditProductPageProps {
  product: Product;
  categories: any[];
}

export default function EditProductPage({ product, categories }: EditProductPageProps) {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.push(`/dashboard/company/products/${id}`);
  };

  const handleSubmit = async (data: UpdateProductData, images: File[]) => {
    setLoading(true);
    try {
      await productService.updateProduct(id as string, data, images);
      productToast.success('Product updated successfully!');
      router.push(`/dashboard/company/products/${id}`);
    } catch (error) {
      productToast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/company/products/${id}`);
  };

  const stockStatus = productService.getStockStatus(product.inventory);

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 border-b-4 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] rounded-2xl mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-2 border-white backdrop-blur-sm font-bold"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                
                <div>
                  <h1 className="text-3xl font-black text-white drop-shadow-lg">
                    Edit Product
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      className={
                        product.status === 'active' ? 'bg-green-500 text-white border-2 border-green-600 font-bold' :
                        product.status === 'inactive' ? 'bg-gray-500 text-white border-2 border-gray-600 font-bold' :
                        'bg-yellow-500 text-white border-2 border-yellow-600 font-bold'
                      }
                    >
                      {product.status}
                    </Badge>
                    {product.featured && (
                      <Badge className="bg-yellow-400 text-black border-2 border-gray-200 font-bold">
                        Featured
                      </Badge>
                    )}
                    <Badge className={`${stockStatus.className} border-2 font-bold`}>
                      {stockStatus.text}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/product/${product._id}`)}
                  className="bg-white/20 hover:bg-white/30 text-white border-2 border-white font-bold"
                >
                  View Live
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Card className="bg-white border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 border-b-4 border-gray-200">
            <CardTitle className="flex items-center text-white text-xl font-black">
              <Zap className="h-5 w-5 mr-2" />
              Edit Product: {product.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ProductForm
              product={product}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
            />
          </CardContent>
        </Card>
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

    return {
      props: {
        product,
        categories
      }
    };
  } catch (error) {
    return {
      notFound: true
    };
  }
};