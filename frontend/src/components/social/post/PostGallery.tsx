// components/posts/PostGallery.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import Image from 'next/image';
import { Media } from '@/services/postService';
import { postService } from '@/services/postService';
import { colorClasses } from '@/utils/color';
import {
    PlayCircle,
    PauseCircle,
    FileText,
    Download,
    X,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2,
    Volume2,
    VolumeX,
    Heart,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { Button } from '../ui/Button';

interface PostGalleryProps {
    media: Media[];
    maxHeight?: number;
    showCaptions?: boolean;
    interactive?: boolean;
    className?: string;
    lightboxEnabled?: boolean;
    autoplayVideos?: boolean;
    mutedVideos?: boolean;
    onDoubleClickLike?: () => void;
}

interface GalleryItem extends Media {
    id: string;
    displayUrl: string;
    thumbnailUrl?: string;
}

// Memoized media item component
const MediaItem = memo(({
    item,
    isPlaying,
    onPlayToggle,
    onDownload,
    inLightbox = false,
    showCaption = true,
    onImageError,
    onVideoError,
    onDoubleClick,
    shouldAutoplay = false
}: {
    item: GalleryItem;
    isPlaying: boolean;
    onPlayToggle: () => void;
    onDownload: () => void;
    inLightbox: boolean;
    showCaption: boolean;
    onImageError: (id: string) => void;
    onVideoError: (id: string) => void;
    onDoubleClick: () => void;
    shouldAutoplay?: boolean;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showLikeAnimation, setShowLikeAnimation] = useState(false);
    const [isInViewport, setIsInViewport] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const lastClickTime = useRef(0);

    // Intersection observer for video visibility
    useEffect(() => {
        if (!videoRef.current || item.type !== 'video') return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInViewport(entry.isIntersecting);
            },
            { threshold: 0.5 }
        );

        observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, [item.type]);

    // Handle video play state based on visibility
    useEffect(() => {
        if (!videoRef.current || item.type !== 'video') return;

        if (shouldAutoplay && isInViewport && !inLightbox) {
            videoRef.current.play().catch(console.error);
        } else if (!isInViewport && !videoRef.current.paused) {
            videoRef.current.pause();
        }
    }, [isInViewport, item.type, shouldAutoplay, inLightbox]);

    // Handle manual play/pause
    useEffect(() => {
        if (!videoRef.current || item.type !== 'video') return;

        if (isPlaying) {
            videoRef.current.play().catch(console.error);
        } else {
            videoRef.current.pause();
        }
    }, [isPlaying, item.type]);

    // Handle double click for like animation
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const now = Date.now();
        if (now - lastClickTime.current < 300) { // Double click within 300ms
            setShowLikeAnimation(true);
            onDoubleClick();
            setTimeout(() => setShowLikeAnimation(false), 1000);
        }
        lastClickTime.current = now;
    };

    // Get optimized Cloudinary URL for display
    const getOptimizedUrl = useCallback(() => {
        if (!item.displayUrl) return '';

        const url = item.displayUrl;

        // Apply Cloudinary transformations
        if (url.includes('cloudinary.com') && url.includes('/upload/')) {
            if (item.type === 'image') {
                // For lightbox: higher quality, for feed: optimized
                const transformation = inLightbox
                    ? 'w_1200,h_800,c_limit,q_auto:best'
                    : 'w_800,h_600,c_limit,q_auto:good';
                return url.replace('/upload/', `/upload/${transformation}/`);
            } else if (item.type === 'video') {
                // For videos, keep original URL for proper streaming
                return url;
            }
        }

        return url;
    }, [item.displayUrl, item.type, inLightbox]);

    // Get video thumbnail URL (FIXED: No .jpg appended)
    const getVideoThumbnail = useCallback(() => {
        if (item.thumbnailUrl) return item.thumbnailUrl;

        // Generate Cloudinary video thumbnail WITHOUT .jpg extension
        if (item.displayUrl.includes('cloudinary.com') && item.displayUrl.includes('/upload/')) {
            // Use proper Cloudinary video thumbnail transformation
            return item.displayUrl.replace('/upload/', '/upload/w_800,h_450,c_fill/');
        }

        return '';
    }, [item.displayUrl, item.thumbnailUrl]);

    // Calculate aspect ratio style
    const getAspectRatioStyle = useCallback(() => {
        if (item.width && item.height) {
            const aspectRatio = item.width / item.height;
            return { aspectRatio: aspectRatio.toString() };
        }
        // Instagram default aspect ratio
        return { aspectRatio: '4/5' };
    }, [item.width, item.height]);

    // Handle image error
    const handleImageError = () => {
        setImageError(true);
        onImageError(item.id);
    };

    // Handle video error
    const handleVideoError = () => {
        setVideoError(true);
        onVideoError(item.id);
    };

    switch (item.type) {
        case 'image':
            if (imageError) {
                return (
                    <div
                        className={`relative rounded-lg overflow-hidden ${colorClasses.bg.gray100} flex items-center justify-center`}
                        style={getAspectRatioStyle()}
                    >
                        <div className="text-center p-4">
                            <FileText className={`w-12 h-12 mx-auto mb-2 ${colorClasses.text.gray400}`} />
                            <p className={`text-sm ${colorClasses.text.gray600}`}>Image failed to load</p>
                        </div>
                    </div>
                );
            }

            return (
                <div
                    ref={containerRef}
                    className="relative rounded-lg overflow-hidden"
                    style={getAspectRatioStyle()}
                    onDoubleClick={handleClick}
                >
                    <div className="relative w-full h-full">
                        <Image
                            src={getOptimizedUrl()}
                            alt={item.description || item.originalName || 'Post image'}
                            fill
                            sizes={inLightbox ? "100vw" : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                            className="object-cover rounded-lg"
                            quality={inLightbox ? 90 : 85}
                            priority={!inLightbox}
                            unoptimized={item.displayUrl.includes('blob:')}
                            onError={handleImageError}
                        />
                    </div>

                    {/* Like Animation */}
                    {showLikeAnimation && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="animate-ping">
                                <Heart className="w-20 h-20 text-white fill-current opacity-90" />
                            </div>
                        </div>
                    )}

                    {showCaption && item.description && !inLightbox && (
                        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 rounded-b-lg`}>
                            <p className={`text-sm line-clamp-2 ${colorClasses.text.white}`}>
                                {item.description}
                            </p>
                        </div>
                    )}
                </div>
            );

        case 'video':
            if (videoError) {
                return (
                    <div
                        className={`relative rounded-lg overflow-hidden ${colorClasses.bg.gray100} flex items-center justify-center`}
                        style={getAspectRatioStyle()}
                    >
                        <div className="text-center p-4">
                            <FileText className={`w-12 h-12 mx-auto mb-2 ${colorClasses.text.gray400}`} />
                            <p className={`text-sm ${colorClasses.text.gray600}`}>Video failed to load</p>
                        </div>
                    </div>
                );
            }

            const thumbnailUrl = getVideoThumbnail();

            return (
                <div
                    ref={containerRef}
                    className="relative rounded-lg overflow-hidden group"
                    style={getAspectRatioStyle()}
                    onDoubleClick={handleClick}
                >
                    {/* Video Thumbnail */}
                    {!inLightbox && !isPlaying && thumbnailUrl && (
                        <div className="absolute inset-0">
                            <div className="relative w-full h-full">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Video thumbnail"
                                    fill
                                    className="object-cover rounded-lg"
                                    quality={85}
                                    loading="lazy"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />
                            </div>
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg">
                                <PlayCircle className="w-16 h-16 text-white opacity-80" />
                            </div>
                        </div>
                    )}

                    {/* Video Element */}
                    <video
                        ref={videoRef}
                        src={item.displayUrl}
                        controls={inLightbox}
                        muted={!inLightbox}
                        autoPlay={shouldAutoplay && isInViewport}
                        loop
                        playsInline
                        preload="metadata"
                        poster={inLightbox ? thumbnailUrl : undefined}
                        onError={handleVideoError}
                        onClick={
                            inLightbox
                                ? undefined
                                : (e) => {
                                    e.stopPropagation();
                                    onPlayToggle();
                                }
                        }
                        className={`
        w-full
        h-auto
        max-h-[70vh]
        object-contain
        rounded-lg
        bg-black
        ${inLightbox ? '' : 'absolute inset-0'}
    `}
                        style={{
                            aspectRatio: item.width && item.height
                                ? `${item.width} / ${item.height}`
                                : '9 / 16', // fallback (TikTok safe)
                        }}
                    />

                    {/* Custom Play/Pause Button (for non-lightbox) */}
                    {!inLightbox && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPlayToggle();
                            }}
                            className="absolute inset-0 flex items-center justify-center group"
                            type="button"
                            aria-label={isPlaying ? "Pause video" : "Play video"}
                        >
                            <div className={`rounded-full p-2 transform transition-transform group-hover:scale-110 ${colorClasses.bg.darkNavy}/50`}>
                                {isPlaying ? (
                                    <PauseCircle className={`w-12 h-12 ${colorClasses.text.white}`} />
                                ) : (
                                    <PlayCircle className={`w-12 h-12 ${colorClasses.text.white}`} />
                                )}
                            </div>
                        </button>
                    )}

                    {/* Like Animation */}
                    {showLikeAnimation && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="animate-ping">
                                <Heart className="w-20 h-20 text-white fill-current opacity-90" />
                            </div>
                        </div>
                    )}

                    {showCaption && item.description && !inLightbox && (
                        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 rounded-b-lg`}>
                            <p className={`text-sm line-clamp-2 ${colorClasses.text.white}`}>
                                {item.description}
                            </p>
                        </div>
                    )}

                    {/* Video duration overlay */}
                    {item.duration && inLightbox && (
                        <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {Math.floor(item.duration / 60)}:{Math.floor(item.duration % 60).toString().padStart(2, '0')}
                        </div>
                    )}
                </div>
            );

        case 'document':
            return (
                <div className={`relative w-full h-full ${colorClasses.bg.gray100} p-4 flex flex-col items-center justify-center rounded-lg`}>
                    <FileText className={`w-16 h-16 ${colorClasses.text.gray400} mb-2`} />
                    <div className="text-center">
                        <p className={`text-sm font-medium truncate max-w-full ${colorClasses.text.darkNavy}`}>
                            {item.originalName || 'Document'}
                        </p>
                        {item.bytes && (
                            <p className={`text-xs mt-1 ${colorClasses.text.gray400}`}>
                                {postService.formatFileSize(item.bytes)}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDownload();
                        }}
                        className={`absolute bottom-4 right-4 p-2 ${colorClasses.bg.blue} ${colorClasses.text.white} rounded-full hover:opacity-90 transition-opacity`}
                        title="Download"
                        type="button"
                        aria-label="Download document"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            );

        default:
            return (
                <div className={`relative w-full h-full ${colorClasses.bg.gray100} flex items-center justify-center rounded-lg`}>
                    <div className={`text-center ${colorClasses.text.gray400}`}>
                        <FileText className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Unsupported media type</p>
                    </div>
                </div>
            );
    }
});

