"use client";
// 크리에이터 팔로우/언팔로우와 공유 버튼을 담당하는 액션 영역입니다.

import { useState } from "react";
import { Share2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreatorFollowingButton from "@/components/following/creator-following-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LIVE_LABEL } from "@/constants/live/live";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppSuccess, toastAppError } from "@/utils/common/toast-message";
import { cn } from "@/lib/utils";

interface Props {
  creatorNickname: string;
  isFollowing: boolean;
  isSubscribed: boolean;
  isPending: boolean;
  isSubscribePending: boolean;
  onFollow: () => void;
  onSubscribe: () => void;
}

export function LiveCreatorActions({
  creatorNickname,
  isFollowing,
  isSubscribed,
  isPending,
  isSubscribePending,
  onFollow,
  onSubscribe,
}: Props) {
  const [isUnfollowDialogOpen, setIsUnfollowDialogOpen] = useState(false);
  const subscribeLabel = isSubscribed ? LIVE_LABEL.subscribed : LIVE_LABEL.subscribe;

  function handleFollowClick() {
    if (isFollowing) {
      setIsUnfollowDialogOpen(true);
    } else {
      onFollow();
    }
  }

  function handleConfirmUnfollow() {
    setIsUnfollowDialogOpen(false);
    onFollow();
  }

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
    <>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={isSubscribed ? "outline" : "default"}
          className={cn(
            "h-8 shrink-0 rounded-full px-3 text-xs font-black transition-all active:scale-95",
            isSubscribed
              ? "border-live/30 bg-live/10 text-live hover:border-live/40 hover:bg-live/15"
              : "bg-live hover:bg-live/85 shadow-live/25 text-live-foreground shadow-sm hover:shadow-md",
          )}
          disabled={isSubscribed || isSubscribePending}
          aria-label={`${creatorNickname} ${subscribeLabel}`}
          onClick={onSubscribe}
        >
          <Star className={cn("size-3.5", isSubscribed && "fill-current")} />
          {subscribeLabel}
        </Button>

        <CreatorFollowingButton
          creatorNickname={creatorNickname}
          isFollowing={isFollowing}
          isOwnChannel={false}
          isPending={isPending}
          onClick={handleFollowClick}
        />

        <Button
          size="sm"
          variant="outline"
          aria-label={LIVE_LABEL.share}
          onClick={handleShare}
          // 옆 팔로우 버튼(rounded-full)과 라운드 톤을 맞춘다.
          className="h-8 gap-1.5 rounded-full text-xs font-semibold"
        >
          <Share2 className="size-4" />
        </Button>
      </div>

      <AlertDialog open={isUnfollowDialogOpen} onOpenChange={setIsUnfollowDialogOpen}>
        <AlertDialogContent size="sm" showCloseButton={false}>
          <AlertDialogHeader>
            <AlertDialogTitle>{LIVE_LABEL.unfollowConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{LIVE_LABEL.unfollowConfirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{LIVE_LABEL.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmUnfollow}>
              {LIVE_LABEL.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
