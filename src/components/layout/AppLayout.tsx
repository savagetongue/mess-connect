import React from "react";
import { Toaster } from "sonner";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { LanguageToggle } from "@/components/LanguageToggle";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
        <header className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
          <SidebarTrigger
            aria-label="Toggle navigation menu"
            className="hover:scale-105 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2"
          />
          <div className="hover:scale-105 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 rounded-md">
            <LanguageToggle />
          </div>
        </header>
        <div className="flex flex-col min-h-screen pt-16">
          <motion.main
            role="main"
            aria-labelledby="main-content-title"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, scaleY: 0.98 },
              visible: { opacity: 1, scaleY: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
            }}
            className="flex-1"
          >
            <div
              className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12", contentClassName)}
            >
              {children}
            </div>
          </motion.main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}