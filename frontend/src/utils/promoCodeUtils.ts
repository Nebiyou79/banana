// src/utils/promoCodeUtils.ts
import { PromoCode } from '@/types/promoCode';

/**
 * Format promo code for display
 */
export const formatPromoCode = (code: string): string => {
    return code.toUpperCase().replace(/(.{4})/g, '$1-').replace(/-$/, '');
};

/**
 * Check if promo code is expired
 */
export const isPromoCodeExpired = (promoCode: PromoCode): boolean => {
    const now = new Date();
    const validUntil = new Date(promoCode.validUntil);
    return now > validUntil;
};

/**
 * Check if promo code is fully used
 */
export const isPromoCodeFullyUsed = (promoCode: PromoCode): boolean => {
    return promoCode.usedCount >= promoCode.maxUses;
};

/**
 * Get promo code status
 */
export const getPromoCodeStatus = (promoCode: PromoCode): {
    status: 'active' | 'expired' | 'full' | 'inactive';
    message: string;
    color: 'green' | 'red' | 'yellow' | 'gray';
} => {
    if (!promoCode.isActive) {
        return { status: 'inactive', message: 'Inactive', color: 'gray' };
    }
    if (isPromoCodeExpired(promoCode)) {
        return { status: 'expired', message: 'Expired', color: 'red' };
    }
    if (isPromoCodeFullyUsed(promoCode)) {
        return { status: 'full', message: 'Fully Used', color: 'yellow' };
    }
    return { status: 'active', message: 'Active', color: 'green' };
};

/**
 * Calculate usage percentage
 */
export const getUsagePercentage = (promoCode: PromoCode): number => {
    return (promoCode.usedCount / promoCode.maxUses) * 100;
};

/**
 * Format share message
 */
export const formatShareMessage = (code: string, platform: 'whatsapp' | 'telegram' | 'email'): string => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com';
    const link = `${baseUrl}/register?ref=${code}`;
    const text = `Join me on this amazing platform! Use my referral code: ${code}`;

    switch (platform) {
        case 'whatsapp':
            return `https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`;
        case 'telegram':
            return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
        case 'email':
            return `mailto:?subject=${encodeURIComponent('Join me on this platform')}&body=${encodeURIComponent(text + '\n\n' + link)}`;
        default:
            return `${text}\n\n${link}`;
    }
};