// 크리에이터 본인 채널 설정 페이지(준비중). 채널 주인만 접근할 수 있습니다.
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PlaceholderPage from "@/components/common/placeholder-page";
import { getChannelProfile } from "@/utils/channel/channel-server";

export const metadata: Metadata = {
  title: "채널 설정",
};

export default async function ChannelSettingPage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;
  const result = await getChannelProfile(creatorId);

  // 본인 채널이 아니면 접근 불가.
  if (!result.success || !result.data || !result.data.isOwnChannel) {
    notFound();
  }

  return (
    <PlaceholderPage
      title="채널 설정"
      description="내 채널을 꾸미는 설정 기능을 준비 중이에요. 곧 만나보실 수 있어요."
      backHref={`/channel/${creatorId}`}
      backLabel="채널로 돌아가기"
    />
  );
}
