// components/social/post/PostGallery.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Bookmark, MoreVertical, Download, Share2, X } from 'lucide-react';
import { postService, Media } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/Button';

interface PostGalleryProps {
    images?: Media[];
    maxVisible?: number;
}

export const PostGallery: React.FC<PostGalleryProps> = ({ images = [], maxVisible = 4 }) => {
    // Core state & handlers
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [dragging, setDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [showArrows, setShowArrows] = useState(false);
    const [videoRefs] = useState<React.RefObject<HTMLVideoElement>[]>(() =>
        images.map(() => React.createRef<HTMLVideoElement>())
    );
    const carouselRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Normalize / fix image URLs using postService
    const fixedImages = (images || []).map((img: Media) => ({
        ...img,
        url: postService.getFullImageUrl(img.url),
        thumbnail: img.thumbnail ? postService.getFullImageUrl(img.thumbnail) : undefined
    }));

    const visibleImages = fixedImages.slice(0, maxVisible);
    const hasMore = fixedImages.length > maxVisible;

    // Guard lengths for navigation
    const imagesCount = Math.max(1, fixedImages.length);

    const nextImage = () => {
        if (fixedImages.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % imagesCount);
        setZoomLevel(1);
    };

    const prevImage = () => {
        if (fixedImages.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + imagesCount) % imagesCount);
        setZoomLevel(1);
    };

    const handleImageClick = (index: number) => {
        if (fixedImages.length === 0) return;
        setCurrentIndex(index);
        setShowLightbox(true);
        setZoomLevel(1);
    };

    // Instagram-style carousel swipe handlers
    const handleCarouselSwipeStart = (e: React.MouseEvent | React.TouchEvent) => {
        setDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        setDragStartX(clientX);
        setDragOffset(0);
    };

    const handleCarouselSwipeMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!dragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const offset = clientX - dragStartX;
        setDragOffset(offset);
    };

    const handleCarouselSwipeEnd = () => {
        if (!dragging) return;
        const threshold = 50; // Instagram uses a small threshold for swipe
        if (Math.abs(dragOffset) > threshold) {
            if (dragOffset > 0) {
                prevImage();
            } else {
                nextImage();
            }
        }
        setDragging(false);
        setDragOffset(0);
    };

    // Lightbox swipe handlers
    const handleLightboxDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        setDragStartX(clientX);
        setDragOffset(0);
    };

    const handleLightboxDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!dragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const offset = clientX - dragStartX;
        setDragOffset(offset);
    };

    const handleLightboxDragEnd = () => {
        if (!dragging) return;
        const threshold = 100;
        if (Math.abs(dragOffset) > threshold) {
            if (dragOffset > 0) {
                prevImage();
            } else {
                nextImage();
            }
        }
        setDragging(false);
        setDragOffset(0);
    };

    const handleDownload = async () => {
        try {
            const image = fixedImages[currentIndex];
            const response = await fetch(image.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = image.filename || `image-${currentIndex + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                variant: "success",
                title: "Download started",
                description: "Download has started"
            });
        } catch (error) {
            console.error('Failed to download:', error);
            toast({
                variant: "destructive",
                title: "Download failed",
                description: "Failed to download the file"
            });
        }
    };

    const handleShare = async () => {
        if (fixedImages.length === 0) return;
        const image = fixedImages[currentIndex];
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Check out this post',
                    text: 'Shared from Social Platform',
                    url: image.url
                });
            } else {
                await navigator.clipboard.writeText(image.url);
                toast({
                    variant: "success",
                    title: "Link copied",
                    description: "Link copied to clipboard"
                });
            }
        } catch (error: any) {
            if (error?.name !== 'AbortError') {
                console.error('Failed to share:', error);
                toast({
                    variant: "destructive",
                    title: "Share failed",
                    description: "Failed to share the post"
                });
            }
        }
    };

    // Video controls
    const handleVideoPlay = (index: number) => {
        const video = videoRefs[index]?.current;
        if (video) {
            if (video.paused) {
                video.play().catch(console.error);
            } else {
                video.pause();
            }
        }
    };

    // Handle video autoplay in carousel - Instagram-style
    useEffect(() => {
        if (!showLightbox) {
            // Pause all videos when not in lightbox
            videoRefs.forEach(ref => {
                if (ref.current) {
                    ref.current.pause();
                }
            });
        }
    }, [showLightbox]);

    // Handle video autoplay in lightbox
    useEffect(() => {
        if (showLightbox) {
            const currentVideo = videoRefs[currentIndex]?.current;
            if (currentVideo && fixedImages[currentIndex]?.type === 'video') {
                currentVideo.play().catch(console.error);
            }
        }
    }, [showLightbox, currentIndex]);

    // Keyboard navigation for lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!showLightbox) return;
            switch (e.key) {
                case 'Escape':
                    setShowLightbox(false);
                    break;
                case 'ArrowLeft':
                    prevImage();
                    break;
                case 'ArrowRight':
                    nextImage();
                    break;
                case '+':
                case '=':
                    setZoomLevel(prev => Math.min(3, prev + 0.25));
                    break;
                case '-':
                    setZoomLevel(prev => Math.max(0.5, prev - 0.25));
                    break;
                case '0':
                    setZoomLevel(1);
                    break;
                case ' ':
                    if (fixedImages[currentIndex]?.type === 'video') {
                        handleVideoPlay(currentIndex);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showLightbox, currentIndex]);

    // Prevent body scroll when lightbox is open
    useEffect(() => {
        if (showLightbox) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showLightbox]);

    // Render video player for carousel
    const renderCarouselVideo = (image: Media, index: number) => {
        const videoRef = videoRefs[index];

        return (
            <div className="relative w-full pt-[100%] group">
                <video
                    ref={videoRef}
                    src={image.url}
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                    preload="metadata"
                    loop
                    playsInline
                    muted
                    onClick={(e) => {
                        e.stopPropagation();
                        handleVideoPlay(index);
                    }}
                />

                {/* Instagram-style video overlay with play button */}
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all duration-200 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleVideoPlay(index);
                    }}
                >
                    <div className="w-14 h-14 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-gray-900 border-b-[10px] border-b-transparent ml-1"></div>
                    </div>
                </div>

                {/* Video duration badge */}
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <span>▶</span>
                    <span>{image.duration || '0:00'}</span>
                </div>
            </div>
        );
    };

    // Render image for carousel
    const renderCarouselImage = (image: Media, index: number) => {
        return (
            <div className="relative w-full pt-[100%]">
                <img
                    src={image.thumbnail || image.url}
                    alt={`Post ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                    loading="lazy"
                    draggable="false"
                />

                {/* Dark gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="text-white text-sm font-medium drop-shadow-md">
                            {image.description || ''}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Instagram-style Carousel */}
            {fixedImages.length > 0 && (
                <div
                    ref={carouselRef}
                    className="relative w-full overflow-hidden bg-black/5 dark:bg-black/20"
                    onMouseEnter={() => setShowArrows(true)}
                    onMouseLeave={() => setShowArrows(false)}
                >
                    {/* Carousel container with swipe */}
                    <div
                        className={`relative flex transition-transform duration-300 ease-out ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                        style={{
                            transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
                            touchAction: 'pan-y pinch-zoom'
                        }}
                        onMouseDown={handleCarouselSwipeStart}
                        onMouseMove={handleCarouselSwipeMove}
                        onMouseUp={handleCarouselSwipeEnd}
                        onMouseLeave={handleCarouselSwipeEnd}
                        onTouchStart={handleCarouselSwipeStart}
                        onTouchMove={handleCarouselSwipeMove}
                        onTouchEnd={handleCarouselSwipeEnd}
                    >
                        {fixedImages.map((image, index) => (
                            <div
                                key={image._id || index}
                                className="relative flex-shrink-0 w-full p-2"
                                onClick={() => handleImageClick(index)}
                            >
                                {image.type === 'video'
                                    ? renderCarouselVideo(image, index)
                                    : renderCarouselImage(image, index)
                                }
                            </div>
                        ))}
                    </div>

                    {/* Hover-only Navigation Arrows */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                        }}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-200 ${showArrows ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        aria-label="Previous"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                        }}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-200 ${showArrows ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        aria-label="Next"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>

                    {/* Instagram-style Dots Indicator */}
                    {fixedImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                            {fixedImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentIndex(index);
                                    }}
                                    className={`transition-all duration-300 ${index === currentIndex
                                        ? 'w-1.5 h-1.5 bg-white scale-125'
                                        : 'w-1 h-1 bg-white/60 hover:bg-white/80'
                                        } rounded-full`}
                                    aria-label={`Go to item ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Multi-image indicator */}
                    {fixedImages.length > 1 && (
                        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                            {currentIndex + 1} / {fixedImages.length}
                        </div>
                    )}
                </div>
            )}

            {/* Instagram-style Lightbox */}
            {showLightbox && fixedImages.length > 0 && (
                <div
                    className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex items-center justify-center px-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowLightbox(false);
                        }
                    }}
                >
                    {/* Minimal Close Button */}
                    <button
                        onClick={() => setShowLightbox(false)}
                        className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full z-30 transition-all duration-200"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    {/* Media Container with Instagram-style animation */}
                    <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
                        <div
                            className={`relative transition-transform duration-300 ease-out ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                            style={{
                                transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px)) scale(${zoomLevel})`,
                                touchAction: 'none',
                                width: `${fixedImages.length * 100}%`,
                                display: 'flex'
                            }}
                            onMouseDown={handleLightboxDragStart}
                            onMouseMove={handleLightboxDragMove}
                            onMouseUp={handleLightboxDragEnd}
                            onMouseLeave={handleLightboxDragEnd}
                            onTouchStart={handleLightboxDragStart}
                            onTouchMove={handleLightboxDragMove}
                            onTouchEnd={handleLightboxDragEnd}
                        >
                            {fixedImages.map((image, index) => (
                                <div key={index} className="relative w-full h-full flex items-center justify-center px-2">
                                    {image.type === 'video' ? (
                                        <div className="relative max-w-full max-h-[85vh] w-full h-full flex items-center justify-center">
                                            <video
                                                ref={videoRefs[index]}
                                                src={image.url}
                                                controls
                                                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                                                autoPlay
                                                loop
                                                playsInline
                                            />

                                            {/* Custom video controls overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleVideoPlay(index);
                                                            }}
                                                            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full"
                                                        >
                                                            {videoRefs[index]?.current?.paused ? '▶' : '⏸'}
                                                        </button>
                                                        <span className="text-white text-sm">
                                                            {videoRefs[index]?.current?.currentTime
                                                                ? `${Math.floor(videoRefs[index]!.current!.currentTime / 60)}:${Math.floor(videoRefs[index]!.current!.currentTime % 60).toString().padStart(2, '0')}`
                                                                : '0:00'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={image.url}
                                            alt={`Lightbox ${index + 1}`}
                                            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl select-none transition-all duration-300"
                                            draggable="false"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (e.detail === 2) {
                                                    setZoomLevel(prev => prev === 1 ? 2 : 1);
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Zoom indicator - only for images */}
                        {zoomLevel > 1 && fixedImages[currentIndex]?.type === 'image' && (
                            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm">
                                {Math.round(zoomLevel * 100)}% — Drag to pan
                            </div>
                        )}
                    </div>

                    {/* Floating Minimal Controls - only for images */}
                    {fixedImages[currentIndex]?.type === 'image' && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full p-1 z-30">
                            <button
                                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-40"
                                disabled={zoomLevel <= 0.5}
                                aria-label="Zoom out"
                            >
                                <span className="text-white text-base w-5 h-5 flex items-center justify-center">−</span>
                            </button>

                            <button
                                onClick={() => setZoomLevel(1)}
                                className="px-3 py-1 text-white text-sm hover:bg-white/10 rounded-full transition-colors"
                                aria-label="Reset zoom"
                            >
                                {Math.round(zoomLevel * 100)}%
                            </button>

                            <button
                                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-40"
                                disabled={zoomLevel >= 3}
                                aria-label="Zoom in"
                            >
                                <span className="text-white text-base w-5 h-5 flex items-center justify-center">+</span>
                            </button>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="absolute bottom-6 right-6 flex items-center gap-2 z-30">
                        <button
                            onClick={handleDownload}
                            className="p-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white rounded-full transition-all duration-200"
                            aria-label="Download"
                        >
                            <Download className="w-5 h-5" />
                        </button>

                        <button
                            onClick={handleShare}
                            className="p-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white rounded-full transition-all duration-200"
                            aria-label="Share"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Lightbox Dots Indicator */}
                    {fixedImages.length > 1 && (
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                            {fixedImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentIndex(index);
                                    }}
                                    className={`transition-all duration-300 ${index === currentIndex
                                        ? 'w-2 h-2 bg-white scale-125'
                                        : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/70'
                                        } rounded-full`}
                                    aria-label={`Go to item ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Media Info */}
                    <div className="absolute top-6 left-6 max-w-md z-30">
                        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 text-white/90">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">
                                    {currentIndex + 1} / {fixedImages.length}
                                </span>
                                <span className={`text-xs px-2.5 py-1 rounded-full ${fixedImages[currentIndex]?.type === 'video'
                                        ? 'bg-blue-500/30 text-blue-200'
                                        : 'bg-purple-500/30 text-purple-200'
                                    }`}>
                                    {fixedImages[currentIndex]?.type?.toUpperCase() || 'IMAGE'}
                                </span>
                            </div>

                            {fixedImages[currentIndex]?.description && (
                                <p className="mt-2 text-sm line-clamp-2">
                                    {fixedImages[currentIndex].description}
                                </p>
                            )}

                            {fixedImages[currentIndex]?.dimensions && (
                                <div className="mt-2 text-xs text-white/60">
                                    {fixedImages[currentIndex].dimensions.width} × {fixedImages[currentIndex].dimensions.height}
                                    {fixedImages[currentIndex]?.size && (
                                        <span> • {(fixedImages[currentIndex].size / 1024 / 1024).toFixed(2)} MB</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};