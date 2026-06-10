"use client";
// 채팅 닉네임 앞 역할 마크(방송 진행자·후원자) — 시청 채팅과 OBS 오버레이가 같은 형태를 공유합니다.

import { Crown, Heart, ShieldCheck, Star, type LucideIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";

// manager·subscriber는 추후 기능(매니저 지정·구독) 대비 — sender_role enum과 함께 미리 매핑해 둔다.
export type LiveChatRole = "creator" | "manager" | "donor" | "subscriber";

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
  manager: LIVE_LABEL.managerBadge,
  donor: LIVE_LABEL.donorBadge,
  subscriber: LIVE_LABEL.subscriberBadge,
};

const ROLE_ICON: Record<LiveChatRole, LucideIcon> = {
  creator: Crown,
  manager: ShieldCheck,
  donor: Heart,
  subscriber: Star,
};

export function LiveChatRoleBadge({ role, size = "sm", withTooltip = false, className }: Props) {
  const Icon = ROLE_ICON[role];
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
        className={cn(
          size === "sm" ? "size-3.5" : "size-4.5",
          (role === "donor" || role === "subscriber") && "fill-current",
        )}
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
