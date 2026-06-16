"use client";
// 크리에이터 팔로우/언팔로우와 구독, 공유 버튼을 담당하는 액션 영역입니다.

import { useEffect, useState } from "react";
import { Share2, Star } from "lucide-react";
import CreatorUnfollowDialog from "@/components/creator/creator-unfollow-dialog";
import CreatorFollowingButton from "@/components/following/creator-following-button";
import { LiveSubscribeDialog } from "@/components/live/view/live-subscribe-dialog";
import { Button } from "@/components/ui/button";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import type { LiveCreator, LiveSubscriptionEmote } from "@/types/live/live";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

interface Props {
  creator: LiveCreator;
  isFollowing: boolean;
  isSubscribed: boolean;
  isPending: boolean;
  isSubscribePending: boolean;
  subscriptionBadgeCustomMonths: number[];
  subscriptionBadgeVersion: string | null;
  subscriptionBadgeImageSources: Record<number, string>;
  subscriptionEmotes: LiveSubscriptionEmote[];
  onFollow: () => void;
  onSubscribe: () => void;
}

export function LiveCreatorActions({
  creator,
  isFollowing,
  isSubscribed,
  isPending,
  isSubscribePending,
  subscriptionBadgeCustomMonths,
  subscriptionBadgeVersion,
  subscriptionBadgeImageSources,
  subscriptionEmotes,
  onFollow,
  onSubscribe,
}: Props) {
  const [isUnfollowDialogOpen, setIsUnfollowDialogOpen] = useState(false);
  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);
  const subscribeLabel = isSubscribed ? LIVE_LABEL.subscribed : LIVE_LABEL.subscribe;

  useEffect(() => {
    if (isSubscribed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSubscribeDialogOpen(false);
    }
  }, [isSubscribed]);

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
        <LiveSubscribeDialog
          open={isSubscribeDialogOpen}
          trigger={
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
              aria-label={`${creator.name} ${subscribeLabel}`}
            >
              <Star className={cn("size-3.5", isSubscribed && "fill-current")} />
              {subscribeLabel}
            </Button>
          }
          creator={creator}
          isSubscribed={isSubscribed}
          isPending={isSubscribePending}
          subscriptionBadgeCustomMonths={subscriptionBadgeCustomMonths}
          subscriptionBadgeVersion={subscriptionBadgeVersion}
          subscriptionBadgeImageSources={subscriptionBadgeImageSources}
          subscriptionEmotes={subscriptionEmotes}
          onOpenChange={setIsSubscribeDialogOpen}
          onConfirm={onSubscribe}
        />

        <CreatorFollowingButton
          creatorNickname={creator.name}
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
          className="h-8 gap-1.5 rounded-full text-xs font-semibold"
        >
          <Share2 className="size-4" />
        </Button>
      </div>

      <CreatorUnfollowDialog
        open={isUnfollowDialogOpen}
        onOpenChange={setIsUnfollowDialogOpen}
        creatorNickname={creator.name}
        isPending={isPending}
        onConfirm={handleConfirmUnfollow}
      />
    </>
  );
}
