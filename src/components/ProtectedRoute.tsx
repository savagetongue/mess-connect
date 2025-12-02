import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";
export const ProtectedRoute = ({ children, role }: { children: JSX.Element, role: 'student' | 'manager' | 'admin' }) => {
  const user = useAuth(s => s.user);
  const token = useAuth(s => s.token);
  const isHydrated = useAuth(s => s._hydrated);
  const { t } = useTranslation();
  useEffect(() => {
    if (isHydrated && token && user && user.role !== role) {
      toast.error("Unauthorized Access", { description: "You are not permitted to view this page." });
    }
  }, [isHydrated, token, user, role, t]);
  if (!isHydrated) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }
  if (user.role !== role) {
    const correctDashboard = `/${user.role}/dashboard`;
    return <Navigate to={correctDashboard} replace />;
  }
  return children;
};