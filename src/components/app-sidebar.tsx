import React from "react";
import { Home, Settings, LogOut, Utensils, ShieldCheck, FileText, Lightbulb, DollarSign, Notebook, Users, Send, Bell, BookOpen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
interface AppSidebarProps {
  userRole?: UserRole;
}
export function AppSidebar({ userRole }: AppSidebarProps): JSX.Element {
  const logout = useAuth(s => s.logout);
  const { t } = useTranslation();
  const getNavItems = () => {
    switch (userRole) {
      case 'student':
        return [
          { href: "/student/dashboard", icon: <Home />, label: t('sidebar_home') },
          { href: "/student/menu", icon: <Utensils />, label: t('sidebar_weeklyMenu') },
          { href: "/student/dues", icon: <DollarSign />, label: t('sidebar_myDues') },
          { href: "/student/complaints", icon: <FileText />, label: t('sidebar_complaints') },
          { href: "/student/suggestions", icon: <Lightbulb />, label: t('sidebar_suggestions') },
          { href: "/student/notifications", icon: <Bell />, label: t('sidebar_notifications') },
          { href: "/student/rules", icon: <BookOpen />, label: t('sidebar_messRules') },
        ];
      case 'manager':
        return [
            { href: "/manager/dashboard", icon: <Home />, label: t('sidebar_dashboard') },
            { href: "/manager/students", icon: <Users />, label: t('sidebar_studentManagement') },
            { href: "/manager/menu", icon: <Utensils />, label: t('sidebar_updateMenu') },
            { href: "/manager/financials", icon: <DollarSign />, label: t('sidebar_financials') },
            { href: "/manager/feedback", icon: <FileText />, label: t('sidebar_manager_complaints') },
            { href: "/manager/suggestions", icon: <Lightbulb />, label: t('sidebar_manager_suggestions') },
            { href: "/manager/notes", icon: <Notebook />, label: t('sidebar_notes') },
            { href: "/manager/broadcast", icon: <Send />, label: t('sidebar_broadcast') },
        ];
      case 'admin':
        return [
          { href: "/admin/dashboard", icon: <ShieldCheck />, label: t('sidebar_admin_oversight') },
          { href: "/admin/menu", icon: <Utensils />, label: t('sidebar_admin_viewMenu') },
        ];
      default:
        return [];
    }
  };
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="h-8 w-8 rounded-md bg-orange-500 flex items-center justify-center text-white">
            <Utensils size={20} />
          </div>
          <span className="text-lg font-semibold">{t('appName')}</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-grow">
        <SidebarGroup>
          <SidebarMenu>
            {getNavItems().map((item, index) => (
              <SidebarMenuItem key={`${item.href}-${index}`}>
                <SidebarMenuButton asChild>
                  <a href={item.href}>{item.icon} <span>{item.label}</span></a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
            {userRole === 'manager' && (
              <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                      <a href="/manager/settings"><Settings /> <span>{t('sidebar_settings')}</span></a>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
                <SidebarMenuButton onClick={logout}>
                    <LogOut /> <span>{t('sidebar_logout')}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}