// 채널 클립 탭 페이지입니다.
import { notFound } from "next/navigation";

import { ClipChannelGrid } from "@/components/clip/clip-channel-grid";
import { getChannelProfile } from "@/utils/channel/channel-server";
import { resolveViewerId } from "@/utils/auth/viewer";

export default async function ChannelClipPage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;

  // 카드 ⋮ 메뉴 삭제 권한 판별용으로 뷰어 id도 함께 가져온다.
  const [profileResult, viewerId] = await Promise.all([
    getChannelProfile(creatorId),
    resolveViewerId(),
  ]);

  if (!profileResult.success || !profileResult.data) {
    notFound();
  }

  return <ClipChannelGrid creatorId={creatorId} viewerId={viewerId} />;
}
