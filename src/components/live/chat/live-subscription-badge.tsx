"use client";
// 구독 개월 수에 맞는 구독 배지 이미지를 채팅에 표시합니다.

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import {
  getLiveDefaultSubscriptionBadgeSrc,
  getLiveSubscriptionBadgePublicUrl,
  normalizeLiveSubscriptionBadgeMonth,
} from "@/utils/live/live-subscription-badge";
import Image from "next/image";
import { useState } from "react";

interface Props {
  creatorId: string;
  totalMonths?: number | null;
  size?: "sm" | "lg";
  withTooltip?: boolean;
  className?: string;
}

export function LiveSubscriptionBadge({
  creatorId,
  totalMonths,
  size = "sm",
  withTooltip = false,
  className,
}: Props) {
  const month = normalizeLiveSubscriptionBadgeMonth(totalMonths);
  const label = `${LIVE_LABEL.subscriberBadge} ${month}개월`;
  const storageSrc = getLiveSubscriptionBadgePublicUrl(creatorId, month);
  const fallbackSrc = getLiveDefaultSubscriptionBadgeSrc(month);
  const [failedStorageSrc, setFailedStorageSrc] = useState<string | null>(null);
  const imageSrc = failedStorageSrc === storageSrc ? fallbackSrc : storageSrc;

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
        src={imageSrc}
        alt=""
        aria-hidden
        className="size-full object-contain"
        width={size === "sm" ? 20 : 32}
        height={size === "sm" ? 20 : 32}
        onError={() => {
          if (imageSrc === storageSrc) {
            setFailedStorageSrc(storageSrc);
          }
        }}
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
