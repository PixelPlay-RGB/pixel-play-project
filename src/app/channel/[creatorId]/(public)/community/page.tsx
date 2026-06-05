// 채널 커뮤니티 게시글 목록 페이지입니다.
import { notFound } from "next/navigation";

import CommunityBoard from "@/components/community/community-board";
import { getChannelProfile } from "@/utils/channel/channel-server";
import { getChannelCommunityPosts } from "@/utils/community/community-server";

export default async function CommunityListPage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;

  const [profileResult, postsResult] = await Promise.all([
    getChannelProfile(creatorId),
    getChannelCommunityPosts(creatorId, 1),
  ]);

  if (!profileResult.success || !profileResult.data || !postsResult.success || !postsResult.data) {
    notFound();
  }

  return (
    <CommunityBoard
      creatorId={creatorId}
      isOwner={profileResult.data.isOwnChannel}
      initialData={postsResult.data}
    />
  );
}
