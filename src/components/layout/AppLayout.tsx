import React from "react";
import { Toaster } from "sonner";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { LanguageToggle } from "@/components/LanguageToggle";
import { cn } from "@/lib/utils";
type AppLayoutProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};
export function AppLayout({ children, className, contentClassName }: AppLayoutProps): JSX.Element {
  const user = useAuth(s => s.user);
  return (
    <SidebarProvider defaultOpen={false}>
      <Toaster richColors />
      <AppSidebar userRole={user?.role} />
      <SidebarInset className={className}>
        <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <SidebarTrigger className="hover:scale-105 transition-all duration-200" />
          <div className="hover:scale-105 transition-all duration-200">
            <LanguageToggle />
          </div>
        </header>
        <div className="flex flex-col min-h-screen pt-14">
          <main className="flex-1">
            <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12", contentClassName)}>
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}