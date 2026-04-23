import SettingSidebar from "@/components/setting/setting-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex w-full">
        <SettingSidebar />
        <SidebarInset className={"flex flex-col"}>
          <main className={"flex-1 p-6 md:p-10"}>{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
