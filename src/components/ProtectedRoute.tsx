import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
export const ProtectedRoute = ({ children, role }: { children: JSX.Element, role: 'student' | 'manager' | 'admin' }) => {
  const user = useAuth(s => s.user);
  const token = useAuth(s => s.token);
  const isHydrated = useAuth(s => s._hydrated);
  const { t } = useTranslation();
  useEffect(() => {
    if (isHydrated && token && user && user.role !== role) {
      toast.error(t('unauthorizedAccess', { defaultValue: "Unauthorized Access" }), {
        description: t('roleMismatch', { defaultValue: "You are not permitted to view this page." }),
      });
    }
  }, [isHydrated, token, user?.role, role, t]);
  if (!isHydrated) {
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-2" aria-hidden="true" />
        <span className="sr-only">{t('loading')}</span>
      </div>
    );
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