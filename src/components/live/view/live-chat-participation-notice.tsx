// 팔로우 필요 또는 팔로우 대기 중 채팅 참여 안내 카드를 렌더링합니다.

import { UserRoundPlus } from "lucide-react";
import { LIVE_LABEL } from "@/constants/live/live";
import type { LiveChatUnavailableReason } from "@/types/live/live";

interface Props {
  chatUnavailableReason: LiveChatUnavailableReason | null;
}

export function LiveChatParticipationNotice({ chatUnavailableReason }: Props) {
  if (chatUnavailableReason !== "follower_required" && chatUnavailableReason !== "follower_wait_required") {
    return null;
  }

  const isWaiting = chatUnavailableReason === "follower_wait_required";

  return (
    <div className="border-border bg-card border-t px-3 py-3">
      <div className="border-live/20 bg-live/5 flex items-start gap-2 rounded-lg border px-3 py-2.5">
        <UserRoundPlus className="text-live mt-0.5 size-4 shrink-0" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-foreground text-xs font-semibold">
            {isWaiting ? LIVE_LABEL.participationWaitTitle : LIVE_LABEL.participationFollowerTitle}
          </p>
          <p className="text-muted-foreground text-xs leading-snug">
            {isWaiting ? LIVE_LABEL.participationWaitDesc : LIVE_LABEL.participationFollowerDesc}
          </p>
        </div>
      </div>
    </div>
  );
}
