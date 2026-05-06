import SettingSidebar from "@/components/setting/setting-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="h-app-content min-h-0 overflow-hidden">
      <SettingSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <div className="h-full min-w-0 overflow-auto p-6 md:p-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
