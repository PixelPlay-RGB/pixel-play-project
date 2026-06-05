"use client";
// 이번 방송 최다 후원자를 상호작용 로그 상단에 강조 표시합니다.

import { Crown } from "lucide-react";

import { ANALYTICS_LABEL, ANALYTICS_UNIT } from "@/constants/channel/analytics";
import type { TopSupporter } from "@/types/channel/analytics";

interface Props {
  supporter: TopSupporter | null;
}

export function AnalyticsTopSupporter({ supporter }: Props) {
  return (
    <div className="border-border bg-muted/40 flex items-center gap-3 rounded-xl border p-3">
      <span className="bg-live/10 text-live flex size-9 shrink-0 items-center justify-center rounded-full">
        <Crown className="size-4.5" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-muted-foreground text-xs font-medium">
          {ANALYTICS_LABEL.topSupporterTitle}
        </span>
        {supporter ? (
          <span className="text-foreground truncate text-sm font-bold">
            {supporter.name}
            <span className="text-muted-foreground ml-1.5 font-medium">
              {supporter.amount.toLocaleString("ko-KR")}
              {ANALYTICS_UNIT.point} {ANALYTICS_LABEL.topSupporterAmountSuffix}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">{ANALYTICS_LABEL.topSupporterEmpty}</span>
        )}
      </div>
    </div>
  );
}
