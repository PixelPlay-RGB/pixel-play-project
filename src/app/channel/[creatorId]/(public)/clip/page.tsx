// 채널 클립 탭 페이지입니다.
import { notFound } from "next/navigation";

import { ClipChannelGrid } from "@/components/clip/clip-channel-grid";
import { getChannelProfile } from "@/utils/channel/channel-server";

export default async function ChannelClipPage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;

  const profileResult = await getChannelProfile(creatorId);

  if (!profileResult.success || !profileResult.data) {
    notFound();
  }

  return <ClipChannelGrid creatorId={creatorId} />;
}
