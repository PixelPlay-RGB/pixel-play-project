// 랜딩 프리뷰 채팅 빠른 액션을 렌더링합니다.
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function LiveChatQuickAction({ tone, children }: { tone?: "live"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "border-border bg-background/65 rounded-lg border px-2.5 py-1.5",
        "text-muted-foreground text-[0.6875rem] font-black",
        tone === "live" && "border-live/35 bg-live/15 text-live",
      )}
    >
      {children}
    </span>
  );
}
