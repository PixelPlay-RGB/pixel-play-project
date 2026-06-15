"use client";
// 구독 개월 수에 맞는 구독 배지 이미지를 채팅에 표시합니다.

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import {
  getLiveDefaultSubscriptionBadgeSrc,
  getLiveSubscriptionBadgePublicUrl,
  resolveLiveSubscriptionBadgeMonth,
} from "@/utils/live/live-subscription-badge";
import Image from "next/image";
import { useState } from "react";

interface Props {
  creatorId: string;
  totalMonths?: number | null;
  customMonths?: number[];
  size?: "sm" | "lg";
  withTooltip?: boolean;
  className?: string;
}

export function LiveSubscriptionBadge({
  creatorId,
  totalMonths,
  customMonths = [],
  size = "sm",
  withTooltip = false,
  className,
}: Props) {
  const month = resolveLiveSubscriptionBadgeMonth(totalMonths, customMonths);
  const label = `${LIVE_LABEL.subscriberBadge} ${month}개월`;
  const storageSrc = getLiveSubscriptionBadgePublicUrl(creatorId, month, customMonths);
  const fallbackSrc = getLiveDefaultSubscriptionBadgeSrc(month);
  const [failedStorageSrc, setFailedStorageSrc] = useState<string | null>(null);
  const imageSrc = failedStorageSrc === storageSrc ? fallbackSrc : storageSrc;

  const badge = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden align-bottom",
        size === "sm" ? "size-5 rounded-sm" : "mt-0.5 size-8 rounded-md",
        className,
      )}
      aria-label={withTooltip ? undefined : label}
      role={withTooltip ? undefined : "img"}
    >
      <Image
        src={imageSrc}
        alt=""
        aria-hidden
        className="size-full object-cover"
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
