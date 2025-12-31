/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Product, Company, productService } from '@/services/productService';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/social/ui/Button';
import {
  Star,
  Eye,
  Calendar,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Maximize,
  X,
  Edit3,
  MoreVertical,
  Trash2,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface ProfileDetailsProps {
  product: Product;
  company?: Company;
  currentUser?: any;
  className?: string;
  onBack?: () => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
  onStatusChange?: (product: Product, status: Product['status']) => void;
}

/**
 * EnhancedGallery
 * - supports images and videos (if item.type === 'video')
 * - zoom-on-hover (desktop)
 * - basic pinch-to-zoom (mobile/touch)
 * - fullscreen lightbox with keyboard navigation
 * - thumbnail slider with scroll-snap and active indicator
 * - wider gallery layout
 */
const EnhancedGallery: React.FC<{
  product: Product;
  currentIndex: number;
  onIndexChange: (i: number) => void;
}> = ({ product, currentIndex, onIndexChange }) => {
  const items = product.images ?? [];
  const current = items[currentIndex] ?? null;
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const thumbStripRef = useRef<HTMLDivElement | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 }); // percent
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // Touch/pinch state
  const pinchStateRef = useRef<{
    initialDistance?: number;
    lastScale: number;
  }>({ lastScale: 1 });

  useEffect(() => {
    // scroll active thumbnail into view
    const thumbs = thumbStripRef.current;
    if (!thumbs) return;
    const active = thumbs.querySelector<HTMLElement>(`[data-thumb-index="${currentIndex}"]`);
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!fullscreenOpen) return;
      if (e.key === 'ArrowRight') onIndexChange((currentIndex + 1) % Math.max(items.length, 1));
      if (e.key === 'ArrowLeft') onIndexChange((currentIndex - 1 + items.length) % Math.max(items.length, 1));
      if (e.key === 'Escape') setFullscreenOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreenOpen, currentIndex, items.length, onIndexChange]);

  // pointer move for desktop zoom origin
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!galleryRef.current) return;
    const rect = galleryRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
  };

  // touch handlers for pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = distance(e.touches[0], e.touches[1]);
      pinchStateRef.current.initialDistance = d;
      pinchStateRef.current.lastScale = 1;
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStateRef.current.initialDistance) {
      const d = distance(e.touches[0], e.touches[1]);
      const scale = d / (pinchStateRef.current.initialDistance || d);
      pinchStateRef.current.lastScale = Math.min(Math.max(scale, 1), 3); // clamp 1..3
      setIsZoomed(pinchStateRef.current.lastScale > 1.02);
      // set origin to midpoint
      const rect = galleryRef.current?.getBoundingClientRect();
      if (rect) {
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const x = ((midX - rect.left) / rect.width) * 100;
        const y = ((midY - rect.top) / rect.height) * 100;
        setZoomOrigin({ x, y });
      }
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    // reset if fingers lifted
    if (e.touches.length < 2) {
      pinchStateRef.current.initialDistance = undefined;
      pinchStateRef.current.lastScale = 1;
      // keep zoom state off; user can open fullscreen for zooming
      setTimeout(() => setIsZoomed(false), 150);
    }
  };

  function distance(a: Touch, b: Touch) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  const isVideo = (item: any) => item?.type === 'video' || /\.mp4|\.webm|youtube\.com|vimeo\.com/.test(item?.url ?? '');

  // Main image display with proper sizing
  const renderMainImage = () => {
    if (!current) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium">No Image Available</p>
          </div>
        </div>
      );
    }

    if (isVideo(current)) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <div className="text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">▶</span>
            </div>
            <p className="text-sm">Video Content</p>
          </div>
        </div>
      );
    }

    return (
      <motion.img
        key={current.url}
        src={productService.getImageUrl(current.url)}
        alt={current.altText ?? product.name}
        className={cn(
          "w-full h-full object-contain transition-all duration-500",
          isZoomed && "scale-150 cursor-zoom-out"
        )}
        style={{
          transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
        }}
        draggable={false}
      />
    );
  };

  return (
    <>
      <div className="space-y-4">
        <Card className="overflow-hidden rounded-3xl shadow-2xl border-2 border-gray-100">
          <CardContent className="p-0">
            <div
              ref={galleryRef}
              className="relative bg-gray-100 w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden touch-none cursor-zoom-in"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setIsZoomed(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex + '-' + (current?.url ?? '')}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {renderMainImage()}
                </motion.div>
              </AnimatePresence>

              {/* Controls */}
              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous"
                    onClick={(e) => {
                      e.stopPropagation();
                      onIndexChange((currentIndex - 1 + items.length) % items.length);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm border-2 border-gray-200 shadow-lg rounded-full p-3 hover:scale-105 transition-transform z-10"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>

                  <button
                    type="button"
                    aria-label="Next"
                    onClick={(e) => {
                      e.stopPropagation();
                      onIndexChange((currentIndex + 1) % items.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm border-2 border-gray-200 shadow-lg rounded-full p-3 hover:scale-105 transition-transform z-10"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white text-sm px-4 py-2 rounded-full shadow-lg tracking-wide border border-white/20">
                    {currentIndex + 1} / {items.length}
                  </div>
                </>
              )}

              {/* Fullscreen toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenOpen(true);
                }}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow hover:scale-105 transition border-2 border-gray-200 z-10"
                aria-label="Open fullscreen"
                title="Open fullscreen"
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Thumbnail strip (scroll-snap) */}
        {items.length > 1 && (
          <div
            ref={thumbStripRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-2 py-3 -mx-2"
            role="tablist"
            aria-label="Product thumbnails"
          >
            {items.map((it, i) => (
              <button
                key={i}
                data-thumb-index={i}
                onClick={() => onIndexChange(i)}
                className={cn(
                  'snap-start flex-shrink-0 w-24 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden border-2 transition-all bg-white',
                  i === currentIndex
                    ? 'border-blue-600 ring-4 ring-blue-200 shadow-lg scale-105'
                    : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                )}
                aria-current={i === currentIndex}
                title={`View image ${i + 1}`}
                role="tab"
              >
                {isVideo(it) ? (
                  <div className="w-full h-full bg-black flex items-center justify-center text-white text-sm">
                    <span className="text-lg">▶</span>
                  </div>
                ) : (
                  <img
                    src={productService.getImageUrl(it.url)}
                    alt={it.altText ?? `${product.name} ${i + 1}`}
                    className="w-full h-full object-cover object-center"
                    draggable={false}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {fullscreenOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
            aria-label="Image viewer"
          >
            <div className="absolute top-6 right-6 z-[1010] flex gap-2">
              <button
                onClick={() => setFullscreenOpen(false)}
                className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors border border-white/30"
                aria-label="Close"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="w-full max-w-6xl max-h-[90vh] relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-[1010]">
                <button
                  onClick={() => onIndexChange((currentIndex - 1 + items.length) % items.length)}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-4 transition-colors border border-white/30"
                  aria-label="Previous fullscreen"
                >
                  <ChevronLeft className="h-7 w-7 text-white" />
                </button>
              </div>

              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1010]">
                <button
                  onClick={() => onIndexChange((currentIndex + 1) % items.length)}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-4 transition-colors border border-white/30"
                  aria-label="Next fullscreen"
                >
                  <ChevronRight className="h-7 w-7 text-white" />
                </button>
              </div>

              {/* Fullscreen content */}
              <div className="w-full h-full flex items-center justify-center p-8">
                {current && !isVideo(current) ? (
                  <img
                    src={productService.getImageUrl(current.url)}
                    alt={current.altText ?? product.name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-white text-center">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">▶</span>
                    </div>
                    <p className="text-lg">Video Content</p>
                  </div>
                )}
              </div>

              {/* caption / index */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-lg font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                {current?.altText ?? `${currentIndex + 1} / ${items.length}`}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const ProductDetails: React.FC<ProfileDetailsProps> = ({
  product,
  company,
  currentUser,
  className,
  onBack,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = productService.canManageProduct(product, currentUser);
  const stockStatus = productService.getStockStatus(product.inventory);
  const formattedPrice = productService.formatPrice(product.price);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.(product);
      setDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete product:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = () => {
    onDuplicate?.(product);
  };

  const handleStatusChange = (status: Product['status']) => {
    onStatusChange?.(product, status);
  };

  return (
    <div className={cn('min-h-screen bg-transparent', className)}>
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => !isDeleting && setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? This action cannot be undone and all product data will be permanently removed.`}
        confirmText="Delete Product"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Top row: back + actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 border-2 border-gray-300 hover:border-gray-400 font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
          <div className="hidden sm:flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> {product.views} views
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(product.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLiked(!isLiked)}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 border-2 border-gray-300 font-bold"
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'
              )}
            />
            <span className="sr-only">Save</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigator.clipboard?.writeText(window.location.href)
            }
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 border-2 border-gray-300 font-bold"
          >
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share</span>
          </Button>

          {canManage && onEdit && (
            <Button 
              onClick={() => onEdit(product)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          )}

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="border-2 border-gray-300 hover:border-gray-400 font-bold"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-white border-2 border-gray-200 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] min-w-[200px] p-2"
              >
                <DropdownMenuItem 
                  onClick={handleDuplicate}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold hover:bg-blue-50 cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate Product
                </DropdownMenuItem>
                
                {/* Status Options */}
                {product.status !== 'active' && (
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange('active')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold hover:bg-green-50 cursor-pointer"
                  >
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    Set Active
                  </DropdownMenuItem>
                )}
                {product.status !== 'inactive' && (
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange('inactive')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="h-2 w-2 bg-gray-500 rounded-full" />
                    Set Inactive
                  </DropdownMenuItem>
                )}
                {product.status !== 'draft' && (
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange('draft')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold hover:bg-yellow-50 cursor-pointer"
                  >
                    <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                    Set Draft
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem 
                  onClick={() => setDeleteModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold hover:bg-red-50 text-red-600 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Product
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Enhanced gallery */}
        <EnhancedGallery
          product={product}
          currentIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
        />

        {/* RIGHT: Product info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {product.featured && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-gray-200 font-bold flex items-center">
                  <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                </Badge>
              )}

              <Badge
                className={cn(
                  'border-2 font-bold',
                  product.status === 'active' && 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-600',
                  product.status === 'inactive' && 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-600',
                  product.status === 'draft' && 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-yellow-600'
                )}
              >
                {product.status}
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-gray-900 mb-3">
              {product.name}
            </h1>

            <p className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
              {formattedPrice}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: stockStatus.color }}
                />
                <span className="font-bold">{stockStatus.text}</span>
              </div>

              {product.inventory?.trackQuantity && (
                <div className="text-sm font-bold text-gray-600">
                  {product.inventory.quantity} in stock
                </div>
              )}
            </div>

            {/* short description */}
            {product.shortDescription && (
              <p className="text-gray-700 leading-relaxed mb-6 text-lg font-medium">{product.shortDescription}</p>
            )}
          </div>

          {/* Stock & quantity card */}
          <Card className="shadow-sm border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-600">Availability</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{stockStatus.text}</p>
                </div>
                {product.inventory?.trackQuantity && (
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-600">Stock Level</p>
                    <p className="text-xl font-black text-gray-900">{product.inventory.quantity} units</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Description + Specs */}
      <div className=" gap-6 mt-8">
        <Card className="border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-6">
            <h3 className="text-2xl font-black text-gray-900 mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
              {product.description}
            </p>
          </CardContent>
        </Card>

        {product.specifications?.length > 0 && (
          <Card className="border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <h3 className="text-2xl font-black text-gray-900 mb-4">Specifications</h3>
              <dl className="grid grid-cols-1 gap-y-4">
                {product.specifications.map((spec, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border-2 border-gray-200 rounded-xl bg-white">
                    <dt className="font-bold text-gray-800 text-lg">{spec.key}</dt>
                    <dd className="text-gray-600 font-medium text-lg">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;