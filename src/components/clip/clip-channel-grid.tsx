"use client";
// 채널 클립 탭 본문 — 정렬 Select + 기간 세그먼트 필터 툴바, 세로 카드 그리드,
// 스크롤 sentinel 기반 무한 로딩, 브랜드 톤 빈 상태를 렌더링합니다.

import { useState } from "react";

import { ClipCard } from "@/components/clip/clip-card";
import { ClipEmptyState } from "@/components/clip/clip-empty-state";
import { ClipMoreMenu } from "@/components/clip/clip-more-menu";
import { ClipPillGroup } from "@/components/clip/clip-pill-group";
import { ClipSortSelect } from "@/components/clip/clip-sort-select";
import { Skeleton } from "@/components/ui/skeleton";
import { CLIP_CHANNEL_PAGE_SIZE, CLIP_LABEL, CLIP_PERIOD_OPTIONS } from "@/constants/clip/clip";
import { useChannelClips } from "@/hooks/clip/use-channel-clips";
import { useIntersectionObserver } from "@/hooks/common/use-intersection-observer";
import type { ClipPeriod, ClipSort } from "@/types/clip/clip";

interface Props {
  creatorId: string;
  // 로그인 뷰어 id — 카드 ⋮ 메뉴에서 삭제 권한(제작자/채널 주인) 판별용.
  viewerId: string | null;
}

const GRID_CLASS = "grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";
// 카드 우상단 ⋮ 트리거 — 썸네일 위 작은 코너 버튼.
const CARD_MENU_TRIGGER_CLASS =
  "flex size-7 cursor-pointer items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75";

export function ClipChannelGrid({ creatorId, viewerId }: Props) {
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

  // 스크롤이 sentinel에 닿으면 다음 페이지를 자동으로 펼친다(채널당 최대 30개 — 가벼운 재조회).
  const sentinelRef = useIntersectionObserver(() => {
    if (hasMore) setVisibleCount((count) => count + CLIP_CHANNEL_PAGE_SIZE);
  });

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
        <ClipSortSelect value={sort} onChange={(value) => changeFilter({ sort: value })} />
      </div>

      {isLoading ? (
        <div className={GRID_CLASS}>
          {Array.from({ length: CLIP_CHANNEL_PAGE_SIZE }, (_, index) => (
            <Skeleton key={index} className="aspect-[9/16] w-full rounded-lg" />
          ))}
        </div>
      ) : visibleClips.length === 0 ? (
        <ClipEmptyState
          title={period === "all" ? CLIP_LABEL.empty : CLIP_LABEL.emptyPeriod}
          description={
            period === "all"
              ? "라이브 방송에서 인상적인 순간을 클립으로 남겨보세요."
              : "다른 기간을 선택하면 더 많은 클립을 볼 수 있어요."
          }
        />
      ) : (
        <>
          <div className={GRID_CLASS}>
            {visibleClips.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                sizes="(min-width: 1280px) 15vw, (min-width: 640px) 24vw, 30vw"
                menu={
                  <ClipMoreMenu
                    clip={clip}
                    viewerId={viewerId}
                    side="bottom"
                    triggerClassName={CARD_MENU_TRIGGER_CLASS}
                    iconClassName="size-4"
                  />
                }
              />
            ))}
          </div>
          {hasMore ? <div ref={sentinelRef} className="h-8" aria-hidden /> : null}
        </>
      )}
    </div>
  );
}
