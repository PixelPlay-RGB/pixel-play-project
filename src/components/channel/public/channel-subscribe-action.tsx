"use client";
// 공개 채널 헤더의 구독 버튼과 구독 관련 다이얼로그를 렌더링합니다.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";

import { WalletChargeDialog } from "@/components/donations/wallet-charge-card";
import { LiveSubscribeDialog } from "@/components/live/view/live-subscribe-dialog";
import { LiveSubscriptionCancelDialog } from "@/components/live/view/live-subscription-cancel-dialog";
import { LiveSubscriptionInsufficientBalanceDialog } from "@/components/live/view/live-subscription-insufficient-balance-dialog";
import { Button } from "@/components/ui/button";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { LIVE_LABEL } from "@/constants/live/live";
import { useUserWalletBalance } from "@/hooks/donations/use-user-wallet-balance";
import { useLiveSubscribeAction } from "@/hooks/live/use-live-subscribe-action";
import { useMoveToLogin } from "@/hooks/live/use-move-to-login";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import type { ChannelProfile } from "@/types/channel/channel";
import type { CreatorSubscriptionActionResult, CreatorSubscriptionStatus } from "@/types/live/live";
import {
  canStartCreatorSubscription,
  getLiveSubscriptionButtonAction,
} from "@/utils/subscriptions/user-subscription-status";

interface Props {
  profile: ChannelProfile;
  className?: string;
}

