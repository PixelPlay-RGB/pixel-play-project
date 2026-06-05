// 크리에이터 본인 채널 관리 페이지(공개 프로필·채널 소개·홈 배너). 채널 주인만 접근.
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChannelSettingContent } from "@/components/channel/setting/channel-setting-content";
import { getChannelBanners } from "@/utils/channel/channel-extras-server";
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

  const [profileResult, banners] = await Promise.all([
    getChannelProfile(creatorId),
    getChannelBanners(creatorId),
  ]);

  // 본인 채널이 아니면 접근 불가.
  if (!profileResult.success || !profileResult.data || !profileResult.data.isOwnChannel) {
    notFound();
  }

  return <ChannelSettingContent profile={profileResult.data} banners={banners} />;
}
