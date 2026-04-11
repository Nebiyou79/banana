import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationService } from '../services/verificationService';
import { useAuthStore } from '../store/authStore';
import { toast } from '../lib/toast';

export const VERIFICATION_KEYS = {
  mine: ['verification', 'me'] as const,
  public: (id: string) => ['verification', 'public', id] as const,
};

export const useMyVerificationStatus = () => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: VERIFICATION_KEYS.mine,
    queryFn: verificationService.getMyStatus,
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });
};

export const useRequestVerification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => verificationService.requestVerification(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VERIFICATION_KEYS.mine });
      toast.success('Verification request submitted', 'Under Review');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Submission failed');
    },
  });
};
