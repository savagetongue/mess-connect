import { Navigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
export const ProtectedRoute = ({ children, role }: { children: JSX.Element, role: 'student' | 'manager' | 'admin' }) => {
  const user = useAuth(s => s.user);
  const token = useAuth(s => s.token);
  const isHydrated = useAuth(s => s._hydrated);
  if (!isHydrated) {
    // You can return a loading spinner here while the auth state is rehydrating
    return null; 
  }
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }
  if (user.role !== role) {
    // Redirect to their own dashboard if they try to access a wrong one
    const correctDashboard = `/${user.role}/dashboard`;
    return <Navigate to={correctDashboard} replace />;
  }
  return children;
};