"use client";
// 채널 구독 혜택 설정 화면을 렌더링합니다.

import { ChannelSubscriptionPerkSettings } from "@/components/channel/subscription/channel-subscription-perk-settings";
import { SettingsPage } from "@/components/common/settings-page";
import type { ChannelSubscriptionSnapshot } from "@/utils/channel/channel-subscription";

interface Props {
  snapshot: ChannelSubscriptionSnapshot;
}

export function ChannelSubscriptionBenefitsPageContent({ snapshot }: Props) {
  return (
    <SettingsPage
      kicker="구독 혜택"
      title="구독 혜택을 관리해요"
      description="구독자에게 표시되는 구독뱃지와 구독자 전용 이모티콘을 한 곳에서 관리해요."
    >
      <ChannelSubscriptionPerkSettings
        creatorId={snapshot.creatorId}
        customMonths={snapshot.customBadgeMonths}
        subscriptionBadgeVersion={snapshot.subscriptionBadgeVersion}
        subscriptionBadgeImageSources={snapshot.subscriptionBadgeImageSources}
      />
    </SettingsPage>
  );
}
