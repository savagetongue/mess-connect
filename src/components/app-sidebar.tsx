import React from "react";
import { Home, User, Settings, LogOut, Utensils, ShieldCheck, FileText, Lightbulb, DollarSign, Notebook, Users, Send } from "lucide-react";
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
interface AppSidebarProps {
  userRole?: UserRole;
}
export function AppSidebar({ userRole }: AppSidebarProps): JSX.Element {
  const logout = useAuth(s => s.logout);
  const getNavItems = () => {
    switch (userRole) {
      case 'student':
        return [
          { href: "/student/dashboard", icon: <Home />, label: "Home" },
          { href: "/student/menu", icon: <Utensils />, label: "Weekly Menu" },
          { href: "/student/dues", icon: <DollarSign />, label: "My Dues" },
          { href: "/student/complaints", icon: <FileText />, label: "Complaints" },
          { href: "/student/suggestions", icon: <Lightbulb />, label: "Suggestions" },
        ];
      case 'manager':
        return [
            { href: "/manager/dashboard", icon: <Home />, label: "Dashboard" },
            { href: "/manager/students", icon: <Users />, label: "Student Management" },
            { href: "/manager/menu", icon: <Utensils />, label: "Update Menu" },
            { href: "/manager/financials", icon: <DollarSign />, label: "Financials" },
            { href: "/manager/feedback", icon: <FileText />, label: "Complaints" },
            { href: "/manager/suggestions", icon: <Lightbulb />, label: "Suggestions" },
            { href: "/manager/notes", icon: <Notebook />, label: "Notes" },
            { href: "/manager/broadcast", icon: <Send />, label: "Broadcast" },
        ];
      case 'admin':
        return [
          { href: "/admin/dashboard", icon: <ShieldCheck />, label: "Oversight" },
          { href: "/admin/dashboard", icon: <FileText />, label: "All Complaints" },
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
          <span className="text-lg font-semibold">Mess Connect</span>
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
                      <a href="/manager/settings"><Settings /> <span>Settings</span></a>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
                <SidebarMenuButton onClick={logout}>
                    <LogOut /> <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}