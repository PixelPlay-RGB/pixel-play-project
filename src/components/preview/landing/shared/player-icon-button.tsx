// 랜딩 프리뷰 플레이어 컨트롤 아이콘 버튼을 렌더링합니다.
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PlayerIconButton({ children }: { children: ReactNode }) {
  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-lg",
        "bg-black/40 text-sm font-bold backdrop-blur",
      )}
    >
      {children}
    </span>
  );
}
