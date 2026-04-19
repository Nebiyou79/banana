import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  roleProfileService,
  type RoleProfileData,
} from '../services/roleProfileService';
import { SOCIAL_KEYS } from './queryKeys';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../types';

/**
 * Fetch role-specific profile data for the current user. If `forceRole` is
 * passed, it overrides the auth-store role (useful for admin previews).
 */
export const useRoleProfile = (forceRole?: UserRole) => {
  const storeRole = useAuthStore((s) => s.role) as UserRole | undefined;
  const role = (forceRole ?? storeRole ?? 'candidate') as UserRole;

  return useQuery({
    queryKey: SOCIAL_KEYS.roleProfile(role),
    queryFn: async () => {
      const res = await roleProfileService.getByRole(role);
      return res?.data?.data ?? res?.data ?? null;
    },
    enabled: Boolean(role),
    staleTime: 1000 * 60 * 3,
  });
};

/**
 * Update the role-specific section of the current user's profile.
 */
export const useUpdateRoleProfile = (forceRole?: UserRole) => {
  const qc = useQueryClient();
  const storeRole = useAuthStore((s) => s.role) as UserRole | undefined;
  const role = (forceRole ?? storeRole ?? 'candidate') as UserRole;

  return useMutation({
    mutationFn: (data: RoleProfileData) =>
      roleProfileService.updateByRole(role, data) as Promise<any>,
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: SOCIAL_KEYS.roleProfile(role) });
      const prev = qc.getQueryData<any>(SOCIAL_KEYS.roleProfile(role));
      if (prev) {
        qc.setQueryData<any>(SOCIAL_KEYS.roleProfile(role), {
          ...prev,
          ...data,
        });
      }
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev !== undefined)
        qc.setQueryData(SOCIAL_KEYS.roleProfile(role), ctx.prev);
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Update failed',
      });
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Profile updated' });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.roleProfile(role) });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.ownProfile });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.profileCompletion });
    },
  });
};
