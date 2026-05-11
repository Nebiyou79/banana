/**
 * src/hooks/useVerification.ts
 * Updated with better error handling and caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import {
  verificationService,
  VERIFICATION_FALLBACK,
  VerificationRequestData,
  AppointmentRequest,
  getUserId,
} from '../services/verificationService';
import toast from '../lib/toast';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const VERIFICATION_KEYS = {
  mine:           ['verification', 'me']                     as const,
  public:         (id: string) => ['verification', 'public', id] as const,
  slots:          (date: string, type: string) =>
                    ['verification', 'slots', date, type]     as const,
  officeLocation: ['verification', 'office']                 as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Current user's verification status with skeleton-friendly loading state. */
export const useMyVerificationStatus = () => {
  const { isAuthenticated, user } = useAuthStore();
  
  return useQuery({
    queryKey: VERIFICATION_KEYS.mine,
    queryFn:  async () => {
      try {
        const res = await verificationService.getMyStatus();
        // Merge user data from auth store if needed
        if (res && user) {
          res.user = {
            ...res.user,
            _id: user._id ?? user._id,
            name: res.user.name || user.name,
            email: res.user.email || user.email,
            role: res.user.role || user.role,
          };
        }
        return res ?? VERIFICATION_FALLBACK;
      } catch (err: any) {
        console.error('Failed to fetch verification status:', err);
        return VERIFICATION_FALLBACK;
      }
    },
    enabled:   isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime:    10 * 60 * 1000, // 10 minutes
    retry:     1,
  });
};

/** Public verification status for any user (profile pages). */
export const usePublicVerificationStatus = (userId: string) =>
  useQuery({
    queryKey: VERIFICATION_KEYS.public(userId),
    queryFn:  () => verificationService.getPublicStatus(userId),
    enabled:  !!userId,
    staleTime: 5 * 60 * 1000,
  });

/** Available appointment time slots for a given date + verification type. */
export const useAppointmentSlots = (date: string, verificationType: string) =>
  useQuery({
    queryKey: VERIFICATION_KEYS.slots(date, verificationType),
    queryFn:  () => verificationService.getAvailableSlots(date, verificationType),
    enabled:  !!date && !!verificationType,
    staleTime: 60 * 1000,     // slots change frequently
    retry:    1,
  });

/** Static office location (rarely changes — long stale time). */
export const useOfficeLocation = () =>
  useQuery({
    queryKey: VERIFICATION_KEYS.officeLocation,
    queryFn:  verificationService.getOfficeLocation,
    staleTime: 60 * 60 * 1000,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Submit a verification request.
 * Matches web VerificationRequestModal handleSubmit().
 */
export const useRequestVerification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VerificationRequestData) =>
      verificationService.requestVerification(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VERIFICATION_KEYS.mine });
      toast.success('Verification request submitted successfully', 'Under Review');
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ?? err?.message ?? 'Submission failed',
      );
    },
  });
};

/**
 * Book a verification appointment.
 * Mirrors web AppointmentModal handleSubmit() — sends exact AppointmentRequest shape.
 */
export const useBookAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointmentRequest) =>
      verificationService.bookAppointment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VERIFICATION_KEYS.mine });
      toast.success('Appointment booked! Check your email for confirmation.');
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ?? 'Failed to book appointment. Please try again.',
      );
    },
  });
};