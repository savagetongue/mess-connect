import React, { Suspense, lazy, useEffect } from "react";
import { createBrowserRouter, RouterProvider, useLocation, Outlet } from "react-router-dom";
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import I18nProvider from '@/lib/i18n.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from "sonner";
import { Utensils } from "lucide-react";
import { useTranslation } from "./hooks/useTranslation";
// Page Imports
import { HomePage } from '@/pages/HomePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { PendingApprovalPage } from '@/pages/PendingApprovalPage';
import { GuestPaymentPage } from '@/pages/GuestPaymentPage';
import { VerificationPage } from '@/pages/VerificationPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
// Student Pages
const StudentDashboardPage = lazy(() => import('@/pages/student/StudentDashboardPage').then(module => ({ default: module.StudentDashboardPage })));
const WeeklyMenuPage = lazy(() => import('@/pages/student/WeeklyMenuPage').then(module => ({ default: module.WeeklyMenuPage })));
const MyDuesPage = lazy(() => import('@/pages/student/MyDuesPage').then(module => ({ default: module.MyDuesPage })));
const ComplaintsPage = lazy(() => import('@/pages/student/ComplaintsPage').then(module => ({ default: module.ComplaintsPage })));
const SuggestionsPage = lazy(() => import('@/pages/student/SuggestionsPage').then(module => ({ default: module.SuggestionsPage })));
const NotificationsPage = lazy(() => import('@/pages/student/NotificationsPage').then(module => ({ default: module.NotificationsPage })));
const MessRulesPage = lazy(() => import('@/pages/student/MessRulesPage').then(module => ({ default: module.MessRulesPage })));
// Manager Pages
const ManagerDashboardPage = lazy(() => import('@/pages/manager/ManagerDashboardPage').then(module => ({ default: module.ManagerDashboardPage })));
const StudentManagementPage = lazy(() => import('@/pages/manager/StudentManagementPage').then(module => ({ default: module.StudentManagementPage })));
const UpdateMenuPage = lazy(() => import('@/pages/manager/UpdateMenuPage').then(module => ({ default: module.UpdateMenuPage })));
const ManagerFinancialsPage = lazy(() => import('@/pages/manager/ManagerFinancialsPage').then(module => ({ default: module.ManagerFinancialsPage })));
const ManagerFeedbackPage = lazy(() => import('@/pages/manager/ManagerFeedbackPage').then(module => ({ default: module.ManagerFeedbackPage })));
const ManagerSuggestionsPage = lazy(() => import('@/pages/manager/ManagerSuggestionsPage').then(module => ({ default: module.ManagerSuggestionsPage })));
const ManagerNotesPage = lazy(() => import('@/pages/manager/ManagerNotesPage').then(module => ({ default: module.ManagerNotesPage })));
const ManagerBroadcastPage = lazy(() => import('@/pages/manager/ManagerBroadcastPage').then(module => ({ default: module.ManagerBroadcastPage })));
const ManagerSettingsPage = lazy(() => import('@/pages/manager/ManagerSettingsPage').then(module => ({ default: module.ManagerSettingsPage })));
// Admin Pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })));
const AdminMenuPage = lazy(() => import('@/pages/admin/AdminMenuPage').then(module => ({ default: module.AdminMenuPage })));
// Layout & Auth
import { ProtectedRoute } from '@/components/ProtectedRoute';
const PageLoader = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Utensils className="h-12 w-12 text-orange-500" />
      </motion.div>
      <p className="ml-4 text-muted-foreground">{t('loading')}</p>
    </div>
  );
};
const AnimatedOutlet = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.key}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};
const createProtectedRoute = (path: string, role: 'student' | 'manager' | 'admin', element: JSX.Element) => ({
  path,
  element: <ProtectedRoute role={role}>{element}</ProtectedRoute>,
  errorElement: <RouteErrorBoundary />,
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
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global Error:', event.error);
    };
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  return (
    <I18nProvider>
      <ErrorBoundary fallback={() => <div>Something went wrong.</div>}>
        <RouterProvider router={router} />
        <Toaster richColors />
      </ErrorBoundary>
    </I18nProvider>
  );
}