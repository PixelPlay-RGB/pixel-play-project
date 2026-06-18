// 실시간 통계 KPI 카드 한 개(아이콘·라벨·값·보조 텍스트·추세)를 렌더링합니다.

import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  trend?: number | null;
}

export function AnalyticsStatCard({ icon: Icon, label, value, hint, trend }: Props) {
  return (
    <Card className="gap-3 p-5 shadow-sm">
      <div className="text-muted-foreground flex items-center gap-2">
        <Icon className="text-live size-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-foreground text-3xl font-bold tracking-tight">{value}</span>
        {typeof trend === "number" && <TrendBadge trend={trend} />}
      </div>
      {/* hint가 없어도 한 줄 높이를 예약해 카드 높이를 통일한다. */}
      <p className="text-muted-foreground min-h-4 text-xs">{hint}</p>
    </Card>
  );
}

function TrendBadge({ trend }: { trend: number }) {
  const isUp = trend >= 0;
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs font-bold",
        isUp ? "text-success" : "text-error",
      )}
    >
      <Icon className="size-3.5" />
      {isUp ? "+" : ""}
      {trend}%
    </span>
  );
}
