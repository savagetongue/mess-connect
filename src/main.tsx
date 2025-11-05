import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
// Page Imports
import { HomePage } from '@/pages/HomePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { PendingApprovalPage } from '@/pages/PendingApprovalPage';
import { GuestPaymentPage } from '@/pages/GuestPaymentPage';
import { StudentDashboardPage } from '@/pages/student/StudentDashboardPage';
import { WeeklyMenuPage } from '@/pages/student/WeeklyMenuPage';
import { MyDuesPage } from '@/pages/student/MyDuesPage';
import { ComplaintsPage } from '@/pages/student/ComplaintsPage';
import { SuggestionsPage } from '@/pages/student/SuggestionsPage';
// Layout & Auth
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
// Placeholder Dashboard Components for other roles
const ManagerDashboard = () => <AppLayout><div>Manager Dashboard</div></AppLayout>;
const AdminDashboard = () => <AppLayout><div>Admin Dashboard</div></AppLayout>;
const App = () => {
  const router = createBrowserRouter([
    // Public Routes
    { path: "/", element: <HomePage />, errorElement: <RouteErrorBoundary /> },
    { path: "/register", element: <RegisterPage /> },
    { path: "/pending-approval", element: <PendingApprovalPage /> },
    { path: "/guest-payment", element: <GuestPaymentPage /> },
    // Student Routes
    { path: "/student/dashboard", element: <ProtectedRoute role="student"><StudentDashboardPage /></ProtectedRoute> },
    { path: "/student/menu", element: <ProtectedRoute role="student"><WeeklyMenuPage /></ProtectedRoute> },
    { path: "/student/dues", element: <ProtectedRoute role="student"><MyDuesPage /></ProtectedRoute> },
    { path: "/student/complaints", element: <ProtectedRoute role="student"><ComplaintsPage /></ProtectedRoute> },
    { path: "/student/suggestions", element: <ProtectedRoute role="student"><SuggestionsPage /></ProtectedRoute> },
    // Manager Routes
    { path: "/manager/dashboard", element: <ProtectedRoute role="manager"><ManagerDashboard /></ProtectedRoute> },
    // Admin Routes
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