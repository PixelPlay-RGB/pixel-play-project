"use client";
// 현재 route 기준으로 공용 Footer 노출 여부를 제어합니다.

import Footer from "@/components/common/footer";
import { usePathname } from "next/navigation";

export default function RouteFooter() {
  const pathname = usePathname();
  const isChatRoomRoute = pathname.startsWith("/chat/room");

  if (isChatRoomRoute) {
    return null;
  }

  return <Footer />;
}
