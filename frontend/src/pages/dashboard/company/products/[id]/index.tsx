/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { EntityAvatar } from '@/components/layout/EntityAvatar';
import { useAuth } from '@/hooks/useAuth';
import { productService, Product } from '@/services/productService';
import { companyService, CompanyProfile } from '@/services/companyService';
import { colors, getTheme } from '@/utils/color';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/social/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/social/ui/Alert-Dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ProductDetail from '@/components/Products/ProductDetail';

export default function CompanyProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const theme = getTheme('light'); // Default to light theme

  useEffect(() => {
    const fetchProductAndCompany = async () => {
      if (!id || typeof id !== 'string' || authLoading) return;

      setLoading(true);
      try {
        // Fetch product
        const productData = await productService.getProduct(id);
        setProduct(productData);

        // Extract company info
        const companyId = typeof productData.companyId === 'string' 
          ? productData.companyId 
          : productData.companyId?._id;
        
        if (companyId) {
          // If company data is embedded in product
          if (typeof productData.companyId === 'object' && productData.companyId) {
            setCompany({
              _id: productData.companyId._id,
              name: productData.companyId.name,
              logoUrl: productData.companyId.logoUrl,
              verified: productData.companyId.verified,
              industry: productData.companyId.industry,
              description: productData.companyId.description,
              website: productData.companyId.website,
              user: { _id: '', name: '', email: '' }, // Placeholder
              createdAt: '',
              updatedAt: '',
              tin: '',
              address: '',
              phone: '',
              bannerUrl: ''
            });
          } else {
            // Fetch company separately
            const companyData = await companyService.getCompany(companyId);
            setCompany(companyData);
          }
        }
      } catch (error: any) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load product',
          variant: 'destructive',
        });
        
        // Redirect if product not found
        if (error.response?.status === 404) {
          router.push('/dashboard/company/products');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndCompany();
  }, [id, authLoading, router]);

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    try {
      await productService.deleteProduct(product._id);
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
        variant: 'success',
      });
      router.push('/dashboard/company/products');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async (status: 'active' | 'inactive' | 'draft') => {
    if (!product) return;

    try {
      const updatedProduct = await productService.updateProductStatus(product._id, status);
      setProduct(updatedProduct);
      toast({
        title: 'Success',
        description: `Product status updated to ${status}`,
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const canManage = product && user && productService.canManageProduct(product, user);

  if (authLoading || loading) {
    return (
      <DashboardLayout requiredRole="company">
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
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-10" />
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
      <DashboardLayout requiredRole="company">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-6">The product you`re looking for doesn`t exist or you don`t have permission to view it.</p>
            <Button onClick={() => router.push('/dashboard/company/products')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Get stock status
  const stockStatus = productService.getStockStatus(product.inventory);
  const formattedPrice = productService.formatPrice(product.price);

  return (
    <DashboardLayout requiredRole="company">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete `{product.name}`? This action cannot be undone and all product data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link 
                href="/dashboard/company/products" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                style={{ color: theme.text.gray400 }}
              >
                Products
              </Link>
            </li>
            <li>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </li>
            <li className="font-medium" style={{ color: theme.text.gray800 }}>
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Header with Company Info and Actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <EntityAvatar
                name={company?.name || 'Company'}
                avatar={company?.logoUrl}
                size="lg"
              />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold" style={{ color: theme.text.gray800 }}>
                    {product.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className={`
                      ${product.status === 'active' ? 'border-green-500 text-green-700' : ''}
                      ${product.status === 'inactive' ? 'border-gray-500 text-gray-700' : ''}
                      ${product.status === 'draft' ? 'border-amber-500 text-amber-700' : ''}
                    `}
                  >
                    {product.status}
                  </Badge>
                  {stockStatus && (
                    <Badge
                      variant="outline"
                      className="gap-1"
                      style={{
                        borderColor: stockStatus.color,
                        color: stockStatus.color
                      }}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: stockStatus.color }}
                      />
                      {stockStatus.text}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1" style={{ color: theme.text.gray400 }}>
                    <Building className="h-4 w-4" />
                    <span className="font-medium" style={{ color: theme.text.gray400 }}>
                      {company?.name || 'Your Company'}
                    </span>
                    {company?.verified && (
                      <Badge variant="outline" size="sm" className="ml-2 border-blue-500 text-blue-700">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1" style={{ color: theme.text.gray400 }}>
                    <Package className="h-4 w-4" />
                    <span>SKU: {product.sku || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.push(`/dashboard/company/products/${product._id}/edit`)}
                className="gap-2"
                style={{
                  backgroundColor: colors.goldenMustard,
                  color: colors.white
                }}
              >
                <Edit3 className="h-4 w-4" />
                Edit Product
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" style={{ borderColor: theme.border.gray100 }}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-xs font-medium" style={{ color: theme.text.gray400 }}>
                    Change Status
                  </div>
                  {product.status !== 'active' && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange('active')}
                      className="gap-2 cursor-pointer"
                    >
                      <CheckCircle className="h-4 w-4" style={{ color: theme.text.success }} />
                      Set Active
                    </DropdownMenuItem>
                  )}
                  {product.status !== 'inactive' && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange('inactive')}
                      className="gap-2 cursor-pointer"
                    >
                      <Clock className="h-4 w-4" style={{ color: theme.text.gray400 }} />
                      Set Inactive
                    </DropdownMenuItem>
                  )}
                  {product.status !== 'draft' && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange('draft')}
                      className="gap-2 cursor-pointer"
                    >
                      <AlertCircle className="h-4 w-4" style={{ color: theme.text.warning }} />
                      Set Draft
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="gap-2 cursor-pointer"
                    style={{ color: theme.text.error }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Product
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card style={{ borderColor: theme.border.gray100 }}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium" style={{ color: theme.text.gray400 }}>
                    Price
                  </div>
                  <div className="text-lg font-bold" style={{ color: colors.goldenMustard }}>
                    {formattedPrice}
                  </div>
                </div>
                <div className="text-xs" style={{ color: theme.text.gray400 }}>
                  {product.price.unit && product.price.unit !== 'unit' ? `/ ${product.price.unit}` : 'Per unit'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: theme.border.gray100 }}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium" style={{ color: theme.text.gray400 }}>
                    Stock
                  </div>
                  <div className={`text-lg font-bold ${stockStatus?.className}`}>
                    {product.inventory.trackQuantity ? product.inventory.quantity : '∞'}
                  </div>
                </div>
                <div className="text-xs" style={{ color: theme.text.gray400 }}>
                  {product.inventory.trackQuantity ? 'Units in stock' : 'Unlimited'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: theme.border.gray100 }}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium" style={{ color: theme.text.gray400 }}>
                    Views
                  </div>
                  <div className="text-lg font-bold" style={{ color: theme.text.blue }}>
                    {product.views}
                  </div>
                </div>
                <div className="text-xs" style={{ color: theme.text.gray400 }}>
                  Total views
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: theme.border.gray100 }}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium" style={{ color: theme.text.gray400 }}>
                    Category
                  </div>
                  <div className="text-sm font-medium" style={{ color: theme.text.gray800 }}>
                    {product.category}
                  </div>
                </div>
                <div className="text-xs" style={{ color: theme.text.gray400 }}>
                  {product.subcategory || 'No subcategory'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Product Detail Component */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: theme.border.gray100 }}>
          <ProductDetail
            productId={product._id}
            currentUser={user}
            theme="light"
            onBack={() => router.push('/dashboard/company/products')}
          />
        </div>

        {/* Company Info Card */}
        {company && (
          <Card className="mt-8" style={{ borderColor: theme.border.gray100 }}>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: theme.text.gray800 }}>
                <Building className="h-5 w-5" />
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1" style={{ color: theme.text.gray400 }}>
                      Company Name
                    </div>
                    <div className="font-medium" style={{ color: theme.text.gray800 }}>
                      {company.name}
                    </div>
                  </div>
                  {company.industry && (
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: theme.text.gray400 }}>
                        Industry
                      </div>
                      <div style={{ color: theme.text.gray400 }}>
                        {company.industry}
                      </div>
                    </div>
                  )}
                  {company.website && (
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: theme.text.gray400 }}>
                        Website
                      </div>
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        style={{ color: theme.text.blue }}
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {company.description && (
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: theme.text.gray400 }}>
                        Description
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: theme.text.gray800 }}>
                        {company.description}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/dashboard/company/profile')}
                      style={{ borderColor: theme.border.gray100 }}
                    >
                      Edit Company Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/company/products`)}
                      style={{ borderColor: theme.border.gray100 }}
                    >
                      View All Products
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}