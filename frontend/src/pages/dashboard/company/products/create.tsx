/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { productService, CreateProductData, UpdateProductData } from '@/services/productService';
import { ProductForm } from '@/components/Products/ProductForm';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeft, 
  Sparkles,
  Zap,
  Crown
} from 'lucide-react';
import { productToast } from '@/services/productService';

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

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

  const handleBack = () => {
    router.push('/dashboard/company/products');
  };

  const handleSubmit = async (data: CreateProductData | UpdateProductData, images: File[]) => {
    setLoading(true);
    try {
      // Validate that we have all required fields for creation
      if (!data.name || !data.description || !data.price || !data.category) {
        productToast.error('Please fill in all required fields');
        return;
      }

      // Create a properly typed CreateProductData object
      const createData: CreateProductData = {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        shortDescription: data.shortDescription || '',
        tags: data.tags || [],
        specifications: data.specifications || [{ key: '', value: '' }],
        featured: data.featured || false,
        metaTitle: data.metaTitle || '',
        metaDescription: data.metaDescription || '',
        sku: data.sku || '',
        inventory: data.inventory || {
          quantity: 0,
          trackQuantity: false,
          lowStockAlert: 10
        }
      };

      await productService.createProduct(createData, images);
      productToast.success('Product created successfully!');
      router.push('/dashboard/company/products');
    } catch (error) {
      productToast.error('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/company/products');
  };

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
                <h1 className="text-3xl font-bold text-slate-900">
                  Create New Product
                </h1>
                <p className="text-slate-600 mt-1 font-medium">
                  Launch your next big thing with premium style
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-amber-400/90 to-amber-500/90 text-white border border-white/40 font-semibold backdrop-blur-sm px-3 py-1 rounded-lg">
                <Sparkles className="h-3 w-3 mr-1" />
                DRAFT MODE
              </Badge>
            </div>
          </div>
        </div>

        <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl">
          <CardHeader className="border-b border-white/30">
            <CardTitle className="flex items-center text-slate-900 text-xl font-semibold">
              <Zap className="h-5 w-5 mr-2 text-amber-500/80" />
              Create Your Product
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ProductForm
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