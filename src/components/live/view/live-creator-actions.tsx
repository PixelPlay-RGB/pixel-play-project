"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LIVE_CHANNEL_MENU_LABEL, LIVE_LABEL } from "@/constants/live/live";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppSuccess, toastAppError } from "@/utils/common/toast-message";
import { cn } from "@/lib/utils";

interface Props {
  isFollowing: boolean;
  isPending: boolean;
  onFollow: () => void;
}

export function LiveCreatorActions({ isFollowing, isPending, onFollow }: Props) {
  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      toastAppSuccess(APP_MESSAGE_CODE.success.live.urlCopied);
    } catch {
      toastAppError(APP_MESSAGE_CODE.error.common.unknown);
    }
  }

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

      <Button
        size="sm"
        variant="outline"
        onClick={handleShare}
        className="gap-1.5 text-xs font-semibold"
      >
        <Share2 className="size-4" />
      </Button>
    </div>
  );
}
