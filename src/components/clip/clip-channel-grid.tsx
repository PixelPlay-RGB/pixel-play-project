"use client";
// 채널 클립 탭 본문 — 기간 필터(전체/24시간/7일/30일) + 정렬(인기순 기본/최신순) 툴바와
// 세로 카드 그리드, 더보기 페이지네이션을 렌더링합니다.

import { useState } from "react";

import { ClipCard } from "@/components/clip/clip-card";
import { ClipPillGroup } from "@/components/clip/clip-pill-group";
import LoadMoreButton from "@/components/common/load-more-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CLIP_CHANNEL_PAGE_SIZE,
  CLIP_LABEL,
  CLIP_PERIOD_OPTIONS,
  CLIP_SORT_OPTIONS,
} from "@/constants/clip/clip";
import { useChannelClips } from "@/hooks/clip/use-channel-clips";
import type { ClipPeriod, ClipSort } from "@/types/clip/clip";

interface Props {
  creatorId: string;
}

const GRID_CLASS = "grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export function ClipChannelGrid({ creatorId }: Props) {
  const [sort, setSort] = useState<ClipSort>("popular");
  const [period, setPeriod] = useState<ClipPeriod>("all");
  const [visibleCount, setVisibleCount] = useState(CLIP_CHANNEL_PAGE_SIZE);

  // +1개를 더 받아 다음 페이지 존재 여부를 판정한다(보여주는 건 visibleCount까지).
  const { clips, isLoading } = useChannelClips(creatorId, {
    sort,
    period,
    limit: visibleCount + 1,
  });

  const visibleClips = clips.slice(0, visibleCount);
  const hasMore = clips.length > visibleCount;

  function changeFilter(next: { sort?: ClipSort; period?: ClipPeriod }) {
    // 필터가 바뀌면 첫 페이지부터 다시 본다.
    if (next.sort) setSort(next.sort);
    if (next.period) setPeriod(next.period);
    setVisibleCount(CLIP_CHANNEL_PAGE_SIZE);
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ClipPillGroup
          options={CLIP_PERIOD_OPTIONS}
          value={period}
          onChange={(value) => changeFilter({ period: value })}
          ariaLabel="클립 기간 필터"
        />
        <ClipPillGroup
          options={CLIP_SORT_OPTIONS}
          value={sort}
          onChange={(value) => changeFilter({ sort: value })}
          ariaLabel="클립 정렬"
        />
      </div>

      {isLoading ? (
        <div className={GRID_CLASS}>
          {Array.from({ length: CLIP_CHANNEL_PAGE_SIZE }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="aspect-[9/16] w-full rounded-lg" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          ))}
        </div>
      ) : visibleClips.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          {period === "all" ? CLIP_LABEL.empty : CLIP_LABEL.emptyPeriod}
        </p>
      ) : (
        <>
          <div className={GRID_CLASS}>
            {visibleClips.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                sizes="(min-width: 1280px) 18vw, (min-width: 640px) 30vw, 45vw"
              />
            ))}
          </div>

          {hasMore ? (
            <LoadMoreButton
              isLoading={false}
              onClick={() => setVisibleCount((count) => count + CLIP_CHANNEL_PAGE_SIZE)}
              label={CLIP_LABEL.showMore}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
