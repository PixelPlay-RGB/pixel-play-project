"use client";
// 크리에이터 팔로우/언팔로우와 공유 버튼을 담당하는 액션 영역입니다.

import { useState } from "react";
import { Check, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  isFollowing: boolean;
  isPending: boolean;
  onFollow: () => void;
}

export function LiveCreatorActions({ isFollowing, isPending, onFollow }: Props) {
  const [isUnfollowDialogOpen, setIsUnfollowDialogOpen] = useState(false);

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

  function getFollowLabel() {
    if (!isFollowing) return LIVE_LABEL.follow;
    return LIVE_LABEL.following;
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={handleFollowClick}
          className={cn(
            "min-w-20 gap-1.5 rounded-full text-xs font-semibold transition-colors",
            isFollowing
              ? "bg-muted text-foreground hover:bg-muted/80"
              : "bg-brand text-brand-foreground hover:bg-brand/90",
          )}
        >
          {isFollowing ? <Check className="size-3.5" /> : <UserPlus className="size-3.5" />}
          {getFollowLabel()}
        </Button>

        <Button
          size="sm"
          variant="outline"
          aria-label={LIVE_LABEL.share}
          onClick={handleShare}
          className="gap-1.5 text-xs font-semibold"
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
