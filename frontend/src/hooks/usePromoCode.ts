// src/hooks/usePromoCode.ts
import { useState, useEffect, useCallback } from 'react';
import { promoCodeService } from '@/services/promoCodeService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth'; // Assuming you have an auth hook

export const usePromoCode = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    /**
     * Validate a promo code
     */
    const validateCode = useCallback(async (code: string) => {
        if (!code || code.length < 3) return null;

        setLoading(true);
        setError(null);

        try {
            const result = await promoCodeService.validatePromoCode(code);
            return result.data;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Generate referral code for current user
     */
    const generateCode = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await promoCodeService.generateMyReferralCode();
            toast({
                title: 'Success',
                description: result.message || 'Referral code generated successfully',
            });
            return result.data;
        } catch (err: any) {
            setError(err.message);
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    /**
     * Get referral stats
     */
    const getStats = useCallback(async (page: number = 1) => {
        setLoading(true);
        setError(null);

        try {
            const result = await promoCodeService.getMyReferralStats(page);
            return result.data;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Copy referral link to clipboard
     */
    const copyToClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast({
                title: 'Copied!',
                description: 'Referral link copied to clipboard',
            });
            return true;
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to copy to clipboard',
                variant: 'destructive',
            });
            return false;
        }
    }, [toast]);

    return {
        loading,
        error,
        validateCode,
        generateCode,
        getStats,
        copyToClipboard,
        shareable: promoCodeService.getShareableContent,
    };
};

// Admin hook
export const useAdminPromoCode = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    /**
     * Get all promo codes with filters
     */
    const getAllCodes = useCallback(async (page: number = 1, filters?: any) => {
        setLoading(true);
        setError(null);

        try {
            const result = await promoCodeService.getAllPromoCodes(page, 20, filters);
            return result;
        } catch (err: any) {
            setError(err.message);
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    /**
     * Get promo code statistics
     */
    const getStats = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await promoCodeService.getPromoCodeStats();
            return result.data;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Create campaign code
     */
    const createCampaign = useCallback(async (data: any) => {
        setLoading(true);
        setError(null);

        try {
            const result = await promoCodeService.createCampaignPromoCode(data);
            toast({
                title: 'Success',
                description: 'Campaign code created successfully',
            });
            return result.data;
        } catch (err: any) {
            setError(err.message);
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    return {
        loading,
        error,
        getAllCodes,
        getStats,
        createCampaign,
    };
};