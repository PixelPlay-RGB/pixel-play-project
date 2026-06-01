// 팔로잉 현황 통계(전체/최근 방송/라이브 중)를 요약 카드로 보여줍니다.

import { cn } from "@/lib/utils";

interface FollowingStatsProps {
  totalCount: number;
  liveCount: number;
  recentBroadcastCount: number;
}

interface StatItem {
  label: string;
  value: number;
  isLiveAccent?: boolean;
}

export default function FollowingStats({
  totalCount,
  liveCount,
  recentBroadcastCount,
}: FollowingStatsProps) {
  const stats: StatItem[] = [
    { label: "전체 팔로우", value: totalCount },
    { label: "최근 7일 방송", value: recentBroadcastCount },
    { label: "라이브 중", value: liveCount, isLiveAccent: true },
  ];

  return (
    <dl className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "bg-card ring-foreground/10 rounded-xl px-3 py-3 ring-1 sm:px-4",
            stat.isLiveAccent && stat.value > 0 && "ring-live/25 bg-live/5",
          )}
        >
          <dt className="text-muted-foreground truncate text-xs font-medium">{stat.label}</dt>
          <dd className="mt-1 flex items-baseline gap-0.5">
            <span
              className={cn(
                "text-foreground text-xl font-black tabular-nums sm:text-2xl",
                stat.isLiveAccent && stat.value > 0 && "text-live",
              )}
            >
              {stat.value}
            </span>
            <span className="text-muted-foreground text-xs font-semibold">명</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
