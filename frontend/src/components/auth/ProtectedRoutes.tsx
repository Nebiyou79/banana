"use client";

import { useRouter } from "next/navigation"; // ✅ correct import for Next.js 13+
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "candidate" | "freelancer" | "company" | "organization" | "admin";
  requiredVerification?: "partial" | "full";
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredVerification,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (requiredRole && user?.role !== requiredRole) {
        router.replace("/unauthorized");
      } else if (
        requiredVerification &&
        user?.verificationStatus !== requiredVerification
      ) {
        router.replace("/verification-required");
      }
    }
  }, [isLoading, isAuthenticated, requiredRole, requiredVerification, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // While redirecting, don’t render children
  if (!isAuthenticated) return null;

  if (requiredRole && user?.role !== requiredRole) return null;

  if (requiredVerification && user?.verificationStatus !== requiredVerification)
    return null;

  return <>{children}</>;
};
