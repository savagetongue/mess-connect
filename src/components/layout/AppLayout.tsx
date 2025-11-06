import React from "react";
import { Toaster } from "sonner";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { LanguageToggle } from "@/components/LanguageToggle";
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
      <Toaster />
      <AppSidebar userRole={user?.role} />
      <SidebarInset className={className}>
        <header className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between">
          <SidebarTrigger />
          <LanguageToggle />
        </header>
        <div className="flex flex-col min-h-screen pt-14">
          <main className="flex-1">
            {container ? (
              <div className={"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12" + (contentClassName ? ` ${contentClassName}` : "")}>{children}</div>
            ) : (
              children
            )}
          </main>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}