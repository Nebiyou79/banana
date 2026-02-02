// hooks/use-media-gallery.ts
import { useState, useCallback, useEffect } from 'react';
import { Media } from '@/services/postService';
import { postService } from '@/services/postService';

export interface GalleryImage {
    id: string;
    url: string;
    thumbnail?: string;
    type: 'image' | 'video' | 'document';
    description?: string;
    dimensions?: {
        width?: number;
        height?: number;
        format?: string;
        duration?: number;
    };
    mimeType?: string;
    originalName?: string;
    size?: number;
    order?: number;
}

export interface GalleryConfig {
    maxColumns?: number;
    gap?: number;
    imageHeight?: number;
    showCaptions?: boolean;
    lightboxEnabled?: boolean;
    autoplayVideos?: boolean;
    loopVideos?: boolean;
    mutedVideos?: boolean;
}

export function useMediaGallery(mediaItems: Media[] = [], config?: GalleryConfig) {
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [videoPlaying, setVideoPlaying] = useState<{ [key: string]: boolean }>({});

    // Transform media items to gallery format
    useEffect(() => {
        if (!mediaItems || mediaItems.length === 0) {
            setGalleryImages([]);
            return;
        }

        const transformed: GalleryImage[] = mediaItems.map((item, index) => ({
            id: item._id || `media-${index}-${Date.now()}`,
            url: postService.getFullMediaUrl(item.url),
            thumbnail: item.thumbnail ? postService.getFullMediaUrl(item.thumbnail) : undefined,
            type: item.type,
            description: item.description,
            dimensions: item.dimensions,
            mimeType: item.mimeType,
            originalName: item.originalName,
            size: item.size,
            order: item.order || index
        }));

        setGalleryImages(transformed);
    }, [mediaItems]);

    // Navigation functions
    const nextImage = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % galleryImages.length);
    }, [galleryImages.length]);

    const prevImage = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length);
    }, [galleryImages.length]);

    const openLightbox = useCallback((index: number) => {
        setCurrentIndex(index);
        setIsLightboxOpen(true);
        // Pause all videos when opening lightbox
        setVideoPlaying({});
    }, []);

    const closeLightbox = useCallback(() => {
        setIsLightboxOpen(false);
        // Pause all videos when closing lightbox
        setVideoPlaying({});
    }, []);

    const toggleVideoPlay = useCallback((id: string) => {
        setVideoPlaying(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    }, []);

    // Calculate grid layout based on number of items
    const getGridConfig = useCallback((count: number) => {
        if (count === 0) return { cols: 0, rows: 0 };
        if (count === 1) return { cols: 1, rows: 1 };
        if (count === 2) return { cols: 2, rows: 1 };
        if (count === 3 || count === 4) return { cols: 2, rows: 2 };
        if (count === 5 || count === 6) return { cols: 3, rows: 2 };
        return { cols: 3, rows: Math.ceil(count / 3) };
    }, []);

    // Get appropriate thumbnail size based on type
    const getThumbnailSize = useCallback((type: string) => {
        switch (type) {
            case 'video':
                return { width: 400, height: 225 };
            case 'document':
                return { width: 200, height: 200 };
            default:
                return { width: 400, height: 300 };
        }
    }, []);

    // Format file size
    const formatFileSize = useCallback((bytes?: number): string => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    }, []);

    return {
        galleryImages,
        currentIndex,
        isLightboxOpen,
        videoPlaying,
        gridConfig: getGridConfig(galleryImages.length),
        nextImage,
        prevImage,
        openLightbox,
        closeLightbox,
        toggleVideoPlay,
        getThumbnailSize,
        formatFileSize,
        setCurrentIndex
    };
}