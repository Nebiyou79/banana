/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/image-utils.ts
import { profileService } from '@/services/profileService';

export const getFullImageUrl = (imageUrl?: string | null): string => {
    if (!imageUrl) {
        console.log('📷 getFullImageUrl: No image URL provided');
        return '';
    }

    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) {
        console.log('📷 getFullImageUrl: Full URL detected:', imageUrl);
        return imageUrl;
    }

    // For relative URLs, prepend with base URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

    // Handle different URL formats
    let fullUrl = '';
    if (imageUrl.startsWith('/')) {
        fullUrl = `${baseUrl}${imageUrl}`;
    } else {
        fullUrl = `${baseUrl}/${imageUrl}`;
    }

    console.log('📷 getFullImageUrl: Constructed URL:', fullUrl);
    return fullUrl;
};

export const handleImageUpload = async (
    file: File,
    type: 'avatar' | 'coverPhoto'
): Promise<{ url: string; publicId?: string }> => {
    try {
        console.log(`📷 handleImageUpload: Starting ${type} upload`);

        if (type === 'avatar') {
            const result = await profileService.uploadAvatar(file);
            console.log('📷 handleImageUpload: Avatar uploaded:', result.avatarUrl);
            return { url: result.avatarUrl, publicId: result.publicId };
        } else {
            const result = await profileService.uploadCoverPhoto(file);
            console.log('📷 handleImageUpload: Cover photo uploaded:', result.coverPhotoUrl);
            return { url: result.coverPhotoUrl, publicId: result.publicId };
        }
    } catch (error) {
        console.error(`📷 handleImageUpload: Failed to upload ${type}:`, error);
        throw error;
    }
};

export const getCacheBustUrl = (url: string, refreshKey: number = 0): string => {
    if (!url) {
        console.log('📷 getCacheBustUrl: No URL provided');
        return '';
    }

    const separator = url.includes('?') ? '&' : '?';
    const cacheBustUrl = `${url}${separator}_t=${refreshKey}`;
    console.log('📷 getCacheBustUrl:', cacheBustUrl);
    return cacheBustUrl;
};

// Helper to safely extract profile data
export const getProfileImages = (profile?: any) => {
    if (!profile) {
        console.log('📷 getProfileImages: No profile provided');
        return { coverPhoto: null, avatar: null };
    }

    // Check common locations for cover photo
    const coverPhoto = profile.user?.coverPhoto || profile.cover;
    const avatar = profile.user?.avatar;

    console.log('📷 getProfileImages:', {
        hasProfile: !!profile,
        coverPhotoSource: coverPhoto ? 'found' : 'not found',
        coverPhotoLocation: coverPhoto ?
            (profile.user?.coverPhoto ? 'user.coverPhoto' : 'profile.cover') : 'none',
        avatarSource: avatar ? 'found' : 'not found',
        userHasAvatar: !!profile.user?.avatar
    });

    return { coverPhoto, avatar };
};