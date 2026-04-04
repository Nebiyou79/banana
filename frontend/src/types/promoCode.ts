// src/types/promoCode.ts
export interface PromoCode {
    _id: string;
    code: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    type: 'referral' | 'campaign' | 'welcome' | 'special';
    referrerBenefits: {
        discountPercentage: number;
        rewardPoints: number;
        cashback: number;
        freeMonths: number;
        customReward?: string;
    };
    newUserBenefits: {
        discountPercentage: number;
        rewardPoints: number;
        cashback: number;
        freeMonths: number;
        customReward?: string;
    };
    maxUses: number;
    usedCount: number;
    usedBy: Array<{
        userId: {
            _id: string;
            name: string;
            email: string;
        };
        usedAt: string;
        emailVerified: boolean;
        registrationCompleted: boolean;
    }>;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
    campaign?: {
        name: string;
        source: string;
        medium: string;
        notes: string;
    };
    isBackfilled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ReferralStats {
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    successRate: number;
    rewardPoints: number;
    rewardBalance: number;
}

export interface ReferralHistory {
    id: string;
    referrerId: string;
    referredUser: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    status: 'pending' | 'email_verified' | 'completed' | 'cancelled';
    reward: {
        points: number;
        cashback: number;
        status: 'pending' | 'credited';
    };
    createdAt: string;
    completedAt?: string;
}

export interface PromoCodeFilters {
    type?: string;
    isActive?: boolean;
    userId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}