"use client";
// 라이브 채팅과 구독 화면에서 사용하는 구독 개월별 배지 이미지를 렌더링합니다.

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
  version?: string | null;
  imageSourcesByMonth?: Record<number, string>;
  size?: "sm" | "lg";
  withTooltip?: boolean;
  className?: string;
}

export function LiveSubscriptionBadge({
  creatorId,
  totalMonths,
  customMonths = [],
  version,
  imageSourcesByMonth,
  size = "sm",
  withTooltip = false,
  className,
}: Props) {
  const month = resolveLiveSubscriptionBadgeMonth(totalMonths, customMonths);
  const label = `${LIVE_LABEL.subscriberBadge} ${month} 개월`;
  const storageSrc = getLiveSubscriptionBadgePublicUrl(creatorId, month, customMonths, version);
  const fallbackSrc = getLiveDefaultSubscriptionBadgeSrc(month);
  const candidateSrc = imageSourcesByMonth?.[month] ?? storageSrc;
  const isStorageSource = candidateSrc === storageSrc;
  const [failedStorageSrc, setFailedStorageSrc] = useState<string | null>(null);
  const imageSrc = failedStorageSrc === candidateSrc ? fallbackSrc : candidateSrc;

  const badge = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden align-bottom",
        size === "sm" ? "size-5 rounded-sm" : "size-8 rounded-md",
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
          if (isStorageSource) {
            setFailedStorageSrc(candidateSrc);
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
