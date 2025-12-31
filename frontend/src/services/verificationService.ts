// src/services/verificationService.ts
import { api } from '@/lib/axios';

export interface VerificationDetails {
    profileVerified: boolean;
    socialVerified: boolean;
    documentsVerified: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    lastVerified?: string;
    verifiedBy?: string;
    verificationNotes?: string;
}

export interface VerificationStatusResponse {
    success: boolean;
    verificationStatus: 'none' | 'partial' | 'full';
    verificationDetails: VerificationDetails;
    verificationMessage: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        avatar?: string;
        headline?: string;
    };
}

export interface UpdateVerificationRequest {
    profileVerified?: boolean;
    socialVerified?: boolean;
    documentsVerified?: boolean;
    verificationNotes?: string;
    verificationStatus?: 'none' | 'partial' | 'full';
}

export interface VerificationRequestData {
    verificationType: 'profile' | 'social' | 'document';
    description?: string;
}

export interface BulkUpdateRequest {
    userIds: string[];
    updates: UpdateVerificationRequest;
}

export interface VerificationStats {
    total: number;
    verified: number;
    partiallyVerified: number;
    notVerified: number;
    verificationRate: number;
    detailedStats: Array<{
        status: string;
        count: number;
        roles: string[];
    }>;
}

class VerificationService {
    // Get verification status for a specific user
    async getVerificationStatus(userId?: string): Promise<VerificationStatusResponse> {
        const url = userId
            ? `/verification/status/${userId}`
            : '/verification/my-status';

        const response = await api.get<VerificationStatusResponse>(url);
        return response.data;
    }

    // Update verification status (Admin only)
    async updateVerification(
        userId: string,
        data: UpdateVerificationRequest
    ): Promise<VerificationStatusResponse> {
        const response = await api.patch<VerificationStatusResponse>(
            `/verification/update/${userId}`,
            data
        );
        return response.data;
    }

    // Request verification
    async requestVerification(data: VerificationRequestData): Promise<{
        success: boolean;
        message: string;
        request: any;
    }> {
        const response = await api.post('/verification/request', data);
        return response.data;
    }

    // Get verification requests (Admin only)
    async getVerificationRequests(): Promise<{
        success: boolean;
        count: number;
        requests: Array<any>;
    }> {
        const response = await api.get('/verification/requests');
        return response.data;
    }

    // Bulk update verification (Admin only)
    async bulkUpdateVerification(data: BulkUpdateRequest): Promise<{
        success: boolean;
        message: string;
        modifiedCount: number;
    }> {
        const response = await api.post('/verification/bulk-update', data);
        return response.data;
    }

    // Get verification statistics (Admin only)
    async getVerificationStats(): Promise<{
        success: boolean;
        stats: VerificationStats;
    }> {
        const response = await api.get('/verification/stats');
        return response.data;
    }

    // Helper method to get verification badge config
    getVerificationBadgeConfig(status: 'none' | 'partial' | 'full') {
        switch (status) {
            case 'full':
                return {
                    icon: 'CheckCircleIcon' as const,
                    text: 'Fully Verified',
                    bgColor: 'bg-green-400',
                    textColor: 'text-white',
                    iconColor: 'text-white',
                    tooltip: 'Your Profile is fully Verified'
                };
            case 'partial':
                return {
                    icon: 'ExclamationCircleIcon' as const,
                    text: 'Partially Verified',
                    bgColor: 'bg-yellow-300',
                    textColor: 'text-yellow-800',
                    iconColor: 'text-yellow-800',
                    tooltip: 'Your Profile is verified but not your social Profile. Complete your Verification'
                };
            case 'none':
            default:
                return {
                    icon: 'XCircleIcon' as const,
                    text: 'Not Verified',
                    bgColor: 'bg-red-600',
                    textColor: 'text-white',
                    iconColor: 'text-white',
                    tooltip: 'Both The Profile and SocialProfile are not verified. Complete your Verification'
                };
        }
    }

    // Calculate verification progress percentage
    calculateVerificationProgress(details: VerificationDetails): number {
        const checks = [
            details.profileVerified,
            details.socialVerified,
            details.documentsVerified,
            details.emailVerified,
            details.phoneVerified
        ];

        const completedChecks = checks.filter(Boolean).length;
        return Math.round((completedChecks / checks.length) * 100);
    }

    // Check if user can request verification
    canRequestVerification(
        currentStatus: 'none' | 'partial' | 'full',
        lastVerified?: string
    ): boolean {
        // Can't request if already fully verified
        if (currentStatus === 'full') return false;

        // If last verified was less than 30 days ago, can't request again
        if (lastVerified) {
            const lastVerifiedDate = new Date(lastVerified);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            return lastVerifiedDate < thirtyDaysAgo;
        }

        return true;
    }
}

export default new VerificationService();