"use client";
// 라이브 비디오 플레이어 — 컨테이너 전체화면/극장 모드와 하단 컨트롤 바를 조립합니다.
// 실제 스트림(<video>)은 아직 미연결 placeholder입니다.
// TODO(#73 머지 후): getChannelLiveHlsUrl + use-hls-player로 placeholder를 실제 <video>로 교체하고
// useLivePlayerControls의 videoRef에 바인딩한다.

import type { Ref } from "react";
import { Play, Radio, Users } from "lucide-react";

import { LivePlayerControlBar } from "@/components/live/view/live-player-control-bar";
import { LIVE_LABEL } from "@/constants/live/live";
import { useFullscreen } from "@/hooks/live/use-fullscreen";
import { useLivePlayerControls } from "@/hooks/live/use-live-player-controls";
import { cn } from "@/lib/utils";
import { formatCount } from "@/utils/live/live-chat";
import type { LiveBroadcast } from "@/types/live/live";

interface Props {
  broadcast: LiveBroadcast;
  elapsedText: string;
  isChatCollapsed?: boolean;
  isTheater?: boolean;
  onToggleTheater?: () => void;
  openChatButtonRef?: Ref<HTMLButtonElement>;
  onOpenChat?: () => void;
}

export function LiveVideoPlayer({
  broadcast,
  elapsedText,
  isChatCollapsed = false,
  isTheater = false,
  onToggleTheater,
  openChatButtonRef,
  onOpenChat,
}: Props) {
  const { containerRef, isFullscreen, toggleFullscreen } = useFullscreen<HTMLDivElement>();
  const {
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

  return (
    <div
      ref={containerRef}
      onMouseMove={showControls}
      onMouseLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        "relative w-full overflow-hidden bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900",
        isTheater
          ? "aspect-video rounded-xl md:aspect-auto md:h-full md:rounded-none"
          : "aspect-video rounded-xl",
      )}
    >
      <div className="absolute top-0 left-0 z-10 flex items-center gap-2 px-4 pt-4">
        <span className="bg-live flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white">
          <Radio className="size-3" />
          {LIVE_LABEL.live}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <Users className="size-3" />
          {formatCount(broadcast.viewerCount)}
        </span>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex size-16 items-center justify-center rounded-full border border-white/20 bg-white/15 backdrop-blur-sm sm:size-20">
          <Play className="size-7 fill-white text-white sm:size-9" />
        </div>
      </div>

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
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isTheater={isTheater}
          onToggleTheater={onToggleTheater}
          isChatCollapsed={isChatCollapsed}
          openChatButtonRef={openChatButtonRef}
          onOpenChat={onOpenChat}
        />
      </div>
    </div>
  );
}
