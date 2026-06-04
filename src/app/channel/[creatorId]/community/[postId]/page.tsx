// 커뮤니티 게시글 상세 페이지입니다.
import { notFound } from "next/navigation";

import CommunityPostDetailView from "@/components/community/community-post-detail-view";
import type { CommunityCommentsResult } from "@/types/community/community";
import { getChannelProfile } from "@/utils/channel/channel-server";
import { getCommunityComments, getCommunityPostDetail } from "@/utils/community/community-server";

const EMPTY_COMMENTS: CommunityCommentsResult = { bestComment: null, items: [], totalCount: 0 };

export default async function CommunityPostDetailPage({
  params,
}: {
  params: Promise<{ creatorId: string; postId: string }>;
}) {
  const { creatorId, postId } = await params;

  const [profileResult, postResult, commentsResult] = await Promise.all([
    getChannelProfile(creatorId),
    getCommunityPostDetail(postId),
    getCommunityComments(postId, 1),
  ]);

  if (
    !profileResult.success ||
    !profileResult.data ||
    !postResult.success ||
    !postResult.data ||
    // 다른 채널의 글로 접근하는 경우 차단
    postResult.data.creatorId !== creatorId
  ) {
    notFound();
  }

  return (
    <CommunityPostDetailView
      creatorId={creatorId}
      post={postResult.data}
      isChannelOwner={profileResult.data.isOwnChannel}
      initialComments={
        commentsResult.success && commentsResult.data ? commentsResult.data : EMPTY_COMMENTS
      }
    />
  );
}
