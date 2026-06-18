"use client";
// 채널 구독 배지 설정 화면을 렌더링합니다.

import { ChannelSubscriptionPerkSettings } from "@/components/channel/subscription/channel-subscription-perk-settings";
import { SettingsPage } from "@/components/common/settings-page";
import type { ChannelSubscriptionSnapshot } from "@/utils/channel/channel-subscription";

interface Props {
  snapshot: ChannelSubscriptionSnapshot;
}

export function ChannelSubscriptionBenefitsPageContent({ snapshot }: Props) {
  return (
    <SettingsPage
      kicker="배지"
      title="구독 배지를 관리해요"
      description="구독자에게 표시되는 구독 개월별 배지를 등록하고 채팅에서 보이는 모습을 확인해요."
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
