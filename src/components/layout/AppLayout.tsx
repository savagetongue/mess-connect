import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};
export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
  const user = useAuth(s => s.user);
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar userRole={user?.role} />
      <SidebarInset className={className}>
        <div className="absolute left-2 top-2 z-20">
          <SidebarTrigger />
        </div>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">
            {container ? (
              <div className={"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12" + (contentClassName ? ` ${contentClassName}` : "")}>{children}</div>
            ) : (
              children
            )}
          </main>
          <footer className="py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
            <p>© 2024 Mess Connect. All rights reserved.</p>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}