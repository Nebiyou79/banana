/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Product, Company, productService } from '@/services/productService';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/social/ui/Button';
import {
  Star,
  Eye,
  Edit3,
  Trash2,
  MoreVertical,
  Heart,
  ShoppingCart,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

interface ProfileCardProps {
  product: Product;
  company?: Company;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onView?: (product: Product) => void;
  onStatusChange?: (product: Product, status: Product['status']) => void;
  currentUser?: any;
  className?: string;
  showActions?: boolean;
}

export const ProductCard: React.FC<ProfileCardProps> = ({
  product,
  company,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  currentUser,
  className,
  showActions = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const canManage = productService.canManageProduct(product, currentUser);
  const stockStatus = productService.getStockStatus(product.inventory);
  const formattedPrice = productService.formatPrice(product.price);
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const imageUrl = primaryImage ? productService.getImageUrl(primaryImage.url) : null;

  return (
    <Card
      className={cn(
        "group bg-white border border-gray-100 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden",
        className
      )}
    >
      {/* IMAGE SECTION */}
      <div
        className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer rounded-b-none"
        onClick={() => onView?.(product)}
      >
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={primaryImage.altText}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-95"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-gray-400 text-center">
              <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <p className="text-sm">No Image Available</p>
            </div>
          </div>
        )}

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
          {product.featured && (
            <Badge className="bg-yellow-500 text-white border-none px-2 py-1 text-xs shadow-md rounded-md">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured
            </Badge>
          )}
          <Badge
            className={cn(
              "border-none text-white text-xs shadow-md rounded-md px-2 py-1",
              product.status === "active" && "bg-emerald-500",
              product.status === "inactive" && "bg-gray-500",
              product.status === "draft" && "bg-amber-500"
            )}
          >
            {product.status}
          </Badge>
        </div>

        {/* Like Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-9 w-9 bg-white/90 backdrop-blur-md hover:bg-white shadow-lg rounded-full transition-all"
          onClick={handleLike}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-all",
              isLiked ? "fill-red-500 text-red-500 scale-110" : "text-gray-600"
            )}
          />
        </Button>

        {/* Stock Status */}
        <div className="absolute bottom-3 left-3 z-20">
          <Badge
            className={cn(
              "border-none text-white text-xs shadow-md px-2 py-1 rounded-md",
              stockStatus.className.includes("green") && "bg-emerald-500",
              stockStatus.className.includes("red") && "bg-red-500",
              stockStatus.className.includes("orange") && "bg-amber-500"
            )}
          >
            {stockStatus.text}
          </Badge>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <CardContent className="p-5">
        {/* Company */}
        {company && (
          <div className="flex items-center gap-2 mb-4">
            {company.logoUrl && (
              <img
                src={productService.getImageUrl(company.logoUrl)}
                alt={company.name}
                className="h-5 w-5 rounded object-cover ring-1 ring-gray-200"
              />
            )}
            <span className="text-xs text-gray-600 font-medium truncate">{company.name}</span>
            {company.verified && (
              <Badge className="h-4 px-1 text-[10px] bg-blue-500/10 text-blue-600 border border-blue-300">
                ✓ Verified
              </Badge>
            )}
          </div>
        )}

        {/* Title */}
        <h3
          className="font-semibold text-gray-900 mb-2 text-base line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors leading-tight"
          onClick={() => onView?.(product)}
        >
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {product.shortDescription || product.description}
        </p>

        {/* Price + Actions */}
        <div className="flex items-end justify-between mt-auto">
          <div>
            <span className="font-bold text-2xl text-gray-900">{formattedPrice}</span>

            {product.views !== undefined && (
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Eye className="h-3 w-3 mr-1" />
                {product.views} views
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              onClick={() => onView?.(product)}
            >
              View
            </Button>

            {showActions && canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg p-1">
                  <DropdownMenuItem
                    onClick={() => onEdit?.(product)}
                    className="rounded-md"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Product
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onView?.(product)}
                    className="rounded-md"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>

                  {/* Status */}
                  {product.status !== "active" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange?.(product, "active")}
                      className="rounded-md"
                    >
                      <div className="h-2 w-2 bg-emerald-500 rounded-full mr-2" />
                      Set Active
                    </DropdownMenuItem>
                  )}

                  {product.status !== "inactive" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange?.(product, "inactive")}
                      className="rounded-md"
                    >
                      <div className="h-2 w-2 bg-gray-500 rounded-full mr-2" />
                      Set Inactive
                    </DropdownMenuItem>
                  )}

                  {product.status !== "draft" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange?.(product, "draft")}
                      className="rounded-md"
                    >
                      <div className="h-2 w-2 bg-amber-500 rounded-full mr-2" />
                      Set Draft
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => onDelete?.(product)}
                    className="text-red-600 rounded-md focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-4">
            {product.tags.slice(0, 2).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs bg-gray-50 text-gray-600 border-gray-200 rounded-md"
              >
                #{tag}
              </Badge>
            ))}
            {product.tags.length > 2 && (
              <Badge
                variant="outline"
                className="text-xs bg-gray-50 text-gray-600 border-gray-200 rounded-md"
              >
                +{product.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
