// 채널 구독자 관리 페이지를 렌더링합니다.
import { ChannelSubscribersPageContent } from "@/components/channel/subscription/channel-subscribers-page-content";
import { LoadFailedState } from "@/components/common/load-failed-state";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { ChannelSubscriberSort } from "@/utils/channel/channel-subscription";
import { getChannelSubscriptionSnapshot } from "@/utils/channel/channel-subscription-server";

interface Props {
  searchParams: Promise<{
    query?: string;
    sort?: string;
  }>;
}

const CHANNEL_SUBSCRIBER_SORT_VALUES = [
  "started_desc",
  "started_asc",
  "months_desc",
  "months_asc",
  "nickname_asc",
] as const satisfies readonly ChannelSubscriberSort[];

export default async function ChannelSubscribersPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = readQueryParam(params.query);
  const sort = readSortParam(params.sort);
  const result = await getChannelSubscriptionSnapshot({ query, sort });

  if (!result.success || !result.data) {
    return (
      <LoadFailedState
        code={result.code ?? APP_MESSAGE_CODE.error.channel.subscriptionLoadFailed}
      />
    );
  }

  return <ChannelSubscribersPageContent snapshot={result.data} query={query} sort={sort} />;
}

function readQueryParam(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function readSortParam(value: string | undefined): ChannelSubscriberSort {
  return CHANNEL_SUBSCRIBER_SORT_VALUES.includes(value as ChannelSubscriberSort)
    ? (value as ChannelSubscriberSort)
    : "started_desc";
}
