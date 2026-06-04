// 채널 홈의 커뮤니티 미리보기. 최신 12개를 한 줄 캐러셀(데스크톱 4개씩)로 노출, "커뮤니티" 탭으로 전체보기.
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import CommunityPostCard from "@/components/community/community-post-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
    <Carousel opts={{ align: "start" }} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={communityHref}
          className="group/heading text-foreground inline-flex w-fit items-center gap-1 text-lg font-black"
        >
          커뮤니티
          <ChevronRight className="text-muted-foreground group-hover/heading:text-brand size-5 transition-all group-hover/heading:translate-x-0.5" />
        </Link>
        {posts.length > 0 && (
          <div className="flex items-center gap-2">
            <CarouselPrevious className="static size-8 translate-x-0 translate-y-0" />
            <CarouselNext className="static size-8 translate-x-0 translate-y-0" />
          </div>
        )}
      </div>

      {posts.length > 0 && result ? (
        <CarouselContent className="-ml-3">
          {posts.map((post) => (
            <CarouselItem
              key={post.id}
              className="basis-full pl-3 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <CommunityPostCard
                creatorId={creatorId}
                creator={result.creator}
                post={post}
                isOwner={isOwner}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      ) : (
        <p className="text-muted-foreground border-border/60 bg-card/40 rounded-2xl border py-10 text-center text-sm font-semibold">
          아직 작성된 글이 없어요.
        </p>
      )}
    </Carousel>
  );
}
