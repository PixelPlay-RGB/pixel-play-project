// 헤더의 "방송하기" 버튼입니다. 방송 시작은 운영 페이지에서만 가능하므로 /channel/live로 이동합니다.
// 비로그인 상태에서 눌러도 proxy가 /auth/login?next=/channel/live로 보호 처리합니다.

import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";
import Link from "next/link";

export default function BroadcastButton() {
  return (
    <Link
      href="/channel/live"
      aria-label="방송하기"
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 sm:px-4",
        "bg-live text-sm font-bold whitespace-nowrap text-white",
        "shadow-sm transition-all duration-200",
        "hover:shadow-live/35 hover:shadow-lg hover:brightness-105",
        "focus-visible:ring-live/40 focus-visible:ring-2 focus-visible:outline-none",
        "active:scale-[0.97]",
      )}
    >
      {/* 모바일: 아이콘만 */}
      <Radio className="size-4 sm:hidden" aria-hidden />

      {/* 데스크톱: 라이브 점 + 라벨 */}
      <span className="hidden items-center gap-1.5 sm:inline-flex">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
          <span className="relative inline-flex size-2 rounded-full bg-current" />
        </span>
        방송하기
      </span>
    </Link>
  );
}
