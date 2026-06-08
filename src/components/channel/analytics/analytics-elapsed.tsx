"use client";
// 방송 경과 시간을 헤더에 1초 간격으로 표시합니다.

import { Clock } from "lucide-react";

import { ANALYTICS_LABEL } from "@/constants/channel/analytics";
import { useAnalyticsElapsed } from "@/hooks/channel/use-analytics-elapsed";

interface Props {
  startedAt: string;
}

export function AnalyticsElapsed({ startedAt }: Props) {
  const elapsed = useAnalyticsElapsed(startedAt);

  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
      <Clock className="text-live size-4" aria-hidden />
      {elapsed ? `${ANALYTICS_LABEL.elapsedPrefix} ${elapsed}` : ANALYTICS_LABEL.elapsedPending}
    </span>
  );
}
