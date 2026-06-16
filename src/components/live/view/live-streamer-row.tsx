// 스트리머 정보 행(아바타·이름·팔로워 + 팔로우/공유). 라이브·방송 종료 양쪽에서 동일하게 쓴다.

import { LiveCreatorActions } from "@/components/live/view/live-creator-actions";
import { LiveCreatorInfo } from "@/components/live/view/live-creator-info";
import { cn } from "@/lib/utils";
import type { CreatorSubscriptionStatus, LiveCreator } from "@/types/live/live";

interface Props {
  creator: LiveCreator;
  isLive: boolean;
  isFollowing: boolean;
  isSubscribed: boolean;
  subscriptionStatus: CreatorSubscriptionStatus | null;
  isPending: boolean;
  isSubscribePending: boolean;
  isInsufficientBalanceDialogOpen: boolean;
  walletChargeCustomerKey: string | null;
  walletBalance: number;
  isWalletLoading: boolean;
  isWalletError: boolean;
  subscriptionBadgeCustomMonths: number[];
  subscriptionBadgeVersion: string | null;
  subscriptionBadgeImageSources: Record<number, string>;
  onFollow: () => void;
  onSubscribe: () => void;
  onCancelSubscription: () => void;
  onInsufficientBalanceDialogOpenChange: (open: boolean) => void;
  className?: string;
}

export function LiveStreamerRow({
  creator,
  isLive,
  isFollowing,
  isSubscribed,
  subscriptionStatus,
  isPending,
  isSubscribePending,
  isInsufficientBalanceDialogOpen,
  walletChargeCustomerKey,
  walletBalance,
  isWalletLoading,
  isWalletError,
  subscriptionBadgeCustomMonths,
  subscriptionBadgeVersion,
  subscriptionBadgeImageSources,
  onFollow,
  onSubscribe,
  onCancelSubscription,
  onInsufficientBalanceDialogOpenChange,
  className,
}: Props) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <LiveCreatorInfo creator={creator} isLive={isLive} />
      <LiveCreatorActions
        creator={creator}
        isFollowing={isFollowing}
        isSubscribed={isSubscribed}
        subscriptionStatus={subscriptionStatus}
        isPending={isPending}
        isSubscribePending={isSubscribePending}
        isInsufficientBalanceDialogOpen={isInsufficientBalanceDialogOpen}
        walletChargeCustomerKey={walletChargeCustomerKey}
        walletBalance={walletBalance}
        isWalletLoading={isWalletLoading}
        isWalletError={isWalletError}
        subscriptionBadgeCustomMonths={subscriptionBadgeCustomMonths}
        subscriptionBadgeVersion={subscriptionBadgeVersion}
        subscriptionBadgeImageSources={subscriptionBadgeImageSources}
        onFollow={onFollow}
        onSubscribe={onSubscribe}
        onCancelSubscription={onCancelSubscription}
        onInsufficientBalanceDialogOpenChange={onInsufficientBalanceDialogOpenChange}
      />
    </div>
  );
}
