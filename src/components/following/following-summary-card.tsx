// 팔로잉 현황 요약을 사이드 영역의 설정 카드로 보여줍니다.

import { CalendarClock, Radio, Users, type LucideIcon } from "lucide-react";

import { SettingsCard } from "@/components/common/settings-card";
import { cn } from "@/lib/utils";

interface FollowingSummaryCardProps {
  totalCount: number;
  liveCount: number;
  recentBroadcastCount: number;
}

interface SummaryRow {
  label: string;
  value: number;
  icon: LucideIcon;
  isLiveAccent?: boolean;
}

export default function FollowingSummaryCard({
  totalCount,
  liveCount,
  recentBroadcastCount,
}: FollowingSummaryCardProps) {
  const rows: SummaryRow[] = [
    { label: "전체 팔로우", value: totalCount, icon: Users },
    { label: "최근 7일 방송", value: recentBroadcastCount, icon: CalendarClock },
    { label: "지금 라이브 중", value: liveCount, icon: Radio, isLiveAccent: true },
  ];

  return (
    <SettingsCard title="팔로잉 현황" description="팔로우한 채널의 방송 상태를 한눈에 확인해요.">
      <dl className="flex flex-col gap-3">
        {rows.map((row) => {
          const Icon = row.icon;
          const isLiveOn = row.isLiveAccent && row.value > 0;

          return (
            <div key={row.label} className="flex items-center gap-3">
              <dt className="text-muted-foreground flex flex-1 items-center gap-3 text-sm font-medium">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    row.isLiveAccent ? "bg-live/10 text-live" : "bg-brand/10 text-brand",
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <span className="flex-1">{row.label}</span>
              </dt>
              <dd
                className={cn(
                  "text-foreground text-base font-black tabular-nums",
                  isLiveOn && "text-live",
                )}
              >
                {row.value}
                <span className="text-muted-foreground ml-0.5 text-xs font-semibold">명</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </SettingsCard>
  );
}
