/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/portfolio/[id].tsx
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ParsedUrlQuery } from 'querystring';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  RotateCw,
  Printer,
  Mail,
  X,
  Menu,
  ExternalLink,
  Download,
  Eye,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { freelancerService, PortfolioItem } from '@/services/freelancerService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import PortfolioDetails from '@/components/freelancer/PortfolioDetails';
import { colorClasses } from '@/utils/color';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

interface PortfolioPageProps {
  item?: PortfolioItem;
  relatedItems?: PortfolioItem[];
  error?: string;
  id: string;
}

interface Params extends ParsedUrlQuery {
  id: string;
}

// Loading Skeleton Component - Responsive
const PortfolioSkeleton = () => {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  return (
    <div className="animate-pulse">
      {/* Hero Skeleton */}
      <div className={cn(
        "w-full",
        isMobile ? 'h-[250px]' : 'h-[400px] md:h-[500px] lg:h-[600px]',
        colorClasses.bg.secondary
      )} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Skeleton */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className={cn(
            "h-6 sm:h-8 lg:h-10 w-3/4 rounded-lg mb-3",
            colorClasses.bg.secondary
          )} />
          <div className="flex flex-wrap gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={cn(
                "h-6 sm:h-8 w-20 sm:w-32 rounded-lg",
                colorClasses.bg.secondary
              )} />
            ))}
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={cn(
              "p-3 sm:p-4 rounded-xl",
              colorClasses.bg.secondary
            )}>
              <div className={cn("h-4 w-12 sm:w-16 mb-2", colorClasses.bg.muted)} />
              <div className={cn("h-5 sm:h-6 w-16 sm:w-20", colorClasses.bg.muted)} />
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className={cn(
          "p-4 sm:p-6 rounded-xl mb-4 sm:mb-6",
          colorClasses.bg.secondary
        )}>
          <div className={cn("h-5 sm:h-6 w-32 sm:w-40 mb-3", colorClasses.bg.muted)} />
          <div className={cn("h-3 sm:h-4 w-full mb-2", colorClasses.bg.muted)} />
          <div className={cn("h-3 sm:h-4 w-5/6 mb-2", colorClasses.bg.muted)} />
          <div className={cn("h-3 sm:h-4 w-4/6", colorClasses.bg.muted)} />
        </div>
      </div>
    </div>
  );
};

// Share Modal Component - Responsive
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

