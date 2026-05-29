// 채팅 설정 카드 안에서 반복되는 라벨과 입력 행을 렌더링합니다.

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  label: string;
  description: string;
  children: ReactNode;
  isDimmed?: boolean;
}

export function ChatFieldRow({ label, description, children, isDimmed }: Props) {
  return (
    <div
      className={cn(
        "border-border/70 flex flex-col gap-3 border-t pt-5 first:border-t-0 first:pt-0 md:flex-row md:items-center",
        isDimmed && "opacity-60",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1 md:w-44 md:shrink-0">
        <span className="text-foreground text-sm font-bold">{label}</span>
        <span className="text-muted-foreground text-xs leading-5">{description}</span>
      </div>
      <div className="min-w-0 flex-1 md:flex md:justify-end">{children}</div>
    </div>
  );
}
