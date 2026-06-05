"use client";
// 라이브 비디오 플레이어 — 컨테이너 전체화면/극장 모드와 하단 컨트롤 바를 조립합니다.

import Hls from "hls.js";
import { useEffect, type Ref } from "react";
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
  hlsSrc: string | null;
  elapsedText: string;
  isChatCollapsed?: boolean;
  isTheater?: boolean;
  onToggleTheater?: () => void;
  openChatButtonRef?: Ref<HTMLButtonElement>;
  onOpenChat?: () => void;
}

const HLS_RETRY_DELAY_MS = 2000;
const EXPECTED_AUTO_PLAY_ERROR_NAMES = new Set([
  "AbortError",
  "NotAllowedError",
  "NotSupportedError",
]);

function isExpectedAutoPlayError(error: unknown) {
  return error instanceof DOMException && EXPECTED_AUTO_PLAY_ERROR_NAMES.has(error.name);
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
    handleVideoPlay,
    handleVideoPause,
  } = useLivePlayerControls();

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !hlsSrc) return;

    const playVideo = () => {
      void video.play().catch((error) => {
        if (isExpectedAutoPlayError(error)) return;
        console.warn("라이브 영상 자동 재생 실패", error);
      });
    };

    const playWhenReady = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        playVideo();
        return;
      }

      video.addEventListener("loadedmetadata", playVideo, { once: true });
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      let retryTimeout: ReturnType<typeof setTimeout> | null = null;

      const retryLoad = () => {
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(() => {
          video.load();
          playWhenReady();
        }, HLS_RETRY_DELAY_MS);
      };

      video.src = hlsSrc;
      video.addEventListener("error", retryLoad);
      video.load();
      playWhenReady();

      return () => {
        if (retryTimeout) clearTimeout(retryTimeout);
        video.removeEventListener("error", retryLoad);
        video.removeEventListener("loadedmetadata", playVideo);
        video.removeAttribute("src");
        video.load();
      };
    }

    if (!Hls.isSupported()) return;

    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    const hls = new Hls({
      backBufferLength: 5,
      liveMaxLatencyDuration: 3,
      liveSyncDuration: 1,
      liveSyncMode: "edge",
      lowLatencyMode: true,
      maxBufferLength: 5,
      maxLiveSyncPlaybackRate: 1.2,
    });

    const retryLoad = () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      retryTimeout = setTimeout(() => {
        hls.startLoad(-1);
      }, HLS_RETRY_DELAY_MS);
    };

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        retryLoad();
        return;
      }

      if (data.fatal && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
      }
    });

    hls.on(Hls.Events.MANIFEST_PARSED, playWhenReady);
    hls.loadSource(hlsSrc);
    hls.attachMedia(video);

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      video.removeEventListener("loadedmetadata", playVideo);
      hls.destroy();
    };
  }, [hlsSrc, videoRef]);

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
      {hlsSrc ? (
        <video
          ref={videoRef}
          className="absolute inset-0 size-full bg-black object-contain"
          autoPlay
          muted={muted}
          playsInline
          title={broadcast.title}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
        />
      ) : null}

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

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
          hlsSrc && isPlaying && "pointer-events-none opacity-0",
        )}
      >
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
