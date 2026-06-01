// 설정 레이아웃 전체를 감싸는 클라이언트 쉘 — 모바일 offcanvas sidebar 처리
"use client";

import SettingSidebar from "@/components/setting/setting-sidebar";
import { SidebarAutoClose } from "@/components/common/sidebar-auto-close";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/common/use-mobile";
import type { CurrentProfileSnapshot } from "@/types/profile/user";
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

  // children을 항상 동일한 위치에 두고 사이드바/모바일 헤더만 마운트 후 조건부로 렌더합니다.
  // (루트 트리를 교체하면 children 전체가 재마운트되어 쿼리 중복 실행·로컬 상태 초기화가 발생함)
  return (
    <SidebarProvider className="h-chat-content min-h-0 overflow-hidden">
      <SidebarAutoClose />
      {isMounted && <SettingSidebar isMobile={isMobile} profile={profile} />}
      <SidebarInset className="min-w-0 overflow-hidden">
        {isMounted && isMobile && (
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
