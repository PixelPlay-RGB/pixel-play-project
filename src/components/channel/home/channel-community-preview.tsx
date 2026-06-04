// 채널 홈의 커뮤니티 미리보기. 최신 6개 그리드 + "커뮤니티" 탭으로 전체보기.
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import CommunityPostCard from "@/components/community/community-post-card";
import type { CommunityPostsResult } from "@/types/community/community";

interface Props {
  creatorId: string;
  isOwner: boolean;
  result: CommunityPostsResult | null;
}

export function ChannelCommunityPreview({ creatorId, isOwner, result }: Props) {
  const posts = result?.items ?? [];
  const communityHref = `/channel/${creatorId}/community`;

  return (
    <section className="flex flex-col gap-4">
      <Link
        href={communityHref}
        className="group/heading text-foreground inline-flex w-fit items-center gap-1 text-lg font-black"
      >
        커뮤니티
        <ChevronRight className="text-muted-foreground group-hover/heading:text-brand size-5 transition-all group-hover/heading:translate-x-0.5" />
      </Link>

      {posts.length > 0 && result ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              creatorId={creatorId}
              creator={result.creator}
              post={post}
              isOwner={isOwner}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground border-border/60 bg-card/40 rounded-2xl border py-10 text-center text-sm font-semibold">
          아직 작성된 글이 없어요.
        </p>
      )}
    </section>
  );
}
