"use client";
// 쇼츠 캐러셀 상태 — 같은 채널의 ready 클립 목록에서 이전(더 최신)/다음(더 과거)을
// 탐색하고, URL은 history.replaceState로 동기화합니다(서버 리렌더·히스토리 오염 없음).

import { useCallback, useEffect, useRef, useState } from "react";
import { incrementLiveClipViewCountAction } from "@/actions/clip/clip";
import { CLIP_SHORTS_LIST_LIMIT } from "@/constants/clip/clip";
import { useChannelClips } from "@/hooks/clip/use-channel-clips";
import type { LiveClip } from "@/types/clip/clip";

// 1 = 다음(아래에서 올라옴), -1 = 이전(위에서 내려옴). Motion 슬라이드 방향에 쓴다.
export type ClipShortsDirection = 1 | -1;

export function useClipShorts(initialClip: LiveClip) {
  const [currentClip, setCurrentClip] = useState(initialClip);
  const [direction, setDirection] = useState<ClipShortsDirection>(1);

  // 캐러셀 순서 = 최신순 고정(목록 진입 정렬과 무관하게 일관된 탐색 경험).
  const { clips } = useChannelClips(initialClip.creatorId, {
    sort: "recent",
    period: "all",
    limit: CLIP_SHORTS_LIST_LIMIT,
  });

  // 목록 로딩 전이나 목록에 없는 클립(직링크 경합 등)이면 탐색만 비활성화된다.
  const currentIndex = clips.findIndex((clip) => clip.id === currentClip.id);
  const prevClip = currentIndex > 0 ? clips[currentIndex - 1] : null;
  const nextClip =
    currentIndex >= 0 && currentIndex < clips.length - 1 ? clips[currentIndex + 1] : null;

  const navigate = useCallback((target: LiveClip | null, nextDirection: ClipShortsDirection) => {
    if (!target) return;
    setDirection(nextDirection);
    setCurrentClip(target);
    // replace: 위/아래 탐색이 뒤로가기 스택을 오염시키지 않는다(뒤로가기 = 진입 전 페이지).
    // replaceState는 문서 제목을 갱신하지 않으므로 탭 제목도 직접 맞춘다.
    window.history.replaceState(null, "", `/clip/${target.id}`);
    document.title = `${target.title} | PixelPlay`;
  }, []);

  const goPrev = useCallback(() => navigate(prevClip, -1), [navigate, prevClip]);
  const goNext = useCallback(() => navigate(nextClip, 1), [navigate, nextClip]);

  // 조회수: 세션 내 클립당 1회만 증가(fire-and-forget, 위/아래로 되돌아와도 중복 없음).
  const countedClipIdsRef = useRef(new Set<string>());
  useEffect(() => {
    if (countedClipIdsRef.current.has(currentClip.id)) return;
    countedClipIdsRef.current.add(currentClip.id);
    void incrementLiveClipViewCountAction(currentClip.id).catch(() => {});
  }, [currentClip.id]);

  return {
    currentClip,
    direction,
    prevClip,
    nextClip,
    goPrev,
    goNext,
  };
}