const ShareModal = ({ isOpen, onClose, url, title }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Link copied!',
        description: 'Project link copied to clipboard',
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const shareOnSocial = (platform: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    let shareUrl = '';
    switch (platform) {
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodedTitle}&body=Check out this project: ${encodedUrl}`;
        break;
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    trackEvent('share', { platform, itemId: url.split('/').pop() });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className={cn(
        "rounded-2xl shadow-2xl w-full max-w-md",
        colorClasses.bg.primary
      )}>
        <div className={cn(
          "p-4 sm:p-6 border-b flex items-center justify-between",
          colorClasses.border.gray100
        )}>
          <h3 className={cn("text-base sm:text-lg font-semibold flex items-center", colorClasses.text.primary)}>
            <Share2 className={cn("w-4 h-4 sm:w-5 sm:h-5 mr-2", colorClasses.text.amber)} />
            Share Project
          </h3>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-xl transition-all",
              colorClasses.bg.secondary,
              'hover:' + colorClasses.bg.muted,
              getTouchTargetSize('sm')
            )}
          >
            <X className={cn("w-4 h-4", colorClasses.text.muted)} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Copy Link */}
          <div className="mb-4 sm:mb-6">
            <p className={cn("text-xs sm:text-sm font-medium mb-2", colorClasses.text.secondary)}>
              Share Link
            </p>
            <div className="flex items-center">
              <div className={cn(
                "flex-1 px-3 sm:px-4 py-2 rounded-l-lg border-r-0 text-xs sm:text-sm truncate",
                colorClasses.bg.secondary,
                colorClasses.border.gray100,
                colorClasses.text.muted
              )}>
                {isMobile ? url.substring(0, 30) + '...' : url}
              </div>
              <button
                onClick={handleCopyLink}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-r-lg border transition-all",
                  colorClasses.border.gray100,
                  colorClasses.bg.secondary,
                  'hover:' + colorClasses.bg.muted,
                  getTouchTargetSize('md')
                )}
              >
                {copied ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                ) : (
                  <Copy className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.muted)} />
                )}
              </button>
            </div>
          </div>

          {/* Social Share */}
          <p className={cn("text-xs sm:text-sm font-medium mb-3", colorClasses.text.secondary)}>
            Share on Social Media
          </p>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <button
              onClick={() => shareOnSocial('linkedin')}
              className={cn(
                "p-2 sm:p-3 rounded-xl transition-all hover:scale-105",
                colorClasses.bg.blueLight,
                getTouchTargetSize('lg')
              )}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </button>

            <button
              onClick={() => shareOnSocial('twitter')}
              className={cn(
                "p-2 sm:p-3 rounded-xl transition-all hover:scale-105",
                colorClasses.bg.blueLight,
                getTouchTargetSize('lg')
              )}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-sky-500 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.104c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.775-3.374 14.013 14.013 0 001.498-6.07c0-.209 0-.42-.015-.63a9.935 9.935 0 002.46-2.548l-.047-.02z" />
              </svg>
            </button>

            <button
              onClick={() => shareOnSocial('facebook')}
              className={cn(
                "p-2 sm:p-3 rounded-xl transition-all hover:scale-105",
                colorClasses.bg.blueLight,
                getTouchTargetSize('lg')
              )}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>

            <button
              onClick={() => shareOnSocial('email')}
              className={cn(
                "p-2 sm:p-3 rounded-xl transition-all hover:scale-105",
                colorClasses.bg.secondary,
                'hover:' + colorClasses.bg.muted,
                getTouchTargetSize('lg')
              )}
            >
              <Mail className={cn("w-5 h-5 sm:w-6 sm:h-6 mx-auto", colorClasses.text.muted)} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PortfolioItemPage({ item: initialItem, relatedItems: initialRelated, error, id }: PortfolioPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const isOwnProfile = user?.role === 'freelancer';
  
  const [item, setItem] = useState<PortfolioItem | undefined>(initialItem);
  const [relatedItems, setRelatedItems] = useState<PortfolioItem[]>(initialRelated || []);
  const [isLoading, setIsLoading] = useState(!initialItem);
  const [fetchError, setFetchError] = useState<string | null>(error || null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Client-side fetch if SSR failed or no initial data
  useEffect(() => {
    if (!initialItem && id) {
      fetchPortfolioItem();
    }
  }, [id, initialItem]);

  const fetchPortfolioItem = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await freelancerService.getPortfolioItem(id);
      setItem(response.item);
      setRelatedItems(response.related || []);

      // Track page view
      trackEvent('portfolio_view', { itemId: id });
    } catch (error: any) {
      console.error('Failed to fetch portfolio item:', error);
      setFetchError(error.message || 'Failed to load portfolio item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;

    if (!window.confirm('Are you sure you want to delete this portfolio item? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await freelancerService.deletePortfolioItem(item._id);
      toast({
        title: 'Success',
        description: 'Portfolio item deleted successfully',
      });
      trackEvent('portfolio_delete', { itemId: item._id });
      router.push('/dashboard/freelancer/portfolio');
    } catch (error: any) {
      console.error('Failed to delete portfolio item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete portfolio item',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExternalLinkClick = (url: string) => {
    trackEvent('portfolio_external_link', {
      itemId: item?._id,
      url
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRetry = () => {
    fetchPortfolioItem();
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
    trackEvent('portfolio_share_click', { itemId: item?._id });
  };

  const handleNextProject = () => {
    if (relatedItems && relatedItems.length > 0) {
      const currentIndex = relatedItems.findIndex(p => p._id === item?._id);
      if (currentIndex < relatedItems.length - 1) {
        router.push(`/dashboard/freelancer/portfolio/${relatedItems[currentIndex + 1]._id}`);
      }
    }
  };

  const handlePreviousProject = () => {
    if (relatedItems && relatedItems.length > 0) {
      const currentIndex = relatedItems.findIndex(p => p._id === item?._id);
      if (currentIndex > 0) {
        router.push(`/dashboard/freelancer/portfolio/${relatedItems[currentIndex - 1]._id}`);
      }
    }
  };

  // Generate meta description
  const metaDescription = item?.description
    ? item.description.slice(0, 160) + (item.description.length > 160 ? '...' : '')
    : 'View this portfolio project on our platform';

  // Get the first image for OG tags
  const ogImage = item?.mediaUrls?.[0] || '';

  return (
    <>
      <Head>
        <title>{item?.title ? `${item.title} | Portfolio` : 'Portfolio Project'} | Freelancer Dashboard</title>
        <meta name="description" content={metaDescription} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={item?.title || 'Portfolio Project'} />
        <meta property="og:description" content={metaDescription} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/freelancer/portfolio/${id}`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={item?.title || 'Portfolio Project'} />
        <meta name="twitter:description" content={metaDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}

        {/* Additional SEO */}
        {item?.category && <meta name="keywords" content={item.category} />}
        {item?.technologies && (
          <meta name="keywords" content={item.technologies.join(', ')} />
        )}
      </Head>

      <DashboardLayout requiredRole="freelancer">
        <div className={cn(
          "min-h-screen print:bg-white",
          colorClasses.bg.primary
        )}>
          {/* Navigation Bar - Responsive */}
          <div className={cn(
            "sticky top-0 z-40 backdrop-blur-md border-b print:hidden",
            colorClasses.bg.primary + '/80',
            colorClasses.border.gray100
          )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14 sm:h-16">
                {/* Desktop Breadcrumb */}
                {!isMobile && (
                  <nav className="flex items-center space-x-2 text-xs sm:text-sm">
                    <Link
                      href="/dashboard/freelancer/portfolio"
                      className={cn(
                        "flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all hover:scale-105",
                        colorClasses.bg.secondary,
                        'hover:' + colorClasses.bg.muted,
                        getTouchTargetSize('md')
                      )}
                    >
                      <ArrowLeft className={cn("w-3 h-3 sm:w-4 sm:h-4", colorClasses.text.muted)} />
                      <span className={colorClasses.text.muted}>Portfolio</span>
                    </Link>
                    <span className={colorClasses.text.muted}>/</span>
                    <span className={cn(
                      "truncate max-w-[150px] md:max-w-[200px] font-medium",
                      colorClasses.text.primary
                    )}>
                      {item?.title || 'Project'}
                    </span>
                  </nav>
                )}

                {/* Mobile Back Button */}
                {isMobile && (
                  <button
                    onClick={() => router.push('/dashboard/freelancer/portfolio')}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-xl",
                      colorClasses.bg.secondary,
                      getTouchTargetSize('md')
                    )}
                  >
                    <ArrowLeft className={cn("w-4 h-4", colorClasses.text.muted)} />
                    <span className={cn("text-sm", colorClasses.text.muted)}>Back</span>
                  </button>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {/* Mobile Menu Toggle */}
                  {isMobile && (
                    <button
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      className={cn(
                        "p-2 rounded-xl",
                        colorClasses.bg.secondary,
                        'hover:' + colorClasses.bg.muted,
                        getTouchTargetSize('md')
                      )}
                    >
                      {showMobileMenu ? (
                        <X className={cn("w-5 h-5", colorClasses.text.muted)} />
                      ) : (
                        <Menu className={cn("w-5 h-5", colorClasses.text.muted)} />
                      )}
                    </button>
                  )}

                  {/* Desktop Actions */}
                  {!isMobile && (
                    <>
                      {/* Navigation between related projects */}
                      {relatedItems && relatedItems.length > 1 && (
                        <>
                          <button
                            onClick={handlePreviousProject}
                            disabled={relatedItems.findIndex(p => p._id === item?._id) === 0}
                            className={cn(
                              "p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed",
                              colorClasses.bg.secondary,
                              'hover:' + colorClasses.bg.muted,
                              getTouchTargetSize('md')
                            )}
                            title="Previous project"
                          >
                            <ChevronLeft className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.muted)} />
                          </button>
                          <button
                            onClick={handleNextProject}
                            disabled={relatedItems.findIndex(p => p._id === item?._id) === relatedItems.length - 1}
                            className={cn(
                              "p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed",
                              colorClasses.bg.secondary,
                              'hover:' + colorClasses.bg.muted,
                              getTouchTargetSize('md')
                            )}
                            title="Next project"
                          >
                            <ChevronRight className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.muted)} />
                          </button>
                        </>
                      )}

                      <button
                        onClick={handleShare}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          colorClasses.bg.secondary,
                          'hover:' + colorClasses.bg.muted,
                          getTouchTargetSize('md')
                        )}
                        title="Share project"
                      >
                        <Share2 className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.muted)} />
                      </button>

                      <button
                        onClick={handlePrint}
                        className={cn(
                          "p-2 rounded-xl transition-all print:hidden",
                          colorClasses.bg.secondary,
                          'hover:' + colorClasses.bg.muted,
                          getTouchTargetSize('md')
                        )}
                        title="Print project"
                      >
                        <Printer className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.muted)} />
                      </button>

                      {isOwnProfile && (
                        <>
                          <button
                            onClick={() => router.push(`/dashboard/freelancer/portfolio/edit/${id}`)}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              colorClasses.bg.blueLight,
                              'hover:' + colorClasses.bg.blue,
                              getTouchTargetSize('md')
                            )}
                            title="Edit project"
                          >
                            <Eye className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.blue)} />
                          </button>
                          <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              colorClasses.bg.redLight,
                              'hover:' + colorClasses.bg.red,
                              getTouchTargetSize('md')
                            )}
                            title="Delete project"
                          >
                            {isDeleting ? (
                              <RotateCw className={cn("w-4 h-4 sm:w-5 sm:h-5 animate-spin", colorClasses.text.red)} />
                            ) : (
                              <Eye className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClasses.text.red)} />
                            )}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Action Menu */}
              {isMobile && showMobileMenu && (
                <div className={cn(
                  "absolute right-4 mt-2 p-2 rounded-xl border shadow-lg z-50 w-48",
                  colorClasses.bg.primary,
                  colorClasses.border.gray100
                )}>
                  <div className="flex flex-col space-y-1">
                    {relatedItems && relatedItems.length > 1 && (
                      <>
                        <button
                          onClick={handlePreviousProject}
                          disabled={relatedItems.findIndex(p => p._id === item?._id) === 0}
                          className={cn(
                            "flex items-center space-x-3 px-4 py-3 rounded-lg w-full",
                            'disabled:opacity-30 disabled:cursor-not-allowed',
                            'hover:' + colorClasses.bg.secondary
                          )}
                        >
                          <ChevronLeft className={cn("w-4 h-4", colorClasses.text.muted)} />
                          <span className={cn("text-sm", colorClasses.text.primary)}>Previous</span>
                        </button>
                        <button
                          onClick={handleNextProject}
                          disabled={relatedItems.findIndex(p => p._id === item?._id) === relatedItems.length - 1}
                          className={cn(
                            "flex items-center space-x-3 px-4 py-3 rounded-lg w-full",
                            'disabled:opacity-30 disabled:cursor-not-allowed',
                            'hover:' + colorClasses.bg.secondary
                          )}
                        >
                          <ChevronRight className={cn("w-4 h-4", colorClasses.text.muted)} />
                          <span className={cn("text-sm", colorClasses.text.primary)}>Next</span>
                        </button>
                        <div className={cn("border-t my-1", colorClasses.border.gray100)} />
                      </>
                    )}
                    <button
                      onClick={handleShare}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg w-full",
                        'hover:' + colorClasses.bg.secondary
                      )}
                    >
                      <Share2 className={cn("w-4 h-4", colorClasses.text.muted)} />
                      <span className={cn("text-sm", colorClasses.text.primary)}>Share</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg w-full",
                        'hover:' + colorClasses.bg.secondary
                      )}
                    >
                      <Printer className={cn("w-4 h-4", colorClasses.text.muted)} />
                      <span className={cn("text-sm", colorClasses.text.primary)}>Print</span>
                    </button>
                    {isOwnProfile && (
                      <>
                        <div className={cn("border-t my-1", colorClasses.border.gray100)} />
                        <button
                          onClick={() => router.push(`/dashboard/freelancer/portfolio/edit/${id}`)}
                          className={cn(
                            "flex items-center space-x-3 px-4 py-3 rounded-lg w-full",
                            'hover:' + colorClasses.bg.blueLight
                          )}
                        >
                          <Eye className={cn("w-4 h-4", colorClasses.text.blue)} />
                          <span className={cn("text-sm", colorClasses.text.blue)}>Edit</span>
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className={cn(
                            "flex items-center space-x-3 px-4 py-3 rounded-lg w-full",
                            'hover:' + colorClasses.bg.redLight
                          )}
                        >
                          {isDeleting ? (
                            <RotateCw className={cn("w-4 h-4 animate-spin", colorClasses.text.red)} />
                          ) : (
                            <Eye className={cn("w-4 h-4", colorClasses.text.red)} />
                          )}
                          <span className={cn("text-sm", colorClasses.text.red)}>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && <PortfolioSkeleton />}

          {/* Error State */}
          {fetchError && !isLoading && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
              <div className="text-center">
                <div className={cn(
                  "w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center",
                  colorClasses.bg.redLight
                )}>
                  <AlertTriangle className={cn("w-8 h-8 sm:w-10 sm:h-10", colorClasses.text.red)} />
                </div>
                <h2 className={cn("text-xl sm:text-2xl font-bold mb-2 sm:mb-3", colorClasses.text.primary)}>
                  Failed to Load Project
                </h2>
                <p className={cn("mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base", colorClasses.text.muted)}>
                  {fetchError}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleRetry}
                    className={cn(
                      "w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl transition-all flex items-center justify-center",
                      colorClasses.bg.amber,
                      'hover:opacity-90 text-white',
                      getTouchTargetSize('lg')
                    )}
                  >
                    <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Try Again
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/freelancer/portfolio')}
                    className={cn(
                      "w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl transition-all",
                      colorClasses.bg.secondary,
                      'hover:' + colorClasses.bg.muted,
                      colorClasses.text.secondary,
                      getTouchTargetSize('lg')
                    )}
                  >
                    Back to Portfolio
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!isLoading && !fetchError && item && (
            <>
              <PortfolioDetails
                item={item}
                isOwnProfile={user?.role === 'freelancer'}
                onEdit={() => router.push(`/dashboard/freelancer/portfolio/edit/${id}`)}
                onDelete={handleDelete}
                onBack={() => router.push('/dashboard/freelancer/portfolio')}
              />

              {/* External Link Tracking */}
              {item.projectUrl && (
                <a
                  href={item.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleExternalLinkClick(item.projectUrl!)}
                  className="hidden"
                  aria-hidden="true"
                />
              )}
            </>
          )}
        </div>
      </DashboardLayout>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/freelancer/portfolio/${id}`}
        title={item?.title || 'Portfolio Project'}
      />

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          a[href]:after {
            content: " (" attr(href) ")";
            font-size: 0.8em;
            font-weight: normal;
          }
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PortfolioPageProps, Params> = async (context) => {
  try {
    const { id } = context.params!;
    const token = context.req.cookies?.token || '';

    // Use the service method with token
    const { item, related } = await freelancerService.getPortfolioItem(id, token);

    return {
      props: {
        item,
        relatedItems: related,
        id,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);

    // Return error state but still render the page with client-side fetch
    return {
      props: {
        error: error instanceof Error ? error.message : 'Failed to load portfolio item',
        id: context.params?.id || '',
      },
    };
  }
};