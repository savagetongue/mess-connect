import React from "react";
import { createBrowserRouter, RouterProvider, useLocation, Outlet } from "react-router-dom";
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import I18nProvider from '@/lib/i18n.tsx';
import { motion, AnimatePresence } from 'framer-motion';
// Page Imports
import { HomePage } from '@/pages/HomePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { PendingApprovalPage } from '@/pages/PendingApprovalPage';
import { GuestPaymentPage } from '@/pages/GuestPaymentPage';
import { VerificationPage } from '@/pages/VerificationPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
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
const AnimatedOutlet = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
};
const createProtectedRoute = (path: string, role: 'student' | 'manager' | 'admin', element: JSX.Element) => ({
  path,
  element: <ProtectedRoute role={role}>{element}</ProtectedRoute>,
});
const router = createBrowserRouter([
  {
    element: <AnimatedOutlet />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Public Routes
      { path: "/", element: <HomePage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/pending-approval", element: <PendingApprovalPage /> },
      { path: "/guest-payment", element: <GuestPaymentPage /> },
      { path: "/verify/:token", element: <VerificationPage /> },
      { path: "/reset/:token", element: <ResetPasswordPage /> },
      // Student Routes
      createProtectedRoute("/student/dashboard", "student", <StudentDashboardPage />),
      createProtectedRoute("/student/menu", "student", <WeeklyMenuPage />),
      createProtectedRoute("/student/dues", "student", <MyDuesPage />),
      createProtectedRoute("/student/complaints", "student", <ComplaintsPage />),
      createProtectedRoute("/student/suggestions", "student", <SuggestionsPage />),
      createProtectedRoute("/student/notifications", "student", <NotificationsPage />),
      createProtectedRoute("/student/rules", "student", <MessRulesPage />),
      // Manager Routes
      createProtectedRoute("/manager/dashboard", "manager", <ManagerDashboardPage />),
      createProtectedRoute("/manager/students", "manager", <StudentManagementPage />),
      createProtectedRoute("/manager/menu", "manager", <UpdateMenuPage />),
      createProtectedRoute("/manager/financials", "manager", <ManagerFinancialsPage />),
      createProtectedRoute("/manager/feedback", "manager", <ManagerFeedbackPage />),
      createProtectedRoute("/manager/suggestions", "manager", <ManagerSuggestionsPage />),
      createProtectedRoute("/manager/notes", "manager", <ManagerNotesPage />),
      createProtectedRoute("/manager/broadcast", "manager", <ManagerBroadcastPage />),
      createProtectedRoute("/manager/settings", "manager", <ManagerSettingsPage />),
      // Admin Routes
      createProtectedRoute("/admin/dashboard", "admin", <AdminDashboardPage />),
      createProtectedRoute("/admin/menu", "admin", <AdminMenuPage />),
    ],
  },
]);
export function App() {
  return (
    <I18nProvider>
      <ErrorBoundary fallback={(error) => <RouteErrorBoundary error={error as Error} />}>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </I18nProvider>
  );
}