"use client";
// 실시간 구독 연결 상태를 점+라벨로 표시합니다.

import { ANALYTICS_LABEL } from "@/constants/channel/analytics";
import type { AnalyticsConnectionState } from "@/types/channel/analytics";
import { cn } from "@/lib/utils";

interface Props {
  state: AnalyticsConnectionState;
}

const STATE_STYLE: Record<AnalyticsConnectionState, { label: string; dot: string; text: string }> =
  {
    connected: {
      label: ANALYTICS_LABEL.connectionConnected,
      dot: "bg-success",
      text: "text-success",
    },
    connecting: {
      label: ANALYTICS_LABEL.connectionConnecting,
      dot: "bg-muted-foreground",
      text: "text-muted-foreground",
    },
    reconnecting: {
      label: ANALYTICS_LABEL.connectionReconnecting,
      dot: "bg-error animate-pulse",
      text: "text-error",
    },
  };

export function AnalyticsConnectionStatus({ state }: Props) {
  const style = STATE_STYLE[state];

  return (
    <span className={cn("flex items-center gap-1.5 text-xs font-medium", style.text)}>
      <span className={cn("size-2 rounded-full", style.dot)} aria-hidden />
      {style.label}
    </span>
  );
}
