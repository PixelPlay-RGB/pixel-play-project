// 커뮤니티 게시글 상세 페이지입니다.
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CommunityPostDetailView from "@/components/community/community-post-detail-view";
import type { CommunityCommentsResult } from "@/types/community/community";
import { resolveViewerId } from "@/utils/auth/viewer";
import { getChannelProfile } from "@/utils/channel/channel-server";
import {
  getCommunityComments,
  getCommunityPostDetail,
  getCommunityPostNeighbors,
} from "@/utils/community/community-server";

const EMPTY_COMMENTS: CommunityCommentsResult = { bestComment: null, items: [], totalCount: 0 };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ creatorId: string; postId: string }>;
}): Promise<Metadata> {
  const { creatorId, postId } = await params;
  const [profileResult, postResult] = await Promise.all([
    getChannelProfile(creatorId),
    getCommunityPostDetail(postId),
  ]);

  const nickname = profileResult.success ? profileResult.data?.nickname : null;
  const content = postResult.success ? postResult.data?.content : null;

  if (!nickname || !content) {
    return { title: "커뮤니티" };
  }

  return {
    title: `${nickname} 채널 커뮤니티`,
    description: content.replace(/\s+/g, " ").slice(0, 80),
  };
}

export default async function CommunityPostDetailPage({
  params,
}: {
  params: Promise<{ creatorId: string; postId: string }>;
}) {
  const { creatorId, postId } = await params;

  const [viewerId, profileResult, postResult, commentsResult, neighbors] = await Promise.all([
    resolveViewerId(),
    getChannelProfile(creatorId),
    getCommunityPostDetail(postId),
    getCommunityComments(postId, 1),
    getCommunityPostNeighbors(postId),
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
      viewerId={viewerId}
      post={postResult.data}
      isChannelOwner={profileResult.data.isOwnChannel}
      initialComments={
        commentsResult.success && commentsResult.data ? commentsResult.data : EMPTY_COMMENTS
      }
      neighbors={neighbors}
    />
  );
}
