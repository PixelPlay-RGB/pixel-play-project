// 커뮤니티 글 작성·수정 페이지(채널 주인 전용)입니다.
import { notFound, redirect } from "next/navigation";

import CommunityComposer from "@/components/community/community-composer";
import { getChannelProfile } from "@/utils/channel/channel-server";
import { getCommunityPostDetail } from "@/utils/community/community-server";

export default async function CommunityWritePage({
  params,
  searchParams,
}: {
  params: Promise<{ creatorId: string }>;
  searchParams: Promise<{ postId?: string }>;
}) {
  const { creatorId } = await params;
  const { postId } = await searchParams;

  const profileResult = await getChannelProfile(creatorId);

  if (!profileResult.success || !profileResult.data) {
    notFound();
  }

  // 글 작성·수정 권한은 채널 주인에게만 있습니다.
  if (!profileResult.data.isOwnChannel) {
    redirect(`/channel/${creatorId}/community`);
  }

  let initialContent = "";
  let initialImageUrl: string | null = null;

  if (postId) {
    const postResult = await getCommunityPostDetail(postId);

    if (!postResult.success || !postResult.data || postResult.data.creatorId !== creatorId) {
      notFound();
    }

    initialContent = postResult.data.content;
    initialImageUrl = postResult.data.imageUrl;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground text-lg font-black">{postId ? "글 수정" : "글쓰기"}</h1>
      <CommunityComposer
        creatorId={creatorId}
        postId={postId}
        initialContent={initialContent}
        initialImageUrl={initialImageUrl}
      />
    </div>
  );
}