export function ChannelSubscribeAction({ profile, className }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const moveToLogin = useMoveToLogin();
  const user = useAuthStore((state) => state.user);
  const [isSubscribed, setIsSubscribed] = useState(profile.subscription.isSubscribed);
  const [subscriptionStatus, setSubscriptionStatus] = useState<CreatorSubscriptionStatus | null>(
    profile.subscription.status,
  );
  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);
  const [isCancelSubscriptionDialogOpen, setIsCancelSubscriptionDialogOpen] = useState(false);
  const [isWalletChargeDialogOpen, setIsWalletChargeDialogOpen] = useState(false);
  const {
    walletBalance,
    isLoading: isWalletLoading,
    isError: isWalletError,
  } = useUserWalletBalance(user?.id);
  const canSubscribe = canStartCreatorSubscription({
    isSubscribed,
    status: subscriptionStatus,
  });

  const {
    handleSubscribe,
    handleCancelSubscription,
    isSubscribePending,
    isInsufficientBalanceDialogOpen,
    setIsInsufficientBalanceDialogOpen,
  } = useLiveSubscribeAction({
    creatorId: profile.id,
    isSubscribed,
    subscriptionStatus,
    isLoggedIn: Boolean(user?.id),
    onSubscribed: handleSubscribed,
    onSubscriptionCanceled: handleSubscriptionCanceled,
    onUnauthenticated: moveToLogin,
  });

  const subscriptionButtonAction = getLiveSubscriptionButtonAction({
    isSubscribed,
    status: subscriptionStatus,
    isPending: isSubscribePending,
  });
  const isSubscriptionButtonDisabled = subscriptionButtonAction === "disabled";
  const isRenewalCanceled = isSubscribed && subscriptionStatus === "canceled";
  const subscribeLabel = isRenewalCanceled
    ? LIVE_LABEL.subscribe
    : isSubscribed
      ? LIVE_LABEL.subscribed
      : LIVE_LABEL.subscribe;
  const creator = {
    id: profile.id,
    name: profile.nickname,
    avatarUrl: profile.photoUrl,
    followerCount: profile.followerCount,
    broadcastCount: 0,
  };
  const buttonClassName = cn(
    "h-9 shrink-0 rounded-full px-4 text-sm font-black transition-all active:scale-95",
    className,
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSubscribed(profile.subscription.isSubscribed);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubscriptionStatus(profile.subscription.status);
  }, [profile.subscription.isSubscribed, profile.subscription.status]);

  useEffect(() => {
    if (isSubscribed && !isRenewalCanceled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSubscribeDialogOpen(false);
    }
  }, [isRenewalCanceled, isSubscribed]);

  useEffect(() => {
    if (isInsufficientBalanceDialogOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSubscribeDialogOpen(false);
    }
  }, [isInsufficientBalanceDialogOpen]);

  function handleSubscribed(result: CreatorSubscriptionActionResult) {
    setIsSubscribed(result.isSubscribed);
    setSubscriptionStatus(result.status);
    void queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.donations.walletBalance(user?.id),
    });
    router.refresh();
  }

  function handleSubscriptionCanceled() {
    setIsSubscribed(true);
    setSubscriptionStatus("canceled");
    router.refresh();
  }

  function handleConfirmCancelSubscription() {
    setIsCancelSubscriptionDialogOpen(false);
    void handleCancelSubscription();
  }

  function handleOpenWalletChargeDialog() {
    setIsInsufficientBalanceDialogOpen(false);
    setIsSubscribeDialogOpen(false);

    if (!user?.id) {
      moveToLogin();
      return;
    }

    setIsWalletChargeDialogOpen(true);
  }

  return (
    <>
      {subscriptionButtonAction === "open_cancel_dialog" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            buttonClassName,
            "border-live/30 bg-live/10 text-live hover:border-live/40 hover:bg-live/15",
          )}
          disabled={isSubscriptionButtonDisabled}
          aria-label={`${profile.nickname} ${subscribeLabel}`}
          onClick={() => setIsCancelSubscriptionDialogOpen(true)}
        >
          <Star className="size-3.5 fill-current" />
          {subscribeLabel}
        </Button>
      ) : (
        <LiveSubscribeDialog
          open={isSubscribeDialogOpen}
          trigger={
            <Button
              type="button"
              size="sm"
              variant={isSubscribed && !isRenewalCanceled ? "outline" : "default"}
              className={cn(
                buttonClassName,
                isSubscribed && !isRenewalCanceled
                  ? "border-live/30 bg-live/10 text-live hover:border-live/40 hover:bg-live/15"
                  : "bg-live hover:bg-live/85 shadow-live/25 text-live-foreground shadow-sm hover:shadow-md",
              )}
              disabled={isSubscriptionButtonDisabled}
              aria-label={`${profile.nickname} ${subscribeLabel}`}
              onClick={(event) => {
                (
                  event as typeof event & {
                    preventBaseUIHandler?: () => void;
                  }
                ).preventBaseUIHandler?.();
                setIsSubscribeDialogOpen(true);
              }}
            >
              <Star
                className={cn("size-3.5", isSubscribed && !isRenewalCanceled && "fill-current")}
              />
              {subscribeLabel}
            </Button>
          }
          creator={creator}
          isSubscribed={isSubscribed}
          canSubscribe={canSubscribe}
          isRenewalCanceled={isRenewalCanceled}
          isPending={isSubscribePending}
          walletBalance={walletBalance}
          isWalletLoading={isWalletLoading}
          isWalletError={isWalletError}
          subscriptionBadgeCustomMonths={profile.subscription.customMonths}
          subscriptionBadgeVersion={profile.subscription.version}
          subscriptionBadgeImageSources={profile.subscription.imageSourcesByMonth}
          onOpenChange={setIsSubscribeDialogOpen}
          onConfirm={handleSubscribe}
        />
      )}

      <LiveSubscriptionCancelDialog
        open={isCancelSubscriptionDialogOpen}
        onOpenChange={setIsCancelSubscriptionDialogOpen}
        creatorNickname={profile.nickname}
        isPending={isSubscribePending}
        onConfirm={handleConfirmCancelSubscription}
      />
      <LiveSubscriptionInsufficientBalanceDialog
        open={isInsufficientBalanceDialogOpen}
        onOpenChange={setIsInsufficientBalanceDialogOpen}
        creatorNickname={profile.nickname}
        onConfirm={handleOpenWalletChargeDialog}
      />
      {user?.id ? (
        <WalletChargeDialog
          customerKey={user.id}
          open={isWalletChargeDialogOpen}
          onOpenChange={setIsWalletChargeDialogOpen}
          trigger={null}
        />
      ) : null}
    </>
  );
}
