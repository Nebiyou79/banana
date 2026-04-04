// components/freelancer/PortfolioCard.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PortfolioItem } from '@/services/freelancerService';
import { getTheme } from '@/utils/color';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Briefcase,
  Image as ImageIcon,
  X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface PortfolioCardProps {
  item: PortfolioItem;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (id: string) => void;
  isOwnProfile?: boolean;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({
  item,
  onEdit,
  onDelete,
  isOwnProfile = false
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageErrors, setImageErrors] = useState<boolean[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Filter valid Cloudinary URLs
  const validImages = React.useMemo(() => {
    return (item.mediaUrls || []).filter(url =>
      url && typeof url === 'string' && url.includes('cloudinary.com')
    );
  }, [item.mediaUrls]);

  const hasMultipleImages = validImages.length > 1;

  // Theme detection
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeQuery.addEventListener('change', handleChange);

    return () => darkModeQuery.removeEventListener('change', handleChange);
  }, []);

  const theme = getTheme(isDarkMode ? 'dark' : 'light');

  // Initialize image errors
  useEffect(() => {
    setImageErrors(new Array(validImages.length).fill(false));
  }, [validImages.length]);

  const nextImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  const handleImageError = (index: number) => {
    setImageErrors(prev => {
      const newErrors = [...prev];
      newErrors[index] = true;
      return newErrors;
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this portfolio item?')) {
      setIsDeleting(true);
      await onDelete?.(item._id);
      setIsDeleting(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(item);
  };

  // Get optimized Cloudinary URL
  const getOptimizedImageUrl = useCallback((url: string, width: number, height: number) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    try {
      if (url.includes('/upload/')) {
        return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,g_auto,q_auto,f_auto/`);
      }
      return url;
    } catch {
      return url;
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // If no valid images, show minimal placeholder
  if (validImages.length === 0) {
    return (
      <div
        className="group rounded-lg overflow-hidden border transition-all duration-200 hover:shadow-md"
        style={{
          backgroundColor: theme.bg.surface,
          borderColor: theme.border.secondary
        }}
      >
        <div className="relative aspect-[4/3] bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
          {item.featured && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded-full">
              Featured
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm truncate" style={{ color: theme.text.primary }}>
            {item.title}
          </h3>
          <p className="text-xs mt-1 line-clamp-2" style={{ color: theme.text.secondary }}>
            {item.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="group rounded-lg overflow-hidden border transition-all duration-200 hover:shadow-md relative"
        style={{
          backgroundColor: theme.bg.surface,
          borderColor: theme.border.secondary
        }}
      >
        {/* Image Section - 60% of card */}
        <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
          {/* Current Image */}
          <div className="relative w-full h-full">
            {!imageErrors[currentImageIndex] ? (
              <Image
                src={getOptimizedImageUrl(validImages[currentImageIndex], 400, 300)}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => handleImageError(currentImageIndex)}
                priority={currentImageIndex === 0}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Featured Badge */}
          {item.featured && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded-full z-10">
              Featured
            </div>
          )}

          {/* Image Navigation - Only if multiple images */}
          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded-full z-10">
                {currentImageIndex + 1}/{validImages.length}
              </div>
            </>
          )}

          {/* View Preview Button */}
          <button
            onClick={() => setShowPreview(true)}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
          >
            <div className="bg-white dark:bg-gray-900 rounded-full p-2 shadow-lg">
              <Eye className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </div>
          </button>

          {/* Edit/Delete Buttons */}
          {isOwnProfile && onEdit && onDelete && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button
                onClick={handleEdit}
                className="p-1.5 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg hover:bg-amber-50 dark:hover:bg-amber-900/30"
              >
                <ChevronLeft className="w-3 h-3 text-amber-600 rotate-90" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                {isDeleting ? (
                  <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <X className="w-3 h-3 text-red-600" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Content Section - 40% of card */}
        <div className="p-3">
          <h3 className="font-medium text-sm truncate" style={{ color: theme.text.primary }}>
            {item.title}
          </h3>
          
          <p className="text-xs mt-1 line-clamp-2" style={{ color: theme.text.secondary }}>
            {item.description}
          </p>

          {/* Meta Info */}
          <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: theme.text.muted }}>
            {item.client && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                <span className="truncate max-w-[80px]">{item.client}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(item.createdAt)}
            </span>
          </div>

          {/* Technologies - Optional minimal display */}
          {item.technologies && item.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.technologies.slice(0, 2).map((tech, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 text-[10px] rounded"
                  style={{
                    backgroundColor: isDarkMode ? `${theme.bg.gold}20` : `${theme.bg.gold}10`,
                    color: theme.bg.gold,
                  }}
                >
                  {tech}
                </span>
              ))}
              {item.technologies.length > 2 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                  +{item.technologies.length - 2}
                </span>
              )}
            </div>
          )}

          {/* View Details Link */}
          <Link
            href={`/dashboard/freelancer/portfolio/${item._id}`}
            className="block mt-3 text-xs font-medium hover:underline"
            style={{ color: theme.bg.gold }}
          >
            View Details →
          </Link>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <button
            onClick={() => setShowPreview(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative max-w-4xl w-full h-[80vh]" onClick={(e) => e.stopPropagation()}>
            {!imageErrors[currentImageIndex] ? (
              <Image
                src={getOptimizedImageUrl(validImages[currentImageIndex], 1200, 800)}
                alt={item.title}
                fill
                className="object-contain"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <ImageIcon className="w-16 h-16" />
              </div>
            )}

            {/* Preview Navigation */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/20 text-white text-sm rounded-full">
                  {currentImageIndex + 1} / {validImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PortfolioCard;