MediaItem.displayName = 'MediaItem';

// Memoized thumbnail component
const Thumbnail = memo(({
    item,
    isActive,
    onClick
}: {
    item: GalleryItem;
    isActive: boolean;
    onClick: () => void
}) => {
    const [error, setError] = useState(false);

    const getThumbnailUrl = () => {
        if (item.thumbnailUrl) return item.thumbnailUrl;

        if (item.type === 'image') {
            if (item.displayUrl.includes('cloudinary.com') && item.displayUrl.includes('/upload/')) {
                return item.displayUrl.replace('/upload/', '/upload/w_100,h_100,c_fill,q_auto:low/');
            }
            return item.displayUrl;
        } else if (item.type === 'video') {
            if (item.displayUrl.includes('cloudinary.com') && item.displayUrl.includes('/upload/')) {
                return item.displayUrl.replace('/upload/', '/upload/w_100,h_100,c_fill/');
            }
        }
        return '';
    };

    const thumbnailUrl = getThumbnailUrl();

    return (
        <button
            onClick={onClick}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all 
                ${isActive
                    ? `border-blue-500 scale-105 ${colorClasses.border.blue}`
                    : `border-transparent opacity-60 hover:opacity-100 hover:scale-105`
                }`}
            type="button"
            aria-label={`View ${item.type === 'image' ? 'image' : 'video'}`}
        >
            {error ? (
                <div className={`w-full h-full ${colorClasses.bg.gray800} flex items-center justify-center rounded-lg`}>
                    <FileText className={`w-6 h-6 ${colorClasses.text.white}`} />
                </div>
            ) : (
                <div className="relative w-full h-full">
                    {item.type === 'image' ? (
                        <Image
                            src={thumbnailUrl}
                            alt=""
                            fill
                            className="object-cover rounded-lg"
                            onError={() => setError(true)}
                            loading="lazy"
                            sizes="64px"
                        />
                    ) : item.type === 'video' ? (
                        <div className={`w-full h-full ${colorClasses.bg.gray800} flex items-center justify-center rounded-lg`}>
                            <PlayCircle className={`w-6 h-6 ${colorClasses.text.white}`} />
                        </div>
                    ) : (
                        <div className={`w-full h-full ${colorClasses.bg.gray800} flex items-center justify-center rounded-lg`}>
                            <FileText className={`w-6 h-6 ${colorClasses.text.white}`} />
                        </div>
                    )}
                </div>
            )}
        </button>
    );
});

Thumbnail.displayName = 'Thumbnail';

// Main PostGallery component
const PostGallery: React.FC<PostGalleryProps> = ({
    media = [],
    maxHeight = 600,
    showCaptions = true,
    interactive = true,
    className = '',
    lightboxEnabled = true,
    autoplayVideos = false,
    mutedVideos = true,
    onDoubleClickLike
}) => {
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [videoPlaying, setVideoPlaying] = useState<{ [key: string]: boolean }>({});
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lightboxMuted, setLightboxMuted] = useState(mutedVideos);
    const [loadingErrors, setLoadingErrors] = useState<{ [key: string]: boolean }>({});
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Process media items
    useEffect(() => {
        if (!media || media.length === 0) {
            setGalleryItems([]);
            return;
        }

        const processedItems: GalleryItem[] = media
            .filter(item => item && (item.secure_url || item.url))
            .map((item, index) => {
                const displayUrl = item.secure_url || item.url || '';
                const thumbnailUrl = item.thumbnail ||
                    (item.secure_url && item.type === 'video'
                        ? item.secure_url.replace('/upload/', '/upload/w_400,h_300,c_fill/')
                        : undefined);

                return {
                    ...item,
                    id: item._id || `media-${index}-${Date.now()}`,
                    displayUrl,
                    thumbnailUrl
                };
            });

        setGalleryItems(processedItems);
        setLoadingErrors({});
        setVideoPlaying({});
        setCurrentIndex(0); // Reset to first item when media changes
    }, [media]);

    // Handle fullscreen
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Handle keyboard shortcuts
    useEffect(() => {
        if (!isLightboxOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    prevImage();
                    break;
                case 'ArrowRight':
                    nextImage();
                    break;
                case 'f':
                case 'F':
                    toggleFullscreen();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen]);

    // Track user interaction for autoplay
    useEffect(() => {
        const handleInteraction = () => {
            setHasUserInteracted(true);
        };

        document.addEventListener('click', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);
        document.addEventListener('keydown', handleInteraction);

        return () => {
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
        };
    }, []);

    // Touch swipe handling
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && galleryItems.length > 1) {
            nextImage();
        } else if (isRightSwipe && galleryItems.length > 1) {
            prevImage();
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen().catch(console.error);
        }
    };

    const toggleVideoPlay = useCallback((id: string) => {
        setVideoPlaying(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    }, []);

    const nextImage = useCallback(() => {
        setCurrentIndex(prev => {
            const nextIndex = (prev + 1) % galleryItems.length;
            // Pause current video when navigating away
            if (galleryItems[prev]?.type === 'video' && videoPlaying[galleryItems[prev].id]) {
                setVideoPlaying(prevState => ({ ...prevState, [galleryItems[prev].id]: false }));
            }
            return nextIndex;
        });
    }, [galleryItems, videoPlaying]);

    const prevImage = useCallback(() => {
        setCurrentIndex(prev => {
            const prevIndex = (prev - 1 + galleryItems.length) % galleryItems.length;
            // Pause current video when navigating away
            if (galleryItems[prev]?.type === 'video' && videoPlaying[galleryItems[prev].id]) {
                setVideoPlaying(prevState => ({ ...prevState, [galleryItems[prev].id]: false }));
            }
            return prevIndex;
        });
    }, [galleryItems, videoPlaying]);

    const openLightbox = useCallback((index: number) => {
        if (!interactive || !lightboxEnabled || galleryItems.length === 0) return;
        setCurrentIndex(index);
        setIsLightboxOpen(true);
        setVideoPlaying({}); // Stop all videos when opening lightbox
    }, [interactive, lightboxEnabled, galleryItems.length]);

    const closeLightbox = useCallback(() => {
        setIsLightboxOpen(false);
        setVideoPlaying({}); // Stop all videos when closing lightbox
    }, []);

    const handleDoubleClickLike = useCallback(() => {
        if (onDoubleClickLike) {
            onDoubleClickLike();
        }
    }, [onDoubleClickLike]);

    const handleDownload = async (item: GalleryItem) => {
        try {
            const response = await fetch(item.displayUrl);
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = item.originalName || `download-${item.id}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handleImageError = (id: string) => {
        setLoadingErrors(prev => ({ ...prev, [id]: true }));
    };

    const handleVideoError = (id: string) => {
        setLoadingErrors(prev => ({ ...prev, [id]: true }));
    };

    // Calculate container height based on content
    const getContainerHeight = useCallback(() => {
        if (galleryItems.length === 0) return 'auto';

        const currentItem = galleryItems[currentIndex];
        if (currentItem?.width && currentItem?.height) {
            const aspectRatio = currentItem.height / currentItem.width;
            const maxWidth = isMobile ? window.innerWidth - 32 : 800; // Account for padding
            const calculatedHeight = maxWidth * aspectRatio;
            return Math.min(calculatedHeight, maxHeight);
        }
        return maxHeight;
    }, [galleryItems, currentIndex, maxHeight, isMobile]);

    // Render single media item (full width)
    const renderSingleMedia = () => {
        const item = galleryItems[0];
        const containerHeight = getContainerHeight();

        return (
            <div className={`relative rounded-lg overflow-hidden ${className}`}>
                <div
                    className="relative"
                    style={{ height: containerHeight }}
                    onClick={() => interactive && lightboxEnabled && openLightbox(0)}
                >
                    <MediaItem
                        item={item}
                        isPlaying={videoPlaying[item.id] || false}
                        onPlayToggle={() => toggleVideoPlay(item.id)}
                        onDownload={() => handleDownload(item)}
                        inLightbox={false}
                        showCaption={showCaptions}
                        onImageError={handleImageError}
                        onVideoError={handleVideoError}
                        onDoubleClick={handleDoubleClickLike}
                        shouldAutoplay={autoplayVideos && hasUserInteracted}
                    />
                </div>

                {/* Open lightbox button for single image */}
                {interactive && lightboxEnabled && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openLightbox(0);
                        }}
                        className={`absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10`}
                        type="button"
                        aria-label="Open lightbox"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    };

    // Render carousel for multiple images/videos
    const renderCarousel = () => {
        const containerHeight = getContainerHeight();

        return (
            <div
                className={`relative rounded-lg overflow-hidden ${className}`}
                style={{ height: containerHeight }}
            >
                {/* Mobile: Swipe carousel */}
                {isMobile ? (
                    <div
                        className="relative h-full overflow-hidden"
                        ref={carouselRef}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div
                            className="flex transition-transform duration-300 ease-in-out h-full"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {galleryItems.map((item, index) => (
                                <div key={item.id} className="w-full flex-shrink-0 h-full">
                                    <div
                                        className="relative w-full h-full"
                                        onClick={() =>
                                            interactive &&
                                            lightboxEnabled &&
                                            openLightbox(index)
                                        }
                                    >
                                        <MediaItem
                                            item={item}
                                            isPlaying={videoPlaying[item.id] || false}
                                            onPlayToggle={() =>
                                                toggleVideoPlay(item.id)
                                            }
                                            onDownload={() =>
                                                handleDownload(item)
                                            }
                                            inLightbox={false}
                                            showCaption={showCaptions}
                                            onImageError={handleImageError}
                                            onVideoError={handleVideoError}
                                            onDoubleClick={handleDoubleClickLike}
                                            shouldAutoplay={
                                                autoplayVideos &&
                                                hasUserInteracted &&
                                                index === currentIndex
                                            }
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Indicator dots */}
                        {galleryItems.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {galleryItems.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentIndex(index);
                                        }}
                                        className={`h-2 rounded-full transition-all ${index === currentIndex
                                            ? 'bg-white w-4'
                                            : 'bg-white/50 w-2'
                                            }`}
                                        type="button"
                                        aria-label={`Go to image ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // Desktop: Arrow navigation
                    <div className="relative h-full group">
                        <div
                            className="relative w-full h-full"
                            onClick={() =>
                                interactive &&
                                lightboxEnabled &&
                                openLightbox(currentIndex)
                            }
                        >
                            <MediaItem
                                item={galleryItems[currentIndex]}
                                isPlaying={
                                    videoPlaying[
                                    galleryItems[currentIndex].id
                                    ] || false
                                }
                                onPlayToggle={() =>
                                    toggleVideoPlay(
                                        galleryItems[currentIndex].id
                                    )
                                }
                                onDownload={() =>
                                    handleDownload(
                                        galleryItems[currentIndex]
                                    )
                                }
                                inLightbox={false}
                                showCaption={showCaptions}
                                onImageError={handleImageError}
                                onVideoError={handleVideoError}
                                onDoubleClick={handleDoubleClickLike}
                                shouldAutoplay={
                                    autoplayVideos && hasUserInteracted
                                }
                            />
                        </div>

                        {/* Desktop navigation arrows */}
                        {galleryItems.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        prevImage();
                                    }}
                                    className="
                                    absolute left-4 top-1/2 -translate-y-1/2 z-20
                                    h-12 w-12 rounded-full
                                    bg-black/60 hover:bg-black/80
                                    flex items-center justify-center
                                    opacity-0 group-hover:opacity-100
                                    transition-all
                                "
                                    type="button"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="h-6 w-6 text-white" />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        nextImage();
                                    }}
                                    className="
                                    absolute right-4 top-1/2 -translate-y-1/2 z-20
                                    h-12 w-12 rounded-full
                                    bg-black/60 hover:bg-black/80
                                    flex items-center justify-center
                                    opacity-0 group-hover:opacity-100
                                    transition-all
                                "
                                    type="button"
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="h-6 w-6 text-white" />
                                </button>
                            </>
                        )}

                        {/* Desktop indicator */}
                        {galleryItems.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {galleryItems.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentIndex(index);
                                        }}
                                        className={`h-2 rounded-full transition-all ${index === currentIndex
                                            ? 'bg-white w-4'
                                            : 'bg-white/50 w-2'
                                            }`}
                                        type="button"
                                        aria-label={`Go to image ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Open lightbox button */}
                {interactive && lightboxEnabled && (
                    <button
                        onClick={() => openLightbox(currentIndex)}
                        className="
                        absolute top-2 right-2 z-20
                        h-10 w-10 rounded-full
                        bg-black/60 hover:bg-black/80
                        flex items-center justify-center
                        transition-colors
                    "
                        type="button"
                        aria-label="Open lightbox"
                    >
                        <Maximize2 className="h-5 w-5 text-white" />
                    </button>
                )}
            </div>
        );
    };

    // Render lightbox
    const renderLightbox = () => {
        if (!isLightboxOpen || galleryItems.length === 0) return null;

        const currentItem = galleryItems[currentIndex];

        return (
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center ${colorClasses.bg.darkNavy}/95 backdrop-blur-sm`}
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        closeLightbox();
                    }
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Close button */}
                <button
                    onClick={closeLightbox}
                    className="
                    absolute top-4 right-4 z-50
                    h-12 w-12 rounded-full
                    bg-black/60 hover:bg-black/80
                    flex items-center justify-center
                "
                    type="button"
                    aria-label="Close lightbox"
                >
                    <X className="h-6 w-6 text-white" />
                </button>

                {/* Navigation buttons - Desktop only */}
                {!isMobile && galleryItems.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="
                            absolute left-4 top-1/2 -translate-y-1/2 z-50
                            h-14 w-14 rounded-full
                            bg-black/70 hover:bg-black
                            flex items-center justify-center
                        "
                            type="button"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-7 w-7 text-white" />
                        </button>

                        <button
                            onClick={nextImage}
                            className="
                            absolute right-4 top-1/2 -translate-y-1/2 z-50
                            h-14 w-14 rounded-full
                            bg-black/70 hover:bg-black
                            flex items-center justify-center
                        "
                            type="button"
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-7 w-7 text-white" />
                        </button>
                    </>
                )}

                {/* Main content */}
                <div className="relative w-full h-full flex items-center justify-center p-6">
                    <div
                        className="relative w-full"
                        style={{
                            maxWidth: isMobile ? '100%' : '800px', // SAME as feed
                        }}
                    >
                        <MediaItem
                            item={currentItem}
                            isPlaying={
                                videoPlaying[currentItem.id] || false
                            }
                            onPlayToggle={() =>
                                toggleVideoPlay(currentItem.id)
                            }
                            onDownload={() =>
                                handleDownload(currentItem)
                            }
                            inLightbox
                            showCaption={showCaptions}
                            onImageError={handleImageError}
                            onVideoError={handleVideoError}
                            onDoubleClick={handleDoubleClickLike}
                        />
                    </div>
                </div>
            </div>
        );
    };


    if (galleryItems.length === 0) {
        return null;
    }

    return (
        <div className="post-gallery relative">
            {galleryItems.length === 1 ? renderSingleMedia() : renderCarousel()}

            {/* Gallery info */}
            {galleryItems.length > 1 && (
                <div className={`mt-2 flex items-center justify-between text-sm ${colorClasses.text.gray400}`}>
                    <div className="flex items-center gap-2">
                        <span>{galleryItems.length} item{galleryItems.length > 1 ? 's' : ''}</span>
                        <span className="flex items-center gap-1">
                            {galleryItems.some(img => img.type === 'image') && (
                                <span className={`px-2 py-1 rounded ${colorClasses.bg.gray100} ${colorClasses.text.gray800}`}>
                                    {galleryItems.filter(img => img.type === 'image').length} Image{galleryItems.filter(img => img.type === 'image').length !== 1 ? 's' : ''}
                                </span>
                            )}
                            {galleryItems.some(img => img.type === 'video') && (
                                <span className={`px-2 py-1 rounded ${colorClasses.bg.gray100} ${colorClasses.text.gray800}`}>
                                    {galleryItems.filter(img => img.type === 'video').length} Video{galleryItems.filter(img => img.type === 'video').length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="text-xs opacity-70">
                        Double-click to like
                    </div>
                </div>
            )}

            {renderLightbox()}
        </div>
    );
};

export default memo(PostGallery);