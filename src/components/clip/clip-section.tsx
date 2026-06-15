"use client";
// 시청 페이지 "이 채널의 클립" 섹션 — 1줄로 시작해 더보기마다 1줄씩(최대 4줄) 펼치고,
// 4줄에 도달하면 더보기 버튼이 채널 클립 탭 "전체보기" 링크로 바뀐다. 클립이 없으면 숨긴다.

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCw } from "lucide-react";

import { ClipCard } from "@/components/clip/clip-card";
import { ClipSortSelect } from "@/components/clip/clip-sort-select";
import LoadMoreButton from "@/components/common/load-more-button";
import { Button } from "@/components/ui/button";
import { CLIP_LABEL, CLIP_SECTION_MAX_ROWS, CLIP_SECTION_ROW_SIZE } from "@/constants/clip/clip";
import { useChannelClips } from "@/hooks/clip/use-channel-clips";
import { cn } from "@/lib/utils";
import type { ClipSort } from "@/types/clip/clip";

interface Props {
  creatorId: string;
  className?: string;
}

export function ClipSection({ creatorId, className }: Props) {
  const [sort, setSort] = useState<ClipSort>("popular");
  const [visibleRows, setVisibleRows] = useState(1);

  // 4줄 분량을 한 번에 받아 줄 단위로 잘라 보여준다(더보기는 네트워크 없이 즉시 펼침).
  const { clips, isLoading, isRefetching, refetch } = useChannelClips(creatorId, {
    sort,
    period: "all",
    limit: CLIP_SECTION_ROW_SIZE * CLIP_SECTION_MAX_ROWS,
  });

  // 클립이 하나도 없는 채널은 섹션 자체를 보여주지 않는다(로딩 중 깜빡임 방지 포함).
  if (isLoading || clips.length === 0) {
    return null;
  }

  const visibleClips = clips.slice(0, visibleRows * CLIP_SECTION_ROW_SIZE);
  const hasMoreRows = visibleRows < CLIP_SECTION_MAX_ROWS && clips.length > visibleClips.length;
  const showViewAll = !hasMoreRows && clips.length > CLIP_SECTION_ROW_SIZE;

  return (
    <section className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-foreground text-base font-semibold">{CLIP_LABEL.sectionTitle}</h2>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={CLIP_LABEL.refresh}
            className="text-muted-foreground hover:text-foreground size-8 cursor-pointer"
            onClick={() => void refetch()}
          >
            <RotateCw className={cn("size-4", isRefetching && "animate-spin")} />
          </Button>
        </div>
        <ClipSortSelect value={sort} onChange={setSort} />
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
        {visibleClips.map((clip) => (
          <ClipCard key={clip.id} clip={clip} />
        ))}
      </div>

      {hasMoreRows ? (
        <LoadMoreButton
          isLoading={false}
          onClick={() => setVisibleRows((rows) => rows + 1)}
          label={CLIP_LABEL.showMore}
        />
      ) : showViewAll ? (
        <div className="flex justify-center pt-1">
          <Button
            variant="secondary"
            className="cursor-pointer rounded-full"
            nativeButton={false}
            render={<Link href={`/channel/${creatorId}/clip`} prefetch={false} />}
          >
            {CLIP_LABEL.viewAll}
            <ArrowRight aria-hidden />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
