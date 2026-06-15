"use client";
// 구독 개월 수에 맞는 구독 배지 이미지를 채팅에 표시합니다.

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Props {
  totalMonths?: number | null;
  size?: "sm" | "lg";
  withTooltip?: boolean;
  className?: string;
}

const MAX_BADGE_MONTH = 12;

function normalizeBadgeMonth(totalMonths?: number | null) {
  if (!Number.isFinite(totalMonths) || !totalMonths) return 1;

  return Math.min(Math.max(Math.floor(totalMonths), 1), MAX_BADGE_MONTH);
}

export function LiveSubscriptionBadge({
  totalMonths,
  size = "sm",
  withTooltip = false,
  className,
}: Props) {
  const month = normalizeBadgeMonth(totalMonths);
  const label = `${LIVE_LABEL.subscriberBadge} ${month}개월`;
  const badge = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full align-bottom",
        size === "sm" ? "size-5" : "mt-0.5 size-8",
        className,
      )}
      aria-label={withTooltip ? undefined : label}
      role={withTooltip ? undefined : "img"}
    >
      <Image
        src={`/subscription-badges/${month}.png`}
        alt=""
        aria-hidden
        className="size-full object-contain"
        width={size === "sm" ? 20 : 32}
        height={size === "sm" ? 20 : 32}
      />
    </span>
  );

  if (!withTooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={badge} aria-label={label} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
