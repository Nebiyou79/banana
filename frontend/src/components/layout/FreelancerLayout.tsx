// components/layout/FreelancerLayout.tsx
import { DashboardLayout } from './DashboardLayout';

interface FreelancerLayoutProps {
  children: React.ReactNode;
}

export function FreelancerLayout({ children }: FreelancerLayoutProps) {
  return (
    <DashboardLayout requiredRole="freelancer">
      {children}
    </DashboardLayout>
  );
}