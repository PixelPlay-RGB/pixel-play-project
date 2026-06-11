"use client";
// 라이브 타임라인 시크바 — 라이브 버퍼(슬라이딩 윈도우 ≈60초) 안에서 현재 위치를 보여주고
// 드래그/클릭으로 이동한다. 오른쪽 끝 = 실시간 지점(유튜브 라이브식). 일시정지하면 현재
// 위치가 끝에서 점점 뒤로 밀리는 것이 보이고, 실시간 복귀는 컨트롤 바의 LIVE 버튼이 담당한다.

import { useState } from "react";

import { Slider } from "@/components/ui/slider";
import { LIVE_LABEL } from "@/constants/live/live";
import type { LiveTimelineSnapshot } from "@/hooks/live/use-hls-player";

interface Props {
  timeline: LiveTimelineSnapshot | null;
  // 실시간 시청 중이면 바를 끝까지 채워 그린다 — 라이브는 항상 실시간보다 2~4초 뒤를
  // 재생하므로 실제 위치로 그리면 끝까지 차지 않는 갭이 보인다(치지직·유튜브도 스냅 방식).
  isAtLiveEdge: boolean;
  onSeek: (time: number) => void;
}

export function LivePlayerTimeline({ timeline, isAtLiveEdge, onSeek }: Props) {
  // 드래그 중에는 폴링 갱신(1초)이 손잡이를 되돌리지 않게 드래그 값을 우선 표시한다.
  const [dragValue, setDragValue] = useState<number | null>(null);

  if (!timeline || timeline.end - timeline.start <= 0) return null;

  const currentValue =
    dragValue ??
    (isAtLiveEdge
      ? timeline.end
      : Math.min(Math.max(timeline.current, timeline.start), timeline.end));

  return (
    <Slider
      aria-label={LIVE_LABEL.playerTimeline}
      min={timeline.start}
      max={timeline.end}
      step={0.5}
      value={currentValue}
      onValueChange={(value) => setDragValue(value)}
      onValueCommitted={(value) => {
        setDragValue(null);
        onSeek(value);
      }}
      className="mb-1"
    />
  );
}
