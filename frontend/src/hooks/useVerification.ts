// hooks/useVerification.ts
import { useEffect, useState } from 'react';
import VerificationService, { VerificationStatusResponse } from '@/services/verificationService';
import { useAuth } from '@/contexts/AuthContext';

export const useVerification = () => {
  const { user } = useAuth();
  const [verificationData, setVerificationData] = useState<VerificationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerificationStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await VerificationService.getVerificationStatus();
      setVerificationData(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch verification status:', err);
      setError(err.message || 'Failed to fetch verification status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVerificationStatus();
    }
  }, [user]);

  return {
    verificationData,
    loading,
    error,
    refetch: fetchVerificationStatus,
    verificationStatus: verificationData?.verificationStatus || 'none',
    verificationDetails: verificationData?.verificationDetails,
    userDetails: verificationData?.user
  };
};