"use client";
// 라이브 비디오 플레이어 — MediaMTX HLS <video>에 컨테이너 전체화면/극장 모드와 하단 컨트롤 바를 조립합니다.

import type { Ref } from "react";
import { Play, Radio, Users, Volume2 } from "lucide-react";

import { LivePlayerControlBar } from "@/components/live/view/live-player-control-bar";
import { Button } from "@/components/ui/button";
import { getChannelLiveHlsUrl } from "@/constants/channel/channel-live-media";
import { LIVE_LABEL } from "@/constants/live/live";
import { useFullscreen } from "@/hooks/live/use-fullscreen";
import { useHlsPlayer } from "@/hooks/live/use-hls-player";
import { useLivePlayerControls } from "@/hooks/live/use-live-player-controls";
import { cn } from "@/lib/utils";
import { formatCount } from "@/utils/live/live-chat";
import type { LiveBroadcast } from "@/types/live/live";

// MVP는 단일 공유 path(mystream)라 모든 시청 화면이 같은 재생 URL을 쓴다(크리에이터별 path는 후속).
const LIVE_HLS_SRC = getChannelLiveHlsUrl();

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
    src: LIVE_HLS_SRC,
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
          : "aspect-video rounded-xl",
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 size-full bg-black object-contain"
      />

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

      {!isPlaying ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/20">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={LIVE_LABEL.playerPlay}
            onClick={togglePlay}
            className={cn(
              "pointer-events-auto size-16 rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-sm sm:size-20",
              "hover:bg-white/25 hover:text-white",
            )}
          >
            <Play className="size-7 fill-white sm:size-9" />
          </Button>
        </div>
      ) : muted ? (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={toggleMute}
            className="pointer-events-auto gap-2 rounded-full bg-black/60 text-white hover:bg-black/70 hover:text-white"
          >
            <Volume2 className="size-4" />
            {LIVE_LABEL.playerUnmuteHint}
          </Button>
        </div>
      ) : null}

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
          qualityLevels={levels}
          selectedQualityLevel={selectedLevel}
          onSelectQualityLevel={setLevel}
        />
      </div>
    </div>
  );
}
