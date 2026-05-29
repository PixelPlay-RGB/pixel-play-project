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
        "border-border/70 grid gap-3 border-t pt-5 first:border-t-0 first:pt-0 lg:grid-cols-[10rem_minmax(0,1fr)] lg:items-center",
        isDimmed && "opacity-60",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-foreground text-sm font-bold">{label}</span>
        <span className="text-muted-foreground text-xs leading-5">{description}</span>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
