// 채널 홈의 커뮤니티 미리보기. 최신 12개를 한 줄 캐러셀(데스크톱 4개씩, 4개씩 이동)로 노출.
// 드래그 이동은 막고 좌/우 chevron 버튼으로만 넘긴다.
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
    <Carousel
      opts={{ align: "start", slidesToScroll: 4, watchDrag: false }}
      className="flex flex-col gap-4"
    >
      <Link
        href={communityHref}
        className="group/heading text-foreground inline-flex w-fit items-center gap-1 text-lg font-black"
      >
        커뮤니티
        <ChevronRight className="text-muted-foreground group-hover/heading:text-brand relative top-[1.5px] size-5 transition-all group-hover/heading:translate-x-0.5" />
      </Link>

      {posts.length > 0 && result ? (
        <div className="relative">
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
          <CarouselPrevious
            hideWhenDisabled
            className="bg-background/95 border-border/70 left-0 z-10 size-9 -translate-x-1/2 shadow-lg backdrop-blur"
          />
          <CarouselNext
            hideWhenDisabled
            className="bg-background/95 border-border/70 right-0 z-10 size-9 translate-x-1/2 shadow-lg backdrop-blur"
          />
        </div>
      ) : (
        <p className="text-muted-foreground border-border/60 bg-card/40 rounded-2xl border py-10 text-center text-sm font-semibold">
          아직 작성된 글이 없어요.
        </p>
      )}
    </Carousel>
  );
}
