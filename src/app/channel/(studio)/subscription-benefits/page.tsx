// 채널 구독 배지 관리 페이지를 렌더링합니다.
import { ChannelSubscriptionBenefitsPageContent } from "@/components/channel/subscription/channel-subscription-benefits-page-content";
import { LoadFailedState } from "@/components/common/load-failed-state";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { getChannelSubscriptionSnapshot } from "@/utils/channel/channel-subscription-server";

export default async function ChannelSubscriptionBenefitsPage() {
  const result = await getChannelSubscriptionSnapshot();

  if (!result.success || !result.data) {
    return (
      <LoadFailedState
        code={result.code ?? APP_MESSAGE_CODE.error.channel.subscriptionLoadFailed}
      />
    );
  }

  return <ChannelSubscriptionBenefitsPageContent snapshot={result.data} />;
}
