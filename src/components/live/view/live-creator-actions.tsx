"use client";
// 팔로우, 공유, 더보기 액션 버튼 행을 렌더링합니다.

import { Button } from "@/components/ui/button";
import { LiveChannelMenu } from "@/components/live/view/live-channel-menu";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";

interface Props {
  isFollowing: boolean;
  isPending: boolean;
  onFollow: () => void;
  isLoggedIn: boolean;
}

export function LiveCreatorActions({ isFollowing, isPending, onFollow }: Props) {

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        size="sm"
        disabled={isPending}
        onClick={onFollow}
        className={cn(
          "min-w-20 text-xs font-semibold",
          isFollowing
            ? "bg-muted text-foreground hover:bg-muted/80"
            : "bg-brand hover:bg-brand/90 text-brand-foreground",
        )}
      >
        {isFollowing ? LIVE_LABEL.following : LIVE_LABEL.follow}
      </Button>

      <LiveChannelMenu />
    </div>
  );
}
