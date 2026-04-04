// utils/roleUtils.ts
import { useAuth } from '@/contexts/AuthContext';

export const useRole = () => {
  const { user } = useAuth();
  
  const getRole = () => {
    return user?.role || 'candidate';
  };

  const isCandidate = () => getRole() === 'candidate';
  const isCompany = () => getRole() === 'company';
  const isOrganization = () => getRole() === 'organization';
  const isAdmin = () => getRole() === 'admin';

  const getDashboardPath = () => {
    const role = getRole();
    return `/dashboard/${role}`;
  };

  const getApplicationsPath = () => {
    const role = getRole();
    return `/dashboard/${role}/applications`;
  };

  const getApplicationDetailsPath = (id: string) => {
    const role = getRole();
    return `/dashboard/${role}/applications/${id}`;
  };

  return {
    getRole,
    isCandidate,
    isCompany,
    isOrganization,
    isAdmin,
    getDashboardPath,
    getApplicationsPath,
    getApplicationDetailsPath
  };
};