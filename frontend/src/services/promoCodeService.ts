// src/services/promoCodeService.ts
import api, { getAuthHeaders, getUserInfo } from '@/lib/axios';

export interface PromoCodeBenefits {
    discountPercentage: number;
    rewardPoints: number;
    cashback: number;
    freeMonths: number;
    customReward?: string;
}

export interface PromoCodeValidationResponse {
    success: boolean;
    message: string;
    data: {
        code: string;
        benefits: PromoCodeBenefits;
        referrer: {
            id: string;
            name: string;
            code: string;
        };
        expiresAt: string;
    };
}

export interface ReferralStatsResponse {
    success: boolean;
    data: {
        user: {
            name: string;
            email: string;
            memberSince: string;
        };
        referralCode: {
            code: string;
            usedCount: number;
            maxUses: number;
            isActive: boolean;
        };
        stats: {
            totalReferrals: number;
            completedReferrals: number;
            pendingReferrals: number;
            successRate: string;
            rewardPoints: number;
            rewardBalance: number;
            totalRewardsEarned: number;
        };
        recentActivity: Array<{
            id: string;
            user: string;
            email: string;
            status: 'pending' | 'email_verified' | 'completed' | 'cancelled';
            date: string;
            rewardEarned: number;
        }>;
        shareable: {
            link: string;
            text: string;
            emailSubject: string;
            emailBody: string;
            telegramMessage: string;
            whatsappMessage: string;
        };
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    };
}

export interface LeaderboardEntry {
    name: string;
    email: string;
    avatar?: string;
    totalReferrals: number;
    rewardPoints: number;
}

export interface LeaderboardResponse {
    success: boolean;
    data: LeaderboardEntry[];
}

export interface GenerateCodeResponse {
    success: boolean;
    message: string;
    data: {
        code: string;
        usedCount: number;
        maxUses: number;
        benefits: PromoCodeBenefits;
        shareableLink: string;
        shareableText: string;
    };
}

export interface PromoCodeHistory {
    _id: string;
    code: string;
    type: string;
    usedCount: number;
    maxUses: number;
    isValid: boolean;
    usedBy: Array<{
        userId: {
            name: string;
            email: string;
        };
        usedAt: string;
        emailVerified: boolean;
    }>;
    createdAt: string;
    validUntil: string;
}

