// 채팅 설정 화면의 현재 상태 요약 카드를 렌더링합니다.

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: string;
  description: string;
  icon?: ReactNode;
  tone?: "brand" | "live" | "default";
}

export function ChatSummaryCard({ label, value, description, icon, tone = "default" }: Props) {
  return (
    <article
      className={cn(
        "bg-card text-card-foreground flex min-h-30 flex-col justify-between gap-4 rounded-xl border p-5 shadow-sm",
        tone === "brand" && "border-brand/30 bg-brand/5",
        tone === "live" && "border-live/30 bg-live/5",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs font-bold">{label}</span>
        {icon ? (
          <span
            className={cn(
              "bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full",
              tone === "brand" && "bg-brand/10 text-brand",
              tone === "live" && "bg-live/10 text-live",
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div className="space-y-1">
        <strong className="text-foreground block text-xl leading-7 font-extrabold">{value}</strong>
        <p className="text-muted-foreground text-xs leading-5 text-pretty">{description}</p>
      </div>
    </article>
  );
}
