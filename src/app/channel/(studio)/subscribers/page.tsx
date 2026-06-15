// 채널 구독자 관리 페이지를 렌더링합니다.
import { ChannelSubscribersPageContent } from "@/components/channel/subscription/channel-subscribers-page-content";
import { LoadFailedState } from "@/components/common/load-failed-state";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";

import { getChannelSubscriptionSnapshot } from "./_data/channel-subscription-data";

export default async function ChannelSubscribersPage() {
  const result = await getChannelSubscriptionSnapshot();

  if (!result.success || !result.data) {
    return (
      <LoadFailedState
        code={result.code ?? APP_MESSAGE_CODE.error.channel.subscriptionLoadFailed}
      />
    );
  }

  return <ChannelSubscribersPageContent snapshot={result.data} />;
}