export interface AdminPromoCodeResponse {
    success: boolean;
    data: PromoCodeHistory[];
    pagination: {
        totalPages: number;
        currentPage: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface AdminStatsResponse {
    success: boolean;
    data: {
        overview: {
            totalCodes: number;
            activeCodes: number;
            totalUses: number;
            usersWithReferral: number;
            totalReferred: number;
            conversionRate: string;
        };
        typeBreakdown: Array<{
            _id: string;
            count: number;
            totalUses: number;
            avgUses: number;
        }>;
        topReferrers: Array<{
            name: string;
            email: string;
            completedReferrals: number;
            totalReferrals: number;
        }>;
        dailyTrends: Array<{
            _id: string;
            registrations: number;
            completed: number;
        }>;
    };
}

export interface CampaignCodeData {
    code: string;
    type?: 'campaign' | 'special' | 'welcome';
    referrerBenefits?: Partial<PromoCodeBenefits>;
    newUserBenefits?: Partial<PromoCodeBenefits>;
    maxUses?: number;
    validFrom?: Date;
    validUntil?: Date;
    campaign?: {
        name?: string;
        source?: string;
        medium?: string;
        notes?: string;
    };
}

/**
 * PromoCode Service - Handles all referral and promo code operations
 */
class PromoCodeService {
    private baseUrl = '/promo-codes';

    /**
     * Validate a promo code (public endpoint)
     * @param code - The promo code to validate
     */
    async validatePromoCode(code: string): Promise<PromoCodeValidationResponse> {
        try {
            const response = await api.post(`${this.baseUrl}/validate`, { code });
            return response.data;
        } catch (error: any) {
            throw this.handleError(error, 'Failed to validate promo code');
        }
    }

    /**
     * Generate referral code for current user
     */
    async generateMyReferralCode(): Promise<GenerateCodeResponse> {
        try {
            const response = await api.post(`${this.baseUrl}/generate`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error, 'Failed to generate referral code');
        }
    }

    /**
     * Get current user's referral statistics
     */
    async getMyReferralStats(page: number = 1, limit: number = 20): Promise<ReferralStatsResponse> {
        try {
            const response = await api.get(`${this.baseUrl}/my-stats`, {
                params: { page, limit }
            });
            return response.data;
        } catch (error: any) {
            throw this.handleError(error, 'Failed to fetch referral statistics');
        }
    }

    /**
     * Get referral leaderboard
     */
    async getLeaderboard(limit: number = 10): Promise<LeaderboardResponse> {
        try {
            const response = await api.get(`${this.baseUrl}/leaderboard`, {
                params: { limit }
            });
            return response.data;
        } catch (error: any) {
            throw this.handleError(error, 'Failed to fetch leaderboard');
        }
    }

    /**
     * ADMIN: Get all promo codes
     */
    async getAllPromoCodes(
        page: number = 1,
        limit: number = 20,
        filters?: {
            type?: string;
            isActive?: boolean;
            userId?: string;
            search?: string;
        }
    ): Promise<AdminPromoCodeResponse> {
        try {
            const response = await api.get(`${this.baseUrl}/admin/all`, {
                params: { page, limit, ...filters }
            });
            return response.data;
        } catch (error: any) {
            throw this.handleError(error, 'Failed to fetch promo codes');
        }
    }

    /**
     * ADMIN: Get promo code statistics
     */
    async getPromoCodeStats(): Promise<AdminStatsResponse> {
        try {
            const response = await api.get(`${this.baseUrl}/admin/stats`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error, 'Failed to fetch promo statistics');
        }
    }

    /**
     * ADMIN: Create campaign promo code
     */
    async createCampaignPromoCode(data: CampaignCodeData): Promise<any> {
        try {
            const response = await api.post(`${this.baseUrl}/admin/create`, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error, 'Failed to create campaign code');
        }
    }

    /**
     * ADMIN: Bulk create promo codes
     */
    async bulkCreatePromoCodes(data: {
        count: number;
        prefix?: string;
        type?: string;
        maxUses?: number;
        newUserBenefits?: any;
    }): Promise<any> {
        try {
            const response = await api.post(`${this.baseUrl}/admin/bulk-create`, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error, 'Failed to bulk create codes');
        }
    }

    /**
     * ADMIN: Update promo code
     */
    async updatePromoCode(id: string, updates: any): Promise<any> {
        try {
            const response = await api.put(`${this.baseUrl}/admin/${id}`, updates);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error, 'Failed to update promo code');
        }
    }

    /**
     * ADMIN: Get promo code details
     */
    async getPromoCodeDetails(id: string): Promise<any> {
        try {
            const response = await api.get(`${this.baseUrl}/admin/${id}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error, 'Failed to fetch promo code details');
        }
    }

    /**
     * ADMIN: Trigger backfill for existing users
     */
    async triggerBackfill(batchSize: number = 50): Promise<any> {
        try {
            const response = await api.post(`${this.baseUrl}/admin/backfill`, { batchSize });
            return response.data;
        } catch (error: any) {
            throw this.handleError(error, 'Failed to trigger backfill');
        }
    }

    /**
     * Check if user has a referral code
     */
    async checkHasReferralCode(): Promise<boolean> {
        try {
            const { data } = await this.getMyReferralStats(1, 1);
            return !!data.referralCode.code;
        } catch {
            return false;
        }
    }

    /**
     * Get shareable content for a code
     */
    getShareableContent(code: string, platform: 'whatsapp' | 'telegram' | 'email' | 'copy'): string {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com';
        const link = `${baseUrl}/register?ref=${code}`;
        const text = `Join me on this platform! Use my referral code: ${code}`;

        switch (platform) {
            case 'whatsapp':
                return `https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`;
            case 'telegram':
                return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
            case 'email':
                return `mailto:?subject=${encodeURIComponent('Join me on this platform')}&body=${encodeURIComponent(text + '\n\n' + link)}`;
            case 'copy':
            default:
                return `${text}\n\n${link}`;
        }
    }

    /**
     * Track referral click (for analytics)
     */
    async trackReferralClick(code: string, source: string): Promise<void> {
        try {
            await api.post(`${this.baseUrl}/track-click`, { code, source });
        } catch (error) {
            console.error('Failed to track referral click:', error);
        }
    }

    /**
     * Error handler
     */
    private handleError(error: any, defaultMessage: string): Error {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error(defaultMessage);
    }
}

// Create and export singleton instance
export const promoCodeService = new PromoCodeService();