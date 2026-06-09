"use client";
// 라이브 비디오 플레이어 — MediaMTX HLS <video>에 컨테이너 전체화면/극장 모드와 하단 컨트롤 바를 조립합니다.

import type { Ref } from "react";

import { LivePlayerControlBar } from "@/components/live/view/live-player-control-bar";
import { LIVE_LABEL } from "@/constants/live/live";
import { useFullscreen } from "@/hooks/live/use-fullscreen";
import { useHlsPlayer } from "@/hooks/live/use-hls-player";
import { useLivePlayerControls } from "@/hooks/live/use-live-player-controls";
import { cn } from "@/lib/utils";
import type { LiveBroadcast } from "@/types/live/live";

interface Props {
  broadcast: LiveBroadcast;
  // 크리에이터별 스트림키 path로 서버에서 계산한 재생 URL. 설정 미비 시 null.
  hlsSrc: string | null;
  elapsedText: string;
  isChatCollapsed?: boolean;
  isTheater?: boolean;
  onToggleTheater?: () => void;
  openChatButtonRef?: Ref<HTMLButtonElement>;
  onOpenChat?: () => void;
}

export function LiveVideoPlayer({
  broadcast,
  hlsSrc,
  elapsedText,
  isChatCollapsed = false,
  isTheater = false,
  onToggleTheater,
  openChatButtonRef,
  onOpenChat,
}: Props) {
  const { containerRef, isFullscreen, toggleFullscreen } = useFullscreen<HTMLDivElement>();
  const {
    videoRef,
    isPlaying,
    togglePlay,
    muted,
    volume,
    toggleMute,
    setVolume,
    controlsVisible,
    showControls,
    handlePointerLeave,
    handleFocus,
    handleBlur,
  } = useLivePlayerControls();
  const { levels, selectedLevel, setLevel } = useHlsPlayer({
    videoRef,
    src: hlsSrc ?? "",
    enabled: !!hlsSrc,
  });

  return (
    <div
      ref={containerRef}
      onMouseMove={showControls}
      onMouseLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        "relative w-full overflow-hidden bg-black",
        isTheater
          ? "aspect-video rounded-xl md:aspect-auto md:h-full md:rounded-none"
          : "aspect-video rounded-xl md:max-h-full",
      )}
    >
      {hlsSrc ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 size-full bg-black object-contain"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="text-sm text-white/70">{LIVE_LABEL.broadcastOffline}</p>
        </div>
      )}

      {hlsSrc ? (
        <div
          className={cn(
            "absolute right-0 bottom-0 left-0 z-10 bg-linear-to-t from-black/60 to-transparent px-4 pt-8 pb-4 transition-opacity duration-200",
            controlsVisible ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <LivePlayerControlBar
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            muted={muted}
            volume={volume}
            onToggleMute={toggleMute}
            onVolumeChange={setVolume}
            elapsedText={elapsedText}
            viewerCount={broadcast.viewerCount}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isTheater={isTheater}
            onToggleTheater={onToggleTheater}
            isChatCollapsed={isChatCollapsed}
            openChatButtonRef={openChatButtonRef}
            onOpenChat={onOpenChat}
            qualityLevels={levels}
            selectedQualityLevel={selectedLevel}
            onSelectQualityLevel={setLevel}
          />
        </div>
      ) : null}
    </div>
  );
}
