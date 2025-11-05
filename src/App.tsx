import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { I18nProvider } from '@/lib/i18n.tsx';
// Page Imports
import { HomePage } from '@/pages/HomePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { PendingApprovalPage } from '@/pages/PendingApprovalPage';
import { GuestPaymentPage } from '@/pages/GuestPaymentPage';
// Student Pages
import { StudentDashboardPage } from '@/pages/student/StudentDashboardPage';
import { WeeklyMenuPage } from '@/pages/student/WeeklyMenuPage';
import { MyDuesPage } from '@/pages/student/MyDuesPage';
import { ComplaintsPage } from '@/pages/student/ComplaintsPage';
import { SuggestionsPage } from '@/pages/student/SuggestionsPage';
import { NotificationsPage } from '@/pages/student/NotificationsPage';
import { MessRulesPage } from '@/pages/student/MessRulesPage';
// Manager Pages
import { ManagerDashboardPage } from '@/pages/manager/ManagerDashboardPage';
import { StudentManagementPage } from '@/pages/manager/StudentManagementPage';
import { UpdateMenuPage } from '@/pages/manager/UpdateMenuPage';
import { ManagerFinancialsPage } from '@/pages/manager/ManagerFinancialsPage';
import { ManagerFeedbackPage } from '@/pages/manager/ManagerFeedbackPage';
import { ManagerSuggestionsPage } from '@/pages/manager/ManagerSuggestionsPage';
import { ManagerNotesPage } from '@/pages/manager/ManagerNotesPage';
import { ManagerBroadcastPage } from '@/pages/manager/ManagerBroadcastPage';
import { ManagerSettingsPage } from '@/pages/manager/ManagerSettingsPage';
// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminMenuPage } from '@/pages/admin/AdminMenuPage';
// Layout & Auth
import { ProtectedRoute } from '@/components/ProtectedRoute';
export function App() {
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
    { path: "/student/notifications", element: <ProtectedRoute role="student"><NotificationsPage /></ProtectedRoute> },
    { path: "/student/rules", element: <ProtectedRoute role="student"><MessRulesPage /></ProtectedRoute> },
    // Manager Routes
    { path: "/manager/dashboard", element: <ProtectedRoute role="manager"><ManagerDashboardPage /></ProtectedRoute> },
    { path: "/manager/students", element: <ProtectedRoute role="manager"><StudentManagementPage /></ProtectedRoute> },
    { path: "/manager/menu", element: <ProtectedRoute role="manager"><UpdateMenuPage /></ProtectedRoute> },
    { path: "/manager/financials", element: <ProtectedRoute role="manager"><ManagerFinancialsPage /></ProtectedRoute> },
    { path: "/manager/feedback", element: <ProtectedRoute role="manager"><ManagerFeedbackPage /></ProtectedRoute> },
    { path: "/manager/suggestions", element: <ProtectedRoute role="manager"><ManagerSuggestionsPage /></ProtectedRoute> },
    { path: "/manager/notes", element: <ProtectedRoute role="manager"><ManagerNotesPage /></ProtectedRoute> },
    { path: "/manager/broadcast", element: <ProtectedRoute role="manager"><ManagerBroadcastPage /></ProtectedRoute> },
    { path: "/manager/settings", element: <ProtectedRoute role="manager"><ManagerSettingsPage /></ProtectedRoute> },
    // Admin Routes
    { path: "/admin/dashboard", element: <ProtectedRoute role="admin"><AdminDashboardPage /></ProtectedRoute> },
    { path: "/admin/menu", element: <ProtectedRoute role="admin"><AdminMenuPage /></ProtectedRoute> },
  ]);
  return (
    <I18nProvider>
      <RouterProvider router={router} />
    </I18nProvider>
  );
}