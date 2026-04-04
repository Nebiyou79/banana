/* eslint-disable @typescript-eslint/no-explicit-any */
// components/freelancer/PortfolioDetails.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { PortfolioItem } from '@/services/freelancerService';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  X,
  Building2,
  Tag,
  Calendar,
  DollarSign,
  Clock,
  Code2,
  FileText,
  Link2,
  Share2,
  Bookmark,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Star,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Maximize2,
  Check,
  Globe,
  Lock,
  Eye,
  Download,
  Printer,
  Copy,
  Mail,
  Linkedin,
  Twitter,
  Facebook,
  Menu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PortfolioDetailsProps {
  item: PortfolioItem;
  isOwnProfile?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}

interface RelatedProject {
  _id: string;
  title: string;
  image: string;
  category: string;
}

// Helper function for touch targets
const getTouchTargetSize = (size: 'sm' | 'md' | 'lg' = 'md'): string => {
  const sizes = {
    sm: 'min-h-[36px] min-w-[36px]',
    md: 'min-h-[44px] min-w-[44px]',
    lg: 'min-h-[52px] min-w-[52px]'
  };
  return sizes[size];
};

const PortfolioDetails: React.FC<PortfolioDetailsProps> = ({
  item,
  isOwnProfile = false,
  onEdit,
  onDelete,
  onBack,
}) => {
  const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
  const [comment, setComment] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    description: true,
    technologies: true,
    links: true,
    stats: true
  });
  const [comments] = useState([
    {
      id: 1,
      user: 'Sarah Johnson',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      rating: 5,
      text: 'Amazing work! The attention to detail is impressive.',
      date: '2024-01-15',
      likes: 12,
    },
    {
      id: 2,
      user: 'Michael Chen',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      rating: 5,
      text: 'Great collaboration and exceeded expectations.',
      date: '2024-01-10',
      likes: 8,
    },
  ]);

  // Ensure we have valid media URLs
  const mediaUrls = item.mediaUrls?.filter(url => url && url.includes('cloudinary.com')) || [];
  const hasMultipleImages = mediaUrls.length > 1;

  // Get optimized Cloudinary URL with transformations
  const getOptimizedImageUrl = useCallback((url: string, width: number, height: number, quality = 'auto') => {
    if (!url || !url.includes('cloudinary.com')) return url;

    try {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/w_${width},h_${height},c_fill,g_auto,q_${quality},f_auto/${parts[1]}`;
      }
    } catch (e) {
      console.error('Error optimizing Cloudinary URL:', e);
    }
    return url;
  }, []);

  const handlePreviousImage = () => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : mediaUrls.length - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev < mediaUrls.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      if (e.key === 'ArrowLeft') handlePreviousImage();
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'Escape') setIsFullscreen(false);
    },
    [isFullscreen, handlePreviousImage, handleNextImage]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (amount?: number, currency = 'USD') => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getBudgetTypeLabel = (type?: string) => {
    if (!type) return '';
    const labels: Record<string, string> = {
      fixed: 'Fixed Price',
      hourly: 'Per Hour',
      daily: 'Per Day',
      monthly: 'Per Month',
    };
    return labels[type] || type;
  };

  const getCategoryLabel = (category?: string) => {
    if (!category) return 'Uncategorized';
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const descriptionLength = item.description?.length || 0;
  const shouldTruncate = descriptionLength > 300;
  const displayedDescription = shouldTruncate && !isDescriptionExpanded
    ? `${item.description?.slice(0, 300)}...`
    : item.description;

  // Fullscreen Gallery Modal
  const FullscreenGallery = () => {
    if (!isFullscreen) return null;

    return (
      <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center">
        <button
          onClick={() => setIsFullscreen(false)}
          className={cn(
            "absolute top-4 right-4 z-10 p-3 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-all",
            getTouchTargetSize('lg')
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {hasMultipleImages && (
          <>
            <button
              onClick={handlePreviousImage}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-all",
                getTouchTargetSize('lg')
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextImage}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-all",
                getTouchTargetSize('lg')
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
          <Image
            src={getOptimizedImageUrl(mediaUrls[selectedImageIndex], 1200, 800)}
            alt={`${item.title} - Image ${selectedImageIndex + 1}`}
            width={1200}
            height={800}
            className="max-w-full max-h-full object-contain"
            unoptimized
            priority
          />
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
          {selectedImageIndex + 1} / {mediaUrls.length}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={cn("min-h-screen", colorClasses.bg.primary)}>
        {/* Hero Gallery Section - Responsive */}
        {mediaUrls.length > 0 && (
          <div className={cn("relative", colorClasses.bg.secondary)}>
            {/* Main Image */}
            <div className={cn(
              "relative w-full overflow-hidden group",
              isMobile ? 'h-[250px]' : isTablet ? 'h-[400px]' : 'h-[500px] lg:h-[600px]'
            )}>
              <Image
                src={getOptimizedImageUrl(mediaUrls[selectedImageIndex], 1600, 900)}
                alt={item.title}
                fill
                className="object-contain md:object-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized
                priority
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Image Controls */}
              {hasMultipleImages && (
                <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handlePreviousImage}
                    className={cn(
                      "p-2 sm:p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all transform hover:scale-110",
                      getTouchTargetSize('lg')
                    )}
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className={cn(
                      "p-2 sm:p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all transform hover:scale-110",
                      getTouchTargetSize('lg')
                    )}
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}

              {/* Top Bar Overlay */}
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-between items-center">
                <div className="flex items-center gap-1 sm:gap-2">
                  {item.featured && (
                    <span className={cn(
                      "px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold flex items-center",
                      colorClasses.bg.amber,
                      colorClasses.text.white
                    )}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Featured</span>
                    </span>
                  )}
                  <span className={cn(
                    "px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold flex items-center",
                    item.visibility === 'public'
                      ? colorClasses.bg.emerald + ' ' + colorClasses.text.white
                      : colorClasses.bg.secondary + ' ' + colorClasses.text.secondary
                  )}>
                    {item.visibility === 'public' ? (
                      <>
                        <Globe className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Private</span>
                      </>
                    )}
                  </span>
                </div>

                <button
                  onClick={() => setIsFullscreen(true)}
                  className={cn(
                    "p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all",
                    getTouchTargetSize('lg')
                  )}
                  title="View fullscreen"
                >
                  <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Image Counter - Mobile only */}
              {hasMultipleImages && isMobile && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
                  {selectedImageIndex + 1} / {mediaUrls.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip - Desktop only */}
            {hasMultipleImages && !isMobile && (
              <div className="flex justify-center p-4 space-x-2 overflow-x-auto">
                {mediaUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all",
                      index === selectedImageIndex
                        ? 'border-amber-500 scale-110 shadow-lg'
                        : colorClasses.border.gray200 + ' opacity-70 hover:opacity-100'
                    )}
                  >
                    <Image
                      src={getOptimizedImageUrl(url, 80, 80)}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Project Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <h1 className={cn(
              "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4",
              colorClasses.text.primary
            )}>
              {item.title}
            </h1>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              {item.client && (
                <div className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm",
                  colorClasses.bg.secondary
                )}>
                  <Building2 className={cn("w-3 h-3 sm:w-4 sm:h-4", colorClasses.text.muted)} />
                  <span className={cn("font-medium", colorClasses.text.primary)}>
                    {item.client}
                  </span>
                </div>
              )}

              {item.category && (
                <div className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm",
                  colorClasses.bg.secondary
                )}>
                  <Tag className={cn("w-3 h-3 sm:w-4 sm:h-4", colorClasses.text.muted)} />
                  <span className={cn("font-medium", colorClasses.text.primary)}>
                    {getCategoryLabel(item.category)}
                  </span>
                </div>
              )}

              {item.completionDate && (
                <div className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm",
                  colorClasses.bg.secondary
                )}>
                  <Calendar className={cn("w-3 h-3 sm:w-4 sm:h-4", colorClasses.text.muted)} />
                  <span className={cn("font-medium", colorClasses.text.primary)}>
                    {formatDate(item.completionDate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid - Responsive */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8">
            {/* Budget Card */}
            <div className={cn(
              "p-3 sm:p-4 rounded-xl border",
              colorClasses.bg.primary,
              colorClasses.border.gray100
            )}>
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <DollarSign className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.amber)} />
                <span className={cn("text-xs", colorClasses.text.muted)}>Budget</span>
              </div>
              <p className={cn("text-base sm:text-lg font-bold truncate", colorClasses.text.primary)}>
                {item.budget ? formatCurrency(item.budget) : 'N/A'}
              </p>
              {item.budgetType && (
                <p className={cn("text-xs mt-1 truncate", colorClasses.text.muted)}>
                  {getBudgetTypeLabel(item.budgetType)}
                </p>
              )}
            </div>

            {/* Duration Card */}
            <div className={cn(
              "p-3 sm:p-4 rounded-xl border",
              colorClasses.bg.primary,
              colorClasses.border.gray100
            )}>
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <Clock className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.blue)} />
                <span className={cn("text-xs", colorClasses.text.muted)}>Duration</span>
              </div>
              <p className={cn("text-base sm:text-lg font-bold truncate", colorClasses.text.primary)}>
                {item.duration || 'N/A'}
              </p>
              <p className={cn("text-xs mt-1 truncate", colorClasses.text.muted)}>
                Timeline
              </p>
            </div>

            {/* Technologies Count Card */}
            <div className={cn(
              "p-3 sm:p-4 rounded-xl border",
              colorClasses.bg.primary,
              colorClasses.border.gray100
            )}>
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <Code2 className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.purple)} />
                <span className={cn("text-xs", colorClasses.text.muted)}>Tech Stack</span>
              </div>
              <p className={cn("text-base sm:text-lg font-bold", colorClasses.text.primary)}>
                {item.technologies?.length || 0}
              </p>
              <p className={cn("text-xs mt-1 truncate", colorClasses.text.muted)}>
                Technologies
              </p>
            </div>

            {/* Status Card */}
            <div className={cn(
              "p-3 sm:p-4 rounded-xl border",
              colorClasses.bg.primary,
              colorClasses.border.gray100
            )}>
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <Eye className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.emerald)} />
                <span className={cn("text-xs", colorClasses.text.muted)}>Status</span>
              </div>
              <p className={cn("text-base sm:text-lg font-bold", colorClasses.text.primary)}>
                {item.featured ? 'Featured' : 'Completed'}
              </p>
              <p className={cn("text-xs mt-1 truncate", colorClasses.text.muted)}>
                {item.visibility === 'public' ? 'Public' : 'Private'}
              </p>
            </div>
          </div>

          {/* Tabs - Responsive */}
          <div className={cn(
            "border-b mb-4 sm:mb-6 overflow-x-auto",
            colorClasses.border.gray100
          )}>
            <div className="flex gap-4 sm:gap-8 min-w-max sm:min-w-0">
              <button
                onClick={() => setActiveTab('details')}
                className={cn(
                  "py-2 sm:py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors",
                  activeTab === 'details'
                    ? cn("border-amber-500", colorClasses.text.amber)
                    : cn("border-transparent", colorClasses.text.muted, 'hover:' + colorClasses.text.primary)
                )}
              >
                Project Details
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={cn(
                  "py-2 sm:py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2",
                  activeTab === 'comments'
                    ? cn("border-amber-500", colorClasses.text.amber)
                    : cn("border-transparent", colorClasses.text.muted, 'hover:' + colorClasses.text.primary)
                )}
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Feedback ({comments.length})</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Description Section - Collapsible on mobile */}
              <div className={cn(
                "rounded-xl border overflow-hidden",
                colorClasses.bg.primary,
                colorClasses.border.gray100
              )}>
                <div
                  className={cn(
                    "p-3 sm:p-4 border-b cursor-pointer flex items-center justify-between",
                    colorClasses.border.gray100
                  )}
                  onClick={() => isMobile && toggleSection('description')}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.amber)} />
                    <h2 className={cn("text-sm sm:text-base font-semibold", colorClasses.text.primary)}>
                      Project Description
                    </h2>
                  </div>
                  {isMobile && (
                    expandedSections.description ? (
                      <ChevronUp className={cn("w-4 h-4", colorClasses.text.muted)} />
                    ) : (
                      <ChevronDown className={cn("w-4 h-4", colorClasses.text.muted)} />
                    )
                  )}
                </div>
                {(!isMobile || expandedSections.description) && (
                  <div className="p-3 sm:p-4">
                    <p className={cn(
                      "whitespace-pre-line leading-relaxed text-xs sm:text-sm",
                      colorClasses.text.secondary
                    )}>
                      {displayedDescription || 'No description provided.'}
                    </p>
                    {shouldTruncate && (
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className={cn(
                          "mt-2 text-xs sm:text-sm font-medium",
                          colorClasses.text.amber,
                          'hover:underline'
                        )}
                      >
                        {isDescriptionExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Technologies Grid - Collapsible on mobile */}
              {item.technologies && item.technologies.length > 0 && (
                <div className={cn(
                  "rounded-xl border overflow-hidden",
                  colorClasses.bg.primary,
                  colorClasses.border.gray100
                )}>
                  <div
                    className={cn(
                      "p-3 sm:p-4 border-b cursor-pointer flex items-center justify-between",
                      colorClasses.border.gray100
                    )}
                    onClick={() => isMobile && toggleSection('technologies')}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Code2 className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.purple)} />
                      <h2 className={cn("text-sm sm:text-base font-semibold", colorClasses.text.primary)}>
                        Technologies Used
                      </h2>
                    </div>
                    {isMobile && (
                      expandedSections.technologies ? (
                        <ChevronUp className={cn("w-4 h-4", colorClasses.text.muted)} />
                      ) : (
                        <ChevronDown className={cn("w-4 h-4", colorClasses.text.muted)} />
                      )
                    )}
                  </div>
                  {(!isMobile || expandedSections.technologies) && (
                    <div className="p-3 sm:p-4">
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {item.technologies.map((tech, index) => {
                          // Simple categorization for visual variety
                          const colors = [
                            { bg: colorClasses.bg.blueLight, text: colorClasses.text.blue },
                            { bg: colorClasses.bg.emeraldLight, text: colorClasses.text.emerald },
                            { bg: colorClasses.bg.purpleLight, text: colorClasses.text.purple },
                            { bg: colorClasses.bg.amberLight, text: colorClasses.text.amber },
                            { bg: colorClasses.bg.pinkLight, text: colorClasses.text.rose },
                          ];
                          const colorIndex = index % colors.length;
                          
                          return (
                            <span
                              key={index}
                              className={cn(
                                "px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium",
                                colors[colorIndex].bg,
                                colors[colorIndex].text
                              )}
                            >
                              {tech}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Project Links - Collapsible on mobile */}
              {(item.projectUrl || (item as any).repositoryUrl) && (
                <div className={cn(
                  "rounded-xl border overflow-hidden",
                  colorClasses.bg.primary,
                  colorClasses.border.gray100
                )}>
                  <div
                    className={cn(
                      "p-3 sm:p-4 border-b cursor-pointer flex items-center justify-between",
                      colorClasses.border.gray100
                    )}
                    onClick={() => isMobile && toggleSection('links')}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Link2 className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.blue)} />
                      <h2 className={cn("text-sm sm:text-base font-semibold", colorClasses.text.primary)}>
                        Project Links
                      </h2>
                    </div>
                    {isMobile && (
                      expandedSections.links ? (
                        <ChevronUp className={cn("w-4 h-4", colorClasses.text.muted)} />
                      ) : (
                        <ChevronDown className={cn("w-4 h-4", colorClasses.text.muted)} />
                      )
                    )}
                  </div>
                  {(!isMobile || expandedSections.links) && (
                    <div className="p-3 sm:p-4">
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {item.projectUrl && (
                          <a
                            href={item.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all hover:scale-105",
                              colorClasses.bg.blueLight,
                              colorClasses.text.blue
                            )}
                          >
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Live Demo</span>
                          </a>
                        )}
                        {(item as any).repositoryUrl && (
                          <a
                            href={(item as any).repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all hover:scale-105",
                              colorClasses.bg.purpleLight,
                              colorClasses.text.purple
                            )}
                          >
                            <Code2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Repository</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Comments/Feedback Section */
            <div className="space-y-4 sm:space-y-6">
              {/* Add Comment */}
              <div className={cn(
                "rounded-xl border p-3 sm:p-4",
                colorClasses.bg.primary,
                colorClasses.border.gray100
              )}>
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  <div className="flex-1 w-full">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts about this project..."
                      rows={3}
                      className={cn(
                        "w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all",
                        colorClasses.bg.primary,
                        colorClasses.border.gray100,
                        colorClasses.text.primary,
                        'placeholder:' + colorClasses.text.muted
                      )}
                    />
                  </div>
                  <button
                    className={cn(
                      "w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm font-medium transition-all",
                      colorClasses.bg.amber,
                      colorClasses.text.white,
                      'hover:opacity-90 disabled:opacity-50',
                      getTouchTargetSize('lg')
                    )}
                    disabled={!comment.trim()}
                  >
                    Post Comment
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3 sm:space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={cn(
                      "rounded-xl border p-3 sm:p-4",
                      colorClasses.bg.primary,
                      colorClasses.border.gray100
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <Image
                        src={comment.avatar}
                        alt={comment.user}
                        width={40}
                        height={40}
                        className="rounded-full w-10 h-10 sm:w-12 sm:h-12"
                        unoptimized
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div>
                            <h3 className={cn("font-semibold text-sm sm:text-base", colorClasses.text.primary)}>
                              {comment.user}
                            </h3>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "w-3 h-3 sm:w-4 sm:h-4",
                                    i < comment.rating
                                      ? 'text-amber-500 fill-amber-500'
                                      : colorClasses.text.muted
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <span className={cn("text-xs", colorClasses.text.muted)}>
                            {new Date(comment.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={cn("mb-3 text-xs sm:text-sm", colorClasses.text.secondary)}>
                          {comment.text}
                        </p>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <button className={cn(
                            "flex items-center gap-1 text-xs sm:text-sm",
                            colorClasses.text.muted,
                            'hover:' + colorClasses.text.amber
                          )}>
                            <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{comment.likes}</span>
                          </button>
                          <button className={cn(
                            "flex items-center gap-1 text-xs sm:text-sm",
                            colorClasses.text.muted,
                            'hover:' + colorClasses.text.amber
                          )}>
                            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Gallery Modal */}
      <FullscreenGallery />
    </>
  );
};

export default PortfolioDetails;