"use client";
// 후원·팔로우 상호작용을 최신순 타임라인으로 렌더링합니다.

import { Gift, UserPlus } from "lucide-react";

import { ANALYTICS_LABEL, ANALYTICS_UNIT } from "@/constants/channel/analytics";
import type { AnalyticsLogEvent } from "@/types/channel/analytics";

interface Props {
  events: AnalyticsLogEvent[];
}

function formatTime(at: string) {
  return new Date(at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export function AnalyticsInteractionLog({ events }: Props) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {ANALYTICS_LABEL.interactionEmpty}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {events.map((event) => (
        <li key={`${event.type}-${event.id}`} className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground w-10 shrink-0 font-mono text-xs">
            {formatTime(event.at)}
          </span>
          {event.type === "donation" ? (
            <span className="text-live flex items-center gap-1.5 font-medium">
              <Gift className="size-4" />
              {ANALYTICS_LABEL.logDonation} {(event.amount ?? 0).toLocaleString("ko-KR")}
              {ANALYTICS_UNIT.point}
            </span>
          ) : (
            <span className="text-brand flex items-center gap-1.5 font-medium">
              <UserPlus className="size-4" />
              {ANALYTICS_LABEL.logFollow}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
