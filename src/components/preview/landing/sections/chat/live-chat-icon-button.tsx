// 랜딩 프리뷰 채팅 입력 보조 아이콘 버튼을 렌더링합니다.
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function LiveChatIconButton({ children }: { children: ReactNode }) {
  return (
    <span
      className={cn(
        "border-border bg-background/65 flex size-8 shrink-0 items-center justify-center",
        "rounded-lg text-xs font-black",
      )}
    >
      {children}
    </span>
  );
}
