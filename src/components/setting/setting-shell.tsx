// 설정 레이아웃 전체를 감싸는 클라이언트 쉘 — 모바일 offcanvas sidebar 처리
"use client";

import SettingSidebar from "@/components/setting/setting-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/common/use-mobile";
import type { CurrentProfileSnapshot } from "@/utils/profile/profile-server";
import { ReactNode, useEffect, useState } from "react";

interface Props {
  children: ReactNode;
  profile: CurrentProfileSnapshot | null;
}

export function SettingShell({ children, profile }: Props) {
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-app-content min-h-0 overflow-auto p-6 md:p-10">{children}</div>;
  }

  return (
    <SidebarProvider className="h-app-content min-h-0 overflow-hidden">
      <SettingSidebar isMobile={isMobile} profile={profile} />
      <SidebarInset className="min-w-0 overflow-hidden">
        {isMobile && (
          <div className="border-border flex shrink-0 items-center gap-3 border-b p-4">
            <SidebarTrigger className="cursor-pointer" />
            <span className="text-foreground text-sm font-semibold">설정</span>
          </div>
        )}
        <div className="h-full min-w-0 overflow-auto p-6 md:p-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
