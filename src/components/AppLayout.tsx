import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { TopNavigation } from "@/components/TopNavigation";
import { FloatingSidebarToggle } from "@/components/FloatingSidebarToggle";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <TopNavigation />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
        <FloatingSidebarToggle />
      </div>
    </SidebarProvider>
  );
}