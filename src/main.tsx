import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { RegisterPage } from '@/pages/RegisterPage';
import { PendingApprovalPage } from '@/pages/PendingApprovalPage';
import { useAuth } from './hooks/useAuth';
import { AppLayout } from './components/layout/AppLayout';
// Placeholder Dashboard Components
const StudentDashboard = () => <AppLayout><div>Student Dashboard</div></AppLayout>;
const ManagerDashboard = () => <AppLayout><div>Manager Dashboard</div></AppLayout>;
const AdminDashboard = () => <AppLayout><div>Admin Dashboard</div></AppLayout>;
const GuestPaymentPage = () => <div>Guest Payment Page</div>;
const ProtectedRoute = ({ children, role }: { children: JSX.Element, role: 'student' | 'manager' | 'admin' }) => {
  const user = useAuth(s => s.user);
  const token = useAuth(s => s.token);
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }
  if (user.role !== role) {
    // This could be a redirect to a "Not Authorized" page or back to login
    return <Navigate to="/" replace />;
  }
  return children;
};
const App = () => {
  const router = createBrowserRouter([
    { path: "/", element: <HomePage />, errorElement: <RouteErrorBoundary /> },
    { path: "/register", element: <RegisterPage /> },
    { path: "/pending-approval", element: <PendingApprovalPage /> },
    { path: "/guest-payment", element: <GuestPaymentPage /> },
    { path: "/student/dashboard", element: <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute> },
    { path: "/manager/dashboard", element: <ProtectedRoute role="manager"><ManagerDashboard /></ProtectedRoute> },
    { path: "/admin/dashboard", element: <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute> },
  ]);
  return <RouterProvider router={router} />;
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)