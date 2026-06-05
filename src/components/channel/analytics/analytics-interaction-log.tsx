"use client";
// 후원·팔로우 상호작용을 최신순 타임라인으로 렌더링합니다.

import { Gift, UserMinus, UserPlus } from "lucide-react";

import { ANALYTICS_LABEL, ANALYTICS_UNIT } from "@/constants/channel/analytics";
import type { AnalyticsLogEvent } from "@/types/channel/analytics";
import { formatKstTime } from "@/utils/common/date";

interface Props {
  events: AnalyticsLogEvent[];
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
    <ul className="flex max-h-56 flex-col gap-3 overflow-y-auto">
      {events.map((event) => (
        <li key={`${event.type}-${event.id}`} className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground w-10 shrink-0 font-mono text-xs">
            {formatKstTime(event.at)}
          </span>
          {event.type === "donation" ? (
            <span className="text-live flex min-w-0 items-center gap-1.5 font-medium">
              <Gift className="size-4 shrink-0" />
              {event.actorName && (
                <span className="text-foreground truncate font-semibold">{event.actorName}</span>
              )}
              <span className="shrink-0">
                {ANALYTICS_LABEL.logDonation} {(event.amount ?? 0).toLocaleString("ko-KR")}
                {ANALYTICS_UNIT.point}
              </span>
            </span>
          ) : event.type === "follow" ? (
            <span className="text-brand flex min-w-0 items-center gap-1.5 font-medium">
              <UserPlus className="size-4 shrink-0" />
              {event.actorName ? (
                <span className="truncate">
                  <span className="text-foreground font-semibold">{event.actorName}</span>
                  {ANALYTICS_LABEL.logFollowSuffix}
                </span>
              ) : (
                <span className="shrink-0">{ANALYTICS_LABEL.logFollow}</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 font-medium">
              <UserMinus className="size-4 shrink-0" />
              {event.actorName ? (
                <span className="truncate">
                  <span className="text-foreground font-semibold">{event.actorName}</span>
                  {ANALYTICS_LABEL.logUnfollowSuffix}
                </span>
              ) : (
                <span className="shrink-0">{ANALYTICS_LABEL.logUnfollow}</span>
              )}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
