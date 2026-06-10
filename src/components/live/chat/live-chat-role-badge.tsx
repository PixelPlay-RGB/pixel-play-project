"use client";
// 채팅 닉네임 앞 역할 마크(방송 진행자·후원자) — 시청 채팅과 OBS 오버레이가 같은 형태를 공유합니다.

import { Crown, Heart } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";

export type LiveChatRole = "creator" | "donor";

interface Props {
  role: LiveChatRole;
  // sm=시청 채팅 줄 크기, lg=OBS 오버레이(3xl 텍스트) 크기.
  size?: "sm" | "lg";
  // 시청 채팅에서만 켠다. OBS 오버레이는 마우스 상호작용이 없어 끈다.
  withTooltip?: boolean;
  className?: string;
}

const ROLE_LABEL: Record<LiveChatRole, string> = {
  creator: LIVE_LABEL.hostBadge,
  donor: LIVE_LABEL.donorBadge,
};

export function LiveChatRoleBadge({ role, size = "sm", withTooltip = false, className }: Props) {
  const Icon = role === "creator" ? Crown : Heart;
  const label = ROLE_LABEL[role];

  const badge = (
    <span
      className={cn(
        "from-brand to-live inline-flex shrink-0 items-center justify-center bg-linear-to-br text-white shadow-sm",
        size === "sm" ? "size-5 rounded-sm" : "mt-0.5 size-8 rounded-md",
        className,
      )}
      aria-label={withTooltip ? undefined : label}
      role={withTooltip ? undefined : "img"}
    >
      <Icon
        className={cn(size === "sm" ? "size-3.5" : "size-4.5", role === "donor" && "fill-current")}
        aria-hidden
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
