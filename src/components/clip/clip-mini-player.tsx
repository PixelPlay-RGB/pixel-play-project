"use client";
// 클립 mp4 미니 플레이어 — 음소거 자동재생·반복·재생/일시정지·음량·진행바를 제공합니다.
// 음소거/음량은 캐러셀 이동 간에 유지되도록 부모(ClipShortsView)가 소유한다.

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CLIP_LABEL } from "@/constants/clip/clip";
import type { LiveClip } from "@/types/clip/clip";

interface Props {
  clip: LiveClip;
  muted: boolean;
  // 0~1 — video.volume과 동일 스케일.
  volume: number;
  onMutedChange: (muted: boolean) => void;
  onVolumeChange: (volume: number) => void;
}

export function ClipMiniPlayer({ clip, muted, volume, onMutedChange, onVolumeChange }: Props) {
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

      {/* 음소거 자동재생 안내 — 탭 한 번으로 소리를 켠다(autoplay 정책) */}
      {muted && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute top-3 left-1/2 -translate-x-1/2 cursor-pointer rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/70"
          onClick={() => onMutedChange(false)}
        >
          <VolumeX aria-hidden />
          {CLIP_LABEL.unmute}
        </Button>
      )}

      {/* 하단 컨트롤 — 진행바 + 재생/음량 */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-2.5">
        <Slider
          value={Math.min(progress, duration || clip.durationSeconds)}
          max={duration || clip.durationSeconds}
          step={0.1}
          onValueChange={seekTo}
          aria-label={CLIP_LABEL.play}
          className="cursor-pointer"
        />
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cursor-pointer text-white hover:bg-white/15 hover:text-white"
            aria-label={isPlaying ? CLIP_LABEL.pause : CLIP_LABEL.play}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cursor-pointer text-white hover:bg-white/15 hover:text-white"
            aria-label={CLIP_LABEL.volume}
            onClick={() => onMutedChange(!muted)}
          >
            {muted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
          </Button>
          <Slider
            value={muted ? 0 : volume}
            max={1}
            step={0.05}
            onValueChange={(next) => {
              onVolumeChange(next);
              onMutedChange(next === 0);
            }}
            aria-label={CLIP_LABEL.volume}
            className="hidden w-20 cursor-pointer sm:flex"
          />
        </div>
      </div>
    </div>
  );
}
