"use client";
// 라우터 이동 시 모바일 사이드바(offcanvas)를 자동으로 닫습니다.

import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function SidebarAutoClose() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  return null;
}
