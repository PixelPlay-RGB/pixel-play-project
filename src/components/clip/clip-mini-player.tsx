"use client";
// 클립 mp4 미니 플레이어 — 음소거 자동재생·반복·진행바와, 일시정지 시 중앙 재생 아이콘
// (방송 시청 뷰와 동일한 관성)을 제공한다. 음소거/음량은 캐러셀 이동 간 유지되도록 부모
// (ClipShortsView)가 소유하며, 재생/음량 토글은 우측 레일에서 조작한다.

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { CLIP_LABEL } from "@/constants/clip/clip";
import type { LiveClip } from "@/types/clip/clip";

interface Props {
  clip: LiveClip;
  muted: boolean;
  // 0~1 — video.volume과 동일 스케일.
  volume: number;
}

export function ClipMiniPlayer({ clip, muted, volume }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // muted 속성만으로는 부족하다 — volume은 attribute가 없어 DOM 프로퍼티로 반영한다.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    video.volume = volume;
  }, [muted, volume]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => {
        // 자동재생 정책 거부 — 사용자가 다시 탭하면 재생된다.
      });
    } else {
      video.pause();
    }
  }

  function seekTo(next: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = next;
    setProgress(next);
  }

  return (
    <div className="relative h-full w-full">
      {/* 영상 탭 = 재생/일시정지(쇼츠 관성) */}
      <video
        ref={videoRef}
        src={clip.videoUrl ?? undefined}
        poster={clip.thumbnailUrl ?? undefined}
        className="h-full w-full cursor-pointer object-contain"
        autoPlay
        loop
        playsInline
        muted={muted}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      />

      {/* 일시정지 중에는 중앙에 큰 재생 아이콘을 띄운다(방송 시청 뷰와 동일) */}
      {!isPlaying ? (
        <button
          type="button"
          aria-label={CLIP_LABEL.play}
          className="absolute inset-0 z-10 m-auto flex size-20 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-opacity hover:bg-black/65"
          onClick={togglePlay}
        >
          <Play className="size-9 fill-current" aria-hidden />
        </button>
      ) : null}

      {/* 하단 진행바 — 시킹 전용(재생/음량은 우측 레일에서 조작) */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent px-3 pt-8 pb-2.5">
        <Slider
          value={Math.min(progress, duration || clip.durationSeconds)}
          max={duration || clip.durationSeconds}
          step={0.1}
          onValueChange={seekTo}
          aria-label={CLIP_LABEL.play}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
}
