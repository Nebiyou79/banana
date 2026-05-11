/**
 * src/hooks/useProfileGate.ts
 *
 * Returns whether the current user has completed their role-specific profile.
 * Used by CompanyNavigator and OrganizationNavigator to decide whether to
 * show the ProfileSetup screen or the main tabs.
 *
 * Logic mirrors the web: backend returns 404/null when no profile exists,
 * companyService.getMyCompany() and organizationService.getMyOrganization()
 * both return null in that case.
 */

import { useQuery } from '@tanstack/react-query';
import { companyService } from '../services/companyService';
import { organizationService } from '../services/organizationService';

interface GateResult {
  /** true = profile exists, show main tabs; false = show setup screen */
  hasProfile: boolean;
  /** true while the initial query is running */
  isLoading: boolean;
  /** Re-check — call this after the user saves their profile */
  refetch: () => void;
}

export function useCompanyProfileGate(): GateResult {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['company', 'profileGate'],
    queryFn: companyService.getMyCompany,
    // Only retry once — a null response means no profile, not a transient error
    retry: 1,
    staleTime: 60 * 1000,
  });

  return {
    hasProfile: !!data,
    isLoading,
    refetch,
  };
}

export function useOrganizationProfileGate(): GateResult {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['org', 'profileGate'],
    queryFn: organizationService.getMyOrganization,
    retry: 1,
    staleTime: 60 * 1000,
  });

  return {
    hasProfile: !!data,
    isLoading,
    refetch,
  };
}
