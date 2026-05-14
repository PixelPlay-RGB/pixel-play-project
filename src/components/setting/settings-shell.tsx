// 설정 레이아웃 전체를 감싸는 클라이언트 쉘 — 모바일 offcanvas sidebar 처리
"use client";

import SettingSidebar from "@/components/setting/setting-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReactNode } from "react";

export function SettingsShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider className="h-app-content min-h-0 overflow-hidden">
      <SettingSidebar isMobile={isMobile} />
      <SidebarInset className="min-w-0 overflow-hidden">
        {isMobile && (
          <div className="flex shrink-0 items-center gap-3 border-b border-border p-4">
            <SidebarTrigger className="cursor-pointer" />
            <span className="text-foreground text-sm font-semibold">설정</span>
          </div>
        )}
        <div className="h-full min-w-0 overflow-auto p-6 md:p-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
