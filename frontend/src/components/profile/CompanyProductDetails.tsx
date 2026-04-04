/* eslint-disable @typescript-eslint/no-explicit-any */
// components/profile/CompanyProductDetail.tsx
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/social/ui/Badge';
import { Product, productService } from '@/services/productService';
import { companyService, CompanyProfile } from '@/services/companyService';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/social/theme/RoleThemeProvider';
import { toast } from 'sonner';
import { getTheme } from '@/utils/color';
import { Hash } from 'crypto';
import { Package, Grid3X3, XCircle, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Check, Share2, BookmarkCheck, Bookmark, Edit, Loader2, Trash2, Tag, Eye, Calendar, ShoppingBag, MessageSquare, Truck, Clock, Building, Shield, Award, Users, HashIcon } from 'lucide-react';

interface CompanyProductDetailProps {
  product: Product;
  isOwnCompany?: boolean;
  currentUser?: any;
  onProductDeleted?: () => void;
  onClose?: () => void;
  themeMode?: 'light' | 'dark';
}

// Image Gallery Component
const ImageGallery: React.FC<{ images: any[]; productName: string; themeMode?: 'light' | 'dark' }> = ({ 
  images, 
  productName,
  themeMode = 'light' 
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const validImages = images?.filter(img => img?.secure_url || img?.url) || [];

  if (validImages.length === 0) {
    return (
      <div className={cn(
        "aspect-square rounded-xl flex items-center justify-center",
        themeMode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      )}>
        <Package className="w-16 h-16 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className={cn(
          "relative aspect-square rounded-xl overflow-hidden cursor-zoom-in",
          themeMode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
        )}
        onClick={() => setIsFullscreen(true)}
      >
        <img
          src={productService.getImageUrl(validImages[selectedImage], { width: 600, height: 600, crop: 'fill' })}
          alt={`${productName} - Image ${selectedImage + 1}`}
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
          onError={() => setImageErrors(prev => ({ ...prev, [selectedImage]: true }))}
        />
        
        {/* Image Count Badge */}
        {validImages.length > 1 && (
          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-sm flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            {selectedImage + 1} / {validImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {validImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all",
                selectedImage === index
                  ? "border-blue-500 ring-2 ring-blue-500/20"
                  : themeMode === 'dark'
                    ? "border-gray-700 hover:border-gray-500"
                    : "border-transparent hover:border-gray-300"
              )}
            >
              <img
                src={productService.getImageUrl(img, { width: 100, height: 100, crop: 'fill' })}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <XCircle className="w-8 h-8" />
          </button>
          
          <img
            src={productService.getImageUrl(validImages[selectedImage])}
            alt={productName}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />

          {validImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
                }}
                className="absolute left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Info Card Component
const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  themeMode?: 'light' | 'dark';
}> = ({ icon, label, value, color, themeMode = 'light' }) => (
  <div className={cn(
    "p-4 rounded-xl border",
    themeMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  )}>
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-lg", color || "bg-linear-to-r from-blue-500 to-cyan-500")}>
        {icon}
      </div>
      <div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
        <div className="text-lg font-semibold text-gray-900 dark:text-white">{value}</div>
      </div>
    </div>
  </div>
);

// Specification Item Component
const SpecItem: React.FC<{ label: string; value: string; themeMode?: 'light' | 'dark' }> = ({ 
  label, 
  value,
  themeMode 
}) => (
  <div className={cn(
    "flex items-start gap-3 p-3 rounded-lg border",
    themeMode === 'dark' ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
  )}>
    <div>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{value}</div>
    </div>
  </div>
);

export const CompanyProductDetail: React.FC<CompanyProductDetailProps> = ({
  product: initialProduct,
  isOwnCompany = false,
  currentUser,
  onProductDeleted,
  onClose,
  themeMode = 'light'
}) => {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'shipping'>('details');
  const [copied, setCopied] = useState(false);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  const theme = getTheme(themeMode);

  // Fetch company details if needed
  useEffect(() => {
    const fetchCompany = async () => {
      if (product.companyId && typeof product.companyId === 'string') {
        setLoadingCompany(true);
        try {
          const companyData = await companyService.getPublicCompany(product.companyId);
          setCompany(companyData);
        } catch (error) {
          console.error('Failed to fetch company:', error);
        } finally {
          setLoadingCompany(false);
        }
      } else if (typeof product.companyId === 'object' && product.companyId) {
        setCompany(product.companyId as any);
      }
    };

    fetchCompany();
  }, [product.companyId]);

  // Format price
  const formatPrice = (price: any) => {
    if (!price?.amount) return 'Price on request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(price.amount);
  };

  // Get stock status
  const getStockStatus = () => {
    if (!product.inventory?.trackQuantity) {
      return { 
        label: 'In Stock', 
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle,
        dot: 'bg-green-500'
      };
    }
    if (product.inventory.quantity > 10) {
      return { 
        label: 'In Stock', 
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle,
        dot: 'bg-green-500'
      };
    }
    if (product.inventory.quantity > 0) {
      return { 
        label: `Low Stock (${product.inventory.quantity} left)`, 
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        icon: AlertCircle,
        dot: 'bg-amber-500'
      };
    }
    return { 
      label: 'Out of Stock', 
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      icon: XCircle,
      dot: 'bg-red-500'
    };
  };

  const stockStatus = getStockStatus();
  const StockIcon = stockStatus.icon;

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removed from saved' : 'Saved to favorites');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    setIsDeleting(true);
    try {
      await productService.deleteProduct(product._id);
      toast.success('Product deleted successfully');
      onProductDeleted?.();
      onClose?.();
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };


  const handleEdit = () => {
    window.location.href = `/dashboard/company/products/edit/${product._id}`;
  };

  const handleViewCompany = () => {
    const companyId = typeof product.companyId === 'string' ? product.companyId : product.companyId?._id;
    if (companyId) {
      window.location.href = `/company/${companyId}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="gap-2 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </Button>

          <Button
            onClick={handleSaveToggle}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </>
            )}
          </Button>

          {isOwnCompany && (
            <>
              <Button
                onClick={handleEdit}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                disabled={isDeleting}
                className="gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <ImageGallery 
          images={product.images} 
          productName={product.name} 
          themeMode={themeMode}
        />

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title and Status */}
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h1>
              <Badge className={cn(
                "flex items-center gap-1",
                stockStatus.color
              )}>
                <StockIcon className="w-3 h-3" />
                {stockStatus.label}
              </Badge>
            </div>

            {/* Category and SKU */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {product.category && (
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Tag className="w-4 h-4" />
                  <span>{product.category}</span>
                  {product.subcategory && <span>· {product.subcategory}</span>}
                </div>
              )}
              {product.sku && (
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <HashIcon />
                  <span>SKU: {product.sku}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price */}
          <div className={cn(
            "p-6 rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 text-white"
          )}>
            <div className="text-sm opacity-90 mb-1">Price</div>
            <div className="text-3xl sm:text-4xl font-bold">{formatPrice(product.price)}</div>
            {product.price.unit && product.price.unit !== 'unit' && (
              <div className="text-sm opacity-90 mt-1">per {product.price.unit}</div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <InfoCard
              icon={<Eye className="w-4 h-4 text-white" />}
              label="Views"
              value={product.views?.toLocaleString() || '0'}
              color="bg-linear-to-r from-purple-500 to-pink-500"
              themeMode={themeMode}
            />
            <InfoCard
              icon={<Calendar className="w-4 h-4 text-white" />}
              label="Added"
              value={new Date(product.createdAt).toLocaleDateString()}
              color="bg-linear-to-r from-amber-500 to-orange-500"
              themeMode={themeMode}
            />
            {product.inventory?.trackQuantity && (
              <InfoCard
                icon={<Package className="w-4 h-4 text-white" />}
                label="Quantity"
                value={`${product.inventory.quantity} units`}
                color="bg-linear-to-r from-teal-500 to-cyan-500"
                themeMode={themeMode}
              />
            )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <div className={cn(
              "p-4 rounded-lg border",
              themeMode === 'dark' ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
            )}>
              <p className="text-gray-700 dark:text-gray-300">
                {product.shortDescription}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 gap-2"
            >
              <Truck className="w-5 h-5" />
              Request Quote
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={cn(
        "border-b mt-8",
        themeMode === 'dark' ? 'border-gray-800' : 'border-gray-200'
      )}>
        <div className="flex gap-6 overflow-x-auto pb-1">
          {[
            { id: 'details', label: 'Details' },
            { id: 'specs', label: 'Specifications' },
            { id: 'shipping', label: 'Shipping Info' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
              <div className={cn(
                "p-4 rounded-lg border prose max-w-none",
                themeMode === 'dark' ? 'border-gray-800 bg-gray-900/50 prose-invert' : 'border-gray-200 bg-gray-50'
              )}>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {product.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Specifications</h3>
            {product.specifications && product.specifications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.specifications.map((spec, index) => (
                  <SpecItem
                    key={index}
                    label={spec.key}
                    value={spec.value}
                    themeMode={themeMode}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No specifications available.</p>
            )}
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Shipping Information</h3>
            <div className={cn(
              "p-4 rounded-lg border",
              themeMode === 'dark' ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
            )}>
              <p className="text-gray-700 dark:text-gray-300">
                Standard shipping available worldwide. Contact seller for specific shipping rates and delivery times.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Truck className="w-4 h-4" />
                  <span>Free shipping on orders over $500</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Estimated delivery: 5-7 business days</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Company Info */}
      {(company || loadingCompany) && (
        <div className={cn(
          "mt-8 pt-6 border-t",
          themeMode === 'dark' ? 'border-gray-800' : 'border-gray-200'
        )}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sold by</h3>
          
          {loadingCompany ? (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ) : company ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <Building className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{company.name}</h4>
                  {company.industry && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{company.industry}</p>
                  )}
                  {company.verified && (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400">Verified Company</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleViewCompany}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Building className="w-4 h-4" />
                  View Profile
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Trust Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Secure Payment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Fast Delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Quality Assured</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Verified Seller</span>
        </div>
      </div>
    </div>
  );
};