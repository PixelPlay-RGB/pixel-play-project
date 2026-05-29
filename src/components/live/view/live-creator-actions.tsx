"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
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
  const [isHovering, setIsHovering] = useState(false);
  const [isUnfollowDialogOpen, setIsUnfollowDialogOpen] = useState(false);

  function handleFollowClick() {
    setIsHovering(false);
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
    if (isHovering) return LIVE_LABEL.unfollow;
    return LIVE_LABEL.following;
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={handleFollowClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={cn(
            "min-w-20 text-xs font-semibold transition-colors",
            isFollowing && isHovering
              ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15"
              : isFollowing
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "bg-brand text-brand-foreground hover:bg-brand/90",
          )}
        >
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
