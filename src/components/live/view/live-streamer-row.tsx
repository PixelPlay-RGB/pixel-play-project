// 스트리머 정보 행(아바타·이름·팔로워 + 팔로우/공유). 라이브·방송 종료 양쪽에서 동일하게 쓴다.

import { LiveCreatorActions } from "@/components/live/view/live-creator-actions";
import { LiveCreatorInfo } from "@/components/live/view/live-creator-info";
import { cn } from "@/lib/utils";
import type { LiveCreator, LiveSubscriptionEmote } from "@/types/live/live";

interface Props {
  creator: LiveCreator;
  isLive: boolean;
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
  className?: string;
}

export function LiveStreamerRow({
  creator,
  isLive,
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
  className,
}: Props) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <LiveCreatorInfo creator={creator} isLive={isLive} />
      <LiveCreatorActions
        creator={creator}
        isFollowing={isFollowing}
        isSubscribed={isSubscribed}
        isPending={isPending}
        isSubscribePending={isSubscribePending}
        subscriptionBadgeCustomMonths={subscriptionBadgeCustomMonths}
        subscriptionBadgeVersion={subscriptionBadgeVersion}
        subscriptionBadgeImageSources={subscriptionBadgeImageSources}
        subscriptionEmotes={subscriptionEmotes}
        onFollow={onFollow}
        onSubscribe={onSubscribe}
      />
    </div>
  );
}
