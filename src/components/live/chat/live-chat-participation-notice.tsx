"use client";
// 팔로우 직후 대기 안내 — 채팅 패널과 팝아웃에서 공유합니다.

import { UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LIVE_LABEL } from "@/constants/live/live";
import type { LiveChatUnavailableReason } from "@/types/live/live";

interface Props {
  chatUnavailableReason: LiveChatUnavailableReason | null;
  actionLabel?: string;
  onAction?: () => void;
}

export function LiveChatParticipationNotice({
  chatUnavailableReason,
  actionLabel,
  onAction,
}: Props) {
  // follower_required는 입력바의 팔로우 popover가 안내하므로, 이 카드는 팔로우 직후
  // 대기 상태(follower_wait_required)만 책임진다. 나머지 사유는 렌더하지 않는다.
  // (어떤 사유에 카드를 띄울지 결정은 여기 한 곳에 두고, 호출부는 사유만 넘긴다.)
  if (chatUnavailableReason !== "follower_wait_required") {
    return null;
  }

  return (
    <div className="border-border bg-card border-t px-3 py-3">
      <div className="border-live/20 bg-live/5 flex items-start gap-2 rounded-lg border px-3 py-2.5">
        <UserRoundPlus aria-hidden className="text-live mt-0.5 size-4 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-foreground text-xs font-semibold">
            {LIVE_LABEL.participationWaitTitle}
          </p>
          <p className="text-muted-foreground text-xs leading-snug">
            {LIVE_LABEL.participationWaitDesc}
          </p>
        </div>
        {actionLabel && onAction ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 text-xs"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
